import React, { useState } from 'react';
import { FilterState } from '../../types';
import { X, Check, SlidersHorizontal, RotateCcw, ShieldCheck, Home } from 'lucide-react';

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterState: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  matchingCount: number;
}

const PRICE_PRESETS_SALE = [
  { label: 'Any', value: undefined },
  { label: '₹50 Lakh', value: 5000000 },
  { label: '₹1 Crore', value: 10000000 },
  { label: '₹1.5 Crore', value: 15000000 },
  { label: '₹2 Crore', value: 20000000 },
  { label: '₹3 Crore', value: 30000000 },
  { label: '₹5 Crore', value: 50000000 },
  { label: '₹10 Crore+', value: 100000000 }
];

const PRICE_PRESETS_RENT = [
  { label: 'Any', value: undefined },
  { label: '₹20k/mo', value: 20000 },
  { label: '₹35k/mo', value: 35000 },
  { label: '₹50k/mo', value: 50000 },
  { label: '₹75k/mo', value: 75000 },
  { label: '₹1 Lakh/mo', value: 100000 },
  { label: '₹2 Lakh/mo+', value: 200000 }
];

export const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  isOpen,
  onClose,
  filterState,
  onApplyFilters,
  matchingCount
}) => {
  const [draft, setDraft] = useState<FilterState>(filterState);

  // Sync draft when opened
  React.useEffect(() => {
    if (isOpen) {
      setDraft(filterState);
    }
  }, [isOpen, filterState]);

  if (!isOpen) return null;

  const priceOptions = draft.type === 'rent' ? PRICE_PRESETS_RENT : PRICE_PRESETS_SALE;

  const handleReset = () => {
    setDraft({
      type: 'all',
      category: 'all',
      bhk: 'all',
      minPrice: undefined,
      maxPrice: undefined,
      minArea: undefined,
      maxArea: undefined,
      furnishing: 'all',
      readyToMove: false,
      verifiedOnly: false,
      facing: 'all'
    });
  };

  const handleApply = () => {
    onApplyFilters(draft);
    onClose();
  };

  const activeFiltersCount = [
    draft.type && draft.type !== 'all',
    draft.category && draft.category !== 'all',
    draft.bhk && draft.bhk !== 'all',
    draft.minPrice !== undefined,
    draft.maxPrice !== undefined,
    draft.minArea !== undefined,
    draft.maxArea !== undefined,
    draft.furnishing && draft.furnishing !== 'all',
    draft.readyToMove,
    draft.verifiedOnly,
    draft.facing && draft.facing !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4 text-center">
        <div className="relative w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl text-left overflow-hidden transform transition-all border border-slate-100 flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Advanced Property Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {activeFiltersCount} active
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">Fine-tune specifications, pricing, and compliance</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleReset}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
            {/* Listing Type: Sale vs Rent */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider">
                Transaction Purpose
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', label: 'All Listings' },
                  { id: 'sale', label: 'Buy / Sale' },
                  { id: 'rent', label: 'Rental / Lease' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setDraft({ ...draft, type: opt.id as any })}
                    className={`h-10 rounded-xl font-bold transition-all border text-xs flex items-center justify-center ${
                      draft.type === opt.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bedrooms (BHK) */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider">
                Bedrooms (BHK)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { id: 'all', label: 'All' },
                  { id: 1, label: '1 BHK' },
                  { id: 2, label: '2 BHK' },
                  { id: 3, label: '3 BHK' },
                  { id: 4, label: '4 BHK' },
                  { id: 5, label: '5+ BHK' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setDraft({ ...draft, bhk: opt.id as any })}
                    className={`h-10 rounded-xl font-bold transition-all border text-xs flex items-center justify-center ${
                      draft.bhk === opt.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Property Category */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider">
                Asset Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  'all',
                  'Apartment',
                  'Villa',
                  'Independent House',
                  'Plot',
                  'Commercial',
                  'Penthouse',
                  'Agricultural Land'
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setDraft({ ...draft, category: cat as any })}
                    className={`h-10 px-3 rounded-xl font-semibold transition-all border text-xs flex items-center justify-center truncate ${
                      draft.category === cat
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat === 'all' ? 'All Types' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget / Price Max Threshold */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Max Budget Ceiling
                </label>
                {draft.maxPrice && (
                  <span className="text-xs font-bold text-blue-600">
                    Up to ₹{(draft.maxPrice >= 10000000 ? `${draft.maxPrice / 10000000} Cr` : `${draft.maxPrice / 100000} Lakh`)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {priceOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setDraft({ ...draft, maxPrice: opt.value })}
                    className={`h-9 px-2 rounded-xl text-xs font-semibold transition-all border flex items-center justify-center truncate ${
                      draft.maxPrice === opt.value
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Furnishing Status */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider">
                Furnishing Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'Fully Furnished', label: 'Furnished' },
                  { id: 'Semi-Furnished', label: 'Semi-Furn.' },
                  { id: 'Unfurnished', label: 'Unfurnished' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setDraft({ ...draft, furnishing: opt.id as any })}
                    className={`h-10 rounded-xl font-semibold transition-all border text-xs flex items-center justify-center ${
                      draft.furnishing === opt.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Facing / Vastu Orientation */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider">
                Facing / Vastu Orientation
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {['all', 'East', 'North', 'West', 'South'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setDraft({ ...draft, facing: f as any })}
                    className={`h-9 rounded-xl font-semibold transition-all border text-xs flex items-center justify-center ${
                      draft.facing === f
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {f === 'all' ? 'Any' : f}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Compliance & Possession Toggles */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label
                onClick={() => setDraft({ ...draft, readyToMove: !draft.readyToMove })}
                className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Ready to Move In</div>
                    <div className="text-[11px] text-slate-500">Exclude under-construction or delayed possession</div>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  draft.readyToMove ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                }`}>
                  {draft.readyToMove && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </label>

              <label
                onClick={() => setDraft({ ...draft, verifiedOnly: !draft.verifiedOnly })}
                className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">RERA & KYC Verified Only</div>
                    <div className="text-[11px] text-slate-500">Show only government RERA registered & identity-verified sellers</div>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  draft.verifiedOnly ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                }`}>
                  {draft.verifiedOnly && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </label>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 flex-shrink-0">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Clear All
            </button>

            <button
              onClick={handleApply}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <span>Apply Filters</span>
              <span className="bg-blue-500/50 px-2 py-0.5 rounded-full text-[10px]">
                {matchingCount} Properties
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
