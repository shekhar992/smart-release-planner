import type { Release, Ticket } from '../../data/mockData';
import designTokens from '../designTokens';
import type {
  PptxRoadmapTemplateData,
  PptxLane,
  PptxLaneItem,
  PptxStatusKey,
  PptxKeyDate,
} from './templateTypes';

function toIsoDate(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short' });
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function buildMonths(start: Date, end: Date) {
  const months: { label: string; start: string; end: string }[] = [];
  let cursor = startOfMonth(start);
  const endMonth = startOfMonth(end);

  while (cursor <= endMonth) {
    const monthStart = cursor < start ? start : cursor;
    const monthEnd = endOfMonth(cursor) > end ? end : endOfMonth(cursor);
    months.push({
      label: monthLabel(cursor),
      start: toIsoDate(monthStart),
      end: toIsoDate(monthEnd),
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return months;
}

function buildStatusKey(): PptxStatusKey[] {
  // For PPTX we use the stronger "border" colors as fills to match the screenshot style.
  return [
    { label: 'Complete', fill: designTokens.colors.ticket.completed.border },
    { label: 'In Progress', fill: designTokens.colors.ticket['in-progress'].border },
    { label: 'Not Started', fill: designTokens.colors.ticket.planned.border },
  ];
}

function ticketToStatus(ticket: Ticket): string {
  if (ticket.status === 'completed') return 'Complete';
  if (ticket.status === 'in-progress') return 'In Progress';
  return 'Not Started';
}

function ticketMeta(ticket: Ticket): string {
  const parts: string[] = [];
  if (ticket.assignedTo) parts.push(ticket.assignedTo);
  const effort = ticket.effortDays ?? ticket.storyPoints;
  if (typeof effort === 'number') parts.push(`${effort}d`);
  return parts.join(' · ');
}

export function buildRoadmapTemplateDataFromRelease(release: Release): PptxRoadmapTemplateData {
  const start = new Date(release.startDate);
  const end = new Date(release.endDate);

  const lanes: PptxLane[] = release.features.map((feature) => {
    const items: PptxLaneItem[] = feature.tickets.map((t) => ({
      id: t.id,
      title: t.title,
      range: { start: toIsoDate(t.startDate), end: toIsoDate(t.endDate) },
      status: ticketToStatus(t),
      meta: ticketMeta(t),
    }));

    return {
      id: feature.id,
      name: feature.name,
      items,
    };
  });

  const statusKey = buildStatusKey();

  const keyDates: PptxKeyDate[] = [
    { label: 'Release Start', date: toIsoDate(start) },
    { label: 'Go Live', date: toIsoDate(end) },
  ];

  return {
    templateVersion: 'release-planner-roadmap-v1',
    title: `${release.name} Timeline`,
    badgeText: 'DRAFT',
    timeline: {
      range: { start: toIsoDate(start), end: toIsoDate(end) },
      months: buildMonths(start, end),
      sprints: (release.sprints || []).map((s) => ({
        id: s.id,
        name: s.name,
        range: { start: toIsoDate(s.startDate), end: toIsoDate(s.endDate) },
      })),
      lanes,
      goLive: { label: 'Go-live', date: toIsoDate(end) },
    },
    statusKey,
    keyDates,
  };
}
