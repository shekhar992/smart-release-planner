import { useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import { useGantt } from '../contexts/GanttContext';
import { DragItem } from '../types';
import { differenceInDays, differenceInWeeks, differenceInMonths, differenceInYears, addDays, addWeeks, addMonths, addYears } from 'date-fns';

interface TimelineDropZoneProps {
  children: React.ReactNode;
  className?: string;
}

export function TimelineDropZone({ children, className }: TimelineDropZoneProps) {
  const { updateTaskDates, currentView, getDateRange } = useGantt();
  const ref = useRef<HTMLDivElement>(null);
  const [dragPreview, setDragPreview] = useState<{ left: string; width: string; visible: boolean }>({
    left: '0%',
    width: '0%',
    visible: false,
  });

  const { start: chartStartDate, units } = getDateRange();

  const calculateDifference = (startDate: Date, endDate: Date) => {
    switch (currentView) {
      case 'day':
        return differenceInDays(endDate, startDate) + 1;
      case 'week':
        return differenceInWeeks(endDate, startDate) + 1;
      case 'month':
        return differenceInMonths(endDate, startDate) + 1;
      case 'year':
        return differenceInYears(endDate, startDate) + 1;
      default:
        return differenceInDays(endDate, startDate) + 1;
    }
  };

  const calculateOffset = (date: Date, startDate: Date) => {
    switch (currentView) {
      case 'day':
        return differenceInDays(date, startDate);
      case 'week':
        return differenceInWeeks(date, startDate);
      case 'month':
        return differenceInMonths(date, startDate);
      case 'year':
        return differenceInYears(date, startDate);
      default:
        return differenceInDays(date, startDate);
    }
  };

  const addTimeUnit = (date: Date, amount: number) => {
    switch (currentView) {
      case 'day':
        return addDays(date, amount);
      case 'week':
        return addWeeks(date, amount);
      case 'month':
        return addMonths(date, amount);
      case 'year':
        return addYears(date, amount);
      default:
        return addDays(date, amount);
    }
  };

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'TASK',
    hover: (item: DragItem, monitor) => {
      const clientOffset = monitor.getClientOffset();
      const targetRect = ref.current?.getBoundingClientRect();
      
      if (!clientOffset || !targetRect) {
        setDragPreview(prev => ({ ...prev, visible: false }));
        return;
      }

      // Calculate preview position
      const dropX = clientOffset.x - targetRect.left;
      const timelineWidth = targetRect.width;
      const dropPercentage = Math.max(0, Math.min(100, (dropX / timelineWidth) * 100));
      
      const taskDuration = calculateDifference(item.task.startDate, item.task.endDate);
      const previewWidth = Math.min(100 - dropPercentage, (taskDuration / units.length) * 100);
      
      setDragPreview({
        left: `${dropPercentage}%`,
        width: `${previewWidth}%`,
        visible: true,
      });
    },
    drop: (item: DragItem, monitor) => {
      const clientOffset = monitor.getClientOffset();
      const targetRect = ref.current?.getBoundingClientRect();
      
      setDragPreview(prev => ({ ...prev, visible: false }));
      
      if (!clientOffset || !targetRect) return;

      // Calculate the drop position relative to the timeline
      const dropX = clientOffset.x - targetRect.left;
      const timelineWidth = targetRect.width;
      const dropPercentage = (dropX / timelineWidth) * 100;
      
      // Convert percentage to units offset from chart start
      const unitsOffset = Math.max(0, Math.round((dropPercentage / 100) * units.length));
      const taskDuration = calculateDifference(item.task.startDate, item.task.endDate) - 1;
      
      // Calculate new dates
      const newStartDate = addTimeUnit(chartStartDate, unitsOffset);

      // Ensure we don't go beyond the chart end
      const maxAllowedStart = addTimeUnit(chartStartDate, units.length - taskDuration - 1);
      const finalStartDate = calculateOffset(newStartDate, chartStartDate) > calculateOffset(maxAllowedStart, chartStartDate) ? maxAllowedStart : newStartDate;
      const finalEndDate = addTimeUnit(finalStartDate, taskDuration);

      // Update the task dates
      updateTaskDates(item.id, finalStartDate, finalEndDate);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Combine refs
  drop(ref);

  return (
    <div
      ref={ref}
      className={`relative ${className} ${
        isOver && canDrop ? 'bg-blue-50' : ''
      }`}
    >
      {children}
      
      {/* Drop preview */}
      {dragPreview.visible && isOver && (
        <div
          className="absolute top-4 h-8 bg-blue-200 border-2 border-blue-400 border-dashed rounded opacity-60 pointer-events-none z-10"
          style={{
            left: dragPreview.left,
            width: dragPreview.width,
          }}
        >
          <div className="text-xs text-blue-800 px-1 py-1 truncate">
            Drop here
          </div>
        </div>
      )}
      
      {/* Drop zone indicator */}
      {isOver && canDrop && (
        <div className="absolute inset-0 border-2 border-blue-300 border-dashed rounded bg-blue-50 opacity-30 pointer-events-none" />
      )}
    </div>
  );
}