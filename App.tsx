import { StatusProvider } from './contexts/StatusContext';
import { ProjectManagerApp } from './components/ProjectManagerApp';
import { Toaster } from './components/ui/sonner';

export default function App() {
  console.log('App component rendered - Project Management Dashboard Loading');
  
  return (
    <StatusProvider>
      <ProjectManagerApp />
      <Toaster />
    </StatusProvider>
  );
}