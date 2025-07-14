import { useState } from 'react';
import { useLeave } from '../contexts/LeaveContext';
import { LeaveRequest, LeaveType, Developer } from '../types';
import { format, addDays, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { 
  Calendar, 
  Plus, 
  Users, 
  AlertTriangle, 
  Trash2,
  CalendarDays
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';

const LEAVE_TYPES: { value: LeaveType; label: string; color: string }[] = [
  { value: 'annual', label: 'Annual Leave', color: 'bg-blue-100 text-blue-800' },
  { value: 'sick', label: 'Sick Leave', color: 'bg-red-100 text-red-800' },
  { value: 'personal', label: 'Personal Leave', color: 'bg-purple-100 text-purple-800' },
  { value: 'maternity', label: 'Maternity Leave', color: 'bg-pink-100 text-pink-800' },
  { value: 'paternity', label: 'Paternity Leave', color: 'bg-green-100 text-green-800' },
  { value: 'bereavement', label: 'Bereavement Leave', color: 'bg-gray-100 text-gray-800' },
  { value: 'training', label: 'Training', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'conference', label: 'Conference', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'public-holiday', label: 'Public Holiday', color: 'bg-orange-100 text-orange-800' },
  { value: 'other', label: 'Other', color: 'bg-slate-100 text-slate-800' }
];

interface NewLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  developers: Developer[];
}

function NewLeaveDialog({ open, onOpenChange, developers }: NewLeaveDialogProps) {
  const { addLeaveRequest, calculateWorkingDays, adjustTasksForLeave } = useLeave();
  const [formData, setFormData] = useState({
    developerId: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    leaveType: 'annual' as LeaveType,
    reason: '',
    isPartialDay: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const leaveRequest: Omit<LeaveRequest, 'id' | 'createdDate'> = {
      developerId: formData.developerId,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      leaveType: formData.leaveType,
      status: 'approved', // Auto-approve since no approval workflow needed
      reason: formData.reason || undefined,
      isPartialDay: formData.isPartialDay
    };

    const newLeave = await addLeaveRequest(leaveRequest);
    
    // Automatically adjust tasks for this leave
    await adjustTasksForLeave(formData.developerId, newLeave);

    onOpenChange(false);
    
    // Reset form
    setFormData({
      developerId: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      leaveType: 'annual',
      reason: '',
      isPartialDay: false
    });
  };

  const workingDays = formData.developerId && formData.startDate && formData.endDate 
    ? calculateWorkingDays(new Date(formData.startDate), new Date(formData.endDate), formData.developerId)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Team Leave</DialogTitle>
          <DialogDescription>
            Add a leave period for a team member. Tasks will be automatically rescheduled.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="developer">Team Member</Label>
            <Select value={formData.developerId} onValueChange={(value) => setFormData(prev => ({ ...prev, developerId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {developers.map(dev => (
                  <SelectItem key={dev.id} value={dev.id}>
                    {dev.name} - {dev.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                min={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leaveType">Leave Type</Label>
            <Select value={formData.leaveType} onValueChange={(value) => setFormData(prev => ({ ...prev, leaveType: value as LeaveType }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="partialDay"
              checked={formData.isPartialDay}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPartialDay: checked }))}
            />
            <Label htmlFor="partialDay">Half day leave</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Brief reason for leave..."
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              rows={3}
            />
          </div>

          {workingDays > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Working Days:</strong> {workingDays} {workingDays === 1 ? 'day' : 'days'}
                {formData.isPartialDay && ' (half day)'}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.developerId}>
              Add Leave
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TaskImpactView() {
  const { taskAdjustments, developers } = useLeave();
  
  if (taskAdjustments.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No task adjustments made yet
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {taskAdjustments.map((adjustment, index) => {
        const developer = developers.find(d => d.id === adjustment.affectedBy);
        
        return (
          <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">Task ID: {adjustment.taskId}</span>
                <Badge variant="outline">{developer?.name}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Rescheduled from {format(adjustment.originalStartDate, 'MMM dd')} → {format(adjustment.adjustedStartDate, 'MMM dd, yyyy')}
              </p>
              <p className="text-xs text-muted-foreground">
                Reason: Leave adjustment on {format(adjustment.adjustmentDate, 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeaveCalendarView() {
  const { leaves, developers, deleteLeaveRequest } = useLeave();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const handleDeleteLeave = async (leaveId: string) => {
    if (window.confirm('Are you sure you want to delete this leave? This will revert any task adjustments.')) {
      await deleteLeaveRequest(leaveId);
    }
  };
  
  const monthLeaves = leaves.filter(leave => 
    isSameMonth(leave.startDate, currentDate) || isSameMonth(leave.endDate, currentDate)
  );

  // Group leaves by developer for better visualization
  const leavesByDeveloper = developers.map(dev => ({
    developer: dev,
    leaves: monthLeaves.filter(leave => leave.developerId === dev.id)
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Team Calendar - {format(currentDate, 'MMMM yyyy')}
          </CardTitle>
          <CardDescription>
            Team leave overview with automatic task rescheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <Button
              variant="outline"
              onClick={() => setCurrentDate(prev => addDays(startOfMonth(prev), -1))}
            >
              Previous Month
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentDate(prev => addDays(endOfMonth(prev), 1))}
            >
              Next Month
            </Button>
          </div>

          <div className="space-y-4">
            {leavesByDeveloper.map(({ developer, leaves }) => (
              <div key={developer.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-medium text-primary">
                      {developer.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium">{developer.name}</h3>
                    <p className="text-sm text-muted-foreground">{developer.role}</p>
                  </div>
                </div>
                
                {leaves.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-13">
                    No leaves this month
                  </p>
                ) : (
                  <div className="space-y-2 pl-13">
                    {leaves.map(leave => {
                      const leaveType = LEAVE_TYPES.find(t => t.value === leave.leaveType);
                      
                      return (
                        <div key={leave.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className={leaveType?.color}>
                                {leaveType?.label}
                              </Badge>
                              {leave.isPartialDay && (
                                <Badge variant="outline">Half Day</Badge>
                              )}
                            </div>
                            <p className="text-sm mt-1">
                              {format(leave.startDate, 'MMM dd')} - {format(leave.endDate, 'MMM dd, yyyy')}
                            </p>
                            {leave.reason && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {leave.reason}
                              </p>
                            )}
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteLeave(leave.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Task Impact Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Task Impact Summary
          </CardTitle>
          <CardDescription>
            Tasks automatically rescheduled due to team leaves
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskImpactView />
        </CardContent>
      </Card>
    </div>
  );
}

export function LeaveManager() {
  const { leaves, developers } = useLeave();
  const [newLeaveDialogOpen, setNewLeaveDialogOpen] = useState(false);

  const totalLeaves = leaves.length;
  const currentMonthLeaves = leaves.filter(leave => 
    isSameMonth(leave.startDate, new Date()) || isSameMonth(leave.endDate, new Date())
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Leave Calendar</h2>
          <p className="text-muted-foreground">
            Track team availability and automatically adjust task schedules
          </p>
        </div>
        <Button onClick={() => setNewLeaveDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Leave
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">This Month</p>
                <p className="text-xl font-bold">{currentMonthLeaves}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Team Size</p>
                <p className="text-xl font-bold">{developers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Total Leaves</p>
                <p className="text-xl font-bold">{totalLeaves}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <LeaveCalendarView />

      {/* New Leave Dialog */}
      <NewLeaveDialog
        open={newLeaveDialogOpen}
        onOpenChange={setNewLeaveDialogOpen}
        developers={developers}
      />
    </div>
  );
}
