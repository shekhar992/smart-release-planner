import { useState } from 'react';
import { X, Trash2, Edit3, AlertTriangle, Info, Calendar } from 'lucide-react';
import { cn } from './ui/utils';
import { Sprint } from '../data/mockData';
import { toLocalDateString } from '../lib/dateUtils';

interface SprintCreationPopoverProps {
  onClose: () => void;
  onCreateSprint: (name: string, startDate: Date, endDate: Date) => void;
  onUpdateSprint?: (sprintId: string, name: string, startDate: Date, endDate: Date) => void;
  onDeleteSprint?: (sprintId: string) => void;
  defaultStartDate?: Date;
  existingSprints?: Sprint[];
}

type DurationPreset = { label: string; days: number };

const DURATION_PRESETS: DurationPreset[] = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '3 weeks', days: 21 },
  { label: '4 weeks', days: 28 },
];

export function SprintCreationPopover({ 
  onClose, 
  onCreateSprint, 
  onUpdateSprint, 
  onDeleteSprint, 
  defaultStartDate,
  existingSprints = []
}: SprintCreationPopoverProps) {
  const [mode, setMode] = useState<'create' | 'edit' | 'bulk'>('create');
  const [editingSprintId, setEditingSprintId] = useState<string | null>(null);
  
  // Calculate auto-name and auto-start
  const nextSprintNumber = existingSprints.length + 1;
  const lastSprint = existingSprints.length > 0 
    ? existingSprints.reduce((latest, s) => s.endDate > latest.endDate ? s : latest) 
    : null;
  const autoStartDate = lastSprint 
    ? new Date(lastSprint.endDate.getTime() + 24 * 60 * 60 * 1000) // Day after last sprint ends
    : (defaultStartDate || new Date());

  // Auto-detect last sprint's duration (carry forward) — fallback to 14 days
  const detectedDuration = lastSprint
    ? Math.round((lastSprint.endDate.getTime() - lastSprint.startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1
    : 14;
  // Snap to nearest preset if close, otherwise use detected
  const snappedDuration = DURATION_PRESETS.find(p => Math.abs(p.days - detectedDuration) <= 1)?.days || detectedDuration;
  
  const [name, setName] = useState(`Sprint ${nextSprintNumber}`);
  const [startDate, setStartDate] = useState(toLocalDateString(autoStartDate));
  const [selectedDuration, setSelectedDuration] = useState<number>(snappedDuration);
  const [endDate, setEndDate] = useState(
    toLocalDateString(new Date(autoStartDate.getTime() + (snappedDuration - 1) * 24 * 60 * 60 * 1000))
  );
  const [usePreset, setUsePreset] = useState(true);

  // Bulk creation state
  const [bulkCount, setBulkCount] = useState(4);
  const [bulkDuration, setBulkDuration] = useState(snappedDuration);
  const [bulkStartDate, setBulkStartDate] = useState(toLocalDateString(autoStartDate));
  const [bulkStartNumber, setBulkStartNumber] = useState(nextSprintNumber);

  // Check for overlap with existing sprints
  const checkOverlap = (start: Date, end: Date, excludeId?: string) => {
    return existingSprints.filter(s => s.id !== excludeId).find(sprint => {
      return start < sprint.endDate && end > sprint.startDate;
    });
  };

  const handleDurationChange = (days: number) => {
    setSelectedDuration(days);
    setUsePreset(true);
    const start = new Date(startDate);
    const newEnd = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    setEndDate(toLocalDateString(newEnd));
  };

  const handleStartDateChange = (dateStr: string) => {
    setStartDate(dateStr);
    if (usePreset) {
      const start = new Date(dateStr);
      const newEnd = new Date(start.getTime() + selectedDuration * 24 * 60 * 60 * 1000);
      setEndDate(toLocalDateString(newEnd));
    }
  };

  const handleEndDateChange = (dateStr: string) => {
    setEndDate(dateStr);
    setUsePreset(false);
  };

  const sprintDatesInvalid = startDate && endDate && endDate < startDate;

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || sprintDatesInvalid) return;
    onCreateSprint(name.trim(), new Date(startDate), new Date(endDate));
    onClose();
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !editingSprintId || !onUpdateSprint || sprintDatesInvalid) return;
    onUpdateSprint(editingSprintId, name.trim(), new Date(startDate), new Date(endDate));
    setEditingSprintId(null);
    setMode('create');
    // Reset to next sprint defaults
    setName(`Sprint ${nextSprintNumber}`);
    handleStartDateChange(toLocalDateString(autoStartDate));
  };

  const handleBulkCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(bulkStartDate);
    for (let i = 0; i < bulkCount; i++) {
      const sprintStart = new Date(start.getTime() + (i * bulkDuration * 24 * 60 * 60 * 1000));
      const sprintEnd = new Date(sprintStart.getTime() + bulkDuration * 24 * 60 * 60 * 1000);
      onCreateSprint(`Sprint ${bulkStartNumber + i}`, sprintStart, sprintEnd);
    }
    onClose();
  };

  const startEditing = (sprint: Sprint) => {
    setMode('edit');
    setEditingSprintId(sprint.id);
    setName(sprint.name);
    setStartDate(toLocalDateString(sprint.startDate));
    setEndDate(toLocalDateString(sprint.endDate));
    setUsePreset(false);
  };

  const overlap = checkOverlap(new Date(startDate), new Date(endDate), editingSprintId || undefined);

  // Generate bulk preview
  const bulkPreview = Array.from({ length: Math.min(bulkCount, 8) }, (_, i) => {
    const sprintStart = new Date(new Date(bulkStartDate).getTime() + (i * bulkDuration * 24 * 60 * 60 * 1000));
    const sprintEnd = new Date(sprintStart.getTime() + bulkDuration * 24 * 60 * 60 * 1000);
    return {
      name: `Sprint ${bulkStartNumber + i}`,
      start: sprintStart,
      end: sprintEnd
    };
  });

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Popover */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl z-50 border border-slate-200 dark:border-slate-700 max-h-[85vh] flex flex-col">
        {/* Header with tabs */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-t-2xl">
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl p-1 backdrop-blur-sm">
            <button
              onClick={() => { setMode('create'); setEditingSprintId(null); }}
              className={cn(
                "px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200",
                mode === 'create' || mode === 'edit' 
                  ? 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-600 text-slate-900 dark:text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              {mode === 'edit' ? 'Edit Sprint' : 'Create Sprint'}
            </button>
            <button
              onClick={() => setMode('bulk')}
              className={cn(
                "px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200",
                mode === 'bulk' 
                  ? 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-600 text-slate-900 dark:text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              Generate Multiple
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-slate-800/30">
          {(mode === 'create' || mode === 'edit') && (
            <form onSubmit={mode === 'edit' ? handleSubmitEdit : handleSubmitCreate}>
              <div className="px-6 py-5 space-y-5">
                {/* Auto-calculated info banner */}
                {mode === 'create' && lastSprint && (
                  <div className="flex items-start gap-3 p-3.5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
                      <Info className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed flex-1">
                      <span>Continues after </span>
                      <span className="font-semibold">{lastSprint.name}</span>
                      <span className="text-blue-600 dark:text-blue-400"> · ends {lastSprint.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <br />
                      <span className="text-blue-600 dark:text-blue-400">Start date & duration auto-filled from previous sprint</span>
                    </div>
                  </div>
                )}

                {/* Sprint Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Sprint Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Sprint 1"
                    autoFocus
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 backdrop-blur-sm transition-all duration-200"
                  />
                </div>

                {/* Duration Presets */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Duration</label>
                  <div className="flex gap-2">
                    {DURATION_PRESETS.map(preset => (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => handleDurationChange(preset.days)}
                        className={cn(
                          "flex-1 px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all duration-200",
                          usePreset && selectedDuration === preset.days
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-sm transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-sm transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Overlap Warning */}
                {overlap && (
                  <div className="flex items-start gap-3 px-4 py-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <span className="text-amber-700 dark:text-amber-300">
                      Overlaps with <strong>{overlap.name}</strong> ({overlap.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {overlap.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                    </span>
                  </div>
                )}

                {/* Existing Sprints List */}
                {existingSprints.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Existing Sprints ({existingSprints.length})
                    </label>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700 max-h-[160px] overflow-y-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
                      {existingSprints.map(sprint => (
                        <div key={sprint.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 group transition-all duration-200">
                          <div>
                            <div className="text-xs font-semibold text-slate-800 dark:text-white">{sprint.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {sprint.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {sprint.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onUpdateSprint && (
                              <button
                                type="button"
                                onClick={() => startEditing(sprint)}
                                className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                title="Edit sprint"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteSprint && (
                              <button
                                type="button"
                                onClick={() => onDeleteSprint(sprint.id)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                title="Delete sprint"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => { 
                    if (mode === 'edit') {
                      setMode('create'); 
                      setEditingSprintId(null);
                      setName(`Sprint ${nextSprintNumber}`);
                      handleStartDateChange(toLocalDateString(autoStartDate));
                    } else {
                      onClose();
                    }
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 border border-slate-200 dark:border-slate-700"
                >
                  {mode === 'edit' ? 'Cancel Edit' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || !!sprintDatesInvalid}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
                >
                  {mode === 'edit' ? 'Save Changes' : 'Create Sprint'}
                </button>
              </div>
            </form>
          )}

          {mode === 'bulk' && (
            <form onSubmit={handleBulkCreate}>
              <div className="px-6 py-5 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Number of Sprints</label>
                    <input
                      type="number"
                      value={bulkCount}
                      onChange={(e) => setBulkCount(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                      min="1"
                      max="12"
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-sm transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Starting Sprint #</label>
                    <input
                      type="number"
                      value={bulkStartNumber}
                      onChange={(e) => setBulkStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-sm transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Sprint Duration</label>
                  <div className="flex gap-2">
                    {DURATION_PRESETS.map(preset => (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => setBulkDuration(preset.days)}
                        className={cn(
                          "flex-1 px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all duration-200",
                          bulkDuration === preset.days
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">First Sprint Starts On</label>
                  <input
                    type="date"
                    value={bulkStartDate}
                    onChange={(e) => setBulkStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-sm transition-all duration-200"
                  />
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Preview ({bulkCount} sprint{bulkCount > 1 ? 's' : ''})
                  </label>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700 max-h-[200px] overflow-y-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
                    {bulkPreview.map((sprint, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-xs font-semibold text-slate-800 dark:text-white">{sprint.name}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {sprint.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {sprint.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                    {bulkCount > 8 && (
                      <div className="px-4 py-2.5 text-[10px] text-slate-400 dark:text-slate-500 text-center">
                        ...and {bulkCount - 8} more
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl backdrop-blur-sm">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
                >
                  Create {bulkCount} Sprint{bulkCount > 1 ? 's' : ''}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}