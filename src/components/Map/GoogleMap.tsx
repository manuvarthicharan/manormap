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
import { calculateLandParcelMetrics } from '../../services/propertyService';
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
  X,
  Trash2,
  Check,
  Sparkles,
  Wrench,
  Flame,
  RotateCcw
} from 'lucide-react';
import { HeatmapLegendHUD } from './HeatmapLegendHUD';
import { LandBoundarySurveyorHUD } from './LandBoundarySurveyorHUD';
import {
  HeatmapMetric,
  buildHeatmapWeightedPoints,
  PRICE_HEATMAP_GRADIENT,
  getHeatmapRadius
} from '../../services/landPriceHeatmapService';

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
  // Land Surveyor & Agricultural Land Mapping
  landSurvey: LandSurveyState;
  onLandSurveyChange: (state: LandSurveyState) => void;
  isDrawingLandForProperty?: boolean;
  onSaveListingBoundary?: () => void;
  onCancelListingBoundary?: () => void;
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
  landSurvey,
  onLandSurveyChange,
  isDrawingLandForProperty = false,
  onSaveListingBoundary,
  onCancelListingBoundary,
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
  const surveyorPolygonRef = useRef<google.maps.Polygon | null>(null);
  const surveyorPolylineRef = useRef<google.maps.Polyline | null>(null);
  const surveyorPegMarkersRef = useRef<google.maps.Marker[]>([]);
  const allPropertyBoundariesRef = useRef<Map<string, google.maps.Polygon>>(new Map());
  const transitLayerRef = useRef<any>(null);
  const heatmapLayerRef = useRef<any>(null);
  const aiPolygonOverlayRef = useRef<google.maps.Polygon | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(13);
  const [activeMapTypeId, setActiveMapTypeId] = useState<string>('roadmap');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [showTransitLayer, setShowTransitLayer] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>('sqft');
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);

  // Dynamic relative pricing calculation across active properties & regional benchmarks
  const { points: heatmapDataPoints, stats: heatmapStats } = useMemo(() => {
    return buildHeatmapWeightedPoints(properties, heatmapMetric);
  }, [properties, heatmapMetric]);

  const isAnyToolActive = radiusSearch.active || polygonSearch.active || landSurvey.active || isDrawingLandForProperty;

  // Keep live refs for callbacks to prevent stale closures
  const isDroppingPinRef = useRef(isDroppingPin);
  isDroppingPinRef.current = isDroppingPin;

  const onMapCenterChangeRef = useRef(onMapCenterChange);
  onMapCenterChangeRef.current = onMapCenterChange;

  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;

  const landSurveyRef = useRef(landSurvey);
  landSurveyRef.current = landSurvey;

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

        const handleAddSurveyPoint = (latLng: any) => {
          if (!latLng) return;
          const newPt: [number, number] = [latLng.lng(), latLng.lat()];
          const updatedPts = [...landSurveyRef.current.points, newPt];
          const metrics = calculateLandParcelMetrics(updatedPts);
          onLandSurveyChange({
            ...landSurveyRef.current,
            ...metrics,
            active: true,
            isDrawing: true, // EXPLICITLY KEEP isDrawing: true so user can add 4, 5, 6, 7, 8... unlimited nodes!
            points: updatedPts
          });
        };

        // Click on map: handle interaction based on active mode
        map.addListener('click', (e: any) => {
          if (isDroppingPinRef.current && e.latLng) {
            map.panTo(e.latLng);
            return;
          }

          // Land Surveyor / Agricultural Land Mapping mode click
          const isSurveying = isDrawingLandForPropertyRef.current || (landSurveyRef.current.active && landSurveyRef.current.isDrawing);
          if (isSurveying && e.latLng) {
            handleAddSurveyPoint(e.latLng);
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

  // Land Price & Cost of Living Heatmap Layer (Google Maps visualization.HeatmapLayer)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || typeof window === 'undefined' || !window.google?.maps) return;

    try {
      const maps = window.google.maps;
      const viz = (maps as any).visualization;
      if (!viz || !viz.HeatmapLayer) {
        console.warn('Google Maps visualization library not ready');
        return;
      }

      if (showHeatmap && heatmapDataPoints.length > 0) {
        // Strictly filter valid numeric coordinates
        const validPoints = heatmapDataPoints.filter(
          (pt) => typeof pt.lat === 'number' && typeof pt.lng === 'number' && !isNaN(pt.lat) && !isNaN(pt.lng)
        );

        const googleWeightedData = validPoints.map((pt) => ({
          location: new maps.LatLng(pt.lat, pt.lng),
          weight: Math.max(0.1, Math.min(10, isNaN(pt.weight) ? 1 : pt.weight))
        }));

        if (!heatmapLayerRef.current) {
          heatmapLayerRef.current = new viz.HeatmapLayer({
            data: googleWeightedData,
            dissipating: true,
            radius: getHeatmapRadius(currentZoom),
            opacity: 0.8,
            maxIntensity: 10,
            gradient: PRICE_HEATMAP_GRADIENT,
            map: map
          });
        } else {
          heatmapLayerRef.current.setData(googleWeightedData);
          heatmapLayerRef.current.setOptions({
            radius: getHeatmapRadius(currentZoom),
            gradient: PRICE_HEATMAP_GRADIENT,
            opacity: 0.8,
            maxIntensity: 10,
            dissipating: true
          });
          heatmapLayerRef.current.setMap(map);
        }
      } else if (heatmapLayerRef.current) {
        heatmapLayerRef.current.setMap(null);
      }
    } catch (err) {
      console.error('Error handling Google Maps HeatmapLayer:', err);
    }
  }, [showHeatmap, heatmapDataPoints, currentZoom, mapLoaded]);

  // Unmount cleanup for Heatmap Layer
  useEffect(() => {
    return () => {
      if (heatmapLayerRef.current) {
        heatmapLayerRef.current.setMap(null);
        heatmapLayerRef.current = null;
      }
    };
  }, []);

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

        const isSurveyingMode = isDrawingLandForProperty || landSurvey.active || polygonSearch.active;
        const clickable = !isSurveyingMode;

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
            if (!isDrawingLandForPropertyRef.current && !landSurveyRef.current.active) {
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
  }, [properties, selectedProperty, hoveredPropertyId, isDrawingLandForProperty, landSurvey.active, mapLoaded]);

  // Land Surveyor Tool Polygons & Multi-Node Vertex Pegs
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !window.google?.maps) return;

    const isSurveyActive = landSurvey.active || isDrawingLandForProperty;

    const forwardSurveyClick = (e: any) => {
      if (e && e.latLng) {
        const newPt: [number, number] = [e.latLng.lng(), e.latLng.lat()];
        const updatedPts = [...landSurveyRef.current.points, newPt];
        const metrics = calculateLandParcelMetrics(updatedPts);
        onLandSurveyChange({
          ...landSurveyRef.current,
          ...metrics,
          active: true,
          isDrawing: true,
          points: updatedPts
        });
      }
    };

    if (isSurveyActive && landSurvey.points.length > 0) {
      const paths = landSurvey.points.map((p) => new google.maps.LatLng(p[1], p[0]));

      // 1. Shaded Polygon when >= 3 points (clickable: true with click forwarder so clicks ALWAYS register for 4th, 5th, 6th... unlimited nodes!)
      if (landSurvey.points.length >= 3) {
        if (!surveyorPolygonRef.current) {
          surveyorPolygonRef.current = new google.maps.Polygon({
            paths: paths,
            fillColor: '#10b981',
            fillOpacity: 0.25,
            strokeColor: '#059669',
            strokeOpacity: 1,
            strokeWeight: 3,
            clickable: true,
            map: map
          });
          surveyorPolygonRef.current.addListener('click', forwardSurveyClick);
        } else {
          surveyorPolygonRef.current.setPaths(paths);
          surveyorPolygonRef.current.setOptions({ clickable: true });
          surveyorPolygonRef.current.setMap(map);
        }
        if (surveyorPolylineRef.current) {
          surveyorPolylineRef.current.setMap(null);
        }
      } else {
        if (!surveyorPolylineRef.current) {
          surveyorPolylineRef.current = new google.maps.Polyline({
            path: paths,
            strokeColor: '#059669',
            strokeOpacity: 1,
            strokeWeight: 3,
            clickable: true,
            map: map
          });
          surveyorPolylineRef.current.addListener('click', forwardSurveyClick);
        } else {
          surveyorPolylineRef.current.setPath(paths);
          surveyorPolylineRef.current.setOptions({ clickable: true });
          surveyorPolylineRef.current.setMap(map);
        }
        if (surveyorPolygonRef.current) {
          surveyorPolygonRef.current.setMap(null);
        }
      }

      // 2. Render numbered vertex peg markers at each coordinate
      // Clear previous pegs
      surveyorPegMarkersRef.current.forEach((m) => m.setMap(null));
      surveyorPegMarkersRef.current = [];

      landSurvey.points.forEach((pt, idx) => {
        const marker = new google.maps.Marker({
          position: new google.maps.LatLng(pt[1], pt[0]),
          map: map,
          label: {
            text: String(idx + 1),
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 'bold'
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#059669',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          },
          zIndex: 200,
          clickable: true
        });
        marker.addListener('click', forwardSurveyClick);
        surveyorPegMarkersRef.current.push(marker);
      });
    } else {
      if (surveyorPolygonRef.current) surveyorPolygonRef.current.setMap(null);
      if (surveyorPolylineRef.current) surveyorPolylineRef.current.setMap(null);
      surveyorPegMarkersRef.current.forEach((m) => m.setMap(null));
      surveyorPegMarkersRef.current = [];
    }
  }, [landSurvey, isDrawingLandForProperty, mapLoaded]);

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

  // Land Surveyor handlers
  const handleSurveyUndo = () => {
    if (landSurvey.points.length === 0) return;
    const updated = landSurvey.points.slice(0, -1);
    const metrics = calculateLandParcelMetrics(updated);
    onLandSurveyChange({
      ...landSurvey,
      ...metrics,
      points: updated
    });
  };

  const handleSurveyClear = () => {
    const cleared = calculateLandParcelMetrics([]);
    onLandSurveyChange({
      ...landSurvey,
      ...cleared,
      points: []
    });
  };

  const handleSurveyClose = () => {
    if (isDrawingLandForProperty && onCancelListingBoundary) {
      onCancelListingBoundary();
    } else {
      onLandSurveyChange({
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
    }
  };

  return (
    <div className="w-full h-full absolute inset-0 overflow-hidden select-none">
      {/* 100% Viewport Google Map Canvas */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full absolute inset-0 z-0 ${
          isDroppingPin || landSurvey.isDrawing || polygonSearch.isDrawing || isDrawingLandForProperty
            ? 'cursor-crosshair'
            : ''
        }`}
      />

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
            <span className="font-bold text-white">Cadastral Boundary:</span>
            <span className="font-extrabold text-emerald-400">
              {selectedProperty.landMetrics?.areaAcres ? `${selectedProperty.landMetrics.areaAcres.toFixed(2)} Acres` : 'Surveyed Parcel'}
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
        LAND BOUNDARY SURVEYOR HEADS-UP DISPLAY (Unified Modern SaaS Command Bar)
        Used for both general map parcel survey and agricultural land listing
      */}
      {(landSurvey.active || isDrawingLandForProperty) && (
        <LandBoundarySurveyorHUD
          surveyState={landSurvey}
          onChange={onLandSurveyChange}
          onUndo={handleSurveyUndo}
          onClear={handleSurveyClear}
          onClose={handleSurveyClose}
          isListingMode={isDrawingLandForProperty}
          onSaveListingBoundary={onSaveListingBoundary}
          onListThisLand={onListThisLand}
        />
      )}

      {/* DESKTOP GEOSPATIAL TOOLBAR (Hidden on Mobile) */}
      <div className="hidden sm:flex absolute right-4 bottom-12 z-20 flex-col gap-2 pointer-events-auto">
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
          className={`w-10 h-10 rounded-xl shadow-sm flex items-center justify-center border transition-colors active:scale-95 ${
            radiusSearch.active
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
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
          className={`w-10 h-10 rounded-xl shadow-sm flex items-center justify-center border transition-colors active:scale-95 ${
            polygonSearch.active
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200'
          }`}
          aria-label="Draw to search"
        >
          <PenTool className="w-5 h-5" />
        </button>

        {/* Land Boundary Surveyor */}
        <button
          onClick={() => {
            onLandSurveyChange({
              active: !landSurvey.active,
              isDrawing: !landSurvey.active,
              points: [],
              areaSqYards: 0,
              areaGunthas: 0,
              areaAcres: 0,
              areaSqFt: 0,
              areaSqMeters: 0,
              perimeterMeters: 0
            });
          }}
          title="Land Parcel Boundary Surveyor (Gaj, Gunthas, Acres)"
          className={`w-10 h-10 rounded-xl shadow-sm flex items-center justify-center border transition-colors active:scale-95 ${
            landSurvey.active
              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
              : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200'
          }`}
          aria-label="Land surveyor"
        >
          <Ruler className="w-5 h-5" />
        </button>

        {/* Land Price & Cost of Living Heatmap Toggle */}
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          title="Land Price & Cost of Living Heatmap (Red, Orange, Yellow, Green)"
          className={`w-10 h-10 rounded-xl shadow-sm flex items-center justify-center border transition-all active:scale-95 ${
            showHeatmap
              ? 'bg-gradient-to-tr from-amber-500 to-rose-600 text-white border-rose-400 shadow-md shadow-rose-500/25 ring-2 ring-rose-300'
              : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200'
          }`}
          aria-label="Land price heatmap"
        >
          <Flame className={`w-5 h-5 ${showHeatmap ? 'fill-white animate-pulse' : 'text-amber-500'}`} />
        </button>

        {/* Layer Switcher (Roadmap / Satellite / Terrain / Hybrid) */}
        <div className="relative">
          <button
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            title="Switch Google Map Layer"
            className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-colors active:scale-95"
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
                {/* Land Price & Cost of Living Heatmap */}
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    showHeatmap
                      ? 'bg-rose-50 text-rose-900 font-bold border border-rose-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'text-rose-600 fill-rose-600' : 'text-amber-500'}`} />
                    <span>Land Price Heatmap</span>
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold ${
                    showHeatmap ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {showHeatmap ? 'ON' : 'OFF'}
                  </span>
                </button>

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
          className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-colors active:scale-95"
          aria-label="Current Location"
        >
          <Locate className="w-5 h-5" />
        </button>

        {/* Reset Orientation */}
        <button
          onClick={handleResetOrientation}
          title="Reset Orientation"
          className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-colors active:scale-95"
          aria-label="Reset orientation"
        >
          <Navigation className="w-4 h-4" />
        </button>

        {/* Zoom Controls group */}
        <div className="w-10 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
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

      {/* MOBILE FLOATING ACTION DOCK (Positioned top-right under header, NEVER clashing with bottom cards) */}
      <div className={`sm:hidden absolute right-3 z-20 flex flex-col items-center gap-2 pointer-events-auto transition-all duration-200 ${
        isAnyToolActive ? 'top-28' : 'top-16'
      }`}>
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
            className="sm:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity"
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
                Geospatial Search Tools
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
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition-all ${
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
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition-all ${
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
                    onLandSurveyChange({
                      active: !landSurvey.active,
                      isDrawing: !landSurvey.active,
                      points: [],
                      areaSqYards: 0,
                      areaGunthas: 0,
                      areaAcres: 0,
                      areaSqFt: 0,
                      areaSqMeters: 0,
                      perimeterMeters: 0
                    });
                  }}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                    landSurvey.active
                      ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <Ruler className="w-5 h-5 text-amber-600" />
                  <span className="text-xs font-bold leading-tight">Surveyor</span>
                  <span className="text-[9px] text-slate-400 font-medium">Gaj & Acres</span>
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
              {/* Land Price & Cost of Living Heatmap Card */}
              <button
                onClick={() => {
                  setShowHeatmap(!showHeatmap);
                }}
                className={`w-full p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                  showHeatmap
                    ? 'bg-gradient-to-r from-amber-50 to-rose-50 border-rose-300 text-rose-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    showHeatmap
                      ? 'bg-gradient-to-tr from-amber-500 to-rose-600 text-white shadow-xs'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    <Flame className="w-4 h-4 fill-current" />
                  </div>
                  <div className="text-left">
                    <div className="font-extrabold text-slate-900">Land Price Heatmap</div>
                    <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                      <span>🟢 Affordable</span>
                      <span>🟡 Balanced</span>
                      <span>🟠 High</span>
                      <span>🔴 Peak</span>
                    </div>
                  </div>
                </div>

                <span className={`text-[10px] px-2.5 py-1 rounded-lg font-extrabold ${
                  showHeatmap ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {showHeatmap ? 'ACTIVE' : 'OFF'}
                </span>
              </button>

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

      {/* Land Price & Cost of Living Heatmap Floating HUD */}
      <HeatmapLegendHUD
        isVisible={showHeatmap}
        onClose={() => setShowHeatmap(false)}
        stats={heatmapStats}
        metric={heatmapMetric}
        onMetricChange={setHeatmapMetric}
      />
    </div>
  );
};

export default GoogleMap;
