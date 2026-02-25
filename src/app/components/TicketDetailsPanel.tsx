import { useState, useEffect, useRef, useMemo } from 'react';
import { X, User, Trash2, ArrowRightLeft, ChevronDown, Check, AlertTriangle } from 'lucide-react';
import { Ticket, Release, TeamMember, Milestone, Holiday, mockHolidays } from '../data/mockData';
import { resolveEffortDays } from '../lib/effortResolver';
import { calculateEndDateFromEffort, calculateEffortFromDates, toLocalDateString } from '../lib/dateUtils';
import { loadHolidays } from '../lib/localStorage';
import { cn } from './ui/utils';
import { DatePicker } from './DatePicker';

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
  const [showPTODetails, setShowPTODetails] = useState(false);
  const [showEffortTooltip, setShowEffortTooltip] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const assigneeRef = useRef<HTMLDivElement>(null);
  const moveMenuRef = useRef<HTMLDivElement>(null);
  const effortTooltipRef = useRef<HTMLDivElement>(null);
  
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
      if (effortTooltipRef.current && !effortTooltipRef.current.contains(e.target as Node)) {
        setShowEffortTooltip(false);
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
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 flex flex-col max-h-[75vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50">
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
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
              Description
            </label>
            <textarea
              value={ticket.description || ''}
              onChange={(e) => handleUpdate('description', e.target.value)}
              placeholder="Add a description..."
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent text-sm resize-y bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm transition-all duration-200 leading-relaxed placeholder-slate-400 text-slate-900 dark:text-white min-h-[60px]"
              rows={2}
            />
          </div>

          {/* Effort Days */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
              Effort (Days)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={ticket.effortDays || resolveEffortDays(ticket)}
              onChange={(e) => {
                let value = parseFloat(e.target.value);
                
                // Validate minimum 0.5, treat 0 or empty as 0.5
                if (isNaN(value) || value <= 0) {
                  value = 0.5;
                }
                
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
              onBlur={(e) => {
                // Ensure minimum 0.5 on blur
                const value = parseFloat(e.target.value);
                if (isNaN(value) || value < 0.5) {
                  const assignedDev = teamMembers.find(m => m.name === ticket.assignedTo);
                  const velocity = assignedDev?.velocityMultiplier ?? 1;
                  const adjustedDuration = Math.max(1, Math.round(0.5 / velocity));
                  const newEndDate = calculateEndDateFromEffort(ticket.startDate, adjustedDuration, holidays);
                  
                  onUpdate(featureId, ticket.id, {
                    effortDays: 0.5,
                    storyPoints: 0.5,
                    endDate: newEndDate
                  });
                }
              }}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400"
              placeholder="e.g., 3"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              <span>Minimum 0.5 days</span>
              {ticket.assignedTo && (() => {
                const assignedMember = teamMembers.find(m => m.name === ticket.assignedTo);
                if (!assignedMember) return null;
                
                const effort = resolveEffortDays(ticket);
                const velocityMultiplier = assignedMember.velocityMultiplier ?? 1;
                const adjustedDuration = Math.max(1, Math.round(effort / velocityMultiplier));
                
                return (
                  <div ref={effortTooltipRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEffortTooltip(!showEffortTooltip)}
                      className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      <span>→ {adjustedDuration} working days</span>
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[9px] hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors">i</span>
                    </button>
                    
                    {showEffortTooltip && (
                      <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50">
                        <div className="text-xs space-y-2">
                          <div className="font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                            Duration Calculation
                          </div>
                          <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                            <div className="flex justify-between">
                              <span className="text-slate-500 dark:text-slate-400">Effort:</span>
                              <span className="font-medium">{effort} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 dark:text-slate-400">Velocity:</span>
                              <span className="font-medium">{velocityMultiplier}x</span>
                            </div>
                            <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400">
                              <span>Result:</span>
                              <span className="font-medium">{adjustedDuration} working days</span>
                            </div>
                          </div>
                        </div>
                        {/* Arrow pointing down */}
                        <div className="absolute bottom-0 right-4 translate-y-1/2 w-2 h-2 bg-white dark:bg-slate-800 border-r border-b border-slate-200 dark:border-slate-700 rotate-45"></div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
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
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                          ({developer.experienceLevel} · {developer.velocityMultiplier ?? 1}x)
                        </span>
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
                    {filteredNames.map(name => {
                      const member = teamMembers.find(m => m.name === name);
                      return (
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
                            <div className="flex flex-col">
                              <span>{name}</span>
                              {member?.experienceLevel && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {member.experienceLevel} · {member.velocityMultiplier ?? 1}x
                                </span>
                              )}
                            </div>
                          </span>
                          {ticket.assignedTo === name && <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                        </button>
                      );
                    })}
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

          {/* Status - Dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
              Status
            </label>
            <select
              value={ticket.status}
              onChange={(e) => handleUpdate('status', e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm transition-all duration-200 text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Constraints & Risks - PTO Overlap Warning */}
          {ptoOverlapInfo.hasPtoRisk && (
            <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl shadow-sm">
              <button
                onClick={() => setShowPTODetails(!showPTODetails)}
                className="w-full flex items-start gap-2 text-left"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                      PTO Overlap: {ptoOverlapInfo.overlapDays} day{ptoOverlapInfo.overlapDays > 1 ? 's' : ''} affected
                    </h3>
                    <ChevronDown className={cn(
                      "w-4 h-4 text-amber-600 dark:text-amber-500 transition-transform duration-200",
                      showPTODetails && "rotate-180"
                    )} />
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Developer has PTO during ticket timeline
                  </p>
                </div>
              </button>
              
              {showPTODetails && (
                <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800 space-y-2 text-sm text-amber-800 dark:text-amber-200">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Overlapping PTO:</p>
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

                  <div className="pt-2 border-t border-amber-200 dark:border-amber-800">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Actions:</p>
                    <ul className="text-xs space-y-0.5 ml-3 list-disc text-amber-700 dark:text-amber-300">
                      <li>Reassign to another developer</li>
                      <li>Adjust ticket dates around PTO</li>
                      <li>Split into smaller tickets</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <DatePicker
                label="Start Date"
                value={toLocalDateString(ticket.startDate)}
                onChange={(isoDate) => {
                  const newStartDate = new Date(isoDate);
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
              />
            </div>
            <div>
              <DatePicker
                label="End Date"
                value={toLocalDateString(ticket.endDate)}
                onChange={(isoDate) => {
                  const newEndDate = new Date(isoDate);
                  // Recalculate effortDays from new duration (working days)
                  const newEffort = calculateEffortFromDates(ticket.startDate, newEndDate, holidays);
                  onUpdate(featureId, ticket.id, {
                    endDate: newEndDate,
                    effortDays: newEffort,
                    storyPoints: newEffort // Backward compatibility
                  });
                }}
              />
            </div>
          </div>

          {/* Scheduling Constraints */}
          {blockingMilestones.length > 0 && (
            <div className="p-2.5 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-red-800 dark:text-red-300">Milestone Conflict</div>
                  <div className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                    Overlaps {blockingMilestones[0].name} ({blockingMilestones[0].startDate.toLocaleDateString()}
                    {blockingMilestones[0].endDate ? ` – ${blockingMilestones[0].endDate.toLocaleDateString()}` : ''})
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl flex items-center justify-between">
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