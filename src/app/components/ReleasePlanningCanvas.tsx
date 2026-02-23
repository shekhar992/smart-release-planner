import { useState, useMemo, useEffect } from 'react';
import { Users, ArrowLeft, Calendar, Database, RotateCcw, Plus, Pencil, Trash2, Upload, Beaker, X, FileDown, ChevronDown, AlertTriangle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router';
import { TimelinePanel } from './TimelinePanel';
import { WorkloadModal } from './WorkloadModal';
import { TicketDetailsPanel } from './TicketDetailsPanel';
import { TicketCreationModal } from './TicketCreationModal';
import { BulkTicketImportModal } from './BulkTicketImportModal';
import { ConflictResolutionPanel } from './ConflictResolutionPanel';
import { mockProducts, Ticket, Feature, Sprint, mockHolidays, mockTeamMembers, getTeamMembersByProduct, storyPointsToDays, Phase } from '../data/mockData';
import { detectConflicts, getConflictSummary, detectEnhancedConflicts } from '../lib/conflictDetection';
import { calculateAllSprintCapacities } from '../lib/capacityCalculation';
import { loadProducts, saveRelease, deleteRelease, initializeStorage, getLastUpdated, loadHolidays, loadTeamMembersByProduct, forceRefreshStorage, loadMilestones, loadPhases } from '../lib/localStorage';
import { calculateEffortFromDates, toLocalDateString, calculateEndDateFromEffort } from '../lib/dateUtils';
import { calculateDurationDays } from '../lib/durationCalculator';
import { addDays } from 'date-fns';
import { exportReleaseTimelinePptx } from '../lib/exporters/exportReleaseTimelinePptx';

// Helper function to check if ticket is in dev window
function isTicketInDevWindow(ticket: Ticket, phases: Phase[]): boolean {
  const devPhases = phases.filter(p => p.allowsWork);
  
  if (devPhases.length === 0) return true;
  
  const ticketStart = new Date(ticket.startDate);
  ticketStart.setHours(0, 0, 0, 0);
  const ticketEnd = new Date(ticket.endDate);
  ticketEnd.setHours(0, 0, 0, 0);
  
  return devPhases.some(phase => {
    const phaseStart = new Date(phase.startDate);
    phaseStart.setHours(0, 0, 0, 0);
    const phaseEnd = new Date(phase.endDate);
    phaseEnd.setHours(0, 0, 0, 0);
    
    return ticketStart >= phaseStart && ticketEnd <= phaseEnd;
  });
}

// Header Alerts Panel - Inline component for header bar
function HeaderAlertsPanel({ 
  tickets, 
  phases, 
  conflictCount, 
  onViewConflicts 
}: { 
  tickets: Ticket[]; 
  phases: Phase[]; 
  conflictCount: number;
  onViewConflicts: () => void;
}) {
  const spilloverTickets = tickets.filter(t => !isTicketInDevWindow(t, phases));
  const spilloverCount = spilloverTickets.length;
  const totalAlerts = spilloverCount + conflictCount;
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (totalAlerts === 0) return null;
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-sm font-semibold hover:shadow-md shadow-sm bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:from-amber-100 hover:to-amber-200/50"
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Alerts</span>
        <div className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 dark:bg-amber-700 text-white shadow-sm">
          {totalAlerts}
        </div>
      </button>
      
      {isExpanded && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setIsExpanded(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-amber-200 dark:border-amber-800 rounded-xl shadow-2xl z-[60] overflow-hidden animate-fade-in">
            {/* Dev Window Issues */}
            {spilloverCount > 0 && (
              <div className="border-b border-amber-100 dark:border-amber-900/50 p-3 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/5 flex items-center justify-center mt-0.5">
                    <span className="text-base">⚠️</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      Dev Window Issues ({spilloverCount})
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Tickets scheduled during Testing, Deployment, or other non-dev phases.
                    </p>
                    <div className="mt-2 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                      {spilloverTickets.slice(0, 3).map((ticket) => (
                        <div key={ticket.id} className="truncate">
                          • {ticket.title} ({ticket.assignedTo || 'Unassigned'})
                        </div>
                      ))}
                      {spilloverCount > 3 && (
                        <div className="text-amber-600 dark:text-amber-400 font-semibold">
                          +{spilloverCount - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Resource Conflicts */}
            {conflictCount > 0 && (
              <div className="p-3">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/5 flex items-center justify-center mt-0.5">
                    <span className="text-base">⚡</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      Resource Conflicts ({conflictCount})
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Multiple tickets assigned to same developer with overlapping dates.
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewConflicts();
                        setIsExpanded(false);
                      }}
                      className="mt-3 w-full px-3 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-amber-600/30 hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      Resolve Conflicts
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function ReleasePlanningCanvas() {
  const { releaseId } = useParams();
  const navigate = useNavigate();
  
  // Initialize localStorage with mock data if empty (only once)
  const [initialized, setInitialized] = useState(false);
  const [teamMembersRefreshKey, setTeamMembersRefreshKey] = useState(0);
  const [holidaysRefreshKey, setHolidaysRefreshKey] = useState(0);
  
  useEffect(() => {
    if (!initialized) {
      initializeStorage(mockProducts, mockHolidays, mockTeamMembers);
      setInitialized(true);
    }
  }, [initialized]);

  // Listen for team members updates (from PTO Calendar, etc.)
  useEffect(() => {
    const handleTeamMembersUpdate = () => {
      setTeamMembersRefreshKey(prev => prev + 1);
    };

    window.addEventListener('teamMembersUpdated', handleTeamMembersUpdate);
    return () => window.removeEventListener('teamMembersUpdated', handleTeamMembersUpdate);
  }, []);
  
  // Listen for holidays updates (from Holiday Management, etc.)
  useEffect(() => {
    const handleHolidaysUpdate = () => {
      console.log('[Event] Holidays updated, triggering refresh...');
      setHolidaysRefreshKey(prev => prev + 1);
    };

    window.addEventListener('holidaysUpdated', handleHolidaysUpdate);
    return () => window.removeEventListener('holidaysUpdated', handleHolidaysUpdate);
  }, []);
  
  // Load products, holidays, and team members from localStorage or use mock data
  const products = useMemo(() => loadProducts() || mockProducts, [initialized]);
  const holidays = useMemo(() => loadHolidays() || mockHolidays, [initialized, holidaysRefreshKey]);
  const milestones = useMemo(() => {
    if (!releaseId) return [];
    return loadMilestones(releaseId);
  }, [initialized, releaseId]);
  
  // Find the release by ID
  const releaseData = useMemo(() => 
    products.find(product => product.releases.some(release => release.id === releaseId)),
    [products, releaseId]
  );

  // Load team members scoped to the product that owns this release
  const teamMembers = useMemo(() => {
    if (!releaseData) return [];
    const productId = releaseData.id;
    const stored = loadTeamMembersByProduct(productId);
    if (stored && stored.length > 0) return stored;
    return getTeamMembersByProduct(productId, mockTeamMembers);
  }, [initialized, releaseData, teamMembersRefreshKey]);
  
  // Find the specific release
  const currentRelease = useMemo(() => {
    if (!releaseData) return null;
    return releaseData.releases.find(r => r.id === releaseId) || releaseData.releases[0];
  }, [releaseData, releaseId]);
  
  // Load phases for the release
  const phases = useMemo(() => {
    if (!releaseId) return [];
    return loadPhases(releaseId);
  }, [releaseId]);

  // All hooks MUST be above any conditional returns (React Rules of Hooks)
  const [release, setRelease] = useState(currentRelease);
  const [showWorkloadModal, setShowWorkloadModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<{ featureId: string; ticketId: string } | null>(null);
  const [showTicketCreation, setShowTicketCreation] = useState<{ featureId?: string } | null>(null);
  const [showBulkImport, setShowBulkImport] = useState<{ featureId?: string } | null>(null);
  const [showConflictResolution, setShowConflictResolution] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(getLastUpdated());
  const [editingRelease, setEditingRelease] = useState(false);
  const [confirmDeleteRelease, setConfirmDeleteRelease] = useState(false);
  const [draftReleaseName, setDraftReleaseName] = useState('');
  const [draftStartDate, setDraftStartDate] = useState('');
  const [draftEndDate, setDraftEndDate] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showSprintCreation, setShowSprintCreation] = useState(false);
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);

  // SCENARIO SIMULATION STATE (Phase 1)
  // Feature flag: disabled per user request
  const SCENARIO_ENABLED = false;
  const [scenarioMode, setScenarioMode] = useState(false);
  const [scenarioOverrides, setScenarioOverrides] = useState({
    removedDevelopers: [] as string[],
    velocityOverrides: {} as Record<string, number>,
    scopeDeltaDays: 0
  });

  // AUTO-RECALCULATE TICKET END DATES WHEN HOLIDAYS CHANGE
  // This ensures tickets automatically expand/contract based on holidays and weekends
  useEffect(() => {
    console.log('[Auto-Recalculate] Holidays changed, recalculating all ticket end dates...');
    
    setRelease(prevRelease => {
      if (!prevRelease) return prevRelease;
      
      const updatedRelease = {
        ...prevRelease,
        features: prevRelease.features.map(feature => ({
          ...feature,
          tickets: feature.tickets.map(ticket => {
            const effortDays = ticket.effortDays || ticket.storyPoints;
            
            // Apply velocity multiplier for realistic duration
            const assignedMember = teamMembers.find(m => m.name === ticket.assignedTo);
            const velocity = assignedMember?.velocityMultiplier ?? 1;
            const adjustedDuration = Math.max(1, Math.round(effortDays / velocity));
            
            const recalculatedEndDate = calculateEndDateFromEffort(ticket.startDate, adjustedDuration, holidays);
            
            // Only update if end date actually changed
            if (recalculatedEndDate.getTime() !== ticket.endDate.getTime()) {
              console.log(`  ✓ ${ticket.title}: ${effortDays} effort → ${adjustedDuration} working days (${velocity}x velocity) → ${recalculatedEndDate.toDateString()}`);
              return { ...ticket, endDate: recalculatedEndDate };
            }
            
            return ticket;
          })
        }))
      };
      
      return updatedRelease;
    });
  }, [holidays, teamMembers]); // Trigger when holidays or teamMembers change

  const openEditRelease = () => {
    if (!release) return;
    setDraftReleaseName(release.name);
    setDraftStartDate(toLocalDateString(release.startDate));
    setDraftEndDate(toLocalDateString(release.endDate));
    setEditingRelease(true);
  };

  const commitEditRelease = () => {
    if (!release || !draftReleaseName.trim()) return;
    const updated = {
      ...release,
      name: draftReleaseName.trim(),
      startDate: new Date(draftStartDate + 'T00:00:00'),
      endDate: new Date(draftEndDate + 'T00:00:00'),
    };
    setRelease(updated);
    setEditingRelease(false);
  };

  const handleDeleteRelease = () => {
    if (!releaseData || !release) return;
    deleteRelease(releaseData.id, release.id);
    navigate('/');
  };

  // Conflict resolution handlers
  const handleReassignTicket = (ticketId: string, newAssignee: string) => {
    const featureWithTicket = release?.features.find(f => 
      f.tickets.some(t => t.id === ticketId)
    );
    if (featureWithTicket) {
      handleUpdateTicket(featureWithTicket.id, ticketId, { assignedTo: newAssignee });
    }
  };

  const handleMoveTicketToSprintById = (ticketId: string, sprintId: string) => {
    const sprint = (release?.sprints ?? []).find(s => s.id === sprintId);
    if (!sprint) return;
    
    const featureWithTicket = release?.features.find(f => 
      f.tickets.some(t => t.id === ticketId)
    );
    const ticket = featureWithTicket?.tickets.find(t => t.id === ticketId);
    
    if (featureWithTicket && ticket) {
      // Move ticket to start of the target sprint
      handleMoveTicket(featureWithTicket.id, ticketId, new Date(sprint.startDate));
    }
  };

  const handleShiftTicket = (ticketId: string, shiftDays: number) => {
    const featureWithTicket = release?.features.find(f => 
      f.tickets.some(t => t.id === ticketId)
    );
    const ticket = featureWithTicket?.tickets.find(t => t.id === ticketId);
    
    if (featureWithTicket && ticket) {
      const newStartDate = new Date(ticket.startDate);
      newStartDate.setDate(newStartDate.getDate() + shiftDays);
      handleMoveTicket(featureWithTicket.id, ticketId, newStartDate);
    }
  };

  const handleIgnoreConflict = (ticketId: string) => {
    // In a real app, you might want to mark this conflict as ignored in the state
    console.log('Ignoring conflict for ticket:', ticketId);
    // For now, just close the panel
    setShowConflictResolution(false);
  };

  // Sync release state when currentRelease changes (e.g., after data loads)
  useEffect(() => {
    if (currentRelease) {
      setRelease(currentRelease);
    }
  }, [currentRelease]);

  // Auto-save release to localStorage when it changes (debounced)
  useEffect(() => {
    if (release && releaseData && initialized) {
      const timeoutId = setTimeout(() => {
        saveRelease(releaseData.id, release);
        setLastSaved(new Date());
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [release, releaseData?.id, initialized]);

  // Early return for not-found — AFTER all hooks
  if (!releaseData || !currentRelease || !release) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">Release not found</h2>
          <p className="text-sm text-gray-500 mt-1">The requested release could not be found.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  // Handle storage reset
  const handleResetStorage = () => {
    if (window.confirm('This will reset all your test data to the latest mock data. Continue?')) {
      forceRefreshStorage(mockProducts, mockHolidays, mockTeamMembers);
      // Reload the page to get fresh data
      window.location.reload();
    }
  };

  // Detect conflicts whenever release data changes
  const allTickets = useMemo(() => {
    return release?.features.flatMap(feature => feature.tickets) ?? [];
  }, [release]);

  const conflicts = useMemo(() => {
    return detectConflicts(allTickets);
  }, [allTickets]);

  // Enhanced conflicts with suggestions
  const enhancedConflicts = useMemo(() => {
    // Get the latest end date from sprints to determine timeline end
    const timelineEndDate = release?.sprints?.length 
      ? new Date(Math.max(...release.sprints.map(s => s.endDate.getTime())))
      : undefined;
    
    return detectEnhancedConflicts(
      allTickets,
      release?.sprints,
      teamMembers,
      timelineEndDate
    );
  }, [allTickets, release?.sprints, teamMembers]);

  const conflictSummary = useMemo(() => {
    const baseSummary = getConflictSummary(conflicts, allTickets);
    
    // Add overflow conflicts count from enhanced conflicts
    const overflowCount = enhancedConflicts.filter(c => c.type === 'timelineOverflow').length;
    
    return {
      ...baseSummary,
      timelineOverflowConflicts: overflowCount,
      totalConflicts: baseSummary.totalConflicts + overflowCount,
    };
  }, [conflicts, allTickets, enhancedConflicts]);

  // SCENARIO SIMULATION: Derive team members for capacity calculations
  const derivedTeamMembers = useMemo(() => {
    if (!scenarioMode) return teamMembers;

    // Filter out removed developers
    const filtered = teamMembers.filter(
      tm => !scenarioOverrides.removedDevelopers.includes(tm.id)
    );

    // Apply velocity overrides if provided
    return filtered.map(tm => {
      const override = scenarioOverrides.velocityOverrides[tm.id];
      if (override !== undefined) {
        return { ...tm, velocityMultiplier: override };
      }
      return tm;
    });
  }, [teamMembers, scenarioMode, scenarioOverrides]);

  // SCENARIO SIMULATION: Derive tickets for capacity calculations
  const derivedTickets = useMemo(() => {
    if (!scenarioMode || scenarioOverrides.scopeDeltaDays === 0) return allTickets;

    // Add scope delta to last sprint only
    const sprints = release?.sprints || [];
    if (sprints.length === 0) return allTickets;

    const lastSprint = sprints[sprints.length - 1];
    const lastSprintTickets = allTickets.filter(t => {
      const ticketStart = t.startDate.getTime();
      return ticketStart >= lastSprint.startDate.getTime() && ticketStart <= lastSprint.endDate.getTime();
    });

    if (lastSprintTickets.length === 0) return allTickets;

    // Artificially add effortDays to first ticket in last sprint
    return allTickets.map(t => {
      if (t.id === lastSprintTickets[0].id) {
        return {
          ...t,
          effortDays: (t.effortDays || t.storyPoints || 1) + scenarioOverrides.scopeDeltaDays
        };
      }
      return t;
    });
  }, [allTickets, scenarioMode, scenarioOverrides.scopeDeltaDays, release?.sprints]);

  // Calculate sprint capacities (using derived data when scenario mode is active)
  const sprintCapacities = useMemo(() => {
    return calculateAllSprintCapacities(
      release?.sprints || [],
      derivedTickets,
      derivedTeamMembers,
      holidays,
      1, // velocity: 1 story point = 1 day (base rate)
      release?.storyPointMapping
    );
  }, [release?.sprints, derivedTickets, derivedTeamMembers, holidays, release?.storyPointMapping]);

  const handleUpdateTicket = (featureId: string, ticketId: string, updates: Partial<Ticket>) => {
    setRelease(prev => {
      if (!prev) return prev;
      return {
      ...prev,
      features: prev.features.map(f => 
        f.id === featureId 
          ? {
              ...f,
              tickets: f.tickets.map(t => {
                if (t.id === ticketId) {
                  // Merge updates into ticket
                  const updatedTicket = { ...t, ...updates };
                  
                  // Auto-recalculate endDate if effort, assignment, or startDate changed
                  const effortChanged = updates.effortDays !== undefined;
                  const assignmentChanged = updates.assignedTo !== undefined;
                  const startDateChanged = updates.startDate !== undefined;
                  
                  if (effortChanged || assignmentChanged || startDateChanged) {
                    const assignedDev = derivedTeamMembers.find(
                      m => m.name === updatedTicket.assignedTo
                    );
                    
                    const velocity = assignedDev?.velocityMultiplier ?? 1;
                    
                    const durationDays = calculateDurationDays(
                      updatedTicket.effortDays ?? 1,
                      velocity
                    );
                    
                    const start = new Date(updatedTicket.startDate);
                    const recalculatedEndDate = addDays(start, durationDays - 1);
                    
                    updatedTicket.endDate = recalculatedEndDate;
                  }
                  
                  return updatedTicket;
                }
                return t;
              })
            }
          : f
      )
    };
    });
    
    // Update the selected ticket if it's the one being edited
    if (selectedTicket?.ticketId === ticketId) {
      const updatedFeature = release?.features.find(f => f.id === featureId);
      const updatedTicket = updatedFeature?.tickets.find(t => t.id === ticketId);
      if (updatedTicket) {
        setSelectedTicket({ featureId, ticketId });
      }
    }
  };

  const handleAddFeatureWithName = (name: string): string => {
    const id = `f${Date.now()}`;
    const newFeature: Feature = {
      id,
      name,
      tickets: []
    };
    setRelease(prev => {
      if (!prev) return prev;
      return { ...prev, features: [...prev.features, newFeature] };
    });
    return id;
  };

  const handleAddTicketFull = (featureId: string, ticketData: Omit<Ticket, 'id'>) => {
    // Calculate effortDays from storyPoints using release's storyPointMapping
    // This ensures new manual tickets have explicit effortDays stored
    const effortDays = ticketData.effortDays ?? 
      (ticketData.storyPoints != null 
        ? storyPointsToDays(ticketData.storyPoints, release?.storyPointMapping)
        : 1);
    
    const newTicket: Ticket = {
      id: `t${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...ticketData,
      effortDays // Explicitly store calculated effortDays
    };
    setRelease(prev => {
      if (!prev) return prev;
      return {
      ...prev,
      features: prev.features.map(f =>
        f.id === featureId
          ? { ...f, tickets: [...f.tickets, newTicket] }
          : f
      )
    };
    });
  };

  const handleMoveTicket = (featureId: string, ticketId: string, newStartDate: Date) => {
    setRelease(prev => {
      if (!prev) return prev;
      return {
      ...prev,
      features: prev.features.map(f => {
        if (f.id === featureId) {
          return {
            ...f,
            tickets: f.tickets.map(t => {
              if (t.id === ticketId) {
                // Recalculate end date based on effort days + velocity + holidays/weekends
                const effortDays = t.effortDays || t.storyPoints;
                
                // Apply velocity multiplier for realistic duration
                const assignedMember = teamMembers.find(m => m.name === t.assignedTo);
                const velocity = assignedMember?.velocityMultiplier ?? 1;
                const adjustedDuration = Math.max(1, Math.round(effortDays / velocity));
                
                const newEndDate = calculateEndDateFromEffort(newStartDate, adjustedDuration, holidays);
                console.log(`[Move Ticket] ${t.title}: ${effortDays} effort → ${adjustedDuration} working days (${velocity}x velocity) → ${newEndDate.toDateString()}`);
                return { ...t, startDate: newStartDate, endDate: newEndDate };
              }
              return t;
            })
          };
        }
        return f;
      })
    };
    });
  };

  const handleResizeTicket = (featureId: string, ticketId: string, newEndDate: Date) => {
    setRelease(prev => {
      if (!prev) return prev;
      return {
      ...prev,
      features: prev.features.map(f => {
        if (f.id === featureId) {
          return {
            ...f,
            tickets: f.tickets.map(t => {
              if (t.id === ticketId) {
                // Recalculate effortDays from new duration (working days, not calendar days)
                const newEffort = calculateEffortFromDates(t.startDate, newEndDate, holidays);
                return {
                  ...t,
                  endDate: newEndDate,
                  effortDays: newEffort,
                  storyPoints: newEffort // Backward compatibility
                };
              }
              return t;
            })
          };
        }
        return f;
      })
    };
    });
  };

  const handleDeleteTicket = (featureId: string, ticketId: string) => {
    setRelease(prev => {
      if (!prev) return prev;
      return {
      ...prev,
      features: prev.features.map(f => 
        f.id === featureId 
          ? { ...f, tickets: f.tickets.filter(t => t.id !== ticketId) }
          : f
      )
    };
    });
    setSelectedTicket(null);
  };

  const handleMoveTicketToFeature = (fromFeatureId: string, ticketId: string, toFeatureId: string) => {
    setRelease(prev => {
      if (!prev) return prev;
      const fromFeature = prev.features.find(f => f.id === fromFeatureId);
      const ticket = fromFeature?.tickets.find(t => t.id === ticketId);
      if (!ticket) return prev;

      return {
        ...prev,
        features: prev.features.map(f => {
          if (f.id === fromFeatureId) {
            return { ...f, tickets: f.tickets.filter(t => t.id !== ticketId) };
          }
          if (f.id === toFeatureId) {
            return { ...f, tickets: [...f.tickets, ticket] };
          }
          return f;
        })
      };
    });
    // Update selected ticket to point to new feature
    setSelectedTicket({ featureId: toFeatureId, ticketId });
  };

  const handleCreateSprint = (name: string, startDate: Date, endDate: Date) => {
    const newSprint: Sprint = {
      id: `s${Date.now()}`,
      name,
      startDate,
      endDate
    };
    
    setRelease(prev => {
      if (!prev) return prev;
      return { ...prev, sprints: [...(prev.sprints || []), newSprint].sort((a, b) => a.startDate.getTime() - b.startDate.getTime()) };
    });
  };

  const handleCloneTicket = (featureId: string, ticketId: string) => {
    const feature = release?.features.find(f => f.id === featureId);
    const ticket = feature?.tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const duration = ticket.endDate.getTime() - ticket.startDate.getTime();
    const newStart = new Date(ticket.endDate.getTime());
    const newEnd = new Date(newStart.getTime() + duration);

    handleAddTicketFull(featureId, {
      title: `${ticket.title} (Copy)`,
      description: ticket.description,
      startDate: newStart,
      endDate: newEnd,
      status: 'planned',
      effortDays: ticket.effortDays,
      storyPoints: ticket.storyPoints, // Backward compatibility
      assignedTo: ticket.assignedTo,
    });
  };

  const handleUpdateSprint = (sprintId: string, name: string, startDate: Date, endDate: Date) => {
    setRelease(prev => {
      if (!prev) return prev;
      return { ...prev, sprints: (prev.sprints || []).map(s => 
        s.id === sprintId ? { ...s, name, startDate, endDate } : s
      ).sort((a, b) => a.startDate.getTime() - b.startDate.getTime()) };
    });
  };

  const handleDeleteSprint = (sprintId: string) => {
    setRelease(prev => {
      if (!prev) return prev;
      return { ...prev, sprints: (prev.sprints || []).filter(s => s.id !== sprintId) };
    });
  };

  const handleExportPPTX = async () => {
    if (!release) return;
    try {
      await exportReleaseTimelinePptx(release);
    } catch (error) {
      console.error('PPTX export failed:', error);
      alert('Export failed. Please check the console for details.');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#F7F8FA]">
      {/* Top Navigation Bar */}
      <div className="relative z-50 flex items-center justify-between px-6 py-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-slate-900 dark:text-white">{releaseData.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{release.name}</p>
          </div>
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={openEditRelease}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
              title="Edit release"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setConfirmDeleteRelease(true)}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-all"
              title="Delete release"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Storage indicator - subtle */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-600 dark:text-slate-400 shadow-sm">
            <Database className="w-3 h-3" />
            {lastSaved && (
              <span>
                {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          
          {/* Primary CTA */}
          <button
            onClick={() => setShowTicketCreation({})}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>New Ticket</span>
          </button>

          {/* Header Alerts Panel */}
          <HeaderAlertsPanel
            tickets={allTickets}
            phases={phases}
            conflictCount={conflictSummary.totalConflicts}
            onViewConflicts={() => setShowConflictResolution(true)}
          />

          {/* Actions Menu (overflow) */}
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-300 dark:border-slate-600 font-medium shadow-sm"
            >
              <span>Actions</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            
            {showActionsMenu && (
              <>
                <div 
                  className="fixed inset-0 z-[55]"
                  onClick={() => setShowActionsMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[60] py-1 overflow-hidden">
                  <button
                    onClick={() => {
                      setShowSprintCreation(true);
                      setShowActionsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Sprint</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAddMilestoneModal(true);
                      setShowActionsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left font-medium"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Add Milestone</span>
                  </button>
                  <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
                  <button
                    onClick={() => {
                      setShowBulkImport({});
                      setShowActionsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import Tickets</span>
                  </button>
                  <button
                    onClick={() => {
                      handleExportPPTX();
                      setShowActionsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left font-medium"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Export PPTX</span>
                  </button>
                  <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
                  <button
                    onClick={() => {
                      navigate(`/product/${releaseData.id}/team`);
                      setShowActionsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left font-medium"
                  >
                    <Users className="w-4 h-4" />
                    <span>Team Roster</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate(`/release/${releaseId}/team/holidays`);
                      setShowActionsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left font-medium"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Holidays</span>
                  </button>
                  {SCENARIO_ENABLED && (
                    <>
                      <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
                      <button
                        onClick={() => {
                          setScenarioMode(!scenarioMode);
                          if (scenarioMode) {
                            // Reset overrides when turning off
                            setScenarioOverrides({
                              removedDevelopers: [],
                              velocityOverrides: {},
                              scopeDeltaDays: 0
                            });
                          }
                          setShowActionsMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-all text-left font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                        style={{
                          backgroundColor: scenarioMode ? 'rgba(251, 192, 45, 0.1)' : 'transparent',
                          color: scenarioMode ? '#b45309' : 'inherit'
                        }}
                        onMouseEnter={(e) => {
                          if (!scenarioMode) {
                            e.currentTarget.style.backgroundColor = 'var(--muted)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!scenarioMode) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <Beaker className="w-4 h-4" />
                        <span>Scenario Mode</span>
                        {scenarioMode && <span className="ml-1 text-xs">(Active)</span>}
                      </button>
                    </>
                  )}
                  <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
                  <button
                    onClick={() => {
                      handleResetStorage();
                      setShowActionsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Demo Data</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SCENARIO SIMULATION CONTROLS - Only shown when scenario mode is active */}
      {SCENARIO_ENABLED && scenarioMode && (
      <div className="border-b border-gray-200 bg-amber-50/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Scenario controls - always shown when mode is active */}
            {(
              <div className="flex items-center gap-3 pl-3 border-l border-gray-300">
                {/* Remove Developers */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Remove Developers</label>
                  <select
                    multiple
                    value={scenarioOverrides.removedDevelopers}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setScenarioOverrides(prev => ({ ...prev, removedDevelopers: selected }));
                    }}
                    className="text-xs border border-gray-200 rounded-md px-2 py-1 h-20 w-40"
                  >
                    {teamMembers.map(tm => (
                      <option key={tm.id} value={tm.id}>
                        {tm.name}
                      </option>
                    ))}
                  </select>
                  {scenarioOverrides.removedDevelopers.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {scenarioOverrides.removedDevelopers.length} removed
                    </span>
                  )}
                </div>

                {/* Scope Delta */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Scope Delta (days)</label>
                  <input
                    type="number"
                    value={scenarioOverrides.scopeDeltaDays}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setScenarioOverrides(prev => ({ ...prev, scopeDeltaDays: val }));
                    }}
                    className="text-xs border border-gray-200 rounded-md px-2 py-1.5 w-24"
                    placeholder="0"
                    step="0.5"
                  />
                  <span className="text-xs text-gray-500">
                    Last sprint only
                  </span>
                </div>

                {/* Velocity Overrides */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Velocity Override</label>
                  <div className="flex items-center gap-2">
                    <select
                      value=""
                      onChange={(e) => {
                        const devId = e.target.value;
                        if (devId) {
                          const dev = teamMembers.find(tm => tm.id === devId);
                          if (dev) {
                            setScenarioOverrides(prev => ({
                              ...prev,
                              velocityOverrides: {
                                ...prev.velocityOverrides,
                                [devId]: dev.velocityMultiplier || 1.0
                              }
                            }));
                          }
                        }
                        e.target.value = '';
                      }}
                      className="text-xs border border-gray-200 rounded-md px-2 py-1.5 w-32"
                    >
                      <option value="">Select dev...</option>
                      {teamMembers.map(tm => (
                        <option key={tm.id} value={tm.id}>
                          {tm.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {Object.keys(scenarioOverrides.velocityOverrides).length > 0 && (
                    <div className="flex flex-col gap-1 mt-1">
                      {Object.entries(scenarioOverrides.velocityOverrides).map(([devId, velocity]) => {
                        const dev = teamMembers.find(tm => tm.id === devId);
                        return (
                          <div key={devId} className="flex items-center gap-2 bg-white border border-gray-200 rounded px-2 py-1">
                            <span className="text-xs text-gray-700 truncate flex-1">{dev?.name}</span>
                            <input
                              type="number"
                              value={velocity}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 1.0;
                                setScenarioOverrides(prev => ({
                                  ...prev,
                                  velocityOverrides: {
                                    ...prev.velocityOverrides,
                                    [devId]: val
                                  }
                                }));
                              }}
                              className="text-xs border border-gray-200 rounded px-1 py-0.5 w-16"
                              step="0.1"
                              min="0.1"
                              max="3.0"
                            />
                            <button
                              onClick={() => {
                                setScenarioOverrides(prev => {
                                  const newOverrides = { ...prev.velocityOverrides };
                                  delete newOverrides[devId];
                                  return { ...prev, velocityOverrides: newOverrides };
                                });
                              }}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-md">
            <Beaker className="w-3.5 h-3.5 text-amber-700" />
            <span className="text-xs font-semibold text-amber-800">Scenario Mode Active</span>
          </div>
        </div>
      </div>
      )}

      {/* Main Canvas */}
      <div className="flex-1 overflow-hidden">
        <TimelinePanel
          release={release}
          holidays={holidays}
          teamMembers={teamMembers}
          onMoveTicket={handleMoveTicket}
          onResizeTicket={handleResizeTicket}
          onSelectTicket={(featureId, ticketId) => setSelectedTicket({ featureId, ticketId })}
          onCloneTicket={handleCloneTicket}
          onCreateSprint={handleCreateSprint}
          onUpdateSprint={handleUpdateSprint}
          onDeleteSprint={handleDeleteSprint}
          conflicts={conflicts}
          sprintCapacities={sprintCapacities}
          showSprintCreation={showSprintCreation}
          onShowSprintCreationChange={setShowSprintCreation}
          showAddMilestoneModal={showAddMilestoneModal}
          onShowAddMilestoneModalChange={setShowAddMilestoneModal}
        />
      </div>

      {/* Workload Modal */}
      {showWorkloadModal && (
        <WorkloadModal 
          release={release}
          onClose={() => setShowWorkloadModal(false)}
        />
      )}

      {/* Ticket Details Panel */}
      {selectedTicket && (
        <TicketDetailsPanel 
          ticket={release.features.find(f => f.id === selectedTicket.featureId)?.tickets.find(t => t.id === selectedTicket.ticketId) || ({} as Ticket)}
          featureId={selectedTicket.featureId}
          release={release}
          teamMembers={teamMembers}
          milestones={milestones}
          onClose={() => setSelectedTicket(null)}
          onUpdate={handleUpdateTicket}
          onDelete={handleDeleteTicket}
          onMoveToFeature={handleMoveTicketToFeature}
        />
      )}

      {/* Ticket Creation Modal */}
      {showTicketCreation && (
        <TicketCreationModal
          release={release}
          teamMembers={teamMembers}
          preselectedFeatureId={showTicketCreation.featureId}
          onClose={() => setShowTicketCreation(null)}
          onAddFeature={handleAddFeatureWithName}
          onAddTicket={handleAddTicketFull}
        />
      )}

      {/* Bulk Ticket Import Modal */}
      {showBulkImport && (
        <BulkTicketImportModal
          release={release}
          onClose={() => setShowBulkImport(null)}
          onAddFeature={handleAddFeatureWithName}
          onAddTicket={handleAddTicketFull}
        />
      )}

      {/* Conflict Resolution Panel */}
      {showConflictResolution && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-black/20">
          <ConflictResolutionPanel
            conflicts={enhancedConflicts}
            tickets={allTickets}
            onClose={() => setShowConflictResolution(false)}
            onReassignTicket={handleReassignTicket}
            onMoveTicketToSprint={handleMoveTicketToSprintById}
            onShiftTicket={handleShiftTicket}
            onIgnoreConflict={handleIgnoreConflict}
          />
        </div>
      )}

      {/* Edit Release Dialog */}
      {editingRelease && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 w-[380px] border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Edit Release</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Name</label>
                <input
                  autoFocus
                  value={draftReleaseName}
                  onChange={e => setDraftReleaseName(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 outline-none shadow-sm transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Start Date</label>
                  <input
                    type="date"
                    value={draftStartDate}
                    onChange={e => setDraftStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 outline-none shadow-sm transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">End Date</label>
                  <input
                    type="date"
                    value={draftEndDate}
                    onChange={e => setDraftEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 outline-none shadow-sm transition-all"
                  />
                </div>
              </div>
              {draftEndDate && draftStartDate && draftEndDate < draftStartDate && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">End date must be after start date</p>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setEditingRelease(false)}
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={commitEditRelease}
                disabled={!draftReleaseName.trim() || (draftEndDate < draftStartDate)}
                className="px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:shadow-none"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Release Confirmation */}
      {confirmDeleteRelease && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 w-[380px] border border-red-200 dark:border-red-800">
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Delete Release</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{release.name}</strong>? All features, tickets, and sprints within this release will be permanently removed.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteRelease(false)}
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRelease}
                className="px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl transition-all shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}