import { RefreshCw } from 'lucide-react';

export function ModeSwitch() {
  const handleSwitch = () => {
    localStorage.removeItem('appMode');
    window.location.reload();
  };

  return (
    <button
      onClick={handleSwitch}
      className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-accent hover:text-foreground transition-colors shadow-md hover:shadow-lg"
      title="Switch between Demo and Fresh modes"
    >
      <RefreshCw className="w-3 h-3" />
      Switch Mode
    </button>
  );
}
