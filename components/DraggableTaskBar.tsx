import { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { useGantt } from '../contexts/GanttContext';
import { useStatus } from '../contexts/StatusContext';
import { Task, DragItem } from '../types';
import { format, differenceInDays, differenceInWeeks } from 'date-fns';
import { AlertTriangle, GripVertical } from 'lucide-react';

interface DraggableTaskBarProps {
  task: Task;
  onTaskClick: (task: Task) => void;
  onTaskDoubleClick?: (task: Task) => void;
}

export function DraggableTaskBar({ task, onTaskClick, onTaskDoubleClick }: DraggableTaskBarProps) {
  const { getTaskConflicts, currentView, getDateRange } = useGantt();
  const { getStatusById, getPriorityById } = useStatus();
  const ref = useRef<HTMLDivElement>(null);

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

  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: (): DragItem => {
      console.log('Starting drag for task:', task.title, 'in', currentView, 'view');
      return {
        id: task.id,
        type: 'TASK',
        task,
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      console.log('Drag ended:', { item: item?.task.title, dropResult });
    },
  });

  // Apply drag to the ref
  if (ref.current) {
    drag(ref);
  }

  const conflict = getTaskConflicts(task.id);
  const hasConflict = !!conflict;

  const getDateFormatForView = () => {
    switch (currentView) {
      case 'day':
        return 'dd/MM';
      case 'week':
        return 'dd/MM';
      default:
        return 'dd/MM';
    }
  };

  // Get styling from dynamic configuration or fallback to defaults
  const getStatusStyle = () => {
    if (statusConfig) {
      return {
        backgroundColor: statusConfig.color,
        color: statusConfig.textColor,
      };
    }
    // Fallback for unknown statuses
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
    // Fallback for unknown priorities
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
        ref={ref}
        className={`absolute top-0 h-full rounded transition-all duration-200 select-none ${
          isDragging 
            ? 'opacity-30 scale-105 z-50 cursor-grabbing transform rotate-2 shadow-lg' 
            : 'opacity-90 hover:opacity-100 cursor-grab hover:shadow-md'
        } ${
          hasConflict ? 'ring-2 ring-red-500 ring-offset-1' : ''
        }`}
        style={{
          left: taskStyle.left,
          width: taskStyle.width,
          backgroundColor: taskStyle.backgroundColor,
          color: taskStyle.color,
          borderLeft: `${taskStyle.borderLeftWidth} solid ${taskStyle.borderLeftColor}`,
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!isDragging) {
            onTaskClick(task);
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (!isDragging && onTaskDoubleClick) {
            onTaskDoubleClick(task);
          }
        }}
        title={`${task.title} (${task.startDate ? format(task.startDate, getDateFormatForView()) : 'No start'} - ${task.endDate ? format(task.endDate, getDateFormatForView()) : 'No end'}) - Status: ${statusConfig?.label || task.status} - Priority: ${priorityConfig?.label || task.priority} - Click to edit • Drag to reschedule`}
      >
        <div className="px-2 py-1 text-xs truncate flex items-center gap-1 h-full">
          <GripVertical className="w-3 h-3 opacity-60 flex-shrink-0" />
          {hasConflict && <AlertTriangle className="w-3 h-3 text-yellow-300 flex-shrink-0" />}
          <span className="truncate flex-1">{task.title || 'Untitled Task'}</span>
        </div>
        {hasConflict && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white flex items-center justify-center">
            <span className="text-white text-xs">!</span>
          </div>
        )}
      </div>
      
      {/* Visual feedback when dragging */}
      {isDragging && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded bg-blue-50 opacity-50" />
      )}
    </div>
  );
}