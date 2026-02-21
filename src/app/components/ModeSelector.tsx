import { Rocket, Database, Sparkles } from 'lucide-react';
import { cn } from './ui/utils';

export function ModeSelector() {
  const handleDemoMode = () => {
    localStorage.setItem('appMode', 'demo');
    window.location.reload();
  };

  const handleFreshMode = () => {
    localStorage.setItem('appMode', 'fresh');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-2xl shadow-blue-500/40 mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
            AI Release Planning
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Choose how you want to explore the platform.
          </p>
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Demo Mode */}
          <button
            onClick={handleDemoMode}
            className={cn(
              'group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl',
              'border-2 border-slate-200 dark:border-slate-700',
              'hover:border-blue-400 dark:hover:border-blue-600',
              'rounded-2xl p-8 text-left transition-all duration-200',
              'hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1'
            )}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                <Database className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Explore Demo Data
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Start with pre-populated products, releases, and team members. Perfect for exploring features instantly.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-semibold">
                <span>Get started with examples</span>
                <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
              </div>
            </div>
          </button>

          {/* Fresh Mode */}
          <button
            onClick={handleFreshMode}
            className={cn(
              'group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl',
              'border-2 border-slate-200 dark:border-slate-700',
              'hover:border-green-400 dark:hover:border-green-600',
              'rounded-2xl p-8 text-left transition-all duration-200',
              'hover:shadow-2xl hover:shadow-green-500/20 hover:-translate-y-1'
            )}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                <Rocket className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Start Fresh
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Begin with a clean slate. Create your own products, add team members, and plan releases from scratch.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-semibold">
                <span>Build your first release</span>
                <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
              </div>
            </div>
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-500">
            You can switch modes anytime by clearing your browser's local storage.
          </p>
        </div>
      </div>
    </div>
  );
}
