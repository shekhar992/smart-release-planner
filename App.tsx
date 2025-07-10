import { ReleaseProvider } from './contexts/ReleaseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { StatusProvider } from './contexts/StatusContext';
import { useReleases } from './contexts/ReleaseContext';
import { ReleasesDashboard } from './components/ReleasesDashboard';
import { ReleaseView } from './components/ReleaseView';
import { DemoDataLoader } from './components/DemoDataLoader';

function AppContent() {
  const { currentRelease } = useReleases();

  return (
    <>
      {currentRelease ? (
        <ReleaseView />
      ) : (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-6 py-8">
            <ReleasesDashboard />
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
          </DemoDataLoader>
        </ReleaseProvider>
      </StatusProvider>
    </ThemeProvider>
  );
}