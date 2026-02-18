import type { Release } from '../data/mockData';
import { buildRoadmapTemplateDataFromRelease } from '../lib/pptxTemplate/buildTemplateData';
import { generateRoadmapPptx } from '../lib/pptxTemplate/generatePptxFromTemplate';

export type ExportReleaseTimelinePptxOptions = {
  fileName?: string;
};

/**
 * Call this from an "Export PPTX" button.
 * Generates a single-slide roadmap-style PPTX matching the target template.
 */
export async function exportReleaseTimelinePptx(release: Release, options: ExportReleaseTimelinePptxOptions = {}) {
  const template = buildRoadmapTemplateDataFromRelease(release);
  const pptx = generateRoadmapPptx(template);

  const safeName = (options.fileName || `${release.name} Timeline`).replace(/[^a-zA-Z0-9 _.-]/g, '').trim();
  const fileName = safeName.toLowerCase().endsWith('.pptx') ? safeName : `${safeName}.pptx`;

  // PptxGenJS will trigger download in-browser.
  await pptx.writeFile({ fileName });
}
