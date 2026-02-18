export type PptxStatusKey = {
  label: string;
  /** Hex without alpha, e.g. "#1D4ED8" */
  fill: string;
};

export type PptxDateLike = string; // ISO 8601 date or datetime

export type PptxTimeRange = {
  start: PptxDateLike;
  end: PptxDateLike;
};

export type PptxSprintSegment = {
  id: string;
  name: string;
  range: PptxTimeRange;
};

export type PptxLaneItem = {
  id: string;
  title: string;
  range: PptxTimeRange;
  /** One of the status keys in template.statusKey */
  status: string;
  /** Optional smaller text shown inside/under title when space allows */
  meta?: string;
};

export type PptxLane = {
  id: string;
  name: string;
  items: PptxLaneItem[];
};

export type PptxKeyDate = {
  label: string;
  date: PptxDateLike;
};

export type PptxGoLive = {
  label: string;
  date: PptxDateLike;
};

export type PptxRoadmapTemplateData = {
  templateVersion: 'release-planner-roadmap-v1';
  title: string;
  badgeText?: string;

  timeline: {
    range: PptxTimeRange;
    /** Month labels are derived if not provided */
    months?: { label: string; start: PptxDateLike; end: PptxDateLike }[];
    sprints?: PptxSprintSegment[];
    lanes: PptxLane[];
    goLive?: PptxGoLive;
  };

  /** Legend shown on top right */
  statusKey: PptxStatusKey[];

  /** Right-side box */
  keyDates?: PptxKeyDate[];

  /** Optional footer note */
  footerNote?: string;
};

export function assertHexColor(color: string): void {
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    throw new Error(`Invalid hex color: ${color}`);
  }
}
