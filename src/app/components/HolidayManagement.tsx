import { useState, useEffect } from 'react';
import { Plus, Calendar, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockHolidays, Holiday } from '../data/mockData';
import { loadHolidays, saveHolidays } from '../lib/localStorage';
import { DatePicker } from './DatePicker';

export function HolidayManagement() {
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
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-foreground">Holidays Calendar</h1>
            <p className="text-sm text-muted-foreground">{holidays.length} holidays configured</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Holiday
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Calendar Grid */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-muted border-b border-border">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-card rounded transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <h2 className="text-xl font-semibold text-foreground">{monthName}</h2>

              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-card rounded transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Day of week headers */}
            <div className="grid grid-cols-7 bg-muted border-b border-border">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="px-3 py-5 text-center text-base font-semibold text-muted-foreground">
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
                    className={`group relative min-h-[125px] border-r border-b border-border p-3 ${
                      date ? 'bg-card' : 'bg-muted'
                    } ${isWeekend ? 'bg-muted' : ''} ${hasHoliday ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}
                  >
                    {date && (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-lg font-medium text-foreground">
                            {date.getDate()}
                          </div>
                          {/* Quick add icon - visible on hover */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAddHoliday(date);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-all"
                            aria-label={`Add holiday for ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                            title="Add holiday for this day"
                          >
                            <Plus className="w-5 h-5 text-muted-foreground" />
                          </button>
                        </div>

                        {/* Holiday indicators */}
                        {dayHolidays.length > 0 && (
                          <div className="space-y-1">
                            {dayHolidays.map((holiday) => (
                              <div
                                key={holiday.id}
                                className="group/holiday flex items-center justify-between text-sm px-2 py-1.5 rounded-sm bg-amber-500 text-white font-medium"
                                title={holiday.name}
                              >
                                <span className="truncate flex-1">{holiday.name}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteHoliday(holiday.id);
                                  }}
                                  className="opacity-0 group-hover/holiday:opacity-100 ml-1 p-0.5 hover:bg-amber-600 rounded transition-all"
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
            <div className="mt-6 bg-card rounded-lg border border-border p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                All Holidays ({holidays.length})
              </h3>
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
                      className="flex items-center justify-between p-3 bg-muted rounded-md border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-foreground">{holiday.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {formatDateRange(holiday.startDate, holiday.endDate)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteHoliday(holiday.id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-card rounded transition-colors"
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
    </div>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md mx-4 border border-border">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Add Holiday</h3>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            <div>
              <label htmlFor="holiday-name" className="block text-sm font-medium text-foreground mb-1">
                Holiday Name
              </label>
              <input
                id="holiday-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Memorial Day, Company Shutdown"
                autoFocus
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Start Date
              </label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                End Date
              </label>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
              />
            </div>

            {datesInvalid && (
              <p className="text-xs text-red-500">End date must be on or after start date</p>
            )}

            <p className="text-xs text-muted-foreground">
              For single-day holidays, set the same start and end date.
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-foreground hover:bg-muted border border-border rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !!datesInvalid}
              className="px-4 py-2 text-sm text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Holiday
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
