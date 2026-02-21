import { useState } from 'react';
import { nanoid } from 'nanoid';
import { FlaskConical, X, Calendar, Zap, Target } from 'lucide-react';
import { cn } from './ui/utils';
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
        className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-sm font-semibold rounded-xl shadow-2xl shadow-purple-500/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-purple-500/50 border border-purple-400"
        title="Temporary debug panel for testing phases (will be removed in Step 1C)"
      >
        <FlaskConical className="w-4 h-4" />
        Phase Test Panel
      </button>
    );
  }

  return (
    <>
      <style>{`
        .glass-debug {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .dark .glass-debug {
          background: rgba(15, 23, 42, 0.95);
        }
      `}</style>
      <div className="fixed bottom-6 right-6 z-[9999] w-96 glass-debug border-2 border-purple-500/50 dark:border-purple-600/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100">Phase Debug Panel</h3>
                <p className="text-xs text-purple-700 dark:text-purple-300">Testing Tool</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 text-purple-900 dark:text-purple-100 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5">
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              Temporary testing tool (console access blocked). Will be removed when Phase Setup Modal is added.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={addStandardSDLCPhases}
              className={cn(
                'group w-full p-4 rounded-xl text-left transition-all duration-200',
                'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
                'border-2 border-blue-200 dark:border-blue-800',
                'hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5',
                'dark:hover:border-blue-600'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-blue-900 dark:text-blue-100">Add Standard SDLC Phases</div>
                  <div className="text-[11px] text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                    Dev Window → SIT (2w) → UAT (2w) → Go-Live
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={addAgilePhases}
              className={cn(
                'group w-full p-4 rounded-xl text-left transition-all duration-200',
                'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
                'border-2 border-green-200 dark:border-green-800',
                'hover:border-green-400 hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-0.5',
                'dark:hover:border-green-600'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30 flex-shrink-0">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-green-900 dark:text-green-100">Add Agile Phases</div>
                  <div className="text-[11px] text-green-700 dark:text-green-300 mt-1 leading-relaxed">
                    Dev Sprints → UAT (1w) → Hardening (2w) → Production
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={clearPhases}
              className={cn(
                'group w-full p-4 rounded-xl text-left transition-all duration-200',
                'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30',
                'border-2 border-red-200 dark:border-red-800',
                'hover:border-red-400 hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-0.5',
                'dark:hover:border-red-600'
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="font-semibold text-sm text-red-900 dark:text-red-100">Clear All Phases</span>
              </div>
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Release: {releaseStartDate.toLocaleDateString()} → {releaseEndDate.toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
