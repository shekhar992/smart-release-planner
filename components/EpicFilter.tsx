import { useState, useEffect } from 'react';
import { Epic, Task } from '../types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { X, Target } from 'lucide-react';

interface EpicFilterProps {
  currentRelease: any;
  onFilterChange: (filteredTasks: Task[]) => void;
  tasks: Task[];
}

export function EpicFilter({ currentRelease, onFilterChange, tasks }: EpicFilterProps) {
  const [selectedEpicIds, setSelectedEpicIds] = useState<string[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Extract epics from tasks or get them from release
  useEffect(() => {
    // Get epics from the current release or from tasks with type 'epic'
    const releaseEpics = currentRelease?.epics || [];
    const taskEpics = tasks.filter(task => task.taskType === 'epic');
    
    // Combine and deduplicate epics
    const allEpics = [...releaseEpics];
    taskEpics.forEach(taskEpic => {
      if (!allEpics.find(epic => epic.id === taskEpic.id)) {
        // Convert task to epic format if needed
        allEpics.push({
          id: taskEpic.id,
          title: taskEpic.title,
          description: taskEpic.description,
          startDate: taskEpic.startDate,
          endDate: taskEpic.endDate,
          status: taskEpic.status,
          priority: taskEpic.priority,
          color: '#3b82f6', // Default color
          progress: 0,
        });
      }
    });

    setEpics(allEpics);
  }, [currentRelease, tasks]);

  // Filter tasks based on selected epics
  useEffect(() => {
    if (selectedEpicIds.length > 0) {
      const filteredTasks = tasks.filter(task => 
        selectedEpicIds.some(epicId => task.epicId === epicId || task.id === epicId)
      );
      onFilterChange(filteredTasks);
    } else {
      onFilterChange(tasks); // Show all tasks if no epic selected
    }
  }, [selectedEpicIds, tasks, onFilterChange]);

  const toggleEpic = (epicId: string) => {
    setSelectedEpicIds((prev: string[]) => 
      prev.includes(epicId)
        ? prev.filter((id: string) => id !== epicId)
        : [...prev, epicId]
    );
  };

  const selectAllEpics = () => {
    setSelectedEpicIds(epics.map(epic => epic.id));
  };

  const clearEpicFilters = () => {
    setSelectedEpicIds([]);
  };

  const getTaskCount = (epicId: string) => {
    return tasks.filter(task => task.epicId === epicId).length;
  };

  const hasActiveFilters = selectedEpicIds.length > 0;

  return (
    <div className="flex items-center gap-2">
      {/* Active filter indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-xs">
            {selectedEpicIds.length} epic{selectedEpicIds.length !== 1 ? 's' : ''}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearEpicFilters}
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
            <Target className="w-4 h-4" />
            Filter by Epic
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {selectedEpicIds.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">Filter by Epic</h4>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllEpics}
                  className="h-7 px-2 text-xs"
                >
                  Select All
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearEpicFilters}
                    className="h-7 px-2 text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="text-xs text-muted-foreground mb-3">
              {hasActiveFilters 
                ? `Showing tasks from ${selectedEpicIds.length} epic${selectedEpicIds.length !== 1 ? 's' : ''}`
                : `${epics.length} epic${epics.length !== 1 ? 's' : ''} available`
              }
            </div>

            <Separator className="mb-3" />

            {epics.length > 0 ? (
              <div className="space-y-2">
                {epics.map(epic => {
                  const isSelected = selectedEpicIds.includes(epic.id);
                  const taskCount = getTaskCount(epic.id);
                  
                  return (
                    <div
                      key={epic.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => toggleEpic(epic.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleEpic(epic.id)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      
                      <Target className="w-4 h-4 text-orange-500" />
                      
                      <div className="flex-1 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">
                            {epic.title}
                          </span>
                          {epic.description && (
                            <span className="text-xs text-muted-foreground truncate block">
                              {epic.description}
                            </span>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs ml-2">
                          {taskCount}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Target className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm">No epics found</p>
                <p className="text-xs mt-1">
                  Create epics to organize your tasks
                </p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
