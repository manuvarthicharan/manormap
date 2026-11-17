export type ListingType = 'sale' | 'rent' | 'lease' | 'pg';

export type PropertyCategory =
  | 'Apartment'
  | 'Villa'
  | 'Independent House'
  | 'Plot'
  | 'Open Plot'
  | 'Commercial'
  | 'Penthouse'
  | 'Agricultural Land'
  | 'Office'
  | 'Shop'
  | 'Warehouse'
  | 'Industrial';

export interface LocalityScores {
  transit: number; // 0-100
  lifestyle: number; // 0-100
  safety: number; // 0-100
}

export interface NearbyPOI {
  category: 'hospital' | 'metro' | 'school' | 'mall' | 'it_hub' | 'airport';
  name: string;
  distanceKm: number;
  commuteTimeMinutes: number;
  badge?: string;
}

export interface AIAnalysisResult {
  floodRisk: 'Low' | 'Moderate' | 'High';
  floodRiskScore: number; // 0-100 (lower is safer)
  elevationMeters: number;
  waterbodyProximity: {
    name: string;
    distanceKm: number;
    isLowLyingCatchment: boolean;
  };
  environmentalRisk: {
    dumpyardDistanceKm: number;
    dumpyardName: string;
    miningDistanceKm: number;
    riskRating: 'Safe' | 'Watch' | 'Critical';
    airQualityIndexEst: number;
  };
  livabilityScore: number; // 0-100
  priceFairness: 'Undervalued' | 'Fair Market Price' | 'High Premium';
  pros: string[];
  cons: string[];
  investmentVerdict: string;
}

export interface Property {
  id: string;
  title: string;
  description?: string;
  price: number; // in INR
  priceDisplay: string;
  type: ListingType;
  category: PropertyCategory;
  bhk: number;
  bathrooms: number;
  balconies?: number;
  areaSqFt: number;
  carpetAreaSqFt?: number;
  address: string;
  area: string;
  city: string;
  district?: string;
  state: string;
  pinCode: string;
  coordinates: [number, number]; // [longitude, latitude] - standard GeoJSON / PostGIS format
  images: string[];
  features: string[];
  verified: boolean;
  readyToMove: boolean;
  furnishing: 'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished';
  facing?: string;
  parking: string;
  floorInfo?: string;
  maintenanceMonthly?: number;
  postedDate: string;
  reraId?: string;
  isFeatured?: boolean;
  localityScores?: LocalityScores;
  priceTrendYoY?: string; // e.g. "+12.4% YoY"
  contact: {
    name: string;
    phone: string;
    type: 'Owner' | 'Verified Agent' | 'Agent' | 'Builder' | 'Company';
    email?: string;
    responseTime?: string;
    kycVerified?: boolean;
    registrationId?: string;
  };
  projectOrSociety?: string;
  deposit?: number;
  leaseAmount?: number;
  brokerage?: string;
  isNegotiable?: boolean;
  ownershipType?: string;
  approvalAuthority?: string;
  surveyNumber?: string;
  videoUrl?: string;
  floorPlanUrl?: string;
  whatsappNumber?: string;
  landmarks?: string[];
  boundaryPolygon?: [number, number][]; // GeoJSON array of [lng, lat] vertices forming the cadastral / parcel boundary
  landMetrics?: {
    areaAcres: number;
    areaGunthas: number;
    areaSqYards: number;
    perimeterMeters: number;
  };
  nearbyPOIs?: NearbyPOI[];
  aiAnalysis?: AIAnalysisResult;
  bhuDhaarId?: string; // Telangana 11-digit Bhu-dhaar / Land ID
  layoutApprovalNo?: string; // HMDA / DTCP / BMRDA Layout Permission (LP) number
  verifiedDaysAgo?: number; // Freshness badge: e.g. 2 (Verified 2 days ago)
  isDirectOwner?: boolean;
}

export type AreaUnit = 'sqft' | 'sqyard' | 'acre_gunta';

export interface VenturePlot {
  id: string;
  plotNumber: string;
  areaSqYards: number;
  dimensions: string; // e.g. "40 x 50 ft"
  facing: string; // "East", "West", "North-East", etc.
  status: 'available' | 'hold' | 'sold';
  pricePerSqYd: number;
  totalPrice: number;
  surveyNo?: string;
  coordinates: [number, number][]; // Polygon vertices [lng, lat]
  center: [number, number]; // [lng, lat]
}

export interface VentureLayout {
  id: string;
  name: string;
  developerName: string;
  authority: 'HMDA' | 'DTCP' | 'BMRDA' | 'PMRDA' | 'RERA';
  lpNumber: string; // Layout Permission Number e.g. "LP No. 000142/LO/Plg/HMDA/2024"
  reraId: string;
  totalPlots: number;
  availablePlots: number;
  center: [number, number];
  bounds?: [[number, number], [number, number]];
  plots: VenturePlot[];
  contactPhone: string;
}

export interface AllInCostBreakdown {
  basePrice: number;
  stampDutyRate: number; // e.g. 6.0%
  stampDutyAmount: number;
  registrationRate: number; // e.g. 0.5%
  registrationAmount: number;
  gstRate: number; // 0% or 5%
  gstAmount: number;
  corpusDeposit: number;
  advanceMaintenance: number;
  legalAndAdminCharges: number;
  totalLandingCost: number;
  extraOverheadPercentage: number;
}

export interface MapBounds {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export interface SearchResult {
  id: string;
  title: string;
  subTitle?: string;
  coordinates: [number, number]; // [lng, lat]
  type: 'city' | 'area' | 'pincode' | 'neighborhood' | 'address';
  bounds?: [number, number, number, number];
}

export interface TileProvider {
  id: string;
  name: string;
  url: string;
  attribution: string;
  subdomains?: string[];
  maxZoom: number;
  description: string;
}

export interface FilterState {
  type?: ListingType | 'all';
  category?: PropertyCategory | 'all';
  bhk?: number | 'all';
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  furnishing?: 'all' | 'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished';
  readyToMove?: boolean;
  verifiedOnly?: boolean;
  facing?: 'all' | 'East' | 'North' | 'North-East' | 'West' | 'South';
}

export interface RadiusSearchState {
  active: boolean;
  center: [number, number]; // [lng, lat]
  radiusKm: number;
  address?: string;
}

export interface PolygonSearchState {
  active: boolean;
  isDrawing: boolean;
  coordinates: [number, number][]; // [lng, lat] points
}

export interface LandSurveyState {
  active: boolean;
  isDrawing: boolean;
  points: [number, number][]; // [lng, lat]
  areaSqYards: number; // Gaj
  areaGunthas: number;
  areaAcres: number;
  areaSqFt: number;
  areaSqMeters: number;
  perimeterMeters: number;
}

// -------------------------------------------------------------
// NEW: Locality Intelligence, Price History & Neighborhood Scores
// -------------------------------------------------------------

export interface LocalityHistoricalPrice {
  period: string; // '24M Ago' | '12M Ago' | '6M Ago' | 'Current'
  avgPriceSqFt: number;
  date: string;
}

export interface NeighborhoodScores {
  connectivity: number; // 0-100
  education: number; // 0-100
  healthcare: number; // 0-100
  employment: number; // 0-100
  environment: number; // 0-100
  infrastructure: number; // 0-100
  overallScore: number; // 0-100 weighted
}

export interface LocalityIntelligence {
  id: string;
  name: string;
  city: string;
  state: string;
  coordinates: [number, number]; // [lng, lat]
  bounds?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  avgPricePerSqFt: number;
  rentalYieldPercent: number; // e.g. 4.6%
  availabilityCount: number;
  appreciationYoY: number; // e.g. 8.5%
  appreciationLabel: string; // e.g. "+8.5% in last 12 months"
  demandScore: number; // 0-100
  historicalPrices: LocalityHistoricalPrice[];
  scores: NeighborhoodScores;
  keyHighlights: string[];
  pros: string[];
  cons: string[];
  futureProjections: {
    scenario1Year: number;
    scenario3Year: number;
    scenario5Year: number;
    annualCAGR: number;
  };
}

// -------------------------------------------------------------
// NEW: Investment Intelligence & Buy vs Rent ROI Calculator
// -------------------------------------------------------------

export interface AppreciationScenario {
  name: 'Conservative (6% CAGR)' | 'Moderate (10% CAGR)' | 'Aggressive (14% CAGR)';
  cagr: number;
  valueAfter5Y: number;
  valueAfter10Y: number;
  netAppreciationGain10Y: number;
}

export interface BuyVsRentAnalysis {
  monthlyRentEquivalent: number;
  monthlyBuyOutflow: number; // EMI + maintenance + tax
  downPaymentCapital: number;
  investedDownPaymentValue10Y: number; // Opportunity cost if invested at 9% CAGR
  netWealthBuying10Y: number;
  netWealthRenting10Y: number;
  wealthAdvantageBuying: number;
  breakEvenPeriodYears: number;
  recommendation: 'Strong Buy' | 'Moderate Buy' | 'Rent Favorable';
  verdictSummary: string;
}

export interface InvestmentROI {
  purchasePrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyEMI: number;
  expectedMonthlyRent: number;
  grossRentalYield: number; // Gross Annual Rent / Purchase Price
  netRentalYield: number; // (Rent - Maint - Tax - Vacancy) / Purchase Price
  annualMaintenance: number;
  annualPropertyTax: number;
  breakEvenYears: number;
  scenarios: AppreciationScenario[];
  buyVsRent: BuyVsRentAnalysis;
}

// -------------------------------------------------------------
// NEW: Live Map Control Bridge & Agent Execution Types
// -------------------------------------------------------------

export type AgentToolName =
  | 'get_current_map_state'
  | 'search_location'
  | 'move_map'
  | 'fit_map_bounds'
  | 'set_map_zoom'
  | 'search_properties'
  | 'get_property_details'
  | 'get_property_comparables'
  | 'compare_properties'
  | 'select_property'
  | 'highlight_properties'
  | 'get_locality_intelligence'
  | 'get_nearby_places'
  | 'calculate_travel_time'
  | 'get_environmental_risk'
  | 'get_locality_price_statistics'
  | 'calculate_investment_metrics'
  | 'set_map_layer'
  | 'draw_map_polygon'
  | 'highlight_area'
  | 'show_route'
  | 'apply_map_filters'
  | 'clear_map_highlights';

export interface MapContextSnapshot {
  center: [number, number]; // [lng, lat]
  zoom: number;
  bounds: MapBounds | null;
  mapType: string;
  activeLayers: string[];
  currentLocality?: string;
  currentCity?: string;
  visiblePropertyIds: string[];
  visiblePropertiesCount: number;
  visiblePropertiesList?: Property[];
  selectedProperty: Property | null;
  hoveredPropertyId: string | null;
  activeFilters: FilterState;
  searchQuery?: string;
  radiusSearch: RadiusSearchState;
  polygonSearch: PolygonSearchState;
  landSurvey?: LandSurveyState;
  comparedPropertyIds: string[];
}

export interface AgentMapAction {
  actionId: string;
  tool: AgentToolName;
  args: any;
  status: 'pending' | 'executing' | 'confirmed' | 'failed';
  result?: any;
  error?: string;
  timestamp: number;
}

export interface AgentActivityStep {
  id: string;
  description: string;
  tool?: string;
  status: 'active' | 'completed' | 'failed';
  timestamp: string;
}

export interface AgentActionCard {
  id: string;
  type: 'map_navigation' | 'property_shortlist' | 'locality_comparison' | 'investment_roi' | 'risk_audit';
  title: string;
  subtitle?: string;
  badge?: string;
  data: any;
}

export interface AgentMessage {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  activities?: AgentActivityStep[];
  cards?: AgentActionCard[];
  mapActions?: AgentMapAction[];
  timestamp: string;
}
