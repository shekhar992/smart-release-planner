import { useDrag, useDrop } from 'react-dnd';
import { useRef } from 'react';

interface TestItem {
  id: string;
  text: string;
}

export function DragTest() {
  const [{ isDragging }, drag] = useDrag<TestItem, unknown, { isDragging: boolean }>({
    type: 'TEST',
    item: { id: '1', text: 'Test Item' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop<TestItem, unknown, { isOver: boolean }>({
    accept: 'TEST',
    drop: (item) => {
      console.log('✅ Dropped:', item.text);
      alert('Drag and drop is working!');
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const dragRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  drag(dragRef);
  drop(dropRef);

  return (
    <div className="p-4 space-y-4">
      <div
        ref={dragRef}
        className={`p-4 bg-blue-500 text-white rounded cursor-grab ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
        Drag me! (Test Item)
      </div>
      
      <div
        ref={dropRef}
        className={`p-8 border-2 border-dashed ${
          isOver ? 'border-green-500 bg-green-50' : 'border-gray-300'
        } rounded`}
      >
        Drop zone {isOver ? '(Ready to drop!)' : ''}
      </div>
    </div>
  );
}
