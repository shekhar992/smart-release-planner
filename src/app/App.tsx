import { RouterProvider } from 'react-router';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { router } from './routes';
import { ModeSelector } from './components/ModeSelector';
import { FreshLanding } from './components/FreshLanding';
import { ModeSwitch } from './components/ModeSwitch';

export default function App() {
  const appMode = localStorage.getItem('appMode');

  return (
    <>
      {/* Mode Switch button (shown when mode is selected) */}
      {appMode && <ModeSwitch />}

      <DndProvider backend={HTML5Backend}>
        <div className="h-screen bg-gray-50">
          {/* First-time user experience: Show mode selector */}
          {!appMode && <ModeSelector />}

          {/* Fresh mode: Show guided landing page */}
          {appMode === 'fresh' && <FreshLanding openCreateProduct={() => {}} />}

          {/* Demo mode: Render full app with router */}
          {appMode === 'demo' && <RouterProvider router={router} />}
        </div>
      </DndProvider>
    </>
  );
}
