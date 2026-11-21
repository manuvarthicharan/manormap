import React from 'react';
import { Property, AreaUnit } from '../../types';
import {
  X,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  Heart,
  ArrowRight,
  ShieldCheck,
  Scale,
  Sparkles,
  Share2,
  Check,
  Navigation
} from 'lucide-react';
import { formatAreaByUnit, getStoredAreaUnit } from '../../services/areaUnitService';
import { razorpayService } from '../../services/razorpayService';

interface PropertyPreviewProps {
  property: Property | null;
  onClose: () => void;
  onViewDetails: (property: Property, initialTab?: 'overview' | 'emi') => void;
  isFavorite: boolean;
  onToggleFavorite: (propertyId: string) => void;
  onToggleCompare?: (property: Property) => void;
  isCompared?: boolean;
  onOpenAIAdvisor?: (property: Property) => void;
  areaUnit?: AreaUnit;
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
  const [copied, setCopied] = React.useState(false);

  if (!property) return null;

  const isSpotlight = razorpayService.isPropertyBoosted(property.id);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?property=${encodeURIComponent(property.id)}`;
    const shareData = {
      title: `${property.title} | MapEstate`,
      text: `Verified property: ${property.title} in ${property.area}, ${property.city} for ${property.priceDisplay} on MapEstate`,
      url: shareUrl
    };

    if (navigator.share && typeof navigator.canShare === 'function' && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
        return;
      } catch {
        // Fall back to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className="z-30 pointer-events-auto">
      {/* Mobile: Bottom Sheet | Desktop: Floating Card near bottom left */}
      <div className="fixed inset-x-0 bottom-0 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md w-full animate-in slide-in-from-bottom duration-200 ease-out z-30">
        <div className={`bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden pb-3 sm:pb-0 max-h-[85dvh] overflow-y-auto ${
          isSpotlight ? 'border-2 border-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.25)]' : 'border border-slate-200'
        }`}>

          {/* Spotlight Promoted Header Ribbon */}
          {isSpotlight && (
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-3.5 py-1 text-[11px] font-black flex items-center justify-between shadow-xs">
              <span className="flex items-center gap-1.5">
                <span>⭐</span>
                <span>Featured Spotlight Property &bull; #1 Locality Rank</span>
              </span>
              <span className="bg-slate-950 text-amber-300 text-[9.5px] px-1.5 py-0.2 rounded-sm uppercase tracking-wide">
                Boosted
              </span>
            </div>
          )}

          {/* Mobile Drag Indicator */}
          <div className="sm:hidden w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-2.5" />

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

              {/* Rent / Sale & Trust Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider text-white shadow-xs ${property.type === 'sale' ? 'bg-blue-600' : 'bg-emerald-600'
                    }`}
                >
                  {property.type === 'sale' ? 'For Sale' : 'For Rent'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 shadow-xs">
                  {property.category}
                </span>
                {property.contact.type === 'Owner' && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow-xs flex items-center gap-1">
                    <span>Direct Owner</span>
                  </span>
                )}
                {property.verified && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-600 text-white shadow-xs flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>RERA Verified</span>
                  </span>
                )}
              </div>

              {/* Close Button on Image for Mobile */}
              <button
                onClick={onClose}
                className="sm:hidden absolute top-2 right-2 w-7 h-7 rounded-full bg-white text-slate-700 hover:text-slate-900 flex items-center justify-center shadow-md border border-slate-200"
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
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isCompared
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
                      onClick={handleShare}
                      className={`p-1.5 rounded-lg transition-colors ${copied
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-slate-400 bg-slate-100 hover:text-slate-700'
                        }`}
                      title={copied ? 'Link Copied!' : 'Share Personalized Link'}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => onToggleFavorite(property.id)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isFavorite
                        ? 'text-rose-600 bg-rose-50'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
                        }`}
                      title={isFavorite ? 'Remove Favorite' : 'Save Property'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-600' : ''}`} />
                    </button>
                    <button
                      onClick={onClose}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Mobile Top Row Price & Action Icons */}
                <div className="sm:hidden flex items-center justify-between gap-1 mb-1">
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
                      onClick={handleShare}
                      className={`p-1.5 rounded-lg transition-colors ${copied
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-slate-400 bg-slate-100 hover:text-slate-700'
                        }`}
                      title={copied ? 'Link Copied!' : 'Share Personalized Link'}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => onToggleFavorite(property.id)}
                      className={`p-1.5 rounded-lg ${isFavorite ? 'text-rose-600 bg-rose-50' : 'text-slate-400 bg-slate-100'
                        }`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-600' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Property Title */}
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 line-clamp-1 mb-1">
                  {property.title}
                </h3>

                {/* Locality & Address */}
                <div className="flex items-center gap-1 text-xs text-slate-600 font-medium mb-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span className="truncate">
                    {property.area || property.address}, {property.city}
                  </span>
                </div>

                {/* Key Spec Badges */}
                {property.category === 'Agricultural Land' || property.category === 'Plot' ? (
                  <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold flex-wrap">
                    <div className="flex items-center gap-1 text-emerald-700 font-bold">
                      🌾 <span>{formatAreaByUnit(property.areaSqFt, getStoredAreaUnit()).formatted}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <span>•</span>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {(property.landMetrics as any)?.soilType || 'Freehold Parcel'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                    {property.bhk ? (
                      <div className="flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5 text-slate-500" />
                        <span>{property.bhk} BHK</span>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5 text-slate-500" />
                      <span>{property.bathrooms} Baths</span>
                    </div>
                    <div className="flex items-center gap-1 font-extrabold text-slate-900">
                      <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatAreaByUnit(property.areaSqFt, getStoredAreaUnit()).formatted}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons: View Details & Google Maps Directions (Owner details gated behind paid plans) */}
              <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onViewDetails(property, 'overview')}
                  className="flex-1 h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98] shadow-xs"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {/* Direct Google Maps Navigation Link */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${property.coordinates[1]},${property.coordinates[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-3 border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98] flex-shrink-0"
                  title="Get Driving Directions on Google Maps"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Navigate</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyPreview;
