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
import { ClusterOverlayMarker, PropertyCluster } from './ClusterOverlayMarker';
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
  RotateCcw
} from 'lucide-react';

const GOOGLE_MAPS_DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#132838' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0f172a' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#334155' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1e293b' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }]
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#031738' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }]
  }
];

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
  // Theme
  theme?: 'dark' | 'light';
  // AI Bridge Overlays
  highlightedPropertyIds?: string[];
  aiPolygon?: { coordinates: [number, number][]; color?: string; label?: string } | null;
  onClearAIPolygon?: () => void;
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
  theme = 'light',
  highlightedPropertyIds = [],
  aiPolygon = null,
  onClearAIPolygon
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, CustomOverlayMarker>>(new Map());
  const clusterMarkersRef = useRef<ClusterOverlayMarker[]>([]);
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
  const [activeMapTypeId, setActiveMapTypeId] = useState<string>('roadmap');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [showTransitLayer, setShowTransitLayer] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);

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
          styles: theme === 'dark' ? GOOGLE_MAPS_DARK_STYLE : cleanStyle,
          backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc'
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

        // Track zoom level
        map.addListener('zoom_changed', () => {
          const z = map.getZoom() || 13;
          setCurrentZoom(z);
        });

        // Debounced bounds & center change on idle
        map.addListener('idle', () => {
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
      clusterMarkersRef.current.forEach((c) => c.remove());
      clusterMarkersRef.current = [];
      if (maskedPolygonOverlayRef.current) {
        maskedPolygonOverlayRef.current.setMap(null);
        maskedPolygonOverlayRef.current = null;
      }
      surveyorPegMarkersRef.current.forEach((m) => m.setMap(null));
      surveyorPegMarkersRef.current = [];
    };
  }, []);

  // Compute Clusters or Individual Markers depending on zoom level
  const { clusters, individualProperties } = useMemo(() => {
    // If zoom >= 13, show all individual markers
    if (currentZoom >= 13 || properties.length <= 3) {
      return { clusters: [], individualProperties: properties };
    }

    // Grid-based clustering at lower zooms (zoom < 13)
    const gridSize = currentZoom <= 10 ? 0.15 : currentZoom <= 11 ? 0.08 : 0.04;
    const grid = new Map<string, Property[]>();

    properties.forEach((p) => {
      const gridX = Math.floor(p.coordinates[0] / gridSize);
      const gridY = Math.floor(p.coordinates[1] / gridSize);
      const key = `${gridX}:${gridY}`;
      const list = grid.get(key) || [];
      list.push(p);
      grid.set(key, list);
    });

    const computedClusters: PropertyCluster[] = [];
    const singles: Property[] = [];

    grid.forEach((group, key) => {
      if (group.length === 1) {
        singles.push(group[0]);
      } else {
        let totalLng = 0;
        let totalLat = 0;
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        let hasSale = false;
        let hasRent = false;

        group.forEach((p) => {
          totalLng += p.coordinates[0];
          totalLat += p.coordinates[1];
          if (p.price < minPrice) minPrice = p.price;
          if (p.price > maxPrice) maxPrice = p.price;
          if (p.type === 'sale') hasSale = true;
          if (p.type === 'rent') hasRent = true;
        });

        computedClusters.push({
          id: `cluster-${key}`,
          coordinates: [totalLng / group.length, totalLat / group.length],
          properties: group,
          minPrice,
          maxPrice,
          type: hasSale && hasRent ? 'mixed' : hasRent ? 'rent' : 'sale'
        });
      }
    });

    return { clusters: computedClusters, individualProperties: singles };
  }, [properties, currentZoom]);

  // Synchronize Individual Markers & AI Highlights
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || typeof window === 'undefined' || !window.google?.maps) return;

    const currentMarkerIds = new Set<string>();

    individualProperties.forEach((prop) => {
      currentMarkerIds.add(prop.id);
      const isSelected = selectedProperty?.id === prop.id;
      const isHighlighted = highlightedPropertyIds.includes(prop.id);

      let marker = markersRef.current.get(prop.id);

      if (!marker) {
        marker = new CustomOverlayMarker(prop, map, isSelected, (clickedProp) => {
          onSelectProperty(clickedProp);

          const [lng, lat] = clickedProp.coordinates;
          map.panTo(new google.maps.LatLng(lat, lng));
        });

        markersRef.current.set(prop.id, marker);
      } else {
        marker.setSelected(isSelected);
        marker.setHighlighted(isHighlighted);
      }
    });

    // Remove markers no longer active
    markersRef.current.forEach((marker, id) => {
      if (!currentMarkerIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });
  }, [individualProperties, selectedProperty, highlightedPropertyIds, mapLoaded, onSelectProperty]);

  // Synchronize Cluster Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || typeof window === 'undefined' || !window.google?.maps) return;

    clusterMarkersRef.current.forEach((c) => c.remove());
    clusterMarkersRef.current = [];

    clusters.forEach((cl) => {
      const clusterMarker = new ClusterOverlayMarker(cl, map, (clickedCluster) => {
        const [lng, lat] = clickedCluster.coordinates;
        map.panTo(new google.maps.LatLng(lat, lng));
        map.setZoom(Math.min(18, (map.getZoom() || 12) + 2));
      });
      clusterMarkersRef.current.push(clusterMarker);
    });
  }, [clusters, mapLoaded]);

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

  // Synchronize Google Maps styling with Dark / Light Theme
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !window.google?.maps) return;
    (map as any).setOptions({
      styles: theme === 'dark' ? GOOGLE_MAPS_DARK_STYLE : CLEAN_LIGHT_STYLE,
      backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc'
    });
  }, [theme, mapLoaded]);

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

  // Geolocation (Locate Me)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mapRef.current || !window.google?.maps) return;
        const coords = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        mapRef.current.panTo(coords);
        mapRef.current.setZoom(15);
      },
      (err) => {
        console.warn('Geolocation failed or denied, centering on Hyderabad tech corridor', err);
        if (mapRef.current && window.google?.maps) {
          mapRef.current.panTo(new google.maps.LatLng(17.4474, 78.3820));
          mapRef.current.setZoom(14);
        }
      },
      { timeout: 7000 }
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
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
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
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-slate-900/95 text-white backdrop-blur-md rounded-2xl shadow-xl border border-emerald-500/80 px-4 py-2 flex items-center gap-2.5 animate-in fade-in">
          <Ruler className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-white">Shaded Land Boundary:</span>
            <span className="font-extrabold text-emerald-400">
              {selectedProperty.landMetrics?.areaAcres ? `${selectedProperty.landMetrics.areaAcres.toFixed(2)} Acres` : 'Shaded Land Parcel'}
            </span>
            {selectedProperty.landMetrics?.areaGunthas ? (
              <span className="text-slate-400">({selectedProperty.landMetrics.areaGunthas.toFixed(1)} Gunthas)</span>
            ) : null}
          </div>
        </div>
      )}

      {/* AI POLYGON OVERLAY BANNER */}
      {aiPolygon && (
        <div className="absolute top-16 sm:top-20 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto z-20 pointer-events-auto bg-blue-900/90 text-white backdrop-blur-md rounded-2xl shadow-xl border border-blue-600 p-2.5 flex items-center justify-between sm:justify-start gap-2 animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-xs font-bold truncate">
              AI Highlighted Zone: {aiPolygon.label || 'Selected Locality'}
            </span>
          </div>
          {onClearAIPolygon && (
            <button
              onClick={onClearAIPolygon}
              className="p-1 hover:bg-blue-800 rounded-lg text-slate-300 hover:text-white flex-shrink-0"
              title="Clear Highlight"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* RADIUS SEARCH CONTROL OVERLAY */}
      {radiusSearch.active && (
        <div className="absolute top-16 sm:top-20 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto z-20 pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-2 sm:p-2.5 flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 animate-in fade-in overflow-x-auto">
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
        <div className="absolute top-16 sm:top-20 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto z-20 pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-2.5 sm:p-3 flex items-center justify-between gap-2.5 animate-in fade-in">
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

      {/* DESKTOP GEOSPATIAL TOOLBAR (Flat Architectural Dock) */}
      <div className="hidden sm:flex absolute right-4 bottom-10 z-20 flex-col gap-2 pointer-events-auto">
        {/* Toolset 1: Spatial discovery & surveying */}
        <div className="flex flex-col bg-[#fbf9f6] dark:bg-[#181716] rounded-xs border border-[#e7e5e4] dark:border-[#292524] divide-y divide-[#e7e5e4] dark:divide-[#292524] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {/* Radius Search */}
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
            title="Search radius"
            className={`w-9 h-9 flex items-center justify-center transition-colors ${
              radiusSearch.active
                ? 'bg-[#1c1917] dark:bg-[#f5f5f4] text-[#fbf9f6] dark:text-[#1c1917]'
                : 'text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4]'
            }`}
            aria-label="Radius search"
          >
            <CircleDot className="w-4 h-4" />
          </button>

          {/* Draw Boundary (Lasso) */}
          <button
            onClick={() => {
              onPolygonChange({
                active: !polygonSearch.active,
                isDrawing: !polygonSearch.active,
                coordinates: []
              });
            }}
            title="Draw boundary"
            className={`w-9 h-9 flex items-center justify-center transition-colors ${
              polygonSearch.active
                ? 'bg-[#1c1917] dark:bg-[#f5f5f4] text-[#fbf9f6] dark:text-[#1c1917]'
                : 'text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4]'
            }`}
            aria-label="Draw boundary"
          >
            <PenTool className="w-4 h-4" />
          </button>

          {/* Survey Land */}
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
            title="Survey land"
            className={`w-9 h-9 flex items-center justify-center transition-colors ${
              landSurvey?.active
                ? 'bg-[#8b3a24] text-white'
                : 'text-[#78716c] hover:text-[#8b3a24] dark:hover:text-[#f5f5f4]'
            }`}
            aria-label="Survey land"
          >
            <Ruler className="w-4 h-4" />
          </button>
        </div>

        {/* Toolset 2: View modes & navigation */}
        <div className="flex flex-col bg-[#fbf9f6] dark:bg-[#181716] rounded-xs border border-[#e7e5e4] dark:border-[#292524] divide-y divide-[#e7e5e4] dark:divide-[#292524] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {/* Layer Menu */}
          <div className="relative">
            <button
              onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
              title="Layers"
              className={`w-9 h-9 flex items-center justify-center transition-colors ${
                isLayerMenuOpen
                  ? 'bg-[#f5f2eb] dark:bg-[#211f1d] text-[#1c1917] dark:text-[#f5f5f4]'
                  : 'text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4]'
              }`}
              aria-label="Layers"
            >
              <Layers className="w-4 h-4" />
            </button>

            {isLayerMenuOpen && (
              <div className="absolute right-11 bottom-0 w-56 bg-[#fbf9f6] dark:bg-[#181716] rounded-xs border border-[#e7e5e4] dark:border-[#292524] shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-2 z-30 animate-in fade-in duration-100">
                <div className="text-[10px] uppercase font-mono tracking-widest text-[#78716c] px-2 py-1">
                  Base map
                </div>
                <div className="space-y-0.5 mt-1">
                  {[
                    { id: 'roadmap', name: 'Roads', desc: 'Standard street layout' },
                    { id: 'satellite', name: 'Satellite', desc: 'Aerial photography' },
                    { id: 'hybrid', name: 'Hybrid', desc: 'Satellite with labels' },
                    { id: 'terrain', name: 'Topography', desc: 'Contour elevation' }
                  ].map((layer) => (
                    <button
                      key={layer.id}
                      onClick={() => handleSetMapType(layer.id)}
                      className={`w-full text-left px-2 py-1.5 rounded-xs text-xs transition-colors flex items-center justify-between ${
                        activeMapTypeId === layer.id
                          ? 'bg-[#1c1917] dark:bg-[#f5f5f4] text-[#fbf9f6] dark:text-[#1c1917] font-medium'
                          : 'text-[#1c1917] dark:text-[#f5f5f4] hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d]'
                      }`}
                    >
                      <span>{layer.name}</span>
                      <span className="text-[10px] font-mono opacity-60">{layer.desc}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 mt-2 border-t border-[#e7e5e4] dark:border-[#292524] px-1">
                  <button
                    onClick={() => setShowTransitLayer(!showTransitLayer)}
                    className="w-full px-2 py-1.5 rounded-xs text-xs font-medium flex items-center justify-between text-[#1c1917] dark:text-[#f5f5f4] hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d] transition-colors"
                  >
                    <span>Transit routes</span>
                    <span className="font-mono text-[10px] text-[#8b3a24]">
                      {showTransitLayer ? 'Visible' : 'Hidden'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Current Location */}
          <button
            onClick={handleLocateMe}
            title="My location"
            className="w-9 h-9 flex items-center justify-center text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4] transition-colors"
            aria-label="My location"
          >
            <Locate className="w-4 h-4" />
          </button>

          {/* Reset Orientation */}
          <button
            onClick={handleResetOrientation}
            title="North"
            className="w-9 h-9 flex items-center justify-center text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4] transition-colors"
            aria-label="North"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            title="Zoom in"
            className="w-9 h-9 flex items-center justify-center text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4] transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            title="Zoom out"
            className="w-9 h-9 flex items-center justify-center text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4] transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MOBILE FLOATING ACTION DOCK (Flat Docked Controls) */}
      <div className={`sm:hidden absolute right-3 z-20 flex flex-col items-center gap-1.5 pointer-events-auto transition-all duration-200 ${
        isAnyToolActive ? 'top-28' : 'top-16'
      }`}>
        <div className="flex flex-col bg-[#fbf9f6] dark:bg-[#181716] rounded-xs border border-[#e7e5e4] dark:border-[#292524] divide-y divide-[#e7e5e4] dark:divide-[#292524] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {/* Tools Menu Trigger */}
          <button
            onClick={() => setIsMobileToolsOpen(true)}
            title="Tools"
            className={`w-9 h-9 flex items-center justify-center transition-colors ${
              isAnyToolActive
                ? 'bg-[#8b3a24] text-white'
                : 'text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4]'
            }`}
            aria-label="Tools"
          >
            <Wrench className="w-4 h-4" />
          </button>

          {/* Current Location */}
          <button
            onClick={handleLocateMe}
            title="My location"
            className="w-9 h-9 flex items-center justify-center text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4] transition-colors"
            aria-label="My location"
          >
            <Locate className="w-4 h-4" />
          </button>

          {/* Reset Orientation */}
          <button
            onClick={handleResetOrientation}
            title="North"
            className="w-9 h-9 flex items-center justify-center text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4] transition-colors"
            aria-label="North"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* MOBILE TOOLS & LAYERS BOTTOM SHEET */}
      {isMobileToolsOpen && (
        <>
          <div
            className="sm:hidden fixed inset-0 bg-[#181716]/60 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setIsMobileToolsOpen(false)}
          />
          <div className="sm:hidden fixed inset-x-0 bottom-0 z-50 bg-[#fbf9f6] dark:bg-[#181716] text-[#1c1917] dark:text-[#f5f5f4] border-t border-[#e7e5e4] dark:border-[#292524] p-4 pb-7 animate-in slide-in-from-bottom duration-150 space-y-4 max-h-[85dvh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#e7e5e4] dark:border-[#292524] pb-2.5">
              <div>
                <h4 className="text-xs uppercase font-mono tracking-widest text-[#1c1917] dark:text-[#f5f5f4]">Map tools & view</h4>
                <p className="text-[11px] text-[#78716c]">Spatial filters, survey mode, and layers</p>
              </div>
              <button
                onClick={() => setIsMobileToolsOpen(false)}
                className="p-1 text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Section 1: Geospatial Tools */}
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-[#78716c] mb-2">
                Spatial tools
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {/* Radius */}
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
                  className={`p-2 rounded-xs border text-center transition-colors flex flex-col items-center gap-1 ${
                    radiusSearch.active
                      ? 'bg-[#1c1917] dark:bg-[#f5f5f4] text-[#fbf9f6] dark:text-[#1c1917] border-[#1c1917]'
                      : 'border-[#e7e5e4] dark:border-[#292524] text-[#1c1917] dark:text-[#f5f5f4] hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d]'
                  }`}
                >
                  <CircleDot className="w-4 h-4" />
                  <span className="text-xs font-medium">Radius</span>
                  <span className="text-[9px] opacity-60 font-mono">1–20 km</span>
                </button>

                {/* Lasso */}
                <button
                  onClick={() => {
                    setIsMobileToolsOpen(false);
                    onPolygonChange({
                      active: !polygonSearch.active,
                      isDrawing: !polygonSearch.active,
                      coordinates: []
                    });
                  }}
                  className={`p-2 rounded-xs border text-center transition-colors flex flex-col items-center gap-1 ${
                    polygonSearch.active
                      ? 'bg-[#1c1917] dark:bg-[#f5f5f4] text-[#fbf9f6] dark:text-[#1c1917] border-[#1c1917]'
                      : 'border-[#e7e5e4] dark:border-[#292524] text-[#1c1917] dark:text-[#f5f5f4] hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d]'
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                  <span className="text-xs font-medium">Boundary</span>
                  <span className="text-[9px] opacity-60 font-mono">Freeform</span>
                </button>

                {/* Surveyor */}
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
                  className={`p-2 rounded-xs border text-center transition-colors flex flex-col items-center gap-1 ${
                    landSurvey?.active
                      ? 'bg-[#8b3a24] text-white border-[#8b3a24]'
                      : 'border-[#e7e5e4] dark:border-[#292524] text-[#1c1917] dark:text-[#f5f5f4] hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d]'
                  }`}
                >
                  <Ruler className="w-4 h-4" />
                  <span className="text-xs font-medium">Surveyor</span>
                  <span className="text-[9px] opacity-60 font-mono">Acreage</span>
                </button>
              </div>
            </div>

            {/* Section 2: Layers */}
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-[#78716c] mb-2">
                Base map
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'roadmap', name: 'Roads', desc: 'Street layout' },
                  { id: 'satellite', name: 'Satellite', desc: 'Aerial imagery' },
                  { id: 'hybrid', name: 'Hybrid', desc: 'Satellite + roads' },
                  { id: 'terrain', name: 'Topography', desc: 'Elevation contours' }
                ].map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => {
                      handleSetMapType(layer.id);
                      setIsMobileToolsOpen(false);
                    }}
                    className={`p-2 rounded-xs border text-left transition-colors flex items-center justify-between ${
                      activeMapTypeId === layer.id
                        ? 'bg-[#1c1917] dark:bg-[#f5f5f4] text-[#fbf9f6] dark:text-[#1c1917] border-[#1c1917] font-medium'
                        : 'border-[#e7e5e4] dark:border-[#292524] text-[#1c1917] dark:text-[#f5f5f4] hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d]'
                    }`}
                  >
                    <span className="text-xs">{layer.name}</span>
                    <span className="text-[10px] font-mono opacity-60">{layer.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 3: Toggles */}
            <div className="pt-2 border-t border-[#e7e5e4] dark:border-[#292524] space-y-1.5">
              <button
                onClick={() => setShowTransitLayer(!showTransitLayer)}
                className="w-full p-2.5 rounded-xs border border-[#e7e5e4] dark:border-[#292524] text-xs font-medium flex items-center justify-between text-[#1c1917] dark:text-[#f5f5f4] hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d] transition-colors"
              >
                <span>Transit routes</span>
                <span className="font-mono text-[10px] text-[#8b3a24]">
                  {showTransitLayer ? 'Visible' : 'Hidden'}
                </span>
              </button>

              <button
                onClick={() => {
                  handleResetOrientation();
                  setIsMobileToolsOpen(false);
                }}
                className="w-full p-2.5 rounded-xs border border-[#e7e5e4] dark:border-[#292524] text-xs font-medium text-[#1c1917] dark:text-[#f5f5f4] hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d] flex items-center justify-between transition-colors"
              >
                <span>Reset to North</span>
                <span className="text-[10px] font-mono opacity-60">0° Tilt</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GoogleMap;
