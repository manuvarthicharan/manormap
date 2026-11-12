import { Property } from '../types';

export interface AppNotification {
  id: string;
  type: 'nearby_property' | 'price_change' | 'market_trend';
  title: string;
  message: string;
  timestamp: string; // ISO date string
  read: boolean;
  propertyId?: string;
  coordinates?: [number, number]; // [lng, lat]
  priceChange?: {
    oldPrice: number;
    newPrice: number;
    difference: number;
  };
}

const NOTIFICATIONS_STORAGE_KEY = 'manormap_user_notifications';
const PRICE_TRACKER_STORAGE_KEY = 'manormap_liked_property_prices';

/**
 * Calculate distance between two [lng, lat] points in km
 */
function getDistanceKm(coord1: [number, number], coord2: [number, number]): number {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Load all stored notifications from localStorage
 */
export function getStoredNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load notifications', e);
  }

  // Initial starter notifications reflecting active Hyderabad tech corridor
  const initial: AppNotification[] = [
    {
      id: 'notif_welcome',
      type: 'market_trend',
      title: 'Welcome to ManorMap Discovery Radar',
      message: 'Real-time property discovery engine active across Hyderabad, Bengaluru, Mumbai, and Delhi-NCR.',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      read: false
    },
    {
      id: 'notif_init_nearby',
      type: 'nearby_property',
      title: 'New High-Tech Corridor Listing',
      message: 'Premium 3 BHK residence recently listed in Hitec City / Madhapur with verified RERA documentation.',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      read: false,
      propertyId: 'hyd-prop-1',
      coordinates: [78.3820, 17.4474]
    }
  ];

  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(initial));
  } catch {}

  return initial;
}

/**
 * Save notifications list to localStorage
 */
export function saveNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.error('Failed to save notifications', e);
  }
}

/**
 * Get count of unread notifications
 */
export function getUnreadNotificationCount(): number {
  const notifs = getStoredNotifications();
  return notifs.filter((n) => !n.read).length;
}

/**
 * Mark a notification as read
 */
export function markNotificationAsRead(id: string): AppNotification[] {
  const notifs = getStoredNotifications();
  const updated = notifs.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(updated);
  return updated;
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead(): AppNotification[] {
  const notifs = getStoredNotifications();
  const updated = notifs.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
  return updated;
}

/**
 * Clear all notifications
 */
export function clearAllNotifications(): void {
  try {
    localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
  } catch {}
}

/**
 * Dispatch a notification when a new property is added near the user's location or active map view
 */
export function notifyNewNearbyProperty(
  property: Property,
  userOrMapCenter: [number, number],
  maxDistanceKm: number = 25
): AppNotification | null {
  if (!property.coordinates || property.coordinates.length < 2) return null;

  const distance = getDistanceKm(property.coordinates, userOrMapCenter);
  if (distance > maxDistanceKm) {
    // Still notify if in the same city or within generous range
    if (distance > 45) return null;
  }

  const newNotif: AppNotification = {
    id: `notif_nearby_${Date.now()}_${property.id}`,
    type: 'nearby_property',
    title: `🏡 New Listing in ${property.area || property.city}`,
    message: `${property.title} was just listed nearby for ${property.priceDisplay} (${property.category}).`,
    timestamp: new Date().toISOString(),
    read: false,
    propertyId: property.id,
    coordinates: property.coordinates
  };

  const existing = getStoredNotifications();
  // Prevent duplicate notifications for the same property
  if (existing.some((n) => n.propertyId === property.id && n.type === 'nearby_property')) {
    return null;
  }

  const updated = [newNotif, ...existing].slice(0, 30); // Keep last 30
  saveNotifications(updated);
  return newNotif;
}

/**
 * Monitor and notify price changes in liked / favorited properties
 */
export function checkAndNotifyLikedPropertyPriceChanges(
  allProperties: Property[],
  likedPropertyIds: string[]
): AppNotification[] {
  if (likedPropertyIds.length === 0) return [];

  // Load last known prices: { propertyId: number }
  let lastKnownPrices: Record<string, number> = {};
  try {
    const raw = localStorage.getItem(PRICE_TRACKER_STORAGE_KEY);
    if (raw) lastKnownPrices = JSON.parse(raw);
  } catch {}

  const newNotifications: AppNotification[] = [];
  const updatedPriceMap: Record<string, number> = { ...lastKnownPrices };

  likedPropertyIds.forEach((id) => {
    const prop = allProperties.find((p) => p.id === id);
    if (!prop) return;

    const previousPrice = lastKnownPrices[id];

    // If price is tracked and has changed
    if (typeof previousPrice === 'number' && previousPrice !== prop.price) {
      const diff = prop.price - previousPrice;
      const isDrop = diff < 0;

      const notif: AppNotification = {
        id: `notif_price_${Date.now()}_${prop.id}`,
        type: 'price_change',
        title: isDrop
          ? `📉 Price Dropped on Saved Property!`
          : `📈 Price Updated on Saved Property`,
        message: `${prop.title} in ${prop.area} changed from ₹${previousPrice.toLocaleString('en-IN')} to ${prop.priceDisplay} (${isDrop ? 'Savings: ₹' + Math.abs(diff).toLocaleString('en-IN') : 'Adjustment'}).`,
        timestamp: new Date().toISOString(),
        read: false,
        propertyId: prop.id,
        coordinates: prop.coordinates,
        priceChange: {
          oldPrice: previousPrice,
          newPrice: prop.price,
          difference: diff
        }
      };

      newNotifications.push(notif);
    }

    // Always update tracked price
    updatedPriceMap[id] = prop.price;
  });

  try {
    localStorage.setItem(PRICE_TRACKER_STORAGE_KEY, JSON.stringify(updatedPriceMap));
  } catch {}

  if (newNotifications.length > 0) {
    const existing = getStoredNotifications();
    const merged = [...newNotifications, ...existing].slice(0, 30);
    saveNotifications(merged);
  }

  return newNotifications;
}

/**
 * Format relative time (e.g. "Just now", "15m ago", "2h ago", "Yesterday")
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

