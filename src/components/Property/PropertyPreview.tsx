import React from 'react';
import { Property } from '../../types';
import {
  X,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  Heart,
  ArrowRight,
  ShieldCheck,
  Calculator,
  Scale,
  Sparkles
} from 'lucide-react';

interface PropertyPreviewProps {
  property: Property | null;
  onClose: () => void;
  onViewDetails: (property: Property, initialTab?: 'overview' | 'emi') => void;
  isFavorite: boolean;
  onToggleFavorite: (propertyId: string) => void;
  onToggleCompare?: (property: Property) => void;
  isCompared?: boolean;
  onOpenAIAdvisor?: (property: Property) => void;
}

export const PropertyPreview: React.FC<PropertyPreviewProps> = ({
  property,
  onClose,
  onViewDetails,
  isFavorite,
  onToggleFavorite,
  onToggleCompare,
  isCompared = false,
  onOpenAIAdvisor
}) => {
  if (!property) return null;

  return (
    <div className="z-30 pointer-events-auto">
      {/* Mobile: Bottom Sheet | Desktop: Floating Card near bottom left */}
      <div className="fixed inset-x-0 bottom-0 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md w-full animate-in slide-in-from-bottom duration-200 ease-out z-30">
        <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden pb-3 sm:pb-0 max-h-[85dvh] overflow-y-auto">
          
          {/* Mobile Drag Indicator */}
          <div className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5" />

          {/* Card Layout */}
          <div className="p-4 flex flex-col sm:flex-row gap-3.5 items-stretch">
            {/* Property Image & Badges */}
            <div className="relative w-full sm:w-40 h-40 sm:h-36 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              {/* Rent / Sale Badge */}
              <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider text-white shadow-xs ${
                    property.type === 'sale' ? 'bg-blue-600' : 'bg-emerald-600'
                  }`}
                >
                  {property.type === 'sale' ? 'For Sale' : 'For Rent'}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-sm text-white">
                  {property.category}
                </span>
              </div>

              {/* Close Button on Image for Mobile */}
              <button
                onClick={onClose}
                className="sm:hidden absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/70 text-white flex items-center justify-center backdrop-blur-sm"
                aria-label="Dismiss preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Property Information */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                {/* Desktop Top Row with Price, Compare, AI, Favorite & Close */}
                <div className="hidden sm:flex items-center justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-black text-slate-900 tracking-tight">
                      {property.priceDisplay}
                    </span>
                    {property.verified && (
                      <span title="Verified Listing" className="flex items-center">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {onToggleCompare && (
                      <button
                        onClick={() => onToggleCompare(property)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          isCompared
                            ? 'text-indigo-600 bg-indigo-50 border border-indigo-200'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        title={isCompared ? 'In Comparison' : 'Add to Compare'}
                      >
                        <Scale className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onOpenAIAdvisor && (
                      <button
                        onClick={() => onOpenAIAdvisor(property)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Analyze with AI Agent"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      </button>
                    )}
                    <button
                      onClick={() => onToggleFavorite(property.id)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        isFavorite
                          ? 'text-rose-600 bg-rose-50'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
                      }`}
                      aria-label="Save property"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-600' : ''}`} />
                    </button>
                    <button
                      onClick={onClose}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
                      aria-label="Close preview"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Mobile Price Row */}
                <div className="sm:hidden flex items-center justify-between mb-1">
                  <span className="text-xl font-black text-slate-900">
                    {property.priceDisplay}
                  </span>
                  <div className="flex items-center gap-1">
                    {onToggleCompare && (
                      <button
                        onClick={() => onToggleCompare(property)}
                        className={`p-1.5 rounded-lg ${isCompared ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 bg-slate-100'}`}
                      >
                        <Scale className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onToggleFavorite(property.id)}
                      className={`p-1.5 rounded-lg ${
                        isFavorite ? 'text-rose-600 bg-rose-50' : 'text-slate-400 bg-slate-100'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-600' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                  {property.title}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span className="truncate">
                    {property.area}, {property.city}
                  </span>
                </div>

                {/* Specs */}
                <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-1">
                    <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                    <span>{property.bhk} BHK</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="w-3.5 h-3.5 text-slate-400" />
                    <span>{property.bathrooms} Baths</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{property.areaSqFt} sqft</span>
                  </div>
                </div>
              </div>

              {/* Exact-Fit Action Buttons: View Details & Loan EMI */}
              <div className="pt-3 mt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onViewDetails(property, 'overview')}
                  className="h-9 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onViewDetails(property, 'emi')}
                  className="h-9 px-3 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
                >
                  <Calculator className="w-3.5 h-3.5 text-blue-600" />
                  <span>Loan EMI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyPreview;
