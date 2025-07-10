import { useState } from 'react';
import { useStatus, StatusType, PriorityType } from '../contexts/StatusContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  GripVertical, 
  RotateCcw,
  Palette,
  Eye,
  EyeOff,
  Settings2,
  Tag,
  Flag
} from 'lucide-react';
import { toast } from 'sonner';

interface StatusFormData {
  name: string;
  label: string;
  color: string;
  isActive: boolean;
}

interface PriorityFormData {
  name: string;
  label: string;
  color: string;
  isActive: boolean;
}

function StatusForm({ 
  status, 
  onSave, 
  onCancel 
}: { 
  status?: StatusType; 
  onSave: (data: StatusFormData) => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<StatusFormData>({
    name: status?.name || '',
    label: status?.label || '',
    color: status?.color || '#6b7280',
    isActive: status?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.label.trim()) {
      toast.error('Name and label are required');
      return;
    }
    onSave(formData);
  };

  const colorPresets = [
    '#6b7280', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name (ID)</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
            placeholder="e.g., in-review"
            disabled={status?.isDefault}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="label">Display Label</Label>
          <Input
            id="label"
            value={formData.label}
            onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
            placeholder="e.g., In Review"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex items-center gap-3">
          <Input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            className="w-16 h-10"
          />
          <div className="flex gap-1">
            {colorPresets.map(color => (
              <button
                key={color}
                type="button"
                className="w-6 h-6 rounded-full border-2 border-gray-200 hover:border-gray-400"
                style={{ backgroundColor: color }}
                onClick={() => setFormData(prev => ({ ...prev, color }))}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: formData.color + '20' }}>
          <div 
            className="w-4 h-4 rounded" 
            style={{ backgroundColor: formData.color }}
          />
          <span style={{ color: formData.color }}>Preview: {formData.label}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
        />
        <Label htmlFor="active">Active (visible in dropdowns)</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">
          {status ? 'Update' : 'Create'} Status
        </Button>
      </DialogFooter>
    </form>
  );
}

function PriorityForm({ 
  priority, 
  onSave, 
  onCancel 
}: { 
  priority?: PriorityType; 
  onSave: (data: PriorityFormData) => void; 
  onCancel: () => void;
}) {
  const [formData, setPriorityFormData] = useState<PriorityFormData>({
    name: priority?.name || '',
    label: priority?.label || '',
    color: priority?.color || '#6b7280',
    isActive: priority?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.label.trim()) {
      toast.error('Name and label are required');
      return;
    }
    onSave(formData);
  };

  const colorPresets = [
    '#6b7280', '#f59e0b', '#f97316', '#dc2626', '#8b5cf6', 
    '#06b6d4', '#10b981', '#84cc16', '#ec4899', '#3b82f6'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority-name">Name (ID)</Label>
          <Input
            id="priority-name"
            value={formData.name}
            onChange={(e) => setPriorityFormData(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
            placeholder="e.g., urgent"
            disabled={priority?.isDefault}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority-label">Display Label</Label>
          <Input
            id="priority-label"
            value={formData.label}
            onChange={(e) => setPriorityFormData(prev => ({ ...prev, label: e.target.value }))}
            placeholder="e.g., Urgent"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex items-center gap-3">
          <Input
            type="color"
            value={formData.color}
            onChange={(e) => setPriorityFormData(prev => ({ ...prev, color: e.target.value }))}
            className="w-16 h-10"
          />
          <div className="flex gap-1">
            {colorPresets.map(color => (
              <button
                key={color}
                type="button"
                className="w-6 h-6 rounded-full border-2 border-gray-200 hover:border-gray-400"
                style={{ backgroundColor: color }}
                onClick={() => setPriorityFormData(prev => ({ ...prev, color }))}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded border-l-4" style={{ borderLeftColor: formData.color, backgroundColor: formData.color + '10' }}>
          <Flag className="w-4 h-4" style={{ color: formData.color }} />
          <span style={{ color: formData.color }}>Preview: {formData.label}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="priority-active"
          checked={formData.isActive}
          onCheckedChange={(checked) => setPriorityFormData(prev => ({ ...prev, isActive: checked }))}
        />
        <Label htmlFor="priority-active">Active (visible in dropdowns)</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">
          {priority ? 'Update' : 'Create'} Priority
        </Button>
      </DialogFooter>
    </form>
  );
}

export function StatusManager() {
  const {
    statuses,
    priorities,
    addStatus,
    updateStatus,
    deleteStatus,
    addPriority,
    updatePriority,
    deletePriority,
    resetToDefaults,
  } = useStatus();

  const [editingStatus, setEditingStatus] = useState<StatusType | null>(null);
  const [editingPriority, setEditingPriority] = useState<PriorityType | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showPriorityDialog, setShowPriorityDialog] = useState(false);

  const handleSaveStatus = (data: StatusFormData) => {
    try {
      if (editingStatus) {
        updateStatus(editingStatus.id, {
          ...data,
          bgColor: `bg-[${data.color}]`,
          textColor: 'text-white',
        });
        toast.success('Status updated successfully');
      } else {
        addStatus({
          ...data,
          bgColor: `bg-[${data.color}]`,
          textColor: 'text-white',
          order: statuses.length + 1,
          isDefault: false,
        });
        toast.success('Status created successfully');
      }
      setShowStatusDialog(false);
      setEditingStatus(null);
    } catch (error) {
      toast.error('Failed to save status');
    }
  };

  const handleSavePriority = (data: PriorityFormData) => {
    try {
      if (editingPriority) {
        updatePriority(editingPriority.id, {
          ...data,
          borderColor: `border-l-4 border-l-[${data.color}]`,
        });
        toast.success('Priority updated successfully');
      } else {
        addPriority({
          ...data,
          borderColor: `border-l-4 border-l-[${data.color}]`,
          order: priorities.length + 1,
          isDefault: false,
        });
        toast.success('Priority created successfully');
      }
      setShowPriorityDialog(false);
      setEditingPriority(null);
    } catch (error) {
      toast.error('Failed to save priority');
    }
  };

  const handleDeleteStatus = (status: StatusType) => {
    try {
      deleteStatus(status.id);
      toast.success('Status deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete status');
    }
  };

  const handleDeletePriority = (priority: PriorityType) => {
    try {
      deletePriority(priority.id);
      toast.success('Priority deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete priority');
    }
  };

  const toggleStatusActive = (status: StatusType) => {
    updateStatus(status.id, { isActive: !status.isActive });
    toast.success(`Status ${status.isActive ? 'deactivated' : 'activated'}`);
  };

  const togglePriorityActive = (priority: PriorityType) => {
    updatePriority(priority.id, { isActive: !priority.isActive });
    toast.success(`Priority ${priority.isActive ? 'deactivated' : 'activated'}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl">Status & Priority Management</h2>
          <p className="text-muted-foreground">
            Customize task statuses and priorities for your organization
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset to Default Settings?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all custom statuses and priorities, and restore the default ones. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  resetToDefaults();
                  toast.success('Reset to defaults successfully');
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Tabs defaultValue="statuses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="statuses" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Task Statuses ({statuses.length})
          </TabsTrigger>
          <TabsTrigger value="priorities" className="flex items-center gap-2">
            <Flag className="w-4 h-4" />
            Task Priorities ({priorities.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="statuses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Task Statuses</CardTitle>
                  <CardDescription>
                    Define the workflow states for your tasks
                  </CardDescription>
                </div>
                <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Status
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingStatus ? 'Edit Status' : 'Create New Status'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingStatus ? 'Update the status details' : 'Add a new task status to your workflow'}
                      </DialogDescription>
                    </DialogHeader>
                    <StatusForm
                      status={editingStatus || undefined}
                      onSave={handleSaveStatus}
                      onCancel={() => {
                        setShowStatusDialog(false);
                        setEditingStatus(null);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {statuses.map((status) => (
                    <div key={status.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: status.color }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{status.label}</span>
                            {status.isDefault && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                            {!status.isActive && (
                              <Badge variant="outline" className="text-xs">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">ID: {status.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatusActive(status)}
                        >
                          {status.isActive ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingStatus(status);
                                setShowStatusDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {!status.isDefault && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteStatus(status)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priorities" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Task Priorities</CardTitle>
                  <CardDescription>
                    Set the importance levels for task prioritization
                  </CardDescription>
                </div>
                <Dialog open={showPriorityDialog} onOpenChange={setShowPriorityDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Priority
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingPriority ? 'Edit Priority' : 'Create New Priority'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingPriority ? 'Update the priority details' : 'Add a new task priority level'}
                      </DialogDescription>
                    </DialogHeader>
                    <PriorityForm
                      priority={editingPriority || undefined}
                      onSave={handleSavePriority}
                      onCancel={() => {
                        setShowPriorityDialog(false);
                        setEditingPriority(null);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {priorities.map((priority) => (
                    <div key={priority.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                        <div 
                          className="w-1 h-6 rounded"
                          style={{ backgroundColor: priority.color }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{priority.label}</span>
                            {priority.isDefault && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                            {!priority.isActive && (
                              <Badge variant="outline" className="text-xs">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">ID: {priority.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePriorityActive(priority)}
                        >
                          {priority.isActive ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingPriority(priority);
                                setShowPriorityDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {!priority.isDefault && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeletePriority(priority)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}