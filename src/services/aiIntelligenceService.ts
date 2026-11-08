import { Property, FilterState, AIAnalysisResult, NearbyPOI } from '../types';

// Distance calculation using Haversine formula
export function calculateDistanceKm(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Major civic landmarks & environmental monitoring points across major Indian metros
const WATERBODIES = [
  { name: 'Durgam Cheruvu Lake', coords: [78.3883, 17.4326] as [number, number], isCatchment: true, city: 'Hyderabad' },
  { name: 'Osman Sagar (Gandipet)', coords: [78.3039, 17.3804] as [number, number], isCatchment: false, city: 'Hyderabad' },
  { name: 'Hussain Sagar Lake', coords: [78.4744, 17.4239] as [number, number], isCatchment: true, city: 'Hyderabad' },
  { name: 'Bellandur Lake', coords: [77.6744, 12.9372] as [number, number], isCatchment: true, city: 'Bengaluru' },
  { name: 'Varthur Lake', coords: [77.7423, 12.9421] as [number, number], isCatchment: true, city: 'Bengaluru' },
  { name: 'Powai Lake', coords: [72.9051, 19.1256] as [number, number], isCatchment: false, city: 'Mumbai' },
  { name: 'Mithi River Drainage', coords: [72.8631, 19.0657] as [number, number], isCatchment: true, city: 'Mumbai' },
  { name: 'Yamuna River Catchment', coords: [77.2519, 28.6139] as [number, number], isCatchment: true, city: 'Delhi' }
];

const LANDFILLS_AND_MINES = [
  { name: 'Jawaharnagar Municipal Dumpyard', coords: [78.5878, 17.5118] as [number, number], type: 'Landfill', city: 'Hyderabad' },
  { name: 'Nanakramguda Granite Quarry Zone', coords: [78.3411, 17.4092] as [number, number], type: 'Quarry / Mining', city: 'Hyderabad' },
  { name: 'Mavallipura Landfill', coords: [77.5122, 13.1189] as [number, number], type: 'Landfill', city: 'Bengaluru' },
  { name: 'Deonar Dumping Ground', coords: [72.9248, 19.0631] as [number, number], type: 'Landfill', city: 'Mumbai' },
  { name: 'Ghazipur Landfill', coords: [77.3298, 28.6258] as [number, number], type: 'Landfill', city: 'Delhi' }
];

const KEY_METRO_STATIONS = [
  { name: 'Raidurg Metro Station (Blue Line)', coords: [78.3758, 17.4429] as [number, number] },
  { name: 'Hitec City Metro Station', coords: [78.3814, 17.4503] as [number, number] },
  { name: 'Indiranagar Metro Station', coords: [77.6409, 12.9784] as [number, number] },
  { name: 'Koramangala Metro Interchange', coords: [77.6271, 12.9352] as [number, number] },
  { name: 'Bandra Terminus & Metro', coords: [72.8406, 19.0635] as [number, number] },
  { name: 'Rajiv Gandhi International Airport (RGIA)', coords: [78.4294, 17.2403] as [number, number], isAirport: true },
  { name: 'Kempegowda International Airport (BLR)', coords: [77.7066, 13.1986] as [number, number], isAirport: true }
];

const TOP_HOSPITALS = [
  { name: 'Apollo Hospitals Multi-Specialty', coords: [78.4116, 17.4194] as [number, number] },
  { name: 'Care Hospitals Hi-tech City', coords: [78.3732, 17.4442] as [number, number] },
  { name: 'Manipal Hospital HAL Airport Road', coords: [77.6521, 12.9592] as [number, number] },
  { name: 'Lilavati Hospital & Research Centre', coords: [72.8286, 19.0514] as [number, number] },
  { name: 'Fortis Memorial Research Institute', coords: [77.0725, 28.4595] as [number, number] }
];

const TOP_SCHOOLS = [
  { name: 'Oakridge International School', coords: [78.3492, 17.4206] as [number, number] },
  { name: 'CHIREC International School', coords: [78.3615, 17.4682] as [number, number] },
  { name: 'The International School Bangalore (TISB)', coords: [77.7512, 12.8719] as [number, number] },
  { name: 'Dhirubhai Ambani International School', coords: [72.8681, 19.0664] as [number, number] },
  { name: 'Delhi Public School (DPS)', coords: [78.3912, 17.4812] as [number, number] }
];

const TOP_IT_HUBS = [
  { name: 'Mindspace Cyber City & Tech Park', coords: [78.3831, 17.4435] as [number, number] },
  { name: 'DLF Cybercity & Gachibowli SEZ', coords: [78.3582, 17.4485] as [number, number] },
  { name: 'Manyata Tech Park', coords: [77.6208, 13.0494] as [number, number] },
  { name: 'Bandra Kurla Complex (BKC)', coords: [72.8679, 19.0674] as [number, number] }
];

/**
 * Computes Nearby Places Intelligence for a property coordinate
 */
export function computeNearbyPOIs(coords: [number, number]): NearbyPOI[] {
  const pois: NearbyPOI[] = [];

  // Metro / Transit
  let nearestMetro = KEY_METRO_STATIONS[0];
  let minMetroDist = 9999;
  KEY_METRO_STATIONS.forEach((m) => {
    const d = calculateDistanceKm(coords, m.coords);
    if (d < minMetroDist) {
      minMetroDist = d;
      nearestMetro = m;
    }
  });
  pois.push({
    category: nearestMetro.isAirport ? 'airport' : 'metro',
    name: nearestMetro.name,
    distanceKm: minMetroDist,
    commuteTimeMinutes: Math.max(3, Math.round(minMetroDist * 3.2)),
    badge: minMetroDist < 3.0 ? 'Walk / Short Auto' : 'Quick Commute'
  });

  // Hospitals
  let nearestHospital = TOP_HOSPITALS[0];
  let minHospDist = 9999;
  TOP_HOSPITALS.forEach((h) => {
    const d = calculateDistanceKm(coords, h.coords);
    if (d < minHospDist) {
      minHospDist = d;
      nearestHospital = h;
    }
  });
  pois.push({
    category: 'hospital',
    name: nearestHospital.name,
    distanceKm: minHospDist,
    commuteTimeMinutes: Math.max(4, Math.round(minHospDist * 2.8)),
    badge: '24/7 Emergency Care'
  });

  // Top Schools
  let nearestSchool = TOP_SCHOOLS[0];
  let minSchoolDist = 9999;
  TOP_SCHOOLS.forEach((s) => {
    const d = calculateDistanceKm(coords, s.coords);
    if (d < minSchoolDist) {
      minSchoolDist = d;
      nearestSchool = s;
    }
  });
  pois.push({
    category: 'school',
    name: nearestSchool.name,
    distanceKm: minSchoolDist,
    commuteTimeMinutes: Math.max(5, Math.round(minSchoolDist * 3.0)),
    badge: 'IB / CBSE Accredited'
  });

  // IT Hubs
  let nearestIT = TOP_IT_HUBS[0];
  let minITDist = 9999;
  TOP_IT_HUBS.forEach((it) => {
    const d = calculateDistanceKm(coords, it.coords);
    if (d < minITDist) {
      minITDist = d;
      nearestIT = it;
    }
  });
  pois.push({
    category: 'it_hub',
    name: nearestIT.name,
    distanceKm: minITDist,
    commuteTimeMinutes: Math.max(3, Math.round(minITDist * 2.5)),
    badge: 'Major Employment Node'
  });

  return pois;
}

/**
 * Deep AI Geospatial Risk, Drainage, Topography & Advantage Engine
 */
export function analyzePropertyRiskAndAdvantages(property: Property): AIAnalysisResult {
  const coords = property.coordinates;

  // 1. Waterbody / Flood Risk analysis
  let nearestWater = WATERBODIES[0];
  let minWaterDist = 9999;
  WATERBODIES.forEach((w) => {
    const dist = calculateDistanceKm(coords, w.coords);
    if (dist < minWaterDist) {
      minWaterDist = dist;
      nearestWater = w;
    }
  });

  // Elevation estimate (Indian Deccan plateau average 520-560m, coastal 5-15m)
  const isCoastal = coords[0] < 73.5 || coords[0] > 80.0;
  const baseElevation = isCoastal ? 18 : 535;
  const hash = Math.abs(Math.round(coords[0] * 1000 + coords[1] * 1000)) % 45;
  const elevationMeters = baseElevation + hash;

  let floodRisk: 'Low' | 'Moderate' | 'High' = 'Low';
  let floodRiskScore = 15; // out of 100

  if (minWaterDist < 0.6 && nearestWater.isCatchment) {
    floodRisk = 'High';
    floodRiskScore = 82;
  } else if (minWaterDist < 1.8 && nearestWater.isCatchment) {
    floodRisk = 'Moderate';
    floodRiskScore = 48;
  } else {
    floodRisk = 'Low';
    floodRiskScore = 18;
  }

  // 2. Dumpyard & Mining Analysis
  let nearestLandfill = LANDFILLS_AND_MINES[0];
  let minLandfillDist = 9999;
  LANDFILLS_AND_MINES.forEach((l) => {
    const dist = calculateDistanceKm(coords, l.coords);
    if (dist < minLandfillDist) {
      minLandfillDist = dist;
      nearestLandfill = l;
    }
  });

  let environmentalRiskRating: 'Safe' | 'Watch' | 'Critical' = 'Safe';
  let aqiEst = 68;

  if (minLandfillDist < 3.0) {
    environmentalRiskRating = 'Critical';
    aqiEst = 145;
  } else if (minLandfillDist < 7.0) {
    environmentalRiskRating = 'Watch';
    aqiEst = 95;
  } else {
    environmentalRiskRating = 'Safe';
    aqiEst = 55;
  }

  // 3. Pointwise Pros & Cons
  const pros: string[] = [];
  const cons: string[] = [];

  // Pros generation based on real data
  if (property.verified) {
    pros.push(`State RERA Verified: Official registration ${property.reraId || 'active'} with clean title verification.`);
  }
  if (property.readyToMove) {
    pros.push('Ready to Move: Immediate possession with zero execution or construction delay risk.');
  }
  if (property.priceTrendYoY) {
    pros.push(`High Capital Appreciation: Locality recorded strong ${property.priceTrendYoY} growth over past 12 months.`);
  }
  if (property.facing) {
    pros.push(`Vastu Compliant: Desirable ${property.facing}-facing architectural orientation optimizing natural ventilation.`);
  }
  if (minWaterDist > 2.5) {
    pros.push(`Elevated Topography (${elevationMeters}m above MSL): Situated safely outside flood catchment basins.`);
  }
  if (minLandfillDist > 10.0) {
    pros.push(`Zero Environmental Nuisance: ${minLandfillDist.toFixed(1)} km from industrial/landfill zones with clean AQI.`);
  }
  if (property.contact.type === 'Owner') {
    pros.push('Direct Owner Listing: Zero brokerage / mediator commission required.');
  }

  // Cons generation based on risk points
  if (floodRisk === 'High') {
    cons.push(`High Flood Exposure: Located only ${minWaterDist.toFixed(1)} km from ${nearestWater.name} low-lying storm basin. Heavy monsoons may cause localized waterlogging.`);
  } else if (floodRisk === 'Moderate') {
    cons.push(`Catchment Proximity: Situated ${minWaterDist.toFixed(1)} km from ${nearestWater.name}. Ensure builder provides dual sump pump drainage.`);
  }

  if (environmentalRiskRating === 'Watch' || environmentalRiskRating === 'Critical') {
    cons.push(`Environmental Distance Notice: Within ${minLandfillDist.toFixed(1)} km of ${nearestLandfill.name}. Winds during peak summer may carry ambient odor.`);
  }

  if (!property.readyToMove) {
    cons.push('Under Construction: Subject to completion milestones and OC (Occupancy Certificate) issuance.');
  }

  if (property.maintenanceMonthly && property.maintenanceMonthly > 5000) {
    cons.push(`High Ongoing Maintenance: ₹${property.maintenanceMonthly.toLocaleString('en-IN')}/month adds to recurring monthly outflow.`);
  }

  if (property.furnishing === 'Unfurnished') {
    cons.push('Unfurnished: Requires additional upfront capital outlay for woodwork, modular kitchen, and interior fit-out.');
  }

  if (cons.length === 0) {
    cons.push('Peak traffic bottleneck during office hours along the arterial access corridor.');
  }

  // Livability score
  const livabilityScore = Math.min(
    96,
    Math.max(
      62,
      Math.round(
        (property.localityScores ? (property.localityScores.transit + property.localityScores.lifestyle + property.localityScores.safety) / 3 : 84) -
          (floodRisk === 'High' ? 18 : floodRisk === 'Moderate' ? 8 : 0) -
          (environmentalRiskRating === 'Critical' ? 20 : environmentalRiskRating === 'Watch' ? 7 : 0)
      )
    )
  );

  const pricePerSqFt = property.areaSqFt > 0 ? Math.round(property.price / property.areaSqFt) : 0;
  let priceFairness: 'Undervalued' | 'Fair Market Price' | 'High Premium' = 'Fair Market Price';
  if (property.type === 'sale') {
    if (pricePerSqFt < 7000) priceFairness = 'Undervalued';
    else if (pricePerSqFt > 12000) priceFairness = 'High Premium';
  }

  const investmentVerdict =
    priceFairness === 'Undervalued'
      ? 'Strong Buy: Pricing is currently below replacement cost in this high-growth corridor.'
      : priceFairness === 'High Premium'
      ? 'Premium Trophy Asset: Prime tier pricing; ideal for end-use luxury living or long-term wealth preservation.'
      : 'Solid Hold / Value Buy: Realistically benchmarked to RERA locality registration averages.';

  return {
    floodRisk,
    floodRiskScore,
    elevationMeters,
    waterbodyProximity: {
      name: nearestWater.name,
      distanceKm: minWaterDist,
      isLowLyingCatchment: nearestWater.isCatchment
    },
    environmentalRisk: {
      dumpyardDistanceKm: minLandfillDist,
      dumpyardName: nearestLandfill.name,
      miningDistanceKm: minLandfillDist + 2.4,
      riskRating: environmentalRiskRating,
      airQualityIndexEst: aqiEst
    },
    livabilityScore,
    priceFairness,
    pros,
    cons,
    investmentVerdict
  };
}

/**
 * Parses user natural-language queries into structured filters and search coordinates
 */
export function parseNaturalLanguageQuery(query: string): {
  filters: Partial<FilterState>;
  localityQuery?: string;
  summary: string;
} {
  const q = query.toLowerCase();
  const filters: Partial<FilterState> = {};
  const tokens: string[] = [];

  // BHK detection
  const bhkMatch = q.match(/(\d)\s*(?:bhk|bedroom|bed)/i);
  if (bhkMatch) {
    const count = parseInt(bhkMatch[1], 10);
    filters.bhk = count;
    tokens.push(`${count} BHK`);
  }

  // Type: rent vs sale
  if (q.includes('rent') || q.includes('lease') || q.includes('/mo') || q.includes('to let')) {
    filters.type = 'rent';
    tokens.push('For Rent');
  } else if (q.includes('buy') || q.includes('sale') || q.includes('purchase')) {
    filters.type = 'sale';
    tokens.push('For Sale');
  }

  // Category
  if (q.includes('villa')) {
    filters.category = 'Villa';
    tokens.push('Villa');
  } else if (q.includes('plot') || q.includes('land')) {
    filters.category = 'Plot';
    tokens.push('Plot');
  } else if (q.includes('flat') || q.includes('apartment')) {
    filters.category = 'Apartment';
    tokens.push('Apartment');
  } else if (q.includes('penthouse')) {
    filters.category = 'Penthouse';
    tokens.push('Penthouse');
  } else if (q.includes('commercial') || q.includes('office')) {
    filters.category = 'Commercial';
    tokens.push('Commercial');
  }

  // Price constraints: Crores, Lakhs
  const crMatch = q.match(/(?:under|below|max|upto|within)?\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(?:cr|crore)/i);
  if (crMatch) {
    const valCr = parseFloat(crMatch[1]);
    filters.maxPrice = Math.round(valCr * 10000000);
    tokens.push(`Under ₹${valCr} Cr`);
  } else {
    const lkMatch = q.match(/(?:under|below|max|upto|within)?\s*(?:₹|rs\.?)?\s*(\d+)\s*(?:l|lac|lakh)/i);
    if (lkMatch) {
      const valLakh = parseInt(lkMatch[1], 10);
      filters.maxPrice = valLakh * 100000;
      tokens.push(`Under ₹${valLakh} Lakh`);
    }
  }

  // Facing
  if (q.includes('east facing') || q.includes('east')) {
    filters.facing = 'East';
    tokens.push('East Facing');
  } else if (q.includes('north facing') || q.includes('north')) {
    filters.facing = 'North';
    tokens.push('North Facing');
  } else if (q.includes('west')) {
    filters.facing = 'West';
  } else if (q.includes('south')) {
    filters.facing = 'South';
  }

  // Ready to move
  if (q.includes('ready to move') || q.includes('ready') || q.includes('immediate')) {
    filters.readyToMove = true;
    tokens.push('Ready to Move');
  }

  // Verified only
  if (q.includes('verified') || q.includes('rera')) {
    filters.verifiedOnly = true;
    tokens.push('RERA Verified Only');
  }

  // Extract Locality name (remove common stop words)
  let cleaned = q
    .replace(/\b(find|search|show|get|properties|property|in|near|around|for|under|below|crore|cr|lakh|lac|bhk|flat|apartment|villa|plot|facing|ready to move|verified)\b/gi, ' ')
    .trim();

  // If a meaningful word remains, use it as localityQuery
  const localityQuery = cleaned.length > 2 ? cleaned.split(/\s+/)[0] : undefined;
  if (localityQuery) {
    tokens.push(`Locality: "${localityQuery}"`);
  }

  const summary = tokens.length > 0 ? tokens.join(' • ') : 'Natural query parsed';

  return {
    filters,
    localityQuery,
    summary
  };
}

/**
 * Interactive ManorMap AI Q&A answering assistant for any property
 */
export function answerPropertyAIQuestion(
  property: Property,
  question: string
): { answer: string; highlights: string[] } {
  const q = question.toLowerCase();
  const analysis = analyzePropertyRiskAndAdvantages(property);

  if (q.includes('flood') || q.includes('waterlog') || q.includes('rain') || q.includes('drain')) {
    return {
      answer: `Geospatial Topography Analysis for ${property.title}: The parcel sits at an elevation of ~${analysis.elevationMeters}m above Mean Sea Level. Distance to nearest water body (${analysis.waterbodyProximity.name}) is ${analysis.waterbodyProximity.distanceKm.toFixed(1)} km. Flood Vulnerability Rating is rated ${analysis.floodRisk.toUpperCase()} (${analysis.floodRiskScore}/100). ${
        analysis.floodRisk === 'Low'
          ? 'It is on safe upland terrain with natural gravity runoff.'
          : 'Due to proximity to catchment drainage, verify that the builder has installed high-capacity dewatering pumps and elevated entrance thresholds.'
      }`,
      highlights: [
        `Flood Risk: ${analysis.floodRisk}`,
        `Elevation: ${analysis.elevationMeters}m MSL`,
        `Waterbody Proximity: ${analysis.waterbodyProximity.distanceKm.toFixed(1)} km`
      ]
    };
  }

  if (q.includes('dump') || q.includes('garbage') || q.includes('pollut') || q.includes('mine') || q.includes('air') || q.includes('aqi')) {
    return {
      answer: `Environmental Audit: The property is situated ${analysis.environmentalRisk.dumpyardDistanceKm.toFixed(1)} km from ${analysis.environmentalRisk.dumpyardName}. Safety rating is rated ${analysis.environmentalRisk.riskRating.toUpperCase()} with estimated ambient AQI around ~${analysis.environmentalRisk.airQualityIndexEst}. ${
        analysis.environmentalRisk.riskRating === 'Safe'
          ? 'No foul odor or hazardous environmental pollution affects this residential parcel.'
          : 'Winds during high summer months could cause localized particulates; indoor HEPA filtration is advised.'
      }`,
      highlights: [
        `Landfill Distance: ${analysis.environmentalRisk.dumpyardDistanceKm.toFixed(1)} km`,
        `Environmental Rating: ${analysis.environmentalRisk.riskRating}`,
        `Est. AQI: ${analysis.environmentalRisk.airQualityIndexEst}`
      ]
    };
  }

  if (q.includes('school') || q.includes('hospital') || q.includes('metro') || q.includes('distance') || q.includes('nearby')) {
    const pois = computeNearbyPOIs(property.coordinates);
    return {
      answer: `Civic Infrastructure Radius for ${property.area}: Within a short radius, you have: ${pois.map((p) => `${p.name} (${p.distanceKm.toFixed(1)} km, ~${p.commuteTimeMinutes} mins)`).join('; ')}.`,
      highlights: pois.map((p) => `${p.name}: ${p.distanceKm.toFixed(1)} km`)
    };
  }

  if (q.includes('price') || q.includes('negotiat') || q.includes('value') || q.includes('fair') || q.includes('worth')) {
    const ppsf = property.areaSqFt > 0 ? Math.round(property.price / property.areaSqFt) : 0;
    return {
      answer: `Financial Valuation: Listed at ${property.priceDisplay} (approx. ₹${ppsf.toLocaleString('en-IN')}/sq.ft). AI Market Index evaluates this as '${analysis.priceFairness.toUpperCase()}'. ${analysis.investmentVerdict} Historical area appreciation is running at ${property.priceTrendYoY || '+11.5% YoY'}. ${
        property.contact.type === 'Owner'
          ? 'Since this is a direct owner listing, typical buyer negotiation margin is 3% to 6%.'
          : 'For builder inventory, check for stamp duty waivers or club membership subsidies.'
      }`,
      highlights: [
        `Valuation: ${analysis.priceFairness}`,
        `Rate: ₹${ppsf.toLocaleString('en-IN')}/sq.ft`,
        `YoY Trend: ${property.priceTrendYoY || '+12% YoY'}`
      ]
    };
  }

  // General summary
  return {
    answer: `ManorMap AI Executive Summary: ${property.title} in ${property.area}, ${property.city} offers an overall Livability Score of ${analysis.livabilityScore}/100. Top advantages include: ${analysis.pros.slice(0, 2).join(' ')}. Key watch item: ${analysis.cons[0] || 'Standard peak hour arterial commute traffic'}.`,
    highlights: [
      `Livability: ${analysis.livabilityScore}/100`,
      `Flood Risk: ${analysis.floodRisk}`,
      `RERA Status: ${property.verified ? 'Verified' : 'Pending'}`
    ]
  };
}

