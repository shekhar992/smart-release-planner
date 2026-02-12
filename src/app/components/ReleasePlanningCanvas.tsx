import { useState, useMemo, useEffect } from 'react';
import { Users, ArrowLeft, Calendar, Database, RotateCcw, Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { useParams, useNavigate } from 'react-router';
import { TimelinePanel } from './TimelinePanel';
import { WorkloadModal } from './WorkloadModal';
import { TicketDetailsPanel } from './TicketDetailsPanel';
import { TicketCreationModal } from './TicketCreationModal';
import { BulkTicketImportModal } from './BulkTicketImportModal';
import { ConflictResolutionPanel } from './ConflictResolutionPanel';
import { mockProducts, Ticket, Feature, Sprint, mockHolidays, mockTeamMembers, getTeamMembersByProduct } from '../data/mockData';
import { detectConflicts, getConflictSummary, detectEnhancedConflicts } from '../lib/conflictDetection';
import { calculateAllSprintCapacities } from '../lib/capacityCalculation';
import { loadProducts, saveRelease, deleteRelease, initializeStorage, getLastUpdated, loadHolidays, loadTeamMembersByProduct, forceRefreshStorage } from '../lib/localStorage';

export function ReleasePlanningCanvas() {
  const { releaseId } = useParams();
  const navigate = useNavigate();
  
  // Initialize localStorage with mock data if empty (only once)
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized) {
      initializeStorage(mockProducts, mockHolidays, mockTeamMembers);
      setInitialized(true);
    }
  }, [initialized]);
  
  // Load products, holidays, and team members from localStorage or use mock data
  const products = useMemo(() => loadProducts() || mockProducts, [initialized]);
  const holidays = useMemo(() => loadHolidays() || mockHolidays, [initialized]);
  
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
  }, [initialized, releaseData]);
  
  // Find the specific release
  const currentRelease = useMemo(() => {
    if (!releaseData) return null;
    return releaseData.releases.find(r => r.id === releaseId) || releaseData.releases[0];
  }, [releaseData, releaseId]);

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

  const openEditRelease = () => {
    if (!release) return;
    setDraftReleaseName(release.name);
    setDraftStartDate(release.startDate.toISOString().split('T')[0]);
    setDraftEndDate(release.endDate.toISOString().split('T')[0]);
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
    const sprint = release?.sprints.find(s => s.id === sprintId);
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

  const conflictSummary = useMemo(() => {
    return getConflictSummary(conflicts, allTickets);
  }, [conflicts, allTickets]);

  // Enhanced conflicts with suggestions
  const enhancedConflicts = useMemo(() => {
    return detectEnhancedConflicts(
      allTickets,
      release?.sprints,
      teamMembers
    );
  }, [allTickets, release?.sprints, teamMembers]);

  // Calculate sprint capacities
  const sprintCapacities = useMemo(() => {
    return calculateAllSprintCapacities(
      release?.sprints || [],
      allTickets,
      teamMembers,
      holidays,
      1, // velocity: 1 story point = 1 day (base rate)
      release?.storyPointMapping
    );
  }, [release?.sprints, allTickets, teamMembers, holidays, release?.storyPointMapping]);

  const handleUpdateTicket = (featureId: string, ticketId: string, updates: Partial<Ticket>) => {
    setRelease(prev => {
      if (!prev) return prev;
      return {
      ...prev,
      features: prev.features.map(f => 
        f.id === featureId 
          ? {
              ...f,
              tickets: f.tickets.map(t => 
                t.id === ticketId ? { ...t, ...updates } : t
              )
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
    const newTicket: Ticket = {
      id: `t${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...ticketData
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
                const duration = t.endDate.getTime() - t.startDate.getTime();
                const newEndDate = new Date(newStartDate.getTime() + duration);
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
            tickets: f.tickets.map(t => 
              t.id === ticketId ? { ...t, endDate: newEndDate } : t
            )
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
      storyPoints: ticket.storyPoints,
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

  return (
    <div className="h-screen flex flex-col bg-[#F7F8FA]">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-base font-medium text-gray-900">{releaseData.name}</h1>
            <p className="text-xs text-gray-500 mt-1">{release.name}</p>
          </div>
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={openEditRelease}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Edit release"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setConfirmDeleteRelease(true)}
              className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete release"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Storage indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md text-xs text-green-700 mr-2">
            <Database className="w-3.5 h-3.5" />
            <span>
              Data saved
              {lastSaved && (
                <span className="ml-1 text-green-600">
                  • {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </span>
          </div>
          
          <button
            onClick={handleResetStorage}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
            title="Reset to original mock data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          <button
            onClick={() => setShowTicketCreation({})}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>New Ticket</span>
          </button>

          <button
            onClick={() => setShowBulkImport({})}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-all border border-gray-200 hover:border-gray-300"
          >
            <Upload className="w-4 h-4" />
            <span>Import Tickets</span>
          </button>
          
          <button
            onClick={() => navigate(`/product/${releaseData.id}/team`)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-all border border-transparent hover:border-gray-200"
          >
            <Users className="w-4 h-4" />
            <span>Team Roster</span>
          </button>
          <button
            onClick={() => navigate(`/release/${releaseId}/team/holidays`)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-all border border-transparent hover:border-gray-200"
          >
            <Calendar className="w-4 h-4" />
            <span>Holidays</span>
          </button>
        </div>
      </div>

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
          conflictSummary={conflictSummary}
          sprintCapacities={sprintCapacities}
          onViewConflictDetails={() => setShowConflictResolution(true)}
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
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[380px] animate-fade-in">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Edit Release</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Name</label>
                <input
                  autoFocus
                  value={draftReleaseName}
                  onChange={e => setDraftReleaseName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Start Date</label>
                  <input
                    type="date"
                    value={draftStartDate}
                    onChange={e => setDraftStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">End Date</label>
                  <input
                    type="date"
                    value={draftEndDate}
                    onChange={e => setDraftEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              {draftEndDate && draftStartDate && draftEndDate < draftStartDate && (
                <p className="text-xs text-red-500">End date must be after start date</p>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setEditingRelease(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={commitEditRelease}
                disabled={!draftReleaseName.trim() || (draftEndDate < draftStartDate)}
                className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Release Confirmation */}
      {confirmDeleteRelease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[380px] animate-fade-in">
            <h3 className="text-sm font-semibold text-red-700 mb-2">Delete Release</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <strong>{release.name}</strong>? All features, tickets, and sprints within this release will be permanently removed.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteRelease(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRelease}
                className="px-4 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
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