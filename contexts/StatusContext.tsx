import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

interface StatusContextType {
  // Status management
  statuses: StatusType[];
  priorities: PriorityType[];
  
  // Status CRUD operations
  addStatus: (status: Omit<StatusType, 'id'>) => void;
  updateStatus: (id: string, updates: Partial<StatusType>) => void;
  deleteStatus: (id: string) => void;
  getStatusById: (id: string) => StatusType | undefined;
  getActiveStatuses: () => StatusType[];
  
  // Priority CRUD operations
  addPriority: (priority: Omit<PriorityType, 'id'>) => void;
  updatePriority: (id: string, updates: Partial<PriorityType>) => void;
  deletePriority: (id: string) => void;
  getPriorityById: (id: string) => PriorityType | undefined;
  getActivePriorities: () => PriorityType[];
  
  // Utility functions
  resetToDefaults: () => void;
  reorderStatuses: (statusIds: string[]) => void;
  reorderPriorities: (priorityIds: string[]) => void;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

// Default statuses
const defaultStatuses: StatusType[] = [
  {
    id: 'not-started',
    name: 'not-started',
    label: 'Not Started',
    color: '#6b7280',
    bgColor: 'bg-gray-300',
    textColor: 'text-white',
    order: 1,
    isDefault: true,
    isActive: true,
  },
  {
    id: 'in-progress',
    name: 'in-progress',
    label: 'In Progress',
    color: '#3b82f6',
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
    order: 2,
    isDefault: true,
    isActive: true,
  },
  {
    id: 'completed',
    name: 'completed',
    label: 'Completed',
    color: '#10b981',
    bgColor: 'bg-green-500',
    textColor: 'text-white',
    order: 3,
    isDefault: true,
    isActive: true,
  },
  {
    id: 'blocked',
    name: 'blocked',
    label: 'Blocked',
    color: '#ef4444',
    bgColor: 'bg-red-500',
    textColor: 'text-white',
    order: 4,
    isDefault: true,
    isActive: true,
  },
];

// Default priorities
const defaultPriorities: PriorityType[] = [
  {
    id: 'low',
    name: 'low',
    label: 'Low',
    color: '#6b7280',
    borderColor: 'border-l-4 border-l-gray-400',
    order: 1,
    isDefault: true,
    isActive: true,
  },
  {
    id: 'medium',
    name: 'medium',
    label: 'Medium',
    color: '#f59e0b',
    borderColor: 'border-l-4 border-l-yellow-400',
    order: 2,
    isDefault: true,
    isActive: true,
  },
  {
    id: 'high',
    name: 'high',
    label: 'High',
    color: '#f97316',
    borderColor: 'border-l-4 border-l-orange-400',
    order: 3,
    isDefault: true,
    isActive: true,
  },
  {
    id: 'critical',
    name: 'critical',
    label: 'Critical',
    color: '#dc2626',
    borderColor: 'border-l-4 border-l-red-600',
    order: 4,
    isDefault: true,
    isActive: true,
  },
];

interface StatusProviderProps {
  children: ReactNode;
}

export function StatusProvider({ children }: StatusProviderProps) {
  const [statuses, setStatuses] = useState<StatusType[]>(defaultStatuses);
  const [priorities, setPriorities] = useState<PriorityType[]>(defaultPriorities);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedStatuses = localStorage.getItem('gantt-custom-statuses');
      const savedPriorities = localStorage.getItem('gantt-custom-priorities');
      
      if (savedStatuses) {
        const parsed = JSON.parse(savedStatuses);
        setStatuses(parsed);
      }
      
      if (savedPriorities) {
        const parsed = JSON.parse(savedPriorities);
        setPriorities(parsed);
      }
    } catch (error) {
      console.error('Failed to load custom statuses/priorities:', error);
    }
  }, []);

  // Save to localStorage when statuses change
  useEffect(() => {
    try {
      localStorage.setItem('gantt-custom-statuses', JSON.stringify(statuses));
    } catch (error) {
      console.error('Failed to save custom statuses:', error);
    }
  }, [statuses]);

  // Save to localStorage when priorities change
  useEffect(() => {
    try {
      localStorage.setItem('gantt-custom-priorities', JSON.stringify(priorities));
    } catch (error) {
      console.error('Failed to save custom priorities:', error);
    }
  }, [priorities]);

  // Status management functions
  const addStatus = (status: Omit<StatusType, 'id'>) => {
    const newStatus: StatusType = {
      ...status,
      id: `status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setStatuses(prev => [...prev, newStatus].sort((a, b) => a.order - b.order));
  };

  const updateStatus = (id: string, updates: Partial<StatusType>) => {
    setStatuses(prev => prev.map(status => 
      status.id === id ? { ...status, ...updates } : status
    ));
  };

  const deleteStatus = (id: string) => {
    const status = statuses.find(s => s.id === id);
    if (status?.isDefault) {
      throw new Error('Cannot delete default status');
    }
    setStatuses(prev => prev.filter(status => status.id !== id));
  };

  const getStatusById = (id: string) => {
    return statuses.find(status => status.id === id);
  };

  const getActiveStatuses = () => {
    return statuses.filter(status => status.isActive).sort((a, b) => a.order - b.order);
  };

  // Priority management functions
  const addPriority = (priority: Omit<PriorityType, 'id'>) => {
    const newPriority: PriorityType = {
      ...priority,
      id: `priority-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setPriorities(prev => [...prev, newPriority].sort((a, b) => a.order - b.order));
  };

  const updatePriority = (id: string, updates: Partial<PriorityType>) => {
    setPriorities(prev => prev.map(priority => 
      priority.id === id ? { ...priority, ...updates } : priority
    ));
  };

  const deletePriority = (id: string) => {
    const priority = priorities.find(p => p.id === id);
    if (priority?.isDefault) {
      throw new Error('Cannot delete default priority');
    }
    setPriorities(prev => prev.filter(priority => priority.id !== id));
  };

  const getPriorityById = (id: string) => {
    return priorities.find(priority => priority.id === id);
  };

  const getActivePriorities = () => {
    return priorities.filter(priority => priority.isActive).sort((a, b) => a.order - b.order);
  };

  // Utility functions
  const resetToDefaults = () => {
    setStatuses(defaultStatuses);
    setPriorities(defaultPriorities);
    localStorage.removeItem('gantt-custom-statuses');
    localStorage.removeItem('gantt-custom-priorities');
  };

  const reorderStatuses = (statusIds: string[]) => {
    const reorderedStatuses = statusIds.map((id, index) => {
      const status = statuses.find(s => s.id === id);
      return status ? { ...status, order: index + 1 } : null;
    }).filter(Boolean) as StatusType[];
    
    setStatuses(reorderedStatuses);
  };

  const reorderPriorities = (priorityIds: string[]) => {
    const reorderedPriorities = priorityIds.map((id, index) => {
      const priority = priorities.find(p => p.id === id);
      return priority ? { ...priority, order: index + 1 } : null;
    }).filter(Boolean) as PriorityType[];
    
    setPriorities(reorderedPriorities);
  };

  return (
    <StatusContext.Provider value={{
      statuses,
      priorities,
      addStatus,
      updateStatus,
      deleteStatus,
      getStatusById,
      getActiveStatuses,
      addPriority,
      updatePriority,
      deletePriority,
      getPriorityById,
      getActivePriorities,
      resetToDefaults,
      reorderStatuses,
      reorderPriorities,
    }}>
      {children}
    </StatusContext.Provider>
  );
}

export function useStatus() {
  const context = useContext(StatusContext);
  if (context === undefined) {
    throw new Error('useStatus must be used within a StatusProvider');
  }
  return context;
}