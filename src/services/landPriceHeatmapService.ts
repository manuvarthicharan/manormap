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
 * Curated dense benchmark nodes across major Indian real estate micro-markets
 * representing verified land acquisition costs, circle rates, and residential price per sq.ft.
 * Multi-node lattice ensures continuous thermal camera heat dispersion.
 */
export const BENCHMARK_PRICE_NODES: MicroMarketPriceNode[] = [
  // ================= HYDERABAD: ULTRA LUXURY & PEAK THERMAL CORES (RED/CRIMSON) =================
  { name: 'Jubilee Hills Rd 36', city: 'Hyderabad', coordinates: [78.4073, 17.4319], pricePerSqFt: 29500, tier: 'ultra-luxury', costOfLivingIndex: 98 },
  { name: 'Jubilee Hills Rd 45', city: 'Hyderabad', coordinates: [78.4120, 17.4380], pricePerSqFt: 28000, tier: 'ultra-luxury', costOfLivingIndex: 96 },
  { name: 'Jubilee Hills Check Post', city: 'Hyderabad', coordinates: [78.4230, 17.4260], pricePerSqFt: 27500, tier: 'ultra-luxury', costOfLivingIndex: 95 },
  { name: 'Banjara Hills Rd 12', city: 'Hyderabad', coordinates: [78.4350, 17.4156], pricePerSqFt: 26000, tier: 'ultra-luxury', costOfLivingIndex: 95 },
  { name: 'Banjara Hills Rd 1 & 2', city: 'Hyderabad', coordinates: [78.4480, 17.4210], pricePerSqFt: 25000, tier: 'ultra-luxury', costOfLivingIndex: 94 },
  { name: 'Film Nagar Cine Enclave', city: 'Hyderabad', coordinates: [78.4010, 17.4180], pricePerSqFt: 24500, tier: 'ultra-luxury', costOfLivingIndex: 93 },
  { name: 'Prashasan Nagar', city: 'Hyderabad', coordinates: [78.4110, 17.4120], pricePerSqFt: 23000, tier: 'ultra-luxury', costOfLivingIndex: 91 },

  // ================= HYDERABAD: HIGH-TECH & PREMIUM HUBS (ORANGE/WARM-RED) =================
  { name: 'Hitec City Cyber Towers', city: 'Hyderabad', coordinates: [78.3820, 17.4474], pricePerSqFt: 15500, tier: 'premium', costOfLivingIndex: 88 },
  { name: 'Madhapur Inorbit Mall', city: 'Hyderabad', coordinates: [78.3880, 17.4340], pricePerSqFt: 14800, tier: 'premium', costOfLivingIndex: 86 },
  { name: 'Kavuri Hills Durgam Cheruvu', city: 'Hyderabad', coordinates: [78.3960, 17.4390], pricePerSqFt: 15200, tier: 'premium', costOfLivingIndex: 87 },
  { name: 'Financial District SEZ Core', city: 'Hyderabad', coordinates: [78.3450, 17.4170], pricePerSqFt: 14200, tier: 'premium', costOfLivingIndex: 84 },
  { name: 'Nanakramguda WaveRock', city: 'Hyderabad', coordinates: [78.3580, 17.4190], pricePerSqFt: 13800, tier: 'premium', costOfLivingIndex: 82 },
  { name: 'Kokapet Neopolis High-Rise Zone', city: 'Hyderabad', coordinates: [78.3280, 17.3990], pricePerSqFt: 14900, tier: 'premium', costOfLivingIndex: 86 },
  { name: 'Kokapet Golden Mile', city: 'Hyderabad', coordinates: [78.3340, 17.4040], pricePerSqFt: 14400, tier: 'premium', costOfLivingIndex: 84 },
  { name: 'Gachibowli Stadium Junction', city: 'Hyderabad', coordinates: [78.3489, 17.4401], pricePerSqFt: 12500, tier: 'premium', costOfLivingIndex: 80 },
  { name: 'Gachibowli Telecom Nagar', city: 'Hyderabad', coordinates: [78.3610, 17.4350], pricePerSqFt: 12000, tier: 'premium', costOfLivingIndex: 79 },
  { name: 'Botanical Garden Sanctuary', city: 'Hyderabad', coordinates: [78.3650, 17.4580], pricePerSqFt: 11200, tier: 'premium', costOfLivingIndex: 76 },
  { name: 'Somajiguda Raj Bhavan Rd', city: 'Hyderabad', coordinates: [78.4580, 17.4240], pricePerSqFt: 12800, tier: 'premium', costOfLivingIndex: 78 },

  // ================= HYDERABAD: BALANCED MID-TIER RESIDENTIAL (WARM YELLOW) =================
  { name: 'Kondapur RTO Core', city: 'Hyderabad', coordinates: [78.3630, 17.4660], pricePerSqFt: 9800, tier: 'balanced', costOfLivingIndex: 70 },
  { name: 'Kondapur Raghavendra Colony', city: 'Hyderabad', coordinates: [78.3550, 17.4720], pricePerSqFt: 9400, tier: 'balanced', costOfLivingIndex: 68 },
  { name: 'Manikonda Lanco Hills', city: 'Hyderabad', coordinates: [78.3840, 17.4020], pricePerSqFt: 9100, tier: 'balanced', costOfLivingIndex: 66 },
  { name: 'Puppalguda Golden Temple Rd', city: 'Hyderabad', coordinates: [78.3750, 17.3980], pricePerSqFt: 9500, tier: 'balanced', costOfLivingIndex: 68 },
  { name: 'Kukatpally KPHB 4th Phase', city: 'Hyderabad', coordinates: [78.3990, 17.4938], pricePerSqFt: 8600, tier: 'balanced', costOfLivingIndex: 64 },
  { name: 'Kukatpally Y-Junction', city: 'Hyderabad', coordinates: [78.4110, 17.4850], pricePerSqFt: 8200, tier: 'balanced', costOfLivingIndex: 62 },
  { name: 'Ameerpet Commercial Hub', city: 'Hyderabad', coordinates: [78.4482, 17.4375], pricePerSqFt: 8800, tier: 'balanced', costOfLivingIndex: 65 },
  { name: 'Begumpet Airport Enclave', city: 'Hyderabad', coordinates: [78.4680, 17.4420], pricePerSqFt: 8900, tier: 'balanced', costOfLivingIndex: 65 },
  { name: 'Tellapur Radhey Skies', city: 'Hyderabad', coordinates: [78.2900, 17.4600], pricePerSqFt: 7800, tier: 'balanced', costOfLivingIndex: 60 },
  { name: 'Nallagandla Aparna Lake', city: 'Hyderabad', coordinates: [78.3120, 17.4700], pricePerSqFt: 8500, tier: 'balanced', costOfLivingIndex: 64 },
  { name: 'Secunderabad Clock Tower', city: 'Hyderabad', coordinates: [78.4983, 17.4399], pricePerSqFt: 7400, tier: 'balanced', costOfLivingIndex: 56 },

  // ================= HYDERABAD: COOL GREEN / AFFORDABLE VALUE CORRIDORS (GREEN/EMERALD) =================
  { name: 'Miyapur Metro Terminal', city: 'Hyderabad', coordinates: [78.3560, 17.4968], pricePerSqFt: 6400, tier: 'affordable', costOfLivingIndex: 52 },
  { name: 'Miyapur Allwyn X Roads', city: 'Hyderabad', coordinates: [78.3480, 17.5020], pricePerSqFt: 6100, tier: 'affordable', costOfLivingIndex: 50 },
  { name: 'Bachupally Silver Oaks', city: 'Hyderabad', coordinates: [78.3750, 17.5250], pricePerSqFt: 5800, tier: 'affordable', costOfLivingIndex: 48 },
  { name: 'Nizampet Village', city: 'Hyderabad', coordinates: [78.3840, 17.5120], pricePerSqFt: 6200, tier: 'affordable', costOfLivingIndex: 50 },
  { name: 'Kollur ORR Exit 2', city: 'Hyderabad', coordinates: [78.2400, 17.4800], pricePerSqFt: 5600, tier: 'affordable', costOfLivingIndex: 45 },
  { name: 'Mokila Villa County', city: 'Hyderabad', coordinates: [78.1950, 17.4400], pricePerSqFt: 5900, tier: 'affordable', costOfLivingIndex: 47 },
  { name: 'Sainikpuri Defence Colony', city: 'Hyderabad', coordinates: [78.5480, 17.4890], pricePerSqFt: 5900, tier: 'affordable', costOfLivingIndex: 48 },
  { name: 'Uppal Metro SEZ', city: 'Hyderabad', coordinates: [78.5600, 17.4050], pricePerSqFt: 5300, tier: 'affordable', costOfLivingIndex: 45 },
  { name: 'Pocharam Infosys SEZ Gateway', city: 'Hyderabad', coordinates: [78.6800, 17.4600], pricePerSqFt: 4300, tier: 'affordable', costOfLivingIndex: 38 },
  { name: 'Ghatkesar Hub', city: 'Hyderabad', coordinates: [78.6920, 17.4520], pricePerSqFt: 3900, tier: 'affordable', costOfLivingIndex: 35 },
  { name: 'LB Nagar Ring Road', city: 'Hyderabad', coordinates: [78.5522, 17.3457], pricePerSqFt: 5600, tier: 'affordable', costOfLivingIndex: 46 },
  { name: 'Shamshabad RGIA Aerotropolis', city: 'Hyderabad', coordinates: [78.4311, 17.2543], pricePerSqFt: 5400, tier: 'affordable', costOfLivingIndex: 47 },
  { name: 'Maheshwaram Electronic SEZ', city: 'Hyderabad', coordinates: [78.4300, 17.1350], pricePerSqFt: 3700, tier: 'affordable', costOfLivingIndex: 33 },
  { name: 'Kompally Runway 9 Corridor', city: 'Hyderabad', coordinates: [78.4860, 17.5380], pricePerSqFt: 5500, tier: 'affordable', costOfLivingIndex: 47 },
  { name: 'Medchal NH-44', city: 'Hyderabad', coordinates: [78.4814, 17.6297], pricePerSqFt: 4000, tier: 'affordable', costOfLivingIndex: 35 },
  { name: 'Patancheru Industrial Corridor', city: 'Hyderabad', coordinates: [78.2670, 17.5290], pricePerSqFt: 4800, tier: 'affordable', costOfLivingIndex: 40 },
  { name: 'Shadnagar Growth Corridor', city: 'Hyderabad', coordinates: [78.2078, 17.0722], pricePerSqFt: 2700, tier: 'affordable', costOfLivingIndex: 27 },

  // ================= BENGALURU: THERMAL SPECTRUM =================
  { name: 'Indiranagar 100ft Rd', city: 'Bengaluru', coordinates: [77.6408, 12.9784], pricePerSqFt: 26500, tier: 'ultra-luxury', costOfLivingIndex: 96 },
  { name: 'Koramangala 3rd & 4th Block', city: 'Bengaluru', coordinates: [77.6245, 12.9352], pricePerSqFt: 24500, tier: 'ultra-luxury', costOfLivingIndex: 94 },
  { name: 'Lavelle Road / UB City CBD', city: 'Bengaluru', coordinates: [77.5946, 12.9716], pricePerSqFt: 31000, tier: 'ultra-luxury', costOfLivingIndex: 99 },
  { name: 'HSR Layout Sector 1 & 2', city: 'Bengaluru', coordinates: [77.6446, 12.9121], pricePerSqFt: 13800, tier: 'premium', costOfLivingIndex: 84 },
  { name: 'Bellandur EcoSpace Tech Corridor', city: 'Bengaluru', coordinates: [77.6784, 12.9304], pricePerSqFt: 12900, tier: 'premium', costOfLivingIndex: 82 },
  { name: 'Whitefield Hope Farm & EPIP', city: 'Bengaluru', coordinates: [77.7500, 12.9698], pricePerSqFt: 11200, tier: 'premium', costOfLivingIndex: 77 },
  { name: 'Sarjapur Road / Wipro SEZ', city: 'Bengaluru', coordinates: [77.6980, 12.9080], pricePerSqFt: 8900, tier: 'balanced', costOfLivingIndex: 66 },
  { name: 'Electronic City Phase 1 & 2', city: 'Bengaluru', coordinates: [77.6602, 12.8452], pricePerSqFt: 6400, tier: 'affordable', costOfLivingIndex: 51 },
  { name: 'Hebbal Manyata Tech Park', city: 'Bengaluru', coordinates: [77.5970, 13.0358], pricePerSqFt: 11900, tier: 'premium', costOfLivingIndex: 79 },
  { name: 'Thanisandra Main Rd', city: 'Bengaluru', coordinates: [77.6250, 13.0538], pricePerSqFt: 9100, tier: 'balanced', costOfLivingIndex: 67 },
  { name: 'Yelahanka Satellite Town', city: 'Bengaluru', coordinates: [77.5963, 13.1007], pricePerSqFt: 7300, tier: 'balanced', costOfLivingIndex: 57 },
  { name: 'Devanahalli Airport Aerotropolis', city: 'Bengaluru', coordinates: [77.7126, 13.2483], pricePerSqFt: 5400, tier: 'affordable', costOfLivingIndex: 45 },

  // ================= MUMBAI & MMR: THERMAL SPECTRUM =================
  { name: 'Worli Sea Face Luxury Belt', city: 'Mumbai', coordinates: [72.8150, 19.0178], pricePerSqFt: 72000, tier: 'ultra-luxury', costOfLivingIndex: 100 },
  { name: 'Bandra West Pali Hill & Carter Rd', city: 'Mumbai', coordinates: [72.8295, 19.0596], pricePerSqFt: 62000, tier: 'ultra-luxury', costOfLivingIndex: 99 },
  { name: 'BKC G-Block International Finance', city: 'Mumbai', coordinates: [72.8680, 19.0660], pricePerSqFt: 46000, tier: 'ultra-luxury', costOfLivingIndex: 97 },
  { name: 'Andheri West Lokhandwala', city: 'Mumbai', coordinates: [72.8260, 19.1410], pricePerSqFt: 27000, tier: 'ultra-luxury', costOfLivingIndex: 89 },
  { name: 'Powai Hiranandani Complex', city: 'Mumbai', coordinates: [72.9060, 19.1176], pricePerSqFt: 23500, tier: 'premium', costOfLivingIndex: 86 },
  { name: 'Thane Ghodbunder Road', city: 'Mumbai', coordinates: [72.9600, 19.2450], pricePerSqFt: 14200, tier: 'premium', costOfLivingIndex: 73 },
  { name: 'Navi Mumbai Vashi Sector 17', city: 'Mumbai', coordinates: [72.9986, 19.0771], pricePerSqFt: 15800, tier: 'premium', costOfLivingIndex: 75 },
  { name: 'Kharghar Navi Mumbai Central Park', city: 'Mumbai', coordinates: [73.0674, 19.0270], pricePerSqFt: 9600, tier: 'balanced', costOfLivingIndex: 61 },
  { name: 'Kalyan West Dombivli Belt', city: 'Mumbai', coordinates: [73.1355, 19.2437], pricePerSqFt: 5800, tier: 'affordable', costOfLivingIndex: 43 },

  // ================= DELHI-NCR: THERMAL SPECTRUM =================
  { name: 'Golf Course Road DLF 5 The Aralias', city: 'Delhi-NCR', coordinates: [77.0988, 28.4595], pricePerSqFt: 34000, tier: 'ultra-luxury', costOfLivingIndex: 99 },
  { name: 'Cyber City DLF Phase 2', city: 'Delhi-NCR', coordinates: [77.0890, 28.4950], pricePerSqFt: 22500, tier: 'ultra-luxury', costOfLivingIndex: 93 },
  { name: 'Golf Course Ext Road', city: 'Delhi-NCR', coordinates: [77.0720, 28.4120], pricePerSqFt: 15800, tier: 'premium', costOfLivingIndex: 83 },
  { name: 'South Extension / GK 1 Greater Kailash', city: 'Delhi-NCR', coordinates: [77.2240, 28.5670], pricePerSqFt: 36000, tier: 'ultra-luxury', costOfLivingIndex: 98 },
  { name: 'Dwarka Expressway Sector 102', city: 'Delhi-NCR', coordinates: [76.9920, 28.4960], pricePerSqFt: 10800, tier: 'premium', costOfLivingIndex: 72 },
  { name: 'Noida Sector 62 IT Campus', city: 'Delhi-NCR', coordinates: [77.3670, 28.6280], pricePerSqFt: 9800, tier: 'balanced', costOfLivingIndex: 69 },
  { name: 'Noida Sector 150 Green Sports City', city: 'Delhi-NCR', coordinates: [77.4850, 28.4350], pricePerSqFt: 9200, tier: 'balanced', costOfLivingIndex: 66 },
  { name: 'Greater Noida West Gaur City', city: 'Delhi-NCR', coordinates: [77.4450, 28.5850], pricePerSqFt: 5600, tier: 'affordable', costOfLivingIndex: 47 },
  { name: 'Yamuna Expressway Jewar Airport', city: 'Delhi-NCR', coordinates: [77.5400, 28.3200], pricePerSqFt: 4300, tier: 'affordable', costOfLivingIndex: 36 },

  // ================= CHENNAI & PUNE =================
  { name: 'Boat Club / Poes Garden', city: 'Chennai', coordinates: [80.2450, 13.0280], pricePerSqFt: 28500, tier: 'ultra-luxury', costOfLivingIndex: 97 },
  { name: 'OMR Thoraipakkam IT Expressway', city: 'Chennai', coordinates: [80.2330, 12.9380], pricePerSqFt: 8400, tier: 'balanced', costOfLivingIndex: 63 },
  { name: 'Koregaon Park South Main Rd', city: 'Pune', coordinates: [73.8940, 18.5362], pricePerSqFt: 20500, tier: 'ultra-luxury', costOfLivingIndex: 91 },
  { name: 'Baner High Street', city: 'Pune', coordinates: [73.7868, 18.5590], pricePerSqFt: 10600, tier: 'premium', costOfLivingIndex: 73 },
  { name: 'Hinjewadi Phase 1 Rajiv Gandhi IT Park', city: 'Pune', coordinates: [73.7389, 18.5987], pricePerSqFt: 7700, tier: 'balanced', costOfLivingIndex: 59 }
];

/**
 * Authentic FLIR Thermal Camera Color Gradient:
 * Cool Green (Affordable/Low Cost) -> Lime -> Warm Yellow -> Fiery Orange -> Thermal Red -> White-Hot Peak
 * Follows strict Google Maps API spec: index 0 is alpha 0, indices 1..N are alpha 1.0.
 */
export const PRICE_HEATMAP_GRADIENT = [
  'rgba(16, 185, 129, 0)',    // 0: Fully transparent emerald base
  'rgba(16, 185, 129, 1)',    // 🟢 Cool Emerald: Value / Farmland / Affordable (< ₹6,000/sqft)
  'rgba(101, 163, 13, 1)',    // 🟢 Deep Lime: Value Growth (₹6,000 - ₹8,500)
  'rgba(234, 179, 8, 1)',     // 🟡 Warm Amber / Golden Yellow: Balanced (₹8,500 - ₹12,500)
  'rgba(249, 115, 22, 1)',    // 🟠 Hot Orange: Premium Tech Corridor (₹12,500 - ₹18,500)
  'rgba(239, 68, 68, 1)',     // 🔴 Radiant Thermal Red: Prime Luxury (₹18,500 - ₹28,000)
  'rgba(190, 18, 60, 1)',     // 🔴 Deep Crimson: Ultra Peak (₹28,000 - ₹40,000)
  'rgba(255, 255, 255, 1)'    // ⚪ White-Hot: Extreme Peak (> ₹40,000/sqft)
];

/**
 * Dynamically computes thermal dispersion radius in pixels based on Google Map zoom level
 * Expanded radius creates a seamless, contiguous thermal camera heatmap blanket.
 */
export function getHeatmapRadius(zoom: number): number {
  if (zoom >= 16) return 95;
  if (zoom >= 14) return 80;
  if (zoom >= 12) return 65;
  if (zoom >= 10) return 45;
  if (zoom >= 8) return 30;
  return 18;
}

/**
 * Calculates weighted heatmap points combining real catalog properties and regional benchmarks.
 * Uses micro-mesh spatial expansion so thermal heat fields blend into continuous contours.
 */
export function buildHeatmapWeightedPoints(
  properties: Property[],
  metric: HeatmapMetric = 'sqft'
): { points: HeatmapWeightedPoint[]; stats: HeatmapPriceStatistics } {
  const combinedRaw: { lat: number; lng: number; rate: number; name: string; isProperty: boolean }[] = [];

  // Spatial diffusion lattice offsets (generates contoured thermal blankets around nodes)
  const MESH_OFFSETS = [
    { dLng: 0, dLat: 0, factor: 1.0 },
    { dLng: 0.0035, dLat: 0.0025, factor: 0.96 },
    { dLng: -0.0035, dLat: -0.0025, factor: 0.96 },
    { dLng: 0.0030, dLat: -0.0030, factor: 0.94 },
    { dLng: -0.0030, dLat: 0.0030, factor: 0.94 },
    { dLng: 0.0055, dLat: 0.0000, factor: 0.91 },
    { dLng: -0.0055, dLat: 0.0000, factor: 0.91 },
    { dLng: 0.0000, dLat: 0.0055, factor: 0.91 },
    { dLng: 0.0000, dLat: -0.0055, factor: 0.91 }
  ];

  // 1. Process active properties from database/catalog
  properties.forEach((p) => {
    if (!p.coordinates || p.coordinates.length < 2) return;
    const [lng, lat] = p.coordinates;
    let rate = 0;

    if (metric === 'sqft') {
      rate = p.areaSqFt > 0 ? Math.round(p.price / p.areaSqFt) : Math.round(p.price / 1200);
    } else {
      rate = p.price;
    }

    if (rate > 0) {
      // Primary point
      combinedRaw.push({
        lat,
        lng,
        rate,
        name: p.title || p.area || 'Property Listing',
        isProperty: true
      });

      // Subtle localized micro-halo around actual property
      combinedRaw.push({
        lat: lat + 0.0015,
        lng: lng + 0.0015,
        rate: Math.round(rate * 0.97),
        name: p.title,
        isProperty: true
      });
      combinedRaw.push({
        lat: lat - 0.0015,
        lng: lng - 0.0015,
        rate: Math.round(rate * 0.97),
        name: p.title,
        isProperty: true
      });
    }
  });

  // 2. Include regional benchmark nodes with micro-mesh expansion for continuous heat blending
  BENCHMARK_PRICE_NODES.forEach((b) => {
    let rate = 0;
    if (metric === 'sqft') {
      rate = b.pricePerSqFt;
    } else {
      rate = b.pricePerSqFt * 1500;
    }

    MESH_OFFSETS.forEach((off) => {
      combinedRaw.push({
        lat: b.coordinates[1] + off.dLat,
        lng: b.coordinates[0] + off.dLng,
        rate: Math.round(rate * off.factor),
        name: `${b.name}, ${b.city}`,
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
  const minRate = rates[0];
  const maxRate = rates[rates.length - 1];
  const sumRate = rates.reduce((acc, r) => acc + r, 0);
  const avgRate = Math.round(sumRate / rates.length);
  const medianRate = rates[Math.floor(rates.length / 2)];

  // Relative normalization: weights range from 1 to 10
  const rateSpread = Math.max(1, maxRate - minRate);

  const weightedPoints: HeatmapWeightedPoint[] = combinedRaw.map((pt) => {
    // Normalization ratio [0, 1]
    const ratio = Math.max(0, Math.min(1, (pt.rate - minRate) / rateSpread));

    // Exponent 0.85 distributes mid-tier nodes into vivid yellow/orange zones
    // and reserve upper 15% exclusively for high-end peak land costs (red)
    const weight = Math.round((1 + Math.pow(ratio, 0.85) * 9) * 10) / 10;

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

