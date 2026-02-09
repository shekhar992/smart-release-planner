import { Link, useNavigate } from 'react-router';
import { Plus, Calendar, Package, FolderPlus, Users, Layers, CheckSquare, Upload, ArrowRight, TrendingUp, Clock } from 'lucide-react';
import { useState } from 'react';
import { mockProducts, Product, Release } from '../data/mockData';
import { CreateProductModal } from './CreateProductModal';
import { CreateReleaseModal } from './CreateReleaseModal';
import { ImportReleaseWizard } from './ImportReleaseWizard';

export function PlanningDashboard() {
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showCreateRelease, setShowCreateRelease] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const navigate = useNavigate();

  const formatDateRange = (start: Date, end: Date) => {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const countFeatures = (release: Release) => release.features.length;
  
  const countTickets = (release: Release) => 
    release.features.reduce((sum, feature) => sum + feature.tickets.length, 0);

  const handleCreateProduct = (name: string) => {
    const newProduct: Product = {
      id: `p${Date.now()}`,
      name,
      releases: []
    };
    setProducts([...products, newProduct]);
  };

  const handleCreateRelease = (productId: string, name: string, startDate: Date, endDate: Date) => {
    console.log('Create release:', { productId, name, startDate, endDate });
  };

  // Calculate planning metrics
  const totalProducts = products.length;
  const allReleases = products.flatMap(p => p.releases);
  const activeReleases = allReleases.filter(r => {
    const now = new Date();
    return r.startDate <= now && r.endDate >= now;
  }).length;
  const totalSprints = allReleases.reduce((sum, r) => sum + r.sprints.length, 0);
  const totalTickets = allReleases.reduce((sum, r) => sum + countTickets(r), 0);

  // Get recent and upcoming releases
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const recentReleases = allReleases
    .filter(r => r.startDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
    .slice(0, 3);

  const upcomingReleases = allReleases
    .filter(r => r.startDate > now && r.startDate <= sixtyDaysFromNow)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .slice(0, 3);

  const hasAnyReleases = allReleases.length > 0;
  const mostRecentRelease = recentReleases.length > 0 ? recentReleases[0] : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Modern Header with Gradient Border */}
      <div className="sticky top-0 z-10 bg-card border-b border-border backdrop-blur-sm bg-card/95">
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground tracking-tight">Release Planning</h1>
                <p className="text-sm text-muted-foreground">Manage your product roadmap</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Primary CTA */}
              <button
                onClick={() => setShowCreateRelease(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary-hover transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={products.length === 0}
              >
                <Plus className="w-4 h-4" />
                New Release
              </button>
              
              {/* Secondary CTAs */}
              <button
                onClick={() => setShowImportWizard(true)}
                className="flex items-center gap-2 px-3 py-2 border border-border bg-card text-foreground text-sm font-medium rounded-lg hover:bg-accent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={products.length === 0}
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button
                onClick={() => setShowCreateProduct(true)}
                className="flex items-center gap-2 px-3 py-2 border border-border bg-card text-foreground text-sm font-medium rounded-lg hover:bg-accent transition-all duration-200"
              >
                <FolderPlus className="w-4 h-4" />
                New Product
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-8 py-8">
        <div className="max-w-[1400px] mx-auto">
          
          {/* Empty State */}
          {!hasAnyReleases && (
            <div className="mt-24 animate-fade-in">
              <div className="max-w-2xl mx-auto text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10">
                  <Layers className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-3xl font-semibold text-foreground mb-4 tracking-tight">
                  Welcome to Release Planning
                </h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
                  Create your first product to start planning releases and managing your roadmap
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setShowCreateProduct(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary-hover transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <FolderPlus className="w-4 h-4" />
                    Create Your First Product
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Content */}
          {hasAnyReleases && (
            <div className="space-y-8 animate-fade-in">
              
              {/* Planning Overview - Modern Cards */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Overview</h2>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <MetricCard
                    icon={<Package className="w-5 h-5" />}
                    value={totalProducts}
                    label="Products"
                    gradient="from-blue-500 to-cyan-500"
                    onClick={() => navigate('/products')}
                  />
                  <MetricCard
                    icon={<Layers className="w-5 h-5" />}
                    value={activeReleases}
                    label="Active Releases"
                    gradient="from-purple-500 to-pink-500"
                    onClick={() => navigate('/releases')}
                  />
                  <MetricCard
                    icon={<Calendar className="w-5 h-5" />}
                    value={totalSprints}
                    label="Planned Sprints"
                    gradient="from-orange-500 to-red-500"
                    onClick={() => {}}
                  />
                  <MetricCard
                    icon={<CheckSquare className="w-5 h-5" />}
                    value={totalTickets}
                    label="Total Tickets"
                    gradient="from-green-500 to-emerald-500"
                    onClick={() => mostRecentRelease && navigate(`/release/${mostRecentRelease.id}`)}
                  />
                </div>
              </section>

              {/* Active Planning - Hero Section */}
              {mostRecentRelease && (
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Continue Planning</h2>
                  </div>
                  <HeroReleaseCard 
                    release={mostRecentRelease}
                    productName={products.find(p => p.releases.includes(mostRecentRelease))?.name || ''}
                  />
                </section>
              )}

              {/* Recent Releases */}
              {recentReleases.length > 1 && (
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Releases</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {recentReleases.slice(1).map((release) => {
                      const product = products.find(p => p.releases.includes(release));
                      return (
                        <ModernReleaseCard
                          key={release.id}
                          release={release}
                          productName={product?.name || ''}
                        />
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Upcoming Releases */}
              {upcomingReleases.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Upcoming
                    </h2>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {upcomingReleases.map((release) => {
                      const product = products.find(p => p.releases.includes(release));
                      return (
                        <ModernReleaseCard
                          key={release.id}
                          release={release}
                          productName={product?.name || ''}
                          upcoming
                        />
                      );
                    })}
                  </div>
                </section>
              )}

              {/* All Releases */}
              {allReleases.length > 3 && (
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">All Releases</h2>
                    <span className="text-sm text-muted-foreground">{allReleases.length} total</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {allReleases
                      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
                      .slice(3)
                      .map((release) => {
                        const product = products.find(p => p.releases.includes(release));
                        return (
                          <ModernReleaseCard
                            key={release.id}
                            release={release}
                            productName={product?.name || ''}
                          />
                        );
                      })}
                  </div>
                </section>
              )}

              {/* Resources Footer */}
              <section className="pt-8 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">Resources</h3>
                    <p className="text-sm text-muted-foreground">Manage team members and company holidays</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      to="/team"
                      className="flex items-center gap-2 px-4 py-2 border border-border bg-card text-foreground text-sm font-medium rounded-lg hover:bg-accent transition-all duration-200"
                    >
                      <Users className="w-4 h-4" />
                      Team
                    </Link>
                    <Link
                      to="/holidays"
                      className="flex items-center gap-2 px-4 py-2 border border-border bg-card text-foreground text-sm font-medium rounded-lg hover:bg-accent transition-all duration-200"
                    >
                      <Calendar className="w-4 h-4" />
                      Holidays
                    </Link>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateProduct && (
        <CreateProductModal
          onClose={() => setShowCreateProduct(false)}
          onCreate={handleCreateProduct}
        />
      )}
      
      {showCreateRelease && products.length > 0 && (
        <CreateReleaseModal
          onClose={() => setShowCreateRelease(false)}
          onCreate={handleCreateRelease}
          products={products}
        />
      )}
      
      {showImportWizard && products.length > 0 && (
        <ImportReleaseWizard
          onClose={() => setShowImportWizard(false)}
          products={products}
          onCreate={handleCreateRelease}
        />
      )}
    </div>
  );
}

// Modern Metric Card with Gradient
function MetricCard({ 
  icon, 
  value, 
  label, 
  gradient,
  onClick 
}: { 
  icon: React.ReactNode; 
  value: number; 
  label: string; 
  gradient: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-all duration-200 hover:shadow-lg overflow-hidden text-left w-full"
    >
      {/* Gradient Background on Hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-200`}></div>
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2.5 rounded-lg bg-gradient-to-br ${gradient} text-white shadow-sm`}>
            {icon}
          </div>
        </div>
        <div className="text-3xl font-semibold text-foreground mb-1 tracking-tight">{value}</div>
        <div className="text-sm text-muted-foreground font-medium">{label}</div>
      </div>
    </button>
  );
}

// Hero Release Card - Featured prominently
function HeroReleaseCard({ 
  release, 
  productName 
}: { 
  release: Release; 
  productName: string;
}) {
  const countTickets = (r: Release) => r.features.reduce((sum, f) => sum + f.tickets.length, 0);
  const formatDateRange = (start: Date, end: Date) => {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <div className="relative group bg-gradient-to-br from-card to-secondary/30 rounded-2xl p-8 border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl"></div>
      
      <div className="relative">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold mb-3 border border-primary/20">
              <TrendingUp className="w-3 h-3" />
              {productName}
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-2 tracking-tight">
              {release.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{formatDateRange(release.startDate, release.endDate)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <span className="text-xl font-bold">{release.sprints.length}</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{release.sprints.length}</div>
              <div className="text-xs text-muted-foreground">Sprints</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md">
              <span className="text-xl font-bold">{countTickets(release)}</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{countTickets(release)}</div>
              <div className="text-xs text-muted-foreground">Tickets</div>
            </div>
          </div>
        </div>

        <Link
          to={`/release/${release.id}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary-hover transition-all duration-200 shadow-md hover:shadow-lg group"
        >
          Continue Planning
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
      </div>
    </div>
  );
}

// Modern Release Card
function ModernReleaseCard({ 
  release, 
  productName,
  upcoming = false
}: { 
  release: Release; 
  productName: string;
  upcoming?: boolean;
}) {
  const countTickets = (r: Release) => r.features.reduce((sum, f) => sum + f.tickets.length, 0);
  const formatDateRange = (start: Date, end: Date) => {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <Link
      to={`/release/${release.id}`}
      className="group block bg-card rounded-xl p-5 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-200"
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {productName}
          </span>
          {upcoming && (
            <span className="px-2 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-semibold rounded-full border border-orange-500/20">
              UPCOMING
            </span>
          )}
        </div>
        <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-200 leading-tight">
          {release.name}
        </h3>
      </div>
      
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
        <Calendar className="w-3.5 h-3.5" />
        <span>{formatDateRange(release.startDate, release.endDate)}</span>
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-border">
        <div>
          <div className="text-lg font-semibold text-foreground">{release.sprints.length}</div>
          <div className="text-xs text-muted-foreground">Sprints</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-foreground">{countTickets(release)}</div>
          <div className="text-xs text-muted-foreground">Tickets</div>
        </div>
      </div>
    </Link>
  );
}
