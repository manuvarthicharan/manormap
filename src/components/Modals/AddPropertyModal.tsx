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
  Briefcase,
  Landmark,
  ShieldCheck,
  Phone,
  Mail,
  User,
  FileText,
  Camera,
  Video,
  Layers,
  DollarSign,
  CheckCircle2,
  Save,
  RotateCcw
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

const LOCAL_STORAGE_DRAFT_KEY = 'manormap_listing_draft_v2';

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
  'Conference & Meeting Rooms'
];

const MILESTONES = [
  { num: 1, label: 'Role & Location', sub: 'Identity, Category & Map Pin' },
  { num: 2, label: 'Specs & Amenities', sub: 'Dimensions, Layout & Features' },
  { num: 3, label: 'Pricing & Media', sub: 'Price, Photos & AI Description' },
  { num: 4, label: 'Legal & Submit', sub: 'RERA, Bhu-dhaar & Review' }
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
  // Stepper state: 1 to 4 milestones
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isQuickListMode, setIsQuickListMode] = useState<boolean>(false);
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [draftToast, setDraftToast] = useState<string>('');
  const [autoSavedTimestamp, setAutoSavedTimestamp] = useState<string>('');

  // 1. User Details
  const [userRole, setUserRole] = useState<'Owner' | 'Agent' | 'Builder' | 'Company'>('Owner');
  const [fullName, setFullName] = useState('Keerthi Charan');
  const [userPhone, setUserPhone] = useState('+91 98490 12345');
  const [userEmail, setUserEmail] = useState('charan@manormap.in');

  // 2. Listing Purpose
  const [purpose, setPurpose] = useState<ListingType>('sale');

  // 3. Select Property Category
  const [categoryGroup, setCategoryGroup] = useState<'Residential' | 'Commercial' | 'Agricultural' | 'Industrial' | 'Other'>('Residential');

  // 4. Select Property Type
  const [propertyType, setPropertyType] = useState<PropertyCategory>('Apartment');

  // 5. Property Details (dynamic by property type)
  // Apartment specifics
  const [bhk, setBhk] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [balconies, setBalconies] = useState<number>(1);
  const [floorNumber, setFloorNumber] = useState<number>(5);
  const [totalFloors, setTotalFloors] = useState<number>(14);
  const [furnishing, setFurnishing] = useState<'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished'>('Semi-Furnished');
  const [carpetAreaSqFt, setCarpetAreaSqFt] = useState<number>(1450);
  const [builtUpAreaSqFt, setBuiltUpAreaSqFt] = useState<number>(1800);
  const [facing, setFacing] = useState('East (Vastu Compliant)');
  const [parking, setParking] = useState('1 Covered');
  const [readyToMove, setReadyToMove] = useState(true);

  // House / Villa specifics
  const [villaBedrooms, setVillaBedrooms] = useState<number>(3);
  const [villaBathrooms, setVillaBathrooms] = useState<number>(3);
  const [villaFloors, setVillaFloors] = useState<string>('G+1 (Duplex)');
  const [villaPlotArea, setVillaPlotArea] = useState<number>(200); // sq yds
  const [villaBuiltUpArea, setVillaBuiltUpArea] = useState<number>(2500); // sq ft
  const [villaParking, setVillaParking] = useState<string>('1 Covered Car');

  // Open Plot specifics
  const [plotArea, setPlotArea] = useState<number>(300); // sq.yds
  const [plotUnit, setPlotUnit] = useState<'Sq. Yards' | 'Sq. Feet' | 'Cents' | 'Gunthas'>('Sq. Yards');
  const [plotLength, setPlotLength] = useState<number>(60);
  const [plotWidth, setPlotWidth] = useState<number>(45);
  const [plotFacing, setPlotFacing] = useState('North-East Corner');
  const [roadWidthFt, setRoadWidthFt] = useState<number>(40);
  const [plotNumber, setPlotNumber] = useState('Plot No. 42');
  const [plotSurveyNumber, setPlotSurveyNumber] = useState('Sy. No. 128/A');
  const [isPlotFenced, setIsPlotFenced] = useState(true);

  // Commercial specifics
  const [commercialUsage, setCommercialUsage] = useState<string>('Grade-A Corporate Office');
  const [commercialSuperArea, setCommercialSuperArea] = useState<number>(4500);
  const [commercialCarpetArea, setCommercialCarpetArea] = useState<number>(3800);
  const [commercialFloor, setCommercialFloor] = useState<number>(4);
  const [commercialTotalFloors, setCommercialTotalFloors] = useState<number>(12);
  const [commercialParking, setCommercialParking] = useState<string>('6 Dedicated 4-Wheelers & 12 Bikes');
  const [commercialPower, setCommercialPower] = useState<string>('3-Phase 50kVA with 100% DG Backup');
  const [commercialWashrooms, setCommercialWashrooms] = useState<number>(4);

  // Agricultural Land specifics
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

  // 6. Property Location
  const [country, setCountry] = useState('India');
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

  // 8. Amenities & Facilities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    '24x7 Security & CCTV',
    '100% Power Backup',
    'Covered Car Parking',
    'Equipped Gymnasium',
    'Clubhouse & Banquet Hall'
  ]);
  const [customAmenityInput, setCustomAmenityInput] = useState('');

  // 9. Photos & Description
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
  ]);
  const [currentUrlInput, setCurrentUrlInput] = useState('');
  const [urlInputError, setUrlInputError] = useState('');
  const [videoTourUrl, setVideoTourUrl] = useState('');
  const [floorPlanUrl, setFloorPlanUrl] = useState('');
  const [propertyTitle, setPropertyTitle] = useState('');
  const [description, setDescription] = useState('');
  const [nearbyLandmarks, setNearbyLandmarks] = useState('5 mins to Financial District, 10 mins to Outer Ring Road Exit 1, walking distance to DPS');

  // 10. Ownership & Documents
  const [ownerName, setOwnerName] = useState('Keerthi Charan');
  const [ownershipType, setOwnershipType] = useState<'Individual' | 'Joint' | 'Freehold' | 'Leasehold' | 'Power of Attorney (POA)'>('Individual');
  const [proofChecklist, setProofChecklist] = useState<string[]>([
    'Registered Sale Deed / Title Deed',
    'Pattadar Passbook / Khata',
    'Property Tax Receipts'
  ]);
  const [reraId, setReraId] = useState('P02400008921');
  const [approvalAuthority, setApprovalAuthority] = useState('HMDA Approved / RERA Registered');
  const [otherDocsInfo, setOtherDocsInfo] = useState('Clear title with non-encumbrance certificate up to date');

  // 11. Contact Verification
  const [contactPersonName, setContactPersonName] = useState('Keerthi Charan');
  const [contactMobileNumber, setContactMobileNumber] = useState('+91 98490 12345');
  const [isPhoneVerified, setIsPhoneVerified] = useState(true);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSameWhatsApp, setIsSameWhatsApp] = useState(true);
  const [customWhatsApp, setCustomWhatsApp] = useState('');

  // 12. Review & Publishing
  const [isPublishing, setIsPublishing] = useState(false);

  // Check saved draft on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
      if (savedDraft) {
        setHasDraft(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync selected location from map pin drop
  useEffect(() => {
    if (selectedLocation) {
      if (selectedLocation.area) setLocality(selectedLocation.area);
      if (selectedLocation.city) setCity(selectedLocation.city);
      if (selectedLocation.state) setStateName(selectedLocation.state);
      if (selectedLocation.pinCode) setPinCode(selectedLocation.pinCode);
      if (selectedLocation.address) setStreetAddress(selectedLocation.address);
    }
  }, [selectedLocation]);

  // Sync drawn land boundary metrics
  useEffect(() => {
    if (landMetrics) {
      setCategoryGroup('Agricultural');
      setPropertyType('Agricultural Land');
      setLandAcres(Number(landMetrics.areaAcres.toFixed(2)));
      setLandGunthas(Math.round(landMetrics.areaGunthas));
    }
  }, [landMetrics]);

  // Keep contact name & phone in sync with Step 1 by default
  useEffect(() => {
    if (fullName) setContactPersonName(fullName);
    if (userPhone) setContactMobileNumber(userPhone);
    if (fullName) setOwnerName(fullName);
  }, [fullName, userPhone]);

  // Helper to format currency in Indian Words
  const getFormattedWords = (amt: number): string => {
    if (!amt || isNaN(amt) || amt <= 0) return '₹ 0';
    if (amt >= 10000000) {
      const cr = (amt / 10000000).toFixed(2).replace(/\.00$/, '');
      return `₹ ${cr} Crore`;
    }
    if (amt >= 100000) {
      const lk = (amt / 100000).toFixed(2).replace(/\.00$/, '');
      return `₹ ${lk} Lakh`;
    }
    if (amt >= 1000) {
      return `₹ ${(amt / 1000).toFixed(1).replace(/\.0$/, '')} Thousand`;
    }
    return `₹ ${amt.toLocaleString('en-IN')}`;
  };

  // Auto-generate high converting Title & Description
  const handleAutoGenerateAI = () => {
    const locStr = `${locality || 'Prime Locality'}, ${city || 'Hyderabad'}`;
    const purposeStr = purpose === 'sale' ? 'Sale' : purpose === 'rent' ? 'Rent' : purpose === 'lease' ? 'Lease' : 'PG';

    if (propertyType === 'Apartment') {
      const bhkStr = bhk === 0 ? 'Studio / 1 RK' : `${bhk} BHK`;
      const autoTitle = `${bhkStr} Luxury ${propertyType} in ${projectOrSociety || locStr}`;
      const bathStr = bathrooms === 0 ? 'common washrooms' : `${bathrooms} bathrooms`;
      const balcStr = balconies === 0 ? 'no attached balcony' : `${balconies} balconies`;
      const autoDesc = `Spacious ${bhkStr} luxury apartment situated on floor ${floorNumber} of ${totalFloors} floors with ${builtUpAreaSqFt} sq.ft built-up area (${carpetAreaSqFt} sq.ft carpet), ${bathStr}, and ${balcStr}. Vastu compliant facing ${facing}, ${furnishing}, with ${parking} parking spaces. Located in a prime gated community with ${selectedAmenities.slice(0, 4).join(', ')}. Excellent connectivity to major IT corridors and transit.`;
      setPropertyTitle(autoTitle);
      setDescription(autoDesc);
    } else if (propertyType === 'Villa' || propertyType === 'Independent House') {
      const bedStr = villaBedrooms === 0 ? 'Studio / Open Layout' : `${villaBedrooms} BHK`;
      const autoTitle = `${bedStr} Gated ${propertyType} in ${projectOrSociety || locStr}`;
      const autoDesc = `Magnificent ${bedStr} ${propertyType} (${villaFloors}) spanning ${villaBuiltUpArea} sq.ft built-up on a prime ${villaPlotArea} sq.yds plot. Features ${villaBathrooms} bathrooms, ${villaParking}, facing ${facing}, with luxury private landscaping and world-class society amenities including ${selectedAmenities.slice(0, 4).join(', ')}.`;
      setPropertyTitle(autoTitle);
      setDescription(autoDesc);
    } else if (propertyType === 'Open Plot') {
      const autoTitle = `${plotArea} ${plotUnit} Approved Open Plot in ${locStr}`;
      const autoDesc = `Clear title ${plotArea} ${plotUnit} premium open plot with ${plotLength}x${plotWidth} dimensions facing ${plotFacing}. Abutting a wide ${roadWidthFt}ft road with ${isPlotFenced ? 'fenced boundary' : 'clear demarcation'}. Approved layout under ${approvalAuthority}. Ideal for immediate villa construction or long-term high ROI investment.`;
      setPropertyTitle(autoTitle);
      setDescription(autoDesc);
    } else if (propertyType === 'Agricultural Land') {
      const autoTitle = `${landAcres} Acres High-Yield Agricultural Land in ${locStr}`;
      const autoDesc = `Exceptional ${landAcres} Acres (${landGunthas} Gunthas) fertile ${soilType} farmland with ${roadAccess}. Abundant water available via ${waterSources.join(', ') || 'Borewell'}. ${isAgriFenced ? 'Fully fenced perimeter' : 'Demarcated borders'}, survey no. ${agriSurveyNumber}, 100% clear title with updated Pattadar Passbook. Excellent agro-farm and retreat opportunity.`;
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

  // Run auto generate initially or when title is empty
  useEffect(() => {
    if (!propertyTitle) {
      handleAutoGenerateAI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyType, purpose, bhk, locality, city]);

  // Save Draft to LocalStorage
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
      landAcres,
      landGunthas,
      agriSurveyNumber,
      waterSources,
      soilType,
      roadAccess,
      isAgriFenced,
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
      photoUrls,
      videoTourUrl,
      floorPlanUrl,
      propertyTitle,
      description,
      nearbyLandmarks,
      ownerName,
      ownershipType,
      proofChecklist,
      reraId,
      approvalAuthority,
      otherDocsInfo,
      contactPersonName,
      contactMobileNumber,
      isPhoneVerified,
      isSameWhatsApp,
      customWhatsApp,
      timestamp: new Date().toLocaleString()
    };

    localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(draftData));
    setHasDraft(true);
    setDraftToast('Draft saved successfully! You can resume anytime.');
    setTimeout(() => setDraftToast(''), 3500);
  };

  // Restore Draft
  const handleResumeDraft = () => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.currentStep) setCurrentStep(d.currentStep);
      if (d.userRole) setUserRole(d.userRole);
      if (d.fullName) setFullName(d.fullName);
      if (d.userPhone) setUserPhone(d.userPhone);
      if (d.userEmail) setUserEmail(d.userEmail);
      if (d.purpose) setPurpose(d.purpose);
      if (d.categoryGroup) setCategoryGroup(d.categoryGroup);
      if (d.propertyType) setPropertyType(d.propertyType);
      if (d.bhk !== undefined) setBhk(d.bhk);
      if (d.bathrooms !== undefined) setBathrooms(d.bathrooms);
      if (d.balconies !== undefined) setBalconies(d.balconies);
      if (d.floorNumber !== undefined) setFloorNumber(d.floorNumber);
      if (d.totalFloors !== undefined) setTotalFloors(d.totalFloors);
      if (d.furnishing) setFurnishing(d.furnishing);
      if (d.carpetAreaSqFt !== undefined) setCarpetAreaSqFt(d.carpetAreaSqFt);
      if (d.builtUpAreaSqFt !== undefined) setBuiltUpAreaSqFt(d.builtUpAreaSqFt);
      if (d.facing) setFacing(d.facing);
      if (d.parking) setParking(d.parking);
      if (d.readyToMove !== undefined) setReadyToMove(d.readyToMove);
      if (d.villaBedrooms !== undefined) setVillaBedrooms(d.villaBedrooms);
      if (d.villaBathrooms !== undefined) setVillaBathrooms(d.villaBathrooms);
      if (d.villaFloors) setVillaFloors(d.villaFloors);
      if (d.villaPlotArea !== undefined) setVillaPlotArea(d.villaPlotArea);
      if (d.villaBuiltUpArea !== undefined) setVillaBuiltUpArea(d.villaBuiltUpArea);
      if (d.villaParking) setVillaParking(d.villaParking);
      if (d.plotArea !== undefined) setPlotArea(d.plotArea);
      if (d.plotUnit) setPlotUnit(d.plotUnit);
      if (d.plotLength !== undefined) setPlotLength(d.plotLength);
      if (d.plotWidth !== undefined) setPlotWidth(d.plotWidth);
      if (d.plotFacing) setPlotFacing(d.plotFacing);
      if (d.roadWidthFt !== undefined) setRoadWidthFt(d.roadWidthFt);
      if (d.plotNumber) setPlotNumber(d.plotNumber);
      if (d.plotSurveyNumber) setPlotSurveyNumber(d.plotSurveyNumber);
      if (d.isPlotFenced !== undefined) setIsPlotFenced(d.isPlotFenced);
      if (d.commercialUsage) setCommercialUsage(d.commercialUsage);
      if (d.commercialSuperArea !== undefined) setCommercialSuperArea(d.commercialSuperArea);
      if (d.commercialCarpetArea !== undefined) setCommercialCarpetArea(d.commercialCarpetArea);
      if (d.commercialFloor !== undefined) setCommercialFloor(d.commercialFloor);
      if (d.commercialTotalFloors !== undefined) setCommercialTotalFloors(d.commercialTotalFloors);
      if (d.commercialParking) setCommercialParking(d.commercialParking);
      if (d.commercialPower) setCommercialPower(d.commercialPower);
      if (d.commercialWashrooms !== undefined) setCommercialWashrooms(d.commercialWashrooms);
      if (d.landAcres !== undefined) setLandAcres(d.landAcres);
      if (d.landGunthas !== undefined) setLandGunthas(d.landGunthas);
      if (d.agriSurveyNumber) setAgriSurveyNumber(d.agriSurveyNumber);
      if (d.waterSources) setWaterSources(d.waterSources);
      if (d.soilType) setSoilType(d.soilType);
      if (d.roadAccess) setRoadAccess(d.roadAccess);
      if (d.isAgriFenced !== undefined) setIsAgriFenced(d.isAgriFenced);
      if (d.stateName) setStateName(d.stateName);
      if (d.district) setDistrict(d.district);
      if (d.city) setCity(d.city);
      if (d.locality) setLocality(d.locality);
      if (d.streetAddress) setStreetAddress(d.streetAddress);
      if (d.projectOrSociety) setProjectOrSociety(d.projectOrSociety);
      if (d.pinCode) setPinCode(d.pinCode);
      if (d.price !== undefined) setPrice(d.price);
      if (d.securityDeposit !== undefined) setSecurityDeposit(d.securityDeposit);
      if (d.leaseAmount !== undefined) setLeaseAmount(d.leaseAmount);
      if (d.maintenanceMonthly !== undefined) setMaintenanceMonthly(d.maintenanceMonthly);
      if (d.brokerage) setBrokerage(d.brokerage);
      if (d.isNegotiable !== undefined) setIsNegotiable(d.isNegotiable);
      if (d.selectedAmenities) setSelectedAmenities(d.selectedAmenities);
      if (d.photoUrls) setPhotoUrls(d.photoUrls);
      if (d.videoTourUrl !== undefined) setVideoTourUrl(d.videoTourUrl);
      if (d.floorPlanUrl !== undefined) setFloorPlanUrl(d.floorPlanUrl);
      if (d.propertyTitle) setPropertyTitle(d.propertyTitle);
      if (d.description) setDescription(d.description);
      if (d.nearbyLandmarks) setNearbyLandmarks(d.nearbyLandmarks);
      if (d.ownerName) setOwnerName(d.ownerName);
      if (d.ownershipType) setOwnershipType(d.ownershipType);
      if (d.proofChecklist) setProofChecklist(d.proofChecklist);
      if (d.reraId) setReraId(d.reraId);
      if (d.approvalAuthority) setApprovalAuthority(d.approvalAuthority);
      if (d.otherDocsInfo) setOtherDocsInfo(d.otherDocsInfo);
      if (d.contactPersonName) setContactPersonName(d.contactPersonName);
      if (d.contactMobileNumber) setContactMobileNumber(d.contactMobileNumber);
      if (d.isPhoneVerified !== undefined) setIsPhoneVerified(d.isPhoneVerified);
      if (d.isSameWhatsApp !== undefined) setIsSameWhatsApp(d.isSameWhatsApp);
      if (d.customWhatsApp !== undefined) setCustomWhatsApp(d.customWhatsApp);

      setDraftToast('Draft resumed successfully!');
      setTimeout(() => setDraftToast(''), 3000);
    } catch {
      // ignore
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
    setHasDraft(false);
    setDraftToast('Draft discarded.');
    setTimeout(() => setDraftToast(''), 2500);
  };

  // Continuous background auto-draft save
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const draft = {
          userRole, fullName, userPhone, userEmail, purpose, categoryGroup, propertyType,
          bhk, bathrooms, balconies, floorNumber, totalFloors, furnishing, carpetAreaSqFt, builtUpAreaSqFt,
          facing, parking, readyToMove, villaBedrooms, villaBathrooms, villaFloors, villaPlotArea, villaBuiltUpArea, villaParking,
          plotArea, plotUnit, plotLength, plotWidth, plotFacing, roadWidthFt, plotNumber, plotSurveyNumber, isPlotFenced,
          commercialUsage, commercialSuperArea, commercialCarpetArea, commercialFloor, commercialTotalFloors, commercialParking, commercialPower, commercialWashrooms,
          landAcres, landGunthas, agriSurveyNumber, waterSources, soilType, roadAccess, isAgriFenced,
          stateName, district, city, locality, streetAddress, projectOrSociety, pinCode,
          price, securityDeposit, leaseAmount, maintenanceMonthly, brokerage, isNegotiable,
          selectedAmenities, photoUrls, videoTourUrl, floorPlanUrl, propertyTitle, description, nearbyLandmarks,
          ownerName, ownershipType, proofChecklist, reraId, approvalAuthority, otherDocsInfo,
          contactPersonName, contactMobileNumber, isPhoneVerified, isSameWhatsApp, customWhatsApp
        };
        localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(draft));
        const now = new Date();
        setAutoSavedTimestamp(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        setHasDraft(true);
      } catch {}
    }, 1200);
    return () => clearTimeout(timer);
  }, [
    userRole, fullName, userPhone, userEmail, purpose, categoryGroup, propertyType,
    bhk, bathrooms, balconies, floorNumber, totalFloors, furnishing, carpetAreaSqFt, builtUpAreaSqFt,
    facing, parking, readyToMove, villaBedrooms, villaBathrooms, villaFloors, villaPlotArea, villaBuiltUpArea, villaParking,
    plotArea, plotUnit, plotLength, plotWidth, plotFacing, roadWidthFt, plotNumber, plotSurveyNumber, isPlotFenced,
    commercialUsage, commercialSuperArea, commercialCarpetArea, commercialFloor, commercialTotalFloors, commercialParking, commercialPower, commercialWashrooms,
    landAcres, landGunthas, agriSurveyNumber, waterSources, soilType, roadAccess, isAgriFenced,
    stateName, district, city, locality, streetAddress, projectOrSociety, pinCode,
    price, securityDeposit, leaseAmount, maintenanceMonthly, brokerage, isNegotiable,
    selectedAmenities, photoUrls, videoTourUrl, floorPlanUrl, propertyTitle, description, nearbyLandmarks,
    ownerName, ownershipType, proofChecklist, reraId, approvalAuthority, otherDocsInfo,
    contactPersonName, contactMobileNumber, isPhoneVerified, isSameWhatsApp, customWhatsApp
  ]);

  // Milestone Navigation Handlers (1 to 4)
  const handleNextStep = () => {
    setSlideDirection('forward');
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setSlideDirection('backward');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleJumpToStep = (stepNumber: number) => {
    setSlideDirection(stepNumber > currentStep ? 'forward' : 'backward');
    setCurrentStep(stepNumber);
  };

  // Image Upload Handlers
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

  const handleAddCustomAmenity = () => {
    if (!customAmenityInput.trim()) return;
    if (!selectedAmenities.includes(customAmenityInput.trim())) {
      setSelectedAmenities((prev) => [...prev, customAmenityInput.trim()]);
    }
    setCustomAmenityInput('');
  };

  const toggleProofDoc = (doc: string) => {
    setProofChecklist((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
    );
  };

  // OTP Simulator
  const handleSendOtp = () => {
    setIsOtpSent(true);
    setDraftToast(`Demo OTP 1234 sent to ${contactMobileNumber}`);
    setTimeout(() => setDraftToast(''), 4000);
  };

  const handleVerifyOtp = () => {
    if (otpCode.trim() === '1234' || otpCode.trim().length >= 4) {
      setIsPhoneVerified(true);
      setDraftToast('Mobile number verified successfully! ✓');
      setTimeout(() => setDraftToast(''), 3000);
    } else {
      setDraftToast('Invalid OTP. Please enter 1234 for demo verification.');
      setTimeout(() => setDraftToast(''), 3500);
    }
  };

  // Submit Listing
  const handlePublishListing = () => {
    setIsPublishing(true);

    const isAgri = propertyType === 'Agricultural Land';
    const isPlot = propertyType === 'Open Plot';

    const coords: [number, number] = selectedLocation
      ? selectedLocation.coordinates
      : [78.3820, 17.4474];

    const finalImages =
      photoUrls.length > 0
        ? photoUrls
        : isAgri
          ? ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80']
          : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'];

    // Determine square feet area
    let calculatedAreaSqFt = builtUpAreaSqFt;
    if (isAgri) {
      calculatedAreaSqFt = Math.round(landAcres * 43560 + landGunthas * 1089);
    } else if (isPlot) {
      calculatedAreaSqFt = plotUnit === 'Sq. Yards' ? plotArea * 9 : plotArea;
    } else if (propertyType === 'Villa' || propertyType === 'Independent House') {
      calculatedAreaSqFt = villaBuiltUpArea;
    } else if (propertyType === 'Office' || propertyType === 'Shop' || propertyType === 'Warehouse') {
      calculatedAreaSqFt = commercialSuperArea;
    }

    const landmarkArray = nearbyLandmarks
      ? nearbyLandmarks.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const newProperty: Property = {
      id: `custom-prop-${Date.now()}`,
      title: propertyTitle.trim() || `${propertyType} in ${locality}, ${city}`,
      description: description.trim(),
      price: Number(price),
      priceDisplay: formatIndianCurrency(Number(price), purpose),
      type: purpose,
      category: propertyType,
      bhk: isAgri || isPlot ? 0 : propertyType === 'Villa' || propertyType === 'Independent House' ? villaBedrooms : Number(bhk),
      bathrooms: isAgri || isPlot ? 0 : propertyType === 'Villa' || propertyType === 'Independent House' ? villaBathrooms : Number(bathrooms),
      balconies: isAgri || isPlot ? 0 : Number(balconies),
      areaSqFt: calculatedAreaSqFt,
      carpetAreaSqFt: isAgri || isPlot ? undefined : propertyType === 'Apartment' ? Number(carpetAreaSqFt) : commercialCarpetArea,
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
      parking: propertyType === 'Villa' || propertyType === 'Independent House' ? villaParking : propertyType === 'Apartment' ? parking : commercialParking,
      floorInfo: isAgri ? 'Agricultural Parcel' : isPlot ? 'Open Ground Plot' : propertyType === 'Villa' ? villaFloors : `Floor ${floorNumber} of ${totalFloors} Floors`,
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

    setTimeout(() => {
      onAddProperty(newProperty);
      localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
      setIsPublishing(false);
      onClose();
    }, 450);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans antialiased">
      {/* Soft Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4 text-center">
        <div className="relative w-full max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl text-left overflow-hidden border border-slate-200/90 max-h-[94dvh] sm:max-h-[88vh] flex flex-col transition-all">

          {/* TOAST FEEDBACK */}
          {draftToast && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{draftToast}</span>
            </div>
          )}

          {/* 1. TOP HEADER WITH STEP COUNTER & PROGRESS BAR */}
          <div className="p-3.5 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-20 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Logo size="sm" variant="icon" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                    {isQuickListMode ? 'Quick Mode' : `Stage ${currentStep} of 4`}
                  </span>
                  <span className="text-xs font-bold text-slate-700 hidden sm:inline">
                    {isQuickListMode ? '60-Second Essentials' : MILESTONES.find((s) => s.num === currentStep)?.label}
                  </span>
                  {autoSavedTimestamp && (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full hidden md:inline">
                      ✓ Draft auto-saved {autoSavedTimestamp}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-0.5">
                  List Property on ManorMap
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* 60-Second Quick List Toggle */}
              <button
                type="button"
                onClick={() => setIsQuickListMode(!isQuickListMode)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                  isQuickListMode
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100'
                }`}
                title="Toggle between 60-second quick list and 4-stage wizard"
              >
                <span>{isQuickListMode ? '⚡ Exit Quick List' : '⚡ 60-Sec Quick List'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                title="Save current progress as draft"
              >
                <Save className="w-3.5 h-3.5 text-blue-600" />
                <span>Save</span>
              </button>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors active:scale-95"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* DRAFT RESUME BANNER */}
          {hasDraft && currentStep === 1 && !isQuickListMode && (
            <div className="bg-amber-50 border-b border-amber-200/70 px-4 py-2 flex items-center justify-between text-xs text-amber-900 font-medium">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>You have an unfinished property listing saved.</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResumeDraft}
                  className="font-bold underline text-amber-900 hover:text-amber-950"
                >
                  Resume Draft
                </button>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="text-amber-600 hover:text-amber-800"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* MICRO PROGRESS BAR */}
          {!isQuickListMode && (
            <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 transition-all duration-300 ease-out"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          )}

          {/* HORIZONTAL STEP CHIPS FOR EASY NAVIGATION */}
          {!isQuickListMode && (
            <div className="border-b border-slate-100 bg-slate-50/70 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px] font-semibold text-slate-500">
              {MILESTONES.map((step) => {
                const isActive = step.num === currentStep;
                const isPassed = step.num < currentStep;
                return (
                  <button
                    key={step.num}
                    type="button"
                    onClick={() => handleJumpToStep(step.num)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : isPassed
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          : 'hover:bg-slate-200/60 text-slate-600'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : isPassed ? 'bg-blue-200 text-blue-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isPassed ? '✓' : step.num}
                    </span>
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. STEP CONTAINER (ANIMATED SLIDE PER STEP) */}
          <div
            key={isQuickListMode ? 'quick-list' : currentStep}
            className={`p-4 sm:p-6 flex-1 overflow-y-auto ${slideDirection === 'forward' ? 'step-transition-forward' : 'step-transition-backward'}`}
          >

            {/* QUICK LIST MODE: 60-SECOND ESSENTIALS */}
            {isQuickListMode && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 border border-amber-300 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-amber-950">⚡ 60-Second Quick Publish</span>
                      <span className="text-[10px] font-extrabold uppercase bg-amber-600 text-white px-2 py-0.5 rounded-full">
                        Broker & Owner Mode
                      </span>
                    </div>
                    <p className="text-xs text-amber-900 mt-1">
                      Fill just 5 essential fields to list your property live on the map immediately. You can enrich RERA, amenities, and floor plans anytime later!
                    </p>
                  </div>
                </div>

                {/* 1. Title / Project Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                    <span>1. Property Title or Society Name</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={propertyTitle}
                    onChange={(e) => setPropertyTitle(e.target.value)}
                    placeholder="e.g. 3 BHK Luxury Flat in Aparna Sarovar, or 200 Sq. Yd HMDA Plot"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-semibold text-slate-900"
                  />
                </div>

                {/* 2. Category & Core Spec */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      2. Property Category
                    </label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 bg-white"
                    >
                      <option value="Apartment">Apartment / Flat</option>
                      <option value="Villa">Villa / Independent House</option>
                      <option value="Open Plot">Open Plot / Land</option>
                      <option value="Agricultural Land">Agricultural Farmland</option>
                      <option value="Commercial">Commercial Office / Shop</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      {propertyType === 'Apartment' || propertyType === 'Villa' ? 'BHK / Bedrooms' : 'Total Area (Sq.Ft / Sq.Yd)'}
                    </label>
                    {propertyType === 'Apartment' || propertyType === 'Villa' ? (
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => { setBhk(count); setVillaBedrooms(count); }}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                              bhk === count ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            {count} BHK
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="number"
                        value={builtUpAreaSqFt}
                        onChange={(e) => setBuiltUpAreaSqFt(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800"
                        placeholder="e.g. 1800"
                      />
                    )}
                  </div>
                </div>

                {/* 3. Locality, City & Map Pin */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    3. Property Location
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      placeholder="Locality (e.g. Kokapet)"
                      className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold"
                    />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City (e.g. Hyderabad)"
                      className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => { onClose(); onStartDropPin(); }}
                      className="col-span-2 sm:col-span-1 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>Pin on Map</span>
                    </button>
                  </div>
                </div>

                {/* 4. Expected Price */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      4. Expected Price (₹)
                    </label>
                    <span className="text-xs font-black text-emerald-700">
                      {getFormattedWords(price)}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                    placeholder="e.g. 15000000"
                  />
                </div>

                {/* 5. Contact Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      5. Your Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                      placeholder="e.g. Rohith / Owner"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Mobile Number (for Inquiries)
                    </label>
                    <input
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                      placeholder="+91 98490 12345"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= MILESTONE 1: ROLE, CATEGORY & LOCATION ================= */}
            {!isQuickListMode && currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Stage 1: Role, Category & Location
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Who is listing, what property category, and where is it located on the map?
                  </p>
                </div>

                {/* Who are you? */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Who are you?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { role: 'Owner', desc: 'Direct owner / landlord', icon: User },
                      { role: 'Agent', desc: 'Real estate broker / consultant', icon: Briefcase },
                      { role: 'Builder', desc: 'Developer or construction firm', icon: Building },
                      { role: 'Company', desc: 'Corporate / REIT entity', icon: Landmark }
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = userRole === item.role;
                      return (
                        <button
                          key={item.role}
                          type="button"
                          onClick={() => setUserRole(item.role as any)}
                          className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-200 active:scale-95 flex flex-col justify-between ${isSelected
                              ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-sm ring-2 ring-blue-500/20'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800 hover:bg-slate-50'
                            }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold mb-2 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-extrabold text-sm">{item.role}</div>
                            <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{item.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name, Mobile, Email Inputs */}
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Full Name</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Keerthi Charan"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-semibold text-slate-900 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Mobile Number</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)}
                        placeholder="+91 98490 12345"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-semibold text-slate-900 bg-white"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Used for buyer inquiries and OTP verification.</p>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>Email Address</span>
                        <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                      </label>
                      <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="e.g. charan@manormap.in"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-semibold text-slate-900 bg-white"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Receive email alerts for leads and viewing bookings.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 2: LISTING PURPOSE ================= */}
            {!isQuickListMode && currentStep === 1 && (
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    2. Select Listing Purpose
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    What would you like to do with this property?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'sale', title: 'Sell', subtitle: 'Sell outright to verified buyers at market price', badge: 'Capital Gain / Sale', icon: DollarSign, color: 'blue' },
                    { id: 'rent', title: 'Rent', subtitle: 'Monthly rental income with verified tenants', badge: 'Monthly Yield', icon: Home, color: 'emerald' },
                    { id: 'lease', title: 'Lease', subtitle: 'Commercial or long-term lease agreement (3-9 years)', badge: 'Long-term Lease', icon: FileText, color: 'amber' },
                    { id: 'pg', title: 'PG / Co-Living', subtitle: 'Paying Guest / Student / Shared accommodation', badge: 'Per Bed / Room', icon: Building, color: 'indigo' }
                  ].map((item) => {
                    const isSelected = purpose === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setPurpose(item.id as ListingType)}
                        className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-3.5 active:scale-[0.98] ${isSelected
                            ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-md ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50 text-slate-800'
                          }`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-extrabold ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-base">{item.title}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-blue-200/80 text-blue-900' : 'bg-slate-100 text-slate-600'
                              }`}>
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ================= STEP 3: PROPERTY CATEGORY ================= */}
            {!isQuickListMode && currentStep === 1 && (
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    3. Select Property Category
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Choose the broad real estate classification.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { id: 'Residential', title: 'Residential', desc: 'Flats, independent houses, gated villas & residential plots', icon: '🏡', badge: 'High Demand' },
                    { id: 'Commercial', title: 'Commercial', desc: 'Offices, retail shops, showrooms & commercial plots', icon: '🏢', badge: 'Commercial' },
                    { id: 'Agricultural', title: 'Agricultural', desc: 'Farmlands, agro estates, orchards & farm plots', icon: '🌾', badge: 'Farmland Map' },
                    { id: 'Industrial', title: 'Industrial', desc: 'Warehouses, factory sheds & logistics land', icon: '🏭', badge: 'Industrial' },
                    { id: 'Other', title: 'Other Real Estate', desc: 'Mixed-use buildings, institutions or special purpose', icon: '📍', badge: 'Special' }
                  ].map((cat) => {
                    const isSelected = categoryGroup === cat.id;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => {
                          setCategoryGroup(cat.id as any);
                          // Auto set default property type matching category
                          if (cat.id === 'Residential') setPropertyType('Apartment');
                          else if (cat.id === 'Commercial') setPropertyType('Office');
                          else if (cat.id === 'Agricultural') setPropertyType('Agricultural Land');
                          else if (cat.id === 'Industrial') setPropertyType('Warehouse');
                        }}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-3.5 active:scale-[0.98] ${isSelected
                            ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-md ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                          }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-xl">
                          {cat.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm">{cat.title}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                              }`}>{cat.badge}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-snug">{cat.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ================= STEP 4: SELECT PROPERTY TYPE ================= */}
            {!isQuickListMode && currentStep === 1 && (
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    4. Select Property Type
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Select the specific property type under <span className="font-bold text-blue-700">{categoryGroup}</span>:
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'Apartment', title: 'Apartment / Flat', icon: '🏢', cats: ['Residential'] },
                    { id: 'Independent House', title: 'Independent House', icon: '🏠', cats: ['Residential'] },
                    { id: 'Villa', title: 'Villa / Duplex', icon: '🏡', cats: ['Residential'] },
                    { id: 'Open Plot', title: 'Open Plot', icon: '📐', cats: ['Residential', 'Commercial', 'Other'] },
                    { id: 'Office', title: 'Office Space', icon: '💼', cats: ['Commercial'] },
                    { id: 'Shop', title: 'Shop / Showroom', icon: '🛍️', cats: ['Commercial'] },
                    { id: 'Warehouse', title: 'Warehouse / Godown', icon: '🏭', cats: ['Industrial', 'Commercial'] },
                    { id: 'Agricultural Land', title: 'Agricultural Land', icon: '🌾', cats: ['Agricultural'] }
                  ].map((p) => {
                    const isSelected = propertyType === p.id;
                    const isRecommended = p.cats.includes(categoryGroup);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPropertyType(p.id as PropertyCategory)}
                        className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-200 active:scale-95 flex flex-col justify-between relative ${isSelected
                            ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-sm ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800 hover:bg-slate-50'
                          }`}
                      >
                        {isRecommended && (
                          <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            Suggested
                          </span>
                        )}
                        <span className="text-2xl mb-2">{p.icon}</span>
                        <div>
                          <div className="font-extrabold text-xs sm:text-sm leading-tight">{p.title}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ================= MILESTONE 2: SPECIFICATIONS & AMENITIES ================= */}
            {!isQuickListMode && currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Stage 2: Specifications & Amenities
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Configure room dimensions, floor details, facing, and community amenities.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {propertyType} Specifications
                    </span>
                  </div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1">
                    5. Detailed Property Specifications
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Questions customized specifically for <span className="font-bold text-slate-800">{propertyType}</span>.
                  </p>
                </div>

                {/* 5A: APARTMENT SPECIFICS */}
                {propertyType === 'Apartment' && (
                  <div className="space-y-4">
                    {/* BHK Selection */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                        BHK Configuration
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setBhk(num)}
                            className={`py-2 rounded-xl border-2 font-bold text-xs sm:text-sm transition-all duration-150 active:scale-95 ${bhk === num
                                ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                          >
                            {num === 0 ? '0 / Studio' : num === 6 ? '6+ BHK' : `${num} BHK`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bathrooms & Balconies */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Bathrooms
                        </label>
                        <div className="flex gap-1.5">
                          {[0, 1, 2, 3, 4, 5].map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => setBathrooms(b)}
                              className={`flex-1 py-2 rounded-xl border-2 font-bold text-xs transition-all duration-150 active:scale-95 ${bathrooms === b
                                  ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                            >
                              {b === 5 ? '5+' : b}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Balconies
                        </label>
                        <div className="flex gap-1.5">
                          {[0, 1, 2, 3, 4, 5].map((balc) => (
                            <button
                              key={balc}
                              type="button"
                              onClick={() => setBalconies(balc)}
                              className={`flex-1 py-2 rounded-xl border-2 font-bold text-xs transition-all duration-150 active:scale-95 ${balconies === balc
                                  ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                            >
                              {balc === 5 ? '5+' : balc}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Floor & Total Floors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Floor Number
                        </label>
                        <input
                          type="number"
                          value={floorNumber}
                          onChange={(e) => setFloorNumber(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Total Floors in Tower
                        </label>
                        <input
                          type="number"
                          value={totalFloors}
                          onChange={(e) => setTotalFloors(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>
                    </div>

                    {/* Carpet Area & Built-up Area */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Super Built-Up Area (sq.ft)
                        </label>
                        <input
                          type="number"
                          value={builtUpAreaSqFt}
                          onChange={(e) => setBuiltUpAreaSqFt(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Carpet Area (sq.ft)
                        </label>
                        <input
                          type="number"
                          value={carpetAreaSqFt}
                          onChange={(e) => setCarpetAreaSqFt(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>
                    </div>

                    {/* Furnishing & Facing */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Furnishing Status
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Unfurnished', 'Semi-Furnished', 'Fully Furnished'].map((f) => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => setFurnishing(f as any)}
                              className={`py-2 px-1 text-center rounded-xl border font-bold text-[11px] truncate ${furnishing === f
                                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                                  : 'border-slate-200 bg-white text-slate-700'
                                }`}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Facing (Vastu)
                        </label>
                        <input
                          type="text"
                          value={facing}
                          onChange={(e) => setFacing(e.target.value)}
                          placeholder="East / North / West"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                        Car Parking
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {['0 (None)', '1 Covered', '2 Covered', '3+ Covered', 'Open Parking'].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setParking(p)}
                            className={`py-2 px-1 text-center rounded-xl border text-[11px] font-bold truncate transition-all duration-150 active:scale-95 ${parking === p
                                ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                              }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5B: HOUSE / VILLA SPECIFICS */}
                {(propertyType === 'Villa' || propertyType === 'Independent House') && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Bedrooms
                        </label>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                          {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setVillaBedrooms(num)}
                              className={`py-2 rounded-lg border-2 font-bold text-xs transition-all duration-150 active:scale-95 ${villaBedrooms === num
                                  ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                            >
                              {num === 0 ? '0' : num === 6 ? '6+' : `${num}`}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Bathrooms
                        </label>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                          {[0, 1, 2, 3, 4, 5, 6].map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => setVillaBathrooms(b)}
                              className={`py-2 rounded-lg border-2 font-bold text-xs transition-all duration-150 active:scale-95 ${villaBathrooms === b
                                  ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                            >
                              {b === 6 ? '6+' : b}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Villa Floors
                        </label>
                        <select
                          value={villaFloors}
                          onChange={(e) => setVillaFloors(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-xs font-semibold text-slate-900 bg-white"
                        >
                          <option value="G+0 (Single Floor)">G+0 (Single Floor)</option>
                          <option value="G+1 (Duplex)">G+1 (Duplex)</option>
                          <option value="G+2 (Triplex)">G+2 (Triplex)</option>
                          <option value="G+3+ (Multi-Storey)">G+3+ (Multi-Storey)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Plot Area (sq.yds)
                        </label>
                        <input
                          type="number"
                          value={villaPlotArea}
                          onChange={(e) => setVillaPlotArea(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Built-Up Area (sq.ft)
                        </label>
                        <input
                          type="number"
                          value={villaBuiltUpArea}
                          onChange={(e) => setVillaBuiltUpArea(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Car Parking Spaces
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {['0 (Street)', '1 Covered', '2 Covered', '3+ Covered'].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setVillaParking(p)}
                              className={`py-2 px-1 text-center rounded-xl border text-[11px] font-bold truncate transition-all duration-150 active:scale-95 ${villaParking === p ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Facing
                        </label>
                        <input
                          type="text"
                          value={facing}
                          onChange={(e) => setFacing(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 5C: OPEN PLOT SPECIFICS */}
                {propertyType === 'Open Plot' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Plot Area
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={plotArea}
                            onChange={(e) => setPlotArea(Number(e.target.value))}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                          />
                          <select
                            value={plotUnit}
                            onChange={(e) => setPlotUnit(e.target.value as any)}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-xs bg-slate-50 text-slate-800"
                          >
                            <option value="Sq. Yards">Sq. Yards</option>
                            <option value="Sq. Feet">Sq. Feet</option>
                            <option value="Cents">Cents</option>
                            <option value="Gunthas">Gunthas</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Facing
                        </label>
                        <input
                          type="text"
                          value={plotFacing}
                          onChange={(e) => setPlotFacing(e.target.value)}
                          placeholder="e.g. North-East Corner"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Length (ft)
                        </label>
                        <input
                          type="number"
                          value={plotLength}
                          onChange={(e) => setPlotLength(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Width / Frontage (ft)
                        </label>
                        <input
                          type="number"
                          value={plotWidth}
                          onChange={(e) => setPlotWidth(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Facing Road Width (ft)
                        </label>
                        <input
                          type="number"
                          value={roadWidthFt}
                          onChange={(e) => setRoadWidthFt(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Plot Number / Block
                        </label>
                        <input
                          type="text"
                          value={plotNumber}
                          onChange={(e) => setPlotNumber(e.target.value)}
                          placeholder="e.g. Plot No. 42, Phase 2"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Survey Number / Khata
                        </label>
                        <input
                          type="text"
                          value={plotSurveyNumber}
                          onChange={(e) => setPlotSurveyNumber(e.target.value)}
                          placeholder="e.g. Sy. No. 128/A"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPlotFenced}
                          onChange={(e) => setIsPlotFenced(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      <span className="text-xs font-bold text-slate-700">Compound Wall / Perimeter Fenced</span>
                    </div>
                  </div>
                )}

                {/* 5D: COMMERCIAL (OFFICE / SHOP / WAREHOUSE) */}
                {(propertyType === 'Office' || propertyType === 'Shop' || propertyType === 'Warehouse' || propertyType === 'Commercial') && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                        Commercial Usage
                      </label>
                      <input
                        type="text"
                        value={commercialUsage}
                        onChange={(e) => setCommercialUsage(e.target.value)}
                        placeholder="e.g. Corporate IT Office / Retail Showroom / Warehouse"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Super Area (sq.ft)
                        </label>
                        <input
                          type="number"
                          value={commercialSuperArea}
                          onChange={(e) => setCommercialSuperArea(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Carpet Area (sq.ft)
                        </label>
                        <input
                          type="number"
                          value={commercialCarpetArea}
                          onChange={(e) => setCommercialCarpetArea(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Floor Number
                        </label>
                        <input
                          type="number"
                          value={commercialFloor}
                          onChange={(e) => setCommercialFloor(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Total Floors
                        </label>
                        <input
                          type="number"
                          value={commercialTotalFloors}
                          onChange={(e) => setCommercialTotalFloors(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Washrooms
                        </label>
                        <input
                          type="number"
                          value={commercialWashrooms}
                          onChange={(e) => setCommercialWashrooms(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Dedicated Parking
                        </label>
                        <input
                          type="text"
                          value={commercialParking}
                          onChange={(e) => setCommercialParking(e.target.value)}
                          placeholder="e.g. 6 Cars & 12 Bikes"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Power Supply / Backup
                        </label>
                        <input
                          type="text"
                          value={commercialPower}
                          onChange={(e) => setCommercialPower(e.target.value)}
                          placeholder="e.g. 50 kVA, 3-Phase with 100% DG"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 5E: AGRICULTURAL LAND SPECIFICS */}
                {propertyType === 'Agricultural Land' && (
                  <div className="space-y-4">
                    {/* Land Area: Acres & Gunthas */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Acres
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={landAcres}
                          onChange={(e) => setLandAcres(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Gunthas (or Cents)
                        </label>
                        <input
                          type="number"
                          value={landGunthas}
                          onChange={(e) => setLandGunthas(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>
                    </div>

                    {/* Survey Number */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                        Survey Number / Passbook Khata
                      </label>
                      <input
                        type="text"
                        value={agriSurveyNumber}
                        onChange={(e) => setAgriSurveyNumber(e.target.value)}
                        placeholder="e.g. Sy. No. 245/1, 245/2"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                      />
                    </div>

                    {/* Soil Type & Road Access */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Soil / Land Type
                        </label>
                        <select
                          value={soilType}
                          onChange={(e) => setSoilType(e.target.value as any)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none text-xs font-semibold text-slate-900 bg-white"
                        >
                          <option value="Red Soil">Red Soil (High Fertility)</option>
                          <option value="Black Cotton">Black Cotton Soil</option>
                          <option value="Alluvial / Loam">Alluvial / River Loam</option>
                          <option value="Mixed / Gravel">Mixed / Gravel Agro Soil</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Road Access
                        </label>
                        <select
                          value={roadAccess}
                          onChange={(e) => setRoadAccess(e.target.value as any)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none text-xs font-semibold text-slate-900 bg-white"
                        >
                          <option value="40ft Tar / Blacktop Road">40ft Tar / Blacktop Road</option>
                          <option value="Concrete CC Road">Concrete CC Road</option>
                          <option value="Farm Approach Road">Farm Approach Road</option>
                        </select>
                      </div>
                    </div>

                    {/* Water Availability */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                        Water Availability
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          'Borewell with Submersible Pump',
                          'Canal / River Water Access',
                          'Drip Irrigation Network',
                          'Farm Pond / Water Tank',
                          'Open Agricultural Well'
                        ].map((src) => {
                          const isChecked = waterSources.includes(src);
                          return (
                            <button
                              key={src}
                              type="button"
                              onClick={() => toggleWaterSource(src)}
                              className={`p-2.5 rounded-xl border text-left font-medium text-xs flex items-center gap-2 transition-all ${isChecked
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                                }`}>
                                {isChecked && '✓'}
                              </div>
                              <span>{src}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interactive Parcel Boundary Polygon */}
                    <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                          <PenTool className="w-4 h-4 text-emerald-700" />
                          <span>Interactive Cadastral Parcel Mapping</span>
                        </div>
                        <p className="text-xs text-emerald-800/80 mt-0.5">
                          {drawnLandBorders && drawnLandBorders.length >= 3
                            ? `✓ Parcel polygon active with ${drawnLandBorders.length} vertices (${landAcres} Acres computed)`
                            : 'Draw exact boundary vertices on live satellite map to display the boundary shaded in green.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {onStartDrawLandBorders && (
                          <button
                            type="button"
                            onClick={() => {
                              onStartDrawLandBorders();
                              onClose();
                            }}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>Plot on Satellite Map</span>
                          </button>
                        )}
                        {drawnLandBorders && drawnLandBorders.length >= 3 && onClearLandBorders && (
                          <button
                            type="button"
                            onClick={onClearLandBorders}
                            className="px-2.5 py-2 rounded-xl border border-slate-200 hover:bg-white text-slate-600 text-xs font-bold"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAgriFenced}
                          onChange={(e) => setIsAgriFenced(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                      <span className="text-xs font-bold text-slate-700">Solar / Barbed Wire Perimeter Fencing</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 6: PROPERTY LOCATION ================= */}
            {!isQuickListMode && currentStep === 1 && (
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    6. Property Location & Map Anchor
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Accurate geo-coordinates ensure buyers discover your property on the map.
                  </p>
                </div>

                {/* Map Anchor Pin Card */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900">
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
                      onStartDropPin();
                      onClose();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{selectedLocation ? 'Reposition Pin' : 'Select on Map'}</span>
                  </button>
                </div>

                {/* Address Form Inputs */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                        Country
                      </label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="India"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                        State
                      </label>
                      <input
                        type="text"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        placeholder="e.g. Telangana / Karnataka / Maharashtra"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                        District
                      </label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="e.g. Ranga Reddy / Hyderabad"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                        City
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Hyderabad"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                        Locality / Area
                      </label>
                      <input
                        type="text"
                        value={locality}
                        onChange={(e) => setLocality(e.target.value)}
                        placeholder="e.g. Gachibowli / Financial District"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                        Project / Society Name <span className="text-slate-400 font-normal">(if applicable)</span>
                      </label>
                      <input
                        type="text"
                        value={projectOrSociety}
                        onChange={(e) => setProjectOrSociety(e.target.value)}
                        placeholder="e.g. Aparna Sarovar / My Home Bhooja"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                        PIN Code
                      </label>
                      <input
                        type="text"
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value)}
                        placeholder="500032"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                      Street / Detailed Address
                    </label>
                    <input
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="e.g. Tower 4, Flat 802, Main Road"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= MILESTONE 3: PRICING & MEDIA ================= */}
            {!isQuickListMode && currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Stage 3: Pricing & Media Showcase
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Set competitive financial terms, upload photos, and generate AI marketing descriptions.
                  </p>
                </div>

                {/* Primary Price Input */}
                <div className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {purpose === 'sale'
                        ? 'Expected Selling Price (₹)'
                        : purpose === 'rent'
                          ? 'Expected Monthly Rent (₹)'
                          : purpose === 'lease'
                            ? 'Total Lease Consideration (₹)'
                            : 'Monthly Bed / Room Rent (₹)'}
                      <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs font-black text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
                      {getFormattedWords(price)}
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-extrabold text-lg">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-xl font-black text-slate-900 bg-white"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Live Indian wording: <strong className="text-slate-800">{getFormattedWords(price)}</strong>
                  </p>
                </div>

                {/* Deposit & Lease specifics */}
                {purpose !== 'sale' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                        Security Deposit (₹)
                      </label>
                      <input
                        type="number"
                        value={securityDeposit}
                        onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">{getFormattedWords(securityDeposit)}</p>
                    </div>

                    {purpose === 'lease' && (
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                          Upfront Lease Amount (₹)
                        </label>
                        <input
                          type="number"
                          value={leaseAmount}
                          onChange={(e) => setLeaseAmount(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">{getFormattedWords(leaseAmount)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Maintenance & Brokerage */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                      Maintenance Charges (₹ / Month)
                    </label>
                    <input
                      type="number"
                      value={maintenanceMonthly}
                      onChange={(e) => setMaintenanceMonthly(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                      Brokerage Policy
                    </label>
                    <select
                      value={brokerage}
                      onChange={(e) => setBrokerage(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-xs font-semibold text-slate-900 bg-white"
                    >
                      <option value="Zero Brokerage (Direct)">Zero Brokerage (Direct from Owner/Builder)</option>
                      <option value="15 Days Rent">15 Days Rent</option>
                      <option value="1 Month Rent">1 Month Rent</option>
                      <option value="1% Brokerage">1% Brokerage on Sale</option>
                      <option value="2% Brokerage">2% Brokerage on Sale</option>
                    </select>
                  </div>
                </div>

                {/* Price Negotiable Toggle */}
                <div className="pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 block">
                    Price Negotiable?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsNegotiable(true)}
                      className={`py-3 rounded-xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${isNegotiable
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700'
                        }`}
                    >
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Yes, Negotiable</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsNegotiable(false)}
                      className={`py-3 rounded-xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${!isNegotiable
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700'
                        }`}
                    >
                      <span>Fixed Price</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 8: AMENITIES & FACILITIES ================= */}
            {!isQuickListMode && currentStep === 2 && (
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    8. Amenities and Facilities
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Select standout facilities that enhance tenant & buyer lifestyle.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(propertyType === 'Agricultural Land'
                    ? AGRICULTURAL_AMENITIES
                    : propertyType === 'Commercial' || propertyType === 'Office' || propertyType === 'Warehouse'
                      ? COMMERCIAL_AMENITIES
                      : RESIDENTIAL_AMENITIES
                  ).map((amenity) => {
                    const isSelected = selectedAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`p-3 rounded-xl border text-left font-semibold text-xs flex items-center gap-2.5 transition-all active:scale-[0.98] ${isSelected
                            ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-bold shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white'
                          }`}>
                          {isSelected && '✓'}
                        </div>
                        <span className="truncate">{amenity}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amenity Adder */}
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={customAmenityInput}
                    onChange={(e) => setCustomAmenityInput(e.target.value)}
                    placeholder="Add custom amenity (e.g. Squash Court, Squash Room)"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-xs font-semibold text-slate-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAmenity}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 9: PHOTOS & DESCRIPTION (WITH AI) ================= */}
            {!isQuickListMode && currentStep === 3 && (
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    9. High-Res Media & AI Description
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Upload photos, video walkthrough, and generate an AI-optimized listing pitch.
                  </p>
                </div>

                {/* Upload Photos Box */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-slate-400" />
                    <span>Upload Property Photos</span>
                  </label>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/60 hover:bg-blue-50/30 transition-all"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFilesSelected}
                      multiple
                      accept="image/*"
                      className="hidden"
                    />
                    <UploadCloud className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      Click to choose photos from device or drag & drop
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      PNG, JPG, WebP supported. High resolution recommended.
                    </p>
                  </div>

                  {/* Or Image URL */}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={currentUrlInput}
                      onChange={(e) => setCurrentUrlInput(e.target.value)}
                      placeholder="Or paste an image web link (https://...)"
                      className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-xs font-semibold text-slate-900 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddPhotoUrl}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                    >
                      Add URL
                    </button>
                  </div>
                  {urlInputError && <p className="text-xs text-red-500 font-semibold">{urlInputError}</p>}

                  {/* Thumbnail Previews */}
                  {isProcessingFiles && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Optimizing image files...</span>
                    </div>
                  )}

                  {photoUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {photoUrls.map((url, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                          <img src={url} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute top-1.5 left-1.5 text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded shadow-sm">
                              Cover Photo
                            </span>
                          )}
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {idx !== 0 && (
                              <button
                                type="button"
                                onClick={() => handleSetCoverPhoto(idx)}
                                className="px-2 py-1 rounded bg-white text-slate-800 text-[10px] font-bold"
                              >
                                Set Cover
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(idx)}
                              className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Video Tour & Floor Plan Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-slate-400" />
                      <span>Video Tour URL <span className="text-slate-400 font-normal">(Optional)</span></span>
                    </label>
                    <input
                      type="url"
                      value={videoTourUrl}
                      onChange={(e) => setVideoTourUrl(e.target.value)}
                      placeholder="YouTube / Vimeo / Drive link"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-xs font-semibold text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Floor Plan / Layout URL <span className="text-slate-400 font-normal">(Optional)</span></span>
                    </label>
                    <input
                      type="url"
                      value={floorPlanUrl}
                      onChange={(e) => setFloorPlanUrl(e.target.value)}
                      placeholder="Image link of architectural layout"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-xs font-semibold text-slate-900 bg-white"
                    />
                  </div>
                </div>

                {/* Title & Description with AI Auto-Generate Button */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Property Headline Title
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateAI}
                      className="flex items-center gap-1 text-xs font-black text-indigo-600 hover:text-indigo-800"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>✨ Polish with AI</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={propertyTitle}
                    onChange={(e) => setPropertyTitle(e.target.value)}
                    placeholder="e.g. 3 BHK Luxury Apartment in Aparna Sarovar Zenith"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-bold text-slate-900 bg-white"
                  />

                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Property Description
                    </label>
                    <span className="text-[11px] text-slate-400 font-semibold">{description.length} chars</span>
                  </div>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Highlight special features, nearby schools, transit connections, high ROI..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-xs sm:text-sm text-slate-800 leading-relaxed bg-white"
                  />
                </div>

                {/* Nearby Landmarks */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                    Nearby Landmarks & Connectivity
                  </label>
                  <input
                    type="text"
                    value={nearbyLandmarks}
                    onChange={(e) => setNearbyLandmarks(e.target.value)}
                    placeholder="e.g. 5 mins to Metro Station, 2 kms from Financial District"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-xs font-semibold text-slate-900 bg-white"
                  />
                </div>
              </div>
            )}

            {/* ================= MILESTONE 4: LEGAL, VERIFICATION & PUBLISH ================= */}
            {!isQuickListMode && currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Stage 4: Legal, Verification & Review
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Verify RERA & Bhu-dhaar records, complete mobile authentication, and publish your listing live.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                      Owner Name as per Title Deed
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Keerthi Charan"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                      Ownership Type
                    </label>
                    <select
                      value={ownershipType}
                      onChange={(e) => setOwnershipType(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-xs font-semibold text-slate-900 bg-white"
                    >
                      <option value="Individual">Individual Freehold</option>
                      <option value="Joint">Joint Ownership</option>
                      <option value="Freehold">Freehold Clear Title</option>
                      <option value="Leasehold">Leasehold</option>
                      <option value="Power of Attorney (POA)">Power of Attorney (POA)</option>
                    </select>
                  </div>
                </div>

                {/* Available Documents Checklist */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 block">
                    Available Document Proofs
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      'Registered Sale Deed / Title Deed',
                      'Pattadar Passbook / Khata',
                      'Encumbrance Certificate (EC)',
                      'Property Tax Receipts',
                      'Occupancy Certificate (OC)',
                      'Building Approval Plan'
                    ].map((doc) => {
                      const isChecked = proofChecklist.includes(doc);
                      return (
                        <button
                          key={doc}
                          type="button"
                          onClick={() => toggleProofDoc(doc)}
                          className={`p-3 rounded-xl border text-left font-semibold text-xs flex items-center gap-2.5 transition-all ${isChecked
                              ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold shadow-xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                            }`}>
                            {isChecked && '✓'}
                          </div>
                          <span>{doc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* RERA & Approvals */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>RERA Registration ID <span className="text-slate-400 font-normal">(if applicable)</span></span>
                    </label>
                    <input
                      type="text"
                      value={reraId}
                      onChange={(e) => setReraId(e.target.value)}
                      placeholder="e.g. P02400008921"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-xs font-semibold text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                      Approval Authority
                    </label>
                    <input
                      type="text"
                      value={approvalAuthority}
                      onChange={(e) => setApprovalAuthority(e.target.value)}
                      placeholder="e.g. HMDA / GHMC / BDA / DTCP Approved"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-xs font-semibold text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                    Other Legal Details / Notes
                  </label>
                  <input
                    type="text"
                    value={otherDocsInfo}
                    onChange={(e) => setOtherDocsInfo(e.target.value)}
                    placeholder="e.g. Bank loan approved from SBI/HDFC, clear 30-year non-encumbrance certificate."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-xs font-semibold text-slate-900 bg-white"
                  />
                </div>
              </div>
            )}

            {/* ================= STEP 11: CONTACT VERIFICATION ================= */}
            {!isQuickListMode && currentStep === 4 && (
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    11. Contact & Identity Verification
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Verified phone numbers receive 3x more genuine responses and spam-free inquiries.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                      Contact Person's Name
                    </label>
                    <input
                      type="text"
                      value={contactPersonName}
                      onChange={(e) => setContactPersonName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={contactMobileNumber}
                      onChange={(e) => setContactMobileNumber(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                    />
                  </div>
                </div>

                {/* OTP Verification Box */}
                <div className="p-4 sm:p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`w-5 h-5 ${isPhoneVerified ? 'text-emerald-600' : 'text-blue-600'}`} />
                      <span className="font-extrabold text-sm text-slate-900">
                        {isPhoneVerified ? 'Mobile Verification Status' : 'Verify Mobile via OTP'}
                      </span>
                    </div>

                    {isPhoneVerified && (
                      <span className="flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                        <Check className="w-3.5 h-3.5" />
                        <span>✓ Verified Phone Number</span>
                      </span>
                    )}
                  </div>

                  {!isPhoneVerified ? (
                    <div className="space-y-3 pt-1">
                      <p className="text-xs text-slate-500">
                        Click "Send OTP" to receive a 4-digit code on {contactMobileNumber}.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-2">
                        {!isOtpSent ? (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                          >
                            Send OTP to Mobile
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              placeholder="Enter 4-digit OTP"
                              className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 w-36 text-center outline-none focus:border-blue-600"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyOtp}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                            >
                              Verify OTP
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOtpCode('1234');
                                setIsPhoneVerified(true);
                              }}
                              className="text-xs text-blue-600 underline font-semibold ml-2"
                            >
                              Auto-Verify Demo
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600">
                      Your identity and contact number have been pre-validated. Buyers can reach you seamlessly.
                    </p>
                  )}
                </div>

                {/* WhatsApp Number Toggle */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSameWhatsApp}
                        onChange={(e) => setIsSameWhatsApp(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                    <span className="text-xs font-bold text-slate-800">
                      WhatsApp number is same as mobile number ({contactMobileNumber})
                    </span>
                  </div>

                  {!isSameWhatsApp && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
                        Separate WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        value={customWhatsApp}
                        onChange={(e) => setCustomWhatsApp(e.target.value)}
                        placeholder="+91 98490 00000"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none text-sm font-semibold text-slate-900 bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= STEP 12: REVIEW & SUBMIT ================= */}
            {!isQuickListMode && currentStep === 4 && (
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    12. Review & Publish Listing
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Check all entered details below. Click any section edit button to make fast revisions.
                  </p>
                </div>

                {/* Visual Summary Card */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs space-y-4">
                  {/* Card Header with image & headline */}
                  <div className="relative aspect-video sm:aspect-[21/9] w-full bg-slate-100 overflow-hidden">
                    <img
                      src={photoUrls[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'}
                      alt="Property cover"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-4 text-white">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-600 text-white">
                          For {purpose === 'sale' ? 'Sale' : purpose === 'rent' ? 'Rent' : purpose === 'lease' ? 'Lease' : 'PG'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/20 backdrop-blur-xs text-white">
                          {propertyType}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                          Listed by {userRole}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black leading-tight">
                        {propertyTitle || `${propertyType} in ${locality}, ${city}`}
                      </h3>
                      <div className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5">
                        {getFormattedWords(price)}
                        {purpose === 'rent' && <span className="text-xs text-white/80 font-normal"> / month</span>}
                      </div>
                    </div>
                  </div>

                  {/* Body Overview Grid */}
                  <div className="p-4 sm:p-5 space-y-4 text-xs">
                    {/* Section 1: Specifications */}
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Property Specifications
                        </div>
                        <div className="text-slate-800 font-semibold space-y-0.5">
                          {propertyType === 'Apartment' && (
                            <div>
                              {bhk === 0 ? 'Studio / 0 BHK' : `${bhk} BHK`} • {carpetAreaSqFt} sq.ft carpet ({builtUpAreaSqFt} sq.ft built-up) • Floor {floorNumber} of {totalFloors} • {furnishing} • Facing {facing}
                            </div>
                          )}
                          {(propertyType === 'Villa' || propertyType === 'Independent House') && (
                            <div>
                              {villaBedrooms === 0 ? 'Studio / Open Layout' : `${villaBedrooms} BHK`} • {villaPlotArea} sq.yds plot • {villaBuiltUpArea} sq.ft built-up • {villaFloors} • {villaParking}
                            </div>
                          )}
                          {propertyType === 'Open Plot' && (
                            <div>
                              {plotArea} {plotUnit} ({plotLength}x{plotWidth} ft) • Facing {plotFacing} • {roadWidthFt}ft road width • {plotNumber}
                            </div>
                          )}
                          {propertyType === 'Agricultural Land' && (
                            <div>
                              {landAcres} Acres ({landGunthas} Gunthas) • {soilType} • {roadAccess} • Survey No. {agriSurveyNumber}
                            </div>
                          )}
                          {(propertyType === 'Office' || propertyType === 'Shop' || propertyType === 'Warehouse' || propertyType === 'Commercial') && (
                            <div>
                              {commercialUsage} • {commercialSuperArea} sq.ft super • Floor {commercialFloor} of {commercialTotalFloors} • {commercialPower}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleJumpToStep(2)}
                        className="text-blue-600 font-bold hover:underline text-[11px] flex-shrink-0 ml-3"
                      >
                        Edit
                      </button>
                    </div>

                    {/* Section 2: Location */}
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Location & Map Coordinates
                        </div>
                        <div className="text-slate-800 font-semibold">
                          {projectOrSociety && `${projectOrSociety}, `}{streetAddress}, {locality}, {district}, {city}, {stateName} - {pinCode}
                        </div>
                        <div className="text-blue-600 font-bold text-[11px] mt-0.5">
                          {selectedLocation ? '📍 Precise Map Pin Anchored' : '📍 Default Centered Location'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleJumpToStep(1)}
                        className="text-blue-600 font-bold hover:underline text-[11px] flex-shrink-0 ml-3"
                      >
                        Edit
                      </button>
                    </div>

                    {/* Section 3: Financials */}
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Price & Terms
                        </div>
                        <div className="text-slate-800 font-semibold">
                          Price: {getFormattedWords(price)} ({isNegotiable ? 'Negotiable' : 'Fixed'}) • Maintenance: ₹{maintenanceMonthly}/mo • Brokerage: {brokerage}
                          {purpose !== 'sale' && ` • Security Deposit: ${getFormattedWords(securityDeposit)}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleJumpToStep(3)}
                        className="text-blue-600 font-bold hover:underline text-[11px] flex-shrink-0 ml-3"
                      >
                        Edit
                      </button>
                    </div>

                    {/* Section 4: Amenities */}
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Selected Amenities ({selectedAmenities.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedAmenities.slice(0, 6).map((a) => (
                            <span key={a} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                              {a}
                            </span>
                          ))}
                          {selectedAmenities.length > 6 && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">
                              +{selectedAmenities.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleJumpToStep(2)}
                        className="text-blue-600 font-bold hover:underline text-[11px] flex-shrink-0 ml-3"
                      >
                        Edit
                      </button>
                    </div>

                    {/* Section 5: Documents & Contact */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Ownership & Contact Verification
                        </div>
                        <div className="text-slate-800 font-semibold">
                          Owner: {ownerName} ({ownershipType}) • Contact: {contactPersonName} ({contactMobileNumber})
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            ✓ Phone Verified
                          </span>
                          {reraId && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                              RERA: {reraId}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleJumpToStep(4)}
                        className="text-blue-600 font-bold hover:underline text-[11px] flex-shrink-0 ml-3"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. STICKY BOTTOM ACTIONS FOOTER */}
          <div className="p-3.5 sm:p-5 border-t border-slate-100 bg-white/95 backdrop-blur-md flex items-center justify-between z-20 flex-shrink-0">
            {/* Left: Back / Save Draft */}
            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveDraft}
                className="sm:hidden px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1"
                title="Save draft"
              >
                <Save className="w-3.5 h-3.5 text-blue-600" />
              </button>
            </div>

            {/* Right: Next / Publish */}
            <div className="flex items-center gap-3">
              {isQuickListMode ? (
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={handlePublishListing}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm sm:text-base shadow-lg active:scale-95 transition-all flex items-center gap-2"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing Listing...</span>
                    </>
                  ) : (
                    <span>Publish Live in 60s 🚀</span>
                  )}
                </button>
              ) : currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-2"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={handlePublishListing}
                  className="px-6 sm:px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm sm:text-base shadow-lg active:scale-95 transition-all flex items-center gap-2"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing Listing...</span>
                    </>
                  ) : (
                    <span>Submit & Publish Listing 🚀</span>
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
