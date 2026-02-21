import { Link } from 'react-router';
import { Plus, Calendar, Package, FolderPlus, Users, ChevronRight, Layers, MoreVertical, Pencil, Trash2, Sparkles } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { nanoid } from 'nanoid';
import { mockProducts, Product, Release, mockHolidays, mockTeamMembers, TeamMember, Phase, SP_PRESETS, Feature, Ticket } from '../data/mockData';
import { CreateProductModal } from './CreateProductModal';
import { ReleaseCreationWizard } from './ReleaseCreationWizard';
import { PageShell } from './PageShell';
import { loadProducts, initializeStorage, saveProducts, saveTeamMembers, loadTeamMembers, savePhases, loadHolidays } from '../lib/localStorage';
import { ModeSwitch } from './ModeSwitch';
import { buildReleasePlan } from '../../domain/planningEngine';
import type { TicketInput, ReleaseConfig } from '../../domain/types';
import { calculateEndDateFromEffort } from '../lib/dateUtils';
import { cn } from './ui/utils';

interface PlanningDashboardProps {
  openCreateProduct?: () => void;
  showCreateProduct?: boolean;
  onCloseCreateProduct?: () => void;
}

export function PlanningDashboard({ 
  openCreateProduct, 
  showCreateProduct, 
  onCloseCreateProduct 
}: PlanningDashboardProps = {}) {
  // Local state fallback for when rendered via router (without props)
  const [localShowCreateProduct, setLocalShowCreateProduct] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Release creation wizard state
  const [showReleaseWizard, setShowReleaseWizard] = useState(false);
  const [wizardFlow, setWizardFlow] = useState<'manual' | 'smart'>('manual');
  const [wizardProductId, setWizardProductId] = useState<string | null>(null);

  // Use props if provided, otherwise use local state
  const effectiveShowCreateProduct = showCreateProduct ?? localShowCreateProduct;
  const effectiveOpenCreateProduct = openCreateProduct ?? (() => setLocalShowCreateProduct(true));
  const effectiveCloseCreateProduct = onCloseCreateProduct ?? (() => setLocalShowCreateProduct(false));
  
  // Initialize and load products from localStorage
  useEffect(() => {
    initializeStorage(mockProducts, mockHolidays, mockTeamMembers);
    
    // Load products from localStorage
    const storedProducts = loadProducts();
    setProducts(storedProducts || mockProducts);

    // Check if we should open product modal (from FreshLanding transition)
    if (sessionStorage.getItem('openProductModalOnLoad') === 'true') {
      sessionStorage.removeItem('openProductModalOnLoad');
      setLocalShowCreateProduct(true);
    }
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
        experienceLevel: m.experienceLevel ?? 'Mid',
        velocityMultiplier: m.velocityMultiplier ?? 1.0,
      }));
      saveTeamMembers([...existingTeam, ...newMembers]);
    }
  };

  const handleWizardComplete = (data: {
    productId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    sprintLengthDays?: number;
    phases: Phase[];
    tickets?: import('../data/mockData').Ticket[];
    featureGroups?: Record<string, number>;
    parsedTickets?: any[]; // ParsedTicketRow with feature field
  }) => {
    // Process uploaded tickets into features
    let features: Feature[] = [];
    let releasePlan: import('../../domain/types').ReleasePlan | null = null;
    
    if (data.tickets && data.tickets.length > 0 && data.parsedTickets) {
      // Step 1: Use planning engine to calculate sequential dates across sprints
      let ticketsWithSequentialDates = [...data.tickets];
      
      if (data.sprintLengthDays) {
        try {
          // Load team members and holidays for capacity calculation
          const teamMembers = loadTeamMembers() || [];
          const productTeam = teamMembers.filter(tm => tm.productId === data.productId);
          const holidays = loadHolidays() || [];
          
          // Convert tickets to TicketInput format for planning engine
          const ticketInputs: TicketInput[] = data.tickets.map((ticket, index) => {
            const parsedTicket = data.parsedTickets![index];
            return {
              id: ticket.id || nanoid(),
              title: ticket.title,
              epic: parsedTicket?.feature?.trim() || 'Imported Tickets',
              effortDays: ticket.effortDays || 1,
              priority: 1, // Default priority (can be enhanced later with CSV priority column)
              assignedToRaw: ticket.assignedTo,
            };
          });
          
          // Build release plan using planning engine
          const config: ReleaseConfig = {
            releaseStart: data.startDate,
            releaseEnd: data.endDate,
            sprintLengthDays: data.sprintLengthDays,
            numberOfDevelopers: productTeam.length || 1,
            holidays: holidays.map(h => new Date(h.startDate)),
            ptoDates: [], // PTO dates would come from team members if needed
          };
          
          releasePlan = buildReleasePlan(ticketInputs, config);
          
          // Step 2: Anchor tickets to their sprint's startDate (matching main branch pattern)
          const updatedTickets: Ticket[] = [];
          
          // Process tickets by sprint - all tickets in a sprint start at that sprint's startDate
          for (const domainSprint of releasePlan.sprints) {
            for (const ticketInput of domainSprint.tickets) {
              // Find original ticket by matching ID or title
              const originalTicket = data.tickets.find(t => 
                (t.id && t.id === ticketInput.id) || t.title === ticketInput.title
              );
              
              if (originalTicket) {
                // Calculate end date with velocity adjustment
                const effortDays = originalTicket.effortDays || 1;
                const assignedDev = productTeam.find(m => m.name === originalTicket.assignedTo);
                const velocity = assignedDev?.velocityMultiplier ?? 1;
                const adjustedDuration = Math.max(1, Math.round(effortDays / velocity));
                const ticketEndDate = calculateEndDateFromEffort(
                  domainSprint.startDate,
                  adjustedDuration,
                  holidays
                );
                
                updatedTickets.push({
                  ...originalTicket,
                  id: ticketInput.id,
                  startDate: new Date(domainSprint.startDate), // Anchored to sprint start
                  endDate: ticketEndDate,
                });
              }
            }
          }
          
          // Handle overflow tickets (place at release end)
          for (const ticketInput of releasePlan.overflowTickets) {
            const originalTicket = data.tickets.find(t => 
              (t.id && t.id === ticketInput.id) || t.title === ticketInput.title
            );
            
            if (originalTicket) {
              const effortDays = originalTicket.effortDays || 1;
              const assignedDev = productTeam.find(m => m.name === originalTicket.assignedTo);
              const velocity = assignedDev?.velocityMultiplier ?? 1;
              const adjustedDuration = Math.max(1, Math.round(effortDays / velocity));
              const ticketEndDate = calculateEndDateFromEffort(
                data.endDate,
                adjustedDuration,
                holidays
              );
              
              updatedTickets.push({
                ...originalTicket,
                id: ticketInput.id,
                startDate: new Date(data.endDate), // Start at release end
                endDate: ticketEndDate,
              });
            }
          }
          
          ticketsWithSequentialDates = updatedTickets;
        } catch (error) {
          console.warn('Planning engine failed, using simple sequential dates:', error);
          // Fallback: Simple sequential placement without sprint logic
          let currentDate = new Date(data.startDate);
          ticketsWithSequentialDates = data.tickets.map(ticket => {
            const effortDays = ticket.effortDays || 1;
            const assignedDev = productTeam.find(m => m.name === ticket.assignedTo);
            const velocity = assignedDev?.velocityMultiplier ?? 1;
            const adjustedDuration = Math.max(1, Math.round(effortDays / velocity));
            const endDate = calculateEndDateFromEffort(currentDate, adjustedDuration, holidays);
            const updatedTicket = {
              ...ticket,
              id: ticket.id || nanoid(),
              startDate: new Date(currentDate),
              endDate: endDate,
            };
            // Next ticket starts after this one ends (add 1 day)
            currentDate = new Date(endDate.getTime() + (24 * 60 * 60 * 1000));
            return updatedTicket;
          });
        }
      } else {
        // No sprints: Simple sequential placement
        let currentDate = new Date(data.startDate);
        ticketsWithSequentialDates = data.tickets.map(ticket => {
          const effortDays = ticket.effortDays || 1;
          const assignedDev = productTeam.find(m => m.name === ticket.assignedTo);
          const velocity = assignedDev?.velocityMultiplier ?? 1;
          const adjustedDuration = Math.max(1, Math.round(effortDays / velocity));
          const endDate = calculateEndDateFromEffort(currentDate, adjustedDuration, holidays);
          const updatedTicket = {
            ...ticket,
            id: ticket.id || nanoid(),
            startDate: new Date(currentDate),
            endDate: endDate,
          };
          // Next ticket starts after this one ends (add 1 day)
          currentDate = new Date(endDate.getTime() + (24 * 60 * 60 * 1000));
          return updatedTicket;
        });
      }
      
      // Step 3: Group tickets by feature using parsedTickets (which have the feature field from CSV)
      const ticketsByFeature = new Map<string, Ticket[]>();
      
      ticketsWithSequentialDates.forEach((ticket, index) => {
        // Get feature name from corresponding parsedTicket (same index)
        const parsedTicket = data.parsedTickets![index];
        const featureName = parsedTicket?.feature?.trim() || 'Imported Tickets';
        
        if (!ticketsByFeature.has(featureName)) {
          ticketsByFeature.set(featureName, []);
        }
        
        // Ensure ticket has proper ID
        const ticketWithId = {
          ...ticket,
          id: ticket.id || nanoid(),
        };
        
        ticketsByFeature.get(featureName)!.push(ticketWithId);
      });
      
      // Step 4: Create Feature objects
      features = Array.from(ticketsByFeature.entries()).map(([featureName, featureTickets]) => ({
        id: nanoid(),
        name: featureName,
        description: `Auto-created from CSV import with ${featureTickets.length} ticket${featureTickets.length !== 1 ? 's' : ''}`,
        tickets: featureTickets,
        dependencies: [],
      }));
    }
    
    // Create the release object
    const newRelease: Release = {
      id: `r-${Date.now()}`,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      features,
      sprints: releasePlan ? releasePlan.sprints.map(s => ({
        id: s.id,
        name: s.name,
        startDate: s.startDate,
        endDate: s.endDate,
      })) : [],
      storyPointMapping: SP_PRESETS.linear,
      milestones: [],
      phases: data.phases,
    };

    // Save phases if any
    if (data.phases && data.phases.length > 0) {
      savePhases(newRelease.id, data.phases);
    }

    // Update products state
    const updatedProducts = products.map(p => {
      if (p.id === data.productId) {
        return { ...p, releases: [...p.releases, newRelease] };
      }
      return p;
    });
    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    // Clean up
    setShowReleaseWizard(false);
    setWizardProductId(null);
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
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
          Release Planning
        </h1>
        {hasProducts ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {products.length} product{products.length !== 1 ? 's' : ''}
            <span className="mx-1.5 text-slate-300 dark:text-slate-700">·</span>
            {allReleases.length} release{allReleases.length !== 1 ? 's' : ''}
            <span className="mx-1.5 text-slate-300 dark:text-slate-700">·</span>
            {totalTickets} ticket{totalTickets !== 1 ? 's' : ''}
          </p>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create your first product to get started</p>
        )}
      </div>

      {/* ── Empty state ── */}
      {!hasProducts && (
        <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 flex items-center justify-center border border-blue-500/10 mb-6 shadow-lg shadow-blue-500/5">
            <Layers className="w-10 h-10 text-blue-600 dark:text-blue-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">No products yet</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-sm text-center leading-relaxed">
            Products group your releases and teams together. Create one to start planning your roadmap.
          </p>
          <button
            onClick={effectiveOpenCreateProduct}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl"
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
                onNewRelease={() => {
                  setWizardFlow('manual');
                  setWizardProductId(product.id);
                  setShowReleaseWizard(true);
                }}
                onAutoGenerate={() => {
                  setWizardFlow('smart');
                  setWizardProductId(product.id);
                  setShowReleaseWizard(true);
                }}
                onRename={(name) => handleRenameProduct(product.id, name)}
                onDelete={() => handleDeleteProduct(product.id)}
              />
            ))}

            {/* Ghost card */}
            <button
              onClick={effectiveOpenCreateProduct}
              className="group flex flex-col items-center justify-center gap-3 min-h-[260px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all duration-200 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:to-blue-100 dark:group-hover:from-blue-950/30 dark:group-hover:to-blue-900/20 flex items-center justify-center transition-all duration-200 shadow-sm">
                <Plus className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors" />
              </div>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors">
                New Product
              </span>
            </button>
          </div>

          {/* ── Quick actions bar ── */}
          <div className="flex items-center gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-2">Quick&nbsp;Actions</span>
            <Link
              to="/holidays"
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-900 dark:text-white bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Holidays
            </Link>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {effectiveShowCreateProduct && (
        <CreateProductModal
          onClose={effectiveCloseCreateProduct}
          onCreate={handleCreateProduct}
        />
      )}

      {/* Release Creation Wizard - handles both Manual and Smart flows */}
      {showReleaseWizard && wizardProductId && (
        <ReleaseCreationWizard
          isOpen={showReleaseWizard}
          onClose={() => {
            setShowReleaseWizard(false);
            setWizardProductId(null);
          }}
          onComplete={handleWizardComplete}
          flow={wizardFlow}
          products={products}
          defaultProductId={wizardProductId}
        />
      )}

      {/* Mode Switch - Only visible on product landing page */}
      <ModeSwitch />

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
  onAutoGenerate,
  onRename,
  onDelete,
}: {
  product: Product;
  teamCount: number;
  onNewRelease: () => void;
  onAutoGenerate: () => void;
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
    <div className="group flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
          <Package className="w-4 h-4 text-white" />
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
              className="text-sm font-semibold text-slate-900 dark:text-white bg-transparent border-b border-blue-500 outline-none w-full"
            />
          ) : (
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{product.name}</h3>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {product.releases.length} release{product.releases.length !== 1 ? 's' : ''}
            <span className="mx-1 text-slate-300 dark:text-slate-700">·</span>
            <span className="inline-flex items-center gap-0.5">
              <Users className="w-3 h-3" /> {teamCount}
            </span>
            {ticketCount > 0 && (
              <>
                <span className="mx-1 text-slate-300 dark:text-slate-700">·</span>
                {ticketCount} ticket{ticketCount !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>

        {/* Kebab menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              {/* Click-away backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-36 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1 animate-fade-in">
                <button
                  onClick={() => { setRenaming(true); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  Rename
                </button>
                <button
                  onClick={() => { setConfirmDelete(true); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
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
        <div className="mx-3 mb-2 p-3 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-fade-in shadow-sm">
          <p className="text-xs text-red-700 dark:text-red-400 mb-2">
            Delete <strong>{product.name}</strong>? This removes all releases, tickets, and team members for this product.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { onDelete(); setConfirmDelete(false); }}
              className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200 shadow-lg shadow-red-500/30"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">No releases yet</p>
            <button
              onClick={onAutoGenerate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30 mb-2"
            >
              <Sparkles className="w-3 h-3" />
              Create Smart Release
            </button>
            <div>
              <button
                onClick={onNewRelease}
                className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors"
              >
                or create manually
              </button>
            </div>
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
        <button
          onClick={onAutoGenerate}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30"
          title="AI-powered release creation"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Create Smart Release
        </button>
        <button
          onClick={onNewRelease}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all duration-200"
          title="Manual release creation"
        >
          <Plus className="w-3.5 h-3.5" />
          Manual
        </button>
        <Link
          to={`/product/${product.id}/team`}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all duration-200"
        >
          <Users className="w-3.5 h-3.5" />
          Team
        </Link>
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
        className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 group/row"
      >
        {/* Status dot */}
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            isActive
              ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
              : isUpcoming
                ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                : 'bg-slate-300 dark:bg-slate-600'
          )}
        />

        {/* Name + date */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-900 dark:text-white truncate group-hover/row:text-blue-600 dark:group-hover/row:text-blue-500 transition-colors">
            {release.name}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">{fmtRange(release.startDate, release.endDate)}</p>
        </div>

        {/* Inline progress */}
        {tickets > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all shadow-sm"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-slate-500 dark:text-slate-400 w-6 text-right">{pct}%</span>
          </div>
        )}

        {tickets === 0 && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">empty</span>
        )}

        <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-500 group-hover/row:text-blue-600 dark:group-hover/row:text-blue-500 transition-colors shrink-0" />
      </Link>
    </li>
  );
}

