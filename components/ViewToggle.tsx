import { useGantt } from '../contexts/GanttContext';
import { YearSelector } from './YearSelector';
import { ViewType } from '../types';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Calendar, CalendarDays, CalendarRange, CalendarClock } from 'lucide-react';

const VIEW_ICONS = {
  day: CalendarDays,
  week: CalendarRange,
  month: Calendar,
  year: CalendarClock,
};

export function ViewToggle() {
  const { currentView, setCurrentView, viewConfig, selectedYear } = useGantt();

  const views: { value: ViewType; label: string; icon: React.ComponentType<any> }[] = [
    { value: 'day', label: 'Day', icon: VIEW_ICONS.day },
    { value: 'week', label: 'Week', icon: VIEW_ICONS.week },
    { value: 'month', label: 'Month', icon: VIEW_ICONS.month },
    { value: 'year', label: 'Year', icon: VIEW_ICONS.year },
  ];

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">View:</span>
        <ToggleGroup
          type="single"
          value={currentView}
          onValueChange={(value) => {
            if (value) setCurrentView(value as ViewType);
          }}
          className="gap-1"
        >
          {views.map(({ value, label, icon: Icon }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              aria-label={`${label} view`}
              className="flex items-center gap-1 px-3"
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          {viewConfig.label} View
          {currentView === 'day' && ` • ${selectedYear}`}
        </div>
      </div>

      {/* Year selector for day view */}
      <YearSelector />
    </div>
  );
}