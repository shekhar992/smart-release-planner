import { Link } from 'react-router';
import { Plus, Calendar, Package, FolderPlus, Users, ChevronRight, BarChart3, Layers, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { mockProducts, Product, Release, mockHolidays, mockTeamMembers, TeamMember } from '../data/mockData';
import { CreateProductModal } from './CreateProductModal';
import { CreateReleaseModal } from './CreateReleaseModal';
import { AutoReleaseModal } from './AutoReleaseModal';
import { PageShell } from './PageShell';
import { loadProducts, initializeStorage, saveProducts, saveTeamMembers, loadTeamMembers } from '../lib/localStorage';

export function PlanningDashboard() {
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showCreateRelease, setShowCreateRelease] = useState<string | null>(null);
  const [showAutoRelease, setShowAutoRelease] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Initialize and load products from localStorage
  useEffect(() => {
    // Initialize storage with mock data if empty
    initializeStorage(mockProducts, mockHolidays, mockTeamMembers);
    
    // Load products from localStorage
    const storedProducts = loadProducts();
    setProducts(storedProducts || mockProducts);
  }, []);

  const countTickets = (release: Release) => 
    release.features.reduce((sum, feature) => sum + feature.tickets.length, 0);

  const handleCreateProduct = (name: string, teamMemberDrafts: Omit<TeamMember, 'id' | 'productId'>[]) => {
    const productId = `p${Date.now()}`;
    const newProduct: Product = {
      id: productId,
      name,
      releases: []
    };
    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    // Create and save team members scoped to this product
    if (teamMemberDrafts.length > 0) {
      const existingTeam = loadTeamMembers() || [];
      const newMembers: TeamMember[] = teamMemberDrafts.map((m, i) => ({
        id: `tm-${productId}-${Date.now()}-${i}`,
        name: m.name,
        role: m.role,
        notes: m.notes,
        pto: m.pto || [],
        productId,
      }));
      saveTeamMembers([...existingTeam, ...newMembers]);
    }
  };

  const handleCreateRelease = (productId: string, name: string, startDate: Date, endDate: Date, _importedData?: any, sprints?: import('../data/mockData').Sprint[], storyPointMapping?: import('../data/mockData').StoryPointMapping) => {
    const releaseId = `r-${Date.now()}`;

    const newRelease: Release = {
      id: releaseId,
      name,
      startDate,
      endDate,
      features: [],
      sprints: sprints && sprints.length > 0 ? sprints : [],
      storyPointMapping,
    };

    // Update products state
    const updatedProducts = products.map(p => {
      if (p.id === productId) {
        return { ...p, releases: [...p.releases, newRelease] };
      }
      return p;
    });
    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    setShowCreateRelease(null);
  };

  // ── Product edit / delete ──
  const handleRenameProduct = (productId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const updatedProducts = products.map(p =>
      p.id === productId ? { ...p, name: trimmed } : p
    );
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
  };

  const handleDeleteProduct = (productId: string) => {
    const updatedProducts = products.filter(p => p.id !== productId);
    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    // Also remove team members scoped to this product
    const existingTeam = loadTeamMembers() || [];
    saveTeamMembers(existingTeam.filter(m => m.productId !== productId));
  };

  // ── Derived data ──
  const allReleases = products.flatMap(p => p.releases);
  const totalTickets = allReleases.reduce((sum, r) => sum + countTickets(r), 0);

  // Load team member counts per product (memoized)
  const teamCounts = useMemo(() => {
    const all = loadTeamMembers() || mockTeamMembers;
    const map: Record<string, number> = {};
    products.forEach(p => {
      map[p.id] = all.filter(m => m.productId === p.id).length;
    });
    return map;
  }, [products]);

  const hasProducts = products.length > 0;

  return (
    <PageShell>
      {/* ── Greeting ── */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Release Planning
        </h1>
        {hasProducts ? (
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} product{products.length !== 1 ? 's' : ''}
            <span className="mx-1.5 text-border">·</span>
            {allReleases.length} release{allReleases.length !== 1 ? 's' : ''}
            <span className="mx-1.5 text-border">·</span>
            {totalTickets} ticket{totalTickets !== 1 ? 's' : ''}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">Create your first product to get started</p>
        )}
      </div>

      {/* ── Empty state ── */}
      {!hasProducts && (
        <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10 mb-6">
            <Layers className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">No products yet</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm text-center leading-relaxed">
            Products group your releases and teams together. Create one to start planning your roadmap.
          </p>
          <button
            onClick={() => setShowCreateProduct(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary-hover transition-all shadow-sm hover:shadow-md"
          >
            <FolderPlus className="w-4 h-4" />
            Create Your First Product
          </button>
        </div>
      )}

      {/* ── Product workspace grid ── */}
      {hasProducts && (
        <div className="animate-fade-in space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                teamCount={teamCounts[product.id] || 0}
                onNewRelease={() => setShowCreateRelease(product.id)}
                onRename={(name) => handleRenameProduct(product.id, name)}
                onDelete={() => handleDeleteProduct(product.id)}
              />
            ))}

            {/* Ghost card */}
            <button
              onClick={() => setShowCreateProduct(true)}
              className="group flex flex-col items-center justify-center gap-3 min-h-[260px] rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-card/50 hover:bg-primary/[0.02] transition-all duration-200 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                New Product
              </span>
            </button>
          </div>

          {/* ── Quick actions bar ── */}
          <div className="flex items-center gap-3 pt-6 border-t border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-2">Quick&nbsp;Actions</span>
            <Link
              to="/holidays"
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-accent hover:border-primary/20 transition-all"
            >
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              Holidays
            </Link>
            
            {/* Auto Release Planner */}
            <button
              onClick={() => setShowAutoRelease(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-accent hover:border-primary/20 transition-all"
            >
              <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
              Auto Generate Release (Beta)
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showCreateProduct && (
        <CreateProductModal
          onClose={() => setShowCreateProduct(false)}
          onCreate={handleCreateProduct}
        />
      )}

      {showAutoRelease && (
        <AutoReleaseModal
          products={products}
          onClose={() => setShowAutoRelease(false)}
          onSuccess={() => {
            // Refresh products from localStorage
            const storedProducts = loadProducts();
            setProducts(storedProducts || []);
            setShowAutoRelease(false);
          }}
        />
      )}

      {showCreateRelease && products.length > 0 && (
        <CreateReleaseModal
          onClose={() => setShowCreateRelease(null)}
          onCreate={handleCreateRelease}
          products={products}
          defaultProductId={showCreateRelease !== 'any' ? showCreateRelease : undefined}
        />
      )}

    </PageShell>
  );
}

// ═══════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════

/** Format a date range compactly */
function fmtRange(start: Date, end: Date) {
  const s = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const e = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${s} – ${e}`;
}

/** Compute ticket completion % for a release */
function completionPct(release: Release) {
  const total = release.features.reduce((s, f) => s + f.tickets.length, 0);
  if (total === 0) return 0;
  const done = release.features.reduce(
    (s, f) => s + f.tickets.filter(t => t.status === 'completed').length, 0
  );
  return Math.round((done / total) * 100);
}

// ── Product Card ──
function ProductCard({
  product,
  teamCount,
  onNewRelease,
  onRename,
  onDelete,
}: {
  product: Product;
  teamCount: number;
  onNewRelease: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(product.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const ticketCount = product.releases.reduce(
    (s, r) => s + r.features.reduce((s2, f) => s2 + f.tickets.length, 0), 0
  );

  const commitRename = () => {
    if (draftName.trim() && draftName.trim() !== product.name) {
      onRename(draftName.trim());
    }
    setRenaming(false);
    setMenuOpen(false);
  };

  return (
    <div className="group flex flex-col bg-card rounded-xl border border-border hover:border-primary/25 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0">
          <Package className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input
              autoFocus
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') { setDraftName(product.name); setRenaming(false); }
              }}
              className="text-sm font-semibold text-foreground bg-transparent border-b border-primary outline-none w-full"
            />
          ) : (
            <h3 className="text-sm font-semibold text-foreground truncate">{product.name}</h3>
          )}
          <p className="text-xs text-muted-foreground">
            {product.releases.length} release{product.releases.length !== 1 ? 's' : ''}
            <span className="mx-1 text-border">·</span>
            <span className="inline-flex items-center gap-0.5">
              <Users className="w-3 h-3" /> {teamCount}
            </span>
            {ticketCount > 0 && (
              <>
                <span className="mx-1 text-border">·</span>
                {ticketCount} ticket{ticketCount !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>

        {/* Kebab menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              {/* Click-away backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-36 bg-popover border border-border rounded-lg shadow-lg z-50 py-1 animate-fade-in">
                <button
                  onClick={() => { setRenaming(true); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  Rename
                </button>
                <button
                  onClick={() => { setConfirmDelete(true); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="mx-3 mb-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg animate-fade-in">
          <p className="text-xs text-red-700 dark:text-red-400 mb-2">
            Delete <strong>{product.name}</strong>? This removes all releases, tickets, and team members for this product.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { onDelete(); setConfirmDelete(false); }}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 text-xs font-medium text-foreground bg-secondary hover:bg-accent rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Releases list */}
      <div className="flex-1 px-3 pb-2">
        {product.releases.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <p className="text-xs text-muted-foreground mb-3">No releases yet</p>
            <button
              onClick={onNewRelease}
              className="text-xs font-medium text-primary hover:underline"
            >
              + Create first release
            </button>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {product.releases
              .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
              .slice(0, 4)
              .map((release) => (
                <ReleaseRow key={release.id} release={release} />
              ))}
            {product.releases.length > 4 && (
              <li className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                +{product.releases.length - 4} more
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Card footer */}
      <div className="flex items-center gap-1.5 px-3 pb-3 pt-1 mt-auto">
        <Link
          to={product.releases[0] ? `/release/${product.releases[0].id}` : '#'}
          onClick={(e) => {
            if (!product.releases[0]) { e.preventDefault(); onNewRelease(); }
          }}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-foreground bg-secondary hover:bg-accent rounded-lg transition-colors"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Open
        </Link>
        <Link
          to={`/product/${product.id}/team`}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-foreground bg-secondary hover:bg-accent rounded-lg transition-colors"
        >
          <Users className="w-3.5 h-3.5" />
          Team
        </Link>
        <button
          onClick={onNewRelease}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Release
        </button>
      </div>
    </div>
  );
}

// ── Release Row (inside a product card) ──
function ReleaseRow({ release }: { release: Release }) {
  const tickets = release.features.reduce((s, f) => s + f.tickets.length, 0);
  const pct = completionPct(release);
  const now = new Date();
  const isActive = release.startDate <= now && release.endDate >= now;
  const isUpcoming = release.startDate > now;

  return (
    <li>
      <Link
        to={`/release/${release.id}`}
        className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent/60 transition-colors group/row"
      >
        {/* Status dot */}
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            isActive
              ? 'bg-green-500'
              : isUpcoming
                ? 'bg-amber-400'
                : 'bg-muted-foreground/30'
          }`}
        />

        {/* Name + date */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate group-hover/row:text-primary transition-colors">
            {release.name}
          </p>
          <p className="text-[10px] text-muted-foreground">{fmtRange(release.startDate, release.endDate)}</p>
        </div>

        {/* Inline progress */}
        {tickets > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/60 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-muted-foreground w-6 text-right">{pct}%</span>
          </div>
        )}

        {tickets === 0 && (
          <span className="text-[10px] text-muted-foreground italic">empty</span>
        )}

        <ChevronRight className="w-3 h-3 text-muted-foreground/40 group-hover/row:text-primary transition-colors shrink-0" />
      </Link>
    </li>
  );
}

