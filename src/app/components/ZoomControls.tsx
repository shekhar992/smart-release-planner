/**
 * Zoom Controls Component (Phase 2)
 * 
 * Provides zoom level controls for the Gantt timeline view:
 * - Day view (40px per day) - Default
 * - Week view (compressed) - For sprint overview
 * - Month view (very compressed) - For release overview
 * - "Fit Release" button - Fit entire release in viewport
 */

import { Maximize2 } from 'lucide-react';

export type ZoomLevel = 'day' | 'week' | 'month';

interface ZoomControlsProps {
  currentZoom: ZoomLevel;
  onZoomChange: (zoom: ZoomLevel) => void;
  onFitReleaseClick: () => void;
}

const LEVELS: { value: ZoomLevel; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

export function ZoomControls({
  currentZoom,
  onZoomChange,
  onFitReleaseClick,
}: ZoomControlsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
        {LEVELS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onZoomChange(value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              currentZoom === value
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title={`${label} view`}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        onClick={onFitReleaseClick}
        className="btn-icon"
        title="Fit entire release to viewport"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
