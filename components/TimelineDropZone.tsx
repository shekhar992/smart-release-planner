import { useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import { useGantt } from '../contexts/GanttContext';
import { DragItem } from '../types';
import { differenceInDays, differenceInWeeks, addDays, addWeeks, format } from 'date-fns';
import { toast } from 'sonner';

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
      default:
        return differenceInDays(endDate, startDate) + 1;
    }
  };

  const addTimeUnit = (date: Date, amount: number) => {
    switch (currentView) {
      case 'day':
        return addDays(date, amount);
      case 'week':
        return addWeeks(date, amount);
      default:
        return addDays(date, amount);
    }
  };

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'TASK',
    canDrop: (item: DragItem) => {
      console.log('🎯 Can drop check for task:', item.task.title);
      return true;
    },
    hover: (item: DragItem, monitor) => {
      const clientOffset = monitor.getClientOffset();
      const targetRect = ref.current?.getBoundingClientRect();
      
      if (!clientOffset || !targetRect) {
        setDragPreview(prev => ({ ...prev, visible: false }));
        return;
      }

      // Calculate preview position with better precision
      const dropX = clientOffset.x - targetRect.left;
      const timelineWidth = targetRect.width;
      const dropPercentage = Math.max(0, Math.min(100, (dropX / timelineWidth) * 100));
      
      // Calculate task duration and preview width more accurately
      const taskDuration = calculateDifference(item.task.startDate, item.task.endDate);
      const unitWidth = 100 / units.length; // Percentage width per unit
      const previewWidth = Math.min(100 - dropPercentage, taskDuration * unitWidth);
      
      // Snap to grid for better alignment
      const snappedPercentage = Math.round(dropPercentage / unitWidth) * unitWidth;
      
      setDragPreview({
        left: `${snappedPercentage}%`,
        width: `${previewWidth}%`,
        visible: true,
      });
    },
    drop: (item: DragItem, monitor) => {
      const clientOffset = monitor.getClientOffset();
      const targetRect = ref.current?.getBoundingClientRect();
      
      setDragPreview(prev => ({ ...prev, visible: false }));
      
      if (!clientOffset || !targetRect) {
        console.log('❌ Drop failed: no client offset or target rect');
        return;
      }

      console.log(`📅 Dropping task "${item.task.title}" - calculating new dates...`);
      console.log('Drop details:', {
        clientOffset,
        targetRect,
        currentView,
        unitsLength: units.length,
        chartStartDate: chartStartDate.toDateString()
      });

      // Calculate the drop position relative to the timeline with better precision
      const dropX = clientOffset.x - targetRect.left;
      const timelineWidth = targetRect.width;
      const dropPercentage = (dropX / timelineWidth) * 100;
      
      // Convert percentage to units offset from chart start with snapping
      const unitWidth = 100 / units.length;
      const unitsOffset = Math.max(0, Math.round(dropPercentage / unitWidth));
      
      // Calculate task duration (preserve original duration)
      const originalDuration = calculateDifference(item.task.startDate, item.task.endDate);
      
      // Calculate new dates with boundary checking
      const maxAllowedOffset = units.length - originalDuration;
      const finalOffset = Math.min(unitsOffset, maxAllowedOffset);
      const finalStartDate = addTimeUnit(chartStartDate, finalOffset);
      const finalEndDate = addTimeUnit(finalStartDate, originalDuration - 1);

      console.log(`📅 Task "${item.task.title}" moved:`, {
        from: `${item.task.startDate?.toDateString()} - ${item.task.endDate?.toDateString()}`,
        to: `${finalStartDate.toDateString()} - ${finalEndDate.toDateString()}`,
        duration: `${originalDuration} ${currentView === 'day' ? 'days' : 'weeks'}`,
        offset: finalOffset,
        dropPercentage,
        unitsOffset
      });

      // Update the task dates
      try {
        updateTaskDates(item.id, finalStartDate, finalEndDate);
        console.log('✅ Task dates updated successfully');
        
        // Show success toast with date information
        toast.success(`📅 Task "${item.task.title}" rescheduled`, {
          description: `New dates: ${format(finalStartDate, 'MMM d')} - ${format(finalEndDate, 'MMM d, yyyy')}`,
          duration: 3000,
        });
      } catch (error) {
        console.error('❌ Error updating task dates:', error);
        toast.error(`Failed to reschedule task "${item.task.title}"`);
      }
      
      return { success: true, newStartDate: finalStartDate, newEndDate: finalEndDate };
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
        isOver && canDrop ? 'bg-blue-50 ring-2 ring-blue-300' : ''
      }`}
      style={{ minHeight: '100px' }} // Ensure there's always a drop area
    >
      {children}
      
      {/* Enhanced drop preview */}
      {dragPreview.visible && isOver && (
        <div
          className="absolute top-1 h-10 bg-gradient-to-r from-blue-200 to-blue-300 border-2 border-blue-500 border-dashed rounded-lg opacity-80 pointer-events-none z-20 shadow-lg"
          style={{
            left: dragPreview.left,
            width: dragPreview.width,
          }}
        >
          <div className="flex items-center justify-center h-full text-xs text-blue-800 font-medium px-2">
            <div className="flex items-center gap-1">
              <span>📅</span>
              <span className="truncate">Drop to reschedule</span>
            </div>
          </div>
          {/* Animated pulse effect */}
          <div className="absolute inset-0 bg-blue-400 rounded-lg opacity-20 animate-pulse"></div>
        </div>
      )}
      
      {/* Enhanced drop zone indicator */}
      {isOver && canDrop && (
        <div className="absolute inset-0 border-2 border-blue-400 border-dashed rounded-lg bg-blue-50 opacity-40 pointer-events-none">
          <div className="absolute top-2 left-2 text-blue-600 text-sm font-medium bg-white px-2 py-1 rounded shadow">
            📍 Drop here to move task
          </div>
        </div>
      )}
      
      {/* Debug info when dragging */}
      {isOver && (
        <div className="absolute top-0 right-0 bg-yellow-100 border border-yellow-400 p-2 text-xs text-yellow-800 rounded z-30">
          <div>Drop Zone Active</div>
          <div>Can Drop: {canDrop ? 'Yes' : 'No'}</div>
          <div>Is Over: {isOver ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
}