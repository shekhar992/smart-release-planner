import { useState, useMemo } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Calendar, Zap, CheckCircle2, AlertCircle, Plus, Trash2, Download, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { nanoid } from 'nanoid';
import type { Product, Sprint, Phase, Ticket, PhaseType } from '../data/mockData';
import { mockHolidays } from '../data/mockData';
import { DatePicker } from './DatePicker';
import { PhaseTimelinePreview } from './PhaseTimelinePreview';
import { PHASE_TEMPLATES, calculatePhaseDates, recalculateCascadingDates } from '../lib/phaseTemplates';
import { parseCSV, validateAndTransformCSV } from '../lib/csvParser';
import { ticketImportMapping } from '../lib/importMappings';
import { calculateEndDateFromEffort, toLocalDateString, parseLocalDate } from '../lib/dateUtils';
import { loadHolidays, loadTeamMembers } from '../lib/localStorage';
import { calculateSprintCapacity } from '../../domain/capacityUtils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ReleaseFlow = 'manual' | 'smart';
type WizardStep = 'details' | 'sprints' | 'upload' | 'phases' | 'review';

interface ParsedTicketRow {
  id?: string; // Optional - auto-generated if missing
  title: string;
  description?: string;
  startDate?: Date; // Optional - auto-generated if missing
  endDate?: Date; // Optional - auto-generated if missing
  status?: 'planned' | 'in-progress' | 'completed'; // Optional - defaults to 'planned'
  storyPoints?: number;
  effortDays?: number;
  assignedTo: string;
  feature?: string; // For grouping (can come from 'epic' or 'feature' column)
  priority?: string;
}

interface WizardState {
  flow: ReleaseFlow;
  currentStepIndex: number;
  releaseData: {
    id: string;
    productId: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  sprintData: {
    enabled: boolean;
    duration: number; // in days
    sprints: Sprint[];
  };
  phaseData: {
    approach: 'template' | 'custom' | 'skip';
    templateId: string | null;
    phases: Phase[];
  };
  uploadData?: {
    tickets: Ticket[];
    csv: string;
    parsedTickets?: ParsedTicketRow[];
    featureGroups?: Record<string, number>;
  };
}

interface ValidationErrors {
  details?: string[];
  sprints?: string[];
  upload?: string[];
  phases?: string[];
}

interface ReleaseCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: {
    productId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    sprintLengthDays?: number;
    phases: Phase[];
    tickets?: Ticket[];
    featureGroups?: Record<string, number>; // Feature name -> ticket count
    parsedTickets?: ParsedTicketRow[]; // For feature mapping
  }) => void;
  flow: ReleaseFlow;
  products: Product[];
  defaultProductId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function ReleaseCreationWizard({
  isOpen,
  onClose,
  onComplete,
  flow,
  products,
  defaultProductId,
}: ReleaseCreationWizardProps) {
  const [wizardState, setWizardState] = useState<WizardState>({
    flow,
    currentStepIndex: 0,
    releaseData: {
      id: nanoid(),
      productId: defaultProductId || products[0]?.id || '',
      name: '',
      startDate: '',
      endDate: '',
    },
    sprintData: {
      enabled: true,
      duration: 14,
      sprints: [],
    },
    phaseData: {
      approach: 'template',
      templateId: null,
      phases: [],
    },
    uploadData: undefined,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Define step sequence based on flow
  const steps: WizardStep[] = useMemo(() => {
    if (flow === 'manual') {
      return ['details', 'sprints', 'phases', 'review'];
    } else {
      // Smart Release: Configure phases BEFORE uploading tickets
      // This allows users to define Dev Window before scheduling
      return ['details', 'phases', 'upload', 'review'];
    }
  }, [flow]);

  const currentStep = steps[wizardState.currentStepIndex];
  const isFirstStep = wizardState.currentStepIndex === 0;
  const isLastStep = wizardState.currentStepIndex === steps.length - 1;

  // ─────────────────────────────────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────────────────────────────────

  const validateDetailsStep = (): string[] => {
    const errs: string[] = [];
    const { productId, name, startDate, endDate } = wizardState.releaseData;

    if (!productId) errs.push('Product is required');
    if (!name.trim()) errs.push('Release name is required');
    if (!startDate) errs.push('Start date is required');
    if (!endDate) errs.push('End date is required');
    if (startDate && endDate && endDate < startDate) {
      errs.push('End date must be after start date');
    }

    return errs;
  };

  const validateSprintsStep = (): string[] => {
    // Sprints are optional, so no hard validation needed
    return [];
  };

  const validateUploadStep = (): string[] => {
    const errs: string[] = [];
    if (flow === 'smart' && !wizardState.uploadData?.tickets.length) {
      errs.push('Please upload ticket data before proceeding');
    }
    return errs;
  };

  const validatePhasesStep = (): string[] => {
    const errs: string[] = [];
    const { approach, phases } = wizardState.phaseData;

    if (approach === 'skip') {
      return []; // Skip is valid
    }

    if (phases.length === 0) {
      errs.push('Please configure at least one phase or choose to skip');
    }

    // Check if phases exceed release end date
    if (phases.length > 0) {
      const lastPhase = phases[phases.length - 1];
      const releaseEnd = new Date(wizardState.releaseData.endDate);
      if (lastPhase.endDate > releaseEnd) {
        errs.push('Phases extend beyond release end date');
      }
    }

    return errs;
  };

  const validateCurrentStep = (): boolean => {
    let stepErrors: string[] = [];

    switch (currentStep) {
      case 'details':
        stepErrors = validateDetailsStep();
        break;
      case 'sprints':
        stepErrors = validateSprintsStep();
        break;
      case 'upload':
        stepErrors = validateUploadStep();
        break;
      case 'phases':
        stepErrors = validatePhasesStep();
        break;
      case 'review':
        stepErrors = [];
        break;
    }

    setErrors({ ...errors, [currentStep]: stepErrors });
    return stepErrors.length === 0;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────────────────────────────────

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    setWizardState(prev => ({
      ...prev,
      currentStepIndex: Math.min(prev.currentStepIndex + 1, steps.length - 1),
    }));
    setHasUnsavedChanges(true);
  };

  const handleBack = () => {
    setWizardState(prev => ({
      ...prev,
      currentStepIndex: Math.max(prev.currentStepIndex - 1, 0),
    }));
  };

  const handleClose = () => {
    if (hasUnsavedChanges && wizardState.currentStepIndex > 0) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmClose) return;
    }
    onClose();
  };

  const handleComplete = () => {
    if (!validateCurrentStep()) return;

    const { releaseData, sprintData, phaseData, uploadData } = wizardState;

    onComplete({
      productId: releaseData.productId,
      name: releaseData.name,
      startDate: new Date(releaseData.startDate + 'T00:00:00'),
      endDate: new Date(releaseData.endDate + 'T00:00:00'),
      sprintLengthDays: sprintData.enabled ? sprintData.duration : undefined,
      phases: phaseData.phases,
      tickets: uploadData?.tickets,
      featureGroups: uploadData?.featureGroups,
      parsedTickets: uploadData?.parsedTickets,
    });

    setHasUnsavedChanges(false);
    onClose();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Keyboard navigation
  // ─────────────────────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/50 dark:border-slate-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg">
              {flow === 'smart' ? (
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {flow === 'smart' ? 'Smart Release Creation' : 'Manual Release Creation'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Step {wizardState.currentStepIndex + 1} of {steps.length}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper */}
        <WizardStepper 
          steps={steps} 
          currentStepIndex={wizardState.currentStepIndex}
        />

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="animate-fade-in">
            {currentStep === 'details' && (
              <DetailsStep
                state={wizardState}
                products={products}
                errors={errors.details}
                defaultProductId={defaultProductId}
                onChange={(data) => {
                  setWizardState(prev => ({
                    ...prev,
                    releaseData: { ...prev.releaseData, ...data },
                  }));
                  setHasUnsavedChanges(true);
                }}
              />
            )}

            {currentStep === 'sprints' && (
              <SprintsStep
                state={wizardState}
                errors={errors.sprints}
                onChange={(data) => {
                  setWizardState(prev => ({
                    ...prev,
                    sprintData: { ...prev.sprintData, ...data },
                  }));
                  setHasUnsavedChanges(true);
                }}
              />
            )}

            {currentStep === 'upload' && (
              <UploadStep
                state={wizardState}
                errors={errors.upload}
                onChange={(data) => {
                  setWizardState(prev => ({
                    ...prev,
                    uploadData: data,
                  }));
                  setHasUnsavedChanges(true);
                }}
              />
            )}

            {currentStep === 'phases' && (
              <PhasesStep
                state={wizardState}
                errors={errors.phases}
                onChange={(data) => {
                  setWizardState(prev => ({
                    ...prev,
                    phaseData: { ...prev.phaseData, ...data },
                  }));
                  setHasUnsavedChanges(true);
                }}
              />
            )}

            {currentStep === 'review' && (
              <ReviewStep state={wizardState} products={products} />
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={handleBack}
            disabled={isFirstStep}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {!isLastStep ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
            >
              <CheckCircle2 className="w-4 h-4" />
              Create Release
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stepper Component
// ─────────────────────────────────────────────────────────────────────────────

function WizardStepper({
  steps,
  currentStepIndex,
}: {
  steps: WizardStep[];
  currentStepIndex: number;
}) {
  const getStepLabel = (step: WizardStep): string => {
    const labels: Record<WizardStep, string> = {
      details: 'Release Details',
      sprints: 'Sprint Configuration',
      upload: 'Upload Tickets',
      phases: 'Phase Setup',
      review: 'Review & Create',
    };
    return labels[step];
  };

  return (
    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center flex-1">
            {/* Step circle */}
            <div
              className={`
                flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold transition-all shadow-md
                ${
                  index < currentStepIndex
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30'
                    : index === currentStepIndex
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/30 scale-110'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 shadow-none'
                }
              `}
            >
              {index < currentStepIndex ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>

            {/* Step label */}
            <div className="ml-2 flex-1 min-w-0">
              <div
                className={`text-xs font-semibold truncate ${
                  index <= currentStepIndex ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {getStepLabel(step)}
              </div>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`h-1 rounded-full flex-1 mx-2 transition-all ${
                  index < currentStepIndex ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step Components
// ─────────────────────────────────────────────────────────────────────────────

function DetailsStep({
  state,
  products,
  errors,
  defaultProductId,
  onChange,
}: {
  state: WizardState;
  products: Product[];
  errors?: string[];
  defaultProductId?: string;
  onChange: (data: Partial<WizardState['releaseData']>) => void;
}) {
  const { productId, name, startDate, endDate } = state.releaseData;
  const datesInvalid = startDate && endDate && endDate < startDate;
  const selectedProduct = products.find(p => p.id === productId);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Release Details</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Configure the basic information for your release.
        </p>
      </div>

      {errors && errors.length > 0 && (
        <div className="p-3 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              {errors.map((error, i) => (
                <p key={i} className="text-xs text-red-700 dark:text-red-300 font-medium">
                  {error}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Product Selection or Display */}
        {defaultProductId ? (
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Product
            </label>
            <div className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-medium shadow-sm">
              {selectedProduct?.name || 'Unknown Product'}
            </div>
          </div>
        ) : products.length > 1 ? (
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              value={productId}
              onChange={(e) => onChange({ productId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 font-medium shadow-sm transition-all"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {/* Release Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Release Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g., Q1 2026 Release"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 font-medium shadow-sm transition-all"
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(date) => onChange({ startDate: date })}
            required
            helperText="Defines the overall release period for phase planning"
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(date) => onChange({ endDate: date })}
            minDate={startDate}
            required
            error={datesInvalid ? 'End date must be after start date' : undefined}
            helperText={!datesInvalid ? 'All release phases must fit within this period' : undefined}
          />
        </div>
      </div>
    </div>
  );
}

function SprintsStep({
  state,
  errors,
  onChange,
}: {
  state: WizardState;
  errors?: string[];
  onChange: (data: Partial<WizardState['sprintData']>) => void;
}) {
  const { startDate, endDate } = state.releaseData;
  const { enabled, duration } = state.sprintData;

  const generatedSprints = useMemo(() => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const totalDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    const count = Math.floor(totalDays / duration);
    if (count <= 0) return [];

    const sprints: Sprint[] = [];
    for (let i = 0; i < count; i++) {
      const sprintStart = new Date(start.getTime() + i * duration * 24 * 60 * 60 * 1000);
      const sprintEnd = new Date(sprintStart.getTime() + (duration - 1) * 24 * 60 * 60 * 1000);
      sprints.push({
        id: `sprint-${state.releaseData.id}-${i}`,
        name: `Sprint ${i + 1}`,
        startDate: sprintStart,
        endDate: sprintEnd,
      });
    }
    return sprints;
  }, [startDate, endDate, duration, state.releaseData.id]);

  // Update sprints in state whenever they're recalculated
  useMemo(() => {
    if (enabled) {
      onChange({ sprints: generatedSprints });
    }
  }, [generatedSprints, enabled]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Sprint Configuration</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Define sprint cadence for your release (optional).
        </p>
      </div>

      {errors && errors.length > 0 && (
        <div className="p-3 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              {errors.map((error, i) => (
                <p key={i} className="text-xs text-red-700 dark:text-red-300 font-medium">
                  {error}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Enable/Disable Sprints */}
        <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onChange({ enabled: e.target.checked, sprints: e.target.checked ? generatedSprints : [] })}
            className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-400/50"
          />
          <div className="flex-1">
            <label className="text-sm font-semibold text-slate-900 dark:text-white">
              Enable Sprint Planning
            </label>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Automatically divide release into fixed-length sprints
            </p>
          </div>
        </div>

        {enabled && (
          <>
            {/* Sprint Duration */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Sprint Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[7, 14, 21].map((days) => (
                  <button
                    key={days}
                    onClick={() => onChange({ duration: days })}
                    className={`px-3 py-2 text-sm font-semibold rounded-xl border transition-all shadow-sm ${
                      duration === days
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    {days / 7} week{days > 7 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Sprint Preview */}
            {generatedSprints.length > 0 && (
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  <Zap className="w-4 h-4 inline mr-1" />
                  Planning Engine will auto-generate sprints
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Based on your selected duration ({duration / 7} week{duration > 7 ? 's' : ''}), the planning engine will automatically create sprints and distribute tickets optimally according to team capacity, holidays, and workload.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function UploadStep({
  state,
  errors,
  onChange,
}: {
  state: WizardState;
  errors?: string[];
  onChange: (data: WizardState['uploadData']) => void;
}) {
  const [uploadedTickets, setUploadedTickets] = useState<Ticket[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedTickets, setParsedTickets] = useState<ParsedTicketRow[]>([]);
  const [parseErrors, setParseErrors] = useState<{ row: number; field: string; message: string }[]>([]);
  const [hasValidationErrors, setHasValidationErrors] = useState(false);
  const teamSize = 5; // Default team size - in production, get from team context
  
  // Load holidays for date calculations
  const holidays = useMemo(() => loadHolidays() || mockHolidays, []);

  // Function to generate and download sample CSV
  const downloadSampleCSV = () => {
    // Use the exact same template as BulkTicketImportModal for consistency
    const template = `title,epic,effortDays,priority,assignedTo
Configure AWS hosting services,Infra Setup,15,High,AI Tech Lead
Configure AWS GenAI services,Infra Setup,10,High,AI Tech Lead
Configure AWS storage services,Infra Setup,5,High,AI Tech Lead
Configure Environments and Deployments,Infra Setup,10,High,AI Tech Lead
Agents codebase setup,Code Setup,10,High,AI Tech Lead
Backend setup (BFF layer),Code Setup,10,High,AI Tech Lead
Develop framework to build and orchestrate multiple agents,Agentic AI Foundation,5,High,AI Tech Backend 1
Develop data source connectors,Agentic AI Foundation,10,High,AI Tech Backend 1
Develop tools (or MCP server) for external operations,Agentic AI Foundation,15,High,AI Tech Backend 1
Setup memory layer,Agentic AI Foundation,10,High,AI Tech Backend 1
Setup knowledge bases,Agentic AI Foundation,10,High,AI Tech Backend 1
SSO Login,Authentication,5,High,AI Tech Backend 1
SSO token verification,Authentication,5,High,AI Tech Backend 1
Role Based access control and User groups,Account Management,15,High,AI Tech Backend 1
Brand Library Creation,Brand Library,10,High,AI Tech Backend 2
Document management,Brand Library,10,High,AI Tech Backend 2
Knowledge Base - Ingestion Workflow,Brand Library,25,High,AI Tech Backend 2
Ability to create and manage content collection in brand library,Content Collection,5,High,AI Tech Backend 2
Agents to identify relevant documents from brand library,Content Collection,5,High,AI Tech Backend 2
Agents to generate text content based on context and template,Content Creation,10,High,AI Tech Backend 2
Agentic workflow to draft content with given inputs,Content Creation,10,High,AI Tech Backend 2
Workflows to modify content draft,Content Creation,10,High,AI Tech Backend 2
Fine-tune creation agents for specific channel templates,Content Creation,15,High,AI Tech Backend 3
Dynamic Templates with X dynamic components,Templates,5,High,AI Tech Backend 3
Agentic workflows to localize the content draft (translation + rules),Content Localization,15,High,AI Tech Backend 3
Workflows to modify localized content,Content Localization,5,High,AI Tech Backend 3
Fine-tune localization agents for specific geographies,Content Localization,10,High,AI Tech Backend 3
UI Based Form to collect key pieces of information that will be captured and stored in our DD. This will be used for the master prompt,Master Story,15,High,AI Tech Backend 3
Country roll-out for Global + Germany Italy,Country Roll out,15,High,AI Tech Backend 3`;
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tickets_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate Dev Window capacity
  const devWindowCapacity = useMemo(() => {
    const devPhases = state.phaseData.phases.filter(p => p.allowsWork);
    
    if (devPhases.length === 0) {
      return {
        totalDays: 0,
        totalCapacity: 0,
        devPhases: [],
        warning: 'No Dev Window defined. Tickets cannot be scheduled.',
      };
    }

    const totalDays = devPhases.reduce((sum, phase) => {
      const days = getDurationDays(phase.startDate, phase.endDate);
      return sum + days;
    }, 0);

    const totalCapacity = totalDays * teamSize;

    return {
      totalDays,
      totalCapacity,
      devPhases,
      warning: null,
    };
  }, [state.phaseData.phases, teamSize]);

  // Calculate total effort from uploaded tickets
  const totalTicketEffort = useMemo(() => {
    if (uploadedTickets.length === 0) return 0;
    return uploadedTickets.reduce((sum, ticket) => sum + (ticket.effortDays ?? ticket.storyPoints ?? 1), 0);
  }, [uploadedTickets]);

  // Calculate sprint-level capacity breakdown
  const sprintCapacities = useMemo(() => {
    if (!state.sprintData.enabled || state.sprintData.sprints.length === 0) {
      return [];
    }

    // Load team members to get PTO data
    const allTeamMembers = loadTeamMembers() || [];
    const productTeam = allTeamMembers.filter(tm => tm.productId === state.releaseData.productId);
    const numberOfDevelopers = productTeam.filter(m => m.role === 'Developer').length || teamSize;

    // Convert PTO to date format expected by capacity calculator
    const ptoDates = productTeam.flatMap(member => 
      (member.pto || []).map(pto => ({
        startDate: pto.startDate,
        endDate: pto.endDate,  
      }))
    );

    return state.sprintData.sprints.map(sprint => {
      const capacity = calculateSprintCapacity({
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        numberOfDevelopers,
        holidays,
        ptoDates,
      });

      return {
        sprintName: sprint.name,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        capacityDays: capacity.capacityDays,
        workingDays: capacity.workingDays,
        ptoDays: capacity.ptoDays,
        holidayDays: capacity.holidayDays,
        numberOfDevelopers,
      };
    });
  }, [state.sprintData, state.releaseData.productId, holidays, teamSize]);

  const totalSprintCapacity = useMemo(() => {
    return sprintCapacities.reduce((sum, sc) => sum + sc.capacityDays, 0);
  }, [sprintCapacities]);

  const capacityUtilization = devWindowCapacity.totalCapacity > 0 
    ? (totalTicketEffort / devWindowCapacity.totalCapacity) * 100 
    : 0;
  const isOverCapacity = totalTicketEffort > devWindowCapacity.totalCapacity;

  const parseCSVContent = (content: string) => {
    const { headers, rows } = parseCSV(content);
    const result = validateAndTransformCSV<ParsedTicketRow>(headers, rows, ticketImportMapping);
    
    setParsedTickets(result.data);
    setParseErrors(result.errors);
    
    // Check if there are critical errors (no valid tickets parsed)
    if (result.data.length === 0 && result.errors.length > 0) {
      setHasValidationErrors(true);
      setUploadedTickets([]);
      setValidationErrors(result.errors.map(e => `Row ${e.row}: ${e.message} (${e.field})`));
      return;
    }
    
    // Load team members for velocity calculations
    const allTeamMembers = loadTeamMembers() || [];
    const productTeam = allTeamMembers.filter(tm => tm.productId === state.releaseData.productId);
    
    // Convert parsed tickets to Ticket format - timeline canvas engine will assign id, startDate, endDate
    // Use release start date as placeholder for dates (timeline canvas will overwrite with actual schedule)
    const placeholderStartDate = new Date(state.releaseData.startDate);
    
    const tickets: Ticket[] = result.data.map((ticket) => {
      const effortDays = ticket.effortDays ?? ticket.storyPoints ?? 1;
      
      // Calculate placeholder end date with velocity adjustment (working days, not calendar days)
      const assignedDev = productTeam.find(m => m.name === ticket.assignedTo);
      const velocity = assignedDev?.velocityMultiplier ?? 1;
      const adjustedDuration = Math.max(1, Math.round(effortDays / velocity));
      const ticketStartDate = ticket.startDate || placeholderStartDate;
      const ticketEndDate = ticket.endDate || calculateEndDateFromEffort(ticketStartDate, adjustedDuration, holidays);
      
      return {
        id: ticket.id || '', // Empty - timeline canvas engine will assign
        title: ticket.title,
        description: ticket.description,
        startDate: ticketStartDate,
        endDate: ticketEndDate,
        status: ticket.status || 'planned',
        effortDays,
        storyPoints: ticket.storyPoints ?? effortDays,
        assignedTo: ticket.assignedTo,
      };
    });
    
    setUploadedTickets(tickets);
    setHasValidationErrors(false);
    setValidationErrors([]);
    
    // Group tickets by feature for auto-creation
    const featureGroups = result.data.reduce<Record<string, number>>((acc, t) => {
      const name = t.feature?.trim() || 'Imported Tickets';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});
    
    // Pass to parent
    onChange({
      tickets,
      csv: fileName,
      parsedTickets: result.data,
      featureGroups,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        parseCSVContent(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Upload Tickets</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Upload CSV file with ticket data for AI-powered scheduling.
        </p>
      </div>

      {errors && errors.length > 0 && (
        <div className="p-3 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              {errors.map((error, i) => (
                <p key={i} className="text-xs font-medium text-red-700 dark:text-red-400">
                  {error}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Capacity Overview (PROMINENT) */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/40 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 shadow-sm">
        <h4 className="text-base font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center shadow-inner">
            <span className="text-xl">📊</span>
          </div>
          Available Development Capacity
        </h4>

        {devWindowCapacity.warning ? (
          <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-900/40 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">
              ⚠️ {devWindowCapacity.warning}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400/80 mt-2">
              Go back to Phase Setup and configure at least one Dev Window phase to proceed.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {devWindowCapacity.totalDays}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                  Dev Window Days
                </div>
              </div>

              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {teamSize}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                  Team Members
                </div>
              </div>

              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {devWindowCapacity.totalCapacity}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                  Total Person-Days
                </div>
              </div>
            </div>

            {/* Dev Window breakdown */}
            <div className="mt-4 text-xs text-slate-600 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="font-medium mb-2 text-foreground">Dev Window Phases:</p>
              <ul className="space-y-1">
                {devWindowCapacity.devPhases.map(phase => {
                  const days = getDurationDays(phase.startDate, phase.endDate);
                  return (
                    <li key={phase.id} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-medium text-foreground">{phase.name}:</span>
                      <span>{days} days</span>
                      <span className="text-blue-600 dark:text-blue-400">({days * teamSize} person-days)</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Download Sample CSV Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={downloadSampleCSV}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
        >
          <Download className="w-4 h-4" />
          Download Sample CSV (29 tickets)
        </button>
      </div>

      {/* CSV Upload Area */}
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-all">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
          id="csv-upload"
          disabled={!!devWindowCapacity.warning}
        />
        <label 
          htmlFor="csv-upload" 
          className={`${devWindowCapacity.warning ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
          <div className="text-4xl mb-3">📄</div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">Click to upload CSV file</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            or drag and drop your tickets.csv file here
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 px-4">
            Required: title, assignedTo, effortDays
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 px-4">
            Optional: epic/feature, priority, description
          </p>
        </label>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-900/40 rounded-xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Upload Errors - Please Fix Your CSV
          </p>
          <ul className="text-xs text-red-700 dark:text-red-400 space-y-1 list-disc list-inside mb-3">
            {validationErrors.slice(0, 5).map((error, i) => (
              <li key={i}>{error}</li>
            ))}
            {validationErrors.length > 5 && (
              <li>...and {validationErrors.length - 5} more errors</li>
            )}
          </ul>
          <p className="text-xs text-red-600 dark:text-red-400/80 bg-red-100 dark:bg-red-950/40 p-2 rounded">
            Fix your file to align with required fields. Not feeling confident?{' '}
            <button 
              onClick={downloadSampleCSV}
              className="underline font-medium hover:text-red-800"
            >
              Download template and compare
            </button>
          </p>
        </div>
      )}

      {/* Preview Section - Show after successful parsing */}
      {parsedTickets.length > 0 && !hasValidationErrors && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {parsedTickets.length} ticket{parsedTickets.length !== 1 ? 's' : ''} parsed successfully
              </span>
            </div>
            {fileName && (
              <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {fileName}
              </span>
            )}
          </div>

          {/* Feature Groupings */}
          {state.uploadData?.featureGroups && Object.keys(state.uploadData.featureGroups).length > 0 && (
            <div className="px-4 py-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-b border-slate-200 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-900 dark:text-white mb-2">Features to be created:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(state.uploadData.featureGroups).map(([name, count]) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 shadow-sm"
                  >
                    <span className="text-emerald-600 dark:text-emerald-500 text-[9px] font-bold">NEW</span>
                    {name}
                    <span className="text-slate-500 dark:text-slate-400 font-normal">({count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="max-h-[280px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400 font-semibold">Feature</th>
                  <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400 font-semibold">Title</th>
                  <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400 font-semibold">Effort</th>
                  <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400 font-semibold">Assignee</th>
                  <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {parsedTickets.map((ticket, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 max-w-[110px] truncate">
                      {ticket.feature || 'Imported Tickets'}
                    </td>
                    <td className="px-3 py-2 text-slate-900 dark:text-white font-medium max-w-[200px] truncate">
                      {ticket.title}
                    </td>
                    <td className="px-3 py-2 text-slate-900 dark:text-white">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 inline-flex items-center justify-center text-[10px] font-medium">
                        {ticket.effortDays ?? ticket.storyPoints ?? 1}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 max-w-[100px] truncate">
                      {ticket.assignedTo || 'Unassigned'}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        ticket.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' :
                        ticket.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Warnings if any */}
          {parseErrors.length > 0 && (
            <div className="px-4 py-2 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-t border-amber-200 dark:border-amber-900/40">
              <details className="group">
                <summary className="text-[11px] text-amber-700 dark:text-amber-400 cursor-pointer hover:text-amber-900 dark:hover:text-amber-300">
                  {parseErrors.length} warning{parseErrors.length !== 1 ? 's' : ''} (non-critical)
                </summary>
                <div className="mt-2 max-h-[100px] overflow-y-auto space-y-1">
                  {parseErrors.map((err, i) => (
                    <p key={i} className="text-[11px] text-amber-800 dark:text-amber-300">
                      Row {err.row}: {err.message} ({err.field})
                    </p>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Upload Summary (shown after successful upload without validation errors) */}
      {uploadedTickets.length > 0 && !hasValidationErrors && devWindowCapacity.totalCapacity > 0 && (
        <div className={`border-2 rounded-xl p-5 shadow-sm ${
          isOverCapacity 
            ? 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-300 dark:border-red-900/40' 
            : 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-300 dark:border-emerald-800'
        }`}>
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            {isOverCapacity ? (
              <>
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-red-700 dark:text-red-400">Capacity Warning</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-400">Upload Successful</span>
              </>
            )}
          </h4>

          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-slate-600 dark:text-slate-400">Tickets Uploaded:</span>
              <span className="font-semibold ml-2 text-slate-900 dark:text-white">{uploadedTickets.length}</span>
            </div>
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-slate-600 dark:text-slate-400">Total Effort:</span>
              <span className="font-semibold ml-2 text-slate-900 dark:text-white">{totalTicketEffort} days</span>
            </div>
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-slate-600 dark:text-slate-400">Available Capacity:</span>
              <span className="font-semibold ml-2 text-slate-900 dark:text-white">{devWindowCapacity.totalCapacity} days</span>
            </div>
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-slate-600 dark:text-slate-400">Utilization:</span>
              <span className={`font-semibold ml-2 ${
                isOverCapacity ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {capacityUtilization.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Sprint Capacity Preview (NEW in Phase 2) */}
          {sprintCapacities.length > 0 && (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-800 mb-4 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Sprint Capacity Breakdown
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Auto-allocation will fill each sprint to 85%+ utilization before moving to the next
                </p>
              </div>
              
              <div className="p-4">
                <div className="space-y-3">
                  {sprintCapacities.map((sprint, index) => {
                    const utilizationPercent = totalSprintCapacity > 0 
                      ? (sprint.capacityDays / totalSprintCapacity) * 100 
                      : 0;
                    
                    return (
                      <div 
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/30 border border-slate-200 dark:border-slate-700"
                      >
                        {/* Sprint Name & Dates */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-slate-900 dark:text-white">
                            {sprint.sprintName}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            {sprint.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {sprint.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>

                        {/* Capacity Formula */}
                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <span className="font-medium">👥 {sprint.numberOfDevelopers} devs</span>
                          <span className="text-slate-400">×</span>
                          <span className="font-medium">{sprint.workingDays} days</span>
                          {sprint.ptoDays > 0 && (
                            <>
                              <span className="text-slate-400">-</span>
                              <span className="font-medium text-amber-600 dark:text-amber-400">{sprint.ptoDays}d PTO</span>
                            </>
                          )}
                          {sprint.holidayDays > 0 && (
                            <>
                              <span className="text-slate-400">-</span>
                              <span className="font-medium text-purple-600 dark:text-purple-400">{sprint.holidayDays}d holidays</span>
                            </>
                          )}
                        </div>

                        {/* Capacity Result */}
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {sprint.capacityDays}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              days
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Total Sprint Capacity:</span>
                      <span className="ml-2 font-bold text-blue-600 dark:text-blue-400">{totalSprintCapacity} days</span>
                    </div>
                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Ticket Effort:</span>
                      <span className="ml-2 font-bold text-slate-900 dark:text-white">{totalTicketEffort} days</span>
                    </div>
                  </div>
                  
                  {totalSprintCapacity > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${
                          (totalTicketEffort / totalSprintCapacity) > 1 
                            ? 'text-red-600 dark:text-red-400' 
                            : (totalTicketEffort / totalSprintCapacity) > 0.9 
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {((totalTicketEffort / totalSprintCapacity) * 100).toFixed(0)}% utilization
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Uploaded Tickets Table */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-800 mb-4 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h5 className="text-sm font-semibold text-foreground">Uploaded Tickets</h5>
              {uploadedTickets.length > 10 && (
                <button
                  type="button"
                  onClick={() => setShowAllTickets(!showAllTickets)}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  {showAllTickets ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Show All ({uploadedTickets.length})
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Effort (days)
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Assigned To
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {(showAllTickets ? uploadedTickets : uploadedTickets.slice(0, 10)).map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-2 text-sm text-foreground">
                        {ticket.title}
                      </td>
                      <td className="px-4 py-2 text-sm text-muted-foreground max-w-xs truncate">
                        {ticket.description || '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-foreground">
                        {ticket.effortDays ?? ticket.storyPoints ?? 1}
                      </td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">
                        {ticket.assignedTo || 'Unassigned'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!showAllTickets && uploadedTickets.length > 10 && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 text-center text-xs text-muted-foreground">
                Showing 10 of {uploadedTickets.length} tickets
              </div>
            )}
          </div>

          {/* Capacity bar */}
          <div className="mb-4">
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  isOverCapacity ? 'bg-red-600' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(capacityUtilization, 100)}%` }}
              />
            </div>
          </div>

          {isOverCapacity && (
            <div className="bg-red-100 dark:bg-red-950/30 border border-red-300 dark:border-red-900/40 rounded-xl p-3 shadow-sm">
              <p className="text-xs text-red-800 dark:text-red-300 font-medium">
                <strong>⚠️ Warning:</strong> Ticket effort exceeds Dev Window capacity by{' '}
                <strong>{(totalTicketEffort - devWindowCapacity.totalCapacity).toFixed(1)} days</strong>. 
                Some tickets may be scheduled outside the Dev Window or remain unscheduled. 
                Consider extending the Dev Window, reducing scope, or increasing team size.
              </p>
            </div>
          )}

          {!isOverCapacity && capacityUtilization > 80 && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-300 dark:border-yellow-900/40 rounded-xl p-3 shadow-sm">
              <p className="text-xs text-yellow-800 dark:text-yellow-300">
                <strong>ℹ️ Note:</strong> Capacity utilization is at {capacityUtilization.toFixed(0)}%. 
                This is a healthy level, but leaves limited buffer for unknowns or scope changes.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase Management Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function getDurationDays(startDate: Date, endDate: Date): number {
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

function validatePhaseInsertion(
  newPhase: Partial<Phase> & { duration?: number },
  existingPhases: Phase[],
  _position: 'start' | 'end' | number,
  releaseData: { startDate: string; endDate: string; }
): string[] {
  const errors: string[] = [];

  // Check required fields
  if (!newPhase.name || !newPhase.name.trim()) {
    errors.push('Phase name is required');
  }
  if (!newPhase.type) {
    errors.push('Phase type is required');
  }
  if (!newPhase.duration || newPhase.duration < 1) {
    errors.push('Duration must be at least 1 day');
  }

  // Check if adding phase would exceed release end date
  const totalDuration = existingPhases.reduce((sum, p) => 
    sum + getDurationDays(p.startDate, p.endDate), 0
  ) + (newPhase.duration || 0);
  
  const releaseStart = new Date(releaseData.startDate + 'T00:00:00');
  const releaseEnd = new Date(releaseData.endDate + 'T00:00:00');
  const releaseDuration = getDurationDays(releaseStart, releaseEnd);
  
  if (totalDuration > releaseDuration) {
    errors.push(
      `Total phase duration (${totalDuration} days) exceeds release duration (${releaseDuration} days). ` +
      `Consider reducing phase durations or extending the release end date.`
    );
  }

  // Warn if multiple Dev Windows
  if (newPhase.type === 'DevWindow' && existingPhases.some(p => p.type === 'DevWindow')) {
    errors.push(
      'Multiple Dev Windows detected. This may cause scheduling conflicts. ' +
      'Consider using a single continuous Dev Window.'
    );
  }

  return errors;
}

function insertPhaseAndRecalculate(
  existingPhases: Phase[],
  newPhase: Partial<Phase> & { duration: number },
  position: 'start' | 'end' | number,
  releaseData: { id: string; startDate: string; endDate: string; }
): Phase[] {
  const phases = [...existingPhases];
  const releaseStart = new Date(releaseData.startDate + 'T00:00:00');

  // Determine insertion index
  let insertIndex: number;
  if (position === 'start') {
    insertIndex = 0;
  } else if (position === 'end') {
    insertIndex = phases.length;
  } else {
    insertIndex = position;
  }

  // Calculate start date for new phase
  let newPhaseStart: Date;
  if (insertIndex === 0) {
    newPhaseStart = releaseStart;
  } else {
    const previousPhase = phases[insertIndex - 1];
    newPhaseStart = new Date(previousPhase.endDate);
    newPhaseStart.setDate(newPhaseStart.getDate() + 1);
  }

  // Calculate end date
  const newPhaseEnd = new Date(newPhaseStart);
  newPhaseEnd.setDate(newPhaseEnd.getDate() + newPhase.duration);

  // Create complete new phase
  const completeNewPhase: Phase = {
    id: nanoid(),
    releaseId: releaseData.id,
    name: newPhase.name || 'New Phase',
    type: newPhase.type || 'Custom',
    startDate: newPhaseStart,
    endDate: newPhaseEnd,
    allowsWork: newPhase.allowsWork || false,
    order: insertIndex + 1,
    description: newPhase.description,
  };

  // Insert phase
  phases.splice(insertIndex, 0, completeNewPhase);

  // Recalculate all subsequent phases
  for (let i = insertIndex + 1; i < phases.length; i++) {
    const prevPhase = phases[i - 1];
    const currentPhase = phases[i];
    
    const newStartDate = new Date(prevPhase.endDate);
    newStartDate.setDate(newStartDate.getDate() + 1);
    
    const duration = getDurationDays(currentPhase.startDate, currentPhase.endDate);
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + duration);
    
    phases[i] = {
      ...currentPhase,
      startDate: newStartDate,
      endDate: newEndDate,
      order: i + 1,
    };
  }

  return phases;
}

function calculateShiftImpact(
  phases: Phase[],
  position: 'start' | 'end' | number,
  newPhaseDuration: number
): string {
  const insertIndex = position === 'start' ? 0 : position === 'end' ? phases.length : position;
  const affectedPhases = phases.slice(insertIndex);
  
  if (affectedPhases.length === 0) {
    return 'No other phases will be affected.';
  }
  
  return `${affectedPhases.length} phase${affectedPhases.length !== 1 ? 's' : ''} will shift by ${newPhaseDuration} days.`;
}

function PhasesStep({
  state,
  errors,
  onChange,
}: {
  state: WizardState;
  errors?: string[];
  onChange: (data: Partial<WizardState['phaseData']>) => void;
}) {
  const { approach, templateId, phases } = state.phaseData;
  const { startDate, endDate } = state.releaseData;

  // State for manual phase addition
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [newPhase, setNewPhase] = useState<Partial<Phase> & { duration?: number }>({
    name: '',
    type: 'Custom',
    allowsWork: false,
    duration: undefined,
  });
  const [insertPosition, setInsertPosition] = useState<'start' | 'end' | number>('end');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleTemplateSelect = (selectedTemplateId: string) => {
    onChange({ templateId: selectedTemplateId });

    if (selectedTemplateId === 'custom') {
      onChange({ approach: 'custom', phases: [] });
      return;
    }

    const template = PHASE_TEMPLATES.find(t => t.id === selectedTemplateId);
    if (!template) return;

    const releaseStart = new Date(startDate + 'T00:00:00');
    const releaseEnd = new Date(endDate + 'T00:00:00');
    const calculatedPhases = calculatePhaseDates(template, releaseStart, releaseEnd, state.releaseData.id);
    
    onChange({ phases: calculatedPhases });
  };

  const handlePhaseEndDateChange = (index: number, newEndDate: Date) => {
    // Recalculate cascading dates
    const cascadedPhases = recalculateCascadingDates(phases, index, newEndDate);
    onChange({ phases: cascadedPhases });
  };

  const handleDeletePhase = (index: number) => {
    const confirmDelete = window.confirm(`Delete ${phases[index].name}? This will recalculate subsequent phases.`);
    if (!confirmDelete) return;

    const updatedPhases = phases.filter((_, i) => i !== index);
    
    // Recalculate orders and dates
    const recalculatedPhases = updatedPhases.map((phase, i) => {
      if (i === 0) {
        return { ...phase, order: 1 };
      }
      const prevPhase = updatedPhases[i - 1];
      const newStartDate = new Date(prevPhase.endDate);
      newStartDate.setDate(newStartDate.getDate() + 1);
      
      const duration = getDurationDays(phase.startDate, phase.endDate);
      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newEndDate.getDate() + duration);
      
      return {
        ...phase,
        startDate: newStartDate,
        endDate: newEndDate,
        order: i + 1,
      };
    });

    onChange({ phases: recalculatedPhases });
  };

  const handleAddPhase = () => {
    // Validate new phase
    const errors = validatePhaseInsertion(
      newPhase,
      phases,
      insertPosition,
      { startDate, endDate }
    );
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Insert phase and recalculate dates
    const updatedPhases = insertPhaseAndRecalculate(
      phases,
      newPhase as Partial<Phase> & { duration: number },
      insertPosition,
      { id: state.releaseData.id, startDate, endDate }
    );
    
    onChange({ phases: updatedPhases });
    
    // Reset form
    setShowAddPhase(false);
    setNewPhase({ name: '', type: 'Custom', allowsWork: false, duration: undefined });
    setInsertPosition('end');
    setValidationErrors([]);
  };

  const getDuration = (startDate: Date, endDate: Date): number => {
    return getDurationDays(startDate, endDate);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Phase Setup</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Configure release phases for better timeline management.
        </p>
      </div>

      {/* Smart Release Helper Text */}
      {state.flow === 'smart' && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <span className="text-sm">💡</span>
            <span>
              <strong>Important:</strong> Define your Dev Window phase carefully. 
              When you upload tickets in the next step, they will only be scheduled within 
              the Dev Window period. Available capacity will be calculated based on your dev team size 
              and the Dev Window duration.
            </span>
          </p>
        </div>
      )}

      {errors && errors.length > 0 && (
        <div className="p-3 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              {errors.map((error, i) => (
                <p key={i} className="text-xs font-medium text-red-700 dark:text-red-400">
                  {error}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Approach Selection */}
      {!templateId && phases.length === 0 && (
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onChange({ approach: 'template' })}
            className={`p-4 rounded-xl border-2 transition-all shadow-sm hover:shadow-md ${
              approach === 'template'
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white/50 dark:bg-slate-900/50'
            }`}
          >
            <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Use Template</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Choose from predefined phase structures</div>
          </button>

          <button
            onClick={() => onChange({ approach: 'custom', phases: [] })}
            className={`p-4 rounded-xl border-2 transition-all shadow-sm hover:shadow-md ${
              approach === 'custom'
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white/50 dark:bg-slate-900/50'
            }`}
          >
            <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Custom</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Build your own phase structure</div>
          </button>

          <button
            onClick={() => onChange({ approach: 'skip', phases: [] })}
            className={`p-4 rounded-xl border-2 transition-all shadow-sm hover:shadow-md ${
              approach === 'skip'
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white/50 dark:bg-slate-900/50'
            }`}
          >
            <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Skip</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Continue without phases</div>
          </button>
        </div>
      )}

      {/* Template Selection */}
      {approach === 'template' && !templateId && phases.length === 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-900 dark:text-white">Select Template</label>
          <div className="grid grid-cols-2 gap-3">
            {PHASE_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                className="text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm hover:shadow-md shadow-sm"
              >
                <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{template.name}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{template.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Phase Review Table */}
      {phases.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-900 dark:text-white">
              Review Phases ({phases.length})
            </label>
            {templateId && (
              <button
                onClick={() => onChange({ templateId: null, approach: 'template', phases: [] })}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Change Template
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="text-left py-3 px-3 font-semibold text-slate-900 dark:text-white">Phase Name</th>
                  <th className="text-left py-3 px-2 font-semibold text-slate-900 dark:text-white">Type</th>
                  <th className="text-left py-3 px-2 font-semibold text-slate-900 dark:text-white">Start Date</th>
                  <th className="text-left py-3 px-2 font-semibold text-slate-900 dark:text-white">End Date</th>
                  <th className="text-left py-3 px-2 font-semibold text-slate-900 dark:text-white">Duration</th>
                  <th className="text-left py-3 px-2 font-semibold text-slate-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {phases.map((phase, index) => (
                  <tr key={phase.id}>
                    <td className="py-3 px-3 font-medium">{phase.name}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        phase.type === 'DevWindow' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : phase.type === 'Testing'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : phase.type === 'Deployment'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {phase.type}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground text-xs">
                      {phase.startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="date"
                        value={toLocalDateString(phase.endDate)}
                        onChange={(e) => handlePhaseEndDateChange(index, parseLocalDate(e.target.value))}
                        className="px-2 py-1 border border-gray-200 dark:border-gray-800 rounded text-xs bg-transparent"
                      />
                    </td>
                    <td className="py-3 px-2 text-muted-foreground text-xs">
                      {getDuration(phase.startDate, phase.endDate)} days
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => handleDeletePhase(index)}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                        title="Delete phase"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Visual Timeline Preview */}
      {phases.length > 0 && (
        <PhaseTimelinePreview
          phases={phases}
          releaseStart={startDate}
          releaseEnd={endDate}
        />
      )}

      {/* Add Custom Phase Section */}
      {(approach === 'custom' || approach === 'template') && (
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
          {!showAddPhase ? (
            <button
              onClick={() => setShowAddPhase(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-all text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Custom Phase
            </button>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Add New Phase</h4>
                <button
                  onClick={() => {
                    setShowAddPhase(false);
                    setValidationErrors([]);
                    setNewPhase({ name: '', type: 'Custom', allowsWork: false, duration: undefined });
                  }}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              {/* Phase Name */}
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Phase Name *
                </label>
                <input
                  type="text"
                  value={newPhase.name}
                  onChange={(e) => setNewPhase(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Code Freeze, QA Testing"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 shadow-sm"
                />
              </div>

              {/* Phase Type */}
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Phase Type *
                </label>
                <select
                  value={newPhase.type}
                  onChange={(e) => {
                    const value = e.target.value as PhaseType;
                    setNewPhase(prev => ({ 
                      ...prev, 
                      type: value,
                      allowsWork: value === 'DevWindow', // Auto-set for dev phases
                    }));
                  }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 shadow-sm"
                >
                  <option value="DevWindow">Dev Window</option>
                  <option value="Testing">Testing</option>
                  <option value="Deployment">Deployment</option>
                  <option value="Approval">Approval</option>
                  <option value="Launch">Launch</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              {/* Insert Position */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Insert Position *
                </label>
                <select
                  value={String(insertPosition)}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'start' || value === 'end') {
                      setInsertPosition(value);
                    } else {
                      setInsertPosition(parseInt(value));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm bg-white dark:bg-gray-950 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="start">At the beginning</option>
                  {phases.map((phase, index) => (
                    <option key={phase.id} value={String(index + 1)}>
                      After {phase.name}
                    </option>
                  ))}
                  <option value="end">At the end</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Duration (days) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={newPhase.duration || ''}
                  onChange={(e) => setNewPhase(prev => ({ 
                    ...prev, 
                    duration: parseInt(e.target.value) || undefined 
                  }))}
                  placeholder="Number of days"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm bg-white dark:bg-gray-950 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Work Allowed */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="work-allowed"
                  checked={newPhase.allowsWork || false}
                  onChange={(e) => setNewPhase(prev => ({ 
                    ...prev, 
                    allowsWork: e.target.checked 
                  }))}
                  className="rounded border-gray-300 dark:border-gray-700 text-primary focus:ring-primary"
                />
                <label htmlFor="work-allowed" className="text-sm text-foreground">
                  Allow development work during this phase
                </label>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-900/40 rounded-xl p-3 shadow-sm">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Cannot add phase:
                  </p>
                  <ul className="text-xs text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
                    {validationErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview Impact */}
              {newPhase.name && newPhase.duration && validationErrors.length === 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-900/40 rounded-xl p-3 shadow-sm">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Impact:</strong> Adding "{newPhase.name}" ({newPhase.duration} days) will{' '}
                    {calculateShiftImpact(phases, insertPosition, newPhase.duration)}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAddPhase(false);
                    setValidationErrors([]);
                    setNewPhase({ name: '', type: 'Custom', allowsWork: false, duration: undefined });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium text-foreground bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPhase}
                  disabled={!newPhase.name || !newPhase.type || !newPhase.duration}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                >
                  Add Phase
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Phase Count and Warnings */}
      {phases.length > 0 && (
        <div className="text-xs text-muted-foreground flex items-center gap-3">
          <span>
            {phases.length} phase{phases.length !== 1 ? 's' : ''} configured
          </span>
          {!phases.some(p => p.allowsWork) && (
            <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="w-3.5 h-3.5" />
              No Dev Window defined
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewStep({
  state,
  products,
}: {
  state: WizardState;
  products: Product[];
}) {
  const product = products.find(p => p.id === state.releaseData.productId);
  const { name, startDate, endDate } = state.releaseData;
  const { enabled: sprintsEnabled, sprints } = state.sprintData;
  const { phases } = state.phaseData;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Review & Create</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Review your release configuration before creating.
        </p>
      </div>

      <div className="space-y-4">
        {/* Release Details */}
        <div className="p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Release Details</h4>
          <dl className="space-y-2">
            <div className="flex justify-between text-sm">
              <dt className="text-slate-600 dark:text-slate-400">Product:</dt>
              <dd className="font-medium text-slate-900 dark:text-white">{product?.name}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-slate-600 dark:text-slate-400">Release Name:</dt>
              <dd className="font-medium text-slate-900 dark:text-white">{name}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-slate-600 dark:text-slate-400">Date Range:</dt>
              <dd className="font-medium text-slate-900 dark:text-white">
                {new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - {new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </dd>
            </div>
          </dl>
        </div>

        {/* Sprints */}
        {sprintsEnabled && sprints.length > 0 && (
          <div className="p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Sprints ({sprints.length})
            </h4>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {sprints.length} sprint{sprints.length !== 1 ? 's' : ''} configured
            </div>
          </div>
        )}

        {/* Phases */}
        <div className="p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
            Phases ({phases.length})
          </h4>
          {phases.length > 0 ? (
            <div className="space-y-2">
              {phases.map((phase) => (
                <div key={phase.id} className="flex justify-between text-xs">
                  <span className="text-slate-900 dark:text-white font-medium">{phase.name}</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {phase.startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {phase.endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-600 dark:text-slate-400">No phases configured</div>
          )}
        </div>

        {/* Success Message */}
        <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl shadow-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Ready to Create
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Click "Create Release" to finalize your release with {phases.length} phase{phases.length !== 1 ? 's' : ''} 
                {sprintsEnabled && sprints.length > 0 && ` and ${sprints.length} sprint${sprints.length !== 1 ? 's' : ''}`}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
