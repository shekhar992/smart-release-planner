import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useGantt } from '../contexts/GanttContext';
import { Task, GroupedTasks, GanttViewConfig } from '../types';
import { DraggableTaskBar } from './DraggableTaskBar';
import { TimelineDropZone } from './TimelineDropZone';
import { ViewToggle } from './ViewToggle';
import { format, isToday, isWeekend } from 'date-fns';
import { 
  AlertTriangle, 
  ChevronDown, 
  ChevronRight, 
  Plus,
  MoreHorizontal,
  Target,
  Layers,
  GitBranch,
  CheckCircle2,
  Circle,
  Minus
} from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { TooltipProvider } from './ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useRef, useState } from 'react';

export function JiraGanttChart() {
  const { 
    tasks, 
    developers, 
    setSelectedTask, 
    viewConfig, 
    getDateRange,
    addTask
  } = useGantt();
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // JIRA-like view configuration
  const [ganttConfig, setGanttConfig] = useState<GanttViewConfig>({
    showEpics: true,
    showSubtasks: true,
    groupByEpic: true,
    compactMode: false,
    showDependencies: true,
    showCriticalPath: false,
  });

  // Collapsed state for epic groups
  const [collapsedEpics, setCollapsedEpics] = useState<Set<string>>(new Set());

  const { units, todayIndex } = getDateRange();
  const isTodayInRange = todayIndex !== -1;

  // Group tasks by epic
  const groupedTasks: GroupedTasks = tasks.reduce((acc, task) => {
    if (task.taskType === 'epic') {
      // Create epic entry if it doesn't exist
      if (!acc.groups[task.id]) {
        acc.groups[task.id] = {
          epic: {
            id: task.id,
            title: task.title,
            description: task.description,
            startDate: task.startDate,
            endDate: task.endDate,
            status: task.status,
            priority: task.priority,
            color: getEpicColor(task.priority),
            progress: 0,
            totalStoryPoints: task.storyPoints || 0,
            completedStoryPoints: 0,
            jiraKey: task.jiraKey,
            labels: task.labels,
          },
          tasks: [],
          subtasks: {},
        };
      }
    } else if (task.epicId && acc.groups[task.epicId]) {
      // Add task to epic group
      if (task.parentTaskId) {
        // This is a subtask
        if (!acc.groups[task.epicId].subtasks[task.parentTaskId]) {
          acc.groups[task.epicId].subtasks[task.parentTaskId] = [];
        }
        acc.groups[task.epicId].subtasks[task.parentTaskId].push(task);
      } else {
        // This is a regular task in the epic
        acc.groups[task.epicId].tasks.push(task);
      }
    } else if (!task.epicId && !task.parentTaskId) {
      // Ungrouped tasks (no epic)
      acc.ungrouped.push(task);
    }
    
    return acc;
  }, { ungrouped: [], groups: {} } as GroupedTasks);

  // Calculate epic progress
  Object.values(groupedTasks.groups).forEach(group => {
    if (group.epic) {
      const allTasks = [
        ...group.tasks,
        ...Object.values(group.subtasks).flat()
      ];
      
      const completedTasks = allTasks.filter(task => 
        task.status === 'completed' || task.status === 'done'
      );
      
      group.epic.progress = allTasks.length > 0 
        ? (completedTasks.length / allTasks.length) * 100 
        : 0;
        
      group.epic.completedStoryPoints = completedTasks.reduce(
        (sum, task) => sum + (task.storyPoints || 0), 0
      );
      
      group.epic.totalStoryPoints = allTasks.reduce(
        (sum, task) => sum + (task.storyPoints || 0), 0
      );
    }
  });

  function getEpicColor(priority: string): string {
    const colors = {
      'critical': '#DC2626',
      'high': '#EA580C',
      'medium': '#CA8A04',
      'low': '#16A34A',
    };
    return colors[priority as keyof typeof colors] || '#6B7280';
  }

  function toggleEpicCollapse(epicId: string) {
    setCollapsedEpics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(epicId)) {
        newSet.delete(epicId);
      } else {
        newSet.add(epicId);
      }
      return newSet;
    });
  }

  const createNewEpic = () => {
    const newEpic: Omit<Task, 'id'> = {
      title: 'New Epic',
      description: 'Epic description',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      assignedDeveloperId: developers[0]?.id || '',
      status: 'planning',
      priority: 'medium',
      taskType: 'epic',
      storyPoints: 0,
    };
    
    addTask(newEpic);
  };

  const createTaskInEpic = (epicId: string) => {
    const newTask: Omit<Task, 'id'> = {
      title: 'New Task',
      description: 'Task description',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      assignedDeveloperId: developers[0]?.id || '',
      status: 'todo',
      priority: 'medium',
      taskType: 'task',
      epicId: epicId,
      storyPoints: 3,
    };
    
    addTask(newTask);
  };

  return (
    <TooltipProvider>
      <DndProvider backend={HTML5Backend}>
        <div className="h-full flex flex-col bg-background">
          {/* Header with controls */}
          <div className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <ViewToggle />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGanttConfig(prev => ({ ...prev, groupByEpic: !prev.groupByEpic }))}
                  className={ganttConfig.groupByEpic ? 'bg-primary/10' : ''}
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Group by Epic
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGanttConfig(prev => ({ ...prev, showSubtasks: !prev.showSubtasks }))}
                  className={ganttConfig.showSubtasks ? 'bg-primary/10' : ''}
                >
                  <GitBranch className="w-4 h-4 mr-2" />
                  Show Subtasks
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createNewEpic}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Epic
                </Button>
              </div>
            </div>
          </div>

          {/* Main gantt area */}
          <div className="flex-1 flex">
            {/* Task list sidebar */}
            <div className="w-96 border-r bg-card/30 flex flex-col">
              {/* Task list header */}
              <div className="h-16 border-b bg-muted/30 flex items-center px-4">
                <h3 className="font-semibold">Tasks</h3>
              </div>
              
              {/* Task list content */}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {/* Render ungrouped tasks */}
                  {groupedTasks.ungrouped.length > 0 && (
                    <div className="mb-4">
                      <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
                        Ungrouped Tasks
                      </div>
                      {groupedTasks.ungrouped.map(task => (
                        <TaskListItem 
                          key={task.id} 
                          task={task} 
                          level={0}
                          onSelect={() => setSelectedTask(task)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Render epic groups */}
                  {Object.entries(groupedTasks.groups).map(([epicId, group]) => (
                    <Collapsible 
                      key={epicId}
                      open={!collapsedEpics.has(epicId)}
                      onOpenChange={() => toggleEpicCollapse(epicId)}
                    >
                      <div className="rounded-lg border bg-card/50 overflow-hidden">
                        {/* Epic header */}
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center gap-2 p-3 hover:bg-muted/30 cursor-pointer">
                            <div className="flex items-center gap-2 flex-1">
                              {collapsedEpics.has(epicId) ? 
                                <ChevronRight className="w-4 h-4" /> : 
                                <ChevronDown className="w-4 h-4" />
                              }
                              <div 
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: group.epic?.color }}
                              />
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-orange-500" />
                                <span className="font-medium">{group.epic?.title}</span>
                                {group.epic?.jiraKey && (
                                  <Badge variant="outline" className="text-xs">
                                    {group.epic.jiraKey}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={group.epic?.progress || 0} 
                                className="w-16 h-2" 
                              />
                              <span className="text-xs text-muted-foreground">
                                {Math.round(group.epic?.progress || 0)}%
                              </span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => createTaskInEpic(epicId)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Task
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="border-t bg-muted/10">
                            {/* Epic tasks */}
                            {group.tasks.map(task => (
                              <div key={task.id}>
                                <TaskListItem 
                                  task={task} 
                                  level={1}
                                  onSelect={() => setSelectedTask(task)}
                                />
                                
                                {/* Subtasks */}
                                {ganttConfig.showSubtasks && group.subtasks[task.id] && (
                                  <div className="ml-4">
                                    {group.subtasks[task.id].map(subtask => (
                                      <TaskListItem 
                                        key={subtask.id}
                                        task={subtask} 
                                        level={2}
                                        onSelect={() => setSelectedTask(subtask)}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Timeline area */}
            <div className="flex-1 flex flex-col">
              {/* Timeline header */}
              <div className="h-16 border-b bg-muted/30 overflow-hidden">
                <ScrollArea ref={scrollAreaRef} className="h-full">
                  <div 
                    className="flex h-full"
                    style={{ width: units.length * viewConfig.unitWidth }}
                  >
                    {units.map((unit, index) => (
                      <div
                        key={index}
                        className={`flex-shrink-0 border-r border-border/30 flex items-center justify-center text-sm ${
                          isToday(unit) ? 'bg-primary/10 font-semibold' : ''
                        } ${isWeekend(unit) ? 'bg-muted/20' : ''}`}
                        style={{ width: viewConfig.unitWidth }}
                      >
                        {format(unit, viewConfig.dateFormat)}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Timeline content */}
              <div className="flex-1 relative overflow-hidden">
                <ScrollArea className="h-full">
                  <div 
                    className="relative"
                    style={{ 
                      width: units.length * viewConfig.unitWidth,
                      minHeight: '100%'
                    }}
                  >
                    {/* Today line */}
                    {isTodayInRange && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                        style={{ left: todayIndex * viewConfig.unitWidth }}
                      />
                    )}

                    {/* Grid lines */}
                    {units.map((unit, index) => (
                      <div
                        key={index}
                        className={`absolute top-0 bottom-0 border-r border-border/10 ${
                          isWeekend(unit) ? 'bg-muted/5' : ''
                        }`}
                        style={{ 
                          left: index * viewConfig.unitWidth,
                          width: viewConfig.unitWidth 
                        }}
                      />
                    ))}

                    {/* Task bars */}
                    <div className="relative space-y-2">
                      {/* Render ungrouped task bars */}
                      {groupedTasks.ungrouped.map(task => (
                        <TimelineDropZone key={task.id} className="border-b border-border/30 last:border-b-0">
                          <div className="p-2 hover:bg-muted/30 min-h-[40px] relative transition-colors duration-200">
                            <DraggableTaskBar
                              task={task}
                              onTaskClick={setSelectedTask}
                            />
                          </div>
                        </TimelineDropZone>
                      ))}

                      {/* Render epic group task bars */}
                      {Object.entries(groupedTasks.groups).map(([epicId, group]) => (
                        <div key={epicId} className="space-y-1">
                          {!collapsedEpics.has(epicId) && (
                            <>
                              {group.tasks.map(task => (
                                <div key={task.id} className="space-y-1">
                                  <TimelineDropZone className="border-b border-border/30 last:border-b-0">
                                    <div className="p-2 hover:bg-muted/30 min-h-[40px] relative transition-colors duration-200">
                                      <DraggableTaskBar
                                        task={task}
                                        onTaskClick={setSelectedTask}
                                      />
                                    </div>
                                  </TimelineDropZone>
                                  
                                  {/* Subtask bars */}
                                  {ganttConfig.showSubtasks && group.subtasks[task.id] && (
                                    <div className="ml-4 space-y-1">
                                      {group.subtasks[task.id].map(subtask => (
                                        <TimelineDropZone key={subtask.id} className="border-b border-border/30 last:border-b-0">
                                          <div className="p-1 hover:bg-muted/30 min-h-[32px] relative transition-colors duration-200">
                                            <DraggableTaskBar
                                              task={subtask}
                                              onTaskClick={setSelectedTask}
                                            />
                                          </div>
                                        </TimelineDropZone>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      </DndProvider>
    </TooltipProvider>
  );
}

interface TaskListItemProps {
  task: Task;
  level: number;
  onSelect: () => void;
}

function TaskListItem({ task, level, onSelect }: TaskListItemProps) {
  const indentClass = level === 0 ? '' : level === 1 ? 'ml-4' : 'ml-8';
  
  return (
    <div 
      className={`${indentClass} flex items-center gap-2 p-2 hover:bg-muted/30 rounded cursor-pointer group`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex-shrink-0">
          {task.taskType === 'epic' && <Target className="w-4 h-4 text-orange-500" />}
          {task.taskType === 'story' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
          {task.taskType === 'task' && <Circle className="w-4 h-4 text-gray-500" />}
          {task.taskType === 'subtask' && <Minus className="w-4 h-4 text-gray-400" />}
          {task.taskType === 'bug' && <AlertTriangle className="w-4 h-4 text-red-500" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{task.title}</span>
            {task.jiraKey && (
              <Badge variant="outline" className="text-xs">
                {task.jiraKey}
              </Badge>
            )}
          </div>
          {task.storyPoints && (
            <div className="text-xs text-muted-foreground">
              {task.storyPoints} SP
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Badge variant="secondary" className="text-xs">
          {task.status}
        </Badge>
      </div>
    </div>
  );
}
