import { useState } from 'react';
import { useGantt } from '../contexts/GanttContext';
import { TaskForm } from './TaskForm';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Alert, AlertDescription } from './ui/alert';
import { Calendar, Clock, User, Flag, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export function TaskDetailsSidebar() {
  const { selectedTask, setSelectedTask, developers, deleteTask, tasks, getTaskConflicts } = useGantt();
  const [showEditForm, setShowEditForm] = useState(false);

  if (!selectedTask) return null;

  const assignedDeveloper = developers.find(dev => dev.id === selectedTask.assignedDeveloperId);
  const taskDuration = differenceInDays(selectedTask.endDate, selectedTask.startDate) + 1;
  const conflict = getTaskConflicts(selectedTask.id);

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(selectedTask.id);
      setSelectedTask(null);
    }
  };

  const statusColors = {
    'not-started': 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800',
    'blocked': 'bg-red-100 text-red-800',
  };

  const priorityColors = {
    'low': 'bg-gray-100 text-gray-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'high': 'bg-orange-100 text-orange-800',
    'critical': 'bg-red-100 text-red-800',
  };

  const getConflictingTasks = () => {
    if (!conflict) return [];
    return tasks.filter(task => conflict.conflictingTaskIds.includes(task.id));
  };

  return (
    <>
      <Sheet open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <SheetContent className="w-96">
          <SheetHeader>
            <SheetTitle className="text-left flex items-center gap-2">
              {selectedTask.title}
              {conflict && <AlertTriangle className="w-4 h-4 text-red-500" />}
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
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="mb-2">
                    <strong>Scheduling Conflict Detected</strong>
                  </div>
                  <div className="text-sm space-y-1">
                    <p>This task overlaps with {conflict.conflictingTaskIds.length} other task{conflict.conflictingTaskIds.length !== 1 ? 's' : ''} assigned to the same developer.</p>
                    <p>Total overlap: {conflict.overlapDays} day{conflict.overlapDays !== 1 ? 's' : ''}</p>
                    
                    <div className="mt-2">
                      <p className="text-xs">Conflicting tasks:</p>
                      <div className="space-y-1 mt-1">
                        {getConflictingTasks().map(conflictTask => (
                          <div key={conflictTask.id} className="text-xs bg-red-100 p-2 rounded">
                            <div className="truncate">{conflictTask.title}</div>
                            <div className="text-red-600">
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
              <Badge className={statusColors[selectedTask.status]}>
                {selectedTask.status.replace('-', ' ').toUpperCase()}
              </Badge>
              <Badge className={priorityColors[selectedTask.priority]}>
                <Flag className="w-3 h-3 mr-1" />
                {selectedTask.priority.toUpperCase()}
              </Badge>
            </div>

            {/* Description */}
            {selectedTask.description && (
              <div>
                <h4 className="text-sm mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-3">
              <h4 className="text-sm">Timeline</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Start: {format(selectedTask.startDate, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>End: {format(selectedTask.endDate, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Duration: {taskDuration} day{taskDuration !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Assigned Developer */}
            <div>
              <h4 className="text-sm mb-2">Assigned Developer</h4>
              {assignedDeveloper ? (
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {assignedDeveloper.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm">{assignedDeveloper.name}</p>
                    <p className="text-xs text-muted-foreground">{assignedDeveloper.role}</p>
                    <p className="text-xs text-muted-foreground">{assignedDeveloper.email}</p>
                  </div>
                  {conflict && (
                    <div className="text-red-500">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>No developer assigned</span>
                </div>
              )}
            </div>

            {/* Dependencies */}
            {selectedTask.dependencies && selectedTask.dependencies.length > 0 && (
              <div>
                <h4 className="text-sm mb-2">Dependencies</h4>
                <div className="text-sm text-muted-foreground">
                  This task depends on {selectedTask.dependencies.length} other task(s)
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowEditForm(true)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>

            {/* Drag Instructions */}
            <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded">
              💡 <strong>Tip:</strong> You can drag this task bar in the Gantt chart to reschedule its dates quickly.
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