import { useState } from 'react';
import { useProjects } from '../contexts/ProjectContext';
import { Release } from '../contexts/ReleaseContext';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { 
  ChevronDown, 
  ChevronRight, 
  FolderOpen, 
  Target, 
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Plus,
  Beaker
} from 'lucide-react';

interface ProjectDashboardProps {
  onNavigateToProject: (project: any) => void;
  onNavigateToRelease: (release: Release) => void;
  onCreateProject: () => void;
  onCreateRelease?: () => void;
  onNavigateToPocDashboard?: () => void;
}

export function ProjectDashboard({ onNavigateToProject, onNavigateToRelease, onCreateProject, onCreateRelease, onNavigateToPocDashboard }: ProjectDashboardProps) {
  console.log('ProjectDashboard rendering...');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  
  try {
    const { filteredProjects, getPortfolioMetrics, getProjectReleases } = useProjects();
    const portfolioMetrics = getPortfolioMetrics();

    console.log('ProjectDashboard render:', {
      filteredProjects: filteredProjects.length,
      portfolioMetrics
    });

    const toggleProject = (projectId: string) => {
      const newExpanded = new Set(expandedProjects);
      if (newExpanded.has(projectId)) {
        newExpanded.delete(projectId);
      } else {
        newExpanded.add(projectId);
      }
      setExpandedProjects(newExpanded);
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'planning': return 'bg-blue-100 text-blue-800';
        case 'on-hold': return 'bg-yellow-100 text-yellow-800';
        case 'completed': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'critical': return 'bg-red-100 text-red-800';
        case 'high': return 'bg-orange-100 text-orange-800';
        case 'medium': return 'bg-yellow-100 text-yellow-800';
        case 'low': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Project Portfolio</h1>
            <p className="text-muted-foreground">
              Manage and track progress across all your projects
            </p>
          </div>
          <div className="flex gap-2">
            {onNavigateToPocDashboard && (
              <Button variant="outline" onClick={onNavigateToPocDashboard}>
                <Beaker className="w-4 h-4 mr-2" />
                POC Dashboard
              </Button>
            )}
            {onCreateRelease && (
              <Button variant="outline" onClick={() => {
                console.log('Dashboard: Create Release button clicked');
                onCreateRelease();
              }}>
                <Target className="w-4 h-4 mr-2" />
                New Release
              </Button>
            )}
            <Button onClick={onCreateProject}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Portfolio Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioMetrics.totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                {portfolioMetrics.activeProjects} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Releases</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioMetrics.totalReleases}</div>
              <p className="text-xs text-muted-foreground">
                across all projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <div className="text-green-600 font-bold">$</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${((filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0)) / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">
                {portfolioMetrics.budgetUtilization.toFixed(0)}% utilized
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredProjects.reduce((sum, p) => sum + (p.stakeholders?.length || 0), 0)}</div>
              <p className="text-xs text-muted-foreground">
                Across all projects
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Projects List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Projects ({filteredProjects.length})</h2>
          
          {filteredProjects.map(project => {
            const isExpanded = expandedProjects.has(project.id);
            
            return (
              <Card key={project.id} className="overflow-hidden">
                {/* Project Header */}
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleProject(project.id)}
                  onDoubleClick={() => onNavigateToProject(project)}
                  title="Click to expand/collapse project details"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToProject(project);
                        }}
                        className="text-xs"
                      >
                        View Project
                      </Button>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                      <Badge className={getPriorityColor(project.priority)}>
                        {project.priority}
                      </Badge>
                      <div className="text-right">
                        <div className="text-sm font-medium">{project.completionPercentage}%</div>
                        <Progress value={project.completionPercentage} className="w-20 h-2" />
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Project Details (when expanded) */}
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Ends: {project.targetDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{project.stakeholders.length} stakeholders</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="text-green-600 font-bold">$</div>
                        <span>${((project.spentBudget || 0) / 1000).toFixed(0)}k / ${((project.budget || 0) / 1000).toFixed(0)}k</span>
                      </div>
                    </div>

                    {/* Releases */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium flex items-center">
                          <Target className="w-4 h-4 mr-2" />
                          Releases ({project.releases.length})
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {getProjectReleases(project.id).slice(0, 3).map((release) => (
                          <div 
                            key={release.id} 
                            className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToRelease(release);
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-sm truncate">{release.name}</h5>
                              <Badge variant="outline" className="text-xs">
                                {release.status}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <div className="flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                <span>Tasks: {release.tasks?.length || 0} total</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                <span>Due: {release.targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                              </div>
                            </div>
                            <Progress value={release.progress} className="h-1 mt-2" />
                          </div>
                        ))}
                        
                        {getProjectReleases(project.id).length > 3 && (
                          <div className="p-3 border rounded-lg bg-gray-50 flex items-center justify-center">
                            <div className="text-center text-sm text-muted-foreground">
                              +{getProjectReleases(project.id).length - 3} more releases
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in ProjectDashboard:', error);
    return (
      <div className="p-4 border border-red-500 rounded bg-red-50">
        <h2 className="text-red-600 font-bold">Error in ProjectDashboard</h2>
        <pre className="text-sm mt-2">{error?.toString()}</pre>
      </div>
    );
  }
}
