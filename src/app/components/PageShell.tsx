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
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between h-12 px-6">
          {/* Left: Logo + breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/"
              className="flex items-center gap-2 shrink-0 group"
              aria-label="Home"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Layers className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground tracking-tight hidden sm:inline">
                Release Planner
              </span>
            </Link>

            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center gap-1 text-sm min-w-0" aria-label="Breadcrumb">
                {!isHome && (
                  <>
                    <span className="text-muted-foreground/40 select-none">/</span>
                    <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors truncate">
                      <Home className="w-3.5 h-3.5" />
                    </Link>
                  </>
                )}
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1 min-w-0">
                    <span className="text-muted-foreground/40 select-none">/</span>
                    {crumb.to ? (
                      <Link
                        to={crumb.to}
                        className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-40"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-foreground font-medium truncate max-w-48">{crumb.label}</span>
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
