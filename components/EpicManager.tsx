import { useState } from 'react';
import { useGantt } from '../contexts/GanttContext';
import { Task } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Target, 
  Plus, 
  Calendar, 
  User, 
  Tag,
  Trash2,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';

export function EpicManager() {
  const { tasks, developers, addTask, updateTask, deleteTask } = useGantt();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEpic, setEditingEpic] = useState<Task | null>(null);

  // Get all epics
  const epics = tasks.filter(task => task.taskType === 'epic');

  // Get epic statistics
  const getEpicStats = (epicId: string) => {
    const epicTasks = tasks.filter(task => task.epicId === epicId);
    const completedTasks = epicTasks.filter(task => 
      task.status === 'completed' || task.status === 'done'
    );
    
    const totalStoryPoints = epicTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    const completedStoryPoints = completedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    
    return {
      totalTasks: epicTasks.length,
      completedTasks: completedTasks.length,
      progress: epicTasks.length > 0 ? (completedTasks.length / epicTasks.length) * 100 : 0,
      totalStoryPoints,
      completedStoryPoints,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Epic Management</h3>
          <p className="text-muted-foreground">Organize your work into JIRA-style epics</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Epic
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEpic ? 'Edit Epic' : 'Create New Epic'}
              </DialogTitle>
            </DialogHeader>
            <EpicForm 
              epic={editingEpic}
              onSave={(epic) => {
                if (editingEpic) {
                  updateTask(editingEpic.id, epic);
                } else {
                  addTask(epic);
                }
                setShowCreateDialog(false);
                setEditingEpic(null);
              }}
              onCancel={() => {
                setShowCreateDialog(false);
                setEditingEpic(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Epic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {epics.map(epic => {
          const stats = getEpicStats(epic.id);
          const assignedDev = developers.find(dev => dev.id === epic.assignedDeveloperId);
          
          return (
            <Card key={epic.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Target className="w-5 h-5 text-orange-500" />
                    <CardTitle className="text-lg">{epic.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingEpic(epic);
                        setShowCreateDialog(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTask(epic.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {epic.jiraKey && (
                    <Badge variant="outline" className="text-xs">
                      {epic.jiraKey}
                    </Badge>
                  )}
                  <Badge variant="secondary">{epic.status}</Badge>
                  <Badge variant="outline">{epic.priority}</Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {epic.description}
                  </p>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(stats.progress)}%</span>
                    </div>
                    <Progress value={stats.progress} className="h-2" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Tasks</div>
                      <div className="font-medium">
                        {stats.completedTasks}/{stats.totalTasks}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Story Points</div>
                      <div className="font-medium">
                        {stats.completedStoryPoints}/{stats.totalStoryPoints}
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {format(epic.startDate, 'MMM d')} - {format(epic.endDate, 'MMM d, yyyy')}
                  </div>

                  {/* Assignee */}
                  {assignedDev && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{assignedDev.name}</span>
                    </div>
                  )}

                  {/* Labels */}
                  {epic.labels && epic.labels.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      {epic.labels.map(label => (
                        <Badge key={label} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {epics.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Epics Created</h3>
              <p className="text-muted-foreground mb-4">
                Create your first epic to start organizing your work
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Epic
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface EpicFormProps {
  epic?: Task | null;
  onSave: (epic: Omit<Task, 'id'>) => void;
  onCancel: () => void;
}

function EpicForm({ epic, onSave, onCancel }: EpicFormProps) {
  const { developers } = useGantt();
  const [formData, setFormData] = useState({
    title: epic?.title || '',
    description: epic?.description || '',
    status: epic?.status || 'planning',
    priority: epic?.priority || 'medium',
    assignedDeveloperId: epic?.assignedDeveloperId || developers[0]?.id || '',
    startDate: epic?.startDate ? format(epic.startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    endDate: epic?.endDate ? format(epic.endDate, 'yyyy-MM-dd') : format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    jiraKey: epic?.jiraKey || '',
    labels: epic?.labels?.join(', ') || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const epicData: Omit<Task, 'id'> = {
      title: formData.title,
      description: formData.description,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      assignedDeveloperId: formData.assignedDeveloperId,
      status: formData.status,
      priority: formData.priority,
      taskType: 'epic',
      jiraKey: formData.jiraKey || undefined,
      labels: formData.labels ? formData.labels.split(',').map(l => l.trim()).filter(Boolean) : undefined,
      storyPoints: 0,
    };

    onSave(epicData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Epic title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="jiraKey">JIRA Key</Label>
          <Input
            id="jiraKey"
            value={formData.jiraKey}
            onChange={(e) => setFormData(prev => ({ ...prev, jiraKey: e.target.value }))}
            placeholder="e.g., PROJ-123"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Epic description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
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

        <div className="space-y-2">
          <Label htmlFor="assignee">Assignee</Label>
          <Select value={formData.assignedDeveloperId} onValueChange={(value) => setFormData(prev => ({ ...prev, assignedDeveloperId: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {developers.map(dev => (
                <SelectItem key={dev.id} value={dev.id}>
                  {dev.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="labels">Labels</Label>
        <Input
          id="labels"
          value={formData.labels}
          onChange={(e) => setFormData(prev => ({ ...prev, labels: e.target.value }))}
          placeholder="Comma-separated labels"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {epic ? 'Update Epic' : 'Create Epic'}
        </Button>
      </div>
    </form>
  );
}
