import { useState, useEffect } from 'react';
import { useProjects } from '../contexts/ProjectContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Plus } from 'lucide-react';
import { cn } from './ui/utils';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  editingProject?: any;
}

export function CreateProjectDialog({ open, onClose, editingProject }: CreateProjectDialogProps) {
  const { addProject, updateProject } = useProjects();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'web-app',
    startDate: new Date(),
    targetDate: new Date(),
    status: 'planning' as const,
    priority: 'medium' as const,
    budget: '',
    currency: 'USD',
    projectManager: '',
    color: '#3b82f6',
    tags: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingProject) {
      setFormData({
        name: editingProject.name,
        description: editingProject.description,
        category: editingProject.category,
        startDate: editingProject.startDate,
        targetDate: editingProject.targetDate,
        status: editingProject.status,
        priority: editingProject.priority,
        budget: editingProject.budget?.toString() || '',
        currency: editingProject.currency || 'USD',
        projectManager: editingProject.projectManager || '',
        color: editingProject.color,
        tags: editingProject.tags?.join(', ') || ''
      });
    } else {
      // Reset form for new project
      const today = new Date();
      const nextYear = new Date(today);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      
      setFormData({
        name: '',
        description: '',
        category: 'web-app',
        startDate: today,
        targetDate: nextYear,
        status: 'planning',
        priority: 'medium',
        budget: '',
        currency: 'USD',
        projectManager: '',
        color: '#3b82f6',
        tags: ''
      });
    }
    setErrors({});
  }, [editingProject, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    }

    if (formData.targetDate <= formData.startDate) {
      newErrors.targetDate = 'Target date must be after start date';
    }

    if (formData.budget && isNaN(Number(formData.budget))) {
      newErrors.budget = 'Budget must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        startDate: formData.startDate,
        targetDate: formData.targetDate,
        status: formData.status,
        priority: formData.priority,
        budget: formData.budget ? Number(formData.budget) : undefined,
        spentBudget: 0,
        currency: formData.currency,
        projectManager: formData.projectManager || 'unassigned',
        stakeholders: [],
        color: formData.color,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        completionPercentage: 0,
        riskLevel: 'low' as const,
        releases: []
      };

      if (editingProject) {
        await updateProject(editingProject.id, projectData);
      } else {
        await addProject(projectData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-500" />
            {editingProject ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
          <DialogDescription>
            {editingProject 
              ? 'Update the project details below.'
              : 'Set up a new project with timeline, budget, and team management.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="e.g., E-Commerce Platform"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => updateFormData('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web-app">Web Application</SelectItem>
                  <SelectItem value="mobile">Mobile App</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="research">Research & Development</SelectItem>
                  <SelectItem value="api">API Development</SelectItem>
                  <SelectItem value="data">Data Analytics</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Describe the project goals, scope, and key deliverables..."
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => updateFormData('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => updateFormData('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => date && updateFormData('startDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Target Date */}
            <div className="space-y-2">
              <Label>Target Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.targetDate && "text-muted-foreground",
                      errors.targetDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.targetDate ? format(formData.targetDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.targetDate}
                    onSelect={(date) => date && updateFormData('targetDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.targetDate && (
                <p className="text-sm text-red-600">{errors.targetDate}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Budget */}
            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => updateFormData('budget', e.target.value)}
                placeholder="50000"
                className={errors.budget ? 'border-red-500' : ''}
              />
              {errors.budget && (
                <p className="text-sm text-red-600">{errors.budget}</p>
              )}
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => updateFormData('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Project Manager */}
            <div className="space-y-2">
              <Label htmlFor="projectManager">Project Manager</Label>
              <Input
                id="projectManager"
                value={formData.projectManager}
                onChange={(e) => updateFormData('projectManager', e.target.value)}
                placeholder="Manager name or ID"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => updateFormData('tags', e.target.value)}
              placeholder="react, typescript, api, mobile (comma separated)"
            />
            <p className="text-xs text-muted-foreground">
              Add tags to help categorize and search for your project
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingProject ? 'Update Project' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
