import { useState, useEffect, useRef } from 'react';
import { X, BarChart3, Check, Download, AlertCircle, Upload } from 'lucide-react';
import { buildReleasePlanSafe } from '../../domain/planningEngine';
import type { TicketInput, ReleaseConfig, ReleasePlan } from '../../domain/types';
import { parseCSV } from '../lib/csvParser';
import { mapReleasePlanToAppRelease } from '../../domain/adapters/domainToAppMapper';
import type { Product } from '../data/mockData';
import { loadProducts, saveProducts, loadTeamMembersByProduct } from '../lib/localStorage';
import { DatePicker } from './DatePicker';
import { FeasibilityMeter } from './FeasibilityMeter';
import { ReviewStatsGrid } from './ReviewStatsGrid';
import { DataInsightsPanel } from './DataInsightsPanel';
import { CsvPreviewTable } from './CsvPreviewTable';
import { generatePlanningInsights } from '../lib/planningAdvisor';
import { detectEnhancedConflicts } from '../lib/conflictDetection';

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
  const [csvInput, setCsvInput] = useState(`title,epic,effort,priority,assigned
User Authentication,Core,5,High,Sarah Chen
Payment Integration,Core,8,High,Marcus Rivera
OAuth 2.0 Setup,Core,3,1,Elena Zhang
Dashboard UI,Frontend,5,Medium,Sarah Chen
Data Visualization,Frontend,8,2,Priya Patel
Settings Page,Frontend,2,Low,
API Documentation,Backend,4,Medium,James Wilson
Rate Limiting,Backend,3,High,Marcus Rivera
Error Handling,Backend,2,Medium,
Unit Tests,Testing,5,Low,Elena Zhang
Integration Tests,Testing,8,3,Unknown Developer
Security Audit,Security,5,High,James Wilson`);

  const [plannerPreview, setPlannerPreview] = useState<ReleasePlan | null>(null);
  const [parsedTickets, setParsedTickets] = useState<TicketInput[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Assignment analytics (display only, doesn't affect capacity)
  const [uniqueAssignedDevelopers, setUniqueAssignedDevelopers] = useState<string[]>([]);
  const [ticketsWithoutAssignment, setTicketsWithoutAssignment] = useState(0);

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

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
User Authentication,Auth,5,High,Sarah Chen
Payment Integration,Payments,8,High,Marcus Rivera
Email Notifications,Communication,3,Medium,Elena Zhang
Audit Logs,Security,2,Low,`;

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
    
    try {
      // Check team members first
      const teamMembers = loadTeamMembersByProduct(product.id) || [];
      
      if (teamMembers.length === 0) {
        setError('No team members found. Please configure your team roster and PTO plan before generating a release.');
        return;
      }

      // Parse CSV
      const { headers, rows } = parseCSV(csvInput);
      
      if (rows.length === 0) {
        setError('CSV is empty or invalid');
        return;
      }

      // Find column indices
      const titleIdx = headers.findIndex(h => h.toLowerCase() === 'title');
      const epicIdx = headers.findIndex(h => h.toLowerCase() === 'epic');
      const effortIdx = headers.findIndex(h => h.toLowerCase().includes('effort'));
      const priorityIdx = headers.findIndex(h => h.toLowerCase() === 'priority');
      const assignedIdx = headers.findIndex(h => h.toLowerCase() === 'assigned' || h.toLowerCase() === 'assignedto');

      if (titleIdx === -1 || effortIdx === -1) {
        setError('CSV must have at least "title" and "effort" columns');
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

      // Collect assignment analytics (display only, doesn't affect capacity)
      const uniqueAssigned = new Set<string>();
      let unassignedCount = 0;
      
      tickets.forEach(ticket => {
        if (ticket.assignedToRaw && ticket.assignedToRaw.trim()) {
          uniqueAssigned.add(ticket.assignedToRaw);
        } else {
          unassignedCount++;
        }
      });
      
      setUniqueAssignedDevelopers(Array.from(uniqueAssigned));
      setTicketsWithoutAssignment(unassignedCount);

      // Validate assignments against team roster
      const teamMemberNames = new Set(teamMembers.map(tm => tm.name));
      const unknownAssignments = new Set<string>();
      
      tickets.forEach(ticket => {
        if (ticket.assignedToRaw && !teamMemberNames.has(ticket.assignedToRaw)) {
          unknownAssignments.add(ticket.assignedToRaw);
        }
      });

      if (unknownAssignments.size > 0) {
        const unknownList = Array.from(unknownAssignments);
        setWarning(`${unknownAssignments.size} unmatched assignment(s): ${unknownList.join(', ')}. These will be set to "Unassigned".`);
      }

      setParsedTickets(tickets);

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
      const result = buildReleasePlanSafe(tickets, config);
      
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Auto Generate Release Plan</h2>
              <p className="text-sm text-muted-foreground">AI-powered sprint planning wizard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Ribbon */}
        <div className="border-b border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {/* Step 1 */}
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step === 1 ? 'bg-primary text-primary-foreground' :
                step > 1 ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${step === 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Backlog
                </div>
              </div>
            </div>

            <div className="w-16 h-0.5 bg-border mx-2" />

            {/* Step 2 */}
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step === 2 ? 'bg-primary text-primary-foreground' :
                step > 2 ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {step > 2 ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${step === 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Strategy
                </div>
              </div>
            </div>

            <div className="w-16 h-0.5 bg-border mx-2" />

            {/* Step 3 */}
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                3
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${step === 3 ? 'text-foreground' : 'text-muted-foreground'}`}>
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
                <h3 className="text-base font-semibold mb-2">Import Your Backlog</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Download the CSV template, fill in your ticket data, and upload or paste below.
                </p>
              </div>

              {/* Download Template Button */}
              <div className="flex justify-center">
                <button
                  onClick={downloadCsvTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Download CSV Template
                </button>
              </div>

              {/* Drag & Drop Upload Area */}
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30"
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
                <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-lg font-medium mb-1">Drag & Drop CSV Here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>

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

              {/* CSV Input Area */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  CSV Input (or paste directly)
                </label>
                <textarea
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  placeholder="title,epic,effortDays,priority,assignedTo&#10;Feature A,Core,5,High,Sarah Chen&#10;Feature B,Core,3,Medium,Marcus Rivera&#10;Feature C,UI,8,Low,"
                  className="w-full h-48 px-3 py-2 text-sm border border-border rounded-lg bg-background font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium">Priority:</span> High→1, Medium→3, Low→5 (or use numeric 1-5) · 
                  <span className="font-medium ml-2">Assigned:</span> Must match team roster names or leave empty
                </p>
              </div>

              {/* CSV Preview Table */}
              {parsedTickets && parsedTickets.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Parsed Tickets Preview</label>
                  <CsvPreviewTable tickets={parsedTickets} />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Strategy */}
          {step === 2 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h3 className="text-base font-semibold mb-2">Configure Release Strategy</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Set your release parameters and team capacity.
                </p>
              </div>

              {/* Release Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Release Name</label>
                  <input
                    type="text"
                    value={releaseName}
                    onChange={(e) => setReleaseName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                    placeholder="Q1 2026 Release"
                  />
                </div>
                
                <div>
                  <DatePicker
                    label="Start Date"
                    value={releaseStart}
                    onChange={setReleaseStart}
                  />
                </div>
                
                <div>
                  <DatePicker
                    label="End Date"
                    value={releaseEnd}
                    onChange={setReleaseEnd}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5">Sprint Length</label>
                  <select
                    value={sprintLengthWeeks}
                    onChange={(e) => setSprintLengthWeeks(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                  >
                    <option value="1">1 Week</option>
                    <option value="2">2 Weeks</option>
                    <option value="3">3 Weeks</option>
                    <option value="4">4 Weeks</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1.5">
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
                  <h3 className="text-lg font-semibold mb-1">Review Plan & Confirm</h3>
                  <p className="text-sm text-muted-foreground">
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
                <div className="border border-border rounded-lg p-5 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <span className="text-lg">🤖</span>
                      AI Planning Insights
                    </h4>
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        aiInsights.riskLevel === 'low'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : aiInsights.riskLevel === 'medium'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}
                    >
                      {aiInsights.riskLevel === 'low' && '✓ Low Risk'}
                      {aiInsights.riskLevel === 'medium' && '⚠ Medium Risk'}
                      {aiInsights.riskLevel === 'high' && '⚠️ High Risk'}
                    </span>
                  </div>

                  {/* Assessment */}
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {aiInsights.sections.assessment}
                  </p>

                  {/* Impact */}
                  {aiInsights.sections.impact.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
                        Impact
                      </h5>
                      <ul className="space-y-2">
                        {aiInsights.sections.impact.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                            <span className="text-amber-600 mt-0.5 flex-shrink-0">⚠</span>
                            <span className="flex-1">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {aiInsights.sections.recommendations.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
                        Recommendations
                      </h5>
                      <ul className="space-y-2">
                        {aiInsights.sections.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                            <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                            <span className="flex-1">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground italic">
                      💡 These insights are advisory only. Review carefully before proceeding.
                    </p>
                  </div>
                </div>

                {/* Data Insights Panel */}
                {parsedTickets && (
                  <DataInsightsPanel
                    tickets={parsedTickets}
                    sprints={plannerPreview.sprints}
                    overflowTickets={plannerPreview.overflowTickets}
                  />
                )}
              </div>
            );
          })()}

          {/* Error Display */}
          {error && (
            <div className="max-w-3xl mx-auto mt-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-red-600 mb-1">Configuration Required</div>
                    <div className="text-sm text-red-600">{error}</div>
                    
                    {error.includes('team members') && (
                      <div className="mt-3 pt-3 border-t border-red-500/20">
                        <div className="text-xs font-medium text-red-600 mb-2">Quick Start:</div>
                        <div className="flex gap-2">
                          <a
                            href="/sample-data/team_template.csv"
                            download
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            Team Roster Template
                          </a>
                          <a
                            href="/sample-data/pto_template.csv"
                            download
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200 transition-colors"
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
            <div className="max-w-3xl mx-auto mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-700">{warning}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border px-6 py-4 bg-muted/30 rounded-b-xl flex items-center justify-between">
          <button
            onClick={() => setStep((step - 1) as 1 | 2 | 3)}
            disabled={step === 1}
            className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>

          <div className="flex gap-2">
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={!csvInput.trim()}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next: Configure Strategy
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleAnalyzeFeasibility}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Analyze Feasibility
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleConfirmCreate}
                disabled={isCreating}
                className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? 'Creating...' : 'Confirm & Create Release'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
