import { useState } from 'react';
import { nanoid } from 'nanoid';
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Calendar, Clock } from 'lucide-react';
import { cn } from './ui/utils';
import type { Phase } from '../data/mockData';
import { toLocalDateString, parseLocalDate } from '../lib/dateUtils';
import { 
  PHASE_TEMPLATES, 
  calculatePhaseDates, 
  recalculateCascadingDates 
} from '../lib/phaseTemplates';

interface PhaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  releaseId: string;
  releaseStartDate: Date;
  releaseEndDate: Date;
  onConfirm: (phases: Phase[]) => void;
}

type SetupStep = 'choose-approach' | 'select-template' | 'review-phases';

export function PhaseSetupModal({
  isOpen,
  onClose,
  releaseId,
  releaseStartDate,
  releaseEndDate,
  onConfirm,
}: PhaseSetupModalProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>('choose-approach');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [showSkipWarning, setShowSkipWarning] = useState(false);

  if (!isOpen) return null;

  const getDuration = (startDate: Date, endDate: Date): number => {
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleSkip = () => setShowSkipWarning(true);
  
  const confirmSkip = () => {
    onConfirm([]);
    onClose();
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    
    if (templateId === 'custom') {
      setPhases([
        {
          id: nanoid(),
          releaseId,
          name: 'Dev Window',
          type: 'DevWindow',
          startDate: new Date(releaseStartDate),
          endDate: new Date(releaseEndDate),
          allowsWork: true,
          order: 1,
        },
      ]);
      setCurrentStep('review-phases');
    } else {
      const template = PHASE_TEMPLATES.find(t => t.id === templateId);
      if (template) {
        const calculatedPhases = calculatePhaseDates(
          template, 
          releaseStartDate, 
          releaseEndDate, 
          releaseId
        );
        setPhases(calculatedPhases);
        setCurrentStep('review-phases');
      }
    }
  };

  const handlePhaseEndDateChange = (index: number, newEndDate: Date) => {
    const updated = recalculateCascadingDates(phases, index, newEndDate);
    setPhases(updated);
  };

  const handleConfirm = () => {
    const hasDevWindow = phases.some(p => p.allowsWork);
    if (!hasDevWindow) {
      const proceed = window.confirm(
        'Warning: No Dev Window phase defined. Tickets may not schedule correctly. Continue anyway?'
      );
      if (!proceed) return;
    }
    
    onConfirm(phases);
    onClose();
  };

  // STEP 1: Choose Approach
  if (currentStep === 'choose-approach') {
    return (
      <>
        <style>{`
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(-10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          .modal-enter {
            animation: modalSlideIn 0.2s ease-out;
          }
          .glass-modal {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
          }
          .dark .glass-modal {
            background: rgba(15, 23, 42, 0.95);
          }
        `}</style>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-modal rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20 dark:border-slate-700/50 modal-enter">
            {/* Header */}
            <div className="p-8 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-blue-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Set Up Release Phases</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Define key phases for better release planning and tracking
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Best Practice Card */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      Best Practice
                    </h3>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1.5 leading-relaxed">
                      Defining phases upfront helps with ticket scheduling, milestone tracking, 
                      and executive reporting. Recommended for all releases.
                    </p>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <button
                  onClick={() => setCurrentStep('select-template')}
                  className={cn(
                    'group w-full p-5 border-2 rounded-xl text-left transition-all duration-200',
                    'border-blue-300 bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-950/30 dark:to-slate-900',
                    'hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5',
                    'dark:border-blue-800 dark:hover:border-blue-600'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Use Phase Template</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          Choose from Standard SDLC or Agile templates (recommended)
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </button>

                <button
                  onClick={() => handleTemplateSelect('custom')}
                  className={cn(
                    'group w-full p-5 border-2 rounded-xl text-left transition-all duration-200',
                    'border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-900/70',
                    'hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5',
                    'dark:hover:border-slate-600'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center shadow-lg shadow-slate-500/20">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Define Custom Phases</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          Create your own phase structure (advanced)
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </button>

                <button
                  onClick={handleSkip}
                  className={cn(
                    'group w-full p-5 border-2 rounded-xl text-left transition-all duration-200',
                    'border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-900/70',
                    'hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5',
                    'dark:hover:border-slate-600'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-lg shadow-slate-500/10">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Skip Phase Setup</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          Release will work without phases (not recommended)
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </button>
              </div>

              {/* Skip Warning */}
              {showSkipWarning && (
                <div className="mt-4 p-5 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border border-red-200 dark:border-red-800 rounded-xl shadow-sm">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30 flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-red-900 dark:text-red-100">Are you sure?</h3>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1.5 leading-relaxed">
                        Without phases, managing the release timeline will be more difficult. 
                        You won't be able to distinguish dev work from testing/deployment phases.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={confirmSkip}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-semibold rounded-lg shadow-lg shadow-red-500/30 transition-all duration-200 hover:-translate-y-0.5"
                    >
                      Skip Anyway
                    </button>
                    <button
                      onClick={() => setShowSkipWarning(false)}
                      className="px-4 py-2 bg-white/80 hover:bg-white border border-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-all duration-200 hover:-translate-y-0.5"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-end bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // STEP 2: Select Template
  if (currentStep === 'select-template') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="glass-modal rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-white/20 dark:border-slate-700/50 modal-enter">
          {/* Header */}
          <div className="p-8 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-blue-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Choose Phase Template</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Select a template that matches your release structure
                </p>
              </div>
            </div>
          </div>

          {/* Template Grid */}
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {PHASE_TEMPLATES.filter(t => t.id !== 'custom').map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                className={cn(
                  'group p-6 border-2 rounded-xl text-left transition-all duration-200',
                  'border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-900/70',
                  'hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1',
                  'dark:hover:border-blue-600'
                )}
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{template.name}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{template.description}</p>
                <div className="mt-5 space-y-2.5">
                  {template.phases.map((phase, idx) => (
                    <div key={idx} className="flex items-center text-xs">
                      <span 
                        className="w-2.5 h-2.5 rounded-full mr-2.5 shadow-sm" 
                        style={{
                          backgroundColor: 
                            phase.type === 'DevWindow' ? '#3b82f6' :
                            phase.type === 'Testing' ? '#eab308' :
                            phase.type === 'Deployment' ? '#a855f7' : '#22c55e'
                        }}
                      />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {phase.name}
                      </span>
                      <span className="text-slate-500 dark:text-slate-500 ml-1">
                        {phase.durationDays > 0 ? `(${phase.durationDays}d)` : '(flexible)'}
                      </span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-between bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50">
            <button
              onClick={() => setCurrentStep('choose-approach')}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: Review & Adjust
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-modal rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/20 dark:border-slate-700/50 modal-enter">
        {/* Header */}
        <div className="p-8 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-blue-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Review & Adjust Phases</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Verify dates and adjust as needed. Changes cascade to subsequent phases.
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Release Info Card */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl p-5 mb-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Release Duration:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {releaseStartDate.toLocaleDateString()} → {releaseEndDate.toLocaleDateString()} 
                <span className="text-blue-600 dark:text-blue-400 ml-2">({getDuration(releaseStartDate, releaseEndDate)} days)</span>
              </span>
            </div>
          </div>

          {/* Phase Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                  <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-200 min-w-[150px]">Phase Name</th>
                  <th className="text-left py-4 px-3 font-semibold text-slate-700 dark:text-slate-200">Type</th>
                  <th className="text-left py-4 px-3 font-semibold text-slate-700 dark:text-slate-200">Start Date</th>
                  <th className="text-left py-4 px-3 font-semibold text-slate-700 dark:text-slate-200">End Date</th>
                  <th className="text-left py-4 px-3 font-semibold text-slate-700 dark:text-slate-200">Duration (days)</th>
                  <th className="text-center py-4 px-3 font-semibold text-slate-700 dark:text-slate-200">Work Allowed</th>
                </tr>
              </thead>
              <tbody>
                {phases.map((phase, index) => {
                  const duration = getDuration(phase.startDate, phase.endDate);
                  
                  return (
                    <tr 
                      key={phase.id} 
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors duration-150"
                    >
                      {/* Editable Phase Name */}
                      <td className="py-4 px-4">
                        <input
                          type="text"
                          value={phase.name}
                          onChange={(e) => {
                            const updated = [...phases];
                            updated[index] = { ...updated[index], name: e.target.value };
                            setPhases(updated);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Phase name"
                        />
                      </td>
                      
                      {/* Phase Type Badge */}
                      <td className="py-4 px-3">
                        <span className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap inline-block border transition-all duration-200',
                          phase.type === 'DevWindow' && 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800',
                          phase.type === 'Testing' && 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
                          phase.type === 'Deployment' && 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800',
                          phase.type === 'Approval' && 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/50 dark:text-cyan-300 dark:border-cyan-800',
                          phase.type === 'Launch' && 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
                          !['DevWindow', 'Testing', 'Deployment', 'Approval', 'Launch'].includes(phase.type) && 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-800'
                        )}>
                          {phase.type}
                        </span>
                      </td>
                      
                      {/* Start Date (read-only, calculated) */}
                      <td className="py-4 px-3 text-slate-600 dark:text-slate-400 text-xs font-medium">
                        {phase.startDate.toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      
                      {/* Editable End Date */}
                      <td className="py-4 px-3">
                        <input
                          type="date"
                          value={toLocalDateString(phase.endDate)}
                          onChange={(e) => handlePhaseEndDateChange(index, parseLocalDate(e.target.value))}
                          min={toLocalDateString(phase.startDate)}
                          max={toLocalDateString(releaseEndDate)}
                          className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </td>
                      
                      {/* Editable Duration */}
                      <td className="py-4 px-3">
                        <input
                          type="number"
                          min="1"
                          value={duration}
                          onChange={(e) => {
                            const newDuration = parseInt(e.target.value) || 1;
                            const newEndDate = new Date(phase.startDate);
                            newEndDate.setDate(newEndDate.getDate() + newDuration);
                            
                            // Ensure doesn't exceed release end
                            if (newEndDate > releaseEndDate) {
                              newEndDate.setTime(releaseEndDate.getTime());
                            }
                            
                            handlePhaseEndDateChange(index, newEndDate);
                          }}
                          className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      
                      {/* Work Allowed */}
                      <td className="py-4 px-3 text-center">
                        {phase.allowsWork ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/50 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs font-semibold">
                            ✓ Yes
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-500 text-xs">No</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pro Tip Helper */}
          <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  <strong className="font-semibold">Pro tip:</strong> Edit the <strong>Duration</strong> field 
                  to quickly adjust phase lengths. Changes automatically cascade to subsequent phases 
                  to maintain continuity with no gaps.
                </p>
              </div>
            </div>
          </div>

          {/* Validation Warnings */}
          {phases[phases.length - 1]?.endDate > releaseEndDate && (
            <div className="mt-4 p-5 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border border-red-200 dark:border-red-800 rounded-xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30 flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                  Phases extend beyond release end date. 
                  Adjust phase durations or extend the release end date.
                </p>
              </div>
            </div>
          )}

          {!phases.some(p => p.allowsWork) && (
            <div className="mt-4 p-5 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30 flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 leading-relaxed">
                  No Dev Window phase defined. Tickets may not schedule correctly during auto-scheduling.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-between bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50">
          <button
            onClick={() => setCurrentStep(selectedTemplateId === 'custom' ? 'choose-approach' : 'select-template')}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm & Create Release
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
