import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  LeaveRequest, 
  LeaveBalance, 
  WorkingCalendar, 
  TaskAdjustment, 
  Developer, 
  Task,
} from '../types';
import { useGantt } from './GanttContext';
import { v4 as uuidv4 } from 'uuid';
import { 
  addDays, 
  isWeekend, 
  isWithinInterval,
  startOfDay,
  eachDayOfInterval,
  isSameDay,
  addBusinessDays,
  isAfter,
  isBefore
} from 'date-fns';

interface LeaveContextType {
  // Team Data
  developers: Developer[];
  
  // Leave Requests
  leaves: LeaveRequest[];
  addLeaveRequest: (leave: Omit<LeaveRequest, 'id' | 'createdDate'>) => Promise<LeaveRequest>;
  updateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => Promise<void>;
  deleteLeaveRequest: (id: string) => Promise<void>;
  approveLeave: (id: string, approvedBy: string) => Promise<void>;
  rejectLeave: (id: string) => Promise<void>;
  
  // Leave Balances
  leaveBalances: LeaveBalance[];
  updateLeaveBalance: (developerId: string, balance: Partial<LeaveBalance>) => Promise<void>;
  calculateRemainingLeave: (developerId: string, year?: number) => LeaveBalance;
  
  // Working Calendars
  workingCalendars: WorkingCalendar[];
  updateWorkingCalendar: (developerId: string, calendar: Partial<WorkingCalendar>) => Promise<void>;
  
  // Task Adjustments
  taskAdjustments: TaskAdjustment[];
  adjustTasksForLeave: (developerId: string, leaveRequest: LeaveRequest) => Promise<TaskAdjustment[]>;
  revertTaskAdjustments: (leaveRequestId: string) => Promise<void>;
  
  // Availability Checks
  isDeveloperAvailable: (developerId: string, date: Date) => boolean;
  getDeveloperAvailability: (developerId: string, startDate: Date, endDate: Date) => {
    date: Date;
    isAvailable: boolean;
    reason?: string;
  }[];
  
  // Leave Analytics
  getTeamLeaveOverview: (startDate: Date, endDate: Date) => {
    totalLeaveDays: number;
    upcomingLeaves: LeaveRequest[];
    criticalPeriods: { date: Date; unavailableCount: number }[];
  };
  
  // Task Impact Analysis
  analyzeTaskImpact: (_leaveRequest: LeaveRequest) => {
    affectedTasks: Task[];
    reschedulingRequired: boolean;
    suggestedAdjustments: TaskAdjustment[];
  };
  
  // Business Logic
  calculateWorkingDays: (startDate: Date, endDate: Date, developerId?: string) => number;
  getNextAvailableDate: (developerId: string, fromDate: Date) => Date;
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

interface LeaveProviderProps {
  children: ReactNode;
  releaseId?: string;
}

export function LeaveProvider({ children, releaseId }: LeaveProviderProps) {
  const { developers } = useGantt();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [workingCalendars, setWorkingCalendars] = useState<WorkingCalendar[]>([]);
  const [taskAdjustments, setTaskAdjustments] = useState<TaskAdjustment[]>([]);

  // Load data from localStorage
  useEffect(() => {
    const savedLeaves = localStorage.getItem(`leaves-${releaseId || 'default'}`);
    const savedBalances = localStorage.getItem(`leaveBalances-${releaseId || 'default'}`);
    const savedCalendars = localStorage.getItem(`workingCalendars-${releaseId || 'default'}`);
    const savedAdjustments = localStorage.getItem(`taskAdjustments-${releaseId || 'default'}`);
    
    if (savedLeaves) {
      const parsedLeaves = JSON.parse(savedLeaves).map((leave: any) => ({
        ...leave,
        startDate: new Date(leave.startDate),
        endDate: new Date(leave.endDate),
        createdDate: new Date(leave.createdDate),
        approvedDate: leave.approvedDate ? new Date(leave.approvedDate) : undefined
      }));
      setLeaves(parsedLeaves);
    }
    
    if (savedBalances) setLeaveBalances(JSON.parse(savedBalances));
    if (savedCalendars) setWorkingCalendars(JSON.parse(savedCalendars));
    if (savedAdjustments) {
      const parsedAdjustments = JSON.parse(savedAdjustments).map((adj: any) => ({
        ...adj,
        originalStartDate: new Date(adj.originalStartDate),
        originalEndDate: new Date(adj.originalEndDate),
        adjustedStartDate: new Date(adj.adjustedStartDate),
        adjustedEndDate: new Date(adj.adjustedEndDate),
        adjustmentDate: new Date(adj.adjustmentDate)
      }));
      setTaskAdjustments(parsedAdjustments);
    }
  }, [releaseId]);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem(`leaves-${releaseId || 'default'}`, JSON.stringify(leaves));
  }, [leaves, releaseId]);

  useEffect(() => {
    localStorage.setItem(`leaveBalances-${releaseId || 'default'}`, JSON.stringify(leaveBalances));
  }, [leaveBalances, releaseId]);

  useEffect(() => {
    localStorage.setItem(`workingCalendars-${releaseId || 'default'}`, JSON.stringify(workingCalendars));
  }, [workingCalendars, releaseId]);

  useEffect(() => {
    localStorage.setItem(`taskAdjustments-${releaseId || 'default'}`, JSON.stringify(taskAdjustments));
  }, [taskAdjustments, releaseId]);

  // Leave Request Management
  const addLeaveRequest = async (leaveData: Omit<LeaveRequest, 'id' | 'createdDate'>): Promise<LeaveRequest> => {
    const newLeave: LeaveRequest = {
      ...leaveData,
      id: uuidv4(),
      createdDate: new Date()
    };
    
    setLeaves(prev => [...prev, newLeave]);
    
    return newLeave;
  };

  const updateLeaveRequest = async (id: string, updates: Partial<LeaveRequest>): Promise<void> => {
    setLeaves(prev => prev.map(leave => 
      leave.id === id ? { ...leave, ...updates } : leave
    ));
  };

  const deleteLeaveRequest = async (id: string): Promise<void> => {
    await revertTaskAdjustments(id);
    setLeaves(prev => prev.filter(leave => leave.id !== id));
  };

  const approveLeave = async (id: string, approvedBy: string): Promise<void> => {
    const leave = leaves.find(l => l.id === id);
    if (!leave) return;

    await updateLeaveRequest(id, {
      status: 'approved',
      approvedBy,
      approvedDate: new Date()
    });

    // Automatically adjust affected tasks
    await adjustTasksForLeave(leave.developerId, { ...leave, status: 'approved' });
  };

  const rejectLeave = async (id: string): Promise<void> => {
    await updateLeaveRequest(id, { status: 'rejected' });
  };

  // Working Calendar Management
  const updateWorkingCalendar = async (developerId: string, calendar: Partial<WorkingCalendar>): Promise<void> => {
    setWorkingCalendars(prev => {
      const existing = prev.find(c => c.developerId === developerId);
      if (existing) {
        return prev.map(c => c.developerId === developerId ? { ...c, ...calendar } : c);
      } else {
        const defaultCalendar: WorkingCalendar = {
          developerId,
          workingDays: [1, 2, 3, 4, 5], // Monday to Friday
          workingHours: { start: '09:00', end: '17:00' },
          timeZone: 'UTC',
          publicHolidays: [],
          customNonWorkingDays: [],
          ...calendar
        };
        return [...prev, defaultCalendar];
      }
    });
  };

  // Availability Checks
  const isDeveloperAvailable = (developerId: string, date: Date): boolean => {
    const calendar = workingCalendars.find(c => c.developerId === developerId);
    const dayOfWeek = date.getDay();
    
    // Check working days
    if (calendar && !calendar.workingDays.includes(dayOfWeek)) {
      return false;
    }
    
    // Check public holidays
    if (calendar?.publicHolidays.some(holiday => isSameDay(holiday, date))) {
      return false;
    }
    
    // Check custom non-working days
    if (calendar?.customNonWorkingDays.some(nonWorkingDay => isSameDay(nonWorkingDay, date))) {
      return false;
    }
    
    // Check leave requests
    const approvedLeaves = leaves.filter(leave => 
      leave.developerId === developerId && 
      leave.status === 'approved' &&
      isWithinInterval(date, { start: leave.startDate, end: leave.endDate })
    );
    
    return approvedLeaves.length === 0;
  };

  const getDeveloperAvailability = (developerId: string, startDate: Date, endDate: Date) => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    return days.map(date => ({
      date,
      isAvailable: isDeveloperAvailable(developerId, date),
      reason: !isDeveloperAvailable(developerId, date) ? 'On leave or non-working day' : undefined
    }));
  };

  // Task Adjustment Logic
  const adjustTasksForLeave = async (developerId: string, leaveRequest: LeaveRequest): Promise<TaskAdjustment[]> => {
    const { tasks, updateTask } = useGantt();
    const adjustments: TaskAdjustment[] = [];
    
    // Find all tasks assigned to the developer that overlap with leave dates
    const affectedTasks = tasks.filter(task => 
      task.assignedDeveloperId === developerId &&
      task.status !== 'completed' &&
      (
        (task.startDate <= leaveRequest.endDate && task.endDate >= leaveRequest.startDate) ||
        (task.startDate >= leaveRequest.startDate && task.startDate <= leaveRequest.endDate)
      )
    );

    for (const task of affectedTasks) {
      const originalStart = task.startDate;
      const originalEnd = task.endDate;
      
      // Calculate how many working days the task needs
      const taskDuration = calculateWorkingDays(originalStart, originalEnd, developerId);
      
      // Find the next available date after the leave ends
      const nextAvailableDate = getNextAvailableDate(developerId, addDays(leaveRequest.endDate, 1));
      
      // Calculate new end date based on task duration
      const newEndDate = addBusinessDays(nextAvailableDate, taskDuration - 1);
      
      // Create adjustment record
      const adjustment: TaskAdjustment = {
        taskId: task.id,
        originalStartDate: originalStart,
        originalEndDate: originalEnd,
        adjustedStartDate: nextAvailableDate,
        adjustedEndDate: newEndDate,
        adjustmentDate: new Date(),
        reason: 'leave',
        affectedBy: developerId
      };
      
      adjustments.push(adjustment);
      
      // Update the actual task
      await updateTask(task.id, {
        startDate: nextAvailableDate,
        endDate: newEndDate
      });
    }
    
    setTaskAdjustments(prev => [...prev, ...adjustments]);
    return adjustments;
  };

  const revertTaskAdjustments = async (leaveRequestId: string): Promise<void> => {
    // Remove adjustments related to this leave request
    setTaskAdjustments(prev => prev.filter(adj => adj.affectedBy !== leaveRequestId));
  };

  // Business Logic
  const calculateWorkingDays = (startDate: Date, endDate: Date, developerId?: string): number => {
    const calendar = developerId ? workingCalendars.find(c => c.developerId === developerId) : null;
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.filter(date => {
      if (calendar) {
        return isDeveloperAvailable(developerId!, date);
      } else {
        // Default: exclude weekends
        return !isWeekend(date);
      }
    }).length;
  };

  const getNextAvailableDate = (developerId: string, fromDate: Date): Date => {
    let currentDate = startOfDay(fromDate);
    while (!isDeveloperAvailable(developerId, currentDate)) {
      currentDate = addDays(currentDate, 1);
    }
    return currentDate;
  };

  // Leave Balance Management
  const calculateRemainingLeave = (developerId: string, year = new Date().getFullYear()): LeaveBalance => {
    const existing = leaveBalances.find(b => b.developerId === developerId && b.year === year);
    const approvedLeaves = leaves.filter(l => 
      l.developerId === developerId && 
      l.status === 'approved' &&
      l.startDate.getFullYear() === year
    );
    
    const usedDays = approvedLeaves.reduce((total, leave) => {
      return total + calculateWorkingDays(leave.startDate, leave.endDate, developerId);
    }, 0);
    
    const pendingLeaves = leaves.filter(l => 
      l.developerId === developerId && 
      l.status === 'pending' &&
      l.startDate.getFullYear() === year
    );
    
    const pendingDays = pendingLeaves.reduce((total, leave) => {
      return total + calculateWorkingDays(leave.startDate, leave.endDate, developerId);
    }, 0);
    
    const totalDays = existing?.totalDays || 25; // Default 25 days
    const carryOverDays = existing?.carryOverDays || 0;
    
    return {
      developerId,
      year,
      totalDays: totalDays + carryOverDays,
      usedDays,
      pendingDays,
      remainingDays: totalDays + carryOverDays - usedDays - pendingDays,
      carryOverDays
    };
  };

  const updateLeaveBalance = async (developerId: string, balance: Partial<LeaveBalance>): Promise<void> => {
    setLeaveBalances(prev => {
      const existing = prev.find(b => b.developerId === developerId && b.year === (balance.year || new Date().getFullYear()));
      if (existing) {
        return prev.map(b => 
          b.developerId === developerId && b.year === (balance.year || new Date().getFullYear())
            ? { ...b, ...balance }
            : b
        );
      } else {
        const newBalance: LeaveBalance = {
          developerId,
          year: new Date().getFullYear(),
          totalDays: 25,
          usedDays: 0,
          pendingDays: 0,
          remainingDays: 25,
          ...balance
        };
        return [...prev, newBalance];
      }
    });
  };

  // Analytics
  const getTeamLeaveOverview = (startDate: Date, endDate: Date) => {
    const relevantLeaves = leaves.filter(leave => 
      leave.status === 'approved' &&
      (isWithinInterval(leave.startDate, { start: startDate, end: endDate }) ||
       isWithinInterval(leave.endDate, { start: startDate, end: endDate }))
    );
    
    const totalLeaveDays = relevantLeaves.reduce((total, leave) => {
      const overlapStart = isAfter(leave.startDate, startDate) ? leave.startDate : startDate;
      const overlapEnd = isBefore(leave.endDate, endDate) ? leave.endDate : endDate;
      return total + calculateWorkingDays(overlapStart, overlapEnd, leave.developerId);
    }, 0);
    
    const upcomingLeaves = relevantLeaves.filter(leave => 
      isAfter(leave.startDate, new Date())
    );
    
    // Find critical periods (multiple people on leave)
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const criticalPeriods = days
      .map(date => ({
        date,
        unavailableCount: relevantLeaves.filter(leave =>
          isWithinInterval(date, { start: leave.startDate, end: leave.endDate })
        ).length
      }))
      .filter(period => period.unavailableCount > 1);
    
    return {
      totalLeaveDays,
      upcomingLeaves,
      criticalPeriods
    };
  };

  // Task Impact Analysis
  const analyzeTaskImpact = (_leaveRequest: LeaveRequest) => {
    // This would integrate with your task management system
    // Placeholder implementation
    return {
      affectedTasks: [],
      reschedulingRequired: false,
      suggestedAdjustments: []
    };
  };

  const contextValue: LeaveContextType = {
    developers,
    leaves,
    addLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRequest,
    approveLeave,
    rejectLeave,
    leaveBalances,
    updateLeaveBalance,
    calculateRemainingLeave,
    workingCalendars,
    updateWorkingCalendar,
    taskAdjustments,
    adjustTasksForLeave,
    revertTaskAdjustments,
    isDeveloperAvailable,
    getDeveloperAvailability,
    getTeamLeaveOverview,
    analyzeTaskImpact,
    calculateWorkingDays,
    getNextAvailableDate
  };

  return (
    <LeaveContext.Provider value={contextValue}>
      {children}
    </LeaveContext.Provider>
  );
}

export function useLeave() {
  const context = useContext(LeaveContext);
  if (context === undefined) {
    throw new Error('useLeave must be used within a LeaveProvider');
  }
  return context;
}
