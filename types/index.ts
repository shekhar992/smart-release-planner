export interface Developer {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
  skills?: string[];
  leaves?: LeaveRequest[];
  leaveBalance?: LeaveBalance;
  workingCalendar?: WorkingCalendar;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  assignedDeveloperId: string;
  status: string; // Now accepts any string from StatusContext
  priority: string; // Now accepts any string from StatusContext
  dependencies?: string[];
  epicId?: string; // Reference to parent epic
  parentTaskId?: string; // For sub-tasks
  taskType: 'epic' | 'story' | 'task' | 'subtask' | 'bug';
  storyPoints?: number;
  originalEstimate?: number; // in hours
  remainingEstimate?: number; // in hours
  timeSpent?: number; // in hours
  labels?: string[];
  jiraKey?: string; // External JIRA key if synced
}

// Legacy types for backwards compatibility
export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type Priority = TaskPriority;
export type ViewType = 'day' | 'week';

export interface TaskConflict {
  taskId: string;
  conflictingTaskIds: string[];
  developerId: string;
  overlapDays: number;
}

export interface ViewConfig {
  type: ViewType;
  label: string;
  unitWidth: number; // width in pixels per unit
  dateFormat: string;
  headerFormat: string;
  subHeaderFormat?: string;
}

export interface DragItem {
  id: string;
  type: string;
  task: Task;
}

// New types for dynamic status system
export interface StatusType {
  id: string;
  name: string;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  order: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface PriorityType {
  id: string;
  name: string;
  label: string;
  color: string;
  borderColor: string;
  order: number;
  isDefault: boolean;
  isActive: boolean;
}

// Epic and grouping types
export interface Epic {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: string;
  priority: string;
  color: string;
  progress: number; // calculated from child tasks
  totalStoryPoints?: number;
  completedStoryPoints?: number;
  jiraKey?: string;
  labels?: string[];
}

export interface TaskGroup {
  epic?: Epic;
  tasks: Task[];
  subtasks: Record<string, Task[]>; // Parent task ID -> subtasks
}

export interface GroupedTasks {
  ungrouped: Task[];
  groups: Record<string, TaskGroup>; // Epic ID -> TaskGroup
}

// Leave Management Types
export interface LeaveRequest {
  id: string;
  developerId: string;
  startDate: Date;
  endDate: Date;
  leaveType: LeaveType;
  status: LeaveStatus;
  reason?: string;
  approvedBy?: string;
  approvedDate?: Date;
  createdDate: Date;
  isPartialDay?: boolean; // For half-day leaves
  hoursPerDay?: number; // For flexible working hours
}

export type LeaveType = 
  | 'annual' 
  | 'sick' 
  | 'personal' 
  | 'maternity' 
  | 'paternity' 
  | 'bereavement' 
  | 'training' 
  | 'conference' 
  | 'public-holiday'
  | 'other';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveBalance {
  developerId: string;
  year: number;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  carryOverDays?: number;
}

export interface WorkingCalendar {
  developerId: string;
  workingDays: number[]; // 0-6 (Sunday-Saturday), e.g., [1,2,3,4,5] for Mon-Fri
  workingHours: {
    start: string; // "09:00"
    end: string;   // "17:00"
  };
  timeZone: string;
  publicHolidays: Date[];
  customNonWorkingDays: Date[];
}

export interface TaskAdjustment {
  taskId: string;
  originalStartDate: Date;
  originalEndDate: Date;
  adjustedStartDate: Date;
  adjustedEndDate: Date;
  reason: 'leave' | 'dependency' | 'manual';
  affectedBy?: string; // Developer ID if affected by leave
  adjustmentDate: Date;
}

// Enhanced Developer with leave information
export interface DeveloperWithLeave extends Developer {
  leaves: LeaveRequest[];
  leaveBalance: LeaveBalance;
  workingCalendar: WorkingCalendar;
  currentAvailability?: {
    isAvailable: boolean;
    availableFrom?: Date;
    reason?: string;
  };
}

// Gantt view configuration for JIRA-like experience
export interface GanttViewConfig {
  showEpics: boolean;
  showSubtasks: boolean;
  groupByEpic: boolean;
  compactMode: boolean;
  showDependencies: boolean;
  showCriticalPath: boolean;
}