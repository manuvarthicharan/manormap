import React from 'react';
import { Property } from '../../types';
import {
  X,
  MapPin,
  Heart,
  ArrowRight,
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

  const isAgri = property.category === 'Agricultural Land' || property.category === 'Plot';

  return (
    <div className="z-30 pointer-events-auto">
      {/* Mobile: Bottom Sheet | Desktop: Floating Card near bottom left */}
      <div className="fixed inset-x-0 bottom-0 sm:bottom-6 sm:left-5 sm:right-auto sm:max-w-lg w-full animate-in slide-in-from-bottom duration-150 ease-out z-30">
        <div className="bg-[#fbf9f6] dark:bg-[#181716] rounded-xs border border-[#e7e5e4] dark:border-[#292524] shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden transition-colors">
          
          {/* Card Layout: Asymmetrical Photo (40%) + Editorial Specs (60%) */}
          <div className="flex flex-col sm:flex-row">
            {/* Photo */}
            <div className="relative w-full sm:w-44 h-44 sm:h-auto flex-shrink-0 bg-[#f5f2eb] dark:bg-[#211f1d] border-b sm:border-b-0 sm:border-r border-[#e7e5e4] dark:border-[#292524]">
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              {/* Type tag */}
              <div className="absolute top-2 left-2 flex items-center gap-1">
                <span className="font-mono text-[10px] tracking-wider uppercase px-1.5 py-0.5 bg-[#1c1917]/90 text-[#fbf9f6] backdrop-blur-xs rounded-xs">
                  {property.type === 'sale' ? 'For sale' : 'For rent'}
                </span>
                <span className="font-mono text-[10px] tracking-wider uppercase px-1.5 py-0.5 bg-[#fbf9f6]/90 text-[#1c1917] backdrop-blur-xs rounded-xs">
                  {property.category}
                </span>
              </div>

              {/* Close Button on Image for Mobile */}
              <button
                onClick={onClose}
                className="sm:hidden absolute top-2 right-2 w-7 h-7 bg-[#1c1917]/80 text-white flex items-center justify-center rounded-xs"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Information Column */}
            <div className="p-3.5 sm:p-4 flex-1 min-w-0 flex flex-col justify-between">
              <div>
                {/* Header Row: Price + Icon Actions */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <div className="text-xl sm:text-2xl font-serif tracking-tight text-[#1c1917] dark:text-[#f5f5f4] leading-none">
                      {property.priceDisplay}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {onToggleCompare && (
                      <button
                        onClick={() => onToggleCompare(property)}
                        className={`w-7 h-7 rounded-xs flex items-center justify-center transition-colors ${
                          isCompared
                            ? 'text-[#8b3a24] bg-[#fbf2ed] dark:bg-[#2b1f1a]'
                            : 'text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4]'
                        }`}
                        title={isCompared ? 'Remove from compare' : 'Compare'}
                      >
                        <Scale className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onOpenAIAdvisor && (
                      <button
                        onClick={() => onOpenAIAdvisor(property)}
                        className="w-7 h-7 rounded-xs flex items-center justify-center text-[#78716c] hover:text-[#8b3a24] transition-colors"
                        title="AI Analysis"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onToggleFavorite(property.id)}
                      className={`w-7 h-7 rounded-xs flex items-center justify-center transition-colors ${
                        isFavorite
                          ? 'text-[#8b3a24]'
                          : 'text-[#78716c] hover:text-[#8b3a24]'
                      }`}
                      aria-label="Save"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-[#8b3a24]' : ''}`} />
                    </button>
                    <button
                      onClick={onClose}
                      className="hidden sm:flex w-7 h-7 rounded-xs text-[#a8a29e] hover:text-[#1c1917] dark:hover:text-[#f5f5f4] items-center justify-center transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xs sm:text-sm font-medium text-[#1c1917] dark:text-[#f5f5f4] line-clamp-1 mb-1">
                  {property.title}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-1 text-[11px] text-[#78716c] dark:text-[#a8a29e] mb-2.5">
                  <MapPin className="w-3 h-3 text-[#8b3a24] flex-shrink-0" />
                  <span className="truncate">
                    {property.area}, {property.city}
                  </span>
                </div>

                {/* Specs */}
                {isAgri ? (
                  <div className="flex items-center gap-2 text-xs font-mono text-[#1c1917] dark:text-[#f5f5f4] flex-wrap">
                    <span className="text-[#8b3a24] font-medium">
                      {property.landMetrics?.areaAcres
                        ? `${property.landMetrics.areaAcres.toFixed(2)} acres`
                        : `${(property.areaSqFt / 43560).toFixed(2)} acres`}
                    </span>
                    {property.landMetrics?.areaGunthas && (
                      <span className="text-[#78716c]">
                        ({property.landMetrics.areaGunthas.toFixed(1)} gunthas)
                      </span>
                    )}
                    <span className="text-[#78716c]">
                      • {property.areaSqFt.toLocaleString('en-IN')} sq ft
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-mono text-[#78716c] dark:text-[#a8a29e]">
                    <span className="text-[#1c1917] dark:text-[#f5f5f4] font-medium">{property.bhk} BHK</span>
                    <span>•</span>
                    <span>{property.bathrooms} baths</span>
                    <span>•</span>
                    <span>{property.areaSqFt.toLocaleString('en-IN')} sq ft</span>
                  </div>
                )}
              </div>

              {/* Action Buttons: Asymmetrical split (65% View / 35% EMI) */}
              <div className="pt-3 mt-3 border-t border-[#e7e5e4] dark:border-[#292524] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onViewDetails(property, 'overview')}
                  className="flex-1 h-8 px-3 bg-[#1c1917] dark:bg-[#f5f5f4] hover:bg-[#8b3a24] dark:hover:bg-[#8b3a24] dark:hover:text-white text-[#fbf9f6] dark:text-[#1c1917] text-xs font-medium uppercase tracking-wider rounded-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>View listing</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={() => onViewDetails(property, 'emi')}
                  className="h-8 px-3 border border-[#e7e5e4] dark:border-[#292524] hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d] text-[#1c1917] dark:text-[#f5f5f4] text-xs font-medium rounded-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <Calculator className="w-3 h-3 text-[#8b3a24]" />
                  <span>EMI</span>
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
