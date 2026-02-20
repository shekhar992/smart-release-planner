import { useState, useMemo } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Calendar, Zap, CheckCircle2, AlertCircle, Plus, Trash2, Download, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { nanoid } from 'nanoid';
import type { Product, Sprint, Phase, Ticket, PhaseType } from '../data/mockData';
import { DatePicker } from './DatePicker';
import { PhaseTimelinePreview } from './PhaseTimelinePreview';
import { PHASE_TEMPLATES, calculatePhaseDates, recalculateCascadingDates } from '../lib/phaseTemplates';
import { parseCSV, validateAndTransformCSV } from '../lib/csvParser';
import { ticketImportMapping } from '../lib/importMappings';

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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {flow === 'smart' ? (
                <Sparkles className="w-5 h-5 text-primary" />
              ) : (
                <Calendar className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {flow === 'smart' ? 'Smart Release Creation' : 'Manual Release Creation'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Step {wizardState.currentStepIndex + 1} of {steps.length}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
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
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={isFirstStep}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {!isLastStep ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
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
    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center flex-1">
            {/* Step circle */}
            <div
              className={`
                flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold transition-all
                ${
                  index < currentStepIndex
                    ? 'border-green-500 bg-green-500 text-white'
                    : index === currentStepIndex
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-300 dark:border-gray-700 bg-background text-muted-foreground'
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
                className={`text-xs font-medium truncate ${
                  index <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {getStepLabel(step)}
              </div>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 transition-colors ${
                  index < currentStepIndex ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
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
        <h3 className="text-lg font-semibold text-foreground mb-2">Release Details</h3>
        <p className="text-sm text-muted-foreground">
          Configure the basic information for your release.
        </p>
      </div>

      {errors && errors.length > 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              {errors.map((error, i) => (
                <p key={i} className="text-xs text-red-700 dark:text-red-400">
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
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Product
            </label>
            <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-foreground">
              {selectedProduct?.name || 'Unknown Product'}
            </div>
          </div>
        ) : products.length > 1 ? (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              value={productId}
              onChange={(e) => onChange({ productId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Release Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g., Q1 2026 Release"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
        <h3 className="text-lg font-semibold text-foreground mb-2">Sprint Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Define sprint cadence for your release (optional).
        </p>
      </div>

      {errors && errors.length > 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              {errors.map((error, i) => (
                <p key={i} className="text-xs text-red-700 dark:text-red-400">
                  {error}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Enable/Disable Sprints */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onChange({ enabled: e.target.checked, sprints: e.target.checked ? generatedSprints : [] })}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground">
              Enable Sprint Planning
            </label>
            <p className="text-xs text-muted-foreground">
              Automatically divide release into fixed-length sprints
            </p>
          </div>
        </div>

        {enabled && (
          <>
            {/* Sprint Duration */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sprint Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[7, 14, 21].map((days) => (
                  <button
                    key={days}
                    onClick={() => onChange({ duration: days })}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      duration === days
                        ? 'bg-primary text-white border-primary'
                        : 'bg-background text-foreground border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {days / 7} week{days > 7 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Sprint Preview */}
            {generatedSprints.length > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
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
    
    // Convert parsed tickets to Ticket format - timeline canvas engine will assign id, startDate, endDate
    // Use release start date as placeholder for dates (timeline canvas will overwrite with actual schedule)
    const placeholderStartDate = new Date(state.releaseData.startDate);
    
    const tickets: Ticket[] = result.data.map((ticket) => {
      const effortDays = ticket.effortDays ?? ticket.storyPoints ?? 1;
      
      // Calculate placeholder end date based on effort (startDate + effortDays in milliseconds)
      const ticketStartDate = ticket.startDate || placeholderStartDate;
      const ticketEndDate = ticket.endDate || new Date(ticketStartDate.getTime() + (effortDays * 24 * 60 * 60 * 1000));
      
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
        <h3 className="text-lg font-semibold text-foreground mb-2">Upload Tickets</h3>
        <p className="text-sm text-muted-foreground">
          Upload CSV file with ticket data for AI-powered scheduling.
        </p>
      </div>

      {errors && errors.length > 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              {errors.map((error, i) => (
                <p key={i} className="text-xs text-red-700 dark:text-red-400">
                  {error}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Capacity Overview (PROMINENT) */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 
        border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h4 className="text-base font-semibold mb-4 flex items-center gap-2 text-foreground">
          <span className="text-2xl">📊</span>
          Available Development Capacity
        </h4>

        {devWindowCapacity.warning ? (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg p-4">
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
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {devWindowCapacity.totalDays}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Dev Window Days
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {teamSize}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Team Members
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {devWindowCapacity.totalCapacity}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Total Person-Days
                </div>
              </div>
            </div>

            {/* Dev Window breakdown */}
            <div className="mt-4 text-xs text-muted-foreground bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-800">
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
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary border border-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Sample CSV (29 tickets)
        </button>
      </div>

      {/* CSV Upload Area */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-primary transition-colors">
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
          <p className="text-sm font-medium text-foreground">Click to upload CSV file</p>
          <p className="text-xs text-muted-foreground mt-1">
            or drag and drop your tickets.csv file here
          </p>
          <p className="text-xs text-muted-foreground mt-3 px-4">
            Required: title, assignedTo, effortDays
          </p>
          <p className="text-xs text-muted-foreground px-4">
            Optional: epic/feature, priority, description
          </p>
        </label>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg p-4">
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
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-foreground">
                {parsedTickets.length} ticket{parsedTickets.length !== 1 ? 's' : ''} parsed successfully
              </span>
            </div>
            {fileName && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {fileName}
              </span>
            )}
          </div>

          {/* Feature Groupings */}
          {state.uploadData?.featureGroups && Object.keys(state.uploadData.featureGroups).length > 0 && (
            <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950/20 border-b border-gray-200 dark:border-gray-800">
              <p className="text-xs font-medium text-foreground mb-2">Features to be created:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(state.uploadData.featureGroups).map(([name, count]) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/40"
                  >
                    <span className="text-green-500 text-[9px]">NEW</span>
                    {name}
                    <span className="text-gray-400 font-normal">({count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="max-h-[280px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-muted-foreground font-medium">Feature</th>
                  <th className="text-left px-3 py-2 text-muted-foreground font-medium">Title</th>
                  <th className="text-left px-3 py-2 text-muted-foreground font-medium">Effort</th>
                  <th className="text-left px-3 py-2 text-muted-foreground font-medium">Assignee</th>
                  <th className="text-left px-3 py-2 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {parsedTickets.map((ticket, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-3 py-2 text-muted-foreground max-w-[110px] truncate">
                      {ticket.feature || 'Imported Tickets'}
                    </td>
                    <td className="px-3 py-2 text-foreground font-medium max-w-[200px] truncate">
                      {ticket.title}
                    </td>
                    <td className="px-3 py-2 text-foreground">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 inline-flex items-center justify-center text-[10px] font-medium">
                        {ticket.effortDays ?? ticket.storyPoints ?? 1}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground max-w-[100px] truncate">
                      {ticket.assignedTo || 'Unassigned'}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        ticket.status === 'completed' ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400' :
                        ticket.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
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
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/20 border-t border-amber-200 dark:border-amber-900/40">
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
        <div className={`border-2 rounded-lg p-5 ${
          isOverCapacity 
            ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-900/40' 
            : 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800'
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
            <div className="bg-white dark:bg-gray-900 rounded p-3 border border-gray-200 dark:border-gray-800">
              <span className="text-muted-foreground">Tickets Uploaded:</span>
              <span className="font-semibold ml-2 text-foreground">{uploadedTickets.length}</span>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded p-3 border border-gray-200 dark:border-gray-800">
              <span className="text-muted-foreground">Total Effort:</span>
              <span className="font-semibold ml-2 text-foreground">{totalTicketEffort} days</span>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded p-3 border border-gray-200 dark:border-gray-800">
              <span className="text-muted-foreground">Available Capacity:</span>
              <span className="font-semibold ml-2 text-foreground">{devWindowCapacity.totalCapacity} days</span>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded p-3 border border-gray-200 dark:border-gray-800">
              <span className="text-muted-foreground">Utilization:</span>
              <span className={`font-semibold ml-2 ${
                isOverCapacity ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {capacityUtilization.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Uploaded Tickets Table */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 mb-4">
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
            <div className="bg-red-100 dark:bg-red-950/30 border border-red-300 dark:border-red-900/40 rounded-lg p-3">
              <p className="text-xs text-red-800 dark:text-red-300">
                <strong>⚠️ Warning:</strong> Ticket effort exceeds Dev Window capacity by{' '}
                <strong>{(totalTicketEffort - devWindowCapacity.totalCapacity).toFixed(1)} days</strong>. 
                Some tickets may be scheduled outside the Dev Window or remain unscheduled. 
                Consider extending the Dev Window, reducing scope, or increasing team size.
              </p>
            </div>
          )}

          {!isOverCapacity && capacityUtilization > 80 && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-300 dark:border-yellow-900/40 rounded-lg p-3">
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
        <h3 className="text-lg font-semibold text-foreground mb-2">Phase Setup</h3>
        <p className="text-sm text-muted-foreground">
          Configure release phases for better timeline management.
        </p>
      </div>

      {/* Smart Release Helper Text */}
      {state.flow === 'smart' && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
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
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              {errors.map((error, i) => (
                <p key={i} className="text-xs text-red-700 dark:text-red-400">
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
            className={`p-4 rounded-lg border-2 transition-colors ${
              approach === 'template'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 dark:border-gray-800 hover:border-primary/50'
            }`}
          >
            <div className="text-sm font-medium text-foreground mb-1">Use Template</div>
            <div className="text-xs text-muted-foreground">Choose from predefined phase structures</div>
          </button>

          <button
            onClick={() => onChange({ approach: 'custom', phases: [] })}
            className={`p-4 rounded-lg border-2 transition-colors ${
              approach === 'custom'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 dark:border-gray-800 hover:border-primary/50'
            }`}
          >
            <div className="text-sm font-medium text-foreground mb-1">Custom</div>
            <div className="text-xs text-muted-foreground">Build your own phase structure</div>
          </button>

          <button
            onClick={() => onChange({ approach: 'skip', phases: [] })}
            className={`p-4 rounded-lg border-2 transition-colors ${
              approach === 'skip'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 dark:border-gray-800 hover:border-primary/50'
            }`}
          >
            <div className="text-sm font-medium text-foreground mb-1">Skip</div>
            <div className="text-xs text-muted-foreground">Continue without phases</div>
          </button>
        </div>
      )}

      {/* Template Selection */}
      {approach === 'template' && !templateId && phases.length === 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Select Template</label>
          <div className="grid grid-cols-2 gap-3">
            {PHASE_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                className="text-left p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary transition-colors"
              >
                <div className="text-sm font-medium text-foreground mb-1">{template.name}</div>
                <div className="text-xs text-muted-foreground">{template.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Phase Review Table */}
      {phases.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Review Phases ({phases.length})
            </label>
            {templateId && (
              <button
                onClick={() => onChange({ templateId: null, approach: 'template', phases: [] })}
                className="text-xs text-primary hover:text-primary/80"
              >
                Change Template
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="text-left py-3 px-3 font-semibold">Phase Name</th>
                  <th className="text-left py-3 px-2 font-semibold">Type</th>
                  <th className="text-left py-3 px-2 font-semibold">Start Date</th>
                  <th className="text-left py-3 px-2 font-semibold">End Date</th>
                  <th className="text-left py-3 px-2 font-semibold">Duration</th>
                  <th className="text-left py-3 px-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
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
                        value={phase.endDate.toISOString().split('T')[0]}
                        onChange={(e) => handlePhaseEndDateChange(index, new Date(e.target.value))}
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
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
          {!showAddPhase ? (
            <button
              onClick={() => setShowAddPhase(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-sm font-medium text-muted-foreground hover:text-primary"
            >
              <Plus className="w-4 h-4" />
              Add Custom Phase
            </button>
          ) : (
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Add New Phase</h4>
                <button
                  onClick={() => {
                    setShowAddPhase(false);
                    setValidationErrors([]);
                    setNewPhase({ name: '', type: 'Custom', allowsWork: false, duration: undefined });
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Phase Name */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Phase Name *
                </label>
                <input
                  type="text"
                  value={newPhase.name}
                  onChange={(e) => setNewPhase(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Code Freeze, QA Testing"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm bg-white dark:bg-gray-950 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Phase Type */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
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
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm bg-white dark:bg-gray-950 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg p-3">
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
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-lg p-3">
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
        <h3 className="text-lg font-semibold text-foreground mb-2">Review & Create</h3>
        <p className="text-sm text-muted-foreground">
          Review your release configuration before creating.
        </p>
      </div>

      <div className="space-y-4">
        {/* Release Details */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="text-sm font-semibold text-foreground mb-3">Release Details</h4>
          <dl className="space-y-2">
            <div className="flex justify-between text-sm">
              <dt className="text-muted-foreground">Product:</dt>
              <dd className="font-medium text-foreground">{product?.name}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-muted-foreground">Release Name:</dt>
              <dd className="font-medium text-foreground">{name}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-muted-foreground">Date Range:</dt>
              <dd className="font-medium text-foreground">
                {new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - {new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </dd>
            </div>
          </dl>
        </div>

        {/* Sprints */}
        {sprintsEnabled && sprints.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Sprints ({sprints.length})
            </h4>
            <div className="text-xs text-muted-foreground">
              {sprints.length} sprint{sprints.length !== 1 ? 's' : ''} configured
            </div>
          </div>
        )}

        {/* Phases */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Phases ({phases.length})
          </h4>
          {phases.length > 0 ? (
            <div className="space-y-2">
              {phases.map((phase) => (
                <div key={phase.id} className="flex justify-between text-xs">
                  <span className="text-foreground font-medium">{phase.name}</span>
                  <span className="text-muted-foreground">
                    {phase.startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {phase.endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No phases configured</div>
          )}
        </div>

        {/* Success Message */}
        <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 rounded-lg">
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
