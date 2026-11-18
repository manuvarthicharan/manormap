import React, { useState } from 'react';
import {
  ChevronUp,
  MapPin,
  MessageCircle,
  Compass,
  X
} from 'lucide-react';
import { Property, AreaUnit } from '../../types';
import { formatIndianCurrency } from '../../services/propertyService';
import { formatAreaByUnit } from '../../services/areaUnitService';

export type SheetState = 'peek' | 'half' | 'full' | 'closed';

interface MobileListingSheetProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (property: Property) => void;
  hoveredPropertyId: string | null;
  onHoverProperty: (propertyId: string | null) => void;
  areaUnit: AreaUnit;
  localityName?: string;
  cityName?: string;
  isOpen?: boolean;
}

export const MobileListingSheet: React.FC<MobileListingSheetProps> = ({
  properties,
  selectedProperty,
  onSelectProperty,
  hoveredPropertyId,
  onHoverProperty,
  areaUnit,
  localityName = 'Area'
}) => {
  const [sheetState, setSheetState] = useState<SheetState>('peek');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Filter properties according to local category filter
  const filteredProperties = properties.filter((p) => {
    if (activeCategoryFilter === 'all') return true;
    return p.category.toLowerCase().includes(activeCategoryFilter.toLowerCase());
  });

  // Calculate starting price for peek display
  const minPrice = properties.length > 0
    ? Math.min(...properties.map((p) => p.price))
    : 0;

  // If a property is currently selected or user closed sheet, minimize/hide
  if (selectedProperty) {
    return null;
  }

  const cycleSheetState = () => {
    if (sheetState === 'peek') setSheetState('half');
    else if (sheetState === 'half') setSheetState('full');
    else setSheetState('peek');
  };

  const getContainerLayoutClass = () => {
    switch (sheetState) {
      case 'peek':
        return 'bottom-[72px] inset-x-3 rounded-2xl border border-slate-200 bg-white shadow-xl h-14 z-20';
      case 'half':
        return 'bottom-0 inset-x-0 rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl z-40 h-[52vh]';
      case 'full':
        return 'bottom-0 inset-x-0 rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl z-40 h-[90vh]';
      case 'closed':
        return 'h-0 hidden';
    }
  };

  return (
    <div
      className={`sm:hidden fixed pointer-events-auto transition-all duration-300 ease-out bg-white flex flex-col overflow-hidden ${getContainerLayoutClass()}`}
    >
      {/* DRAG HANDLE & HEADER BAR */}
      <div
        onClick={cycleSheetState}
        className="w-full flex-shrink-0 pt-2 pb-2 px-3.5 flex flex-col items-center cursor-pointer select-none border-b border-slate-100 hover:bg-slate-50 transition-colors"
      >
        {/* Grab bar pill */}
        <div className="w-9 h-1 rounded-full bg-slate-300 mb-1.5" />

        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 relative flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-extrabold text-slate-900 truncate">
              {filteredProperties.length} Listings in {localityName}
            </span>
            {minPrice > 0 && sheetState === 'peek' && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex-shrink-0">
                From {formatIndianCurrency(minPrice, 'sale')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 flex-shrink-0">
            {sheetState !== 'peek' ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSheetState('peek');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                title="Collapse sheet"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                <span>View</span>
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QUICK CATEGORY PILLS (Visible in half and full states) */}
      {sheetState !== 'peek' && (
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 overflow-x-auto flex-shrink-0 bg-slate-50">
          {[
            { id: 'all', label: 'All Listings' },
            { id: 'villa', label: 'Villas' },
            { id: 'apartment', label: 'Apartments' },
            { id: 'plot', label: 'Plots' },
            { id: 'agricultural', label: 'Farmland' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={(e) => {
                e.stopPropagation();
                setActiveCategoryFilter(cat.id);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                activeCategoryFilter === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* SCROLLABLE PROPERTY LIST */}
      {sheetState !== 'peek' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-100">
          {filteredProperties.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No properties found in this viewport for the selected filter.
            </div>
          ) : (
            filteredProperties.map((prop) => {
              const isHovered = hoveredPropertyId === prop.id;
              const formattedArea = formatAreaByUnit(prop.areaSqFt, areaUnit);
              const whatsAppPhone = prop.contact?.phone
                ? prop.contact.phone.replace(/[^0-9]/g, '')
                : '919849087654';
              const shareUrl = typeof window !== 'undefined'
                ? `${window.location.origin}${window.location.pathname}?property=${prop.id}`
                : '';
              const whatsAppText = encodeURIComponent(
                `Hi, I'm interested in "${prop.title}" (${formatIndianCurrency(prop.price, prop.type)}, ${prop.area || prop.address}, ${prop.city}). Link: ${shareUrl}. Please share floor plan and schedule site visit.`
              );

              return (
                <div
                  key={prop.id}
                  onClick={() => onSelectProperty(prop)}
                  onMouseEnter={() => onHoverProperty(prop.id)}
                  onMouseLeave={() => onHoverProperty(null)}
                  className={`pt-2.5 first:pt-0 flex gap-3 cursor-pointer group transition-all rounded-2xl p-2 ${
                    isHovered ? 'bg-blue-50/80 ring-1 ring-blue-500/40' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Property Image & Badges */}
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                    <img
                      src={prop.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80'}
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {/* Zero Brokerage Badge */}
                    {prop.isDirectOwner && (
                      <span className="absolute top-1 left-1 bg-emerald-600/95 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded shadow-xs">
                        0% Broker
                      </span>
                    )}
                    {/* RERA Badge */}
                    {prop.reraId && (
                      <span className="absolute bottom-1 right-1 bg-blue-600/95 text-white text-[9px] font-bold px-1 py-0.2 rounded shadow-xs">
                        RERA
                      </span>
                    )}
                  </div>

                  {/* Property Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {prop.title}
                        </h4>
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{prop.area || prop.address}, {prop.city}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium mt-1">
                        <span className="font-semibold text-slate-800">{prop.category}</span>
                        {prop.bhk && (
                          <>
                            <span>•</span>
                            <span>{prop.bhk} BHK</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-blue-700 font-bold">{formattedArea.formatted}</span>
                      </div>
                    </div>

                    {/* Price & Action Buttons */}
                    <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-100">
                      <span className="text-sm font-black text-emerald-700">
                        {formatIndianCurrency(prop.price, prop.type)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* WhatsApp CTA */}
                        <a
                          href={`https://wa.me/${whatsAppPhone}?text=${whatsAppText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                          title="Chat with Owner on WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Directions / Navigate CTA */}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${prop.coordinates[1]},${prop.coordinates[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors"
                          title="Get Directions on Google Maps"
                        >
                          <Compass className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
