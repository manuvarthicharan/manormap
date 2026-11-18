import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Property,
  MapBounds,
  RadiusSearchState,
  PolygonSearchState,
  LandSurveyState
} from '../../types';
import { loadGoogleMaps } from '../../services/googleMapsLoader';
import { CustomOverlayMarker } from './CustomOverlayMarker';
import { computeDisplacedPinLayout } from './pinDeconfliction';
import { calculateLandParcelMetrics, computeLandSurveyMetrics } from '../../services/propertyService';
import { LandBoundarySurveyorHUD, SurveyDrawMode } from './LandBoundarySurveyorHUD';
import { mapActionBridge } from '../../services/mapActionBridge';
import {
  Locate,
  ZoomIn,
  ZoomOut,
  Layers,
  Navigation,
  AlertTriangle,
  CircleDot,
  PenTool,
  Ruler,
  Wrench,
  X,
  Trash2,
  Check,
  Sparkles,
  RotateCcw,
  Loader2
} from 'lucide-react';

const CLEAN_LIGHT_STYLE: google.maps.MapTypeStyle[] = [
  {
    featureType: 'poi',
    elementType: 'labels.text',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }]
  }
];

interface GoogleMapProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (property: Property | null) => void;
  onBoundsChange: (bounds: MapBounds) => void;
  onSearchThisArea?: () => void;
  showSearchThisAreaBtn?: boolean;
  userLocation: [number, number] | null;
  onMapLoaded: (mapInstance: google.maps.Map) => void;
  isDroppingPin?: boolean;
  onMapCenterChange?: (coords: [number, number]) => void;
  hoveredPropertyId?: string | null;
  // Radius Search
  radiusSearch: RadiusSearchState;
  onRadiusChange: (state: RadiusSearchState) => void;
  // Polygon Search (Draw to search)
  polygonSearch: PolygonSearchState;
  onPolygonChange: (state: PolygonSearchState) => void;
  // Agricultural Land Border Plotting
  isDrawingLandForProperty?: boolean;
  drawnLandBorders?: [number, number][];
  onSaveListingBoundary?: (coords?: [number, number][], metrics?: any) => void;
  onCancelListingBoundary?: () => void;
  // Land Boundary Surveyor
  landSurvey?: LandSurveyState;
  onLandSurveyChange?: (state: LandSurveyState) => void;
  onListThisLand?: (survey: LandSurveyState) => void;
  // AI Bridge Overlays
  highlightedPropertyIds?: string[];
  aiPolygon?: { coordinates: [number, number][]; color?: string; label?: string } | null;
  onClearAIPolygon?: () => void;
  // Map Type control
  activeMapTypeId?: string;
  onMapTypeChange?: (mapTypeId: string) => void;
}

export const GoogleMap: React.FC<GoogleMapProps> = ({
  properties,
  selectedProperty,
  onSelectProperty,
  onBoundsChange,
  userLocation,
  onMapLoaded,
  isDroppingPin = false,
  onMapCenterChange,
  hoveredPropertyId,
  radiusSearch,
  onRadiusChange,
  polygonSearch,
  onPolygonChange,
  isDrawingLandForProperty = false,
  drawnLandBorders = [],
  onSaveListingBoundary,
  onCancelListingBoundary,
  landSurvey = {
    active: false,
    isDrawing: false,
    points: [],
    areaSqYards: 0,
    areaGunthas: 0,
    areaAcres: 0,
    areaSqFt: 0,
    areaSqMeters: 0,
    perimeterMeters: 0
  },
  onLandSurveyChange,
  onListThisLand,
  highlightedPropertyIds = [],
  aiPolygon = null,
  onClearAIPolygon,
  activeMapTypeId: propsActiveMapTypeId,
  onMapTypeChange
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, CustomOverlayMarker>>(new Map());
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  // Overlay Objects
  const radiusCircleRef = useRef<google.maps.Circle | null>(null);
  const polygonOverlayRef = useRef<google.maps.Polygon | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMaskingRef = useRef<boolean>(false);
  const maskStrokePointsRef = useRef<[number, number][]>([]);
  const pointerStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const [surveyDrawMode, setSurveyDrawMode] = useState<SurveyDrawMode>('freehand');
  const maskedPolygonOverlayRef = useRef<google.maps.Polygon | null>(null);
  const surveyorPegMarkersRef = useRef<google.maps.Marker[]>([]);
  const allPropertyBoundariesRef = useRef<Map<string, google.maps.Polygon>>(new Map());
  const transitLayerRef = useRef<any>(null);
  const aiPolygonOverlayRef = useRef<google.maps.Polygon | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(13);
  const [activeMapTypeId, setActiveMapTypeId] = useState<string>(propsActiveMapTypeId || 'hybrid');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [showTransitLayer, setShowTransitLayer] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);

  useEffect(() => {
    if (propsActiveMapTypeId && propsActiveMapTypeId !== activeMapTypeId) {
      setActiveMapTypeId(propsActiveMapTypeId);
      if (mapRef.current) {
        mapRef.current.setMapTypeId(propsActiveMapTypeId);
      }
    }
  }, [propsActiveMapTypeId]);

  // Agricultural Land Drawing Coordinates (identical simple logic to polygonSearch)
  const [landDrawCoordinates, setLandDrawCoordinates] = useState<[number, number][]>(() => drawnLandBorders || []);
  const landDrawCoordinatesRef = useRef(landDrawCoordinates);
  landDrawCoordinatesRef.current = landDrawCoordinates;

  useEffect(() => {
    if (isDrawingLandForProperty) {
      setLandDrawCoordinates(drawnLandBorders || []);
    }
  }, [isDrawingLandForProperty, drawnLandBorders]);

  const isSurveyActive = isDrawingLandForProperty || Boolean(landSurvey?.active);
  const activeSurveyCoords = isDrawingLandForProperty
    ? landDrawCoordinates
    : (landSurvey?.active ? landSurvey.points : []);

  const liveLandMetrics = useMemo(() => {
    if (activeSurveyCoords.length < 3) {
      return { areaAcres: 0, areaGunthas: 0, areaSqYards: 0, perimeterMeters: 0, areaSqFt: 0, areaSqMeters: 0 };
    }
    return calculateLandParcelMetrics(activeSurveyCoords);
  }, [activeSurveyCoords]);

  const isAnyToolActive = radiusSearch.active || polygonSearch.active || isSurveyActive;

  // Keep live refs for callbacks to prevent stale closures
  const isDroppingPinRef = useRef(isDroppingPin);
  isDroppingPinRef.current = isDroppingPin;

  const onMapCenterChangeRef = useRef(onMapCenterChange);
  onMapCenterChangeRef.current = onMapCenterChange;

  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;

  const polygonSearchRef = useRef(polygonSearch);
  polygonSearchRef.current = polygonSearch;

  const isDrawingLandForPropertyRef = useRef(isDrawingLandForProperty);
  isDrawingLandForPropertyRef.current = isDrawingLandForProperty;

  // Initialize Google Maps instance & register with MapActionBridge
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;

    loadGoogleMaps()
      .then((maps) => {
        if (!isMounted || !mapContainerRef.current) return;

        // Custom clean modern styling for Google Maps
        const cleanStyle: google.maps.MapTypeStyle[] = [
          {
            featureType: 'poi',
            elementType: 'labels.text',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels.icon',
            stylers: [{ visibility: 'off' }]
          }
        ];

        const initialCenter = new maps.LatLng(17.4474, 78.3820); // Hyderabad Hitec City

        const map = new maps.Map(mapContainerRef.current, {
          center: initialCenter,
          zoom: 13,
          minZoom: 3,
          maxZoom: 20,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          mapTypeId: maps.MapTypeId.HYBRID,
          styles: cleanStyle,
          backgroundColor: '#0f172a'
        });

        mapRef.current = map;
        setMapLoaded(true);
        onMapLoaded(map);

        // Initial bounds when map is ready
        maps.event.addListenerOnce(map, 'idle', () => {
          const b = map.getBounds();
          if (b) {
            const sw = b.getSouthWest();
            const ne = b.getNorthEast();
            onBoundsChange({
              minLng: sw.lng(),
              minLat: sw.lat(),
              maxLng: ne.lng(),
              maxLat: ne.lat()
            });
          }
        });

        // Track zoom level actively on both zoom_changed and idle
        const handleZoomChange = () => {
          const z = map.getZoom();
          if (typeof z === 'number' && !isNaN(z)) {
            setCurrentZoom(z);
          }
        };
        map.addListener('zoom_changed', handleZoomChange);

        // Debounced bounds & center change on idle
        map.addListener('idle', () => {
          handleZoomChange();
          const b = map.getBounds();
          if (b && onBoundsChangeRef.current) {
            const sw = b.getSouthWest();
            const ne = b.getNorthEast();
            onBoundsChangeRef.current({
              minLng: sw.lng(),
              minLat: sw.lat(),
              maxLng: ne.lng(),
              maxLat: ne.lat()
            });
          }

          const center = map.getCenter();
          if (center && onMapCenterChangeRef.current) {
            onMapCenterChangeRef.current([center.lng(), center.lat()]);
          }
        });

        // Center changed during pin drop mode
        map.addListener('center_changed', () => {
          if (isDroppingPinRef.current) {
            const center = map.getCenter();
            if (center && onMapCenterChangeRef.current) {
              onMapCenterChangeRef.current([center.lng(), center.lat()]);
            }
          }
        });

        // Click on map: handle interaction based on active mode
        map.addListener('click', (e: any) => {
          if (isDroppingPinRef.current && e.latLng) {
            map.panTo(e.latLng);
            return;
          }

          // In Agricultural Land Drawing mode, Google Maps DrawingManager handles all drawing interactions natively
          if (isDrawingLandForPropertyRef.current) {
            return;
          }

          // Polygon Draw-to-Search click
          if (polygonSearchRef.current.active && polygonSearchRef.current.isDrawing && e.latLng) {
            const newPt: [number, number] = [e.latLng.lng(), e.latLng.lat()];
            const updatedPts = [...polygonSearchRef.current.coordinates, newPt];
            onPolygonChange({
              ...polygonSearchRef.current,
              coordinates: updatedPts
            });
            return;
          }

          // Default click: deselect property
          onSelectProperty(null);
        });
      })
      .catch((err) => {
        console.error('Failed to load Google Maps SDK', err);
        if (isMounted) {
          setLoadError(err.message || 'Failed to load Google Maps SDK');
        }
      });

    return () => {
      isMounted = false;
      mapActionBridge.unregister();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      if (maskedPolygonOverlayRef.current) {
        maskedPolygonOverlayRef.current.setMap(null);
        maskedPolygonOverlayRef.current = null;
      }
      surveyorPegMarkersRef.current.forEach((m) => m.setMap(null));
      surveyorPegMarkersRef.current = [];
    };
  }, []);

  // Compute Google Maps style LOD layout for all individual property pins directly on map
  const pinLayouts = useMemo(() => {
    return computeDisplacedPinLayout(
      properties,
      currentZoom,
      selectedProperty?.id,
      highlightedPropertyIds,
      hoveredPropertyId
    );
  }, [properties, currentZoom, selectedProperty?.id, highlightedPropertyIds, hoveredPropertyId]);

  // Synchronize Individual Markers with Google Maps Level-of-Detail & Density Culling
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || typeof window === 'undefined' || !window.google?.maps) return;

    const currentMarkerIds = new Set<string>();

    pinLayouts.forEach(({ property, displayMode, dx, dy, zoomMode }) => {
      currentMarkerIds.add(property.id);
      const isSelected = selectedProperty?.id === property.id;
      const isHighlighted = highlightedPropertyIds.includes(property.id);
      const isHovered = hoveredPropertyId === property.id;

      let marker = markersRef.current.get(property.id);

      if (!marker) {
        marker = new CustomOverlayMarker(property, map, isSelected, (clickedProp) => {
          onSelectProperty(clickedProp);

          const [lng, lat] = clickedProp.coordinates;
          map.panTo(new google.maps.LatLng(lat, lng));
          const currentZoom = map.getZoom() || 14;
          if (currentZoom < 16) {
            map.setZoom(16);
          }
        });

        markersRef.current.set(property.id, marker);
      }

      marker.setSelected(isSelected);
      marker.setHighlighted(isHighlighted);
      marker.setHovered(isHovered);
      marker.setLayout(displayMode, dx, dy, zoomMode);
    });

    // Remove markers no longer active
    markersRef.current.forEach((marker, id) => {
      if (!currentMarkerIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });
  }, [pinLayouts, selectedProperty, highlightedPropertyIds, hoveredPropertyId, mapLoaded, onSelectProperty]);

  // Synchronize hovered property
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      marker.setHovered(id === hoveredPropertyId);
    });
  }, [hoveredPropertyId]);

  // Toggle Transit Layer (Google Maps TransitLayer)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || typeof window === 'undefined' || !window.google?.maps) return;

    if (showTransitLayer) {
      if (!transitLayerRef.current) {
        transitLayerRef.current = new (window.google.maps as any).TransitLayer();
      }
      transitLayerRef.current.setMap(map);
    } else if (transitLayerRef.current) {
      transitLayerRef.current.setMap(null);
    }
  }, [showTransitLayer, mapLoaded]);

  // Radius Search Circle Overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !window.google?.maps) return;

    if (radiusSearch.active) {
      const centerLatLng = new google.maps.LatLng(radiusSearch.center[1], radiusSearch.center[0]);
      const radiusMeters = radiusSearch.radiusKm * 1000;

      if (!radiusCircleRef.current) {
        radiusCircleRef.current = new google.maps.Circle({
          center: centerLatLng,
          radius: radiusMeters,
          fillColor: '#2563eb',
          fillOpacity: 0.12,
          strokeColor: '#2563eb',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          map: map
        });
      } else {
        radiusCircleRef.current.setCenter(centerLatLng);
        radiusCircleRef.current.setRadius(radiusMeters);
        radiusCircleRef.current.setMap(map);
      }
    } else if (radiusCircleRef.current) {
      radiusCircleRef.current.setMap(null);
    }
  }, [radiusSearch, mapLoaded]);

  // Draw-to-Search Polygon Overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !window.google?.maps) return;

    if (polygonSearch.active && polygonSearch.coordinates.length > 1) {
      const paths = polygonSearch.coordinates.map((c) => new google.maps.LatLng(c[1], c[0]));

      if (!polygonOverlayRef.current) {
        polygonOverlayRef.current = new google.maps.Polygon({
          paths: paths,
          fillColor: '#2563eb',
          fillOpacity: 0.15,
          strokeColor: '#2563eb',
          strokeOpacity: 0.9,
          strokeWeight: 2,
          clickable: false,
          map: map
        });
      } else {
        polygonOverlayRef.current.setPaths(paths);
        polygonOverlayRef.current.setOptions({ clickable: false });
        polygonOverlayRef.current.setMap(map);
      }
    } else if (polygonOverlayRef.current) {
      polygonOverlayRef.current.setMap(null);
    }
  }, [polygonSearch, mapLoaded]);

  // Render and update the masked land polygon overlay & vertex pegs
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !window.google?.maps) return;

    const activeSurveyCoords = isDrawingLandForProperty
      ? landDrawCoordinates
      : (landSurvey?.active ? landSurvey.points : []);

    if (activeSurveyCoords && activeSurveyCoords.length >= 3) {
      const paths = activeSurveyCoords.map((c) => new google.maps.LatLng(c[1], c[0]));

      if (!maskedPolygonOverlayRef.current) {
        maskedPolygonOverlayRef.current = new google.maps.Polygon({
          paths,
          fillColor: '#10b981',
          fillOpacity: 0.35,
          strokeColor: '#059669',
          strokeWeight: 2.5,
          strokeOpacity: 0.95,
          clickable: false,
          zIndex: 150,
          map
        });
      } else {
        maskedPolygonOverlayRef.current.setPaths(paths);
        maskedPolygonOverlayRef.current.setOptions({
          fillColor: '#10b981',
          fillOpacity: 0.35,
          strokeColor: '#059669',
          strokeWeight: 2.5,
          clickable: false,
          zIndex: 150
        });
        maskedPolygonOverlayRef.current.setMap(map);
      }
    } else if (maskedPolygonOverlayRef.current) {
      maskedPolygonOverlayRef.current.setMap(null);
    }

    // Render vertex peg markers
    surveyorPegMarkersRef.current.forEach((m) => m.setMap(null));
    surveyorPegMarkersRef.current = [];

    if (activeSurveyCoords && activeSurveyCoords.length > 0 && isSurveyActive) {
      // In pegs mode or when nodes < 15, show individual pegs
      activeSurveyCoords.forEach((pt, idx) => {
        const marker = new google.maps.Marker({
          position: new google.maps.LatLng(pt[1], pt[0]),
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5,
            fillColor: '#059669',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          },
          title: `Corner Peg #${idx + 1}`
        });
        surveyorPegMarkersRef.current.push(marker);
      });
    }
  }, [isDrawingLandForProperty, landDrawCoordinates, landSurvey?.active, landSurvey?.points, isSurveyActive, mapLoaded]);

  // Sync mask canvas sizing with map viewport
  useEffect(() => {
    if (!isSurveyActive || !maskCanvasRef.current || !mapContainerRef.current) return;
    const canvas = maskCanvasRef.current;
    const container = mapContainerRef.current;
    const syncSize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    syncSize();
    window.addEventListener('resize', syncSize);
    return () => window.removeEventListener('resize', syncSize);
  }, [isSurveyActive]);

  // AI Boundary & Polygon Overlay (highlight_area / draw_map_polygon)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !window.google?.maps) return;

    if (aiPolygon && aiPolygon.coordinates.length >= 3) {
      const paths = aiPolygon.coordinates.map((c) => new google.maps.LatLng(c[1], c[0]));

      if (!aiPolygonOverlayRef.current) {
        aiPolygonOverlayRef.current = new google.maps.Polygon({
          paths,
          fillColor: aiPolygon.color || '#3b82f6',
          fillOpacity: 0.22,
          strokeColor: aiPolygon.color || '#2563eb',
          strokeOpacity: 0.95,
          strokeWeight: 3,
          map: map
        });
      } else {
        aiPolygonOverlayRef.current.setPaths(paths);
        aiPolygonOverlayRef.current.setMap(map);
      }
    } else if (aiPolygonOverlayRef.current) {
      aiPolygonOverlayRef.current.setMap(null);
    }
  }, [aiPolygon, mapLoaded]);

  // Enforce permanent clean light styling for Google Maps
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !window.google?.maps) return;
    (map as any).setOptions({
      styles: CLEAN_LIGHT_STYLE,
      backgroundColor: '#f8fafc'
    });
  }, [mapLoaded]);

  // Permanent Land Parcel Boundary Overlays for ALL Agricultural Land and Plots
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !window.google?.maps) return;

    const currentMap = allPropertyBoundariesRef.current;
    const activeIds = new Set<string>();

    properties.forEach((prop) => {
      if (prop.boundaryPolygon && prop.boundaryPolygon.length >= 3) {
        activeIds.add(prop.id);
        const paths = prop.boundaryPolygon.map((c) => new google.maps.LatLng(c[1], c[0]));
        const isAgri = prop.category === 'Agricultural Land' || prop.category === 'Plot';
        const isSelected = selectedProperty?.id === prop.id;
        const isHovered = hoveredPropertyId === prop.id;

        const fillColor = isAgri ? '#10b981' : '#3b82f6';
        const strokeColor = isSelected ? '#047857' : (isAgri ? '#059669' : '#2563eb');
        const fillOpacity = isSelected ? 0.38 : (isHovered ? 0.30 : 0.22);
        const strokeWeight = isSelected ? 3.5 : (isHovered ? 2.5 : 2);
        const zIndex = isSelected ? 90 : (isHovered ? 60 : 35);

        const isDrawingModeActive = isDrawingLandForProperty || polygonSearch.active;
        const clickable = !isDrawingModeActive;

        let poly = currentMap.get(prop.id);
        if (!poly) {
          poly = new google.maps.Polygon({
            paths,
            fillColor,
            fillOpacity,
            strokeColor,
            strokeWeight,
            strokeOpacity: 0.95,
            zIndex,
            map: map,
            clickable
          });

          poly.addListener('click', () => {
            if (!isDrawingLandForPropertyRef.current) {
              onSelectProperty(prop);
            }
          });

          currentMap.set(prop.id, poly);
        } else {
          poly.setPaths(paths);
          poly.setOptions({
            fillColor,
            fillOpacity,
            strokeColor,
            strokeWeight,
            zIndex,
            clickable
          });
          poly.setMap(map);
        }
      }
    });

    // Remove polygons for properties no longer in visible list
    currentMap.forEach((poly, id) => {
      if (!activeIds.has(id)) {
        poly.setMap(null);
        currentMap.delete(id);
      }
    });
  }, [properties, selectedProperty, hoveredPropertyId, isDrawingLandForProperty, mapLoaded]);



  // User location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !window.google?.maps) return;

    if (userLocation) {
      const [lng, lat] = userLocation;
      const position = new google.maps.LatLng(lat, lng);

      if (!userMarkerRef.current) {
        userMarkerRef.current = new google.maps.Marker({
          position: position,
          map: map,
          title: 'Your Location',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%232563eb" stroke="%23ffffff" stroke-width="3"/><circle cx="12" cy="12" r="4" fill="%23ffffff"/></svg>',
            scaledSize: new google.maps.Point(24, 24)
          }
        });
      } else {
        userMarkerRef.current.setPosition(position);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
  }, [userLocation, mapLoaded]);

  // Change Map Type
  const handleSetMapType = (typeId: string) => {
    if (mapRef.current) {
      mapRef.current.setMapTypeId(typeId);
      setActiveMapTypeId(typeId);
      onMapTypeChange?.(typeId);
    }
    setIsLayerMenuOpen(false);
  };

  // Zoom In
  const handleZoomIn = () => {
    if (!mapRef.current) return;
    const current = mapRef.current.getZoom() || 13;
    mapRef.current.setZoom(current + 1);
  };

  // Zoom Out
  const handleZoomOut = () => {
    if (!mapRef.current) return;
    const current = mapRef.current.getZoom() || 13;
    mapRef.current.setZoom(current - 1);
  };

  // Geolocation (Locate Me with Full Screen Loading HUD)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocatingUser(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mapRef.current || !window.google?.maps) {
          setIsLocatingUser(false);
          return;
        }
        const coords = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        mapRef.current.panTo(coords);
        mapRef.current.setZoom(16);
        if (onMapCenterChangeRef.current) {
          onMapCenterChangeRef.current([pos.coords.longitude, pos.coords.latitude]);
        }
        setTimeout(() => {
          setIsLocatingUser(false);
        }, 450);
      },
      (err) => {
        console.warn('Geolocation failed or denied, centering on Hyderabad tech corridor', err);
        if (mapRef.current && window.google?.maps) {
          mapRef.current.panTo(new google.maps.LatLng(17.4474, 78.3820));
          mapRef.current.setZoom(14);
        }
        setIsLocatingUser(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Reset Orientation / Tilt
  const handleResetOrientation = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      if (center) mapRef.current.panTo(center);
    }
  };

  // Web Mercator screen pixel to Google Maps LatLng conversion
  const pixelToLatLng = (
    pixelX: number,
    pixelY: number,
    map: google.maps.Map,
    rect: DOMRect
  ): [number, number] => {
    const center = map.getCenter();
    const zoom = map.getZoom() || 13;
    if (!center) return [78.382, 17.447];

    const scale = 256 * Math.pow(2, zoom);
    const centerLng = center.lng();
    const centerLat = center.lat();

    const centerWorldX = ((centerLng + 180) / 360) * scale;
    const sinLat = Math.sin((centerLat * Math.PI) / 180);
    const clampedSin = Math.max(-0.9999, Math.min(0.9999, sinLat));
    const centerWorldY = (0.5 - Math.log((1 + clampedSin) / (1 - clampedSin)) / (4 * Math.PI)) * scale;

    const deltaX = pixelX - rect.width / 2;
    const deltaY = pixelY - rect.height / 2;

    const targetWorldX = centerWorldX + deltaX;
    const targetWorldY = centerWorldY + deltaY;

    const targetLng = (targetWorldX / scale) * 360 - 180;
    const n = Math.PI - (2 * Math.PI * targetWorldY) / scale;
    const targetLat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

    return [targetLng, targetLat];
  };

  // Custom Land Masking: Pointer Down
  const handleMaskPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const canvas = maskCanvasRef.current;
    if (!canvas) return;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (_) {}

    isMaskingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    pointerStartPosRef.current = { x, y };
    maskStrokePointsRef.current = [[x, y]];

    const ctx = canvas.getContext('2d');
    if (ctx && surveyDrawMode === 'freehand') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#059669';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Custom Land Masking: Pointer Move
  const handleMaskPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isMaskingRef.current) return;
    const canvas = maskCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (surveyDrawMode === 'freehand') {
      const pts = maskStrokePointsRef.current;
      pts.push([x, y]);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (pts.length > 1) {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i][0], pts[i][1]);
        }
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.fill();
        ctx.stroke();
      }
    } else if (surveyDrawMode === 'box') {
      const startPt = maskStrokePointsRef.current[0];
      if (!startPt) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
      const startX = Math.min(startPt[0], x);
      const startY = Math.min(startPt[1], y);
      const w = Math.abs(x - startPt[0]);
      const h = Math.abs(y - startPt[1]);
      ctx.fillRect(startX, startY, w, h);
      ctx.strokeRect(startX, startY, w, h);
    }
  };

  // Custom Land Masking: Pointer Up
  const handleMaskPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isMaskingRef.current) return;
    isMaskingRef.current = false;

    const canvas = maskCanvasRef.current;
    const map = mapRef.current;
    if (!canvas || !map) return;

    try {
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    } catch (_) {}

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const startPos = pointerStartPosRef.current || { x: currentX, y: currentY };
    const dragDistance = Math.hypot(currentX - startPos.x, currentY - startPos.y);

    let updatedCoords: [number, number][] = [];

    // Mode 1: Corner Pegs (point-and-click placement of vertices)
    if (surveyDrawMode === 'pegs' || (dragDistance < 6 && maskStrokePointsRef.current.length <= 3)) {
      if (surveyDrawMode === 'pegs') {
        const [clickLng, clickLat] = pixelToLatLng(currentX, currentY, map, rect);
        const existing = isDrawingLandForProperty ? landDrawCoordinates : (landSurvey?.points || []);
        updatedCoords = [...existing, [clickLng, clickLat]];
      }
    } else if (surveyDrawMode === 'box') {
      const startPt = maskStrokePointsRef.current[0];
      if (startPt) {
        const minX = Math.min(startPt[0], currentX);
        const maxX = Math.max(startPt[0], currentX);
        const minY = Math.min(startPt[1], currentY);
        const maxY = Math.max(startPt[1], currentY);

        if (maxX - minX > 8 && maxY - minY > 8) {
          const corners: [number, number][] = [
            [minX, minY],
            [maxX, minY],
            [maxX, maxY],
            [minX, maxY]
          ];
          updatedCoords = corners.map(([px, py]) => pixelToLatLng(px, py, map, rect));
        }
      }
    } else {
      // Mode 2: Freehand Mask (smooth mouse contour)
      const pts = maskStrokePointsRef.current;
      if (pts.length >= 3) {
        // Distance filter: min 6-7px between consecutive points to avoid clustering
        const filtered: [number, number][] = [pts[0]];
        for (let i = 1; i < pts.length; i++) {
          const last = filtered[filtered.length - 1];
          const dx = pts[i][0] - last[0];
          const dy = pts[i][1] - last[1];
          if (dx * dx + dy * dy >= 40) {
            filtered.push(pts[i]);
          }
        }
        if (filtered.length >= 3) {
          updatedCoords = filtered.map(([px, py]) => pixelToLatLng(px, py, map, rect));
        }
      }
    }

    if (updatedCoords.length > 0) {
      const metrics = computeLandSurveyMetrics(updatedCoords);
      if (isDrawingLandForProperty) {
        setLandDrawCoordinates(updatedCoords);
      }
      if (onLandSurveyChange) {
        onLandSurveyChange(metrics);
      }
    }

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSurveyUndo = () => {
    const existing = isDrawingLandForProperty ? landDrawCoordinates : (landSurvey?.points || []);
    const remaining = existing.slice(0, -1);
    const metrics = computeLandSurveyMetrics(remaining);

    if (isDrawingLandForProperty) {
      setLandDrawCoordinates(remaining);
    }
    if (onLandSurveyChange) {
      onLandSurveyChange(metrics);
    }
    if (maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    }
  };

  const handleSurveyClear = () => {
    setLandDrawCoordinates([]);
    maskStrokePointsRef.current = [];
    if (onLandSurveyChange) {
      onLandSurveyChange(computeLandSurveyMetrics([]));
    }
    if (maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    }
  };

  const handleSurveyClose = () => {
    if (isDrawingLandForProperty && onCancelListingBoundary) {
      onCancelListingBoundary();
    }
    if (onLandSurveyChange) {
      onLandSurveyChange({
        ...computeLandSurveyMetrics([]),
        active: false,
        isDrawing: false
      });
    }
  };

  return (
    <div className="w-full h-full absolute inset-0 overflow-hidden select-none">
      {/* 100% Viewport Google Map Canvas */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full absolute inset-0 z-0 ${
          isDroppingPin || polygonSearch.isDrawing || isDrawingLandForProperty
            ? 'cursor-crosshair touch-none select-none'
            : ''
        }`}
      />

      {/* Custom Draw & Mask Canvas for Agricultural Land & Land Boundary Surveyor */}
      {isSurveyActive && (
        <canvas
          ref={maskCanvasRef}
          className="absolute inset-0 z-10 cursor-crosshair touch-none select-none pointer-events-auto"
          onPointerDown={handleMaskPointerDown}
          onPointerMove={handleMaskPointerMove}
          onPointerUp={handleMaskPointerUp}
          onPointerCancel={handleMaskPointerUp}
        />
      )}

      {/* Load Error State */}
      {loadError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Google Maps SDK Notice</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {loadError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}

      {/* Selected Property Cadastral Land Boundary Indicator */}
      {selectedProperty?.boundaryPolygon && selectedProperty.boundaryPolygon.length >= 3 && !isDroppingPin && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-white text-slate-900 rounded-2xl shadow-xl border border-emerald-500/50 px-4 py-2 flex items-center gap-2.5 animate-in fade-in">
          <Ruler className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-800">Shaded Land Boundary:</span>
            <span className="font-extrabold text-emerald-700">
              {selectedProperty.landMetrics?.areaAcres ? `${selectedProperty.landMetrics.areaAcres.toFixed(2)} Acres` : 'Shaded Land Parcel'}
            </span>
            {selectedProperty.landMetrics?.areaGunthas ? (
              <span className="text-slate-500">({selectedProperty.landMetrics.areaGunthas.toFixed(1)} Gunthas)</span>
            ) : null}
          </div>
        </div>
      )}

      {/* GEOLOCATION LOADING SCREEN (Displays until current location is acquired) */}
      {isLocatingUser && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-3.5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto relative border border-blue-100">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-2xl bg-blue-400 opacity-25" />
              <Locate className="w-8 h-8 relative animate-pulse text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Locating Your Position</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Connecting to GPS sensor to acquire accurate coordinates and center your map view.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-blue-700 font-bold bg-blue-50 py-2 px-3 rounded-xl border border-blue-100">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Acquiring GPS lock...</span>
            </div>
          </div>
        </div>
      )}

      {/* AI POLYGON OVERLAY BANNER */}
      {aiPolygon && (
        <div className="absolute top-16 sm:top-20 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto z-20 pointer-events-auto bg-blue-50 text-blue-950 rounded-2xl shadow-xl border border-blue-200 p-2.5 flex items-center justify-between sm:justify-start gap-2 animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="text-xs font-bold truncate">
              AI Highlighted Zone: {aiPolygon.label || 'Selected Locality'}
            </span>
          </div>
          {onClearAIPolygon && (
            <button
              onClick={onClearAIPolygon}
              className="p-1 hover:bg-blue-100 rounded-lg text-slate-500 hover:text-slate-800 flex-shrink-0"
              title="Clear Highlight"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* RADIUS SEARCH CONTROL OVERLAY */}
      {radiusSearch.active && (
        <div className="absolute top-16 sm:top-20 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto z-20 pointer-events-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-2 sm:p-2.5 flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 animate-in fade-in overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-1.5 px-1 sm:px-2 text-xs font-bold text-slate-800 flex-shrink-0">
            <CircleDot className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="hidden sm:inline">Radius:</span>
          </div>
          <div className="flex items-center gap-1 flex-1 sm:flex-initial overflow-x-auto py-0.5">
            {[1, 2, 5, 10, 20].map((km) => (
              <button
                key={km}
                onClick={() => onRadiusChange({ ...radiusSearch, radiusKm: km })}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex-shrink-0 ${
                  radiusSearch.radiusKm === km
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {km}k
              </button>
            ))}
          </div>
          <button
            onClick={() => onRadiusChange({ ...radiusSearch, active: false })}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 ml-1 flex-shrink-0"
            title="Close Radius Search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* DRAW-TO-SEARCH POLYGON BANNER */}
      {polygonSearch.active && (
        <div className="absolute top-16 sm:top-20 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto z-20 pointer-events-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 sm:p-3 flex items-center justify-between gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <PenTool className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div className="text-xs min-w-0">
              <div className="font-bold text-slate-900 truncate">
                {polygonSearch.isDrawing
                  ? 'Click map to draw boundary'
                  : `Filtered in zone (${polygonSearch.coordinates.length} pts)`}
              </div>
              <div className="text-[10px] text-slate-500 hidden sm:block">
                {polygonSearch.isDrawing ? 'Drop 3 or more points to form shape' : 'Showing listings in custom drawn zone'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {polygonSearch.coordinates.length > 0 && polygonSearch.isDrawing && (
              <button
                type="button"
                onClick={() => {
                  const updated = polygonSearch.coordinates.slice(0, -1);
                  onPolygonChange({ ...polygonSearch, coordinates: updated });
                }}
                className="h-8 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 text-xs font-semibold transition-colors"
                title="Undo last point"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Undo</span>
              </button>
            )}

            {polygonSearch.coordinates.length >= 3 && polygonSearch.isDrawing && (
              <button
                onClick={() => onPolygonChange({ ...polygonSearch, isDrawing: false })}
                className="px-2.5 sm:px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>
            )}

            <button
              onClick={() => onPolygonChange({ active: false, isDrawing: false, coordinates: [] })}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Clear Drawn Area"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 
        LAND BOUNDARY SURVEYOR HUD (Unified for General Survey & Add Property Agricultural Land)
      */}
      {isSurveyActive && (
        <LandBoundarySurveyorHUD
          surveyState={{
            active: true,
            points: activeSurveyCoords,
            isDrawing: activeSurveyCoords.length < 3,
            ...liveLandMetrics
          }}
          onChange={(updatedState) => {
            if (isDrawingLandForProperty) {
              setLandDrawCoordinates(updatedState.points);
            }
            if (onLandSurveyChange) {
              onLandSurveyChange(updatedState);
            }
          }}
          drawMode={surveyDrawMode}
          onDrawModeChange={setSurveyDrawMode}
          onUndo={handleSurveyUndo}
          onClear={handleSurveyClear}
          onClose={handleSurveyClose}
          isListingMode={isDrawingLandForProperty}
          onSaveListingBoundary={() => {
            if (onSaveListingBoundary) {
              onSaveListingBoundary(activeSurveyCoords, liveLandMetrics);
            }
          }}
          onListThisLand={onListThisLand}
        />
      )}

      {/* DESKTOP GEOSPATIAL TOOLBAR (Hidden on Mobile) */}
      <div className="hidden sm:flex absolute right-4 bottom-10 z-20 flex-col gap-2 pointer-events-auto">
        {/* Radius Search Toggle */}
        <button
          onClick={() => {
            const center = mapRef.current?.getCenter();
            const coords: [number, number] = center ? [center.lng(), center.lat()] : [78.382, 17.447];
            onRadiusChange({
              active: !radiusSearch.active,
              center: coords,
              radiusKm: 5
            });
          }}
          title="Radius Search (1km, 5km, 10km)"
          className={`w-10 h-10 rounded-xl shadow-md flex items-center justify-center border transition-all active:scale-95 ${
            radiusSearch.active
              ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/25 ring-2 ring-blue-400/50'
              : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200'
          }`}
          aria-label="Radius search"
        >
          <CircleDot className="w-5 h-5" />
        </button>

        {/* Draw-to-Search Lasso Polygon */}
        <button
          onClick={() => {
            onPolygonChange({
              active: !polygonSearch.active,
              isDrawing: !polygonSearch.active,
              coordinates: []
            });
          }}
          title="Draw to Search Boundary Polygon"
          className={`w-10 h-10 rounded-xl shadow-md flex items-center justify-center border transition-all active:scale-95 ${
            polygonSearch.active
              ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/25 ring-2 ring-blue-400/50'
              : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200'
          }`}
          aria-label="Draw to search"
        >
          <PenTool className="w-5 h-5" />
        </button>

        {/* Land Boundary Surveyor (Cadastral Area & Contour Mapping) */}
        <button
          onClick={() => {
            if (landSurvey?.active) {
              handleSurveyClose();
            } else {
              if (polygonSearch.active) onPolygonChange({ active: false, isDrawing: false, coordinates: [] });
              if (radiusSearch.active) onRadiusChange({ ...radiusSearch, active: false });
              onLandSurveyChange?.(computeLandSurveyMetrics([]));
            }
          }}
          title="Land Boundary Surveyor (Cadastral Acre / Guntha Mapping)"
          className={`w-10 h-10 rounded-xl shadow-md flex items-center justify-center border transition-all active:scale-95 ${
            landSurvey?.active
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/25 ring-2 ring-emerald-400/50'
              : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200'
          }`}
          aria-label="Land boundary surveyor"
        >
          <Ruler className="w-5 h-5" />
        </button>

        {/* Layer Switcher (Roadmap / Satellite / Terrain / Hybrid) */}
        <div className="relative">
          <button
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            title="Switch Google Map Layer"
            className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-all active:scale-95"
            aria-label="Map layers"
          >
            <Layers className="w-5 h-5" />
          </button>

          {isLayerMenuOpen && (
            <div className="absolute right-12 bottom-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-30 animate-in fade-in">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1">
                Google Map Layer
              </div>
              <div className="space-y-1 mt-1">
                {[
                  { id: 'roadmap', name: 'Default Road Map', desc: 'Standard clean road navigation' },
                  { id: 'satellite', name: 'Satellite Imagery', desc: 'High-res aerial satellite photography' },
                  { id: 'hybrid', name: 'Hybrid View', desc: 'Satellite with street & landmark labels' },
                  { id: 'terrain', name: 'Terrain View', desc: 'Topographic contour elevation' }
                ].map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => handleSetMapType(layer.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex flex-col ${
                      activeMapTypeId === layer.id
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span>{layer.name}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{layer.desc}</span>
                  </button>
                ))}
              </div>

              {/* Overlays & Specialized Layers */}
              <div className="pt-2 mt-2 border-t border-slate-100 px-1 space-y-1">
                {/* Transit & Metro Lines */}
                <button
                  onClick={() => setShowTransitLayer(!showTransitLayer)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    showTransitLayer
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    <span>Metro & Transit Lines</span>
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    showTransitLayer ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {showTransitLayer ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Current Location button */}
        <button
          onClick={handleLocateMe}
          title="Current Location"
          className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-all active:scale-95"
          aria-label="Current Location"
        >
          <Locate className="w-5 h-5" />
        </button>

        {/* Reset Orientation */}
        <button
          onClick={handleResetOrientation}
          title="Reset Orientation"
          className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-all active:scale-95"
          aria-label="Reset orientation"
        >
          <Navigation className="w-4 h-4" />
        </button>

        {/* Zoom Controls group */}
        <div className="w-10 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
          <button
            onClick={handleZoomIn}
            title="Zoom in"
            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom out"
            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MOBILE FLOATING ACTION DOCK (Positioned bottom-right above bottom nav bar, NEVER clashing with top HUDs or searchbar) */}
      <div className="sm:hidden fixed right-3 bottom-20 z-20 flex flex-col items-center gap-2 pointer-events-auto transition-all duration-200">
        {/* Tools Menu FAB */}
        <button
          onClick={() => setIsMobileToolsOpen(true)}
          title="Map Tools & Layers"
          className={`w-10 h-10 rounded-xl shadow-md border flex items-center justify-center transition-all active:scale-95 relative ${
            isAnyToolActive
              ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/25 ring-2 ring-blue-400/50'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          aria-label="Map tools and layers"
        >
          <Wrench className="w-4 h-4" />
          {isAnyToolActive && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
          )}
        </button>

        {/* Current Location button */}
        <button
          onClick={handleLocateMe}
          title="Locate Me"
          className="w-10 h-10 bg-white text-slate-700 rounded-xl shadow-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
          aria-label="Locate me"
        >
          <Locate className="w-4 h-4" />
        </button>

        {/* Compass / Reset Orientation button */}
        <button
          onClick={handleResetOrientation}
          title="Reset Orientation"
          className="w-10 h-10 bg-white text-slate-700 rounded-xl shadow-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
          aria-label="Reset orientation"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>

      {/* MOBILE TOOLS & LAYERS BOTTOM SHEET */}
      {isMobileToolsOpen && (
        <>
          <div
            className="sm:hidden fixed inset-0 bg-slate-900/40 z-40 transition-opacity"
            onClick={() => setIsMobileToolsOpen(false)}
          />
          <div className="sm:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-5 pb-8 animate-in slide-in-from-bottom duration-200 space-y-4 max-h-[85dvh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Map Tools & View Modes</h4>
                  <p className="text-[11px] text-slate-500">Geospatial radius, boundary drawing, and layers</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileToolsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: Geospatial Discovery Tools */}
            <div>
              <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                Geospatial Discovery & Survey Tools
              </div>
              <div className="grid grid-cols-3 gap-2">
                {/* Radius Search */}
                <button
                  onClick={() => {
                    setIsMobileToolsOpen(false);
                    const center = mapRef.current?.getCenter();
                    const coords: [number, number] = center ? [center.lng(), center.lat()] : [78.382, 17.447];
                    onRadiusChange({
                      active: !radiusSearch.active,
                      center: coords,
                      radiusKm: 5
                    });
                  }}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 text-center transition-all ${
                    radiusSearch.active
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <CircleDot className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-bold leading-tight">Radius</span>
                  <span className="text-[9px] text-slate-400 font-medium">1–20 km</span>
                </button>

                {/* Draw-to-Search Lasso */}
                <button
                  onClick={() => {
                    setIsMobileToolsOpen(false);
                    onPolygonChange({
                      active: !polygonSearch.active,
                      isDrawing: !polygonSearch.active,
                      coordinates: []
                    });
                  }}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 text-center transition-all ${
                    polygonSearch.active
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <PenTool className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold leading-tight">Lasso</span>
                  <span className="text-[9px] text-slate-400 font-medium">Draw Area</span>
                </button>

                {/* Land Boundary Surveyor */}
                <button
                  onClick={() => {
                    setIsMobileToolsOpen(false);
                    if (polygonSearch.active) onPolygonChange({ active: false, isDrawing: false, coordinates: [] });
                    if (radiusSearch.active) onRadiusChange({ ...radiusSearch, active: false });
                    if (landSurvey?.active) {
                      handleSurveyClose();
                    } else {
                      onLandSurveyChange?.(computeLandSurveyMetrics([]));
                    }
                  }}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 text-center transition-all ${
                    landSurvey?.active
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <Ruler className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold leading-tight">Surveyor</span>
                  <span className="text-[9px] text-slate-400 font-medium">Acres & Gaj</span>
                </button>
              </div>
            </div>

            {/* Section 2: Map Base Layers */}
            <div>
              <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                Map Base Layers
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'roadmap', name: 'Road Map', desc: 'Standard street view' },
                  { id: 'satellite', name: 'Satellite', desc: 'Aerial photography' },
                  { id: 'hybrid', name: 'Hybrid', desc: 'Satellite with labels' },
                  { id: 'terrain', name: 'Terrain', desc: 'Topographic contour' }
                ].map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => {
                      handleSetMapType(layer.id);
                      setIsMobileToolsOpen(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-colors flex flex-col ${
                      activeMapTypeId === layer.id
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-medium'
                    }`}
                  >
                    <span className="text-xs font-bold">{layer.name}</span>
                    <span className="text-[10px] text-slate-400">{layer.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 3: Extra Toggles */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                onClick={() => {
                  setShowTransitLayer(!showTransitLayer);
                }}
                className={`w-full p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-colors ${
                  showTransitLayer
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-600" />
                  <span>Metro & Transit Lines</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold ${
                  showTransitLayer ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-600'
                }`}>
                  {showTransitLayer ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                onClick={() => {
                  handleResetOrientation();
                  setIsMobileToolsOpen(false);
                }}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-slate-600" />
                  <span>Reset Compass / North Orientation</span>
                </span>
                <span className="text-[10px] text-slate-400">0° Tilt</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GoogleMap;
