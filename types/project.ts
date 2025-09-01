export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: Date;
  targetDate: Date;
  actualEndDate?: Date;
  budget?: number;
  spentBudget?: number;
  currency?: string;
  
  // Project team and stakeholders
  projectManager: string; // User ID
  stakeholders: string[]; // User IDs
  
  // Visual and categorization
  color: string;
  category: string; // e.g., 'web-app', 'mobile', 'infrastructure', 'research'
  tags: string[];
  
  // Metrics and tracking
  completionPercentage: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Releases under this project
  releases: string[]; // Release IDs
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMetrics {
  totalReleases: number;
  activeReleases: number;
  completedReleases: number;
  overdue: number;
  totalTasks: number;
  completedTasks: number;
  teamSize: number;
  daysRemaining: number;
  budgetUtilization: number;
}

export interface ProjectFilter {
  status?: string[];
  priority?: string[];
  category?: string[];
  riskLevel?: string[];
  searchQuery?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export type ProjectViewType = 'grid' | 'list' | 'kanban' | 'timeline';
