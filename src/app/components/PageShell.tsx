import { Link, useLocation } from 'react-router';
import { Layers, Home } from 'lucide-react';
import { UpcomingFeaturesPanel } from './UpcomingFeaturesPanel';

interface Breadcrumb {
  label: string;
  to?: string;
}

interface PageShellProps {
  children: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  /** Pass extra elements (buttons, etc.) rendered on the right side of the top bar */
  actions?: React.ReactNode;
  /** Flush mode removes content padding — useful for full-bleed pages like the timeline */
  flush?: boolean;
}

export function PageShell({ children, breadcrumbs, actions, flush = false }: PageShellProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex flex-col">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between h-14 px-6">
          {/* Left: Logo + breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/"
              className="flex items-center gap-2.5 shrink-0 group"
              aria-label="Home"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/40 group-hover:scale-105 transition-all duration-200">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight hidden sm:inline">
                Release Planner
              </span>
            </Link>

            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center gap-1.5 text-sm min-w-0" aria-label="Breadcrumb">
                {!isHome && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600 select-none">/</span>
                    <Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <Home className="w-3.5 h-3.5" />
                    </Link>
                  </>
                )}
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1.5 min-w-0">
                    <span className="text-slate-300 dark:text-slate-600 select-none">/</span>
                    {crumb.to ? (
                      <Link
                        to={crumb.to}
                        className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate max-w-40 font-medium"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-slate-900 dark:text-white font-semibold truncate max-w-48">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Upcoming Features - always visible */}
            <UpcomingFeaturesPanel />
            
            {/* Custom actions */}
            {actions}
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className={`flex-1 ${flush ? '' : 'px-6 py-6'}`}>
        <div className={flush ? '' : 'max-w-[1440px] mx-auto'}>
          {children}
        </div>
      </main>
    </div>
  );
}
