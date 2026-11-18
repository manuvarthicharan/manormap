export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  type: 'new_listing' | 'price_alert' | 'system' | 'lead';
  propertyId?: string;
  locality?: string;
  city?: string;
  read: boolean;
}

const STORAGE_KEY = 'manormap_real_notifications';

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-init-1',
    title: 'New Luxury Villa Listed Nearby',
    message: 'A brand-new 4 BHK East-facing Villa was listed in Kokapet Golden Mile at ₹4.25 Cr.',
    timestamp: Date.now() - 1000 * 60 * 45, // 45 mins ago
    type: 'new_listing',
    propertyId: 'prop-1',
    locality: 'Kokapet',
    city: 'Hyderabad',
    read: false
  },
  {
    id: 'notif-init-2',
    title: 'Price Update in Financial District',
    message: 'Average sq.ft prices in Gachibowli & Financial District appreciated by +8.4% this quarter.',
    timestamp: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
    type: 'price_alert',
    locality: 'Financial District',
    city: 'Hyderabad',
    read: false
  },
  {
    id: 'notif-init-3',
    title: 'Verified Direct Owner Farm Parcel',
    message: '2.5 Acres Clear Title Agricultural Land in Shankarpally added with Bhu Bharati Passbook.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    type: 'new_listing',
    propertyId: 'prop-4',
    locality: 'Shankarpally',
    city: 'Hyderabad',
    read: true
  }
];

export const notificationService = {
  getNotifications(): AppNotification[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
      return DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  },

  addNotification(
    payload: Omit<AppNotification, 'id' | 'timestamp' | 'read'>
  ): AppNotification {
    const notifications = this.getNotifications();
    const newNotif: AppNotification = {
      ...payload,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      read: false
    };

    const updated = [newNotif, ...notifications];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save notification', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('manormap_notifications_updated'));
    }

    return newNotif;
  },

  markAsRead(id: string): void {
    const notifications = this.getNotifications();
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to update notification', e);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('manormap_notifications_updated'));
    }
  },

  markAllAsRead(): void {
    const notifications = this.getNotifications();
    const updated = notifications.map((n) => ({ ...n, read: true }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to mark all as read', e);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('manormap_notifications_updated'));
    }
  },

  deleteNotification(id: string): void {
    const notifications = this.getNotifications();
    const updated = notifications.filter((n) => n.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to delete notification', e);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('manormap_notifications_updated'));
    }
  },

  clearAll(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch (e) {
      console.warn('Failed to clear notifications', e);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('manormap_notifications_updated'));
    }
  },

  getUnreadCount(): number {
    const notifications = this.getNotifications();
    return notifications.filter((n) => !n.read).length;
  }
};
