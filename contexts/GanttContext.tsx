import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useReleases } from './ReleaseContext';
import { Task, Developer, ViewType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { 
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear, 
  startOfDay,
  eachDayOfInterval, 
  eachWeekOfInterval, 
  eachMonthOfInterval, 
  isSameDay,
  isSameMonth,
} from 'date-fns';

export interface Conflict {
  id: string;
  developerId: string;
  conflictingTasks: Task[];
  message: string;
}

interface GanttContextType {
  tasks: Task[];
  developers: Developer[];
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;
  conflicts: Conflict[];
  
  // Task management
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Developer management
  addDeveloper: (developer: Omit<Developer, 'id'>) => Promise<void>;
  updateDeveloper: (id: string, updates: Partial<Developer>) => Promise<void>;
  deleteDeveloper: (id: string) => Promise<void>;
  
  // Conflict detection
  detectConflicts: () => void;
  getDeveloperConflicts: (developerId: string) => Conflict[];
  getTaskConflicts: (taskId: string) => Conflict | null;
  
  // EPIC management
  getEpics: () => Task[];
  getTasksByEpic: (epicId: string) => Task[];
  getEpicProgress: (epicId: string) => { completed: number; total: number; percentage: number };
  
  // Filtering
  selectedDevelopers: string[]; // Array of developer IDs
  setSelectedDevelopers: React.Dispatch<React.SetStateAction<string[]>>;
  selectedTaskTypes: string[]; // Array of task types
  setSelectedTaskTypes: React.Dispatch<React.SetStateAction<string[]>>;
  filteredTasks: Task[]; // Tasks filtered by selected developers and task types
  clearFilters: () => void;
  
  // View management
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  viewConfig: {
    unitWidth: number;
    dateFormat: string;
    label: string;
  };
  
  // Date range calculation
  getDateRange: () => {
    start: Date;
    end: Date;
    units: Date[];
    todayIndex: number; // Index of today in the units array (-1 if not found)
  };

  // Navigation helpers
  scrollToToday: (() => void) | null;
  setScrollToToday: (fn: (() => void) | null) => void;
  goToToday: () => void;
  updateTaskDates: (taskId: string, startDate: Date, endDate: Date) => void;
}

const GanttContext = createContext<GanttContextType | undefined>(undefined);

interface GanttProviderProps {
  children: ReactNode;
  initialTasks?: Task[];
  initialDevelopers?: Developer[];
  releaseId?: string;
}

export function GanttProvider({ children, initialTasks = [], initialDevelopers = [], releaseId }: GanttProviderProps) {
  const releaseContext = useReleases();
  
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [developers, setDevelopers] = useState<Developer[]>(initialDevelopers);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('day');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [scrollToToday, setScrollToToday] = useState<(() => void) | null>(null);
  
  // Developer filtering state
  const [selectedDevelopers, setSelectedDevelopers] = useState<string[]>([]);
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<string[]>([]);
  
  // Filtered tasks based on selected developers and task types
  const filteredTasks = tasks.filter(task => {
    const developerMatch = selectedDevelopers.length === 0 || selectedDevelopers.includes(task.assignedDeveloperId);
    const taskTypeMatch = selectedTaskTypes.length === 0 || selectedTaskTypes.includes(task.taskType);
    return developerMatch && taskTypeMatch;
  });
  
  // Clear all filters
  const clearFilters = () => {
    setSelectedDevelopers([]);
    setSelectedTaskTypes([]);
  };

  // Sync with release context when available
  useEffect(() => {
    if (releaseId && releaseContext?.currentRelease) {
      setTasks(releaseContext.currentRelease.tasks || []);
      setDevelopers(releaseContext.currentRelease.team || []);
    }
  }, [releaseId, releaseContext?.currentRelease]);

  // View configurations with enhanced week view
  const viewConfigs = {
    day: { unitWidth: 80, dateFormat: 'dd/MM', label: 'Day' },
    week: { unitWidth: 180, dateFormat: 'dd/MM', label: 'Week' }, // Wider for better visibility
  };

  const viewConfig = viewConfigs[currentView];

  // Date range calculation based on current view - designed to always include today
  const getDateRange = () => {
    const today = startOfDay(new Date());
    let start: Date, end: Date, units: Date[];
    let todayIndex = -1;

    switch (currentView) {
      case 'day':
        // For day view: show the entire selected year
        start = startOfYear(new Date(selectedYear, 0, 1));
        end = endOfYear(new Date(selectedYear, 0, 1));
        units = eachDayOfInterval({ start, end });
        
        // Find today's index in the current year
        todayIndex = units.findIndex(date => isSameDay(date, today));
        break;
      
      case 'week':
        // Enhanced week view: Show 1 year span with 3 months before today, 9 months after
        // This provides a more focused and manageable view
        const weekStart = startOfWeek(subWeeks(today, 12), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(addWeeks(today, 40), { weekStartsOn: 1 });
        start = weekStart;
        end = weekEnd;
        units = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
        
        // Find the week containing today
        todayIndex = units.findIndex(weekDate => {
          const thisWeekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
          return today >= weekDate && today <= thisWeekEnd;
        });
        break;
      
      default:
        // Default to month view
        start = startOfMonth(subMonths(today, 12));
        end = endOfMonth(addMonths(today, 36));
        units = eachMonthOfInterval({ start, end });
        todayIndex = units.findIndex(monthDate => isSameMonth(monthDate, today));
    }

    return { start, end, units, todayIndex };
  };

  // Task management functions
  const addTask = async (task: Omit<Task, 'id'>): Promise<void> => {
    console.log('GanttContext: addTask called');
    console.log('GanttContext: releaseId:', releaseId);
    console.log('GanttContext: releaseContext exists:', !!releaseContext);
    console.log('GanttContext: task data:', task);
    
    const newTask: Task = {
      ...task,
      id: uuidv4()
    };

    if (releaseId && releaseContext) {
      console.log('GanttContext: Using release context to add task');
      await releaseContext.addTaskToCurrentRelease(task);
    } else {
      console.log('GanttContext: Adding task to local state');
      setTasks(prev => [...prev, newTask]);
    }
    
    console.log('GanttContext: Task addition completed');
  };

  const updateTask = async (id: string, updates: Partial<Task>): Promise<void> => {
    if (releaseId && releaseContext) {
      await releaseContext.updateTaskInCurrentRelease(id, updates);
    } else {
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updates } : task
      ));
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    if (releaseId && releaseContext) {
      await releaseContext.deleteTaskFromCurrentRelease(id);
    } else {
      setTasks(prev => prev.filter(task => task.id !== id));
    }
    
    // Clear editing task if it's the one being deleted
    if (editingTask?.id === id) {
      setEditingTask(null);
    }
  };

  // Developer management functions
  const addDeveloper = async (developer: Omit<Developer, 'id'>): Promise<void> => {
    const newDeveloper: Developer = {
      ...developer,
      id: uuidv4()
    };

    if (releaseId && releaseContext) {
      await releaseContext.addDeveloperToCurrentRelease(developer);
    } else {
      setDevelopers(prev => [...prev, newDeveloper]);
    }
  };

  const updateDeveloper = async (id: string, updates: Partial<Developer>): Promise<void> => {
    if (releaseId && releaseContext) {
      await releaseContext.updateDeveloperInCurrentRelease(id, updates);
    } else {
      setDevelopers(prev => prev.map(dev => 
        dev.id === id ? { ...dev, ...updates } : dev
      ));
    }
  };

  const deleteDeveloper = async (id: string): Promise<void> => {
    if (releaseId && releaseContext) {
      await releaseContext.deleteDeveloperFromCurrentRelease(id);
    } else {
      setDevelopers(prev => prev.filter(dev => dev.id !== id));
    }
  };

  // Conflict detection
  const detectConflicts = () => {
    const newConflicts: Conflict[] = [];
    const developerTasks: { [developerId: string]: Task[] } = {};

    // Group tasks by developer
    tasks.forEach(task => {
      if (task.assignedDeveloperId && !developerTasks[task.assignedDeveloperId]) {
        developerTasks[task.assignedDeveloperId] = [];
      }
      if (task.assignedDeveloperId) {
        developerTasks[task.assignedDeveloperId].push(task);
      }
    });

    // Check for overlapping tasks for each developer
    Object.entries(developerTasks).forEach(([developerId, devTasks]) => {
      const conflictingTasks: Task[] = [];

      for (let i = 0; i < devTasks.length; i++) {
        for (let j = i + 1; j < devTasks.length; j++) {
          const task1 = devTasks[i];
          const task2 = devTasks[j];

          // Check if tasks overlap
          if (
            (task1.startDate <= task2.endDate && task1.endDate >= task2.startDate) ||
            (task2.startDate <= task1.endDate && task2.endDate >= task1.startDate)
          ) {
            if (!conflictingTasks.includes(task1)) conflictingTasks.push(task1);
            if (!conflictingTasks.includes(task2)) conflictingTasks.push(task2);
          }
        }
      }

      if (conflictingTasks.length > 0) {
        const developer = developers.find(dev => dev.id === developerId);
        newConflicts.push({
          id: uuidv4(),
          developerId,
          conflictingTasks,
          message: `${developer?.name || 'Unknown Developer'} has ${conflictingTasks.length} overlapping tasks`
        });
      }
    });

    setConflicts(newConflicts);
  };

  const getDeveloperConflicts = (developerId: string): Conflict[] => {
    return conflicts.filter(conflict => conflict.developerId === developerId);
  };

  const getTaskConflicts = (taskId: string): Conflict | null => {
    return conflicts.find(conflict => 
      conflict.conflictingTasks.some(task => task.id === taskId)
    ) || null;
  };

  // EPIC management functions
  const getEpics = (): Task[] => {
    return tasks.filter(task => task.taskType === 'epic');
  };

  const getTasksByEpic = (epicId: string): Task[] => {
    return tasks.filter(task => task.epicId === epicId);
  };

  const getEpicProgress = (epicId: string): { completed: number; total: number; percentage: number } => {
    const epicTasks = getTasksByEpic(epicId);
    const completedTasks = epicTasks.filter(task => 
      task.status.toLowerCase().includes('completed') || 
      task.status.toLowerCase().includes('done')
    );
    
    const total = epicTasks.length;
    const completed = completedTasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  // Navigation helper methods
  const goToToday = () => {
    if (scrollToToday) {
      scrollToToday();
    }
  };

  const updateTaskDates = (taskId: string, startDate: Date, endDate: Date) => {
    updateTask(taskId, { startDate, endDate });
  };

  // Run conflict detection when tasks change
  useEffect(() => {
    if (tasks.length > 0 && developers.length > 0) {
      detectConflicts();
    }
  }, [tasks, developers]);

  return (
    <GanttContext.Provider value={{
      tasks,
      developers,
      editingTask,
      setEditingTask,
      conflicts,
      addTask,
      updateTask,
      deleteTask,
      addDeveloper,
      updateDeveloper,
      deleteDeveloper,
      detectConflicts,
      getDeveloperConflicts,
      getTaskConflicts,
      selectedDevelopers,
      setSelectedDevelopers,
      selectedTaskTypes,
      setSelectedTaskTypes,
      filteredTasks,
      clearFilters,
      currentView,
      setCurrentView,
      selectedYear,
      setSelectedYear,
      viewConfig,
      getDateRange,
      scrollToToday,
      setScrollToToday,
      goToToday,
      updateTaskDates,
      getEpics,
      getTasksByEpic,
      getEpicProgress
    }}>
      {children}
    </GanttContext.Provider>
  );
}

export function useGantt() {
  const context = useContext(GanttContext);
  if (context === undefined) {
    throw new Error('useGantt must be used within a GanttProvider');
  }
  return context;
}