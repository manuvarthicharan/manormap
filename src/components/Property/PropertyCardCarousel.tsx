import React, { useRef } from 'react';
import { Property } from '../../types';
import {
  Building2,
  MapPin,
  Heart,
  ChevronLeft,
  ChevronRight,
  Calculator,
  ArrowRight,
  X
} from 'lucide-react';

interface PropertyCardCarouselProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (property: Property) => void;
  onViewDetails?: (property: Property, initialTab?: 'overview' | 'emi') => void;
  onHoverProperty: (propertyId: string | null) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const PropertyCardCarousel: React.FC<PropertyCardCarouselProps> = ({
  properties,
  selectedProperty,
  onSelectProperty,
  onViewDetails,
  onHoverProperty,
  favorites,
  onToggleFavorite,
  isOpen,
  onToggleOpen
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  if (properties.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-3 sm:bottom-6 left-0 right-0 z-20 pointer-events-none flex flex-col items-center">
      {/* Floating Toggle Button (Desktop & when collapsed) */}
      {!isOpen && (
        <div className="pointer-events-auto mb-2 transition-all">
          <button
            onClick={onToggleOpen}
            className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg border border-slate-800 text-xs font-bold transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>
              {`Browse (${properties.length}) Properties in Area`}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </button>
        </div>
      )}

      {/* Expandable Horizontal Cards Tray */}
      {isOpen && (
        <div className="pointer-events-auto w-full max-w-7xl px-3 sm:px-6 animate-in slide-in-from-bottom-2 duration-200">
          <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-2xl border border-slate-200 relative">
            {/* Tray Header Bar */}
            <div className="flex items-center justify-between px-1 mb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {properties.length} Verified Properties in Visible Area
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded hidden sm:inline-block">
                  Live Viewport Sync
                </span>
              </div>

              {/* Scroll Arrows & Close */}
              <div className="flex items-center gap-1.5">
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    onClick={scrollLeft}
                    className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={scrollRight}
                    className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={onToggleOpen}
                  className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
                  title="Close Property Tray"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Horizontal Snap Scroll Container */}
            <div
              ref={scrollContainerRef}
              className="flex items-center gap-3 overflow-x-auto pb-1 pt-0.5 scrollbar-none snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {properties.map((prop) => {
                const isSelected = selectedProperty?.id === prop.id;
                const isFav = favorites.includes(prop.id);

                return (
                  <div
                    key={prop.id}
                    onMouseEnter={() => onHoverProperty(prop.id)}
                    onMouseLeave={() => onHoverProperty(null)}
                    onClick={() => onSelectProperty(prop)}
                    className={`flex-shrink-0 w-[82vw] sm:w-80 bg-white rounded-xl p-3 border transition-all cursor-pointer snap-start ${
                      isSelected
                        ? 'border-blue-600 shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex gap-3 items-center">
                      {/* Thumbnail */}
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                        <img
                          src={prop.images[0]}
                          alt={prop.title}
                          className="w-full h-full object-cover"
                        />
                        <span
                          className={`absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-white ${
                            prop.type === 'sale' ? 'bg-blue-600' : 'bg-emerald-600'
                          }`}
                        >
                          {prop.type === 'sale' ? 'Sale' : 'Rent'}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="text-sm font-extrabold text-slate-900 tracking-tight truncate">
                            {prop.priceDisplay}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(prop.id);
                            }}
                            className={`p-1 rounded transition-colors ${
                              isFav ? 'text-rose-600' : 'text-slate-300 hover:text-rose-600'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-600' : ''}`} />
                          </button>
                        </div>

                        <div className="text-xs font-semibold text-slate-800 truncate mb-1">
                          {prop.title}
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate mb-2">
                          <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0" />
                          <span className="truncate">{prop.area}, {prop.city}</span>
                        </div>

                        {/* Action buttons on card */}
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onViewDetails) {
                                onViewDetails(prop, 'overview');
                              } else {
                                onSelectProperty(prop);
                              }
                            }}
                            className="h-7 px-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-md flex items-center gap-1 transition-colors"
                          >
                            <span>Details</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onViewDetails) {
                                onViewDetails(prop, 'emi');
                              } else {
                                onSelectProperty(prop);
                              }
                            }}
                            className="h-7 px-2.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold rounded-md flex items-center gap-1 transition-colors"
                          >
                            <Calculator className="w-3 h-3 text-blue-600" />
                            <span>Loan EMI</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyCardCarousel;
