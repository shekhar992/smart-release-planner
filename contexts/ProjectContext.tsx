import { createContext, useContext, useState, ReactNode } from 'react';
import { Project, ProjectMetrics, ProjectFilter } from '../types/project';
import { Release } from './ReleaseContext';
import { v4 as uuidv4 } from 'uuid';
import { differenceInDays, isAfter, isBefore } from 'date-fns';

interface ProjectContextType {
  // Project management
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  
  // CRUD operations
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Release management within projects
  addReleaseToProject: (projectId: string, release: Omit<Release, 'id'>) => Promise<void>;
  updateReleaseInProject: (projectId: string, releaseId: string, updates: Partial<Release>) => Promise<void>;
  deleteReleaseFromProject: (projectId: string, releaseId: string) => Promise<void>;
  getProjectReleases: (projectId: string) => Release[];
  
  // Metrics and analytics
  getProjectMetrics: (projectId: string) => ProjectMetrics;
  getPortfolioMetrics: () => {
    totalProjects: number;
    activeProjects: number;
    totalReleases: number;
    totalTasks: number;
    overallCompletion: number;
    budgetUtilization: number;
  };
  
  // Filtering and search
  filteredProjects: Project[];
  projectFilter: ProjectFilter;
  setProjectFilter: (filter: ProjectFilter) => void;
  clearFilters: () => void;
  
  // Navigation
  navigateToProject: (projectId: string) => void;
  navigateToRelease: (projectId: string, releaseId: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
}

// Mock data for demonstration
const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'E-Commerce Platform',
    description: 'Modern e-commerce platform with microservices architecture',
    status: 'active',
    priority: 'high',
    startDate: new Date('2024-01-15'),
    targetDate: new Date('2025-12-31'),
    budget: 500000,
    spentBudget: 285000,
    currency: 'USD',
    projectManager: 'pm-1',
    stakeholders: ['stake-1', 'stake-2'],
    color: '#3B82F6',
    category: 'web-app',
    tags: ['react', 'microservices', 'aws'],
    completionPercentage: 65,
    riskLevel: 'medium',
    releases: ['rel-1', 'rel-2', 'rel-3'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'proj-2',
    name: 'Mobile Banking App',
    description: 'Secure mobile banking application with biometric authentication',
    status: 'active',
    priority: 'critical',
    startDate: new Date('2024-03-01'),
    targetDate: new Date('2025-08-30'),
    budget: 750000,
    spentBudget: 425000,
    currency: 'USD',
    projectManager: 'pm-1',
    stakeholders: ['stake-3', 'stake-4'],
    color: '#10B981',
    category: 'mobile',
    tags: ['react-native', 'security', 'fintech'],
    completionPercentage: 45,
    riskLevel: 'high',
    releases: ['rel-4', 'rel-5'],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date()
  },
  {
    id: 'proj-3',
    name: 'Data Analytics Dashboard',
    description: 'Real-time analytics dashboard for business intelligence',
    status: 'planning',
    priority: 'medium',
    startDate: new Date('2025-01-01'),
    targetDate: new Date('2025-10-31'),
    budget: 300000,
    spentBudget: 0,
    currency: 'USD',
    projectManager: 'pm-1',
    stakeholders: ['stake-5'],
    color: '#8B5CF6',
    category: 'analytics',
    tags: ['python', 'ml', 'visualization'],
    completionPercentage: 0,
    riskLevel: 'low',
    releases: ['rel-6'],
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date()
  }
];

const mockReleases: Release[] = [
  // E-Commerce Platform releases
  {
    id: 'rel-1',
    name: 'MVP Release',
    version: '1.0.0',
    description: 'Initial MVP with core features',
    startDate: new Date('2024-01-15'),
    targetDate: new Date('2024-06-30'),
    status: 'completed',
    priority: 'high',
    progress: 100,
    color: '#10B981',
  releaseType: 'project',
  projectId: 'proj-1',
    tasks: [],
    team: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'rel-2',
    name: 'Enhanced Features',
    version: '2.0.0',
    description: 'Advanced search, recommendations, and analytics',
    startDate: new Date('2024-07-01'),
    targetDate: new Date('2024-12-31'),
    status: 'in-progress',
    priority: 'high',
    progress: 65,
    color: '#F59E0B',
  releaseType: 'project',
  projectId: 'proj-1',
    tasks: [],
    team: [],
    createdAt: new Date('2024-06-15'),
    updatedAt: new Date()
  },
  {
    id: 'rel-3',
    name: 'Enterprise Edition',
    version: '3.0.0',
    description: 'B2B features and enterprise integrations',
    startDate: new Date('2025-01-01'),
    targetDate: new Date('2025-06-30'),
    status: 'planning',
    priority: 'medium',
    progress: 0,
    color: '#3B82F6',
  releaseType: 'project',
  projectId: 'proj-1',
    tasks: [],
    team: [],
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date()
  }
];

export function ProjectProvider({ children }: ProjectProviderProps) {
  console.log('ProjectProvider rendered');
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [releases, setReleases] = useState<Release[]>(mockReleases);
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>({});

  console.log('ProjectProvider state:', {
    projectsCount: projects.length,
    releasesCount: releases.length,
    mockProjectsCount: mockProjects.length
  });

  // Filter projects based on current filter
  const filteredProjects = projects.filter(project => {
    if (projectFilter.status && projectFilter.status.length > 0) {
      if (!projectFilter.status.includes(project.status)) return false;
    }
    
    if (projectFilter.priority && projectFilter.priority.length > 0) {
      if (!projectFilter.priority.includes(project.priority)) return false;
    }
    
    if (projectFilter.category && projectFilter.category.length > 0) {
      if (!projectFilter.category.includes(project.category)) return false;
    }
    
    if (projectFilter.riskLevel && projectFilter.riskLevel.length > 0) {
      if (!projectFilter.riskLevel.includes(project.riskLevel)) return false;
    }
    
    if (projectFilter.searchQuery) {
      const query = projectFilter.searchQuery.toLowerCase();
      const searchableText = `${project.name} ${project.description} ${project.tags.join(' ')}`.toLowerCase();
      if (!searchableText.includes(query)) return false;
    }
    
    if (projectFilter.dateRange) {
      if (isBefore(project.targetDate, projectFilter.dateRange.start) || 
          isAfter(project.startDate, projectFilter.dateRange.end)) {
        return false;
      }
    }
    
    return true;
  });

  // CRUD operations
  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    const newProject: Project = {
      ...projectData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setProjects(prev => [...prev, newProject]);
  };

  const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
    setProjects(prev => prev.map(project => 
      project.id === id ? { ...project, ...updates, updatedAt: new Date() } : project
    ));
  };

  const deleteProject = async (id: string): Promise<void> => {
    setProjects(prev => prev.filter(project => project.id !== id));
    
    // Clear current project if it's the one being deleted
    if (currentProject?.id === id) {
      setCurrentProject(null);
    }
  };

  // Release management
  const addReleaseToProject = async (projectId: string, releaseData: Omit<Release, 'id'>): Promise<void> => {
    const newRelease: Release = {
      ...releaseData,
      id: uuidv4()
    };
    
    setReleases(prev => [...prev, newRelease]);
    
    // Add release ID to project
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { ...project, releases: [...project.releases, newRelease.id], updatedAt: new Date() }
        : project
    ));
  };

  const updateReleaseInProject = async (_projectId: string, releaseId: string, updates: Partial<Release>): Promise<void> => {
    setReleases(prev => prev.map(release => 
      release.id === releaseId ? { ...release, ...updates } : release
    ));
  };

  const deleteReleaseFromProject = async (projectId: string, releaseId: string): Promise<void> => {
    setReleases(prev => prev.filter(release => release.id !== releaseId));
    
    // Remove release ID from project
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { ...project, releases: project.releases.filter(id => id !== releaseId), updatedAt: new Date() }
        : project
    ));
  };

  const getProjectReleases = (projectId: string): Release[] => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return [];
    
    return releases.filter(release => project.releases.includes(release.id));
  };

  // Metrics calculation
  const getProjectMetrics = (projectId: string): ProjectMetrics => {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return {
        totalReleases: 0,
        activeReleases: 0,
        completedReleases: 0,
        overdue: 0,
        totalTasks: 0,
        completedTasks: 0,
        teamSize: 0,
        daysRemaining: 0,
        budgetUtilization: 0
      };
    }

    const projectReleases = getProjectReleases(projectId);
    const activeReleases = projectReleases.filter(r => r.status === 'in-progress').length;
    const completedReleases = projectReleases.filter(r => r.status === 'completed').length;
    const overdue = projectReleases.filter(r => 
      r.status !== 'completed' && isAfter(new Date(), r.targetDate)
    ).length;

    const totalTasks = projectReleases.reduce((sum, release) => sum + (release.tasks?.length || 0), 0);
    const completedTasks = projectReleases.reduce((sum, release) => {
      const completed = release.tasks?.filter(task => 
        task.status?.toLowerCase().includes('completed') || task.status?.toLowerCase().includes('done')
      ).length || 0;
      return sum + completed;
    }, 0);

    const uniqueTeamMembers = new Set();
    projectReleases.forEach(release => {
      release.team?.forEach(member => uniqueTeamMembers.add(member.id));
    });

    const daysRemaining = Math.max(0, differenceInDays(project.targetDate, new Date()));
    const budgetUtilization = project.budget ? (project.spentBudget || 0) / project.budget * 100 : 0;

    return {
      totalReleases: projectReleases.length,
      activeReleases,
      completedReleases,
      overdue,
      totalTasks,
      completedTasks,
      teamSize: uniqueTeamMembers.size,
      daysRemaining,
      budgetUtilization
    };
  };

  const getPortfolioMetrics = () => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalReleases = releases.length;
    const totalTasks = releases.reduce((sum, release) => sum + (release.tasks?.length || 0), 0);
    const completedTasks = releases.reduce((sum, release) => {
      const completed = release.tasks?.filter(task => 
        task.status?.toLowerCase().includes('completed') || task.status?.toLowerCase().includes('done')
      ).length || 0;
      return sum + completed;
    }, 0);
    const overallCompletion = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const totalBudget = projects.reduce((sum, project) => sum + (project.budget || 0), 0);
    const totalSpent = projects.reduce((sum, project) => sum + (project.spentBudget || 0), 0);
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      totalProjects,
      activeProjects,
      totalReleases,
      totalTasks,
      overallCompletion,
      budgetUtilization
    };
  };

  // Navigation helpers
  const navigateToProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setCurrentProject(project || null);
  };

  const navigateToRelease = (projectId: string, _releaseId: string) => {
    // This would typically navigate to the release view
    // For now, we'll set the current project
    navigateToProject(projectId);
  };

  const clearFilters = () => {
    setProjectFilter({});
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      currentProject,
      setCurrentProject,
      addProject,
      updateProject,
      deleteProject,
      addReleaseToProject,
      updateReleaseInProject,
      deleteReleaseFromProject,
      getProjectReleases,
      getProjectMetrics,
      getPortfolioMetrics,
      filteredProjects,
      projectFilter,
      setProjectFilter,
      clearFilters,
      navigateToProject,
      navigateToRelease
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    console.error('useProjects must be used within a ProjectProvider');
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  
  // Debug logging
  console.log('useProjects called:', {
    projectsLength: context.projects?.length || 0,
    filteredProjectsLength: context.filteredProjects?.length || 0,
    currentProject: context.currentProject?.name || 'none'
  });
  
  return context;
};
