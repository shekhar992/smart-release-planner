import { useState } from 'react';
import { useGantt } from '../contexts/GanttContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Calendar,
  Plus,
  Trash2,
  Target,
  Clock,
  CheckCircle2,
  Info,
  Zap
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, isSameWeek } from 'date-fns';

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  weekNumber: number;
  jiraKey?: string;
  storyPoints?: number;
  velocity?: number;
}

interface SprintManagerProps {
  releaseId?: string;
}

export function SprintManager({ }: SprintManagerProps) {
  const { getDateRange, currentView, filteredTasks } = useGantt();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedWeeks, setSelectedWeeks] = useState<Set<number>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sprintName, setSprintName] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');

  const { units } = getDateRange();

  // Auto-generate sprint names based on week patterns
  const generateSprintName = (weekNumber: number, weekDate: Date): string => {
    const monthName = format(weekDate, 'MMM');
    const year = format(weekDate, 'yyyy');
    return `Sprint ${weekNumber} - ${monthName} ${year}`;
  };

  // Get sprint for a specific week
  const getSprintForWeek = (weekDate: Date): Sprint | undefined => {
    return sprints.find(sprint => 
      isSameWeek(weekDate, sprint.startDate) || 
      (weekDate >= sprint.startDate && weekDate <= sprint.endDate)
    );
  };

  // Mark weeks as sprint with smart defaults
  const markWeeksAsSprint = () => {
    if (selectedWeeks.size === 0) return;

    const weekNumbers = Array.from(selectedWeeks).sort((a, b) => a - b);
    const firstWeekIndex = weekNumbers[0];
    
    const startDate = startOfWeek(units[firstWeekIndex], { weekStartsOn: 1 });
    
    // Auto-generate sprint details
    const weekNumber = parseInt(format(startDate, 'ww'));
    const autoName = generateSprintName(weekNumber, startDate);
    const duration = weekNumbers.length;
    const autoGoal = `${duration}-week sprint focusing on release deliverables`;

    setSprintName(autoName);
    setSprintGoal(autoGoal);
    setIsCreateDialogOpen(true);
  };

  // Create sprint from selected weeks
  const createSprint = () => {
    if (selectedWeeks.size === 0 || !sprintName.trim()) return;

    const weekNumbers = Array.from(selectedWeeks).sort((a, b) => a - b);
    const firstWeekIndex = weekNumbers[0];
    const lastWeekIndex = weekNumbers[weekNumbers.length - 1];
    
    const startDate = startOfWeek(units[firstWeekIndex], { weekStartsOn: 1 });
    const endDate = endOfWeek(units[lastWeekIndex], { weekStartsOn: 1 });
    const weekNumber = parseInt(format(startDate, 'ww'));

    // Calculate story points from tasks in this time range
    const sprintTasks = filteredTasks.filter(task => 
      task.startDate >= startDate && task.startDate <= endDate
    );
    const totalStoryPoints = sprintTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);

    const newSprint: Sprint = {
      id: `sprint-${Date.now()}`,
      name: sprintName.trim(),
      goal: sprintGoal.trim() || 'Sprint goal to be defined',
      startDate,
      endDate,
      status: 'planning',
      weekNumber,
      storyPoints: totalStoryPoints,
      velocity: 0
    };

    setSprints(prev => [...prev, newSprint]);
    setSelectedWeeks(new Set());
    setSprintName('');
    setSprintGoal('');
    setIsCreateDialogOpen(false);
  };

  // Delete sprint
  const deleteSprint = (sprintId: string) => {
    setSprints(prev => prev.filter(s => s.id !== sprintId));
  };

  // Update sprint status
  const updateSprintStatus = (sprintId: string, status: Sprint['status']) => {
    setSprints(prev => prev.map(s => 
      s.id === sprintId ? { ...s, status } : s
    ));
  };

  // Toggle week selection
  const toggleWeekSelection = (weekIndex: number) => {
    const existingSprint = getSprintForWeek(units[weekIndex]);
    if (existingSprint) return; // Don't allow selecting weeks that already have sprints

    setSelectedWeeks(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(weekIndex)) {
        newSelection.delete(weekIndex);
      } else {
        newSelection.add(weekIndex);
      }
      return newSelection;
    });
  };

  // Get status color for sprint
  const getSprintStatusColor = (status: Sprint['status']) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Only show in week view for better UX
  if (currentView !== 'week') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sprint Planning</h3>
          <p className="text-muted-foreground mb-4">
            Switch to Week view to mark development weeks as JIRA sprints
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Switch to Week View
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sprint Creation Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Quick Sprint Creation:</strong> Click on week headers to select development weeks, 
          then click "Create Sprint" for instant JIRA sprint setup with auto-generated names and goals.
        </AlertDescription>
      </Alert>

      {/* Interactive Week Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Sprint Timeline - Click Weeks to Select
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 mb-4">
            {units.map((weekDate, index) => {
              const existingSprint = getSprintForWeek(weekDate);
              const isSelected = selectedWeeks.has(index);
              const weekNumber = format(weekDate, 'ww');
              const dateRange = `${format(weekDate, 'MMM dd')} - ${format(endOfWeek(weekDate, { weekStartsOn: 1 }), 'dd')}`;

              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    existingSprint
                      ? `${getSprintStatusColor(existingSprint.status)} cursor-not-allowed`
                      : isSelected
                      ? 'bg-blue-100 border-blue-500 text-blue-900'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => !existingSprint && toggleWeekSelection(index)}
                  title={existingSprint ? `${existingSprint.name} (${existingSprint.status})` : 'Click to select for sprint'}
                >
                  <div className="text-center">
                    <div className="font-bold text-sm">Week {weekNumber}</div>
                    <div className="text-xs text-muted-foreground mt-1">{dateRange}</div>
                    {existingSprint && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {existingSprint.name.split(' - ')[0]}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedWeeks.size > 0 && (
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  {selectedWeeks.size} week{selectedWeeks.size > 1 ? 's' : ''} selected
                </p>
                <p className="text-xs text-blue-700">
                  Sprint will auto-generate name and calculate story points from existing tasks
                </p>
              </div>
              <Button onClick={markWeeksAsSprint} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Sprint
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sprints List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-600" />
            Active Sprints ({sprints.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sprints.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No sprints created yet. Select weeks above to create your first sprint.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sprints.map((sprint) => (
                <div key={sprint.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{sprint.name}</h4>
                        <Badge className={getSprintStatusColor(sprint.status)}>
                          {sprint.status}
                        </Badge>
                        {sprint.jiraKey && (
                          <Badge variant="outline" className="text-xs">
                            {sprint.jiraKey}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{sprint.goal}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(sprint.startDate, 'MMM dd')} - {format(sprint.endDate, 'MMM dd')}
                        </span>
                        {sprint.storyPoints && (
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {sprint.storyPoints} SP
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Week {sprint.weekNumber}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sprint.status === 'planning' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateSprintStatus(sprint.id, 'active')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      {sprint.status === 'active' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateSprintStatus(sprint.id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deleteSprint(sprint.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Sprint Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Sprint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sprintName">Sprint Name</Label>
              <Input
                id="sprintName"
                value={sprintName}
                onChange={(e) => setSprintName(e.target.value)}
                placeholder="Sprint 1 - Jan 2025"
              />
            </div>
            <div>
              <Label htmlFor="sprintGoal">Sprint Goal</Label>
              <Input
                id="sprintGoal"
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
                placeholder="Complete user authentication and dashboard features"
              />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>📅 {selectedWeeks.size} week{selectedWeeks.size > 1 ? 's' : ''} selected</span>
              <span>📊 Auto-calculated story points from existing tasks</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createSprint} disabled={!sprintName.trim()}>
                Create Sprint
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
