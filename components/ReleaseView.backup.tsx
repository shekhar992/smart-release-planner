import { LeaveProvider } from '../contexts/LeaveContext';
import { LeaveManager } from './LeaveManagerSimple';
import { useState } from 'react';
import { useReleases } from '../contexts/ReleaseContext';
import { GanttProvider } from '../contexts/GanttContext';
import { GanttChart } from './GanttChart';
import { EpicManager } from './EpicManager';
import { NewTaskForm } from './NewTaskForm';
import { DeveloperManager } from './DeveloperManager';
import { TaskEditManager } from './TaskEditManager';
import { StatusManager } from './StatusManager';
import { CreateReleaseDialog } from './CreateReleaseDialog';
import { ImportManager } from './ImportManager';
import { ModernCard, StatusBadge, ModernProgress } from './ui/enhanced-design-system';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Card, CardContent } from './ui/card';
import { 
  Plus,
  Calendar, 
  Users, 
  Settings,
  CheckCircle,
  AlertTriangle,
  Target,
  Settings2,
  TrendingUp,
  CalendarDays,
  Upload,
  BarChart3,
  Clock,
  Star,
  Activity,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from './ui/utils';

export function ReleaseView() {
  const { currentRelease, calculateReleaseProgress, getReleaseMetrics } = useReleases();
  
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showReleaseSettings, setShowReleaseSettings] = useState(false);

  console.log('ReleaseView: Current release:', currentRelease?.name);
  console.log('ReleaseView: Team size:', currentRelease?.team?.length || 0);

  if (!currentRelease) {
    return null;
  }

  const progress = calculateReleaseProgress(currentRelease.id);
  const metrics = getReleaseMetrics(currentRelease.id);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'planning': return 'primary';
      case 'in-progress': return 'warning';
      case 'delayed': return 'error';
      case 'completed': return 'success';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  return (
    <GanttProvider 
      initialTasks={currentRelease.tasks} 
      initialDevelopers={currentRelease.team}
      releaseId={currentRelease.id}
    >
      <LeaveProvider releaseId={currentRelease.id}>
        <TaskEditManager>
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
        {/* Modern Header with Enhanced Glass Effect */}
        <div className="sticky top-0 z-40 glass border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${currentRelease.color}, ${currentRelease.color}dd)` }}
                  >
                    {currentRelease.name.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                      {currentRelease.name}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4" />
                      {format(currentRelease.startDate, 'MMM d')} - {format(currentRelease.targetDate, 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <StatusBadge 
                    variant={getStatusVariant(currentRelease.status)} 
                    size="lg"
                    dot
                  >
                    {currentRelease.status.replace('-', ' ').toUpperCase()}
                  </StatusBadge>
                  <StatusBadge variant="default" size="lg">
                    v{currentRelease.version}
                  </StatusBadge>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-sm">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">Priority Release</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setShowReleaseSettings(true)}
                  className="hover-lift shadow-sm"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Dashboard */}
        <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="container mx-auto px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <ModernCard variant="elevated" className="hover-glow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{Math.round(progress)}%</p>
                    <ModernProgress 
                      value={progress} 
                      variant={progress > 75 ? 'success' : progress > 50 ? 'default' : 'warning'}
                      className="mt-2"
                      showLabel={false}
                    />
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </ModernCard>

              <ModernCard variant="elevated" className="hover-glow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Tasks</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{metrics.totalTasks - metrics.completedTasks}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Activity className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">In progress</span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </ModernCard>

              <ModernCard variant="elevated" className="hover-glow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Team Size</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{currentRelease.team?.length || 0}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Zap className="h-4 w-4 text-purple-500" />
                      <span className="text-sm text-purple-600 dark:text-purple-400">Full capacity</span>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </ModernCard>

              <ModernCard variant="elevated" className="hover-glow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{metrics.overdueTasks}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600 dark:text-red-400">Needs attention</span>
                    </div>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </ModernCard>

              <ModernCard variant="elevated" className="hover-glow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Days Left</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{metrics.daysRemaining}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-amber-600 dark:text-amber-400">On schedule</span>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                    <Target className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </ModernCard>
            </div>
          </div>
        </div>

        {/* Main Content with Enhanced Tab Design */}
        <div className="flex-1">
          <Tabs defaultValue="gantt" className="flex-1 flex flex-col">
            <div className="glass border-b border-gray-200/60 dark:border-gray-800/60">
              <div className="container mx-auto px-6 py-4">
                <div className="flex justify-between items-center">
                  <TabsList className="grid grid-cols-6 w-full max-w-[900px] bg-white/80 dark:bg-gray-800/80 p-1 rounded-xl shadow-sm">
                    <TabsTrigger 
                      value="gantt" 
                      className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Timeline
                    </TabsTrigger>
                    <TabsTrigger 
                      value="epics" 
                      className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                    >
                      <Target className="w-4 h-4" />
                      Epics
                    </TabsTrigger>
                    <TabsTrigger 
                      value="team" 
                      className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                    >
                      <Users className="w-4 h-4" />
                      Team
                    </TabsTrigger>
                    <TabsTrigger 
                      value="leave" 
                      className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                    >
                      <CalendarDays className="w-4 h-4" />
                      Leave
                    </TabsTrigger>
                    <TabsTrigger 
                      value="statuses" 
                      className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                    >
                      <Settings2 className="w-4 h-4" />
                      Statuses
                    </TabsTrigger>
                    <TabsTrigger 
                      value="import" 
                      className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                    >
                      <Upload className="w-4 h-4" />
                      Import
                    </TabsTrigger>
                  </TabsList>

                  <Button 
                    onClick={() => setShowTaskForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover-lift"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </div>
            </div>
            {/* Tab Content */}
            <TabsContent value="gantt" className="flex-1 p-6">
              <div className="h-[600px]">
                <GanttChart />
              </div>
            </TabsContent>

            <TabsContent value="epics" className="flex-1 p-6">
              <div className="space-y-6">
                <ModernCard variant="default" size="lg">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-xl font-semibold">Epic Management</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Organize tasks into epics and track progress across large initiatives.</p>
                  </div>
                  <EpicManager />
                </ModernCard>
              </div>
            </TabsContent>

            <TabsContent value="team" className="flex-1 p-6">
              <div className="space-y-6">
                <ModernCard variant="default" size="lg">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold">Team Management</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Manage team members, their roles, and track individual contributions to the release.</p>
                  </div>
                  <DeveloperManager />
                </ModernCard>
              </div>
            </TabsContent>

            <TabsContent value="leave" className="flex-1 p-6">
              <div className="space-y-6">
                <ModernCard variant="default" size="lg">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <CalendarDays className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-xl font-semibold">Leave Management</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Track team availability, manage leave requests, and adjust tasks automatically based on team member schedules.</p>
                  </div>
                  <LeaveManager />
                </ModernCard>
              </div>
            </TabsContent>

            <TabsContent value="statuses" className="flex-1 p-6">
              <div className="container mx-auto max-w-4xl">
                <ModernCard variant="default" size="lg">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Settings2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-xl font-semibold">Status Management</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Customize task statuses and their workflow to match your team's process.</p>
                  </div>
                  <StatusManager />
                </ModernCard>
              </div>
            </TabsContent>

            <TabsContent value="import" className="flex-1 p-6">
              <div className="space-y-6">
                <ModernCard variant="default" size="lg">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold">Data Import</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Import tasks, team members, and other data from CSV files or external systems.</p>
                  </div>
                  <ImportManager />
                </ModernCard>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Dialogs */}
        {showTaskForm && (
          <NewTaskForm 
            onClose={() => setShowTaskForm(false)}
            releaseId={currentRelease.id}
          />
        )}

        {/* Dialogs */}
        {showTaskForm && (
          <NewTaskForm 
            onClose={() => setShowTaskForm(false)}
            releaseId={currentRelease.id}
          />
        )}

        {showReleaseSettings && (
          <CreateReleaseDialog 
            open={showReleaseSettings}
            onOpenChange={setShowReleaseSettings}
          />
        )}
      </div>
      </TaskEditManager>
      </LeaveProvider>
    </GanttProvider>
  );
}
        </div>
        </TaskEditManager>
      </LeaveProvider>
    </GanttProvider>
  );
}        {/* Main Content with Enhanced Tab Design */}
        <div className="h-screen flex flex-col">
          <Tabs defaultValue="gantt" className="flex-1 flex flex-col">
            <div className="border-b bg-card/50 backdrop-blur-sm">
              <div className="container mx-auto px-6 py-4">
                <div className="flex justify-between items-center">
                  <TabsList className="grid w-full grid-cols-6 max-w-[900px] bg-muted/50 p-1 rounded-lg">
                    <TabsTrigger value="gantt" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <Calendar className="w-4 h-4" />
                      Timeline
                    </TabsTrigger>
                    <TabsTrigger value="epics" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <Target className="w-4 h-4" />
                      Epics
                    </TabsTrigger>
                    <TabsTrigger value="team" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <Users className="w-4 h-4" />
                      Team
                    </TabsTrigger>
                    <TabsTrigger value="leaves" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <CalendarDays className="w-4 h-4" />
                      Leaves
                    </TabsTrigger>
                    <TabsTrigger value="statuses" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <Settings2 className="w-4 h-4" />
                      Statuses
                    </TabsTrigger>
                    <TabsTrigger value="import" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <Upload className="w-4 h-4" />
                      Import
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => setShowTaskForm(true)}
                      disabled={!currentRelease?.team || currentRelease.team.length === 0}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!currentRelease?.team || currentRelease.team.length === 0 ? "Add team members first before creating tasks" : "Create a new task"}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                    
                    {(!currentRelease?.team || currentRelease.team.length === 0) && (
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800 max-w-md">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <strong>No team members!</strong>
                            <p className="text-xs mt-1">Add developers in the <strong>Team</strong> tab before creating tasks.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <TabsContent value="gantt" className="flex-1 p-0 m-0">
              <div className="h-full">
                <GanttChart />
              </div>
            </TabsContent>

            <TabsContent value="epics" className="flex-1 p-6">
              <div className="container mx-auto max-w-6xl">
                <Card className="card-shadow border-0 hover:card-shadow-hover transition-shadow duration-200 bg-card">
                  <CardContent className="p-8">
                    <EpicManager />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="team" className="flex-1 p-6">
              <div className="container mx-auto max-w-4xl">
                <Card className="card-shadow border-0 hover:card-shadow-hover transition-shadow duration-200 bg-card">
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold">Team Management</h3>
                      </div>
                      <p className="text-muted-foreground">Manage your team members and their roles in this release.</p>
                    </div>
                    <DeveloperManager />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="leaves" className="flex-1 p-6">
              <div className="container mx-auto max-w-6xl">
                <Card className="card-shadow border-0 hover:card-shadow-hover transition-shadow duration-200 bg-card">
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <CalendarDays className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold">Leave Management</h3>
                      </div>
                      <p className="text-muted-foreground">Track team availability, manage leave requests, and adjust tasks automatically based on team member schedules.</p>
                    </div>
                    <LeaveManager />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="statuses" className="flex-1 p-6">
              <div className="container mx-auto max-w-4xl">
                <Card className="card-shadow border-0 hover:card-shadow-hover transition-shadow duration-200 bg-card">
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Settings2 className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold">Status Management</h3>
                      </div>
                      <p className="text-muted-foreground">Customize task statuses and their workflow to match your team's process.</p>
                    </div>
                    <StatusManager />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="import" className="flex-1 p-6">
              <div className="space-y-6">
                <Card className="card-shadow border-0 hover:card-shadow-hover transition-shadow duration-200 bg-card">
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Upload className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold">Data Import</h3>
                      </div>
                      <p className="text-muted-foreground">Import data in bulk using CSV templates for tasks, developers, releases, and more.</p>
                    </div>
                    <ImportManager />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <NewTaskForm 
          open={showTaskForm} 
          onOpenChange={setShowTaskForm} 
        />

        <CreateReleaseDialog
          open={showReleaseSettings}
          onClose={() => setShowReleaseSettings(false)}
          editingRelease={currentRelease}
        />
      </div>
      </TaskEditManager>
      </LeaveProvider>
    </GanttProvider>
  );
}