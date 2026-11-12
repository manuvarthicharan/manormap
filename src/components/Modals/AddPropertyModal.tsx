import React, { useState, useRef } from 'react';
import { Property, ListingType, PropertyCategory } from '../../types';
import { formatIndianCurrency } from '../../services/propertyService';
import { Logo } from '../Common/Logo';
import {
  X,
  Plus,
  MapPin,
  Check,
  Trash2,
  AlertCircle,
  ShieldCheck,
  Building,
  Sparkles,
  AlertTriangle,
  PenTool,
  UploadCloud,
  Camera,
  Loader2
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

const AVAILABLE_AMENITIES = [
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
  'Piped Gas Connection (IGL/Bhagyanagar)',
  'Rainwater Harvesting Plant',
  'High-Speed Optical Fiber',
  'Rooftop Deck & Sky Lounge',
  'Water Softener & RO Plant'
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
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ListingType>('sale');
  const [category, setCategory] = useState<PropertyCategory>('Apartment');
  const [price, setPrice] = useState<number>(18500000);
  const [maintenanceMonthly, setMaintenanceMonthly] = useState<number>(5500);
  const [bhk, setBhk] = useState<number>(3);
  const [bathrooms, setBathrooms] = useState<number>(3);
  const [balconies, setBalconies] = useState<number>(2);
  const [areaSqFt, setAreaSqFt] = useState<number>(2250);
  const [carpetAreaSqFt, setCarpetAreaSqFt] = useState<number>(1820);
  const [floorInfo, setFloorInfo] = useState('Floor 8 of 18 Floors');
  const [furnishing, setFurnishing] = useState<'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished'>('Semi-Furnished');
  const [facing, setFacing] = useState('East');
  const [parking, setParking] = useState('2 Covered');
  const [readyToMove, setReadyToMove] = useState(true);
  const [reraId, setReraId] = useState('P02400008921');

  // Amenities checklist
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    '24x7 Security & CCTV',
    '100% Power Backup',
    'Covered Car Parking',
    'High Speed Elevators',
    'Equipped Gymnasium',
    'Clubhouse & Banquet Hall'
  ]);

  // Genuine Photo URLs & Local Device Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
  ]);
  const [currentUrlInput, setCurrentUrlInput] = useState('');
  const [urlInputError, setUrlInputError] = useState('');
  const [brokenUrls, setBrokenUrls] = useState<Set<string>>(new Set());
  const [plotBorderError, setPlotBorderError] = useState('');

  // Handle files selected from user's device (phone gallery or file explorer)
  // Automatically scales and converts to standalone data links in background
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
              const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
              resolve(dataUrl);
            } else {
              resolve(resultStr);
            }
          };
          img.onerror = () => {
            resolve(resultStr);
          };
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  };

  // Contact
  const [contactName, setContactName] = useState('Rohith Polisetti');
  const [contactPhone, setContactPhone] = useState('+91 98490 12345');
  const [contactEmail, setContactEmail] = useState('rohith@manormap.in');
  const [contactType, setContactType] = useState<'Owner' | 'Verified Agent' | 'Builder'>('Owner');

  // Address fields (derived from selectedLocation or defaults)
  const currentArea = selectedLocation?.area || 'Financial District';
  const currentCity = selectedLocation?.city || 'Hyderabad';
  const currentState = selectedLocation?.state || 'Telangana';
  const currentPin = selectedLocation?.pinCode || '500032';
  const [streetAddress, setStreetAddress] = useState(selectedLocation?.address || 'Tower 4, Gachibowli Main Road');

  if (!isOpen) return null;

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleAddPhotoUrl = () => {
    const trimmed = currentUrlInput.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setUrlInputError('Please enter a valid link starting with https:// or http://');
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

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotoUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetCoverPhoto = (index: number) => {
    setPhotoUrls((prev) => {
      const selected = prev[index];
      const remaining = prev.filter((_, idx) => idx !== index);
      return [selected, ...remaining];
    });
  };

  const handleImageError = (url: string) => {
    setBrokenUrls((prev) => new Set(prev).add(url));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // For Agricultural Land, require plotted borders so area is shaded on map
    if (category === 'Agricultural Land' && (!drawnLandBorders || drawnLandBorders.length < 3)) {
      setPlotBorderError('Please plot the borders of your agricultural land on the map first so the property area is shaded and accurately displayed.');
      return;
    }
    setPlotBorderError('');

    // Default coordinates if not dropped
    const coords: [number, number] = selectedLocation
      ? selectedLocation.coordinates
      : [78.3820, 17.4474];

    // Ensure at least one valid image
    const finalImages =
      photoUrls.length > 0
        ? photoUrls
        : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'];

    const newProperty: Property = {
      id: `custom-prop-${Date.now()}`,
      title: title.trim(),
      description:
        description.trim() ||
        `Exquisite ${bhk} BHK ${category} situated in prime ${currentArea}, ${currentCity}. Built with premium materials, expansive carpet area, and unobstructed natural ventilation.`,
      price: Number(price),
      priceDisplay: formatIndianCurrency(Number(price), type),
      type: type,
      category: category,
      bhk: Number(bhk),
      bathrooms: Number(bathrooms),
      balconies: Number(balconies),
      areaSqFt: Number(areaSqFt),
      carpetAreaSqFt: Number(carpetAreaSqFt),
      address: streetAddress.trim(),
      area: currentArea,
      city: currentCity,
      state: currentState,
      pinCode: currentPin,
      coordinates: coords,
      images: finalImages,
      features:
        selectedAmenities.length > 0
          ? selectedAmenities
          : ['24x7 Security & CCTV', 'Covered Car Parking', '100% Power Backup'],
      verified: true,
      readyToMove: readyToMove,
      furnishing: furnishing,
      facing: facing,
      parking: parking,
      floorInfo: floorInfo,
      maintenanceMonthly: maintenanceMonthly,
      reraId: reraId.trim() || undefined,
      postedDate: 'Just now',
      contact: {
        name: contactName.trim() || 'Rohith Polisetti',
        phone: contactPhone.trim() || '+91 98490 12345',
        type: contactType,
        email: contactEmail.trim()
      },
      boundaryPolygon: drawnLandBorders && drawnLandBorders.length >= 3 ? drawnLandBorders : undefined,
      landMetrics: landMetrics || undefined
    };

    onAddProperty(newProperty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-6 text-center">
        <div className="relative w-full max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl text-left overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-slate-100 max-h-[94dvh] sm:max-h-[90vh] flex flex-col">
          {/* Header with ManorMap Logo */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-20 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Logo size="sm" variant="icon" />
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-none">
                  List Property
                </h3>
                <span className="text-[11px] font-medium text-slate-500">
                  Nationwide Real Estate Portal &bull; Interactive Geolocation Pin
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto">
            {/* 1. LOCATION & PIN PLACEMENT */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border border-blue-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                    <MapPin className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                        Geographical Property Location
                      </span>
                      {selectedLocation ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3 stroke-[3]" /> Exact Pin Set
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                          Auto-centered
                        </span>
                      )}
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
                      {currentArea}, {currentCity}
                    </div>
                    <div className="text-xs text-slate-600">
                      {currentState} &bull; PIN Code: <span className="font-semibold">{currentPin}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onStartDropPin}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 flex-shrink-0"
                >
                  <MapPin className="w-4 h-4 stroke-[2.5]" />
                  <span>{selectedLocation ? 'Change Pin on Map' : 'Drop Pin on Map'}</span>
                </button>
              </div>

              {/* Street Address Input */}
              <div className="mt-3.5 pt-3.5 border-t border-blue-200/60">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Complete Street / Society / Tower Address
                </label>
                <input
                  type="text"
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="e.g. Tower 4, Flat 802, Aparna Sarovar Zenith, Nallagandla"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                />
              </div>
            </div>

            {/* 2. PROPERTY ESSENTIALS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Building className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Property Basics & Classification
                </h4>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Headline / Listing Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 3 BHK Luxury Sky Suite with Corner Balcony & Golf View"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Detailed Property Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Highlight floor plan, sunlight, ventilation, proximity to metro/IT corridors, clubhouse features..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Listing Type & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Listing Type</label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setType('sale');
                        if (price < 1000000) setPrice(18500000);
                      }}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        type === 'sale'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      For Sale / Buy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setType('rent');
                        if (price > 500000) setPrice(48000);
                      }}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        type === 'rent'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      For Rent / Lease
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Property Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PropertyCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Apartment">Apartment / High-Rise Flat</option>
                    <option value="Villa">Independent Luxury Villa</option>
                    <option value="Independent House">Independent House / Bungalow</option>
                    <option value="Penthouse">Designer Penthouse</option>
                    <option value="Commercial">Commercial Office / Retail Space</option>
                    <option value="Plot">Residential Plot / Gated Land</option>
                    <option value="Agricultural Land">Agricultural Land / Farmland</option>
                  </select>
                </div>
              </div>

              {/* Property Border Drawing & Surface Shading for Agricultural Land and Plots */}
              {(category === 'Agricultural Land' || category === 'Plot') && (
                <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  drawnLandBorders && drawnLandBorders.length >= 3
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : 'bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white border-2 border-emerald-400 shadow-sm'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
                        <PenTool className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                          <span>Draw Land Borders on Map</span>
                          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                            {category === 'Agricultural Land' ? 'Required for Farmland' : 'Optional Plot Drawing'}
                          </span>
                        </h4>
                        <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                          Draw the border of your land on the live Google Map. The surface area between the drawn borders will be <strong>automatically calculated and shaded in emerald</strong> on the map.
                        </p>
                      </div>
                    </div>

                    {drawnLandBorders && drawnLandBorders.length >= 3 && (
                      <span className="text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full shadow-2xs whitespace-nowrap">
                        ✓ Shaded & Ready
                      </span>
                    )}
                  </div>

                  {plotBorderError && (
                    <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{plotBorderError}</span>
                    </div>
                  )}

                  {drawnLandBorders && drawnLandBorders.length >= 3 ? (
                    <div className="p-3.5 bg-white rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                          <span>Drawn Parcel: <strong className="text-emerald-700">{landMetrics?.areaAcres ? landMetrics.areaAcres.toFixed(2) : '0'} Acres</strong></span>
                          <span className="text-slate-500 font-normal">({landMetrics?.areaGunthas ? landMetrics.areaGunthas.toFixed(1) : '0'} Gunthas)</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="text-emerald-700 font-semibold">Drawn Land Boundary</span>
                          <span>•</span>
                          <span>Perimeter: {landMetrics?.perimeterMeters ? Math.round(landMetrics.perimeterMeters) : 0}m</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-semibold">Area shaded on map</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {onStartDrawLandBorders && (
                          <button
                            type="button"
                            onClick={() => {
                              setPlotBorderError('');
                              onStartDrawLandBorders();
                            }}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>Redraw on Map</span>
                          </button>
                        )}
                        {onClearLandBorders && (
                          <button
                            type="button"
                            onClick={onClearLandBorders}
                            className="px-2.5 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Clear</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-white rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="text-xs text-slate-600">
                        Tap below to draw the border of your land on the map. The enclosed land area will be automatically shaded.
                      </div>
                      {onStartDrawLandBorders && (
                        <button
                          type="button"
                          onClick={() => {
                            setPlotBorderError('');
                            onStartDrawLandBorders();
                          }}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center justify-center gap-2 whitespace-nowrap active:scale-95"
                        >
                          <PenTool className="w-4 h-4 stroke-[2.5]" />
                          <span>Draw Land Borders on Map</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. PRICING & FINANCIALS */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Pricing & Maintenance (INR)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      {type === 'sale' ? 'Expected Sale Price (₹)' : 'Monthly Rent (₹)'}
                    </label>
                    <span className="text-xs font-black text-blue-600">
                      {formatIndianCurrency(price, type)}
                    </span>
                  </div>
                  <input
                    type="number"
                    required
                    min={1}
                    step="any"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Monthly Maintenance (₹ / month)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={maintenanceMonthly}
                    onChange={(e) => setMaintenanceMonthly(Number(e.target.value))}
                    placeholder="e.g. 5500"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 4. SPECIFICATIONS & DIMENSIONS */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Dimensions & Architectural Specifications
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Bedrooms</label>
                  <select
                    value={bhk}
                    onChange={(e) => setBhk(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value={1}>1 BHK</option>
                    <option value={2}>2 BHK</option>
                    <option value={3}>3 BHK</option>
                    <option value={4}>4 BHK</option>
                    <option value={5}>5+ BHK</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Bathrooms</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={bathrooms}
                    onChange={(e) => setBathrooms(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Balconies</label>
                  <input
                    type="number"
                    min={0}
                    max={8}
                    value={balconies}
                    onChange={(e) => setBalconies(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Super Area (sq.ft)</label>
                  <input
                    type="number"
                    min={1}
                    step="any"
                    value={areaSqFt}
                    onChange={(e) => setAreaSqFt(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Carpet Area (sq.ft)</label>
                  <input
                    type="number"
                    min={50}
                    value={carpetAreaSqFt}
                    onChange={(e) => setCarpetAreaSqFt(Number(e.target.value))}
                    placeholder="e.g. 1820"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Furnishing</label>
                  <select
                    value={furnishing}
                    onChange={(e) => setFurnishing(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="Semi-Furnished">Semi-Furnished</option>
                    <option value="Fully Furnished">Fully Furnished</option>
                    <option value="Unfurnished">Unfurnished</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Facing (Vastu)</label>
                  <select
                    value={facing}
                    onChange={(e) => setFacing(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="East">East</option>
                    <option value="North-East">North-East</option>
                    <option value="North">North</option>
                    <option value="West">West</option>
                    <option value="South">South</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Parking Slots</label>
                  <select
                    value={parking}
                    onChange={(e) => setParking(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="1 Covered">1 Covered</option>
                    <option value="2 Covered">2 Covered</option>
                    <option value="3 Covered">3 Covered</option>
                    <option value="Open Parking">Open Parking</option>
                  </select>
                </div>
              </div>

              {/* Floor Level, Possession & RERA ID */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Floor Information</label>
                  <input
                    type="text"
                    value={floorInfo}
                    onChange={(e) => setFloorInfo(e.target.value)}
                    placeholder="e.g. Floor 8 of 18 Floors"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Possession Status</label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setReadyToMove(true)}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        readyToMove ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      Ready to Move
                    </button>
                    <button
                      type="button"
                      onClick={() => setReadyToMove(false)}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        !readyToMove ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      Under Const.
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">RERA Registration No.</label>
                  <input
                    type="text"
                    value={reraId}
                    onChange={(e) => setReraId(e.target.value)}
                    placeholder="e.g. P02400008921"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* 5. PROPERTY PHOTOGRAPHS (SELECT FROM DEVICE OR URL) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    Property Photographs (Device Upload or Links)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Select photos from your device gallery or file explorer. They are automatically converted into instant image links.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {photoUrls.length} {photoUrls.length === 1 ? 'Photo' : 'Photos'} Added
                </span>
              </div>

              {/* Hidden Native File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFilesSelected}
              />

              {/* Prominent Device File Picker Drag/Drop Card */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/60 hover:bg-blue-50/90 rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group shadow-2xs"
              >
                <div className="w-11 h-11 rounded-2xl bg-blue-600 group-hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-all group-hover:scale-105">
                  {isProcessingFiles ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <UploadCloud className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {isProcessingFiles
                      ? 'Converting and optimizing photos...'
                      : 'Choose Photos from Device (Gallery / File Explorer)'}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tap to browse files • Supports JPEG, PNG, HEIC & WebP
                  </p>
                </div>
              </div>

              {/* Optional Link Input for Direct URLs */}
              <div className="pt-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Or add photo via web link
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="url"
                      value={currentUrlInput}
                      onChange={(e) => {
                        setCurrentUrlInput(e.target.value);
                        if (urlInputError) setUrlInputError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPhotoUrl();
                        }
                      }}
                      placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPhotoUrl}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 active:scale-95 flex-shrink-0"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add Link</span>
                  </button>
                </div>

                {urlInputError && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {urlInputError}
                  </p>
                )}
              </div>

              {/* Live Image Previews Gallery */}
              {photoUrls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {photoUrls.map((url, idx) => {
                    const isCover = idx === 0;
                    const isBroken = brokenUrls.has(url);

                    return (
                      <div
                        key={idx}
                        className="relative rounded-2xl overflow-hidden bg-slate-200 border border-slate-300/80 shadow-xs group aspect-video"
                      >
                        {isBroken ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-rose-50 p-2 text-center text-rose-600">
                            <AlertCircle className="w-5 h-5 mb-1" />
                            <span className="text-[10px] font-bold">Image load error</span>
                          </div>
                        ) : (
                          <img
                            src={url}
                            alt={`Property Photo ${idx + 1}`}
                            onError={() => handleImageError(url)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        )}

                        {/* Cover Photo Badge */}
                        {isCover && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold shadow-xs">
                            Cover Photo
                          </div>
                        )}

                        {/* Actions overlay */}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                          {!isCover && (
                            <button
                              type="button"
                              onClick={() => handleSetCoverPhoto(idx)}
                              className="px-2 py-1 bg-white/90 hover:bg-white text-slate-900 text-[10px] font-bold rounded-lg shadow-xs transition-colors"
                            >
                              Make Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-dashed border-slate-300 text-center text-slate-400 text-xs">
                  No property photos added yet. Paste image links above to render live previews.
                </div>
              )}
            </div>

            {/* 6. AMENITIES CHECKLIST */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Amenities & Facilities ({selectedAmenities.length} selected)
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedAmenities(AVAILABLE_AMENITIES)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_AMENITIES.map((amenity) => {
                  const isChecked = selectedAmenities.includes(amenity);
                  return (
                    <div
                      key={amenity}
                      onClick={() => toggleAmenity(amenity)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center gap-2.5 ${
                        isChecked
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                          isChecked ? 'bg-blue-600 text-white' : 'border border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7. CONTACT & SELLER CREDENTIALS */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Lister Identity & Contact Channels
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Contact Name</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Listing As</label>
                  <select
                    value={contactType}
                    onChange={(e) => setContactType(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="Owner">Verified Owner</option>
                    <option value="Verified Agent">Certified Agent / Broker</option>
                    <option value="Builder">Registered Builder / Developer</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white/95 backdrop-blur-md pb-2">
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm hover:shadow transition-all active:scale-[0.98] flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Publish Property</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPropertyModal;
