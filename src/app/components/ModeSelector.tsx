import { Rocket, Database } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Rocket className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
            AI Release Planning
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose how you want to explore the platform.
          </p>
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Demo Mode */}
          <button
            onClick={handleDemoMode}
            className="group relative bg-card border-2 border-border hover:border-primary rounded-xl p-8 text-left transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Explore Demo Data
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Start with pre-populated products, releases, and team members. Perfect for exploring features instantly.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-primary font-medium">
                <span>Get started with examples</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </button>

          {/* Fresh Mode */}
          <button
            onClick={handleFreshMode}
            className="group relative bg-card border-2 border-border hover:border-primary rounded-xl p-8 text-left transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-950/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Rocket className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Start Fresh
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Begin with a clean slate. Create your own products, add team members, and plan releases from scratch.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-primary font-medium">
                <span>Build your first release</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            You can switch modes anytime by clearing your browser's local storage.
          </p>
        </div>
      </div>
    </div>
  );
}
