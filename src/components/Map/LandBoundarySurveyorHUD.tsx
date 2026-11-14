import React, { useState } from 'react';
import {
  Ruler,
  RotateCcw,
  Trash2,
  Check,
  X,
  Copy,
  ChevronDown,
  Plus,
  PenTool,
  MapPin,
  Square
} from 'lucide-react';
import { LandSurveyState } from '../../types';

export type SurveyDrawMode = 'freehand' | 'pegs' | 'box';

interface LandBoundarySurveyorHUDProps {
  surveyState: LandSurveyState;
  onChange?: (state: LandSurveyState) => void;
  drawMode: SurveyDrawMode;
  onDrawModeChange: (mode: SurveyDrawMode) => void;
  onUndo: () => void;
  onClear: () => void;
  onClose: () => void;
  isListingMode?: boolean;
  onSaveListingBoundary?: () => void;
  onListThisLand?: (survey: LandSurveyState) => void;
}

export const LandBoundarySurveyorHUD: React.FC<LandBoundarySurveyorHUDProps> = ({
  surveyState,
  drawMode,
  onDrawModeChange,
  onUndo,
  onClear,
  onClose,
  isListingMode = false,
  onSaveListingBoundary,
  onListThisLand
}) => {
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(false);
  const [copied, setCopied] = useState(false);

  const { points, areaAcres, areaGunthas, areaSqYards, areaSqFt, perimeterMeters } = surveyState;
  const nodeCount = points.length;
  const isComplete = nodeCount >= 3;

  // Generate survey text report for clipboard copy
  const handleCopyReport = () => {
    const report = `LAND BOUNDARY SURVEY REPORT (ManorMap Cadastral Survey)
===================================================
• Surveyed Parcel Area: ${areaAcres.toFixed(3)} Acres
• Gunthas: ${areaGunthas} Gunthas
• Sq. Yards (Gaj): ${areaSqYards.toLocaleString('en-IN')} Gaj
• Total Sq. Feet: ${areaSqFt.toLocaleString('en-IN')} Sq. Ft
• Outer Perimeter: ${perimeterMeters.toLocaleString('en-IN')} meters
• Boundary Vertices: ${nodeCount} Pegged GPS Nodes
• Verified Standard: Indian Cadastral Standards (1 Acre = 40 Gunthas = 4840 Gaj)`;

    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto transition-all animate-in fade-in slide-in-from-top-2 duration-200 max-w-[96vw] sm:max-w-2xl">
      {/* Sleek Architectural Pill Toolbar */}
      <div className="bg-slate-900/95 text-white backdrop-blur-xl rounded-full shadow-2xl border border-slate-700/70 px-2 sm:px-3 py-1.5 flex items-center gap-1.5 sm:gap-2.5">
        
        {/* Left: Tool Icon & Title */}
        <div className="flex items-center gap-1.5 pl-1 flex-shrink-0">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Ruler className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <span className="text-xs font-bold text-white tracking-tight hidden sm:inline">
            {isListingMode ? 'Parcel Boundary' : 'Land Surveyor'}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded-full border border-slate-700/60 flex-shrink-0">
            {nodeCount} {nodeCount === 1 ? 'pt' : 'pts'}
          </span>
        </div>

        {/* Subtle Divider */}
        <div className="w-px h-4 bg-slate-700/80 flex-shrink-0 hidden sm:block" />

        {/* Center: Segmented Drawing Mode Switcher */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-full border border-slate-700/60 flex-shrink-0">
          <button
            type="button"
            onClick={() => onDrawModeChange('freehand')}
            title="Freehand Mask (drag mouse around property)"
            className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all ${
              drawMode === 'freehand'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool className="w-3 h-3" />
            <span className="hidden sm:inline">Freehand</span>
          </button>

          <button
            type="button"
            onClick={() => onDrawModeChange('pegs')}
            title="Corner Pegs (click corners to form polygon)"
            className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all ${
              drawMode === 'pegs'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3 h-3" />
            <span className="hidden sm:inline">Pegs</span>
          </button>

          <button
            type="button"
            onClick={() => onDrawModeChange('box')}
            title="Box Mask (drag rectangle)"
            className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all ${
              drawMode === 'box'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Square className="w-3 h-3" />
            <span className="hidden sm:inline">Box</span>
          </button>
        </div>

        {/* Live Cadastral Metric Tag (Appears when >= 3 nodes) */}
        {nodeCount >= 3 && (
          <button
            type="button"
            onClick={() => setShowDetailedMetrics(!showDetailedMetrics)}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-all flex-shrink-0"
            title="View Cadastral Breakdown"
          >
            <span className="text-xs font-extrabold">{areaAcres.toFixed(2)} Ac</span>
            <span className="text-[10px] text-emerald-400/80 font-medium hidden md:inline">({areaGunthas} Gu)</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showDetailedMetrics ? 'rotate-180' : ''}`} />
          </button>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Undo */}
          {nodeCount > 0 && (
            <button
              type="button"
              onClick={onUndo}
              className="w-7 h-7 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center justify-center transition-colors"
              title="Undo last node"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Clear */}
          {nodeCount > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="w-7 h-7 rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 flex items-center justify-center transition-colors"
              title="Clear boundary"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Primary Action Button */}
          {isListingMode ? (
            <button
              type="button"
              disabled={!isComplete}
              onClick={onSaveListingBoundary}
              className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 ${
                isComplete
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-3 h-3 stroke-[2.5]" />
              <span>Save</span>
            </button>
          ) : (
            isComplete && onListThisLand && (
              <button
                type="button"
                onClick={() => onListThisLand(surveyState)}
                className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 shadow-xs transition-all active:scale-95"
                title="List surveyed land"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>List</span>
              </button>
            )
          )}

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center justify-center transition-colors"
            title="Close Surveyor"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Compact Cadastral Specs Popover */}
      {showDetailedMetrics && nodeCount >= 3 && (
        <div className="mt-2 w-full sm:w-84 mx-auto bg-slate-900/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/80 p-3.5 text-xs space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Cadastral Breakdown
            </span>
            <button
              type="button"
              onClick={handleCopyReport}
              className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-semibold flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-medium">Acres & Gunthas</span>
              <div className="text-base font-extrabold text-emerald-400">
                {areaAcres.toFixed(3)} <span className="text-xs font-semibold text-slate-400">({areaGunthas} Gu)</span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-medium">Sq. Yards (Gaj)</span>
              <div className="text-base font-extrabold text-white">
                {areaSqYards.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-medium">Total Sq. Ft</span>
              <div className="text-sm font-bold text-slate-200">
                {areaSqFt.toLocaleString('en-IN')} sqft
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-medium">Outer Perimeter</span>
              <div className="text-sm font-bold text-sky-400">
                {perimeterMeters.toLocaleString('en-IN')} m
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-800/60">
            {nodeCount} GPS nodes • 1 Acre = 40 Gunthas = 4,840 Gaj
          </div>
        </div>
      )}
    </div>
  );
};

export default LandBoundarySurveyorHUD;
