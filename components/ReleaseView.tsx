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
  Upload
} from 'lucide-react';
import { format } from 'date-fns';

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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'in-progress': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'delayed': return 'bg-red-50 text-red-700 border border-red-200';
      case 'completed': return 'bg-green-50 text-green-700 border border-green-200';
      case 'cancelled': return 'bg-gray-50 text-gray-700 border border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
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
        <div className="min-h-screen bg-background">
        {/* Modern Header with Glass Effect */}
        <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-1 h-12 rounded-full flex-shrink-0"
                  style={{ backgroundColor: currentRelease.color }}
                />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{currentRelease.name}</h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(currentRelease.startDate, 'MMM d')} - {format(currentRelease.targetDate, 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge variant="secondary" className={getStatusBadgeClass(currentRelease.status)}>
                  {currentRelease.status.replace('-', ' ').toUpperCase()}
                </Badge>
                <Badge variant="outline" className="font-medium">v{currentRelease.version}</Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReleaseSettings(true)}
                  className="hover:bg-primary/10"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Dashboard */}
        <div className="border-b bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="container mx-auto px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card className="card-shadow border-0 hover:card-shadow-hover transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Progress</span>
                      </div>
                      <span className="text-2xl font-bold">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-shadow border-0 hover:card-shadow-hover transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tasks</p>
                      <p className="text-2xl font-bold">{metrics.completedTasks}<span className="text-lg text-muted-foreground">/{metrics.totalTasks}</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-shadow border-0 hover:card-shadow-hover transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Team</p>
                      <p className="text-2xl font-bold">{metrics.teamSize}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {metrics.overdueTasks > 0 && (
                <Card className="card-shadow border-0 hover:card-shadow-hover transition-shadow duration-200 border-l-4 border-l-destructive">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                        <p className="text-2xl font-bold text-destructive">{metrics.overdueTasks}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="card-shadow border-0 hover:card-shadow-hover transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                      <Target className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Days Left</p>
                      <p className="text-2xl font-bold">{metrics.daysRemaining}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content with Enhanced Tab Design */}
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