import { Package, Users, FileText, Sparkles, GitBranch, LayoutTemplate } from 'lucide-react';

interface FreshLandingProps {
  openCreateProduct: () => void;
}

export function FreshLanding({ openCreateProduct: _openCreateProduct }: FreshLandingProps) {
  const handleCreateProduct = () => {
    sessionStorage.setItem('openProductModalOnLoad', 'true');
    localStorage.setItem('appMode', 'demo');
    window.location.reload();
  };

  const steps = [
    {
      icon: Package,
      step: '01',
      title: 'Create a Product',
      action: 'New Product → name it → pick type (Web, Mobile, API)',
      description: 'Top-level workspace — releases, sprints, and team all live under a product.',
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      border: 'border-blue-200 dark:border-blue-900',
    },
    {
      icon: Users,
      step: '02',
      title: 'Build Your Team',
      action: 'Team → add members with roles + availability + PTO blocks',
      description: 'The planner uses real working-day capacity per sprint — no over-allocation.',
      iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600',
      border: 'border-purple-200 dark:border-purple-900',
    },
    {
      icon: FileText,
      step: '03',
      title: 'Import a PRD',
      action: 'Import PRD → upload PDF / Word doc / paste markdown',
      description: 'AI extracts features and generates role-tagged JIRA-style tickets in ~15 sec.',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
      border: 'border-amber-200 dark:border-amber-900',
    },
    {
      icon: Sparkles,
      step: '04',
      title: 'Auto-Plan the Release',
      action: 'Open release → Auto-Resolve Conflicts',
      description: 'One pass assigns, schedules, and flags every conflict with a specific reason.',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
      border: 'border-emerald-200 dark:border-emerald-900',
    },
    {
      icon: GitBranch,
      step: '05',
      title: 'Resolve Conflicts',
      action: 'Resolve Conflicts → step through each card, apply or skip',
      description: 'Each card shows the root cause, an AI fix with confidence %, and manual options.',
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-500',
      border: 'border-rose-200 dark:border-rose-900',
    },
    {
      icon: LayoutTemplate,
      step: '06',
      title: 'Timeline & Risk Brief',
      action: 'Timeline view → Risk Brief for AI analyst summary',
      description: 'Gantt with dev swimlanes, PTO markers, and a streamed 3-bullet risk summary.',
      iconBg: 'bg-gradient-to-br from-sky-500 to-blue-500',
      border: 'border-sky-200 dark:border-sky-900',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center py-8">
      <div className="max-w-2xl w-full mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-[11px] font-semibold mb-3 tracking-wide uppercase">
            <Sparkles className="w-2.5 h-2.5" /> AI-Powered Release Planning
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
            Your 6-step platform tour
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Follow in order · ~10 minutes · each step reveals a new capability
          </p>
          <button
            onClick={() => { localStorage.setItem('appMode', 'demo'); window.location.reload(); }}
            className="mt-1.5 text-xs font-medium text-blue-500 dark:text-blue-400 hover:underline transition-colors"
          >
            Skip — load Demo Mode instead →
          </button>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`bg-white dark:bg-slate-900 border ${step.border} rounded-xl px-3.5 py-3 hover:shadow-sm transition-shadow`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${step.iconBg} flex items-center justify-center shadow-sm mt-0.5`}>
                  <step.icon className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-0.5">Step {step.step}</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white leading-tight mb-1">{step.title}</div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 leading-snug mb-1.5">
                    → {step.action}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handleCreateProduct}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.02]"
          >
            <Package className="w-4 h-4" />
            Start with Step 1 &mdash; Create a Product
          </button>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            No account required · takes you straight to the dashboard
          </p>
        </div>

      </div>
    </div>
  );
}
