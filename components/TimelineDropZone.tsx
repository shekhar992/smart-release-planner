import { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { useGantt } from '../contexts/GanttContext';

interface TimelineDropZoneProps {
  children: React.ReactNode;
  className?: string;
}

export function TimelineDropZone({ children, className }: TimelineDropZoneProps) {
  const { updateTaskDates } = useGantt();
  const ref = useRef<HTMLDivElement>(null);

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item: any, monitor) => {
      console.log('✅ DROPPED TASK:', item.task.title);
      
      const clientOffset = monitor.getClientOffset();
      const targetRect = ref.current?.getBoundingClientRect();
      
      if (!clientOffset || !targetRect) {
        console.log('❌ No client offset or target rect');
        return;
      }

      // Simple date calculation for testing
      const dropX = clientOffset.x - targetRect.left;
      const timelineWidth = targetRect.width;
      const dropPercentage = (dropX / timelineWidth) * 100;
      
      console.log('📍 Drop position:', {
        dropX,
        timelineWidth,
        dropPercentage: dropPercentage.toFixed(2) + '%'
      });

      // For now, just try updating with a simple offset
      const newStartDate = new Date(item.task.startDate);
      newStartDate.setDate(newStartDate.getDate() + 1); // Move 1 day forward
      const newEndDate = new Date(item.task.endDate);
      newEndDate.setDate(newEndDate.getDate() + 1);

      console.log('📅 Updating task dates:', {
        old: `${item.task.startDate.toDateString()} - ${item.task.endDate.toDateString()}`,
        new: `${newStartDate.toDateString()} - ${newEndDate.toDateString()}`
      });

      updateTaskDates(item.id, newStartDate, newEndDate);
      
      return { success: true };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

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