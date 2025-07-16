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
  Users, 
  CheckCircle2, 
  Info,
  User,
  Mail,
  Shield
} from 'lucide-react';
import { Developer } from '../../types';
import { useGantt } from '../../contexts/GanttContext';
import { v4 as uuidv4 } from 'uuid';

interface DeveloperImportProps {
  releaseId?: string;
  onImportComplete?: (success: number, errors: number) => void;
}

interface ImportResult {
  success: Developer[];
  errors: Array<{ row: number; message: string; data: any }>;
}

export function DeveloperImport({ onImportComplete }: DeveloperImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [csvContent, setCsvContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addDeveloper, developers } = useGantt();

  // CSV Template for developers
  const getDeveloperTemplate = () => {
    const headers = [
      'name',
      'email',
      'role',
      'skills',
      'avatar',
      'workingDays',
      'workingHoursStart',
      'workingHoursEnd',
      'timeZone',
      'leaveBalanceDays'
    ];

    const sampleData = [
      [
        'John Doe',
        'john.doe@company.com',
        'Senior Frontend Developer',
        'React,TypeScript,JavaScript,CSS,HTML',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        '1,2,3,4,5',
        '09:00',
        '17:00',
        'America/New_York',
        '25'
      ],
      [
        'Jane Smith',
        'jane.smith@company.com',
        'Backend Developer',
        'Node.js,Python,PostgreSQL,Docker,AWS',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
        '1,2,3,4,5',
        '08:30',
        '16:30',
        'America/New_York',
        '30'
      ],
      [
        'Bob Wilson',
        'bob.wilson@company.com',
        'Full Stack Developer',
        'React,Node.js,MongoDB,JavaScript,DevOps',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
        '1,2,3,4,5',
        '10:00',
        '18:00',
        'America/Los_Angeles',
        '20'
      ],
      [
        'Alice Brown',
        'alice.brown@company.com',
        'QA Engineer',
        'Testing,Selenium,Jest,Cypress,Manual Testing',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
        '1,2,3,4,5',
        '09:00',
        '17:00',
        'Europe/London',
        '28'
      ],
      [
        'Charlie Davis',
        'charlie.davis@company.com',
        'DevOps Engineer',
        'Docker,Kubernetes,AWS,Terraform,Jenkins',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
        '1,2,3,4,5',
        '07:00',
        '15:00',
        'Asia/Tokyo',
        '22'
      ]
    ];

    return [headers, ...sampleData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\\n');
  };

  const downloadTemplate = () => {
    const csvContent = getDeveloperTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `developers_import_template_${new Date().toISOString().split('T')[0]}.csv`);
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

  const isEmailUnique = (email: string, excludeId?: string) => {
    return !developers.some(dev => 
      dev.email.toLowerCase() === email.toLowerCase() && dev.id !== excludeId
    );
  };

  const validateAndParseDeveloper = (row: string[], headers: string[]): Developer | { error: string } => {
    try {
      const data: any = {};
      headers.forEach((header, index) => {
        data[header] = row[index] || '';
      });

      // Required fields validation
      if (!data.name?.trim()) {
        return { error: 'Name is required' };
      }

      if (!data.email?.trim()) {
        return { error: 'Email is required' };
      }

      // Email format validation
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return { error: 'Invalid email format' };
      }

      // Check for duplicate email
      if (!isEmailUnique(data.email)) {
        return { error: `Email "${data.email}" already exists` };
      }

      if (!data.role?.trim()) {
        return { error: 'Role is required' };
      }

      // Parse working days
      let workingDays = [1, 2, 3, 4, 5]; // Default Monday to Friday
      if (data.workingDays?.trim()) {
        try {
          workingDays = data.workingDays.split(',').map((d: string) => parseInt(d.trim()));
          if (workingDays.some((d: number) => isNaN(d) || d < 0 || d > 6)) {
            return { error: 'Working days must be numbers 0-6 (0=Sunday, 6=Saturday)' };
          }
        } catch {
          return { error: 'Invalid working days format. Use comma-separated numbers (e.g., "1,2,3,4,5")' };
        }
      }

      // Parse skills
      const skills = data.skills?.trim() ? 
        data.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : 
        [];

      // Validate working hours
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      const workingHoursStart = data.workingHoursStart?.trim() || '09:00';
      const workingHoursEnd = data.workingHoursEnd?.trim() || '17:00';

      if (!timeRegex.test(workingHoursStart)) {
        return { error: 'Invalid working hours start format. Use HH:MM (e.g., "09:00")' };
      }

      if (!timeRegex.test(workingHoursEnd)) {
        return { error: 'Invalid working hours end format. Use HH:MM (e.g., "17:00")' };
      }

      // Parse leave balance
      let leaveBalanceDays = 25; // Default
      if (data.leaveBalanceDays?.trim()) {
        leaveBalanceDays = parseInt(data.leaveBalanceDays);
        if (isNaN(leaveBalanceDays) || leaveBalanceDays < 0) {
          return { error: 'Leave balance days must be a positive number' };
        }
      }

      const developer: Developer = {
        id: uuidv4(),
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        role: data.role.trim(),
        skills,
        avatar: data.avatar?.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
        leaves: [],
        leaveBalance: {
          developerId: '', // Will be set after creation
          year: new Date().getFullYear(),
          totalDays: leaveBalanceDays,
          usedDays: 0,
          pendingDays: 0,
          remainingDays: leaveBalanceDays,
          carryOverDays: 0
        },
        workingCalendar: {
          developerId: '', // Will be set after creation
          workingDays,
          workingHours: {
            start: workingHoursStart,
            end: workingHoursEnd
          },
          timeZone: data.timeZone?.trim() || 'America/New_York',
          publicHolidays: [],
          customNonWorkingDays: []
        }
      };

      // Set developer ID in nested objects
      developer.leaveBalance!.developerId = developer.id;
      developer.workingCalendar!.developerId = developer.id;

      return developer;
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

    const emailCheck = new Set<string>();

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 2; // +2 because we start from index 0 and skip header

      if (row.every(cell => !cell.trim())) {
        continue; // Skip empty rows
      }

      const parseResult = validateAndParseDeveloper(row, headers);
      
      if ('error' in parseResult) {
        result.errors.push({
          row: rowNumber,
          message: parseResult.error,
          data: row
        });
      } else {
        // Check for duplicate emails within the import
        if (emailCheck.has(parseResult.email)) {
          result.errors.push({
            row: rowNumber,
            message: `Duplicate email "${parseResult.email}" in import data`,
            data: row
          });
        } else {
          emailCheck.add(parseResult.email);
          result.success.push(parseResult);
        }
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
      for (const developer of importResult.success) {
        await addDeveloper(developer);
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
            <Users className="w-5 h-5" />
            Developer Import Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Download the CSV template with sample developer data to get started with team member imports.
          </p>
          
          <div className="flex items-center gap-4">
            <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Template
            </Button>
            <div className="text-xs text-muted-foreground">
              Includes: Name, Email, Role, Skills, Working Hours, Leave Balance
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Template includes:</strong> Name, Email, Role, Skills, Avatar, Working Days/Hours, 
              Time Zone, and Leave Balance configuration.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Import Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Developers
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
                {importResult.success.length} developers ready to import
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
                <h5 className="font-medium text-green-700">Developers to Import:</h5>
                <div className="max-h-40 overflow-y-auto border rounded-md p-3 bg-green-50">
                  {importResult.success.slice(0, 5).map((developer, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm py-1">
                      <User className="w-3 h-3" />
                      <span className="font-medium">{developer.name}</span>
                      <Mail className="w-3 h-3 ml-2" />
                      <span className="text-muted-foreground">{developer.email}</span>
                      <Shield className="w-3 h-3 ml-2" />
                      <Badge variant="outline" className="text-xs">
                        {developer.role}
                      </Badge>
                    </div>
                  ))}
                  {importResult.success.length > 5 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      ...and {importResult.success.length - 5} more developers
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
                  Import {importResult.success.length} Developers
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
