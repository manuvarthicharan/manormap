import { Property } from '../types';
import { supabase, isSupabaseConfigured, getCurrentUser } from './supabaseClient';

/**
 * Transforms a Supabase properties row into the application's Property interface
 */
export function mapRowToProperty(row: any): Property {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    price: Number(row.price),
    priceDisplay: row.price_display,
    type: row.type,
    category: row.category,
    bhk: row.bhk || 0,
    bathrooms: row.bathrooms || 1,
    balconies: row.balconies || 0,
    areaSqFt: Number(row.area_sqft),
    carpetAreaSqFt: row.carpet_area_sqft ? Number(row.carpet_area_sqft) : undefined,
    address: row.address,
    area: row.area,
    city: row.city,
    state: row.state,
    pinCode: row.pin_code,
    coordinates: [Number(row.longitude), Number(row.latitude)],
    images: Array.isArray(row.images) ? row.images : [],
    features: Array.isArray(row.features) ? row.features : [],
    verified: Boolean(row.verified),
    readyToMove: Boolean(row.ready_to_move),
    furnishing: row.furnishing || 'Unfurnished',
    facing: row.facing || undefined,
    parking: row.parking || '1 Covered',
    floorInfo: row.floor_info || undefined,
    maintenanceMonthly: row.maintenance_monthly ? Number(row.maintenance_monthly) : undefined,
    postedDate: row.posted_date || 'Recently',
    reraId: row.rera_id || undefined,
    isFeatured: Boolean(row.is_featured),
    contact: {
      name: row.contact_name,
      phone: row.contact_phone,
      type: row.contact_type || 'Owner',
      email: row.contact_email || undefined
    },
    boundaryPolygon: row.boundary_polygon || undefined,
    landMetrics: row.land_metrics || undefined,
    aiAnalysis: row.ai_analysis || undefined,
    nearbyPOIs: row.nearby_pois || undefined
  };
}

/**
 * Transforms a Property object into Supabase properties table columns
 */
export async function mapPropertyToRow(prop: Property, userId?: string | null) {
  return {
    id: prop.id,
    user_id: userId || null,
    title: prop.title,
    description: prop.description || '',
    price: prop.price,
    price_display: prop.priceDisplay,
    type: prop.type,
    category: prop.category,
    bhk: prop.bhk,
    bathrooms: prop.bathrooms,
    balconies: prop.balconies || 0,
    area_sqft: prop.areaSqFt,
    carpet_area_sqft: prop.carpetAreaSqFt || null,
    address: prop.address,
    area: prop.area,
    city: prop.city,
    state: prop.state,
    pin_code: prop.pinCode,
    longitude: prop.coordinates[0],
    latitude: prop.coordinates[1],
    images: prop.images || [],
    features: prop.features || [],
    verified: prop.verified || false,
    ready_to_move: prop.readyToMove ?? true,
    furnishing: prop.furnishing || 'Unfurnished',
    facing: prop.facing || null,
    parking: prop.parking || '1 Dedicated Covered',
    floor_info: prop.floorInfo || null,
    maintenance_monthly: prop.maintenanceMonthly || 0,
    posted_date: prop.postedDate || 'Just now',
    rera_id: prop.reraId || null,
    is_featured: prop.isFeatured || false,
    contact_name: prop.contact.name,
    contact_phone: prop.contact.phone,
    contact_type: prop.contact.type,
    contact_email: prop.contact.email || null,
    boundary_polygon: prop.boundaryPolygon || null,
    land_metrics: prop.landMetrics || null,
    ai_analysis: prop.aiAnalysis || null,
    nearby_pois: prop.nearbyPOIs || null
  };
}

/**
 * Fetch all properties from Supabase
 */
export async function fetchSupabaseProperties(): Promise<Property[]> {
  if (!supabase || !isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map(mapRowToProperty);
  } catch (err) {
    console.warn('Error fetching properties from Supabase:', err);
    return [];
  }
}

/**
 * Insert a property into Supabase
 */
export async function insertSupabaseProperty(prop: Property): Promise<Property | null> {
  if (!supabase || !isSupabaseConfigured()) return null;

  try {
    const user = await getCurrentUser();
    const row = await mapPropertyToRow(prop, user?.id);

    const { data, error } = await supabase
      .from('properties')
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return mapRowToProperty(data);
  } catch (err) {
    console.error('Error inserting property to Supabase:', err);
    return null;
  }
}

/**
 * Delete a property from Supabase
 */
export async function deleteSupabaseProperty(propertyId: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting property from Supabase:', err);
    return false;
  }
}

/**
 * Fetch user favorites from Supabase
 */
export async function fetchSupabaseFavorites(): Promise<string[]> {
  if (!supabase || !isSupabaseConfigured()) return [];

  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('favorites')
      .select('property_id')
      .eq('user_id', user.id);

    if (error) throw error;
    return data ? data.map((f: any) => f.property_id) : [];
  } catch (err) {
    console.warn('Error fetching favorites from Supabase:', err);
    return [];
  }
}

/**
 * Add or remove favorite in Supabase
 */
export async function toggleSupabaseFavorite(propertyId: string, isFav: boolean): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured()) return false;

  try {
    const user = await getCurrentUser();
    if (!user) return false;

    if (isFav) {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, property_id: propertyId });
      if (error && error.code !== '23505') throw error; // ignore duplicate key
    } else {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', propertyId);
      if (error) throw error;
    }
    return true;
  } catch (err) {
    console.warn('Error toggling favorite in Supabase:', err);
    return false;
  }
}

