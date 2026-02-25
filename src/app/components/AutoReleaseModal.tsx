import { useState, useEffect, useRef } from 'react';
import { X, BarChart3, Check, Download, AlertCircle, Upload } from 'lucide-react';
import { nanoid } from 'nanoid';
import { buildReleasePlanSafe } from '../../domain/planningEngine';
import type { TicketInput, ReleaseConfig, ReleasePlan } from '../../domain/types';
import { parseCSV } from '../lib/csvParser';
import { mapReleasePlanToAppRelease } from '../../domain/adapters/domainToAppMapper';
import type { Product, Phase } from '../data/mockData';
import { loadProducts, saveProducts, loadTeamMembersByProduct } from '../lib/localStorage';
import { savePhases } from '../lib/localStorage';
import { DatePicker } from './DatePicker';
import { toLocalDateString, parseLocalDate } from '../lib/dateUtils';
import { FeasibilityMeter } from './FeasibilityMeter';
import { ReviewStatsGrid } from './ReviewStatsGrid';
// COMMENTED OUT: DataInsightsPanel - Feature removed per user request
// import { DataInsightsPanel } from './DataInsightsPanel';
import { CsvPreviewTable } from './CsvPreviewTable';
import { PhaseSetupModal } from './PhaseSetupModal';
import { generatePlanningInsights } from '../lib/planningAdvisor';
import { detectEnhancedConflicts } from '../lib/conflictDetection';
import { cn } from './ui/utils';

interface AutoReleaseModalProps {
  product: Product;
  onClose: () => void;
}

export function AutoReleaseModal({ product, onClose }: AutoReleaseModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [releaseName, setReleaseName] = useState('AI Generated Release');
  const [releaseStart, setReleaseStart] = useState(new Date());
  const [releaseEnd, setReleaseEnd] = useState(
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
  );
  const [sprintLengthWeeks, setSprintLengthWeeks] = useState(2);
  const [csvInput, setCsvInput] = useState('');

  const [plannerPreview, setPlannerPreview] = useState<ReleasePlan | null>(null);
  const [parsedTickets, setParsedTickets] = useState<TicketInput[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCsvInput, setShowCsvInput] = useState(false);
  
  // Assignment analytics (display only, doesn't affect capacity)
  const [uniqueAssignedDevelopers, setUniqueAssignedDevelopers] = useState<string[]>([]);
  const [ticketsWithoutAssignment, setTicketsWithoutAssignment] = useState(0);

  // Phase setup state
  const [showPhaseSetup, setShowPhaseSetup] = useState(false);
  const [pendingReleaseId, setPendingReleaseId] = useState<string>('');

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-parse CSV when input changes
  useEffect(() => {
    if (!csvInput.trim()) {
      setParsedTickets(null);
      setError(null);
      setWarning(null);
      return;
    }

    try {
      const { headers, rows } = parseCSV(csvInput);
      
      if (rows.length === 0) {
        setParsedTickets(null);
        return;
      }

      // Find column indices
      const titleIdx = headers.findIndex(h => h.toLowerCase() === 'title');
      const epicIdx = headers.findIndex(h => h.toLowerCase() === 'epic');
      const effortIdx = headers.findIndex(h => h.toLowerCase().includes('effort'));
      const priorityIdx = headers.findIndex(h => h.toLowerCase() === 'priority');
      const assignedIdx = headers.findIndex(h => h.toLowerCase() === 'assigned' || h.toLowerCase() === 'assignedto');

      if (titleIdx === -1 || effortIdx === -1) {
        setParsedTickets(null);
        return;
      }

      // Parse rows into TicketInput format
      const tickets: TicketInput[] = rows.map((row, idx) => {
        const effortValue = parseFloat(row[effortIdx]);
        const priorityValue = parsePriority(priorityIdx !== -1 ? row[priorityIdx] : undefined);
        const assignedToRaw = assignedIdx !== -1 && row[assignedIdx] ? row[assignedIdx].trim() : undefined;

        return {
          id: crypto.randomUUID(),
          title: row[titleIdx] || `Ticket ${idx + 1}`,
          epic: epicIdx !== -1 && row[epicIdx] ? row[epicIdx] : 'General',
          effortDays: isNaN(effortValue) ? 1 : effortValue,
          priority: priorityValue,
          assignedToRaw
        };
      });

      setParsedTickets(tickets);
      setError(null);
    } catch (err) {
      setParsedTickets(null);
    }
  }, [csvInput]);

  // Auto-update assignment analytics when parsedTickets changes
  useEffect(() => {
    if (!parsedTickets) {
      setUniqueAssignedDevelopers([]);
      setTicketsWithoutAssignment(0);
      return;
    }

    const uniqueAssigned = Array.from(
      new Set(
        parsedTickets
          .map(t => t.assignedToRaw?.trim())
          .filter(Boolean)
      )
    );
    
    const unassignedCount = parsedTickets.filter(
      t => !t.assignedToRaw || !t.assignedToRaw.trim()
    ).length;
    
    setUniqueAssignedDevelopers(uniqueAssigned as string[]);
    setTicketsWithoutAssignment(unassignedCount);
  }, [parsedTickets]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Helper: Parse priority value (supports text or numeric)
  const parsePriority = (value: string | undefined): number => {
    if (!value) return 3;
    
    const trimmed = value.trim().toLowerCase();
    
    // Map text priority to numeric
    const priorityMap: Record<string, number> = {
      'high': 1,
      'medium': 3,
      'low': 5
    };
    
    if (priorityMap[trimmed] !== undefined) {
      return priorityMap[trimmed];
    }
    
    // Try numeric parsing
    const numeric = parseInt(value);
    return isNaN(numeric) ? 3 : numeric;
  };

  // Download CSV Template
  const downloadCsvTemplate = () => {
    const csvContent = `title,epic,effortDays,priority,assignedTo
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

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'release_import_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle file upload
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setCsvInput(content);
      }
    };
    reader.readAsText(file);
  };

  const handleAnalyzeFeasibility = () => {
    setError(null);
    setWarning(null);
    
    if (!parsedTickets || parsedTickets.length === 0) {
      setError('Please provide valid CSV data with tickets');
      return;
    }

    try {
      // Check team members first
      const teamMembers = loadTeamMembersByProduct(product.id) || [];
      
      if (teamMembers.length === 0) {
        setError('No team members found. Please configure your team roster and PTO plan before generating a release.');
        return;
      }

      // Validate assignments against team roster
      const teamMemberNames = new Set(teamMembers.map(tm => tm.name));
      const unknownAssignments = new Set<string>();
      
      parsedTickets.forEach(ticket => {
        if (ticket.assignedToRaw && !teamMemberNames.has(ticket.assignedToRaw)) {
          unknownAssignments.add(ticket.assignedToRaw);
        }
      });

      if (unknownAssignments.size > 0) {
        const unknownList = Array.from(unknownAssignments);
        setWarning(`${unknownAssignments.size} unmatched assignment(s): ${unknownList.join(', ')}. These will be set to "Unassigned".`);
      }

      // Build release config
      const config: ReleaseConfig = {
        releaseStart: releaseStart,
        releaseEnd: releaseEnd,
        sprintLengthDays: sprintLengthWeeks * 7,
        numberOfDevelopers: teamMembers.length,
        holidays: [],
        ptoDates: []
      };

      // Call planner
      const result = buildReleasePlanSafe(parsedTickets, config);
      
      if (result.success === true) {
        setPlannerPreview(result.data);
        setStep(3); // Move to review step
      } else {
        setError(`Planning failed: ${result.error}`);
      }
    } catch (error) {
      setError('Failed to parse CSV. Please check the format.');
    }
  };

  const handleConfirmCreate = () => {
    if (!plannerPreview) return;
    // Generate release ID and show phase setup modal
    const releaseId = nanoid();
    setPendingReleaseId(releaseId);
    setShowPhaseSetup(true);
  };

  const handlePhaseSetupComplete = (phases: Phase[]) => {
    if (!plannerPreview || !pendingReleaseId) return;

    setIsCreating(true);

    try {
      // Load team members for assignment validation
      const teamMembers = loadTeamMembersByProduct(product.id) || [];
      
      // Map domain plan to app release (includes features, sprints, and validated assignments)
      const appRelease = mapReleasePlanToAppRelease(
        plannerPreview,
        releaseName,
        releaseStart,
        releaseEnd,
        teamMembers
      );

      // Use the pre-generated release ID
      appRelease.id = pendingReleaseId;

      // Add phases to the release
      appRelease.phases = phases;

      // Save phases to localStorage
      savePhases(appRelease.id, phases);

      // Load current products and add the new release
      const currentProducts = loadProducts() || [];
      if (currentProducts.length === 0) {
        setError('No products found. Please create a product first.');
        setIsCreating(false);
        return;
      }

      const updatedProducts = currentProducts.map(p => {
        if (p.id === product.id) {
          return { ...p, releases: [...p.releases, appRelease] };
        }
        return p;
      });

      // Save to localStorage
      saveProducts(updatedProducts);

      // Close modal
      onClose();
    } catch (error) {
      setError('Failed to create release. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Smart Release Flow</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">AI-powered sprint planning wizard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-700 flex items-center justify-center transition-all duration-200"
          >
            <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Step Ribbon */}
        <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {/* Step 1 */}
            <div className="flex items-center gap-3 flex-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200",
                step === 1 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : step > 1 
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              )}>
                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className="flex-1">
                <div className={cn(
                  "text-sm font-medium",
                  step === 1 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                )}>
                  Backlog
                </div>
              </div>
            </div>

            <div className="w-16 h-0.5 bg-slate-200 dark:bg-slate-700 mx-2" />

            {/* Step 2 */}
            <div className="flex items-center gap-3 flex-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200",
                step === 2 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : step > 2 
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              )}>
                {step > 2 ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <div className="flex-1">
                <div className={cn(
                  "text-sm font-medium",
                  step === 2 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                )}>
                  Strategy
                </div>
              </div>
            </div>

            <div className="w-16 h-0.5 bg-slate-200 dark:bg-slate-700 mx-2" />

            {/* Step 3 */}
            <div className="flex items-center gap-3 flex-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200",
                step === 3 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              )}>
                3
              </div>
              <div className="flex-1">
                <div className={cn(
                  "text-sm font-medium",
                  step === 3 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                )}>
                  Review
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Backlog */}
          {step === 1 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Import Your Backlog</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Download the CSV template, fill in your ticket data, and upload it below.
                </p>
              </div>

              {/* Info banner */}
              <div className="flex items-start gap-3 px-3.5 py-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm">
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                  <p className="font-semibold mb-1">Download a pre-filled template with 29 sample tickets</p>
                  <p>
                    Covers infrastructure setup, authentication, AI foundation, content creation, and localization workflows. 
                    Edit with your data and upload. Include{' '}
                    <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded text-[11px]">title</code>,{' '}
                    <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded text-[11px]">epic</code>,{' '}
                    <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded text-[11px]">effortDays</code>, and{' '}
                    <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded text-[11px]">priority</code> columns.
                  </p>
                </div>
              </div>

              {/* Download Template Button */}
              <div className="flex justify-center">
                <button
                  onClick={downloadCsvTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-200 shadow-lg shadow-blue-500/30"
                >
                  <Download className="w-4 h-4" />
                  Download CSV Template
                </button>
              </div>

              {/* Drag & Drop Upload Area */}
              <div
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-800/50"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file && file.name.endsWith('.csv')) {
                    handleFileUpload(file);
                  }
                }}
              >
                <Upload className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-500" />
                <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">Drag & Drop CSV Here</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">or click to browse</p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
              </div>

              {/* Toggle button for CSV paste option */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowCsvInput(!showCsvInput)}
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors underline underline-offset-2"
                >
                  {showCsvInput ? '− Hide CSV paste option' : '+ Or paste CSV directly'}
                </button>
              </div>

              {/* CSV Input Area - Collapsible */}
              {showCsvInput && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    CSV Input
                  </label>
                  <textarea
                    value={csvInput}
                    onChange={(e) => setCsvInput(e.target.value)}
                    placeholder="title,epic,effortDays,priority,assignedTo&#10;Feature A,Core,5,High,Sarah Chen&#10;Feature B,Core,3,Medium,Marcus Rivera&#10;Feature C,UI,8,Low,"
                    className="w-full h-48 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium">Priority:</span> High→1, Medium→3, Low→5 (or use numeric 1-5) · 
                    <span className="font-medium ml-2">Assigned:</span> Must match team roster names or leave empty
                  </p>
                </div>
              )}

              {/* Backlog Preview - Show dynamically when CSV is parsed */}
              {parsedTickets && parsedTickets.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Backlog Preview</label>
                  <CsvPreviewTable tickets={parsedTickets} />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Strategy */}
          {step === 2 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Configure Release Strategy</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Set your release parameters and team capacity.
                </p>
              </div>

              {/* Release Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Release Name</label>
                  <input
                    type="text"
                    value={releaseName}
                    onChange={(e) => setReleaseName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-slate-900 dark:text-white placeholder-slate-400"
                    placeholder="Q1 2026 Release"
                  />
                </div>
                
                <div>
                  <DatePicker
                    label="Start Date"
                    value={toLocalDateString(releaseStart)}
                    onChange={(dateStr) => setReleaseStart(parseLocalDate(dateStr))}
                  />
                </div>
                
                <div>
                  <DatePicker
                    label="End Date"
                    value={toLocalDateString(releaseEnd)}
                    onChange={(dateStr) => setReleaseEnd(parseLocalDate(dateStr))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Sprint Length</label>
                  <select
                    value={sprintLengthWeeks}
                    onChange={(e) => setSprintLengthWeeks(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-slate-900 dark:text-white"
                  >
                    <option value="1">1 Week</option>
                    <option value="2">2 Weeks</option>
                    <option value="3">3 Weeks</option>
                    <option value="4">4 Weeks</option>
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    Sprint Length: {sprintLengthWeeks} Week{sprintLengthWeeks !== 1 ? 's' : ''} ({sprintLengthWeeks * 7} Days)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && plannerPreview && (() => {
            const teamMembers = loadTeamMembersByProduct(product.id) || [];
            const totalTeamSize = teamMembers.length;
            const assignedDevsCount = uniqueAssignedDevelopers.length;

            // Generate AI Planning Insights
            // Only analyze scheduled tickets for conflicts (overflow tickets have no dates yet)
            const scheduledTicketsWithDates = plannerPreview.sprints.flatMap(sprint =>
              sprint.tickets.map(t => {
                // Calculate end date based on effort days
                const startDate = new Date(sprint.startDate);
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + t.effortDays - 1);
                
                return {
                  id: t.id,
                  title: t.title,
                  startDate,
                  endDate,
                  assignedTo: t.assignedToRaw || 'Unassigned',
                  storyPoints: t.effortDays,
                  status: 'planned' as const
                };
              })
            );
            
            const enhancedConflicts = detectEnhancedConflicts(
              scheduledTicketsWithDates,
              plannerPreview.sprints.map(s => ({
                id: s.name,
                startDate: s.startDate,
                endDate: s.endDate
              })),
              teamMembers
            );
            const aiInsights = generatePlanningInsights(
              plannerPreview,
              enhancedConflicts,
              totalTeamSize
            );

            return (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Review Plan & Confirm</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Release feasibility analysis complete
                  </p>
                </div>

                {/* Feasibility Meter */}
                <FeasibilityMeter percentage={plannerPreview.feasiblePercentage} />

                {/* Stats Grid */}
                <ReviewStatsGrid
                  backlogDays={plannerPreview.totalBacklogDays}
                  capacityDays={plannerPreview.totalCapacityDays}
                  overflowCount={plannerPreview.overflowTickets.length}
                  teamSize={totalTeamSize}
                  assignedCount={assignedDevsCount}
                  unassignedCount={ticketsWithoutAssignment}
                />

                {/* AI Planning Insights Panel */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 bg-gradient-to-br from-blue-50/50 to-violet-50/50 dark:from-blue-950/20 dark:to-violet-950/20 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="text-lg">🤖</span>
                      AI Planning Insights
                    </h4>
                    <span
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-full shadow-sm",
                        aiInsights.riskLevel === 'low'
                          ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : aiInsights.riskLevel === 'medium'
                          ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          : 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                      )}
                    >
                      {aiInsights.riskLevel === 'low' && '✓ Low Risk'}
                      {aiInsights.riskLevel === 'medium' && '⚠ Medium Risk'}
                      {aiInsights.riskLevel === 'high' && '⚠️ High Risk'}
                    </span>
                  </div>

                  {/* Assessment */}
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {aiInsights.sections.assessment}
                  </p>

                  {/* Impact */}
                  {aiInsights.sections.impact.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                        Impact
                      </h5>
                      <ul className="space-y-2">
                        {aiInsights.sections.impact.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <span className="text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
                            <span className="flex-1">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {aiInsights.sections.recommendations.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                        Recommendations
                      </h5>
                      <ul className="space-y-2">
                        {aiInsights.sections.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <span className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0">•</span>
                            <span className="flex-1">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      💡 These insights are advisory only. Review carefully before proceeding.
                    </p>
                  </div>
                </div>

                {/* COMMENTED OUT: Data Insights Panel - Feature removed per user request */}
                {/* {parsedTickets && (
                  <DataInsightsPanel
                    tickets={parsedTickets}
                    sprints={plannerPreview.sprints}
                    overflowTickets={plannerPreview.overflowTickets}
                  />
                )} */}
              </div>
            );
          })()}

          {/* Error Display */}
          {error && (
            <div className="max-w-3xl mx-auto mt-4">
              <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Configuration Required</div>
                    <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
                    
                    {error.includes('team members') && (
                      <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                        <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">Quick Start:</div>
                        <div className="flex gap-2">
                          <a
                            href="/sample-data/team_template.csv"
                            download
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/60 dark:bg-red-950/30 hover:bg-white dark:hover:bg-red-950/50 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 transition-colors shadow-sm"
                          >
                            <Download className="w-3 h-3" />
                            Team Roster Template
                          </a>
                          <a
                            href="/sample-data/pto_template.csv"
                            download
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/60 dark:bg-red-950/30 hover:bg-white dark:hover:bg-red-950/50 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 transition-colors shadow-sm"
                          >
                            <Download className="w-3 h-3" />
                            PTO Template
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning Display */}
          {warning && (
            <div className="max-w-3xl mx-auto mt-4 p-3 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl shadow-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-700 dark:text-amber-300">{warning}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl flex items-center justify-between">
          <button
            onClick={() => setStep((step - 1) as 1 | 2 | 3)}
            disabled={step === 1}
            className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Back
          </button>

          <div className="flex gap-2">
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={!parsedTickets || parsedTickets.length === 0}
                className="px-4 py-2 text-sm font-medium bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/30"
              >
                Next: Configure Strategy
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleAnalyzeFeasibility}
                className="px-4 py-2 text-sm font-medium bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30"
              >
                Analyze Feasibility
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleConfirmCreate}
                disabled={isCreating}
                className="px-4 py-2 text-sm font-medium bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-500/30"
              >
                {isCreating ? 'Creating...' : 'Confirm & Create Release'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Phase Setup Modal */}
      {showPhaseSetup && pendingReleaseId && (
        <PhaseSetupModal
          isOpen={true}
          onClose={() => setShowPhaseSetup(false)}
          releaseId={pendingReleaseId}
          releaseStartDate={releaseStart}
          releaseEndDate={releaseEnd}
          onConfirm={handlePhaseSetupComplete}
        />
      )}
    </div>
  );
}
