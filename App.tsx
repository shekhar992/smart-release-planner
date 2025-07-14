import { ReleaseProvider } from './contexts/ReleaseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { StatusProvider } from './contexts/StatusContext';
import { useReleases } from './contexts/ReleaseContext';
import { HighPriorityDashboard } from './components/HighPriorityDashboard';
import { ReleasesDashboard } from './components/ReleasesDashboard';
import { ReleaseView } from './components/ReleaseView';
import { DemoDataLoader } from './components/DemoDataLoader';
import { Toaster } from './components/ui/sonner';
import { useState } from 'react';

function AppContent() {
  const { currentRelease } = useReleases();
  const [showAllReleases, setShowAllReleases] = useState(false);

  return (
    <>
      {currentRelease ? (
        <ReleaseView />
      ) : showAllReleases ? (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-6 py-8">
            <ReleasesDashboard onBackToPriority={() => setShowAllReleases(false)} />
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-6 py-8">
            <HighPriorityDashboard onViewAllReleases={() => setShowAllReleases(true)} />
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="gantt-theme">
      <StatusProvider>
        <ReleaseProvider>
          <DemoDataLoader>
            <AppContent />
            <Toaster />
          </DemoDataLoader>
        </ReleaseProvider>
      </StatusProvider>
    </ThemeProvider>
  );
}