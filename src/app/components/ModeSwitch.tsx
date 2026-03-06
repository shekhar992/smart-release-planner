import { LayoutTemplate } from 'lucide-react';

export function ModeSwitch() {
  const handleSwitch = () => {
    localStorage.setItem('appMode', 'fresh');
    window.location.reload();
  };

  return (
    <button
      onClick={handleSwitch}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
      title="Return to the guided setup to create a new product"
    >
      <LayoutTemplate className="w-3.5 h-3.5" />
      Getting started
    </button>
  );
}
