import { Link, useNavigate } from 'react-router';
import { Plus, Calendar, Package, FolderPlus, Users, ChevronRight, Layers, MoreVertical, Pencil, Trash2, Sparkles, FileText } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { mockProducts, Product, Release, mockHolidays, mockTeamMembers, TeamMember, Phase, SP_PRESETS, Feature, Ticket } from '../data/mockData';
import { CreateProductModal } from './CreateProductModal';
import { ReleaseCreationWizard } from './ReleaseCreationWizard';
import { PRDReleasePlanModal } from './PRDReleasePlanModal';
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
  const navigate = useNavigate();

  // Local state fallback for when rendered via router (without props)
  const [localShowCreateProduct, setLocalShowCreateProduct] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Release creation wizard state
  const [showReleaseWizard, setShowReleaseWizard] = useState(false);
  const [wizardFlow, setWizardFlow] = useState<'manual' | 'smart'>('manual');
  const [wizardProductId, setWizardProductId] = useState<string | null>(null);

  // PRD → Release wizard state
  const [showPRDWizard, setShowPRDWizard] = useState(false);
  const [prdWizardProductId, setPrdWizardProductId] = useState<string | null>(null);

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

      // Hoist team/holiday data outside all conditionals so every code path can use them
      const teamMembers_  = loadTeamMembers() || [];
      const productTeam   = teamMembers_.filter(tm => tm.productId === data.productId);
      const holidays      = loadHolidays() || [];

      if (data.sprintLengthDays) {
        try {
          
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
          
          // Restrict ticket SCHEDULING to dev window phases only
          // (don't place work during SIT / UAT / launch phases)
          const devWindowPhases = (data.phases || []).filter((p: Phase) => p.allowsWork);
          const scheduleStart = devWindowPhases.length > 0
            ? new Date(Math.min(...devWindowPhases.map((p: Phase) => new Date(p.startDate).getTime())))
            : data.startDate;
          const scheduleEnd = devWindowPhases.length > 0
            ? new Date(Math.max(...devWindowPhases.map((p: Phase) => new Date(p.endDate).getTime())))
            : data.endDate;

          // Build release plan using planning engine
          const config: ReleaseConfig = {
            releaseStart: scheduleStart,
            releaseEnd: scheduleEnd,
            sprintLengthDays: data.sprintLengthDays,
            numberOfDevelopers: productTeam.length || 1,
            holidays: holidays.map(h => new Date(h.startDate)),
            ptoDates: [], // PTO dates would come from team members if needed
          };
          
          releasePlan = buildReleasePlan(ticketInputs, config);
          
          // Step 2: Place tickets sequentially per developer, respecting sprint order.
          //
          // The planning engine allocates by TEAM capacity (N devs × working days), which
          // means it may place more work into a sprint than any single developer can handle.
          // Without tracking per-dev progress, a developer's sequential chain bleeds past
          // the sprint end date, causing the next sprint to double-count straddling tickets
          // and show utilisation >100 %.
          //
          // Fix: maintain a global "current date" per developer across all sprints.
          //  - When a dev has idle time before a sprint starts, advance to that sprint's start.
          //  - When a dev's chain runs past a sprint boundary, continue from where they left off.
          // This guarantees tickets never start before their assigned sprint AND never overlap.
          const updatedTickets: Ticket[] = [];

          const sprintList = releasePlan.sprints;

          // Global per-developer current-date tracker (carries forward across all sprints).
          const devCurrentDate = new Map<string, Date>();

          for (let sprintIdx = 0; sprintIdx < sprintList.length; sprintIdx++) {
            const domainSprint = sprintList[sprintIdx];

            // Group this sprint's allocated tickets by developer.
            const ticketsByDev = new Map<string, typeof domainSprint.tickets>();
            domainSprint.tickets.forEach(ticketInput => {
              const originalTicket = data.tickets!.find(t =>
                (t.id && t.id === ticketInput.id) || t.title === ticketInput.title
              );
              const devName = originalTicket?.assignedTo || 'Unassigned';
              if (!ticketsByDev.has(devName)) ticketsByDev.set(devName, []);
              ticketsByDev.get(devName)!.push(ticketInput);
            });

            for (const [devName, devTickets] of ticketsByDev) {
              // Decide where this developer starts in this sprint.
              // Rule: no earlier than the sprint's start date (skip idle time between sprints),
              //       but carry forward if still mid-chain from a previous sprint's overflow.
              const sprintStart = new Date(domainSprint.startDate);
              const tracked = devCurrentDate.get(devName);
              let currentDate = tracked && tracked > sprintStart ? new Date(tracked) : new Date(sprintStart);

              for (const ticketInput of devTickets) {
                const originalTicket = data.tickets.find(t =>
                  (t.id && t.id === ticketInput.id) || t.title === ticketInput.title
                );
                if (!originalTicket) continue;

                const effortDays = originalTicket.effortDays || 1;
                const assignedDev = productTeam.find(m => m.name === originalTicket.assignedTo);
                const velocity = assignedDev?.velocityMultiplier ?? 1;
                const adjustedDuration = Math.max(1, Math.round(effortDays / velocity));

                const ticketEndDate = calculateEndDateFromEffort(currentDate, adjustedDuration, holidays);

                updatedTickets.push({
                  ...originalTicket,
                  id: ticketInput.id,
                  startDate: new Date(currentDate),
                  endDate: ticketEndDate,
                });

                // Advance: next ticket starts the day after this one ends.
                currentDate = new Date(ticketEndDate.getTime() + 24 * 60 * 60 * 1000);
              }

              // Persist this developer's position so subsequent sprints can continue from here.
              devCurrentDate.set(devName, currentDate);
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
    
    // Generate display sprints for the FULL SDLC range (dev + SIT + UAT)
    // These populate the timeline canvas — ticket scheduling uses the narrower dev window.
    const newReleaseId = `r-${Date.now()}`;
    const fullReleaseSprints: Array<{ id: string; name: string; startDate: Date; endDate: Date }> = [];
    if (data.sprintLengthDays) {
      const totalDays = Math.round(
        (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (24 * 60 * 60 * 1000),
      );
      const count = Math.floor(totalDays / data.sprintLengthDays);
      for (let i = 0; i < count; i++) {
        const sprintStart = new Date(
          new Date(data.startDate).getTime() + i * data.sprintLengthDays * 24 * 60 * 60 * 1000,
        );
        const sprintEnd = new Date(sprintStart.getTime() + (data.sprintLengthDays - 1) * 24 * 60 * 60 * 1000);
        fullReleaseSprints.push({
          id: `sprint-${newReleaseId}-${i}`,
          name: `Sprint ${i + 1}`,
          startDate: sprintStart,
          endDate: sprintEnd,
        });
      }
    }

    // Create the release object
    const newRelease: Release = {
      id: newReleaseId,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      features,
      sprints: fullReleaseSprints,
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

  // ── PRD wizard: save the generated release ──
  const handlePRDGenerate = (release: Release, _parkedFeatureName?: string) => {
    if (!prdWizardProductId) return;

    // If parkedFeatureName is provided, the engine already separated overflow;
    // just save the main release (parked feature is informational only for now).
    const finalRelease: Release = { ...release };

    // Add to the correct product
    const updatedProducts = products.map(p => {
      if (p.id === prdWizardProductId) {
        return { ...p, releases: [...p.releases, finalRelease] };
      }
      return p;
    });
    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    // Persist phases so the timeline renders the correct dev-window bands
    // and never falls back to auto-generating wrong mock phases.
    if (finalRelease.phases && finalRelease.phases.length > 0) {
      savePhases(finalRelease.id, finalRelease.phases);
    }

    setShowPRDWizard(false);
    setPrdWizardProductId(null);

    // Navigate straight to the canvas
    navigate(`/release/${finalRelease.id}`);
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
    const productToDelete = products.find(p => p.id === productId);
    if (!productToDelete) return;

    const existingTeam = loadTeamMembers() || [];
    const productTeam = existingTeam.filter(m => m.productId === productId);
    const updatedProducts = products.filter(p => p.id !== productId);

    setProducts(updatedProducts);
    saveProducts(updatedProducts);
    saveTeamMembers(existingTeam.filter(m => m.productId !== productId));

    toast(`"${productToDelete.name}" deleted`, {
      description: `${productToDelete.releases.length} release${productToDelete.releases.length !== 1 ? 's' : ''} removed.`,
      action: {
        label: 'Undo',
        onClick: () => {
          const restored = [...updatedProducts, productToDelete];
          setProducts(restored);
          saveProducts(restored);
          const currentTeam = loadTeamMembers() || [];
          saveTeamMembers([...currentTeam, ...productTeam]);
        },
      },
      duration: 5000,
    });
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
    <PageShell actions={<ModeSwitch />}>
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
          <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center border border-blue-100 dark:border-blue-900 mb-6">
            <Layers className="w-10 h-10 text-blue-600 dark:text-blue-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">No products yet</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-sm text-center leading-relaxed">
            Products group your releases and teams together. Create one to start planning your roadmap.
          </p>
          <button
            onClick={effectiveOpenCreateProduct}
            className="btn-primary gap-2 py-2.5 px-5"
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
                onAutoGenerate={() => {
                  setWizardFlow('smart');
                  setWizardProductId(product.id);
                  setShowReleaseWizard(true);
                }}
                onPRDWizard={() => {
                  setPrdWizardProductId(product.id);
                  setShowPRDWizard(true);
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
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/20 flex items-center justify-center transition-colors duration-200">
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200"
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

      {/* PRD → Release Plan Wizard */}
      {showPRDWizard && prdWizardProductId && (() => {
        const prdProduct = products.find(p => p.id === prdWizardProductId);
        if (!prdProduct) return null;
        const allTeam = loadTeamMembers() || mockTeamMembers;
        const productTeam = allTeam.filter(m => m.productId === prdWizardProductId);
        // If this product has no team yet, fall back to ALL team members so auto-assign
        // has someone to work with instead of producing 100% "Unassigned" tickets.
        const effectiveTeam = productTeam.length > 0 ? productTeam : allTeam;
        const productHolidays = loadHolidays() || mockHolidays;
        return (
          <PRDReleasePlanModal
            productId={prdWizardProductId}
            productName={prdProduct.name}
            teamMembers={effectiveTeam}
            holidays={productHolidays}
            onClose={() => {
              setShowPRDWizard(false);
              setPrdWizardProductId(null);
            }}
            onGenerate={handlePRDGenerate}
          />
        );
      })()}

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
  onAutoGenerate,
  onPRDWizard,
  onRename,
  onDelete,
}: {
  product: Product;
  teamCount: number;
  onAutoGenerate: () => void;
  onPRDWizard: () => void;
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
        <div className="w-9 h-9 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center shrink-0">
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
              className="btn-danger text-xs"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="btn-ghost text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Releases list — only rendered when releases exist */}
      {product.releases.length > 0 && (
        <div className="flex-1 px-3 pb-1">
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
        </div>
      )}

      {/* Action row */}
      <div className={cn(
        'flex items-center border-t border-slate-100 dark:border-slate-800',
        product.releases.length === 0 && 'mt-auto'
      )}>
        {/* Primary CTA — brand blue, semibold, visible at rest */}
        <button
          onClick={onPRDWizard}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-150"
        >
          <FileText className="w-3.5 h-3.5" />
          Plan from PRD
        </button>
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 shrink-0" />
        {/* Secondary — medium weight, muted slate, violet on hover */}
        <button
          onClick={onAutoGenerate}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50/60 dark:hover:bg-violet-950/20 transition-colors duration-150"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Smart Release
        </button>
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 shrink-0" />
        {/* Tertiary — lightest, normal weight, barely-there at rest */}
        <Link
          to={`/product/${product.id}/team`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-normal text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-150"
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
  const daysLeft = isActive
    ? Math.round((release.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : isUpcoming
      ? Math.round((release.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

  return (
    <li>
      <Link
        to={`/release/${release.id}`}
        className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 group/row"
      >
        {/* Material 3 tonal status chip */}
        <span className={cn(
          "shrink-0 inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 border leading-none",
          isActive
            ? 'bg-[#E6F4EA] dark:bg-[#0D3723] text-[#137333] dark:text-[#34A853] border-[#CEEAD6] dark:border-[#1A5E38]'
            : isUpcoming
              ? 'bg-[#FEF7E0] dark:bg-[#3C2A00] text-[#B06000] dark:text-[#FDD663] border-[#FEEFC3] dark:border-[#5C3D00]'
              : 'bg-[#F1F3F4] dark:bg-[#303134] text-[#5F6368] dark:text-[#9AA0A6] border-[#DADCE0] dark:border-[#3C4043]'
        )}>
          <span className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            isActive ? 'bg-[#137333] dark:bg-[#34A853]'
              : isUpcoming ? 'bg-[#B06000] dark:bg-[#FDD663]'
              : 'bg-[#5F6368] dark:bg-[#9AA0A6]'
          )} />
          {isActive ? 'Live' : isUpcoming ? 'Soon' : 'Done'}
        </span>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-900 dark:text-white truncate group-hover/row:text-blue-600 dark:group-hover/row:text-blue-500 transition-colors">
            {release.name}
          </p>
          <p className="text-label text-slate-500 dark:text-slate-400">
            {fmtRange(release.startDate, release.endDate)}
            {daysLeft !== null && (
              <span className={cn("ml-1", isActive && daysLeft <= 7 ? "text-red-500 dark:text-red-400 font-semibold" : "")}>
                · {isActive ? `${daysLeft}d left` : `in ${daysLeft}d`}
              </span>
            )}
          </p>
        </div>

        {/* Ticket count + progress bar */}
        {tickets > 0 ? (
          <div className="shrink-0 flex flex-col items-end gap-1">
            <span className="text-label tabular-nums text-slate-400 dark:text-slate-500">{pct}%</span>
            <div className="w-14 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all shadow-sm"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ) : (
          <span className="text-label text-slate-400 dark:text-slate-500 italic shrink-0">empty</span>
        )}

        <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-500 group-hover/row:text-blue-600 dark:group-hover/row:text-blue-500 transition-colors shrink-0" />
      </Link>
    </li>
  );
}

