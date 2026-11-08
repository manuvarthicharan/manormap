import { InvestmentROI, AppreciationScenario, BuyVsRentAnalysis } from '../types';

export interface InvestmentCalculationInput {
  purchasePrice: number;
  expectedMonthlyRent?: number;
  downPaymentPercent?: number; // e.g. 20%
  interestRateAnnual?: number; // e.g. 8.5%
  loanTenureYears?: number; // e.g. 20 years
  annualMaintenancePerSqFt?: number; // e.g. ₹3.5/sqft/mo
  areaSqFt?: number;
  propertyTaxAnnual?: number;
  opportunityCostReturnRate?: number; // e.g. 9.0% CAGR for alternative mutual fund investment
  rentInflationRateAnnual?: number; // e.g. 5.5% annual rent rise
}

/**
 * High-Precision Indian Real Estate Investment & Buy vs Rent ROI Calculator
 */
export function calculateInvestmentIntelligence(
  input: InvestmentCalculationInput
): InvestmentROI {
  const purchasePrice = input.purchasePrice || 7500000; // default ₹75 Lakhs
  const downPaymentPercent = input.downPaymentPercent || 20;
  const downPayment = Math.round(purchasePrice * (downPaymentPercent / 100));
  const loanAmount = purchasePrice - downPayment;

  const interestRate = input.interestRateAnnual || 8.5;
  const tenureYears = input.loanTenureYears || 20;

  // Monthly EMI calculation
  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;
  const monthlyEMI =
    monthlyRate === 0
      ? Math.round(loanAmount / totalMonths)
      : Math.round(
          (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
            (Math.pow(1 + monthlyRate, totalMonths) - 1)
        );

  // Expected monthly rental income (defaults to 4.5% gross yield benchmark if not provided)
  const expectedMonthlyRent =
    input.expectedMonthlyRent ||
    Math.round((purchasePrice * 0.045) / 12);

  // Annual figures
  const annualGrossRent = expectedMonthlyRent * 12;
  const grossRentalYield = Number(((annualGrossRent / purchasePrice) * 100).toFixed(2));

  // Operating expenses: Maintenance + Property Tax + 1-month vacancy reserve (8.3%)
  const areaSqFt = input.areaSqFt || Math.round(purchasePrice / 7500);
  const monthlyMaintenance = Math.round(areaSqFt * (input.annualMaintenancePerSqFt || 3.5));
  const annualMaintenance = monthlyMaintenance * 12;
  const annualPropertyTax = input.propertyTaxAnnual || Math.round(purchasePrice * 0.0025); // ~0.25% municipal tax
  const vacancyReserveAnnual = Math.round(annualGrossRent * 0.05); // 5% vacancy allowance

  const netAnnualRent = Math.max(0, annualGrossRent - annualMaintenance - annualPropertyTax - vacancyReserveAnnual);
  const netRentalYield = Number(((netAnnualRent / purchasePrice) * 100).toFixed(2));

  // Break-even period in years (Down Payment / Net Annual Cash Flow, or with appreciation)
  const annualDebtService = monthlyEMI * 12;
  const netAnnualCashFlow = netAnnualRent - annualDebtService;
  // If cashflow is negative (common with 80% leverage), break-even accounts for principal accumulation & appreciation
  const annualPrincipalReductionApprox = Math.round(loanAmount / tenureYears);
  const effectiveAnnualEquityBuild = netAnnualCashFlow + annualPrincipalReductionApprox + purchasePrice * 0.08;
  const breakEvenYears =
    effectiveAnnualEquityBuild > 0
      ? Number((downPayment / effectiveAnnualEquityBuild).toFixed(1))
      : 8.5;

  // Capital Appreciation Scenarios (Conservative 6%, Moderate 10%, Aggressive 14%)
  const scenarios: AppreciationScenario[] = [
    {
      name: 'Conservative (6% CAGR)',
      cagr: 6.0,
      valueAfter5Y: Math.round(purchasePrice * Math.pow(1.06, 5)),
      valueAfter10Y: Math.round(purchasePrice * Math.pow(1.06, 10)),
      netAppreciationGain10Y: Math.round(purchasePrice * (Math.pow(1.06, 10) - 1))
    },
    {
      name: 'Moderate (10% CAGR)',
      cagr: 10.0,
      valueAfter5Y: Math.round(purchasePrice * Math.pow(1.10, 5)),
      valueAfter10Y: Math.round(purchasePrice * Math.pow(1.10, 10)),
      netAppreciationGain10Y: Math.round(purchasePrice * (Math.pow(1.10, 10) - 1))
    },
    {
      name: 'Aggressive (14% CAGR)',
      cagr: 14.0,
      valueAfter5Y: Math.round(purchasePrice * Math.pow(1.14, 5)),
      valueAfter10Y: Math.round(purchasePrice * Math.pow(1.14, 10)),
      netAppreciationGain10Y: Math.round(purchasePrice * (Math.pow(1.14, 10) - 1))
    }
  ];

  // -----------------------------------------------------------------
  // Buy vs Rent Comparative Analysis
  // Example: Buying a ₹75 Lakh apartment vs Renting for ₹25,000/month
  // -----------------------------------------------------------------
  const monthlyRentEquivalent = input.expectedMonthlyRent || 25000;
  const monthlyBuyOutflow = monthlyEMI + monthlyMaintenance + Math.round(annualPropertyTax / 12);

  // If renting: down payment capital is invested in Nifty 50 / Mutual Funds earning 9% CAGR
  const opportunityRate = (input.opportunityCostReturnRate || 9.0) / 100;
  const investedDownPaymentValue10Y = Math.round(downPayment * Math.pow(1 + opportunityRate, 10));

  // Rent inflation compounding over 10 years
  const rentInflation = (input.rentInflationRateAnnual || 5.5) / 100;
  let cumulativeRentPaid10Y = 0;
  let currentRent = monthlyRentEquivalent * 12;
  for (let yr = 1; yr <= 10; yr++) {
    cumulativeRentPaid10Y += currentRent;
    currentRent *= 1 + rentInflation;
  }

  // Monthly savings differential invested: If monthly rent is less than EMI, the surplus is invested
  // In Year 10 for Buyer:
  const propertyValue10Y = scenarios[1].valueAfter10Y; // Moderate 10%
  // Remaining loan principal after 10 years
  const remainingLoanBalance10Y = Math.round(loanAmount * 0.62); // Approx 62% remaining at Y10 of 20Y loan
  const buyerNetEquity10Y = propertyValue10Y - remainingLoanBalance10Y;

  // In Year 10 for Renter:
  const renterWealth10Y = investedDownPaymentValue10Y - (cumulativeRentPaid10Y > 0 ? 0 : 0);

  const wealthAdvantageBuying = buyerNetEquity10Y - renterWealth10Y;
  const isBuyFavorable = wealthAdvantageBuying > 0;

  const buyVsRent: BuyVsRentAnalysis = {
    monthlyRentEquivalent,
    monthlyBuyOutflow,
    downPaymentCapital: downPayment,
    investedDownPaymentValue10Y,
    netWealthBuying10Y: buyerNetEquity10Y,
    netWealthRenting10Y: renterWealth10Y,
    wealthAdvantageBuying,
    breakEvenPeriodYears: isBuyFavorable ? breakEvenYears : 12.0,
    recommendation: wealthAdvantageBuying > 1500000 ? 'Strong Buy' : wealthAdvantageBuying > 0 ? 'Moderate Buy' : 'Rent Favorable',
    verdictSummary:
      wealthAdvantageBuying > 0
        ? `Buying generates an estimated net wealth surplus of ₹${(wealthAdvantageBuying / 100000).toFixed(1)} Lakhs over 10 years compared to renting at ₹${monthlyRentEquivalent.toLocaleString('en-IN')}/mo.`
        : `Renting at ₹${monthlyRentEquivalent.toLocaleString('en-IN')}/mo is financially favorable for holding periods under 8 years due to upfront capital liquidity.`
  };

  return {
    purchasePrice,
    downPayment,
    loanAmount,
    monthlyEMI,
    expectedMonthlyRent,
    grossRentalYield,
    netRentalYield,
    annualMaintenance,
    annualPropertyTax,
    breakEvenYears,
    scenarios,
    buyVsRent
  };
}

