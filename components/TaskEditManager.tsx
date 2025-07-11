import { useGantt } from '../contexts/GanttContext';
import { EditTaskForm } from './EditTaskForm';

interface TaskEditManagerProps {
  children: React.ReactNode;
}

export function TaskEditManager({ children }: TaskEditManagerProps) {
  const { editingTask, setEditingTask } = useGantt();

  return (
    <>
      {children}
      
      {/* Global EditTaskForm */}
      {editingTask && (
        <EditTaskForm
          open={!!editingTask}
          onOpenChange={(open) => {
            if (!open) {
              setEditingTask(null);
            }
          }}
          task={editingTask}
        />
      )}
    </>
  );
}
