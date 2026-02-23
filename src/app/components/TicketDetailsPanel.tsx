import { useState, useEffect, useRef, useMemo } from 'react';
import { X, User, Trash2, ArrowRightLeft, ChevronDown, Check, AlertTriangle } from 'lucide-react';
import { Ticket, Release, TeamMember, Milestone, Holiday, mockHolidays } from '../data/mockData';
import { resolveEffortDays } from '../lib/effortResolver';
import { calculateEndDateFromEffort, calculateEffortFromDates, toLocalDateString } from '../lib/dateUtils';
import { loadHolidays } from '../lib/localStorage';
import { cn } from './ui/utils';

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

// Helper: Check if a ticket has PTO overlap
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

interface TicketDetailsPanelProps {
  ticket: Ticket;
  featureId: string;
  release: Release;
  teamMembers: TeamMember[];
  milestones: Milestone[];
  onClose: () => void;
  onUpdate: (featureId: string, ticketId: string, updates: Partial<Ticket>) => void;
  onDelete: (featureId: string, ticketId: string) => void;
  onMoveToFeature: (fromFeatureId: string, ticketId: string, toFeatureId: string) => void;
}

export function TicketDetailsPanel({ 
  ticket, 
  featureId, 
  release, 
  teamMembers,
  milestones,
  onClose, 
  onUpdate,
  onDelete,
  onMoveToFeature
}: TicketDetailsPanelProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const assigneeRef = useRef<HTMLDivElement>(null);
  const moveMenuRef = useRef<HTMLDivElement>(null);
  
  // Load holidays for date calculations
  const holidays = useMemo(() => loadHolidays() || mockHolidays, []);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else if (showMoveMenu) {
          setShowMoveMenu(false);
        } else if (showAssigneeDropdown) {
          setShowAssigneeDropdown(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showDeleteConfirm, showMoveMenu, showAssigneeDropdown]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) {
        setShowAssigneeDropdown(false);
      }
      if (moveMenuRef.current && !moveMenuRef.current.contains(e.target as Node)) {
        setShowMoveMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdate = (field: keyof Ticket, value: any) => {
    // When assignedTo changes, recalculate end date with new velocity
    if (field === 'assignedTo') {
      const newAssignedDev = teamMembers.find(m => m.name === value);
      const newVelocity = newAssignedDev?.velocityMultiplier ?? 1;
      
      const effort = ticket.effortDays || resolveEffortDays(ticket);
      const adjustedDuration = Math.max(1, Math.round(effort / newVelocity));
      const newEndDate = calculateEndDateFromEffort(ticket.startDate, adjustedDuration, holidays);
      
      onUpdate(featureId, ticket.id, {
        assignedTo: value,
        endDate: newEndDate
      });
    } else {
      onUpdate(featureId, ticket.id, { [field]: value });
    }
  };

  // Compute PTO overlap for the assigned developer
  const assignedDeveloper = teamMembers.find(m => m.name === ticket.assignedTo);
  const ptoOverlapInfo = getPTOOverlapInfo(ticket, assignedDeveloper);

  // Compute blocking milestone constraints
  const blockingMilestones = getBlockingMilestonesForTicket(ticket, milestones);

  const handleDelete = () => {
    onDelete(featureId, ticket.id);
    onClose();
  };

  // Derive sprint association from ticket dates
  const getAssociatedSprint = () => {
    if (!release.sprints || release.sprints.length === 0) return null;
    return release.sprints.find(sprint => {
      const sprintStart = sprint.startDate.getTime();
      const sprintEnd = sprint.endDate.getTime();
      const ticketStart = ticket.startDate.getTime();
      return ticketStart >= sprintStart && ticketStart <= sprintEnd;
    });
  };

  const associatedSprint = getAssociatedSprint();
  const currentFeature = release.features.find(f => f.id === featureId);
  const featureName = currentFeature?.name || '';
  const otherFeatures = release.features.filter(f => f.id !== featureId);

  const getDuration = () => {
    // Calculate adjusted duration based on effort and velocity
    const effort = ticket.effortDays || resolveEffortDays(ticket);
    const assignedDev = teamMembers.find(m => m.name === ticket.assignedTo);
    const velocity = assignedDev?.velocityMultiplier ?? 1;
    return Math.max(1, Math.round(effort / velocity));
  };

  // Get unique team member names for dropdown
  const allTeamNames = teamMembers.map(m => m.name);
  const ticketAssignees = release.features
    .flatMap(f => f.tickets)
    .map(t => t.assignedTo)
    .filter(name => name && name !== 'Unassigned');
  const uniqueNames = [...new Set([...allTeamNames, ...ticketAssignees])].sort();
  const filteredNames = assigneeSearch
    ? uniqueNames.filter(name => name.toLowerCase().includes(assigneeSearch.toLowerCase()))
    : uniqueNames;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Center Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50">
          <div className="flex-1 min-w-0">
            {/* Feature breadcrumb with move */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{featureName}</span>
              {otherFeatures.length > 0 && (
                <div ref={moveMenuRef} className="relative">
                  <button
                    onClick={() => setShowMoveMenu(!showMoveMenu)}
                    className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md transition-all duration-200 font-medium"
                    title="Move to another feature"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    Move
                  </button>
                  {showMoveMenu && (
                    <div className="absolute left-0 top-full mt-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 min-w-[200px] py-1">
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Move to feature
                      </div>
                      {otherFeatures.map(f => (
                        <button
                          key={f.id}
                          className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200"
                          onClick={() => {
                            onMoveToFeature(featureId, ticket.id, f.id);
                            setShowMoveMenu(false);
                          }}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <input
              type="text"
              value={ticket.title}
              onChange={(e) => handleUpdate('title', e.target.value)}
              className="w-full text-base font-normal text-slate-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 px-0 leading-relaxed placeholder-slate-400"
            />
          </div>
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all duration-200 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400"
              title="Delete ticket"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-all duration-200"
            >
              <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="px-6 py-3 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-b border-red-200 dark:border-red-800 flex items-center justify-between">
            <span className="text-xs text-red-700 dark:text-red-300 font-medium">Delete this ticket permanently?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1 text-xs text-white bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200 shadow-lg shadow-red-500/30"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
              Description
            </label>
            <textarea
              value={ticket.description || ''}
              onChange={(e) => handleUpdate('description', e.target.value)}
              placeholder="Add a description..."
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent text-sm resize-none bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm transition-all duration-200 leading-relaxed placeholder-slate-400 text-slate-900 dark:text-white"
              rows={4}
            />
          </div>

          {/* Effort Days */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
              Effort (Days)
            </label>
            <input
              type="number"
              value={ticket.effortDays || resolveEffortDays(ticket)}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 1;
                
                // Get assigned developer's velocity
                const assignedDev = teamMembers.find(m => m.name === ticket.assignedTo);
                const velocity = assignedDev?.velocityMultiplier ?? 1;
                
                // Calculate velocity-adjusted duration in working days
                const adjustedDuration = Math.max(1, Math.round(value / velocity));
                
                // Calculate end date using working days (skips weekends and holidays)
                const newEndDate = calculateEndDateFromEffort(ticket.startDate, adjustedDuration, holidays);
                
                onUpdate(featureId, ticket.id, {
                  effortDays: value,
                  storyPoints: value, // Backward compatibility
                  endDate: newEndDate
                });
              }}
              min="0.5"
              step="0.5"
              max="100"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400"
              placeholder="e.g., 3"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Estimated effort in working days</p>

            {/* Effort Breakdown - Read-only calculation display */}
            {ticket.assignedTo && (() => {
              const assignedMember = teamMembers.find(m => m.name === ticket.assignedTo);
              if (!assignedMember) return null;
              
              const effort = resolveEffortDays(ticket);
              const velocityMultiplier = assignedMember.velocityMultiplier ?? 1;
              const adjustedDuration = Math.max(1, Math.round(effort / velocityMultiplier));
              
              return (
                <div className="mt-3 p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Effort Breakdown</h4>
                    <span 
                      className="text-[10px] text-slate-500 dark:text-slate-400 cursor-help" 
                      title="Duration = max(1, round(effort ÷ velocityMultiplier))"
                    >
                      ⓘ
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Effort:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{effort} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Developer:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {assignedMember.name} {assignedMember.experienceLevel && `(${assignedMember.experienceLevel} · ${velocityMultiplier}x)`}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700">
                      <span className="font-medium">Calculated Duration:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{adjustedDuration} working days</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Assigned Developer - Searchable Dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
              Assigned Developer
            </label>
            <div ref={assigneeRef} className="relative">
              <div
                className="flex items-center w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm transition-all duration-200"
                onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
              >
                <User className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2 flex-shrink-0" />
                <div className="flex-1">
                  <span className={cn("text-sm", ticket.assignedTo === 'Unassigned' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white')}>
                    {ticket.assignedTo}
                  </span>
                  {ticket.assignedTo !== 'Unassigned' && (() => {
                    const developer = teamMembers.find(m => m.name === ticket.assignedTo);
                    if (developer?.experienceLevel) {
                      return (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {developer.experienceLevel} · {developer.velocityMultiplier ?? 1}x velocity
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200", showAssigneeDropdown && 'rotate-180')} />
              </div>
              
              {showAssigneeDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-[240px] flex flex-col">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                    <input
                      type="text"
                      value={assigneeSearch}
                      onChange={(e) => setAssigneeSearch(e.target.value)}
                      placeholder="Search team members..."
                      autoFocus
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm transition-all duration-200 placeholder-slate-400 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="overflow-y-auto flex-1">
                    <button
                      className="w-full text-left px-3 py-2 text-xs text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
                      onClick={() => {
                        handleUpdate('assignedTo', 'Unassigned');
                        setShowAssigneeDropdown(false);
                        setAssigneeSearch('');
                      }}
                    >
                      Unassigned
                      {ticket.assignedTo === 'Unassigned' && <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                    </button>
                    {filteredNames.map(name => (
                      <button
                        key={name}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-400 transition-colors flex items-center justify-between"
                        onClick={() => {
                          handleUpdate('assignedTo', name);
                          setShowAssigneeDropdown(false);
                          setAssigneeSearch('');
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-medium shadow-sm">
                            {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          {name}
                        </span>
                        {ticket.assignedTo === name && <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                      </button>
                    ))}
                    {filteredNames.length === 0 && assigneeSearch && (
                      <div className="px-3 py-4 text-xs text-slate-400 dark:text-slate-500 text-center">
                        No team members found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status - Segmented Control */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
              Status
            </label>
            <div className="flex gap-2">
              {[
                { value: 'planned', label: 'Planned', color: 'bg-slate-100 text-slate-700 border-slate-200', ring: 'ring-slate-300' },
                { value: 'in-progress', label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200', ring: 'ring-blue-300' },
                { value: 'completed', label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', ring: 'ring-emerald-300' }
              ].map(s => (
                <button
                  key={s.value}
                  onClick={() => handleUpdate('status', s.value)}
                  className={cn(
                    "flex-1 px-3 py-2 text-xs font-medium rounded-xl border transition-all duration-200",
                    ticket.status === s.value 
                      ? `${s.color} ring-2 ring-offset-1 ${s.ring} shadow-sm dark:ring-offset-slate-900`
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Constraints & Risks - PTO Overlap Warning */}
          {ptoOverlapInfo.hasPtoRisk && (
            <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3 shadow-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-2">Constraints & Risks</h3>
                  
                  <div className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                    <p className="leading-relaxed">
                      <strong>Assigned developer PTO overlaps this ticket by {ptoOverlapInfo.overlapDays} working day{ptoOverlapInfo.overlapDays > 1 ? 's' : ''}.</strong>
                    </p>
                    
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Overlapping PTO entries:</p>
                      {ptoOverlapInfo.overlappingPTO.map((pto, idx) => (
                        <div key={idx} className="text-xs bg-white/60 dark:bg-amber-950/30 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-amber-200 dark:border-amber-800">
                          <div className="font-medium text-amber-900 dark:text-amber-300">{pto.name}</div>
                          <div className="text-amber-600 dark:text-amber-400 mt-0.5">
                            {pto.startDate.toLocaleDateString()} - {pto.endDate.toLocaleDateString()} 
                            <span className="ml-1">({pto.workingDays} working day{pto.workingDays > 1 ? 's' : ''})</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1.5">Schedule Risk:</p>
                      <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                        May delay completion by ~{ptoOverlapInfo.overlapDays} working day{ptoOverlapInfo.overlapDays > 1 ? 's' : ''} if work is sequential for this assignee.
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1.5">Suggested next steps:</p>
                      <ul className="text-xs space-y-1 ml-4 list-disc text-amber-700 dark:text-amber-300">
                        <li>Reassign to another developer</li>
                        <li>Adjust ticket dates around PTO</li>
                        <li>Split into smaller tickets</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
                Start Date
              </label>
              <input
                type="date"
                value={toLocalDateString(ticket.startDate)}
                onChange={(e) => {
                  const newStartDate = new Date(e.target.value);
                  // Recalculate endDate with velocity-adjusted duration
                  const currentEffort = ticket.effortDays || resolveEffortDays(ticket);
                  const assignedDev = teamMembers.find(m => m.name === ticket.assignedTo);
                  const velocity = assignedDev?.velocityMultiplier ?? 1;
                  const adjustedDuration = Math.max(1, Math.round(currentEffort / velocity));
                  const newEndDate = calculateEndDateFromEffort(newStartDate, adjustedDuration, holidays);
                  onUpdate(featureId, ticket.id, {
                    startDate: newStartDate,
                    endDate: newEndDate
                  });
                }}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent text-sm bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm transition-all duration-200 leading-relaxed text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
                End Date
              </label>
              <input
                type="date"
                value={toLocalDateString(ticket.endDate)}
                onChange={(e) => {
                  const newEndDate = new Date(e.target.value);
                  // Recalculate effortDays from new duration (working days)
                  const newEffort = calculateEffortFromDates(ticket.startDate, newEndDate, holidays);
                  onUpdate(featureId, ticket.id, {
                    endDate: newEndDate,
                    effortDays: newEffort,
                    storyPoints: newEffort // Backward compatibility
                  });
                }}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent text-sm bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm transition-all duration-200 leading-relaxed text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Derived Information */}
          <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50 space-y-3">
            <div className="flex items-center justify-between text-sm leading-relaxed">
              <span className="text-slate-500 dark:text-slate-400">Duration</span>
              <span className="font-normal text-slate-900 dark:text-white">{getDuration()} working days</span>
            </div>
            
            <div className="flex items-center justify-between text-sm leading-relaxed">
              <span className="text-slate-500 dark:text-slate-400">Sprint</span>
              <span className={cn(
                "font-normal",
                associatedSprint 
                  ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded-lg' 
                  : 'text-slate-400 dark:text-slate-500'
              )}>
                {associatedSprint ? associatedSprint.name : 'Not in sprint'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm leading-relaxed">
              <span className="text-slate-500 dark:text-slate-400">Feature</span>
              <span className="font-normal text-slate-900 dark:text-white">{featureName}</span>
            </div>
          </div>

          {/* Scheduling Constraints */}
          {blockingMilestones.length > 0 && (
            <div className="mt-4 p-3 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow-sm">
              <div className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">Scheduling Constraint</div>
              <div className="text-xs text-red-700 dark:text-red-400">
                This ticket overlaps {blockingMilestones[0].name} ({blockingMilestones[0].startDate.toLocaleDateString()}
                {blockingMilestones[0].endDate ? ` – ${blockingMilestones[0].endDate.toLocaleDateString()}` : ''}).
              </div>
              <div className="text-xs text-red-600 dark:text-red-400 mt-2">
                Suggested: Move ticket start after milestone or adjust scope.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl flex items-center justify-between">
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Press Esc to close</span>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-normal rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}