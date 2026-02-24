import { useState, useRef, useMemo, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, GripVertical, ChevronDown, Calendar, Plus, Trash2, X, Link2 } from 'lucide-react';
import { Release, Ticket, Holiday, TeamMember, Milestone, MilestoneType, Phase, PhaseType, Feature, getMockPhasesForRelease } from '../data/mockData';
import { SprintCreationPopover } from './SprintCreationPopover';
import { TicketConflict, hasConflict } from '../lib/conflictDetection';
import { SprintCapacity, getCapacityStatusColor } from '../lib/capacityCalculation';
import designTokens, { getTicketColors, getConflictColors } from '../lib/designTokens';
import { TruncatedText } from './Tooltip';
import { resolveEffortDays } from '../lib/effortResolver';
import { toLocalDateString } from '../lib/dateUtils';
import { calculateWorkingDays } from '../lib/teamCapacityCalculation';
import { loadMilestones, saveMilestones, loadPhases, savePhases } from '../lib/localStorage';
import { AddMilestoneModal } from './AddMilestoneModal';
import { getTicketDependencyStatus, countBlockedTickets, getStatusDotColor, getStatusLabel } from '../lib/ticketDependencies';
import { getRoleColor, loadRoleColors, type TeamRole } from '../lib/roleColors';

// Helper: Count working days (Mon-Fri) between two dates
function countWorkingDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// Helper: Check if a ticket has PTO overlap and calculate working days overlap
function getPTOOverlapInfo(ticket: Ticket, assignedMember: TeamMember | undefined) {
  if (!assignedMember || !assignedMember.pto || assignedMember.pto.length === 0) {
    return { hasPtoRisk: false, overlapDays: 0, overlappingPTO: [] };
  }

  const ticketStart = new Date(ticket.startDate);
  ticketStart.setHours(0, 0, 0, 0);
  const ticketEnd = new Date(ticket.endDate);
  ticketEnd.setHours(0, 0, 0, 0);

  const overlappingPTO: Array<{ name: string; startDate: Date; endDate: Date; workingDays: number }> = [];
  const overlapDates = new Set<string>();

  assignedMember.pto.forEach(pto => {
    const ptoStart = new Date(pto.startDate);
    ptoStart.setHours(0, 0, 0, 0);
    const ptoEnd = new Date(pto.endDate);
    ptoEnd.setHours(0, 0, 0, 0);

    // Check if PTO overlaps with ticket
    if (ptoEnd >= ticketStart && ptoStart <= ticketEnd) {
      const overlapStart = ptoStart > ticketStart ? ptoStart : ticketStart;
      const overlapEnd = ptoEnd < ticketEnd ? ptoEnd : ticketEnd;
      
      const workingDays = countWorkingDays(overlapStart, overlapEnd);
      
      if (workingDays > 0) {
        overlappingPTO.push({
          name: pto.name,
          startDate: ptoStart,
          endDate: ptoEnd,
          workingDays
        });

        // Track unique overlap dates
        const current = new Date(overlapStart);
        while (current <= overlapEnd) {
          const dayOfWeek = current.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            overlapDates.add(toLocalDateString(current));
          }
          current.setDate(current.getDate() + 1);
        }
      }
    }
  });

  return {
    hasPtoRisk: overlappingPTO.length > 0,
    overlapDays: overlapDates.size,
    overlappingPTO
  };
}

// Helper: Check if a ticket overlaps with blocking milestones
function getBlockingMilestonesForTicket(ticket: Ticket, milestones: Milestone[]): Milestone[] {
  const ticketStart = new Date(ticket.startDate);
  ticketStart.setHours(0, 0, 0, 0);
  const ticketEnd = new Date(ticket.endDate);
  ticketEnd.setHours(0, 0, 0, 0);

  return milestones.filter(m => {
    if (!m.isBlocking) return false;
    
    const milestoneStart = new Date(m.startDate);
    milestoneStart.setHours(0, 0, 0, 0);
    const milestoneEnd = m.endDate ? new Date(m.endDate) : milestoneStart;
    milestoneEnd.setHours(0, 0, 0, 0);

    // Check if ticket overlaps with milestone
    return ticketStart <= milestoneEnd && ticketEnd >= milestoneStart;
  });
}

// Helper: Get milestone color by type
function getMilestoneColorForType(type: MilestoneType): string {
  const colors: Record<MilestoneType, string> = {
    Testing: '#eab308',
    Deployment: '#a855f7',
    Approval: '#3b82f6',
    Freeze: '#ef4444',
    Launch: '#22c55e',
    Other: '#6b7280',
  };
  return colors[type];
}

// Helper: Check if a ticket falls within Dev Window phases
function isTicketInDevWindow(ticket: Ticket, phases: Phase[]): boolean {
  const devPhases = phases.filter(p => p.allowsWork);
  
  if (devPhases.length === 0) return true; // No phases = all tickets valid
  
  const ticketStart = new Date(ticket.startDate);
  ticketStart.setHours(0, 0, 0, 0);
  const ticketEnd = new Date(ticket.endDate);
  ticketEnd.setHours(0, 0, 0, 0);
  
  // Check if ticket falls entirely within any Dev Window
  return devPhases.some(phase => {
    const phaseStart = new Date(phase.startDate);
    phaseStart.setHours(0, 0, 0, 0);
    const phaseEnd = new Date(phase.endDate);
    phaseEnd.setHours(0, 0, 0, 0);
    
    return ticketStart >= phaseStart && ticketEnd <= phaseEnd;
  });
}

// Helper: Get ticket color scheme based on spillover status
function getTicketColorScheme(
  ticket: Ticket, 
  isInDevWindow: boolean,
  hasConflict: boolean
): { background: string; border: string; accent: string; text: string } {
  // Conflict takes precedence
  if (hasConflict) {
    return {
      background: getConflictColors('warning').bg,
      border: getConflictColors('warning').border,
      accent: getConflictColors('warning').border,
      text: '#000000',
    };
  }
  
  // Spillover color scheme (orange/red warning)
  if (!isInDevWindow) {
    return {
      background: '#fed7aa', // Orange-200
      border: '#f97316', // Orange-500
      accent: '#f97316', // Orange-500
      text: '#9a3412', // Orange-900
    };
  }
  
  // Role-based color scheme (if requiredRole is set)
  if (ticket.requiredRole) {
    const roleColor = getRoleColor(ticket.requiredRole as TeamRole);
    return {
      background: `${roleColor}20`, // 20% opacity for background
      border: roleColor,
      accent: roleColor,
      text: '#000000',
    };
  }
  
  // Normal color scheme (existing logic)
  return {
    background: getTicketColors(ticket.status).bg,
    border: getTicketColors(ticket.status).border,
    accent: getTicketColors(ticket.status).accent,
    text: '#000000',
  };
}

// Feature Executive Bar Component for Executive View Mode
function FeatureExecutiveBar({
  feature,
  aggregates,
  dayWidth,
  getPositionFromDate,
  getDaysDifference,
  verticalOffset
}: {
  feature: Feature;
  aggregates: { ticketCount: number; totalDays: number; startDate: Date; endDate: Date };
  dayWidth: number;
  getPositionFromDate: (date: Date) => number;
  getDaysDifference: (date1: Date, date2: Date) => number;
  verticalOffset: number;
}) {
  const left = getPositionFromDate(aggregates.startDate);
  const width = getDaysDifference(aggregates.startDate, aggregates.endDate) * dayWidth;
  
  return (
    <div
      className="absolute px-3 py-2 rounded-lg border-2 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200"
      style={{
        left,
        width: Math.max(width, 100), // Minimum width for readability
        top: verticalOffset + 4, // 4px offset for centering within the row
        height: 32,
        backgroundColor: '#dbeafe',
        borderColor: '#2563eb',
        zIndex: 10
      }}
      title={`${feature.name}\n${aggregates.ticketCount} tickets\n${Math.round(aggregates.totalDays)} days`}
    >
      <div className="flex items-center justify-between h-full text-xs">
        <span className="font-semibold text-blue-900 truncate flex-1">
          {feature.name}
        </span>
        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
            {aggregates.ticketCount} tickets
          </span>
          <span className="px-1.5 py-0.5 bg-blue-700 text-white rounded text-[10px] font-bold">
            {Math.round(aggregates.totalDays)}d
          </span>
        </div>
      </div>
    </div>
  );
}

interface TimelinePanelProps {
  release: Release;
  holidays: Holiday[];
  teamMembers: TeamMember[];
  onMoveTicket: (featureId: string, ticketId: string, newStartDate: Date) => void;
  onResizeTicket: (featureId: string, ticketId: string, newEndDate: Date) => void;
  onSelectTicket: (featureId: string, ticketId: string) => void;
  onCloneTicket?: (featureId: string, ticketId: string) => void;
  onCreateSprint: (name: string, startDate: Date, endDate: Date) => void;
  onUpdateSprint?: (sprintId: string, name: string, startDate: Date, endDate: Date) => void;
  onDeleteSprint?: (sprintId: string) => void;
  conflicts: Map<string, TicketConflict>;
  sprintCapacities: Map<string, SprintCapacity>;
  showSprintCreation?: boolean;
  onShowSprintCreationChange?: (show: boolean) => void;
  showAddMilestoneModal?: boolean;
  onShowAddMilestoneModalChange?: (show: boolean) => void;
  zoomLevel?: 'day' | 'week' | 'month';
  viewMode?: 'detailed' | 'executive';
}

// ============================================
// TIMELINE CONSTANTS (Phase 2: Row Model)
// ============================================
// All dimensions in pixels - single source of truth
const GANTT_CONSTANTS = {
  // Row heights
  ROW_HEIGHT: 48,              // Ticket row height
  FEATURE_HEADER_HEIGHT: 40,   // Feature/epic header row
  PHASE_STRIP_HEIGHT: 32,      // Phase band strip at top (reduced from 60 for less noise)
  MILESTONE_STRIP_HEIGHT: 32,  // Milestone strip below phases (reduced from 50 for less noise)
  
  // Column widths
  DAY_WIDTH: 40,               // Default day column width (Day view)
  DAY_WIDTH_WEEK: 16,          // Day width in Week view (compressed)
  DAY_WIDTH_MONTH: 6,          // Day width in Month view (compressed)
  SIDEBAR_WIDTH: 320,          // Left panel width
  
  // Bar dimensions
  BAR_HEIGHT: 36,              // Actual bar height inside row
  BAR_MARGIN_TOP: 6,           // (ROW_HEIGHT - BAR_HEIGHT) / 2
  BAR_RADIUS: 6,               // Bar corner radius
  
  // Status indicator
  STATUS_DOT_SIZE: 8,          // Status dot diameter
  
  // Spacing
  BAR_PADDING_X: 8,            // Horizontal padding inside bar
  BAR_PADDING_Y: 4,            // Vertical padding inside bar
} as const;

// Backwards compatibility aliases
const ROW_HEIGHT = GANTT_CONSTANTS.ROW_HEIGHT;
const FEATURE_HEADER_HEIGHT = GANTT_CONSTANTS.FEATURE_HEADER_HEIGHT;
const SIDEBAR_WIDTH = GANTT_CONSTANTS.SIDEBAR_WIDTH;

export function TimelinePanel({ release, holidays, teamMembers, onMoveTicket, onResizeTicket, onSelectTicket, onCloneTicket, onCreateSprint, onUpdateSprint, onDeleteSprint, conflicts, sprintCapacities, showSprintCreation: externalShowSprintCreation, onShowSprintCreationChange, showAddMilestoneModal: externalShowAddMilestoneModal, onShowAddMilestoneModalChange, zoomLevel = 'day', viewMode = 'detailed' }: TimelinePanelProps) {
  // Calculate dynamic day width based on zoom level
  const DAY_WIDTH = zoomLevel === 'month' ? GANTT_CONSTANTS.DAY_WIDTH_MONTH : 
                    zoomLevel === 'week' ? GANTT_CONSTANTS.DAY_WIDTH_WEEK : 
                    GANTT_CONSTANTS.DAY_WIDTH;
  const roleColors = useMemo(() => loadRoleColors(), []);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [internalShowSprintCreation, setInternalShowSprintCreation] = useState(false);
  const [internalShowAddMilestoneModal, setInternalShowAddMilestoneModal] = useState(false);
  const showSprintCreation = externalShowSprintCreation ?? internalShowSprintCreation;
  const setShowSprintCreation = (show: boolean) => {
    if (onShowSprintCreationChange) {
      onShowSprintCreationChange(show);
    } else {
      setInternalShowSprintCreation(show);
    }
  };
  const showAddMilestoneModal = externalShowAddMilestoneModal ?? internalShowAddMilestoneModal;
  const setShowAddMilestoneModal = (show: boolean) => {
    if (onShowAddMilestoneModalChange) {
      onShowAddMilestoneModalChange(show);
    } else {
      setInternalShowAddMilestoneModal(show);
    }
  };
  const [showHolidays, setShowHolidays] = useState(false); // Default hidden to reduce noise
  const [showPTO, setShowPTO] = useState(true);
  const [showPhases, setShowPhases] = useState(false); // Default hidden to reduce noise
  const [showMilestones, setShowMilestones] = useState(false); // Default hidden to reduce noise
  const [showMilestonesList, setShowMilestonesList] = useState(false); // Expand/collapse milestone list
  const [collapsedFeatures, setCollapsedFeatures] = useState<Set<string>>(new Set());
  const [selectedDeveloperId, setSelectedDeveloperId] = useState<'all' | 'unassigned' | string>('all');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  
  // Refs for scroll synchronization
  const sidebarRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingScrollVertical = useRef(false);
  const isSyncingScrollHorizontal = useRef(false);

  const startDate = new Date(release.startDate);
  const endDate = new Date(release.endDate);
  
  // Load milestones for this release
  useEffect(() => {
    const loaded = loadMilestones(release.id);
    setMilestones(loaded);
  }, [release.id]);
  
  // Load phases for this release (auto-create mock phases if none exist)
  useEffect(() => {
    let loaded = loadPhases(release.id);
    
    // If no phases exist, create mock phases for immediate visualization
    if (loaded.length === 0) {
      const mockPhases = getMockPhasesForRelease(release);
      savePhases(release.id, mockPhases);
      loaded = mockPhases;
    }
    
    setPhases(loaded);
  }, [release.id]);
  
  // Handler to save new milestone
  const handleSaveMilestone = (milestone: Milestone) => {
    const updated = [...milestones, milestone];
    setMilestones(updated);
    saveMilestones(release.id, updated);
    setShowAddMilestoneModal(false);
  };

  // Handler to delete milestone
  const handleDeleteMilestone = (milestoneId: string) => {
    const updated = milestones.filter(m => m.id !== milestoneId);
    setMilestones(updated);
    saveMilestones(release.id, updated);
  };

  // Handler to clear all milestones
  const handleClearAllMilestones = () => {
    if (confirm(`Are you sure you want to delete all ${milestones.length} milestone(s)?`)) {
      setMilestones([]);
      saveMilestones(release.id, []);
    }
  };
  
  // Synchronize vertical scroll positions
  const handleSidebarScroll = () => {
    if (isSyncingScrollVertical.current) return;
    isSyncingScrollVertical.current = true;
    if (sidebarRef.current && timelineRef.current) {
      timelineRef.current.scrollTop = sidebarRef.current.scrollTop;
    }
    requestAnimationFrame(() => {
      isSyncingScrollVertical.current = false;
    });
  };
  
  const handleTimelineScroll = () => {
    if (isSyncingScrollVertical.current) return;
    isSyncingScrollVertical.current = true;
    if (sidebarRef.current && timelineRef.current) {
      sidebarRef.current.scrollTop = timelineRef.current.scrollTop;
    }
    requestAnimationFrame(() => {
      isSyncingScrollVertical.current = false;
    });
    
    // Also sync horizontal scroll with header
    handleTimelineHorizontalScroll();
  };
  
  // Synchronize horizontal scroll positions
  const handleHeaderScroll = () => {
    if (isSyncingScrollHorizontal.current) return;
    isSyncingScrollHorizontal.current = true;
    if (headerScrollRef.current && timelineRef.current) {
      timelineRef.current.scrollLeft = headerScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => {
      isSyncingScrollHorizontal.current = false;
    });
  };
  
  const handleTimelineHorizontalScroll = () => {
    if (isSyncingScrollHorizontal.current) return;
    isSyncingScrollHorizontal.current = true;
    if (headerScrollRef.current && timelineRef.current) {
      headerScrollRef.current.scrollLeft = timelineRef.current.scrollLeft;
    }
    requestAnimationFrame(() => {
      isSyncingScrollHorizontal.current = false;
    });
  };

  const getDaysDifference = (date1: Date, date2: Date) => {
    // Normalize both dates to start of day for accurate day counting
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const totalDays = getDaysDifference(startDate, endDate);
  const timelineWidth = (totalDays + 1) * DAY_WIDTH; // +1 to include end date

  const getPositionFromDate = (date: Date) => {
    const daysFromStart = getDaysDifference(startDate, date);
    return daysFromStart * DAY_WIDTH;
  };

  // Filter features/tickets based on selected developer
  const visibleFeatures = useMemo(() => {
    if (selectedDeveloperId === 'all') {
      return release.features;
    }

    if (selectedDeveloperId === 'unassigned') {
      return release.features
        .map(feature => ({
          ...feature,
          tickets: feature.tickets.filter(ticket => 
            !ticket.assignedTo || ticket.assignedTo.trim() === '' || ticket.assignedTo === 'Unassigned'
          )
        }))
        .filter(feature => feature.tickets.length > 0);
    }

    // Filter by specific developer
    const selectedMember = teamMembers.find(m => m.id === selectedDeveloperId);
    if (!selectedMember) {
      return release.features;
    }

    return release.features
      .map(feature => ({
        ...feature,
        tickets: feature.tickets.filter(ticket => 
          ticket.assignedTo === selectedMember.name
        )
      }))
      .filter(feature => feature.tickets.length > 0);
  }, [release.features, selectedDeveloperId, teamMembers]);

  // Calculate total content height using visible features
  const totalTickets = visibleFeatures.reduce((sum, f) => {
    const isCollapsed = collapsedFeatures.has(f.id);
    return sum + (isCollapsed ? 0 : f.tickets.length);
  }, 0);
  const totalFeatures = visibleFeatures.length;
  
  // Calculate content height including all spacers
  // In Executive mode, we only count feature headers (no individual ticket rows)
  let contentHeight = (totalFeatures * FEATURE_HEADER_HEIGHT);
  if (viewMode === 'detailed') {
    contentHeight += (totalTickets * ROW_HEIGHT);
  }
  // Add legend spacer
  contentHeight += GANTT_CONSTANTS.ROW_HEIGHT;
  // Add phase spacer if visible
  if (showPhases && phases.length > 0) {
    contentHeight += GANTT_CONSTANTS.PHASE_STRIP_HEIGHT;
  }
  // Add milestone spacer if visible
  if (showMilestones) {
    contentHeight += GANTT_CONSTANTS.MILESTONE_STRIP_HEIGHT;
  }

  // Helper function to calculate feature aggregates for Executive mode
  const getFeatureAggregates = (feature: Feature) => {
    if (feature.tickets.length === 0) {
      return {
        ticketCount: 0,
        totalDays: 0,
        startDate: feature.tickets[0]?.startDate || startDate,
        endDate: feature.tickets[0]?.endDate || endDate
      };
    }

    const ticketCount = feature.tickets.length;
    const totalDays = feature.tickets.reduce((sum: number, ticket: Ticket) => {
      return sum + (ticket.effortDays || ticket.storyPoints || 0);
    }, 0);
    
    const featureStartDate = new Date(Math.min(...feature.tickets.map((t: Ticket) => t.startDate.getTime())));
    const featureEndDate = new Date(Math.max(...feature.tickets.map((t: Ticket) => t.endDate.getTime())));
    
    return {
      ticketCount,
      totalDays,
      startDate: featureStartDate,
      endDate: featureEndDate
    };
  };

  return (
    <div className="h-full flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
      {/* 1.2.5: CSS animations for smooth transitions + 1.2.3: Loading animations */}
      <style>{`
        .header-scroll-hidden::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes fadeOut {
          0%, 80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
      
      {/* Sticky Header Row */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b-2 border-slate-200 dark:border-slate-700 flex relative shadow-md">
        {/* Left Sidebar Header */}
        <div 
          className="border-r-2 border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-sm flex flex-col"
          style={{ width: SIDEBAR_WIDTH, minWidth: SIDEBAR_WIDTH }}
        >
          <TimelineSidebarHeader 
            showHolidays={showHolidays}
            showPTO={showPTO}
            onToggleHolidays={setShowHolidays}
            onTogglePTO={setShowPTO}
            showPhases={showPhases}
            onTogglePhases={setShowPhases}
            showMilestones={showMilestones}
            onToggleMilestones={setShowMilestones}
            teamMembers={teamMembers}
            selectedDeveloperId={selectedDeveloperId}
            onChangeDeveloper={setSelectedDeveloperId}
          />
          {/* Role Legend - Between TICKETS and Sprint Summary */}
          <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Roles</div>
            <div className="grid grid-cols-4 gap-x-2 gap-y-1.5">
              {(['Frontend', 'Backend', 'Fullstack', 'QA', 'Designer', 'DataEngineer', 'iOS', 'Android'] as const).map((role) => {
                const color = getRoleColor(role, roleColors);
                return (
                  <div key={role} className="flex items-center gap-1">
                    <div 
                      className="w-2 h-2 rounded-full shadow-sm flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[9px] text-slate-600 dark:text-slate-400 truncate">
                      {role === 'DataEngineer' ? 'Data' : role}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <SprintSummaryPanel
            sprints={release.sprints || []}
            sprintCapacities={sprintCapacities}
          />
        </div>

        {/* Timeline Header (Dates + Sprints) - Scrollbar hidden, synced with timeline */}
        <div 
          ref={headerScrollRef}
          className="flex-1 overflow-x-auto header-scroll-hidden"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
          onScroll={handleHeaderScroll}
        >
          <div style={{ width: timelineWidth }}>
            <TimelineHeader
              startDate={startDate}
              totalDays={totalDays}
              dayWidth={DAY_WIDTH}
              sprints={release.sprints || []}
              getPositionFromDate={getPositionFromDate}
              getDaysDifference={getDaysDifference}
              sprintCapacities={sprintCapacities}
              zoomLevel={zoomLevel}
            />
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Ticket Names */}
        <div 
          ref={sidebarRef}
          className="border-r border-gray-200 bg-white flex-shrink-0 overflow-y-auto"
          style={{ width: SIDEBAR_WIDTH, minWidth: SIDEBAR_WIDTH }}
          onScroll={handleSidebarScroll}
        >
          {/* Sticky Phases Label - Only visible when enabled and phases exist */}
          {showPhases && phases.length > 0 && (
            <div 
              className="sticky top-0 px-4 flex items-center border-b border-gray-200 bg-gray-50"
              style={{ 
                height: GANTT_CONSTANTS.PHASE_STRIP_HEIGHT,
                zIndex: 20
              }}
            >
              <span
                style={{
                  fontSize: designTokens.typography.fontSize.xs,
                  fontWeight: designTokens.typography.fontWeight.semibold,
                  color: designTokens.colors.neutral[700],
                  letterSpacing: designTokens.typography.letterSpacing.wide
                }}
              >
                PHASES
              </span>
            </div>
          )}

          {/* Sticky Milestones Label - Only visible when enabled */}
          {showMilestones && (
            <div 
              className="sticky border-b border-gray-200 bg-white"
              style={{ 
                top: showPhases && phases.length > 0 ? GANTT_CONSTANTS.PHASE_STRIP_HEIGHT : 0,
                zIndex: 20
              }}
            >
              {/* Header with controls */}
              <div
                className="px-4 flex items-center"
                style={{ height: GANTT_CONSTANTS.MILESTONE_STRIP_HEIGHT }}
              >
                <span
                  style={{
                    fontSize: designTokens.typography.fontSize.xs,
                    fontWeight: designTokens.typography.fontWeight.semibold,
                    color: designTokens.colors.neutral[700],
                    letterSpacing: designTokens.typography.letterSpacing.wide
                  }}
                >
                  MILESTONES ({milestones.length})
                </span>
                <div className="ml-auto flex items-center gap-1">
                  {milestones.length > 0 && (
                    <>
                      <button
                        onClick={() => setShowMilestonesList(!showMilestonesList)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title={showMilestonesList ? "Hide list" : "Show list"}
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMilestonesList ? 'rotate-180' : ''}`} />
                      </button>
                      <button
                        onClick={handleClearAllMilestones}
                        className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                        title="Clear all milestones"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowAddMilestoneModal(true)}
                    className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                    title="Add Milestone"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              {/* Expandable milestone list */}
              {showMilestonesList && milestones.length > 0 && (
                <div className="px-4 py-2 bg-slate-50 max-h-32 overflow-y-auto">
                  {milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between py-1.5 px-2 mb-1 bg-white rounded border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-700 truncate">
                            {milestone.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                            backgroundColor: `${getMilestoneColorForType(milestone.type)}20`,
                            color: getMilestoneColorForType(milestone.type)
                          }}>
                            {milestone.type}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {milestone.dateType === 'single' 
                            ? toLocalDateString(milestone.startDate)
                            : `${toLocalDateString(milestone.startDate)} - ${milestone.endDate ? toLocalDateString(milestone.endDate) : '?'}`
                          }
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteMilestone(milestone.id)}
                        className="ml-2 p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                        title="Delete milestone"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Timeline Legend - No more spillover warning here */}
          <div className="px-5 py-3.5 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/30 border-b-2 border-slate-100 dark:border-slate-800 shadow-sm">
            {/* Timeline Legend */}
            <div className="flex items-center gap-5 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-200 border-2 border-blue-500 rounded shadow-sm" />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Planned</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-yellow-200 border-2 border-yellow-500 rounded shadow-sm" />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-5 h-5 bg-orange-200 border-2 border-orange-500 rounded shadow-sm" 
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(249, 115, 22, 0.2) 2px, rgba(249, 115, 22, 0.2) 4px)'
                  }}
                />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Spillover</span>
              </div>
            </div>
          </div>

          {/* Spacers to align with timeline phases/milestones when visible */}
          {showPhases && phases.length > 0 && (
            <div style={{ height: GANTT_CONSTANTS.PHASE_STRIP_HEIGHT }} />
          )}
          {showMilestones && (
            <div style={{ height: GANTT_CONSTANTS.MILESTONE_STRIP_HEIGHT }} />
          )}

          {visibleFeatures.map((feature, featureIndex) => {
            const isCollapsed = collapsedFeatures.has(feature.id);
            const ticketCount = feature.tickets.length;
            const featureAggregates = viewMode === 'executive' ? getFeatureAggregates(feature) : null;
            
            return (
              <div 
                key={feature.id} 
                className="border-b border-gray-100"
                style={{ 
                  backgroundColor: featureIndex % 2 === 0 ? '#ffffff' : '#fafafa'
                }}
              >
                {/* Feature Header (Enhanced with 1.2.5 smooth arrow rotation) */}
                <div 
                  className="flex items-center px-5 cursor-pointer hover:bg-gray-50 transition-all duration-200"
                  style={{ height: FEATURE_HEADER_HEIGHT }}
                  onClick={() => {
                    // In Executive mode, don't allow expand/collapse
                    if (viewMode === 'executive') return;
                    
                    const newCollapsed = new Set(collapsedFeatures);
                    if (isCollapsed) {
                      newCollapsed.delete(feature.id);
                    } else {
                      newCollapsed.add(feature.id);
                    }
                    setCollapsedFeatures(newCollapsed);
                  }}
                >
                  <div className="flex items-center gap-2.5 flex-1">
                    {/* Arrow only shown in Detailed mode */}
                    {viewMode === 'detailed' && (
                      <span 
                        className="text-sm transition-transform duration-200 ease-out"
                        style={{
                          transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                          transformOrigin: 'center',
                          color: designTokens.colors.neutral[600]
                        }}
                      >
                        ▶
                      </span>
                    )}
                    <span 
                      className="font-bold tracking-tight"
                      style={{
                        fontSize: designTokens.typography.fontSize.sm,
                        color: designTokens.colors.neutral[800]
                      }}
                    >
                      {feature.name}
                    </span>
                    <span 
                      className="px-2.5 py-1 rounded-full shadow-sm"
                      style={{
                        fontSize: designTokens.typography.fontSize.xs,
                        fontWeight: designTokens.typography.fontWeight.semibold,
                        color: designTokens.colors.neutral[700],
                        backgroundColor: designTokens.colors.neutral[100]
                      }}
                    >
                      {ticketCount}
                    </span>
                    {/* Show total days in Executive mode */}
                    {viewMode === 'executive' && featureAggregates && (
                      <span 
                        className="px-2.5 py-1 rounded-full shadow-sm text-xs font-semibold"
                        style={{
                          color: '#2563eb',
                          backgroundColor: '#dbeafe'
                        }}
                      >
                        {Math.round(featureAggregates.totalDays)}d
                      </span>
                    )}
                  </div>
                </div>

                {/* Feature Tickets - Names (1.2.5: Staggered fade-in) - Only in Detailed mode */}
                {viewMode === 'detailed' && !isCollapsed && feature.tickets.map((ticket, ticketIndex) => (
                  <div
                    key={ticket.id}
                    style={{
                      animation: 'fadeInSlide 0.2s ease-out forwards',
                      animationDelay: `${ticketIndex * 30}ms`,
                      opacity: 0,
                    }}
                  >
                    <TicketSidebarRow
                      ticket={ticket}
                      rowHeight={ROW_HEIGHT}
                      isSelected={selectedTicketId === ticket.id}
                      hasConflict={hasConflict(ticket.id, conflicts)}
                      isLastInFeature={ticketIndex === feature.tickets.length - 1}
                      onClick={() => {
                        setSelectedTicketId(ticket.id);
                        onSelectTicket(feature.id, ticket.id);
                      }}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Right Timeline - Gantt Chart */}
        <div 
          ref={timelineRef}
          className="flex-1 overflow-auto relative bg-[#FAFBFC]"
          onScroll={handleTimelineScroll}
        >
          <div className="relative" style={{ width: timelineWidth, minHeight: '100%' }}>

            {/* STICKY PHASES ROW - Scrolls horizontally, sticky vertically */}
            {showPhases && phases.length > 0 && (
              <div 
                className="sticky"
                style={{ 
                  top: 0,
                  zIndex: 10
                }}
              >
                <PhasesBandRow
                  phases={phases}
                  startDate={startDate}
                  endDate={endDate}
                  getPositionFromDate={getPositionFromDate}
                  getDaysDifference={getDaysDifference}
                  dayWidth={DAY_WIDTH}
                />
              </div>
            )}

            {/* STICKY MILESTONES ROW - Scrolls horizontally, sticky vertically */}
            {showMilestones && (
              <div 
                className="sticky"
                style={{ 
                  top: showPhases && phases.length > 0 ? GANTT_CONSTANTS.PHASE_STRIP_HEIGHT : 0,
                  zIndex: 10
                }}
              >
                <MilestonesRow
                  milestones={milestones}
                  startDate={startDate}
                  endDate={endDate}
                  getPositionFromDate={getPositionFromDate}
                  getDaysDifference={getDaysDifference}
                  dayWidth={DAY_WIDTH}
                />
              </div>
            )}
            
            {/* Absolute layers container - positioned below sticky strips to align with sidebar tickets */}
            <div className="absolute" style={{ 
              top: (showPhases && phases.length > 0 ? GANTT_CONSTANTS.PHASE_STRIP_HEIGHT : 0) + (showMilestones ? GANTT_CONSTANTS.MILESTONE_STRIP_HEIGHT : 0),
              left: 0, 
              right: 0, 
              height: contentHeight
            }}>
              {/* LAYER 1: TIME GRID */}
              <TimeGrid 
                totalDays={totalDays} 
                dayWidth={DAY_WIDTH} 
                contentHeight={contentHeight}
                startDate={startDate}
              />

              {/* LAYER 2: SPRINT BANDS */}
              <SprintBands
                sprints={release.sprints || []}
                getPositionFromDate={getPositionFromDate}
                getDaysDifference={getDaysDifference}
                dayWidth={DAY_WIDTH}
              />

              {/* LAYER 3: HOLIDAYS */}
              {showHolidays && (
                <HolidayBands
                  holidays={holidays}
                  startDate={startDate}
                  endDate={endDate}
                  getPositionFromDate={getPositionFromDate}
                  getDaysDifference={getDaysDifference}
                  dayWidth={DAY_WIDTH}
                />
              )}
            </div>

            {/* LAYER 4: TICKET BARS - Rendered in natural flow matching sidebar */}
            {/* Spacers to match the sidebar layout */}
            {/* Spacer for phases strip (if visible) */}
            {showPhases && phases.length > 0 && (
              <div style={{ height: GANTT_CONSTANTS.PHASE_STRIP_HEIGHT }} />
            )}
            {/* Spacer for milestones strip (if visible) */}
            {showMilestones && (
              <div style={{ height: GANTT_CONSTANTS.MILESTONE_STRIP_HEIGHT }} />
            )}
            {/* Spacer to match the legend height in left sidebar */}
            <div style={{ height: GANTT_CONSTANTS.ROW_HEIGHT }} />
            
            {(() => {
              // Calculate initial offset from spacers
              let cumulativeOffset = GANTT_CONSTANTS.ROW_HEIGHT; // Legend spacer
              if (showPhases && phases.length > 0) {
                cumulativeOffset += GANTT_CONSTANTS.PHASE_STRIP_HEIGHT;
              }
              if (showMilestones) {
                cumulativeOffset += GANTT_CONSTANTS.MILESTONE_STRIP_HEIGHT;
              }

              return visibleFeatures.map((feature) => {
                const isCollapsed = collapsedFeatures.has(feature.id);
                const featureAggregates = viewMode === 'executive' ? getFeatureAggregates(feature) : null;
                const currentOffset = cumulativeOffset;
                
                // Update cumulative offset for next feature
                cumulativeOffset += FEATURE_HEADER_HEIGHT;
                if (viewMode === 'detailed' && !isCollapsed) {
                  cumulativeOffset += feature.tickets.length * ROW_HEIGHT;
                }
                
                return (
                  <div key={feature.id}>
                    {/* Feature Header Spacer */}
                    <div style={{ height: FEATURE_HEADER_HEIGHT }} />

                    {/* Executive Mode: Feature-level bar */}
                    {viewMode === 'executive' && featureAggregates && featureAggregates.ticketCount > 0 && (
                      <FeatureExecutiveBar
                        feature={feature}
                        aggregates={featureAggregates}
                        dayWidth={DAY_WIDTH}
                        getPositionFromDate={getPositionFromDate}
                        getDaysDifference={getDaysDifference}
                        verticalOffset={currentOffset}
                      />
                    )}

                    {/* Detailed Mode: Individual Ticket Bars (1.2.5: Staggered animation) */}
                    {viewMode === 'detailed' && !isCollapsed && feature.tickets.map((ticket, ticketIndex) => (
                    <div
                      key={ticket.id}
                      className="ticket-bar"
                      style={{
                        animation: 'slideInFromLeft 0.25s ease-out forwards',
                        animationDelay: `${ticketIndex * 30}ms`,
                        opacity: 0,
                      }}
                    >
                      <TicketTimelineBar
                        ticket={ticket}
                        featureId={feature.id}
                        featureName={feature.name}
                        rowHeight={ROW_HEIGHT}
                        dayWidth={DAY_WIDTH}
                        getPositionFromDate={getPositionFromDate}
                        getDaysDifference={getDaysDifference}
                        isSelected={selectedTicketId === ticket.id}
                        onSelect={() => {
                          setSelectedTicketId(ticket.id);
                          onSelectTicket(feature.id, ticket.id);
                        }}
                        onMove={(newStartDate) => onMoveTicket(feature.id, ticket.id, newStartDate)}
                        onResize={(newEndDate) => onResizeTicket(feature.id, ticket.id, newEndDate)}
                        onClone={onCloneTicket ? () => onCloneTicket(feature.id, ticket.id) : undefined}
                        showPTO={showPTO}
                        startDate={startDate}
                        endDate={endDate}
                        hasConflict={hasConflict(ticket.id, conflicts)}
                        conflicts={conflicts}
                        teamMembers={teamMembers}
                        milestones={milestones}
                        phases={phases}
                        holidays={holidays}
                        isLastInFeature={ticketIndex === feature.tickets.length - 1}
                      />
                    </div>
                  ))}
                </div>
              );
            });
          })()}
          </div>
        </div>
      </div>

      {showSprintCreation && (
        <SprintCreationPopover
          onClose={() => setShowSprintCreation(false)}
          onCreateSprint={(name, startDate, endDate) => {
            onCreateSprint(name, startDate, endDate);
            setShowSprintCreation(false);
          }}
          onUpdateSprint={onUpdateSprint}
          onDeleteSprint={onDeleteSprint}
          defaultStartDate={release.startDate}
          existingSprints={release.sprints || []}
        />
      )}

      {showAddMilestoneModal && (
        <AddMilestoneModal
          isOpen={showAddMilestoneModal}
          onClose={() => setShowAddMilestoneModal(false)}
          releaseId={release.id}
          onSave={handleSaveMilestone}
          releaseStartDate={release.startDate}
          releaseEndDate={release.endDate}
        />
      )}
    </div>
  );
}

// LAYER 1: TIME GRID (Enhanced with today indicator, weekend shading, month boundaries - Premium styling)
// Phase 7: Memoized for performance
const TimeGrid = memo(function TimeGrid({ 
  totalDays, 
  dayWidth, 
  contentHeight,
  startDate
}: { 
  totalDays: number; 
  dayWidth: number; 
  contentHeight: number;
  startDate: Date;
}) {
  // Get today's date for today indicator
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1, height: contentHeight, backgroundColor: 'rgba(0, 0, 0, 0.03)' }}
    >
      {/* Weekend shading + vertical day lines */}
      {Array.from({ length: totalDays + 1 }).map((_, i) => {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isWeekBoundary = i % 7 === 0;
        const isMonthStart = currentDate.getDate() === 1;
        
        return (
          <div key={`day-${i}`}>
            {/* Weekend shading - keep de-emphasized but clear */}
            {isWeekend && (
              <div
                className="absolute"
                style={{
                  left: i * dayWidth,
                  width: dayWidth,
                  height: contentHeight,
                  top: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.06)',
                  zIndex: 0,
                }}
              />
            )}
            
            {/* Vertical day lines - more prominent */}
            <div
              className="absolute"
              style={{
                left: i * dayWidth,
                width: isMonthStart ? '1.5px' : '1px',
                height: contentHeight,
                top: 0,
                backgroundColor: isMonthStart 
                  ? 'rgba(0, 0, 0, 0.14)'
                  : isWeekBoundary 
                    ? 'rgba(0, 0, 0, 0.075)' 
                    : 'rgba(0, 0, 0, 0.05)',
                zIndex: 1,
              }}
            />
          </div>
        );
      })}
      
      {/* Today indicator - rendered on top */}
      <TodayIndicator 
        dayWidth={dayWidth} 
        contentHeight={contentHeight} 
        startDate={startDate}
      />
    </div>
  );
});

// Today Indicator Component (red vertical line with badge)
function TodayIndicator({ 
  dayWidth, 
  contentHeight,
  startDate
}: { 
  dayWidth: number; 
  contentHeight: number;
  startDate: Date;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const releaseStart = new Date(startDate);
  releaseStart.setHours(0, 0, 0, 0);
  
  // Calculate days difference
  const diffTime = today.getTime() - releaseStart.getTime();
  const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Only show if today is within the release timeline
  if (daysDiff < 0) return null;
  
  const todayPosition = daysDiff * dayWidth;
  
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: todayPosition,
        width: '2px',
        height: contentHeight,
        top: 0,
        backgroundColor: designTokens.colors.today.line,
        zIndex: 100,
        boxShadow: `0 0 8px ${designTokens.colors.today.line}`,
      }}
    >
      {/* Today badge at top */}
      <div
        className="absolute flex items-center justify-center text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
        style={{
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: designTokens.colors.today.badge,
          color: designTokens.colors.today.text,
          boxShadow: designTokens.shadows.md,
          pointerEvents: 'auto',
        }}
      >
        TODAY
      </div>
    </div>
  );
}

// LAYER 2: SPRINT BANDS (Enhanced with gradients and progress overlay)
// Phase 7: Memoized for performance
const SprintBands = memo(function SprintBands({
  sprints,
  getPositionFromDate,
  getDaysDifference,
  dayWidth
}: {
  sprints: any[];
  getPositionFromDate: (date: Date) => number;
  getDaysDifference: (date1: Date, date2: Date) => number;
  dayWidth: number;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
      {sprints.map((sprint, index) => {
        const left = getPositionFromDate(sprint.startDate);
        const width = getDaysDifference(sprint.startDate, sprint.endDate) * dayWidth;
        
        return (
          <div
            key={sprint.id}
            className="absolute top-0 bottom-0"
            style={{
              left,
              width,
              background: index % 2 === 0 
                ? 'rgba(59, 130, 246, 0.02)'
                : 'transparent',
              borderLeft: `1px solid rgba(59, 130, 246, 0.08)`,
              borderRight: `1px solid rgba(59, 130, 246, 0.08)`,
            }}
          />
        );
      })}
    </div>
  );
});

// LAYER 3: HOLIDAYS (Vertical bars - Gantt standard)
// Phase 7: Memoized for performance
const HolidayBands = memo(function HolidayBands({
  holidays,
  startDate,
  endDate,
  getPositionFromDate,
  getDaysDifference,
  dayWidth
}: {
  holidays: any[];
  startDate: Date;
  endDate: Date;
  getPositionFromDate: (date: Date) => number;
  getDaysDifference: (date1: Date, date2: Date) => number;
  dayWidth: number;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: designTokens.zIndex.holidays }}>
      {holidays.map((holiday) => {
        if (holiday.endDate < startDate || holiday.startDate > endDate) return null;
        
        const overlayStart = holiday.startDate < startDate ? startDate : holiday.startDate;
        const overlayEnd = holiday.endDate > endDate ? endDate : holiday.endDate;
        const left = getPositionFromDate(overlayStart);
        const width = (getDaysDifference(overlayStart, overlayEnd) + 1) * dayWidth;
        
        return (
          <div
            key={holiday.id}
            className="absolute top-0 bottom-0"
            style={{
              left,
              width,
              backgroundColor: designTokens.colors.overlay.holiday.primary,
              borderLeft: `1px solid ${designTokens.colors.overlay.holiday.secondary}`,
              borderRight: `1px solid ${designTokens.colors.overlay.holiday.secondary}`,
            }}
          >
            {/* Vertical holiday name text - positioned at top */}
            <div 
              className="absolute left-1 pointer-events-none"
              style={{
                top: '8px',
                transformOrigin: 'top left',
                transform: 'rotate(90deg)',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                className="text-[12px] font-semibold tracking-wide"
                style={{
                  color: designTokens.colors.overlay.holiday.badge,
                  textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
                }}
              >
                {holiday.name}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
});

// HEADER - Premium MS Project/Smartsheet feel with daily date numbers
function TimelineHeader({
  startDate,
  totalDays,
  dayWidth,
  sprints,
  getPositionFromDate,
  getDaysDifference,
  sprintCapacities,
  zoomLevel = 'day'
}: {
  startDate: Date;
  totalDays: number;
  dayWidth: number;
  sprints: any[];
  getPositionFromDate: (date: Date) => number;
  getDaysDifference: (date1: Date, date2: Date) => number;
  sprintCapacities: Map<string, SprintCapacity>;
  zoomLevel?: 'day' | 'week' | 'month';
}) {
  // Calculate month spans for the header band
  const monthSpans: Array<{ label: string; startIndex: number; days: number }> = [];
  let currentMonth = -1;
  let currentMonthStart = 0;
  let currentMonthDays = 0;
  
  for (let i = 0; i <= totalDays; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    const month = currentDate.getMonth();
    
    if (month !== currentMonth) {
      if (currentMonth !== -1) {
        monthSpans.push({
          label: new Date(startDate.getFullYear(), currentMonth, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          startIndex: currentMonthStart,
          days: currentMonthDays
        });
      }
      currentMonth = month;
      currentMonthStart = i;
      currentMonthDays = 1;
    } else {
      currentMonthDays++;
    }
  }
  // Add the last month
  if (currentMonth !== -1) {
    monthSpans.push({
      label: new Date(startDate.getFullYear(), currentMonth, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      startIndex: currentMonthStart,
      days: currentMonthDays
    });
  }

  // Derived info for the header strip
  const headerEndDate = new Date(startDate);
  headerEndDate.setDate(headerEndDate.getDate() + totalDays);
  const releaseWorkingDays = calculateWorkingDays(startDate, headerEndDate);

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 shadow-sm">
      {/* Header strip: uses otherwise-empty space and improves calendar readability */}
      <div className="flex h-10 items-center justify-between px-3 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-800/50">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight">Calendar</span>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
            {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – {headerEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 flex-shrink-0">
          <span className="font-medium text-slate-900 dark:text-white">{totalDays + 1} days</span>
          <span className="font-medium text-slate-900 dark:text-white">{releaseWorkingDays} working</span>
        </div>
      </div>

      {/* Month band */}
      <div className="flex h-7 items-center border-b border-slate-200/50 dark:border-slate-700/50 relative bg-gradient-to-br from-slate-50/30 to-slate-100/30 dark:from-slate-800/30 dark:to-slate-900/30">
        {monthSpans.map((span, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 px-2 flex items-center"
            style={{ 
              width: span.days * dayWidth,
              borderRight: idx < monthSpans.length - 1 ? '1px solid rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <span className="text-[10px] font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              {span.label}
            </span>
          </div>
        ))}
      </div>

      {/* Date labels - Adaptive based on zoom level */}
      <div className="flex h-12 items-center border-b border-slate-200 dark:border-slate-700 relative">
        {zoomLevel === 'day' && (
          // DAY VIEW: Show every individual day
          Array.from({ length: totalDays + 1 }).map((_, i) => {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + i);
            const dayOfMonth = currentDate.getDate();
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
            const isMonthStart = dayOfMonth === 1;
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const cellDate = new Date(currentDate);
            cellDate.setHours(0, 0, 0, 0);
            const isToday = cellDate.getTime() === today.getTime();
            
            return (
              <div
                key={i}
                className="flex-shrink-0 px-0.5 py-1.5 relative flex flex-col items-center justify-center"
                style={{ 
                  width: dayWidth,
                  backgroundColor: isToday ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                  borderLeft: isMonthStart ? '1.5px solid rgba(0,0,0,0.12)' : 'none'
                }}
              >
                <div 
                  className="text-[11px] font-semibold leading-none mb-0.5" 
                  style={{ 
                    color: isToday ? designTokens.colors.today.line : isWeekend ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.82)',
                    fontWeight: isToday ? 'bold' : isMonthStart ? 700 : 600,
                  }}
                >
                  {dayOfMonth}
                </div>
                <div 
                  className="text-[9px] font-medium leading-none" 
                  style={{ 
                    color: isToday ? designTokens.colors.today.line : isWeekend ? 'rgba(0, 0, 0, 0.28)' : 'rgba(0, 0, 0, 0.55)',
                    fontWeight: isToday ? 'bold' : 500,
                  }}
                >
                  {currentDate.toLocaleDateString('en-US', { weekday: 'narrow' })}
                </div>
                {isToday && (
                  <div
                    className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2"
                    style={{
                      width: '3px',
                      height: '3px',
                      borderRadius: '50%',
                      backgroundColor: designTokens.colors.today.line,
                    }}
                  />
                )}
              </div>
            );
          })
        )}
        
        {zoomLevel === 'week' && (
          // WEEK VIEW: Show week ranges (Mon-Sun)
          (() => {
            const weeks: Array<{ weekNum: number; startDate: Date; endDate: Date; dayCount: number }> = [];
            let weekNum = 1;
            let dayIndex = 0;
            
            while (dayIndex <= totalDays) {
              const currentDate = new Date(startDate);
              currentDate.setDate(currentDate.getDate() + dayIndex);
              
              // Find end of week (Sunday) or end of timeline
              let weekEnd = new Date(currentDate);
              let daysInWeek = 1;
              
              while (dayIndex + daysInWeek <= totalDays && weekEnd.getDay() !== 0) {
                weekEnd.setDate(weekEnd.getDate() + 1);
                daysInWeek++;
              }
              
              weeks.push({
                weekNum,
                startDate: new Date(currentDate),
                endDate: new Date(weekEnd),
                dayCount: daysInWeek
              });
              
              weekNum++;
              dayIndex += daysInWeek;
            }
            
            return weeks.map((week, idx) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isCurrentWeek = today >= week.startDate && today <= week.endDate;
              
              return (
                <div
                  key={idx}
                  className="flex-shrink-0 px-2 py-1.5 relative flex flex-col items-center justify-center border-r border-slate-200/50 dark:border-slate-700/50"
                  style={{ 
                    width: week.dayCount * dayWidth,
                    backgroundColor: isCurrentWeek ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                  }}
                >
                  <div className="text-[10px] font-bold leading-none mb-1 text-slate-900 dark:text-white">
                    W{week.weekNum}
                  </div>
                  <div className="text-[9px] font-medium leading-none text-slate-600 dark:text-slate-400">
                    {week.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-[8px] font-medium leading-none text-slate-500 dark:text-slate-500 mt-0.5">
                    {week.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  {isCurrentWeek && (
                    <div
                      className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2"
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: designTokens.colors.today.line,
                      }}
                    />
                  )}
                </div>
              );
            });
          })()
        )}
        
        {zoomLevel === 'month' && (
          // MONTH VIEW: Show sprint boundaries with dates and duration
          (() => {
            if (!sprints || sprints.length === 0) {
              // Fallback: Show month bands if no sprints
              return monthSpans.map((span, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 px-3 py-1.5 flex flex-col items-center justify-center border-r border-slate-200/50 dark:border-slate-700/50"
                  style={{ width: span.days * dayWidth }}
                >
                  <div className="text-[11px] font-bold text-slate-900 dark:text-white">
                    {span.label.split(' ')[0]}
                  </div>
                  <div className="text-[8px] text-slate-500 dark:text-slate-500 mt-0.5">
                    {span.days}d
                  </div>
                </div>
              ));
            }
            
            // Show sprints with their date ranges
            return sprints.map((sprint) => {
              const sprintStart = new Date(sprint.startDate);
              const sprintEnd = new Date(sprint.endDate);
              const sprintDays = getDaysDifference(sprintStart, sprintEnd) + 1;
              const capacity = sprintCapacities.get(sprint.id);
              const utilizationPercent = capacity ? (capacity.plannedDays / capacity.totalTeamDays) * 100 : 0;
              
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isCurrentSprint = today >= sprintStart && today <= sprintEnd;
              
              return (
                <div
                  key={sprint.id}
                  className="flex-shrink-0 px-2 py-1.5 relative flex flex-col items-center justify-center border-r border-slate-300 dark:border-slate-600"
                  style={{ 
                    width: sprintDays * dayWidth,
                    backgroundColor: isCurrentSprint ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                  }}
                >
                  <div className="text-[10px] font-bold leading-none text-slate-900 dark:text-white truncate max-w-full px-1">
                    {sprint.name}
                  </div>
                  <div className="text-[8px] font-medium leading-none text-slate-600 dark:text-slate-400 mt-1">
                    {sprintStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-[8px] font-medium leading-none text-slate-500 dark:text-slate-500">
                    {sprintEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-[7px] font-semibold leading-none mt-1" style={{
                    color: utilizationPercent > 100 ? '#dc2626' : utilizationPercent >= 90 ? '#f59e0b' : '#10b981'
                  }}>
                    {sprintDays}d · {Math.round(utilizationPercent)}%
                  </div>
                  {isCurrentSprint && (
                    <div
                      className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2"
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: designTokens.colors.today.line,
                      }}
                    />
                  )}
                </div>
              );
            });
          })()
        )}
      </div>

      {/* Sprint labels with integrated capacity */}
      <SprintHeaderRow
        sprints={sprints}
        sprintCapacities={sprintCapacities}
        getPositionFromDate={getPositionFromDate}
        getDaysDifference={getDaysDifference}
        dayWidth={dayWidth}
        zoomLevel={zoomLevel}
      />
    </div>
  );
}

// SPRINT HEADER ROW: Simplified minimal bars to avoid scroll flickering
// Phase 7: Memoized for performance
const SprintHeaderRow = memo(function SprintHeaderRow({
  sprints,
  sprintCapacities,
  getPositionFromDate,
  getDaysDifference,
  dayWidth,
  zoomLevel = 'day'
}: {
  sprints: any[];
  sprintCapacities: Map<string, SprintCapacity>;
  getPositionFromDate: (date: Date) => number;
  getDaysDifference: (date1: Date, date2:Date) => number;
  dayWidth: number;
  zoomLevel?: 'day' | 'week' | 'month';
}) {
  const getStatusColor = (utilizationPercent: number) => {
    if (utilizationPercent > 100) return '#dc2626';
    if (utilizationPercent >= 90) return '#f59e0b';
    if (utilizationPercent >= 70) return '#10b981';
    return '#6b7280';
  };

  // Only show sprint bars in day view, hidden in week/month view
  if (zoomLevel === 'week' || zoomLevel === 'month') {
    return null;
  }

  return (
    <div className="relative h-12 border-b border-slate-200 dark:border-slate-700" style={{ backgroundColor: 'rgba(0, 0, 0, 0.015)' }}>
      {sprints.map((sprint) => {
        const left = getPositionFromDate(sprint.startDate);
        const width = getDaysDifference(sprint.startDate, sprint.endDate) * dayWidth;
        const capacity = sprintCapacities?.get(sprint.id);
        const statusColor = capacity ? getStatusColor(capacity.utilizationPercent) : '#6b7280';
        
        return (
          <div
            key={sprint.id}
            className="absolute px-2 py-1.5"
            style={{
              left,
              width,
              top: 0,
              height: 48,
              borderLeft: '2px solid rgba(0, 0, 0, 0.15)',
              borderRight: '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* Sprint name */}
            <div 
              className="text-[10px] font-semibold truncate mb-1"
              style={{ color: designTokens.colors.neutral[700] }}
            >
              {sprint.name}
            </div>

            {/* Capacity progress bar */}
            {capacity && (
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(capacity.utilizationPercent, 100)}%`,
                        backgroundColor: statusColor
                      }}
                    />
                  </div>
                  <span 
                    className="text-[9px] font-bold whitespace-nowrap"
                    style={{ color: statusColor }}
                  >
                    {Math.round(capacity.utilizationPercent)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

// Sprint Summary Panel - Fixed position at top of sidebar
function SprintSummaryPanel({
  sprints,
  sprintCapacities
}: {
  sprints: any[];
  sprintCapacities: Map<string, SprintCapacity>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hoveredSprintId, setHoveredSprintId] = useState<string | null>(null);

  if (!sprints || sprints.length === 0) return null;

  const getStatusColor = (utilizationPercent: number) => {
    if (utilizationPercent > 100) return '#dc2626';
    if (utilizationPercent >= 90) return '#f59e0b';
    if (utilizationPercent >= 70) return '#10b981';
    return '#6b7280';
  };

  const totalCapacity = Array.from(sprintCapacities.values()).reduce((sum, c) => sum + c.totalTeamDays, 0);
  const totalPlanned = Array.from(sprintCapacities.values()).reduce((sum, c) => sum + c.plannedDays, 0);
  const overallUtilization = totalCapacity > 0 ? (totalPlanned / totalCapacity) * 100 : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 overflow-visible">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-900 dark:text-white">Sprint Summary</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">({sprints.length} sprints)</span>
        </div>
        <div className="flex items-center gap-2">
          <span 
            className="text-[10px] font-bold px-2 py-0.5 rounded"
            style={{ 
              backgroundColor: `${getStatusColor(overallUtilization)}15`,
              color: getStatusColor(overallUtilization),
              border: `1px solid ${getStatusColor(overallUtilization)}30`
            }}
          >
            {Math.round(overallUtilization)}%
          </span>
          <span className="text-slate-400 dark:text-slate-500">{expanded ? '▼' : '▶'}</span>
        </div>
      </button>

      {expanded && (
        <>
          <div className="px-4 pb-3 space-y-2 max-h-48 overflow-y-auto">
            {sprints.map((sprint) => {
              const capacity = sprintCapacities.get(sprint.id);
              if (!capacity) return null;

              const statusColor = getStatusColor(capacity.utilizationPercent);

              return (
                <div 
                  key={sprint.id}
                  className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/50 text-[10px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  onMouseEnter={() => setHoveredSprintId(sprint.id)}
                  onMouseLeave={() => setHoveredSprintId(null)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">{sprint.name}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-[9px]">
                      {sprint.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {sprint.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">{Math.round(capacity.plannedDays)}d / {capacity.totalTeamDays}d</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[9px]">{capacity.ticketCount} tickets</div>
                    </div>
                    <div 
                      className="w-2 h-8 rounded-full"
                      style={{ backgroundColor: statusColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tooltip rendered outside scrollable container to avoid clipping */}
          {hoveredSprintId && (() => {
            const sprint = sprints.find(s => s.id === hoveredSprintId);
            const capacity = sprint ? sprintCapacities.get(sprint.id) : null;
            if (!sprint || !capacity) return null;
            
            const statusColor = getStatusColor(capacity.utilizationPercent);
            
            return (
              <div className="absolute left-full ml-2 top-32 z-[100] pointer-events-none">
                <div 
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl border-2 border-slate-300 dark:border-slate-600 p-4 text-[11px] w-[320px]"
                >
                    <div className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                      <span>{sprint.name}</span>
                      <span 
                        className="text-[9px] font-bold px-2 py-0.5 rounded"
                        style={{ 
                          backgroundColor: `${statusColor}15`,
                          color: statusColor,
                          border: `1px solid ${statusColor}30`
                        }}
                      >
                        {Math.round(capacity.utilizationPercent)}%
                      </span>
                    </div>
                    
                    <div className="text-[10px] text-slate-600 dark:text-slate-400 mb-3">
                      {sprint.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {sprint.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[9px] text-slate-600 dark:text-slate-400 mb-1">
                        <span>Capacity Utilization</span>
                        <span className="font-bold" style={{ color: statusColor }}>{Math.round(capacity.utilizationPercent)}%</span>
                      </div>
                      <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(capacity.utilizationPercent, 100)}%`,
                            backgroundColor: statusColor
                          }}
                        />
                        {/* Milestone markers at 25%, 50%, 75% */}
                        <div className="absolute inset-0 flex justify-between px-0.5">
                          {[0.25, 0.5, 0.75].map((_, idx) => (
                            <div 
                              key={idx}
                              className="w-0.5 h-full bg-white/40"
                              style={{ marginLeft: idx === 0 ? '24%' : idx === 1 ? '24%' : '24%' }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Inline Summary with Icons */}
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-[9px] text-slate-600 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="flex items-center gap-0.5 font-semibold">
                        👥 <span className="text-slate-900 dark:text-white">{capacity.teamSize}</span> devs
                      </span>
                      {capacity.holidayDays > 0 && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">│</span>
                          <span className="flex items-center gap-0.5">
                            🏖️ <span className="font-semibold text-orange-600 dark:text-orange-400">{capacity.holidayDays}</span> holidays
                          </span>
                        </>
                      )}
                      {capacity.ptoDays > 0 && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">│</span>
                          <span className="flex items-center gap-0.5">
                            🌴 <span className="font-semibold text-orange-600 dark:text-orange-400">{capacity.ptoDays}</span> PTO
                          </span>
                        </>
                      )}
                      <span className="text-slate-300 dark:text-slate-600">│</span>
                      <span className="flex items-center gap-0.5">
                        📋 <span className="font-semibold text-slate-900 dark:text-white">{capacity.ticketCount}</span> tickets
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[10px] text-slate-700 dark:text-slate-300">
                      {/* Effort Section */}
                      <div className="text-[9px] font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-1">
                        Effort
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Planned Work:</span>
                        <span className="font-semibold">{Math.round(capacity.plannedDays * 10) / 10}d</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Team Capacity:</span>
                        <span className="font-semibold">{capacity.totalTeamDays}d</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-500 dark:text-slate-400">Available Days:</span>
                        <span className="font-semibold">{capacity.availableDays}d</span>
                      </div>
                      
                      {/* Time Section */}
                      <div className="text-[9px] font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-1 pt-2 border-t border-slate-200 dark:border-slate-700">
                        Time Breakdown
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Team Size:</span>
                        <span className="font-semibold">{capacity.teamSize} developers</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Calendar Days:</span>
                        <span className="font-semibold">{capacity.totalCalendarDays}d</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Working Days:</span>
                        <span className="font-semibold">{capacity.workingDays}d</span>
                      </div>
                      {capacity.holidayDays > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Holidays:</span>
                          <span className="font-semibold text-orange-600 dark:text-orange-400">-{capacity.holidayDays}d</span>
                        </div>
                      )}
                      {capacity.ptoDays > 0 && (
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-500 dark:text-slate-400">PTO:</span>
                          <span className="font-semibold text-orange-600 dark:text-orange-400">-{capacity.ptoDays}d</span>
                        </div>
                      )}
                      
                      {/* Story Points Section */}
                      <div className="text-[9px] font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-1 pt-2 border-t border-slate-200 dark:border-slate-700">
                        Story Points
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Planned Story Points:</span>
                        <span className="font-semibold">{capacity.plannedStoryPoints} SP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Capacity Story Points:</span>
                        <span className="font-semibold">{capacity.capacityStoryPoints} SP</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-500 dark:text-slate-400">Velocity Per Day:</span>
                        <span className="font-semibold">{capacity.velocityPerDay} SP/d</span>
                      </div>
                      
                      {/* Tickets Section */}
                      <div className="text-[9px] font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-1 pt-2 border-t border-slate-200 dark:border-slate-700">
                        Tickets
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Total Tickets:</span>
                        <span className="font-semibold">{capacity.ticketCount}</span>
                      </div>
                      {capacity.developersInSprint && capacity.developersInSprint.length > 0 && (
                        <div className="mt-2">
                          <div className="text-slate-500 dark:text-slate-400 mb-1">Assigned Developers:</div>
                          <div className="flex flex-wrap gap-1">
                            {capacity.developersInSprint.map((dev, idx) => (
                              <span 
                                key={idx}
                                className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-[9px] font-medium"
                              >
                                {dev}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {capacity.overCapacity && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-red-600 dark:text-red-400 flex items-center gap-1">
                        <span>⚠️</span>
                        <span className="font-semibold">Over capacity by {Math.round((capacity.utilizationPercent - 100) * capacity.totalTeamDays / 100)}d</span>
                      </div>
                    )}
                    
                    {!capacity.overCapacity && capacity.utilizationPercent < 70 && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
                        <span>✅</span>
                        <span className="font-semibold">Available - {Math.round((100 - capacity.utilizationPercent) * capacity.totalTeamDays / 100)}d spare capacity</span>
                      </div>
                    )}
                    
                    {!capacity.overCapacity && capacity.utilizationPercent >= 70 && capacity.utilizationPercent < 90 && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <span>👍</span>
                        <span className="font-semibold">Good utilization</span>
                      </div>
                    )}
                    
                    {!capacity.overCapacity && capacity.utilizationPercent >= 90 && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-orange-600 dark:text-orange-400 flex items-center gap-1">
                        <span>🟡</span>
                        <span className="font-semibold">Near capacity limit</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </>
        )}
    </div>
  );
}

// SIDEBAR HEADER: Left column header with controls
function TimelineSidebarHeader({
  showHolidays,
  showPTO,
  onToggleHolidays,
  onTogglePTO,
  showPhases,
  onTogglePhases,
  showMilestones,
  onToggleMilestones,
  teamMembers,
  selectedDeveloperId,
  onChangeDeveloper
}: {
  showHolidays: boolean;
  showPTO: boolean;
  onToggleHolidays: (value: boolean) => void;
  onTogglePTO: (value: boolean) => void;
  showPhases: boolean;
  onTogglePhases: (value: boolean) => void;
  showMilestones: boolean;
  onToggleMilestones: (value: boolean) => void;
  teamMembers: TeamMember[];
  selectedDeveloperId: 'all' | 'unassigned' | string;
  onChangeDeveloper: (developerId: 'all' | 'unassigned' | string) => void;
}) {
  const developers = teamMembers.filter(m => m.role === 'Developer');
  const [showViewMenu, setShowViewMenu] = useState(false);
  
  return (
    <div className="h-full flex flex-col">
      {/* Control Bar - Grouped by intent */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-3 py-2 shadow-sm">
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2">
            {/* View Menu */}
            <div className="relative">
              <button
                onClick={() => setShowViewMenu(!showViewMenu)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              >
                <span>View</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {showViewMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowViewMenu(false)} />
                  <div className="absolute left-0 mt-1 w-36 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 py-1">
                    <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={showPhases}
                        onChange={(e) => onTogglePhases(e.target.checked)}
                        className="w-3 h-3"
                      />
                      <span className="text-xs">Phases</span>
                    </label>
                    <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={showMilestones}
                        onChange={(e) => onToggleMilestones(e.target.checked)}
                        className="w-3 h-3"
                      />
                      <span className="text-xs">Milestones</span>
                    </label>
                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
                    <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={showHolidays}
                        onChange={(e) => onToggleHolidays(e.target.checked)}
                        className="w-3 h-3"
                      />
                      <span className="text-xs">Holidays</span>
                    </label>
                    <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={showPTO}
                        onChange={(e) => onTogglePTO(e.target.checked)}
                        className="w-3 h-3"
                      />
                      <span className="text-xs">PTO</span>
                    </label>
                  </div>
                </>
              )}
            </div>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />

            {/* Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Filter</span>
              <select
                value={selectedDeveloperId}
                onChange={(e) => onChangeDeveloper(e.target.value as 'all' | 'unassigned' | string)}
                className="text-xs px-2 py-0.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400/50 shadow-sm"
              >
                <option value="all">All</option>
                <option value="unassigned">Unassigned</option>
                {developers.map(dev => (
                  <option key={dev.id} value={dev.id}>{dev.name}</option>
                ))}
              </select>
            </div>

          </div>

        </div>
      </div>

      {/* Ticket Name Header */}
      <div 
        className="px-4 h-7 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-slate-50/30 to-slate-100/30 dark:from-slate-800/30 dark:to-slate-900/30"
        style={{
          fontSize: designTokens.typography.fontSize.xs,
          fontWeight: designTokens.typography.fontWeight.semibold,
          color: designTokens.colors.neutral[700],
          letterSpacing: designTokens.typography.letterSpacing.wide
        }}
      >
        <span>TICKETS</span>
      </div>
    </div>
  );
}

// TICKET SIDEBAR ROW: Left sidebar ticket information (Enhanced with 1.2.1 hover states)
function TicketSidebarRow({
  ticket,
  rowHeight,
  isSelected,
  hasConflict,
  isLastInFeature,
  onClick
}: {
  ticket: Ticket;
  rowHeight: number;
  isSelected: boolean;
  hasConflict: boolean;
  isLastInFeature?: boolean;
  onClick: () => void;
}) {
  const [isHovering, setIsHovering] = useState(false);
  
  return (
    <div 
      className="flex items-center px-5 cursor-pointer transition-all duration-150 ease-out border-b border-gray-100 relative group"
      style={{ 
        height: rowHeight,
        backgroundColor: isSelected ? '#eff6ff' : isHovering ? '#fafafa' : 'transparent',
        borderLeft: hasConflict ? '4px solid #f59e0b' : isSelected ? '4px solid #3b82f6' : 'none',
        paddingLeft: hasConflict || isSelected ? '16px' : '20px',
        borderBottom: isLastInFeature ? 'none' : '1px solid rgba(0, 0, 0, 0.04)',
        // 1.2.2: Enhanced selection with glow
        boxShadow: isSelected ? '0 0 0 1px rgba(59, 130, 246, 0.2) inset' : 'none',
        transform: isHovering && !isSelected ? 'translateX(2px)' : 'none',
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* 1.2.1: Left accent bar appears on hover */}
      {isHovering && !isSelected && !hasConflict && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-150"
          style={{ backgroundColor: designTokens.colors.sprint.primary }}
        />
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {/* 1.2.1: Pulse animation for conflicts */}
          {hasConflict && (
            <AlertTriangle 
              className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" 
              style={{ 
                animationDuration: '2s',
                color: '#d97706'  // 1.3.2: Better contrast for amber
              }}
            />
          )}
          {/* 1.3.3: Smart truncation with tooltip */}
          <TruncatedText
            text={ticket.title}
            className="text-sm font-semibold text-foreground leading-tight"
            delay={500}
          />
        </div>
        <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
          <span className="truncate">{ticket.assignedTo || 'Unassigned'}</span>
          <span className="flex-shrink-0">•</span>
          <span className="flex-shrink-0">{resolveEffortDays(ticket)}d</span>
        </div>
      </div>
    </div>
  );
}

// LAYER 4 + 5: TICKET TIMELINE BAR (Gantt bar only, no PTO for now)
function TicketTimelineBar({
  ticket,
  featureId: _featureId,
  rowHeight,
  dayWidth,
  getPositionFromDate,
  getDaysDifference,
  isSelected,
  onSelect,
  onMove,
  showPTO,
  startDate: _startDate,
  endDate,
  hasConflict,
  teamMembers,
  milestones,
  phases,
  holidays,
  isLastInFeature: _isLastInFeature
}: {
  ticket: Ticket;
  featureId: string;
  featureName: string;
  rowHeight: number;
  dayWidth: number;
  getPositionFromDate: (date: Date) => number;
  getDaysDifference: (date1: Date, date2: Date) => number;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (newStartDate: Date) => void;
  onResize: (newEndDate: Date) => void;
  onClone?: () => void;
  showPTO: boolean;
  startDate: Date;
  endDate: Date;
  hasConflict: boolean;
  conflicts: Map<string, TicketConflict>;
  teamMembers: TeamMember[];
  milestones: Milestone[];
  phases: Phase[];
  holidays: Holiday[];
  isLastInFeature?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  const assignedMember = teamMembers.find(m => m.name === ticket.assignedTo);
  const ptoEntries = assignedMember?.pto || [];
  const ptoOverlapInfo = getPTOOverlapInfo(ticket, assignedMember);

  // Check if ticket is within Dev Window
  const isInDevWindow = isTicketInDevWindow(ticket, phases);
  const colorScheme = getTicketColorScheme(ticket, isInDevWindow, hasConflict);

  const blockingMilestones = getBlockingMilestonesForTicket(ticket, milestones);
  const hasBlockingConstraint = blockingMilestones.length > 0;

  const ticketLeft = getPositionFromDate(ticket.startDate);
  
  // Calculate visual width from actual stored startDate to endDate (calendar days)
  // This ensures the timeline bar accurately reflects the stored date range
  const calendarDays = Math.ceil((ticket.endDate.getTime() - ticket.startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const rawTicketWidth = calendarDays * dayWidth;
  
  // Calculate the maximum available width from ticket start to timeline end
  const timelineEndPosition = getPositionFromDate(endDate);
  const maxAvailableWidth = Math.max(0, timelineEndPosition - ticketLeft);
  
  // Clamp ticket width to stay within timeline bounds
  const ticketWidth = Math.min(rawTicketWidth, maxAvailableWidth);
  const isOverflowing = rawTicketWidth > maxAvailableWidth && maxAvailableWidth > 0;

  // Hide tooltip on scroll or resize
  useEffect(() => {
    if (isHovered && tooltipPos) {
      const hideTooltip = () => {
        setIsHovered(false);
        setTooltipPos(null);
      };

      window.addEventListener('scroll', hideTooltip, true);
      window.addEventListener('resize', hideTooltip);

      return () => {
        window.removeEventListener('scroll', hideTooltip, true);
        window.removeEventListener('resize', hideTooltip);
      };
    }
  }, [isHovered, tooltipPos]);

  // Hide tooltip when dragging
  useEffect(() => {
    if (isDragging) {
      setIsHovered(false);
      setTooltipPos(null);
    }
  }, [isDragging]);

  const handleMouseEnter = () => {
    if (ticketRef.current) {
      const rect = ticketRef.current.getBoundingClientRect();
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 8
      });
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTooltipPos(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialLeft = ticketLeft;
    let hasMoved = false;
    const DRAG_THRESHOLD = 5; // pixels

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Only start dragging if moved beyond threshold
      if (distance > DRAG_THRESHOLD) {
        hasMoved = true;
        setIsDragging(true);
        
        const newLeft = Math.max(0, initialLeft + deltaX);
        const daysMoved = Math.round((newLeft - initialLeft) / dayWidth);
        
        if (ticketRef.current) {
          ticketRef.current.style.left = `${initialLeft + (daysMoved * dayWidth)}px`;
        }
      }
    };

    const handleMouseUp = (moveEvent: MouseEvent) => {
      if (hasMoved) {
        setIsDragging(false);
        const deltaX = moveEvent.clientX - startX;
        const daysMoved = Math.round(deltaX / dayWidth);
        
        if (daysMoved !== 0) {
          const newStartDate = new Date(ticket.startDate);
          newStartDate.setDate(newStartDate.getDate() + daysMoved);
          onMove(newStartDate);
        }
      } else {
        // It was a click, not a drag - open details panel
        onSelect();
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      className="relative" 
      style={{ 
        height: rowHeight
      }}
    >
      {/* LAYER 4: PTO OVERLAYS - Enhanced with pattern */}
      {showPTO && ptoEntries.map((pto) => {
        if (pto.endDate < ticket.startDate || pto.startDate > ticket.endDate) return null;
        
        const overlayStart = pto.startDate < ticket.startDate ? ticket.startDate : pto.startDate;
        const overlayEnd = pto.endDate > ticket.endDate ? ticket.endDate : pto.endDate;
        const left = getPositionFromDate(overlayStart);
        const width = getDaysDifference(overlayStart, overlayEnd) * dayWidth;
        
        return (
          <div
            key={pto.id}
            className="absolute pointer-events-none"
            style={{
              left,
              width,
              top: 4,
              bottom: 4,
              background: `
                repeating-linear-gradient(
                  -45deg,
                  rgba(194, 135, 65, 0.12),
                  rgba(194, 135, 65, 0.12) 4px,
                  rgba(194, 135, 65, 0.20) 4px,
                  rgba(194, 135, 65, 0.20) 8px
                )
              `,
              border: '1px dashed rgba(194, 135, 65, 0.4)',
              zIndex: 4,
            }}
            title={`${ticket.assignedTo} - ${pto.name}`}
          />
        );
      })}

      {/* LAYER 5: TICKET BAR (Enhanced with 1.2 interactions + spillover detection) */}
      <div
        ref={ticketRef}
        className="absolute group relative transition-all duration-200 shadow-sm hover:shadow-md"
        style={{
          left: ticketLeft,
          width: ticketWidth,
          minWidth: 80,
          top: 8,
          height: 32,
          // Use dynamic color scheme (includes spillover, conflict, and status colors)
          backgroundColor: colorScheme.background,
          // Add diagonal stripe pattern for spillover tickets
          backgroundImage: !isInDevWindow && !hasConflict
            ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(249, 115, 22, 0.1) 10px, rgba(249, 115, 22, 0.1) 20px)'
            : undefined,
          // Left border accent (4px status indicator)
          borderLeft: `4px solid ${colorScheme.accent}`,
          // Right, top, bottom borders
          borderRight: isSelected 
            ? `2px solid ${colorScheme.border}`
            : `1px solid rgba(0, 0, 0, 0.08)`,
          borderTop: isSelected 
            ? `2px solid ${colorScheme.border}`
            : `1px solid rgba(0, 0, 0, 0.08)`,
          borderBottom: isSelected 
            ? `2px solid ${colorScheme.border}`
            : `1px solid rgba(0, 0, 0, 0.08)`,
          borderRadius: designTokens.borderRadius.md,
          zIndex: isSelected ? designTokens.zIndex.ticketSelected : designTokens.zIndex.tickets,
          opacity: isDragging ? 0.7 : 1,
          // Enhanced shadow with glow for selection (overrides base shadow-sm)
          boxShadow: hasConflict 
            ? `0 1px 3px rgba(251, 192, 45, 0.3), 0 0 0 3px rgba(251, 192, 45, 0.1)`
            : !isInDevWindow && !hasConflict
              ? `0 1px 3px rgba(249, 115, 22, 0.3), 0 0 0 3px rgba(249, 115, 22, 0.1)`
              : isSelected 
                ? `0 1px 3px rgba(59, 130, 246, 0.2), 0 0 0 3px rgba(59, 130, 246, 0.15)`
                : undefined,  // Let Tailwind shadow-sm handle default
          // Enhanced hover lift with scale
          transform: isDragging 
              ? 'translateY(-1px) rotate(1deg)' 
              : 'none',
          transitionProperty: 'all, box-shadow',
          transitionDuration: '0.15s, 0.2s',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          // Cursor feedback
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        title={`${ticket.title}${!isInDevWindow ? ' ⚠️ OUTSIDE DEV WINDOW' : ''}`}
      >
        {/* 1.2.4: Drag handle affordance (visible on hover) */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{
            cursor: 'grab',
            backgroundColor: `${colorScheme.accent}15`,
          }}
        >
          <GripVertical 
            className="w-3 h-3" 
            style={{ 
              color: colorScheme.accent,
              opacity: 0.6
            }} 
          />
        </div>

        {/* Spillover Warning Indicator - prominent icon when outside Dev Window */}
        {!isInDevWindow && !hasConflict && (
          <div
            className="absolute top-0 right-0 z-10 bg-orange-500 text-white px-1 rounded-bl text-xs font-bold"
            title="Scheduled outside Dev Window"
          >
            ⚠️
          </div>
        )}

        {/* PTO Risk Indicator - subtle icon in top-left */}
        {!hasConflict && !isInDevWindow && ptoOverlapInfo.hasPtoRisk && (
          <div
            className="absolute top-0.5 left-1 z-10"
            title={`PTO overlap: ${ptoOverlapInfo.overlapDays} working day${ptoOverlapInfo.overlapDays > 1 ? 's' : ''}\n${ptoOverlapInfo.overlappingPTO.map(p => `${p.name}: ${p.startDate.toLocaleDateString()} - ${p.endDate.toLocaleDateString()}`).join('\n')}`}
          >
            <Calendar className="w-3 h-3 text-amber-600 opacity-70" />
          </div>
        )}
        {isInDevWindow && !hasConflict && ptoOverlapInfo.hasPtoRisk && (
          <div
            className="absolute top-0.5 left-1 z-10"
            title={`PTO overlap: ${ptoOverlapInfo.overlapDays} working day${ptoOverlapInfo.overlapDays > 1 ? 's' : ''}\n${ptoOverlapInfo.overlappingPTO.map(p => `${p.name}: ${p.startDate.toLocaleDateString()} - ${p.endDate.toLocaleDateString()}`).join('\n')}`}
          >
            <Calendar className="w-3 h-3 text-amber-600 opacity-70" />
          </div>
        )}

        {/* Blocking Milestone Indicator - red icon when ticket overlaps blocking milestone */}
        {hasBlockingConstraint && (
          <div
            className="absolute top-0.5 left-4 z-10"
            title={`Scheduled during ${blockingMilestones[0].name}`}
          >
            <span className="text-red-600 text-xs">🚫</span>
          </div>
        )}

        {/* PTO Risk Stripe - subtle amber accent on right edge */}
        {!hasConflict && ptoOverlapInfo.hasPtoRisk && (
          <div
            className="absolute top-0 right-0 bottom-0 w-1 bg-amber-500 opacity-30 rounded-r"
            style={{ zIndex: 1 }}
          />
        )}

        {/* Overflow Warning - Red stripe and icon when ticket extends beyond timeline */}
        {isOverflowing && (
          <>
            <div
              className="absolute top-0 right-0 bottom-0 w-1 bg-red-500 rounded-r"
              style={{ zIndex: 2 }}
              title="Ticket extends beyond timeline end date"
            />
            <div
              className="absolute top-1 right-1 z-10 bg-red-500 text-white rounded-full p-0.5"
              title="Ticket extends beyond timeline end date"
            >
              <AlertTriangle className="w-2.5 h-2.5" />
            </div>
          </>
        )}
        
        <div className="flex items-center h-full pl-2 pr-2 overflow-hidden gap-1.5">
          
          {/* Phase 2: Status Dot with Dependency Awareness */}
          <div 
            className="flex-shrink-0 rounded-full"
            style={{
              width: GANTT_CONSTANTS.STATUS_DOT_SIZE,
              height: GANTT_CONSTANTS.STATUS_DOT_SIZE,
              backgroundColor: ticket.status === 'completed' 
                ? designTokens.colors.semantic.success
                : ticket.status === 'in-progress'
                  ? designTokens.colors.semantic.warning
                  : designTokens.colors.semantic.info,
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
            title={ticket.status}
          />

          {/* Dependency Badge (Blocked By indicator) */}
          {ticket.dependencies?.blockedBy && ticket.dependencies.blockedBy.length > 0 && (
            <div
              className="flex-shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-semibold"
              style={{
                backgroundColor: '#F59E0B20',
                color: '#F59E0B',
              }}
              title={`Blocked by ${ticket.dependencies.blockedBy.length} ticket${ticket.dependencies.blockedBy.length !== 1 ? 's' : ''}`}
            >
              <Link2 className="w-2.5 h-2.5" />
              <span>{ticket.dependencies.blockedBy.length}</span>
            </div>
          )}
          
          <div className="flex flex-col justify-center overflow-hidden flex-1 min-w-0">
            {/* Title */}
            <div className="text-[12px] font-semibold truncate leading-tight text-gray-900">
              {ticket.title}
            </div>

            {/* Metadata Row */}
            <div className="flex items-center gap-2 text-[10px] text-gray-600 mt-[2px] truncate">
              
              {/* Assignee */}
              {ticket.assignedTo && (
                <span className="truncate">
                  {ticket.assignedTo}
                </span>
              )}

              {/* Phase 2: Effort → Duration (shows velocity impact) */}
              <span className="text-gray-500 flex-shrink-0">
                · {ticket.effortDays ?? ticket.storyPoints ?? 1}d
                {assignedMember?.velocityMultiplier && assignedMember.velocityMultiplier !== 1 && (
                  <span className="text-blue-600 font-medium">
                    {' '}→ {Math.round((ticket.effortDays ?? ticket.storyPoints ?? 1) / assignedMember.velocityMultiplier)}d
                  </span>
                )}
              </span>

              {/* Experience + Velocity */}
              {assignedMember && assignedMember.experienceLevel && (
                <span className="inline-flex items-center px-1.5 py-[1px] rounded bg-gray-100 text-gray-700 text-[9px] font-medium flex-shrink-0">
                  {assignedMember.experienceLevel}
                  {assignedMember.velocityMultiplier && assignedMember.velocityMultiplier !== 1 && (
                    <span className="ml-1 text-gray-500">
                      ({assignedMember.velocityMultiplier}x)
                    </span>
                  )}
                </span>
              )}

            </div>

          </div>
        </div>
      </div>

      {/* Portal-based Tooltip - renders at document.body to avoid positioning context issues */}
      {isHovered && tooltipPos && !isDragging && (() => {
        // Phase 2: Calculate working days breakdown
        const calendarDaysCount = Math.ceil((ticket.endDate.getTime() - ticket.startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
        const workingDaysCount = countWorkingDays(ticket.startDate, ticket.endDate);
        const weekendDaysCount = calendarDaysCount - workingDaysCount;
        
        // Count holidays in this range
        const ticketHolidays = holidays.filter(h => {
          const hStart = new Date(h.startDate);
          hStart.setHours(0, 0, 0, 0);
          const hEnd = new Date(h.endDate);
          hEnd.setHours(0, 0, 0, 0);
          const tStart = new Date(ticket.startDate);
          tStart.setHours(0, 0, 0, 0);
          const tEnd = new Date(ticket.endDate);
          tEnd.setHours(0, 0, 0, 0);
          return hEnd >= tStart && hStart <= tEnd;
        });
        
        const holidayDaysCount = ticketHolidays.reduce((sum, h) => {
          const hStart = h.startDate < ticket.startDate ? ticket.startDate : h.startDate;
          const hEnd = h.endDate > ticket.endDate ? ticket.endDate : h.endDate;
          return sum + countWorkingDays(hStart, hEnd);
        }, 0);
        
        const actualWorkingDays = workingDaysCount - holidayDaysCount;
        
        return createPortal(
          <div
            style={{
              position: 'fixed',
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: 'translate(-50%, -100%)',
              zIndex: 2000,
              pointerEvents: 'none'
            }}
            className="w-80 bg-white border border-gray-200 rounded-lg shadow-xl p-4 text-sm"
          >
            <div className="font-semibold text-sm mb-2">
              {ticket.title}
            </div>

            {assignedMember && (
              <div className="text-xs text-gray-600 mb-3 flex items-center gap-2">
                <span className="font-medium">{assignedMember.name}</span>
                {assignedMember.experienceLevel && (
                  <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px]">
                    {assignedMember.experienceLevel}
                    {assignedMember.velocityMultiplier && assignedMember.velocityMultiplier !== 1 && (
                      <span className="ml-1">({assignedMember.velocityMultiplier}x)</span>
                    )}
                  </span>
                )}
              </div>
            )}

            <div className="space-y-1 text-xs mb-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Dates:</span>
                <span className="font-medium">{ticket.startDate.toLocaleDateString()} – {ticket.endDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Effort:</span>
                <span className="font-medium">{ticket.effortDays ?? ticket.storyPoints ?? 1} days</span>
              </div>
              {assignedMember?.velocityMultiplier && assignedMember.velocityMultiplier !== 1 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Adjusted Duration:</span>
                  <span className="font-medium text-blue-600">
                    {Math.round((ticket.effortDays ?? ticket.storyPoints ?? 1) / assignedMember.velocityMultiplier)} days
                  </span>
                </div>
              )}
            </div>

            {/* Phase 2: Working Days Breakdown */}
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="text-xs font-semibold text-gray-700 mb-2">📋 Working Day Breakdown:</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Calendar days:</span>
                  <span className="font-medium">{calendarDaysCount}</span>
                </div>
                {weekendDaysCount > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>− Weekend days:</span>
                    <span>−{weekendDaysCount}</span>
                  </div>
                )}
                {holidayDaysCount > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>− Holidays:</span>
                    <span>−{holidayDaysCount}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-1 mt-1 font-semibold text-green-600">
                  <span>= Working days:</span>
                  <span>{actualWorkingDays} ✓</span>
                </div>
              </div>
              
              {ticketHolidays.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="text-[10px] text-gray-500">
                    Holidays: {ticketHolidays.map(h => h.name).join(', ')}
                  </div>
                </div>
              )}
            </div>

            {hasConflict && (
              <div className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Overallocated in sprint</span>
              </div>
            )}

            {hasBlockingConstraint && (
              <div className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Overlaps {blockingMilestones[0].name}</span>
              </div>
            )}

            {ptoOverlapInfo.hasPtoRisk && (
              <div className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>PTO overlap: {ptoOverlapInfo.overlapDays} working day{ptoOverlapInfo.overlapDays > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>,
          document.body
        );
      })()}
    </div>
  );
}

// ============================================
// 1.2.3 LOADING STATES COMPONENTS
// ============================================

/**
 * Skeleton loader for timeline rows
 * Used during data loading or async operations
 */
export function TimelineRowSkeleton({ rowHeight = 48 }: { rowHeight?: number }) {
  return (
    <div 
      className="flex items-center px-4 border-b border-gray-100"
      style={{ height: rowHeight }}
    >
      <div className="flex-1 space-y-2 animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-2.5 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for ticket bars in timeline
 */
export function TicketBarSkeleton({ 
  rowHeight = 48,
  left = 0,
  width = 200 
}: { 
  rowHeight?: number;
  left?: number;
  width?: number;
}) {
  return (
    <div style={{ height: rowHeight, position: 'relative' }}>
      <div
        className="absolute animate-pulse"
        style={{
          left,
          width,
          top: 8,
          height: 32,
          backgroundColor: '#E5E7EB',
          borderRadius: '6px',
          background: 'linear-gradient(90deg, #E5E7EB 0%, #F3F4F6 50%, #E5E7EB 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
    </div>
  );
}

/**
 * Shimmer loading overlay for entire timeline
 * Used during initial data fetch
 */
export function TimelineShimmer() {
  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s infinite',
        }}
      />
    </div>
  );
}

/**
 * Inline save indicator
 * Shows "Saving..." with spinner or "Saved ✓" with fade-out
 */
export function SaveIndicator({ 
  status = 'idle' 
}: { 
  status?: 'idle' | 'saving' | 'saved' 
}) {
  if (status === 'idle') return null;
  
  return (
    <div 
      className="inline-flex items-center gap-1.5"
      style={{
        animation: status === 'saved' ? 'fadeOut 2s forwards' : 'none',
        fontSize: designTokens.typography.fontSize.xs,
        fontWeight: designTokens.typography.fontWeight.medium,
        color: designTokens.colors.neutral[600]  // 1.3.2: Better contrast
      }}
    >
      {status === 'saving' && (
        <>
          <div 
            className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full"
            style={{ animation: 'spin 0.6s linear infinite' }}
          />
          <span>Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <span className="text-green-600">✓</span>
          <span className="text-green-600">Saved</span>
        </>
      )}
    </div>
  );
}

// PHASES BAND ROW: Display phase bands for release phases
function PhasesBandRow({
  phases,
  startDate,
  endDate,
  getPositionFromDate,
  getDaysDifference,
  dayWidth
}: {
  phases: Phase[];
  startDate: Date;
  endDate: Date;
  getPositionFromDate: (date: Date) => number;
  getDaysDifference: (date1: Date, date2: Date) => number;
  dayWidth: number;
}) {
  // Early exit if no phases
  if (!phases || phases.length === 0) return null;

  const getPhaseColor = (type: PhaseType): string => {
    const colors: Record<PhaseType, string> = {
      DevWindow: '#3b82f6', // blue
      Testing: '#eab308', // yellow
      Deployment: '#a855f7', // purple
      Approval: '#06b6d4', // cyan
      Launch: '#22c55e', // green
      Custom: '#6b7280', // gray
    };
    return colors[type];
  };

  try {
    return (
      <div 
        className="relative bg-white/80 backdrop-blur-sm border-b border-gray-200"
        style={{ 
          height: 32, // Match GANTT_CONSTANTS.PHASE_STRIP_HEIGHT
          zIndex: 4
        }}
      >
        {phases
          .sort((a, b) => a.order - b.order)
          .map((phase) => {
            // Only render if phase overlaps visible timeline
            if (phase.endDate < startDate || phase.startDate > endDate) {
              return null;
            }

            const color = getPhaseColor(phase.type);
            const left = getPositionFromDate(phase.startDate);
            const width = getDaysDifference(phase.startDate, phase.endDate) * dayWidth;

            return (
              <div
                key={phase.id}
                className="absolute group"
                style={{
                  left,
                  width,
                  top: 0,
                  height: '100%',
                  backgroundColor: `${color}08`, // 8% opacity
                  borderLeft: `3px solid ${color}`,
                  borderRight: `3px solid ${color}`,
                  borderTop: `1px solid ${color}30`,
                  borderBottom: `1px solid ${color}30`,
                }}
                title={`${phase.name}: ${phase.startDate.toLocaleDateString()} - ${phase.endDate.toLocaleDateString()}`}
              >
                {/* Phase label */}
                <div
                  className="absolute text-xs font-semibold px-2 py-0.5 rounded"
                  style={{
                    top: 4,
                    left: 8,
                    backgroundColor: `${color}20`,
                    color: color,
                    border: `1px solid ${color}50`,
                    maxWidth: 'calc(100% - 16px)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {phase.name}
                  {!phase.allowsWork && (
                    <span className="ml-1.5 text-[10px] opacity-70">(Non-Work)</span>
                  )}
                </div>

                {/* Duration indicator at bottom */}
                <div
                  className="absolute text-[10px] font-medium px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    bottom: 2,
                    right: 8,
                    backgroundColor: `${color}15`,
                    color: color,
                  }}
                >
                  {getDaysDifference(phase.startDate, phase.endDate)}d
                </div>
              </div>
            );
          })}
      </div>
    );
  } catch (error) {
    console.warn('Error rendering phase bands:', error);
    return null;
  }
}

// MILESTONES ROW: Display milestones with single-date or date-range visualization
function MilestonesRow({
  milestones,
  startDate,
  endDate,
  getPositionFromDate,
  getDaysDifference,
  dayWidth
}: {
  milestones: Milestone[];
  startDate: Date;
  endDate: Date;
  getPositionFromDate: (date: Date) => number;
  getDaysDifference: (date1: Date, date2: Date) => number;
  dayWidth: number;
}) {
  const getMilestoneColor = (type: MilestoneType): string => {
    const colors: Record<MilestoneType, string> = {
      Testing: '#eab308',
      Deployment: '#a855f7',
      Approval: '#3b82f6',
      Freeze: '#ef4444',
      Launch: '#22c55e',
      Other: '#6b7280',
    };
    return colors[type];
  };

  return (
    <div 
      className="relative bg-white/80 backdrop-blur-sm border-b border-gray-200"
      style={{ 
        height: 50,
        zIndex: 5
      }}
    >
      {milestones.map((milestone) => {
        if (milestone.startDate > endDate || (milestone.endDate && milestone.endDate < startDate)) {
          return null;
        }

        const color = getMilestoneColor(milestone.type);
        const left = getPositionFromDate(milestone.startDate);

        if (milestone.dateType === 'single') {
          return (
            <div
              key={milestone.id}
              className="absolute"
              style={{
                left,
                width: 2,
                top: 0,
                height: '100%',
                backgroundColor: color,
              }}
            >
              <div 
                className="absolute flex items-center justify-center"
                style={{
                  top: 4,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 10,
                  height: 10,
                  backgroundColor: color,
                  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                }}
              />
              <div
                className="absolute text-xs font-bold whitespace-nowrap px-1.5 py-0.5 rounded"
                style={{
                  top: 18,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: `${color}15`,
                  color: color,
                  border: `1px solid ${color}30`,
                }}
              >
                {milestone.name}
              </div>
            </div>
          );
        } else {
          const width = milestone.endDate 
            ? getDaysDifference(milestone.startDate, milestone.endDate) * dayWidth
            : dayWidth;

          return (
            <div
              key={milestone.id}
              className="absolute"
              style={{
                left,
                width,
                top: 0,
                height: '100%',
                backgroundColor: `${color}10`,
                border: `1px solid ${color}30`,
              }}
            >
              <div
                className="absolute"
                style={{
                  left: 0,
                  width: 2,
                  top: 0,
                  height: '100%',
                  backgroundColor: color,
                }}
              >
                <div
                  className="absolute"
                  style={{
                    top: 4,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 10,
                    height: 10,
                    backgroundColor: color,
                    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                  }}
                />
              </div>

              <div
                className="absolute text-xs font-bold px-1.5 py-0.5 rounded"
                style={{
                  top: 18,
                  left: 8,
                  backgroundColor: `${color}20`,
                  color: color,
                  border: `1px solid ${color}40`,
                }}
              >
                {milestone.name}
              </div>

              {milestone.endDate && (
                <div
                  className="absolute"
                  style={{
                    right: 0,
                    width: 2,
                    top: 0,
                    height: '100%',
                    backgroundColor: color,
                  }}
                >
                  <div
                    className="absolute"
                    style={{
                      top: 4,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 10,
                      height: 10,
                      backgroundColor: color,
                      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                    }}
                  />
                </div>
              )}
            </div>
          );
        }
      })}
    </div>
  );
}
