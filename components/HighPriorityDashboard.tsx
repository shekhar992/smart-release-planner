import { useState } from 'react';
import { useReleases } from '../contexts/ReleaseContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { CreateReleaseDialog } from './CreateReleaseDialog';
import { ThemeToggle } from './ThemeToggle';
import { 
  Plus, 
  AlertTriangle, 
  Clock, 
  Flag,
  Users,
  TrendingUp,
  CheckCircle,
  Eye,
  ChevronRight,
  Zap,
  Target,
  Calendar,
  ArrowRight,
  Flame
} from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { Task } from '../types';

interface AttentionRelease {
  release: any;
  urgentTasks: Task[];
  criticalTasks: Task[];
  overdueTasks: Task[];
  highPriorityTasks: Task[];
  urgencyScore: number;
  metrics: any;
}

interface HighPriorityDashboardProps {
  onViewAllReleases?: () => void;
}

export function HighPriorityDashboard({ onViewAllReleases }: HighPriorityDashboardProps) {
  const { releases, setCurrentRelease, getReleaseMetrics } = useReleases();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Calculate releases that need immediate attention
  const getReleasesNeedingAttention = (): AttentionRelease[] => {
    return releases
      .map(release => {
        const metrics = getReleaseMetrics(release.id);
        const today = new Date();
        
        // Get tasks by priority and urgency
        const criticalTasks = release.tasks.filter(task => 
          task.priority === 'critical' && task.status !== 'completed'
        );
        
        const highPriorityTasks = release.tasks.filter(task => 
          (task.priority === 'high' || task.priority === 'critical') && task.status !== 'completed'
        );
        
        const overdueTasks = release.tasks.filter(task => 
          task.status !== 'completed' && isPast(task.endDate)
        );
        
        const urgentTasks = release.tasks.filter(task => {
          if (task.status === 'completed') return false;
          const daysToDeadline = differenceInDays(task.endDate, today);
          return daysToDeadline <= 3 && daysToDeadline >= 0; // Due in next 3 days
        });
        
        // Calculate urgency score (higher = more urgent)
        let urgencyScore = 0;
        urgencyScore += criticalTasks.length * 10;
        urgencyScore += highPriorityTasks.length * 5;
        urgencyScore += overdueTasks.length * 15;
        urgencyScore += urgentTasks.length * 8;
        urgencyScore += (100 - metrics.daysRemaining) * 0.5; // Add time pressure
        
        return {
          release,
          urgentTasks,
          criticalTasks,
          overdueTasks,
          highPriorityTasks,
          urgencyScore,
          metrics
        };
      })
      .filter(item => item.urgencyScore > 0) // Only show releases with some urgency
      .sort((a, b) => b.urgencyScore - a.urgencyScore); // Sort by urgency
  };

  const attentionReleases = getReleasesNeedingAttention();
  
  // Get overall statistics
  const getOverallStats = () => {
    const totalCriticalTasks = releases.reduce((acc, release) => 
      acc + release.tasks.filter(task => task.priority === 'critical' && task.status !== 'completed').length, 0
    );
    
    const totalOverdueTasks = releases.reduce((acc, release) => 
      acc + release.tasks.filter(task => task.status !== 'completed' && isPast(task.endDate)).length, 0
    );
    
    const releasesAtRisk = releases.filter(release => {
      const metrics = getReleaseMetrics(release.id);
      return metrics.overdueTasks > 0 || metrics.daysRemaining <= 7;
    }).length;
    
    const activeReleases = releases.filter(r => r.status === 'in-progress').length;
    
    return {
      totalCriticalTasks,
      totalOverdueTasks,
      releasesAtRisk,
      activeReleases
    };
  };

  const stats = getOverallStats();

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <Flame className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      default: return <Flag className="w-4 h-4" />;
    }
  };

  const getUrgencyBadge = (urgencyScore: number) => {
    if (urgencyScore >= 50) return { label: 'Critical', variant: 'destructive' as const };
    if (urgencyScore >= 25) return { label: 'High', variant: 'destructive' as const };
    if (urgencyScore >= 10) return { label: 'Medium', variant: 'secondary' as const };
    return { label: 'Low', variant: 'outline' as const };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="mb-2 flex items-center gap-3">
            <Zap className="w-8 h-8 text-orange-500" />
            Priority Dashboard
          </h1>
          <p className="text-muted-foreground">
            Releases and tasks requiring immediate attention
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button 
            variant="outline" 
            onClick={() => onViewAllReleases?.()}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View All Releases
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Release
          </Button>
        </div>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Flame className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-800">Critical Tasks</p>
                <p className="text-2xl font-bold text-red-900">{stats.totalCriticalTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-800">Overdue Tasks</p>
                <p className="text-2xl font-bold text-orange-900">{stats.totalOverdueTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800">At Risk Releases</p>
                <p className="text-2xl font-bold text-amber-900">{stats.releasesAtRisk}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Active Releases</p>
                <p className="text-2xl font-bold text-blue-900">{stats.activeReleases}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Critical Tasks Section */}
      {(() => {
        const allCriticalTasks = releases.flatMap(release => 
          release.tasks
            .filter(task => 
              (task.priority === 'critical' || task.priority === 'high') && 
              task.status !== 'completed'
            )
            .map(task => ({
              ...task,
              releaseName: release.name,
              releaseColor: release.color,
              releaseId: release.id
            }))
        ).sort((a, b) => {
          // Sort by: critical first, then by due date
          if (a.priority === 'critical' && b.priority !== 'critical') return -1;
          if (b.priority === 'critical' && a.priority !== 'critical') return 1;
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        }).slice(0, 8); // Show top 8 most critical tasks

        return allCriticalTasks.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-semibold">Most Critical Tasks</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allCriticalTasks.map((task) => {
                const isOverdue = isPast(task.endDate);
                const daysUntilDue = differenceInDays(task.endDate, new Date());
                const developer = releases
                  .find(r => r.id === task.releaseId)?.team
                  .find(dev => dev.id === task.assignedDeveloperId);
                
                return (
                  <Card 
                    key={task.id} 
                    className={`border-0 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer ${
                      task.priority === 'critical' ? 'ring-2 ring-red-200' : 'ring-1 ring-orange-200'
                    }`}
                    onClick={() => {
                      const release = releases.find(r => r.id === task.releaseId);
                      if (release) setCurrentRelease(release);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Task Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{task.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: task.releaseColor }}
                              />
                              <span className="text-xs text-muted-foreground truncate">
                                {task.releaseName}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge 
                              variant={task.priority === 'critical' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {getPriorityIcon(task.priority)}
                              <span className="ml-1">{task.priority}</span>
                            </Badge>
                          </div>
                        </div>

                        {/* Task Details */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {developer && (
                              <div className="flex items-center gap-1">
                                <Avatar className="w-5 h-5">
                                  <AvatarImage src={developer.avatar} />
                                  <AvatarFallback className="text-xs">
                                    {developer.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-muted-foreground truncate max-w-[80px]">
                                  {developer.name}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {isOverdue ? (
                              <Badge variant="destructive" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {Math.abs(daysUntilDue)}d overdue
                              </Badge>
                            ) : daysUntilDue <= 3 ? (
                              <Badge variant="secondary" className="text-xs bg-yellow-50 text-yellow-800">
                                <Calendar className="w-3 h-3 mr-1" />
                                {daysUntilDue === 0 ? 'Due today' : `${daysUntilDue}d left`}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">
                                {format(task.endDate, 'MMM d')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress indicator if task has subtasks or story points */}
                        {task.storyPoints && (
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Target className="w-3 h-3 text-purple-600" />
                            <span className="text-xs text-muted-foreground">
                              {task.storyPoints} story points
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Releases Needing Attention */}
      {attentionReleases.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold">Releases Requiring Immediate Attention</h2>
          </div>
          
          <div className="space-y-4">
            {attentionReleases.map((item) => {
              const urgencyBadge = getUrgencyBadge(item.urgencyScore);
              const isOverdue = isPast(item.release.targetDate) && item.release.status !== 'completed';
              
              return (
                <Card 
                  key={item.release.id} 
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
                  onClick={() => setCurrentRelease(item.release)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div 
                          className="w-1 h-20 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.release.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg truncate">{item.release.name}</CardTitle>
                            <Badge variant={urgencyBadge.variant} className="text-xs">
                              {urgencyBadge.label} Priority
                            </Badge>
                            {isOverdue && (
                              <Badge variant="destructive" className="text-xs animate-pulse">
                                <Clock className="w-3 h-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm line-clamp-1">
                            {item.release.description}
                          </CardDescription>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Progress</span>
                        <span>{Math.round((item.metrics.completedTasks / Math.max(item.metrics.totalTasks, 1)) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(item.metrics.completedTasks / Math.max(item.metrics.totalTasks, 1)) * 100} 
                        className="h-2" 
                      />
                    </div>

                    {/* Critical Issues */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Critical/High Priority Tasks */}
                      {item.criticalTasks.length > 0 && (
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Flame className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-800">Critical Tasks</span>
                          </div>
                          <p className="text-lg font-bold text-red-900">{item.criticalTasks.length}</p>
                          <p className="text-xs text-red-600">Require immediate action</p>
                        </div>
                      )}

                      {/* Overdue Tasks */}
                      {item.overdueTasks.length > 0 && (
                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-800">Overdue</span>
                          </div>
                          <p className="text-lg font-bold text-orange-900">{item.overdueTasks.length}</p>
                          <p className="text-xs text-orange-600">Past deadline</p>
                        </div>
                      )}

                      {/* Urgent Tasks (Due Soon) */}
                      {item.urgentTasks.length > 0 && (
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">Due Soon</span>
                          </div>
                          <p className="text-lg font-bold text-yellow-900">{item.urgentTasks.length}</p>
                          <p className="text-xs text-yellow-600">Next 3 days</p>
                        </div>
                      )}
                    </div>

                    {/* Release Info */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span>{item.metrics.teamSize} Team</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <span>{item.metrics.daysRemaining} Days Left</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>{item.metrics.completedTasks}/{item.metrics.totalTasks} Tasks</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>v{item.release.version}</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 rounded-full w-fit mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">All Good!</h3>
                <p className="text-green-600">No releases require immediate attention right now.</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => onViewAllReleases?.()}
                className="mt-4"
              >
                View All Releases
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Release Dialog */}
      <CreateReleaseDialog 
        open={showCreateDialog} 
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  );
}
