import { Package, Users, BarChart3, ArrowRight } from 'lucide-react';

interface FreshLandingProps {
  openCreateProduct: () => void;
}

export function FreshLanding({ openCreateProduct: _openCreateProduct }: FreshLandingProps) {
  const handleCreateProduct = () => {
    // Mark that we want to open product modal after mode switch
    sessionStorage.setItem('openProductModalOnLoad', 'true');
    // Switch to demo mode to access full dashboard functionality
    localStorage.setItem('appMode', 'demo');
    window.location.reload();
  };

  const steps = [
    {
      icon: Package,
      title: 'Create a Product',
      description: 'Set up your first product workspace to organize releases and teams.',
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    },
    {
      icon: Users,
      title: 'Add Team Members',
      description: 'Define your team roster with roles and PTO schedules for accurate capacity planning.',
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
    },
    {
      icon: BarChart3,
      title: 'Use Auto Release Planner',
      description: 'Import your backlog via CSV and let AI generate capacity-aware sprint plans instantly.',
      color: 'text-green-600 bg-green-50 dark:bg-green-950/30',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
            <BarChart3 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
            Start Planning Your First Release
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create a product, add your team, and generate a capacity-aware release plan.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6 mb-12">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-5">
                {/* Step Number */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{idx + 1}</span>
                  </div>
                </div>

                {/* Icon */}
                <div className={`flex-shrink-0 w-14 h-14 rounded-lg ${step.color} flex items-center justify-center`}>
                  <step.icon className="w-7 h-7" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow */}
                {idx < steps.length - 1 && (
                  <div className="flex-shrink-0 hidden md:block">
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handleCreateProduct}
            className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground text-lg font-semibold rounded-xl hover:bg-primary-hover transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
          >
            <Package className="w-5 h-5" />
            Create Product
          </button>
          <p className="text-sm text-muted-foreground mt-4">
            This will take you to the dashboard where you can start building.
          </p>
        </div>

        {/* Quick Switch */}
        <div className="mt-16 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Want to explore with sample data first?
          </p>
          <button
            onClick={() => {
              localStorage.setItem('appMode', 'demo');
              window.location.reload();
            }}
            className="text-sm font-medium text-primary hover:underline"
          >
            Switch to Demo Mode
          </button>
        </div>
      </div>
    </div>
  );
}
