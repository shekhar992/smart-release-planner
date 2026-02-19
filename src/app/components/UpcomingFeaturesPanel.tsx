import { useState, useEffect, useRef } from 'react';
import { Sparkles, Zap } from 'lucide-react';

interface UpcomingFeature {
  id: string;
  title: string;
  status: 'Coming soon' | 'In progress' | 'Planned';
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
    title: 'Add Milestones',
    status: 'Coming soon',
    description: 'Mark critical checkpoints, key deliverables, and project gates with visual milestone markers on timeline.'
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
    // Load from localStorage or use defaults
    const stored = localStorage.getItem('upcomingFeatures');
    if (stored) {
      try {
        setFeatures(JSON.parse(stored));
      } catch {
        setFeatures(DEFAULT_FEATURES);
      }
    } else {
      setFeatures(DEFAULT_FEATURES);
      localStorage.setItem('upcomingFeatures', JSON.stringify(DEFAULT_FEATURES));
    }
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
    if (status === 'In progress') return <Zap className="w-3 h-3" />;
    return <Sparkles className="w-3 h-3" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Coming soon':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
      case 'In progress':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
      case 'Planned':
        return 'bg-gray-50 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-50 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
          isOpen
            ? 'bg-primary/10 text-primary shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
        title="View upcoming features"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">What's Next</span>
        {features.length > 0 && (
          <span className="flex items-center justify-center w-4 h-4 text-[10px] font-semibold bg-primary text-white rounded-full">
            {features.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden animate-fade-in"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">What's Next</h3>
                <p className="text-xs text-muted-foreground">Exciting features coming soon</p>
              </div>
            </div>
          </div>

          {/* Feature List */}
          <div className="max-h-[420px] overflow-y-auto">
            {features.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">No upcoming features at the moment.</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {features.map((feature) => (
                  <div
                    key={feature.id}
                    className="group p-3 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/20 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${getStatusColor(feature.status)}`}>
                        {getStatusIcon(feature.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {feature.title}
                          </h4>
                          <span
                            className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full ${getStatusColor(feature.status)}`}
                          >
                            {feature.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              💡 Features driven by your feedback
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
