import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday
} from 'date-fns';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
}

export function DatePicker({ value, onChange, label }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleDateSelect = (date: Date) => {
    onChange(date);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium mb-1.5">{label}</label>}
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background hover:bg-accent/50 transition-colors flex items-center gap-2 justify-between"
          >
            <span>{format(value, 'MMM dd, yyyy')}</span>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className="z-50 bg-card border border-border rounded-lg shadow-xl p-4 w-[280px]"
            sideOffset={5}
            align="start"
          >
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-accent rounded transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-sm font-semibold">
                {format(currentMonth, 'MMMM yyyy')}
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-accent rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const isSelected = isSameDay(day, value);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    className={`
                      p-2 text-sm rounded transition-colors
                      ${!isCurrentMonth ? 'text-muted-foreground/40' : 'text-foreground'}
                      ${isSelected ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-accent'}
                      ${isTodayDate && !isSelected ? 'border border-primary/50' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
