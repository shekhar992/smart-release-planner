import { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, AlertTriangle, CheckCircle2, Download, Table2, User } from 'lucide-react';
import { Release, Ticket, TeamMember, storyPointsToDays } from '../data/mockData';
import { parseCSV, validateAndTransformCSV } from '../lib/csvParser';
import { ticketImportMapping } from '../lib/importMappings';
import { autoAssignTickets } from '../lib/autoAssignmentService';
import * as XLSX from 'xlsx';
import { cn } from './ui/utils';

interface BulkTicketImportModalProps {
  release: Release;
  teamMembers: TeamMember[];
  onClose: () => void;
  onAddFeature: (name: string) => string;
  onAddTicket: (featureId: string, ticket: Omit<Ticket, 'id'>) => void;
}

interface ParsedTicketRow {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: 'planned' | 'in-progress' | 'completed';
  storyPoints: number;
  assignedTo: string;
  feature?: string;
  requiredRole?: 'Frontend' | 'Backend' | 'Fullstack' | 'QA' | 'Designer' | 'DataEngineer' | 'iOS' | 'Android';
  blockedBy?: string[];
}

type Step = 'upload' | 'preview';

export function BulkTicketImportModal({
  release,
  teamMembers,
  onClose,
  onAddFeature,
  onAddTicket
}: BulkTicketImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File state
  const [fileName, setFileName] = useState('');
  const [parsedTickets, setParsedTickets] = useState<ParsedTicketRow[]>([]);
  const [parseErrors, setParseErrors] = useState<{ row: number; field: string; message: string }[]>([]);
  const [importComplete, setImportComplete] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [createdFeatures, setCreatedFeatures] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // ----- File parsing -----

  const processFile = (file: File) => {
    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const csvString = XLSX.utils.sheet_to_csv(firstSheet);
        parseCSVContent(csvString);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        parseCSVContent(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const parseCSVContent = (content: string) => {
    try {
      const { headers, rows } = parseCSV(content);
      const result = validateAndTransformCSV<ParsedTicketRow>(headers, rows, ticketImportMapping);

      // Strip assignedTo errors — that field is optional, auto-assigned by role matching
      const blockingErrors = result.errors.filter(e => e.field !== 'assignedTo');

      // Normalize storyPoints: both 'effortDays' and 'storyPoints' CSV columns should populate
      // storyPoints. importMappings now maps both → storyPoints, but guard at runtime too.
      let parsedData: ParsedTicketRow[] = result.data.map(t => {
        const raw = t as ParsedTicketRow & { effortDays?: number };
        const sp = (raw.storyPoints > 0 ? raw.storyPoints : 0) || (raw.effortDays > 0 ? raw.effortDays : 0) || 3;
        return { ...raw, storyPoints: sp };
      });

      // If data is still empty (assignedTo was required before the fix and caused row drops),
      // do a direct lightweight parse
      if (parsedData.length === 0 && blockingErrors.length === 0) {
        const titleIdx = headers.findIndex(h => h.toLowerCase() === 'title');
        if (titleIdx >= 0) {
          const get = (row: string[], col: string) => {
            const i = headers.findIndex(h => h.toLowerCase() === col.toLowerCase());
            return i >= 0 ? (row[i] || '').trim() : '';
          };
          const releaseStart = release.startDate instanceof Date ? release.startDate : new Date(release.startDate);
          parsedData = rows
            .filter(row => get(row, 'title'))
            .map((row, idx) => {
              const sp = parseFloat(get(row, 'storypoints')) || parseFloat(get(row, 'effortdays')) || 3;
              const rawStatus = get(row, 'status');
              const rawStart = get(row, 'startdate');
              const rawEnd = get(row, 'enddate');
              const startDate = rawStart ? new Date(rawStart) : releaseStart;
              const endDate = rawEnd ? new Date(rawEnd) : new Date(startDate.getTime() + sp * 24 * 60 * 60 * 1000);
              return {
                id: `import-${idx}`,
                title: get(row, 'title'),
                description: get(row, 'description') || undefined,
                startDate,
                endDate,
                status: (['planned', 'in-progress', 'completed'].includes(rawStatus) ? rawStatus : 'planned') as ParsedTicketRow['status'],
                storyPoints: sp,
                assignedTo: get(row, 'assignedto'),
                feature: get(row, 'feature') || get(row, 'epic') || undefined,
                requiredRole: get(row, 'requiredrole') as ParsedTicketRow['requiredRole'] || undefined,
                blockedBy: get(row, 'blockedby') ? get(row, 'blockedby').split(',').map(s => s.trim()).filter(Boolean) : undefined,
              } as ParsedTicketRow;
            });
        }
      }

      // Apply auto-assignment at parse time so preview shows proposed assignments.
      // Guard against undefined/empty teamMembers and wrap in try-catch so a failure
      // here never blocks the preview from rendering.
      const safeTeamMembers = teamMembers || [];
      if (parsedData.length > 0 && safeTeamMembers.length > 0) {
        try {
          const ticketsForAssign = parsedData.map(t => ({
            id: t.id || `tmp-${Math.random()}`,
            title: t.title,
            description: t.description || '',
            startDate: t.startDate instanceof Date ? t.startDate : new Date(),
            endDate: t.endDate instanceof Date ? t.endDate : new Date(),
            status: t.status || 'planned' as const,
            effortDays: t.storyPoints || 1,
            storyPoints: t.storyPoints || 1,
            assignedTo: t.assignedTo || '',
            requiredRole: t.requiredRole,
            dependencies: {},
          }));
          const assigned = autoAssignTickets(ticketsForAssign, safeTeamMembers);
          parsedData = parsedData.map((t, i) => ({ ...t, assignedTo: assigned[i]?.assignedTo || t.assignedTo }));
        } catch {
          // Auto-assignment failed — preview still shows, assignment happens at import time
        }
      }

      setParsedTickets(parsedData);
      const warnings = [...blockingErrors];

      // Warn about tickets missing the feature column
      if (parsedData.length > 0) {
        const missingFeature = parsedData.filter(t => !t.feature || !t.feature.trim());
        if (missingFeature.length > 0 && missingFeature.length < parsedData.length) {
          missingFeature.forEach(t => {
            warnings.push({ row: 0, field: 'feature', value: t.title, message: `"${t.title}" has no feature — will use "Imported Tickets"` });
          });
        }
        setParseErrors(warnings);
        setStep('preview');
      } else {
        setParseErrors(warnings);
      }
    } catch (err) {
      setParseErrors([{ row: 0, field: 'file', value: null, message: `Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}` }]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  // ----- Import -----

  const handleImport = () => {
    if (isImporting) return;
    setIsImporting(true);
    let count = 0;
    const newFeatureNames: string[] = [];

    // Group tickets by feature name
    const ticketsByFeature = new Map<string, ParsedTicketRow[]>();
    for (const ticket of parsedTickets) {
      const featureKey = ticket.feature?.trim() || 'Imported Tickets';
      if (!ticketsByFeature.has(featureKey)) {
        ticketsByFeature.set(featureKey, []);
      }
      ticketsByFeature.get(featureKey)!.push(ticket);
    }

    ticketsByFeature.forEach((tickets, featureName) => {
      const existingFeature = release.features.find(
        f => f.name.toLowerCase() === featureName.toLowerCase()
      );
      let targetFeatureId: string;

      if (existingFeature) {
        targetFeatureId = existingFeature.id;
      } else {
        targetFeatureId = onAddFeature(featureName);
        newFeatureNames.push(featureName);
      }

      // Convert parsed tickets to Ticket format for auto-assignment
      const ticketData: Ticket[] = tickets.map(ticket => {
        const effortDays = storyPointsToDays(ticket.storyPoints, release.storyPointMapping);
        // Fall back to release window when CSV has no date columns
        const releaseStart = release.startDate instanceof Date ? release.startDate : new Date(release.startDate);
        const startDate = ticket.startDate instanceof Date && !isNaN(ticket.startDate.getTime())
          ? ticket.startDate
          : releaseStart;
        const endDate = ticket.endDate instanceof Date && !isNaN(ticket.endDate.getTime())
          ? ticket.endDate
          : new Date(startDate.getTime() + effortDays * 24 * 60 * 60 * 1000);
        return {
          id: `temp-${Date.now()}-${Math.random()}`,
          title: ticket.title,
          description: ticket.description || '',
          startDate,
          endDate,
          status: ticket.status,
          effortDays,
          storyPoints: ticket.storyPoints,
          assignedTo: ticket.assignedTo || '',
          requiredRole: ticket.requiredRole,
          dependencies: ticket.blockedBy && ticket.blockedBy.length > 0 
            ? { blockedBy: ticket.blockedBy } 
            : {},
        };
      });

      // Auto-assign tickets if assignedTo is empty/missing
      const assignedTickets = autoAssignTickets(ticketData, teamMembers);

      // Add tickets to release
      for (const ticket of assignedTickets) {
        onAddTicket(targetFeatureId, {
          title: ticket.title,
          description: ticket.description || undefined,
          startDate: ticket.startDate,
          endDate: ticket.endDate,
          status: ticket.status,
          effortDays: ticket.effortDays,
          storyPoints: ticket.storyPoints,
          assignedTo: ticket.assignedTo,
          requiredRole: ticket.requiredRole || undefined,
          dependencies: ticket.dependencies && Object.keys(ticket.dependencies).length > 0
            ? ticket.dependencies
            : undefined,
        });
        count++;
      }
    });

    setImportedCount(count);
    setCreatedFeatures(newFeatureNames);
    setImportComplete(true);
    setIsImporting(false);
  };

  const handleDownloadTemplate = () => {
    // Template with auto-assignment (assignedTo is empty)
    const templateAutoAssign = `title,epic,effortDays,priority,assignedTo,requiredRole,blockedBy
Configure AWS hosting services,Infra Setup,15,High,,Backend,
Configure AWS GenAI services,Infra Setup,10,High,,Backend,ticket-001
Configure AWS storage services,Infra Setup,5,High,,Backend,
Configure Environments and Deployments,Infra Setup,10,High,,Backend,
Agents codebase setup,Code Setup,10,High,,Fullstack,
Backend setup (BFF layer),Code Setup,10,High,,Backend,
Develop framework to build and orchestrate multiple agents,Agentic AI Foundation,5,High,,Backend,
Develop data source connectors,Agentic AI Foundation,10,High,,Backend,
Develop tools (or MCP server) for external operations,Agentic AI Foundation,15,High,,Backend,
Setup memory layer,Agentic AI Foundation,10,High,,Backend,
Setup knowledge bases,Agentic AI Foundation,10,High,,Backend,
SSO Login,Authentication,5,High,,Backend
SSO token verification,Authentication,5,High,,Backend
Role Based access control and User groups,Account Management,15,High,,Backend
Brand Library Creation,Brand Library,10,High,,Backend
Document management,Brand Library,10,High,,Backend
Knowledge Base - Ingestion Workflow,Brand Library,25,High,,Backend
Ability to create and manage content collection in brand library,Content Collection,5,High,,Backend
Agents to identify relevant documents from brand library,Content Collection,5,High,,Backend
Agents to generate text content based on context and template,Content Creation,10,High,,Backend
Agentic workflow to draft content with given inputs,Content Creation,10,High,,Backend
Workflows to modify content draft,Content Creation,10,High,,Backend
Fine-tune creation agents for specific channel templates,Content Creation,15,High,,Backend
Dynamic Templates with X dynamic components,Templates,5,High,,Backend
Agentic workflows to localize the content draft (translation + rules),Content Localization,15,High,,Backend
Workflows to modify localized content,Content Localization,5,High,,Backend
Fine-tune localization agents for specific geographies,Content Localization,10,High,,Backend
UI Based Form to collect key pieces of information that will be captured and stored in our DD. This will be used for the master prompt,Master Story,15,High,,Backend
Country roll-out for Global + Germany Italy,Country Roll out,15,High,,Backend`;

    // Template with manual assignments
    const templateWithAssignments = `title,epic,effortDays,priority,assignedTo,requiredRole,blockedBy
Configure AWS hosting services,Infra Setup,15,High,AI Tech Lead,Backend,
Configure AWS GenAI services,Infra Setup,10,High,AI Tech Lead,Backend,ticket-001
Configure AWS storage services,Infra Setup,5,High,AI Tech Lead,Backend,
Configure Environments and Deployments,Infra Setup,10,High,AI Tech Lead,Backend,
Agents codebase setup,Code Setup,10,High,AI Tech Lead,Fullstack,
Backend setup (BFF layer),Code Setup,10,High,AI Tech Lead,Backend,
Develop framework to build and orchestrate multiple agents,Agentic AI Foundation,5,High,AI Tech Backend 1,Backend,
Develop data source connectors,Agentic AI Foundation,10,High,AI Tech Backend 1,Backend,
Develop tools (or MCP server) for external operations,Agentic AI Foundation,15,High,AI Tech Backend 1,Backend,
Setup memory layer,Agentic AI Foundation,10,High,AI Tech Backend 1,Backend,
Setup knowledge bases,Agentic AI Foundation,10,High,AI Tech Backend 1,Backend,
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

    // Download both templates
    const downloadFile = (content: string, filename: string) => {
      const blob = new Blob([content], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };

    // Download auto-assign template (primary)
    downloadFile(templateAutoAssign, 'tickets_template_auto_assign.csv');
    
    // Download manual assignment template (optional, after 500ms)
    setTimeout(() => {
      downloadFile(templateWithAssignments, 'tickets_template_manual_assign.csv');
    }, 500);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      planned: 'bg-gray-100 text-gray-700',
      'in-progress': 'bg-blue-50 text-blue-700',
      completed: 'bg-green-50 text-green-700',
    };
    const labels: Record<string, string> = {
      planned: 'Planned',
      'in-progress': 'In Progress',
      completed: 'Completed',
    };
    return (
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[status] || styles.planned}`}>
        {labels[status] || status}
      </span>
    );
  };

  // Group preview tickets by feature for summary
  const featureGroups = parsedTickets.reduce<Record<string, number>>((acc, t) => {
    const name = t.feature?.trim() || 'Imported Tickets';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50">
          <div className="flex items-center gap-3">
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {importComplete ? 'Import Complete' : step === 'upload' ? 'Import Tickets' : 'Preview & Import'}
            </h3>
            {/* Step indicator */}
            {!importComplete && (
              <div className="flex items-center gap-1">
                <div className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  step === 'upload' || step === 'preview' ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                )} />
                <div className="w-4 h-px bg-slate-300 dark:bg-slate-700" />
                <div className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  step === 'preview' ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                )} />
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200">
            <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Import Complete ── */}
          {importComplete && (
            <div className="px-6 py-10 text-center space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Successfully imported {importedCount} ticket{importedCount !== 1 ? 's' : ''}
                </h4>
                {createdFeatures.length > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Created {createdFeatures.length} new feature{createdFeatures.length !== 1 ? 's' : ''}:{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{createdFeatures.join(', ')}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 1: Upload ── */}
          {!importComplete && step === 'upload' && (
            <div className="px-6 py-5 space-y-4">
              {/* Info banner */}
              <div className="flex items-start gap-3 px-3.5 py-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <Table2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                  <p className="font-semibold mb-1">Download sample CSV templates to get started quickly</p>
                  <p>
                    Two versions available: <span className="font-semibold">Auto-assign</span> (leave <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded text-[11px]">assignedTo</code> empty — tickets are assigned by role matching) and{' '}
                    <span className="font-semibold">Manual</span> (pre-filled names you can edit).
                    Use a <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded text-[11px]">feature</code> or <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded text-[11px]">epic</code> column to group tickets into features.
                  </p>
                </div>
              </div>

              {/* Required / optional columns */}
              <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Supported columns:</span>{' '}
                <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px]">title</code> <span className="text-slate-400">(required)</span>,{' '}
                <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px]">assignedTo</code> <span className="text-slate-400">(optional — auto-assigned by role if empty)</span>,{' '}
                <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px]">requiredRole, epic, effortDays, storyPoints, priority, feature, status, startDate, endDate, description, blockedBy</code>
              </div>

              {/* Upload area */}
              <div
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
                  fileName 
                    ? 'border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20' 
                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                  const file = e.dataTransfer.files?.[0];
                  if (file) processFile(file);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {fileName ? (
                  <div className="space-y-2">
                    <FileText className="w-8 h-8 text-blue-500 dark:text-blue-400 mx-auto" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{fileName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Click to choose a different file</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Drop file here or click to browse</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Supports <strong>.csv</strong> and <strong>.xlsx</strong> files</p>
                  </div>
                 )}
              </div>

              {/* Download template */}
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download CSV template
              </button>

              {/* Parse errors — only if no valid tickets at all */}
              {parseErrors.length > 0 && parsedTickets.length === 0 && (
                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />
                    <span className="text-xs font-semibold text-red-800 dark:text-red-200">
                      {parseErrors.length} error{parseErrors.length !== 1 ? 's' : ''} found
                    </span>
                  </div>
                  <div className="max-h-[120px] overflow-y-auto space-y-1">
                    {parseErrors.slice(0, 10).map((err, i) => (
                      <p key={i} className="text-[11px] text-red-700">
                        Row {err.row}: {err.message} ({err.field})
                      </p>
                    ))}
                    {parseErrors.length > 10 && (
                      <p className="text-[11px] text-red-600 font-medium">
                        ...and {parseErrors.length - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Preview ── */}
          {!importComplete && step === 'preview' && (
            <div className="px-6 py-5 space-y-4">
              {/* Summary row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    {parsedTickets.length} ticket{parsedTickets.length !== 1 ? 's' : ''} across{' '}
                    {Object.keys(featureGroups).length} feature{Object.keys(featureGroups).length !== 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setStep('upload');
                    setParsedTickets([]);
                    setParseErrors([]);
                    setFileName('');
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  Change file
                </button>
              </div>

              {/* Feature breakdown pills */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(featureGroups).map(([name, count]) => {
                  const exists = release.features.some(f => f.name.toLowerCase() === name.toLowerCase());
                  return (
                    <span
                      key={name}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold',
                        exists
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          : 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      )}
                    >
                      {!exists && <span className="text-emerald-500 dark:text-emerald-400 text-[9px]">NEW</span>}
                      {name}
                      <span className="text-slate-400 dark:text-slate-500 font-normal">({count})</span>
                    </span>
                  );
                })}
              </div>

              {/* Errors / warnings */}
              {parseErrors.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <span className="text-[11px] text-amber-800 dark:text-amber-200 font-semibold">
                    {parseErrors.length} warning{parseErrors.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Ticket cards — same style as PRD import preview */}
              <div className="max-h-[340px] overflow-y-auto space-y-2.5 pr-0.5">
                {parsedTickets.map((ticket, i) => (
                  <div
                    key={i}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">#{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
                            {ticket.title}
                          </h3>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                            {ticket.feature || 'Imported Tickets'}
                          </span>
                        </div>
                        {ticket.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">{ticket.description}</p>
                        )}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-semibold">
                            {ticket.storyPoints} SP
                          </span>
                          {ticket.requiredRole && (
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-[10px] font-semibold">
                              {ticket.requiredRole}
                            </span>
                          )}
                          {ticket.assignedTo ? (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-[10px] font-semibold flex items-center gap-1">
                              <User className="w-2.5 h-2.5" />
                              {ticket.assignedTo}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 rounded-full text-[10px]">
                              Unassigned
                            </span>
                          )}
                          {ticket.status && ticket.status !== 'planned' && getStatusBadge(ticket.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Expandable warnings detail */}
              {parseErrors.length > 0 && (
                <details className="group">
                  <summary className="text-[11px] text-amber-700 dark:text-amber-300 cursor-pointer hover:text-amber-900 dark:hover:text-amber-100 font-medium">
                    Show {parseErrors.length} warning{parseErrors.length !== 1 ? 's' : ''}
                  </summary>
                  <div className="mt-2 max-h-[100px] overflow-y-auto space-y-1 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 rounded-xl p-2.5">
                    {parseErrors.map((err, i) => (
                      <p key={i} className="text-[11px] text-amber-800 dark:text-amber-200">
                        Row {err.row}: {err.message} ({err.field})
                      </p>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl">
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Press Esc to close</span>
          <div className="flex items-center gap-2">
            {importComplete ? (
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/30"
              >
                Done
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all duration-200"
                >
                  Cancel
                </button>
                {step === 'preview' && (
                  <button
                    onClick={handleImport}
                    disabled={parsedTickets.length === 0 || isImporting}
                    className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
                  >
                    Import {parsedTickets.length} Ticket{parsedTickets.length !== 1 ? 's' : ''}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
