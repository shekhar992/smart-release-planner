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
import { Badge } from './ui/badge';
import { format } from 'date-fns';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
}

export function TaskForm({ open, onClose, task }: TaskFormProps) {
  const { developers, addTask, updateTask } = useGantt();
  const { getActiveStatuses, getActivePriorities } = useStatus();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    assignedDeveloperId: '',
    status: '',
    priority: '',
  });

  // Get active statuses and priorities
  const activeStatuses = getActiveStatuses();
  const activePriorities = getActivePriorities();

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        startDate: format(task.startDate, 'yyyy-MM-dd'),
        endDate: format(task.endDate, 'yyyy-MM-dd'),
        assignedDeveloperId: task.assignedDeveloperId,
        status: task.status,
        priority: task.priority,
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
        assignedDeveloperId: '',
        status: defaultStatus?.name || '',
        priority: defaultPriority?.name || '',
      });
    }
  }, [task, open, activeStatuses, activePriorities]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.assignedDeveloperId || !formData.startDate || !formData.endDate) {
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
    };

    if (task) {
      updateTask(task.id, taskData);
    } else {
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          <DialogDescription>
            {task 
              ? 'Update the task details and assignment information.' 
              : 'Create a new task and assign it to a developer.'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Status and Priority Info */}
          {(formData.status || formData.priority) && (
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Selected Configuration:</p>
              <div className="flex gap-4">
                {formData.status && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Status</Badge>
                    {getStatusDisplay(formData.status)}
                  </div>
                )}
                {formData.priority && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Priority</Badge>
                    {getPriorityDisplay(formData.priority)}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {task ? 'Update Task' : 'Add Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}