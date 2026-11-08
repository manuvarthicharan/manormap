import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { Property, MapBounds, TileProvider } from '../../types';
import { Locate, ZoomIn, ZoomOut, Layers, Navigation } from 'lucide-react';

interface MapLibreMapProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (property: Property | null) => void;
  onBoundsChange: (bounds: MapBounds) => void;
  onSearchThisArea: () => void;
  showSearchThisAreaBtn: boolean;
  activeTileProvider: TileProvider;
  onChangeTileProvider: (provider: TileProvider) => void;
  tileProviders: TileProvider[];
  userLocation: [number, number] | null;
  onMapLoaded: (mapInstance: maplibregl.Map) => void;
  isDroppingPin?: boolean;
  onMapCenterChange?: (coords: [number, number]) => void;
}

export const MapLibreMap: React.FC<MapLibreMapProps> = ({
  properties,
  selectedProperty,
  onSelectProperty,
  onBoundsChange,
  onSearchThisArea,
  showSearchThisAreaBtn,
  activeTileProvider,
  onChangeTileProvider,
  tileProviders,
  userLocation,
  onMapLoaded,
  isDroppingPin = false,
  onMapCenterChange
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize MapLibre GL map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Define style using the active raster tile provider (OpenStreetMap standard by default)
    const style: maplibregl.StyleSpecification = {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [activeTileProvider.url],
          tileSize: 256,
          attribution: activeTileProvider.attribution,
          maxzoom: activeTileProvider.maxZoom || 19
        }
      },
      layers: [
        {
          id: 'osm-layer',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 22
        }
      ]
    };

    // Center on Hyderabad / Hitec City (India's tech corridor) initially, or pan-India view
    const initialCenter: [number, number] = [78.3820, 17.4474];

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: style,
      center: initialCenter,
      zoom: 13,
      minZoom: 3,
      maxZoom: 19,
      attributionControl: {
        compact: true
      }
    });

    mapRef.current = map;

    map.on('load', () => {
      setMapLoaded(true);
      onMapLoaded(map);

      // Trigger initial bounds
      const b = map.getBounds();
      onBoundsChange({
        minLng: b.getWest(),
        minLat: b.getSouth(),
        maxLng: b.getEast(),
        maxLat: b.getNorth()
      });
    });

    // Handle map movement & settle
    let moveTimer: ReturnType<typeof setTimeout>;
    const handleMoveEnd = () => {
      clearTimeout(moveTimer);
      moveTimer = setTimeout(() => {
        if (!map) return;
        const b = map.getBounds();
        onBoundsChange({
          minLng: b.getWest(),
          minLat: b.getSouth(),
          maxLng: b.getEast(),
          maxLat: b.getNorth()
        });

        const center = map.getCenter();
        if (onMapCenterChange) {
          onMapCenterChange([center.lng, center.lat]);
        }
      }, 200);
    };

    map.on('moveend', handleMoveEnd);

    // Map click in pin dropping mode
    map.on('click', (e) => {
      if (isDroppingPin) {
        map.easeTo({
          center: [e.lngLat.lng, e.lngLat.lat],
          duration: 350
        });
      }
    });

    // Responsive window resize
    const handleResize = () => {
      map.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(moveTimer);
      map.remove();
    };
  }, []);

  // Update tile provider if changed
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const source = map.getSource('osm-tiles') as maplibregl.RasterTileSource | undefined;
    if (source) {
      // Re-configure tiles
      const style = map.getStyle();
      if (style && style.sources && style.sources['osm-tiles']) {
        (style.sources['osm-tiles'] as any).tiles = [activeTileProvider.url];
        (style.sources['osm-tiles'] as any).attribution = activeTileProvider.attribution;
        map.setStyle(style);
      }
    }
  }, [activeTileProvider, mapLoaded]);

  // Update or create property markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const currentMarkerIds = new Set<string>();

    properties.forEach(prop => {
      currentMarkerIds.add(prop.id);
      const isSelected = selectedProperty?.id === prop.id;

      let marker = markersRef.current.get(prop.id);

      if (!marker) {
        // Create custom HTML DOM marker
        const el = document.createElement('div');
        el.className = `prop-marker ${isSelected ? 'selected' : ''}`;
        el.id = `marker-${prop.id}`;

        const pill = document.createElement('div');
        pill.className = `marker-pill ${prop.type}`;
        pill.innerHTML = `<span>${prop.priceDisplay}</span>`;

        const tip = document.createElement('div');
        tip.className = 'marker-tip';

        el.appendChild(pill);
        el.appendChild(tip);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectProperty(prop);
          map.easeTo({
            center: prop.coordinates,
            offset: [0, -80],
            duration: 500
          });
        });

        marker = new maplibregl.Marker({
          element: el,
          anchor: 'bottom'
        })
          .setLngLat(prop.coordinates)
          .addTo(map);

        markersRef.current.set(prop.id, marker);
      } else {
        // Update selection state
        const el = marker.getElement();
        if (isSelected) {
          el.classList.add('selected');
        } else {
          el.classList.remove('selected');
        }
      }
    });

    // Remove markers that are no longer in visible properties
    markersRef.current.forEach((marker, id) => {
      if (!currentMarkerIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });
  }, [properties, selectedProperty, mapLoaded, onSelectProperty]);

  // User location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (userLocation) {
      if (!userMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'relative flex items-center justify-center';
        el.innerHTML = `
          <div class="w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-md user-location-pulse"></div>
          <div class="absolute w-2 h-2 bg-white rounded-full"></div>
        `;

        userMarkerRef.current = new maplibregl.Marker({
          element: el,
          anchor: 'center'
        })
          .setLngLat(userLocation)
          .addTo(map);
      } else {
        userMarkerRef.current.setLngLat(userLocation);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userLocation, mapLoaded]);

  // Click on empty map area deselects property
  const handleMapClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.prop-marker')) {
      return;
    }
    if ((e.target as HTMLElement).closest('.floating-ui')) {
      return;
    }
    onSelectProperty(null);
  }, [onSelectProperty]);

  // Map controls
  const handleZoomIn = () => {
    mapRef.current?.zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut({ duration: 300 });
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        mapRef.current?.flyTo({
          center: coords,
          zoom: 14,
          speed: 1.2
        });
      },
      (err) => {
        console.warn('Geolocation failed or denied, centering on Hyderabad tech corridor', err);
        // Fallback to vibrant Hyderabad tech corridor
        mapRef.current?.flyTo({
          center: [78.3820, 17.4474],
          zoom: 14,
          speed: 1.2
        });
      },
      { timeout: 7000 }
    );
  };

  const handleResetNorth = () => {
    mapRef.current?.resetNorthPitch({ duration: 400 });
  };

  return (
    <div 
      className="w-full h-full absolute inset-0 overflow-hidden" 
      onClick={handleMapClick}
    >
      {/* 100% Viewport Map Canvas */}
      <div 
        ref={mapContainerRef} 
        className={`w-full h-full absolute inset-0 z-0 select-none ${
          isDroppingPin ? 'cursor-crosshair' : ''
        }`}
      />

      {/* Floating "Search this area" button (appears when panning away) */}
      {showSearchThisAreaBtn && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto transition-all animate-bounce">
          <button
            onClick={onSearchThisArea}
            className="flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-md text-slate-800 text-sm font-semibold rounded-full shadow-floating hover:bg-slate-50 hover:shadow-lg border border-slate-200/80 transition-all active:scale-95"
          >
            <span>Search this area</span>
          </button>
        </div>
      )}

      {/* Minimal Floating Map Controls (Right edge) */}
      <div className="absolute right-4 bottom-24 sm:bottom-12 z-20 flex flex-col gap-2 pointer-events-auto floating-ui">
        {/* Layer Switcher Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            title="Switch Map Tile Source"
            className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl shadow-floating flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-white border border-slate-200/80 transition-all active:scale-95"
            aria-label="Map layers"
          >
            <Layers className="w-5 h-5" />
          </button>

          {isLayerMenuOpen && (
            <div className="absolute right-12 bottom-0 w-64 bg-white rounded-2xl shadow-floating-lg border border-slate-100 p-2 z-30 transition-all">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">
                Map Tile Source (Zero API Keys)
              </div>
              <div className="space-y-1 mt-1">
                {tileProviders.map(provider => (
                  <button
                    key={provider.id}
                    onClick={() => {
                      onChangeTileProvider(provider);
                      setIsLayerMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex flex-col ${
                      activeTileProvider.id === provider.id
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{provider.name}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{provider.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Current Location button */}
        <button
          onClick={handleLocateMe}
          title="Current Location"
          className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl shadow-floating flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-white border border-slate-200/80 transition-all active:scale-95"
          aria-label="Current Location"
        >
          <Locate className="w-5 h-5" />
        </button>

        {/* Reset North / Compass */}
        <button
          onClick={handleResetNorth}
          title="Reset North"
          className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl shadow-floating flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-white border border-slate-200/80 transition-all active:scale-95"
          aria-label="Reset orientation"
        >
          <Navigation className="w-4 h-4" />
        </button>

        {/* Zoom Controls group */}
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-floating border border-slate-200/80 overflow-hidden flex flex-col">
          <button
            onClick={handleZoomIn}
            title="Zoom in"
            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom out"
            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
