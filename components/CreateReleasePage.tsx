import { useState, useEffect } from 'react';
import { useReleases } from '../contexts/ReleaseContext';
import { useProjects } from '../contexts/ProjectContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Loader2, 
  Rocket, 
  Smartphone, 
  Globe, 
  Database, 
  Shield,
  ArrowLeft,
  CheckCircle,
  Clock,
  Target,
  Users,
  Sparkles
} from 'lucide-react';
import { cn } from './ui/utils';

interface CreateReleasePageProps {
  onNavigateBack: () => void;
  projectId?: string; // Optional project ID for creating releases within a project
  projectName?: string; // Project name for context
}

// Enhanced Release Templates with more detailed configurations
const RELEASE_TEMPLATES = [
  {
    id: 'web-app',
    name: 'Web Application',
    icon: Globe,
    description: 'Standard web application release with frontend and backend components',
    category: 'Application',
    estimatedEffort: 'High',
    teamSize: '4-6 developers',
    suitableFor: ['project', 'standalone'],
    defaultData: {
      duration: 3, // months
      priority: 'high' as const,
      status: 'planning' as const,
      color: '#3b82f6',
      suggestedTasks: [
        'Frontend Development',
        'Backend API Development',
        'Database Schema Updates',
        'Testing & QA',
        'Deployment Setup'
      ]
    }
  },
  {
    id: 'mobile-app',
    name: 'Mobile App',
    icon: Smartphone,
    description: 'Cross-platform mobile application for iOS and Android',
    category: 'Mobile',
    estimatedEffort: 'High',
    teamSize: '3-5 developers',
    suitableFor: ['project', 'standalone'],
    defaultData: {
      duration: 4, // months
      priority: 'high' as const,
      status: 'planning' as const,
      color: '#10b981',
      suggestedTasks: [
        'UI/UX Design',
        'iOS Development',
        'Android Development',
        'Cross-platform Testing',
        'App Store Submission'
      ]
    }
  },
  {
    id: 'poc-demo',
    name: 'POC/Demo',
    icon: Rocket,
    description: 'Proof of concept or demo application for validation and testing',
    category: 'POC',
    estimatedEffort: 'Low',
    teamSize: '1-2 developers',
    suitableFor: ['standalone'],
    defaultData: {
      duration: 3, // weeks
      priority: 'medium' as const,
      status: 'planning' as const,
      color: '#f59e0b',
      suggestedTasks: [
        'Requirements Analysis',
        'Quick Prototype',
        'Core Feature Implementation',
        'Demo Preparation',
        'Stakeholder Presentation'
      ]
    }
  },
  {
    id: 'api-service',
    name: 'API Service',
    icon: Database,
    description: 'Backend API service or microservice with documentation',
    category: 'Backend',
    estimatedEffort: 'Medium',
    teamSize: '2-3 developers',
    suitableFor: ['project', 'standalone'],
    defaultData: {
      duration: 6, // weeks
      priority: 'medium' as const,
      status: 'planning' as const,
      color: '#8b5cf6',
      suggestedTasks: [
        'API Design & Documentation',
        'Backend Implementation',
        'Database Integration',
        'Security Implementation',
        'Performance Testing'
      ]
    }
  },
  {
    id: 'security-update',
    name: 'Security Update',
    icon: Shield,
    description: 'Critical security patches and vulnerability fixes',
    category: 'Security',
    estimatedEffort: 'Low',
    teamSize: '1-2 developers',
    suitableFor: ['project'],
    defaultData: {
      duration: 2, // weeks
      priority: 'critical' as const,
      status: 'in-progress' as const,
      color: '#ef4444',
      suggestedTasks: [
        'Vulnerability Assessment',
        'Security Patch Development',
        'Security Testing',
        'Emergency Deployment',
        'Post-deployment Monitoring'
      ]
    }
  },
  {
    id: 'feature-release',
    name: 'Feature Release',
    icon: Rocket,
    description: 'Major feature addition with new functionality',
    category: 'Feature',
    estimatedEffort: 'Medium',
    teamSize: '3-4 developers',
    suitableFor: ['project'],
    defaultData: {
      duration: 2, // months
      priority: 'medium' as const,
      status: 'planning' as const,
      color: '#f59e0b',
      suggestedTasks: [
        'Feature Specification',
        'Implementation',
        'Integration Testing',
        'User Acceptance Testing',
        'Documentation Update'
      ]
    }
  },
  {
    id: 'hotfix',
    name: 'Hotfix',
    icon: Target,
    description: 'Quick fix for critical production issues',
    category: 'Maintenance',
    estimatedEffort: 'Low',
    teamSize: '1-2 developers',
    suitableFor: ['project'],
    defaultData: {
      duration: 1, // week
      priority: 'critical' as const,
      status: 'in-progress' as const,
      color: '#dc2626',
      suggestedTasks: [
        'Issue Investigation',
        'Quick Fix Implementation',
        'Regression Testing',
        'Emergency Deployment',
        'Incident Documentation'
      ]
    }
  },
  {
    id: 'research-spike',
    name: 'Research Spike',
    icon: Target,
    description: 'Technical research and exploration for future development',
    category: 'Research',
    estimatedEffort: 'Low',
    teamSize: '1-2 developers',
    suitableFor: ['standalone'],
    defaultData: {
      duration: 2, // weeks
      priority: 'low' as const,
      status: 'planning' as const,
      color: '#6366f1',
      suggestedTasks: [
        'Technology Research',
        'Feasibility Analysis',
        'Prototype Development',
        'Documentation',
        'Recommendation Report'
      ]
    }
  }
];

export function CreateReleasePage({ onNavigateBack, projectId, projectName }: CreateReleasePageProps) {
  console.log('CreateReleasePage rendered with props:', { onNavigateBack: !!onNavigateBack, projectId, projectName });
  
  const { createRelease } = useReleases();
  const { addReleaseToProject, projects } = useProjects();
  
  // Debug logging for projects
  console.log('CreateReleasePage projects from context:', {
    projectsCount: projects?.length || 0,
    projectsData: projects,
    addReleaseToProject: !!addReleaseToProject
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'template' | 'details' | 'review'>('template');
  const [selectedProject, setSelectedProject] = useState<string>(projectId || '');

  console.log('CreateReleasePage state:', { 
    projectsCount: projects?.length || 0, 
    selectedTemplate, 
    currentStep, 
    selectedProject,
    createRelease: !!createRelease,
    addReleaseToProject: !!addReleaseToProject
  });
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    startDate: new Date(),
    targetDate: new Date(),
    status: 'planning' as 'planning' | 'in-progress' | 'delayed' | 'completed' | 'cancelled',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    color: '#3b82f6'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Set default target date to next month
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    setFormData(prev => ({
      ...prev,
      startDate: today,
      targetDate: nextMonth
    }));
  }, []);

  // Apply template to form data
  const applyTemplate = (templateId: string) => {
    const template = RELEASE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const today = new Date();
    const targetDate = new Date(today);
    
    // Calculate target date based on template duration
    if (templateId === 'api-service' || templateId === 'security-update' || templateId === 'hotfix' || templateId === 'poc-demo' || templateId === 'research-spike') {
      // Duration in weeks
      const weeks = template.defaultData.duration;
      targetDate.setDate(targetDate.getDate() + (weeks * 7));
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
  };

  const validateForm = () => {
    console.log('Validating form with data:', formData);
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

    // Only validate project selection if we're not already in a project context
    // and the user has explicitly chosen a project (not standalone)
    if (!projectId && selectedProject === '') {
      // This is fine - it means standalone release
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    
    const isValid = Object.keys(newErrors).length === 0;
    if (!isValid) {
      console.log('Form validation failed with errors:', newErrors);
    }
    
    return isValid;
  };

  const handleSubmit = async () => {
    console.log('CreateReleasePage: handleSubmit called');
    console.log('Form data:', formData);
    console.log('Selected project:', selectedProject);
    console.log('Project ID prop:', projectId);
    
    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      toast.error('Please fix the validation errors before submitting.');
      return;
    }

    console.log('Form validation passed, creating release...');
    setIsLoading(true);
    
    try {
      const releaseData = {
        ...formData,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        team: [],
        tasks: [],
        releaseType: (selectedProject ? 'project' : 'poc') as 'project' | 'poc',
        projectId: selectedProject || undefined
      };
      
      console.log('Release data to create:', releaseData);
      
      if (selectedProject) {
        // Create release within selected project
        console.log('Creating release for project:', selectedProject);
        await addReleaseToProject(selectedProject, releaseData);
        toast.success(`Release "${releaseData.name}" created successfully for project!`);
      } else {
        // Create standalone release (POC)
        console.log('Creating standalone release');
        await createRelease(releaseData);
        toast.success(`Standalone release "${releaseData.name}" created successfully!`);
      }
      
      console.log('Release created successfully, navigating back...');
      
      // Small delay to show the success message before navigating
      setTimeout(() => {
        onNavigateBack();
      }, 1000);
      
    } catch (error) {
      console.error('Error saving release:', error);
      toast.error(`Failed to create release: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const selectedTemplateData = selectedTemplate ? RELEASE_TEMPLATES.find(t => t.id === selectedTemplate) : null;
  
  // Filter templates based on mode (project vs standalone) - use selectedProject state
  const currentMode = selectedProject ? 'project' : 'standalone';
  const availableTemplates = RELEASE_TEMPLATES.filter(template => 
    template.suitableFor.includes(currentMode)
  );

  const renderTemplateSelection = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Choose a Release Template</h2>
        <p className="text-lg text-muted-foreground">
          {selectedProject 
            ? `Select a template for your project release`
            : 'Start with a pre-configured template for your standalone release or POC'
          }
        </p>
        <div className="mt-4">
          <Badge variant="outline" className="text-sm">
            {selectedProject ? '🏗️ Project Release' : '🚀 Standalone Release'}
          </Badge>
        </div>
      </div>

      {/* Project Selection at Template Step */}
      <div className="max-w-md mx-auto mb-8">
        <div className="space-y-2">
          <Label htmlFor="project-template-step" className="text-base font-semibold">🏗️ Project Association</Label>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="border-2 border-primary/30 focus:border-primary">
              <SelectValue placeholder="Select a project or create standalone release" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">🚀 Standalone Release (POC)</SelectItem>
              {(projects || []).map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  🏗️ {project.name}
                </SelectItem>
              ))}
              {(!projects || projects.length === 0) && (
                <SelectItem value="" disabled>
                  No projects available - Create a project first
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground text-center font-medium">
            {selectedProject ? '✅ Templates filtered for project releases' : '🚀 Templates filtered for POC/standalone releases'}
          </p>
          <div className="text-xs text-center">
            <span className="text-primary font-semibold">Available Projects: {projects?.length || 0}</span>
            {projects?.length > 0 && (
              <span className="block mt-1 text-muted-foreground">
                Projects: {projects.map(p => p.name).join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableTemplates.map((template) => {
          const IconComponent = template.icon;
          const isSelected = selectedTemplate === template.id;
          
          return (
            <Card 
              key={template.id} 
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-lg border-2",
                isSelected 
                  ? "border-primary shadow-lg bg-primary/5" 
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => {
                applyTemplate(template.id);
                setCurrentStep('details');
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{template.estimatedEffort} Effort</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{template.teamSize}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: template.defaultData.color }}
                  />
                  <Badge variant="outline" className="text-xs">
                    {template.defaultData.priority} priority
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <Button 
          variant="outline" 
          onClick={() => {
            setSelectedTemplate(null);
            setCurrentStep('details');
          }}
          className="min-w-[120px]"
        >
          Skip Templates
        </Button>
        {projectId && (
          <Button 
            variant="ghost"
            onClick={onNavigateBack}
            className="min-w-[120px]"
          >
            Back to Project
          </Button>
        )}
      </div>
    </div>
  );

  const renderDetailsForm = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Release Details</h2>
        <p className="text-lg text-muted-foreground">
          {selectedTemplateData 
            ? `Configure your ${selectedTemplateData.name} release`
            : 'Set up your custom release configuration'
          }
        </p>
        {selectedTemplateData && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
              <selectedTemplateData.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{selectedTemplateData.name}</span>
            </div>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Project Selection - Always show, but pre-select if in project context */}
          <div className="space-y-2">
            <Label htmlFor="project" className="text-base font-semibold">🏗️ Project Association</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className={`border-2 ${errors.project ? 'border-red-500' : 'border-primary/30 focus:border-primary'}`}>
                <SelectValue placeholder="Select a project or create standalone release" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">🚀 Standalone Release (POC)</SelectItem>
                {(projects || []).map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    🏗️ {project.name}
                  </SelectItem>
                ))}
                {(!projects || projects.length === 0) && (
                  <SelectItem value="" disabled>
                    No projects available - Create a project first
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.project && (
              <p className="text-sm text-red-600">{errors.project}</p>
            )}
            <p className="text-sm text-muted-foreground font-medium">
              {selectedProject ? '✅ This release will be added to the selected project' : '🚀 This will create a standalone POC release'}
            </p>
            <div className="text-xs">
              <span className="text-primary font-semibold">Available Projects: {projects?.length || 0}</span>
              {projects?.length > 0 && (
                <span className="block mt-1 text-muted-foreground">
                  Projects: {projects.map(p => p.name).join(', ')}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Describe the key features and goals of this release..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </CardContent>
      </Card>

      <div className="flex justify-between gap-4 mt-8">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep('template')}
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Templates
        </Button>
        <Button 
          onClick={() => setCurrentStep('review')}
          disabled={!formData.name || !formData.version}
        >
          Review & Create
          <Sparkles className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Review Release</h2>
        <p className="text-lg text-muted-foreground">
          Review your release configuration before creating
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: formData.color }}
            />
            <div>
              <CardTitle className="text-xl">{formData.name}</CardTitle>
              <CardDescription>Version {formData.version}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedTemplateData && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
              <selectedTemplateData.icon className="w-5 h-5 text-primary" />
              <span className="font-medium">Based on {selectedTemplateData.name} template</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Project</Label>
              <p className="font-medium">
                {projectName || 
                 (selectedProject ? projects.find(p => p.id === selectedProject)?.name : 'Standalone Release')}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Priority</Label>
              <Badge variant={formData.priority === 'critical' ? 'destructive' : 'default'}>
                {formData.priority}
              </Badge>
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Description</Label>
            <p className="mt-1">{formData.description || 'No description provided'}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Start Date</Label>
              <p className="font-medium">{format(formData.startDate, "PPP")}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Target Date</Label>
              <p className="font-medium">{format(formData.targetDate, "PPP")}</p>
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Status</Label>
            <Badge variant="outline">{formData.status}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between gap-4 mt-8">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep('details')}
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Edit Details
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isLoading}
          className="min-w-[140px]"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Release
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={onNavigateBack}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {projectId ? 'Back to Project' : 'Back to Dashboard'}
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {projectId ? 'Create Project Release' : 'Create Standalone Release'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {projectName 
                    ? `Adding a new release to ${projectName}`
                    : 'Set up a new standalone release or POC project'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {projectId && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Project Release
                </Badge>
              )}
              {!projectId && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Standalone Release
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-center gap-4 mb-8">
          {[
            { key: 'template', label: 'Template', icon: Sparkles },
            { key: 'details', label: 'Details', icon: Target },
            { key: 'review', label: 'Review', icon: CheckCircle }
          ].map((step, index) => {
            const isActive = currentStep === step.key;
            const isCompleted = ['template', 'details', 'review'].indexOf(currentStep) > index;
            const StepIcon = step.icon;
            
            return (
              <div key={step.key} className="flex items-center gap-2">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                  isActive 
                    ? "border-primary bg-primary text-primary-foreground" 
                    : isCompleted
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted-foreground/30 text-muted-foreground"
                )}>
                  <StepIcon className="w-4 h-4" />
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
                {index < 2 && (
                  <div className={cn(
                    "w-8 h-px ml-2",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Content */}
        {currentStep === 'template' && renderTemplateSelection()}
        {currentStep === 'details' && renderDetailsForm()}
        {currentStep === 'review' && renderReview()}
        
        {/* Debug buttons for testing */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 flex gap-2 bg-white p-2 rounded shadow-lg border">
            <Button size="sm" onClick={() => setCurrentStep('template')}>Template</Button>
            <Button size="sm" onClick={() => setCurrentStep('details')}>Details</Button>
            <Button size="sm" onClick={() => setCurrentStep('review')}>Review</Button>
          </div>
        )}
      </div>
    </div>
  );
}
