import { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import { cn } from './ui/utils';
import { Milestone, MilestoneType } from '../data/mockData';
import { DatePicker } from './DatePicker';
import { toLocalDateString, parseLocalDate } from '../lib/dateUtils';

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
    <>
      <style>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .modal-content {
          animation: modalFadeIn 0.2s ease-out;
        }
      `}</style>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-slate-200 dark:border-slate-700 modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Flag className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add Milestone</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-5">
              {/* Milestone Name */}
              <div>
                <label htmlFor="milestone-name" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
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
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  {name.length}/50 characters
                </p>
              </div>

              {/* Type */}
              <div>
                <label htmlFor="milestone-type" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Type
                </label>
                <select
                  id="milestone-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as MilestoneType)}
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
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
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Single Date</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dateType"
                      value="range"
                      checked={dateType === 'range'}
                      onChange={() => setDateType('range')}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Date Range</span>
                  </label>
                </div>
              </div>

              {/* Date(s) */}
              {dateType === 'single' ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    Date
                  </label>
                  <DatePicker
                    value={toLocalDateString(startDate)}
                    onChange={(dateStr) => setStartDate(parseLocalDate(dateStr))}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      Start Date
                    </label>
                    <DatePicker
                      value={toLocalDateString(startDate)}
                      onChange={(dateStr) => setStartDate(parseLocalDate(dateStr))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      End Date
                    </label>
                    <DatePicker
                      value={toLocalDateString(endDate)}
                      onChange={(dateStr) => setEndDate(parseLocalDate(dateStr))}
                    />
                  </div>
                  {datesInvalid && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 dark:text-red-300">
                        End date must be on or after start date
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Blocking Checkbox (conditional) */}
              {canBeBlocking && (
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 border border-slate-200 dark:border-slate-700">
                    <input
                      type="checkbox"
                      checked={isBlocking}
                      onChange={(e) => setIsBlocking(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 rounded"
                    />
                    <div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        Block new work during this period
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Show warnings when tickets are scheduled during this milestone
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Outside Range Warning */}
              {isOutsideRange && (
                <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-200 dark:border-amber-800 rounded-lg shadow-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      This milestone falls outside the release timeline
                      {releaseStartDate && releaseEndDate && (
                        <span>
                          {' '}({releaseStartDate.toLocaleDateString()} – {releaseEndDate.toLocaleDateString()})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-b-2xl">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formValid}
                className={cn(
                  'px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200',
                  formValid
                    ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 hover:-translate-y-0.5'
                    : 'text-slate-400 bg-slate-200 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed'
                )}
              >
                Add Milestone
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
