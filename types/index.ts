export interface Developer {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
  skills?: string[];
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
}

// Legacy types for backwards compatibility
export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type Priority = TaskPriority;
export type ViewType = 'day' | 'week' | 'month' | 'year';

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