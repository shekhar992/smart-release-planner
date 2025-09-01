import React, { useState } from 'react';
import { useGantt } from '../contexts/GanttContext';
import { useStatus } from '../contexts/StatusContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { CalendarIcon, User, Flag, Clock, Tag, FileText, Zap, Target } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from './ui/utils';

interface NewTaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TaskFormData {
  title: string;
  description: string;
  taskType: 'epic' | 'story' | 'task' | 'subtask' | 'bug';
  assignedDeveloperId: string;
  status: string;
  priority: string;
  startDate: Date | null;
  endDate: Date | null;
  storyPoints: number | null;
  originalEstimate: number | null;
  labels: string[];
  epicId: string;
}

const TASK_TYPES = [
  { value: 'epic', label: 'Epic', icon: '🎯', color: 'purple' },
  { value: 'story', label: 'Story', icon: '📖', color: 'blue' },
  { value: 'task', label: 'Task', icon: '✅', color: 'green' },
  { value: 'subtask', label: 'Subtask', icon: '📝', color: 'gray' },
  { value: 'bug', label: 'Bug', icon: '🐛', color: 'red' }
];

export function NewTaskForm({ open, onOpenChange }: NewTaskFormProps) {
  const { addTask, developers, getEpics, getTasksByEpic } = useGantt();
  const { getActiveStatuses, getActivePriorities } = useStatus();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    taskType: 'task',
    assignedDeveloperId: '',
    status: '',
    priority: '',
    startDate: new Date(),
    endDate: addDays(new Date(), 3),
    storyPoints: null,
    originalEstimate: null,
    labels: [],
    epicId: ''
  });

  const activeStatuses = getActiveStatuses();
  const activePriorities = getActivePriorities();
  const availableEpics = getEpics();

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open) {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleCancel();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Set default status and priority when they become available
  React.useEffect(() => {
    console.log('NewTaskForm: useEffect triggered - open:', open, 'activeStatuses:', activeStatuses.length, 'activePriorities:', activePriorities.length);
    
    if (activeStatuses.length > 0 && !formData.status) {
      const defaultStatus = activeStatuses.find(s => s.isDefault) || activeStatuses[0];
      console.log('NewTaskForm: Setting default status:', defaultStatus?.name);
      setFormData(prev => ({ ...prev, status: defaultStatus.name }));
    }
    if (activePriorities.length > 0 && !formData.priority) {
      const defaultPriority = activePriorities.find(p => p.isDefault) || activePriorities[1]; // Medium priority
      console.log('NewTaskForm: Setting default priority:', defaultPriority?.name);
      setFormData(prev => ({ ...prev, priority: defaultPriority.name }));
    }
  }, [activeStatuses, activePriorities, formData.status, formData.priority]);

  const handleInputChange = (field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.assignedDeveloperId) {
      newErrors.assignedDeveloperId = 'Please assign a developer';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (formData.storyPoints !== null && (formData.storyPoints < 0 || formData.storyPoints > 100)) {
      newErrors.storyPoints = 'Story points must be between 0 and 100';
    }

    if (formData.originalEstimate !== null && (formData.originalEstimate < 0 || formData.originalEstimate > 1000)) {
      newErrors.originalEstimate = 'Estimate must be between 0 and 1000 hours';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('NewTaskForm: Form submission started');
    console.log('NewTaskForm: Form data:', formData);
    console.log('NewTaskForm: Available developers:', developers.length);
    console.log('NewTaskForm: Active statuses:', activeStatuses.length);
    console.log('NewTaskForm: Active priorities:', activePriorities.length);
    
    if (!validateForm()) {
      console.log('NewTaskForm: Validation failed');
      return;
    }

    console.log('NewTaskForm: Validation passed, submitting...');
    setIsSubmitting(true);
    
    try {
      const newTask = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        taskType: formData.taskType,
        assignedDeveloperId: formData.assignedDeveloperId,
        status: formData.status,
        priority: formData.priority,
        startDate: formData.startDate!,
        endDate: formData.endDate!,
        storyPoints: formData.storyPoints || undefined,
        originalEstimate: formData.originalEstimate || undefined,
        remainingEstimate: formData.originalEstimate || undefined,
        timeSpent: 0,
        labels: formData.labels,
        dependencies: [],
        epicId: formData.epicId || undefined
      };

      console.log('NewTaskForm: About to call addTask with:', newTask);
      await addTask(newTask);
      console.log('NewTaskForm: addTask completed successfully');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        taskType: 'task',
        assignedDeveloperId: '',
        status: activeStatuses.find(s => s.isDefault)?.name || activeStatuses[0]?.name || '',
        priority: activePriorities.find(p => p.isDefault)?.name || activePriorities[1]?.name || '',
        startDate: new Date(),
        endDate: addDays(new Date(), 3),
        storyPoints: null,
        originalEstimate: null,
        labels: [],
        epicId: ''
      });
      
      onOpenChange(false);
      console.log('NewTaskForm: Form closed successfully');
    } catch (error) {
      console.error('NewTaskForm: Error creating task:', error);
      setErrors({ submit: 'Failed to create task. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      description: '',
      taskType: 'task',
      assignedDeveloperId: '',
      status: activeStatuses.find(s => s.isDefault)?.name || activeStatuses[0]?.name || '',
      priority: activePriorities.find(p => p.isDefault)?.name || activePriorities[1]?.name || '',
      startDate: new Date(),
      endDate: addDays(new Date(), 3),
      storyPoints: null,
      originalEstimate: null,
      labels: [],
      epicId: ''
    });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Create New Task
          </DialogTitle>
        </DialogHeader>

        {/* Debug info */}
        {open && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-xs">
            <strong>Debug Info:</strong> Form opened | Developers: {developers.length} | 
            Statuses: {activeStatuses.length} | Priorities: {activePriorities.length} | 
            Epics: {availableEpics.length}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="taskType" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Task Type
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {TASK_TYPES.map((type) => (
                <Card
                  key={type.value}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    formData.taskType === type.value 
                      ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200" 
                      : "hover:bg-gray-50"
                  )}
                  onClick={() => handleInputChange('taskType', type.value)}
                >
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className="text-xs font-medium">{type.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Epic Selection - only show for non-epic tasks */}
          {formData.taskType !== 'epic' && (
            <div className="space-y-2">
              <Label htmlFor="epicId" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Parent Epic
                <Badge variant="secondary" className="text-xs">Optional</Badge>
              </Label>
              {availableEpics.length > 0 ? (
                <>
                  <Select value={formData.epicId} onValueChange={(value) => handleInputChange('epicId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a parent epic (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Epic</SelectItem>
                      {availableEpics.map((epic) => {
                        const epicTasks = getTasksByEpic(epic.id);
                        return (
                          <SelectItem key={epic.id} value={epic.id}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <span>🎯</span>
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
                  {formData.epicId && (
                    <div className="text-xs text-muted-foreground">
                      This task will be linked to the selected epic
                    </div>
                  )}
                </>
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

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter task title..."
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what needs to be done..."
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>

          {/* Developer Assignment */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Assigned Developer *
            </Label>
            <Select
              value={formData.assignedDeveloperId}
              onValueChange={(value) => handleInputChange('assignedDeveloperId', value)}
            >
              <SelectTrigger className={errors.assignedDeveloperId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a developer..." />
              </SelectTrigger>
              <SelectContent>
                {developers.map((dev) => (
                  <SelectItem key={dev.id} value={dev.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium">
                        {dev.name.charAt(0)}
                      </div>
                      <span>{dev.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {dev.role}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assignedDeveloperId && (
              <p className="text-sm text-red-500">{errors.assignedDeveloperId}</p>
            )}
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status..." />
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

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Priority
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority..." />
                </SelectTrigger>
                <SelectContent>
                  {activePriorities.map((priority) => (
                    <SelectItem key={priority.id} value={priority.name}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full border-2" 
                          style={{ borderColor: priority.borderColor }}
                        />
                        {priority.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground",
                      errors.startDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate || undefined}
                    onSelect={(date) => handleInputChange('startDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground",
                      errors.endDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate || undefined}
                    onSelect={(date) => handleInputChange('endDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
            </div>
          </div>

          {/* Story Points and Estimate */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storyPoints">Story Points</Label>
              <Input
                id="storyPoints"
                type="number"
                min="0"
                max="100"
                value={formData.storyPoints || ''}
                onChange={(e) => handleInputChange('storyPoints', e.target.value ? Number(e.target.value) : null)}
                placeholder="0"
                className={errors.storyPoints ? 'border-red-500' : ''}
              />
              {errors.storyPoints && <p className="text-sm text-red-500">{errors.storyPoints}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="originalEstimate">Time Estimate (hours)</Label>
              <Input
                id="originalEstimate"
                type="number"
                min="0"
                max="1000"
                step="0.5"
                value={formData.originalEstimate || ''}
                onChange={(e) => handleInputChange('originalEstimate', e.target.value ? Number(e.target.value) : null)}
                placeholder="0"
                className={errors.originalEstimate ? 'border-red-500' : ''}
              />
              {errors.originalEstimate && <p className="text-sm text-red-500">{errors.originalEstimate}</p>}
            </div>
          </div>

          {/* Error message */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[100px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  'Create Task'
                )}
              </Button>
            </div>
            
            {/* Keyboard shortcuts hint */}
            <div className="text-xs text-muted-foreground text-center border-t pt-3">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd> to cancel
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
