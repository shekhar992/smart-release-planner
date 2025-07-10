import { useState } from 'react';
import { useReleases } from '../contexts/ReleaseContext';
import { GanttProvider } from '../contexts/GanttContext';
import { GanttChart } from './GanttChart';
import { TaskForm } from './TaskForm';
import { DeveloperManager } from './DeveloperManager';
import { TaskDetailsSidebar } from './TaskDetailsSidebar';
import { BulkImport } from './BulkImport';
import { StatusManager } from './StatusManager';
import { CreateReleaseDialog } from './CreateReleaseDialog';
import { ThemeToggle } from './ThemeToggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Card, CardContent } from './ui/card';
import { 
  Plus, 
  Calendar, 
  Users, 
  Upload, 
  ArrowLeft,
  Settings,
  CheckCircle,
  AlertTriangle,
  Target,
  Settings2
} from 'lucide-react';
import { format } from 'date-fns';

export function ReleaseView() {
  const { currentRelease, setCurrentRelease, calculateReleaseProgress, getReleaseMetrics } = useReleases();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showReleaseSettings, setShowReleaseSettings] = useState(false);

  if (!currentRelease) {
    return null;
  }

  const progress = calculateReleaseProgress(currentRelease.id);
  const metrics = getReleaseMetrics(currentRelease.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300';
      case 'delayed': return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300';
    }
  };

  return (
    <GanttProvider 
      initialTasks={currentRelease.tasks} 
      initialDevelopers={currentRelease.team}
      releaseId={currentRelease.id}
    >
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentRelease(null)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <div 
                  className="w-1 h-8 rounded-full"
                  style={{ backgroundColor: currentRelease.color }}
                />
                <div>
                  <h1 className="text-2xl">{currentRelease.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {format(currentRelease.startDate, 'MMM d')} - {format(currentRelease.targetDate, 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge variant="secondary" className={getStatusColor(currentRelease.status)}>
                  {currentRelease.status.replace('-', ' ').toUpperCase()}
                </Badge>
                <Badge variant="outline">v{currentRelease.version}</Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReleaseSettings(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card className="border-0">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tasks</p>
                      <p className="font-semibold">{metrics.completedTasks}/{metrics.totalTasks}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Team</p>
                      <p className="font-semibold">{metrics.teamSize}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {metrics.overdueTasks > 0 && (
                <Card className="border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Overdue</p>
                        <p className="font-semibold text-red-600">{metrics.overdueTasks}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Days Left</p>
                      <p className="font-semibold">{metrics.daysRemaining}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content with Full-Width Timeline */}
        <div className="h-screen flex flex-col">
          <Tabs defaultValue="gantt" className="flex-1 flex flex-col">
            <div className="border-b bg-card">
              <div className="container mx-auto px-6 py-4">
                <div className="flex justify-between items-center">
                  <TabsList className="grid w-full grid-cols-4 max-w-[500px]">
                    <TabsTrigger value="gantt" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Timeline
                    </TabsTrigger>
                    <TabsTrigger value="team" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Team
                    </TabsTrigger>
                    <TabsTrigger value="import" className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Import
                    </TabsTrigger>
                    <TabsTrigger value="statuses" className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                      Statuses
                    </TabsTrigger>
                  </TabsList>

                  <Button onClick={() => setShowTaskForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </div>
            </div>

            <TabsContent value="gantt" className="flex-1 p-0 m-0">
              <div className="h-full">
                <GanttChart />
              </div>
            </TabsContent>

            <TabsContent value="team" className="flex-1 p-6">
              <div className="container mx-auto">
                <Card className="card-shadow border-0">
                  <CardContent className="p-6">
                    <DeveloperManager />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="import" className="flex-1 p-6">
              <div className="container mx-auto">
                <Card className="card-shadow border-0">
                  <CardContent className="p-6">
                    <BulkImport />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="statuses" className="flex-1 p-6">
              <div className="container mx-auto">
                <Card className="card-shadow border-0">
                  <CardContent className="p-6">
                    <StatusManager />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <TaskForm
          open={showTaskForm}
          onClose={() => setShowTaskForm(false)}
        />

        <TaskDetailsSidebar />

        <CreateReleaseDialog
          open={showReleaseSettings}
          onClose={() => setShowReleaseSettings(false)}
          editingRelease={currentRelease}
        />
      </div>
    </GanttProvider>
  );
}