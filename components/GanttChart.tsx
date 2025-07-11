import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useGantt } from '../contexts/GanttContext';
import { DraggableTaskBar } from './DraggableTaskBar';
import { TimelineDropZone } from './TimelineDropZone';
import { ViewToggle } from './ViewToggle';
import { ScrollControls } from './ScrollControls';
import { TimelineEnhancements } from './TimelineEnhancements';
import { DeveloperFilter } from './DeveloperFilter';
import { TaskTypeFilter } from './TaskTypeFilter';
import { DragPreview } from './DragPreview';
import { format, isToday, isWeekend, isSameMonth } from 'date-fns';
import { AlertTriangle, Clock, Move, CalendarDays, Minimize2, Maximize2, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { useEffect, useRef, useCallback, useState } from 'react';

export function GanttChart() {
  const { 
    filteredTasks: tasks, 
    developers, 
    setEditingTask,
    conflicts, 
    getDeveloperConflicts, 
    currentView, 
    viewConfig, 
    getDateRange, 
    selectedYear,
    setScrollToToday
  } = useGantt();
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolled = useRef(false);
  // Add compact mode state
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [isTaskListCollapsed, setIsTaskListCollapsed] = useState(false);
  const [isSuperCompact, setIsSuperCompact] = useState(false);

  const { units, todayIndex } = getDateRange();
  const today = new Date();
  const isTodayInRange = todayIndex !== -1;

  // Calculate today's exact position in pixels
  const todayPosition = isTodayInRange ? todayIndex * viewConfig.unitWidth : 0;

  // Smooth scroll to specific position
  const scrollToPosition = useCallback((pixelPosition: number, smooth: boolean = true) => {
    if (!scrollAreaRef.current) return;

    const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!viewport) return;

    // Center the position in the viewport
    const viewportWidth = viewport.clientWidth;
    const scrollPosition = Math.max(0, pixelPosition - (viewportWidth / 2));
    
    viewport.scrollTo({
      left: scrollPosition,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, []);

  // Function to scroll to today - register it with context
  const handleScrollToToday = useCallback(() => {
    if (isTodayInRange) {
      scrollToPosition(todayPosition, true);
    }
  }, [isTodayInRange, todayPosition, scrollToPosition]);

  // Register scroll to today function with context
  useEffect(() => {
    setScrollToToday(() => handleScrollToToday);
    return () => setScrollToToday(null);
  }, [handleScrollToToday, setScrollToToday]);

  // Auto-scroll to today when component mounts or view changes
  useEffect(() => {
    // Reset auto-scroll flag when view changes
    hasAutoScrolled.current = false;
  }, [currentView, selectedYear]);

  useEffect(() => {
    if (!hasAutoScrolled.current && isTodayInRange) {
      // Use setTimeout to ensure DOM is ready and scroll area is properly sized
      const timer = setTimeout(() => {
        scrollToPosition(todayPosition, false); // No smooth animation on initial load
        hasAutoScrolled.current = true;
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [isTodayInRange, todayPosition, scrollToPosition]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!scrollAreaRef.current) return;
      
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (!viewport) return;

      // Only handle arrow keys if focus is within the timeline
      const activeElement = document.activeElement;
      const isTimelineFocused = scrollAreaRef.current.contains(activeElement);
      
      if (!isTimelineFocused) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          viewport.scrollBy({ left: -viewConfig.unitWidth * 3, behavior: 'smooth' });
          break;
        case 'ArrowRight':
          e.preventDefault();
          viewport.scrollBy({ left: viewConfig.unitWidth * 3, behavior: 'smooth' });
          break;
        case 'Home':
          e.preventDefault();
          viewport.scrollTo({ left: 0, behavior: 'smooth' });
          break;
        case 'End':
          e.preventDefault();
          viewport.scrollTo({ left: viewport.scrollWidth, behavior: 'smooth' });
          break;
        case 't':
        case 'T':
          // Press 't' to go to today
          if (isTodayInRange) {
            e.preventDefault();
            handleScrollToToday();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [viewConfig.unitWidth, handleScrollToToday, isTodayInRange]);

  const getDeveloperName = (developerId: string) => {
    return developers.find(dev => dev.id === developerId)?.name || 'Unknown';
  };

  const getDeveloperConflictCount = (developerId: string) => {
    return getDeveloperConflicts(developerId).length;
  };

  // Helper function to group consecutive dates by month
  const getMonthGroups = () => {
    const groups: { month: string; startIndex: number; count: number; year: number }[] = [];
    let currentMonth = '';
    let currentStartIndex = 0;
    let currentCount = 0;
    let currentYear = 0;

    units.forEach((date, index) => {
      const monthYear = format(date, 'MMMM yyyy');
      const year = date.getFullYear();
      
      if (monthYear !== currentMonth) {
        if (currentCount > 0) {
          groups.push({ 
            month: currentMonth, 
            startIndex: currentStartIndex, 
            count: currentCount,
            year: currentYear
          });
        }
        currentMonth = monthYear;
        currentStartIndex = index;
        currentCount = 1;
        currentYear = year;
      } else {
        currentCount++;
      }
    });

    // Don't forget the last group
    if (currentCount > 0) {
      groups.push({ 
        month: currentMonth, 
        startIndex: currentStartIndex, 
        count: currentCount,
        year: currentYear
      });
    }

    return groups;
  };

  const getHeaderFormat = (date: Date, _index: number) => {
    switch (currentView) {
      case 'day':
        const isCurrentDay = isToday(date);
        const isWeekendDay = isWeekend(date);
        return (
          <div className={`text-center py-3 px-1 border-r border-border/30 transition-all duration-200 ${
            isCurrentDay ? 'bg-primary/15 border-primary/30 text-primary shadow-sm' : 
            isWeekendDay ? 'bg-muted/40 text-muted-foreground' : 'hover:bg-accent/50'
          }`}>
            <div className={`text-base font-semibold ${isCurrentDay ? 'font-bold text-primary' : ''}`}>
              {format(date, 'dd')}
            </div>
            <div className={`text-xs mt-1 tracking-wide uppercase ${
              isCurrentDay ? 'text-primary font-medium' : 
              isWeekendDay ? 'text-muted-foreground' : 'text-muted-foreground'
            }`}>
              {format(date, 'EEE')}
            </div>
          </div>
        );
      case 'week':
        return (
          <div className="text-center p-2">
            <div className="text-sm">{format(date, 'dd/MM')}</div>
          </div>
        );
      default:
        return format(date, 'dd/MM');
    }
  };

  const timelineWidth = units.length * viewConfig.unitWidth;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col bg-gradient-to-br from-background to-muted/20">
        {/* Enhanced Header with Modern Design */}
        <div className="border-b bg-card/80 backdrop-blur-sm p-4 shrink-0">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-primary" />
                </div>
                Project Timeline
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Move className="w-4 h-4" />
                <span>
                  {isTodayInRange 
                    ? `Timeline centered on current ${currentView} • ${units.length} ${currentView}s visible • Click any task to edit`
                    : `Viewing ${units.length} ${currentView}s • Today is outside current view • Click any task to edit`
                  }
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <DeveloperFilter />
              <TaskTypeFilter />
              <ScrollControls scrollAreaRef={scrollAreaRef} className="bg-background/50 backdrop-blur-sm rounded-lg shadow-sm border p-2" />
              <ViewToggle />
            </div>
          </div>
        </div>

        {/* Today Status with Modern Design */}
        {isTodayInRange && (
          <div className="border-b bg-gradient-to-r from-primary/10 to-primary/5 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">
                  Today is {format(today, 'EEEE, MMM dd, yyyy')} • 
                  Press 'T' to center on today
                </span>
              </div>
              <div className="text-xs text-primary/70">
                💡 Click to edit • Drag to reschedule
              </div>
            </div>
          </div>
        )}

        {!isTodayInRange && (
          <div className="border-b bg-gradient-to-r from-orange-50 to-yellow-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-800">
                <div className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">
                  Today ({format(today, 'MMM dd, yyyy')}) is outside the current view • 
                  {currentView === 'day' ? `Switch to ${new Date().getFullYear()} or ` : ''}Change view to see current date
                </span>
              </div>
              <div className="text-xs text-orange-600">
                💡 Click to edit • Drag to reschedule
              </div>
            </div>
          </div>
        )}

        {/* Conflicts Summary with Modern Design */}
        {conflicts.length > 0 && (
          <div className="border-b bg-gradient-to-r from-red-50 to-pink-50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-red-800">Scheduling Conflicts Detected</h4>
                <p className="text-xs text-red-600 mt-1">
                  {conflicts.length} task{conflicts.length !== 1 ? 's have' : ' has'} overlapping dates. 
                  Tasks with conflicts are highlighted with red borders.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content with Modern Task List */}
        <div className="flex flex-1 min-h-0">
          {/* Enhanced Task Names Column */}
          {!isTaskListCollapsed && (
            <div className={`${isSuperCompact ? 'w-48' : isCompactMode ? 'w-64' : 'w-72'} shrink-0 border-r bg-card/30 backdrop-blur-sm flex flex-col`}>
              {/* Modern Header */}
              <div className="px-4 py-3 border-b bg-card/50 backdrop-blur-sm shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      Tasks & Assignments
                    </h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (!isCompactMode && !isSuperCompact) {
                          setIsCompactMode(true);
                        } else if (isCompactMode && !isSuperCompact) {
                          setIsSuperCompact(true);
                          setIsCompactMode(false);
                        } else {
                          setIsSuperCompact(false);
                          setIsCompactMode(false);
                        }
                      }}
                      className="h-8 w-8 p-0 hover:bg-primary/10"
                      title={
                        isSuperCompact ? "Expand to normal view" :
                        isCompactMode ? "Switch to ultra-compact view" : 
                        "Switch to compact view"
                      }
                    >
                      {isSuperCompact ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsTaskListCollapsed(true)}
                      className="h-8 w-8 p-0 hover:bg-primary/10"
                      title="Hide task list"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            
            {/* Enhanced Task List with Modern Cards */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-2 space-y-2">
                {tasks.map((task) => {
                  const conflictCount = getDeveloperConflictCount(task.assignedDeveloperId);
                  
                  const handleTaskClick = () => {
                    setEditingTask(task);
                  };

                  const handleTaskDoubleClick = () => {
                    setEditingTask(task);
                  };
                  
                  return (
                    <div 
                      key={task.id} 
                      className={`hover:bg-card/50 cursor-pointer transition-all duration-200 group border border-border/20 rounded-lg p-3 backdrop-blur-sm hover:border-primary/20 hover:shadow-sm ${
                        conflictCount > 0 ? 'border-l-4 border-l-destructive' : ''
                      }`} 
                      onClick={handleTaskClick}
                      onDoubleClick={handleTaskDoubleClick}
                      title="Click to edit task"
                    >
                      {isSuperCompact ? (
                        // Super-compact mode - minimal single line
                        <div className="flex items-center gap-2 text-xs">
                          {/* Status indicator */}
                          <div className={`w-2 h-2 rounded-full shrink-0 ${
                            task.status === 'completed' ? 'bg-green-500' :
                            task.status === 'in-progress' ? 'bg-blue-500' :
                            task.status === 'blocked' ? 'bg-red-500' : 'bg-gray-400'
                          }`} />
                          
                          {/* Task title */}
                          <span className="font-medium truncate flex-1 group-hover:text-primary min-w-0 text-xs" title={task.title}>
                            {task.title.length > 20 ? task.title.substring(0, 17) + '...' : task.title}
                          </span>
                          
                          {/* Developer initial */}
                          <div className="w-4 h-4 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary shrink-0" title={getDeveloperName(task.assignedDeveloperId)}>
                            {getDeveloperName(task.assignedDeveloperId).charAt(0).toUpperCase()}
                          </div>
                          
                          {/* Priority indicator */}
                          {(task.priority === 'critical' || task.priority === 'high') && (
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              task.priority === 'critical' ? 'bg-red-500' : 'bg-orange-500'
                            }`} />
                          )}
                        </div>
                      ) : isCompactMode ? (
                        // Compact mode - single line with info
                        <div className="flex items-center gap-2 text-xs">
                          {/* Status indicator */}
                          <div className={`w-2 h-2 rounded-full shrink-0 ${
                            task.status === 'completed' ? 'bg-green-500' :
                            task.status === 'in-progress' ? 'bg-blue-500' :
                            task.status === 'blocked' ? 'bg-red-500' : 'bg-gray-400'
                          }`} />
                          
                          {/* Task title */}
                          <span className="font-medium truncate flex-1 group-hover:text-primary min-w-0" title={task.title}>
                            {task.title}
                          </span>
                          
                          {/* Priority indicator */}
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            task.priority === 'critical' ? 'bg-red-500' :
                            task.priority === 'high' ? 'bg-orange-500' :
                            task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} title={`${task.priority} priority`} />
                          
                          {/* Developer initial */}
                          <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary shrink-0" title={getDeveloperName(task.assignedDeveloperId)}>
                            {getDeveloperName(task.assignedDeveloperId).charAt(0).toUpperCase()}
                          </div>
                        </div>
                      ) : (
                        // Full mode with enhanced layout
                        <div className="space-y-2">
                          {/* Title and Priority */}
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full shrink-0 ${
                              task.status === 'completed' ? 'bg-green-500' :
                              task.status === 'in-progress' ? 'bg-blue-500' :
                              task.status === 'blocked' ? 'bg-red-500' : 'bg-gray-400'
                            }`} />
                            <h5 className="text-sm font-medium truncate flex-1 group-hover:text-primary">{task.title}</h5>
                            <div className={`w-2 h-2 rounded-full shrink-0 ${
                              task.priority === 'critical' ? 'bg-red-500' :
                              task.priority === 'high' ? 'bg-orange-500' :
                              task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`} title={`${task.priority} priority`} />
                          </div>
                          
                          {/* Developer and Date */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary" title={getDeveloperName(task.assignedDeveloperId)}>
                                {getDeveloperName(task.assignedDeveloperId).charAt(0).toUpperCase()}
                              </div>
                              <span className="text-muted-foreground truncate max-w-[100px]">
                                {getDeveloperName(task.assignedDeveloperId)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                              <Clock className="w-3 h-3" />
                              <span>{format(task.startDate, 'MMM d')}</span>
                            </div>
                          </div>
                          
                          {/* Status */}
                          <div className="flex items-center gap-2">
                            <div className={`px-2 py-1 rounded-md text-xs font-medium flex-1 text-center ${
                              task.status === 'completed' ? 'bg-green-50 text-green-700' :
                              task.status === 'in-progress' ? 'bg-blue-50 text-blue-700' :
                              task.status === 'blocked' ? 'bg-red-50 text-red-700' :
                              'bg-gray-50 text-gray-700'
                            }`}>
                              {task.status === 'in-progress' ? 'In Progress' : 
                               task.status === 'not-started' ? 'Not Started' :
                               task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </div>
                            {conflictCount > 0 && (
                              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-3 h-3 text-red-600" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {tasks.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="font-medium text-sm mb-1">No tasks added yet</div>
                    <div className="text-xs">Create your first task to get started.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Modern Collapsed Task List Toggle */}
          {isTaskListCollapsed && (
            <div className="w-12 border-r bg-card/30 backdrop-blur-sm flex flex-col">
              <div className="p-3 border-b bg-card/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsTaskListCollapsed(false)}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  title="Show task list"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Modern Timeline Container */}
          <div className="flex-1 relative flex flex-col min-w-0">
            {/* Timeline Status Indicator */}
            <div className="absolute top-4 left-4 z-30 pointer-events-none">
              <div className="glass rounded-xl px-4 py-2 text-sm shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span className="font-medium">
                    Timeline: {timelineWidth.toLocaleString()}px wide
                  </span>
                  {isTodayInRange && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span>Today at {Math.round(todayPosition)}px</span>
                    </>
                  )}
                  <span className="text-muted-foreground">•</span>
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded-md">Press 'T' for today</span>
                </div>
              </div>
            </div>

            <ScrollArea 
              className="flex-1 focus-within:ring-2 focus-within:ring-primary/20 transition-all" 
              ref={scrollAreaRef}
              tabIndex={0}
              role="region"
              aria-label="Timeline scroll area - use arrow keys to navigate, mouse wheel to scroll"
            >
              <TimelineEnhancements scrollAreaRef={scrollAreaRef} viewConfig={viewConfig} />
              <div style={{ width: `${timelineWidth}px`, minWidth: '100%' }}>
                {/* Enhanced Timeline Header with Excel-like Month/Date Structure */}
                <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-20">
                  {currentView === 'day' ? (
                    /* Excel-like two-row header for day view */
                    <div>
                      {/* Month Header Row */}
                      <div className="flex border-b border-border/30 bg-gradient-to-r from-muted/30 to-muted/20">
                        {getMonthGroups().map((group, groupIndex) => {
                          const isCurrentMonth = isSameMonth(
                            new Date(group.year, units[group.startIndex].getMonth()), 
                            today
                          );
                          return (
                            <div
                              key={`month-${groupIndex}`}
                              className={`flex items-center justify-center py-4 px-3 border-r border-border/30 font-bold text-base transition-all duration-200 ${
                                isCurrentMonth 
                                  ? 'bg-primary/20 text-primary border-primary/40 shadow-sm' 
                                  : 'bg-muted/30 text-foreground hover:bg-muted/40'
                              }`}
                              style={{ width: `${group.count * viewConfig.unitWidth}px` }}
                            >
                              <div className="text-center">
                                <div className={`${isCurrentMonth ? 'font-extrabold' : 'font-bold'} tracking-wide`}>
                                  {format(units[group.startIndex], 'MMMM yyyy')}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 font-medium">
                                  {group.count} day{group.count > 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Date and Day Header Row */}
                      <div className="flex">
                        {units.map((unit, index) => (
                          <div
                            key={unit.toISOString()}
                            className={`border-r border-border/30 transition-colors ${
                              currentView === 'day' && isWeekend(unit) ? 'bg-muted/20' : ''
                            }`}
                            style={{ width: `${viewConfig.unitWidth}px` }}
                          >
                            {getHeaderFormat(unit, index)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Single row header for other views */
                    <div className="flex p-4">
                      {units.map((unit, index) => (
                        <div
                          key={unit.toISOString()}
                          className="border-r border-border/30 transition-colors"
                          style={{ width: `${viewConfig.unitWidth}px` }}
                        >
                          {getHeaderFormat(unit, index)}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Modern Today indicator line in header */}
                  {isTodayInRange && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-primary z-30 pointer-events-none"
                      style={{ left: `${todayPosition}px` }}
                    >
                      <div className={`absolute ${currentView === 'day' ? '-top-2' : '-top-1'} left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-md whitespace-nowrap shadow-lg`}>
                        <div className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          <span>Today</span>
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-primary"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Task Timeline Rows with Enhanced Design */}
                <TimelineDropZone className="relative">
                  {/* Modern Today indicator line */}
                  {isTodayInRange && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
                      style={{ left: `${todayPosition}px` }}
                    >
                      {/* Animated indicator dots */}
                      {Array.from({ length: Math.ceil(600 / 100) }).map((_, i) => (
                        <div 
                          key={i}
                          className="absolute left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full opacity-80 animate-pulse"
                          style={{ top: `${i * 100 + 20}px`, animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Enhanced Weekend columns */}
                  {currentView === 'day' && (
                    <div className="absolute inset-0 pointer-events-none">
                      {units.map((unit, index) => 
                        isWeekend(unit) ? (
                          <div
                            key={`weekend-${index}`}
                            className="absolute top-0 bottom-0 bg-muted/20 opacity-60"
                            style={{
                              left: `${index * viewConfig.unitWidth}px`,
                              width: `${viewConfig.unitWidth}px`,
                            }}
                          />
                        ) : null
                      )}
                    </div>
                  )}

                  {/* Modern Grid lines */}
                  <div className="absolute inset-0 pointer-events-none">
                    {units.map((_, index) => (
                      <div
                        key={`grid-${index}`}
                        className="absolute top-0 bottom-0 border-r border-border/20 opacity-40"
                        style={{ left: `${index * viewConfig.unitWidth}px` }}
                      />
                    ))}
                  </div>

                  {tasks.map((task) => (
                    <div key={task.id} className="border-b border-border/30 last:border-b-0">
                      <div 
                        className="p-4 hover:bg-muted/30 min-h-[96px] relative transition-colors duration-200"
                        style={{ width: `${timelineWidth}px` }}
                      >
                        <DraggableTaskBar
                          task={task}
                          onTaskClick={setEditingTask}
                          onTaskDoubleClick={setEditingTask}
                        />
                      </div>
                    </div>
                  ))}

                  {tasks.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground relative min-h-[200px] flex items-center justify-center" style={{ width: `${timelineWidth}px` }}>
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                          <CalendarDays className="w-6 h-6" />
                        </div>
                        <div className="font-medium">Timeline is ready</div>
                      </div>
                      
                      {/* Today indicator even when no tasks */}
                      {isTodayInRange && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
                          style={{ left: `${todayPosition}px` }}
                        >
                          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  )}
                </TimelineDropZone>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Modern Footer Instructions */}
        <div className="border-t bg-gradient-to-r from-card/50 to-muted/20 p-4 shrink-0">
          <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4 text-primary" />
              <span>Drag & drop to reschedule</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span>Red borders show conflicts</span>
            </div>
            {isTodayInRange && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-primary rounded"></div>
                <span>Blue line: Today ({format(today, 'MMM dd')})</span>
              </div>
            )}
            {currentView === 'day' && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-muted border rounded-sm"></div>
                <span>Gray columns: Weekends</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-lg border shadow-sm">
              <CalendarDays className="w-4 h-4 text-accent-foreground" />
              <span className="font-medium">
                Navigation: Arrow keys, scroll wheel, or use controls above
              </span>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg border border-primary/20">
              <span className="text-primary font-medium">
                Current: {viewConfig.label} view
                {currentView === 'day' && ` (${selectedYear})`}
                {!isTodayInRange && ' • Today not in view'}
              </span>
            </div>
          </div>
        </div>
      </div>
      <DragPreview />
    </DndProvider>
  );
}