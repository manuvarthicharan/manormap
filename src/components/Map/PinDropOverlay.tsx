import React from 'react';
import { MapPin, Check, X } from 'lucide-react';
import { ReverseGeocodeResult } from '../../services/geocoding';

interface PinDropOverlayProps {
  isActive: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  locationInfo: ReverseGeocodeResult | null;
  isLoadingLocation: boolean;
}

export const PinDropOverlay: React.FC<PinDropOverlayProps> = ({
  isActive,
  onCancel,
  onConfirm,
  locationInfo,
  isLoadingLocation
}) => {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none">
      {/* Top Banner with Instruction */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-auto max-w-md w-full px-4 animate-in slide-in-from-top duration-200">
        <div className="bg-slate-900 text-white rounded-xl p-3.5 shadow-xl border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Position Exact Property Rooftop</span>
            </div>
            <div className="text-[11px] text-slate-300 truncate mt-0.5">
              {isLoadingLocation ? (
                <span className="flex items-center gap-1.5 text-blue-300">
                  <span className="w-2.5 h-2.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  Resolving street address...
                </span>
              ) : locationInfo ? (
                <span>{locationInfo.area}, {locationInfo.city} ({locationInfo.pinCode})</span>
              ) : (
                <span>Pan or zoom map to align center marker</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Center Pin Indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none flex flex-col items-center">
        {/* Location tooltip badge above pin */}
        {locationInfo && (
          <div className="mb-1 px-3 py-1 bg-white text-slate-900 text-[11px] font-bold rounded-lg shadow-md border border-slate-200 whitespace-nowrap animate-in fade-in">
            {locationInfo.area || 'Selected Location'}
          </div>
        )}

        {/* Custom Marker Icon with Pulse */}
        <div className="relative">
          <div className="w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl border-2 border-white ring-4 ring-blue-500/20">
            <MapPin className="w-6 h-6 stroke-[2.2]" />
          </div>
          {/* Ground Contact Tip */}
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-blue-600 mx-auto -mt-0.5" />
        </div>

        {/* Shadow Pulse on the Ground */}
        <div className="w-6 h-2 bg-slate-900/30 rounded-full blur-[2px] mt-1 user-location-pulse" />
      </div>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 px-5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl shadow-lg border border-slate-200 flex items-center gap-2 transition-all active:scale-[0.98]"
        >
          <X className="w-4 h-4 text-slate-500" />
          <span>Cancel</span>
        </button>

        <button
          type="button"
          onClick={onConfirm}
          className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg border border-blue-600 flex items-center gap-2 transition-all active:scale-[0.98]"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Set Pin Location Here</span>
        </button>
      </div>
    </div>
  );
};

export default PinDropOverlay;
