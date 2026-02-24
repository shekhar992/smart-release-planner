import { useState } from 'react';
import { X, Upload, CheckCircle, Download, FileText, List, UsersRound, Coffee, PartyPopper, AlertCircle } from 'lucide-react';
import { Product } from '../data/mockData';
import { cn } from './ui/utils';
import { parseCSV, validateAndTransformCSV, CSVParseResult } from '../lib/csvParser';
import { ticketImportMapping, teamMemberImportMapping, ptoImportMapping, holidayImportMapping, deriveVelocityMultiplier } from '../lib/importMappings';

export interface ImportedReleaseData {
  tickets: Array<{ id: string; title: string; assignedTo: string; startDate: string; endDate: string; storyPoints: number; status: string; feature?: string }>;
  team: Array<{ id: string; name: string; role: string; experienceLevel: string; velocityMultiplier: number }>;
  pto: Array<{ id: string; name: string; startDate: string; endDate: string }>;
  holidays: Array<{ id: string; name: string; startDate: string; endDate: string }>;
}

interface ImportReleaseWizardProps {
  onClose: () => void;
  products: Product[];
  onCreate: (productId: string, name: string, startDate: Date, endDate: Date, importedData: ImportedReleaseData) => void;
}

type Step = 'templates' | 'upload' | 'review';

export function ImportReleaseWizard({ onClose, products, onCreate }: ImportReleaseWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('templates');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [releaseName, setReleaseName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{
    tickets: File | null;
    team: File | null;
    pto: File | null;
    holidays: File | null;
  }>({
    tickets: null,
    team: null,
    pto: null,
    holidays: null
  });

  // Parse uploaded files for preview
  const [parsedData, setParsedData] = useState<{
    ticketCount: number;
    teamCount: number;
    ptoCount: number;
    holidayCount: number;
    tickets: Array<{ id: string; title: string; assignedTo: string; startDate: string; endDate: string; storyPoints: number; status: string }>;
    team: Array<{ id: string; name: string; role: string }>;
  }>({
    ticketCount: 0,
    teamCount: 0,
    ptoCount: 0,
    holidayCount: 0,
    tickets: [],
    team: []
  });

  // Validation results
  const [validationErrors, setValidationErrors] = useState<{
    tickets: CSVParseResult<any> | null;
    team: CSVParseResult<any> | null;
    pto: CSVParseResult<any> | null;
    holidays: CSVParseResult<any> | null;
  }>({
    tickets: null,
    team: null,
    pto: null,
    holidays: null
  });

  const handleFileUpload = async (type: 'tickets' | 'team' | 'pto' | 'holidays', file: File | null) => {
    setUploadedFiles(prev => ({
      ...prev,
      [type]: file
    }));

    // Parse and validate the file
    if (file) {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);
      
      // Get appropriate mapping for validation
      let mapping;
      switch (type) {
        case 'tickets':
          mapping = ticketImportMapping;
          break;
        case 'team':
          mapping = teamMemberImportMapping;
          break;
        case 'pto':
          mapping = ptoImportMapping;
          break;
        case 'holidays':
          mapping = holidayImportMapping;
          break;
      }
      
      // Validate and transform data
      const result = validateAndTransformCSV(headers, rows, mapping);
      
      // Store validation results
      setValidationErrors(prev => ({
        ...prev,
        [type]: result
      }));
      
      // Update parsed data counts
      if (type === 'tickets') {
        setParsedData(prev => ({
          ...prev,
          ticketCount: result.data.length,
          tickets: result.data.slice(0, 5).map((t: any) => ({
            id: t.id,
            title: t.title,
            storyPoints: t.storyPoints, // Keep for CSV compatibility
            assignedTo: t.assignedTo,
            startDate: t.startDate instanceof Date ? t.startDate.toISOString().split('T')[0] : t.startDate,
            endDate: t.endDate instanceof Date ? t.endDate.toISOString().split('T')[0] : t.endDate,
            status: t.status
          }))
        }));
      } else if (type === 'team') {
        setParsedData(prev => ({
          ...prev,
          teamCount: result.data.length,
          team: result.data.slice(0, 5).map((t: any) => ({
            id: `tm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: t.name,
            role: t.role
          }))
        }));
      } else if (type === 'pto') {
        setParsedData(prev => ({
          ...prev,
          ptoCount: result.data.length
        }));
      } else if (type === 'holidays') {
        setParsedData(prev => ({
          ...prev,
          holidayCount: result.data.length
        }));
      }
    } else {
      // File removed, reset counts and errors
      setValidationErrors(prev => ({
        ...prev,
        [type]: null
      }));
      
      if (type === 'tickets') {
        setParsedData(prev => ({ ...prev, ticketCount: 0, tickets: [] }));
      } else if (type === 'team') {
        setParsedData(prev => ({ ...prev, teamCount: 0, team: [] }));
      } else if (type === 'pto') {
        setParsedData(prev => ({ ...prev, ptoCount: 0 }));
      } else if (type === 'holidays') {
        setParsedData(prev => ({ ...prev, holidayCount: 0 }));
      }
    }
  };

  const handleComplete = () => {
    if (selectedProductId && releaseName && startDate && endDate) {
      // Gather all validated data from the CSV uploads
      const allTickets = validationErrors.tickets?.data || [];
      const allTeam = validationErrors.team?.data || [];
      const allPto = validationErrors.pto?.data || [];
      const allHolidays = validationErrors.holidays?.data || [];

      const importedData: ImportedReleaseData = {
        tickets: allTickets.map((t: any) => ({
          id: t.id || `t-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: t.title,
          assignedTo: t.assignedTo,
          startDate: t.startDate instanceof Date ? t.startDate.toISOString().split('T')[0] : String(t.startDate),
          endDate: t.endDate instanceof Date ? t.endDate.toISOString().split('T')[0] : String(t.endDate),
          storyPoints: Number(t.storyPoints) || 0, // Keep for CSV compatibility and backward compat
          status: t.status || 'planned',
          feature: t.feature || undefined,
        })),
        team: allTeam.map((m: any) => ({
          id: `tm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: m.name,
          role: m.role,
          experienceLevel: m.experienceLevel || 'Mid',
          velocityMultiplier: deriveVelocityMultiplier(m.experienceLevel || 'Mid'),
        })),
        pto: allPto.map((p: any) => ({
          id: p.id || `pto-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: p.name || p.developerName || '',
          startDate: p.startDate instanceof Date ? p.startDate.toISOString().split('T')[0] : String(p.startDate),
          endDate: p.endDate instanceof Date ? p.endDate.toISOString().split('T')[0] : String(p.endDate),
        })),
        holidays: allHolidays.map((h: any) => ({
          id: h.id || `hol-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: h.name,
          startDate: h.startDate instanceof Date ? h.startDate.toISOString().split('T')[0] : String(h.startDate),
          endDate: h.endDate instanceof Date ? h.endDate.toISOString().split('T')[0] : String(h.endDate),
        })),
      };

      onCreate(selectedProductId, releaseName, new Date(startDate), new Date(endDate), importedData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col border border-slate-200/50 dark:border-slate-700/50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-800/50">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create Release via Import</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Step-by-step guide to import your release
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
          >
            <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center justify-between max-w-xl mx-auto">
            {(['templates', 'upload', 'review'] as Step[]).map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold transition-all duration-300",
                  currentStep === step 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110' 
                    : getStepIndex(currentStep) > index
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                )}>
                  {getStepIndex(currentStep) > index ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 2 && (
                  <div className={cn(
                    "w-12 h-1 mx-1 rounded-full transition-all duration-300",
                    getStepIndex(currentStep) > index 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm' 
                      : 'bg-slate-200 dark:bg-slate-700'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {currentStep === 'templates' && <TemplatesStep />}
          {currentStep === 'upload' && (
            <UploadStep
              uploadedFiles={uploadedFiles}
              onFileUpload={handleFileUpload}
              validationErrors={validationErrors}
            />
          )}
          {currentStep === 'review' && (
            <ReviewStep
              products={products}
              selectedProductId={selectedProductId}
              releaseName={releaseName}
              startDate={startDate}
              endDate={endDate}
              onSelectProduct={setSelectedProductId}
              onSetReleaseName={setReleaseName}
              onSetStartDate={setStartDate}
              onSetEndDate={setEndDate}
              uploadedFiles={uploadedFiles}
              parsedData={parsedData}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={() => {
              if (currentStep === 'templates') {
                onClose();
              } else {
                const steps: Step[] = ['templates', 'upload', 'review'];
                const currentIndex = steps.indexOf(currentStep);
                if (currentIndex > 0) {
                  setCurrentStep(steps[currentIndex - 1]);
                }
              }
            }}
            className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
          >
            {currentStep === 'templates' ? 'Cancel' : 'Back'}
          </button>

          <button
            onClick={() => {
              if (currentStep === 'review') {
                handleComplete();
              } else {
                const steps: Step[] = ['templates', 'upload', 'review'];
                const currentIndex = steps.indexOf(currentStep);
                if (currentIndex < steps.length - 1) {
                  setCurrentStep(steps[currentIndex + 1]);
                }
              }
            }}
            disabled={!canProceed(currentStep, selectedProductId, releaseName, startDate, endDate, uploadedFiles, validationErrors)}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {currentStep === 'review' ? 'Create Release' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplatesStep() {
  const templates = [
    {
      id: 'tickets',
      name: 'Tickets Template',
      description: 'Your planned work items including features and tasks with dates and assignments',
      required: true,
      columns: ['id', 'title', 'startDate', 'endDate', 'status', 'effortDays', 'storyPoints', 'assignedTo', 'priority', 'description', 'feature', 'requiredRole', 'blockedBy'],
      exampleData: [
        ['t1', 'User Authentication', '2026-03-01', '2026-03-05', 'planned', '5', '', 'Alice Chen', 'High', 'Implement JWT-based auth', 'Auth', 'Backend', ''],
        ['t2', 'Database Schema', '2026-03-04', '2026-03-08', 'planned', '8', '', 'Bob Smith', 'High', 'Design user tables', 'Database', 'Backend', ''],
        ['t3', 'Dashboard UI', '2026-03-06', '2026-03-10', 'planned', '3', '', 'Carol White', 'Medium', 'Create dashboard', 'UI', 'Frontend', 't1,t2']
      ]
    },
    {
      id: 'team',
      name: 'Team Roster Template',
      description: 'List of team members who will be working on this release',
      required: true,
      columns: ['name', 'role', 'experienceLevel', 'velocityMultiplier', 'notes'],
      exampleData: [
        ['Alice Chen', 'Backend', 'Senior', '1.3', 'API specialist'],
        ['Bob Smith', 'Backend', 'Mid', '1.0', 'Database expert'],
        ['Carol White', 'Frontend', 'Mid', '1.0', 'React & UI/UX']
      ]
    },
    {
      id: 'pto',
      name: 'PTO Template',
      description: 'Planned time off for team members during the release period',
      required: false,
      columns: ['id', 'name', 'startDate', 'endDate'],
      exampleData: [
        ['pto1', 'Alice Chen', '2026-03-15', '2026-03-17'],
        ['pto2', 'Bob Smith', '2026-03-20', '2026-03-20']
      ]
    },
    {
      id: 'holidays',
      name: 'Holidays Template',
      description: 'Company holidays and non-working days during the release',
      required: false,
      columns: ['id', 'name', 'startDate', 'endDate'],
      exampleData: [
        ['h1', 'Memorial Day', '2026-05-27', '2026-05-27'],
        ['h2', 'Independence Day', '2026-07-04', '2026-07-04']
      ]
    }
  ];

  const downloadTemplate = (template: typeof templates[0]) => {
    // Create CSV content with example data
    const headers = template.columns.join(',');
    const rows = template.exampleData.map(row => row.join(',')).join('\n');
    const csvContent = `${headers}\n${rows}`;
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.id}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Download Templates</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Download these templates to prepare your data. Fill them out with your release information, 
          then upload them in a later step.
        </p>
      </div>

      <div className="space-y-3">
        {templates.map((template) => (
          <div 
            key={template.id}
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{template.name}</h4>
                  {template.required ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/5 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      Required
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      Optional
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {template.description}
                </p>
              </div>
              <button
                onClick={() => downloadTemplate(template)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 flex-shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 flex items-center justify-center flex-shrink-0 shadow-inner">
            <span className="text-sm">💡</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white mb-1">Templates Include Examples</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Each template includes pre-filled example rows to show you the expected format. 
              You can replace these with your own data or add more rows as needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadStep({
  uploadedFiles,
  onFileUpload,
  validationErrors
}: {
  uploadedFiles: {
    tickets: File | null;
    team: File | null;
    pto: File | null;
    holidays: File | null;
  };
  onFileUpload: (type: 'tickets' | 'team' | 'pto' | 'holidays', file: File | null) => void;
  validationErrors: {
    tickets: CSVParseResult<any> | null;
    team: CSVParseResult<any> | null;
    pto: CSVParseResult<any> | null;
    holidays: CSVParseResult<any> | null;
  };
}) {
  const fileTypes = [
    {
      id: 'tickets' as const,
      name: 'Tickets',
      required: true,
      description: 'Your work items and tasks'
    },
    {
      id: 'team' as const,
      name: 'Team Roster',
      required: true,
      description: 'Team members working on this release'
    },
    {
      id: 'pto' as const,
      name: 'PTO',
      required: false,
      description: 'Planned time off for team members'
    },
    {
      id: 'holidays' as const,
      name: 'Holidays',
      required: false,
      description: 'Company holidays and non-working days'
    }
  ];

  const hasValidationErrors = 
    (validationErrors.tickets && validationErrors.tickets.errors.length > 0) ||
    (validationErrors.team && validationErrors.team.errors.length > 0) ||
    (validationErrors.pto && validationErrors.pto.errors.length > 0) ||
    (validationErrors.holidays && validationErrors.holidays.errors.length > 0);

  const handleFileChange = (type: 'tickets' | 'team' | 'pto' | 'holidays', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(type, e.target.files[0]);
    }
  };

  const handleRemoveFile = (type: 'tickets' | 'team' | 'pto' | 'holidays') => {
    onFileUpload(type, null);
  };

  const hasRequiredFiles = uploadedFiles.tickets !== null && uploadedFiles.team !== null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Instructions */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Populate & Upload Data</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
          Fill out the templates you downloaded in Step 1 with your own data, then upload them below.
        </p>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-inner">
              <span className="text-sm">📋</span>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-900 dark:text-white">What you need to upload:</p>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 leading-relaxed">
                <li><span className="font-semibold text-blue-600 dark:text-blue-400">Required:</span> Tickets and Team files must be uploaded</li>
                <li><span className="font-semibold text-slate-500 dark:text-slate-400">Optional:</span> PTO and Holidays can be added later if needed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="space-y-3">
        {fileTypes.map((fileType) => (
          <div 
            key={fileType.id}
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{fileType.name}</h4>
                  {fileType.required ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/5 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      Required
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      Optional
                    </span>
                  )}
                </div>
              </div>
              {uploadedFiles[fileType.id] ? (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs font-medium text-slate-900 dark:text-white truncate flex-1">
                        {uploadedFiles[fileType.id]!.name}
                      </span>
                      <button
                        onClick={() => handleRemoveFile(fileType.id)}
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex-shrink-0 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    
                    {/* Show validation status */}
                    {validationErrors[fileType.id] && (
                      <div>
                        {validationErrors[fileType.id]!.errors.length > 0 ? (
                          <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 shadow-sm">
                            <div className="flex items-start gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                              <span className="text-xs font-semibold text-red-900 dark:text-red-200">
                                {validationErrors[fileType.id]!.errors.length} validation error(s) found
                              </span>
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {validationErrors[fileType.id]!.errors.slice(0, 3).map((error, idx) => (
                                <p key={idx} className="text-xs text-red-800 dark:text-red-300">
                                  Row {error.row}: {error.message}
                                </p>
                              ))}
                              {validationErrors[fileType.id]!.errors.length > 3 && (
                                <p className="text-xs text-red-700 dark:text-red-400 italic">
                                  ...and {validationErrors[fileType.id]!.errors.length - 3} more errors
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-2.5 shadow-sm">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-xs text-emerald-800 dark:text-emerald-200 font-semibold">
                                ✓ {validationErrors[fileType.id]!.data.length} rows validated successfully
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id={`file-${fileType.id}`}
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => handleFileChange(fileType.id, e)}
                      className="hidden"
                    />
                    <label
                      htmlFor={`file-${fileType.id}`}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Choose File
                    </label>
                  </div>
                )}
              </div>
            </div>
        ))}
      </div>

      {/* Validation errors blocking message */}
      {hasRequiredFiles && hasValidationErrors && (
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-900 dark:text-red-200 mb-1">
                Cannot proceed with validation errors
              </p>
              <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
                Please fix the errors shown above in your CSV files before continuing. Download the templates again if needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Required files message */}
      {!hasRequiredFiles && (
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs">⚠️</span>
            </div>
            <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              Please upload both <span className="font-semibold">Tickets</span> and <span className="font-semibold">Team</span> files to continue. 
              PTO and Holidays are optional and can be added later.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewStep({
  products,
  selectedProductId,
  releaseName,
  startDate,
  endDate,
  onSelectProduct,
  onSetReleaseName,
  onSetStartDate,
  onSetEndDate,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  uploadedFiles: _uploadedFiles,
  parsedData
}: {
  products: Product[];
  selectedProductId: string;
  releaseName: string;
  startDate: string;
  endDate: string;
  onSelectProduct: (productId: string) => void;
  onSetReleaseName: (name: string) => void;
  onSetStartDate: (date: string) => void;
  onSetEndDate: (date: string) => void;
  uploadedFiles: {
    tickets: File | null;
    team: File | null;
    pto: File | null;
    holidays: File | null;
  };
  parsedData: {
    ticketCount: number;
    teamCount: number;
    ptoCount: number;
    holidayCount: number;
    tickets: Array<{ id: string; title: string; assignedTo: string; startDate: string; endDate: string; storyPoints: number; status: string }>;
    team: Array<{ id: string; name: string; role: string }>;
  };
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Review & Create</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Configure your release details and review what will be created
        </p>
      </div>

      {/* Configuration Section */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Product
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => onSelectProduct(e.target.value)}
            className="w-full text-sm font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 shadow-sm transition-all duration-200"
          >
            <option value="">Select a product...</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Release Name
          </label>
          <input
            type="text"
            value={releaseName}
            onChange={(e) => onSetReleaseName(e.target.value)}
            placeholder="e.g., Q1 2024 Release"
            className="w-full text-sm font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Timeline
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onSetStartDate(e.target.value)}
              className="text-sm font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 shadow-sm transition-all duration-200"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => onSetEndDate(e.target.value)}
              className="text-sm font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 shadow-sm transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Summary Counts */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          What will be created
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                <List className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{parsedData.ticketCount}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Tickets</div>
              </div>
            </div>
          </div>

          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
                <UsersRound className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{parsedData.teamCount}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Team Members</div>
              </div>
            </div>
          </div>

          {parsedData.ptoCount > 0 && (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30">
                  <Coffee className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{parsedData.ptoCount}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">PTO Entries</div>
                </div>
              </div>
            </div>
          )}

          {parsedData.holidayCount > 0 && (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                  <PartyPopper className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{parsedData.holidayCount}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Holidays</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Preview */}
      {(parsedData.ticketCount > 0 || parsedData.teamCount > 0) && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Preview
          </h4>
          
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            {/* Tickets Preview */}
            {parsedData.ticketCount > 0 && (
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/30">
                    <List className="w-4 h-4 text-white" />
                  </div>
                  <h5 className="text-sm font-semibold text-slate-900 dark:text-white">Tickets</h5>
                  <span className="text-xs text-slate-500 dark:text-slate-400">({parsedData.ticketCount} total)</span>
                </div>
                <div className="space-y-2">
                  {parsedData.tickets.map((ticket, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5 border border-slate-200 dark:border-slate-700">
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-0.5 shadow-sm">
                        {ticket.effortDays ?? ticket.storyPoints ?? 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{ticket.title}</p>
                        <p className="text-slate-600 dark:text-slate-400">
                          {ticket.assignedTo} • {ticket.startDate} → {ticket.endDate}
                        </p>
                        <span className={cn(
                          "inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold shadow-sm",
                          ticket.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                          ticket.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        )}>
                          {ticket.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {parsedData.ticketCount > 5 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic pl-2">
                      ... and {parsedData.ticketCount - 5} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Team Preview */}
            {parsedData.teamCount > 0 && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/30">
                    <UsersRound className="w-4 h-4 text-white" />
                  </div>
                  <h5 className="text-sm font-semibold text-slate-900 dark:text-white">Team</h5>
                  <span className="text-xs text-slate-500 dark:text-slate-400">({parsedData.teamCount} members)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {parsedData.team.map((member, index) => (
                    <div key={index} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold text-slate-900 dark:text-white">{member.name}</p>
                        <p className="text-slate-600 dark:text-slate-400 text-[10px]">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getStepIndex(step: Step): number {
  const steps: Step[] = ['templates', 'upload', 'review'];
  return steps.indexOf(step);
}

function canProceed(
  step: Step,
  selectedProductId: string,
  releaseName: string,
  startDate: string,
  endDate: string,
  uploadedFiles?: {
    tickets: File | null;
    team: File | null;
    pto: File | null;
    holidays: File | null;
  },
  validationErrors?: {
    tickets: CSVParseResult<any> | null;
    team: CSVParseResult<any> | null;
    pto: CSVParseResult<any> | null;
    holidays: CSVParseResult<any> | null;
  }
): boolean {
  if (step === 'templates') return true;
  if (step === 'upload') {
    // Require both tickets and team files to proceed
    const hasRequiredFiles = uploadedFiles ? (uploadedFiles.tickets !== null && uploadedFiles.team !== null) : false;
    
    // Check for validation errors in uploaded files
    if (validationErrors && hasRequiredFiles) {
      const hasErrors = 
        (validationErrors.tickets && validationErrors.tickets.errors.length > 0) ||
        (validationErrors.team && validationErrors.team.errors.length > 0) ||
        (validationErrors.pto && validationErrors.pto.errors.length > 0) ||
        (validationErrors.holidays && validationErrors.holidays.errors.length > 0);
      
      return !hasErrors; // Can only proceed if no validation errors
    }
    
    return hasRequiredFiles;
  }
  if (step === 'review') {
    // Require all fields to be filled to create release
    return !!selectedProductId && !!releaseName && !!startDate && !!endDate && new Date(endDate) >= new Date(startDate);
  }
  return false;
}