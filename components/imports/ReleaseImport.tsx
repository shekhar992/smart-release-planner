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
  Target, 
  CheckCircle2, 
  Info,
  Calendar,
  Package
} from 'lucide-react';
import { Release } from '../../contexts/ReleaseContext';
import { useReleases } from '../../contexts/ReleaseContext';

interface ReleaseImportProps {
  onImportComplete?: (success: number, errors: number) => void;
}

interface ImportResult {
  success: Omit<Release, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'team' | 'tasks'>[];
  errors: Array<{ row: number; message: string; data: any }>;
}

export function ReleaseImport({ onImportComplete }: ReleaseImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [csvContent, setCsvContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createRelease } = useReleases();

  const getReleaseTemplate = () => {
    const headers = [
      'name',
      'description',
      'version',
      'startDate',
      'targetDate',
      'status',
      'priority',
      'color'
    ];

    const sampleData = [
      [
        'Q4 2025 Release',
        'Major feature release including user authentication, dashboard redesign, and performance improvements',
        '2.1.0',
        '2025-10-01',
        '2025-12-15',
        'planning',
        'high',
        '#3b82f6'
      ],
      [
        'Mobile App Launch',
        'Initial mobile application release with core features',
        '1.0.0',
        '2025-08-01',
        '2025-11-30',
        'in-progress',
        'critical',
        '#ef4444'
      ],
      [
        'Bug Fix Release',
        'Critical bug fixes and minor improvements',
        '2.0.1',
        '2025-07-20',
        '2025-08-05',
        'in-progress',
        'medium',
        '#f59e0b'
      ]
    ];

    return [headers, ...sampleData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\\n');
  };

  const downloadTemplate = () => {
    const csvContent = getReleaseTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `releases_import_template_${new Date().toISOString().split('T')[0]}.csv`);
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
            i++;
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

  const validateAndParseRelease = (row: string[], headers: string[]) => {
    try {
      const data: any = {};
      headers.forEach((header, index) => {
        data[header] = row[index] || '';
      });

      if (!data.name?.trim()) {
        return { error: 'Name is required' };
      }

      if (!data.version?.trim()) {
        return { error: 'Version is required' };
      }

      const startDate = data.startDate ? new Date(data.startDate) : new Date();
      const targetDate = data.targetDate ? new Date(data.targetDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

      if (isNaN(startDate.getTime())) {
        return { error: 'Invalid start date format. Use YYYY-MM-DD' };
      }
      if (isNaN(targetDate.getTime())) {
        return { error: 'Invalid target date format. Use YYYY-MM-DD' };
      }
      if (targetDate < startDate) {
        return { error: 'Target date must be after start date' };
      }

      const validStatuses = ['planning', 'in-progress', 'delayed', 'completed', 'cancelled'];
      const status = data.status?.toLowerCase() || 'planning';
      if (!validStatuses.includes(status)) {
        return { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` };
      }

      const validPriorities = ['low', 'medium', 'high', 'critical'];
      const priority = data.priority?.toLowerCase() || 'medium';
      if (!validPriorities.includes(priority)) {
        return { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` };
      }

      const release = {
        name: data.name.trim(),
        description: data.description?.trim() || '',
        version: data.version.trim(),
        startDate,
        targetDate,
        status: status as Release['status'],
        priority: priority as Release['priority'],
  color: data.color?.trim() || '#3b82f6',
  // Default imports to project releases unless specified elsewhere
  releaseType: 'project' as Release['releaseType']
      };

      return release;
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
      const rowNumber = i + 2;

      if (row.every(cell => !cell.trim())) {
        continue;
      }

      const parseResult = validateAndParseRelease(row, headers);
      
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
      for (const release of importResult.success) {
        await createRelease(release);
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Release Import Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Download the CSV template to import release and version information.
          </p>
          
          <div className="flex items-center gap-4">
            <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Template
            </Button>
            <div className="text-xs text-muted-foreground">
              Includes: Name, Version, Dates, Status, Priority
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Template includes:</strong> Name, Description, Version, Start/Target Dates, 
              Status, Priority, and Color configuration.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Releases
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
            </div>
          </div>

          <Separator />

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
                {importResult.success.length} releases ready to import
              </Badge>
              {importResult.errors.length > 0 && (
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  {importResult.errors.length} errors found
                </Badge>
              )}
            </div>

            {importResult.success.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-green-700">Releases to Import:</h5>
                <div className="max-h-40 overflow-y-auto border rounded-md p-3 bg-green-50">
                  {importResult.success.map((release, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm py-1">
                      <Package className="w-3 h-3" />
                      <span className="font-medium">{release.name}</span>
                      <Badge variant="outline" className="text-xs">
                        v{release.version}
                      </Badge>
                      <Calendar className="w-3 h-3 ml-2" />
                      <span className="text-muted-foreground">
                        {release.startDate.toLocaleDateString()} - {release.targetDate.toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {importResult.success.length > 0 && (
              <div className="flex items-center gap-4 pt-4">
                <Button 
                  onClick={confirmImport}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Import {importResult.success.length} Releases
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
