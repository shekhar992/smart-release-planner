import { useDrag } from 'react-dnd';
import { Ticket, TeamMember } from '../lib/types';
import { calculateEndDate, storyPointsToDuration } from '../lib/dateUtils';
import { differenceInDays, startOfDay } from 'date-fns';

interface TicketBarProps {
  ticket: Ticket;
  storyPointToDays: number;
  timelineStartDate: Date;
  dayWidth: number;
  developer?: TeamMember;
  isSelected: boolean;
  onSelect: () => void;
  onDrop: (ticketId: string, newStartDate: Date) => void;
}

const ITEM_TYPE = 'TICKET';

export function TicketBar({
  ticket,
  storyPointToDays,
  timelineStartDate,
  dayWidth,
  developer,
  isSelected,
  onSelect,
  onDrop,
}: TicketBarProps) {
  const duration = storyPointsToDuration(ticket.storyPoints, storyPointToDays);
  const endDate = calculateEndDate(ticket.startDate, duration);

  // Calculate position
  const daysFromStart = differenceInDays(startOfDay(ticket.startDate), startOfDay(timelineStartDate));
  const durationInDays = differenceInDays(endDate, ticket.startDate);
  const left = daysFromStart * dayWidth;
  const width = Math.max(durationInDays * dayWidth, 60); // Minimum width

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { ticketId: ticket.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`absolute h-8 rounded cursor-move flex items-center px-2 text-xs font-medium transition-all duration-150 border ${
        isSelected
          ? 'bg-primary text-primary-foreground border-primary shadow-md'
          : 'bg-[var(--ticket-default)] text-foreground border-border hover:bg-[var(--ticket-hover)] hover:border-primary/40 hover:shadow-sm'
      } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      style={{ 
        left: `${left}px`, 
        width: `${width}px`,
        boxShadow: isSelected ? '0 2px 8px var(--ticket-shadow)' : '0 1px 3px var(--ticket-shadow)'
      }}
      onClick={onSelect}
    >
      <span className="truncate flex-1">{ticket.name}</span>
      {developer && (
        <span className="ml-2 text-xs opacity-75 flex-shrink-0">
          {developer.name.split(' ')[0]}
        </span>
      )}
    </div>
  );
}