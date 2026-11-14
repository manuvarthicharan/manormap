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
      <div className="absolute top-5 left-1/2 -translate-x-1/2 pointer-events-auto max-w-md w-full px-4 animate-in slide-in-from-top duration-150">
        <div className="bg-[#181716] text-[#f5f5f4] rounded-xs p-3 border border-[#44403c] shadow-[0_2px_12px_rgba(0,0,0,0.15)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-xs bg-[#8b3a24] text-white flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-mono uppercase tracking-wider text-[#f5f5f4]">
              Place property location
            </div>
            <div className="text-[11px] text-[#a8a29e] truncate mt-0.5">
              {isLoadingLocation ? (
                <span>Resolving address...</span>
              ) : locationInfo ? (
                <span>{locationInfo.area}, {locationInfo.city} (PIN: {locationInfo.pinCode})</span>
              ) : (
                <span>Pan the map to position the center marker</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Center Pin Indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none flex flex-col items-center">
        {locationInfo && (
          <div className="mb-1 px-2.5 py-0.5 bg-[#fbf9f6] text-[#1c1917] text-[11px] font-mono rounded-xs border border-[#d6d3d1] shadow-xs whitespace-nowrap animate-in fade-in">
            {locationInfo.area || 'Selected point'}
          </div>
        )}

        <div className="relative">
          <div className="w-9 h-9 bg-[#8b3a24] text-white rounded-xs flex items-center justify-center border border-[#7c2d12] shadow-sm">
            <MapPin className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-[#8b3a24] mx-auto -mt-0.5" />
        </div>

        <div className="w-4 h-1.5 bg-[#181716]/40 rounded-full blur-[1px] mt-0.5" />
      </div>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-2 animate-in slide-in-from-bottom duration-150">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-4 bg-[#fbf9f6] hover:bg-[#f5f2eb] text-[#1c1917] text-xs font-medium rounded-xs border border-[#e7e5e4] flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </button>

        <button
          type="button"
          onClick={onConfirm}
          className="h-9 px-4 bg-[#8b3a24] hover:bg-[#7c2d12] text-white text-xs font-medium uppercase font-mono tracking-wider rounded-xs flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Confirm location</span>
        </button>
      </div>
    </div>
  );
};

export default PinDropOverlay;
