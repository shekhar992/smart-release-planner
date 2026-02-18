import { useState, useRef } from 'react';
import { Plus, AlertTriangle, GripVertical, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { Release, Ticket, Holiday, TeamMember } from '../data/mockData';
import { SprintCreationPopover } from './SprintCreationPopover';
import { TicketConflict, ConflictSummary, hasConflict, getTicketConflicts } from '../lib/conflictDetection';
import { SprintCapacity, getCapacityStatusColor } from '../lib/capacityCalculation';
import designTokens, { getTicketColors, getConflictColors } from '../lib/designTokens';
import { TruncatedText } from './Tooltip';
import { resolveEffortDays, getAdjustedDuration } from '../lib/effortResolver';
import { calculateWorkingDays } from '../lib/teamCapacityCalculation';

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
  conflictSummary: ConflictSummary;
  sprintCapacities: Map<string, SprintCapacity>;
  onViewConflictDetails?: () => void;
}

const DAY_WIDTH = 40;
const ROW_HEIGHT = 48;
const FEATURE_HEADER_HEIGHT = 40;
const SIDEBAR_WIDTH = 320; // Fixed left sidebar width

export function TimelinePanel({ release, holidays, teamMembers, onMoveTicket, onResizeTicket, onSelectTicket, onCloneTicket, onCreateSprint, onUpdateSprint, onDeleteSprint, conflicts, conflictSummary, sprintCapacities, onViewConflictDetails }: TimelinePanelProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showSprintCreation, setShowSprintCreation] = useState(false);
  const [showHolidays, setShowHolidays] = useState(true);
  const [showPTO, setShowPTO] = useState(true);
  const [showConflictSummary, setShowConflictSummary] = useState(false);
  const [collapsedFeatures, setCollapsedFeatures] = useState<Set<string>>(new Set());
  const [showSprintSummary, setShowSprintSummary] = useState(false);
  
  // Refs for scroll synchronization
  const sidebarRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingScrollVertical = useRef(false);
  const isSyncingScrollHorizontal = useRef(false);

  const startDate = new Date(release.startDate);
  const endDate = new Date(release.endDate);
  
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
            onViewConflictDetails={onViewConflictDetails}
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
            />
          </div>
        </div>
      </div>

      {/* Sprint Summary Strip - always visible, no scroll required */}
      {showSprintSummary && (release.sprints || []).length > 0 && (
        <div className="mt-2">
          <SprintSummaryStrip 
            sprints={release.sprints || []}
            sprintCapacities={sprintCapacities}
            allTickets={release.features.flatMap(f => f.tickets)}
            onCollapse={() => setShowSprintSummary(false)}
          />
        </div>
      )}
      
      {/* Collapsed sprint summary toggle */}
      {!showSprintSummary && (release.sprints || []).length > 0 && (
        <button
          onClick={() => setShowSprintSummary(true)}
          className="w-full flex items-center justify-center gap-1.5 py-1 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ChevronDown className="w-3 h-3" />
          Show Sprint Summary
        </button>
      )}

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
                className="border-b border-gray-100"
                style={{ 
                  backgroundColor: featureIndex % 2 === 0 ? '#ffffff' : '#fafafa'
                }}
              >
                {/* Feature Header (Enhanced with 1.2.5 smooth arrow rotation) */}
                <div 
                  className="flex items-center px-4 cursor-pointer hover:bg-gray-50 transition-all duration-150"
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
                    {/* 1.2.5: Smooth arrow rotation */}
                    <span 
                      className="text-sm transition-transform duration-200 ease-out"
                      style={{
                        transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                        transformOrigin: 'center',
                        color: designTokens.colors.neutral[600]  // 1.3.2: Better contrast
                      }}
                    >
                      ▶
                    </span>
                    <span 
                      className="font-semibold"
                      style={{
                        fontSize: designTokens.typography.fontSize.sm,
                        color: designTokens.colors.neutral[800]  // 1.3.2: Better contrast
                      }}
                    >
                      {feature.name}
                    </span>
                    <span 
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        fontSize: designTokens.typography.fontSize.xs,
                        fontWeight: designTokens.typography.fontWeight.medium,  // 1.3.2: Medium weight
                        color: designTokens.colors.neutral[600],
                        backgroundColor: designTokens.colors.neutral[100]
                      }}
                    >
                      {ticketCount}
                    </span>
                  </div>
                </div>

                {/* Feature Tickets - Names (1.2.5: Staggered fade-in) */}
                {!isCollapsed && feature.tickets.map((ticket, ticketIndex) => (
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

            {/* LAYER 4: TICKET BARS - Rendered in natural flow matching sidebar */}
            {release.features.map((feature) => {
              const isCollapsed = collapsedFeatures.has(feature.id);
              
              return (
                <div key={feature.id}>
                  {/* Feature Header Spacer */}
                  <div style={{ height: FEATURE_HEADER_HEIGHT }} />

                  {/* Feature Ticket Bars (1.2.5: Staggered animation) */}
                  {!isCollapsed && feature.tickets.map((ticket, ticketIndex) => (
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
                        hasConflict={hasConflict(ticket.id, conflicts)}
                        conflicts={conflicts}
                        teamMembers={teamMembers}
                        isLastInFeature={ticketIndex === feature.tickets.length - 1}
                      />
                    </div>
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
          onUpdateSprint={onUpdateSprint}
          onDeleteSprint={onDeleteSprint}
          defaultStartDate={release.startDate}
          existingSprints={release.sprints || []}
        />
      )}
    </div>
  );
}

// LAYER 1: TIME GRID (Enhanced with today indicator, weekend shading, month boundaries)
function TimeGrid({ 
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
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, height: contentHeight }}>
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
            {/* Weekend shading */}
            {isWeekend && (
              <div
                className="absolute"
                style={{
                  left: i * dayWidth,
                  width: dayWidth,
                  height: contentHeight,
                  top: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.01)',
                  zIndex: 0,
                }}
              />
            )}
            
            {/* Vertical day lines */}
            <div
              className="absolute"
              style={{
                left: i * dayWidth,
                width: isMonthStart ? '1px' : '1px',
                height: contentHeight,
                top: 0,
                backgroundColor: isMonthStart 
                  ? 'rgba(0, 0, 0, 0.08)'
                  : isWeekBoundary 
                    ? 'rgba(0, 0, 0, 0.03)' 
                    : 'rgba(0, 0, 0, 0.02)',
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
}

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
      {sprints.map((sprint, index) => {
        const left = getPositionFromDate(sprint.startDate);
        const width = getDaysDifference(sprint.startDate, sprint.endDate) * dayWidth;
        
        // Check if sprint is current (today falls within sprint dates)
        const sprintStart = new Date(sprint.startDate);
        const sprintEnd = new Date(sprint.endDate);
        sprintStart.setHours(0, 0, 0, 0);
        sprintEnd.setHours(0, 0, 0, 0);
        const isCurrent = today >= sprintStart && today <= sprintEnd;
        
        // Calculate progress percentage for current sprint
        let progressPercent = 0;
        if (isCurrent) {
          const totalDays = getDaysDifference(sprintStart, sprintEnd);
          const elapsedDays = getDaysDifference(sprintStart, today);
          progressPercent = (elapsedDays / totalDays) * 100;
        }
        
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
          >
            {/* Current sprint progress overlay */}
            {isCurrent && progressPercent > 0 && (
              <div
                className="absolute top-0 bottom-0 left-0"
                style={{
                  width: `${progressPercent}%`,
                  background: `linear-gradient(to right, 
                    rgba(59, 130, 246, 0.08), 
                    rgba(59, 130, 246, 0.04)
                  )`,
                  borderRight: `2px solid ${designTokens.colors.sprint.primary}`,
                  boxShadow: `2px 0 8px rgba(59, 130, 246, 0.2)`,
                  zIndex: 1,
                }}
              >
                {/* Progress indicator badge */}
                <div
                  className="absolute top-2 right-0 transform translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                  style={{
                    backgroundColor: designTokens.colors.sprint.primary,
                    color: '#FFFFFF',
                    boxShadow: designTokens.shadows.sm,
                  }}
                >
                  {Math.round(progressPercent)}%
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// LAYER 3: HOLIDAYS (Enhanced with diagonal pattern)
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
              background: `
                repeating-linear-gradient(
                  45deg,
                  rgba(100, 116, 139, 0.04),
                  rgba(100, 116, 139, 0.04) 10px,
                  rgba(100, 116, 139, 0.08) 10px,
                  rgba(100, 116, 139, 0.08) 20px
                )
              `,
            }}
            title={holiday.name}
          >
            <div className="absolute top-2 left-0 right-0 text-center">
              <div 
                className="inline-block px-2 py-0.5 text-[9px] font-medium rounded shadow-sm"
                style={{
                  backgroundColor: 'rgba(100, 116, 139, 0.9)',
                  color: 'white',
                }}
              >
                🏖️ {holiday.name}
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
      {/* Date labels - Enhanced with month boundaries and today indicator */}
      <div className="flex h-12 items-end border-b border-gray-200 relative">
        {Array.from({ length: totalDays + 1 }).map((_, i) => {
          const currentDate = new Date(startDate);
          currentDate.setDate(currentDate.getDate() + i);
          const isWeekStart = currentDate.getDay() === 1;
          const isMonthStart = currentDate.getDate() === 1;
          const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
          
          // Check if today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const cellDate = new Date(currentDate);
          cellDate.setHours(0, 0, 0, 0);
          const isToday = cellDate.getTime() === today.getTime();
          
          return (
            <div
              key={i}
              className="flex-shrink-0 px-1 pb-1.5 relative"
              style={{ 
                width: dayWidth,
                backgroundColor: isToday 
                  ? 'rgba(239, 68, 68, 0.08)' 
                  : isWeekend 
                    ? 'rgba(0, 0, 0, 0.02)' 
                    : 'transparent',
              }}
            >
              {/* Month boundary marker */}
              {isMonthStart && (
                <>
                  <div className="text-[11px] font-bold mb-0.5" style={{ color: designTokens.colors.sprint.primary }}>
                    {currentDate.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div 
                    className="absolute left-0 top-0 bottom-0" 
                    style={{ 
                      width: '2px', 
                      backgroundColor: designTokens.colors.timeline.weekBoundary 
                    }}
                  />
                </>
              )}
              
              {/* Week start date */}
              {isWeekStart && !isMonthStart && (
                <div className="text-[10px] font-medium" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                  {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              )}
              
              {/* Day letter with today highlight */}
              <div 
                className="text-[9px] font-medium" 
                style={{ 
                  color: isToday 
                    ? designTokens.colors.today.line 
                    : isWeekend 
                      ? 'rgba(0, 0, 0, 0.3)' 
                      : 'rgba(0, 0, 0, 0.4)',
                  fontWeight: isToday ? 'bold' : 'normal',
                }}
              >
                {currentDate.toLocaleDateString('en-US', { weekday: 'narrow' })}
              </div>
              
              {/* Today indicator in header */}
              {isToday && (
                <div
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
                  style={{
                    width: '2px',
                    height: '4px',
                    backgroundColor: designTokens.colors.today.line,
                  }}
                />
              )}
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
        const capacity = sprintCapacities?.get(sprint.id);
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
            {/* Sprint name and dates - 1.3.3: Multi-line wrap for long names */}
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex-1 pr-2">
                <div 
                  className="font-semibold"
                  style={{
                    fontSize: designTokens.typography.fontSize.xs,
                    color: designTokens.colors.neutral[700],
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    letterSpacing: '0.025em'  // tracking-wide
                  }}
                >
                  {sprint.name}
                </div>
                <div 
                  className="text-gray-500 text-xs"
                  style={{
                    fontWeight: designTokens.typography.fontWeight.medium,
                    marginTop: '2px'
                  }}
                >
                  {sprint.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {sprint.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              {status && (
                <span 
                  className="rounded flex-shrink-0"
                  style={{ 
                    fontSize: '9px',
                    fontWeight: designTokens.typography.fontWeight.bold,
                    padding: '2px 6px',
                    backgroundColor: `${status.color}15`,
                    color: status.color,
                    border: `1px solid ${status.color}30`,
                    letterSpacing: designTokens.typography.letterSpacing.wide  // 1.3.2: Label tracking
                  }}
                >
                  {status.label.toUpperCase()}
                </span>
              )}
            </div>

            {/* Capacity visualization */}
            {capacity && (
              <div className="space-y-1">
                {/* Progress bar with dots */}
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden relative">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
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

                {/* Story points / days summary */}
                <div className="text-[10px]" style={{ color: designTokens.colors.neutral[600], fontWeight: designTokens.typography.fontWeight.medium }}>
                  <span className="font-semibold">{Math.round(capacity.plannedDays * 10) / 10}d planned</span>
                  <span style={{ color: designTokens.colors.neutral[400] }}> · </span>
                  <span>{capacity.totalTeamDays}d capacity</span>
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
                        <span>{Math.round(capacity.plannedDays * 10) / 10} days</span>
                      </div>
                      {capacity.overCapacity && (
                        <div className="mt-2 pt-2 border-t border-red-200 text-red-600 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Over by {Math.round((capacity.plannedDays - capacity.totalTeamDays) * 10) / 10} days
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

// SPRINT SUMMARY STRIP: Always-visible sprint capacity overview
function SprintSummaryStrip({
  sprints,
  sprintCapacities,
  allTickets,
  onCollapse
}: {
  sprints: any[];
  sprintCapacities: Map<string, SprintCapacity>;
  allTickets: any[];
  onCollapse: () => void;
}) {
  const totalPlannedDays = sprintCapacities ? Array.from(sprintCapacities.values()).reduce((sum, c) => sum + (c.plannedDays ?? 0), 0) : 0;
  const totalTeamDays = sprintCapacities ? Array.from(sprintCapacities.values()).reduce((sum, c) => sum + (c.totalTeamDays ?? 0), 0) : 0;
  const totalPlannedStoryPoints = sprintCapacities ? Array.from(sprintCapacities.values()).reduce((sum, c) => sum + (c.plannedStoryPoints ?? 0), 0) : 0;
  const overallUtil = totalTeamDays > 0 ? Math.round((totalPlannedDays / totalTeamDays) * 100) : 0;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2.5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Sprint Overview</span>
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span>{sprints.length} sprint{sprints.length > 1 ? 's' : ''}</span>
            <span className="text-gray-300">|</span>
            <span>{totalPlannedStoryPoints} SP · {Math.round(totalPlannedDays * 10) / 10}d / {totalTeamDays}d</span>
            <span className="text-gray-300">|</span>
            <span 
              className="font-semibold"
              style={{ color: getCapacityStatusColor(overallUtil) }}
            >
              {overallUtil}% utilized
            </span>
          </div>
        </div>
        <button
          onClick={onCollapse}
          className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600"
          title="Collapse sprint summary"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sprint cards row */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sprints.map(sprint => {
          const capacity = sprintCapacities?.get(sprint.id);
          if (!capacity) return null;

          const util = capacity?.utilizationPercent ?? 0;
          const statusColor = getCapacityStatusColor(util);
          const ticketsInSprint = allTickets.filter(t => {
            const ticketStart = t.startDate.getTime();
            return ticketStart >= sprint.startDate.getTime() && ticketStart <= sprint.endDate.getTime();
          });

          return (
            <div 
              key={sprint.id} 
              className="flex-shrink-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 min-w-[180px] hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-800 truncate">{sprint.name}</span>
                <span 
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ 
                    backgroundColor: `${statusColor}15`,
                    color: statusColor,
                    border: `1px solid ${statusColor}30`
                  }}
                >
                  {Math.round(util)}%
                </span>
              </div>
              
              {/* Mini progress bar */}
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1.5">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(util, 100)}%`,
                    backgroundColor: statusColor
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <span>
                  <span className="font-semibold text-gray-700">{Math.round((capacity?.plannedDays ?? 0) * 10) / 10}d</span> / {capacity?.totalTeamDays ?? 0}d capacity
                </span>
                <span>{ticketsInSprint.length} ticket{ticketsInSprint.length !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                <span>{sprint.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>-</span>
                <span>{sprint.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                {capacity?.overCapacity && (
                  <span className="ml-auto text-red-500 font-medium flex items-center gap-0.5">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    Over by {Math.round((capacity.plannedDays - capacity.totalTeamDays) * 10) / 10}d
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
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
  onAddSprint,
  onViewConflictDetails
}: {
  showHolidays: boolean;
  showPTO: boolean;
  onToggleHolidays: (value: boolean) => void;
  onTogglePTO: (value: boolean) => void;
  conflictSummary: ConflictSummary;
  showConflictSummary: boolean;
  onToggleConflictSummary: (value: boolean) => void;
  onAddSprint: () => void;
  onViewConflictDetails?: () => void;
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Control Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between w-full gap-4">
          {/* LEFT SIDE - Toggles & Conflict Badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900 transition-colors text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showHolidays}
                onChange={(e) => onToggleHolidays(e.target.checked)}
                className="w-3 h-3"
              />
              <span className="text-xs font-medium">
                Holidays
              </span>
            </label>
            
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900 transition-colors text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showPTO}
                onChange={(e) => onTogglePTO(e.target.checked)}
                className="w-3 h-3"
              />
              <span className="text-xs font-medium">
                PTO
              </span>
            </label>

            {/* Conflict Summary Badge */}
            {conflictSummary.totalConflicts > 0 && (
              <div className="relative max-w-fit">
                <button
                  onClick={() => onToggleConflictSummary(!showConflictSummary)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-all hover:shadow-sm text-xs whitespace-nowrap"
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
                      <div style={{ fontSize: designTokens.typography.fontSize.xs, fontWeight: designTokens.typography.fontWeight.medium, color: designTokens.colors.neutral[800], marginBottom: '8px' }}>
                        Scheduling Conflicts
                      </div>
                      <ul className="space-y-1 mb-2">
                        {conflictSummary.affectedDevelopers.map(dev => (
                          <li key={dev} className="flex items-center justify-between" style={{ fontSize: designTokens.typography.fontSize.xs }}>
                            <span style={{ color: designTokens.colors.neutral[700], fontWeight: designTokens.typography.fontWeight.medium }}>{dev}</span>
                            <span style={{ color: '#d97706', fontWeight: designTokens.typography.fontWeight.medium }}>
                              {conflictSummary.conflictsByDeveloper[dev]} conflict{conflictSummary.conflictsByDeveloper[dev] > 1 ? 's' : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {onViewConflictDetails && (
                        <button
                          onClick={() => {
                            onViewConflictDetails();
                            onToggleConflictSummary(false);
                          }}
                          className="w-full px-2 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded transition-colors"
                        >
                          View Conflict Details →
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* RIGHT SIDE - Add Sprint Button */}
          <div className="flex items-center shrink-0">
            <button
              onClick={onAddSprint}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] shrink-0 whitespace-nowrap"
              style={{
                backgroundColor: '#64748b',
                color: 'white',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#475569';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#64748b';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Sprint
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Name Header */}
      <div 
        className="px-4 py-3 border-b border-gray-200 font-semibold"
        style={{
          fontSize: designTokens.typography.fontSize.xs,
          fontWeight: designTokens.typography.fontWeight.semibold,
          color: designTokens.colors.neutral[700],  // 1.3.2: Better contrast
          letterSpacing: designTokens.typography.letterSpacing.wide  // 1.3.2: Uppercase tracking
        }}
      >
        TICKET DETAILS
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
            className="font-medium"
            delay={500}
          />
        </div>
        <div 
          className="flex items-center gap-3"
          style={{
            fontSize: designTokens.typography.fontSize.xs,
            fontWeight: 400,
            color: '#6b7280'
          }}
        >
          <span className="truncate">{ticket.assignedTo}</span>
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
  featureName,
  rowHeight,
  dayWidth,
  getPositionFromDate,
  getDaysDifference,
  isSelected,
  onSelect,
  onMove,
  onResize,
  onClone,
  showPTO,
  startDate: _startDate,
  hasConflict,
  conflicts,
  teamMembers,
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
  hasConflict: boolean;
  conflicts: Map<string, TicketConflict>;
  teamMembers: TeamMember[];
  isLastInFeature?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  const assignedMember = teamMembers.find(m => m.name === ticket.assignedTo);
  const ptoEntries = assignedMember?.pto || [];

  const ticketLeft = getPositionFromDate(ticket.startDate);
  
  // Calculate adjusted duration based on effort and velocity
  const adjustedDuration = getAdjustedDuration(ticket, assignedMember);
  const ticketWidth = adjustedDuration * dayWidth;

  // Calculate PTO impact for display
  const calculatePTOImpact = () => {
    let ptoDaysInTicket = 0;
    ptoEntries.forEach(pto => {
      if (pto.endDate < ticket.startDate || pto.startDate > ticket.endDate) return;
      const overlapStart = pto.startDate < ticket.startDate ? ticket.startDate : pto.startDate;
      const overlapEnd = pto.endDate > ticket.endDate ? ticket.endDate : pto.endDate;
      ptoDaysInTicket += Math.max(1, getDaysDifference(overlapStart, overlapEnd) + 1);
    });
    return ptoDaysInTicket;
  };
  
  const ptoDays = showPTO ? calculatePTOImpact() : 0;

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

      {/* LAYER 5: TICKET BAR (Enhanced with 1.2 interactions) */}
      <div
        ref={ticketRef}
        className="absolute group relative transition-all duration-200 shadow-sm hover:shadow-md"
        style={{
          left: ticketLeft,
          width: ticketWidth,
          minWidth: 80,
          top: 8,
          height: 32,
          // Status-based background colors with conflict override
          backgroundColor: hasConflict 
            ? getConflictColors('warning').bg 
            : getTicketColors(ticket.status).bg,
          // Left border accent (4px status indicator)
          borderLeft: hasConflict
            ? `4px solid ${getConflictColors('warning').border}`
            : `4px solid ${getTicketColors(ticket.status).accent}`,
          // Right, top, bottom borders
          borderRight: hasConflict
            ? `1px solid ${getConflictColors('warning').border}`
            : isSelected 
              ? `2px solid ${getTicketColors(ticket.status).border}`
              : `1px solid rgba(0, 0, 0, 0.08)`,
          borderTop: hasConflict
            ? `1px solid ${getConflictColors('warning').border}`
            : isSelected 
              ? `2px solid ${getTicketColors(ticket.status).border}`
              : `1px solid rgba(0, 0, 0, 0.08)`,
          borderBottom: hasConflict
            ? `1px solid ${getConflictColors('warning').border}`
            : isSelected 
              ? `2px solid ${getTicketColors(ticket.status).border}`
              : `1px solid rgba(0, 0, 0, 0.08)`,
          borderRadius: designTokens.borderRadius.md,
          zIndex: isSelected ? 2 : 1,
          opacity: isDragging ? 0.7 : 1,
          // Enhanced shadow with glow for selection (overrides base shadow-sm)
          boxShadow: hasConflict 
            ? `0 1px 3px rgba(251, 192, 45, 0.3), 0 0 0 3px rgba(251, 192, 45, 0.1)`
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={handleMouseDown}
      >
        {/* 1.2.4: Drag handle affordance (visible on hover) */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{
            cursor: 'grab',
            backgroundColor: hasConflict 
              ? 'rgba(251, 192, 45, 0.1)'
              : `${getTicketColors(ticket.status).accent}15`,
          }}
        >
          <GripVertical 
            className="w-3 h-3" 
            style={{ 
              color: hasConflict 
                ? getConflictColors('warning').border
                : getTicketColors(ticket.status).accent,
              opacity: 0.6
            }} 
          />
        </div>
        
        <div className="flex flex-col justify-center h-full px-2 overflow-hidden">
          
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

            {/* Effort */}
            <span className="text-gray-500">
              · {ticket.effortDays ?? ticket.storyPoints ?? 1}d
            </span>

            {/* Experience + Velocity */}
            {assignedMember && assignedMember.experienceLevel && (
              <span className="inline-flex items-center px-1.5 py-[1px] rounded bg-gray-100 text-gray-700 text-[9px] font-medium">
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

        {/* Inline Tooltip */}
        {isHovered && (
          <div
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-white border border-gray-200 rounded-md shadow-xl p-3 text-sm z-[100]"
          >
            <div className="font-semibold text-sm mb-1">
              {ticket.title}
            </div>

            {assignedMember && (
              <div className="text-xs text-gray-600 mb-2">
                {assignedMember.name}
                {assignedMember.experienceLevel
                  ? ` (${assignedMember.experienceLevel} · ${assignedMember.velocityMultiplier ?? 1}x)`
                  : ''}
              </div>
            )}

            <div className="text-xs mb-1">
              Effort: {ticket.effortDays ?? ticket.storyPoints ?? 1}d
            </div>

            <div className="text-xs mb-1">
              Duration: {calculateWorkingDays(ticket.startDate, ticket.endDate)} working days
            </div>

            <div className="text-xs text-gray-500">
              {ticket.startDate.toLocaleDateString()} – {ticket.endDate.toLocaleDateString()}
            </div>

            {hasConflict && (
              <div className="text-xs text-amber-600 mt-2">
                ⚠ Overallocated in sprint
              </div>
            )}
          </div>
        )}
      </div>
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
