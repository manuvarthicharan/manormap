import { Property } from '../types';

export interface MicroMarketPriceNode {
  name: string;
  city: string;
  coordinates: [number, number]; // [lng, lat]
  pricePerSqFt: number; // in INR
  tier: 'ultra-luxury' | 'premium' | 'balanced' | 'affordable';
  costOfLivingIndex: number; // 1-100
  notes?: string;
}

export type HeatmapMetric = 'sqft' | 'total';

export interface HeatmapWeightedPoint {
  lat: number;
  lng: number;
  weight: number;
  rate: number;
  name: string;
  isProperty?: boolean;
}

export interface HeatmapPriceStatistics {
  minRate: number;
  maxRate: number;
  avgRate: number;
  medianRate: number;
  totalPoints: number;
  metric: HeatmapMetric;
}

/**
 * Curated benchmark nodes across major Indian real estate micro-markets
 * representing verified land acquisition costs, circle rates, and residential price per sq.ft.
 */
export const BENCHMARK_PRICE_NODES: MicroMarketPriceNode[] = [
  // ================= HYDERABAD =================
  { name: 'Jubilee Hills', city: 'Hyderabad', coordinates: [78.4073, 17.4319], pricePerSqFt: 28500, tier: 'ultra-luxury', costOfLivingIndex: 96 },
  { name: 'Banjara Hills Rd 12', city: 'Hyderabad', coordinates: [78.4350, 17.4156], pricePerSqFt: 25000, tier: 'ultra-luxury', costOfLivingIndex: 94 },
  { name: 'Film Nagar', city: 'Hyderabad', coordinates: [78.4010, 17.4180], pricePerSqFt: 24000, tier: 'ultra-luxury', costOfLivingIndex: 92 },
  { name: 'Hitec City / Cyber Towers', city: 'Hyderabad', coordinates: [78.3820, 17.4474], pricePerSqFt: 14800, tier: 'premium', costOfLivingIndex: 86 },
  { name: 'Madhapur', city: 'Hyderabad', coordinates: [78.3900, 17.4380], pricePerSqFt: 13900, tier: 'premium', costOfLivingIndex: 84 },
  { name: 'Financial District', city: 'Hyderabad', coordinates: [78.3450, 17.4170], pricePerSqFt: 13600, tier: 'premium', costOfLivingIndex: 82 },
  { name: 'Kokapet Neopolis', city: 'Hyderabad', coordinates: [78.3280, 17.3990], pricePerSqFt: 14200, tier: 'premium', costOfLivingIndex: 85 },
  { name: 'Nanakramguda', city: 'Hyderabad', coordinates: [78.3580, 17.4190], pricePerSqFt: 13000, tier: 'premium', costOfLivingIndex: 80 },
  { name: 'Gachibowli', city: 'Hyderabad', coordinates: [78.3489, 17.4401], pricePerSqFt: 11800, tier: 'premium', costOfLivingIndex: 78 },
  { name: 'Kondapur', city: 'Hyderabad', coordinates: [78.3630, 17.4660], pricePerSqFt: 9800, tier: 'balanced', costOfLivingIndex: 70 },
  { name: 'Botanical Garden Rd', city: 'Hyderabad', coordinates: [78.3650, 17.4580], pricePerSqFt: 10400, tier: 'premium', costOfLivingIndex: 74 },
  { name: 'Manikonda / Puppalguda', city: 'Hyderabad', coordinates: [78.3840, 17.4020], pricePerSqFt: 8800, tier: 'balanced', costOfLivingIndex: 65 },
  { name: 'Kukatpally KPHB', city: 'Hyderabad', coordinates: [78.3990, 17.4938], pricePerSqFt: 8200, tier: 'balanced', costOfLivingIndex: 62 },
  { name: 'Miyapur', city: 'Hyderabad', coordinates: [78.3560, 17.4968], pricePerSqFt: 6400, tier: 'affordable', costOfLivingIndex: 52 },
  { name: 'Bachupally / Nizampet', city: 'Hyderabad', coordinates: [78.3750, 17.5250], pricePerSqFt: 5800, tier: 'affordable', costOfLivingIndex: 48 },
  { name: 'Tellapur', city: 'Hyderabad', coordinates: [78.2900, 17.4600], pricePerSqFt: 7400, tier: 'balanced', costOfLivingIndex: 58 },
  { name: 'Kollur ORR Exit 2', city: 'Hyderabad', coordinates: [78.2400, 17.4800], pricePerSqFt: 5600, tier: 'affordable', costOfLivingIndex: 45 },
  { name: 'Ameerpet / Begumpet', city: 'Hyderabad', coordinates: [78.4482, 17.4375], pricePerSqFt: 8600, tier: 'balanced', costOfLivingIndex: 64 },
  { name: 'Somajiguda', city: 'Hyderabad', coordinates: [78.4580, 17.4240], pricePerSqFt: 12200, tier: 'premium', costOfLivingIndex: 76 },
  { name: 'Secunderabad Clock Tower', city: 'Hyderabad', coordinates: [78.4983, 17.4399], pricePerSqFt: 7100, tier: 'balanced', costOfLivingIndex: 55 },
  { name: 'Sainikpuri', city: 'Hyderabad', coordinates: [78.5480, 17.4890], pricePerSqFt: 5900, tier: 'affordable', costOfLivingIndex: 48 },
  { name: 'Uppal / Habsiguda', city: 'Hyderabad', coordinates: [78.5600, 17.4050], pricePerSqFt: 5200, tier: 'affordable', costOfLivingIndex: 44 },
  { name: 'Pocharam Infosys SEZ', city: 'Hyderabad', coordinates: [78.6800, 17.4600], pricePerSqFt: 4300, tier: 'affordable', costOfLivingIndex: 38 },
  { name: 'LB Nagar / Nagole', city: 'Hyderabad', coordinates: [78.5522, 17.3457], pricePerSqFt: 5500, tier: 'affordable', costOfLivingIndex: 45 },
  { name: 'Shamshabad RGIA Airport', city: 'Hyderabad', coordinates: [78.4311, 17.2543], pricePerSqFt: 5300, tier: 'affordable', costOfLivingIndex: 46 },
  { name: 'Maheshwaram Pharma City', city: 'Hyderabad', coordinates: [78.4300, 17.1350], pricePerSqFt: 3600, tier: 'affordable', costOfLivingIndex: 32 },
  { name: 'Kompally NH-44', city: 'Hyderabad', coordinates: [78.4860, 17.5380], pricePerSqFt: 5400, tier: 'affordable', costOfLivingIndex: 46 },
  { name: 'Medchal Gateway', city: 'Hyderabad', coordinates: [78.4814, 17.6297], pricePerSqFt: 3900, tier: 'affordable', costOfLivingIndex: 34 },
  { name: 'Shadnagar Growth Corridor', city: 'Hyderabad', coordinates: [78.2078, 17.0722], pricePerSqFt: 2600, tier: 'affordable', costOfLivingIndex: 26 },
  { name: 'Patancheru Industrial Zone', city: 'Hyderabad', coordinates: [78.2670, 17.5290], pricePerSqFt: 4800, tier: 'affordable', costOfLivingIndex: 40 },

  // ================= BENGALURU =================
  { name: 'Indiranagar 100ft Rd', city: 'Bengaluru', coordinates: [77.6408, 12.9784], pricePerSqFt: 25500, tier: 'ultra-luxury', costOfLivingIndex: 95 },
  { name: 'Koramangala 4th Block', city: 'Bengaluru', coordinates: [77.6245, 12.9352], pricePerSqFt: 23500, tier: 'ultra-luxury', costOfLivingIndex: 93 },
  { name: 'Lavelle Road / CBD', city: 'Bengaluru', coordinates: [77.5946, 12.9716], pricePerSqFt: 29000, tier: 'ultra-luxury', costOfLivingIndex: 98 },
  { name: 'HSR Layout Sector 1', city: 'Bengaluru', coordinates: [77.6446, 12.9121], pricePerSqFt: 13200, tier: 'premium', costOfLivingIndex: 82 },
  { name: 'Bellandur / ORR Tech Corridor', city: 'Bengaluru', coordinates: [77.6784, 12.9304], pricePerSqFt: 12400, tier: 'premium', costOfLivingIndex: 80 },
  { name: 'Whitefield Hope Farm', city: 'Bengaluru', coordinates: [77.7500, 12.9698], pricePerSqFt: 10800, tier: 'premium', costOfLivingIndex: 75 },
  { name: 'Sarjapur Road / Doddakannelli', city: 'Bengaluru', coordinates: [77.6980, 12.9080], pricePerSqFt: 8600, tier: 'balanced', costOfLivingIndex: 65 },
  { name: 'Electronic City Phase 1', city: 'Bengaluru', coordinates: [77.6602, 12.8452], pricePerSqFt: 6200, tier: 'affordable', costOfLivingIndex: 50 },
  { name: 'Hebbal Flyover / Bellary Rd', city: 'Bengaluru', coordinates: [77.5970, 13.0358], pricePerSqFt: 11500, tier: 'premium', costOfLivingIndex: 78 },
  { name: 'Thanisandra Main Rd', city: 'Bengaluru', coordinates: [77.6250, 13.0538], pricePerSqFt: 8800, tier: 'balanced', costOfLivingIndex: 66 },
  { name: 'Yelahanka New Town', city: 'Bengaluru', coordinates: [77.5963, 13.1007], pricePerSqFt: 7100, tier: 'balanced', costOfLivingIndex: 56 },
  { name: 'Devanahalli Airport Aerotropolis', city: 'Bengaluru', coordinates: [77.7126, 13.2483], pricePerSqFt: 5200, tier: 'affordable', costOfLivingIndex: 44 },

  // ================= MUMBAI & MMR =================
  { name: 'Worli Sea Face', city: 'Mumbai', coordinates: [72.8150, 19.0178], pricePerSqFt: 68000, tier: 'ultra-luxury', costOfLivingIndex: 99 },
  { name: 'Bandra West Pali Hill', city: 'Mumbai', coordinates: [72.8295, 19.0596], pricePerSqFt: 58000, tier: 'ultra-luxury', costOfLivingIndex: 98 },
  { name: 'BKC G-Block', city: 'Mumbai', coordinates: [72.8680, 19.0660], pricePerSqFt: 44000, tier: 'ultra-luxury', costOfLivingIndex: 96 },
  { name: 'Andheri West Lokhandwala', city: 'Mumbai', coordinates: [72.8260, 19.1410], pricePerSqFt: 26000, tier: 'ultra-luxury', costOfLivingIndex: 88 },
  { name: 'Powai Hiranandani Gardens', city: 'Mumbai', coordinates: [72.9060, 19.1176], pricePerSqFt: 22500, tier: 'premium', costOfLivingIndex: 85 },
  { name: 'Thane Ghodbunder Road', city: 'Mumbai', coordinates: [72.9600, 19.2450], pricePerSqFt: 13500, tier: 'premium', costOfLivingIndex: 72 },
  { name: 'Navi Mumbai Vashi Sector 17', city: 'Mumbai', coordinates: [72.9986, 19.0771], pricePerSqFt: 15200, tier: 'premium', costOfLivingIndex: 74 },
  { name: 'Kharghar Navi Mumbai', city: 'Mumbai', coordinates: [73.0674, 19.0270], pricePerSqFt: 9200, tier: 'balanced', costOfLivingIndex: 60 },
  { name: 'Kalyan West', city: 'Mumbai', coordinates: [73.1355, 19.2437], pricePerSqFt: 5600, tier: 'affordable', costOfLivingIndex: 42 },

  // ================= DELHI-NCR =================
  { name: 'Golf Course Road DLF 5', city: 'Delhi-NCR', coordinates: [77.0988, 28.4595], pricePerSqFt: 31000, tier: 'ultra-luxury', costOfLivingIndex: 98 },
  { name: 'Cyber City DLF Phase 2', city: 'Delhi-NCR', coordinates: [77.0890, 28.4950], pricePerSqFt: 21500, tier: 'ultra-luxury', costOfLivingIndex: 92 },
  { name: 'Golf Course Ext Road', city: 'Delhi-NCR', coordinates: [77.0720, 28.4120], pricePerSqFt: 15200, tier: 'premium', costOfLivingIndex: 82 },
  { name: 'South Extension / GK 1', city: 'Delhi-NCR', coordinates: [77.2240, 28.5670], pricePerSqFt: 34000, tier: 'ultra-luxury', costOfLivingIndex: 97 },
  { name: 'Dwarka Expressway Sector 102', city: 'Delhi-NCR', coordinates: [76.9920, 28.4960], pricePerSqFt: 10400, tier: 'premium', costOfLivingIndex: 70 },
  { name: 'Noida Sector 62 IT Park', city: 'Delhi-NCR', coordinates: [77.3670, 28.6280], pricePerSqFt: 9500, tier: 'balanced', costOfLivingIndex: 68 },
  { name: 'Noida Sector 150 Green Sports City', city: 'Delhi-NCR', coordinates: [77.4850, 28.4350], pricePerSqFt: 8900, tier: 'balanced', costOfLivingIndex: 64 },
  { name: 'Greater Noida West Gaur City', city: 'Delhi-NCR', coordinates: [77.4450, 28.5850], pricePerSqFt: 5400, tier: 'affordable', costOfLivingIndex: 46 },
  { name: 'Yamuna Expressway Film City', city: 'Delhi-NCR', coordinates: [77.5400, 28.3200], pricePerSqFt: 4100, tier: 'affordable', costOfLivingIndex: 35 },

  // ================= CHENNAI & PUNE =================
  { name: 'Boat Club / Poes Garden', city: 'Chennai', coordinates: [80.2450, 13.0280], pricePerSqFt: 27500, tier: 'ultra-luxury', costOfLivingIndex: 96 },
  { name: 'OMR Thoraipakkam IT Expressway', city: 'Chennai', coordinates: [80.2330, 12.9380], pricePerSqFt: 8100, tier: 'balanced', costOfLivingIndex: 62 },
  { name: 'Koregaon Park South Main Rd', city: 'Pune', coordinates: [73.8940, 18.5362], pricePerSqFt: 19500, tier: 'ultra-luxury', costOfLivingIndex: 90 },
  { name: 'Baner High Street', city: 'Pune', coordinates: [73.7868, 18.5590], pricePerSqFt: 10200, tier: 'premium', costOfLivingIndex: 72 },
  { name: 'Hinjewadi Phase 1 Rajiv Gandhi IT Park', city: 'Pune', coordinates: [73.7389, 18.5987], pricePerSqFt: 7400, tier: 'balanced', costOfLivingIndex: 58 }
];

/**
 * Authentic Thermal Camera Heatmap Gradient (Ironbow / Jet palette):
 * Blue -> Cyan -> Green -> Lime -> Yellow -> Orange -> Red -> Magenta
 * Note: Index 0 is transparent deep blue. Subsequent stops are strictly alpha = 1.0.
 */
export const PRICE_HEATMAP_GRADIENT = [
  'rgba(30, 64, 175, 0)',     // 0: Transparent Deep Blue base
  'rgba(30, 64, 175, 1)',     // 🔵 Deep Blue - Entry Level / Ultra-affordable
  'rgba(6, 182, 212, 1)',     // 🔷 Cyan - Value Corridor
  'rgba(34, 197, 94, 1)',     // 🟢 Green - Affordable Suburban
  'rgba(132, 204, 22, 1)',    // 🍏 Lime - Mid-Value
  'rgba(234, 179, 8, 1)',     // 🟡 Yellow - Balanced Living Cost
  'rgba(249, 115, 22, 1)',    // 🟠 Orange - High-Demand Premium Hub
  'rgba(239, 68, 68, 1)',     // 🔴 Red - Ultra-Luxury Prime Land
  'rgba(217, 70, 239, 1)'     // 🟣 Magenta - Super-Peak Hotspot
];

/**
 * Generous heatmap radius so thermal heat smoothly overlays across whole neighborhoods
 */
export function getHeatmapRadius(zoom: number): number {
  if (zoom >= 16) return 75;
  if (zoom >= 14) return 65;
  if (zoom >= 12) return 52;
  if (zoom >= 10) return 38;
  if (zoom >= 8) return 26;
  return 18;
}

/**
 * Calculates weighted thermal points combining catalog properties, regional anchors,
 * and continuous spatial interpolation mesh for an authentic thermal camera look.
 */
export function buildHeatmapWeightedPoints(
  properties: Property[],
  metric: HeatmapMetric = 'sqft'
): { points: HeatmapWeightedPoint[]; stats: HeatmapPriceStatistics } {
  const combinedRaw: { lat: number; lng: number; rate: number; name: string; isProperty: boolean }[] = [];

  // 1. Process active properties from database/catalog
  properties.forEach((p) => {
    if (!p.coordinates || p.coordinates.length < 2) return;
    const [lng, lat] = p.coordinates;
    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) return;

    let rate = 0;
    if (metric === 'sqft') {
      rate = p.areaSqFt > 0 ? Math.round(p.price / p.areaSqFt) : Math.round(p.price / 1200);
    } else {
      rate = p.price;
    }

    if (rate > 0) {
      // Primary property node
      combinedRaw.push({
        lat,
        lng,
        rate,
        name: p.title || p.area || 'Property Listing',
        isProperty: true
      });

      // Spatial feathering around property listing to blend into neighborhood
      const d = 0.003;
      combinedRaw.push(
        { lat: lat + d, lng: lng, rate: Math.round(rate * 0.98), name: p.area, isProperty: true },
        { lat: lat - d, lng: lng, rate: Math.round(rate * 0.98), name: p.area, isProperty: true },
        { lat: lat, lng: lng + d, rate: Math.round(rate * 0.98), name: p.area, isProperty: true },
        { lat: lat, lng: lng - d, rate: Math.round(rate * 0.98), name: p.area, isProperty: true }
      );
    }
  });

  // 2. Include regional benchmark nodes and spatial continuous coverage nodes
  BENCHMARK_PRICE_NODES.forEach((b) => {
    let rate = 0;
    if (metric === 'sqft') {
      rate = b.pricePerSqFt;
    } else {
      rate = b.pricePerSqFt * 1500;
    }

    const bLat = b.coordinates[1];
    const bLng = b.coordinates[0];

    // Core anchor
    combinedRaw.push({
      lat: bLat,
      lng: bLng,
      rate,
      name: `${b.name}, ${b.city}`,
      isProperty: false
    });

    // Thermal mesh interpolation radiating outward across the micro-market
    // Generates smooth continuous thermal coverage across the terrain
    const offsets = [
      { dLat: 0.007, dLng: 0.006, factor: 0.96 },
      { dLat: -0.007, dLng: -0.006, factor: 0.96 },
      { dLat: 0.006, dLng: -0.007, factor: 0.95 },
      { dLat: -0.006, dLng: 0.007, factor: 0.95 },
      { dLat: 0.013, dLng: 0.011, factor: 0.90 },
      { dLat: -0.013, dLng: -0.011, factor: 0.90 },
      { dLat: 0.011, dLng: -0.013, factor: 0.89 },
      { dLat: -0.011, dLng: 0.013, factor: 0.89 }
    ];

    offsets.forEach((off) => {
      combinedRaw.push({
        lat: bLat + off.dLat,
        lng: bLng + off.dLng,
        rate: Math.round(rate * off.factor),
        name: `${b.name} Sector`,
        isProperty: false
      });
    });
  });

  if (combinedRaw.length === 0) {
    return {
      points: [],
      stats: { minRate: 0, maxRate: 0, avgRate: 0, medianRate: 0, totalPoints: 0, metric }
    };
  }

  // Calculate statistics across all active sample nodes
  const rates = combinedRaw.map((r) => r.rate).sort((a, b) => a - b);
  const minRate = rates[0] || 2500;
  const maxRate = rates[rates.length - 1] || 68000;
  const sumRate = rates.reduce((acc, r) => acc + r, 0);
  const avgRate = Math.round(sumRate / rates.length);
  const medianRate = rates[Math.floor(rates.length / 2)] || avgRate;

  // Relative normalization: weights range from 1 to 10
  const rateSpread = Math.max(1, maxRate - minRate);

  const weightedPoints: HeatmapWeightedPoint[] = combinedRaw.map((pt) => {
    // Normalization ratio [0, 1]
    const ratio = Math.max(0, Math.min(1, (pt.rate - minRate) / rateSpread));

    // Distributes across the 8-stage thermal camera spectrum:
    // 1-2 (Blue) -> 3-4 (Cyan) -> 5 (Green) -> 6-7 (Yellow) -> 8 (Orange) -> 9 (Red) -> 10 (Magenta)
    const weight = Math.round((1 + Math.pow(ratio, 0.9) * 9) * 10) / 10;

    return {
      lat: pt.lat,
      lng: pt.lng,
      weight,
      rate: pt.rate,
      name: pt.name,
      isProperty: pt.isProperty
    };
  });

  return {
    points: weightedPoints,
    stats: {
      minRate,
      maxRate,
      avgRate,
      medianRate,
      totalPoints: weightedPoints.length,
      metric
    }
  };
}

/**
 * Returns user-friendly format for price values (e.g. ₹8.5K/sq.ft or ₹1.4 Cr)
 */
export function formatHeatmapPrice(value?: number | null, metric: HeatmapMetric = 'sqft'): string {
  const num = typeof value === 'number' && !isNaN(value) && isFinite(value) ? value : 0;
  if (metric === 'sqft') {
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(1)}L/sq.ft`;
    }
    return `₹${Math.round(num).toLocaleString('en-IN')}/sq.ft`;
  } else {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(1)} L`;
    }
    return `₹${Math.round(num).toLocaleString('en-IN')}`;
  }
}
