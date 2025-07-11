import { useGantt } from '../contexts/GanttContext';
import { useStatus } from '../contexts/StatusContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  Calendar, 
  Clock, 
  User, 
  Flag, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  Target,
  Timer,
  Activity,
  FileText,
  Tag,
  Users,
  CheckCircle2,
  Circle,
  PlayCircle,
  XCircle
} from 'lucide-react';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';

const TASK_TYPE_CONFIG = {
  epic: { icon: '🎯', label: 'Epic', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  story: { icon: '📖', label: 'Story', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  task: { icon: '✅', label: 'Task', color: 'bg-green-100 text-green-700 border-green-200' },
  subtask: { icon: '📝', label: 'Subtask', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  bug: { icon: '🐛', label: 'Bug', color: 'bg-red-100 text-red-700 border-red-200' }
};

export function TaskDetailsSidebar() {
  const { selectedTask, setSelectedTask, developers, deleteTask, getTaskConflicts, setEditingTask } = useGantt();
  const { getActiveStatuses, getActivePriorities } = useStatus();

  if (!selectedTask) return null;

  const assignedDeveloper = developers.find(dev => dev.id === selectedTask.assignedDeveloperId);
  const taskDuration = differenceInDays(selectedTask.endDate, selectedTask.startDate) + 1;
  const conflict = getTaskConflicts(selectedTask.id);

  // Get status and priority info
  const statusInfo = getActiveStatuses().find(s => s.name === selectedTask.status);
  const priorityInfo = getActivePriorities().find(p => p.name === selectedTask.priority);
  
  // Task type configuration
  const taskTypeConfig = TASK_TYPE_CONFIG[selectedTask.taskType] || TASK_TYPE_CONFIG.task;

  // Progress calculation
  const getTaskProgress = () => {
    const today = new Date();
    const start = new Date(selectedTask.startDate);
    const end = new Date(selectedTask.endDate);
    
    if (isBefore(today, start)) return 0;
    if (isAfter(today, end)) return 100;
    
    const totalDays = differenceInDays(end, start);
    const elapsedDays = differenceInDays(today, start);
    return Math.round((elapsedDays / totalDays) * 100);
  };

  // Status icon
  const getStatusIcon = () => {
    const status = selectedTask.status.toLowerCase();
    if (status.includes('completed') || status.includes('done')) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    } else if (status.includes('progress') || status.includes('active')) {
      return <PlayCircle className="w-4 h-4 text-blue-500" />;
    } else if (status.includes('blocked')) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    return <Circle className="w-4 h-4 text-gray-400" />;
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      deleteTask(selectedTask.id);
      setSelectedTask(null);
    }
  };

  const getConflictingTasks = () => {
    if (!conflict) return [];
    return conflict.conflictingTasks.filter(task => task.id !== selectedTask.id);
  };

  const progress = getTaskProgress();

  return (
    <>
      <Sheet open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <SheetContent className="w-[480px] p-0 flex flex-col h-full">
          <div className="h-full flex flex-col">
            {/* Header */}
            <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`px-2 py-1 rounded-md text-xs font-medium border ${taskTypeConfig.color}`}>
                    <span className="mr-1">{taskTypeConfig.icon}</span>
                    {taskTypeConfig.label}
                  </div>
                  {conflict && (
                    <Badge variant="destructive" className="text-xs animate-pulse">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Conflict
                    </Badge>
                  )}
                </div>
                
                <SheetTitle className="text-xl font-semibold text-gray-900 leading-tight dark:text-gray-100">
                  {selectedTask.title}
                </SheetTitle>
                
                {/* Status and Priority Row */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-2 py-1 bg-white/50 rounded-md dark:bg-gray-800/50">
                    {getStatusIcon()}
                    <span className="text-sm font-medium">
                      {statusInfo?.label || selectedTask.status}
                    </span>
                  </div>
                  
                  <Separator orientation="vertical" className="h-4" />
                  
                  <div className="flex items-center gap-2 px-2 py-1 bg-white/50 rounded-md dark:bg-gray-800/50">
                    <Flag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">
                      {priorityInfo?.label || selectedTask.priority}
                    </span>
                  </div>
                  
                  {selectedTask.storyPoints && (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-2 px-2 py-1 bg-white/50 rounded-md dark:bg-gray-800/50">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          {selectedTask.storyPoints} pts
                        </span>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Timeline Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress 
                    value={progress} 
                    className="h-2 bg-white/50 dark:bg-gray-800/50" 
                  />
                </div>
              </div>
            </SheetHeader>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Conflict Warning */}
              {conflict && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium text-red-800">Scheduling Conflict Detected</p>
                      <p className="text-sm text-red-700">
                        This task overlaps with {conflict.conflictingTasks.length} other task{conflict.conflictingTasks.length !== 1 ? 's' : ''} assigned to the same developer.
                      </p>
                      <div className="mt-3 space-y-2">
                        {getConflictingTasks().map(conflictTask => (
                          <Card key={conflictTask.id} className="border-red-200">
                            <CardContent className="p-3">
                              <p className="text-sm font-medium text-red-800">{conflictTask.title}</p>
                              <p className="text-xs text-red-600">
                                {format(conflictTask.startDate, 'MMM d')} - {format(conflictTask.endDate, 'MMM d')}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Description */}
              {selectedTask.description && (
                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <h3 className="font-medium">Description</h3>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed dark:text-gray-300">{selectedTask.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Assigned Developer */}
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <h3 className="font-medium">Assigned Developer</h3>
                  </div>
                  
                  {assignedDeveloper ? (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors duration-200">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-300">
                          {assignedDeveloper.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{assignedDeveloper.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{assignedDeveloper.role}</p>
                      </div>
                      {conflict && (
                        <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-lg dark:border-gray-700">
                      <Users className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">No developer assigned</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <h3 className="font-medium">Timeline</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800/50">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Start Date</p>
                        <p className="text-sm font-medium dark:text-gray-200">{format(selectedTask.startDate, 'MMM d, yyyy')}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800/50">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">End Date</p>
                        <p className="text-sm font-medium dark:text-gray-200">{format(selectedTask.endDate, 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Duration</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                          {taskDuration} day{taskDuration !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Time Tracking */}
              {(selectedTask.originalEstimate || selectedTask.timeSpent || selectedTask.remainingEstimate) && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Timer className="w-4 h-4 text-gray-500" />
                      <h3 className="font-medium">Time Tracking</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {selectedTask.originalEstimate && (
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">Original Estimate</span>
                          <span className="text-sm font-medium">{selectedTask.originalEstimate}h</span>
                        </div>
                      )}
                      {selectedTask.timeSpent !== undefined && (
                        <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                          <span className="text-sm text-blue-700">Time Spent</span>
                          <span className="text-sm font-medium text-blue-800">{selectedTask.timeSpent || 0}h</span>
                        </div>
                      )}
                      {selectedTask.remainingEstimate && (
                        <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                          <span className="text-sm text-orange-700">Remaining</span>
                          <span className="text-sm font-medium text-orange-800">{selectedTask.remainingEstimate}h</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Labels */}
              {selectedTask.labels && selectedTask.labels.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-gray-500" />
                      <h3 className="font-medium">Labels</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.labels.map((label, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dependencies */}
              {selectedTask.dependencies && selectedTask.dependencies.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-gray-500" />
                      <h3 className="font-medium">Dependencies</h3>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm text-amber-800">
                        This task depends on {selectedTask.dependencies.length} other task{selectedTask.dependencies.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t bg-gray-50 p-4 dark:bg-gray-900/50">
              <div className="flex gap-3">
                <Button 
                  onClick={() => setEditingTask(selectedTask)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Task
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDelete}
                  className="hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Double-click task in timeline to edit directly
                </p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}