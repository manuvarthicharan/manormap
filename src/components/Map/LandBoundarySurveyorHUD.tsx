import React, { useState } from 'react';
import { LandSurveyState } from '../../types';
import {
  PenTool,
  MapPin,
  Square,
  RotateCcw,
  Trash2,
  Check,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Copy
} from 'lucide-react';

export type SurveyDrawMode = 'freehand' | 'pegs' | 'box';

interface LandBoundarySurveyorHUDProps {
  surveyState: LandSurveyState;
  onChange?: (updatedState: LandSurveyState) => void;
  onClear: () => void;
  onUndo: () => void;
  onClose: () => void;
  onListThisLand?: (surveyState: LandSurveyState) => void;
  isListingMode?: boolean;
  onSaveListingBoundary?: () => void;
  drawMode: SurveyDrawMode;
  onDrawModeChange: (mode: SurveyDrawMode) => void;
}

export const LandBoundarySurveyorHUD: React.FC<LandBoundarySurveyorHUDProps> = ({
  surveyState,
  onChange: _onChange,
  onClear,
  onUndo,
  onClose,
  onListThisLand,
  isListingMode = false,
  onSaveListingBoundary,
  drawMode,
  onDrawModeChange
}) => {
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(false);
  const [copied, setCopied] = useState(false);

  const nodeCount = surveyState.points.length;
  const isComplete = nodeCount >= 3;

  const areaAcres = surveyState.areaAcres || 0;
  const areaGunthas = surveyState.areaGunthas || 0;
  const areaSqYards = surveyState.areaSqYards || 0;
  const areaSqFt = surveyState.areaSqFt || 0;
  const perimeterMeters = surveyState.perimeterMeters || 0;

  const handleCopyReport = () => {
    const text = `Parcel Measurements:\n• Area: ${areaAcres.toFixed(3)} acres (${areaGunthas} gunthas)\n• Gaj: ${areaSqYards.toLocaleString('en-IN')} sq yards\n• Sq Ft: ${areaSqFt.toLocaleString('en-IN')} sq ft\n• Perimeter: ${perimeterMeters} meters\n• Coordinates: ${nodeCount} vertices`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed top-16 inset-x-3 sm:left-5 sm:right-auto sm:max-w-3xl z-30 pointer-events-auto">
      {/* Drafting HUD Bar */}
      <div className="bg-[#181716] text-[#f5f5f4] rounded-xs border border-[#44403c] shadow-[0_2px_12px_rgba(0,0,0,0.2)] p-2 sm:px-3 sm:py-2 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
        
        {/* Left: Tool Name & Guide */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#8b3a24] flex-shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium tracking-wide uppercase font-mono text-[#f5f5f4] truncate">
                {isListingMode ? 'Listing Boundary' : 'Boundary Survey'}
              </span>
              <span className="text-[10px] font-mono text-[#a8a29e]">
                {nodeCount >= 3 ? `${nodeCount} vertices` : `${nodeCount} nodes`}
              </span>
            </div>
            <p className="text-[11px] text-[#a8a29e] truncate">
              {drawMode === 'freehand' && (nodeCount >= 3 ? 'Drag on map to redraw outline' : 'Drag on map to draw outline')}
              {drawMode === 'pegs' && (nodeCount === 0 ? 'Click map to place first corner' : 'Click map to add corner')}
              {drawMode === 'box' && 'Drag diagonally to form rectangle'}
            </p>
          </div>
        </div>

        {/* Center: Mode Toggles */}
        <div className="flex items-center border border-[#292524] rounded-xs bg-[#211f1d] p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => onDrawModeChange('freehand')}
            title="Draw outline"
            className={`px-2.5 py-1 rounded-xs font-medium transition-colors flex items-center gap-1 ${
              drawMode === 'freehand'
                ? 'bg-[#181716] text-[#f5f5f4] border border-[#44403c]'
                : 'text-[#a8a29e] hover:text-[#f5f5f4]'
            }`}
          >
            <PenTool className="w-3 h-3" />
            <span className="hidden sm:inline">Outline</span>
          </button>

          <button
            type="button"
            onClick={() => onDrawModeChange('pegs')}
            title="Place points"
            className={`px-2.5 py-1 rounded-xs font-medium transition-colors flex items-center gap-1 ${
              drawMode === 'pegs'
                ? 'bg-[#181716] text-[#f5f5f4] border border-[#44403c]'
                : 'text-[#a8a29e] hover:text-[#f5f5f4]'
            }`}
          >
            <MapPin className="w-3 h-3" />
            <span className="hidden sm:inline">Points</span>
          </button>

          <button
            type="button"
            onClick={() => onDrawModeChange('box')}
            title="Rectangle"
            className={`px-2.5 py-1 rounded-xs font-medium transition-colors flex items-center gap-1 ${
              drawMode === 'box'
                ? 'bg-[#181716] text-[#f5f5f4] border border-[#44403c]'
                : 'text-[#a8a29e] hover:text-[#f5f5f4]'
            }`}
          >
            <Square className="w-3 h-3" />
            <span className="hidden sm:inline">Rectangle</span>
          </button>
        </div>

        {/* Readout when >= 3 nodes placed */}
        {nodeCount >= 3 && (
          <div className="flex items-center gap-2">
            <div className="font-mono text-xs">
              <span className="text-[#8b3a24] font-medium">{areaAcres.toFixed(2)} ac</span>
              <span className="text-[#78716c] mx-1">•</span>
              <span className="text-[#a8a29e]">{areaGunthas} gu</span>
            </div>

            <button
              type="button"
              onClick={() => setShowDetailedMetrics(!showDetailedMetrics)}
              className="text-[11px] font-mono text-[#a8a29e] hover:text-[#f5f5f4] px-1.5 py-1 border border-[#292524] rounded-xs flex items-center gap-0.5"
            >
              <span>Specs</span>
              {showDetailedMetrics ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {nodeCount > 0 && (
            <button
              type="button"
              onClick={onUndo}
              className="w-7 h-7 rounded-xs border border-[#292524] text-[#a8a29e] hover:text-[#f5f5f4] flex items-center justify-center transition-colors"
              title="Undo last node"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {nodeCount > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="w-7 h-7 rounded-xs border border-[#292524] text-[#a8a29e] hover:text-[#8b3a24] flex items-center justify-center transition-colors"
              title="Clear"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {isListingMode ? (
            <button
              type="button"
              disabled={!isComplete}
              onClick={onSaveListingBoundary}
              className={`h-7 px-3 text-xs uppercase font-mono tracking-wider rounded-xs flex items-center gap-1 transition-colors ${
                isComplete
                  ? 'bg-[#8b3a24] hover:bg-[#7c2d12] text-white'
                  : 'bg-[#211f1d] text-[#78716c] cursor-not-allowed border border-[#292524]'
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
                className="h-7 px-2.5 bg-[#8b3a24] hover:bg-[#7c2d12] text-white text-xs uppercase font-mono tracking-wider rounded-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>List</span>
              </button>
            )
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-xs border border-[#292524] text-[#a8a29e] hover:text-[#f5f5f4] flex items-center justify-center transition-colors"
            title="Exit"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Asymmetrical Editorial Specs Sheet */}
      {showDetailedMetrics && nodeCount >= 3 && (
        <div className="mt-1.5 bg-[#181716] text-[#f5f5f4] rounded-xs border border-[#44403c] p-3 space-y-2.5 animate-in fade-in duration-100">
          <div className="flex items-center justify-between border-b border-[#292524] pb-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#a8a29e]">
              Parcel measurements
            </span>

            <button
              type="button"
              onClick={handleCopyReport}
              className="px-2 py-0.5 text-[11px] font-mono text-[#8b3a24] hover:text-white border border-[#44403c] rounded-xs flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Asymmetrical 2-Panel Layout: Large Primary Acreage (45%) + Tabular Secondary List (55%) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs font-mono">
            {/* Primary Left Metric */}
            <div className="sm:col-span-5 p-3 rounded-xs bg-[#211f1d] border border-[#292524] flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-[#78716c] uppercase tracking-wider">Primary Acreage</span>
                <div className="text-2xl font-serif text-[#f5f5f4] mt-0.5">
                  {areaAcres.toFixed(3)} <span className="text-sm font-sans text-[#8b3a24]">acres</span>
                </div>
              </div>
              <div className="text-[11px] text-[#a8a29e] mt-2 pt-2 border-t border-[#292524]">
                Equals <strong className="text-[#f5f5f4]">{areaGunthas}</strong> Gunthas (1 Ac = 40 Gu)
              </div>
            </div>

            {/* Secondary Right Table */}
            <div className="sm:col-span-7 divide-y divide-[#292524] text-xs">
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-[#a8a29e]">Square Yards (Gaj)</span>
                <span className="font-semibold text-[#f5f5f4]">{areaSqYards.toLocaleString('en-IN')}</span>
              </div>
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-[#a8a29e]">Total Square Feet</span>
                <span className="font-semibold text-[#f5f5f4]">{areaSqFt.toLocaleString('en-IN')} sq ft</span>
              </div>
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-[#a8a29e]">Fencing Perimeter</span>
                <span className="font-semibold text-[#f5f5f4]">{perimeterMeters} meters</span>
              </div>
              <div className="py-1.5 flex items-center justify-between text-[11px] text-[#78716c]">
                <span>GPS Boundary Vertices</span>
                <span>{nodeCount} coordinates</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandBoundarySurveyorHUD;
