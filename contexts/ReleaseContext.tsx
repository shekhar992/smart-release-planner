import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, Developer, TaskStatus } from '../types';

export interface Release {
  id: string;
  name: string;
  description: string;
  version: string;
  startDate: Date;
  targetDate: Date;
  status: 'planning' | 'in-progress' | 'delayed' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
  team: Developer[];
  tasks: Task[];
  color: string; // For visual distinction
}

interface ReleaseContextType {
  releases: Release[];
  currentRelease: Release | null;
  setCurrentRelease: (release: Release | null) => void;
  createRelease: (releaseData: Omit<Release, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'team' | 'tasks'>) => Promise<Release>;
  updateRelease: (id: string, updates: Partial<Release>) => Promise<void>;
  deleteRelease: (id: string) => Promise<void>;
  duplicateRelease: (id: string, newName: string) => Promise<Release>;
  
  // Current release management
  addTaskToCurrentRelease: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTaskInCurrentRelease: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTaskFromCurrentRelease: (id: string) => Promise<void>;
  
  addDeveloperToCurrentRelease: (developer: Omit<Developer, 'id'>) => Promise<void>;
  updateDeveloperInCurrentRelease: (id: string, updates: Partial<Developer>) => Promise<void>;
  deleteDeveloperFromCurrentRelease: (id: string) => Promise<void>;
  
  // Analytics and progress
  calculateReleaseProgress: (releaseId: string) => number;
  getReleaseMetrics: (releaseId: string) => {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    teamSize: number;
    daysRemaining: number;
  };
}

const ReleaseContext = createContext<ReleaseContextType | undefined>(undefined);

const RELEASE_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export function ReleaseProvider({ children }: { children: ReactNode }) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [currentRelease, setCurrentRelease] = useState<Release | null>(null);

  // Load releases from localStorage on mount
  useEffect(() => {
    const savedReleases = localStorage.getItem('gantt-releases');
    if (savedReleases) {
      try {
        const parsed = JSON.parse(savedReleases);
        const releasesWithDates = parsed.map((release: any) => ({
          ...release,
          startDate: new Date(release.startDate),
          targetDate: new Date(release.targetDate),
          createdAt: new Date(release.createdAt),
          updatedAt: new Date(release.updatedAt),
          team: release.team || [],
          tasks: release.tasks?.map((task: any) => ({
            ...task,
            startDate: new Date(task.startDate),
            endDate: new Date(task.endDate)
          })) || []
        }));
        setReleases(releasesWithDates);
      } catch (error) {
        console.error('Error loading releases:', error);
      }
    }
  }, []);

  // Save releases to localStorage whenever they change
  useEffect(() => {
    if (releases.length > 0) {
      localStorage.setItem('gantt-releases', JSON.stringify(releases));
    }
  }, [releases]);

  const createRelease = async (releaseData: Omit<Release, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'team' | 'tasks'>): Promise<Release> => {
    const newRelease: Release = {
      ...releaseData,
      id: uuidv4(),
      progress: 0,
      team: [],
      tasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      color: RELEASE_COLORS[releases.length % RELEASE_COLORS.length]
    };

    setReleases(prev => [...prev, newRelease]);
    return newRelease;
  };

  const updateRelease = async (id: string, updates: Partial<Release>): Promise<void> => {
    setReleases(prev => prev.map(release => 
      release.id === id 
        ? { ...release, ...updates, updatedAt: new Date() }
        : release
    ));

    // Update current release if it's the one being updated
    if (currentRelease?.id === id) {
      setCurrentRelease(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    }
  };

  const deleteRelease = async (id: string): Promise<void> => {
    setReleases(prev => prev.filter(release => release.id !== id));
    
    if (currentRelease?.id === id) {
      setCurrentRelease(null);
    }
  };

  const duplicateRelease = async (id: string, newName: string): Promise<Release> => {
    const originalRelease = releases.find(r => r.id === id);
    if (!originalRelease) {
      throw new Error('Release not found');
    }

    const duplicatedRelease: Release = {
      ...originalRelease,
      id: uuidv4(),
      name: newName,
      status: 'planning',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: originalRelease.tasks.map(task => ({
        ...task,
        id: uuidv4(),
        status: 'not-started' as TaskStatus
      })),
      color: RELEASE_COLORS[releases.length % RELEASE_COLORS.length]
    };

    setReleases(prev => [...prev, duplicatedRelease]);
    return duplicatedRelease;
  };

  const addTaskToCurrentRelease = async (task: Omit<Task, 'id'>): Promise<void> => {
    console.log('ReleaseContext: addTaskToCurrentRelease called');
    console.log('ReleaseContext: currentRelease exists:', !!currentRelease);
    console.log('ReleaseContext: task data:', task);
    
    if (!currentRelease) {
      console.error('ReleaseContext: No current release found!');
      return;
    }

    const newTask: Task = {
      ...task,
      id: uuidv4()
    };

    console.log('ReleaseContext: newTask created:', newTask);

    const updatedTasks = [...currentRelease.tasks, newTask];
    const updatedRelease = { ...currentRelease, tasks: updatedTasks };
    
    console.log('ReleaseContext: Updating release with', updatedTasks.length, 'tasks');
    
    setCurrentRelease(updatedRelease);
    await updateRelease(currentRelease.id, { tasks: updatedTasks });
    
    console.log('ReleaseContext: Task added successfully');
  };

  const updateTaskInCurrentRelease = async (id: string, updates: Partial<Task>): Promise<void> => {
    if (!currentRelease) return;

    const updatedTasks = currentRelease.tasks.map(task =>
      task.id === id ? { ...task, ...updates } : task
    );
    const updatedRelease = { ...currentRelease, tasks: updatedTasks };
    
    setCurrentRelease(updatedRelease);
    await updateRelease(currentRelease.id, { tasks: updatedTasks });
  };

  const deleteTaskFromCurrentRelease = async (id: string): Promise<void> => {
    if (!currentRelease) return;

    const updatedTasks = currentRelease.tasks.filter(task => task.id !== id);
    const updatedRelease = { ...currentRelease, tasks: updatedTasks };
    
    setCurrentRelease(updatedRelease);
    await updateRelease(currentRelease.id, { tasks: updatedTasks });
  };

  const addDeveloperToCurrentRelease = async (developer: Omit<Developer, 'id'>): Promise<void> => {
    if (!currentRelease) return;

    const newDeveloper: Developer = {
      ...developer,
      id: uuidv4()
    };

    const updatedTeam = [...currentRelease.team, newDeveloper];
    const updatedRelease = { ...currentRelease, team: updatedTeam };
    
    setCurrentRelease(updatedRelease);
    await updateRelease(currentRelease.id, { team: updatedTeam });
  };

  const updateDeveloperInCurrentRelease = async (id: string, updates: Partial<Developer>): Promise<void> => {
    if (!currentRelease) return;

    const updatedTeam = currentRelease.team.map(dev =>
      dev.id === id ? { ...dev, ...updates } : dev
    );
    const updatedRelease = { ...currentRelease, team: updatedTeam };
    
    setCurrentRelease(updatedRelease);
    await updateRelease(currentRelease.id, { team: updatedTeam });
  };

  const deleteDeveloperFromCurrentRelease = async (id: string): Promise<void> => {
    if (!currentRelease) return;

    const updatedTeam = currentRelease.team.filter(dev => dev.id !== id);
    const updatedRelease = { ...currentRelease, team: updatedTeam };
    
    setCurrentRelease(updatedRelease);
    await updateRelease(currentRelease.id, { team: updatedTeam });
  };

  const calculateReleaseProgress = (releaseId: string): number => {
    const release = releases.find(r => r.id === releaseId);
    if (!release || release.tasks.length === 0) return 0;

    const completedTasks = release.tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / release.tasks.length) * 100);
  };

  const getReleaseMetrics = (releaseId: string) => {
    const release = releases.find(r => r.id === releaseId);
    if (!release) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        teamSize: 0,
        daysRemaining: 0
      };
    }

    const today = new Date();
    const totalTasks = release.tasks.length;
    const completedTasks = release.tasks.filter(task => task.status === 'completed').length;
    const overdueTasks = release.tasks.filter(task => 
      task.status !== 'completed' && task.endDate < today
    ).length;
    const teamSize = release.team.length;
    const daysRemaining = Math.max(0, Math.ceil((release.targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      teamSize,
      daysRemaining
    };
  };

  return (
    <ReleaseContext.Provider value={{
      releases,
      currentRelease,
      setCurrentRelease,
      createRelease,
      updateRelease,
      deleteRelease,
      duplicateRelease,
      addTaskToCurrentRelease,
      updateTaskInCurrentRelease,
      deleteTaskFromCurrentRelease,
      addDeveloperToCurrentRelease,
      updateDeveloperInCurrentRelease,
      deleteDeveloperFromCurrentRelease,
      calculateReleaseProgress,
      getReleaseMetrics
    }}>
      {children}
    </ReleaseContext.Provider>
  );
}

export function useReleases() {
  const context = useContext(ReleaseContext);
  if (context === undefined) {
    throw new Error('useReleases must be used within a ReleaseProvider');
  }
  return context;
}