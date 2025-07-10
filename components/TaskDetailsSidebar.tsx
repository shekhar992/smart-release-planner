import { useState } from 'react';
import { useGantt } from '../contexts/GanttContext';
import { useStatus } from '../contexts/StatusContext';
import { TaskForm } from './TaskForm';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Alert, AlertDescription } from './ui/alert';
import { Calendar, Clock, User, Flag, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export function TaskDetailsSidebar() {
  const { selectedTask, setSelectedTask, developers, deleteTask, getTaskConflicts } = useGantt();
  const { getActiveStatuses, getActivePriorities } = useStatus();
  const [showEditForm, setShowEditForm] = useState(false);

  if (!selectedTask) return null;

  const assignedDeveloper = developers.find(dev => dev.id === selectedTask.assignedDeveloperId);
  const taskDuration = differenceInDays(selectedTask.endDate, selectedTask.startDate) + 1;
  const conflict = getTaskConflicts(selectedTask.id);

  // Get status and priority info
  const statusInfo = getActiveStatuses().find(s => s.name === selectedTask.status);
  const priorityInfo = getActivePriorities().find(p => p.name === selectedTask.priority);

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(selectedTask.id);
      setSelectedTask(null);
    }
  };

  const getConflictingTasks = () => {
    if (!conflict) return [];
    return conflict.conflictingTasks.filter(task => task.id !== selectedTask.id);
  };

  return (
    <>
      <Sheet open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <SheetContent className="w-96">
          <SheetHeader>
            <SheetTitle className="text-left flex items-center gap-2">
              {selectedTask.title}
              {conflict && <AlertTriangle className="w-4 h-4 text-destructive" />}
            </SheetTitle>
            <SheetDescription>
              {conflict 
                ? `Task details with scheduling conflicts detected` 
                : `View and manage task details, assignment, and timeline`
              }
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {/* Conflict Warning */}
            {conflict && (
              <Alert className="border-destructive/20 bg-destructive/5">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  <div className="mb-2">
                    <strong>Scheduling Conflict Detected</strong>
                  </div>
                  <div className="text-sm space-y-1">
                    <p>This task overlaps with {conflict.conflictingTasks.length} other task{conflict.conflictingTasks.length !== 1 ? 's' : ''} assigned to the same developer.</p>
                    
                    <div className="mt-2">
                      <p className="text-xs">Conflicting tasks:</p>
                      <div className="space-y-1 mt-1">
                        {getConflictingTasks().map(conflictTask => (
                          <div key={conflictTask.id} className="text-xs bg-destructive/10 p-2 rounded">
                            <div className="truncate">{conflictTask.title}</div>
                            <div className="text-destructive">
                              {format(conflictTask.startDate, 'MMM d')} - {format(conflictTask.endDate, 'MMM d')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Status and Priority */}
            <div className="flex gap-2">
              {statusInfo ? (
                <Badge variant="secondary" className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: statusInfo.color }}
                  />
                  {statusInfo.label}
                </Badge>
              ) : (
                <Badge variant="secondary">
                  {selectedTask.status.replace('-', ' ').toUpperCase()}
                </Badge>
              )}
              
              {priorityInfo ? (
                <Badge variant="outline" className="flex items-center gap-2">
                  <div 
                    className="w-1 h-3 rounded-sm"
                    style={{ backgroundColor: priorityInfo.color }}
                  />
                  {priorityInfo.label}
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Flag className="w-3 h-3" />
                  {selectedTask.priority.toUpperCase()}
                </Badge>
              )}
            </div>

            {/* Description */}
            {selectedTask.description && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Description</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{selectedTask.description}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Start Date</span>
                  </div>
                  <span className="text-sm font-medium">{format(selectedTask.startDate, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>End Date</span>
                  </div>
                  <span className="text-sm font-medium">{format(selectedTask.endDate, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Duration</span>
                  </div>
                  <span className="text-sm font-medium">{taskDuration} day{taskDuration !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Assigned Developer */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Assigned Developer</h4>
              {assignedDeveloper ? (
                <div className="flex items-center gap-3 p-4 border rounded-lg bg-card">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {assignedDeveloper.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{assignedDeveloper.name}</p>
                  </div>
                  {conflict && (
                    <div className="text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 border rounded-lg border-dashed">
                  <User className="w-4 h-4" />
                  <span>No developer assigned</span>
                </div>
              )}
            </div>

            {/* Dependencies */}
            {selectedTask.dependencies && selectedTask.dependencies.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Dependencies</h4>
                <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                  This task depends on {selectedTask.dependencies.length} other task(s)
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                className="flex-1 hover:bg-primary/10"
                onClick={() => setShowEditForm(true)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <TaskForm
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        task={selectedTask}
      />
    </>
  );
}