import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useGantt } from '../contexts/GanttContext';
import { DraggableTaskBar } from './DraggableTaskBar';
import { TimelineDropZone } from './TimelineDropZone';
import { ViewToggle } from './ViewToggle';
import { ScrollControls } from './ScrollControls';
import { TimelineEnhancements } from './TimelineEnhancements';
import { format, isToday, isWeekend, isSameMonth, isSameYear } from 'date-fns';
import { AlertTriangle, Clock, Move, CalendarDays, Minimize2, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { useEffect, useRef, useCallback, useState } from 'react';

export function GanttChart() {
  const { 
    tasks, 
    developers, 
    setSelectedTask, 
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

  const getHeaderFormat = (date: Date, index: number) => {
    switch (currentView) {
      case 'day':
        const isCurrentDay = isToday(date);
        const isWeekendDay = isWeekend(date);
        return (
          <div className={`text-center p-2 rounded transition-colors ${
            isCurrentDay ? 'bg-red-100 border-red-300 text-red-800 ring-1 ring-red-300' : 
            isWeekendDay ? 'bg-gray-100 text-gray-600' : 'hover:bg-blue-50'
          }`}>
            <div className={`text-sm ${isCurrentDay ? 'font-semibold' : ''}`}>
              {format(date, 'dd/MM')}
            </div>
            <div className={`text-xs ${isCurrentDay ? 'text-red-600' : isWeekendDay ? 'text-gray-600' : 'text-gray-500'}`}>
              {format(date, 'EEE')}
            </div>
            {(index === 0 || date.getDate() === 1) && (
              <div className="text-xs text-blue-600 mt-1 border-t pt-1">
                {format(date, 'MMM')}
              </div>
            )}
          </div>
        );
      case 'week':
        return (
          <div className="text-center p-2">
            <div className="text-sm">{format(date, 'dd/MM')}</div>
            <div className="text-xs text-gray-500">{format(date, 'yyyy')}</div>
          </div>
        );
      case 'month':
        const isCurrentMonth = isSameMonth(date, today);
        return (
          <div className={`text-center p-2 rounded transition-colors ${
            isCurrentMonth ? 'bg-blue-100 border-blue-300 text-blue-800 ring-1 ring-blue-300' : 'hover:bg-blue-50'
          }`}>
            <div className={`text-sm ${isCurrentMonth ? 'font-semibold' : ''}`}>{format(date, 'MM')}</div>
            <div className={`text-xs ${isCurrentMonth ? 'text-blue-600' : 'text-gray-500'}`}>{format(date, 'yyyy')}</div>
          </div>
        );
      case 'year':
        const isCurrentYear = isSameYear(date, today);
        return (
          <div className={`text-center p-2 rounded transition-colors ${
            isCurrentYear ? 'bg-blue-100 border-blue-300 text-blue-800 ring-1 ring-blue-300' : 'hover:bg-blue-50'
          }`}>
            <div className={`text-sm ${isCurrentYear ? 'font-semibold' : ''}`}>{format(date, 'yyyy')}</div>
          </div>
        );
      default:
        return format(date, 'dd/MM');
    }
  };

  const timelineWidth = units.length * viewConfig.unitWidth;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col bg-white">
        {/* Enhanced View Controls */}
        <div className="border-b bg-gradient-to-r from-gray-50 to-blue-50/30 p-4 shrink-0">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                Project Timeline
              </h3>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Move className="w-4 h-4" />
                <span>
                  {isTodayInRange 
                    ? `Timeline centered on current ${currentView} • ${units.length} ${currentView}s visible • Today at ${Math.round(todayPosition)}px`
                    : `Viewing ${units.length} ${currentView}s • Today is outside current view`
                  }
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ScrollControls scrollAreaRef={scrollAreaRef} className="bg-white rounded-lg shadow-sm border p-2" />
              <ViewToggle />
            </div>
          </div>
        </div>

        {/* Today Status */}
        {isTodayInRange && (
          <div className="border-b bg-blue-50 p-3">
            <div className="flex items-center gap-2 text-blue-800">
              <CalendarDays className="w-4 h-4" />
              <span className="text-sm">
                Today is {format(today, 'EEEE, dd/MM/yyyy')} • 
                Timeline is positioned on current {currentView} • 
                Press 'T' or use navigation controls to center on today
              </span>
            </div>
          </div>
        )}

        {!isTodayInRange && (
          <div className="border-b bg-yellow-50 p-3">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">
                Today ({format(today, 'dd/MM/yyyy')}) is outside the current {currentView} view range • 
                {currentView === 'day' ? `Switch to ${new Date().getFullYear()} or` : ''} Change view to see current date
              </span>
            </div>
          </div>
        )}

        {/* Conflicts Summary */}
        {conflicts.length > 0 && (
          <div className="border-b bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-4 h-4" />
              <h4 className="text-sm">Scheduling Conflicts Detected</h4>
            </div>
            <p className="text-xs text-red-600 mt-1">
              {conflicts.length} task{conflicts.length !== 1 ? 's have' : ' has'} overlapping dates. 
              Tasks with conflicts are highlighted with red borders and warning icons.
            </p>
          </div>
        )}

        {/* Main Content with Enhanced Horizontal Scroll */}
        <div className="flex flex-1 min-h-0">
          {/* Collapsible Task Names Column */}
          {!isTaskListCollapsed && (
            <div className={`${isSuperCompact ? 'w-48' : isCompactMode ? 'w-64' : 'w-72'} shrink-0 border-r bg-gray-50 flex flex-col`}>
              {/* Compact Header */}
              <div className="px-3 py-2 border-b bg-white shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">Tasks & Assignments</h4>
                    <p className="text-xs text-gray-500">
                      {tasks.length} task{tasks.length !== 1 ? 's' : ''} • {currentView} view
                      {currentView === 'day' && ` • ${selectedYear}`}
                      {isSuperCompact && ' • Ultra-compact'}
                      {isCompactMode && !isSuperCompact && ' • Compact'}
                    </p>
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
                      className="h-7 w-7 p-0"
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
                      className="h-7 w-7 p-0"
                      title="Hide task list"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            
            {/* Compact Task List with Full Height Scroll */}
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-gray-200">
                {tasks.map((task) => {
                  const conflictCount = getDeveloperConflictCount(task.assignedDeveloperId);
                  
                  return (
                    <div 
                      key={task.id} 
                      className={`hover:bg-gray-100 cursor-pointer transition-colors group border-l-2 border-transparent hover:border-blue-400 ${
                        isSuperCompact ? 'px-1.5 py-0.5' :
                        isCompactMode ? 'px-2 py-1' : 'px-3 py-2'
                      }`} 
                      onClick={() => setSelectedTask(task)}
                    >
                      {isSuperCompact ? (
                        // Super-compact mode - minimal single line
                        <div className="flex items-center gap-1 text-xs">
                          {/* Multi-indicator dot (status + priority combined) */}
                          <div className="relative w-2 h-2 shrink-0">
                            <div className={`absolute inset-0 rounded-full ${
                              task.status === 'completed' ? 'bg-green-500' :
                              task.status === 'in-progress' ? 'bg-blue-500' :
                              task.status === 'blocked' ? 'bg-red-500' : 'bg-gray-400'
                            }`} />
                            {(task.priority === 'critical' || task.priority === 'high') && (
                              <div className={`absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full ${
                                task.priority === 'critical' ? 'bg-red-600' : 'bg-orange-500'
                              }`} />
                            )}
                          </div>
                          
                          {/* Abbreviated task title */}
                          <span className="font-medium truncate flex-1 group-hover:text-blue-700 min-w-0 text-xs" title={task.title}>
                            {task.title.length > 20 ? task.title.substring(0, 17) + '...' : task.title}
                          </span>
                          
                          {/* Developer initial in circle */}
                          <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center text-xs font-mono text-gray-600 shrink-0" title={getDeveloperName(task.assignedDeveloperId)}>
                            {getDeveloperName(task.assignedDeveloperId).charAt(0).toUpperCase()}
                          </div>
                          
                          {/* Conflict warning if present */}
                          {conflictCount > 0 && (
                            <div className="w-1 h-1 bg-red-500 rounded-full shrink-0" title={`${conflictCount} conflicts`} />
                          )}
                        </div>
                      ) : isCompactMode ? (
                        // Ultra-compact mode - single line with maximum info density
                        <div className="flex items-center gap-1.5 text-xs">
                          {/* Status indicator dot */}
                          <div className={`w-2 h-2 rounded-full shrink-0 ${
                            task.status === 'completed' ? 'bg-green-500' :
                            task.status === 'in-progress' ? 'bg-blue-500' :
                            task.status === 'blocked' ? 'bg-red-500' : 'bg-gray-400'
                          }`} title={task.status} />
                          
                          {/* Task title - truncated */}
                          <span className="font-medium truncate flex-1 group-hover:text-blue-700 min-w-0" title={task.title}>
                            {task.title}
                          </span>
                          
                          {/* Priority indicator */}
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            task.priority === 'critical' ? 'bg-red-600' :
                            task.priority === 'high' ? 'bg-orange-500' :
                            task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-300'
                          }`} title={`${task.priority} priority`} />
                          
                          {/* Conflict indicator */}
                          {conflictCount > 0 && (
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" title={`${conflictCount} conflicts`} />
                          )}
                          
                          {/* Developer initial */}
                          <div className="text-xs text-gray-500 font-mono w-6 text-center shrink-0" title={getDeveloperName(task.assignedDeveloperId)}>
                            {getDeveloperName(task.assignedDeveloperId).charAt(0).toUpperCase()}
                          </div>
                        </div>
                      ) : (
                        // Enhanced compact mode with better layout
                        <div className="space-y-1.5">
                          {/* Title and Conflict Badge */}
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-medium truncate flex-1 group-hover:text-blue-700">{task.title}</h5>
                            {conflictCount > 0 && (
                              <Badge variant="destructive" className="text-xs px-1.5 py-0.5 h-5">
                                <AlertTriangle className="w-3 h-3" />
                              </Badge>
                            )}
                          </div>
                          
                          {/* Developer and Date Row */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 truncate max-w-[120px]" title={getDeveloperName(task.assignedDeveloperId)}>
                              {getDeveloperName(task.assignedDeveloperId)}
                            </span>
                            <div className="flex items-center gap-1 text-gray-500 shrink-0">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">{format(task.startDate, viewConfig.dateFormat)}</span>
                            </div>
                          </div>
                          
                          {/* Status and Priority Row */}
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium leading-none flex-1 text-center ${
                              task.status === 'completed' ? 'bg-green-100 text-green-700' :
                              task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                              task.status === 'blocked' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {task.status === 'in-progress' ? 'Progress' : 
                               task.status === 'not-started' ? 'Pending' :
                               task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium leading-none w-12 text-center ${
                              task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                              task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {task.priority === 'critical' ? 'CRIT' :
                               task.priority === 'high' ? 'HIGH' :
                               task.priority === 'medium' ? 'MED' : 'LOW'}
                            </span>
                          </div>
                          
                          {/* Description - only show if exists and not in compact mode */}
                          {task.description && task.description.length > 0 && (
                            <p className="text-xs text-gray-500 truncate" title={task.description}>
                              {task.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {tasks.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    <div className="mb-1 font-medium text-sm">No tasks added yet</div>
                    <div className="text-xs">Create your first task to get started.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Collapsed Task List Toggle */}
          {isTaskListCollapsed && (
            <div className="w-8 border-r bg-gray-50 flex flex-col">
              <div className="p-2 border-b bg-white">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsTaskListCollapsed(false)}
                  className="h-7 w-7 p-0"
                  title="Show task list"
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="transform -rotate-90 text-xs text-gray-500 whitespace-nowrap">
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Scrollable Timeline */}
          <div className="flex-1 relative flex flex-col min-w-0">
            {/* Timeline Status Bar */}
            <div className="absolute top-4 left-4 z-30 pointer-events-none">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-gray-700 shadow-lg border border-gray-200/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">
                    Timeline: {timelineWidth.toLocaleString()}px wide
                  </span>
                  {isTodayInRange && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span>Today at {Math.round(todayPosition)}px</span>
                    </>
                  )}
                  <span className="text-gray-400">•</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">Press 'T' for today</span>
                </div>
              </div>
            </div>

            <ScrollArea 
              className="flex-1 focus-within:ring-2 focus-within:ring-blue-500/30 transition-all" 
              ref={scrollAreaRef}
              tabIndex={0}
              role="region"
              aria-label="Timeline scroll area - use arrow keys to navigate, mouse wheel to scroll"
            >
              <TimelineEnhancements scrollAreaRef={scrollAreaRef} viewConfig={viewConfig} />
              <div style={{ width: `${timelineWidth}px`, minWidth: '100%' }}>
                {/* Timeline Header */}
                <div className="border-b bg-white p-4 sticky top-0 z-20">
                  <div className="flex">
                    {units.map((unit, index) => (
                      <div
                        key={unit.toISOString()}
                        className={`border-r border-gray-200 transition-colors ${
                          currentView === 'day' && isWeekend(unit) ? 'bg-gray-50' : ''
                        }`}
                        style={{ width: `${viewConfig.unitWidth}px` }}
                      >
                        {getHeaderFormat(unit, index)}
                      </div>
                    ))}
                  </div>
                  
                  {/* Today indicator line in header */}
                  {isTodayInRange && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
                      style={{ left: `${todayPosition}px` }}
                    >
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          <span>Today</span>
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-red-500"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Task Timeline Rows */}
                <div className="relative">
                  {/* Today indicator line spanning all tasks */}
                  {isTodayInRange && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                      style={{ left: `${todayPosition}px` }}
                    >
                      {/* Indicator dots every 100px down */}
                      {Array.from({ length: Math.ceil(600 / 100) }).map((_, i) => (
                        <div 
                          key={i}
                          className="absolute left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full opacity-80"
                          style={{ top: `${i * 100 + 20}px` }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Weekend columns for day view */}
                  {currentView === 'day' && (
                    <div className="absolute inset-0 pointer-events-none">
                      {units.map((unit, index) => 
                        isWeekend(unit) ? (
                          <div
                            key={`weekend-${index}`}
                            className="absolute top-0 bottom-0 bg-gray-100 opacity-40"
                            style={{
                              left: `${index * viewConfig.unitWidth}px`,
                              width: `${viewConfig.unitWidth}px`,
                            }}
                          />
                        ) : null
                      )}
                    </div>
                  )}

                  {/* Grid lines for better visual separation */}
                  <div className="absolute inset-0 pointer-events-none">
                    {units.map((_, index) => (
                      <div
                        key={`grid-${index}`}
                        className="absolute top-0 bottom-0 border-r border-gray-200 opacity-30"
                        style={{ left: `${index * viewConfig.unitWidth}px` }}
                      />
                    ))}
                  </div>

                  {tasks.map((task) => (
                    <TimelineDropZone key={task.id} className="border-b last:border-b-0">
                      <div 
                        className="p-4 hover:bg-gray-50 min-h-[96px] relative transition-colors"
                        style={{ width: `${timelineWidth}px` }}
                      >
                        <DraggableTaskBar
                          task={task}
                          onTaskClick={setSelectedTask}
                        />
                      </div>
                    </TimelineDropZone>
                  ))}

                  {tasks.length === 0 && (
                    <div className="p-8 text-center text-gray-500 relative min-h-[200px] flex items-center justify-center" style={{ width: `${timelineWidth}px` }}>
                      <div>
                        <div className="mb-2">Timeline is ready</div>
                        <div className="text-xs">
                          {isTodayInRange 
                            ? `Timeline spans ${units.length} ${currentView}s. Add tasks to see them positioned relative to today.`
                            : `Add tasks to see them on the timeline.`
                          }
                        </div>
                      </div>
                      
                      {/* Today indicator even when no tasks */}
                      {isTodayInRange && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                          style={{ left: `${todayPosition}px` }}
                        >
                          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Enhanced Instructions Footer */}
        <div className="border-t bg-gradient-to-r from-gray-50 to-blue-50/30 p-4 shrink-0">
          <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4 text-blue-500" />
              <span>Drag &amp; drop to reschedule</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>Red borders show conflicts</span>
            </div>
            {isTodayInRange && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-red-500 rounded"></div>
                <span>Red line: Today ({format(today, 'dd/MM')})</span>
              </div>
            )}
            {currentView === 'day' && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-gray-100 border rounded-sm"></div>
                <span>Gray columns: Weekends</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
              <CalendarDays className="w-4 h-4 text-purple-500" />
              <span className="font-medium">
                Navigation: Arrow keys, scroll wheel, or use controls above
              </span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
              <span className="text-blue-700 font-medium">
                Current: {viewConfig.label} view
                {currentView === 'day' && ` (${selectedYear})`}
                {!isTodayInRange && ' • Today not in view'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}