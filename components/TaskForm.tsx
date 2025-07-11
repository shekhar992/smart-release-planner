import { useState, useEffect } from 'react';
import { useGantt } from '../contexts/GanttContext';
import { useStatus } from '../contexts/StatusContext';
import { Task } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { format, differenceInDays, addDays } from 'date-fns';
import { Calendar, User, Clock, Flag, GitBranch, Hash } from 'lucide-react';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
}

export function TaskForm({ open, onClose, task }: TaskFormProps) {
  const { developers, addTask, updateTask, tasks, getTasksByEpic } = useGantt();
  const { getActiveStatuses, getActivePriorities } = useStatus();
  
  // Get available epics and parent tasks
  const epics = tasks.filter(t => t.taskType === 'epic');
  const parentTasks = tasks.filter(t => 
    (t.taskType === 'story' || t.taskType === 'task') && 
    t.id !== task?.id // Don't include self
  );
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    duration: 1, // Duration in days
    assignedDeveloperId: '',
    status: '',
    priority: '',
    taskType: 'task',
    epicId: '',
    parentTaskId: '',
    storyPoints: 0,
    jiraKey: '',
    labels: '',
  });

  // Calculate duration when dates change
  const calculateDuration = (start: string, end: string) => {
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const days = differenceInDays(endDate, startDate) + 1; // +1 to include both start and end days
      return Math.max(1, days);
    }
    return 1;
  };

  // Update end date when duration changes
  const updateEndDateFromDuration = (startDate: string, duration: number) => {
    if (startDate && duration > 0) {
      const start = new Date(startDate);
      const end = addDays(start, duration - 1); // -1 because we include the start day
      return format(end, 'yyyy-MM-dd');
    }
    return '';
  };

  // Get active statuses and priorities
  const activeStatuses = getActiveStatuses();
  const activePriorities = getActivePriorities();

  useEffect(() => {
    console.log('TaskForm: Dialog state changed:', { open, task: !!task });
    
    if (open) {
      alert('TaskForm opened! Developers available: ' + developers.length);
    }
    
    if (task) {
      const taskDuration = calculateDuration(
        format(task.startDate, 'yyyy-MM-dd'),
        format(task.endDate, 'yyyy-MM-dd')
      );
      
      setFormData({
        title: task.title,
        description: task.description,
        startDate: format(task.startDate, 'yyyy-MM-dd'),
        endDate: format(task.endDate, 'yyyy-MM-dd'),
        duration: taskDuration,
        assignedDeveloperId: task.assignedDeveloperId,
        status: task.status,
        priority: task.priority,
        taskType: task.taskType || 'task',
        epicId: task.epicId || '',
        parentTaskId: task.parentTaskId || '',
        storyPoints: task.storyPoints || 0,
        jiraKey: task.jiraKey || '',
        labels: task.labels?.join(', ') || '',
      });
    } else {
      // Set defaults to first available status/priority
      const defaultStatus = activeStatuses.find(s => s.name === 'not-started') || activeStatuses[0];
      const defaultPriority = activePriorities.find(p => p.name === 'medium') || activePriorities[0];
      
      setFormData({
        title: '',
        description: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        duration: 1,
        assignedDeveloperId: '',
        status: defaultStatus?.name || '',
        priority: defaultPriority?.name || '',
        taskType: 'task',
        epicId: '',
        parentTaskId: '',
        storyPoints: 0,
        jiraKey: '',
        labels: '',
      });
    }
  }, [task, open, activeStatuses, activePriorities]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('TaskForm: Form submitted with data:', formData);
    console.log('TaskForm: Available developers:', developers);
    console.log('TaskForm: Active statuses:', activeStatuses);
    
    if (!formData.title || !formData.assignedDeveloperId || !formData.startDate || !formData.endDate) {
      console.log('TaskForm: Validation failed:', {
        title: !!formData.title,
        assignedDeveloperId: !!formData.assignedDeveloperId,
        startDate: !!formData.startDate,
        endDate: !!formData.endDate
      });
      return;
    }

    const taskData = {
      title: formData.title,
      description: formData.description,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      assignedDeveloperId: formData.assignedDeveloperId,
      status: formData.status,
      priority: formData.priority,
      taskType: formData.taskType as 'epic' | 'story' | 'task' | 'subtask' | 'bug',
      epicId: formData.epicId || undefined,
      parentTaskId: formData.parentTaskId || undefined,
      storyPoints: formData.storyPoints,
      jiraKey: formData.jiraKey || undefined,
      labels: formData.labels ? formData.labels.split(',').map(l => l.trim()).filter(Boolean) : undefined,
    };

    console.log('TaskForm: Task data to be added:', taskData);

    if (task) {
      console.log('TaskForm: Updating existing task');
      updateTask(task.id, taskData);
    } else {
      console.log('TaskForm: Adding new task');
      addTask(taskData);
    }

    onClose();
  };

  const getDeveloperName = (developerId: string) => {
    const developer = developers.find(dev => dev.id === developerId);
    return developer ? `${developer.name} (${developer.role})` : 'Unknown';
  };

  const getStatusDisplay = (statusId: string) => {
    const status = activeStatuses.find(s => s.name === statusId);
    return status ? (
      <div className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded"
          style={{ backgroundColor: status.color }}
        />
        <span>{status.label}</span>
      </div>
    ) : statusId;
  };

  const getPriorityDisplay = (priorityId: string) => {
    const priority = activePriorities.find(p => p.name === priorityId);
    return priority ? (
      <div className="flex items-center gap-2">
        <div 
          className="w-1 h-4 rounded"
          style={{ backgroundColor: priority.color }}
        />
        <span>{priority.label}</span>
      </div>
    ) : priorityId;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription>
            {task 
              ? 'Update the task details and assignment information.' 
              : 'Create a new task and assign it to a team member.'
            }
          </DialogDescription>
        </DialogHeader>
        
        {developers.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-amber-800 text-sm">
              <strong>No developers found!</strong> Please add team members in the Team tab before creating tasks.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Type and Basic Info */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/5 to-accent/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Task Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taskType">Task Type</Label>
                  <Select 
                    value={formData.taskType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, taskType: value }))}
                    disabled={task?.taskType === 'epic'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Only show Epic option when creating new tasks */}
                      {!task && <SelectItem value="epic">🎯 Epic</SelectItem>}
                      {/* Show Epic option when editing existing epic (but it's disabled) */}
                      {task?.taskType === 'epic' && <SelectItem value="epic">🎯 Epic</SelectItem>}
                      <SelectItem value="story">📖 User Story</SelectItem>
                      <SelectItem value="task">✅ Task</SelectItem>
                      <SelectItem value="subtask">📝 Sub-task</SelectItem>
                      <SelectItem value="bug">🐛 Bug</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* Show explanation when editing */}
                  {task && task.taskType === 'epic' && (
                    <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded-md p-2 mt-2">
                      <strong>Info:</strong> Epic type cannot be changed after creation as it may contain child tasks and has organizational significance.
                    </div>
                  )}
                  {task && task.taskType !== 'epic' && (
                    <div className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-md p-2 mt-2">
                      <strong>Note:</strong> Tasks cannot be converted to Epics after creation. Epics are designed to contain multiple tasks and have different organizational purposes.
                    </div>
                  )}
                </div>

                {/* Epic field - prominently placed like in JIRA */}
                {formData.taskType !== 'epic' && (
                  <div>
                    <Label htmlFor="epic">Epic</Label>
                    {epics.length > 0 ? (
                      <Select 
                        value={formData.epicId} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, epicId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select epic (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Epic</SelectItem>                        {epics.map((epic) => {
                          const epicTasks = getTasksByEpic(epic.id);
                          return (
                            <SelectItem key={epic.id} value={epic.id}>
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">🎯</span>
                                  <span className="font-medium">{epic.title}</span>
                                </div>
                                <div className="text-xs text-muted-foreground ml-2">
                                  ({epicTasks.length} task{epicTasks.length !== 1 ? 's' : ''})
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-muted-foreground bg-muted/30 rounded-md p-3 border-2 border-dashed">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎯</span>
                          <span>No epics available. Create an Epic first to organize your tasks.</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className={formData.taskType === 'epic' || epics.length === 0 ? '' : 'col-start-1'}>
                  <Label htmlFor="jiraKey">JIRA Key (Optional)</Label>
                  <Input
                    id="jiraKey"
                    value={formData.jiraKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, jiraKey: e.target.value }))}
                    placeholder="e.g., PROJ-123"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a clear, descriptive task title"
                  required
                  className="text-base"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what needs to be done, acceptance criteria, etc."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Assignment and Priority */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Assignment & Priority
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assignedDeveloper">Assigned Developer</Label>
                  <Select 
                    value={formData.assignedDeveloperId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assignedDeveloperId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a developer" />
                    </SelectTrigger>
                    <SelectContent>
                      {developers.map((developer) => (
                        <SelectItem key={developer.id} value={developer.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                              {developer.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span>{developer.name}</span>
                            <span className="text-muted-foreground text-xs">({developer.role})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {activePriorities.map((priority) => (
                        <SelectItem key={priority.id} value={priority.name}>
                          <div className="flex items-center gap-2">
                            <Flag className="w-3 h-3" style={{ color: priority.color }} />
                            {priority.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeStatuses.map((status) => (
                        <SelectItem key={status.id} value={status.name}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                            {status.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="storyPoints">Story Points</Label>
                  <Select 
                    value={formData.storyPoints.toString()} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, storyPoints: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Points" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No estimate</SelectItem>
                      <SelectItem value="1">1 point</SelectItem>
                      <SelectItem value="2">2 points</SelectItem>
                      <SelectItem value="3">3 points</SelectItem>
                      <SelectItem value="5">5 points</SelectItem>
                      <SelectItem value="8">8 points</SelectItem>
                      <SelectItem value="13">13 points</SelectItem>
                      <SelectItem value="21">21 points</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => {
                      const newStartDate = e.target.value;
                      const newDuration = formData.duration;
                      const newEndDate = updateEndDateFromDuration(newStartDate, newDuration);
                      setFormData(prev => ({ 
                        ...prev, 
                        startDate: newStartDate,
                        endDate: newEndDate
                      }));
                    }}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="duration" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Duration (days)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.duration}
                    onChange={(e) => {
                      const newDuration = Math.max(1, parseInt(e.target.value) || 1);
                      const newEndDate = updateEndDateFromDuration(formData.startDate, newDuration);
                      setFormData(prev => ({ 
                        ...prev, 
                        duration: newDuration,
                        endDate: newEndDate
                      }));
                    }}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => {
                      const newEndDate = e.target.value;
                      const newDuration = calculateDuration(formData.startDate, newEndDate);
                      setFormData(prev => ({ 
                        ...prev, 
                        endDate: newEndDate,
                        duration: newDuration
                      }));
                    }}
                    required
                  />
                </div>
              </div>
              
              {formData.startDate && formData.endDate && (
                <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                  <strong>Duration:</strong> {formData.duration} day{formData.duration !== 1 ? 's' : ''} 
                  ({format(new Date(formData.startDate), 'MMM d')} - {format(new Date(formData.endDate), 'MMM d, yyyy')})
                </div>
              )}
            </CardContent>
          </Card>

          {/* Relationships (Optional) */}
          {formData.taskType === 'subtask' && parentTasks.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Parent Task</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="parentTask">Parent Task</Label>
                  <Select 
                    value={formData.parentTaskId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, parentTaskId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent task" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentTasks.map((parentTask) => (
                        <SelectItem key={parentTask.id} value={parentTask.id}>
                          {parentTask.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Labels */}
          <div>
            <Label htmlFor="labels">Labels (Optional)</Label>
            <Input
              id="labels"
              value={formData.labels}
              onChange={(e) => setFormData(prev => ({ ...prev, labels: e.target.value }))}
              placeholder="Enter labels separated by commas (e.g., frontend, urgent, review)"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Separate multiple labels with commas
            </p>
          </div>
          <div>
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="assignedDeveloper">Assigned Developer</Label>
            <Select 
              value={formData.assignedDeveloperId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, assignedDeveloperId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a developer" />
              </SelectTrigger>
              <SelectContent>
                {developers.map((developer) => (
                  <SelectItem key={developer.id} value={developer.id}>
                    {getDeveloperName(developer.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taskType">Task Type</Label>
              <Select 
                value={formData.taskType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, taskType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="epic">Epic</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="subtask">Subtask</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="storyPoints">Story Points</Label>
              <Input
                id="storyPoints"
                type="number"
                min="0"
                max="100"
                value={formData.storyPoints}
                onChange={(e) => setFormData(prev => ({ ...prev, storyPoints: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
          </div>

          {/* Epic and Parent Task Selection */}
          {formData.taskType !== 'epic' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="epic">Epic</Label>
                <Select 
                  value={formData.epicId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, epicId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select epic (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Epic</SelectItem>
                    {epics.map((epic) => (
                      <SelectItem key={epic.id} value={epic.id}>
                        {epic.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.taskType === 'subtask' && (
                <div>
                  <Label htmlFor="parentTask">Parent Task</Label>
                  <Select 
                    value={formData.parentTaskId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, parentTaskId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent task" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentTasks.map((parentTask) => (
                        <SelectItem key={parentTask.id} value={parentTask.id}>
                          {parentTask.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* JIRA Key and Labels */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="jiraKey">JIRA Key</Label>
              <Input
                id="jiraKey"
                value={formData.jiraKey}
                onChange={(e) => setFormData(prev => ({ ...prev, jiraKey: e.target.value }))}
                placeholder="e.g., PROJ-123"
              />
            </div>
            <div>
              <Label htmlFor="labels">Labels</Label>
              <Input
                id="labels"
                value={formData.labels}
                onChange={(e) => setFormData(prev => ({ ...prev, labels: e.target.value }))}
                placeholder="Comma-separated labels"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {activeStatuses.map((status) => (
                    <SelectItem key={status.id} value={status.name}>
                      {getStatusDisplay(status.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {activePriorities.map((priority) => (
                    <SelectItem key={priority.id} value={priority.name}>
                      {getPriorityDisplay(priority.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />
          
          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-2">
            <div className="text-xs text-muted-foreground">
              {developers.length === 0 ? 'Add team members to create tasks' : 'All fields with * are required'}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={developers.length === 0}
                className="shadow-sm"
              >
                {task ? '💾 Update Task' : '✨ Create Task'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}