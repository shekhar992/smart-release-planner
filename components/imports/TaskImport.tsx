import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Calendar,
  User,
  Target
} from 'lucide-react';
import { Task } from '../../types';
import { useGantt } from '../../contexts/GanttContext';
import { v4 as uuidv4 } from 'uuid';

interface TaskImportProps {
  releaseId?: string;
  onImportComplete?: (success: number, errors: number) => void;
}

interface ImportResult {
  success: Task[];
  errors: Array<{ row: number; message: string; data: any }>;
}

export function TaskImport({ releaseId, onImportComplete }: TaskImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [csvContent, setCsvContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addTask, developers } = useGantt();

  // CSV Template for tasks
  const getTaskTemplate = () => {
    const headers = [
      'title',
      'description', 
      'taskType',
      'priority',
      'status',
      'assignedDeveloperEmail',
      'startDate',
      'endDate',
      'storyPoints',
      'originalEstimate',
      'epicId',
      'parentTaskId',
      'dependencies',
      'labels',
      'jiraKey'
    ];

    const sampleData = [
      [
        'User Authentication System',
        'Implement JWT-based authentication with role management',
        'epic',
        'high',
        'not-started',
        'john.doe@company.com',
        '2025-07-20',
        '2025-08-15',
        '21',
        '168',
        '',
        '',
        '',
        'backend,security,auth',
        'AUTH-001'
      ],
      [
        'Login Page Design',
        'Create responsive login page with form validation',
        'story',
        'medium',
        'not-started',
        'jane.smith@company.com',
        '2025-07-20',
        '2025-07-25',
        '5',
        '40',
        'epic-auth-001',
        '',
        '',
        'frontend,ui,forms',
        'AUTH-002'
      ],
      [
        'Password Reset Flow',
        'Implement forgot password and reset functionality',
        'task',
        'medium',
        'not-started',
        'bob.wilson@company.com',
        '2025-07-26',
        '2025-07-30',
        '3',
        '24',
        'epic-auth-001',
        '',
        'AUTH-002',
        'backend,email',
        'AUTH-003'
      ],
      [
        'Unit Tests for Auth',
        'Write comprehensive unit tests for authentication',
        'task',
        'low',
        'not-started',
        'alice.brown@company.com',
        '2025-08-01',
        '2025-08-05',
        '2',
        '16',
        'epic-auth-001',
        '',
        'AUTH-002,AUTH-003',
        'testing,backend',
        'AUTH-004'
      ],
      [
        'Fix Login Button Bug',
        'Login button not responsive on mobile devices',
        'bug',
        'high',
        'in-progress',
        'jane.smith@company.com',
        '2025-07-18',
        '2025-07-19',
        '1',
        '4',
        '',
        'AUTH-002',
        '',
        'frontend,mobile,bugfix',
        'AUTH-005'
      ]
    ];

    return [headers, ...sampleData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\\n');
  };

  const downloadTemplate = () => {
    const csvContent = getTaskTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tasks_import_template_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (csvText: string): string[][] => {
    const lines = csvText.trim().split('\\n');
    const result: string[][] = [];
    
    for (const line of lines) {
      const row: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"';
            i++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current.trim());
      result.push(row);
    }
    
    return result;
  };

  const findDeveloperByEmail = (email: string) => {
    return developers.find(dev => dev.email.toLowerCase() === email.toLowerCase());
  };

  const validateAndParseTask = (row: string[], headers: string[], rowIndex: number): Task | { error: string } => {
    try {
      const data: any = {};
      headers.forEach((header, index) => {
        data[header] = row[index] || '';
      });

      // Required fields validation
      if (!data.title?.trim()) {
        return { error: 'Title is required' };
      }

      // Find developer
      let assignedDeveloperId = '';
      if (data.assignedDeveloperEmail?.trim()) {
        const developer = findDeveloperByEmail(data.assignedDeveloperEmail);
        if (!developer) {
          return { error: `Developer with email "${data.assignedDeveloperEmail}" not found` };
        }
        assignedDeveloperId = developer.id;
      } else {
        return { error: 'Assigned developer email is required' };
      }

      // Date validation
      const startDate = data.startDate ? new Date(data.startDate) : new Date();
      const endDate = data.endDate ? new Date(data.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      if (isNaN(startDate.getTime())) {
        return { error: 'Invalid start date format. Use YYYY-MM-DD' };
      }
      if (isNaN(endDate.getTime())) {
        return { error: 'Invalid end date format. Use YYYY-MM-DD' };
      }
      if (endDate < startDate) {
        return { error: 'End date must be after start date' };
      }

      // Task type validation
      const validTaskTypes = ['epic', 'story', 'task', 'subtask', 'bug'];
      const taskType = data.taskType?.toLowerCase() || 'task';
      if (!validTaskTypes.includes(taskType)) {
        return { error: `Invalid task type. Must be one of: ${validTaskTypes.join(', ')}` };
      }

      const task: Task = {
        id: uuidv4(),
        title: data.title.trim(),
        description: data.description?.trim() || '',
        startDate,
        endDate,
        assignedDeveloperId,
        status: data.status?.trim() || 'not-started',
        priority: data.priority?.trim() || 'medium',
        taskType: taskType as Task['taskType'],
        storyPoints: data.storyPoints ? parseInt(data.storyPoints) : undefined,
        originalEstimate: data.originalEstimate ? parseInt(data.originalEstimate) : undefined,
        remainingEstimate: data.originalEstimate ? parseInt(data.originalEstimate) : undefined,
        timeSpent: 0,
        epicId: data.epicId?.trim() || undefined,
        parentTaskId: data.parentTaskId?.trim() || undefined,
        dependencies: data.dependencies?.trim() ? data.dependencies.split(',').map((d: string) => d.trim()) : undefined,
        labels: data.labels?.trim() ? data.labels.split(',').map((l: string) => l.trim()) : undefined,
        jiraKey: data.jiraKey?.trim() || undefined
      };

      return task;
    } catch (error) {
      return { error: `Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  const processCSV = async (csvText: string): Promise<ImportResult> => {
    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      throw new Error('CSV must contain at least a header row and one data row');
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const dataRows = rows.slice(1);

    const result: ImportResult = {
      success: [],
      errors: []
    };

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 2; // +2 because we start from index 0 and skip header

      if (row.every(cell => !cell.trim())) {
        continue; // Skip empty rows
      }

      const parseResult = validateAndParseTask(row, headers, rowNumber);
      
      if ('error' in parseResult) {
        result.errors.push({
          row: rowNumber,
          message: parseResult.error,
          data: row
        });
      } else {
        result.success.push(parseResult);
      }
    }

    return result;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const text = await file.text();
      setCsvContent(text);
      const result = await processCSV(text);
      setImportResult(result);
    } catch (error) {
      setImportResult({
        success: [],
        errors: [{ 
          row: 0, 
          message: error instanceof Error ? error.message : 'Failed to process file', 
          data: [] 
        }]
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextImport = async () => {
    if (!csvContent.trim()) return;

    setIsProcessing(true);
    try {
      const result = await processCSV(csvContent);
      setImportResult(result);
    } catch (error) {
      setImportResult({
        success: [],
        errors: [{ 
          row: 0, 
          message: error instanceof Error ? error.message : 'Failed to process CSV content', 
          data: [] 
        }]
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmImport = async () => {
    if (!importResult?.success.length) return;

    setIsProcessing(true);
    try {
      for (const task of importResult.success) {
        await addTask(task);
      }
      
      onImportComplete?.(importResult.success.length, importResult.errors.length);
      setImportResult(null);
      setCsvContent('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Task Import Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Download the CSV template with sample data to get started with task imports.
          </p>
          
          <div className="flex items-center gap-4">
            <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Template
            </Button>
            <div className="text-xs text-muted-foreground">
              Includes: Tasks, Stories, Epics, Bugs with all required fields
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Template includes:</strong> Title, Description, Task Type, Priority, Status, 
              Assigned Developer, Dates, Story Points, Epic Relations, Dependencies, and more.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Import Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-4">
            <h4 className="font-medium">Option 1: Upload CSV File</h4>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <div className="text-sm text-muted-foreground">
                Select a CSV file to upload
              </div>
            </div>
          </div>

          <Separator />

          {/* Text Import */}
          <div className="space-y-4">
            <h4 className="font-medium">Option 2: Paste CSV Content</h4>
            <Textarea
              placeholder="Paste your CSV content here..."
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              disabled={isProcessing}
              rows={8}
              className="font-mono text-sm"
            />
            <Button 
              onClick={handleTextImport} 
              disabled={!csvContent.trim() || isProcessing}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Process CSV Content
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant="default" className="bg-green-100 text-green-800">
                {importResult.success.length} tasks ready to import
              </Badge>
              {importResult.errors.length > 0 && (
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  {importResult.errors.length} errors found
                </Badge>
              )}
            </div>

            {/* Success Preview */}
            {importResult.success.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-green-700">Tasks to Import:</h5>
                <div className="max-h-40 overflow-y-auto border rounded-md p-3 bg-green-50">
                  {importResult.success.slice(0, 5).map((task, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm py-1">
                      <Target className="w-3 h-3" />
                      <span className="font-medium">{task.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {task.taskType}
                      </Badge>
                      <User className="w-3 h-3 ml-2" />
                      <span className="text-muted-foreground">
                        {developers.find(d => d.id === task.assignedDeveloperId)?.name}
                      </span>
                    </div>
                  ))}
                  {importResult.success.length > 5 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      ...and {importResult.success.length - 5} more tasks
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Errors */}
            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-red-700">Errors Found:</h5>
                <div className="max-h-40 overflow-y-auto border rounded-md p-3 bg-red-50">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="text-sm py-1">
                      <span className="font-medium text-red-700">Row {error.row}:</span>
                      <span className="ml-2">{error.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Import Action */}
            {importResult.success.length > 0 && (
              <div className="flex items-center gap-4 pt-4">
                <Button 
                  onClick={confirmImport}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Import {importResult.success.length} Tasks
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setImportResult(null);
                    setCsvContent('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
