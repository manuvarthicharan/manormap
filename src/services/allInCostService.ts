import { Property, AllInCostBreakdown } from '../types';

export interface StateStampDutyConfig {
  state: string;
  stampDutyPercent: number;
  registrationPercent: number;
}

export const STATE_DUTY_CONFIGS: Record<string, StateStampDutyConfig> = {
  Telangana: { state: 'Telangana', stampDutyPercent: 6.0, registrationPercent: 0.5 },
  Karnataka: { state: 'Karnataka', stampDutyPercent: 5.6, registrationPercent: 1.0 },
  Maharashtra: { state: 'Maharashtra', stampDutyPercent: 6.0, registrationPercent: 1.0 },
  TamilNadu: { state: 'Tamil Nadu', stampDutyPercent: 7.0, registrationPercent: 2.0 },
  Delhi: { state: 'Delhi-NCR', stampDutyPercent: 6.0, registrationPercent: 1.0 },
  Default: { state: 'Standard National', stampDutyPercent: 6.0, registrationPercent: 0.5 }
};

/**
 * Computes the complete "All-In Cheque Landing Cost" for an Indian property
 */
export function calculateAllInLandingCost(
  property: Property,
  customState?: string
): AllInCostBreakdown {
  const basePrice = property.price || 0;
  const sqFt = property.areaSqFt || 1000;

  // Determine state duty configuration
  const stateKey = customState || property.state || 'Default';
  const dutyConfig =
    STATE_DUTY_CONFIGS[stateKey] ||
    Object.values(STATE_DUTY_CONFIGS).find((c) =>
      stateKey.toLowerCase().includes(c.state.toLowerCase())
    ) ||
    STATE_DUTY_CONFIGS.Default;

  // Stamp Duty (varies by state and property type)
  const isAgriOrPlot =
    property.category === 'Agricultural Land' ||
    property.category === 'Plot' ||
    property.category === 'Open Plot';
  const stampDutyRate = isAgriOrPlot
    ? Math.max(dutyConfig.stampDutyPercent - 1.0, 4.0)
    : dutyConfig.stampDutyPercent;
  const stampDutyAmount = Math.round((basePrice * stampDutyRate) / 100);

  // Registration fee (0.5% - 1.0%)
  const registrationRate = dutyConfig.registrationPercent;
  const registrationAmount = Math.round((basePrice * registrationRate) / 100);

  // GST: 5% for under-construction residential; 0% for ready-to-move (with OC) and open plots/land
  let gstRate = 0;
  if (!property.readyToMove && !isAgriOrPlot && property.type === 'sale') {
    gstRate = basePrice < 4500000 ? 1.0 : 5.0; // Affordable housing rule
  }
  const gstAmount = Math.round((basePrice * gstRate) / 100);

  // Corpus / Sinking fund deposit (₹60/sqft for apartments/villas, 0 for pure land)
  const corpusDeposit = isAgriOrPlot
    ? 0
    : Math.round(sqFt * 65);

  // Advance maintenance (e.g. ₹3.5/sqft per month for 12 months)
  const advanceMaintenance = isAgriOrPlot
    ? 0
    : property.maintenanceMonthly
      ? property.maintenanceMonthly * 12
      : Math.round(sqFt * 3.5 * 12);

  // Legal scrutiny, title clearance, and franking/document charges
  const legalAndAdminCharges = basePrice > 10000000 ? 45000 : 25000;

  const totalLandingCost =
    basePrice +
    stampDutyAmount +
    registrationAmount +
    gstAmount +
    corpusDeposit +
    advanceMaintenance +
    legalAndAdminCharges;

  const extraOverheadPercentage =
    basePrice > 0
      ? Math.round(((totalLandingCost - basePrice) / basePrice) * 1000) / 10
      : 0;

  return {
    basePrice,
    stampDutyRate,
    stampDutyAmount,
    registrationRate,
    registrationAmount,
    gstRate,
    gstAmount,
    corpusDeposit,
    advanceMaintenance,
    legalAndAdminCharges,
    totalLandingCost,
    extraOverheadPercentage
  };
}
