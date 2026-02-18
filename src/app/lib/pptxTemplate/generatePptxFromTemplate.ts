import PptxGenJS from 'pptxgenjs';
import designTokens from '../designTokens';
import type {
  PptxRoadmapTemplateData,
  PptxLane,
  PptxLaneItem,
  PptxSprintSegment,
} from './templateTypes';

type Inches = number;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function parseDate(dateLike: string): Date {
  return new Date(dateLike);
}

function fmtMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function fmtMd(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
}

function daysBetweenInclusive(start: Date, end: Date): number {
  const a = new Date(start);
  const b = new Date(end);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function xForDate(date: Date, start: Date, totalDays: number, x0: number, w: number) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const daysFromStart = Math.floor((d.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  const ratio = clamp(daysFromStart / Math.max(1, totalDays - 1), 0, 1);
  return x0 + ratio * w;
}

function statusFill(template: PptxRoadmapTemplateData, status: string): string {
  const found = template.statusKey.find((k) => k.label === status);
  return found?.fill || designTokens.colors.neutral[700];
}

function laneRowHeight(laneCount: number): Inches {
  // Keep readable; degrade gracefully for many lanes.
  if (laneCount <= 8) return 0.55;
  if (laneCount <= 12) return 0.46;
  return 0.38;
}

export function generateRoadmapPptx(template: PptxRoadmapTemplateData) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';

  const slide = pptx.addSlide();

  // Slide size (wide) ~ 13.333 x 7.5
  const SLIDE_W: Inches = 13.33;
  const SLIDE_H: Inches = 7.5;

  const M: Inches = 0.35;
  const LEFT_W: Inches = 2.55;
  const RIGHT_W: Inches = 2.55;

  const headerH: Inches = 0.6;
  const monthRowH: Inches = 0.35;
  const sprintRowH: Inches = 0.55;
  const legendH: Inches = 0.35;

  const gridX: Inches = M + LEFT_W;
  const gridW: Inches = SLIDE_W - gridX - RIGHT_W - M;
  const gridY: Inches = M + headerH + 0.15 + monthRowH + sprintRowH;

  const rangeStart = parseDate(template.timeline.range.start);
  const rangeEnd = parseDate(template.timeline.range.end);
  const totalDays = daysBetweenInclusive(rangeStart, rangeEnd);

  const lanes: PptxLane[] = template.timeline.lanes;
  const rowH = laneRowHeight(lanes.length);
  const gridH: Inches = clamp(lanes.length * rowH, 2.6, SLIDE_H - gridY - M);

  // Background
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { color: 'FFFFFF' },
    line: { color: 'FFFFFF' },
  });

  // Title
  slide.addText(template.title, {
    x: M,
    y: M,
    w: SLIDE_W - 2 * M,
    h: headerH,
    fontFace: 'Calibri',
    fontSize: 22,
    bold: true,
    color: '0B1220',
    valign: 'middle',
  });

  // Badge (DRAFT)
  if (template.badgeText) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: M + 3.2,
      y: M + 0.14,
      w: 1.1,
      h: 0.32,
      fill: { color: '1D4ED8' },
      line: { color: '1D4ED8' },
    });
    slide.addText(template.badgeText, {
      x: M + 3.2,
      y: M + 0.14,
      w: 1.1,
      h: 0.32,
      fontFace: 'Calibri',
      fontSize: 11,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
    });
  }

  // Legend (top right)
  const legendX: Inches = SLIDE_W - M - RIGHT_W;
  const legendY: Inches = M + 0.1;
  slide.addText('Status Key:', {
    x: legendX,
    y: legendY,
    w: RIGHT_W,
    h: legendH,
    fontFace: 'Calibri',
    fontSize: 10,
    bold: true,
    color: designTokens.colors.neutral[700].replace('#', ''),
  });

  const legendItemW: Inches = 0.85;
  const legendItemH: Inches = 0.22;
  let lx = legendX + 0.9;
  const ly = legendY + 0.06;
  for (const key of template.statusKey) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: lx,
      y: ly,
      w: legendItemW,
      h: legendItemH,
      fill: { color: key.fill.replace('#', '') },
      line: { color: key.fill.replace('#', '') },
    });
    slide.addText(key.label, {
      x: lx,
      y: ly,
      w: legendItemW,
      h: legendItemH,
      fontFace: 'Calibri',
      fontSize: 8.5,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
    });
    lx += legendItemW + 0.12;
  }

  // Month row
  const months = template.timeline.months || [];
  const monthY: Inches = M + headerH + 0.15;
  slide.addShape(pptx.ShapeType.rect, {
    x: gridX,
    y: monthY,
    w: gridW,
    h: monthRowH,
    fill: { color: 'F3F4F6' },
    line: { color: 'D1D5DB' },
  });

  if (months.length > 0) {
    for (const m of months) {
      const ms = parseDate(m.start);
      const me = parseDate(m.end);
      const x1 = xForDate(ms, rangeStart, totalDays, gridX, gridW);
      const x2 = xForDate(me, rangeStart, totalDays, gridX, gridW);
      const w = Math.max(0.05, x2 - x1);
      slide.addShape(pptx.ShapeType.rect, {
        x: x1,
        y: monthY,
        w,
        h: monthRowH,
        fill: { color: 'E5E7EB' },
        line: { color: 'D1D5DB' },
      });
      slide.addText(m.label, {
        x: x1,
        y: monthY,
        w,
        h: monthRowH,
        fontFace: 'Calibri',
        fontSize: 10,
        bold: true,
        color: designTokens.colors.neutral[800].replace('#', ''),
        align: 'center',
        valign: 'middle',
      });
    }

    // Month-year label centered
    const mid = new Date((rangeStart.getTime() + rangeEnd.getTime()) / 2);
    slide.addText(fmtMonthYear(mid), {
      x: gridX,
      y: monthY - 0.2,
      w: gridW,
      h: 0.2,
      fontFace: 'Calibri',
      fontSize: 9,
      color: designTokens.colors.neutral[600].replace('#', ''),
      align: 'center',
    });
  }

  // Sprint row
  const sprintY: Inches = monthY + monthRowH;
  slide.addShape(pptx.ShapeType.rect, {
    x: gridX,
    y: sprintY,
    w: gridW,
    h: sprintRowH,
    fill: { color: 'FFFFFF' },
    line: { color: 'D1D5DB' },
  });

  const sprints: PptxSprintSegment[] = template.timeline.sprints || [];
  for (const s of sprints) {
    const ss = parseDate(s.range.start);
    const se = parseDate(s.range.end);
    const x1 = xForDate(ss, rangeStart, totalDays, gridX, gridW);
    const x2 = xForDate(se, rangeStart, totalDays, gridX, gridW);
    const w = Math.max(0.08, x2 - x1);
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x1 + 0.03,
      y: sprintY + 0.1,
      w: w - 0.06,
      h: sprintRowH - 0.2,
      fill: { color: designTokens.colors.sprint.primary.replace('#', '') },
      line: { color: designTokens.colors.sprint.primary.replace('#', '') },
    });
    slide.addText(`${s.name}\n${fmtMd(ss)} - ${fmtMd(se)}`, {
      x: x1,
      y: sprintY + 0.08,
      w,
      h: sprintRowH - 0.16,
      fontFace: 'Calibri',
      fontSize: 7.5,
      bold: true,
      color: '0B1220',
      align: 'center',
      valign: 'middle',
    });
  }

  // Left headers
  slide.addShape(pptx.ShapeType.rect, {
    x: M,
    y: monthY,
    w: LEFT_W,
    h: monthRowH + sprintRowH,
    fill: { color: '6B7280' },
    line: { color: '6B7280' },
  });
  slide.addText('Sprints Dates', {
    x: M,
    y: monthY,
    w: LEFT_W,
    h: monthRowH + sprintRowH,
    fontFace: 'Calibri',
    fontSize: 10,
    bold: true,
    color: 'FFFFFF',
    valign: 'middle',
    margin: 6,
  });

  // Grid outline
  slide.addShape(pptx.ShapeType.rect, {
    x: gridX,
    y: gridY,
    w: gridW,
    h: gridH,
    fill: { color: 'FFFFFF' },
    line: { color: '111827', width: 1 },
  });

  // Lane separators + labels
  for (let i = 0; i < lanes.length; i++) {
    const lane = lanes[i];
    const y = gridY + i * rowH;

    // left label cell
    slide.addShape(pptx.ShapeType.rect, {
      x: M,
      y,
      w: LEFT_W,
      h: rowH,
      fill: { color: 'FFFFFF' },
      line: { color: '1E3A8A', width: 1 },
    });
    slide.addText(lane.name, {
      x: M + 0.1,
      y: y + 0.05,
      w: LEFT_W - 0.2,
      h: rowH - 0.1,
      fontFace: 'Calibri',
      fontSize: 9,
      bold: true,
      color: '1E3A8A',
      valign: 'middle',
    });

    // horizontal separator line across grid
    slide.addShape(pptx.ShapeType.line, {
      x: gridX,
      y: y + rowH,
      w: gridW,
      h: 0,
      line: { color: '1E3A8A', width: 1 },
    });

    // items
    renderLaneItems(slide, template, lane, y, rowH, gridX, gridW, rangeStart, totalDays);
  }

  // Go-live marker
  if (template.timeline.goLive) {
    const goDate = parseDate(template.timeline.goLive.date);
    const x = xForDate(goDate, rangeStart, totalDays, gridX, gridW);
    slide.addShape(pptx.ShapeType.line, {
      x,
      y: monthY,
      w: 0,
      h: gridY + gridH - monthY,
      line: { color: '1D4ED8', width: 2 },
    });

    slide.addText(`${template.timeline.goLive.label} ${fmtMd(goDate)}`, {
      x: x - 0.6,
      y: monthY - 0.15,
      w: 1.2,
      h: 0.2,
      fontFace: 'Calibri',
      fontSize: 8.5,
      bold: true,
      color: '0B1220',
      align: 'center',
    });

    slide.addText('★', {
      x: x - 0.08,
      y: monthY - 0.33,
      w: 0.16,
      h: 0.2,
      fontFace: 'Calibri',
      fontSize: 14,
      color: 'F59E0B',
      align: 'center',
    });
  }

  // Key Dates panel
  const panelX = SLIDE_W - M - RIGHT_W;
  const panelY = monthY + 0.2;
  const panelH = 3.2;
  slide.addShape(pptx.ShapeType.roundRect, {
    x: panelX,
    y: panelY,
    w: RIGHT_W,
    h: panelH,
    fill: { color: 'FFFFFF' },
    line: { color: '9CA3AF', width: 1 },
  });
  slide.addText('Key Dates', {
    x: panelX + 0.15,
    y: panelY + 0.12,
    w: RIGHT_W - 0.3,
    h: 0.3,
    fontFace: 'Calibri',
    fontSize: 12,
    bold: true,
    color: '111827',
  });

  const keyDates = template.keyDates || [];
  let ky = panelY + 0.55;
  for (const kd of keyDates.slice(0, 8)) {
    const d = parseDate(kd.date);
    slide.addText(`• ${kd.label} - ${fmtMd(d)}`, {
      x: panelX + 0.2,
      y: ky,
      w: RIGHT_W - 0.4,
      h: 0.22,
      fontFace: 'Calibri',
      fontSize: 9.5,
      color: '111827',
    });
    ky += 0.24;
  }

  if (template.footerNote) {
    slide.addText(template.footerNote, {
      x: M,
      y: SLIDE_H - M - 0.2,
      w: SLIDE_W - 2 * M,
      h: 0.2,
      fontFace: 'Calibri',
      fontSize: 8,
      color: designTokens.colors.neutral[600].replace('#', ''),
    });
  }

  return pptx;
}

function renderLaneItems(
  slide: any,
  template: PptxRoadmapTemplateData,
  lane: PptxLane,
  y: Inches,
  rowH: Inches,
  gridX: Inches,
  gridW: Inches,
  rangeStart: Date,
  totalDays: number,
) {
  // Render up to 3 items per lane (avoid overcrowding). If you want more later, stack rows.
  const items = lane.items.slice(0, 3);
  const innerY = y + 0.08;
  const barH = Math.max(0.22, rowH - 0.16);

  for (let i = 0; i < items.length; i++) {
    const item: PptxLaneItem = items[i];
    const s = parseDate(item.range.start);
    const e = parseDate(item.range.end);
    const x1 = xForDate(s, rangeStart, totalDays, gridX, gridW);
    const x2 = xForDate(e, rangeStart, totalDays, gridX, gridW);
    const w = Math.max(0.15, x2 - x1);

    const fill = statusFill(template, item.status).replace('#', '');

    slide.addShape('roundRect', {
      x: x1,
      y: innerY,
      w,
      h: barH,
      fill: { color: fill },
      line: { color: fill },
    });

    const text = item.title.length > 32 ? `${item.title.slice(0, 31)}…` : item.title;
    slide.addText(text, {
      x: x1 + 0.06,
      y: innerY + 0.03,
      w: w - 0.12,
      h: barH - 0.06,
      fontFace: 'Calibri',
      fontSize: 8.5,
      bold: true,
      color: 'FFFFFF',
      valign: 'middle',
    });
  }
}
