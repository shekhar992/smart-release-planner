import type { Release, Ticket, Phase, Milestone } from '../../data/mockData';
import designTokens from '../designTokens';
import type {
  PptxRoadmapTemplateData,
  PptxLane,
  PptxLaneItem,
  PptxStatusKey,
  PptxKeyDate,
  PptxPhase,
  PptxMilestone,
} from './templateTypes';
import type { Feature } from '../../data/mockData';

export interface BuildTemplateOptions {
  viewMode?: 'detailed' | 'executive';
  milestones?: Milestone[];
  phases?: Phase[];
}

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

function buildDetailedLanes(features: Feature[]): PptxLane[] {
  return features.map((feature) => {
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
}

function buildExecutiveLanes(features: Feature[]): PptxLane[] {
  return features.map((feature) => {
    // Aggregate all tickets for this feature
    const tickets = feature.tickets;
    const ticketCount = tickets.length;
    const totalDays = tickets.reduce(
      (sum, ticket) => sum + (ticket.effortDays || ticket.storyPoints || 0),
      0
    );

    if (tickets.length === 0) {
      return {
        id: feature.id,
        name: feature.name,
        items: [],
      };
    }

    const featureStartDate = new Date(
      Math.min(...tickets.map((t) => t.startDate.getTime()))
    );
    const featureEndDate = new Date(
      Math.max(...tickets.map((t) => t.endDate.getTime()))
    );

    const items: PptxLaneItem[] = [
      {
        id: feature.id,
        title: feature.name,
        range: {
          start: toIsoDate(featureStartDate),
          end: toIsoDate(featureEndDate),
        },
        status: 'Complete', // Executive bars use a consistent style
        meta: `${ticketCount} ticket${ticketCount !== 1 ? 's' : ''} · ${totalDays}d`,
      },
    ];

    return {
      id: feature.id,
      name: feature.name,
      items,
    };
  });
}

export function buildRoadmapTemplateDataFromRelease(
  release: Release,
  options?: BuildTemplateOptions
): PptxRoadmapTemplateData {
  const start = new Date(release.startDate);
  const end = new Date(release.endDate);
  const { viewMode = 'detailed', milestones = [], phases = [] } = options || {};

  // Build lanes based on view mode
  const lanes: PptxLane[] =
    viewMode === 'executive'
      ? buildExecutiveLanes(release.features)
      : buildDetailedLanes(release.features);

  const statusKey = buildStatusKey();

  // Map phases to PPTX format
  const pptxPhases: PptxPhase[] = phases.map((phase) => ({
    id: phase.id,
    name: phase.name,
    type: phase.type,
    range: {
      start: toIsoDate(phase.startDate),
      end: toIsoDate(phase.endDate),
    },
    allowsWork: phase.allowsWork,
  }));

  // Map milestones to PPTX format
  const pptxMilestones: PptxMilestone[] = milestones.map((milestone) => ({
    id: milestone.id,
    name: milestone.name,
    type: milestone.type,
    date: toIsoDate(milestone.startDate),
    isBlocking: milestone.isBlocking,
  }));

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
      phases: pptxPhases.length > 0 ? pptxPhases : undefined,
      milestones: pptxMilestones.length > 0 ? pptxMilestones : undefined,
    },
    statusKey,
    keyDates,
  };
}
