import {
  AgentToolName,
  MapContextSnapshot,
  Property
} from '../types';
import { getAllProperties } from './propertyService';
import {
  resolveLocality,
  getAllLocalities,
  compareTwoLocalities
} from './localityIntelligenceService';
import { calculateInvestmentIntelligence } from './investmentAnalysisService';
import {
  analyzePropertyRiskAndAdvantages,
  computeNearbyPOIs,
  calculateDistanceKm
} from './aiIntelligenceService';
import { searchLocations } from './geocoding';

/**
 * OpenRouter / OpenAI Compatible Tool Definitions (Function Calling Schema)
 */
export const AGENT_TOOLS_DEFINITIONS = [
  // 1. Navigation Tools
  {
    type: 'function',
    function: {
      name: 'get_current_map_state',
      description: 'Get current Google Maps viewport status, center coordinates, zoom level, visible properties, active filters, and layers.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_location',
      description: 'Geocode an Indian city, neighborhood, locality, or landmark to retrieve its coordinates and bounding box.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Location name e.g. Gachibowli, Raidurg Metro, Bandra West, Indiranagar' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'move_map',
      description: 'Smoothly pans and centers the live Google Map in the browser to specified latitude/longitude coordinates and zoom level.',
      parameters: {
        type: 'object',
        properties: {
          lat: { type: 'number', description: 'Latitude coordinate' },
          lng: { type: 'number', description: 'Longitude coordinate' },
          zoom: { type: 'number', description: 'Target zoom level (e.g. 12 for city, 14 for locality, 16 for property)' }
        },
        required: ['lat', 'lng']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'fit_map_bounds',
      description: 'Adjusts Google Map camera so all given coordinates, listings, or locality bounds fit completely within the viewport.',
      parameters: {
        type: 'object',
        properties: {
          minLat: { type: 'number' },
          minLng: { type: 'number' },
          maxLat: { type: 'number' },
          maxLng: { type: 'number' }
        },
        required: ['minLat', 'minLng', 'maxLat', 'maxLng']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'set_map_zoom',
      description: 'Sets the zoom level of the Google Map instance.',
      parameters: {
        type: 'object',
        properties: {
          zoom: { type: 'number', description: 'Zoom level between 3 and 20' }
        },
        required: ['zoom']
      }
    }
  },

  // 2. Property Tools
  {
    type: 'function',
    function: {
      name: 'search_properties',
      description: 'Search actual verified property listings in the database using geographical and parameter filters.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Locality or keyword search query' },
          city: { type: 'string', description: 'City name e.g. Hyderabad, Bengaluru, Mumbai' },
          bhk: { type: 'number', description: 'Number of bedrooms (e.g. 2, 3, 4)' },
          maxPrice: { type: 'number', description: 'Maximum price in INR (e.g. 8000000 for ₹80 Lakhs, 20000000 for ₹2 Cr)' },
          minPrice: { type: 'number', description: 'Minimum price in INR' },
          category: { type: 'string', enum: ['Apartment', 'Villa', 'Independent House', 'Plot', 'Commercial', 'Penthouse'] },
          type: { type: 'string', enum: ['sale', 'rent'], description: 'Transaction purpose' },
          verifiedOnly: { type: 'boolean', description: 'Only show government RERA and identity-verified properties' },
          readyToMove: { type: 'boolean', description: 'Only show ready-to-move properties' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_property_details',
      description: 'Retrieve full architectural, pricing, and contact details for a specific property ID.',
      parameters: {
        type: 'object',
        properties: {
          propertyId: { type: 'string', description: 'The unique ID of the property' }
        },
        required: ['propertyId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_property_comparables',
      description: 'Find similar nearby listings in the same micro-market with price comparisons and variance.',
      parameters: {
        type: 'object',
        properties: {
          propertyId: { type: 'string', description: 'Reference property ID' }
        },
        required: ['propertyId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'compare_properties',
      description: 'Perform a side-by-side comparative analysis of two or more real property listings.',
      parameters: {
        type: 'object',
        properties: {
          propertyIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of property IDs to compare (2 to 4 properties)'
          }
        },
        required: ['propertyIds']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'select_property',
      description: 'Selects the property in the map interface, centers the map, and opens its interactive preview card.',
      parameters: {
        type: 'object',
        properties: {
          propertyId: { type: 'string', description: 'Property ID to select' }
        },
        required: ['propertyId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'highlight_properties',
      description: 'Visually highlights specific property markers on the Google Map in the user browser.',
      parameters: {
        type: 'object',
        properties: {
          propertyIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of property IDs to illuminate on the map'
          }
        },
        required: ['propertyIds']
      }
    }
  },

  // 3. Locality Intelligence Tools
  {
    type: 'function',
    function: {
      name: 'get_locality_intelligence',
      description: 'Analyze an Indian locality: returns overall Neighborhood Intelligence Score (out of 100), 6-dimension breakdown (connectivity, schools, healthcare, IT jobs, environment, infrastructure), and key highlights.',
      parameters: {
        type: 'object',
        properties: {
          localityName: { type: 'string', description: 'Name of the locality e.g. Gachibowli, Kondapur, Indiranagar' }
        },
        required: ['localityName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_nearby_places',
      description: 'Computes distances and travel commute times to hospitals, metro stations, international schools, and IT hubs from a coordinate or locality.',
      parameters: {
        type: 'object',
        properties: {
          lat: { type: 'number' },
          lng: { type: 'number' },
          localityName: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calculate_travel_time',
      description: 'Calculate driving and transit commute time between two points in minutes and kilometers.',
      parameters: {
        type: 'object',
        properties: {
          origin: { type: 'array', items: { type: 'number' }, description: '[lng, lat]' },
          destination: { type: 'array', items: { type: 'number' }, description: '[lng, lat]' }
        },
        required: ['origin', 'destination']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_environmental_risk',
      description: 'Evaluate elevation above MSL, flood waterbody/lake catchment proximity, and municipal landfill / quarry distance.',
      parameters: {
        type: 'object',
        properties: {
          lat: { type: 'number' },
          lng: { type: 'number' },
          propertyId: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_locality_price_statistics',
      description: 'Retrieve reliable historical price progression over 3, 6, 12, and 24 months, YoY appreciation, and future forecasts for a locality.',
      parameters: {
        type: 'object',
        properties: {
          localityName: { type: 'string' }
        },
        required: ['localityName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calculate_investment_metrics',
      description: 'Calculate comprehensive financial metrics: gross/net rental yield, break-even period, 10-year appreciation scenarios, and full Buy vs Rent decision analysis.',
      parameters: {
        type: 'object',
        properties: {
          purchasePrice: { type: 'number', description: 'Purchase price in INR' },
          expectedMonthlyRent: { type: 'number', description: 'Expected monthly rent in INR' },
          downPaymentPercent: { type: 'number', description: 'Percentage down payment (default 20)' },
          interestRate: { type: 'number', description: 'Home loan interest rate % p.a. (default 8.5)' },
          tenureYears: { type: 'number', description: 'Loan tenure in years (default 20)' }
        },
        required: ['purchasePrice']
      }
    }
  },

  // 4. Visual Map Tools
  {
    type: 'function',
    function: {
      name: 'set_map_layer',
      description: 'Change the active Google Map visual layer: roadmap, satellite, hybrid, or terrain.',
      parameters: {
        type: 'object',
        properties: {
          layer: {
            type: 'string',
            enum: ['roadmap', 'satellite', 'hybrid', 'terrain'],
            description: 'Target map layer'
          }
        },
        required: ['layer']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'draw_map_polygon',
      description: 'Draws a highlighted geographical boundary polygon on the browser Google Map to indicate an area or search perimeter.',
      parameters: {
        type: 'object',
        properties: {
          coordinates: {
            type: 'array',
            items: { type: 'array', items: { type: 'number' } },
            description: 'Array of [lng, lat] vertices forming the polygon'
          },
          color: { type: 'string', description: 'Hex color code (e.g. #2563eb)' },
          label: { type: 'string', description: 'Label for the polygon' }
        },
        required: ['coordinates']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'highlight_area',
      description: 'Focuses and highlights a named locality on the map with a glowing boundary envelope.',
      parameters: {
        type: 'object',
        properties: {
          localityName: { type: 'string', description: 'Locality to highlight' }
        },
        required: ['localityName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'show_route',
      description: 'Draws a transit or driving route path on the map between two coordinates.',
      parameters: {
        type: 'object',
        properties: {
          origin: { type: 'array', items: { type: 'number' }, description: '[lng, lat]' },
          destination: { type: 'array', items: { type: 'number' }, description: '[lng, lat]' },
          mode: { type: 'string', enum: ['driving', 'transit', 'walking'] }
        },
        required: ['origin', 'destination']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'apply_map_filters',
      description: 'Applies real property filters (BHK, category, price, purpose, verified) to the live ManorMap UI and markers.',
      parameters: {
        type: 'object',
        properties: {
          bhk: { type: 'number' },
          category: { type: 'string' },
          maxPrice: { type: 'number' },
          minPrice: { type: 'number' },
          type: { type: 'string', enum: ['all', 'sale', 'rent'] },
          verifiedOnly: { type: 'boolean' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'clear_map_highlights',
      description: 'Clears all AI temporary highlights and polygon overlays without affecting user surveyor work.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  }
];

/**
 * Checks if a tool requires physical execution in the browser's Google Maps instance
 */
export function isBrowserMapTool(toolName: string): boolean {
  return [
    'move_map',
    'fit_map_bounds',
    'set_map_zoom',
    'select_property',
    'highlight_properties',
    'set_map_layer',
    'draw_map_polygon',
    'highlight_area',
    'show_route',
    'apply_map_filters',
    'clear_map_highlights'
  ].includes(toolName);
}

/**
 * Executes server-side / authoritative data tools
 */
export async function executeServerTool(
  toolName: AgentToolName,
  args: any,
  mapContext: MapContextSnapshot
): Promise<any> {
  switch (toolName) {
    case 'get_current_map_state':
      return {
        center: mapContext.center,
        zoom: mapContext.zoom,
        visiblePropertiesCount: mapContext.visiblePropertiesCount,
        activeFilters: mapContext.activeFilters,
        selectedProperty: mapContext.selectedProperty ? mapContext.selectedProperty.title : null,
        activeOverlays: {
          radius: mapContext.radiusSearch.active ? `${mapContext.radiusSearch.radiusKm} km` : null,
          polygon: mapContext.polygonSearch.active,
          surveyor: false
        }
      };

    case 'search_location': {
      const results = await searchLocations(args.query);
      if (results && results.length > 0) {
        return {
          found: true,
          location: results[0].title,
          coordinates: results[0].coordinates,
          type: results[0].type
        };
      }
      // Check registered localities
      const loc = resolveLocality(args.query);
      if (loc) {
        return {
          found: true,
          location: `${loc.name}, ${loc.city}`,
          coordinates: loc.coordinates,
          bounds: loc.bounds,
          avgPriceSqFt: loc.avgPricePerSqFt
        };
      }
      return { found: false, message: `Could not geocode location '${args.query}'` };
    }

    case 'search_properties': {
      let all = getAllProperties();
      if (args.city) {
        all = all.filter((p) => p.city.toLowerCase().includes(args.city.toLowerCase()));
      }
      if (args.query) {
        const q = args.query.toLowerCase();
        all = all.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.area.toLowerCase().includes(q) ||
            p.city.toLowerCase().includes(q)
        );
      }
      if (args.bhk) {
        all = all.filter((p) => p.bhk === args.bhk);
      }
      if (args.maxPrice) {
        all = all.filter((p) => p.price <= args.maxPrice);
      }
      if (args.minPrice) {
        all = all.filter((p) => p.price >= args.minPrice);
      }
      if (args.category) {
        all = all.filter((p) => p.category.toLowerCase() === args.category.toLowerCase());
      }
      if (args.type && args.type !== 'all') {
        all = all.filter((p) => p.type === args.type);
      }
      if (args.verifiedOnly) {
        all = all.filter((p) => p.verified);
      }
      if (args.readyToMove) {
        all = all.filter((p) => p.readyToMove);
      }

      return {
        matchedCount: all.length,
        properties: all.slice(0, 8).map((p) => ({
          id: p.id,
          title: p.title,
          priceDisplay: p.priceDisplay,
          price: p.price,
          area: p.area,
          city: p.city,
          bhk: p.bhk,
          category: p.category,
          areaSqFt: p.areaSqFt,
          verified: p.verified,
          readyToMove: p.readyToMove,
          coordinates: p.coordinates
        }))
      };
    }

    case 'get_property_details': {
      const all = getAllProperties();
      const prop = all.find((p) => p.id === args.propertyId);
      if (!prop) {
        return { error: `Property with ID '${args.propertyId}' not found.` };
      }
      const risk = analyzePropertyRiskAndAdvantages(prop);
      const pois = computeNearbyPOIs(prop.coordinates);
      return {
        ...prop,
        aiAnalysis: risk,
        nearbyPOIs: pois
      };
    }

    case 'get_property_comparables': {
      const all = getAllProperties();
      const ref = all.find((p) => p.id === args.propertyId);
      if (!ref) {
        return { error: 'Reference property not found' };
      }
      const comparables = all
        .filter((p) => p.id !== ref.id && (p.area === ref.area || p.city === ref.city))
        .slice(0, 4)
        .map((p) => {
          const refPpsf = ref.areaSqFt > 0 ? ref.price / ref.areaSqFt : 0;
          const pPpsf = p.areaSqFt > 0 ? p.price / p.areaSqFt : 0;
          const variance = refPpsf > 0 ? Math.round(((pPpsf - refPpsf) / refPpsf) * 100) : 0;
          return {
            id: p.id,
            title: p.title,
            priceDisplay: p.priceDisplay,
            areaSqFt: p.areaSqFt,
            pricePerSqFt: Math.round(pPpsf),
            priceVariancePercent: variance > 0 ? `+${variance}%` : `${variance}%`
          };
        });
      return { referenceProperty: ref.title, comparables };
    }

    case 'compare_properties': {
      const all = getAllProperties();
      const selected = all.filter((p) => args.propertyIds?.includes(p.id));
      if (selected.length < 2) {
        return { error: 'Please provide at least 2 valid property IDs for comparison' };
      }
      return {
        comparedCount: selected.length,
        properties: selected.map((p) => {
          const analysis = analyzePropertyRiskAndAdvantages(p);
          return {
            id: p.id,
            title: p.title,
            priceDisplay: p.priceDisplay,
            pricePerSqFt: p.areaSqFt > 0 ? Math.round(p.price / p.areaSqFt) : 0,
            bhk: p.bhk,
            areaSqFt: p.areaSqFt,
            facing: p.facing || 'East',
            floodRisk: analysis.floodRisk,
            topAdvantage: analysis.pros[0],
            watchpoint: analysis.cons[0]
          };
        })
      };
    }

    case 'get_locality_intelligence': {
      if (args.compareWith) {
        return compareTwoLocalities(args.localityName, args.compareWith);
      }
      if (!args.localityName) {
        return getAllLocalities();
      }
      const loc = resolveLocality(args.localityName);
      if (!loc) {
        return {
          found: false,
          availableLocalities: getAllLocalities().map((l) => l.name),
          message: `Locality '${args.localityName}' not in local catalog. Available key localities: Gachibowli, Kondapur, Hitec City, Indiranagar, Whitefield, Bandra West, Golf Course Road.`
        };
      }
      return loc;
    }

    case 'get_locality_price_statistics': {
      const loc = resolveLocality(args.localityName);
      if (!loc) {
        return { error: `Locality '${args.localityName}' not found` };
      }
      return {
        locality: loc.name,
        city: loc.city,
        currentAvgPricePerSqFt: `₹${loc.avgPricePerSqFt.toLocaleString('en-IN')}`,
        rentalYield: `${loc.rentalYieldPercent}%`,
        appreciationLast12M: loc.appreciationLabel,
        historicalPrices: loc.historicalPrices,
        futureProjections: loc.futureProjections
      };
    }

    case 'calculate_investment_metrics': {
      const roi = calculateInvestmentIntelligence({
        purchasePrice: args.purchasePrice,
        expectedMonthlyRent: args.expectedMonthlyRent,
        downPaymentPercent: args.downPaymentPercent,
        interestRateAnnual: args.interestRate,
        loanTenureYears: args.tenureYears
      });
      return roi;
    }

    case 'get_environmental_risk': {
      let coords: [number, number] = [args.lng || 78.382, args.lat || 17.447];
      if (args.propertyId) {
        const prop = getAllProperties().find((p) => p.id === args.propertyId);
        if (prop) coords = prop.coordinates;
      }
      const dummyProp: Property = {
        id: 'query-point',
        title: 'Geospatial Query Point',
        price: 0,
        priceDisplay: '',
        type: 'sale',
        category: 'Apartment',
        bhk: 3,
        bathrooms: 2,
        areaSqFt: 1500,
        address: '',
        area: '',
        city: 'Hyderabad',
        state: 'Telangana',
        pinCode: '500081',
        coordinates: coords,
        images: [],
        features: [],
        verified: true,
        readyToMove: true,
        furnishing: 'Fully Furnished',
        parking: '1 Covered',
        postedDate: '',
        contact: { name: '', phone: '', type: 'Owner' }
      };
      return analyzePropertyRiskAndAdvantages(dummyProp);
    }

    case 'get_nearby_places': {
      let coords: [number, number] = [args.lng || 78.382, args.lat || 17.447];
      if (args.localityName) {
        const loc = resolveLocality(args.localityName);
        if (loc) coords = loc.coordinates;
      }
      return computeNearbyPOIs(coords);
    }

    case 'calculate_travel_time': {
      const distKm = calculateDistanceKm(args.origin, args.destination);
      return {
        distanceKm: distKm,
        driveTimeMinutes: Math.max(3, Math.round(distKm * 2.8)),
        transitTimeMinutes: Math.max(5, Math.round(distKm * 3.4))
      };
    }

    default:
      return { error: `Tool ${toolName} has no server handler.` };
  }
}
