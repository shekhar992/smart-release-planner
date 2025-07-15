import { ReleaseProvider } from './contexts/ReleaseContext';
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
  const [showPriorityDashboard, setShowPriorityDashboard] = useState(false);

  return (
    <>
      {currentRelease ? (
        <ReleaseView />
      ) : showPriorityDashboard ? (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-6 py-8">
            <HighPriorityDashboard onViewAllReleases={() => setShowPriorityDashboard(false)} />
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-6 py-8">
            <ReleasesDashboard onBackToPriority={() => setShowPriorityDashboard(true)} />
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <StatusProvider>
      <ReleaseProvider>
        <DemoDataLoader>
          <AppContent />
          <Toaster />
        </DemoDataLoader>
      </ReleaseProvider>
    </StatusProvider>
  );
}