import { Rocket, Database, Sparkles, CheckCircle2 } from 'lucide-react';

export function ModeSelector() {
  const handleDemoMode = () => {
    localStorage.setItem('appMode', 'demo');
    window.location.reload();
  };

  const handleFreshMode = () => {
    localStorage.setItem('appMode', 'fresh');
    window.location.reload();
  };

  const highlights = [
    'AI ticket generation from PDF / Word PRDs',
    'Capacity-aware sprint planning with PTO',
    'Conflict auto-resolver with reasoning',
    'Live Gantt timeline + AI risk brief',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-lg w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-2xl shadow-blue-500/40 mb-5">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
            AI Release Planner
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400">
            Build and ship releases with AI-assisted planning.
          </p>
        </div>

        {/* Capability pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {highlights.map(h => (
            <span
              key={h}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 shadow-sm"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              {h}
            </span>
          ))}
        </div>

        {/* Primary CTA — Start Fresh */}
        <button
          onClick={handleFreshMode}
          className="group w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl p-6 text-left transition-all duration-200 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-0.5 mb-3"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-lg font-semibold text-white">Try It Yourself</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white/20 rounded-full text-white/90">Recommended</span>
              </div>
              <p className="text-sm text-blue-100 leading-snug">
                Guided 6-step tour — create a product, build a team, import a PRD, and let AI plan your first release.
              </p>
            </div>
            <span className="text-white/60 group-hover:translate-x-1 transition-transform duration-200 text-lg">→</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-4 text-xs text-blue-100">
            <span>⏱ ~10 minutes</span>
            <span>·</span>
            <span>No account needed</span>
            <span>·</span>
            <span>Your own data</span>
          </div>
        </button>

        {/* Secondary — Demo data (low-key) */}
        <button
          onClick={handleDemoMode}
          className="group w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl px-5 py-3.5 text-left transition-all duration-200 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <Database className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Browse pre-built demo data instead</span>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">3 products, 6 releases, sample team — ready to explore. No setup required.</p>
            </div>
            <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform duration-200 text-sm">→</span>
          </div>
        </button>

        <p className="mt-5 text-center text-xs text-slate-400 dark:text-slate-600">
          You can switch between modes anytime from the dashboard.
        </p>
      </div>
    </div>
  );
}
