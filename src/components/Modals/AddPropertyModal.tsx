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
  Building,
  Home,
  ShieldCheck,
  Phone,
  Mail,
  User,
  Layers,
  CheckCircle2,
  Save,
  RotateCcw,
  Zap,
  Tag,
  CreditCard,
  Factory
} from 'lucide-react';
import { razorpayService } from '../../services/razorpayService';

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

const LOCAL_STORAGE_DRAFT_KEY = 'mapestate_listing_draft_v4';

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
  'Water Softener & RO Plant',
  'Intercom Facility'
];

const COMMERCIAL_AMENITIES = [
  'Central HVAC / AC',
  '100% DG Power Backup',
  'High Speed Elevators',
  'Dedicated Transformer',
  'Grade-A Certified Tower',
  'Ample Visitor Parking',
  'Fire Sprinklers & Alarms',
  '24x7 Building Access',
  'Goods Lift & Loading Bay',
  'Conference & Meeting Rooms',
  'Wet Pantry Provision',
  'Fiber Optic Internet'
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
  'Pattadar Passbook Available',
  'Tar Road Access (40ft)'
];

const INDUSTRIAL_AMENITIES = [
  'Clear Ceiling Height (30+ Ft Clearance)',
  'Heavy Duty VDF Flooring (5 Ton/m²)',
  'Dedicated Dock Levelers & Bays',
  '3-Phase HT Industrial Power',
  'Fire Sprinklers & Hydrant Network',
  '24x7 Security & CCTV Surveillance',
  'Truck & 40ft Trailer Parking',
  'Weighbridge on Premises',
  'Rainwater Harvesting Pit',
  'Driver Restroom & Canteen'
];

const PLOT_AMENITIES = [
  '100% Clear Title & Spot Registration',
  'HMDA / DTCP Approved Layout',
  '40ft & 60ft Wide Blacktop Roads',
  'Underground Electricity Cables',
  'Underground Drainage System',
  'Overhead Water Tank with Pipe to Plot',
  'Gated Community with Compound Wall',
  'Avenue Plantation & Green Landscaping',
  'Solar Street Lighting',
  '24x7 Security Guard at Entrance'
];

const STEPS = [
  { id: 1, title: 'User Details', subtitle: 'Who are you & Contact Info' },
  { id: 2, title: 'Listing Purpose', subtitle: 'Sell, Rent, Lease or PG' },
  { id: 3, title: 'Property Category', subtitle: 'Residential, Commercial, Ag, Ind...' },
  { id: 4, title: 'Property Type', subtitle: 'Apartment, Villa, Plot, Office, Warehouse...' },
  { id: 5, title: 'Property Details', subtitle: 'BHK, Area, Elevation & Specific Dimensions' },
  { id: 6, title: 'Property Location', subtitle: 'Address, City & Live Map Pin' },
  { id: 7, title: 'Price Details', subtitle: 'Expected Price, Deposit & Terms' },
  { id: 8, title: 'Amenities & Facilities', subtitle: 'Power Backup, Parking & Security' },
  { id: 9, title: 'Photos & Description', subtitle: 'Gallery, Layout & AI Generator' },
  { id: 10, title: 'Ownership & Documents', subtitle: 'RERA, Title Deed & Approvals' },
  { id: 11, title: 'Contact Verification', subtitle: 'OTP Mobile Verification' },
  { id: 12, title: 'Review & Submit', subtitle: 'Summary, Optional Spotlight Boost & Publish' }
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
  // Navigation State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isQuickListMode, setIsQuickListMode] = useState<boolean>(false);
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [draftToast, setDraftToast] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  // 1. User Details
  const [userRole, setUserRole] = useState<'Owner' | 'Agent' | 'Builder' | 'Company'>('Owner');
  const [fullName, setFullName] = useState('Keerthi Charan');
  const [userPhone, setUserPhone] = useState('+91 98490 12345');
  const [userEmail, setUserEmail] = useState('charan@mapestate.in');

  // 2. Listing Purpose
  const [purpose, setPurpose] = useState<ListingType>('sale');

  // 3. Property Category
  const [categoryGroup, setCategoryGroup] = useState<'Residential' | 'Commercial' | 'Agricultural' | 'Industrial' | 'Other'>('Residential');

  // 4. Property Type
  const [propertyType, setPropertyType] = useState<PropertyCategory>('Apartment');

  // 5. Property Details (Category adaptive)
  // Apartment & Penthouse
  const [bhk, setBhk] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [balconies, setBalconies] = useState<number>(1);
  const [floorNumber, setFloorNumber] = useState<number>(5);
  const [totalFloors, setTotalFloors] = useState<number>(14);
  const [furnishing, setFurnishing] = useState<'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished'>('Semi-Furnished');
  const [carpetAreaSqFt, setCarpetAreaSqFt] = useState<number>(1450);
  const [builtUpAreaSqFt, setBuiltUpAreaSqFt] = useState<number>(1800);
  const [skyTerraceAreaSqFt, setSkyTerraceAreaSqFt] = useState<number>(650);
  const [facing, setFacing] = useState('East (Vastu Compliant)');
  const [parking, setParking] = useState('1 Covered');
  const [readyToMove, setReadyToMove] = useState(true);

  // House / Villa
  const [villaBedrooms, setVillaBedrooms] = useState<number>(3);
  const [villaBathrooms, setVillaBathrooms] = useState<number>(3);
  const [villaFloors, setVillaFloors] = useState<string>('G+1 (Duplex)');
  const [villaPlotArea, setVillaPlotArea] = useState<number>(200);
  const [villaBuiltUpArea, setVillaBuiltUpArea] = useState<number>(2500);
  const [villaParking, setVillaParking] = useState<string>('1 Covered Car');
  const [hasPrivateGarden, setHasPrivateGarden] = useState<boolean>(true);

  // Open Plot & Land Plot
  const [plotArea, setPlotArea] = useState<number>(300);
  const [plotUnit, setPlotUnit] = useState<'Sq. Yards' | 'Sq. Feet' | 'Cents' | 'Gunthas'>('Sq. Yards');
  const [plotLength, setPlotLength] = useState<number>(60);
  const [plotWidth, setPlotWidth] = useState<number>(45);
  const [plotFacing, setPlotFacing] = useState('North-East Corner');
  const [roadWidthFt, setRoadWidthFt] = useState<number>(40);
  const [plotNumber, setPlotNumber] = useState('Plot No. 42');
  const [plotSurveyNumber, setPlotSurveyNumber] = useState('Sy. No. 128/A');
  const [isPlotFenced, setIsPlotFenced] = useState(true);
  const [hasUndergroundDrainage, setHasUndergroundDrainage] = useState(true);

  // Commercial (Office / Shop / Showroom)
  const [commercialUsage, setCommercialUsage] = useState<string>('Grade-A Corporate Office');
  const [commercialSuperArea, setCommercialSuperArea] = useState<number>(4500);
  const [commercialCarpetArea, setCommercialCarpetArea] = useState<number>(3800);
  const [commercialFloor, setCommercialFloor] = useState<number>(4);
  const [commercialTotalFloors, setCommercialTotalFloors] = useState<number>(12);
  const [commercialParking, setCommercialParking] = useState<string>('6 Dedicated 4-Wheelers & 12 Bikes');
  const [commercialPower, setCommercialPower] = useState<string>('3-Phase 50kVA with 100% DG Backup');
  const [commercialWashrooms, setCommercialWashrooms] = useState<number>(4);
  const [hasPantry, setHasPantry] = useState<boolean>(true);

  // Industrial & Warehouse
  const [warehouseCeilingHeight, setWarehouseCeilingHeight] = useState<number>(32);
  const [warehouseAreaSqFt, setWarehouseAreaSqFt] = useState<number>(25000);
  const [warehouseDockDoors, setWarehouseDockDoors] = useState<number>(4);
  const [warehouseFlooring, setWarehouseFlooring] = useState<string>('Heavy Duty VDF (5 Ton/m²)');
  const [warehousePowerLoad, setWarehousePowerLoad] = useState<string>('100 kVA HT Industrial');
  const [hasFireNoc, setHasFireNoc] = useState<boolean>(true);
  const [trailerAccessRoadFt, setTrailerAccessRoadFt] = useState<number>(60);

  // Agricultural Land
  const [landAcres, setLandAcres] = useState<number>(2.5);
  const [landGunthas, setLandGunthas] = useState<number>(10);
  const [agriSurveyNumber, setAgriSurveyNumber] = useState('Sy. No. 245/1 & 245/2');
  const [waterSources, setWaterSources] = useState<string[]>([
    'Borewell with Submersible Pump',
    'Drip Irrigation Network'
  ]);
  const [soilType, setSoilType] = useState<'Red Soil' | 'Black Cotton' | 'Alluvial / Loam' | 'Mixed / Gravel'>('Red Soil');
  const [roadAccess, setRoadAccess] = useState<'40ft Tar / Blacktop Road' | 'Concrete CC Road' | 'Farm Approach Road'>('40ft Tar / Blacktop Road');
  const [isAgriFenced, setIsAgriFenced] = useState(true);
  const [hasPassbook, setHasPassbook] = useState(true);

  // 6. Property Location
  const [country] = useState('India');
  const [stateName, setStateName] = useState('Telangana');
  const [district, setDistrict] = useState('Ranga Reddy');
  const [city, setCity] = useState('Hyderabad');
  const [locality, setLocality] = useState('Gachibowli');
  const [streetAddress, setStreetAddress] = useState('Near Financial District Junction');
  const [projectOrSociety, setProjectOrSociety] = useState('Aparna Sarovar Zenith');
  const [pinCode, setPinCode] = useState('500032');

  // 7. Price Details
  const [price, setPrice] = useState<number>(18500000);
  const [securityDeposit, setSecurityDeposit] = useState<number>(90000);
  const [leaseAmount, setLeaseAmount] = useState<number>(500000);
  const [maintenanceMonthly, setMaintenanceMonthly] = useState<number>(5000);
  const [brokerage, setBrokerage] = useState<string>('Zero Brokerage (Direct)');
  const [isNegotiable, setIsNegotiable] = useState<boolean>(true);

  // 8. Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    '24x7 Security & CCTV',
    '100% Power Backup',
    'Covered Car Parking',
    'High Speed Elevators',
    '100% Vastu Compliant'
  ]);
  const [customAmenityInput, setCustomAmenityInput] = useState<string>('');

  // 9. Photos & Description
  const [propertyTitle, setPropertyTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'
  ]);
  const [videoTourUrl, setVideoTourUrl] = useState<string>('');
  const [floorPlanUrl, setFloorPlanUrl] = useState<string>('');
  const [nearbyLandmarks, setNearbyLandmarks] = useState<string>('Wipro Circle (1.2 km), Outer Ring Road Exit 1 (2.5 km)');

  // 10. Ownership & Documents
  const [ownerName, setOwnerName] = useState<string>('Keerthi Charan');
  const [ownershipType, setOwnershipType] = useState<string>('Individual (Freehold)');
  const [titleDeedType, setTitleDeedType] = useState<string>('Original Registered Sale Deed');
  const [reraId, setReraId] = useState<string>('P02400001234');
  const [approvalAuthority, setApprovalAuthority] = useState<string>('HMDA Approved');
  const [hasEncumbranceCertificate, setHasEncumbranceCertificate] = useState(true);

  // 11. Contact Verification
  const [contactPersonName, setContactPersonName] = useState('Keerthi Charan');
  const [contactMobileNumber, setContactMobileNumber] = useState('+91 98490 12345');
  const [customWhatsApp, setCustomWhatsApp] = useState('+91 98490 12345');
  const [isSameWhatsApp, setIsSameWhatsApp] = useState(true);
  const [otpCode, setOtpCode] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(true);
  const [otpSent, setOtpSent] = useState(false);

  // 12. Review & Spotlight Boost via Razorpay
  const [enableSpotlightBoost, setEnableSpotlightBoost] = useState<boolean>(false);

  // Submission State
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Sync selected location from map pin
  useEffect(() => {
    if (selectedLocation) {
      if (selectedLocation.area) setLocality(selectedLocation.area);
      if (selectedLocation.city) setCity(selectedLocation.city);
      if (selectedLocation.state) setStateName(selectedLocation.state);
      if (selectedLocation.pinCode) setPinCode(selectedLocation.pinCode);
      if (selectedLocation.address) setStreetAddress(selectedLocation.address);
    }
  }, [selectedLocation]);

  // Sync land metrics from drawing surveyor tool
  useEffect(() => {
    if (landMetrics && landMetrics.areaAcres > 0) {
      setLandAcres(landMetrics.areaAcres);
      setLandGunthas(landMetrics.areaGunthas);
    }
  }, [landMetrics]);

  // Check draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
      if (saved) {
        setHasDraft(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Scroll to top on step transition
  const scrollToTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToStep = (stepNumber: number) => {
    setSlideDirection(stepNumber > currentStep ? 'forward' : 'backward');
    setCurrentStep(stepNumber);
    scrollToTop();
  };

  const handleNextStep = () => {
    if (currentStep < 12) {
      goToStep(currentStep + 1);
    } else {
      handlePublishListing();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  // AI Description Generator
  const handleAutoGenerateAI = () => {
    const locStr = `${locality || 'Prime Locality'}, ${city || 'Hyderabad'}`;
    const purposeStr = purpose === 'sale' ? 'Sale' : purpose === 'rent' ? 'Rent' : purpose === 'lease' ? 'Lease' : 'PG';

    if (propertyType === 'Apartment' || propertyType === 'Penthouse') {
      const bhkStr = bhk === 0 ? 'Studio / 1 RK' : `${bhk} BHK`;
      const autoTitle = `${bhkStr} Luxury ${propertyType} in ${projectOrSociety || locStr}`;
      const bathStr = bathrooms === 0 ? 'common washrooms' : `${bathrooms} bathrooms`;
      const balcStr = balconies === 0 ? 'no attached balcony' : `${balconies} balconies`;
      const autoDesc = `Spacious ${bhkStr} luxury ${propertyType.toLowerCase()} situated on floor ${floorNumber} of ${totalFloors} floors with ${builtUpAreaSqFt} sq.ft built-up area (${carpetAreaSqFt} sq.ft carpet), ${bathStr}, and ${balcStr}. Vastu compliant facing ${facing}, ${furnishing}, with ${parking} parking spaces. Located in a prime gated community with ${selectedAmenities.slice(0, 4).join(', ')}. Excellent connectivity to major IT corridors and transit.`;
      setPropertyTitle(autoTitle);
      setDescription(autoDesc);
    } else if (propertyType === 'Villa' || propertyType === 'Independent House') {
      const bedStr = villaBedrooms === 0 ? 'Studio / Open Layout' : `${villaBedrooms} BHK`;
      const autoTitle = `${bedStr} Gated ${propertyType} in ${projectOrSociety || locStr}`;
      const autoDesc = `Magnificent ${bedStr} ${propertyType} (${villaFloors}) spanning ${villaBuiltUpArea} sq.ft built-up on a prime ${villaPlotArea} sq.yds plot. Features ${villaBathrooms} bathrooms, ${villaParking}, facing ${facing}, with luxury private landscaping and world-class society amenities including ${selectedAmenities.slice(0, 4).join(', ')}.`;
      setPropertyTitle(autoTitle);
      setDescription(autoDesc);
    } else if (propertyType === 'Open Plot' || propertyType === 'Plot') {
      const autoTitle = `${plotArea} ${plotUnit} Approved ${propertyType} in ${locStr}`;
      const autoDesc = `Clear title ${plotArea} ${plotUnit} premium open plot with ${plotLength}x${plotWidth} dimensions facing ${plotFacing}. Abutting a wide ${roadWidthFt}ft road with ${isPlotFenced ? 'fenced boundary' : 'clear demarcation'}. Approved layout under ${approvalAuthority}. Ideal for immediate villa construction or long-term high ROI investment.`;
      setPropertyTitle(autoTitle);
      setDescription(autoDesc);
    } else if (propertyType === 'Agricultural Land') {
      const autoTitle = `${landAcres} Acres High-Yield Agricultural Land in ${locStr}`;
      const autoDesc = `Exceptional ${landAcres} Acres (${landGunthas} Gunthas) fertile ${soilType} farmland with ${roadAccess}. Abundant water available via ${waterSources.join(', ') || 'Borewell'}. ${isAgriFenced ? 'Fully fenced perimeter' : 'Demarcated borders'}, survey no. ${agriSurveyNumber}, 100% clear title with updated Pattadar Passbook. Excellent agro-farm and retreat opportunity.`;
      setPropertyTitle(autoTitle);
      setDescription(autoDesc);
    } else if (propertyType === 'Warehouse' || propertyType === 'Industrial') {
      const autoTitle = `${warehouseAreaSqFt.toLocaleString('en-IN')} Sq.Ft Modern ${propertyType} in ${locStr}`;
      const autoDesc = `Grade-A industrial facility comprising ${warehouseAreaSqFt} sq.ft shed on a wide ${trailerAccessRoadFt}ft container trailer access road. Features ${warehouseCeilingHeight}ft clear ceiling height, ${warehouseDockDoors} loading dock doors, ${warehouseFlooring}, and ${warehousePowerLoad}. 100% compliant with fire NOC & industrial building permissions.`;
      setPropertyTitle(autoTitle);
      setDescription(autoDesc);
    } else if (propertyType === 'Office' || propertyType === 'Shop' || propertyType === 'Commercial') {
      const autoTitle = `${commercialSuperArea} Sq.Ft ${commercialUsage} in ${locStr}`;
      const autoDesc = `Prime Grade-A commercial space comprising ${commercialSuperArea} sq.ft super area (${commercialCarpetArea} sq.ft carpet area) on floor ${commercialFloor} of ${commercialTotalFloors}. Equipped with ${commercialPower}, ${commercialParking}, and ${commercialWashrooms} washrooms. Ideal for corporate headquarters, IT/ITES firms, and premium retail operations.`;
      setPropertyTitle(autoTitle);
      setDescription(autoDesc);
    } else {
      const autoTitle = `Prime ${propertyType} Available for ${purposeStr} in ${locStr}`;
      const autoDesc = `Outstanding real estate opportunity in ${locStr}. Highly strategic location with seamless road access, excellent infrastructure, clear documents, and top-tier amenities.`;
      setPropertyTitle(autoTitle);
      setDescription(autoDesc);
    }
  };

  // Run auto generate initially if title is empty
  useEffect(() => {
    if (!propertyTitle) {
      handleAutoGenerateAI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyType, purpose, bhk, locality, city]);

  // Draft Management
  const handleSaveDraft = () => {
    const draftData = {
      currentStep,
      userRole,
      fullName,
      userPhone,
      userEmail,
      purpose,
      categoryGroup,
      propertyType,
      bhk,
      bathrooms,
      balconies,
      floorNumber,
      totalFloors,
      furnishing,
      carpetAreaSqFt,
      builtUpAreaSqFt,
      facing,
      parking,
      readyToMove,
      villaBedrooms,
      villaBathrooms,
      villaFloors,
      villaPlotArea,
      villaBuiltUpArea,
      villaParking,
      plotArea,
      plotUnit,
      plotLength,
      plotWidth,
      plotFacing,
      roadWidthFt,
      plotNumber,
      plotSurveyNumber,
      isPlotFenced,
      commercialUsage,
      commercialSuperArea,
      commercialCarpetArea,
      commercialFloor,
      commercialTotalFloors,
      commercialParking,
      commercialPower,
      commercialWashrooms,
      warehouseCeilingHeight,
      warehouseAreaSqFt,
      warehouseDockDoors,
      landAcres,
      landGunthas,
      agriSurveyNumber,
      waterSources,
      soilType,
      roadAccess,
      isAgriFenced,
      country,
      stateName,
      district,
      city,
      locality,
      streetAddress,
      projectOrSociety,
      pinCode,
      price,
      securityDeposit,
      leaseAmount,
      maintenanceMonthly,
      brokerage,
      isNegotiable,
      selectedAmenities,
      propertyTitle,
      description,
      photoUrls,
      videoTourUrl,
      floorPlanUrl,
      nearbyLandmarks,
      ownerName,
      ownershipType,
      reraId,
      approvalAuthority,
      contactPersonName,
      contactMobileNumber,
      customWhatsApp,
      isSameWhatsApp
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(draftData));
      setHasDraft(true);
      setDraftToast('Draft saved successfully! You can resume anytime.');
      setTimeout(() => setDraftToast(''), 3000);
    } catch {
      // ignore
    }
  };

  const handleResumeDraft = () => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.userRole) setUserRole(data.userRole);
      if (data.fullName) setFullName(data.fullName);
      if (data.userPhone) setUserPhone(data.userPhone);
      if (data.userEmail) setUserEmail(data.userEmail);
      if (data.purpose) setPurpose(data.purpose);
      if (data.categoryGroup) setCategoryGroup(data.categoryGroup);
      if (data.propertyType) setPropertyType(data.propertyType);
      if (data.bhk !== undefined) setBhk(data.bhk);
      if (data.bathrooms !== undefined) setBathrooms(data.bathrooms);
      if (data.balconies !== undefined) setBalconies(data.balconies);
      if (data.floorNumber !== undefined) setFloorNumber(data.floorNumber);
      if (data.totalFloors !== undefined) setTotalFloors(data.totalFloors);
      if (data.furnishing) setFurnishing(data.furnishing);
      if (data.carpetAreaSqFt !== undefined) setCarpetAreaSqFt(data.carpetAreaSqFt);
      if (data.builtUpAreaSqFt !== undefined) setBuiltUpAreaSqFt(data.builtUpAreaSqFt);
      if (data.price !== undefined) setPrice(data.price);
      if (data.propertyTitle) setPropertyTitle(data.propertyTitle);
      if (data.description) setDescription(data.description);
      if (data.locality) setLocality(data.locality);
      if (data.city) setCity(data.city);
      if (data.currentStep) setCurrentStep(data.currentStep);
      setDraftToast('Resumed your saved draft!');
      setTimeout(() => setDraftToast(''), 3000);
    } catch {
      // ignore
    }
  };

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
      setHasDraft(false);
      setDraftToast('Draft cleared.');
      setTimeout(() => setDraftToast(''), 2500);
    } catch {
      // ignore
    }
  };

  // Amenity toggle
  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleAddCustomAmenity = () => {
    if (customAmenityInput.trim() && !selectedAmenities.includes(customAmenityInput.trim())) {
      setSelectedAmenities([...selectedAmenities, customAmenityInput.trim()]);
      setCustomAmenityInput('');
    }
  };

  // OTP Verification Simulation
  const handleSendOtp = () => {
    setOtpSent(true);
    setOtpCode('4829');
    setDraftToast('OTP code 4829 sent to ' + (contactMobileNumber || userPhone));
    setTimeout(() => setDraftToast(''), 4000);
  };

  const handleVerifyOtp = () => {
    if (otpCode === '4829' || otpCode.length === 4) {
      setIsPhoneVerified(true);
      setDraftToast('Mobile number successfully verified!');
      setTimeout(() => setDraftToast(''), 3000);
    }
  };

  // Final Publish Handler
  const handlePublishListing = () => {
    setIsPublishing(true);

    const isAgri = propertyType === 'Agricultural Land';
    const isPlot = propertyType === 'Open Plot' || propertyType === 'Plot';
    const isWarehouse = propertyType === 'Warehouse' || propertyType === 'Industrial';

    const coords: [number, number] = selectedLocation
      ? selectedLocation.coordinates
      : [78.3820, 17.4474];

    const finalImages =
      photoUrls.length > 0
        ? photoUrls
        : isAgri
          ? ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80']
          : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'];

    let calculatedAreaSqFt = builtUpAreaSqFt;
    if (isAgri) {
      calculatedAreaSqFt = Math.round(landAcres * 43560 + landGunthas * 1089);
    } else if (isPlot) {
      calculatedAreaSqFt = plotUnit === 'Sq. Yards' ? plotArea * 9 : plotArea;
    } else if (propertyType === 'Villa' || propertyType === 'Independent House') {
      calculatedAreaSqFt = villaBuiltUpArea;
    } else if (isWarehouse) {
      calculatedAreaSqFt = warehouseAreaSqFt;
    } else if (propertyType === 'Office' || propertyType === 'Shop' || propertyType === 'Commercial') {
      calculatedAreaSqFt = commercialSuperArea;
    }

    const landmarkArray = nearbyLandmarks
      ? nearbyLandmarks.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const newPropertyId = `custom-prop-${Date.now()}`;

    const newProperty: Property = {
      id: newPropertyId,
      title: propertyTitle.trim() || `${propertyType} in ${locality}, ${city}`,
      description: description.trim(),
      price: Number(price),
      priceDisplay: formatIndianCurrency(Number(price), purpose),
      type: purpose,
      category: propertyType,
      bhk: isAgri || isPlot || isWarehouse ? 0 : propertyType === 'Villa' || propertyType === 'Independent House' ? villaBedrooms : Number(bhk),
      bathrooms: isAgri || isPlot || isWarehouse ? 0 : propertyType === 'Villa' || propertyType === 'Independent House' ? villaBathrooms : Number(bathrooms),
      balconies: isAgri || isPlot || isWarehouse ? 0 : Number(balconies),
      areaSqFt: calculatedAreaSqFt,
      carpetAreaSqFt: isAgri || isPlot ? undefined : propertyType === 'Apartment' || propertyType === 'Penthouse' ? Number(carpetAreaSqFt) : commercialCarpetArea,
      address: streetAddress.trim(),
      area: locality.trim(),
      district: district.trim(),
      city: city.trim(),
      state: stateName.trim(),
      pinCode: pinCode.trim(),
      coordinates: coords,
      images: finalImages,
      features: selectedAmenities.length > 0 ? selectedAmenities : isAgri ? ['Red Soil', 'Borewell'] : ['Power Backup'],
      verified: true,
      readyToMove: readyToMove,
      furnishing: isAgri || isPlot ? 'Unfurnished' : furnishing,
      facing: isPlot ? plotFacing : facing,
      parking: propertyType === 'Villa' || propertyType === 'Independent House' ? villaParking : isWarehouse ? 'Trailer Parking' : propertyType === 'Apartment' ? parking : commercialParking,
      floorInfo: isAgri ? 'Agricultural Parcel' : isPlot ? 'Open Ground Plot' : isWarehouse ? 'Industrial Floor' : propertyType === 'Villa' ? villaFloors : `Floor ${floorNumber} of ${totalFloors} Floors`,
      maintenanceMonthly: maintenanceMonthly,
      reraId: reraId.trim() || undefined,
      postedDate: 'Just now',
      projectOrSociety: projectOrSociety.trim() || undefined,
      deposit: purpose !== 'sale' ? securityDeposit : undefined,
      leaseAmount: purpose === 'lease' ? leaseAmount : undefined,
      brokerage: brokerage,
      isNegotiable: isNegotiable,
      ownershipType: ownershipType,
      approvalAuthority: approvalAuthority,
      surveyNumber: isAgri ? agriSurveyNumber : isPlot ? plotSurveyNumber : undefined,
      videoUrl: videoTourUrl.trim() || undefined,
      floorPlanUrl: floorPlanUrl.trim() || undefined,
      whatsappNumber: isSameWhatsApp ? contactMobileNumber : customWhatsApp.trim(),
      landmarks: landmarkArray,
      isFeatured: enableSpotlightBoost,
      contact: {
        name: contactPersonName.trim() || fullName.trim() || 'Property Owner',
        phone: contactMobileNumber.trim() || userPhone.trim() || '+91 98490 12345',
        type: userRole === 'Agent' ? 'Verified Agent' : userRole,
        email: userEmail.trim(),
        kycVerified: isPhoneVerified
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

    // If Spotlight Boost was selected, use credit or trigger Razorpay payment!
    if (enableSpotlightBoost) {
      const credits = razorpayService.getSpotlightCredits();
      if (credits > 0) {
        razorpayService.boostProperty(newPropertyId);
        onAddProperty({ ...newProperty, isFeatured: true });
        try {
          localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
        } catch { }
        setIsPublishing(false);
        onClose();
        return;
      }

      const boostPlan = {
        id: 'boost_spotlight_30',
        category: 'seller_boost' as const,
        title: '30-Day Golden Spotlight Boost',
        price: 999,
        description: 'Boost your newly listed property to the top of Google Satellite Map search results.',
        features: ['Golden glowing map pin', 'Top ranking in searches', '10x buyer lead inquiries']
      };

      razorpayService.openCheckout({
        plan: boostPlan,
        propertyId: newPropertyId,
        propertyTitle: newProperty.title,
        userName: fullName,
        userEmail: userEmail,
        userPhone: contactMobileNumber || userPhone,
        onSuccess: () => {
          onAddProperty({ ...newProperty, isFeatured: true });
          try {
            localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
          } catch {
            // ignore
          }
          setIsPublishing(false);
          onClose();
        },
        onDismiss: () => {
          // User closed checkout: still publish as standard free listing
          onAddProperty(newProperty);
          try {
            localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
          } catch {
            // ignore
          }
          setIsPublishing(false);
          onClose();
        }
      });
      return;
    }

    // Standard free publishing
    setTimeout(() => {
      onAddProperty(newProperty);
      try {
        localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
      } catch {
        // ignore
      }
      setIsPublishing(false);
      onClose();
    }, 450);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center font-sans antialiased bg-slate-900/75 p-0 sm:p-4"
      onClick={(e) => {
        // Click on empty space outside modal closes it immediately
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Main Modal Window */}
      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:max-w-3xl bg-white rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 border-0 sm:border sm:border-slate-200">
        
        {/* ================= HEADER ================= */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Logo with built-in light capsule ensures it is NEVER dark near the logo */}
            <Logo size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {isQuickListMode ? '⚡ 60-Second Quick List' : 'List Your Property'}
                </h3>
                <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {isQuickListMode ? 'Express Mode' : `Step ${currentStep} of 12`}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {isQuickListMode 
                  ? 'Fill essential details to publish immediately' 
                  : STEPS[currentStep - 1]?.subtitle || 'Capture property details interactively'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsQuickListMode(!isQuickListMode)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                isQuickListMode 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden xs:inline">{isQuickListMode ? 'Detailed Mode' : '60s Quick List'}</span>
            </button>

            {/* Save Draft */}
            <button
              type="button"
              onClick={handleSaveDraft}
              title="Save Draft"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Save className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar (Detailed Mode) */}
        {!isQuickListMode && (
          <div className="w-full bg-slate-100 h-1 flex-shrink-0">
            <div
              className="h-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / 12) * 100}%` }}
            />
          </div>
        )}

        {/* Toast / Draft Alert Banner */}
        {draftToast && (
          <div className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between flex-shrink-0 animate-in fade-in">
            <span>{draftToast}</span>
            <button type="button" onClick={() => setDraftToast('')} className="text-white/80 hover:text-white">✕</button>
          </div>
        )}

        {hasDraft && currentStep === 1 && !isQuickListMode && !draftToast && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900 flex-shrink-0">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>You have an unfinished property draft saved.</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResumeDraft}
                className="font-bold underline text-amber-900"
              >
                Resume Draft
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="text-amber-600 hover:underline"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP CONTENT AREA (ANIMATED TRANSITION) ================= */}
        <div
          ref={contentRef}
          key={isQuickListMode ? 'quick-list' : `step-${currentStep}`}
          className={`flex-1 overflow-y-auto p-4 sm:p-6 ${
            slideDirection === 'forward' ? 'step-transition-forward' : 'step-transition-backward'
          }`}
        >

          {/* ================= QUICK LIST MODE ================= */}
          {isQuickListMode && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span>Fill just 5 essential fields to list your property live on the map immediately. You can enrich documents, amenities, and floor plans anytime later!</span>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  1. Property Title or Society Name *
                </label>
                <input
                  type="text"
                  value={propertyTitle}
                  onChange={(e) => setPropertyTitle(e.target.value)}
                  placeholder="e.g. 3 BHK Luxury Flat in Aparna Sarovar, or 200 Sq. Yd HMDA Plot"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                    2. Listing Purpose
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                  >
                    <option value="sale">Sell (Direct Sale)</option>
                    <option value="rent">Rent (Monthly Lease)</option>
                    <option value="lease">Long Lease</option>
                    <option value="pg">PG / Co-living</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                    3. Property Type
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                  >
                    <option value="Apartment">Apartment / Flat</option>
                    <option value="Villa">Gated Villa</option>
                    <option value="Independent House">Independent House</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Open Plot">Open Plot</option>
                    <option value="Agricultural Land">Agricultural Land</option>
                    <option value="Commercial">Commercial Space</option>
                    <option value="Warehouse">Warehouse / Shed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                    4. Expected Price (₹)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                  />
                  <span className="text-[11px] font-bold text-blue-600 mt-1 block">
                    {formatIndianCurrency(price, purpose)}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                    5. Locality & City
                  </label>
                  <input
                    type="text"
                    value={`${locality}, ${city}`}
                    onChange={(e) => {
                      const parts = e.target.value.split(',');
                      setLocality(parts[0]?.trim() || '');
                      if (parts[1]) setCity(parts[1].trim());
                    }}
                    placeholder="e.g. Gachibowli, Hyderabad"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Map Location Anchor</div>
                    <div className="text-[11px] text-slate-500">
                      {selectedLocation ? `Lat: ${selectedLocation.coordinates[1].toFixed(4)}, Lng: ${selectedLocation.coordinates[0].toFixed(4)}` : 'Click to pin exact spot on live map'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartDropPin();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                >
                  {selectedLocation ? 'Reposition' : 'Pin Map'}
                </button>
              </div>
            </div>
          )}

          {/* ================= DETAILED 12-STEP INTERACTIVE WIZARD ================= */}

          {/* STEP 1: USER DETAILS */}
          {!isQuickListMode && currentStep === 1 && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                  1. Who are you?
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your profile classification for trust and verification badges.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['Owner', 'Agent', 'Builder', 'Company'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setUserRole(role)}
                    className={`p-3.5 rounded-xl border text-center transition-all min-h-[52px] ${
                      userRole === role
                        ? 'border-blue-600 bg-blue-50/80 text-blue-700 font-bold ring-2 ring-blue-600/20'
                        : 'border-slate-200 bg-white text-slate-700 font-medium hover:border-slate-300'
                    }`}
                  >
                    <User className="w-4 h-4 mx-auto mb-1.5 opacity-80" />
                    <span className="text-xs">{role}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="tel"
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)}
                        placeholder="+91 98490 12345"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LISTING PURPOSE */}
          {!isQuickListMode && currentStep === 2 && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                  2. What is your listing purpose?
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you looking to sell outright, rent monthly, lease or provide PG accommodation?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'sale', label: 'Sell Outright', desc: 'Direct sale / resale of property' },
                  { key: 'rent', label: 'Rent Out', desc: 'Monthly recurring tenancy' },
                  { key: 'lease', label: 'Long Lease', desc: 'Commercial or long-term multi-year lease' },
                  { key: 'pg', label: 'PG / Co-Living', desc: 'Paying guest & shared serviced rooms' }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setPurpose(item.key as ListingType)}
                    className={`p-4 rounded-xl border text-left transition-all min-h-[76px] ${
                      purpose === item.key
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`text-sm font-bold ${purpose === item.key ? 'text-blue-700' : 'text-slate-900'}`}>
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: SELECT PROPERTY CATEGORY */}
          {!isQuickListMode && currentStep === 3 && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                  3. Select Property Category
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  This tailors the specific questions in subsequent steps to your exact asset type.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: 'Residential', icon: Home, desc: 'Flats, Villas, Penthouses & Houses' },
                  { key: 'Commercial', icon: Building, desc: 'Offices, Shops & Showrooms' },
                  { key: 'Agricultural', icon: Layers, desc: 'Farmland, Groves & Estates' },
                  { key: 'Industrial', icon: Factory, desc: 'Warehouses, Godowns & Sheds' },
                  { key: 'Other', icon: Tag, desc: 'Open Plots, Layout Sites & Mixed' }
                ].map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        setCategoryGroup(cat.key as any);
                        if (cat.key === 'Agricultural') setPropertyType('Agricultural Land');
                        else if (cat.key === 'Commercial') setPropertyType('Office');
                        else if (cat.key === 'Residential') setPropertyType('Apartment');
                        else if (cat.key === 'Industrial') setPropertyType('Warehouse');
                        else setPropertyType('Open Plot');
                      }}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        categoryGroup === cat.key
                          ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${categoryGroup === cat.key ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div className={`text-sm font-bold ${categoryGroup === cat.key ? 'text-blue-700' : 'text-slate-900'}`}>
                        {cat.key}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {cat.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: SELECT PROPERTY TYPE */}
          {!isQuickListMode && currentStep === 4 && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                  4. Select Specific Property Type
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Refined category within {categoryGroup}.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categoryGroup === 'Residential' && (
                  <>
                    {[
                      { key: 'Apartment', label: 'Apartment / Flat' },
                      { key: 'Villa', label: 'Gated Villa' },
                      { key: 'Independent House', label: 'Independent House' },
                      { key: 'Penthouse', label: 'Rooftop Penthouse' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setPropertyType(item.key as any)}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          propertyType === item.key
                            ? 'border-blue-600 bg-blue-50/80 text-blue-700 font-bold ring-2 ring-blue-600/20'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-sm font-bold">{item.label}</span>
                      </button>
                    ))}
                  </>
                )}

                {categoryGroup === 'Commercial' && (
                  <>
                    {[
                      { key: 'Office', label: 'Corporate Office' },
                      { key: 'Shop', label: 'Retail Shop / Showroom' },
                      { key: 'Commercial', label: 'Commercial Building' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setPropertyType(item.key as any)}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          propertyType === item.key
                            ? 'border-blue-600 bg-blue-50/80 text-blue-700 font-bold ring-2 ring-blue-600/20'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-sm font-bold">{item.label}</span>
                      </button>
                    ))}
                  </>
                )}

                {categoryGroup === 'Agricultural' && (
                  <>
                    {[
                      { key: 'Agricultural Land', label: 'Farmland / Agricultural' },
                      { key: 'Villa', label: 'Farm House with Land' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setPropertyType(item.key as any)}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          propertyType === item.key
                            ? 'border-blue-600 bg-blue-50/80 text-blue-700 font-bold ring-2 ring-blue-600/20'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-sm font-bold">{item.label}</span>
                      </button>
                    ))}
                  </>
                )}

                {categoryGroup === 'Industrial' && (
                  <>
                    {[
                      { key: 'Warehouse', label: 'Warehouse / Godown' },
                      { key: 'Industrial', label: 'Industrial Shed / Factory' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setPropertyType(item.key as any)}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          propertyType === item.key
                            ? 'border-blue-600 bg-blue-50/80 text-blue-700 font-bold ring-2 ring-blue-600/20'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-sm font-bold">{item.label}</span>
                      </button>
                    ))}
                  </>
                )}

                {categoryGroup === 'Other' && (
                  <>
                    {[
                      { key: 'Open Plot', label: 'Residential Open Plot' },
                      { key: 'Plot', label: 'Commercial / Land Plot' },
                      { key: 'Penthouse', label: 'Penthouse' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setPropertyType(item.key as any)}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          propertyType === item.key
                            ? 'border-blue-600 bg-blue-50/80 text-blue-700 font-bold ring-2 ring-blue-600/20'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-sm font-bold">{item.label}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: PROPERTY DETAILS (ADAPTIVE PER TYPE - 0-BASED) */}
          {!isQuickListMode && currentStep === 5 && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                  5. {propertyType} Specifications
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter accurate measurements and configurations (starting from 0).
                </p>
              </div>

              {/* APARTMENT & PENTHOUSE */}
              {(propertyType === 'Apartment' || propertyType === 'Penthouse') && (
                <div className="space-y-4">
                  {/* BHK Selector (0-based) */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      BHK Configuration (0 = Studio/1RK)
                    </label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setBhk(val)}
                          className={`flex-1 py-2 rounded-xl border text-center font-bold text-xs transition-colors ${
                            bhk === val
                              ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {val === 0 ? 'Studio' : `${val} BHK`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bathrooms & Balconies (0-based) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                        Bathrooms (from 0)
                      </label>
                      <div className="flex gap-1.5">
                        {[0, 1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setBathrooms(num)}
                            className={`flex-1 py-1.5 rounded-lg border text-center text-xs font-bold transition-colors ${
                              bathrooms === num
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                        Balconies (from 0)
                      </label>
                      <div className="flex gap-1.5">
                        {[0, 1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setBalconies(num)}
                            className={`flex-1 py-1.5 rounded-lg border text-center text-xs font-bold transition-colors ${
                              balconies === num
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Areas: Built-up & Carpet Area */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Super Built-up Area (Sq. Ft.)
                      </label>
                      <input
                        type="number"
                        value={builtUpAreaSqFt}
                        onChange={(e) => setBuiltUpAreaSqFt(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Carpet Area (Sq. Ft.)
                      </label>
                      <input
                        type="number"
                        value={carpetAreaSqFt}
                        onChange={(e) => setCarpetAreaSqFt(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  {/* Penthouse Specific: Sky Terrace */}
                  {propertyType === 'Penthouse' && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Private Sky Terrace / Deck Area (Sq. Ft.)
                      </label>
                      <input
                        type="number"
                        value={skyTerraceAreaSqFt}
                        onChange={(e) => setSkyTerraceAreaSqFt(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                  )}

                  {/* Floor and Total Floors */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Floor No.
                      </label>
                      <input
                        type="number"
                        value={floorNumber}
                        onChange={(e) => setFloorNumber(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Total Floors
                      </label>
                      <input
                        type="number"
                        value={totalFloors}
                        onChange={(e) => setTotalFloors(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  {/* Facing & Parking */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Facing
                      </label>
                      <input
                        type="text"
                        value={facing}
                        onChange={(e) => setFacing(e.target.value)}
                        placeholder="e.g. East (Vastu)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Parking
                      </label>
                      <input
                        type="text"
                        value={parking}
                        onChange={(e) => setParking(e.target.value)}
                        placeholder="e.g. 1 Covered Car"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  {/* Ready to Move */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-xs font-bold text-slate-700">
                      Ready to Move In (Immediate Possession)
                    </span>
                    <button
                      type="button"
                      onClick={() => setReadyToMove(!readyToMove)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${readyToMove ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${readyToMove ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* Furnishing Status */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Furnishing
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Unfurnished', 'Semi-Furnished', 'Fully Furnished'] as const).map((furn) => (
                        <button
                          key={furn}
                          type="button"
                          onClick={() => setFurnishing(furn)}
                          className={`py-2 rounded-xl border text-center text-xs font-bold transition-colors ${
                            furnishing === furn
                              ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          {furn}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* HOUSE / VILLA */}
              {(propertyType === 'Villa' || propertyType === 'Independent House') && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Bedrooms (from 0)
                    </label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setVillaBedrooms(val)}
                          className={`flex-1 py-2 rounded-xl border text-center font-bold text-xs ${
                            villaBedrooms === val
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          {val === 0 ? 'Studio' : `${val} BHK`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Bathrooms (from 0)
                    </label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setVillaBathrooms(val)}
                          className={`flex-1 py-2 rounded-xl border text-center font-bold text-xs ${
                            villaBathrooms === val
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Plot Area (Sq. Yards)
                      </label>
                      <input
                        type="number"
                        value={villaPlotArea}
                        onChange={(e) => setVillaPlotArea(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Built-Up Area (Sq. Ft.)
                      </label>
                      <input
                        type="number"
                        value={villaBuiltUpArea}
                        onChange={(e) => setVillaBuiltUpArea(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Elevation / Structure
                      </label>
                      <select
                        value={villaFloors}
                        onChange={(e) => setVillaFloors(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      >
                        <option value="Ground Floor Only">Ground Floor Only</option>
                        <option value="G+1 (Duplex)">G+1 (Duplex)</option>
                        <option value="G+2 (Triplex)">G+2 (Triplex)</option>
                        <option value="G+3 (Multi-Storey)">G+3 (Multi-Storey)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Parking Spaces
                      </label>
                      <input
                        type="text"
                        value={villaParking}
                        onChange={(e) => setVillaParking(e.target.value)}
                        placeholder="e.g. 2 Covered Cars"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-xs font-bold text-slate-700">
                      Private Garden & Landscaped Lawn Available
                    </span>
                    <button
                      type="button"
                      onClick={() => setHasPrivateGarden(!hasPrivateGarden)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${hasPrivateGarden ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${hasPrivateGarden ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* OPEN PLOT & LAND PLOT */}
              {(propertyType === 'Open Plot' || propertyType === 'Plot') && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Plot Area
                      </label>
                      <input
                        type="number"
                        value={plotArea}
                        onChange={(e) => setPlotArea(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Unit
                      </label>
                      <select
                        value={plotUnit}
                        onChange={(e) => setPlotUnit(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      >
                        <option value="Sq. Yards">Sq. Yards (Gaj)</option>
                        <option value="Sq. Feet">Sq. Feet</option>
                        <option value="Gunthas">Gunthas</option>
                        <option value="Cents">Cents</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Length (Ft)
                      </label>
                      <input
                        type="number"
                        value={plotLength}
                        onChange={(e) => setPlotLength(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Width / Frontage (Ft)
                      </label>
                      <input
                        type="number"
                        value={plotWidth}
                        onChange={(e) => setPlotWidth(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Facing
                      </label>
                      <input
                        type="text"
                        value={plotFacing}
                        onChange={(e) => setPlotFacing(e.target.value)}
                        placeholder="e.g. North-East Corner"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Abutting Road Width (Ft)
                      </label>
                      <input
                        type="number"
                        value={roadWidthFt}
                        onChange={(e) => setRoadWidthFt(Number(e.target.value))}
                        placeholder="40"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Plot Number
                      </label>
                      <input
                        type="text"
                        value={plotNumber}
                        onChange={(e) => setPlotNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Survey Number
                      </label>
                      <input
                        type="text"
                        value={plotSurveyNumber}
                        onChange={(e) => setPlotSurveyNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  {/* Fencing Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-xs font-bold text-slate-700">
                      Perimeter Boundary Fenced
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPlotFenced(!isPlotFenced)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${isPlotFenced ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${isPlotFenced ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* Drainage Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-xs font-bold text-slate-700">
                      Underground Drainage & Water Lines Laid
                    </span>
                    <button
                      type="button"
                      onClick={() => setHasUndergroundDrainage(!hasUndergroundDrainage)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${hasUndergroundDrainage ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${hasUndergroundDrainage ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* COMMERCIAL (OFFICE / SHOP / SHOWROOM) */}
              {(propertyType === 'Commercial' || propertyType === 'Office' || propertyType === 'Shop') && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Property Usage Type
                    </label>
                    <input
                      type="text"
                      value={commercialUsage}
                      onChange={(e) => setCommercialUsage(e.target.value)}
                      placeholder="e.g. Grade-A Corporate Office, Retail Showroom"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Super Area (Sq. Ft.)
                      </label>
                      <input
                        type="number"
                        value={commercialSuperArea}
                        onChange={(e) => setCommercialSuperArea(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Carpet Area (Sq. Ft.)
                      </label>
                      <input
                        type="number"
                        value={commercialCarpetArea}
                        onChange={(e) => setCommercialCarpetArea(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Floor Number
                      </label>
                      <input
                        type="number"
                        value={commercialFloor}
                        onChange={(e) => setCommercialFloor(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Total Floors in Tower
                      </label>
                      <input
                        type="number"
                        value={commercialTotalFloors}
                        onChange={(e) => setCommercialTotalFloors(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Power Backup / DG
                      </label>
                      <input
                        type="text"
                        value={commercialPower}
                        onChange={(e) => setCommercialPower(e.target.value)}
                        placeholder="e.g. 100% DG Backup"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Dedicated Parking
                      </label>
                      <input
                        type="text"
                        value={commercialParking}
                        onChange={(e) => setCommercialParking(e.target.value)}
                        placeholder="e.g. 6 Cars & 12 Bikes"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Washrooms
                    </label>
                    <input
                      type="number"
                      value={commercialWashrooms}
                      onChange={(e) => setCommercialWashrooms(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-xs font-bold text-slate-700">
                      Wet Pantry & Cafeteria Space Ready
                    </span>
                    <button
                      type="button"
                      onClick={() => setHasPantry(!hasPantry)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${hasPantry ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${hasPantry ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* INDUSTRIAL & WAREHOUSE */}
              {(propertyType === 'Warehouse' || propertyType === 'Industrial') && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Total Shed / Plot Area (Sq. Ft.)
                      </label>
                      <input
                        type="number"
                        value={warehouseAreaSqFt}
                        onChange={(e) => setWarehouseAreaSqFt(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Clear Height Clearance (Ft)
                      </label>
                      <input
                        type="number"
                        value={warehouseCeilingHeight}
                        onChange={(e) => setWarehouseCeilingHeight(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Loading Docks / Bays
                      </label>
                      <input
                        type="number"
                        value={warehouseDockDoors}
                        onChange={(e) => setWarehouseDockDoors(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Road Width for 40ft Trailers
                      </label>
                      <input
                        type="number"
                        value={trailerAccessRoadFt}
                        onChange={(e) => setTrailerAccessRoadFt(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Flooring Type
                    </label>
                    <input
                      type="text"
                      value={warehouseFlooring}
                      onChange={(e) => setWarehouseFlooring(e.target.value)}
                      placeholder="e.g. Heavy Duty Laser Screed VDF (5 Ton/m²)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Power Load Capacity
                    </label>
                    <input
                      type="text"
                      value={warehousePowerLoad}
                      onChange={(e) => setWarehousePowerLoad(e.target.value)}
                      placeholder="e.g. 100 kVA 3-Phase HT"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-xs font-bold text-slate-700">
                      Fire NOC & Hydrant Sprinkler System Approved
                    </span>
                    <button
                      type="button"
                      onClick={() => setHasFireNoc(!hasFireNoc)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${hasFireNoc ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${hasFireNoc ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* AGRICULTURAL LAND */}
              {propertyType === 'Agricultural Land' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Acres
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={landAcres}
                        onChange={(e) => setLandAcres(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Gunthas (0-39)
                      </label>
                      <input
                        type="number"
                        value={landGunthas}
                        onChange={(e) => setLandGunthas(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Survey / Sub-Division No.
                      </label>
                      <input
                        type="text"
                        value={agriSurveyNumber}
                        onChange={(e) => setAgriSurveyNumber(e.target.value)}
                        placeholder="e.g. Sy. No. 245/1"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                        Soil / Land Type
                      </label>
                      <select
                        value={soilType}
                        onChange={(e) => setSoilType(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                      >
                        <option value="Red Soil">Red Soil (Fertile / Agro)</option>
                        <option value="Black Cotton">Black Cotton Soil</option>
                        <option value="Alluvial / Loam">Alluvial / Riverbed Loam</option>
                        <option value="Mixed / Gravel">Mixed / Gravel</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Water Sources Available
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Borewell with Submersible Pump', 'Canal Water', 'Drip Irrigation Network', 'Farm Pond / Water Tank'].map((src) => {
                        const isSelected = waterSources.includes(src);
                        return (
                          <button
                            key={src}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setWaterSources(waterSources.filter((s) => s !== src));
                              } else {
                                setWaterSources([...waterSources, src]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-slate-200 text-slate-600'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '} {src}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Road Connectivity
                    </label>
                    <select
                      value={roadAccess}
                      onChange={(e) => setRoadAccess(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                    >
                      <option value="40ft Tar / Blacktop Road">40ft Tar / Blacktop Road</option>
                      <option value="Concrete CC Road">Concrete CC Road</option>
                      <option value="Farm Approach Road">Farm Approach Road (Gravel/Morrum)</option>
                    </select>
                  </div>

                  {/* Fencing Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-xs font-bold text-slate-700">
                      Perimeter Solar / Barbed Wire Fencing
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAgriFenced(!isAgriFenced)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${isAgriFenced ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${isAgriFenced ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* Passbook / Bhu Bharati Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-xs font-bold text-slate-700">
                      Pattadar Passbook / Bhu Bharati Record Verified
                    </span>
                    <button
                      type="button"
                      onClick={() => setHasPassbook(!hasPassbook)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${hasPassbook ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${hasPassbook ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* Land Boundary Surveyor HUD connection */}
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Cadastral Boundary Polygon</span>
                      </div>
                      <div className="text-[11px] text-emerald-700 mt-0.5">
                        {drawnLandBorders && drawnLandBorders.length >= 3
                          ? `✓ ${drawnLandBorders.length} vertices captured (${landAcres} Acres synced)`
                          : 'Draw exact farm vertices on live satellite map'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {drawnLandBorders && drawnLandBorders.length >= 3 && onClearLandBorders && (
                        <button
                          type="button"
                          onClick={onClearLandBorders}
                          className="px-2.5 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold"
                        >
                          Clear
                        </button>
                      )}
                      {onStartDrawLandBorders && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onStartDrawLandBorders();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                        >
                          {drawnLandBorders && drawnLandBorders.length >= 3 ? 'Redraw Parcel' : 'Draw Boundary'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: PROPERTY LOCATION & MAP ANCHOR */}
          {!isQuickListMode && currentStep === 6 && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                  6. Property Location & Map Anchor
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pinpoint your exact parcel on the live satellite map for high buyer trust.
                </p>
              </div>

              {/* Map Anchor Pin Card */}
              <div className="p-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">
                      {selectedLocation ? '📍 Precise Map Location Pinned' : 'Pinpoint on Live Map'}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedLocation
                        ? `Lat: ${selectedLocation.coordinates[1].toFixed(5)}, Lng: ${selectedLocation.coordinates[0].toFixed(5)}`
                        : 'Click to drop a pin on the interactive satellite or standard map.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartDropPin();
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{selectedLocation ? 'Reposition Pin' : 'Drop Pin on Map'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Locality / Area *
                  </label>
                  <input
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g. Gachibowli, Kokapet"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Hyderabad"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Ranga Reddy"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="e.g. Telangana"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="500032"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Project / Society Name
                  </label>
                  <input
                    type="text"
                    value={projectOrSociety}
                    onChange={(e) => setProjectOrSociety(e.target.value)}
                    placeholder="e.g. Aparna Sarovar Zenith"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Street Address / House No.
                  </label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="e.g. Near Financial District Junction"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: PRICE DETAILS & CHARGES */}
          {!isQuickListMode && currentStep === 7 && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                  7. Price & Financial Terms
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set transparent pricing and security deposit terms.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  {purpose === 'sale' ? 'Expected Selling Price (₹) *' : 'Monthly Rent (₹) *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-base font-bold focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs font-bold text-blue-600">
                  <span>In Words: {formatIndianCurrency(price, purpose)}</span>
                  <span>{purpose === 'sale' ? 'All-inclusive ask' : 'Per month'}</span>
                </div>
              </div>

              {purpose !== 'sale' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Security Deposit (₹)
                    </label>
                    <input
                      type="number"
                      value={securityDeposit}
                      onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Monthly Maintenance (₹)
                    </label>
                    <input
                      type="number"
                      value={maintenanceMonthly}
                      onChange={(e) => setMaintenanceMonthly(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                    />
                  </div>
                </div>
              )}

              {purpose === 'lease' && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Total Lease Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={leaseAmount}
                    onChange={(e) => setLeaseAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Brokerage Fee
                  </label>
                  <select
                    value={brokerage}
                    onChange={(e) => setBrokerage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                  >
                    <option value="Zero Brokerage (Direct)">Zero Brokerage (Direct)</option>
                    <option value="1 Month Rent">1 Month Rent</option>
                    <option value="2% Brokerage">2% Standard Brokerage</option>
                    <option value="Fixed Convenience Fee">Fixed Convenience Fee</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Price Negotiable?
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsNegotiable(true)}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-colors ${
                        isNegotiable
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      Yes (Negotiable)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsNegotiable(false)}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-colors ${
                        !isNegotiable
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      Fixed Price
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: AMENITIES AND FACILITIES (CATEGORY-SPECIFIC) */}
          {!isQuickListMode && currentStep === 8 && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                  8. Amenities & Facilities
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select available features to highlight in property filters.
                </p>
              </div>

              {/* Amenity Chips */}
              <div className="flex flex-wrap gap-2">
                {(propertyType === 'Agricultural Land'
                  ? AGRICULTURAL_AMENITIES
                  : propertyType === 'Warehouse' || propertyType === 'Industrial'
                    ? INDUSTRIAL_AMENITIES
                    : propertyType === 'Open Plot' || propertyType === 'Plot'
                      ? PLOT_AMENITIES
                      : propertyType === 'Commercial' || propertyType === 'Office' || propertyType === 'Shop'
                        ? COMMERCIAL_AMENITIES
                        : RESIDENTIAL_AMENITIES
                ).map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600/30'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <span className="w-3.5 h-3.5 text-slate-400">+</span>}
                      <span>{amenity}</span>
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Amenity */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={customAmenityInput}
                  onChange={(e) => setCustomAmenityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomAmenity();
                    }
                  }}
                  placeholder="Add custom facility (e.g. Private Terrace, EV Point)..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-semibold focus:border-blue-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomAmenity}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:opacity-90"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* STEP 9: PHOTOS & AI DESCRIPTION */}
          {!isQuickListMode && currentStep === 9 && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900">
                    9. Photos & Description
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    High quality visuals and clear descriptions attract 4x more buyer inquiries.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoGenerateAI}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>AI Regenerate</span>
                </button>
              </div>

              {/* Title Input */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Property Title *
                </label>
                <input
                  type="text"
                  value={propertyTitle}
                  onChange={(e) => setPropertyTitle(e.target.value)}
                  placeholder="e.g. 3 BHK Luxury Flat in Gachibowli"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Property Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed overview of property, highlights, floor layout and connectivity..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium focus:border-blue-600 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Photos Grid */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  Photo Gallery ({photoUrls.length} Photos)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {photoUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group">
                      <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoUrls(photoUrls.filter((_, i) => i !== idx))}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const demoImgs = [
                        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80'
                      ];
                      const next = demoImgs[photoUrls.length % demoImgs.length];
                      setPhotoUrls([...photoUrls, next]);
                    }}
                    className="aspect-video rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 hover:border-blue-500 transition-colors"
                  >
                    <UploadCloud className="w-5 h-5 mb-1" />
                    <span className="text-[11px] font-bold">+ Add Photo</span>
                  </button>
                </div>
              </div>

              {/* Video Tour & Floor Plan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    YouTube / Walkthrough Video URL
                  </label>
                  <input
                    type="url"
                    value={videoTourUrl}
                    onChange={(e) => setVideoTourUrl(e.target.value)}
                    placeholder="https://youtu.be/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Floor Plan Image / PDF Link
                  </label>
                  <input
                    type="url"
                    value={floorPlanUrl}
                    onChange={(e) => setFloorPlanUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Landmarks */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Nearby Landmarks
                </label>
                <input
                  type="text"
                  value={nearbyLandmarks}
                  onChange={(e) => setNearbyLandmarks(e.target.value)}
                  placeholder="e.g. Wipro Circle (1.2 km), Outer Ring Road Exit 1 (2.5 km)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-semibold"
                />
              </div>
            </div>
          )}

          {/* STEP 10: OWNERSHIP & LEGAL DOCUMENTS */}
          {!isQuickListMode && currentStep === 10 && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                  10. Ownership & Document Due Diligence
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clear legal paperwork ensures instant verification and buyer trust.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Registered Owner Name *
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Ownership Type
                  </label>
                  <select
                    value={ownershipType}
                    onChange={(e) => setOwnershipType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                  >
                    <option value="Individual (Freehold)">Individual (Freehold)</option>
                    <option value="Joint Ownership">Joint Ownership</option>
                    <option value="Power of Attorney (POA)">Power of Attorney (POA)</option>
                    <option value="Company / Trust Owned">Company / Trust Owned</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Title Deed Status
                  </label>
                  <select
                    value={titleDeedType}
                    onChange={(e) => setTitleDeedType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                  >
                    <option value="Original Registered Sale Deed">Original Registered Sale Deed</option>
                    <option value="Registered Gift / Partition Deed">Registered Gift / Partition Deed</option>
                    <option value="Pattadar Passbook / Bhu-Bharati ROR">Pattadar Passbook / Bhu-Bharati ROR</option>
                    <option value="Allotment Letter from Builder">Allotment Letter from Builder</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    RERA Registration Number
                  </label>
                  <input
                    type="text"
                    value={reraId}
                    onChange={(e) => setReraId(e.target.value)}
                    placeholder="e.g. P02400001234"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Approval Authority / Layout Permission
                </label>
                <input
                  type="text"
                  value={approvalAuthority}
                  onChange={(e) => setApprovalAuthority(e.target.value)}
                  placeholder="e.g. HMDA / GHMC / DTCP / BDA / BBMP Approved"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-xs font-bold text-slate-700">
                  Encumbrance Certificate (EC) 30-Year Search Clear
                </span>
                <button
                  type="button"
                  onClick={() => setHasEncumbranceCertificate(!hasEncumbranceCertificate)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${hasEncumbranceCertificate ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${hasEncumbranceCertificate ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="text-xs text-slate-700">
                  <span className="font-bold">Automated Due-Diligence:</span> Once submitted, your RERA number and survey boundaries are cross-verified against state land records.
                </div>
              </div>
            </div>
          )}

          {/* STEP 11: CONTACT VERIFICATION */}
          {!isQuickListMode && currentStep === 11 && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                  11. Contact Verification
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify your phone number with a 1-click OTP to prevent spam.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={contactPersonName}
                    onChange={(e) => setContactPersonName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Mobile Number for Buyer Calls *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={contactMobileNumber}
                      onChange={(e) => setContactMobileNumber(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                    />
                    {!isPhoneVerified ? (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                      >
                        {otpSent ? 'Resend OTP' : 'Send OTP'}
                      </button>
                    ) : (
                      <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                {otpSent && !isPhoneVerified && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter 4-digit OTP (4829)"
                      className="w-36 px-3 py-2 rounded-lg border border-slate-300 bg-white text-center text-sm font-bold tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                    >
                      Verify
                    </button>
                  </div>
                )}

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSameWhatsApp}
                      onChange={(e) => setIsSameWhatsApp(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      WhatsApp number is same as calling mobile number
                    </span>
                  </label>
                  {!isSameWhatsApp && (
                    <input
                      type="tel"
                      value={customWhatsApp}
                      onChange={(e) => setCustomWhatsApp(e.target.value)}
                      placeholder="WhatsApp Mobile Number"
                      className="mt-2 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 12: REVIEW & SUBMIT WITH OPTIONAL SPOTLIGHT BOOST */}
          {!isQuickListMode && currentStep === 12 && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                  12. Review & Publish Listing
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm all details before broadcasting your property live on MapEstate.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 mb-1">
                      {purpose === 'sale' ? 'For Sale' : purpose === 'rent' ? 'For Rent' : purpose} • {propertyType}
                    </span>
                    <h5 className="font-bold text-sm text-slate-900">
                      {propertyTitle || `${propertyType} in ${locality}`}
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      📍 {locality}, {city}, {stateName} - {pinCode}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-black text-blue-600">
                      {formatIndianCurrency(price, purpose)}
                    </div>
                    {isNegotiable && (
                      <span className="text-[10px] font-bold text-emerald-600">Negotiable</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Configuration</span>
                    <span className="font-bold text-slate-800">
                      {propertyType === 'Apartment' || propertyType === 'Penthouse'
                        ? `${bhk} BHK • ${bathrooms} Baths`
                        : propertyType === 'Open Plot' || propertyType === 'Plot'
                          ? `${plotArea} Sq.Yds`
                          : propertyType === 'Warehouse' || propertyType === 'Industrial'
                            ? `${warehouseCeilingHeight}ft Height`
                            : `${propertyType}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Area</span>
                    <span className="font-bold text-slate-800">
                      {propertyType === 'Agricultural Land' ? `${landAcres} Acres` : `${builtUpAreaSqFt || warehouseAreaSqFt} Sq.Ft`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Verification</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> OTP Verified
                    </span>
                  </div>
                </div>

                {selectedAmenities.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Key Amenities ({selectedAmenities.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedAmenities.slice(0, 5).map((am, i) => (
                        <span key={i} className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700">
                          {am}
                        </span>
                      ))}
                      {selectedAmenities.length > 5 && (
                        <span className="text-[10px] font-semibold text-slate-400 self-center">
                          +{selectedAmenities.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SPOTLIGHT BOOST UPSELL CARD (RAZORPAY MONETIZATION) */}
              <div className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                enableSpotlightBoost
                  ? 'border-amber-400 bg-amber-50/50 shadow-md ring-2 ring-amber-400/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
                onClick={() => setEnableSpotlightBoost(!enableSpotlightBoost)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center font-black flex-shrink-0 shadow-xs">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">
                          Upgrade to Golden Spotlight Boost (30 Days)
                        </span>
                        <span className="text-[10px] font-black uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full">
                          10x Leads
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Get a glowing gold pin on Google Satellite Map, rank #1 in locality search results, and receive instant WhatsApp buyer alerts.
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-black text-amber-700">₹999</div>
                    <div className="text-[10px] text-slate-400 line-through">₹1,999</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-600 flex items-center gap-1.5 font-bold">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pay ₹999 securely via Razorpay upon clicking submit</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={enableSpotlightBoost}
                    onChange={(e) => setEnableSpotlightBoost(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="font-bold text-blue-600 hover:underline"
                >
                  ← Edit Information
                </button>
                <span>Draft auto-saved locally</span>
              </div>
            </div>
          )}
        </div>

        {/* ================= STICKY FOOTER NAVIGATION ================= */}
        <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-shrink-0">
          {/* Back Button */}
          {isQuickListMode ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 min-h-[44px]"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[44px] ${
                currentStep === 1
                  ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          {/* Stepper Dots (Desktop) */}
          {!isQuickListMode && (
            <div className="hidden sm:flex items-center gap-1">
              {STEPS.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(step.id)}
                  title={`${step.id}. ${step.title}`}
                  className={`h-1.5 rounded-full transition-all ${
                    step.id === currentStep
                      ? 'w-6 bg-blue-600'
                      : step.id < currentStep
                        ? 'w-2 bg-blue-300'
                        : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Next / Submit Button */}
          <button
            type="button"
            onClick={isQuickListMode || currentStep === 12 ? handlePublishListing : handleNextStep}
            disabled={isPublishing}
            className={`px-6 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors min-h-[44px] ${
              enableSpotlightBoost && currentStep === 12
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Broadcasting Listing...</span>
              </>
            ) : isQuickListMode || currentStep === 12 ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  {enableSpotlightBoost
                    ? razorpayService.getSpotlightCredits() > 0
                      ? 'Use 1 Spotlight Credit & Publish'
                      : 'Pay ₹999 & Publish Live'
                    : 'Publish Property Live'}
                </span>
              </>
            ) : (
              <>
                <span>Next: {STEPS[currentStep]?.title || 'Continue'}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
