import { SearchResult } from '../types';

// Pre-indexed Indian cities, prominent areas, neighborhoods and PIN codes
// for instant, zero-latency response and respecting Nominatim rate limits.
const INDIAN_LOCATIONS: SearchResult[] = [
  // Major Metros & Cities
  {
    id: 'hyd-metro',
    title: 'Hyderabad',
    subTitle: 'Telangana, India',
    coordinates: [78.4867, 17.3850],
    type: 'city'
  },
  {
    id: 'hyd-hitec',
    title: 'Hitec City, Hyderabad',
    subTitle: 'Madhapur, Cyberabad, Telangana (PIN: 500081)',
    coordinates: [78.3820, 17.4474],
    type: 'neighborhood'
  },
  {
    id: 'hyd-gachibowli',
    title: 'Gachibowli, Hyderabad',
    subTitle: 'Financial District, Telangana (PIN: 500032)',
    coordinates: [78.3489, 17.4401],
    type: 'area'
  },
  {
    id: 'hyd-banjara',
    title: 'Banjara Hills, Hyderabad',
    subTitle: 'Road No 1 to 14, Telangana (PIN: 500034)',
    coordinates: [78.4357, 17.4156],
    type: 'neighborhood'
  },
  {
    id: 'hyd-jubilee',
    title: 'Jubilee Hills, Hyderabad',
    subTitle: 'Telangana (PIN: 500033)',
    coordinates: [78.4073, 17.4319],
    type: 'neighborhood'
  },
  {
    id: 'hyd-kondapur',
    title: 'Kondapur, Hyderabad',
    subTitle: 'Near Botanical Garden, Telangana (PIN: 500084)',
    coordinates: [78.3578, 17.4622],
    type: 'area'
  },
  {
    id: 'blr-metro',
    title: 'Bengaluru (Bangalore)',
    subTitle: 'Karnataka, India',
    coordinates: [77.5946, 12.9716],
    type: 'city'
  },
  {
    id: 'blr-indiranagar',
    title: 'Indiranagar, Bengaluru',
    subTitle: '100ft Road & 12th Main, Karnataka (PIN: 560038)',
    coordinates: [77.6412, 12.9784],
    type: 'neighborhood'
  },
  {
    id: 'blr-koramangala',
    title: 'Koramangala, Bengaluru',
    subTitle: 'Block 3, 4, 5 & 6, Karnataka (PIN: 560034)',
    coordinates: [77.6245, 12.9352],
    type: 'neighborhood'
  },
  {
    id: 'blr-whitefield',
    title: 'Whitefield, Bengaluru',
    subTitle: 'ITPL & Outer Ring Road, Karnataka (PIN: 560066)',
    coordinates: [77.7500, 12.9698],
    type: 'area'
  },
  {
    id: 'blr-hsr',
    title: 'HSR Layout, Bengaluru',
    subTitle: 'Sector 1 to 7, Karnataka (PIN: 560102)',
    coordinates: [77.6433, 12.9121],
    type: 'neighborhood'
  },
  {
    id: 'mum-metro',
    title: 'Mumbai',
    subTitle: 'Maharashtra, India',
    coordinates: [72.8777, 19.0760],
    type: 'city'
  },
  {
    id: 'mum-bandra',
    title: 'Bandra West, Mumbai',
    subTitle: 'Carter Road & Pali Hill, Maharashtra (PIN: 400050)',
    coordinates: [72.8295, 19.0596],
    type: 'neighborhood'
  },
  {
    id: 'mum-andheri',
    title: 'Andheri West, Mumbai',
    subTitle: 'Lokhandwala, Maharashtra (PIN: 400053)',
    coordinates: [72.8333, 19.1363],
    type: 'area'
  },
  {
    id: 'mum-powai',
    title: 'Powai, Mumbai',
    subTitle: 'Hiranandani Gardens, Maharashtra (PIN: 400076)',
    coordinates: [72.9051, 19.1176],
    type: 'neighborhood'
  },
  {
    id: 'mum-worli',
    title: 'Worli, Mumbai',
    subTitle: 'Sea Face & Lower Parel, Maharashtra (PIN: 400018)',
    coordinates: [72.8181, 19.0178],
    type: 'neighborhood'
  },
  {
    id: 'del-metro',
    title: 'Delhi',
    subTitle: 'National Capital Territory, India',
    coordinates: [77.2090, 28.6139],
    type: 'city'
  },
  {
    id: 'del-cp',
    title: 'Connaught Place, New Delhi',
    subTitle: 'Central Delhi (PIN: 110001)',
    coordinates: [77.2195, 28.6315],
    type: 'neighborhood'
  },
  {
    id: 'del-vasant',
    title: 'Vasant Kunj, New Delhi',
    subTitle: 'South Delhi (PIN: 110070)',
    coordinates: [77.1537, 28.5293],
    type: 'neighborhood'
  },
  {
    id: 'ggn-cybercity',
    title: 'Cyber City, Gurugram (Gurgaon)',
    subTitle: 'DLF Phase 2, Haryana (PIN: 122002)',
    coordinates: [77.0878, 28.4950],
    type: 'area'
  },
  {
    id: 'ggn-golfcourse',
    title: 'Golf Course Road, Gurugram',
    subTitle: 'DLF Phase 5, Haryana (PIN: 122011)',
    coordinates: [77.1052, 28.4595],
    type: 'neighborhood'
  },
  {
    id: 'noida-sec62',
    title: 'Sector 62, Noida',
    subTitle: 'Uttar Pradesh (PIN: 201309)',
    coordinates: [77.3639, 28.6280],
    type: 'area'
  },
  {
    id: 'pune-metro',
    title: 'Pune',
    subTitle: 'Maharashtra, India',
    coordinates: [73.8567, 18.5204],
    type: 'city'
  },
  {
    id: 'pune-koregaon',
    title: 'Koregaon Park, Pune',
    subTitle: 'North Main Road, Maharashtra (PIN: 411001)',
    coordinates: [73.8943, 18.5362],
    type: 'neighborhood'
  },
  {
    id: 'pune-hinjewadi',
    title: 'Hinjewadi, Pune',
    subTitle: 'Rajiv Gandhi Infotech Park, Maharashtra (PIN: 411057)',
    coordinates: [73.7297, 18.5913],
    type: 'area'
  },
  {
    id: 'chn-metro',
    title: 'Chennai',
    subTitle: 'Tamil Nadu, India',
    coordinates: [80.2707, 13.0827],
    type: 'city'
  },
  {
    id: 'chn-omr',
    title: 'Old Mahabalipuram Road (OMR), Chennai',
    subTitle: 'IT Corridor, Tamil Nadu (PIN: 600096)',
    coordinates: [80.2464, 12.9463],
    type: 'area'
  },
  {
    id: 'kol-metro',
    title: 'Kolkata',
    subTitle: 'West Bengal, India',
    coordinates: [88.3639, 22.5726],
    type: 'city'
  },
  {
    id: 'kol-saltlake',
    title: 'Salt Lake (Bidhannagar), Kolkata',
    subTitle: 'Sector V Tech Hub, West Bengal (PIN: 700091)',
    coordinates: [88.4287, 22.5804],
    type: 'neighborhood'
  },
  {
    id: 'ahmd-metro',
    title: 'Ahmedabad',
    subTitle: 'Gujarat, India',
    coordinates: [72.5714, 23.0225],
    type: 'city'
  },
  // Key Indian PIN Codes
  {
    id: 'pin-500081',
    title: 'PIN: 500081 - Madhapur & Hitec City',
    subTitle: 'Hyderabad, Telangana',
    coordinates: [78.3820, 17.4474],
    type: 'pincode'
  },
  {
    id: 'pin-560034',
    title: 'PIN: 560034 - Koramangala',
    subTitle: 'Bengaluru, Karnataka',
    coordinates: [77.6245, 12.9352],
    type: 'pincode'
  },
  {
    id: 'pin-400050',
    title: 'PIN: 400050 - Bandra West',
    subTitle: 'Mumbai, Maharashtra',
    coordinates: [72.8295, 19.0596],
    type: 'pincode'
  },
  {
    id: 'pin-110001',
    title: 'PIN: 110001 - Connaught Place',
    subTitle: 'New Delhi, Delhi',
    coordinates: [77.2195, 28.6315],
    type: 'pincode'
  }
];

// In-memory cache for geocoding queries
const queryCache = new Map<string, SearchResult[]>();
let lastApiCallTime = 0;
const MIN_API_INTERVAL_MS = 1000; // Strictly respect Nominatim 1 req/sec policy

export interface GeocodingConfig {
  endpoint: string;
  countryCode: string;
  useCache: boolean;
  userAgent: string;
}

const DEFAULT_CONFIG: GeocodingConfig = {
  endpoint: 'https://nominatim.openstreetmap.org/search',
  countryCode: 'in',
  useCache: true,
  userAgent: 'IndiaPropMapDiscovery/1.0 (map-first real estate)'
};

export async function searchLocations(query: string): Promise<SearchResult[]> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery || cleanQuery.length < 2) {
    return [];
  }

  // 1. Check local pre-indexed high-accuracy Indian locations first (instant)
  const localMatches = INDIAN_LOCATIONS.filter(item => {
    return (
      item.title.toLowerCase().includes(cleanQuery) ||
      (item.subTitle && item.subTitle.toLowerCase().includes(cleanQuery))
    );
  });

  // If we have high confidence local results, return them immediately
  if (localMatches.length >= 3) {
    return localMatches.slice(0, 6);
  }

  // 2. Check query cache
  if (queryCache.has(cleanQuery)) {
    const cached = queryCache.get(cleanQuery)!;
    // Combine unique
    return mergeUniqueResults(localMatches, cached);
  }

  // 3. Fallback to configurable Nominatim/OSM endpoint with strict rate limiting
  try {
    const now = Date.now();
    const timeSinceLast = now - lastApiCallTime;
    if (timeSinceLast < MIN_API_INTERVAL_MS) {
      await new Promise(r => setTimeout(r, MIN_API_INTERVAL_MS - timeSinceLast));
    }
    lastApiCallTime = Date.now();

    const params = new URLSearchParams({
      q: cleanQuery,
      format: 'json',
      addressdetails: '1',
      limit: '5',
      countrycodes: DEFAULT_CONFIG.countryCode
    });

    const response = await fetch(`${DEFAULT_CONFIG.endpoint}?${params.toString()}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return localMatches;
    }

    const data = await response.json();
    const remoteResults: SearchResult[] = (data || []).map((item: any) => ({
      id: `osm-${item.place_id || item.osm_id || Math.random()}`,
      title: item.display_name.split(',')[0],
      subTitle: item.display_name.split(',').slice(1, 4).join(',').trim(),
      coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
      type: item.type === 'city' ? 'city' : item.type === 'postcode' ? 'pincode' : 'area'
    }));

    queryCache.set(cleanQuery, remoteResults);
    return mergeUniqueResults(localMatches, remoteResults);
  } catch (err) {
    console.warn('Geocoding service unavailable or rate limited, falling back to local dataset', err);
    return localMatches;
  }
}

function mergeUniqueResults(a: SearchResult[], b: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const merged: SearchResult[] = [];
  
  for (const item of [...a, ...b]) {
    const key = `${item.title}-${item.coordinates[0].toFixed(3)}-${item.coordinates[1].toFixed(3)}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }
  return merged.slice(0, 8);
}

export interface ReverseGeocodeResult {
  city: string;
  area: string;
  state: string;
  pinCode: string;
  formattedAddress: string;
}

export async function reverseGeocodeLocation(lng: number, lat: number): Promise<ReverseGeocodeResult> {
  // 1. Find nearest pre-indexed location
  let closestDist = Infinity;
  let closestItem: SearchResult | null = null;

  for (const item of INDIAN_LOCATIONS) {
    const dLng = item.coordinates[0] - lng;
    const dLat = item.coordinates[1] - lat;
    const dist = Math.sqrt(dLng * dLng + dLat * dLat);
    if (dist < closestDist) {
      closestDist = dist;
      closestItem = item;
    }
  }

  // If very close to known area (< 8 km / ~0.08 deg)
  if (closestItem && closestDist < 0.08) {
    const parts = closestItem.title.split(',').map(s => s.trim());
    const areaName = parts[0] || 'Prime Area';
    const cityName = parts[1] || closestItem.subTitle?.split(',')[0] || 'Hyderabad';
    
    // Extract PIN if present in subtitle
    const pinMatch = closestItem.subTitle?.match(/\b(\d{6})\b/);
    const pin = pinMatch ? pinMatch[1] : '500081';

    return {
      area: areaName,
      city: cityName,
      state: closestItem.subTitle?.includes('Karnataka') ? 'Karnataka' : closestItem.subTitle?.includes('Maharashtra') ? 'Maharashtra' : 'Telangana',
      pinCode: pin,
      formattedAddress: `${areaName}, ${cityName} (PIN: ${pin})`
    };
  }

  // 2. Try Nominatim reverse lookup with fallback
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lon=${lng}&lat=${lat}&addressdetails=1`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const area = addr.suburb || addr.neighbourhood || addr.residential || addr.road || 'Local Area';
      const city = addr.city || addr.town || addr.state_district || 'City';
      const state = addr.state || 'India';
      const pinCode = addr.postcode || '500001';
      return {
        area,
        city,
        state,
        pinCode,
        formattedAddress: data.display_name?.split(',').slice(0, 3).join(', ') || `${area}, ${city}`
      };
    }
  } catch (e) {
    console.warn('Reverse geocode network fallback used', e);
  }

  return {
    area: 'Selected Area',
    city: 'Hyderabad',
    state: 'Telangana',
    pinCode: '500081',
    formattedAddress: `Dropped Pin Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
  };
}

