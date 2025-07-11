import { useDrag } from 'react-dnd';
import { useGantt } from '../contexts/GanttContext';
import { useStatus } from '../contexts/StatusContext';
import { Task } from '../types';
import { differenceInDays, differenceInWeeks } from 'date-fns';
import { GripVertical } from 'lucide-react';

interface DraggableTaskBarProps {
  task: Task;
  onTaskClick: (task: Task) => void;
  onTaskDoubleClick?: (task: Task) => void;
}

export function DraggableTaskBar({ task, onTaskClick, onTaskDoubleClick }: DraggableTaskBarProps) {
  const { getTaskConflicts, currentView, getDateRange } = useGantt();
  const { getStatusById, getPriorityById } = useStatus();

  // Safety check for task
  if (!task || !task.id) {
    console.error('DraggableTaskBar: Invalid task provided', task);
    return null;
  }

  const dateRange = getDateRange();
  const { start: chartStartDate, units } = dateRange;

  // Get dynamic status and priority configurations
  const statusConfig = getStatusById(task.status);
  const priorityConfig = getPriorityById(task.priority);

  const calculateDifference = (startDate: Date, endDate: Date) => {
    if (!startDate || !endDate) return 1;
    
    switch (currentView) {
      case 'day':
        return Math.max(1, differenceInDays(endDate, startDate) + 1);
      case 'week':
        return Math.max(1, differenceInWeeks(endDate, startDate) + 1);
      default:
        return Math.max(1, differenceInDays(endDate, startDate) + 1);
    }
  };

  const calculateOffset = (date: Date, startDate: Date) => {
    if (!date || !startDate) return 0;
    
    switch (currentView) {
      case 'day':
        return Math.max(0, differenceInDays(date, startDate));
      case 'week':
        return Math.max(0, differenceInWeeks(date, startDate));
      default:
        return Math.max(0, differenceInDays(date, startDate));
    }
  };

  const getTaskPosition = () => {
    if (!task.startDate || !task.endDate || !chartStartDate || !units.length) {
      return { left: '0%', width: '0%' };
    }

    const startOffset = calculateOffset(task.startDate, chartStartDate);
    const duration = calculateDifference(task.startDate, task.endDate);
    const totalUnits = units.length;
    
    return {
      left: `${Math.max(0, Math.min(100, (startOffset / totalUnits) * 100))}%`,
      width: `${Math.max(0.5, Math.min(100, (duration / totalUnits) * 100))}%`,
    };
  };

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: () => {
      console.log('🚀 DRAG STARTED for task:', task.title);
      return {
        id: task.id,
        type: 'TASK',
        task,
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (_, monitor) => {
      console.log('🏁 Drag ended for task:', task.title, 'Success:', monitor.didDrop());
    },
  }));

  const conflict = getTaskConflicts(task.id);
  const hasConflict = !!conflict;

  // Get styling from dynamic configuration or fallback to defaults
  const getStatusStyle = () => {
    if (statusConfig) {
      return {
        backgroundColor: statusConfig.color,
        color: statusConfig.textColor,
      };
    }
    return {
      backgroundColor: '#6b7280',
      color: 'white',
    };
  };

  const getPriorityBorderStyle = () => {
    if (priorityConfig) {
      return {
        borderLeftWidth: '4px',
        borderLeftColor: priorityConfig.color,
      };
    }
    return {
      borderLeftWidth: '4px',
      borderLeftColor: '#6b7280',
    };
  };

  const taskStyle = {
    ...getTaskPosition(),
    ...getStatusStyle(),
    ...getPriorityBorderStyle(),
  };

  return (
    <div className="relative h-8 w-full">
      <div
        ref={drag}
        className={`absolute top-0 h-full rounded cursor-grab border transition-all duration-200 ${
          isDragging ? 'opacity-50 scale-105 z-50' : 'opacity-90 hover:opacity-100'
        } ${hasConflict ? 'ring-2 ring-red-500' : ''}`}
        style={{
          left: taskStyle.left,
          width: taskStyle.width,
          backgroundColor: taskStyle.backgroundColor,
          color: taskStyle.color,
          borderLeft: `${taskStyle.borderLeftWidth} solid ${taskStyle.borderLeftColor}`,
        }}
        onClick={() => {
          if (!isDragging) {
            onTaskClick(task);
          }
        }}
        onDoubleClick={() => {
          if (!isDragging && onTaskDoubleClick) {
            onTaskDoubleClick(task);
          }
        }}
        title={`${task.title} - Drag to reschedule`}
      >
        <div className="px-2 py-1 text-xs flex items-center gap-1 h-full">
          <GripVertical className="w-3 h-3 opacity-60" />
          <span className="truncate flex-1">{task.title}</span>
        </div>
      </div>
    </div>
  );
}
