import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Property,
  MapBounds,
  FilterState,
  SearchResult,
  RadiusSearchState,
  PolygonSearchState,
  LandSurveyState,
  MapContextSnapshot
} from './types';
import {
  getAllProperties,
  filterPropertiesByBounds,
  filterPropertiesByRadius,
  filterPropertiesByPolygon,
  addCustomProperty,
  deleteCustomProperty,
  syncPropertiesFromCloud
} from './services/propertyService';
import { reverseGeocodeLocation, ReverseGeocodeResult } from './services/geocoding';
import { mapActionBridge } from './services/mapActionBridge';
import { isSupabaseConfigured, onAuthStateChange } from './services/supabaseClient';
import { syncProfileFromSupabaseUser, getUserProfile, UserProfile } from './services/userService';
import { fetchSupabaseFavorites, toggleSupabaseFavorite } from './services/supabasePropertyService';
import { GoogleMap } from './components/Map/GoogleMap';
import { PinDropOverlay } from './components/Map/PinDropOverlay';
import { FloatingHeader } from './components/Navigation/FloatingHeader';
import { SlideMenuDrawer } from './components/Navigation/SlideMenuDrawer';
import { PropertyPreview } from './components/Property/PropertyPreview';
import { PropertyDetailModal } from './components/Property/PropertyDetailModal';
import { PropertyCardCarousel } from './components/Property/PropertyCardCarousel';
import { AddPropertyModal } from './components/Modals/AddPropertyModal';
import { AuthRequiredModal } from './components/Modals/AuthRequiredModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { ActivityModals } from './components/Modals/ActivityModals';
import { AdvancedFilterModal } from './components/Navigation/AdvancedFilterModal';
import { PropertyComparisonModal } from './components/Modals/PropertyComparisonModal';
import { InvestmentCalculatorModal } from './components/Modals/InvestmentCalculatorModal';
import { AIAssistantDrawer } from './components/AI/AIAssistantDrawer';
import { Map as MapIcon, Building2, Sparkles, Plus, Scale } from 'lucide-react';

export const App: React.FC = () => {
  // All properties & custom additions
  const [allProps, setAllProps] = useState<Property[]>(() => getAllProperties());

  // Active Map bounds
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null);

  // Selected & Hovered property for live marker feedback
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailModalTab, setDetailModalTab] = useState<'overview' | 'amenities' | 'emi' | 'locality' | 'ai-risk' | 'nearby'>('overview');
  const [isTrayOpen, setIsTrayOpen] = useState(false);

  // Advanced Filter state & modal
  const [filterState, setFilterState] = useState<FilterState>({
    type: 'all',
    category: 'all',
    bhk: 'all'
  });
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

  // Radius-based search state
  const [radiusSearch, setRadiusSearch] = useState<RadiusSearchState>({
    active: false,
    center: [78.3820, 17.4474],
    radiusKm: 5
  });

  // Draw-to-search polygon state (Lasso)
  const [polygonSearch, setPolygonSearch] = useState<PolygonSearchState>({
    active: false,
    isDrawing: false,
    coordinates: []
  });

  // Land Boundary Surveyor state
  const [landSurvey, setLandSurvey] = useState<LandSurveyState>({
    active: false,
    isDrawing: false,
    points: [],
    areaSqYards: 0,
    areaGunthas: 0,
    areaAcres: 0,
    areaSqFt: 0,
    areaSqMeters: 0,
    perimeterMeters: 0
  });

  // Theme state (Dark Mode / Light Mode with localStorage persistence)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app_theme') as 'dark' | 'light') || (localStorage.getItem('manormap_theme') as 'dark' | 'light') || 'light';
  });

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('app_theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // AI Agent Visual Overlays
  const [highlightedPropertyIds, setHighlightedPropertyIds] = useState<string[]>([]);
  const [aiPolygon, setAiPolygon] = useState<{ coordinates: [number, number][]; color?: string; label?: string } | null>(null);

  // Investment Calculator & Buy vs Rent Modal State
  const [isRoiModalOpen, setIsRoiModalOpen] = useState(false);
  const [roiTargetProperty, setRoiTargetProperty] = useState<Property | null>(null);

  // Dynamic Locality State (Adapts wherever user moves on map)
  const [currentLocalityName, setCurrentLocalityName] = useState<string>('Gachibowli');
  const [currentCityName, setCurrentCityName] = useState<string>('Hyderabad');

  // Agricultural Land boundary drawing during Add Property
  const [isDrawingLandForProperty, setIsDrawingLandForProperty] = useState(false);
  const [propertyDrawnBorders, setPropertyDrawnBorders] = useState<[number, number][]>([]);
  const [propertyLandMetrics, setPropertyLandMetrics] = useState<any>(null);

  // Property Comparison state (2-4 properties side-by-side)
  const [comparedPropertyIds, setComparedPropertyIds] = useState<string[]>([]);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  // AI Advisor Drawer state
  const [isAIAdvisorOpen, setIsAIAdvisorOpen] = useState(false);

  // Check if any geospatial drawing tool or surveyor is active
  const isAnyGeospatialToolActive = radiusSearch.active || polygonSearch.active || landSurvey.active || isDrawingLandForProperty;

  // Automatically stow/hide property tray when drawing or surveying to prevent clutter
  useEffect(() => {
    if (isAnyGeospatialToolActive && isTrayOpen) {
      setIsTrayOpen(false);
    }
  }, [isAnyGeospatialToolActive, isTrayOpen]);

  // Favorites list in localStorage (clean zero fake entries)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('india_prop_favorites');
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        return parsed.filter((id) => !id.startsWith('prop-'));
      }
      return [];
    } catch {
      return [];
    }
  });

  // Navigation drawer state (Hidden by default)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Add Property & Interactive Pin Dropping Mode
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isDroppingPin, setIsDroppingPin] = useState(false);
  const [droppedLocationInfo, setDroppedLocationInfo] = useState<ReverseGeocodeResult | null>(null);
  const [isLoadingLocationInfo, setIsLoadingLocationInfo] = useState(false);
  const [selectedPinLocation, setSelectedPinLocation] = useState<{
    coordinates: [number, number];
    area: string;
    city: string;
    state: string;
    pinCode: string;
    address: string;
  } | null>(null);

  // Active User Profile & Authentication Gate State
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => getUserProfile());
  const [authModalConfig, setAuthModalConfig] = useState<{
    isOpen: boolean;
    actionTitle?: string;
    actionDescription?: string;
    pendingAction?: () => void;
  }>({
    isOpen: false
  });

  // Google Maps instance reference
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [currentMapCenter, setCurrentMapCenter] = useState<[number, number]>([78.3820, 17.4474]);
  const [userLocation] = useState<[number, number] | null>(null);

  // Supabase Cloud Property & Google Auth State Synchronizer
  useEffect(() => {
    if (isSupabaseConfigured()) {
      syncPropertiesFromCloud().then((cloudProps) => {
        if (cloudProps && cloudProps.length > 0) {
          setAllProps(cloudProps);
        }
      });

      fetchSupabaseFavorites().then((cloudFavs) => {
        if (cloudFavs && cloudFavs.length > 0) {
          setFavorites((prev) => Array.from(new Set([...prev, ...cloudFavs])));
        }
      });
    }

    const { unsubscribe } = onAuthStateChange((_event, session) => {
      const updatedProfile = syncProfileFromSupabaseUser(session?.user || null);
      setCurrentUser(updatedProfile);
      if (session?.user && isSupabaseConfigured()) {
        syncPropertiesFromCloud().then((cloudProps) => {
          if (cloudProps && cloudProps.length > 0) setAllProps(cloudProps);
        });
        fetchSupabaseFavorites().then((cloudFavs) => {
          if (cloudFavs && cloudFavs.length > 0) {
            setFavorites((prev) => Array.from(new Set([...prev, ...cloudFavs])));
          }
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Register real Google Maps instance with the Autonomous AI Agent action bridge
  useEffect(() => {
    if (!mapInstance) return;
    mapActionBridge.register(mapInstance, {
      onSelectProperty: (prop) => {
        setSelectedProperty(prop);
        if (prop) {
          const [lng, lat] = prop.coordinates;
          mapInstance.panTo(new google.maps.LatLng(lat, lng));
        }
      },
      onApplyFilters: (filters) => {
        setFilterState((prev) => ({ ...prev, ...filters }));
      },
      onSetHighlightedPropertyIds: (ids) => {
        setHighlightedPropertyIds(ids);
      },
      onSetAIPolygon: (poly) => {
        setAiPolygon(poly);
      }
    });

    return () => {
      mapActionBridge.unregister();
    };
  }, [mapInstance]);

  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const localityGeocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reverse geocode when map center moves to dynamically track active locality & Pin Drop mode
  const handleMapCenterChange = useCallback((coords: [number, number]) => {
    setCurrentMapCenter(coords);

    // Debounced dynamic locality resolution as user pans around anywhere in India
    if (localityGeocodeTimerRef.current) clearTimeout(localityGeocodeTimerRef.current);
    localityGeocodeTimerRef.current = setTimeout(async () => {
      try {
        const info = await reverseGeocodeLocation(coords[0], coords[1]);
        if (info && info.area) {
          setCurrentLocalityName(info.area);
          setCurrentCityName(info.city);
        }
      } catch (err) {
        console.warn('Center geocoding error:', err);
      }
    }, 450);

    if (isDroppingPin) {
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
      setIsLoadingLocationInfo(true);

      geocodeTimerRef.current = setTimeout(async () => {
        try {
          const info = await reverseGeocodeLocation(coords[0], coords[1]);
          setDroppedLocationInfo(info);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoadingLocationInfo(false);
        }
      }, 350);
    }
  }, [isDroppingPin]);

  // Start Drop Pin Mode
  const handleStartDropPin = () => {
    setIsAddPropertyOpen(false);
    setIsDroppingPin(true);

    setIsLoadingLocationInfo(true);
    reverseGeocodeLocation(currentMapCenter[0], currentMapCenter[1])
      .then((info) => setDroppedLocationInfo(info))
      .catch(() => {})
      .finally(() => setIsLoadingLocationInfo(false));
  };

  // Confirm Dropped Pin Location
  const handleConfirmPinLocation = () => {
    let finalCoords = currentMapCenter;
    if (mapInstance && typeof window !== 'undefined' && window.google?.maps) {
      const center = mapInstance.getCenter();
      if (center) {
        finalCoords = [center.lng(), center.lat()];
      }
    }

    const loc = droppedLocationInfo || {
      area: 'Selected Area',
      city: 'Hyderabad',
      state: 'Telangana',
      pinCode: '500081',
      formattedAddress: 'Selected Pin Location'
    };

    setSelectedPinLocation({
      coordinates: finalCoords,
      area: loc.area,
      city: loc.city,
      state: loc.state,
      pinCode: loc.pinCode,
      address: loc.formattedAddress
    });

    setIsDroppingPin(false);
    setIsAddPropertyOpen(true);
  };

  // Cancel Dropped Pin Location
  const handleCancelPinLocation = () => {
    setIsDroppingPin(false);
    setIsAddPropertyOpen(true);
  };

  // Start drawing boundary for agricultural land during Add Property
  const handleStartDrawLandBorders = () => {
    setIsAddPropertyOpen(false);
    setIsDrawingLandForProperty(true);
    setLandSurvey({
      active: true,
      isDrawing: true,
      points: propertyDrawnBorders,
      areaSqYards: propertyLandMetrics?.areaSqYards || 0,
      areaGunthas: propertyLandMetrics?.areaGunthas || 0,
      areaAcres: propertyLandMetrics?.areaAcres || 0,
      areaSqFt: propertyLandMetrics?.areaSqFt || 0,
      areaSqMeters: 0,
      perimeterMeters: propertyLandMetrics?.perimeterMeters || 0
    });
  };

  // Confirm land boundary from map drawing
  const handleConfirmLandBoundary = () => {
    setPropertyDrawnBorders(landSurvey.points);
    setPropertyLandMetrics({
      areaAcres: landSurvey.areaAcres,
      areaGunthas: landSurvey.areaGunthas,
      areaSqYards: landSurvey.areaSqYards,
      perimeterMeters: landSurvey.perimeterMeters
    });
    setIsDrawingLandForProperty(false);
    setLandSurvey({
      active: false,
      isDrawing: false,
      points: [],
      areaSqYards: 0,
      areaGunthas: 0,
      areaAcres: 0,
      areaSqFt: 0,
      areaSqMeters: 0,
      perimeterMeters: 0
    });
    setIsAddPropertyOpen(true);
  };

  // Cancel land boundary drawing
  const handleCancelLandBoundary = () => {
    setIsDrawingLandForProperty(false);
    setLandSurvey({
      active: false,
      isDrawing: false,
      points: [],
      areaSqYards: 0,
      areaGunthas: 0,
      areaAcres: 0,
      areaSqFt: 0,
      areaSqMeters: 0,
      perimeterMeters: 0
    });
    setIsAddPropertyOpen(true);
  };

  // Clear land boundary
  const handleClearLandBorders = () => {
    setPropertyDrawnBorders([]);
    setPropertyLandMetrics(null);
  };

  // Filter properties in visible area + radius + polygon + advanced filters
  const visibleProperties = useMemo(() => {
    let list = filterPropertiesByBounds(allProps, currentBounds, filterState);

    // Radius search filtering
    if (radiusSearch.active) {
      list = filterPropertiesByRadius(list, radiusSearch.center, radiusSearch.radiusKm);
    }

    // Polygon draw-to-search filtering
    if (polygonSearch.active && polygonSearch.coordinates.length >= 3) {
      list = filterPropertiesByPolygon(list, polygonSearch.coordinates);
    }

    // Always include selectedProperty so clicked marker remains visible
    if (selectedProperty && !list.some((p) => p.id === selectedProperty.id)) {
      return [selectedProperty, ...list];
    }
    return list;
  }, [allProps, currentBounds, filterState, radiusSearch, polygonSearch, selectedProperty]);

  // Handle bounds change when map moves
  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setCurrentBounds(bounds);

    if (mapInstance && typeof window !== 'undefined' && window.google?.maps) {
      const center = mapInstance.getCenter();
      if (center) {
        handleMapCenterChange([center.lng(), center.lat()]);
      }
    }

  }, [mapInstance, handleMapCenterChange]);

  // Select location from search autocomplete or quick chips
  const handleSelectLocation = (result: SearchResult) => {
    if (!mapInstance || typeof window === 'undefined' || !window.google?.maps) return;

    const [lng, lat] = result.coordinates;
    const target = new google.maps.LatLng(lat, lng);
    mapInstance.panTo(target);
    mapInstance.setZoom(result.type === 'city' ? 12 : 14);

    // Extract area and city dynamically from searched location
    const parts = result.title.split(',').map((s) => s.trim());
    const area = parts[0] || 'Selected Area';
    const city = parts[1] || result.subTitle?.split(',')[0]?.trim() || 'City';
    setCurrentLocalityName(area);
    setCurrentCityName(city);

    // If radius search is active, center it to the searched location
    if (radiusSearch.active) {
      setRadiusSearch((prev) => ({ ...prev, center: [lng, lat] }));
    }
  };

  // Toggle favorite
  const handleToggleFavorite = (propertyId: string) => {
    setFavorites((prev) => {
      const isFav = prev.includes(propertyId);
      const next = isFav
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId];
      try {
        localStorage.setItem('india_prop_favorites', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }

      if (isSupabaseConfigured()) {
        toggleSupabaseFavorite(propertyId, !isFav).catch((err) =>
          console.warn('Supabase favorite toggle error:', err)
        );
      }

      return next;
    });
  };

  // Toggle property in comparison list (max 4)
  const handleToggleCompare = (property: Property) => {
    setComparedPropertyIds((prev) => {
      if (prev.includes(property.id)) {
        return prev.filter((id) => id !== property.id);
      }
      if (prev.length >= 4) {
        alert('You can compare a maximum of 4 properties side-by-side.');
        return prev;
      }
      return [...prev, property.id];
    });
  };

  const handleRemoveCompare = (id: string) => {
    setComparedPropertyIds((prev) => prev.filter((pId) => pId !== id));
  };

  const handleClearCompare = () => {
    setComparedPropertyIds([]);
  };

  const comparedProperties = useMemo(() => {
    return allProps.filter((p) => comparedPropertyIds.includes(p.id));
  }, [allProps, comparedPropertyIds]);

  // Add custom property & ensure marker is immediately drawn on map
  const handleAddProperty = (newProp: Property) => {
    const saved = addCustomProperty(newProp);

    setPropertyDrawnBorders([]);
    setPropertyLandMetrics(null);
    setSelectedPinLocation(null);

    // Reset filters so that active filters do not hide the newly added property
    setFilterState({
      type: 'all',
      category: 'all',
      bhk: 'all'
    });

    setAllProps((prev) => [saved, ...prev]);
    setSelectedProperty(saved);

    // Pan and center Google Map to the new property marker
    if (mapInstance && typeof window !== 'undefined' && window.google?.maps) {
      const [lng, lat] = saved.coordinates;
      const target = new google.maps.LatLng(lat, lng);
      mapInstance.setCenter(target);
      mapInstance.setZoom(16);

      const delta = 0.03;
      const immediateBounds: MapBounds = {
        minLng: lng - delta,
        maxLng: lng + delta,
        minLat: lat - delta,
        maxLat: lat + delta
      };
      setCurrentBounds(immediateBounds);
    }
  };

  // Delete custom property
  const handleDeleteProperty = (propertyId: string) => {
    deleteCustomProperty(propertyId);
    setAllProps((prev) => prev.filter((p) => p.id !== propertyId));
    if (selectedProperty?.id === propertyId) {
      setSelectedProperty(null);
    }
    setComparedPropertyIds((prev) => prev.filter((id) => id !== propertyId));
  };

  // Auth-gated Add Property handler
  const handleOpenAddProperty = () => {
    if (!currentUser?.isAuthenticated) {
      setAuthModalConfig({
        isOpen: true,
        actionTitle: 'Sign In to List Property',
        actionDescription: 'Sign in with your Google account to list your flat, villa, commercial unit, or agricultural land with precision GPS and cadastral parcel mapping.',
        pendingAction: () => {
          setIsAddPropertyOpen(true);
        }
      });
      return;
    }
    setIsAddPropertyOpen(true);
  };

  // Open full property details or jump directly to Loan EMI / Locality / AI tab
  const handleOpenDetails = (
    prop: Property,
    tab: 'overview' | 'amenities' | 'emi' | 'locality' | 'ai-risk' | 'nearby' = 'overview'
  ) => {
    if (!currentUser?.isAuthenticated) {
      setAuthModalConfig({
        isOpen: true,
        actionTitle: 'Sign In to View Full Details',
        actionDescription: 'Sign in with your Google account to unlock full property documentation, verified builder contacts, RERA numbers, and institutional pricing audits.',
        pendingAction: () => {
          setSelectedProperty(prop);
          setDetailModalTab(tab);
          setIsDetailModalOpen(true);
        }
      });
      return;
    }
    setSelectedProperty(prop);
    setDetailModalTab(tab);
    setIsDetailModalOpen(true);
  };

  // Open ManorMap AI Advisor
  const handleOpenAIAdvisor = (prop?: Property) => {
    if (prop) {
      setSelectedProperty(prop);
    }
    setIsAIAdvisorOpen(true);
  };

  // Open Institutional ROI & Buy vs Rent Calculator
  const handleOpenRoiCalculator = (prop?: Property) => {
    setRoiTargetProperty(prop || selectedProperty || null);
    setIsRoiModalOpen(true);
  };

  // Real-time Map Context Snapshot for Autonomous AI Agent
  const mapContextSnapshot: MapContextSnapshot = useMemo(() => {
    return {
      center: currentMapCenter,
      zoom: mapInstance ? mapInstance.getZoom() || 14 : 14,
      bounds: currentBounds,
      mapType: 'roadmap',
      activeLayers: [],
      currentLocality: currentLocalityName,
      currentCity: currentCityName,
      visiblePropertyIds: visibleProperties.map((p) => p.id),
      visiblePropertiesCount: visibleProperties.length,
      visiblePropertiesList: visibleProperties,
      selectedProperty,
      hoveredPropertyId,
      activeFilters: filterState,
      radiusSearch,
      polygonSearch,
      landSurvey,
      comparedPropertyIds
    };
  }, [
    currentMapCenter,
    mapInstance,
    currentBounds,
    currentLocalityName,
    currentCityName,
    visibleProperties,
    selectedProperty,
    hoveredPropertyId,
    filterState,
    radiusSearch,
    polygonSearch,
    landSurvey,
    comparedPropertyIds
  ]);

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden bg-slate-900">
      {/* 
        1. THE FIRST SCREEN MUST BE THE MAP (GOOGLE MAPS POWERED)
        Occupies 100% of the available viewport.
        No sidebar by default, no persistent drawer, no onboarding modal.
      */}
      <GoogleMap
        properties={visibleProperties}
        selectedProperty={selectedProperty}
        onSelectProperty={(prop) => {
          setSelectedProperty(prop);
          if (prop && mapInstance && typeof window !== 'undefined' && window.google?.maps) {
            const [lng, lat] = prop.coordinates;
            mapInstance.panTo(new google.maps.LatLng(lat, lng));
          }
        }}
        onBoundsChange={handleBoundsChange}
        userLocation={userLocation}
        onMapLoaded={setMapInstance}
        isDroppingPin={isDroppingPin}
        onMapCenterChange={handleMapCenterChange}
        hoveredPropertyId={hoveredPropertyId}
        radiusSearch={radiusSearch}
        onRadiusChange={setRadiusSearch}
        polygonSearch={polygonSearch}
        onPolygonChange={setPolygonSearch}
        landSurvey={landSurvey}
        onLandSurveyChange={setLandSurvey}
        theme={theme}
        highlightedPropertyIds={highlightedPropertyIds}
        aiPolygon={aiPolygon}
        onClearAIPolygon={() => setAiPolygon(null)}
      />

      {/* 
        Interactive Pin Drop Overlay (Active during property location selection)
      */}
      <PinDropOverlay
        isActive={isDroppingPin}
        onCancel={handleCancelPinLocation}
        onConfirm={handleConfirmPinLocation}
        locationInfo={droppedLocationInfo}
        isLoadingLocation={isLoadingLocationInfo}
      />

      {/* 
        Interactive Land Parcel Drawing Mode (Active while mapping Agricultural Land borders)
      */}
      {isDrawingLandForProperty && (
        <div className="absolute top-16 sm:top-20 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white p-3 sm:px-5 sm:py-3 rounded-2xl shadow-2xl border border-slate-700 flex flex-wrap items-center gap-2 sm:gap-3 animate-in slide-in-from-top sm:max-w-lg justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">Tap map to mark parcel corners</div>
              <div className="text-[10px] text-slate-300 hidden sm:block">Drop 3 or more vertices to map boundary perimeter</div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {landSurvey.points.length > 0 && (
              <div className="text-xs font-extrabold text-emerald-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                {landSurvey.areaAcres.toFixed(2)} Ac ({landSurvey.points.length} nodes)
              </div>
            )}
            <button
              onClick={handleConfirmLandBoundary}
              disabled={landSurvey.points.length < 3}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-xs"
            >
              Save Boundary
            </button>
            <button
              onClick={handleCancelLandBoundary}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 
        2. MINIMAL FLOATING CONTROLS
      */}
      {!isDroppingPin && (
        <FloatingHeader
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenProfile={() => setActiveModal('profile')}
          onOpenAddProperty={handleOpenAddProperty}
          onSelectLocation={handleSelectLocation}
          filterState={filterState}
          onFilterChange={setFilterState}
          onOpenAdvancedFilters={() => setIsAdvancedFilterOpen(true)}
          propertiesCount={visibleProperties.length}
          onToggleTray={() => setIsTrayOpen(!isTrayOpen)}
          isTrayOpen={isTrayOpen}
          comparedCount={comparedPropertyIds.length}
          onOpenCompare={() => setIsComparisonModalOpen(true)}
          onOpenAIAdvisor={() => handleOpenAIAdvisor()}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* 
        3. PROPERTY HORIZONTAL CARDS TRAY
      */}
      {!isDroppingPin && !selectedProperty && (
        <PropertyCardCarousel
          properties={visibleProperties}
          selectedProperty={selectedProperty}
          onSelectProperty={(prop) => {
            setSelectedProperty(prop);
            if (mapInstance && typeof window !== 'undefined' && window.google?.maps) {
              const [lng, lat] = prop.coordinates;
              mapInstance.panTo(new google.maps.LatLng(lat, lng));
            }
          }}
          onViewDetails={handleOpenDetails}
          onHoverProperty={setHoveredPropertyId}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          isOpen={isTrayOpen}
          onToggleOpen={() => setIsTrayOpen(!isTrayOpen)}
        />
      )}

      {/* 
        MOBILE FLOATING BOTTOM NAVIGATION BAR (Thumb-friendly, sleek, uncluttered)
      */}
      {!isDroppingPin && !selectedProperty && !isAnyGeospatialToolActive && !isTrayOpen && (
        <nav className="sm:hidden fixed bottom-3 inset-x-3 z-20 pointer-events-auto flex items-center justify-around bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-800 p-1.5 animate-in slide-in-from-bottom duration-200">
          {/* Map / Recenter */}
          <button
            onClick={() => {
              if (mapInstance && typeof window !== 'undefined' && window.google?.maps) {
                mapInstance.panTo(new google.maps.LatLng(currentMapCenter[1], currentMapCenter[0]));
              }
            }}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-300 hover:text-white transition-colors active:scale-95"
          >
            <MapIcon className="w-5 h-5 text-blue-400" />
            <span className="text-[10px] font-bold mt-0.5">Explore</span>
          </button>

          {/* Browse Properties Tray */}
          <button
            onClick={() => setIsTrayOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-300 hover:text-white transition-colors active:scale-95 relative"
          >
            <Building2 className="w-5 h-5 text-indigo-400" />
            <span className="text-[10px] font-bold mt-0.5">Properties</span>
            {visibleProperties.length > 0 && (
              <span className="absolute -top-1 right-2 bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shadow-xs">
                {visibleProperties.length}
              </span>
            )}
          </button>

          {/* AI Advisor */}
          <button
            onClick={() => handleOpenAIAdvisor()}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-300 hover:text-white transition-colors active:scale-95"
          >
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] font-bold mt-0.5">AI Advisor</span>
          </button>

          {/* Compare (if any active) */}
          {comparedPropertyIds.length > 0 ? (
            <button
              onClick={() => setIsComparisonModalOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-indigo-300 hover:text-white transition-colors active:scale-95 relative"
            >
              <Scale className="w-5 h-5 text-indigo-400" />
              <span className="text-[10px] font-bold mt-0.5">Compare</span>
              <span className="absolute -top-1 right-2 bg-indigo-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shadow-xs">
                {comparedPropertyIds.length}
              </span>
            </button>
          ) : (
            /* List Property */
            <button
              onClick={handleOpenAddProperty}
              className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-300 hover:text-white transition-colors active:scale-95"
            >
              <Plus className="w-5 h-5 text-amber-400" />
              <span className="text-[10px] font-bold mt-0.5">List Prop</span>
            </button>
          )}
        </nav>
      )}

      {/* 
        4. SIDE MENU DRAWER (Hidden Initially, Messages Cleanly Removed)
      */}
      <SlideMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSelectOption={(key) => {
          if (key === 'map') {
            setIsMenuOpen(false);
          } else if (key === 'investment-roi') {
            setIsMenuOpen(false);
            setIsRoiModalOpen(true);
          } else {
            setActiveModal(key);
          }
        }}
        activeOption="map"
        myPropertiesCount={
          allProps.filter(
            (p) => p.id.startsWith('custom-') || p.contact.name.includes('Rohith')
          ).length
        }
        favoritesCount={favorites.length}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* 
        5. COMPACT PROPERTY PREVIEW (Displayed when marker is clicked)
      */}
      {!isDroppingPin && !isDetailModalOpen && (
        <PropertyPreview
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onViewDetails={handleOpenDetails}
          isFavorite={selectedProperty ? favorites.includes(selectedProperty.id) : false}
          onToggleFavorite={handleToggleFavorite}
          onToggleCompare={handleToggleCompare}
          isCompared={selectedProperty ? comparedPropertyIds.includes(selectedProperty.id) : false}
          onOpenAIAdvisor={() => handleOpenAIAdvisor(selectedProperty!)}
        />
      )}

      {/* 
        6. FULL PROPERTY DETAILS MODAL WITH LIGHTBOX & AI AUDIT
      */}
      <PropertyDetailModal
        property={selectedProperty}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        initialTab={detailModalTab}
        isFavorite={selectedProperty ? favorites.includes(selectedProperty.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onToggleCompare={handleToggleCompare}
        isCompared={selectedProperty ? comparedPropertyIds.includes(selectedProperty.id) : false}
        onOpenAIAdvisor={() => handleOpenAIAdvisor(selectedProperty!)}
        onOpenRoiCalculator={handleOpenRoiCalculator}
      />

      {/* 
        7. ADVANCED PROPERTY FILTERS MODAL
      */}
      <AdvancedFilterModal
        isOpen={isAdvancedFilterOpen}
        onClose={() => setIsAdvancedFilterOpen(false)}
        filterState={filterState}
        onApplyFilters={setFilterState}
        matchingCount={visibleProperties.length}
      />

      {/* 
        8. PROPERTY COMPARISON MODAL (Side-by-Side 2-4 properties)
      */}
      <PropertyComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        comparedProperties={comparedProperties}
        onRemoveProperty={handleRemoveCompare}
        onSelectProperty={(p) => {
          setSelectedProperty(p);
          if (mapInstance && typeof window !== 'undefined' && window.google?.maps) {
            const [lng, lat] = p.coordinates;
            mapInstance.panTo(new google.maps.LatLng(lat, lng));
            mapInstance.setZoom(16);
          }
        }}
        onOpenDetails={handleOpenDetails}
        onClearComparison={handleClearCompare}
      />

      {/* 
        9. MANORMAP AUTONOMOUS AI AGENT DRAWER
      */}
      <AIAssistantDrawer
        isOpen={isAIAdvisorOpen}
        onClose={() => setIsAIAdvisorOpen(false)}
        mapContext={mapContextSnapshot}
        onSelectProperty={(prop) => {
          setSelectedProperty(prop);
          if (mapInstance && typeof window !== 'undefined' && window.google?.maps) {
            const [lng, lat] = prop.coordinates;
            mapInstance.panTo(new google.maps.LatLng(lat, lng));
            mapInstance.setZoom(16);
          }
        }}
        onOpenRoiCalculator={handleOpenRoiCalculator}
      />

      {/* 
        10. ADD PROPERTY MODAL WITH INTERACTIVE PIN SELECTION & LAND BOUNDARY MAPPING
      */}
      <AddPropertyModal
        isOpen={isAddPropertyOpen}
        onClose={() => setIsAddPropertyOpen(false)}
        onAddProperty={handleAddProperty}
        onStartDropPin={handleStartDropPin}
        onStartDrawLandBorders={handleStartDrawLandBorders}
        drawnLandBorders={propertyDrawnBorders}
        onClearLandBorders={handleClearLandBorders}
        landMetrics={propertyLandMetrics}
        selectedLocation={selectedPinLocation}
      />

      {/* 
        11. SETTINGS & ARCHITECTURE MODAL
      */}
      <SettingsModal
        isOpen={activeModal === 'settings'}
        onClose={() => setActiveModal(null)}
      />

      {/* 
        12. ACTIVITY MODALS (My Properties, Favorites, Alerts, Profile, Help)
      */}
      <ActivityModals
        modalType={activeModal}
        onClose={() => setActiveModal(null)}
        properties={allProps}
        favorites={favorites}
        onSelectProperty={(p) => {
          setSelectedProperty(p);
          if (mapInstance && typeof window !== 'undefined' && window.google?.maps) {
            const [lng, lat] = p.coordinates;
            mapInstance.panTo(new google.maps.LatLng(lat, lng));
            mapInstance.setZoom(15);
          }
        }}
        onToggleFavorite={handleToggleFavorite}
        onDeleteProperty={handleDeleteProperty}
        onSelectLocationCoords={(coords) => {
          if (mapInstance && typeof window !== 'undefined' && window.google?.maps) {
            mapInstance.panTo(new google.maps.LatLng(coords[1], coords[0]));
            mapInstance.setZoom(14);
          }
        }}
      />

      {/* 
        13. INSTITUTIONAL INVESTMENT & ROI CALCULATOR MODAL
      */}
      <InvestmentCalculatorModal
        isOpen={isRoiModalOpen}
        onClose={() => setIsRoiModalOpen(false)}
        selectedProperty={roiTargetProperty || selectedProperty}
      />

      {/* 
        14. AUTHENTICATION REQUIRED MODAL (Gates Property Details & Property Listing)
      */}
      <AuthRequiredModal
        isOpen={authModalConfig.isOpen}
        onClose={() => setAuthModalConfig((prev) => ({ ...prev, isOpen: false }))}
        actionTitle={authModalConfig.actionTitle}
        actionDescription={authModalConfig.actionDescription}
        onSignInSuccess={() => {
          const updated = getUserProfile();
          setCurrentUser(updated);
          if (authModalConfig.pendingAction) {
            authModalConfig.pendingAction();
          }
          setAuthModalConfig((prev) => ({ ...prev, isOpen: false }));
        }}
      />
    </main>
  );
};

export default App;
