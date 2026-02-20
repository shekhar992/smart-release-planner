import { useState } from 'react';
import { nanoid } from 'nanoid';
import type { Phase } from '../data/mockData';
import { savePhases } from '../lib/localStorage';

interface PhaseDebugPanelProps {
  releaseId: string;
  releaseStartDate: Date;
  releaseEndDate: Date;
  onPhasesUpdated: (phases: Phase[]) => void;
}

export function PhaseDebugPanel({ 
  releaseId, 
  releaseStartDate, 
  releaseEndDate,
  onPhasesUpdated 
}: PhaseDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const addStandardSDLCPhases = () => {
    // Calculate phase dates by working backward from release end
    const goLiveDate = new Date(releaseEndDate);
    
    const uatEnd = new Date(goLiveDate);
    uatEnd.setDate(uatEnd.getDate() - 1); // 1 day before go-live
    const uatStart = new Date(uatEnd);
    uatStart.setDate(uatStart.getDate() - 13); // 2 weeks UAT
    
    const sitEnd = new Date(uatStart);
    sitEnd.setDate(sitEnd.getDate() - 1);
    const sitStart = new Date(sitEnd);
    sitStart.setDate(sitStart.getDate() - 13); // 2 weeks SIT
    
    const devEnd = new Date(sitStart);
    devEnd.setDate(devEnd.getDate() - 1);
    const devStart = new Date(releaseStartDate);
    
    const testPhases: Phase[] = [
      {
        id: nanoid(),
        releaseId,
        name: 'Dev Window',
        type: 'DevWindow',
        startDate: devStart,
        endDate: devEnd,
        allowsWork: true,
        order: 1,
      },
      {
        id: nanoid(),
        releaseId,
        name: 'SIT',
        type: 'Testing',
        startDate: sitStart,
        endDate: sitEnd,
        allowsWork: false,
        order: 2,
      },
      {
        id: nanoid(),
        releaseId,
        name: 'UAT',
        type: 'Testing',
        startDate: uatStart,
        endDate: uatEnd,
        allowsWork: false,
        order: 3,
      },
      {
        id: nanoid(),
        releaseId,
        name: 'Go-Live',
        type: 'Launch',
        startDate: goLiveDate,
        endDate: goLiveDate,
        allowsWork: false,
        order: 4,
      },
    ];

    savePhases(releaseId, testPhases);
    onPhasesUpdated(testPhases);
    setIsOpen(false);
  };

  const addAgilePhases = () => {
    const goLiveDate = new Date(releaseEndDate);
    
    const hardeningEnd = new Date(goLiveDate);
    hardeningEnd.setDate(hardeningEnd.getDate() - 1);
    const hardeningStart = new Date(hardeningEnd);
    hardeningStart.setDate(hardeningStart.getDate() - 13); // 2 weeks hardening
    
    const uatEnd = new Date(hardeningStart);
    uatEnd.setDate(uatEnd.getDate() - 1);
    const uatStart = new Date(uatEnd);
    uatStart.setDate(uatStart.getDate() - 6); // 1 week UAT
    
    const sprintsEnd = new Date(uatStart);
    sprintsEnd.setDate(sprintsEnd.getDate() - 1);
    const sprintsStart = new Date(releaseStartDate);
    
    const testPhases: Phase[] = [
      {
        id: nanoid(),
        releaseId,
        name: 'Dev Sprints',
        type: 'DevWindow',
        startDate: sprintsStart,
        endDate: sprintsEnd,
        allowsWork: true,
        order: 1,
      },
      {
        id: nanoid(),
        releaseId,
        name: 'UAT',
        type: 'Testing',
        startDate: uatStart,
        endDate: uatEnd,
        allowsWork: false,
        order: 2,
      },
      {
        id: nanoid(),
        releaseId,
        name: 'Hardening Sprint',
        type: 'Deployment',
        startDate: hardeningStart,
        endDate: hardeningEnd,
        allowsWork: false,
        order: 3,
      },
      {
        id: nanoid(),
        releaseId,
        name: 'Production',
        type: 'Launch',
        startDate: goLiveDate,
        endDate: goLiveDate,
        allowsWork: false,
        order: 4,
      },
    ];

    savePhases(releaseId, testPhases);
    onPhasesUpdated(testPhases);
    setIsOpen(false);
  };

  const clearPhases = () => {
    savePhases(releaseId, []);
    onPhasesUpdated([]);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] px-3 py-2 bg-purple-600 text-white text-xs font-semibold rounded shadow-lg hover:bg-purple-700 transition-colors"
        title="Temporary debug panel for testing phases (will be removed in Step 1C)"
      >
        🧪 Phase Test Panel
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-80 bg-white border-2 border-purple-600 rounded-lg shadow-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-purple-900">Phase Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 text-lg leading-none"
        >
          ×
        </button>
      </div>
      
      <p className="text-xs text-gray-600 mb-4">
        Temporary testing tool (console access blocked). Will be removed when Phase Setup Modal is added.
      </p>

      <div className="space-y-2">
        <button
          onClick={addStandardSDLCPhases}
          className="w-full px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-900 text-xs font-medium rounded border border-blue-300 transition-colors text-left"
        >
          <div className="font-semibold">Add Standard SDLC Phases</div>
          <div className="text-[10px] text-blue-700 mt-0.5">
            Dev Window → SIT (2w) → UAT (2w) → Go-Live
          </div>
        </button>

        <button
          onClick={addAgilePhases}
          className="w-full px-3 py-2 bg-green-100 hover:bg-green-200 text-green-900 text-xs font-medium rounded border border-green-300 transition-colors text-left"
        >
          <div className="font-semibold">Add Agile Phases</div>
          <div className="text-[10px] text-green-700 mt-0.5">
            Dev Sprints → UAT (1w) → Hardening (2w) → Production
          </div>
        </button>

        <button
          onClick={clearPhases}
          className="w-full px-3 py-2 bg-red-100 hover:bg-red-200 text-red-900 text-xs font-medium rounded border border-red-300 transition-colors"
        >
          Clear All Phases
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-[10px] text-gray-500">
          Release: {releaseStartDate.toLocaleDateString()} → {releaseEndDate.toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
