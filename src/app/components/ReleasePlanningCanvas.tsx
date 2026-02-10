import { useState, useMemo, useEffect } from 'react';
import { Users, ArrowLeft, Calendar, Database, RotateCcw, Plus } from 'lucide-react';
import { useParams, useNavigate } from 'react-router';
import { TimelinePanel } from './TimelinePanel';
import { WorkloadModal } from './WorkloadModal';
import { TicketDetailsPanel } from './TicketDetailsPanel';
import { TicketCreationModal } from './TicketCreationModal';
import { mockProducts, Ticket, Feature, Sprint, mockHolidays, mockTeamMembers } from '../data/mockData';
import { detectConflicts, getConflictSummary } from '../lib/conflictDetection';
import { calculateAllSprintCapacities } from '../lib/capacityCalculation';
import { loadProducts, saveRelease, initializeStorage, getLastUpdated, loadHolidays, loadTeamMembers, forceRefreshStorage } from '../lib/localStorage';

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
  const teamMembers = useMemo(() => loadTeamMembers() || mockTeamMembers, [initialized]);
  
  // Find the release by ID
  const releaseData = useMemo(() => 
    products.find(product => product.releases.some(release => release.id === releaseId)),
    [products, releaseId]
  );
  
  // Find the specific release
  const currentRelease = useMemo(() => {
    if (!releaseData) return null;
    return releaseData.releases.find(r => r.id === releaseId) || releaseData.releases[0];
  }, [releaseData, releaseId]);

  if (!releaseData || !currentRelease) {
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

  const [release, setRelease] = useState(currentRelease);
  const [showWorkloadModal, setShowWorkloadModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<{ featureId: string; ticketId: string } | null>(null);
  const [showTicketCreation, setShowTicketCreation] = useState<{ featureId?: string } | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(getLastUpdated());

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
      }, 300); // Debounce saves by 300ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [release, releaseData?.id, initialized]);
  
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
    return release.features.flatMap(feature => feature.tickets);
  }, [release]);

  const conflicts = useMemo(() => {
    return detectConflicts(allTickets);
  }, [allTickets]);

  const conflictSummary = useMemo(() => {
    return getConflictSummary(conflicts, allTickets);
  }, [conflicts, allTickets]);

  // Calculate sprint capacities
  const sprintCapacities = useMemo(() => {
    return calculateAllSprintCapacities(
      release.sprints || [],
      allTickets,
      teamMembers,
      holidays,
      1 // velocity: 1 story point = 1 day
    );
  }, [release.sprints, allTickets, teamMembers, holidays]);

  const handleUpdateTicket = (featureId: string, ticketId: string, updates: Partial<Ticket>) => {
    setRelease(prev => ({
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
    }));
    
    // Update the selected ticket if it's the one being edited
    if (selectedTicket?.ticketId === ticketId) {
      const updatedFeature = release.features.find(f => f.id === featureId);
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
    setRelease(prev => ({
      ...prev,
      features: [...prev.features, newFeature]
    }));
    return id;
  };

  const handleAddTicketFull = (featureId: string, ticketData: Omit<Ticket, 'id'>) => {
    const newTicket: Ticket = {
      id: `t${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...ticketData
    };
    setRelease(prev => ({
      ...prev,
      features: prev.features.map(f =>
        f.id === featureId
          ? { ...f, tickets: [...f.tickets, newTicket] }
          : f
      )
    }));
  };

  const handleMoveTicket = (featureId: string, ticketId: string, newStartDate: Date) => {
    setRelease(prev => ({
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
    }));
  };

  const handleResizeTicket = (featureId: string, ticketId: string, newEndDate: Date) => {
    setRelease(prev => ({
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
    }));
  };

  const handleDeleteTicket = (featureId: string, ticketId: string) => {
    setRelease(prev => ({
      ...prev,
      features: prev.features.map(f => 
        f.id === featureId 
          ? { ...f, tickets: f.tickets.filter(t => t.id !== ticketId) }
          : f
      )
    }));
    setSelectedTicket(null);
  };

  const handleMoveTicketToFeature = (fromFeatureId: string, ticketId: string, toFeatureId: string) => {
    setRelease(prev => {
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
    
    setRelease(prev => ({
      ...prev,
      sprints: [...(prev.sprints || []), newSprint].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    }));
  };

  const handleUpdateSprint = (sprintId: string, name: string, startDate: Date, endDate: Date) => {
    setRelease(prev => ({
      ...prev,
      sprints: (prev.sprints || []).map(s => 
        s.id === sprintId ? { ...s, name, startDate, endDate } : s
      ).sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    }));
  };

  const handleDeleteSprint = (sprintId: string) => {
    setRelease(prev => ({
      ...prev,
      sprints: (prev.sprints || []).filter(s => s.id !== sprintId)
    }));
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
            onClick={() => navigate(`/release/${releaseId}/team`)}
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
          onCreateSprint={handleCreateSprint}
          onUpdateSprint={handleUpdateSprint}
          onDeleteSprint={handleDeleteSprint}
          conflicts={conflicts}
          conflictSummary={conflictSummary}
          sprintCapacities={sprintCapacities}
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
    </div>
  );
}