import { useState, useMemo } from 'react';
import { Users, ArrowLeft, Calendar } from 'lucide-react';
import { useParams, useNavigate } from 'react-router';
import { TimelinePanel } from './TimelinePanel';
import { WorkloadModal } from './WorkloadModal';
import { TicketDetailsPanel } from './TicketDetailsPanel';
import { mockProducts, Ticket, Feature, Sprint, mockHolidays, mockTeamMembers } from '../data/mockData';
import { detectConflicts, getConflictSummary } from '../lib/conflictDetection';
import { calculateAllSprintCapacities } from '../lib/capacityCalculation';

export function ReleasePlanningCanvas() {
  const { releaseId } = useParams();
  const navigate = useNavigate();
  
  // Find the release by ID
  const releaseData = mockProducts.find(product => product.releases.some(release => release.id === releaseId));
  
  if (!releaseData) {
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

  const [release, setRelease] = useState(releaseData.releases.find(release => release.id === releaseId) || releaseData.releases[0]);
  const [showWorkloadModal, setShowWorkloadModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<{ featureId: string; ticketId: string } | null>(null);

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
      mockTeamMembers,
      mockHolidays,
      1 // velocity: 1 story point = 1 day
    );
  }, [release.sprints, allTickets]);

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

  const handleSelectTicket = (featureId: string, ticketId: string) => {
    setSelectedTicket({ featureId, ticketId });
  };

  const handleAddFeature = () => {
    const newFeature: Feature = {
      id: `f${Date.now()}`,
      name: 'New Feature',
      tickets: []
    };
    setRelease(prev => ({
      ...prev,
      features: [...prev.features, newFeature]
    }));
  };

  const handleAddTicket = (featureId: string) => {
    const newTicket: Ticket = {
      id: `t${Date.now()}`,
      title: 'New Ticket',
      startDate: new Date(),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days later
      status: 'planned',
      storyPoints: 3,
      assignedTo: 'Unassigned'
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

  const handleBulkAddTickets = (featureId: string, ticketNames: string[], storyPoints: number, assignedTo: string) => {
    const baseDate = new Date();
    const ticketDuration = 5 * 24 * 60 * 60 * 1000; // 5 days
    
    const newTickets: Ticket[] = ticketNames.map((title, index) => {
      const startDate = new Date(baseDate.getTime() + (index * ticketDuration));
      const endDate = new Date(startDate.getTime() + ticketDuration);
      
      return {
        id: `t${Date.now()}-${index}`,
        title,
        startDate,
        endDate,
        status: 'planned',
        storyPoints,
        assignedTo
      };
    });
    
    setRelease(prev => ({
      ...prev,
      features: prev.features.map(f => 
        f.id === featureId 
          ? { ...f, tickets: [...f.tickets, ...newTickets] }
          : f
      )
    }));
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
      sprints: [...prev.sprints, newSprint].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
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
      <div className="flex-1 flex overflow-hidden">
        {/* Timeline Panel - Full Width */}
        <div className="flex-1 bg-white overflow-hidden">
          <TimelinePanel
                release={release}
                onMoveTicket={handleMoveTicket}
                onResizeTicket={handleResizeTicket}
                onSelectTicket={(featureId, ticketId) => {
                  setSelectedTicket({ featureId, ticketId });
                }}
                onCreateSprint={handleCreateSprint}
                conflicts={conflicts}
                conflictSummary={conflictSummary}
                sprintCapacities={sprintCapacities}
              />
        </div>
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
          ticket={release.features.find(f => f.id === selectedTicket.featureId)?.tickets.find(t => t.id === selectedTicket.ticketId) || {}}
          featureId={selectedTicket.featureId}
          release={release}
          onClose={() => setSelectedTicket(null)}
          onUpdate={handleUpdateTicket}
        />
      )}
    </div>
  );
}