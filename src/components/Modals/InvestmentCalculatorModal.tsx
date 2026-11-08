import React, { useState, useMemo } from 'react';
import { Property } from '../../types';
import {
  X,
  Calculator,
  TrendingUp,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { calculateInvestmentIntelligence } from '../../services/investmentAnalysisService';

interface InvestmentCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProperty?: Property | null;
}

export const InvestmentCalculatorModal: React.FC<InvestmentCalculatorModalProps> = ({
  isOpen,
  onClose,
  selectedProperty
}) => {
  const [purchasePrice, setPurchasePrice] = useState<number>(() => {
    return selectedProperty ? selectedProperty.price : 7500000;
  });
  const [expectedRent, setExpectedRent] = useState<number>(() => {
    return selectedProperty
      ? selectedProperty.type === 'rent'
        ? selectedProperty.price
        : Math.round((selectedProperty.price * 0.045) / 12)
      : 25000;
  });
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenureYears, setTenureYears] = useState<number>(20);
  const [activeTab, setActiveTab] = useState<'buy_vs_rent' | 'yield_metrics' | 'appreciation'>('buy_vs_rent');

  // Sync when selectedProperty changes
  React.useEffect(() => {
    if (selectedProperty) {
      setPurchasePrice(selectedProperty.price);
      setExpectedRent(
        selectedProperty.type === 'rent'
          ? selectedProperty.price
          : Math.round((selectedProperty.price * 0.045) / 12)
      );
    }
  }, [selectedProperty]);

  const roi = useMemo(() => {
    return calculateInvestmentIntelligence({
      purchasePrice,
      expectedMonthlyRent: expectedRent,
      downPaymentPercent,
      interestRateAnnual: interestRate,
      loanTenureYears: tenureYears
    });
  }, [purchasePrice, expectedRent, downPaymentPercent, interestRate, tenureYears]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center">
        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl text-left overflow-hidden transform transition-all border border-slate-100 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Investment Intelligence & ROI Calculator</span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                    Institutional DCF Model
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Rental yield, break-even period & 10-year Buy vs Rent comparative analysis
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Interactive Parameters Panel */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
            {/* Quick Price & Rent Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800">Property Purchase Price</label>
                  <span className="text-sm font-black text-blue-600">
                    ₹{(purchasePrice / 100000).toFixed(1)} Lakhs
                  </span>
                </div>
                <input
                  type="range"
                  min={2500000}
                  max={50000000}
                  step={250000}
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>₹25 L</span>
                  <span>₹2.5 Cr</span>
                  <span>₹5.0 Cr</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800">Expected Monthly Rent</label>
                  <span className="text-sm font-black text-emerald-600">
                    ₹{expectedRent.toLocaleString('en-IN')}/mo
                  </span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={250000}
                  step={2500}
                  value={expectedRent}
                  onChange={(e) => setExpectedRent(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>₹10k</span>
                  <span>₹1.0 L</span>
                  <span>₹2.5 L</span>
                </div>
              </div>
            </div>

            {/* Loan & Leverage Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
                  <span>Down Payment</span>
                  <span className="text-slate-900 font-extrabold">{downPaymentPercent}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                  className="w-full accent-blue-600 mt-2 cursor-pointer"
                />
                <div className="text-[10px] text-slate-500 mt-1">₹{(roi.downPayment / 100000).toFixed(1)} Lakhs</div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
                  <span>Interest Rate</span>
                  <span className="text-slate-900 font-extrabold">{interestRate}%</span>
                </div>
                <input
                  type="range"
                  min={7.0}
                  max={12.0}
                  step={0.25}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full accent-blue-600 mt-2 cursor-pointer"
                />
                <div className="text-[10px] text-slate-500 mt-1">{tenureYears} Yrs Tenure</div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
                  <span>Tenure</span>
                  <span className="text-blue-600 font-extrabold">{tenureYears} Yrs</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={5}
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full accent-blue-600 mt-2 cursor-pointer"
                />
                <div className="text-[10px] text-slate-500 mt-1">EMI: ₹{roi.monthlyEMI.toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* Segmented Tab Navigation */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold">
              {[
                { id: 'buy_vs_rent', label: 'Buy vs Rent Decision' },
                { id: 'yield_metrics', label: 'Rental Yields & Break-Even' },
                { id: 'appreciation', label: '10-Year Capital Appreciation' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2 rounded-lg transition-all text-center ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: BUY VS RENT DECISION MATRIX */}
            {activeTab === 'buy_vs_rent' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Decision Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                      Recommendation: {roi.buyVsRent.recommendation}
                    </span>
                    <h4 className="text-sm font-extrabold text-white mt-1.5">
                      {roi.buyVsRent.verdictSummary}
                    </h4>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <div className="text-[10px] text-slate-300">10-Year Net Wealth Surplus</div>
                    <div className="text-xl font-black text-emerald-400">
                      ₹{(roi.buyVsRent.wealthAdvantageBuying / 100000).toFixed(1)} Lakhs
                    </div>
                  </div>
                </div>

                {/* Side-by-side comparison cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Buying Profile */}
                  <div className="p-4 rounded-2xl border-2 border-blue-600/30 bg-blue-50/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span>Option A: Buy Property</span>
                      </span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                        Asset Ownership
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                      <div className="flex justify-between">
                        <span>Upfront Capital (20% Down Payment):</span>
                        <strong className="text-slate-900">₹{(roi.downPayment / 100000).toFixed(1)} Lakhs</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Monthly Outflow (EMI + Maint):</span>
                        <strong className="text-slate-900">₹{roi.buyVsRent.monthlyBuyOutflow.toLocaleString('en-IN')}/mo</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated Property Value (Year 10):</span>
                        <strong className="text-emerald-700">₹{(roi.scenarios[1].valueAfter10Y / 100000).toFixed(1)} Lakhs</strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                        <span>Net Equity Built (Year 10):</span>
                        <span className="text-blue-600">₹{(roi.buyVsRent.netWealthBuying10Y / 100000).toFixed(1)} Lakhs</span>
                      </div>
                    </div>
                  </div>

                  {/* Renting Profile */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span>Option B: Rent & Invest Surplus</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                        Financial Asset
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                      <div className="flex justify-between">
                        <span>Monthly Rent (compounding at 5.5% p.a.):</span>
                        <strong className="text-slate-900">₹{expectedRent.toLocaleString('en-IN')}/mo</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Alternative Investment Capital:</span>
                        <strong className="text-slate-900">₹{(roi.downPayment / 100000).toFixed(1)} Lakhs in Mutual Funds</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Mutual Fund Value after 10 Yrs (9% CAGR):</span>
                        <strong className="text-slate-900">₹{(roi.buyVsRent.investedDownPaymentValue10Y / 100000).toFixed(1)} Lakhs</strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                        <span>Net Liquid Wealth (Year 10):</span>
                        <span className="text-slate-700">₹{(roi.buyVsRent.netWealthRenting10Y / 100000).toFixed(1)} Lakhs</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: YIELD & CASH FLOW */}
            {activeTab === 'yield_metrics' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <div className="text-[10px] font-bold uppercase text-emerald-800">Gross Rental Yield</div>
                    <div className="text-xl font-black text-emerald-700 mt-0.5">{roi.grossRentalYield}%</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">National avg: 3.5% - 4.2%</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100">
                    <div className="text-[10px] font-bold uppercase text-blue-800">Net Rental Yield</div>
                    <div className="text-xl font-black text-blue-700 mt-0.5">{roi.netRentalYield}%</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">After tax & maintenance</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100">
                    <div className="text-[10px] font-bold uppercase text-amber-800">Break-Even Period</div>
                    <div className="text-xl font-black text-amber-700 mt-0.5">{roi.breakEvenYears} Yrs</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Capital recovery timeframe</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-600">Annual Maintenance</div>
                    <div className="text-xl font-black text-slate-800 mt-0.5">₹{(roi.annualMaintenance / 1000).toFixed(0)}k</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">+ ₹{roi.annualPropertyTax} property tax</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>How Net Rental Yield is Calculated</span>
                  </div>
                  Net rental yield accounts for annual society maintenance tariffs (₹3.5/sq.ft/mo), municipal property tax rates (0.25%), and a 5% statutory vacancy allowance. A net yield above <strong>4.0%</strong> in Indian residential real estate indicates an institutional-grade cash-flow asset.
                </div>
              </div>
            )}

            {/* TAB 3: CAPITAL APPRECIATION SCENARIOS */}
            {activeTab === 'appreciation' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {roi.scenarios.map((sc, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        idx === 1
                          ? 'border-blue-600 bg-blue-50/30 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="text-xs font-extrabold text-slate-900 mb-2">{sc.name}</div>
                      <div className="space-y-2 text-[11px] text-slate-600">
                        <div className="flex justify-between">
                          <span>5-Year Value:</span>
                          <strong className="text-slate-900">₹{(sc.valueAfter5Y / 100000).toFixed(1)} Lakhs</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>10-Year Value:</span>
                          <strong className="text-blue-700">₹{(sc.valueAfter10Y / 100000).toFixed(1)} Lakhs</strong>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-emerald-700">
                          <span>10-Yr Capital Gain:</span>
                          <span>+₹{(sc.netAppreciationGain10Y / 100000).toFixed(1)} L</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
