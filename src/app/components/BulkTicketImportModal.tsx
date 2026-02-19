import { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, AlertTriangle, CheckCircle2, Download, Table2 } from 'lucide-react';
import { Release, Ticket, storyPointsToDays } from '../data/mockData';
import { parseCSV, validateAndTransformCSV } from '../lib/csvParser';
import { ticketImportMapping } from '../lib/importMappings';
import * as XLSX from 'xlsx';

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
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] bg-white rounded-xl shadow-2xl z-50 border border-gray-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Upload className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-900">
              {importComplete ? 'Import Complete' : step === 'upload' ? 'Import Tickets' : 'Preview & Import'}
            </h3>
            {/* Step indicator */}
            {!importComplete && (
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${step === 'upload' || step === 'preview' ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <div className="w-4 h-px bg-gray-300" />
                <div className={`w-2 h-2 rounded-full ${step === 'preview' ? 'bg-blue-600' : 'bg-gray-300'}`} />
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Import Complete ── */}
          {importComplete && (
            <div className="px-6 py-10 text-center space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Successfully imported {importedCount} ticket{importedCount !== 1 ? 's' : ''}
                </h4>
                {createdFeatures.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Created {createdFeatures.length} new feature{createdFeatures.length !== 1 ? 's' : ''}:{' '}
                    <span className="font-medium text-gray-700">{createdFeatures.join(', ')}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 1: Upload ── */}
          {!importComplete && step === 'upload' && (
            <div className="px-6 py-5 space-y-4">
              {/* Info banner */}
              <div className="flex items-start gap-3 px-3.5 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Table2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800 leading-relaxed">
                  <p className="font-semibold mb-1">Download a pre-filled template with 29 sample tickets</p>
                  <p>
                    Covers infrastructure setup, authentication, AI foundation, content creation, and localization workflows. Edit with your data and upload.
                    Include a <code className="px-1 py-0.5 bg-blue-100 rounded text-[11px]">feature</code> or <code className="px-1 py-0.5 bg-blue-100 rounded text-[11px]">epic</code> column
                    to auto-group tickets into features.
                  </p>
                </div>
              </div>

              {/* Required / optional columns */}
              <div className="text-xs text-gray-500 leading-relaxed">
                <span className="font-medium text-gray-700">Supported columns:</span>{' '}
                <code className="px-1 py-0.5 bg-gray-100 rounded text-[11px]">title, epic, effortDays, priority, assignedTo, feature, storyPoints, startDate, endDate, status, description</code>
              </div>

              {/* Upload area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                  fileName ? 'border-blue-300 bg-blue-50/50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
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
                    <FileText className="w-8 h-8 text-blue-500 mx-auto" />
                    <p className="text-sm font-medium text-gray-900">{fileName}</p>
                    <p className="text-xs text-gray-500">Click to choose a different file</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm font-medium text-gray-700">Drop file here or click to browse</p>
                    <p className="text-xs text-gray-500">Supports <strong>.csv</strong> and <strong>.xlsx</strong> files</p>
                  </div>
                )}
              </div>

              {/* Download template */}
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download CSV template
              </button>

              {/* Parse errors — only if no valid tickets at all */}
              {parseErrors.length > 0 && parsedTickets.length === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-semibold text-red-800">
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
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium text-gray-900">
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
                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
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
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                        exists
                          ? 'bg-gray-100 text-gray-700 border border-gray-200'
                          : 'bg-green-50 text-green-700 border border-green-200'
                      }`}
                    >
                      {!exists && <span className="text-green-500 text-[9px]">NEW</span>}
                      {name}
                      <span className="text-gray-400 font-normal">({count})</span>
                    </span>
                  );
                })}
              </div>

              {/* Errors / warnings */}
              {parseErrors.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span className="text-[11px] text-amber-800">
                    {parseErrors.length} warning{parseErrors.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Ticket table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-[280px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-600 font-medium">Feature</th>
                        <th className="text-left px-3 py-2 text-gray-600 font-medium">Title</th>
                        <th className="text-left px-3 py-2 text-gray-600 font-medium">SP</th>
                        <th className="text-left px-3 py-2 text-gray-600 font-medium">Assignee</th>
                        <th className="text-left px-3 py-2 text-gray-600 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedTickets.map((ticket, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                          <td className="px-3 py-2 text-gray-500 max-w-[110px] truncate">{ticket.feature || 'Imported Tickets'}</td>
                          <td className="px-3 py-2 text-gray-900 font-medium max-w-[160px] truncate">{ticket.title}</td>
                          <td className="px-3 py-2 text-gray-700">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 inline-flex items-center justify-center text-[10px] font-medium">
                              {ticket.storyPoints}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-700 max-w-[100px] truncate">{ticket.assignedTo}</td>
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
                  <summary className="text-[11px] text-amber-700 cursor-pointer hover:text-amber-900">
                    Show {parseErrors.length} warning{parseErrors.length !== 1 ? 's' : ''}
                  </summary>
                  <div className="mt-2 max-h-[100px] overflow-y-auto space-y-1 bg-amber-50 rounded-lg p-2">
                    {parseErrors.map((err, i) => (
                      <p key={i} className="text-[11px] text-amber-800">
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
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-t border-gray-200 rounded-b-xl">
          <span className="text-[10px] text-gray-400">Press Esc to close</span>
          <div className="flex items-center gap-2">
            {importComplete ? (
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Done
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                {step === 'preview' && (
                  <button
                    onClick={handleImport}
                    disabled={parsedTickets.length === 0}
                    className="px-4 py-2.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
