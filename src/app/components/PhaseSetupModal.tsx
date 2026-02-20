import { useState } from 'react';
import { nanoid } from 'nanoid';
import type { Phase } from '../data/mockData';
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-background rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">Set Up Release Phases</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Define key phases for better release planning and tracking
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-2xl mr-3">💡</span>
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Best Practice
                  </h3>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Defining phases upfront helps with ticket scheduling, milestone tracking, 
                    and executive reporting. Recommended for all releases.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              <button
                onClick={() => setCurrentStep('select-template')}
                className="w-full p-4 border-2 border-primary bg-primary/5 hover:bg-primary/10 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Use Phase Template</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Choose from Standard SDLC or Agile templates (recommended)
                    </p>
                  </div>
                  <span className="text-primary text-xl">→</span>
                </div>
              </button>

              <button
                onClick={() => handleTemplateSelect('custom')}
                className="w-full p-4 border-2 border-border hover:border-foreground/50 hover:bg-muted/50 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Define Custom Phases</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Create your own phase structure (advanced)
                    </p>
                  </div>
                  <span className="text-muted-foreground text-xl">→</span>
                </div>
              </button>

              <button
                onClick={handleSkip}
                className="w-full p-4 border-2 border-border hover:border-foreground/50 hover:bg-muted/50 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Skip Phase Setup</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Release will work without phases (not recommended)
                    </p>
                  </div>
                  <span className="text-muted-foreground text-xl">→</span>
                </div>
              </button>
            </div>

            {showSkipWarning && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <h3 className="text-sm font-semibold text-destructive">Are you sure?</h3>
                <p className="text-xs text-destructive/80 mt-1">
                  Without phases, managing the release timeline will be more difficult. 
                  You won't be able to distinguish dev work from testing/deployment phases.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={confirmSkip}
                    className="px-3 py-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-medium rounded"
                  >
                    Skip Anyway
                  </button>
                  <button
                    onClick={() => setShowSkipWarning(false)}
                    className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium rounded"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: Select Template
  if (currentStep === 'select-template') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-background rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">Choose Phase Template</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Select a template that matches your release structure
            </p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {PHASE_TEMPLATES.filter(t => t.id !== 'custom').map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                className="p-5 border-2 border-border hover:border-primary hover:bg-primary/5 rounded-lg text-left transition-colors"
              >
                <h3 className="text-lg font-semibold">{template.name}</h3>
                <p className="text-xs text-muted-foreground mt-2">{template.description}</p>
                <div className="mt-4 space-y-2">
                  {template.phases.map((phase, idx) => (
                    <div key={idx} className="flex items-center text-xs">
                      <span 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{
                          backgroundColor: 
                            phase.type === 'DevWindow' ? '#3b82f6' :
                            phase.type === 'Testing' ? '#eab308' :
                            phase.type === 'Deployment' ? '#a855f7' : '#22c55e'
                        }}
                      />
                      <span className="text-foreground">
                        {phase.name} {phase.durationDays > 0 ? `(${phase.durationDays}d)` : '(flexible)'}
                      </span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>

          <div className="p-6 border-t flex justify-between">
            <button
              onClick={() => setCurrentStep('choose-approach')}
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded"
            >
              ← Back
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Review & Adjust Phases</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Verify dates and adjust as needed. Changes cascade to subsequent phases.
          </p>
        </div>

        <div className="p-6">
          <div className="bg-muted rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Release Duration:</span>
              <span className="font-semibold">
                {releaseStartDate.toLocaleDateString()} → {releaseEndDate.toLocaleDateString()} 
                ({getDuration(releaseStartDate, releaseEndDate)} days)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-3 font-semibold min-w-[150px]">Phase Name</th>
                  <th className="text-left py-3 px-2 font-semibold">Type</th>
                  <th className="text-left py-3 px-2 font-semibold">Start Date</th>
                  <th className="text-left py-3 px-2 font-semibold">End Date</th>
                  <th className="text-left py-3 px-2 font-semibold">Duration (days)</th>
                  <th className="text-center py-3 px-2 font-semibold">Work Allowed</th>
                </tr>
              </thead>
              <tbody>
                {phases.map((phase, index) => {
                  const duration = getDuration(phase.startDate, phase.endDate);
                  
                  return (
                    <tr 
                      key={phase.id} 
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      {/* Editable Phase Name */}
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={phase.name}
                          onChange={(e) => {
                            const updated = [...phases];
                            updated[index] = { ...updated[index], name: e.target.value };
                            setPhases(updated);
                          }}
                          className="w-full px-2 py-1.5 border rounded text-sm bg-background 
                            focus:outline-none focus:ring-1 focus:ring-ring"
                          placeholder="Phase name"
                        />
                      </td>
                      
                      {/* Phase Type Badge */}
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap inline-block ${
                          phase.type === 'DevWindow' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          phase.type === 'Testing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          phase.type === 'Deployment' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                          phase.type === 'Approval' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' :
                          phase.type === 'Launch' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {phase.type}
                        </span>
                      </td>
                      
                      {/* Start Date (read-only, calculated) */}
                      <td className="py-3 px-2 text-muted-foreground text-xs">
                        {phase.startDate.toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      
                      {/* Editable End Date */}
                      <td className="py-3 px-2">
                        <input
                          type="date"
                          value={phase.endDate.toISOString().split('T')[0]}
                          onChange={(e) => handlePhaseEndDateChange(index, new Date(e.target.value))}
                          min={phase.startDate.toISOString().split('T')[0]}
                          max={releaseEndDate.toISOString().split('T')[0]}
                          className="px-2 py-1 border rounded text-xs bg-background 
                            focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </td>
                      
                      {/* Editable Duration */}
                      <td className="py-3 px-2">
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
                          className="w-16 px-2 py-1 border rounded text-xs bg-background 
                            focus:outline-none focus:ring-1 focus:ring-ring text-center 
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
                            [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      
                      {/* Work Allowed */}
                      <td className="py-3 px-2 text-center">
                        {phase.allowsWork ? (
                          <span className="text-green-600 dark:text-green-400 text-xs font-medium">
                            ✓ Yes
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">No</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pro Tip Helper */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-lg">💡</span>
              <div className="flex-1">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong className="font-semibold">Pro tip:</strong> Edit the <strong>Duration</strong> field 
                  to quickly adjust phase lengths. Changes automatically cascade to subsequent phases 
                  to maintain continuity with no gaps.
                </p>
              </div>
            </div>
          </div>

          {/* Validation Warnings */}
          {phases[phases.length - 1]?.endDate > releaseEndDate && (
            <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-xs text-destructive flex items-start gap-2">
                <span>⚠️</span>
                <span>
                  Phases extend beyond release end date. 
                  Adjust phase durations or extend the release end date.
                </span>
              </p>
            </div>
          )}

          {!phases.some(p => p.allowsWork) && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                <span>⚠️</span>
                <span>
                  No Dev Window phase defined. Tickets may not schedule correctly during auto-scheduling.
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-between">
          <button
            onClick={() => setCurrentStep(selectedTemplateId === 'custom' ? 'choose-approach' : 'select-template')}
            className="px-4 py-2 text-sm font-medium hover:bg-muted rounded"
          >
            ← Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg"
            >
              Confirm & Create Release
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
