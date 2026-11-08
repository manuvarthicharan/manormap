import React from 'react';
import { Property } from '../../types';
import { X, ShieldCheck, MapPin, Scale, ExternalLink, Navigation } from 'lucide-react';
import { analyzePropertyRiskAndAdvantages } from '../../services/aiIntelligenceService';

interface PropertyComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparedProperties: Property[];
  onRemoveProperty: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onOpenDetails: (property: Property) => void;
  onClearComparison: () => void;
}

export const PropertyComparisonModal: React.FC<PropertyComparisonModalProps> = ({
  isOpen,
  onClose,
  comparedProperties,
  onRemoveProperty,
  onSelectProperty,
  onOpenDetails,
  onClearComparison
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-2 sm:p-4 text-center">
        <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl text-left overflow-hidden transform transition-all border border-slate-100 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Property Comparison Radar</span>
                  <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {comparedProperties.length} Selected
                  </span>
                </h3>
                <p className="text-xs text-slate-500">Side-by-side architectural, financial, and environmental analysis</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {comparedProperties.length > 0 && (
                <button
                  onClick={onClearComparison}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            {comparedProperties.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Scale className="w-12 h-12 mx-auto mb-3 stroke-[1.5] text-slate-300" />
                <h4 className="text-sm font-bold text-slate-700 mb-1">No properties selected for comparison</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click the "+ Compare" button on any property card or detail page to compare up to 4 properties side-by-side.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="p-3 text-left font-bold text-slate-400 uppercase tracking-wider w-40 min-w-[140px] bg-slate-50/50 rounded-l-2xl">
                        Metric / Feature
                      </th>
                      {comparedProperties.map((prop) => (
                        <th key={prop.id} className="p-3 text-left min-w-[220px] max-w-[260px] align-top bg-slate-50/50">
                          <div className="relative group">
                            <button
                              onClick={() => onRemoveProperty(prop.id)}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/60 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition-colors"
                              title="Remove from comparison"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <img
                              src={prop.images[0]}
                              alt={prop.title}
                              className="w-full h-28 object-cover rounded-xl mb-2"
                            />
                            <div className="font-extrabold text-sm text-slate-900 line-clamp-1">{prop.title}</div>
                            <div className="text-blue-600 font-extrabold text-sm mt-0.5">{prop.priceDisplay}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span>{prop.area}, {prop.city}</span>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {/* Rate per Sq Ft */}
                    <tr>
                      <td className="p-3 font-bold text-slate-900 bg-slate-50/30">Price / Sq. Ft</td>
                      {comparedProperties.map((p) => {
                        const ppsf = p.areaSqFt > 0 ? Math.round(p.price / p.areaSqFt) : 0;
                        return (
                          <td key={p.id} className="p-3 font-semibold text-slate-900">
                            ₹{ppsf.toLocaleString('en-IN')}/sq.ft
                          </td>
                        );
                      })}
                    </tr>

                    {/* Purpose */}
                    <tr>
                      <td className="p-3 font-bold text-slate-900 bg-slate-50/30">Listing Type</td>
                      {comparedProperties.map((p) => (
                        <td key={p.id} className="p-3">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                            p.type === 'sale' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            For {p.type === 'sale' ? 'Sale' : 'Rent'}
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Configuration & Area */}
                    <tr>
                      <td className="p-3 font-bold text-slate-900 bg-slate-50/30">Layout & Area</td>
                      {comparedProperties.map((p) => (
                        <td key={p.id} className="p-3 font-medium">
                          <div><span className="font-bold text-slate-900">{p.bhk} BHK</span> ({p.bathrooms} Baths, {p.balconies || 1} Balconies)</div>
                          <div className="text-slate-500 mt-0.5">{p.areaSqFt.toLocaleString('en-IN')} Sq. Ft (Carpet: {p.carpetAreaSqFt || Math.round(p.areaSqFt * 0.78)} Sq. Ft)</div>
                        </td>
                      ))}
                    </tr>

                    {/* Furnishing & Facing */}
                    <tr>
                      <td className="p-3 font-bold text-slate-900 bg-slate-50/30">Vastu & Interiors</td>
                      {comparedProperties.map((p) => (
                        <td key={p.id} className="p-3 font-medium">
                          <div>Facing: <span className="font-semibold text-slate-900">{p.facing || 'East'}</span></div>
                          <div className="text-slate-500 mt-0.5">{p.furnishing}</div>
                        </td>
                      ))}
                    </tr>

                    {/* Status & RERA */}
                    <tr>
                      <td className="p-3 font-bold text-slate-900 bg-slate-50/30">RERA & Title</td>
                      {comparedProperties.map((p) => (
                        <td key={p.id} className="p-3">
                          <div className="flex items-center gap-1 text-emerald-600 font-bold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{p.verified ? 'Verified Active RERA' : 'Unverified'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.reraId || 'PRM/KA/RERA/2024'}</div>
                        </td>
                      ))}
                    </tr>

                    {/* AI Flood & Topography Risk */}
                    <tr>
                      <td className="p-3 font-bold text-slate-900 bg-slate-50/30">AI Flood Risk</td>
                      {comparedProperties.map((p) => {
                        const analysis = analyzePropertyRiskAndAdvantages(p);
                        return (
                          <td key={p.id} className="p-3 font-medium">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              analysis.floodRisk === 'Low'
                                ? 'bg-emerald-50 text-emerald-700'
                                : analysis.floodRisk === 'Moderate'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}>
                              {analysis.floodRisk} Risk (~{analysis.elevationMeters}m MSL)
                            </span>
                            <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                              {analysis.waterbodyProximity.name} ({analysis.waterbodyProximity.distanceKm.toFixed(1)} km)
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Environmental / Dumpyard Proximity */}
                    <tr>
                      <td className="p-3 font-bold text-slate-900 bg-slate-50/30">Environmental Zone</td>
                      {comparedProperties.map((p) => {
                        const analysis = analyzePropertyRiskAndAdvantages(p);
                        return (
                          <td key={p.id} className="p-3 font-medium">
                            <span className="font-semibold text-slate-800">{analysis.environmentalRisk.riskRating}</span>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {analysis.environmentalRisk.dumpyardDistanceKm.toFixed(1)} km from landfill
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Top Advantage */}
                    <tr>
                      <td className="p-3 font-bold text-slate-900 bg-slate-50/30">Top Advantage</td>
                      {comparedProperties.map((p) => {
                        const analysis = analyzePropertyRiskAndAdvantages(p);
                        return (
                          <td key={p.id} className="p-3 text-[11px] text-emerald-800 bg-emerald-50/30">
                            {analysis.pros[0] || 'Prime connectivity to central business hub'}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Watch Point / Cons */}
                    <tr>
                      <td className="p-3 font-bold text-slate-900 bg-slate-50/30">Key Watch Point</td>
                      {comparedProperties.map((p) => {
                        const analysis = analyzePropertyRiskAndAdvantages(p);
                        return (
                          <td key={p.id} className="p-3 text-[11px] text-amber-800 bg-amber-50/30">
                            {analysis.cons[0] || 'Peak hour traffic along main approach'}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Actions */}
                    <tr>
                      <td className="p-3 font-bold text-slate-900 bg-slate-50/30">Direct Actions</td>
                      {comparedProperties.map((p) => (
                        <td key={p.id} className="p-3 space-y-1.5">
                          <button
                            onClick={() => {
                              onSelectProperty(p);
                              onClose();
                            }}
                            className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Navigation className="w-3.5 h-3.5 text-blue-600" />
                            <span>Fly on Map</span>
                          </button>
                          <button
                            onClick={() => {
                              onOpenDetails(p);
                              onClose();
                            }}
                            className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View Full Specs</span>
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
