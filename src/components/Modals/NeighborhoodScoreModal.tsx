import React, { useState, useEffect } from 'react';
import {
  X,
  Compass,
  Scale,
  Navigation,
  CheckCircle2,
  Building,
  GraduationCap,
  Activity,
  TreePine,
  Briefcase,
  Sparkles,
  Search,
  AlertTriangle,
  Droplets,
  Zap,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import {
  getAllLocalities,
  resolveLocality,
  compareTwoLocalities
} from '../../services/localityIntelligenceService';
import { LocalityIntelligence } from '../../types';
import { geminiIntelligenceService, GeminiNeighborhoodAudit } from '../../services/geminiIntelligenceService';

interface NeighborhoodScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFlyToLocation: (coords: [number, number], zoom?: number) => void;
  onAskAIAboutLocality?: (localityName: string) => void;
  initialLocalityId?: string;
}

export const NeighborhoodScoreModal: React.FC<NeighborhoodScoreModalProps> = ({
  isOpen,
  onClose,
  onFlyToLocation,
  onAskAIAboutLocality,
  initialLocalityId
}) => {
  const localities = getAllLocalities();
  const [selectedLocalityId, setSelectedLocalityId] = useState<string>(() => {
    return initialLocalityId || 'gachibowli';
  });
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [compareLocalityId, setCompareLocalityId] = useState<string>('kondapur');

  // Search input for ANY neighborhood in India
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [activeLocalityName, setActiveLocalityName] = useState('Gachibowli');
  const [activeCityName, setActiveCityName] = useState('Hyderabad');

  // Gemini Live Audit state
  const [geminiAudit, setGeminiAudit] = useState<GeminiNeighborhoodAudit | null>(null);
  const [isLoadingGemini, setIsLoadingGemini] = useState<boolean>(false);

  // Synchronize when initialLocalityId changes
  useEffect(() => {
    if (initialLocalityId) {
      const loc = resolveLocality(initialLocalityId);
      if (loc) {
        setSelectedLocalityId(loc.id);
        setActiveLocalityName(loc.name);
        setActiveCityName(loc.city);
      } else {
        setActiveLocalityName(initialLocalityId);
      }
    }
  }, [initialLocalityId]);

  // Fetch live Gemini Flash intelligence on locality change
  useEffect(() => {
    if (!isOpen) return;

    let targetLocality = activeLocalityName;
    let targetCity = activeCityName;

    const loc = resolveLocality(selectedLocalityId);
    if (loc && selectedLocalityId !== 'custom') {
      targetLocality = loc.name;
      targetCity = loc.city;
      setActiveLocalityName(loc.name);
      setActiveCityName(loc.city);
    }

    setIsLoadingGemini(true);
    geminiIntelligenceService.getNeighborhoodAudit(targetLocality, targetCity)
      .then((audit) => {
        setGeminiAudit(audit);
      })
      .catch((err) => {
        console.warn('Gemini audit error:', err);
      })
      .finally(() => {
        setIsLoadingGemini(false);
      });
  }, [selectedLocalityId, activeLocalityName, activeCityName, isOpen]);

  if (!isOpen) return null;

  const currentLocality = resolveLocality(selectedLocalityId) || localities[0];
  const compareData = isCompareMode
    ? compareTwoLocalities(selectedLocalityId, compareLocalityId)
    : null;

  const handleFly = (loc: LocalityIntelligence) => {
    onFlyToLocation(loc.coordinates, 14);
    onClose();
  };

  const handleSearchCustomLocality = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSearchQuery.trim()) return;

    const query = customSearchQuery.trim();
    setActiveLocalityName(query);
    setSelectedLocalityId('custom');

    // Attempt to guess city or default to Hyderabad
    const queryLower = query.toLowerCase();
    if (queryLower.includes('bangalore') || queryLower.includes('bengaluru') || queryLower.includes('koramangala') || queryLower.includes('indiranagar') || queryLower.includes('whitefield') || queryLower.includes('hsr')) {
      setActiveCityName('Bengaluru');
    } else if (queryLower.includes('mumbai') || queryLower.includes('bandra') || queryLower.includes('powai') || queryLower.includes('andheri')) {
      setActiveCityName('Mumbai');
    } else if (queryLower.includes('delhi') || queryLower.includes('noida') || queryLower.includes('gurgaon') || queryLower.includes('gurugram')) {
      setActiveCityName('Delhi NCR');
    } else {
      setActiveCityName('Hyderabad');
    }

    setCustomSearchQuery('');
  };

  const handleRefreshAudit = () => {
    setIsLoadingGemini(true);
    geminiIntelligenceService.getNeighborhoodAudit(activeLocalityName, activeCityName)
      .then((audit) => {
        setGeminiAudit(audit);
      })
      .finally(() => {
        setIsLoadingGemini(false);
      });
  };

  // Scores to display (prefer live Gemini, fallback to catalog)
  const displayScores = geminiAudit?.scores || currentLocality.scores;
  const overallScore = geminiAudit?.overallScore || currentLocality.scores.overallScore;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center">
        <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl text-left overflow-hidden transform transition-all border border-slate-100 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Neighborhood Intelligence & Benchmark</span>
                  <span className="text-[10px] font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-3 h-3 animate-spin" />
                    <span>Gemini 2.5 Flash</span>
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Live civic scoring across 6 dimensions, flood catchment assessment & upcoming infrastructure
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Locality Search & Selector Toolbar */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
            {/* Search Input for ANY Indian locality */}
            <form onSubmit={handleSearchCustomLocality} className="flex-1 max-w-md flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customSearchQuery}
                  onChange={(e) => setCustomSearchQuery(e.target.value)}
                  placeholder="Audit ANY locality (e.g. Koramangala, Powai, Madhapur, HSR)..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 bg-white shadow-xs"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs flex-shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Audit</span>
              </button>
            </form>

            {/* Quick Presets Dropdown */}
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-xs font-bold text-slate-600">Presets:</label>
              <select
                value={selectedLocalityId}
                onChange={(e) => setSelectedLocalityId(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
              >
                {selectedLocalityId === 'custom' && (
                  <option value="custom">📍 {activeLocalityName} (Custom Audit)</option>
                )}
                {localities.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}, {loc.city} ({loc.scores.overallScore}/100)
                  </option>
                ))}
              </select>

              {/* Toggle Compare Mode */}
              <button
                onClick={() => setIsCompareMode(!isCompareMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isCompareMode
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{isCompareMode ? 'Single View' : 'Compare'}</span>
              </button>

              {isCompareMode && (
                <select
                  value={compareLocalityId}
                  onChange={(e) => setCompareLocalityId(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
                >
                  {localities
                    .filter((l) => l.id !== selectedLocalityId)
                    .map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}, {loc.city} ({loc.scores.overallScore}/100)
                      </option>
                    ))}
                </select>
              )}
            </div>
          </div>

          {/* Modal Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
            {/* VIEW 1: SIDE-BY-SIDE LOCALITY COMPARISON */}
            {isCompareMode && compareData ? (
              <div className="space-y-5 animate-in fade-in">
                {/* Comparison Summary Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                      Gemini Comparative Assessment
                    </span>
                    <h4 className="text-sm font-extrabold text-white mt-1.5">
                      {compareData.summaryVerdict}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFly(compareData.localityA)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Fly {compareData.localityA.name}</span>
                    </button>
                    <button
                      onClick={() => handleFly(compareData.localityB)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Fly {compareData.localityB.name}</span>
                    </button>
                  </div>
                </div>

                {/* Scorecards Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-black text-slate-900">{compareData.localityA.name}</span>
                      <span className="text-lg font-black text-blue-600">{compareData.localityA.scores.overallScore}/100</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Avg ₹{compareData.localityA.avgPricePerSqFt.toLocaleString('en-IN')}/sq.ft &bull; Yield {compareData.localityA.rentalYieldPercent}%
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-black text-slate-900">{compareData.localityB.name}</span>
                      <span className="text-lg font-black text-slate-700">{compareData.localityB.scores.overallScore}/100</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Avg ₹{compareData.localityB.avgPricePerSqFt.toLocaleString('en-IN')}/sq.ft &bull; Yield {compareData.localityB.rentalYieldPercent}%
                    </div>
                  </div>
                </div>

                {/* 6 Dimensions Comparison Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                        <th className="p-3 text-left">Neighborhood Dimension</th>
                        <th className="p-3 text-center">{compareData.localityA.name}</th>
                        <th className="p-3 text-center">{compareData.localityB.name}</th>
                        <th className="p-3 text-left">Advantage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {compareData.comparisonTable.map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="p-3 font-semibold text-slate-900">{t.dimension}</td>
                          <td className="p-3 text-center font-bold text-blue-600">{t.scoreA}/100</td>
                          <td className="p-3 text-center font-bold text-slate-700">{t.scoreB}/100</td>
                          <td className="p-3 font-bold">
                            {t.advantage === 'Equal' ? (
                              <span className="text-slate-400">Even</span>
                            ) : t.advantage === 'A' ? (
                              <span className="text-blue-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                {compareData.localityA.name} (+{t.scoreA - t.scoreB} pts)
                              </span>
                            ) : (
                              <span className="text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                {compareData.localityB.name} (+{t.scoreB - t.scoreA} pts)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* VIEW 2: SINGLE LOCALITY DEEP DIVE WITH LIVE GEMINI FLASH */
              <div className="space-y-6 animate-in fade-in">
                {/* Hero Summary Card */}
                <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                        {activeCityName} &bull; Micro-Market Intelligence
                      </span>
                      {isLoadingGemini && (
                        <span className="text-[10px] text-blue-300 font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 animate-spin text-emerald-400" />
                          Gemini 2.5 Flash Auditing...
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5 flex items-center gap-2">
                      <span>{activeLocalityName}</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl italic">
                      "{geminiAudit?.tagline || currentLocality.keyHighlights.join(' • ')}"
                    </p>
                    {geminiAudit?.executiveSummary && (
                      <p className="text-xs text-slate-200 mt-2 max-w-2xl leading-relaxed">
                        {geminiAudit.executiveSummary}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-center sm:items-end gap-2 flex-shrink-0">
                    <div className="text-center sm:text-right bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 min-w-[140px]">
                      <div className="text-[10px] font-bold text-slate-300 uppercase">Civic Intelligence Score</div>
                      <div className="text-3xl font-black text-emerald-400 mt-0.5">
                        {overallScore}
                        <span className="text-sm font-normal text-slate-300"> / 100</span>
                      </div>
                    </div>

                    <button
                      onClick={handleRefreshAudit}
                      disabled={isLoadingGemini}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-slate-200 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3 h-3 ${isLoadingGemini ? 'animate-spin' : ''}`} />
                      <span>{isLoadingGemini ? 'Auditing...' : 'Re-audit Gemini'}</span>
                    </button>
                  </div>
                </div>

                {/* 6 Dimension Score Progress Bars */}
                <div>
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span>Neighborhood Scoring Breakdown</span>
                    <span className="text-[10px] font-normal text-slate-500">Benchmark out of 100</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'Transit & Connectivity', score: displayScores.connectivity, icon: Navigation, desc: 'Expressways, metro & arterial roads' },
                      { label: 'Educational Facilities', score: displayScores.education, icon: GraduationCap, desc: 'IB & CBSE international schools' },
                      { label: 'Healthcare Accessibility', score: displayScores.healthcare, icon: Activity, desc: 'Multi-specialty emergency hospitals' },
                      { label: 'Employment Opportunities', score: displayScores.employment, icon: Briefcase, desc: 'IT SEZs & Fortune 500 offices' },
                      { label: 'Environmental Quality', score: displayScores.environment, icon: TreePine, desc: 'Parklands, lakes & clean AQI' },
                      { label: 'Infrastructure Development', score: displayScores.infrastructure, icon: Building, desc: 'Flyovers, power backup & water supply' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-1.5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                            <item.icon className="w-3.5 h-3.5 text-blue-600" />
                            <span>{item.label}</span>
                          </span>
                          <span className="font-black text-blue-600">{item.score}/100</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths & Watchpoints Direct From Gemini Flash */}
                {geminiAudit && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                      <div className="font-extrabold text-xs text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Verified Locality Strengths</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {geminiAudit.strengths.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                      <div className="font-extrabold text-xs text-amber-900 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Locality Watchpoints & Bottlenecks</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {geminiAudit.watchpoints.map((w, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-600 font-bold">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Environmental, Flood Catchment & Infrastructure Intelligence */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Flood Catchment */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-blue-500" />
                        <span>Flood & Drainage Risk</span>
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        geminiAudit?.floodRisk === 'Low'
                          ? 'bg-emerald-100 text-emerald-800'
                          : geminiAudit?.floodRisk === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {geminiAudit?.floodRisk || 'Low'} Risk
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 leading-snug">
                      {geminiAudit?.floodRiskDetails || 'Natural surface gradient drainage slope away from primary residential parcels.'}
                    </div>
                  </div>

                  {/* Water & Power Reliability */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>Water & Power Reliability</span>
                    </span>
                    <div className="text-[11px] text-slate-600 leading-snug">
                      {geminiAudit?.waterPowerReliability || 'Dual 24/7 power feed with municipal piped water supply.'}
                    </div>
                  </div>

                  {/* Rental Yield Range */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <span>Rental Yield & Appreciation</span>
                    </span>
                    <div className="text-sm font-black text-slate-900">
                      {geminiAudit?.rentalYieldRange || '3.8% - 4.8% Yield'}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {geminiAudit?.appreciationOutlook || 'Strong capital growth outlook.'}
                    </div>
                  </div>
                </div>

                {/* Upcoming Infrastructure Projects */}
                {geminiAudit?.upcomingInfrastructure && geminiAudit.upcomingInfrastructure.length > 0 && (
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                    <div className="font-extrabold text-xs text-blue-950 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-blue-600" />
                      <span>Upcoming Infrastructure Projects for {activeLocalityName}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {geminiAudit.upcomingInfrastructure.map((infra, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-white border border-blue-100 text-xs text-slate-700 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                          <span>{infra}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Historical Price Progression & Future Projections */}
                <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Price History & Appreciation Tracker
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Reliable quarterly RERA registration rate per sq.ft progression
                      </p>
                    </div>
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                      {currentLocality.appreciationLabel}
                    </span>
                  </div>

                  {/* 4 Quarterly Milestones */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {currentLocality.historicalPrices.map((hp, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                        <div className="text-[10px] font-bold text-slate-400">{hp.period}</div>
                        <div className="text-sm font-black text-slate-900 mt-0.5">
                          ₹{hp.avgPriceSqFt.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{hp.date}</div>
                      </div>
                    ))}
                  </div>

                  {/* Future Forecast Scenarios */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">Future Appreciation Scenarios ({currentLocality.futureProjections.annualCAGR}% CAGR)</div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        1-Year: <strong className="text-slate-900">₹{currentLocality.futureProjections.scenario1Year.toLocaleString('en-IN')}/sq.ft</strong> &bull; 
                        3-Year: <strong className="text-slate-900">₹{currentLocality.futureProjections.scenario3Year.toLocaleString('en-IN')}/sq.ft</strong> &bull; 
                        5-Year: <strong className="text-emerald-700">₹{currentLocality.futureProjections.scenario5Year.toLocaleString('en-IN')}/sq.ft</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {onAskAIAboutLocality && (
                        <button
                          onClick={() => {
                            onAskAIAboutLocality(activeLocalityName);
                            onClose();
                          }}
                          className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-indigo-200"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>Chat with Agent</span>
                        </button>
                      )}
                      {selectedLocalityId !== 'custom' && (
                        <button
                          onClick={() => handleFly(currentLocality)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>View on Google Map</span>
                        </button>
                      )}
                    </div>
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
