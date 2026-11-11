import React, { useState } from 'react';
import {
  Flame,
  ChevronDown,
  ChevronUp,
  X,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import {
  HeatmapMetric,
  HeatmapPriceStatistics,
  formatHeatmapPrice
} from '../../services/landPriceHeatmapService';

interface HeatmapLegendHUDProps {
  isVisible: boolean;
  onClose: () => void;
  stats: HeatmapPriceStatistics;
  metric: HeatmapMetric;
  onMetricChange: (metric: HeatmapMetric) => void;
}

export const HeatmapLegendHUD: React.FC<HeatmapLegendHUDProps> = ({
  isVisible,
  onClose,
  stats,
  metric,
  onMetricChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed sm:absolute z-30 transition-all duration-300 pointer-events-auto ${
        // On mobile, position just above bottom-nav / tray; on desktop bottom-left
        isCollapsed
          ? 'bottom-20 left-3 sm:bottom-6 sm:left-6'
          : 'bottom-20 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-sm w-auto sm:w-[360px]'
      }`}
    >
      <div className="bg-slate-950/92 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 p-3.5 sm:p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Flame className="w-4 h-4 fill-white animate-pulse" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black tracking-wide uppercase text-white truncate flex items-center gap-1.5">
                <span>Thermal Price & Land Heatmap</span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
              </h4>
              <p className="text-[10px] text-slate-400 truncate">
                Thermal camera pricing & cost spectrum overlay
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
              title={isCollapsed ? 'Expand Details' : 'Collapse Details'}
              aria-label="Toggle legend collapse"
            >
              {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/60 transition-colors"
              title="Turn Off Heatmap"
              aria-label="Turn off heatmap"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsed Compact View */}
        {isCollapsed ? (
          <div className="flex items-center justify-between text-xs pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-slate-300">Affordable</span>
              <span className="text-slate-500">➔</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-[11px] text-slate-300">Peak Land</span>
            </div>
            <button
              onClick={() => setIsCollapsed(false)}
              className="text-[10px] font-bold text-amber-400 hover:underline"
            >
              View Stats
            </button>
          </div>
        ) : (
          <>
            {/* Thermal Camera Color Spectrum Gradient Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Cool / Low
                </span>
                <span className="flex items-center gap-1 text-yellow-300">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  Balanced
                </span>
                <span className="flex items-center gap-1 text-orange-400">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  Hot
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  White-Hot Peak
                </span>
              </div>

              {/* The Visual Thermal Gradient Bar */}
              <div
                className="h-2.5 w-full rounded-full shadow-inner relative overflow-hidden"
                style={{
                  background: 'linear-gradient(to right, #10b981 0%, #34d399 15%, #a3e635 30%, #facc15 50%, #f97316 70%, #ef4444 85%, #ffffff 100%)'
                }}
              />

              <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>{formatHeatmapPrice(stats?.minRate ?? 0, metric)}</span>
                <span className="text-slate-300">Avg {formatHeatmapPrice(stats?.avgRate ?? 0, metric)}</span>
                <span>{formatHeatmapPrice(stats?.maxRate ?? 0, metric)}</span>
              </div>
            </div>

            {/* Metric Switcher: Price / Sq.Ft vs Total Price */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-amber-400" />
                Comparison Metric
              </span>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800">
                <button
                  onClick={() => onMetricChange('sqft')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                    metric === 'sqft'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ₹/Sq.Ft (Land)
                </button>
                <button
                  onClick={() => onMetricChange('total')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                    metric === 'total'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Total ₹
                </button>
              </div>
            </div>

            {/* Live Micro-Market Stats Cards */}
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80">
                <div className="text-[9px] font-bold uppercase text-emerald-400">Entry Value</div>
                <div className="text-xs font-black text-white mt-0.5 truncate">
                  {formatHeatmapPrice(stats?.minRate ?? 0, metric)}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80">
                <div className="text-[9px] font-bold uppercase text-amber-400">Mean Rate</div>
                <div className="text-xs font-black text-white mt-0.5 truncate">
                  {formatHeatmapPrice(stats?.avgRate ?? 0, metric)}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80">
                <div className="text-[9px] font-bold uppercase text-rose-400">Peak Zone</div>
                <div className="text-xs font-black text-white mt-0.5 truncate">
                  {formatHeatmapPrice(stats?.maxRate ?? 0, metric)}
                </div>
              </div>
            </div>

            {/* Live interpolation node count info */}
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 bg-slate-900/50 rounded-lg px-2 py-1">
              <Info className="w-3 h-3 text-blue-400 flex-shrink-0" />
              <span className="truncate">
                Interpolating {stats?.totalPoints ?? 0} micro-markets & live catalog listings
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
