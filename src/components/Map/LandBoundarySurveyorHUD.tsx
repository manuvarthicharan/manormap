import React, { useState } from 'react';
import {
  Ruler,
  RotateCcw,
  Trash2,
  Check,
  X,
  Copy,
  ChevronDown,
  ChevronUp,
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
      setTimeout(() => setCopied(false), 2200);
    });
  };

  return (
    <div className="fixed top-16 sm:top-20 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:max-w-4xl z-40 pointer-events-auto transition-all animate-in fade-in slide-in-from-top-2 duration-200">
      {/* 
        MAIN SAAS COMMAND BAR
      */}
      <div className="bg-slate-900/98 dark:bg-slate-950/98 text-white backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/80 p-2.5 sm:px-4 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        
        {/* Top/Left: Indicator, Title & Status */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Ruler className="w-4 h-4 stroke-[2.2]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black tracking-tight text-white truncate">
                  {isListingMode ? 'Map Parcel Boundary' : 'Land Boundary Surveyor'}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
                  {nodeCount >= 3 ? `${nodeCount} Pegs` : `${nodeCount} Nodes`}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate font-medium hidden sm:block">
                {drawMode === 'freehand' && (nodeCount >= 3 ? `${areaAcres.toFixed(2)} Ac • Drag to re-mask` : 'Drag mouse around property to mask')}
                {drawMode === 'pegs' && (nodeCount === 0 ? 'Click to drop 1st corner peg' : `${nodeCount} corners placed • Click to add more`)}
                {drawMode === 'box' && 'Drag diagonally to create rectangle'}
              </p>
            </div>
          </div>

          {/* Close button on mobile in top-right */}
          <button
            type="button"
            onClick={onClose}
            className="sm:hidden h-7 w-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-700"
            title="Exit Surveyor"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom/Right: Controls, Mode Toggles, Metrics & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap sm:flex-nowrap">
          {/* Mode Toggles Capsule */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-xl border border-slate-700 flex-shrink-0">
            <button
              type="button"
              onClick={() => onDrawModeChange('freehand')}
              title="Freehand Mouse Masking (Drag around boundary)"
              className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                drawMode === 'freehand'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <PenTool className="w-3 h-3" />
              <span className="text-[11px]">Freehand</span>
            </button>

            <button
              type="button"
              onClick={() => onDrawModeChange('pegs')}
              title="Click Corner Pegs (Multi-point polygon)"
              className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                drawMode === 'pegs'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span className="text-[11px]">Pegs</span>
            </button>

            <button
              type="button"
              onClick={() => onDrawModeChange('box')}
              title="Box Drag (4-corner rectangle)"
              className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                drawMode === 'box'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Square className="w-3 h-3" />
              <span className="text-[11px]">Box</span>
            </button>
          </div>

          {/* Live Metrics Quick View */}
          {nodeCount >= 3 && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="h-7 px-2 rounded-lg bg-emerald-950/70 border border-emerald-500/40 flex items-center gap-1 text-xs">
                <span className="text-[10px] text-emerald-400 font-bold">Ac:</span>
                <span className="font-extrabold text-white text-xs">{areaAcres.toFixed(2)}</span>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailedMetrics(!showDetailedMetrics)}
                className="h-7 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Cadastral details"
              >
                <span>Report</span>
                {showDetailedMetrics ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {nodeCount > 0 && (
              <button
                type="button"
                onClick={onUndo}
                className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition-colors"
                title="Undo Last Node"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}

            {nodeCount > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 flex items-center justify-center border border-slate-700 transition-colors"
                title="Clear Mask"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}

            {/* Primary Action Button */}
            {isListingMode ? (
              <button
                type="button"
                disabled={!isComplete}
                onClick={onSaveListingBoundary}
                className={`h-7 px-2.5 text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm transition-all ${
                  isComplete
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Check className="w-3 h-3" />
                <span>Save</span>
              </button>
            ) : (
              isComplete && onListThisLand && (
                <button
                  type="button"
                  onClick={() => onListThisLand(surveyState)}
                  className="h-7 px-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm transition-all active:scale-95"
                  title="List this surveyed land"
                >
                  <Plus className="w-3 h-3" />
                  <span>List</span>
                </button>
              )
            )}

            {/* Desktop Exit / Close */}
            <button
              type="button"
              onClick={onClose}
              className="hidden sm:flex h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white items-center justify-center border border-slate-700 transition-colors"
              title="Exit Surveyor"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 
        EXPANDED DETAILED SAAS METRICS CARD (Standard Indian Land Units)
      */}
      {showDetailedMetrics && nodeCount >= 3 && (
        <div className="mt-2 bg-slate-900/98 text-white backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700 p-3 sm:p-4 space-y-2.5 animate-in fade-in duration-150 max-h-[50vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Indian Cadastral Metrics Breakdown
              </h4>
            </div>

            <button
              type="button"
              onClick={handleCopyReport}
              className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy Report'}</span>
            </button>
          </div>

          {/* 4-Box Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* Acres */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[10px] font-bold uppercase text-slate-400">Acres (Ac)</span>
              <div className="text-base sm:text-lg font-black text-emerald-400">{areaAcres.toFixed(3)}</div>
              <span className="text-[9px] text-slate-500">1 Ac = 40 Gunthas</span>
            </div>

            {/* Gunthas */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[10px] font-bold uppercase text-slate-400">Gunthas</span>
              <div className="text-base sm:text-lg font-black text-amber-400">{areaGunthas}</div>
              <span className="text-[9px] text-slate-500">1 Guntha = 121 Gaj</span>
            </div>

            {/* Sq. Yards (Gaj) */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[10px] font-bold uppercase text-slate-400">Sq. Yards (Gaj)</span>
              <div className="text-base sm:text-lg font-black text-white">{areaSqYards.toLocaleString('en-IN')}</div>
              <span className="text-[9px] text-slate-500">Standard plot unit</span>
            </div>

            {/* Outer Perimeter */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[10px] font-bold uppercase text-slate-400">Perimeter</span>
              <div className="text-base sm:text-lg font-black text-sky-400">{perimeterMeters} m</div>
              <span className="text-[9px] text-slate-500">Fencing distance</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Vertices: <strong className="text-white">{nodeCount} Pegs</strong></span>
            <span>Total Area: <strong className="text-white">{areaSqFt.toLocaleString('en-IN')} Sq. Ft</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandBoundarySurveyorHUD;
