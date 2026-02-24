/**
 * View Mode Selector Component
 * 
 * Provides view mode toggle between planning and executive views:
 * - Detailed mode: Shows granular ticket-level timeline (default)
 * - Executive mode: Shows high-level feature/epic overview for PPTX export
 */

import { LayoutGrid, Presentation } from 'lucide-react';

export type ViewMode = 'detailed' | 'executive';

interface ViewModeSelectorProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export function ViewModeSelector({
  currentMode,
  onModeChange
}: ViewModeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        View:
      </span>
      <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
        <button
          onClick={() => onModeChange('detailed')}
          className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
            currentMode === 'detailed'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title="Detailed planning view with individual tickets"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Detailed</span>
        </button>
        <div className="w-px h-5 bg-gray-300" />
        <button
          onClick={() => onModeChange('executive')}
          className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
            currentMode === 'executive'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title="Executive summary view for presentations"
        >
          <Presentation className="w-3.5 h-3.5" />
          <span>Executive</span>
        </button>
      </div>
    </div>
  );
}
