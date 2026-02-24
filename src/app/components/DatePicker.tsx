import { forwardRef, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parse, isValid, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, isAfter, isBefore, startOfDay } from 'date-fns';
import * as Popover from '@radix-ui/react-popover';
import designTokens from '../lib/designTokens';

interface DatePickerProps {
  value: string; // ISO date string (yyyy-MM-dd)
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
  className?: string;
  error?: string;
}

export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(
  ({ 
    value, 
    onChange, 
    label, 
    helperText,
    error,
    placeholder = 'Select date',
    minDate,
    maxDate,
    required = false,
    className = '',
  }, ref) => {
    const [open, setOpen] = useState(false);
    
    // Convert ISO string to Date object
    const selectedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
    const isValidDate = selectedDate && isValid(selectedDate);
    
    // Current month being viewed in calendar
    const [currentMonth, setCurrentMonth] = useState<Date>(
      isValidDate ? selectedDate : new Date()
    );

    // Convert min/max dates
    const minDateObj = minDate ? startOfDay(parse(minDate, 'yyyy-MM-dd', new Date())) : undefined;
    const maxDateObj = maxDate ? startOfDay(parse(maxDate, 'yyyy-MM-dd', new Date())) : undefined;

    const handleSelect = (date: Date) => {
      const isoString = format(date, 'yyyy-MM-dd');
      onChange(isoString);
      setOpen(false);
    };

    const displayValue = isValidDate && selectedDate 
      ? format(selectedDate, 'MMM d, yyyy') 
      : '';

    // Generate calendar days
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const isDateDisabled = (date: Date) => {
      const dateStart = startOfDay(date);
      if (minDateObj && isBefore(dateStart, minDateObj)) return true;
      if (maxDateObj && isAfter(dateStart, maxDateObj)) return true;
      return false;
    };

    const isToday = (date: Date) => isSameDay(date, new Date());
    const isSelected = (date: Date) => isValidDate && isSameDay(date, selectedDate);

    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        {label && (
          <label 
            className="text-sm font-semibold text-slate-900 dark:text-white"
            style={{
              fontSize: designTokens.typography.fontSize.sm,
              fontWeight: designTokens.typography.fontWeight.semibold,
              letterSpacing: designTokens.typography.letterSpacing.normal
            }}
          >
            {label}
            {required && <span className="text-red-600 dark:text-red-400 ml-1">*</span>}
          </label>
        )}
        
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button
              ref={ref}
              type="button"
              className={`w-full px-3.5 py-2.5 pr-10 border 
                ${error 
                  ? 'border-red-500 dark:border-red-400' 
                  : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                }
                bg-white dark:bg-slate-800 
                text-slate-900 dark:text-white 
                rounded-lg text-sm text-left
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
                shadow-sm relative group`}
              style={{
                fontSize: designTokens.typography.fontSize.sm,
                borderRadius: designTokens.borderRadius.md,
                boxShadow: error ? designTokens.shadows.conflictError : designTokens.shadows.sm,
              }}
            >
              <span className={displayValue ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-slate-500'}>
                {displayValue || placeholder}
              </span>
              <CalendarIcon 
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none
                  group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-200" 
              />
            </button>
          </Popover.Trigger>
          
          <Popover.Portal>
            <Popover.Content
              className="z-[100] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl 
                overflow-hidden animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
              align="start"
              sideOffset={4}
              style={{ width: '304px' }}
            >
              {/* Calendar Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg 
                    text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 
                    hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {format(currentMonth, 'MMMM yyyy')}
                </div>
                
                <button
                  type="button"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg 
                    text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 
                    hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="p-3">
                {/* Week days header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day, i) => (
                    <div
                      key={i}
                      className="h-8 flex items-center justify-center text-[11px] font-medium text-slate-500 dark:text-slate-400"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, i) => {
                    const isOutside = !isSameMonth(day, currentMonth);
                    const isDisabled = isDateDisabled(day);
                    const isTodayDate = isToday(day);
                    const isSelectedDate = isSelected(day);

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => !isDisabled && handleSelect(day)}
                        disabled={isDisabled}
                        className={`
                          h-8 w-full rounded-lg text-[13px] font-medium
                          transition-all duration-150
                          ${isSelectedDate
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                            : isTodayDate
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white ring-1 ring-slate-300 dark:ring-slate-600'
                            : isOutside
                            ? 'text-slate-300 dark:text-slate-700'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }
                          ${isDisabled
                            ? 'opacity-30 cursor-not-allowed'
                            : 'cursor-pointer'
                          }
                        `}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>

                {/* Footer with today button */}
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      if (!isDateDisabled(today)) {
                        handleSelect(today);
                      }
                    }}
                    className="w-full h-8 text-xs font-medium text-slate-600 dark:text-slate-400 
                      hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 
                      rounded-lg transition-colors"
                  >
                    Today
                  </button>
                </div>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        
        {helperText && !error && (
          <p 
            className="text-xs text-slate-600 dark:text-slate-400"
            style={{
              fontSize: designTokens.typography.fontSize.xs
            }}
          >
            {helperText}
          </p>
        )}
        
        {error && (
          <p 
            className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
            style={{
              fontSize: designTokens.typography.fontSize.xs
            }}
          >
            <span>⚠️</span> {error}
          </p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
