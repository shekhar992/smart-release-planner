import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { Release, Ticket, mockHolidays, mockTeamMembers } from '../data/mockData';
import { SprintCreationPopover } from './SprintCreationPopover';

interface TimelinePanelProps {
  release: Release;
  onMoveTicket: (featureId: string, ticketId: string, newStartDate: Date) => void;
  onResizeTicket: (featureId: string, ticketId: string, newEndDate: Date) => void;
  onSelectTicket: (featureId: string, ticketId: string) => void;
  onCreateSprint: (name: string, startDate: Date, endDate: Date) => void;
}

const DAY_WIDTH = 40;
const ROW_HEIGHT = 48;
const HEADER_HEIGHT = 80;

export function TimelinePanel({ release, onMoveTicket, onResizeTicket, onSelectTicket, onCreateSprint }: TimelinePanelProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showSprintCreation, setShowSprintCreation] = useState(false);
  const [showHolidays, setShowHolidays] = useState(true);
  const [showPTO, setShowPTO] = useState(true);

  const startDate = new Date(release.startDate);
  const endDate = new Date(release.endDate);

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

  // Count total rows needed
  const totalRows = release.features.reduce((sum, f) => sum + f.tickets.length, 0);

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="relative" style={{ width: timelineWidth, minHeight: '100%' }}>
        
        {/* LAYER 1: TIME GRID */}
        <TimeGrid 
          totalDays={totalDays} 
          dayWidth={DAY_WIDTH} 
          totalRows={totalRows}
          rowHeight={ROW_HEIGHT}
        />

        {/* LAYER 2: SPRINT BANDS */}
        <SprintBands
          sprints={release.sprints}
          getPositionFromDate={getPositionFromDate}
          getDaysDifference={getDaysDifference}
          dayWidth={DAY_WIDTH}
          headerHeight={HEADER_HEIGHT}
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
            headerHeight={HEADER_HEIGHT}
          />
        )}

        {/* HEADER */}
        <TimelineHeader
          startDate={startDate}
          totalDays={totalDays}
          dayWidth={DAY_WIDTH}
          sprints={release.sprints}
          getPositionFromDate={getPositionFromDate}
          getDaysDifference={getDaysDifference}
          showHolidays={showHolidays}
          showPTO={showPTO}
          onToggleHolidays={setShowHolidays}
          onTogglePTO={setShowPTO}
          onAddSprint={() => setShowSprintCreation(true)}
        />

        {/* LAYER 4 + 5: TICKETS WITH PTO */}
        <div className="pt-20">
          {release.features.map((feature) => (
            <div key={feature.id}>
              {feature.tickets.map((ticket) => (
                <TicketRow
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
                />
              ))}
            </div>
          ))}
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
  totalRows, 
  rowHeight 
}: { 
  totalDays: number; 
  dayWidth: number; 
  totalRows: number;
  rowHeight: number;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {/* Vertical day lines */}
      {Array.from({ length: totalDays + 1 }).map((_, i) => {
        const isWeekBoundary = i % 7 === 0;
        return (
          <div
            key={`vline-${i}`}
            className="absolute top-0 bottom-0"
            style={{
              left: i * dayWidth,
              width: '1px',
              backgroundColor: isWeekBoundary ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            }}
          />
        );
      })}
      
      {/* Horizontal row lines */}
      {Array.from({ length: totalRows + 1 }).map((_, i) => (
        <div
          key={`hline-${i}`}
          className="absolute left-0 right-0"
          style={{
            top: 80 + (i * rowHeight),
            height: '1px',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          }}
        />
      ))}
    </div>
  );
}

// LAYER 2: SPRINT BANDS
function SprintBands({
  sprints,
  getPositionFromDate,
  getDaysDifference,
  dayWidth,
  headerHeight
}: {
  sprints: any[];
  getPositionFromDate: (date: Date) => number;
  getDaysDifference: (date1: Date, date2: Date) => number;
  dayWidth: number;
  headerHeight: number;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2, top: headerHeight }}>
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
  dayWidth,
  headerHeight
}: {
  holidays: any[];
  startDate: Date;
  endDate: Date;
  getPositionFromDate: (date: Date) => number;
  getDaysDifference: (date1: Date, date2: Date) => number;
  dayWidth: number;
  headerHeight: number;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3, top: headerHeight }}>
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
  showHolidays,
  showPTO,
  onToggleHolidays,
  onTogglePTO,
  onAddSprint
}: {
  startDate: Date;
  totalDays: number;
  dayWidth: number;
  sprints: any[];
  getPositionFromDate: (date: Date) => number;
  getDaysDifference: (date1: Date, date2: Date) => number;
  showHolidays: boolean;
  showPTO: boolean;
  onToggleHolidays: (value: boolean) => void;
  onTogglePTO: (value: boolean) => void;
  onAddSprint: () => void;
}) {
  return (
    <div 
      className="sticky top-0 bg-white border-b"
      style={{ 
        zIndex: 10,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Controls */}
      <div className="absolute right-4 top-2 z-20">
        <button
          onClick={onAddSprint}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-all"
          style={{
            backgroundColor: '#64748b',
            color: 'white',
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Sprint
        </button>
      </div>

      <div className="absolute left-4 top-2 z-20 flex items-center gap-3 text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showHolidays}
            onChange={(e) => onToggleHolidays(e.target.checked)}
            className="w-3 h-3"
          />
          <span>Holidays</span>
        </label>
        
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showPTO}
            onChange={(e) => onTogglePTO(e.target.checked)}
            className="w-3 h-3"
          />
          <span>PTO</span>
        </label>
      </div>

      {/* Date labels */}
      <div className="flex h-12 items-end border-b" style={{ borderBottomColor: 'rgba(0, 0, 0, 0.1)' }}>
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

      {/* Sprint labels */}
      <div className="flex h-8 relative" style={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
        {sprints.map((sprint) => {
          const left = getPositionFromDate(sprint.startDate);
          const width = getDaysDifference(sprint.startDate, sprint.endDate) * dayWidth;
          
          return (
            <div
              key={sprint.id}
              className="absolute flex items-center justify-center text-xs font-medium"
              style={{
                left,
                width,
                top: 0,
                height: 32,
                color: 'rgba(0, 0, 0, 0.5)',
                borderLeft: '1px solid rgba(0, 0, 0, 0.1)',
              }}
            >
              {sprint.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// LAYER 4 + 5: TICKET ROW WITH PTO
function TicketRow({
  ticket,
  featureId,
  rowHeight,
  dayWidth,
  getPositionFromDate,
  getDaysDifference,
  isSelected,
  onSelect,
  onMove,
  onResize,
  showPTO,
  startDate
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
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  const assignedMember = mockTeamMembers.find(m => m.name === ticket.assignedTo);
  const ptoEntries = assignedMember?.pto || [];

  const ticketLeft = getPositionFromDate(ticket.startDate);
  const ticketWidth = getDaysDifference(ticket.startDate, ticket.endDate) * dayWidth;

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize-left' | 'resize-right') => {
    e.preventDefault();
    onSelect();

    if (action === 'drag') {
      setIsDragging(true);
      const startX = e.clientX;
      const initialLeft = ticketLeft;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const newLeft = Math.max(0, initialLeft + deltaX);
        const daysMoved = Math.round((newLeft - initialLeft) / dayWidth);
        
        if (ticketRef.current) {
          ticketRef.current.style.left = `${initialLeft + (daysMoved * dayWidth)}px`;
        }
      };

      const handleMouseUp = (moveEvent: MouseEvent) => {
        setIsDragging(false);
        const deltaX = moveEvent.clientX - startX;
        const daysMoved = Math.round(deltaX / dayWidth);
        
        if (daysMoved !== 0) {
          const newStartDate = new Date(ticket.startDate);
          newStartDate.setDate(newStartDate.getDate() + daysMoved);
          onMove(newStartDate);
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
    <div className="relative" style={{ height: rowHeight }}>
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
        className="absolute group cursor-grab"
        style={{
          left: ticketLeft,
          width: ticketWidth,
          minWidth: 80,
          top: 8,
          height: 32,
          backgroundColor: '#f5f5f4',
          border: isSelected ? '2px solid #64748b' : '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '4px',
          zIndex: 5,
          opacity: isDragging || isResizing ? 0.7 : 1,
          boxShadow: isSelected ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
        }}
        onMouseDown={(e) => {
          if (!(e.target as HTMLElement).classList.contains('resize-handle')) {
            handleMouseDown(e, 'drag');
          }
        }}
        onClick={onSelect}
      >
        <div className="flex items-center gap-2 px-2 h-full">
          <div 
            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              color: 'rgba(0, 0, 0, 0.6)',
            }}
          >
            {ticket.storyPoints}
          </div>
          <span className="truncate text-xs" style={{ color: 'rgba(0, 0, 0, 0.7)' }}>
            {ticket.title}
          </span>
        </div>

        {/* Right resize handle */}
        <div
          className="resize-handle absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
          onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
        />
      </div>
    </div>
  );
}
