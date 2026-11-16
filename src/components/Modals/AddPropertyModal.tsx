import React, { useState, useRef, useEffect } from 'react';
import { Property, ListingType, PropertyCategory } from '../../types';
import { formatIndianCurrency } from '../../services/propertyService';
import { Logo } from '../Common/Logo';
import {
  X,
  MapPin,
  Check,
  Trash2,
  Sparkles,
  PenTool,
  UploadCloud,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Droplets,
  Star
} from 'lucide-react';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProperty: (newProp: Property) => void;
  onStartDropPin: () => void;
  onStartDrawLandBorders?: () => void;
  drawnLandBorders?: [number, number][];
  onClearLandBorders?: () => void;
  landMetrics?: {
    areaAcres: number;
    areaGunthas: number;
    areaSqYards: number;
    perimeterMeters: number;
  } | null;
  selectedLocation: {
    coordinates: [number, number];
    area: string;
    city: string;
    state: string;
    pinCode: string;
    address: string;
  } | null;
}

const RESIDENTIAL_AMENITIES = [
  '24x7 Security & CCTV',
  '100% Power Backup',
  'Swimming Pool',
  'Equipped Gymnasium',
  'Covered Car Parking',
  'High Speed Elevators',
  'Clubhouse & Banquet Hall',
  'Children Play Area',
  'EV Charging Station',
  'Landscaped Gardens & Jogging Track',
  '100% Vastu Compliant',
  'Piped Gas Connection',
  'Rainwater Harvesting Plant',
  'Water Softener & RO Plant'
];

const AGRICULTURAL_AMENITIES = [
  'Borewell with Submersible Pump',
  'Solar Powered Fencing',
  'Drip Irrigation Network',
  '3-Phase Dedicated Ag Power',
  'Caretaker / Servant Quarters',
  'Farmhouse / Villa Built',
  'Farm Pond / Water Tank',
  'Fruit Orchard (Mango/Teak/Guava)',
  'CCTV & Gate Monitored',
  'Pattadar Passbook Available'
];

const COMMERCIAL_AMENITIES = [
  'Central HVAC / AC',
  '100% DG Power Backup',
  'High Speed Elevators',
  'Dedicated Transformer',
  'Grade-A Certified Tower',
  'Ample Visitor Parking',
  'Fire Sprinklers & Alarms',
  '24x7 Building Access'
];

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  isOpen,
  onClose,
  onAddProperty,
  onStartDropPin,
  onStartDrawLandBorders,
  drawnLandBorders = [],
  onClearLandBorders,
  landMetrics = null,
  selectedLocation
}) => {
  // Stepper State: 1 to 7
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');

  // Step 1: Intent & Category
  const [type, setType] = useState<ListingType>('sale');
  const [category, setCategory] = useState<PropertyCategory>('Apartment');

  // Step 2: Location & Address
  const [area, setArea] = useState('Gachibowli');
  const [city, setCity] = useState('Hyderabad');
  const [state, setState] = useState('Telangana');
  const [pinCode, setPinCode] = useState('500032');
  const [streetAddress, setStreetAddress] = useState('Tower 4, Gachibowli Main Road');

  // Step 3: Category-Specific Details
  // Residential specifics
  const [bhk, setBhk] = useState<number>(3);
  const [bathrooms, setBathrooms] = useState<number>(3);
  const [balconies, setBalconies] = useState<number>(2);
  const [areaSqFt, setAreaSqFt] = useState<number>(2150);
  const [carpetAreaSqFt, setCarpetAreaSqFt] = useState<number>(1780);
  const [floorNumber, setFloorNumber] = useState<number>(8);
  const [totalFloors, setTotalFloors] = useState<number>(18);
  const [furnishing, setFurnishing] = useState<'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished'>('Semi-Furnished');
  const [facing, setFacing] = useState('East (Vastu Compliant)');
  const [parking, setParking] = useState('2 Covered');
  const [readyToMove, setReadyToMove] = useState(true);

  // Agricultural specifics
  const [landAcres, setLandAcres] = useState<number>(2.5);
  const [landGunthas, setLandGunthas] = useState<number>(0);
  const [soilType, setSoilType] = useState<'Red Soil' | 'Black Cotton' | 'Alluvial / Loam' | 'Mixed / Gravel'>('Red Soil');
  const [waterSources, setWaterSources] = useState<string[]>(['Borewell with Submersible Pump', 'Drip Irrigation Network']);
  const [roadAccess, setRoadAccess] = useState<'40ft Tar / Blacktop Road' | 'Concrete CC Road' | 'Farm Approach Road'>('40ft Tar / Blacktop Road');
  const [isFenced, setIsFenced] = useState(true);

  // Commercial specifics
  const [commercialType, setCommercialType] = useState<'Corporate Office' | 'Retail Showroom' | 'Warehouse / Logistics' | 'Commercial Land'>('Corporate Office');

  // Step 4: Pricing & Financials
  const [price, setPrice] = useState<number>(18500000);
  const [maintenanceMonthly, setMaintenanceMonthly] = useState<number>(5000);
  const [reraId, setReraId] = useState('P02400008921');

  // Step 5: Visual Showcase & Photos
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
  ]);
  const [currentUrlInput, setCurrentUrlInput] = useState('');
  const [urlInputError, setUrlInputError] = useState('');

  // Step 6: Features & Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    '24x7 Security & CCTV',
    '100% Power Backup',
    'Covered Car Parking',
    'Equipped Gymnasium',
    'Clubhouse & Banquet Hall'
  ]);

  // Step 7: Final Review & Contact
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('Keerthi Charan');
  const [contactPhone, setContactPhone] = useState('+91 98490 12345');
  const [contactEmail, setContactEmail] = useState('charan@manormap.in');
  const [contactType, setContactType] = useState<'Owner' | 'Verified Agent' | 'Builder'>('Owner');

  const [plotBorderError, setPlotBorderError] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Sync incoming props (location, surveyed land metrics)
  useEffect(() => {
    if (selectedLocation) {
      if (selectedLocation.area) setArea(selectedLocation.area);
      if (selectedLocation.city) setCity(selectedLocation.city);
      if (selectedLocation.state) setState(selectedLocation.state);
      if (selectedLocation.pinCode) setPinCode(selectedLocation.pinCode);
      if (selectedLocation.address) setStreetAddress(selectedLocation.address);
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (landMetrics) {
      setCategory('Agricultural Land');
      setLandAcres(Number(landMetrics.areaAcres.toFixed(2)));
      setLandGunthas(Math.round(landMetrics.areaGunthas));
    }
  }, [landMetrics]);

  // Auto-generate Title & Description based on captured inputs
  useEffect(() => {
    const isAgri = category === 'Agricultural Land' || category === 'Plot';
    const isCommercial = category === 'Commercial';

    if (isAgri) {
      const acresText = landAcres > 0 ? `${landAcres.toFixed(1)} Acres` : 'Prime Land Parcel';
      const fenceText = isFenced ? ', Fully Fenced' : '';
      setTitle(`${acresText} Fertile ${category} in ${area}, ${city}`);
      setDescription(
        `Exceptional ${acresText} ${soilType} ${category} located in high-growth ${area}, ${city}. Features ${roadAccess}, abundant water supply (${waterSources.join(', ') || 'Borewell'})${fenceText}, clear title passbook, and complete agricultural infrastructure.`
      );
    } else if (isCommercial) {
      setTitle(`${areaSqFt} Sq.Ft ${commercialType} in ${area}, ${city}`);
      setDescription(
        `Premium Grade-A ${commercialType} comprising ${areaSqFt} sq.ft (${carpetAreaSqFt} sq.ft carpet) in prime ${area}, ${city}. Excellent road frontage, 100% DG power backup, high-speed elevators, and ready occupancy.`
      );
    } else {
      const statusText = readyToMove ? 'Ready to Move' : 'Under Construction';
      setTitle(`${bhk} BHK Luxury ${category} in ${area}, ${city}`);
      setDescription(
        `Spacious ${bhk} BHK ${category} on Floor ${floorNumber} of ${totalFloors} featuring ${areaSqFt} sq.ft built-up area (${carpetAreaSqFt} sq.ft usable carpet). Facing ${facing}, ${furnishing}, with ${parking} parking spaces, ${statusText}, world-class society amenities, and 24x7 power backup.`
      );
    }
  }, [category, type, bhk, area, city, landAcres, areaSqFt, carpetAreaSqFt, soilType, roadAccess, commercialType, furnishing, facing, parking, waterSources, floorNumber, totalFloors, readyToMove, isFenced]);

  if (!isOpen) return null;

  // Format currency in words (e.g. ₹1.85 Cr)
  const formattedPriceSummary = () => {
    if (price >= 10000000) {
      const cr = (price / 10000000).toFixed(2).replace(/\.00$/, '');
      return `₹${cr} Crore`;
    }
    if (price >= 100000) {
      const lk = (price / 100000).toFixed(2).replace(/\.00$/, '');
      return `₹${lk} Lakh`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const handleNextStep = () => {
    setSlideDirection('forward');
    setCurrentStep((prev) => Math.min(prev + 1, 7));
  };

  const handlePrevStep = () => {
    setSlideDirection('backward');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Image Upload / URL Handlers
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    const fileList = Array.from(files);

    const promises = fileList.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const resultStr = readerEvent.target?.result as string;
          if (!resultStr) {
            resolve('');
            return;
          }
          const img = new Image();
          img.onload = () => {
            const maxDimension = 1280;
            let width = img.width;
            let height = img.height;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.82));
            } else {
              resolve(resultStr);
            }
          };
          img.onerror = () => resolve(resultStr);
          img.src = resultStr;
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then((dataUrls) => {
      const valid = dataUrls.filter((url) => !!url);
      setPhotoUrls((prev) => [...prev, ...valid]);
      setIsProcessingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  };

  const handleAddPhotoUrl = () => {
    const trimmed = currentUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setUrlInputError('Please enter a valid link starting with https://');
      return;
    }
    if (photoUrls.includes(trimmed)) {
      setUrlInputError('This photo link is already added');
      return;
    }
    setPhotoUrls((prev) => [...prev, trimmed]);
    setCurrentUrlInput('');
    setUrlInputError('');
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSetCoverPhoto = (idx: number) => {
    setPhotoUrls((prev) => {
      const selected = prev[idx];
      const remaining = prev.filter((_, i) => i !== idx);
      return [selected, ...remaining];
    });
  };

  const toggleWaterSource = (src: string) => {
    setWaterSources((prev) =>
      prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  // Submit Listing
  const handlePublish = () => {
    setIsPublishing(true);

    const isAgri = category === 'Agricultural Land' || category === 'Plot';

    if (isAgri && (!drawnLandBorders || drawnLandBorders.length < 3)) {
      setPlotBorderError('Tip: Plotting the exact boundary polygon shades the parcel on the map.');
    }

    const coords: [number, number] = selectedLocation
      ? selectedLocation.coordinates
      : [78.3820, 17.4474];

    const finalImages =
      photoUrls.length > 0
        ? photoUrls
        : isAgri
        ? ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80']
        : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'];

    const newProperty: Property = {
      id: `custom-prop-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      priceDisplay: formatIndianCurrency(Number(price), type),
      type: type,
      category: category,
      bhk: isAgri ? 0 : Number(bhk),
      bathrooms: isAgri ? 0 : Number(bathrooms),
      balconies: isAgri ? 0 : Number(balconies),
      areaSqFt: isAgri ? Math.round(landAcres * 43560) : Number(areaSqFt),
      carpetAreaSqFt: isAgri ? undefined : Number(carpetAreaSqFt),
      address: streetAddress.trim(),
      area: area.trim(),
      city: city.trim(),
      state: state.trim(),
      pinCode: pinCode.trim(),
      coordinates: coords,
      images: finalImages,
      features: selectedAmenities.length > 0 ? selectedAmenities : isAgri ? ['Red Soil', 'Borewell'] : ['Power Backup'],
      verified: true,
      readyToMove: readyToMove,
      furnishing: isAgri ? 'Unfurnished' : furnishing,
      facing: facing,
      parking: parking,
      floorInfo: isAgri ? 'Ground Parcel' : `Floor ${floorNumber} of ${totalFloors} Floors`,
      maintenanceMonthly: maintenanceMonthly,
      reraId: reraId.trim() || undefined,
      postedDate: 'Just now',
      contact: {
        name: contactName.trim() || 'Owner',
        phone: contactPhone.trim() || '+91 98490 12345',
        type: contactType,
        email: contactEmail.trim()
      },
      boundaryPolygon: drawnLandBorders && drawnLandBorders.length >= 3 ? drawnLandBorders : undefined,
      landMetrics: isAgri
        ? {
            areaAcres: landAcres,
            areaGunthas: landGunthas,
            areaSqYards: Math.round(landAcres * 4840 + landGunthas * 121),
            perimeterMeters: landMetrics?.perimeterMeters || 420
          }
        : undefined
    };

    setTimeout(() => {
      onAddProperty(newProperty);
      setIsPublishing(false);
      onClose();
    }, 450);
  };

  const isAgriCategory = category === 'Agricultural Land' || category === 'Plot';
  const isCommercialCategory = category === 'Commercial';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Soft Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4 text-center">
        <div className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl text-left overflow-hidden border border-slate-200/90 max-h-[96dvh] sm:max-h-[90vh] flex flex-col transition-all">
          
          {/* 1. TOP HEADER WITH STEP COUNTER & PROGRESS BAR */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-20 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Logo size="sm" variant="icon" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                    Step {currentStep} of 7
                  </span>
                  <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                    {currentStep === 1 && 'Intent & Category'}
                    {currentStep === 2 && 'Location & Map Pin'}
                    {currentStep === 3 && (isAgriCategory ? 'Land Dimensions & Soil' : isCommercialCategory ? 'Commercial Specifics' : 'BHK & Specifications')}
                    {currentStep === 4 && 'Pricing & Value'}
                    {currentStep === 5 && 'High-Res Photographs'}
                    {currentStep === 6 && 'Standout Amenities'}
                    {currentStep === 7 && 'Review & Publish'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-0.5">
                  List Property on ManorMap
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors active:scale-95"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Micro Progress Bar across the top */}
          <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / 7) * 100}%` }}
            />
          </div>

          {/* 2. STEP CONTAINER (ONE INTERACTIVE QUESTION AT A TIME) */}
          <div className={`p-5 sm:p-7 flex-1 overflow-y-auto ${slideDirection === 'forward' ? 'animate-in fade-in slide-in-from-right-4 duration-250' : 'animate-in fade-in slide-in-from-left-4 duration-250'}`}>
            
            {/* STEP 1: INTENT & CATEGORY */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    What would you like to list today?
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Select your listing intention and the exact type of real estate property.
                  </p>
                </div>

                {/* Purpose Toggle: Sell vs Rent */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('sale')}
                    className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border-2 font-bold text-sm transition-all duration-200 active:scale-95 ${
                      type === 'sale'
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span>For Sale / Resale</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('rent')}
                    className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border-2 font-bold text-sm transition-all duration-200 active:scale-95 ${
                      type === 'rent'
                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span>For Rent / Lease</span>
                  </button>
                </div>

                {/* Category Cards with Visual Badges */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Property Category
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Agricultural Land Card */}
                    <div
                      onClick={() => setCategory('Agricultural Land')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-3.5 active:scale-[0.98] ${
                        category === 'Agricultural Land'
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-md ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-extrabold text-lg">
                        🌾
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm">Agricultural Land</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-200/80 text-emerald-800 rounded">Boundary Map</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Farmland, agro parcels, orchards with polygon boundary mapping.
                        </p>
                      </div>
                    </div>

                    {/* Apartment Card */}
                    <div
                      onClick={() => setCategory('Apartment')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-3.5 active:scale-[0.98] ${
                        category === 'Apartment'
                          ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 font-extrabold text-lg">
                        🏢
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm">Apartment / Flat</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded">Gated</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Gated societies, high-rise condominiums, luxury penthouses.
                        </p>
                      </div>
                    </div>

                    {/* Villa Card */}
                    <div
                      onClick={() => setCategory('Villa')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-3.5 active:scale-[0.98] ${
                        category === 'Villa'
                          ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 font-extrabold text-lg">
                        🏡
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm">Independent Villa</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Gated community villas, duplexes, independent bungalows.
                        </p>
                      </div>
                    </div>

                    {/* Residential Plot Card */}
                    <div
                      onClick={() => setCategory('Plot')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-3.5 active:scale-[0.98] ${
                        category === 'Plot'
                          ? 'border-amber-600 bg-amber-50/70 text-amber-950 shadow-md ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 font-extrabold text-lg">
                        📐
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm">Residential Plot</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-200/80 text-amber-800 rounded">Layout</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          HMDA/BMRDA approved layout plots, villa parcels.
                        </p>
                      </div>
                    </div>

                    {/* Commercial Space Card */}
                    <div
                      onClick={() => setCategory('Commercial')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-3.5 active:scale-[0.98] sm:col-span-2 ${
                        category === 'Commercial'
                          ? 'border-purple-600 bg-purple-50/70 text-purple-950 shadow-md ring-2 ring-purple-500/20'
                          : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 font-extrabold text-lg">
                        🏬
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm">Commercial Property</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded">Office / Retail / Warehouse</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Corporate office floors, high-street retail shops, showrooms, logistics warehouses.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: LOCATION & MAP ANCHOR */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Where is the property located?
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Set the exact geographic anchor so buyers can find and explore it on the map.
                  </p>
                </div>

                {/* Map Pin Placement Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/60 border border-blue-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                        <MapPin className="w-6 h-6 stroke-[2.2]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                            Geographic Coordinates
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/60">
                            ✓ Pin Synchronized
                          </span>
                        </div>
                        <h5 className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
                          {area}, {city}
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          {selectedLocation
                            ? `Lat: ${selectedLocation.coordinates[1].toFixed(5)}, Lng: ${selectedLocation.coordinates[0].toFixed(5)}`
                            : 'Lat: 17.4474, Lng: 78.3820 (Hitec City Center)'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onStartDropPin();
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-blue-600 text-blue-700 hover:text-white font-extrabold text-xs shadow-sm hover:shadow border border-blue-300 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Adjust Pin on Live Map</span>
                    </button>
                  </div>
                </div>

                {/* Address Form Inputs */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Locality / Neighborhood <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="e.g. Financial District, Shamshabad"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Hyderabad, Bengaluru"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="e.g. Telangana"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Postal PIN Code</label>
                      <input
                        type="text"
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value)}
                        placeholder="e.g. 500032"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Street Address / Tower / Survey Number
                    </label>
                    <input
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="e.g. Survey No. 44/A, Near Outer Ring Road Exit"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PROPERTY SPECIFICS (ADAPTIVE BRANCHING!) */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* BRANCH A: AGRICULTURAL LAND / PLOT */}
                {isAgriCategory ? (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🌾</span>
                        <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                          Agricultural Land Dimensions & Soil
                        </h4>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Capture precise land parcel metrics, soil quality, water sources, and boundary mapping.
                      </p>
                    </div>

                    {/* Land Parcel Stepper */}
                    <div className="p-4.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-emerald-900 mb-1.5">
                            Total Acres <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.05"
                              min="0.1"
                              value={landAcres}
                              onChange={(e) => setLandAcres(Math.max(0.1, parseFloat(e.target.value) || 0))}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-950 font-black text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-extrabold text-emerald-800">Ac</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-emerald-900 mb-1.5">
                            Gunthas (Cents)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="39"
                              value={landGunthas}
                              onChange={(e) => setLandGunthas(Math.max(0, parseInt(e.target.value, 10) || 0))}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-950 font-black text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-extrabold text-emerald-800">Gts</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between text-[11px] font-bold text-emerald-800">
                        <span>Calculated Parcel Area:</span>
                        <span>
                          {Math.round(landAcres * 4840 + landGunthas * 121).toLocaleString('en-IN')} Sq. Yards (~{Math.round((landAcres * 4840 + landGunthas * 121) * 0.836).toLocaleString('en-IN')} Sq. Meters)
                        </span>
                      </div>
                    </div>

                    {/* Cadastral Boundary Shading Card */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                          <PenTool className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-extrabold text-slate-900">
                            Cadastral Boundary Mapping
                          </h5>
                          <p className="text-[11px] text-slate-500">
                            {drawnLandBorders && drawnLandBorders.length >= 3
                              ? `✓ ${drawnLandBorders.length} Boundary Vertices Plotted on Map`
                              : 'Draw the property boundary on the map to shade the exact land parcel.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {onClearLandBorders && drawnLandBorders && drawnLandBorders.length >= 3 && (
                          <button
                            type="button"
                            onClick={onClearLandBorders}
                            className="px-3 py-2 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all"
                          >
                            Reset
                          </button>
                        )}
                        {onStartDrawLandBorders && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onStartDrawLandBorders();
                            }}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
                          >
                            {drawnLandBorders && drawnLandBorders.length >= 3 ? 'Adjust Boundary' : '✏️ Draw Boundary on Map'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Soil Type Cards */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Soil Classification
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { title: 'Red Soil', icon: '🟤', desc: 'Fertile & High Yield' },
                          { title: 'Black Cotton', icon: '⚫', desc: 'High Moisture' },
                          { title: 'Alluvial / Loam', icon: '🌾', desc: 'Multi-Crop Rich' },
                          { title: 'Mixed / Gravel', icon: '🪨', desc: 'Low Maintenance' }
                        ].map((s) => (
                          <button
                            key={s.title}
                            type="button"
                            onClick={() => setSoilType(s.title as any)}
                            className={`p-3 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                              soilType === s.title
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm'
                                : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                            }`}
                          >
                            <span className="text-base">{s.icon}</span>
                            <div className="font-extrabold text-xs mt-1">{s.title}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{s.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Water Sources Multi-Select Chips */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Water & Irrigation Infrastructure
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Borewell with Submersible Pump',
                          'Canal / River Water Access',
                          'Rainwater Pond / Tank',
                          'Drip Irrigation Network',
                          '3-Phase Dedicated Ag Power'
                        ].map((src) => {
                          const active = waterSources.includes(src);
                          return (
                            <button
                              key={src}
                              type="button"
                              onClick={() => toggleWaterSource(src)}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                                active
                                  ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              <Droplets className={`w-3.5 h-3.5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                              <span>{src}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Road Access & Fencing */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Road Access & Approach Width
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {[
                            '40ft Tar / Blacktop Road',
                            'Concrete CC Road',
                            'Farm Approach Road'
                          ].map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setRoadAccess(r as any)}
                              className={`p-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                                roadAccess === r
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              🛣️ {r}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs font-extrabold text-slate-800">
                          🔒 Fully Fenced / Solar Boundary Wall
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsFenced((prev) => !prev)}
                          className={`w-11 h-6 rounded-full transition-colors relative ${
                            isFenced ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                              isFenced ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : isCommercialCategory ? (
                  /* BRANCH B: COMMERCIAL SPACE */
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        Commercial Property Infrastructure
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Capture office classification, usable floor space, power backup, and lease readiness.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        'Corporate Office',
                        'Retail Showroom',
                        'Warehouse / Logistics',
                        'Commercial Land'
                      ].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCommercialType(c as any)}
                          className={`p-3.5 rounded-2xl border-2 text-left font-bold text-xs transition-all active:scale-95 ${
                            commercialType === c
                              ? 'border-purple-600 bg-purple-50 text-purple-950 shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          🏬 {c}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Super Built-Up Area (Sq.Ft) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={areaSqFt}
                          onChange={(e) => setAreaSqFt(Math.max(50, parseInt(e.target.value, 10) || 0))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Carpet Usable Area (Sq.Ft)
                        </label>
                        <input
                          type="number"
                          value={carpetAreaSqFt}
                          onChange={(e) => setCarpetAreaSqFt(Math.max(40, parseInt(e.target.value, 10) || 0))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* BRANCH C: RESIDENTIAL (APARTMENT / VILLA / HOUSE) */
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        BHK, Dimensions & Furnishing
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Select room counts, carpet area, facing direction, and parking spaces.
                      </p>
                    </div>

                    {/* BHK Selector */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        BHK Configuration
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setBhk(num)}
                            className={`py-2.5 rounded-xl font-extrabold text-xs transition-all active:scale-95 ${
                              bhk === num
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {num} BHK
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bathrooms & Balconies */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Bathrooms</label>
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setBathrooms(num)}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                                bathrooms === num
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Balconies</label>
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setBalconies(num)}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                                balconies === num
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Areas */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Super Built-Up Area (Sq.Ft) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={areaSqFt}
                          onChange={(e) => setAreaSqFt(Math.max(100, parseInt(e.target.value, 10) || 0))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Usable Carpet Area (Sq.Ft)
                        </label>
                        <input
                          type="number"
                          value={carpetAreaSqFt}
                          onChange={(e) => setCarpetAreaSqFt(Math.max(80, parseInt(e.target.value, 10) || 0))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Floor & Total Floors */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Floor Number</label>
                        <input
                          type="number"
                          min="0"
                          value={floorNumber}
                          onChange={(e) => setFloorNumber(parseInt(e.target.value, 10) || 0)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Total Building Floors</label>
                        <input
                          type="number"
                          min="1"
                          value={totalFloors}
                          onChange={(e) => setTotalFloors(parseInt(e.target.value, 10) || 1)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                        />
                      </div>
                    </div>

                    {/* Parking & Ready to Move */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Car Parking</label>
                        <select
                          value={parking}
                          onChange={(e) => setParking(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                        >
                          <option value="1 Covered">1 Covered Space</option>
                          <option value="2 Covered">2 Covered Spaces</option>
                          <option value="3+ Covered">3+ Covered Spaces</option>
                          <option value="Open Parking">Open Parking</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Possession Status</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setReadyToMove(true)}
                            className={`py-2 rounded-xl text-[11px] font-bold border ${
                              readyToMove
                                ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            Ready to Move
                          </button>
                          <button
                            type="button"
                            onClick={() => setReadyToMove(false)}
                            className={`py-2 rounded-xl text-[11px] font-bold border ${
                              !readyToMove
                                ? 'bg-amber-50 border-amber-600 text-amber-800'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            Under Const.
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Furnishing Status */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Furnishing Status
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Unfurnished', 'Semi-Furnished', 'Fully Furnished'] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setFurnishing(f)}
                            className={`py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
                              furnishing === f
                                ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Facing Direction */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Facing Direction
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {['East (Vastu Compliant)', 'North', 'West', 'South'].map((fc) => (
                          <button
                            key={fc}
                            type="button"
                            onClick={() => setFacing(fc)}
                            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all active:scale-95 border truncate ${
                              facing === fc
                                ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            🧭 {fc.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: PRICING & FINANCIALS */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Set your asking price
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Transparent pricing attracts 4x more serious buyers and verified inquiries.
                  </p>
                </div>

                {/* Big Live Currency Display */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200 text-center space-y-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
                    Total Asking Price ({type === 'rent' ? 'Monthly Rent' : 'Outright Sale'})
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {formattedPriceSummary()}
                  </div>
                  <div className="text-xs font-bold text-slate-500">
                    {isAgriCategory
                      ? `~₹${(price / (landAcres || 1) / 100000).toFixed(1)} Lakhs / Acre`
                      : `~₹${Math.round(price / (areaSqFt || 1)).toLocaleString('en-IN')} / Sq.Ft`}
                  </div>
                </div>

                {/* Price Input & Quick Adjusters */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Enter Exact Amount (INR ₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">
                      ₹
                    </span>
                    <input
                      type="number"
                      step={type === 'rent' ? '1000' : '50000'}
                      min={type === 'rent' ? '5000' : '500000'}
                      value={price}
                      onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-black text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[500000, 1000000, 2500000, 5000000].map((delta) => (
                      <button
                        key={delta}
                        type="button"
                        onClick={() => setPrice((p) => p + delta)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                      >
                        + ₹{(delta / 100000).toFixed(0)} Lakhs
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPrice((p) => Math.max(500000, p - 500000))}
                      className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition-colors ml-auto"
                    >
                      - ₹5 Lakhs
                    </button>
                  </div>
                </div>

                {/* Monthly Maintenance (for residential/commercial) */}
                {!isAgriCategory && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Monthly Society Maintenance / HOA (INR ₹)
                    </label>
                    <input
                      type="number"
                      step="500"
                      value={maintenanceMonthly}
                      onChange={(e) => setMaintenanceMonthly(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                )}

                {/* RERA Registration */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">RERA / Registration Passbook Number</label>
                    <span className="text-[10px] text-slate-400 font-semibold">Optional</span>
                  </div>
                  <input
                    type="text"
                    value={reraId}
                    onChange={(e) => setReraId(e.target.value)}
                    placeholder="e.g. P02400008921 or Survey Passbook ID"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white uppercase"
                  />
                </div>
              </div>
            )}

            {/* STEP 5: VISUAL SHOWCASE & PHOTOS */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Add photos of your property
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Listings with high-resolution photographs receive 6x higher inquiries and buyer views.
                  </p>
                </div>

                {/* Upload & Link Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFilesSelected}
                    className="hidden"
                  />

                  {/* Device Gallery / Camera Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingFiles}
                    className="p-4 rounded-2xl border-2 border-dashed border-blue-400 hover:border-blue-600 bg-blue-50/50 hover:bg-blue-50 text-blue-900 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 text-center"
                  >
                    {isProcessingFiles ? (
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    ) : (
                      <UploadCloud className="w-6 h-6 text-blue-600" />
                    )}
                    <span className="text-xs font-extrabold">Upload from Device / Camera</span>
                    <span className="text-[10px] text-blue-600/80">Supports JPG, PNG, WEBP</span>
                  </button>

                  {/* Add URL Card */}
                  <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-slate-800">Or Paste Image Link</span>
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={currentUrlInput}
                          onChange={(e) => setCurrentUrlInput(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddPhotoUrl}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                        >
                          Add
                        </button>
                      </div>
                      {urlInputError && <p className="text-[10px] text-red-500 mt-1">{urlInputError}</p>}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2">Add Unsplash or hosting links</span>
                  </div>
                </div>

                {/* Thumbnails Gallery */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Uploaded Photos ({photoUrls.length})
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Star indicates cover photo
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photoUrls.map((url, idx) => (
                      <div
                        key={url + idx}
                        className="relative group rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-200 shadow-xs"
                      >
                        <img
                          src={url}
                          alt={`Upload ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-black shadow-md flex items-center gap-1">
                            <Star className="w-3 h-3 fill-white" /> Cover
                          </span>
                        )}

                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetCoverPhoto(idx)}
                              title="Set as Cover"
                              className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-md hover:scale-105 active:scale-95"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            title="Delete Photo"
                            className="w-8 h-8 rounded-full bg-white text-red-600 flex items-center justify-center shadow-md hover:scale-105 active:scale-95"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: STANDOUT AMENITIES CHECKLIST */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Select standout features & amenities
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Highlight what makes this {category} special for prospective buyers.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(isAgriCategory
                    ? AGRICULTURAL_AMENITIES
                    : isCommercialCategory
                    ? COMMERCIAL_AMENITIES
                    : RESIDENTIAL_AMENITIES
                  ).map((am) => {
                    const isChecked = selectedAmenities.includes(am);
                    return (
                      <button
                        key={am}
                        type="button"
                        onClick={() => toggleAmenity(am)}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all active:scale-[0.98] ${
                          isChecked
                            ? 'border-blue-600 bg-blue-50/70 text-slate-900 font-bold shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs">{am}</span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 7: REVIEW, CONTACT & PUBLISH */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Final Review & Publish
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Review your listing preview and verify contact information before publishing live.
                  </p>
                </div>

                {plotBorderError && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold">
                    {plotBorderError}
                  </div>
                )}

                {/* Live Card Preview */}
                <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-44 h-32 rounded-2xl overflow-hidden bg-slate-200 flex-shrink-0">
                    <img
                      src={photoUrls[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {type === 'sale' ? 'For Sale' : 'For Rent'}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {category}
                        </span>
                      </div>
                      <h5 className="font-extrabold text-sm sm:text-base text-slate-900 mt-1 line-clamp-1">
                        {title}
                      </h5>
                      <p className="text-xs text-slate-500 mt-0.5">
                        📍 {area}, {city}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                      <span className="text-base font-black text-blue-600">
                        {formattedPriceSummary()}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        {isAgriCategory ? `${landAcres.toFixed(1)} Acres` : `${bhk} BHK • ${areaSqFt} sq.ft`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Title & Description Edit */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Listing Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">Property Description</label>
                      <button
                        type="button"
                        onClick={() => {
                          setDescription((prev) => prev + ' 🌟 Verified title with clear ownership documentation.');
                        }}
                        className="text-[11px] text-blue-600 font-bold flex items-center gap-1 hover:underline"
                      >
                        <Sparkles className="w-3 h-3" /> Auto-Enhance
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Seller Contact Details
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Your Name</label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Role</label>
                      <select
                        value={contactType}
                        onChange={(e) => setContactType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                      >
                        <option value="Owner">Property Owner</option>
                        <option value="Verified Agent">Certified Agent</option>
                        <option value="Builder">Builder / Developer</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                      placeholder="owner@example.com"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. STICKY BOTTOM ACTION BAR */}
          <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              {currentStep < 7 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing Listing...</span>
                    </>
                  ) : (
                    <>
                      <span>Publish to Live Map 🚀</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
