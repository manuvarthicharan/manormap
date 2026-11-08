import React, { useState } from 'react';
import {
  X,
  Settings,
  Layers,
  Database,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  Sparkles,
  Trash2
} from 'lucide-react';
import { GOOGLE_MAPS_API_KEY } from '../../services/googleMapsLoader';
import { clearAllCustomProperties } from '../../services/propertyService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'googlemaps' | 'postgis' | 'features'>('googlemaps');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-4 text-center">
        <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl text-left overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-none">System Architecture</h3>
                <span className="text-[11px] text-slate-400">Google Maps JavaScript API &bull; PostGIS Ready</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/70 px-4 pt-2 gap-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('googlemaps')}
              className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'googlemaps'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Google Maps Engine</span>
            </button>
            <button
              onClick={() => setActiveTab('postgis')}
              className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'postgis'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>PostgreSQL + PostGIS</span>
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'features'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Features & Key</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6 max-h-[calc(80vh-120px)] overflow-y-auto space-y-4">
            {activeTab === 'googlemaps' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
                    G
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-blue-950">Google Maps JavaScript API Active</div>
                    <div className="text-[11px] text-blue-700 truncate mt-0.5">
                      High-precision satellite, terrain, and road mapping across India
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Connected
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-2xl border border-slate-200 bg-white">
                    <div className="text-xs font-bold text-slate-800 mb-1">API Key Configuration</div>
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <code className="text-[11px] font-mono text-slate-700 truncate flex-1">
                        {GOOGLE_MAPS_API_KEY}
                      </code>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl border border-slate-200 bg-white">
                    <div className="text-xs font-bold text-slate-800 mb-1">Supported View Modes</div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="font-semibold text-slate-800 block">Default Road Map</span>
                        <span className="text-slate-400 text-[10px]">Clean vector roads, boundaries & POIs</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="font-semibold text-slate-800 block">Satellite View</span>
                        <span className="text-slate-400 text-[10px]">High-resolution photographic imagery</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="font-semibold text-slate-800 block">Hybrid View</span>
                        <span className="text-slate-400 text-[10px]">Satellite overlay with street names</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="font-semibold text-slate-800 block">Terrain Elevation</span>
                        <span className="text-slate-400 text-[10px]">Topographic contour elevation relief</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl border border-slate-200 bg-white">
                    <div className="text-xs font-bold text-slate-800 mb-1">Custom Overlay Markers</div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Property prices are rendered as custom HTML pills via <code className="font-mono text-blue-600 bg-blue-50 px-1 rounded">google.maps.OverlayView</code> into the map's mouse target pane, offering smooth animations, hover tooltips, and click gestures.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'postgis' && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-xs text-blue-900">
                  <span className="font-bold">PostgreSQL + PostGIS Architecture:</span> The frontend connects seamlessly to standard spatial SQL backends via viewport bounding box and distance queries.
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    1. PostGIS Schema Definition
                  </div>
                  <pre className="bg-slate-950 text-emerald-400 p-3 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed">
{`CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  price NUMERIC(15, 2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('sale', 'rent')),
  bhk INT,
  area_sqft INT,
  address TEXT,
  geom GEOMETRY(Point, 4326) NOT NULL
);

-- Fast 2D R-Tree Spatial Index:
CREATE INDEX idx_properties_geom ON properties USING GIST (geom);`}
                  </pre>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    2. Viewport Bounding Box Query (ST_MakeEnvelope)
                  </div>
                  <pre className="bg-slate-950 text-emerald-400 p-3 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed">
{`-- Triggered on Google Map 'idle' event:
SELECT 
  id, title, price, type, bhk, area_sqft,
  ST_X(geom) AS lng,
  ST_Y(geom) AS lat
FROM properties
WHERE ST_Contains(
  ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326),
  geom
)
LIMIT 150;`}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900">
                  <div className="font-bold text-xs mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Real Estate Discovery Suite</span>
                  </div>
                  <p className="text-[11px]">
                    Features enabled and configured for optimal speed and visual clarity.
                  </p>
                </div>

                <ul className="space-y-2 list-disc pl-5 text-[11px]">
                  <li>
                    <strong>Interactive Pin Dropping:</strong> Users place pins on the Google Map without needing latitude/longitude numbers.
                  </li>
                  <li>
                    <strong>Fast Indian Geocoding:</strong> Dual-layer geocoder with instant Indian metro index and debounced autocomplete.
                  </li>
                  <li>
                    <strong>Loan EMI Calculator:</strong> Dynamically calculates monthly mortgage payments in Indian Rupees.
                  </li>
                  <li>
                    <strong>Clean Minimal UI:</strong> Google Maps occupies 100% of the viewport with floating glassmorphism controls.
                  </li>
                </ul>

                {/* Reset Data to Clean Slate */}
                <div className="pt-3 border-t border-slate-200">
                  <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-rose-900">Purge Data & Reset Platform</div>
                      <div className="text-[11px] text-rose-700">Clear all local test listings and saved favorites for a 100% fresh start.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Reset all saved properties and favorites to clean slate?')) {
                          clearAllCustomProperties();
                          window.location.reload();
                        }
                      }}
                      className="h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge Data</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
