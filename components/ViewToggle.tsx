import { useGantt } from '../contexts/GanttContext';
import { YearSelector } from './YearSelector';
import { ViewType } from '../types';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { CalendarDays, CalendarRange } from 'lucide-react';

const VIEW_ICONS = {
  day: CalendarDays,
  week: CalendarRange,
};

export function ViewToggle() {
  const { currentView, setCurrentView } = useGantt();

  const views: { value: ViewType; label: string; icon: React.ComponentType<any>; description: string }[] = [
    { value: 'day', label: 'Day', icon: VIEW_ICONS.day, description: 'Detailed daily planning with precise scheduling' },
    { value: 'week', label: 'Week', icon: VIEW_ICONS.week, description: 'Week-by-week overview for broader planning' },
  ];

  return (
    <div className="flex items-center gap-3">
      <ToggleGroup
        type="single"
        value={currentView}
        onValueChange={(value) => {
          if (value) setCurrentView(value as ViewType);
        }}
        className="gap-0 bg-muted/50 rounded-md p-1"
      >
        {views.map(({ value, label, icon: Icon, description }) => (
          <ToggleGroupItem
            key={value}
            value={value}
            aria-label={`${label} view`}
            title={description}
            className="flex items-center gap-2 px-4 py-2 rounded-sm data-[state=on]:bg-background data-[state=on]:shadow-sm transition-all duration-200"
          >
            <Icon className="w-4 h-4" />
            <span className="font-medium">{label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      
      {/* Year selector for day view */}
      {currentView === 'day' && <YearSelector />}
    </div>
  );
}