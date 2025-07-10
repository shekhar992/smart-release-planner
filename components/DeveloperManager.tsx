import { useState } from 'react';
import { useGantt } from '../contexts/GanttContext';
import { Developer } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Alert, AlertDescription } from './ui/alert';
import { Trash2, Edit2, Plus, AlertTriangle } from 'lucide-react';

export function DeveloperManager() {
  const { developers, tasks, addDeveloper, updateDeveloper, deleteDeveloper, getDeveloperConflicts } = useGantt();
  const [showForm, setShowForm] = useState(false);
  const [editingDeveloper, setEditingDeveloper] = useState<Developer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
  });

  const openForm = (developer?: Developer) => {
    if (developer) {
      setEditingDeveloper(developer);
      setFormData({
        name: developer.name,
        role: developer.role,
        email: developer.email,
      });
    } else {
      setEditingDeveloper(null);
      setFormData({
        name: '',
        role: '',
        email: '',
      });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingDeveloper(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.role || !formData.email) {
      return;
    }

    if (editingDeveloper) {
      updateDeveloper(editingDeveloper.id, formData);
    } else {
      addDeveloper(formData);
    }

    closeForm();
  };

  const getTaskCount = (developerId: string) => {
    return tasks.filter(task => task.assignedDeveloperId === developerId).length;
  };

  const getActiveTaskCount = (developerId: string) => {
    return tasks.filter(task => 
      task.assignedDeveloperId === developerId && 
      (task.status === 'in-progress' || task.status === 'not-started')
    ).length;
  };

  const getConflictCount = (developerId: string) => {
    return getDeveloperConflicts(developerId).length;
  };

  const handleDelete = (developer: Developer) => {
    if (getTaskCount(developer.id) > 0) {
      if (!confirm(`${developer.name} has ${getTaskCount(developer.id)} assigned tasks. Deleting this developer will also remove all their tasks. Continue?`)) {
        return;
      }
    }
    deleteDeveloper(developer.id);
  };

  const getTotalConflicts = () => {
    return developers.reduce((total, dev) => total + getConflictCount(dev.id), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>Developer Team</h2>
          {getTotalConflicts() > 0 && (
            <div className="flex items-center gap-1 text-sm text-red-600 mt-1">
              <AlertTriangle className="w-3 h-3" />
              <span>{getTotalConflicts()} scheduling conflict{getTotalConflicts() !== 1 ? 's' : ''} detected</span>
            </div>
          )}
        </div>
        <Button onClick={() => openForm()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Developer
        </Button>
      </div>

      {/* Conflicts Overview */}
      {getTotalConflicts() > 0 && (
        <Alert className="border-destructive/20 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <strong>Team Scheduling Issues</strong>
            <p className="text-sm mt-1">
              Some developers have overlapping task assignments. Review the highlighted developers below and adjust task schedules to resolve conflicts.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {developers.map((developer) => {
          const conflictCount = getConflictCount(developer.id);
          const hasConflicts = conflictCount > 0;
          
          return (
            <Card key={developer.id} className={`card-shadow hover:card-shadow-hover transition-all duration-200 ${hasConflicts ? 'border-l-4 border-l-destructive bg-destructive/5' : 'border-0'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {developer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm">{developer.name}</CardTitle>
                        {hasConflicts && <AlertTriangle className="w-3 h-3 text-destructive" />}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openForm(developer)}
                      className="h-8 w-8 p-0 hover:bg-primary/10"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(developer)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg">{getTaskCount(developer.id)}</p>
                      <p className="text-xs">Total</p>
                    </div>
                    <div>
                      <p className="text-lg">{getActiveTaskCount(developer.id)}</p>
                      <p className="text-xs">Active</p>
                    </div>
                    <div>
                      <p className={`text-lg ${hasConflicts ? 'text-red-600' : ''}`}>
                        {conflictCount}
                      </p>
                      <p className="text-xs">Conflicts</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    {getActiveTaskCount(developer.id) > 0 && (
                      <Badge variant="secondary" className="text-xs flex-1 justify-center">
                        {getActiveTaskCount(developer.id)} active
                      </Badge>
                    )}
                    {hasConflicts && (
                      <Badge variant="destructive" className="text-xs flex-1 justify-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {conflictCount} conflict{conflictCount !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {developers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No developers added yet. Add your first team member to get started.</p>
            <Button className="mt-4" onClick={() => openForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Developer
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={closeForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDeveloper ? 'Edit Developer' : 'Add New Developer'}
            </DialogTitle>
            <DialogDescription>
              {editingDeveloper 
                ? 'Update the developer information and role.' 
                : 'Add a new team member to your development team.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter developer name"
                required
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                placeholder="e.g., Frontend Developer, Backend Developer"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="developer@company.com"
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingDeveloper ? 'Update Developer' : 'Add Developer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}