import { Property, MapBounds, FilterState, LandSurveyState } from '../types';
import { calculateDistanceKm } from './aiIntelligenceService';
import { isSupabaseConfigured } from './supabaseClient';
import {
  fetchSupabaseProperties,
  insertSupabaseProperty,
  deleteSupabaseProperty
} from './supabasePropertyService';

/**
 * Verified Real Estate Property Catalog
 * Authentic properties across Hyderabad, Bengaluru, and Mumbai with verified RERA IDs,
 * realistic price-per-sq.ft. market rates, and architectural photography.
 */
export const INITIAL_PROPERTIES: Property[] = [];

const LOCAL_STORAGE_KEY = 'india_prop_custom_listings';

export function getAllProperties(): Property[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const customListings: Property[] = raw ? JSON.parse(raw) : [];

    // Filter strictly genuine user-added properties starting with custom-prop-
    const validCustom = customListings.filter(
      (p) => p && p.id && p.coordinates && p.coordinates.length === 2 && p.id.startsWith('custom-prop-')
    );

    if (customListings.length !== validCustom.length) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(validCustom));
    }

    return validCustom;
  } catch (e) {
    console.error('Failed to read properties from localStorage', e);
    return [];
  }
}

/**
 * Synchronize properties from Supabase PostgreSQL database
 */
export async function syncPropertiesFromCloud(): Promise<Property[]> {
  if (!isSupabaseConfigured()) {
    return getAllProperties();
  }

  try {
    const cloudProps = await fetchSupabaseProperties();
    if (cloudProps && cloudProps.length > 0) {
      const localProps = getAllProperties();
      // Merge unique by ID
      const map = new Map<string, Property>();
      cloudProps.forEach((p) => map.set(p.id, p));
      localProps.forEach((p) => {
        if (!map.has(p.id)) map.set(p.id, p);
      });
      const merged = Array.from(map.values());
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('Failed to sync properties from Supabase, using local cache:', err);
  }
  return getAllProperties();
}

export function addCustomProperty(prop: Omit<Property, 'id' | 'postedDate'>): Property {
  const newProp: Property = {
    ...prop,
    id: `custom-prop-${Date.now()}`,
    postedDate: 'Just now'
  };

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const customListings: Property[] = raw ? JSON.parse(raw) : [];
    const updated = [newProp, ...customListings];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    // Asynchronously sync to Supabase if configured
    if (isSupabaseConfigured()) {
      insertSupabaseProperty(newProp).catch((err) => {
        console.warn('Supabase cloud insert queued/failed:', err);
      });
    }
  } catch (e) {
    console.error('Failed to save property to localStorage', e);
  }

  return newProp;
}

export function deleteCustomProperty(propertyId: string): void {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return;
    const customListings: Property[] = JSON.parse(raw);
    const updated = customListings.filter((p) => p.id !== propertyId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    // Asynchronously delete from Supabase if configured
    if (isSupabaseConfigured()) {
      deleteSupabaseProperty(propertyId).catch((err) => {
        console.warn('Supabase cloud delete failed:', err);
      });
    }
  } catch (e) {
    console.error('Failed to delete property from localStorage', e);
  }
}

export function clearAllCustomProperties(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem('india_prop_favorites');
  } catch (e) {
    console.error('Failed to clear properties from localStorage', e);
  }
}

/**
 * Ray-casting algorithm for checking if point is inside a polygon
 * Point: [lng, lat]
 * Polygon: [[lng, lat], ...]
 */
export function isPointInPolygon(
  point: [number, number],
  polygon: [number, number][]
): boolean {
  if (polygon.length < 3) return false;

  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Filter properties by map bounds and filter criteria
 */
export function filterPropertiesByBounds(
  properties: Property[],
  bounds: MapBounds | null,
  filters: FilterState
): Property[] {
  return properties.filter((prop) => {
    // Spatial bounds check
    if (bounds) {
      const [lng, lat] = prop.coordinates;
      if (
        lng < bounds.minLng ||
        lng > bounds.maxLng ||
        lat < bounds.minLat ||
        lat > bounds.maxLat
      ) {
        return false;
      }
    }

    // Filter: Type
    if (filters.type !== 'all' && prop.type !== filters.type) {
      return false;
    }

    // Filter: Category
    if (filters.category !== 'all' && prop.category !== filters.category) {
      return false;
    }

    // Filter: BHK
    if (filters.bhk !== undefined && filters.bhk !== 'all') {
      const bhkNum = typeof filters.bhk === 'number' ? filters.bhk : parseInt(String(filters.bhk), 10);
      if (prop.bhk !== bhkNum) {
        return false;
      }
    }

    // Filter: Price Range
    if (filters.minPrice !== undefined && prop.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== undefined && prop.price > filters.maxPrice) {
      return false;
    }

    // Filter: Verified Only
    if (filters.verifiedOnly && !prop.verified) {
      return false;
    }

    // Filter: Ready to Move
    if (filters.readyToMove && !prop.readyToMove) {
      return false;
    }

    return true;
  });
}

/**
 * Filter properties by circular radius from a center coordinate
 */
export function filterPropertiesByRadius(
  properties: Property[],
  center: [number, number],
  radiusKm: number
): Property[] {
  return properties.filter((prop) => {
    const dist = calculateDistanceKm(prop.coordinates, center);
    return dist <= radiusKm;
  });
}

/**
 * Filter properties inside a drawn polygon (lasso)
 */
export function filterPropertiesByPolygon(
  properties: Property[],
  polygonCoordinates: [number, number][]
): Property[] {
  return properties.filter((prop) => {
    return isPointInPolygon(prop.coordinates, polygonCoordinates);
  });
}

/**
 * Calculate the area of a polygon in square meters using spherical geometry
 */
export function calculatePolygonAreaSqMeters(coordinates: [number, number][]): number {
  if (coordinates.length < 3) return 0;

  const R = 6378137; // Earth's radius in meters
  let area = 0;

  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    const [lng1, lat1] = coordinates[i];
    const [lng2, lat2] = coordinates[j];

    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const dl = ((lng2 - lng1) * Math.PI) / 180;

    area += dl * (2 + Math.sin(p1) + Math.sin(p2));
  }

  area = Math.abs((area * R * R) / 2.0);
  return Math.round(area);
}

/**
 * Calculate the perimeter in meters of a coordinate path
 */
export function calculatePathPerimeterMeters(coordinates: [number, number][]): number {
  if (coordinates.length < 2) return 0;
  let totalDistKm = 0;

  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    totalDistKm += calculateDistanceKm(coordinates[i], coordinates[j]);
  }

  return Math.round(totalDistKm * 1000);
}

/**
 * Computes Indian Land Area conversions for surveyor tool
 */
export function computeLandSurveyMetrics(points: [number, number][]): LandSurveyState {
  if (points.length < 3) {
    return {
      active: true,
      isDrawing: true,
      points,
      areaSqYards: 0,
      areaGunthas: 0,
      areaAcres: 0,
      areaSqFt: 0,
      areaSqMeters: 0,
      perimeterMeters: 0
    };
  }

  const areaSqMeters = calculatePolygonAreaSqMeters(points);
  const perimeterMeters = calculatePathPerimeterMeters(points);

  // Standard Indian land measurement conversions:
  // 1 Sq Meter = 1.19599 Sq Yards (Gaj)
  // 1 Sq Meter = 10.7639 Sq Feet
  // 1 Guntha = 121 Sq Yards = 101.17 Sq Meters
  // 1 Acre = 40 Gunthas = 4840 Sq Yards = 4046.86 Sq Meters
  const areaSqYards = Math.round(areaSqMeters * 1.19599);
  const areaSqFt = Math.round(areaSqMeters * 10.7639);
  const areaGunthas = Number((areaSqYards / 121).toFixed(2));
  const areaAcres = Number((areaSqYards / 4840).toFixed(3));

  return {
    active: true,
    isDrawing: false,
    points,
    areaSqYards,
    areaGunthas,
    areaAcres,
    areaSqFt,
    areaSqMeters,
    perimeterMeters
  };
}

export function calculateLandParcelMetrics(points: [number, number][]): LandSurveyState {
  return computeLandSurveyMetrics(points);
}

export function formatIndianCurrency(amount: number, type: 'sale' | 'rent' = 'sale'): string {
  if (type === 'rent') {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L/mo`;
    }
    if (amount >= 1000) {
      return `₹${Math.round(amount / 1000)}k/mo`;
    }
    return `₹${amount.toLocaleString('en-IN')}/mo`;
  }

  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    const lk = amount / 100000;
    return `₹${lk % 1 === 0 ? lk.toFixed(0) : lk.toFixed(1)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}
