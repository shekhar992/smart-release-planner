import { useState, useEffect, useRef } from 'react';
import { Sparkles, Zap, Rocket, Clock } from 'lucide-react';
import { cn } from '../components/ui/utils';

interface UpcomingFeature {
  id: string;
  title: string;
  status: 'Coming soon' | 'In progress' | 'Planned' | 'Now Available';
  description: string;
}

const DEFAULT_FEATURES: UpcomingFeature[] = [
  {
    id: 'scenario-mode',
    title: 'Scenario Model',
    status: 'Coming soon',
    description: 'Run what-if simulations with velocity changes, team adjustments, and scope variations—all without affecting your live plan.'
  },
  {
    id: 'milestones',
    title: 'Milestone Markers & Phase-wise Release',
    status: 'Now Available',
    description: 'Now available! Mark critical checkpoints, key deliverables, and organize your release with visual milestone markers and phase bands on the timeline. Give it a try!'
  },
  {
    id: 'prd-splitter',
    title: 'PRD to Ticket Splitter',
    status: 'Coming soon',
    description: 'Upload PRD documents and auto-generate structured tickets with AI-powered parsing and smart breakdown.'
  }
];

export function UpcomingFeaturesPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [features, setFeatures] = useState<UpcomingFeature[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Always use latest default features to ensure updates are visible
    setFeatures(DEFAULT_FEATURES);
    localStorage.setItem('upcomingFeatures', JSON.stringify(DEFAULT_FEATURES));
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Now Available':
        return <Zap className="w-4 h-4" />;
      case 'In progress':
        return <Rocket className="w-4 h-4" />;
      case 'Coming soon':
        return <Clock className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Now Available':
        return {
          badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900',
          icon: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30',
          card: 'border-emerald-200/60 bg-gradient-to-br from-emerald-50/40 to-white dark:from-emerald-950/20 dark:to-slate-900'
        };
      case 'In progress':
        return {
          badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900',
          icon: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30',
          card: 'border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/70'
        };
      case 'Coming soon':
        return {
          badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900',
          icon: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30',
          card: 'border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/70'
        };
      default:
        return {
          badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
          icon: 'bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-lg shadow-slate-500/20',
          card: 'border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/70'
        };
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes shimmer {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        .animate-slide-in {
          animation: slideIn 0.2s ease-out;
        }
        
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
        
        .glass-panel {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        
        .dark .glass-panel {
          background: rgba(15, 23, 42, 0.85);
        }
        
        .glass-card {
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
      `}</style>
      
      <div className="relative">
        {/* Trigger Button */}
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'group flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
            isOpen
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-white/70 text-slate-700 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 shadow-sm dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-700 dark:hover:border-blue-700 dark:hover:bg-blue-950/30'
          )}
          title="View upcoming features"
        >
          <Sparkles className={cn(
            'w-4 h-4 transition-transform duration-200',
            isOpen && 'rotate-12 animate-shimmer'
          )} />
          <span className="hidden sm:inline">What's Next</span>
          {features.length > 0 && (
            <span className={cn(
              'flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full transition-all duration-200',
              isOpen
                ? 'bg-white/20 text-white'
                : 'bg-blue-600 text-white group-hover:bg-blue-700'
            )}>
              {features.length}
            </span>
          )}
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div
            ref={panelRef}
            className="absolute right-0 top-full mt-3 w-[400px] glass-panel border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-in dark:border-slate-700/50"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">What's Next</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Features in the pipeline</p>
                </div>
              </div>
            </div>

            {/* Feature List */}
            <div className="max-h-[480px] overflow-y-auto p-4">
              {features.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center dark:from-slate-800 dark:to-slate-700">
                    <Sparkles className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No upcoming features</p>
                  <p className="text-xs text-slate-500 mt-1 dark:text-slate-500">Check back soon for updates</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {features.map((feature, index) => {
                    const styles = getStatusStyles(feature.status);
                    const isNew = feature.status === 'Now Available';
                    
                    return (
                      <div
                        key={feature.id}
                        className={cn(
                          'group relative p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 glass-card',
                          styles.card,
                          isNew && 'shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:shadow-emerald-500/20',
                          !isNew && 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600'
                        )}
                        style={{
                          animationDelay: `${index * 50}ms`
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {/* Status Icon */}
                          <div className={cn(
                            'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110',
                            styles.icon
                          )}>
                            {getStatusIcon(feature.status)}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                                {feature.title}
                              </h4>
                              <span className={cn(
                                'flex-shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all duration-200',
                                styles.badge,
                                isNew && 'animate-shimmer'
                              )}>
                                {feature.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                        
                        {/* Subtle hover indicator */}
                        {!isNew && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-medium">Powered by your feedback</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
