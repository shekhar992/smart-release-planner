import { StatusProvider } from './contexts/StatusContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { GanttProvider } from './contexts/GanttContext';
import { ReleaseProvider } from './contexts/ReleaseContext';
import { ModernDashboard } from './components/ModernDashboard';
import { Toaster } from './components/ui/sonner';

export default function App() {
  console.log('App component rendered - Full context providers');
  
  return (
    <StatusProvider>
      <ProjectProvider>
        <GanttProvider>
          <ReleaseProvider>
            <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
              <ModernDashboard />
            </div>
            <Toaster />
          </ReleaseProvider>
        </GanttProvider>
      </ProjectProvider>
    </StatusProvider>
  );
}