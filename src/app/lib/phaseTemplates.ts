import { nanoid } from 'nanoid';
import type { Phase, PhaseType } from '../data/mockData';

export interface PhaseTemplate {
  id: string;
  name: string;
  description: string;
  phases: Array<{
    name: string;
    type: PhaseType;
    durationDays: number; // 0 = fill remaining space
    allowsWork: boolean;
  }>;
}

export const PHASE_TEMPLATES: PhaseTemplate[] = [
  {
    id: 'standard-sdlc',
    name: 'Standard SDLC',
    description: 'Traditional waterfall: Development → SIT → UAT → Go-Live',
    phases: [
      { name: 'Dev Window', type: 'DevWindow', durationDays: 0, allowsWork: true },
      { name: 'SIT', type: 'Testing', durationDays: 14, allowsWork: false },
      { name: 'UAT', type: 'Testing', durationDays: 14, allowsWork: false },
      { name: 'Go-Live', type: 'Launch', durationDays: 1, allowsWork: false },
    ],
  },
  {
    id: 'agile',
    name: 'Agile Release',
    description: 'Iterative development with hardening sprint',
    phases: [
      { name: 'Dev Sprints', type: 'DevWindow', durationDays: 0, allowsWork: true },
      { name: 'UAT', type: 'Testing', durationDays: 7, allowsWork: false },
      { name: 'Hardening Sprint', type: 'Deployment', durationDays: 14, allowsWork: false },
      { name: 'Production', type: 'Launch', durationDays: 1, allowsWork: false },
    ],
  },
  {
    id: 'custom',
    name: 'Custom Phases',
    description: 'Define your own phase structure',
    phases: [],
  },
];

/**
 * Calculate phase dates from template, working backward from release end date
 */
export function calculatePhaseDates(
  template: PhaseTemplate,
  releaseStartDate: Date,
  releaseEndDate: Date,
  releaseId: string
): Phase[] {
  const phases: Phase[] = [];
  let currentEndDate = new Date(releaseEndDate);

  // Work backwards from release end date
  const reversedPhases = [...template.phases].reverse();
  
  reversedPhases.forEach((phaseTemplate, index) => {
    const phaseEndDate = new Date(currentEndDate);
    let phaseStartDate: Date;

    if (phaseTemplate.durationDays === 0) {
      // Flexible duration - fill remaining space
      phaseStartDate = new Date(releaseStartDate);
    } else {
      // Fixed duration - calculate from end date
      phaseStartDate = new Date(phaseEndDate);
      phaseStartDate.setDate(phaseStartDate.getDate() - phaseTemplate.durationDays);
      
      // Ensure doesn't go before release start
      if (phaseStartDate < releaseStartDate) {
        phaseStartDate = new Date(releaseStartDate);
      }
    }

    phases.unshift({
      id: nanoid(),
      releaseId,
      name: phaseTemplate.name,
      type: phaseTemplate.type,
      startDate: phaseStartDate,
      endDate: phaseEndDate,
      allowsWork: phaseTemplate.allowsWork,
      order: reversedPhases.length - index,
    });

    // Next phase ends one day before this phase starts
    currentEndDate = new Date(phaseStartDate);
    currentEndDate.setDate(currentEndDate.getDate() - 1);
  });

  return phases;
}

/**
 * Recalculate cascading dates when a phase end date changes
 * All subsequent phases shift to maintain their duration
 */
export function recalculateCascadingDates(
  phases: Phase[],
  changedPhaseIndex: number,
  newEndDate: Date
): Phase[] {
  const updated = [...phases];
  updated[changedPhaseIndex].endDate = newEndDate;

  // Update all subsequent phases
  for (let i = changedPhaseIndex + 1; i < updated.length; i++) {
    const prevPhase = updated[i - 1];
    const currentPhase = updated[i];
    
    // New start date is one day after previous phase ends
    const newStartDate = new Date(prevPhase.endDate);
    newStartDate.setDate(newStartDate.getDate() + 1);
    
    // Calculate original duration
    const originalDuration = Math.ceil(
      (currentPhase.endDate.getTime() - currentPhase.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // New end date maintains original duration
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + originalDuration);
    
    updated[i] = {
      ...currentPhase,
      startDate: newStartDate,
      endDate: newEndDate,
    };
  }

  return updated;
}
