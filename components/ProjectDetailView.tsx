import { useState } from 'react';
import { useProjects } from '../contexts/ProjectContext';
import { Project } from '../types/project';
import { Release } from '../contexts/ReleaseContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { 
  ArrowLeft,
  Plus,
  Calendar,
  Users,
  Target,
  BarChart3,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  FolderOpen,
  Edit,
  Settings,
  Eye,
  Rocket,
  Flag,
  ChevronDown
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface ProjectDetailViewProps {
  project: Project;
  onNavigateBack: () => void;
  onNavigateToRelease: (release: Release) => void;
  onCreateRelease: () => void;
  onEditProject: (project: Project) => void;
}

export function ProjectDetailView({ 
  project, 
  onNavigateBack, 
  onNavigateToRelease, 
  onCreateRelease,
  onEditProject 
}: ProjectDetailViewProps) {
  const { getProjectReleases, getProjectMetrics } = useProjects();
  const [activeTab, setActiveTab] = useState('releases');
  
  const releases = getProjectReleases(project.id);
  const metrics = getProjectMetrics(project.id);
  const daysRemaining = differenceInDays(project.targetDate, new Date());
  const isOverdue = daysRemaining < 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in-progress': return 'bg-green-50 text-green-700 border-green-200';
      case 'delayed': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'completed': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'active': return 'bg-green-50 text-green-700 border-green-200';
      case 'on-hold': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'completed': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const ReleaseCard = ({ release }: { release: Release }) => {
    const releaseMetrics = {
      totalTasks: release.tasks?.length || 0,
      completedTasks: release.tasks?.filter(task => 
        task.status?.toLowerCase().includes('completed') || task.status?.toLowerCase().includes('done')
      ).length || 0,
      teamSize: release.team?.length || 0
    };

    const releaseDaysRemaining = differenceInDays(release.targetDate, new Date());
    const isReleaseOverdue = releaseDaysRemaining < 0 && release.status !== 'completed';

    return (
      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-1 h-8 rounded-full"
                style={{ backgroundColor: release.color }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {release.name}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    v{release.version}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {release.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getPriorityColor(release.priority)}>
                {release.priority}
              </Badge>
              <Badge variant="outline" className={getStatusColor(release.status)}>
                {release.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span className="font-medium">{release.progress}%</span>
            </div>
            <Progress value={release.progress} className="h-2" />
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
              <span>{releaseMetrics.completedTasks}/{releaseMetrics.totalTasks} tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{releaseMetrics.teamSize} members</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{format(release.targetDate, 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${isReleaseOverdue ? 'text-red-500' : 'text-muted-foreground'}`} />
              <span className={isReleaseOverdue ? 'text-red-600 font-medium' : ''}>
                {release.status === 'completed' ? 'Completed' :
                 isReleaseOverdue ? `${Math.abs(releaseDaysRemaining)} days overdue` : 
                 `${releaseDaysRemaining} days left`}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToRelease(release);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Release
            </Button>
            <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onNavigateBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
        <div 
          className="w-1 h-8 rounded-full"
          style={{ backgroundColor: project.color }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge className={getPriorityColor(project.priority)}>
              {project.priority}
            </Badge>
            <Badge variant="outline" className={getProjectStatusColor(project.status)}>
              {project.status}
            </Badge>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${getRiskColor(project.riskLevel)}`} />
              <span className={`text-sm ${getRiskColor(project.riskLevel)}`}>
                {project.riskLevel} risk
              </span>
            </div>
          </div>
          <p className="text-muted-foreground mt-1">{project.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => onEditProject(project)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button 
            onClick={() => {
              console.log('ProjectDetail: New Release button clicked for project:', project.name);
              onCreateRelease();
            }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Release
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Quick Actions
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => {
                console.log('ProjectDetail: Create Release dropdown clicked for project:', project.name);
                onCreateRelease();
              }}>
                <Rocket className="w-4 h-4 mr-2" />
                Create Release
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Create milestone')}>
                <Flag className="w-4 h-4 mr-2" />
                Add Milestone
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => console.log('Invite team member')}>
                <Users className="w-4 h-4 mr-2" />
                Invite Team Member
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('View analytics')}>
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Project Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{project.completionPercentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                <FolderOpen className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Releases</p>
                <p className="text-2xl font-bold">{metrics.totalReleases}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tasks</p>
                <p className="text-2xl font-bold">{metrics.completedTasks}/{metrics.totalTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team</p>
                <p className="text-2xl font-bold">{metrics.teamSize}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                <Clock className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-yellow-600'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Timeline</p>
                <p className={`text-2xl font-bold ${isOverdue ? 'text-red-600' : ''}`}>
                  {isOverdue ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d left`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {project.budget && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Budget</p>
                  <p className="text-2xl font-bold">{metrics.budgetUtilization.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Project Timeline</h3>
            <div className="text-sm text-muted-foreground">
              {format(project.startDate, 'MMM dd, yyyy')} - {format(project.targetDate, 'MMM dd, yyyy')}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{project.completionPercentage}%</span>
            </div>
            <Progress value={project.completionPercentage} className="h-3" />
            {project.budget && (
              <>
                <div className="flex justify-between text-sm">
                  <span>Budget Utilization</span>
                  <span>{metrics.budgetUtilization.toFixed(0)}%</span>
                </div>
                <Progress value={metrics.budgetUtilization} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>${(project.spentBudget || 0).toLocaleString()} spent</span>
                  <span>${project.budget.toLocaleString()} total</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="releases">Releases ({releases.length})</TabsTrigger>
          <TabsTrigger value="team">Team ({metrics.teamSize})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="releases" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Project Releases</h3>
          </div>

          {releases.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full w-fit mx-auto mb-4">
                  <Target className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Ready to plan your first release?</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Releases help you organize and track project deliverables with timeline management, team collaboration, and progress tracking.
                </p>
                <Button 
                  onClick={onCreateRelease}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Release
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {releases.map((release) => (
                <div key={release.id} onClick={() => onNavigateToRelease(release)}>
                  <ReleaseCard release={release} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Team Management</h3>
              <p className="text-muted-foreground">
                Team management features coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-muted-foreground">
                Advanced analytics and reporting features coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardContent className="p-12 text-center">
              <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Project Settings</h3>
              <p className="text-muted-foreground">
                Project configuration and settings coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
