import { useEffect, useState } from 'react';
import { DragLayerMonitor, useDragLayer, XYCoord } from 'react-dnd';
import { format } from 'date-fns';
import { Task } from '../types';

const getItemStyles = (
  initialOffset: XYCoord | null,
  currentOffset: XYCoord | null,
) => {
  if (!initialOffset || !currentOffset) {
    return {
      display: 'none',
    };
  }

  const { x, y } = currentOffset;

  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform,
  };
};

interface DragItem {
  id: string;
  type: string;
  task: Task;
}

export function DragPreview() {
  const [previewDates, setPreviewDates] = useState<{ start: Date; end: Date } | null>(null);

  const {
    itemType,
    isDragging: layerIsDragging,
    item,
    initialOffset,
    currentOffset,
  } = useDragLayer((monitor: DragLayerMonitor) => ({
    item: monitor.getItem() as DragItem,
    itemType: monitor.getItemType(),
    initialOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  useEffect(() => {
    // This could be enhanced to calculate real-time preview dates based on cursor position
    // For now, we'll show the original dates
    if (item?.task && layerIsDragging) {
      setPreviewDates({
        start: item.task.startDate,
        end: item.task.endDate,
      });
    } else {
      setPreviewDates(null);
    }
  }, [item, layerIsDragging]);

  if (!layerIsDragging || itemType !== 'TASK' || !item) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-50">
      <div style={getItemStyles(initialOffset, currentOffset)}>
        {/* Enhanced drag preview with task info */}
        <div className="bg-white shadow-xl border-2 border-blue-400 rounded-lg p-3 max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="font-medium text-sm truncate">{item.task.title}</span>
          </div>
          
          {previewDates && (
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center gap-1">
                <span>📅</span>
                <span>
                  {format(previewDates.start, 'MMM d')} - {format(previewDates.end, 'MMM d, yyyy')}
                </span>
              </div>
              <div className="text-blue-600 font-medium">
                🔄 Drop to reschedule
              </div>
            </div>
          )}
        </div>
        
        {/* Cursor pointer effect */}
        <div className="absolute -top-1 -left-1 w-4 h-4">
          <div className="w-0 h-0 border-l-4 border-l-blue-500 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
        </div>
      </div>
    </div>
  );
}
