import { useState, useEffect } from 'react';
import { useReleases } from '../contexts/ReleaseContext';
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
import { Calendar as CalendarIcon, Loader2, Rocket, Smartphone, Globe, Database, Shield } from 'lucide-react';
import { cn } from './ui/utils';

interface CreateReleaseDialogProps {
  open: boolean;
  onClose: () => void;
  editingRelease?: any;
  projectId?: string; // Optional project ID for creating releases within a project
}

// Release Templates for quick setup
const RELEASE_TEMPLATES = [
  {
    id: 'web-app',
    name: 'Web Application',
    icon: Globe,
    description: 'Standard web application release with frontend and backend components',
    defaultData: {
      duration: 3, // months
      priority: 'high' as const,
      status: 'planning' as const,
      color: '#3b82f6'
    }
  },
  {
    id: 'mobile-app',
    name: 'Mobile App',
    icon: Smartphone,
    description: 'Mobile application release for iOS and Android platforms',
    defaultData: {
      duration: 4, // months
      priority: 'high' as const,
      status: 'planning' as const,
      color: '#10b981'
    }
  },
  {
    id: 'api-service',
    name: 'API Service',
    icon: Database,
    description: 'Backend API service or microservice release',
    defaultData: {
      duration: 6, // weeks
      priority: 'medium' as const,
      status: 'planning' as const,
      color: '#8b5cf6'
    }
  },
  {
    id: 'security-update',
    name: 'Security Update',
    icon: Shield,
    description: 'Critical security patches and vulnerability fixes',
    defaultData: {
      duration: 2, // weeks
      priority: 'critical' as const,
      status: 'in-progress' as const,
      color: '#ef4444'
    }
  },
  {
    id: 'feature-release',
    name: 'Feature Release',
    icon: Rocket,
    description: 'Major feature addition with new functionality',
    defaultData: {
      duration: 2, // months
      priority: 'medium' as const,
      status: 'planning' as const,
      color: '#f59e0b'
    }
  }
];

export function CreateReleaseDialog({ open, onClose, editingRelease, projectId }: CreateReleaseDialogProps) {
  const { createRelease, updateRelease, duplicateRelease } = useReleases();
  const { addReleaseToProject } = useProjects();
  const [isLoading, setIsLoading] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '',
    startDate: new Date(),
    targetDate: new Date(),
    status: 'planning' as 'planning' | 'in-progress' | 'delayed' | 'completed' | 'cancelled',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    color: '#3b82f6'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingRelease) {
      setFormData({
        name: editingRelease.name,
        description: editingRelease.description,
        version: editingRelease.version,
        startDate: editingRelease.startDate,
        targetDate: editingRelease.targetDate,
        status: editingRelease.status,
        priority: editingRelease.priority,
        color: editingRelease.color
      });
      setShowTemplates(false); // Hide templates when editing
    } else {
      // Reset form for new release
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      setFormData({
        name: '',
        description: '',
        version: '1.0.0',
        startDate: today,
        targetDate: nextMonth,
        status: 'planning',
        priority: 'medium',
        color: '#3b82f6'
      });
      setShowTemplates(!projectId); // Show templates only for standalone releases initially
    }
    setErrors({});
    setSelectedTemplate(null);
  }, [editingRelease, open, projectId]);

  // Apply template to form data
  const applyTemplate = (templateId: string) => {
    const template = RELEASE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const today = new Date();
    const targetDate = new Date(today);
    
    // Calculate target date based on template duration
    if (templateId === 'api-service' || templateId === 'security-update') {
      // Duration in weeks
      targetDate.setDate(targetDate.getDate() + (template.defaultData.duration * 7));
    } else {
      // Duration in months
      targetDate.setMonth(targetDate.getMonth() + template.defaultData.duration);
    }

    setFormData(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      priority: template.defaultData.priority,
      status: template.defaultData.status,
      color: template.defaultData.color,
      targetDate
    }));
    
    setSelectedTemplate(templateId);
    setShowTemplates(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Release name is required';
    }

    if (!formData.version.trim()) {
      newErrors.version = 'Version is required';
    }

    if (formData.targetDate <= formData.startDate) {
      newErrors.targetDate = 'Target date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (editingRelease) {
        await updateRelease(editingRelease.id, formData);
      } else {
        const releaseData = {
          ...formData,
          progress: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          team: [],
          tasks: [],
          releaseType: (projectId ? 'project' : 'poc') as 'project' | 'poc',
          projectId: projectId || undefined
        };
        
        if (projectId) {
          // Create release within a project
          await addReleaseToProject(projectId, releaseData);
        } else {
          // Create standalone release
          await createRelease(releaseData);
        }
      }
      onClose();
    } catch (error) {
      console.error('Error saving release:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!editingRelease) return;

    setIsDuplicating(true);
    try {
      const newName = `${editingRelease.name} (Copy)`;
      await duplicateRelease(editingRelease.id, newName);
      onClose();
    } catch (error) {
      console.error('Error duplicating release:', error);
    } finally {
      setIsDuplicating(false);
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {editingRelease 
              ? 'Edit Release' 
              : projectId 
                ? 'Create New Release for Project'
                : 'Create New Release'
            }
          </DialogTitle>
          <DialogDescription>
            {editingRelease 
              ? 'Update the release details below.'
              : projectId
                ? 'Set up a new release for this project with timeline and team management.'
                : 'Set up a new product release with timeline and team management.'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Release Templates Section */}
        {!editingRelease && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Quick Start Templates</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
              >
                {showTemplates ? 'Hide Templates' : 'Show Templates'}
              </Button>
            </div>
            
            {showTemplates && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
                {RELEASE_TEMPLATES.map((template) => {
                  const IconComponent = template.icon;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template.id)}
                      className={cn(
                        "p-3 text-left rounded-md border-2 transition-all hover:shadow-sm",
                        selectedTemplate === template.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <IconComponent className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{template.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Release Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Release Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="e.g., Mobile App v2.0"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Version */}
            <div className="space-y-2">
              <Label htmlFor="version">Version *</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => updateFormData('version', e.target.value)}
                placeholder="e.g., 2.1.0"
                className={errors.version ? 'border-red-500' : ''}
              />
              {errors.version && (
                <p className="text-sm text-red-600">{errors.version}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Describe the key features and goals of this release..."
              rows={3}
            />
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
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
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

          <DialogFooter className="gap-2">
            {editingRelease && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDuplicate}
                disabled={isDuplicating}
              >
                {isDuplicating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Duplicate
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingRelease ? 'Update Release' : 'Create Release'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}