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
  Copy,
  Check,
  Sparkles,
  Wrench,
  BarChart2
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
  // Land Surveyor
  landSurvey: LandSurveyState;
  onLandSurveyChange: (state: LandSurveyState) => void;
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
  const transitLayerRef = useRef<any>(null);
  const aiPolygonOverlayRef = useRef<google.maps.Polygon | null>(null);
  const propertyBoundaryPolygonRef = useRef<google.maps.Polygon | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(13);
  const [activeMapTypeId, setActiveMapTypeId] = useState<string>('roadmap');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [showTransitLayer, setShowTransitLayer] = useState(false);
  const [copiedSurvey, setCopiedSurvey] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const [isMobileSurveyorMetricsOpen, setIsMobileSurveyorMetricsOpen] = useState(false);

  const isAnyToolActive = radiusSearch.active || polygonSearch.active || landSurvey.active;

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

          // Land Surveyor mode click
          if (landSurveyRef.current.active && landSurveyRef.current.isDrawing && e.latLng) {
            const newPt: [number, number] = [e.latLng.lng(), e.latLng.lat()];
            const updatedPts = [...landSurveyRef.current.points, newPt];
            const metrics = calculateLandParcelMetrics(updatedPts);
            onLandSurveyChange({
              ...landSurveyRef.current,
              ...metrics,
              points: updatedPts
            });
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
          map: map
        });
      } else {
        polygonOverlayRef.current.setPaths(paths);
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

  // Selected Property Land Parcel Boundary Overlay (Cadastral Boundary)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !window.google?.maps) return;

    if (selectedProperty?.boundaryPolygon && selectedProperty.boundaryPolygon.length >= 3) {
      const paths = selectedProperty.boundaryPolygon.map((c) => new google.maps.LatLng(c[1], c[0]));
      const isAgri = selectedProperty.category === 'Agricultural Land' || selectedProperty.category === 'Plot';

      if (!propertyBoundaryPolygonRef.current) {
        propertyBoundaryPolygonRef.current = new google.maps.Polygon({
          paths,
          strokeColor: isAgri ? '#059669' : '#2563eb',
          strokeOpacity: 0.95,
          strokeWeight: 3,
          fillColor: isAgri ? '#10b981' : '#3b82f6',
          fillOpacity: 0.25,
          map: map,
          zIndex: 85
        });
      } else {
        propertyBoundaryPolygonRef.current.setPaths(paths);
        (propertyBoundaryPolygonRef.current as any).setOptions({
          strokeColor: isAgri ? '#059669' : '#2563eb',
          fillColor: isAgri ? '#10b981' : '#3b82f6'
        });
        propertyBoundaryPolygonRef.current.setMap(map);
      }
    } else if (propertyBoundaryPolygonRef.current) {
      propertyBoundaryPolygonRef.current.setMap(null);
    }
  }, [selectedProperty, mapLoaded]);

  // Land Surveyor Tool Polygons & Pegs
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !window.google?.maps) return;

    if (landSurvey.active && landSurvey.points.length > 0) {
      const paths = landSurvey.points.map((p) => new google.maps.LatLng(p[1], p[0]));

      if (landSurvey.points.length >= 3) {
        if (!surveyorPolygonRef.current) {
          surveyorPolygonRef.current = new google.maps.Polygon({
            paths: paths,
            fillColor: '#f59e0b',
            fillOpacity: 0.2,
            strokeColor: '#d97706',
            strokeOpacity: 1,
            strokeWeight: 2.5,
            map: map
          });
        } else {
          surveyorPolygonRef.current.setPaths(paths);
          surveyorPolygonRef.current.setMap(map);
        }
        if (surveyorPolylineRef.current) {
          surveyorPolylineRef.current.setMap(null);
        }
      } else {
        if (!surveyorPolylineRef.current) {
          surveyorPolylineRef.current = new google.maps.Polyline({
            path: paths,
            strokeColor: '#f59e0b',
            strokeOpacity: 1,
            strokeWeight: 3,
            map: map
          });
        } else {
          surveyorPolylineRef.current.setPath(paths);
          surveyorPolylineRef.current.setMap(map);
        }
        if (surveyorPolygonRef.current) {
          surveyorPolygonRef.current.setMap(null);
        }
      }
    } else {
      if (surveyorPolygonRef.current) surveyorPolygonRef.current.setMap(null);
      if (surveyorPolylineRef.current) surveyorPolylineRef.current.setMap(null);
    }
  }, [landSurvey, mapLoaded]);

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

  // Copy Land Survey Report
  const handleCopySurveyReport = () => {
    const report = `Official Land Survey Area Report:
• Sq. Yards (Gaj): ${landSurvey.areaSqYards}
• Gunthas: ${landSurvey.areaGunthas}
• Acres: ${landSurvey.areaAcres}
• Sq. Feet: ${landSurvey.areaSqFt}
• Sq. Meters: ${landSurvey.areaSqMeters}
• Perimeter: ${landSurvey.perimeterMeters} meters
• Boundary Vertices: ${landSurvey.points.length} pegged coordinates`;

    navigator.clipboard.writeText(report);
    setCopiedSurvey(true);
    setTimeout(() => setCopiedSurvey(false), 2500);
  };

  return (
    <div className="w-full h-full absolute inset-0 overflow-hidden select-none">
      {/* 100% Viewport Google Map Canvas */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full absolute inset-0 z-0 ${
          isDroppingPin || landSurvey.isDrawing || polygonSearch.isDrawing
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
            {polygonSearch.coordinates.length >= 3 && polygonSearch.isDrawing && (
              <button
                onClick={() => onPolygonChange({ ...polygonSearch, isDrawing: false })}
                className="px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Done
              </button>
            )}

            <button
              onClick={() => onPolygonChange({ active: false, isDrawing: false, coordinates: [] })}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
              title="Clear Drawn Area"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* LAND SURVEYOR HEADS-UP DISPLAY (HUD) - DESKTOP ONLY */}
      {landSurvey.active && (
        <div className="hidden sm:block absolute top-20 left-4 sm:left-6 z-20 pointer-events-auto bg-slate-950/90 text-white backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/80 p-4 max-w-sm w-full animate-in fade-in space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
                <Ruler className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black tracking-wide uppercase text-white">Land Boundary Surveyor</div>
                <div className="text-[10px] text-amber-300 font-medium">Standard Indian Land Metrics</div>
              </div>
            </div>

            <button
              onClick={() =>
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
                })
              }
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Area Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] font-bold uppercase text-slate-400">Sq. Yards (Gaj)</div>
              <div className="text-lg font-black text-amber-400">{landSurvey.areaSqYards.toLocaleString('en-IN')}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] font-bold uppercase text-slate-400">Gunthas</div>
              <div className="text-lg font-black text-amber-400">{landSurvey.areaGunthas}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] font-bold uppercase text-slate-400">Acres</div>
              <div className="text-base font-black text-white">{landSurvey.areaAcres} Ac</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] font-bold uppercase text-slate-400">Perimeter</div>
              <div className="text-base font-black text-white">{landSurvey.perimeterMeters} m</div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Pegged Vertices: <strong className="text-white">{landSurvey.points.length}</strong></span>
            <span>Total Area: <strong className="text-white">{landSurvey.areaSqFt.toLocaleString('en-IN')} Sq. Ft</strong></span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <button
              onClick={handleCopySurveyReport}
              disabled={landSurvey.points.length < 3}
              className="flex-1 h-8 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedSurvey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSurvey ? 'Copied' : 'Copy Report'}</span>
            </button>

            <button
              onClick={() => {
                const cleared = calculateLandParcelMetrics([]);
                onLandSurveyChange({
                  ...landSurvey,
                  ...cleared,
                  points: []
                });
              }}
              className="h-8 px-3 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* MOBILE COMPACT LAND SURVEYOR STRIP */}
      {landSurvey.active && (
        <div className="sm:hidden absolute top-16 left-3 right-3 z-20 pointer-events-auto bg-slate-950/95 text-white backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700 p-2.5 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs flex-shrink-0">
              <Ruler className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-amber-400 truncate">
                {landSurvey.areaAcres.toFixed(2)} Ac &bull; {landSurvey.areaSqYards.toLocaleString('en-IN')} Gaj
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {landSurvey.points.length} nodes &bull; {landSurvey.perimeterMeters}m perimeter
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setIsMobileSurveyorMetricsOpen(true)}
              className="px-2.5 py-1 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Metrics</span>
            </button>
            <button
              onClick={() =>
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
                })
              }
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MOBILE SURVEYOR METRICS BOTTOM SHEET */}
      {isMobileSurveyorMetricsOpen && (
        <>
          <div
            className="sm:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setIsMobileSurveyorMetricsOpen(false)}
          />
          <div className="sm:hidden fixed inset-x-0 bottom-0 z-50 bg-slate-950 text-white rounded-t-3xl shadow-2xl border-t border-slate-800 p-5 pb-8 animate-in slide-in-from-bottom duration-200 space-y-4">
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto" />
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                  <Ruler className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">Land Boundary Surveyor</h4>
                  <p className="text-[11px] text-amber-300 font-medium">Standard Indian Land Metrics</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileSurveyorMetricsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-bold uppercase text-slate-400">Sq. Yards (Gaj)</div>
                <div className="text-xl font-black text-amber-400">{landSurvey.areaSqYards.toLocaleString('en-IN')}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-bold uppercase text-slate-400">Gunthas</div>
                <div className="text-xl font-black text-amber-400">{landSurvey.areaGunthas}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-bold uppercase text-slate-400">Acres</div>
                <div className="text-lg font-black text-white">{landSurvey.areaAcres} Ac</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-bold uppercase text-slate-400">Perimeter</div>
                <div className="text-lg font-black text-white">{landSurvey.perimeterMeters} m</div>
              </div>
            </div>

            <div className="text-xs text-slate-400 flex items-center justify-between px-1">
              <span>Pegged Vertices: <strong className="text-white">{landSurvey.points.length}</strong></span>
              <span>Total: <strong className="text-white">{landSurvey.areaSqFt.toLocaleString('en-IN')} Sq. Ft</strong></span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleCopySurveyReport}
                disabled={landSurvey.points.length < 3}
                className="flex-1 h-10 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md active:scale-95"
              >
                {copiedSurvey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSurvey ? 'Copied to Clipboard' : 'Copy Survey Report'}</span>
              </button>
              <button
                onClick={() => {
                  const cleared = calculateLandParcelMetrics([]);
                  onLandSurveyChange({
                    ...landSurvey,
                    ...cleared,
                    points: []
                  });
                }}
                className="h-10 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold active:scale-95"
              >
                Reset
              </button>
            </div>
          </div>
        </>
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

              {/* Transit & Metro Lines */}
              <div className="pt-2 mt-2 border-t border-slate-100 px-1 space-y-1">
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

      {/* MOBILE FLOATING ACTION DOCK (Clean, Compact, Non-Congested) */}
      <div className="sm:hidden absolute right-3 bottom-24 z-20 flex flex-col items-center gap-2 pointer-events-auto">
        {/* Tools Menu FAB */}
        <button
          onClick={() => setIsMobileToolsOpen(true)}
          title="Map Tools & Layers"
          className={`w-11 h-11 rounded-2xl shadow-lg border flex items-center justify-center transition-all active:scale-95 relative ${
            isAnyToolActive
              ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/25 ring-2 ring-blue-400/50'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          aria-label="Map tools and layers"
        >
          <Wrench className="w-5 h-5" />
          {isAnyToolActive && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
          )}
        </button>

        {/* Current Location button */}
        <button
          onClick={handleLocateMe}
          title="Locate Me"
          className="w-11 h-11 bg-white text-slate-700 rounded-2xl shadow-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
          aria-label="Locate me"
        >
          <Locate className="w-5 h-5" />
        </button>

        {/* Zoom Controls */}
        <div className="w-11 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
          <button
            onClick={handleZoomIn}
            title="Zoom in"
            className="w-11 h-10 flex items-center justify-center text-slate-700 active:bg-slate-100 transition-colors border-b border-slate-100"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom out"
            className="w-11 h-10 flex items-center justify-center text-slate-700 active:bg-slate-100 transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
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
