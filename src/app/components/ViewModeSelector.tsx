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
    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
      <button
        onClick={() => onModeChange('detailed')}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
          currentMode === 'detailed'
            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
        title="Detailed planning view"
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span>Detailed</span>
      </button>
      <button
        onClick={() => onModeChange('executive')}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
          currentMode === 'executive'
            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
        title="Executive summary view for presentations"
      >
        <Presentation className="w-3.5 h-3.5" />
        <span>Exec</span>
      </button>
    </div>
  );
}
