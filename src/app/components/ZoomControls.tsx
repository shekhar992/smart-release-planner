/**
 * Zoom Controls Component (Phase 2)
 * 
 * Provides zoom level controls for the Gantt timeline view:
 * - Day view (40px per day) - Default
 * - Week view (compressed) - For sprint overview
 * - Month view (very compressed) - For release overview
 * - "Today" button - Scroll to today's date
 * - "Fit Release" button - Fit entire release in viewport
 */

import { ZoomIn, ZoomOut, Calendar } from 'lucide-react';

export type ZoomLevel = 'day' | 'week' | 'month';

interface ZoomControlsProps {
  currentZoom: ZoomLevel;
  onZoomChange: (zoom: ZoomLevel) => void;
  onTodayClick: () => void;
  onFitReleaseClick: () => void;
}

export function ZoomControls({
  currentZoom,
  onZoomChange,
  onTodayClick,
  onFitReleaseClick
}: ZoomControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Zoom Level Selector */}
      <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
        <button
          onClick={() => onZoomChange('day')}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            currentZoom === 'day'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title="Day view (detailed)"
        >
          Day
        </button>
        <div className="w-px h-5 bg-gray-300" />
        <button
          onClick={() => onZoomChange('week')}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            currentZoom === 'week'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title="Week view (sprint overview)"
        >
          Week
        </button>
        <div className="w-px h-5 bg-gray-300" />
        <button
          onClick={() => onZoomChange('month')}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            currentZoom === 'month'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title="Month view (release overview)"
        >
          Month
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300" />

      {/* Zoom In/Out Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => {
            if (currentZoom === 'month') onZoomChange('week');
            else if (currentZoom === 'week') onZoomChange('day');
          }}
          disabled={currentZoom === 'day'}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={() => {
            if (currentZoom === 'day') onZoomChange('week');
            else if (currentZoom === 'week') onZoomChange('month');
          }}
          disabled={currentZoom === 'month'}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300" />

      {/* Navigation Buttons */}
      <button
        onClick={onTodayClick}
        className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1.5"
        title="Scroll to today"
      >
        <Calendar className="w-3.5 h-3.5" />
        <span>Today</span>
      </button>

      <button
        onClick={onFitReleaseClick}
        className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        title="Fit entire release to viewport"
      >
        Fit Release
      </button>
    </div>
  );
}
