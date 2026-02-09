import { RouterProvider } from 'react-router';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { router } from './routes';

export default function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen bg-gray-50">
        <RouterProvider router={router} />
      </div>
    </DndProvider>
  );
}
