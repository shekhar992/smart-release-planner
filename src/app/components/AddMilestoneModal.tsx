import { useState } from 'react';
import { X } from 'lucide-react';
import { Milestone, MilestoneType } from '../data/mockData';
import { DatePicker } from './DatePicker';

interface AddMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  releaseId: string;
  onSave: (milestone: Milestone) => void;
  releaseStartDate?: Date;
  releaseEndDate?: Date;
}

export function AddMilestoneModal({ 
  isOpen, 
  onClose, 
  releaseId, 
  onSave,
  releaseStartDate,
  releaseEndDate
}: AddMilestoneModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<MilestoneType>('Testing');
  const [dateType, setDateType] = useState<'single' | 'range'>('single');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isBlocking, setIsBlocking] = useState(false);

  if (!isOpen) return null;

  const datesInvalid = dateType === 'range' && endDate < startDate;
  const nameInvalid = name.trim().length === 0 || name.length > 50;
  const formValid = !nameInvalid && !datesInvalid;

  // Show blocking checkbox only for specific types
  const canBeBlocking = ['Freeze', 'Deployment', 'Approval'].includes(type);

  // Check if dates are outside release range (warning only)
  const isOutsideRange = releaseStartDate && releaseEndDate && (
    startDate < releaseStartDate ||
    startDate > releaseEndDate ||
    (dateType === 'range' && (endDate < releaseStartDate || endDate > releaseEndDate))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;

    const newMilestone: Milestone = {
      id: `milestone-${Date.now()}`,
      releaseId,
      name: name.trim(),
      type,
      dateType,
      startDate,
      endDate: dateType === 'range' ? endDate : undefined,
      isBlocking: canBeBlocking ? isBlocking : false,
    };

    onSave(newMilestone);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg shadow-xl w-full max-w-md mx-4 border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Add Milestone</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            {/* Milestone Name */}
            <div>
              <label htmlFor="milestone-name" className="block text-sm font-medium text-foreground mb-1.5">
                Milestone Name <span className="text-red-500">*</span>
              </label>
              <input
                id="milestone-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Go Live, Code Freeze, SIT Phase"
                maxLength={50}
                autoFocus
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {name.length}/50 characters
              </p>
            </div>

            {/* Type */}
            <div>
              <label htmlFor="milestone-type" className="block text-sm font-medium text-foreground mb-1.5">
                Type
              </label>
              <select
                id="milestone-type"
                value={type}
                onChange={(e) => setType(e.target.value as MilestoneType)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="Testing">Testing</option>
                <option value="Deployment">Deployment</option>
                <option value="Approval">Approval</option>
                <option value="Freeze">Freeze</option>
                <option value="Launch">Launch</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Date Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dateType"
                    value="single"
                    checked={dateType === 'single'}
                    onChange={() => setDateType('single')}
                    className="w-4 h-4 text-primary focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-sm text-foreground">Single Date</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dateType"
                    value="range"
                    checked={dateType === 'range'}
                    onChange={() => setDateType('range')}
                    className="w-4 h-4 text-primary focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-sm text-foreground">Date Range</span>
                </label>
              </div>
            </div>

            {/* Date(s) */}
            {dateType === 'single' ? (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Date
                </label>
                <DatePicker
                  value={startDate.toISOString().split('T')[0]}
                  onChange={(dateStr) => setStartDate(new Date(dateStr))}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Start Date
                  </label>
                  <DatePicker
                    value={startDate.toISOString().split('T')[0]}
                    onChange={(dateStr) => setStartDate(new Date(dateStr))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    End Date
                  </label>
                  <DatePicker
                    value={endDate.toISOString().split('T')[0]}
                    onChange={(dateStr) => setEndDate(new Date(dateStr))}
                  />
                </div>
                {datesInvalid && (
                  <p className="text-xs text-red-500">
                    End date must be on or after start date
                  </p>
                )}
              </div>
            )}

            {/* Blocking Checkbox (conditional) */}
            {canBeBlocking && (
              <div className="pt-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBlocking}
                    onChange={(e) => setIsBlocking(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-primary focus:ring-2 focus:ring-ring rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      Block new work during this period
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Show warnings when tickets are scheduled during this milestone
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Outside Range Warning */}
            {isOutsideRange && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-xs text-amber-800">
                  ⚠ This milestone falls outside the release timeline
                  {releaseStartDate && releaseEndDate && (
                    <span>
                      {' '}({releaseStartDate.toLocaleDateString()} – {releaseEndDate.toLocaleDateString()})
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formValid}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground rounded-md transition-colors"
            >
              Add Milestone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
