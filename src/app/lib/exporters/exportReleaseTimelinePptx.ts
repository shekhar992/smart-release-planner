import type { Release, Phase, Milestone } from '../../data/mockData';
import { buildRoadmapTemplateDataFromRelease } from '../pptxTemplate/buildTemplateData';
import { generateRoadmapPptx } from '../pptxTemplate/generatePptxFromTemplate';

export type ExportReleaseTimelinePptxOptions = {
  fileName?: string;
  viewMode?: 'detailed' | 'executive';
  milestones?: Milestone[];
  phases?: Phase[];
};

/**
 * Call this from an "Export PPTX" button.
 * Generates a single-slide roadmap-style PPTX matching the target template.
 */
export async function exportReleaseTimelinePptx(release: Release, options: ExportReleaseTimelinePptxOptions = {}) {
  const { fileName, viewMode, milestones, phases } = options;
  
  const template = buildRoadmapTemplateDataFromRelease(release, {
    viewMode,
    milestones,
    phases,
  });
  
  const pptx = generateRoadmapPptx(template);

  const safeName = (fileName || `${release.name} Timeline`).replace(/[^a-zA-Z0-9 _.-]/g, '').trim();
  const finalFileName = safeName.toLowerCase().endsWith('.pptx') ? safeName : `${safeName}.pptx`;

  // PptxGenJS will trigger download in-browser.
  await pptx.writeFile({ fileName: finalFileName });
}
