import { AgentMapAction, Property, FilterState } from '../types';
import { getAllProperties } from './propertyService';
import { resolveLocality } from './localityIntelligenceService';

export interface MapBridgeHandlers {
  onSelectProperty: (property: Property | null) => void;
  onApplyFilters: (filters: Partial<FilterState>) => void;
  onSetHighlightedPropertyIds: (ids: string[]) => void;
  onSetAIPolygon: (polygon: { coordinates: [number, number][]; color?: string; label?: string } | null) => void;
  onSetRoute?: (route: { origin: [number, number]; destination: [number, number] } | null) => void;
}

class MapActionBridge {
  private map: google.maps.Map | null = null;
  private handlers: MapBridgeHandlers | null = null;
  private actionListeners: ((action: AgentMapAction) => void)[] = [];

  public register(mapInstance: google.maps.Map, handlers: MapBridgeHandlers) {
    this.map = mapInstance;
    this.handlers = handlers;
  }

  public unregister() {
    this.map = null;
    this.handlers = null;
  }

  public onActionExecuted(listener: (action: AgentMapAction) => void) {
    this.actionListeners.push(listener);
    return () => {
      this.actionListeners = this.actionListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Executes an action on the real browser Google Map instance and awaits confirmation
   */
  public async executeAction(action: AgentMapAction): Promise<{ success: boolean; data?: any; error?: string }> {
    const map = this.map;
    const handlers = this.handlers;

    if (!map || !handlers) {
      return { success: false, error: 'Google Map is not yet loaded in the browser.' };
    }

    try {
      switch (action.tool) {
        case 'move_map': {
          const lat = action.args.lat;
          const lng = action.args.lng;
          const zoom = action.args.zoom;

          const target = new google.maps.LatLng(lat, lng);
          map.panTo(target);

          if (zoom) {
            map.setZoom(zoom);
          }

          // Wait for map to settle on new coordinates
          await new Promise<void>((resolve) => {
            const listener = map.addListener('idle', () => {
              google.maps.event.removeListener(listener);
              resolve();
            });
            // Fallback timeout in case already idle
            setTimeout(() => {
              google.maps.event.removeListener(listener);
              resolve();
            }, 600);
          });

          return {
            success: true,
            data: {
              center: [map.getCenter()?.lng() || lng, map.getCenter()?.lat() || lat],
              zoom: map.getZoom()
            }
          };
        }

        case 'set_map_zoom': {
          const zoom = action.args.zoom;
          map.setZoom(zoom);
          return { success: true, data: { zoom: map.getZoom() } };
        }

        case 'fit_map_bounds': {
          const { minLat, minLng, maxLat, maxLng } = action.args;
          const bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(minLat, minLng),
            new google.maps.LatLng(maxLat, maxLng)
          );
          map.fitBounds(bounds);
          return { success: true };
        }

        case 'select_property': {
          const propId = action.args.propertyId;
          const prop = getAllProperties().find((p) => p.id === propId);
          if (prop) {
            handlers.onSelectProperty(prop);
            map.panTo(new google.maps.LatLng(prop.coordinates[1], prop.coordinates[0]));
            map.setZoom(16);
            return { success: true, data: { selectedTitle: prop.title } };
          }
          return { success: false, error: `Property ID '${propId}' not found` };
        }

        case 'highlight_properties': {
          const ids = action.args.propertyIds || [];
          handlers.onSetHighlightedPropertyIds(ids);

          // If properties are provided, fit bounds around them
          const props = getAllProperties().filter((p) => ids.includes(p.id));
          if (props.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            props.forEach((p) => bounds.extend(new google.maps.LatLng(p.coordinates[1], p.coordinates[0])));
            map.fitBounds(bounds);
          }
          return { success: true, data: { highlightedCount: ids.length } };
        }

        case 'set_map_layer': {
          const layer = action.args.layer;
          map.setMapTypeId(layer);
          return { success: true, data: { activeLayer: layer } };
        }

        case 'draw_map_polygon': {
          const coords = action.args.coordinates;
          handlers.onSetAIPolygon({
            coordinates: coords,
            color: action.args.color || '#2563eb',
            label: action.args.label
          });

          // Fit map to polygon bounds
          if (coords && coords.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            coords.forEach((c: [number, number]) => bounds.extend(new google.maps.LatLng(c[1], c[0])));
            map.fitBounds(bounds);
          }
          return { success: true, data: { vertexCount: coords.length } };
        }

        case 'highlight_area': {
          const loc = resolveLocality(action.args.localityName);
          if (loc && loc.bounds) {
            const [minLng, minLat, maxLng, maxLat] = loc.bounds;
            const polygonCoords: [number, number][] = [
              [minLng, minLat],
              [maxLng, minLat],
              [maxLng, maxLat],
              [minLng, maxLat],
              [minLng, minLat]
            ];
            handlers.onSetAIPolygon({
              coordinates: polygonCoords,
              color: '#3b82f6',
              label: loc.name
            });

            const bounds = new google.maps.LatLngBounds(
              new google.maps.LatLng(minLat, minLng),
              new google.maps.LatLng(maxLat, maxLng)
            );
            map.fitBounds(bounds);
            return { success: true, data: { locality: loc.name } };
          } else if (loc) {
            map.panTo(new google.maps.LatLng(loc.coordinates[1], loc.coordinates[0]));
            map.setZoom(14);
            return { success: true, data: { locality: loc.name } };
          }
          return { success: false, error: `Could not resolve area '${action.args.localityName}'` };
        }

        case 'apply_map_filters': {
          handlers.onApplyFilters(action.args);
          return { success: true, data: { appliedFilters: action.args } };
        }

        case 'clear_map_highlights': {
          handlers.onSetHighlightedPropertyIds([]);
          handlers.onSetAIPolygon(null);
          return { success: true };
        }

        default:
          return { success: false, error: `Unknown map action: ${action.tool}` };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Map action execution error' };
    }
  }
}

export const mapActionBridge = new MapActionBridge();

