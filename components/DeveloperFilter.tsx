import { useState } from 'react';
import { useGantt } from '../contexts/GanttContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { 
  Users, 
  Filter, 
  X, 
  UserCheck,
  Eye,
  EyeOff
} from 'lucide-react';

export function DeveloperFilter() {
  const { 
    developers, 
    selectedDevelopers, 
    setSelectedDevelopers, 
    clearFilters,
    filteredTasks,
    tasks
  } = useGantt();
  
  const [isOpen, setIsOpen] = useState(false);

  const toggleDeveloper = (developerId: string) => {
    setSelectedDevelopers((prev: string[]) => 
      prev.includes(developerId)
        ? prev.filter((id: string) => id !== developerId)
        : [...prev, developerId]
    );
  };

  const selectAllDevelopers = () => {
    setSelectedDevelopers(developers.map(dev => dev.id));
  };

  const deselectAllDevelopers = () => {
    setSelectedDevelopers([]);
  };

  const getTaskCountForDeveloper = (developerId: string) => {
    return tasks.filter(task => task.assignedDeveloperId === developerId).length;
  };

  const getDeveloperInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const hasActiveFilters = selectedDevelopers.length > 0;
  const isAllSelected = selectedDevelopers.length === developers.length;

  return (
    <div className="flex items-center gap-2">
      {/* Active filter indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-xs">
            {selectedDevelopers.length} of {developers.length} developers
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
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
            <Filter className="w-4 h-4" />
            Filter by Developer
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {selectedDevelopers.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">Filter by Developer</h4>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllDevelopers}
                  disabled={isAllSelected}
                  className="h-7 px-2 text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllDevelopers}
                  disabled={selectedDevelopers.length === 0}
                  className="h-7 px-2 text-xs"
                >
                  <EyeOff className="w-3 h-3 mr-1" />
                  None
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground mb-3">
              {hasActiveFilters 
                ? `Showing ${filteredTasks.length} of ${tasks.length} tasks`
                : `${tasks.length} total tasks`
              }
            </div>

            <Separator className="mb-3" />

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {developers.map(developer => {
                const isSelected = selectedDevelopers.includes(developer.id);
                const taskCount = getTaskCountForDeveloper(developer.id);
                
                return (
                  <div
                    key={developer.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => toggleDeveloper(developer.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleDeveloper(developer.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={developer.avatar} />
                      <AvatarFallback className="text-xs">
                        {getDeveloperInitials(developer.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium truncate">
                            {developer.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {developer.role}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {taskCount} tasks
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {developers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No developers found</p>
              </div>
            )}
          </div>

          <Separator />
          
          <div className="p-3 bg-muted/30">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <UserCheck className="w-3 h-3" />
                <span>
                  {hasActiveFilters 
                    ? `${selectedDevelopers.length} selected`
                    : 'All developers visible'
                  }
                </span>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearFilters();
                    setIsOpen(false);
                  }}
                  className="h-6 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
