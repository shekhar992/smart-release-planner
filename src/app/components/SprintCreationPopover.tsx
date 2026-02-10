import { useState } from 'react';
import { X, Trash2, Edit3, AlertTriangle, Info } from 'lucide-react';
import { Sprint } from '../data/mockData';

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
  const [startDate, setStartDate] = useState(autoStartDate.toISOString().split('T')[0]);
  const [selectedDuration, setSelectedDuration] = useState<number>(snappedDuration);
  const [endDate, setEndDate] = useState(
    new Date(autoStartDate.getTime() + (snappedDuration - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [usePreset, setUsePreset] = useState(true);

  // Bulk creation state
  const [bulkCount, setBulkCount] = useState(4);
  const [bulkDuration, setBulkDuration] = useState(snappedDuration);
  const [bulkStartDate, setBulkStartDate] = useState(autoStartDate.toISOString().split('T')[0]);
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
    setEndDate(newEnd.toISOString().split('T')[0]);
  };

  const handleStartDateChange = (dateStr: string) => {
    setStartDate(dateStr);
    if (usePreset) {
      const start = new Date(dateStr);
      const newEnd = new Date(start.getTime() + selectedDuration * 24 * 60 * 60 * 1000);
      setEndDate(newEnd.toISOString().split('T')[0]);
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
    handleStartDateChange(autoStartDate.toISOString().split('T')[0]);
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
    setStartDate(sprint.startDate.toISOString().split('T')[0]);
    setEndDate(sprint.endDate.toISOString().split('T')[0]);
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
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Popover */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] bg-white rounded-xl shadow-2xl z-50 border border-gray-200 max-h-[85vh] flex flex-col">
        {/* Header with tabs */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => { setMode('create'); setEditingSprintId(null); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                mode === 'create' || mode === 'edit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {mode === 'edit' ? 'Edit Sprint' : 'Create Sprint'}
            </button>
            <button
              onClick={() => setMode('bulk')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                mode === 'bulk' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Generate Multiple
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {(mode === 'create' || mode === 'edit') && (
            <form onSubmit={mode === 'edit' ? handleSubmitEdit : handleSubmitCreate}>
              <div className="px-6 py-5 space-y-5">
                {/* Auto-calculated info banner */}
                {mode === 'create' && lastSprint && (
                  <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-700 leading-relaxed">
                      <span>Continues after </span>
                      <span className="font-semibold">{lastSprint.name}</span>
                      <span className="text-blue-500"> · ends {lastSprint.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <br />
                      <span className="text-blue-600">Start date &amp; duration auto-filled from previous sprint</span>
                    </div>
                  </div>
                )}

                {/* Sprint Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Sprint Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Sprint 1"
                    autoFocus
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent text-sm bg-gray-50/50"
                  />
                </div>

                {/* Duration Presets */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Duration</label>
                  <div className="flex gap-2">
                    {DURATION_PRESETS.map(preset => (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => handleDurationChange(preset.days)}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                          usePreset && selectedDuration === preset.days
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm bg-gray-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm bg-gray-50/50"
                    />
                  </div>
                </div>

                {/* Overlap Warning */}
                {overlap && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Overlaps with <strong>{overlap.name}</strong> ({overlap.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {overlap.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</span>
                  </div>
                )}

                {/* Existing Sprints List */}
                {existingSprints.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Existing Sprints ({existingSprints.length})
                    </label>
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-[160px] overflow-y-auto">
                      {existingSprints.map(sprint => (
                        <div key={sprint.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 group">
                          <div>
                            <div className="text-xs font-medium text-gray-800">{sprint.name}</div>
                            <div className="text-[10px] text-gray-500">
                              {sprint.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {sprint.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onUpdateSprint && (
                              <button
                                type="button"
                                onClick={() => startEditing(sprint)}
                                className="p-1 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit sprint"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                            {onDeleteSprint && (
                              <button
                                type="button"
                                onClick={() => onDeleteSprint(sprint.id)}
                                className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete sprint"
                              >
                                <Trash2 className="w-3 h-3" />
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
              <div className="flex items-center justify-end gap-2 px-6 py-4 bg-gray-50/50 border-t border-gray-200 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => { 
                    if (mode === 'edit') {
                      setMode('create'); 
                      setEditingSprintId(null);
                      setName(`Sprint ${nextSprintNumber}`);
                      handleStartDateChange(autoStartDate.toISOString().split('T')[0]);
                    } else {
                      onClose();
                    }
                  }}
                  className="px-4 py-2.5 text-sm font-normal text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                  {mode === 'edit' ? 'Cancel Edit' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || !!sprintDatesInvalid}
                  className="px-4 py-2.5 text-sm font-normal text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
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
                    <label className="block text-xs font-medium text-gray-600 mb-2">Number of Sprints</label>
                    <input
                      type="number"
                      value={bulkCount}
                      onChange={(e) => setBulkCount(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                      min="1"
                      max="12"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm bg-gray-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Starting Sprint #</label>
                    <input
                      type="number"
                      value={bulkStartNumber}
                      onChange={(e) => setBulkStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm bg-gray-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Sprint Duration</label>
                  <div className="flex gap-2">
                    {DURATION_PRESETS.map(preset => (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => setBulkDuration(preset.days)}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                          bulkDuration === preset.days
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">First Sprint Starts On</label>
                  <input
                    type="date"
                    value={bulkStartDate}
                    onChange={(e) => setBulkStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm bg-gray-50/50"
                  />
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Preview ({bulkCount} sprint{bulkCount > 1 ? 's' : ''})
                  </label>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-[200px] overflow-y-auto">
                    {bulkPreview.map((sprint, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2">
                        <span className="text-xs font-medium text-gray-800">{sprint.name}</span>
                        <span className="text-[10px] text-gray-500">
                          {sprint.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {sprint.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                    {bulkCount > 8 && (
                      <div className="px-3 py-2 text-[10px] text-gray-400 text-center">
                        ...and {bulkCount - 8} more
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-6 py-4 bg-gray-50/50 border-t border-gray-200 rounded-b-xl">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-normal text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-sm font-normal text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
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