import { useGantt } from '../contexts/GanttContext';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

export function YearSelector() {
  const { selectedYear, setSelectedYear, currentView, goToToday } = useGantt();

  // Only show year selector in day view
  if (currentView !== 'day') {
    return null;
  }

  // Generate year options (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const handlePreviousYear = () => {
    setSelectedYear(selectedYear - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(selectedYear + 1);
  };

  const handleYearSelect = (year: string) => {
    setSelectedYear(parseInt(year));
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreviousYear}
        className="h-8 w-8 p-0"
        aria-label="Previous year"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <Select value={selectedYear.toString()} onValueChange={handleYearSelect}>
        <SelectTrigger className="w-24 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNextYear}
        className="h-8 w-8 p-0"
        aria-label="Next year"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      <div className="h-4 w-px bg-border mx-1" />

      <Button
        variant="outline"
        size="sm"
        onClick={goToToday}
        className="h-8 px-3"
      >
        <CalendarDays className="w-3 h-3 mr-1" />
        Today
      </Button>

      <div className="text-xs text-muted-foreground">
        {selectedYear === currentYear ? 'Current Year' : `${Math.abs(selectedYear - currentYear)} year${Math.abs(selectedYear - currentYear) !== 1 ? 's' : ''} ${selectedYear > currentYear ? 'ahead' : 'ago'}`}
      </div>
    </div>
  );
}