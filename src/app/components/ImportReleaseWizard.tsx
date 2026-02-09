import { useState } from 'react';
import { X, Upload, Calendar, Users, CheckCircle, Download, FileText, List, UsersRound, Coffee, PartyPopper } from 'lucide-react';
import { Product } from '../data/mockData';

interface ImportReleaseWizardProps {
  onClose: () => void;
  products: Product[];
  onCreate: (productId: string, name: string, startDate: Date, endDate: Date) => void;
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
    tickets: Array<{ name: string; assignedTo: string; startDate: string; endDate: string; storyPoints: string }>;
    team: Array<{ name: string; role: string }>;
  }>({
    ticketCount: 0,
    teamCount: 0,
    ptoCount: 0,
    holidayCount: 0,
    tickets: [],
    team: []
  });

  const handleFileUpload = async (type: 'tickets' | 'team' | 'pto' | 'holidays', file: File | null) => {
    setUploadedFiles(prev => ({
      ...prev,
      [type]: file
    }));

    // Parse the file to extract data for preview
    if (file) {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (type === 'tickets') {
        const dataLines = lines.slice(1); // Skip header
        const tickets = dataLines.map(line => {
          const parts = line.split(',');
          return {
            name: parts[0] || '',
            storyPoints: parts[1] || '',
            assignedTo: parts[2] || '',
            startDate: parts[3] || '',
            endDate: parts[4] || ''
          };
        });
        setParsedData(prev => ({
          ...prev,
          ticketCount: tickets.length,
          tickets: tickets.slice(0, 5) // Show first 5 for preview
        }));
      } else if (type === 'team') {
        const dataLines = lines.slice(1);
        const team = dataLines.map(line => {
          const parts = line.split(',');
          return {
            name: parts[0] || '',
            role: parts[1] || ''
          };
        });
        setParsedData(prev => ({
          ...prev,
          teamCount: team.length,
          team
        }));
      } else if (type === 'pto') {
        const dataLines = lines.slice(1);
        setParsedData(prev => ({
          ...prev,
          ptoCount: dataLines.length
        }));
      } else if (type === 'holidays') {
        const dataLines = lines.slice(1);
        setParsedData(prev => ({
          ...prev,
          holidayCount: dataLines.length
        }));
      }
    } else {
      // File removed, reset counts
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
      onCreate(selectedProductId, releaseName, new Date(startDate), new Date(endDate));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-medium text-foreground">Create Release via Import</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Step-by-step guide to import your release
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b border-border bg-accent/30">
          <div className="flex items-center justify-between max-w-xl mx-auto">
            {(['templates', 'upload', 'review'] as Step[]).map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  currentStep === step 
                    ? 'bg-primary text-primary-foreground' 
                    : getStepIndex(currentStep) > index
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                {index < 2 && (
                  <div className={`w-12 h-0.5 mx-1 ${
                    getStepIndex(currentStep) > index ? 'bg-primary/40' : 'bg-border'
                  }`} />
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
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-accent/30">
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
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
            disabled={!canProceed(currentStep, selectedProductId, releaseName, startDate, endDate, uploadedFiles)}
            className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
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
      columns: ['Ticket Name', 'Story Points', 'Assigned To', 'Start Date', 'End Date', 'Feature'],
      exampleData: [
        ['User Authentication', '5', 'Alice Chen', '2024-03-01', '2024-03-05', 'Auth System'],
        ['Database Schema', '8', 'Bob Smith', '2024-03-04', '2024-03-08', 'Backend'],
        ['Dashboard UI', '3', 'Carol White', '2024-03-06', '2024-03-10', 'Frontend']
      ]
    },
    {
      id: 'team',
      name: 'Team Roster Template',
      description: 'List of team members who will be working on this release',
      required: true,
      columns: ['Name', 'Role'],
      exampleData: [
        ['Alice Chen', 'Engineer'],
        ['Bob Smith', 'Engineer'],
        ['Carol White', 'Designer']
      ]
    },
    {
      id: 'pto',
      name: 'PTO Template',
      description: 'Planned time off for team members during the release period',
      required: false,
      columns: ['Team Member', 'Start Date', 'End Date', 'Reason'],
      exampleData: [
        ['Alice Chen', '2024-03-15', '2024-03-17', 'Vacation'],
        ['Bob Smith', '2024-03-20', '2024-03-20', 'Personal Day']
      ]
    },
    {
      id: 'holidays',
      name: 'Holidays Template',
      description: 'Company holidays and non-working days during the release',
      required: false,
      columns: ['Holiday Name', 'Start Date', 'End Date'],
      exampleData: [
        ['Memorial Day', '2024-05-27', '2024-05-27'],
        ['Independence Day', '2024-07-04', '2024-07-04']
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
        <h3 className="text-lg font-medium text-foreground mb-2">Download Templates</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Download these templates to prepare your data. Fill them out with your release information, 
          then upload them in a later step.
        </p>
      </div>

      <div className="space-y-3">
        {templates.map((template) => (
          <div 
            key={template.id}
            className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-all duration-150"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium text-foreground">{template.name}</h4>
                  {template.required ? (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Required
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      Optional
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {template.description}
                </p>
              </div>
              <button
                onClick={() => downloadTemplate(template)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-150 flex-shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-accent/50 border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">💡</span>
          </div>
          <div>
            <p className="text-xs font-medium text-foreground mb-1">Templates Include Examples</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
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
  onFileUpload
}: {
  uploadedFiles: {
    tickets: File | null;
    team: File | null;
    pto: File | null;
    holidays: File | null;
  };
  onFileUpload: (type: 'tickets' | 'team' | 'pto' | 'holidays', file: File | null) => void;
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
        <h3 className="text-lg font-medium text-foreground mb-2">Populate & Upload Data</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Fill out the templates you downloaded in Step 1 with your own data, then upload them below.
        </p>
        <div className="bg-accent/50 border border-border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm">📋</span>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">What you need to upload:</p>
              <ul className="text-xs text-muted-foreground space-y-1 leading-relaxed">
                <li><span className="font-medium text-primary">Required:</span> Tickets and Team files must be uploaded</li>
                <li><span className="font-medium text-muted-foreground">Optional:</span> PTO and Holidays can be added later if needed</li>
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
            className="bg-card border border-border rounded-lg p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <h4 className="text-sm font-medium text-foreground">{fileType.name}</h4>
                  {fileType.required ? (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Required
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      Optional
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">{fileType.description}</p>

                {uploadedFiles[fileType.id] ? (
                  <div className="flex items-center gap-2 bg-accent/50 rounded-lg px-3 py-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate flex-1">
                      {uploadedFiles[fileType.id]!.name}
                    </span>
                    <button
                      onClick={() => handleRemoveFile(fileType.id)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    >
                      Remove
                    </button>
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
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium border border-border bg-card rounded-lg hover:bg-accent cursor-pointer transition-all duration-150"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Choose File
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Validation message */}
      {!hasRequiredFiles && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs">⚠️</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              Please upload both <span className="font-medium">Tickets</span> and <span className="font-medium">Team</span> files to continue. 
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
  uploadedFiles,
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
    tickets: Array<{ name: string; assignedTo: string; startDate: string; endDate: string; storyPoints: string }>;
    team: Array<{ name: string; role: string }>;
  };
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">Review & Create</h3>
        <p className="text-sm text-muted-foreground">
          Configure your release details and review what will be created
        </p>
      </div>

      {/* Configuration Section */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Product
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => onSelectProduct(e.target.value)}
            className="w-full text-sm font-medium text-foreground bg-card border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Release Name
          </label>
          <input
            type="text"
            value={releaseName}
            onChange={(e) => onSetReleaseName(e.target.value)}
            placeholder="e.g., Q1 2024 Release"
            className="w-full text-sm font-medium text-foreground bg-card border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Timeline
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onSetStartDate(e.target.value)}
              className="text-sm font-medium text-foreground bg-card border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => onSetEndDate(e.target.value)}
              className="text-sm font-medium text-foreground bg-card border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Summary Counts */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          What will be created
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <List className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">{parsedData.ticketCount}</div>
                <div className="text-xs text-muted-foreground">Tickets</div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <UsersRound className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">{parsedData.teamCount}</div>
                <div className="text-xs text-muted-foreground">Team Members</div>
              </div>
            </div>
          </div>

          {parsedData.ptoCount > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Coffee className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-foreground">{parsedData.ptoCount}</div>
                  <div className="text-xs text-muted-foreground">PTO Entries</div>
                </div>
              </div>
            </div>
          )}

          {parsedData.holidayCount > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <PartyPopper className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-foreground">{parsedData.holidayCount}</div>
                  <div className="text-xs text-muted-foreground">Holidays</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Preview */}
      {(parsedData.ticketCount > 0 || parsedData.teamCount > 0) && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Preview
          </h4>
          
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {/* Tickets Preview */}
            {parsedData.ticketCount > 0 && (
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2 mb-3">
                  <List className="w-4 h-4 text-muted-foreground" />
                  <h5 className="text-sm font-medium text-foreground">Tickets</h5>
                  <span className="text-xs text-muted-foreground">({parsedData.ticketCount} total)</span>
                </div>
                <div className="space-y-2">
                  {parsedData.tickets.map((ticket, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs">
                      <div className="flex-shrink-0 w-6 h-6 rounded bg-accent flex items-center justify-center text-[10px] font-medium text-muted-foreground mt-0.5">
                        {ticket.storyPoints}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{ticket.name}</p>
                        <p className="text-muted-foreground">
                          {ticket.assignedTo} • {ticket.startDate} → {ticket.endDate}
                        </p>
                      </div>
                    </div>
                  ))}
                  {parsedData.ticketCount > 5 && (
                    <p className="text-xs text-muted-foreground italic">
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
                  <UsersRound className="w-4 h-4 text-muted-foreground" />
                  <h5 className="text-sm font-medium text-foreground">Team</h5>
                  <span className="text-xs text-muted-foreground">({parsedData.teamCount} members)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {parsedData.team.map((member, index) => (
                    <div key={index} className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-[10px] font-medium text-primary">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="text-xs">
                        <p className="font-medium text-foreground">{member.name}</p>
                        <p className="text-muted-foreground text-[10px]">{member.role}</p>
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
  }
): boolean {
  if (step === 'templates') return true;
  if (step === 'upload') {
    // Require both tickets and team files to proceed
    return uploadedFiles ? (uploadedFiles.tickets !== null && uploadedFiles.team !== null) : false;
  }
  if (step === 'review') {
    // Require all fields to be filled to create release
    return !!selectedProductId && !!releaseName && !!startDate && !!endDate && new Date(endDate) >= new Date(startDate);
  }
  return false;
}