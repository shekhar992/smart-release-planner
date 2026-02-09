import { useState, useRef } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { Release, Ticket, mockHolidays, mockTeamMembers } from '../data/mockData';
import { SprintCreationPopover } from './SprintCreationPopover';
import { TicketConflict, ConflictSummary, hasConflict, getTicketConflicts } from '../lib/conflictDetection';
import { SprintCapacity, getCapacityStatusColor } from '../lib/capacityCalculation';

interface TimelinePanelProps {
  release: Release;
  onMoveTicket: (featureId: string, ticketId: string, newStartDate: Date) => void;
  onResizeTicket: (featureId: string, ticketId: string, newEndDate: Date) => void;
  onSelectTicket: (featureId: string, ticketId: string) => void;
  onCreateSprint: (name: string, startDate: Date, endDate: Date) => void;
  conflicts: Map<string, TicketConflict>;
  conflictSummary: ConflictSummary;
  sprintCapacities: Map<string, SprintCapacity>;
}

const DAY_WIDTH = 40;
const ROW_HEIGHT = 48;
const FEATURE_HEADER_HEIGHT = 40;
const SIDEBAR_WIDTH = 320; // Fixed left sidebar width

export function TimelinePanel({ release, onMoveTicket, onResizeTicket, onSelectTicket, onCreateSprint, conflicts, conflictSummary, sprintCapacities }: TimelinePanelProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showSprintCreation, setShowSprintCreation] = useState(false);
  const [showHolidays, setShowHolidays] = useState(true);
  const [showPTO, setShowPTO] = useState(true);
  const [showConflictSummary, setShowConflictSummary] = useState(false);
  const [collapsedFeatures, setCollapsedFeatures] = useState<Set<string>>(new Set());
  
  // Refs for scroll synchronization
  const sidebarRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);

  const startDate = new Date(release.startDate);
  const endDate = new Date(release.endDate);
  
  // Synchronize scroll positions
  const handleSidebarScroll = () => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    if (sidebarRef.current && timelineRef.current) {
      timelineRef.current.scrollTop = sidebarRef.current.scrollTop;
    }
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };
  
  const handleTimelineScroll = () => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    if (sidebarRef.current && timelineRef.current) {
      sidebarRef.current.scrollTop = timelineRef.current.scrollTop;
    }
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  const getDaysDifference = (date1: Date, date2: Date) => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const totalDays = getDaysDifference(startDate, endDate);
  const timelineWidth = totalDays * DAY_WIDTH;

  const getPositionFromDate = (date: Date) => {
    const daysFromStart = getDaysDifference(startDate, date);
    return daysFromStart * DAY_WIDTH;
  };

  // Calculate total content height
  const totalTickets = release.features.reduce((sum, f) => {
    const isCollapsed = collapsedFeatures.has(f.id);
    return sum + (isCollapsed ? 0 : f.tickets.length);
  }, 0);
  const totalFeatures = release.features.length;
  const contentHeight = (totalFeatures * FEATURE_HEADER_HEIGHT) + (totalTickets * ROW_HEIGHT);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Sticky Header Row */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 flex">
        {/* Left Sidebar Header */}
        <div 
          className="border-r border-gray-200 bg-gray-50"
          style={{ width: SIDEBAR_WIDTH, minWidth: SIDEBAR_WIDTH }}
        >
          <TimelineSidebarHeader 
            showHolidays={showHolidays}
            showPTO={showPTO}
            onToggleHolidays={setShowHolidays}
            onTogglePTO={setShowPTO}
            conflictSummary={conflictSummary}
            showConflictSummary={showConflictSummary}
            onToggleConflictSummary={setShowConflictSummary}
            onAddSprint={() => setShowSprintCreation(true)}
          />
        </div>

        {/* Timeline Header (Dates + Sprints) */}
        <div className="flex-1 overflow-x-auto">
          <div style={{ width: timelineWidth }}>
            <TimelineHeader
              startDate={startDate}
              totalDays={totalDays}
              dayWidth={DAY_WIDTH}
              sprints={release.sprints || []}
              getPositionFromDate={getPositionFromDate}
              getDaysDifference={getDaysDifference}
              sprintCapacities={sprintCapacities}
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
          {release.features.map((feature, featureIndex) => {
            const isCollapsed = collapsedFeatures.has(feature.id);
            const ticketCount = feature.tickets.length;
            
            return (
              <div 
                key={feature.id} 
                className="border-b border-gray-200"
                style={{ 
                  backgroundColor: featureIndex % 2 === 0 ? '#ffffff' : '#fafafa'
                }}
              >
                {/* Feature Header */}
                <div 
                  className="flex items-center px-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ height: FEATURE_HEADER_HEIGHT }}
                  onClick={() => {
                    const newCollapsed = new Set(collapsedFeatures);
                    if (isCollapsed) {
                      newCollapsed.delete(feature.id);
                    } else {
                      newCollapsed.add(feature.id);
                    }
                    setCollapsedFeatures(newCollapsed);
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-gray-400 text-sm">
                      {isCollapsed ? '▶' : '▼'}
                    </span>
                    <span className="font-semibold text-sm text-gray-800">
                      {feature.name}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {ticketCount}
                    </span>
                  </div>
                </div>

                {/* Feature Tickets - Names */}
                {!isCollapsed && feature.tickets.map((ticket, ticketIndex) => (
                  <TicketSidebarRow
                    key={ticket.id}
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
                ))}
              </div>
            );
          })}
        </div>

        {/* Right Timeline - Gantt Chart */}
        <div 
          ref={timelineRef}
          className="flex-1 overflow-auto bg-[#FAFBFC]"
          onScroll={handleTimelineScroll}
        >
          <div className="relative" style={{ width: timelineWidth, minHeight: '100%' }}>
            
            {/* LAYER 1: TIME GRID */}
            <TimeGrid 
              totalDays={totalDays} 
              dayWidth={DAY_WIDTH} 
              contentHeight={contentHeight}
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
                holidays={mockHolidays}
                startDate={startDate}
                endDate={endDate}
                getPositionFromDate={getPositionFromDate}
                getDaysDifference={getDaysDifference}
                dayWidth={DAY_WIDTH}
              />
            )}

            {/* LAYER 4: TICKET BARS - Rendered in natural flow matching sidebar */}
            {release.features.map((feature) => {
              const isCollapsed = collapsedFeatures.has(feature.id);
              
              return (
                <div key={feature.id}>
                  {/* Feature Header Spacer */}
                  <div style={{ height: FEATURE_HEADER_HEIGHT }} />

                  {/* Feature Ticket Bars */}
                  {!isCollapsed && feature.tickets.map((ticket, ticketIndex) => (
                    <TicketTimelineBar
                      key={ticket.id}
                      ticket={ticket}
                      featureId={feature.id}
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
                      showPTO={showPTO}
                      startDate={startDate}
                      hasConflict={hasConflict(ticket.id, conflicts)}
                      conflicts={conflicts}
                      isLastInFeature={ticketIndex === feature.tickets.length - 1}
                    />
                  ))}
                </div>
              );
            })}
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
          defaultStartDate={release.startDate}
        />
      )}
    </div>
  );
}

// LAYER 1: TIME GRID
function TimeGrid({ 
  totalDays, 
  dayWidth, 
  contentHeight
}: { 
  totalDays: number; 
  dayWidth: number; 
  contentHeight: number;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, height: contentHeight }}>
      {/* Vertical day lines */}
      {Array.from({ length: totalDays + 1 }).map((_, i) => {
        const isWeekBoundary = i % 7 === 0;
        return (
          <div
            key={`vline-${i}`}
            className="absolute"
            style={{
              left: i * dayWidth,
              width: '1px',
              height: contentHeight,
              top: 0,
              backgroundColor: isWeekBoundary ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            }}
          />
        );
      })}
    </div>
  );
}

// LAYER 2: SPRINT BANDS (Clean alternating backgrounds)
function SprintBands({
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
              backgroundColor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
            }}
          />
        );
      })}
    </div>
  );
}

// LAYER 3: HOLIDAYS
function HolidayBands({
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
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
      {holidays.map((holiday) => {
        if (holiday.endDate < startDate || holiday.startDate > endDate) return null;
        
        const overlayStart = holiday.startDate < startDate ? startDate : holiday.startDate;
        const overlayEnd = holiday.endDate > endDate ? endDate : holiday.endDate;
        const left = getPositionFromDate(overlayStart);
        const width = getDaysDifference(overlayStart, overlayEnd) * dayWidth;
        
        return (
          <div
            key={holiday.id}
            className="absolute top-0 bottom-0"
            style={{
              left,
              width,
              backgroundColor: 'rgba(100, 116, 139, 0.08)',
            }}
            title={holiday.name}
          >
            <div className="absolute top-2 left-0 right-0 text-center">
              <div 
                className="inline-block px-2 py-0.5 text-[9px] font-medium rounded"
                style={{
                  backgroundColor: 'rgba(100, 116, 139, 0.9)',
                  color: 'white',
                }}
              >
                {holiday.name}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// HEADER
function TimelineHeader({
  startDate,
  totalDays,
  dayWidth,
  sprints,
  getPositionFromDate,
  getDaysDifference,
  sprintCapacities
}: {
  startDate: Date;
  totalDays: number;
  dayWidth: number;
  sprints: any[];
  getPositionFromDate: (date: Date) => number;
  getDaysDifference: (date1: Date, date2: Date) => number;
  sprintCapacities: Map<string, SprintCapacity>;
}) {
  return (
    <div className="bg-white">
      {/* Date labels */}
      <div className="flex h-12 items-end border-b border-gray-200">
        {Array.from({ length: totalDays + 1 }).map((_, i) => {
          const currentDate = new Date(startDate);
          currentDate.setDate(currentDate.getDate() + i);
          const isWeekStart = currentDate.getDay() === 1;
          
          return (
            <div
              key={i}
              className="flex-shrink-0 px-1 pb-1.5"
              style={{ width: dayWidth }}
            >
              {isWeekStart && (
                <div className="text-[10px] font-medium" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                  {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              )}
              <div className="text-[9px]" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                {currentDate.toLocaleDateString('en-US', { weekday: 'narrow' })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sprint labels with integrated capacity */}
      <SprintHeaderRow
        sprints={sprints}
        sprintCapacities={sprintCapacities}
        getPositionFromDate={getPositionFromDate}
        getDaysDifference={getDaysDifference}
        dayWidth={dayWidth}
      />
    </div>
  );
}

// SPRINT HEADER ROW: Integrated capacity visualization
function SprintHeaderRow({
  sprints,
  sprintCapacities,
  getPositionFromDate,
  getDaysDifference,
  dayWidth
}: {
  sprints: any[];
  sprintCapacities: Map<string, SprintCapacity>;
  getPositionFromDate: (date: Date) => number;
  getDaysDifference: (date1: Date, date2:Date) => number;
  dayWidth: number;
}) {
  const [hoveredSprint, setHoveredSprint] = useState<string | null>(null);

  const getStatusBadge = (utilizationPercent: number) => {
    if (utilizationPercent > 100) return { label: '⚠ Over', color: '#dc2626' };
    if (utilizationPercent >= 90) return { label: 'Near', color: '#f59e0b' };
    if (utilizationPercent >= 70) return { label: 'Good', color: '#10b981' };
    return { label: 'Low', color: '#6b7280' };
  };

  return (
    <div className="relative h-16" style={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
      {sprints.map((sprint) => {
        const left = getPositionFromDate(sprint.startDate);
        const width = getDaysDifference(sprint.startDate, sprint.endDate) * dayWidth;
        const capacity = sprintCapacities.get(sprint.id);
        const status = capacity ? getStatusBadge(capacity.utilizationPercent) : null;
        
        return (
          <div
            key={sprint.id}
            className="absolute px-3 py-1.5"
            style={{
              left,
              width,
              top: 0,
              height: 64,
              borderLeft: '1px solid rgba(0, 0, 0, 0.1)',
            }}
            onMouseEnter={() => setHoveredSprint(sprint.id)}
            onMouseLeave={() => setHoveredSprint(null)}
          >
            {/* Sprint name and dates */}
            <div className="flex items-start justify-between mb-1.5">
              <div>
                <div className="text-xs font-semibold text-gray-700">{sprint.name}</div>
                <div className="text-[10px] text-gray-500">
                  {sprint.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {sprint.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              {status && (
                <span 
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ 
                    backgroundColor: `${status.color}15`,
                    color: status.color,
                    border: `1px solid ${status.color}30`
                  }}
                >
                  {status.label}
                </span>
              )}
            </div>

            {/* Capacity visualization */}
            {capacity && (
              <div className="space-y-1">
                {/* Progress bar with dots */}
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden relative">
                    <div 
                      className="h-full transition-all duration-300 rounded-full"
                      style={{ 
                        width: `${Math.min(capacity.utilizationPercent, 100)}%`,
                        backgroundColor: getCapacityStatusColor(capacity.utilizationPercent)
                      }}
                    />
                    {/* Milestone markers every 25% */}
                    <div className="absolute inset-0 flex justify-between px-0.5">
                      {[25, 50, 75].map((mark) => (
                        <div 
                          key={mark}
                          className="w-0.5 h-full bg-white opacity-40"
                          style={{ marginLeft: mark === 25 ? '24%' : mark === 50 ? '24%' : '24%' }}
                        />
                      ))}
                    </div>
                  </div>
                  <span 
                    className="text-[10px] font-bold whitespace-nowrap"
                    style={{ color: getCapacityStatusColor(capacity.utilizationPercent) }}
                  >
                    {Math.round(capacity.utilizationPercent)}%
                  </span>
                </div>

                {/* Story points summary */}
                <div className="text-[10px] text-gray-600">
                  <span className="font-semibold">{capacity.plannedStoryPoints}</span>
                  <span className="text-gray-400"> / </span>
                  <span>{capacity.capacityStoryPoints} SP</span>
                </div>

                {/* Detailed hover tooltip */}
                {hoveredSprint === sprint.id && (
                  <div className="absolute z-50 mt-1 left-0 bg-white rounded-lg shadow-xl border border-gray-200 p-3 text-[11px] min-w-[220px]"
                    style={{ top: '100%' }}
                  >
                    <div className="font-semibold text-gray-800 mb-2 flex items-center justify-between">
                      <span>Sprint Capacity Details</span>
                      <span 
                        className="text-[10px] font-bold px-2 py-0.5 rounded"
                        style={{ 
                          backgroundColor: `${status!.color}15`,
                          color: status!.color
                        }}
                      >
                        {status!.label}
                      </span>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-gray-700">
                        <span>Team size:</span>
                        <span className="font-medium">{capacity.teamSize} developers</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Working days:</span>
                        <span className="font-medium">{capacity.workingDays} days</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Holidays:</span>
                        <span className="font-medium">-{capacity.holidayDays} days</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>PTO:</span>
                        <span className="font-medium">-{capacity.ptoDays} days</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-1.5 mt-1.5 font-semibold text-gray-800">
                        <span>Available capacity:</span>
                        <span>{capacity.totalTeamDays} team-days</span>
                      </div>
                      <div className="flex justify-between font-semibold text-gray-800">
                        <span>Planned work:</span>
                        <span>{capacity.plannedStoryPoints} story points</span>
                      </div>
                      {capacity.overCapacity && (
                        <div className="mt-2 pt-2 border-t border-red-200 text-red-600 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Over by {capacity.plannedStoryPoints - capacity.capacityStoryPoints} SP
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// SIDEBAR HEADER: Left column header with controls
function TimelineSidebarHeader({
  showHolidays,
  showPTO,
  onToggleHolidays,
  onTogglePTO,
  conflictSummary,
  showConflictSummary,
  onToggleConflictSummary,
  onAddSprint
}: {
  showHolidays: boolean;
  showPTO: boolean;
  onToggleHolidays: (value: boolean) => void;
  onTogglePTO: (value: boolean) => void;
  conflictSummary: ConflictSummary;
  showConflictSummary: boolean;
  onToggleConflictSummary: (value: boolean) => void;
  onAddSprint: () => void;
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Control Bar */}
      <div className="flex flex-col gap-2 px-4 py-2 border-b border-gray-200">
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-70 transition-opacity">
            <input
              type="checkbox"
              checked={showHolidays}
              onChange={(e) => onToggleHolidays(e.target.checked)}
              className="w-3 h-3"
            />
            <span className="text-gray-700">Holidays</span>
          </label>
          
          <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-70 transition-opacity">
            <input
              type="checkbox"
              checked={showPTO}
              onChange={(e) => onTogglePTO(e.target.checked)}
              className="w-3 h-3"
            />
            <span className="text-gray-700">PTO</span>
          </label>
        </div>

        {/* Conflict Summary Badge */}
        {conflictSummary.totalConflicts > 0 && (
          <div className="relative">
            <button
              onClick={() => onToggleConflictSummary(!showConflictSummary)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-all hover:shadow-sm text-xs w-full"
              style={{
                backgroundColor: 'rgba(251, 192, 45, 0.15)',
                border: '1px solid rgba(251, 192, 45, 0.3)',
                color: '#b45309',
              }}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-medium">
                {conflictSummary.totalConflicts} Conflict{conflictSummary.totalConflicts > 1 ? 's' : ''}
              </span>
            </button>
            
            {showConflictSummary && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => onToggleConflictSummary(false)}
                />
                <div 
                  className="absolute left-0 bg-white border border-gray-200 rounded-lg shadow-xl p-3 min-w-[280px] z-50"
                  style={{ top: 'calc(100% + 8px)' }}
                >
                  <div className="text-xs font-medium text-gray-900 mb-2">
                    Scheduling Conflicts
                  </div>
                  <ul className="space-y-1">
                    {conflictSummary.affectedDevelopers.map(dev => (
                      <li key={dev} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700">{dev}</span>
                        <span className="text-amber-600 font-medium">
                          {conflictSummary.conflictsByDeveloper[dev]} conflict{conflictSummary.conflictsByDeveloper[dev] > 1 ? 's' : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        {/* Add Sprint Button */}
        <button
          onClick={onAddSprint}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded transition-all hover:opacity-90 w-full"
          style={{
            backgroundColor: '#64748b',
            color: 'white',
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Sprint
        </button>
      </div>

      {/* Ticket Name Header */}
      <div className="px-4 py-3 border-b border-gray-200 text-xs font-semibold text-gray-700">
        Ticket Details
      </div>
    </div>
  );
}

// TICKET SIDEBAR ROW: Left sidebar ticket information
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
  return (
    <div 
      className="flex items-center px-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
      style={{ 
        height: rowHeight,
        backgroundColor: isSelected ? '#eff6ff' : 'transparent',
        borderLeft: hasConflict ? '4px solid #f59e0b' : isSelected ? '4px solid #3b82f6' : 'none',
        paddingLeft: hasConflict || isSelected ? '12px' : '16px',
        borderBottom: isLastInFeature ? 'none' : '1px solid rgba(0, 0, 0, 0.05)'
      }}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {hasConflict && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />}
          <span className="text-sm font-medium text-gray-900 truncate">
            {ticket.title}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="truncate">{ticket.assignedTo}</span>
          <span className="flex-shrink-0">•</span>
          <span className="flex-shrink-0 font-medium">{ticket.storyPoints} SP</span>
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
  onResize,
  showPTO,
  startDate: _startDate,
  hasConflict,
  conflicts,
  isLastInFeature: _isLastInFeature
}: {
  ticket: Ticket;
  featureId: string;
  rowHeight: number;
  dayWidth: number;
  getPositionFromDate: (date: Date) => number;
  getDaysDifference: (date1: Date, date2: Date) => number;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (newStartDate: Date) => void;
  onResize: (newEndDate: Date) => void;
  showPTO: boolean;
  startDate: Date;
  hasConflict: boolean;
  conflicts: Map<string, TicketConflict>;
  isLastInFeature?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [showConflictTooltip, setShowConflictTooltip] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  const assignedMember = mockTeamMembers.find(m => m.name === ticket.assignedTo);
  const ptoEntries = assignedMember?.pto || [];

  const ticketLeft = getPositionFromDate(ticket.startDate);
  const ticketWidth = getDaysDifference(ticket.startDate, ticket.endDate) * dayWidth;

  // Get conflict details for tooltip
  const ticketConflicts = hasConflict ? getTicketConflicts(ticket.id, conflicts) : [];

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize-left' | 'resize-right') => {
    e.preventDefault();
    e.stopPropagation();

    if (action === 'drag') {
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
    } else if (action === 'resize-right') {
      setIsResizing('right');
      const startX = e.clientX;
      const initialWidth = ticketWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const newWidth = Math.max(dayWidth, initialWidth + deltaX);
        
        if (ticketRef.current) {
          ticketRef.current.style.width = `${newWidth}px`;
        }
      };

      const handleMouseUp = (moveEvent: MouseEvent) => {
        setIsResizing(null);
        const deltaX = moveEvent.clientX - startX;
        const daysDelta = Math.round(deltaX / dayWidth);
        
        if (daysDelta !== 0) {
          const newEndDate = new Date(ticket.endDate);
          newEndDate.setDate(newEndDate.getDate() + daysDelta);
          onResize(newEndDate);
        }
        
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  return (
    <div 
      className="relative" 
      style={{ 
        height: rowHeight
      }}
    >
      {/* LAYER 4: PTO OVERLAYS */}
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
              backgroundColor: 'rgba(194, 135, 65, 0.15)',
              zIndex: 4,
            }}
            title={`${ticket.assignedTo} - ${pto.name}`}
          />
        );
      })}

      {/* LAYER 5: TICKET BAR */}
      <div
        ref={ticketRef}
        className="absolute group cursor-grab relative"
        style={{
          left: ticketLeft,
          width: ticketWidth,
          minWidth: 80,
          top: 8,
          height: 32,
          backgroundColor: hasConflict ? 'rgba(251, 192, 45, 0.15)' : '#f5f5f4',
          border: hasConflict 
            ? isSelected ? '2px solid #f59e0b' : '2px solid rgba(251, 192, 45, 0.6)'
            : isSelected ? '2px solid #64748b' : '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '4px',
          zIndex: 5,
          opacity: isDragging || isResizing ? 0.7 : 1,
          boxShadow: hasConflict 
            ? '0 2px 6px rgba(251, 192, 45, 0.3)' 
            : isSelected ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
        }}
        onMouseDown={(e) => {
          if (!(e.target as HTMLElement).classList.contains('resize-handle')) {
            handleMouseDown(e, 'drag');
          }
        }}
        onMouseEnter={() => hasConflict && setShowConflictTooltip(true)}
        onMouseLeave={() => setShowConflictTooltip(false)}
      >
        <div className="flex items-center gap-2 px-2 h-full">
          {hasConflict && (
            <AlertTriangle 
              className="flex-shrink-0 w-3.5 h-3.5" 
              style={{ color: '#f59e0b' }}
            />
          )}
          <div 
            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium"
            style={{
              backgroundColor: hasConflict ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 0, 0, 0.1)',
              color: hasConflict ? '#b45309' : 'rgba(0, 0, 0, 0.6)',
            }}
          >
            {ticket.storyPoints}
          </div>
          <span 
            className="truncate text-xs" 
            style={{ color: hasConflict ? '#78350f' : 'rgba(0, 0, 0, 0.7)' }}
          >
            {ticket.title}
          </span>
        </div>

        {/* Right resize handle */}
        <div
          className="resize-handle absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
          onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
        />

        {/* Conflict Tooltip */}
        {hasConflict && showConflictTooltip && ticketConflicts.length > 0 && (
          <div 
            className="absolute left-0 top-full mt-2 bg-white border border-amber-300 rounded-lg shadow-xl p-3 min-w-[280px] z-50"
            style={{ pointerEvents: 'none' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-900">
                Scheduling Conflict
              </span>
            </div>
            <div className="text-xs text-gray-600 mb-2">
              {ticket.assignedTo} has overlapping tasks:
            </div>
            <ul className="space-y-1.5">
              {ticketConflicts.map((conflict, idx) => (
                <li key={idx} className="text-xs">
                  <div className="flex items-start gap-1.5">
                    <span className="text-amber-600">•</span>
                    <div>
                      <div className="font-medium text-gray-800">{conflict.ticketTitle}</div>
                      <div className="text-gray-500">
                        {conflict.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {conflict.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' '}({conflict.overlapDays} day{conflict.overlapDays > 1 ? 's' : ''} overlap)
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
