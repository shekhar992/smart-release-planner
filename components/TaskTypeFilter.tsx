import { useState } from 'react';
import { useGantt } from '../contexts/GanttContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { 
  Target, 
  X, 
  CheckCircle2,
  Circle,
  Minus,
  AlertTriangle,
  Layers
} from 'lucide-react';

const TASK_TYPES = [
  { value: 'epic', label: 'Epic', icon: Target, color: 'text-orange-500' },
  { value: 'story', label: 'Story', icon: CheckCircle2, color: 'text-blue-500' },
  { value: 'task', label: 'Task', icon: Circle, color: 'text-gray-500' },
  { value: 'subtask', label: 'Subtask', icon: Minus, color: 'text-gray-400' },
  { value: 'bug', label: 'Bug', icon: AlertTriangle, color: 'text-red-500' },
] as const;

export function TaskTypeFilter() {
  const { 
    filteredTasks, 
    selectedTaskTypes, 
    setSelectedTaskTypes 
  } = useGantt();
  const [isOpen, setIsOpen] = useState(false);

  // Since filteredTasks is already filtered by developers, 
  // we show the task type breakdown of these filtered tasks
  const typeFilteredTasks = filteredTasks;

  const toggleTaskType = (taskType: string) => {
    setSelectedTaskTypes((prev: string[]) => 
      prev.includes(taskType)
        ? prev.filter((type: string) => type !== taskType)
        : [...prev, taskType]
    );
  };

  const selectAllTypes = () => {
    setSelectedTaskTypes(TASK_TYPES.map(type => type.value));
  };

  const clearTypeFilters = () => {
    setSelectedTaskTypes([]);
  };

  const getTaskCountForType = (taskType: string) => {
    return filteredTasks.filter(task => task.taskType === taskType).length;
  };

  const hasActiveFilters = selectedTaskTypes.length > 0;

  return (
    <div className="flex items-center gap-2">
      {/* Active filter indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-xs">
            {selectedTaskTypes.length} types
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTypeFilters}
            className="h-6 w-6 p-0 hover:bg-destructive/10"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Filter popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant={hasActiveFilters ? "default" : "outline"} 
            size="sm"
            className="flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            Task Types
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {selectedTaskTypes.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">Filter by Task Type</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAllTypes}
                className="h-7 px-2 text-xs"
              >
                Select All
              </Button>
            </div>

            <div className="text-xs text-muted-foreground mb-3">
              {hasActiveFilters 
                ? `Showing ${typeFilteredTasks.length} tasks`
                : `${filteredTasks.length} tasks visible`
              }
            </div>

            <Separator className="mb-3" />

            <div className="space-y-2">
              {TASK_TYPES.map(taskType => {
                const isSelected = selectedTaskTypes.includes(taskType.value);
                const taskCount = getTaskCountForType(taskType.value);
                const Icon = taskType.icon;
                
                return (
                  <div
                    key={taskType.value}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => toggleTaskType(taskType.value)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleTaskType(taskType.value)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    
                    <Icon className={`w-4 h-4 ${taskType.color}`} />
                    
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {taskType.label}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {taskCount}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />
          
          <div className="p-3 bg-muted/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {hasActiveFilters 
                  ? `${selectedTaskTypes.length} types selected`
                  : 'All types visible'
                }
              </span>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearTypeFilters();
                    setIsOpen(false);
                  }}
                  className="h-6 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
