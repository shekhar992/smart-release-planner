import { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, AlertTriangle, CheckCircle2, Download, Table2 } from 'lucide-react';
import { Release, Ticket, storyPointsToDays } from '../data/mockData';
import { parseCSV, validateAndTransformCSV } from '../lib/csvParser';
import { ticketImportMapping } from '../lib/importMappings';
import * as XLSX from 'xlsx';
import { cn } from './ui/utils';

interface BulkTicketImportModalProps {
  release: Release;
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
}

type Step = 'upload' | 'preview';

export function BulkTicketImportModal({
  release,
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
    const { headers, rows } = parseCSV(content);
    const result = validateAndTransformCSV<ParsedTicketRow>(headers, rows, ticketImportMapping);
    setParsedTickets(result.data);

    const warnings = [...result.errors];

    // Warn about tickets missing the feature column
    if (result.data.length > 0) {
      const missingFeature = result.data.filter(t => !t.feature || !t.feature.trim());
      if (missingFeature.length > 0 && missingFeature.length < result.data.length) {
        missingFeature.forEach(t => {
          warnings.push({
            row: 0,
            field: 'feature',
            value: t.title,
            message: `"${t.title}" has no feature — will use "Imported Tickets"`,
          });
        });
      }
      setParseErrors(warnings);
      setStep('preview');
    } else {
      setParseErrors(warnings);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  // ----- Import -----

  const handleImport = () => {
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

      for (const ticket of tickets) {
        // Calculate effortDays using release's storyPointMapping (fallback to 1:1 if no mapping)
        const effortDays = storyPointsToDays(ticket.storyPoints, release.storyPointMapping);
        
        onAddTicket(targetFeatureId, {
          title: ticket.title,
          description: ticket.description || undefined,
          startDate: new Date(ticket.startDate),
          endDate: new Date(ticket.endDate),
          status: ticket.status,
          effortDays, // Calculated from storyPoints using mapping
          storyPoints: ticket.storyPoints, // Backward compatibility
          assignedTo: ticket.assignedTo,
        });
        count++;
      }
    });

    setImportedCount(count);
    setCreatedFeatures(newFeatureNames);
    setImportComplete(true);
  };

  const handleDownloadTemplate = () => {
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
                  <p className="font-semibold mb-1">Download a pre-filled template with 29 sample tickets</p>
                  <p>
                    Covers infrastructure setup, authentication, AI foundation, content creation, and localization workflows. Edit with your data and upload.
                    Include a <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded text-[11px]">feature</code> or <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded text-[11px]">epic</code> column
                    to auto-group tickets into features.
                  </p>
                </div>
              </div>

              {/* Required / optional columns */}
              <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Supported columns:</span>{' '}
                <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px]">title, epic, effortDays, priority, assignedTo, feature, storyPoints, startDate, endDate, status, description</code>
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

              {/* Ticket table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
                <div className="max-h-[280px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400 font-semibold">Feature</th>
                        <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400 font-semibold">Title</th>
                        <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400 font-semibold">SP</th>
                        <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400 font-semibold">Assignee</th>
                        <th className="text-left px-3 py-2 text-slate-600 dark:text-slate-400 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedTickets.map((ticket, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-3 py-2 text-slate-500 dark:text-slate-400 max-w-[110px] truncate">{ticket.feature || 'Imported Tickets'}</td>
                          <td className="px-3 py-2 text-slate-900 dark:text-white font-semibold max-w-[160px] truncate">{ticket.title}</td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-700 dark:text-blue-300 inline-flex items-center justify-center text-[10px] font-semibold shadow-sm">
                              {ticket.storyPoints}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-300 max-w-[100px] truncate">{ticket.assignedTo}</td>
                          <td className="px-3 py-2">{getStatusBadge(ticket.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                    disabled={parsedTickets.length === 0}
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
