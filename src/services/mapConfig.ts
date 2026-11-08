import { TileProvider } from '../types';

export const DEFAULT_TILE_PROVIDERS: TileProvider[] = [
  {
    id: 'osm-standard',
    name: 'OpenStreetMap (Standard)',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    maxZoom: 19,
    description: 'Direct OpenStreetMap tile server. Free, open, zero API keys required.'
  },
  {
    id: 'carto-voyager',
    name: 'Carto Voyager (Clean & Modern)',
    url: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
    maxZoom: 19,
    description: 'Clean, light-toned basemap optimized for high-density property exploration.'
  },
  {
    id: 'osm-hot',
    name: 'OSM Humanitarian (Detailed)',
    url: 'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors, Tiles style by Humanitarian OpenStreetMap Team',
    maxZoom: 19,
    description: 'Humanitarian style highlighting road networks and geographic features.'
  },
  {
    id: 'self-hosted',
    name: 'Self-Hosted OSM Tile Server (Production Ready)',
    url: 'http://localhost:8080/tile/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors | Self-Hosted PostGIS/Tegola/Renderd',
    maxZoom: 20,
    description: 'Ready for self-hosted PostGIS + Mapnik / Tegola / Martin tile servers.'
  }
];

const STORAGE_KEY = 'india_prop_tile_provider';
const CUSTOM_URL_KEY = 'india_prop_custom_tile_url';

export function getActiveTileProvider(): TileProvider {
  try {
    const savedId = localStorage.getItem(STORAGE_KEY);
    const customUrl = localStorage.getItem(CUSTOM_URL_KEY);
    
    if (savedId === 'self-hosted' && customUrl) {
      const selfHosted = DEFAULT_TILE_PROVIDERS.find(p => p.id === 'self-hosted')!;
      return { ...selfHosted, url: customUrl };
    }
    
    const found = DEFAULT_TILE_PROVIDERS.find(p => p.id === savedId);
    return found || DEFAULT_TILE_PROVIDERS[0]; // OSM standard by default
  } catch {
    return DEFAULT_TILE_PROVIDERS[0];
  }
}

export function setActiveTileProvider(providerId: string, customUrl?: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, providerId);
    if (customUrl) {
      localStorage.setItem(CUSTOM_URL_KEY, customUrl);
    }
  } catch (e) {
    console.error('Failed to save tile provider setting', e);
  }
}

