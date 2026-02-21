import { useState, useEffect } from 'react';
import { Plus, Calendar, Trash2, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { useParams } from 'react-router';
import { cn } from './ui/utils';
import { PageShell } from './PageShell';
import { mockHolidays, Holiday } from '../data/mockData';
import { loadHolidays, saveHolidays } from '../lib/localStorage';
import { DatePicker } from './DatePicker';

export function HolidayManagement() {
  const { releaseId } = useParams();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Load holidays from localStorage on mount
  useEffect(() => {
    const storedHolidays = loadHolidays();
    setHolidays(storedHolidays || mockHolidays);
  }, []);

  const deleteHoliday = (holidayId: string) => {
    if (!confirm('Delete this holiday?')) return;
    
    setHolidays(prev => {
      const updated = prev.filter(h => h.id !== holidayId);
      saveHolidays(updated);
      return updated;
    });
  };

  const addHoliday = (holiday: Holiday) => {
    setHolidays(prev => {
      const updated = [...prev, holiday].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      saveHolidays(updated);
      return updated;
    });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getHolidaysForDay = (date: Date | null) => {
    if (!date) return [];
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    return holidays.filter(holiday => {
      const holidayStart = new Date(holiday.startDate);
      const holidayEnd = new Date(holiday.endDate);
      holidayStart.setHours(0, 0, 0, 0);
      holidayEnd.setHours(0, 0, 0, 0);
      return checkDate >= holidayStart && checkDate <= holidayEnd;
    });
  };

  const handleQuickAddHoliday = (date: Date) => {
    setShowAddForm(true);
  };

  const monthDays = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <PageShell
      breadcrumbs={
        releaseId
          ? [
              { label: 'Products', to: '/' },
              { label: 'Release', to: `/release/${releaseId}` },
              { label: 'Holidays' }
            ]
          : [
              { label: 'Products', to: '/' },
              { label: 'Holidays' }
            ]
      }
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Holidays Calendar</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Manage company and regional holidays. Changes automatically update capacity planning across all releases.</p>
            </div>
          </div>
        </div>

        {/* Toolbar with Primary Add CTA */}
        <div className="mb-4 flex items-center justify-between gap-4 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            {holidays.length} holiday{holidays.length !== 1 ? 's' : ''} configured
          </div>

          {/* Primary Add Holiday CTA */}
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-lg transition-all duration-200 shadow-lg shadow-amber-500/30"
          >
            <Plus className="w-4 h-4" />
            Add Holiday
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={goToPreviousMonth}
              className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
              title="Previous month"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>

            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{monthName}</h2>

            <button
              onClick={goToNextMonth}
              className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
              title="Next month"
            >
              <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Day of week headers */}
            <div className="grid grid-cols-7 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="px-3 py-5 text-center text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {monthDays.map((date, index) => {
                const isWeekend = date ? (date.getDay() === 0 || date.getDay() === 6) : false;
                const dayHolidays = getHolidaysForDay(date);
                const hasHoliday = dayHolidays.length > 0;

                return (
                  <div
                    key={index}
                    className={cn(
                      "group relative min-h-[125px] border-r border-b border-slate-200 dark:border-slate-700 p-3 transition-colors duration-200",
                      date ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800',
                      isWeekend && 'bg-slate-50 dark:bg-slate-800/50',
                      hasHoliday && 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20'
                    )}
                  >
                    {date && (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div className={cn(
                            "text-lg font-semibold",
                            hasHoliday ? 'text-amber-700 dark:text-amber-300' : 'text-slate-900 dark:text-white'
                          )}>
                            {date.getDate()}
                          </div>
                          {/* Quick add icon - visible on hover */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAddHoliday(date);
                            }}
                            className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
                            aria-label={`Add holiday for ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                            title="Add holiday for this day"
                          >
                            <Plus className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          </button>
                        </div>

                        {/* Holiday indicators */}
                        {dayHolidays.length > 0 && (
                          <div className="space-y-1.5">
                            {dayHolidays.map((holiday) => (
                              <div
                                key={holiday.id}
                                className="group/holiday flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-sm"
                                title={holiday.name}
                              >
                                <span className="truncate flex-1">{holiday.name}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteHoliday(holiday.id);
                                  }}
                                  className="opacity-0 group-hover/holiday:opacity-100 ml-1 w-5 h-5 flex items-center justify-center hover:bg-amber-600 rounded transition-all duration-200"
                                  aria-label={`Delete ${holiday.name}`}
                                  title="Delete holiday"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Holiday List below calendar */}
          {holidays.length > 0 && (
            <div className="mt-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  All Holidays ({holidays.length})
                </h3>
              </div>
              <div className="space-y-2">
                {holidays.map(holiday => {
                  const formatDateRange = (startDate: Date, endDate: Date) => {
                    const isSameDay = startDate.toDateString() === endDate.toDateString();
                    if (isSameDay) {
                      return startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    }
                    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                  };

                  return (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/30 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-white">{holiday.name}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            {formatDateRange(holiday.startDate, holiday.endDate)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteHoliday(holiday.id)}
                        className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all duration-200"
                        title="Delete holiday"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
      </div>

      {/* Add Holiday Modal */}
      {showAddForm && (
        <AddHolidayModal
          onClose={() => setShowAddForm(false)}
          onAdd={(holiday) => {
            addHoliday(holiday);
            setShowAddForm(false);
          }}
        />
      )}
    </PageShell>
  );
}

interface AddHolidayModalProps {
  onClose: () => void;
  onAdd: (holiday: Holiday) => void;
}

function AddHolidayModal({ onClose, onAdd }: AddHolidayModalProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  const datesInvalid = startDate && endDate && endDate < startDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || datesInvalid) return;

    const newHoliday: Holiday = {
      id: `h${Date.now()}`,
      name: name.trim(),
      startDate: startDate,
      endDate: endDate
    };

    onAdd(newHoliday);
  };

  return (
    <>
      <style>{`
        .modal-appear {
          animation: modalAppear 0.2s ease-out;
        }
        @keyframes modalAppear {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-slate-200 dark:border-slate-700 modal-appear">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Add Holiday</h3>
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
            <div className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="holiday-name" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Holiday Name
                </label>
                <input
                  id="holiday-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Memorial Day, Company Shutdown"
                  autoFocus
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Start Date
                </label>
                <DatePicker
                  value={startDate.toISOString().split('T')[0]}
                  onChange={(dateStr) => setStartDate(new Date(dateStr))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  End Date
                </label>
                <DatePicker
                  value={endDate.toISOString().split('T')[0]}
                  onChange={(dateStr) => setEndDate(new Date(dateStr))}
                />
              </div>

              {datesInvalid && (
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <span>⚠️</span> End date must be on or after start date
                </p>
              )}

              <p className="text-xs text-slate-600 dark:text-slate-400">
                For single-day holidays, set the same start and end date.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3 bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-b-2xl">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || !!datesInvalid}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-lg transition-all duration-200 shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Add Holiday
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
