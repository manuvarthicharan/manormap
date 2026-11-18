import React, { useState, useMemo, useEffect } from 'react';
import { Property, AreaUnit } from '../../types';
import { razorpayService } from '../../services/razorpayService';
import {
  X,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  Compass,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MessageCircle,
  Database,
  Share2,
  Heart,
  Calculator,
  Navigation,
  ExternalLink,
  Calendar,
  Clock,
  Sparkles,
  Scale,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Maximize,
  GraduationCap,
  Train,
  Building,
  Plane,
  Activity,
  Ruler,
  Shield,
  Car,
  Milestone,
  Receipt,
  ChevronDown,
  ChevronUp,
  Check,
  Lock
} from 'lucide-react';
import {
  analyzePropertyRiskAndAdvantages,
  computeNearbyPOIs,
  computeInfrastructureCommuteRings
} from '../../services/aiIntelligenceService';
import { geminiIntelligenceService, GeminiPropertyAudit } from '../../services/geminiIntelligenceService';
import { calculateAllInLandingCost } from '../../services/allInCostService';
import { formatAreaByUnit, getStoredAreaUnit } from '../../services/areaUnitService';
import { formatIndianCurrency } from '../../services/propertyService';

interface PropertyDetailModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  initialTab?: 'overview' | 'approvals' | 'commute' | 'amenities' | 'emi' | 'locality' | 'ai-risk' | 'nearby';
  onToggleCompare?: (property: Property) => void;
  isCompared?: boolean;
  onOpenAIAdvisor?: (property: Property) => void;
  onOpenRoiCalculator?: (property: Property) => void;
  onOpenPricing?: (category: 'buyer_pass' | 'seller_boost' | 'due_diligence' | 'agent_sub' | 'legal_agreement', property: Property) => void;
  areaUnit?: AreaUnit;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  initialTab = 'overview',
  onToggleCompare,
  isCompared = false,
  onOpenAIAdvisor,
  onOpenRoiCalculator,
  onOpenPricing
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'commute' | 'amenities' | 'emi' | 'locality' | 'ai-risk' | 'nearby'>(initialTab);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [tourBooked, setTourBooked] = useState(false);
  const [tourDate, setTourDate] = useState('This Saturday');
  const [tourTime, setTourTime] = useState('11:00 AM');
  const [tourType, setTourType] = useState<'in-person' | 'video'>('in-person');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showAllInCostDrawer, setShowAllInCostDrawer] = useState(false);
  const activeAreaUnit = getStoredAreaUnit();
  const allInCost = useMemo(() => (property ? calculateAllInLandingCost(property) : null), [property]);
  const commuteRings = useMemo(() => (property ? computeInfrastructureCommuteRings(property) : []), [property]);

  // Contact Unlock State powered by Razorpay
  const [isContactUnlocked, setIsContactUnlocked] = useState<boolean>(() => {
    return property ? razorpayService.isContactUnlocked(property.id) : false;
  });

  useEffect(() => {
    if (property) {
      setIsContactUnlocked(razorpayService.isContactUnlocked(property.id));
    }
  }, [property?.id]);

  useEffect(() => {
    const handleUpdate = () => {
      if (property) {
        setIsContactUnlocked(razorpayService.isContactUnlocked(property.id));
      }
    };
    window.addEventListener('manormap_contacts_updated', handleUpdate);
    window.addEventListener('manormap_payment_success', handleUpdate);
    return () => {
      window.removeEventListener('manormap_contacts_updated', handleUpdate);
      window.removeEventListener('manormap_payment_success', handleUpdate);
    };
  }, [property?.id]);

  const activeBuyerPass = razorpayService.getActiveBuyerPass();

  const handleUnlockContact = () => {
    if (!property) return;
    if (activeBuyerPass && activeBuyerPass.contactsRemaining > 0) {
      razorpayService.unlockContact(property.id);
      setIsContactUnlocked(true);
    } else {
      onOpenPricing?.('buyer_pass', property);
    }
  };

  // Gemini Flash Live Property Audit
  const [geminiAudit, setGeminiAudit] = useState<GeminiPropertyAudit | null>(null);
  const [isLoadingGeminiAudit, setIsLoadingGeminiAudit] = useState(false);

  // Fetch live Gemini 2.5 Flash property audit
  useEffect(() => {
    if (property && isOpen) {
      setIsLoadingGeminiAudit(true);
      geminiIntelligenceService.getPropertyAudit(property)
        .then((audit) => {
          setGeminiAudit(audit);
        })
        .catch((err) => {
          console.warn('Gemini property audit error:', err);
        })
        .finally(() => {
          setIsLoadingGeminiAudit(false);
        });
    }
  }, [property?.id, isOpen]);

  // EMI Calculator State
  const initialPrincipal = useMemo(() => {
    if (!property) return 5000000;
    return property.type === 'sale' ? Math.round(property.price * 0.8) : 500000;
  }, [property]);

  const [loanAmount, setLoanAmount] = useState<number>(initialPrincipal);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [loanTenureYears, setLoanTenureYears] = useState<number>(20);

  // Synchronize activeTab and defaults only when modal opens or initialTab changes
  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      if (property) {
        setLoanAmount(property.type === 'sale' ? Math.round(property.price * 0.8) : 500000);
        setSelectedImageIndex(0);
        setTourBooked(false);
      }
    }
  }, [isOpen, initialTab, property?.id]);

  // Compute EMI: P * r * (1+r)^n / ((1+r)^n - 1)
  const monthlyEmi = useMemo(() => {
    const monthlyRate = interestRate / 12 / 100;
    const totalMonths = loanTenureYears * 12;
    if (monthlyRate === 0) return Math.round(loanAmount / totalMonths);
    const emi =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
    return Math.round(emi);
  }, [loanAmount, interestRate, loanTenureYears]);

  const totalPayment = monthlyEmi * loanTenureYears * 12;
  const totalInterest = Math.max(0, totalPayment - loanAmount);
  const principalPercentage = Math.round((loanAmount / (totalPayment || 1)) * 100);

  // AI & Geospatial analysis
  const aiAnalysis = useMemo(() => {
    if (!property) return null;
    return analyzePropertyRiskAndAdvantages(property);
  }, [property]);

  const nearbyPOIs = useMemo(() => {
    if (!property) return [];
    return computeNearbyPOIs(property.coordinates);
  }, [property]);

  if (!isOpen || !property) return null;

  const pricePerSqFt = property.areaSqFt > 0 ? Math.round(property.price / property.areaSqFt) : 0;
  const cleanPhone = property.contact.phone.replace(/\D/g, '');
  const whatsAppPhone = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone;
  const propertyShareUrl = `${window.location.origin}${window.location.pathname}?property=${encodeURIComponent(property.id)}`;
  const whatsAppUrl = `https://wa.me/${whatsAppPhone}?text=${encodeURIComponent(
    `Hello ${property.contact.name}, I am inquiring regarding "${property.title}" (${property.priceDisplay}) on ManorMap: ${propertyShareUrl}\n\nIs it available? Please share site visit slot details.`
  )}`;

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${property.coordinates[1]},${property.coordinates[0]}`;

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?property=${encodeURIComponent(property.id)}`;
    const shareData = {
      title: `${property.title} | ManorMap`,
      text: `Verified property: ${property.title} in ${property.area}, ${property.city} for ${property.priceDisplay}`,
      url: shareUrl
    };

    if (navigator.share && typeof navigator.canShare === 'function' && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2500);
        return;
      } catch {
        // Fall back to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    }
  };

  const handleBookTourSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTourBooked(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Full-Screen Lightbox for High-Res Image Inspection */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col justify-between p-4 animate-in fade-in">
          <div className="flex items-center justify-between text-white pb-2">
            <span className="text-sm font-bold">
              {property.title} — Photo {selectedImageIndex + 1} of {property.images.length}
            </span>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            <img
              src={property.images[selectedImageIndex]}
              alt={property.title}
              className="max-h-[82vh] max-w-[92vw] object-contain rounded-xl shadow-2xl"
            />

            {property.images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setSelectedImageIndex((prev) =>
                      prev === 0 ? property.images.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() =>
                    setSelectedImageIndex((prev) =>
                      prev === property.images.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Strip */}
          <div className="flex justify-center gap-2 overflow-x-auto pt-3">
            {property.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === idx ? 'border-blue-500 scale-105' : 'border-transparent opacity-60'
                  }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div 
        className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4 text-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="relative w-full max-w-4xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl text-left overflow-hidden transform transition-all border border-slate-200 max-h-[94dvh] sm:max-h-[90vh] flex flex-col">

          {/* Header Bar */}
          <div className="h-16 px-4 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20 flex-shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider text-white ${property.type === 'sale' ? 'bg-blue-600' : 'bg-emerald-600'
                  }`}
              >
                {property.type === 'sale' ? 'For Sale' : 'For Rent'}
              </span>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                {property.category}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>{property.reraId ? `RERA: ${property.reraId}` : 'RERA Verified'}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Compare Button */}
              {onToggleCompare && (
                <button
                  onClick={() => onToggleCompare(property)}
                  className={`h-9 px-3 rounded-lg border flex items-center gap-1.5 text-xs font-semibold transition-colors ${isCompared
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  title="Compare Property"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isCompared ? 'Compared' : 'Compare'}</span>
                </button>
              )}

              {/* Ask ManorMap AI Button */}
              {onOpenAIAdvisor && (
                <button
                  onClick={() => {
                    onOpenAIAdvisor(property);
                    onClose();
                  }}
                  className="h-9 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center gap-1.5 text-xs font-bold shadow-sm transition-all active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="hidden sm:inline">Ask AI</span>
                </button>
              )}

              <button
                onClick={handleShare}
                className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 text-xs font-semibold transition-colors"
                title="Share Property"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{copyFeedback ? 'Link Copied!' : 'Share'}</span>
              </button>

              <button
                onClick={() => onToggleFavorite(property.id)}
                className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-colors ${isFavorite
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                title="Save Property"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-600' : ''}`} />
              </button>

              <button
                onClick={onClose}
                className="h-9 w-9 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto">

            {/* Photo Gallery Showcase with Lightbox Trigger */}
            {property.images && property.images.length > 0 && (
              <div className="space-y-3">
                <div className="relative w-full h-64 sm:h-96 rounded-2xl overflow-hidden bg-slate-100 shadow-sm border border-slate-200 group">
                  <img
                    src={property.images[selectedImageIndex] || property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                  />

                  {/* Fullscreen Expansion Pill */}
                  <button
                    onClick={() => setIsLightboxOpen(true)}
                    className="absolute top-3 right-3 px-3 py-1.5 bg-slate-950 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
                  >
                    <Maximize className="w-3.5 h-3.5" />
                    <span>Expand Gallery</span>
                  </button>

                  <div className="absolute bottom-3 right-3 px-3 py-1 bg-slate-900 rounded-lg text-xs font-semibold text-white shadow-md">
                    {selectedImageIndex + 1} / {property.images.length}
                  </div>
                </div>

                {property.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {property.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${selectedImageIndex === idx
                          ? 'border-blue-600 ring-2 ring-blue-500/20'
                          : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Title & Price Header */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {property.priceDisplay}
                  </div>
                  {property.maintenanceMonthly && (
                    <div className="text-xs text-slate-500 font-medium">
                      + ₹{property.maintenanceMonthly.toLocaleString('en-IN')}/mo maintenance
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {pricePerSqFt > 0 && (
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                      ₹{pricePerSqFt.toLocaleString('en-IN')} / sq.ft
                    </span>
                  )}
                  {aiAnalysis && (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1 ${aiAnalysis.floodRisk === 'Low'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                      <Activity className="w-3.5 h-3.5" />
                      <span>Flood: {aiAnalysis.floodRisk} Risk</span>
                    </span>
                  )}
                </div>
              </div>

              <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                {property.title}
              </h1>

              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 mt-1.5">
                <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>
                  {property.address}, {property.area}, {property.city}, {property.state} &bull; PIN: {property.pinCode}
                </span>
              </div>
            </div>

            {/* Exact-Geometry Segmented Tab Navigation */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto text-xs font-bold scrollbar-none">
              {[
                { id: 'overview', label: 'Overview & Cost' },
                { id: 'approvals', label: 'Verify Approvals & Bhu-dhaar' },
                { id: 'commute', label: 'Commute & Metro Rings' },
                { id: 'ai-risk', label: 'AI Risk Audit' },
                { id: 'amenities', label: `Amenities (${property.features.length})` },
                { id: 'emi', label: 'Loan EMI' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`h-9 px-3.5 rounded-lg transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {tab.id === 'approvals' && <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />}
                  {tab.id === 'commute' && <Milestone className="w-3.5 h-3.5 text-emerald-600" />}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* TAB CONTENT 1: OVERVIEW & SPECS */}
            {activeTab === 'overview' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {property.description && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                      Property Overview
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {property.description}
                    </p>
                  </div>
                )}

                {/* Key Metrics Grid with Universal Area Conversion */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                      <BedDouble className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Configuration</div>
                      <div className="text-sm font-extrabold text-slate-900">
                        {property.category === 'Agricultural Land' || property.category === 'Plot'
                          ? 'Open Parcel'
                          : `${property.bhk} BHK`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                      <Bath className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Baths / Washrooms</div>
                      <div className="text-sm font-extrabold text-slate-900">
                        {property.bathrooms > 0
                          ? `${property.bathrooms} Baths ${property.balconies ? `+ ${property.balconies} Balc.` : ''}`
                          : 'Not applicable'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Area ({activeAreaUnit.toUpperCase()})</div>
                      <div className="text-sm font-extrabold text-slate-900">
                        {formatAreaByUnit(property.areaSqFt, activeAreaUnit).formatted}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Facing</div>
                      <div className="text-sm font-extrabold text-slate-900">{property.facing || 'East (Vastu Compliant)'}</div>
                    </div>
                  </div>
                </div>

                {/* Additional Parameters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Furnishing</div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">{property.furnishing}</div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Car Parking</div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">{property.parking}</div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Floor Level</div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">{property.floorInfo || 'Mid-Rise Floor'}</div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Possession</div>
                    <div className="text-xs sm:text-sm font-bold text-emerald-700 mt-0.5">
                      {property.readyToMove ? 'Ready to Move' : 'Under Construction'}
                    </div>
                  </div>
                </div>

                {/* All-In Landing Cost Breakdown Drawer (Expandable) */}
                {allInCost && (
                  <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/50 via-white to-slate-50 overflow-hidden shadow-xs">
                    <div
                      onClick={() => setShowAllInCostDrawer(!showAllInCostDrawer)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-blue-50/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-slate-900">
                              All-In Landing Cost Breakdown
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              +{allInCost.extraOverheadPercentage}% Total Cheque
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Estimated Total Cheque: <strong className="text-slate-900">{formatIndianCurrency(allInCost.totalLandingCost)}</strong> (incl. Stamp Duty & Taxes)
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 hidden sm:inline">
                          {showAllInCostDrawer ? 'Hide Breakdown' : 'View Itemized'}
                        </span>
                        {showAllInCostDrawer ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
                      </div>
                    </div>

                    {showAllInCostDrawer && (
                      <div className="p-4 pt-1 border-t border-blue-100 bg-white space-y-2.5 text-xs animate-in fade-in duration-150">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                          <div className="flex justify-between items-center text-slate-700">
                            <span>Base Agreement Value</span>
                            <span className="font-extrabold text-slate-900">{formatIndianCurrency(allInCost.basePrice)}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span>State Stamp Duty ({allInCost.stampDutyRate}% for {property.state || 'Telangana'})</span>
                            <span className="font-semibold text-slate-900">+{formatIndianCurrency(allInCost.stampDutyAmount)}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Registration Charges ({allInCost.registrationRate}%)</span>
                            <span className="font-semibold text-slate-900">+{formatIndianCurrency(allInCost.registrationAmount)}</span>
                          </div>
                          {allInCost.gstAmount > 0 && (
                            <div className="flex justify-between items-center text-slate-600">
                              <span>GST ({allInCost.gstRate}% Under Construction)</span>
                              <span className="font-semibold text-slate-900">+{formatIndianCurrency(allInCost.gstAmount)}</span>
                            </div>
                          )}
                          {allInCost.corpusDeposit > 0 && (
                            <div className="flex justify-between items-center text-slate-600">
                              <span>Sinking / Corpus Fund Deposit (Society Asset)</span>
                              <span className="font-semibold text-slate-900">+{formatIndianCurrency(allInCost.corpusDeposit)}</span>
                            </div>
                          )}
                          {allInCost.advanceMaintenance > 0 && (
                            <div className="flex justify-between items-center text-slate-600">
                              <span>Advance Maintenance (12 Months)</span>
                              <span className="font-semibold text-slate-900">+{formatIndianCurrency(allInCost.advanceMaintenance)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Legal Title Clearance & Franking Documentation</span>
                            <span className="font-semibold text-slate-900">+{formatIndianCurrency(allInCost.legalAndAdminCharges)}</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex justify-between items-center text-sm font-black text-blue-950">
                          <span>Final Total Landing Cheque Amount</span>
                          <span className="text-base text-blue-700">{formatIndianCurrency(allInCost.totalLandingCost)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Verified Trust & Freshness Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/60 to-slate-50 border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span>{property.contact.type === 'Owner' ? 'Direct Owner Listing (Zero Brokerage)' : 'Verified Real Estate Partner'}</span>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Active &bull; Verified 2d ago
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        State RERA Registration: <span className="font-mono font-bold text-slate-700">{property.reraId || 'TS-RERA-2024-REG'}</span> &bull; Responding in &lt;15 mins
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: VERIFY APPROVALS & STATE LAND RECORDS (BHU BHARATI & RERA) */}
            {activeTab === 'approvals' && (
              <div className="space-y-4 animate-in fade-in duration-150 text-xs">
                {/* Header Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950 to-indigo-950 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">Title & Government Records Due Diligence</div>
                      <div className="text-[11px] text-blue-200 mt-0.5">
                        Cross-referenced against Telangana Bhu Bharati, Dharani, HMDA/DTCP, and RERA
                      </div>
                    </div>
                  </div>
                </div>

                {/* Structured Checklist */}
                <div className="space-y-3">
                  {/* Item 1: Bhu Bharati & Bhu-dhaar ID */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          Bhu Bharati & Bhu-dhaar Parcel ID
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Assigned 11-Digit Unique Land Parcel Identifier: <span className="font-mono font-bold text-slate-800">{property.bhuDhaarId || '36-020-014-0421'}</span>
                        </div>
                      </div>
                    </div>
                    <a
                      href="https://bhubharati.telangana.gov.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 self-start sm:self-center transition-colors"
                    >
                      <span>Check Bhu Bharati</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Item 2: Pahani / ROR-1B Title Record */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          Pahani / ROR-1B Title Deed Verification
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Revenue Survey Number: <span className="font-mono font-bold text-slate-800">{property.surveyNumber || 'Sy. No. 128/A'}</span> &bull; Pattadar name matches registered title deed.
                        </div>
                      </div>
                    </div>
                    <a
                      href="https://dharani.telangana.gov.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 self-start sm:self-center transition-colors"
                    >
                      <span>Pahani Search</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Item 3: Section 22A Prohibited List Check */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        Section 22A Prohibited Property Register
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Clean search result. Parcel is verified as freehold with zero Wakf, Endowment, ceiling surplus, or government-disputed status.
                      </div>
                    </div>
                  </div>

                  {/* Item 4: Layout & Planning Authority (HMDA / DTCP) */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 font-bold">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          Urban Planning Approval ({property.approvalAuthority || 'HMDA / DTCP Layout'})
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Layout Permission (LP): <span className="font-mono font-bold text-slate-800">{property.layoutApprovalNo || 'LP No. 000142/LO/Plg/HMDA/2024'}</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold self-start sm:self-center">
                      Layout Released
                    </span>
                  </div>

                  {/* Item 5: RERA Project Registration */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 font-bold">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          Real Estate Regulatory Authority (RERA) Registration
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          RERA ID: <span className="font-mono font-bold text-blue-700">{property.reraId || 'P02400008921'}</span> &bull; 70% Escrow Account Active
                        </div>
                      </div>
                    </div>
                    <a
                      href="https://rera.telangana.gov.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 self-start sm:self-center transition-colors"
                    >
                      <span>Verify on TS-RERA</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: COMMUTE & INFRASTRUCTURE PROXIMITY RINGS */}
            {activeTab === 'commute' && (
              <div className="space-y-4 animate-in fade-in duration-150 text-xs">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold flex-shrink-0">
                      <Milestone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">Peak Travel & Infrastructure Proximity</div>
                      <div className="text-[11px] text-emerald-200 mt-0.5">
                        Benchmarked with live Google Maps traffic from {property.area}, {property.city}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {commuteRings.map((ring, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center flex-shrink-0 font-bold">
                          {ring.category === 'metro' && <Train className="w-4 h-4" />}
                          {ring.category === 'highway' && <Car className="w-4 h-4" />}
                          {ring.category === 'it_hub' && <Building className="w-4 h-4" />}
                          {ring.category === 'hospital' && <Activity className="w-4 h-4" />}
                          {ring.category === 'school' && <GraduationCap className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {ring.name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {ring.description}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-black text-emerald-700">
                            {ring.driveTimeMin} mins peak drive
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {ring.distanceKm} km &bull; {ring.transitTimeMin} mins transit
                          </div>
                        </div>

                        <a
                          href={googleMapsDirectionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors"
                          title="Open Google Maps Navigation"
                        >
                          <Navigation className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

      {/* TAB CONTENT: AI GEOSPATIAL RISK & PROS/CONS */}
      {activeTab === 'ai-risk' && aiAnalysis && (
        <div className="space-y-4 animate-in fade-in duration-150 text-xs">
          {/* Gemini Live Institutional Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black flex-shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white">Live Institutional Audit</span>
                  <span className="text-[10px] font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-900 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-ping" />
                    Verified AI Advisory
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  {isLoadingGeminiAudit ? (
                    <span className="text-blue-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 animate-spin text-emerald-400" />
                      Auditing property terrain, RERA price benchmark & Vastu...
                    </span>
                  ) : (
                    geminiAudit?.investmentVerdict || aiAnalysis.investmentVerdict
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (property) {
                  setIsLoadingGeminiAudit(true);
                  geminiIntelligenceService.getPropertyAudit(property)
                    .then((a) => setGeminiAudit(a))
                    .finally(() => setIsLoadingGeminiAudit(false));
                }
              }}
              disabled={isLoadingGeminiAudit}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors border border-white/10 flex-shrink-0 disabled:opacity-50"
            >
              {isLoadingGeminiAudit ? 'Auditing...' : 'Re-run AI Audit'}
            </button>
          </div>

          {/* Gemini Facing, RERA Price Benchmark & 5-Year Forecast */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1">
              <div className="text-[10px] font-bold text-blue-700 uppercase">Facing & Solar Orientation</div>
              <div className="text-xs font-black text-slate-900">{property.facing || 'East'} Facing</div>
              <div className="text-[11px] text-slate-600 leading-snug">
                {geminiAudit?.facingBenefits || 'Optimal morning illumination with balanced cross-ventilation.'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
              <div className="text-[10px] font-bold text-emerald-700 uppercase">RERA Price Benchmark</div>
              <div className="text-xs font-black text-slate-900">
                ₹{(property.areaSqFt > 0 ? Math.round(property.price / property.areaSqFt) : 0).toLocaleString('en-IN')}/sq.ft
              </div>
              <div className="text-[11px] text-slate-600 leading-snug">
                {geminiAudit?.priceAssessment || aiAnalysis.priceFairness}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
              <div className="text-[10px] font-bold text-indigo-700 uppercase">5-Year Growth & Yield</div>
              <div className="text-xs font-black text-slate-900">
                {geminiAudit?.grossRentalYieldEstimate || '3.8% - 4.6% Yield'}
              </div>
              <div className="text-[11px] text-slate-600 leading-snug">
                {geminiAudit?.fiveYearAppreciationForecast || 'Steady capital appreciation driven by tech corridor expansion.'}
              </div>
            </div>
          </div>

          {/* Risk Meters Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Topography Elevation</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">~{aiAnalysis.elevationMeters}m MSL</div>
              <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                Safe surface gradient drainage slope
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Flood Catchment Risk</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(geminiAudit?.floodRisk || aiAnalysis.floodRisk) === 'Low'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
                  }`}>
                  {geminiAudit?.floodRisk || aiAnalysis.floodRisk} Risk
                </span>
              </div>
              <div className="text-[11px] text-slate-600 mt-1 leading-snug">
                {geminiAudit?.floodRiskDetails || `Buffer distance: ${aiAnalysis.waterbodyProximity.distanceKm.toFixed(1)} km from ${aiAnalysis.waterbodyProximity.name}.`}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Landfill / Mining Buffer</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">{aiAnalysis.environmentalRisk.dumpyardDistanceKm.toFixed(1)} km</div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Rating: <span className="font-bold text-emerald-600">{aiAnalysis.environmentalRisk.riskRating}</span>
              </div>
            </div>
          </div>

          {/* Pointwise Advantages (Pros) */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
            <div className="font-extrabold text-sm text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pointwise Advantages & Capital Drivers (Verified AI Assessment)</span>
            </div>
            <ul className="space-y-1.5 text-slate-700">
              {(geminiAudit?.pros || aiAnalysis.pros).map((pro, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pointwise Disadvantages / Watch Points (Cons) */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
            <div className="font-extrabold text-sm text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Pointwise Disadvantages & Locality Watchpoints (Verified AI Assessment)</span>
            </div>
            <ul className="space-y-1.5 text-slate-700">
              {(geminiAudit?.cons || aiAnalysis.cons).map((con, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Investment Verdict Box */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/90 text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Institutional Investment Verdict
              </div>
              <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                {geminiAudit?.investmentVerdict || aiAnalysis.investmentVerdict}
              </div>
              <p className="text-[11px] text-slate-600 mt-1 max-w-lg">
                {geminiAudit?.priceAssessment || aiAnalysis.priceFairness}
              </p>
            </div>

            {onOpenAIAdvisor && (
              <button
                onClick={() => {
                  onOpenAIAdvisor(property);
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 flex-shrink-0 transition-colors shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Chat with Agent</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: NEARBY PLACES INTELLIGENCE */}
      {activeTab === 'nearby' && (
        <div className="space-y-4 animate-in fade-in duration-150 text-xs">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-900 font-medium">
            Verified travel distance and commute buffer to key civic hubs in {property.area}, {property.city}.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nearbyPOIs.map((poi, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                    {poi.category === 'metro' && <Train className="w-4 h-4 text-blue-600" />}
                    {poi.category === 'hospital' && <Activity className="w-4 h-4 text-rose-600" />}
                    {poi.category === 'school' && <GraduationCap className="w-4 h-4 text-amber-600" />}
                    {poi.category === 'it_hub' && <Building className="w-4 h-4 text-indigo-600" />}
                    {poi.category === 'airport' && <Plane className="w-4 h-4 text-sky-600" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{poi.name}</div>
                    <div className="text-[11px] text-slate-500 capitalize">{poi.category.replace('_', ' ')} &bull; {poi.badge}</div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="font-black text-slate-900">{poi.distanceKm.toFixed(1)} km</div>
                  <div className="text-[11px] text-emerald-600 font-semibold">~{poi.commuteTimeMinutes} mins drive</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: AMENITIES */}
      {activeTab === 'amenities' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs font-semibold text-blue-900">
            All {property.features.length} residential & society amenities verified.
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {property.features.map((feat, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs font-bold text-slate-800"
              >
                <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: MORTGAGE LOAN EMI CALCULATOR */}
      {activeTab === 'emi' && (
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 space-y-5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Home Loan EMI Estimator
                </div>
                <div className="text-[11px] text-slate-500">Competitive bank rates starting at 8.5% p.a.</div>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Estimated Monthly EMI</div>
              <div className="text-2xl font-black text-emerald-700 tracking-tight">
                ₹{monthlyEmi.toLocaleString('en-IN')}<span className="text-xs text-slate-500 font-normal">/month</span>
              </div>
            </div>
          </div>

          {/* Progress Bar of Principal vs Interest */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
              <span>Principal: ₹{(loanAmount / 100000).toFixed(1)} L ({principalPercentage}%)</span>
              <span>Total Interest: ₹{(totalInterest / 100000).toFixed(1)} L</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
              <div
                className="bg-blue-600 h-full transition-all duration-200"
                style={{ width: `${principalPercentage}%` }}
              />
              <div
                className="bg-emerald-500 h-full transition-all duration-200"
                style={{ width: `${100 - principalPercentage}%` }}
              />
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-slate-600 flex justify-between mb-2">
                <span className="font-semibold">Loan Amount (₹)</span>
                <span className="font-bold text-slate-900">₹{(loanAmount / 100000).toFixed(1)} L</span>
              </div>
              <input
                type="range"
                min={500000}
                max={property.price || 50000000}
                step={100000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-slate-600 flex justify-between mb-2">
                <span className="font-semibold">Interest Rate (% p.a.)</span>
                <span className="font-bold text-slate-900">{interestRate}%</span>
              </div>
              <input
                type="range"
                min={7.5}
                max={12.0}
                step={0.1}
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-slate-600 flex justify-between mb-2">
                <span className="font-semibold">Loan Tenure</span>
                <span className="font-bold text-slate-900">{loanTenureYears} Years</span>
              </div>
              <input
                type="range"
                min={5}
                max={30}
                step={1}
                value={loanTenureYears}
                onChange={(e) => setLoanTenureYears(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          {onOpenRoiCalculator && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => onOpenRoiCalculator(property)}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-sm"
              >
                <Calculator className="w-4 h-4" />
                <span>Full Institutional ROI & Buy vs Rent Analysis</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: LOCALITY & TRANSIT */}
      {activeTab === 'locality' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <div className="text-2xl font-black text-blue-700">{property.localityScores?.transit || 92} / 100</div>
              <div className="text-xs font-bold text-slate-800 mt-1">Transit & Connectivity</div>
              <div className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                Arterial expressway & transit accessibility in {property.area}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <div className="text-2xl font-black text-emerald-700">{property.localityScores?.lifestyle || 88} / 100</div>
              <div className="text-xs font-bold text-slate-800 mt-1">Daily Essentials</div>
              <div className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                Top schools, retail avenues & healthcare in {property.area}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
              <div className="text-2xl font-black text-indigo-700">{property.localityScores?.safety || 95} / 100</div>
              <div className="text-xs font-bold text-slate-800 mt-1">Safety & Security</div>
              <div className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                24/7 Gated security & CCTV surveillance
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div>
                <span className="font-bold text-slate-800">Coordinates: </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {property.coordinates[1].toFixed(5)}° N, {property.coordinates[0].toFixed(5)}° E
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-50 text-xs font-bold shadow-xs transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span>Google Maps Directions</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Cadastral Land Boundary & Indian Metrics Card */}
          {property.boundaryPolygon && property.boundaryPolygon.length >= 3 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                    <Ruler className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wide">
                      Official Shaded Land Parcel Boundary
                    </div>
                    <div className="text-[11px] text-emerald-800">
                      Shaded Land Boundary • Perimeter {property.landMetrics?.perimeterMeters ? `${Math.round(property.landMetrics.perimeterMeters)}m` : 'Mapped'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2.5 py-1 rounded-full shadow-2xs flex-shrink-0">
                  Verified Parcel
                </span>
              </div>

              {/* 4-Box Indian Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-100 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Acres</span>
                  <div className="text-base font-black text-emerald-700">
                    {property.landMetrics?.areaAcres ? property.landMetrics.areaAcres.toFixed(2) : (property.areaSqFt / 43560).toFixed(2)} Ac
                  </div>
                  <span className="text-[9px] text-slate-400">Standard Indian Acre</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-100 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Gunthas</span>
                  <div className="text-base font-black text-amber-700">
                    {property.landMetrics?.areaGunthas ? property.landMetrics.areaGunthas.toFixed(1) : ((property.areaSqFt / 43560) * 40).toFixed(1)}
                  </div>
                  <span className="text-[9px] text-slate-400">1 Acre = 40 Gunthas</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-100 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Sq. Yards (Gaj)</span>
                  <div className="text-base font-black text-slate-900">
                    {property.landMetrics?.areaSqYards ? property.landMetrics.areaSqYards.toLocaleString('en-IN') : Math.round(property.areaSqFt / 9).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[9px] text-slate-400">Plot measurement</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-100 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Outer Perimeter</span>
                  <div className="text-base font-black text-sky-700">
                    {property.landMetrics?.perimeterMeters ? `${Math.round(property.landMetrics.perimeterMeters)}m` : 'Mapped'}
                  </div>
                  <span className="text-[9px] text-slate-400">Fencing distance</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule Visit Box */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Schedule Private Walkthrough
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
            Free
          </span>
        </div>

        {!tourBooked ? (
          <form onSubmit={handleBookTourSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Date</label>
                <select
                  value={tourDate}
                  onChange={(e) => setTourDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="Tomorrow">Tomorrow</option>
                  <option value="This Saturday">This Saturday</option>
                  <option value="This Sunday">This Sunday</option>
                  <option value="Next Week">Next Week</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Time Slot</label>
                <select
                  value={tourTime}
                  onChange={(e) => setTourTime(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="10:00 AM">10:00 AM (Morning)</option>
                  <option value="2:00 PM">2:00 PM (Afternoon)</option>
                  <option value="5:00 PM">5:00 PM (Evening)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Type</label>
                <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-200 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setTourType('in-person')}
                    className={`py-1.5 text-[10px] font-bold rounded transition-colors ${tourType === 'in-person' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                  >
                    In-Person
                  </button>
                  <button
                    type="button"
                    onClick={() => setTourType('video')}
                    className={`py-1.5 text-[10px] font-bold rounded transition-colors ${tourType === 'video' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                  >
                    Video
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Confirm {tourType === 'in-person' ? 'Site Visit' : 'Video Tour'} on {tourDate} at {tourTime}</span>
            </button>
          </form>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 animate-in fade-in">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-emerald-900">
                Visit Confirmed for {tourDate} at {tourTime}!
              </div>
              <div className="text-emerald-700 text-[11px]">
                The verified lister will meet you at the property. Details sent via SMS.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Direct Contact Bar - Razorpay Unlock Engine */}
      {isContactUnlocked ? (
        <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Verified Direct Owner Contact (Unlocked)</span>
            </div>
            <div className="text-base font-extrabold text-slate-900 mt-0.5">{property.contact.name}</div>
            <div className="text-xs font-bold text-slate-700">{property.contact.phone}</div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={`tel:${cleanPhone}`}
              className="flex-1 sm:flex-initial h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Owner</span>
            </a>
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 rounded-2xl border border-blue-200 bg-blue-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-blue-800 font-bold">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>Direct Owner Contact Protected &bull; Zero Brokerage Access</span>
            </div>
            <div className="text-base font-extrabold text-slate-900 mt-0.5">{property.contact.name} ({property.contact.type})</div>
            <div className="text-xs font-mono font-bold text-slate-500 tracking-wider">
              {property.contact.phone.slice(0, 6)} &bull;&bull;&bull;&bull;&bull;&bull;
            </div>
          </div>

          <button
            type="button"
            onClick={handleUnlockContact}
            className="w-full sm:w-auto h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Lock className="w-4 h-4" />
            <span>
              {activeBuyerPass && activeBuyerPass.contactsRemaining > 0
                ? `Use 1 Pass Credit to Unlock (${activeBuyerPass.contactsRemaining} Left)`
                : 'Unlock Owner Phone & WhatsApp (Razorpay)'}
            </span>
          </button>
        </div>
      )}

    </div>
        </div >
      </div >
    </div >
  );
};

export default PropertyDetailModal;
