import { useState, useCallback } from 'react';
import { useGantt } from '../contexts/GanttContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Calendar,
  Info
} from 'lucide-react';
import { format } from 'date-fns';

// Import external libraries for file parsing
import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';

interface ImportData {
  tasks: any[];
  developers: any[];
  errors: string[];
  warnings: string[];
}

interface FileUploadProps {
  onDrop: (files: FileList) => void;
  accept: string;
  isLoading: boolean;
}

function FileUploadZone({ onDrop, accept, isLoading }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDrop(e.dataTransfer.files);
    }
  }, [onDrop]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onDrop(e.target.files);
    }
  }, [onDrop]);

  return (
    <div
      className={`group relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ease-in-out ${
        isDragOver 
          ? 'border-blue-500 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm scale-[1.02]' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
      } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <input
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        id="file-upload"
        disabled={isLoading}
      />
      <label htmlFor="file-upload" className="cursor-pointer relative z-10">
        <div className="flex flex-col items-center gap-6">
          {isLoading ? (
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600/20 to-indigo-600/20 animate-pulse"></div>
            </div>
          ) : (
            <div className="relative p-4 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 group-hover:from-blue-500/20 group-hover:to-indigo-500/20 transition-all duration-300">
              <Upload className="w-12 h-12 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
            </div>
          )}
          <div className="space-y-2">
            <p className="text-xl font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">
              {isLoading ? 'Processing your file...' : 'Drop your file here or click to browse'}
            </p>
            <p className="text-sm text-gray-600 font-medium">
              Supports Excel (.xlsx, .xls) and CSV files up to 10MB
            </p>
          </div>
        </div>
      </label>
    </div>
  );
}

export function BulkImport() {
  const { addTask, addDeveloper, developers } = useGantt();
  const [isLoading, setIsLoading] = useState(false);
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importComplete, setImportComplete] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');

  const validateTaskRow = (row: any, index: number): string[] => {
    const errors: string[] = [];
    
    if (!row.title || typeof row.title !== 'string' || row.title.trim() === '') {
      errors.push(`Row ${index + 2}: Title is required`);
    }
    
    if (!row.assignedDeveloper || typeof row.assignedDeveloper !== 'string' || row.assignedDeveloper.trim() === '') {
      errors.push(`Row ${index + 2}: Assigned Developer is required`);
    }
    
    if (!row.startDate) {
      errors.push(`Row ${index + 2}: Start Date is required`);
    } else {
      const startDate = new Date(row.startDate);
      if (isNaN(startDate.getTime())) {
        errors.push(`Row ${index + 2}: Invalid Start Date format`);
      }
    }
    
    if (!row.endDate) {
      errors.push(`Row ${index + 2}: End Date is required`);
    } else {
      const endDate = new Date(row.endDate);
      if (isNaN(endDate.getTime())) {
        errors.push(`Row ${index + 2}: Invalid End Date format`);
      }
      
      if (row.startDate && endDate < new Date(row.startDate)) {
        errors.push(`Row ${index + 2}: End Date must be after Start Date`);
      }
    }
    
    if (row.status && !['not-started', 'in-progress', 'completed', 'blocked'].includes(row.status)) {
      errors.push(`Row ${index + 2}: Status must be one of: not-started, in-progress, completed, blocked`);
    }
    
    if (row.priority && !['low', 'medium', 'high', 'critical'].includes(row.priority)) {
      errors.push(`Row ${index + 2}: Priority must be one of: low, medium, high, critical`);
    }
    
    return errors;
  };

  const validateDeveloperRow = (row: any, index: number): string[] => {
    const errors: string[] = [];
    
    if (!row.name || typeof row.name !== 'string' || row.name.trim() === '') {
      errors.push(`Row ${index + 2}: Name is required`);
    }
    
    if (!row.role || typeof row.role !== 'string' || row.role.trim() === '') {
      errors.push(`Row ${index + 2}: Role is required`);
    }
    
    if (row.email && typeof row.email === 'string' && row.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        errors.push(`Row ${index + 2}: Invalid email format`);
      }
    }
    
    return errors;
  };

  // Simple CSV parser function for when Papa Parse isn't available
  const parseCSV = (csvText: string): any[][] => {
    const lines = csvText.split('\n');
    const result: any[][] = [];
    
    for (const line of lines) {
      if (line.trim() === '') continue;
      
      const row: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
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

  // Simple Excel-like parser for basic functionality
  const parseExcelLike = (data: ArrayBuffer): any[][] => {
    try {
      // Try to use XLSX library if available
      if (typeof XLSX !== 'undefined') {
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      }
    } catch (e) {
      console.warn('XLSX library not available, using fallback');
    }
    
    // Fallback: return empty array with error message
    throw new Error('Excel file parsing requires XLSX library. Please use CSV format instead.');
  };

  const parseFile = useCallback(async (file: File): Promise<ImportData> => {
    return new Promise((resolve, reject) => {
      const fileName = file.name.toLowerCase();
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
      const isCSV = fileName.endsWith('.csv');
      
      if (!isExcel && !isCSV) {
        reject(new Error('Unsupported file format. Please upload .xlsx, .xls, or .csv files.'));
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let parsedData: any[] = [];
          
          if (isExcel) {
            try {
              parsedData = parseExcelLike(data as ArrayBuffer);
            } catch (error) {
              reject(error);
              return;
            }
          } else if (isCSV) {
            const csvText = data as string;
            try {
              // Try Papa Parse first
              if (typeof Papa !== 'undefined' && Papa.parse) {
                const result = Papa.parse(csvText, { header: false, skipEmptyLines: true });
                parsedData = result.data as any[];
              } else {
                // Fallback to simple CSV parser
                parsedData = parseCSV(csvText);
              }
            } catch (error) {
              parsedData = parseCSV(csvText);
            }
          }
          
          if (parsedData.length < 2) {
            reject(new Error('File must contain at least a header row and one data row.'));
            return;
          }
          
          const headers = parsedData[0].map((h: any) => String(h).toLowerCase().trim());
          const rows = parsedData.slice(1);
          
          // Determine file type based on headers
          const isTaskFile = headers.some((h: string) => 
            h.includes('title') || h.includes('task') || h.includes('start') || h.includes('end')
          );
          const isDeveloperFile = headers.some((h: string) => 
            h.includes('name') || h.includes('role') || h.includes('developer')
          );
          
          let tasks: any[] = [];
          let developers: any[] = [];
          let errors: string[] = [];
          let warnings: string[] = [];
          
          if (isTaskFile) {
            // Parse as tasks
            const taskHeaderMap = {
              title: headers.findIndex((h: string) => h.includes('title') || h.includes('task')),
              description: headers.findIndex((h: string) => h.includes('description') || h.includes('desc')),
              assignedDeveloper: headers.findIndex((h: string) => h.includes('assigned') || h.includes('developer')),
              startDate: headers.findIndex((h: string) => h.includes('start')),
              endDate: headers.findIndex((h: string) => h.includes('end')),
              status: headers.findIndex((h: string) => h.includes('status')),
              priority: headers.findIndex((h: string) => h.includes('priority'))
            };
            
            // Check for required headers
            if (taskHeaderMap.title === -1) errors.push('Missing required column: Title/Task');
            if (taskHeaderMap.assignedDeveloper === -1) errors.push('Missing required column: Assigned Developer');
            if (taskHeaderMap.startDate === -1) errors.push('Missing required column: Start Date');
            if (taskHeaderMap.endDate === -1) errors.push('Missing required column: End Date');
            
            if (errors.length === 0) {
              rows.forEach((row, index) => {
                const task = {
                  title: taskHeaderMap.title !== -1 ? row[taskHeaderMap.title] : '',
                  description: taskHeaderMap.description !== -1 ? row[taskHeaderMap.description] || '' : '',
                  assignedDeveloper: taskHeaderMap.assignedDeveloper !== -1 ? row[taskHeaderMap.assignedDeveloper] : '',
                  startDate: taskHeaderMap.startDate !== -1 ? row[taskHeaderMap.startDate] : '',
                  endDate: taskHeaderMap.endDate !== -1 ? row[taskHeaderMap.endDate] : '',
                  status: taskHeaderMap.status !== -1 ? row[taskHeaderMap.status] || 'not-started' : 'not-started',
                  priority: taskHeaderMap.priority !== -1 ? row[taskHeaderMap.priority] || 'medium' : 'medium'
                };
                
                const taskErrors = validateTaskRow(task, index);
                errors.push(...taskErrors);
                
                if (taskErrors.length === 0) {
                  tasks.push(task);
                }
              });
            }
          }
          
          if (isDeveloperFile && !isTaskFile) {
            // Parse as developers
            const devHeaderMap = {
              name: headers.findIndex((h: string) => h.includes('name')),
              role: headers.findIndex((h: string) => h.includes('role') || h.includes('position')),
              email: headers.findIndex((h: string) => h.includes('email')),
              skills: headers.findIndex((h: string) => h.includes('skill'))
            };
            
            // Check for required headers
            if (devHeaderMap.name === -1) errors.push('Missing required column: Name');
            if (devHeaderMap.role === -1) errors.push('Missing required column: Role');
            
            if (errors.length === 0) {
              rows.forEach((row, index) => {
                const developer = {
                  name: devHeaderMap.name !== -1 ? row[devHeaderMap.name] : '',
                  role: devHeaderMap.role !== -1 ? row[devHeaderMap.role] : '',
                  email: devHeaderMap.email !== -1 ? row[devHeaderMap.email] || '' : '',
                  skills: devHeaderMap.skills !== -1 ? row[devHeaderMap.skills] || '' : ''
                };
                
                const devErrors = validateDeveloperRow(developer, index);
                errors.push(...devErrors);
                
                if (devErrors.length === 0) {
                  developers.push(developer);
                }
              });
            }
          }
          
          if (!isTaskFile && !isDeveloperFile) {
            errors.push('Unable to determine file type. Please ensure your file has appropriate headers for tasks or developers.');
          }
          
          resolve({ tasks, developers, errors, warnings });
          
        } catch (error) {
          reject(new Error(`Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Error reading file'));
      
      if (isExcel) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  }, []);

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (files.length === 0) return;
    
    setIsLoading(true);
    setImportData(null);
    setImportComplete(false);
    
    try {
      const file = files[0];
      const data = await parseFile(file);
      setImportData(data);
      setActiveTab('preview');
    } catch (error) {
      setImportData({
        tasks: [],
        developers: [],
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        warnings: []
      });
      setActiveTab('preview');
    } finally {
      setIsLoading(false);
    }
  }, [parseFile]);

  const handleImport = useCallback(async () => {
    if (!importData) return;
    
    setIsLoading(true);
    setImportProgress(0);
    
    try {
      const totalItems = importData.tasks.length + importData.developers.length;
      let completed = 0;
      
      // Import developers first
      for (const dev of importData.developers) {
        // Check if developer already exists
        const existingDev = developers.find(d => 
          d.name.toLowerCase() === dev.name.toLowerCase()
        );
        
        if (!existingDev) {
          await addDeveloper({
            name: dev.name,
            role: dev.role,
            email: dev.email || '',
            skills: dev.skills ? dev.skills.split(',').map((s: string) => s.trim()) : []
          });
        }
        
        completed++;
        setImportProgress(Math.round((completed / totalItems) * 100));
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Import tasks
      for (const task of importData.tasks) {
        // Find developer ID
        const developer = developers.find(d => 
          d.name.toLowerCase() === task.assignedDeveloper.toLowerCase()
        );
        
        if (developer) {
          await addTask({
            title: task.title,
            description: task.description,
            assignedDeveloperId: developer.id,
            startDate: new Date(task.startDate),
            endDate: new Date(task.endDate),
            status: task.status as any,
            priority: task.priority as any
          });
        }
        
        completed++;
        setImportProgress(Math.round((completed / totalItems) * 100));
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      setImportComplete(true);
      setActiveTab('results');
      
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [importData, developers, addDeveloper, addTask]);

  const downloadTemplate = useCallback((type: 'tasks' | 'developers') => {
    const templates = {
      tasks: [
        ['Title', 'Description', 'Assigned Developer', 'Start Date', 'End Date', 'Status', 'Priority'],
        ['Example Task 1', 'Task description here', 'John Doe', '2024-01-15', '2024-01-20', 'not-started', 'high'],
        ['Example Task 2', 'Another task description', 'Jane Smith', '2024-01-21', '2024-01-25', 'in-progress', 'medium']
      ],
      developers: [
        ['Name', 'Role', 'Email', 'Skills'],
        ['John Doe', 'Senior Developer', 'john@example.com', 'React, TypeScript, Node.js'],
        ['Jane Smith', 'UI/UX Designer', 'jane@example.com', 'Figma, Sketch, Prototyping']
      ]
    };
    
    // Create CSV content
    const csvContent = templates[type].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <Upload className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Bulk Import
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
              Import tasks and team members from Excel or CSV files with intelligent data validation and preview
            </p>
          </div>
          
          {/* Template Downloads */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => downloadTemplate('tasks')}
              className="group border-2 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200"
            >
              <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />
              Tasks Template
            </Button>
            <Button 
              variant="outline" 
              onClick={() => downloadTemplate('developers')}
              className="group border-2 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all duration-200"
            >
              <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />
              Team Template
            </Button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg shadow-gray-900/5">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-gray-50/50 rounded-xl m-2 p-1">
              <TabsTrigger 
                value="upload"
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Upload className="w-4 h-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger 
                value="preview" 
                disabled={!importData}
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger 
                value="import" 
                disabled={!importData || importData.errors.length > 0}
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Import
              </TabsTrigger>
              <TabsTrigger 
                value="results" 
                disabled={!importComplete}
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Info className="w-4 h-4" />
                Results
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="p-6 space-y-8">
              {/* Main Upload Card */}
              <Card className="border-0 shadow-xl shadow-gray-900/10 bg-gradient-to-br from-white via-white to-blue-50/30">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                      <Upload className="w-5 h-5" />
                    </div>
                    Upload Your File
                  </CardTitle>
                  <CardDescription className="text-base text-gray-600">
                    Upload an Excel (.xlsx, .xls) or CSV file containing your tasks or team members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUploadZone
                    onDrop={handleFileUpload}
                    accept=".xlsx,.xls,.csv"
                    isLoading={isLoading}
                  />
                </CardContent>
              </Card>

              {/* Format Guidelines */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-0 shadow-lg shadow-gray-900/5 bg-gradient-to-br from-white to-blue-50/20">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                        <Calendar className="w-5 h-5" />
                      </div>
                      Tasks Format
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-gray-600 leading-relaxed">
                      Your task file should include these columns for optimal import:
                    </p>
                    <div className="space-y-3">
                      {[
                        { label: 'Title', required: true },
                        { label: 'Assigned Developer', required: true },
                        { label: 'Start Date', required: true },
                        { label: 'End Date', required: true },
                        { label: 'Description', required: false },
                        { label: 'Status', required: false },
                        { label: 'Priority', required: false },
                      ].map((field, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50/50 transition-colors">
                          <Badge 
                            variant={field.required ? "default" : "outline"}
                            className={field.required ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white" : ""}
                          >
                            {field.required ? 'Required' : 'Optional'}
                          </Badge>
                          <span className="text-sm font-medium">{field.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-gray-900/5 bg-gradient-to-br from-white to-indigo-50/20">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        <Users className="w-5 h-5" />
                      </div>
                      Team Format
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-gray-600 leading-relaxed">
                      Your team file should include these columns for complete profiles:
                    </p>
                    <div className="space-y-3">
                      {[
                        { label: 'Name', required: true },
                        { label: 'Role', required: true },
                        { label: 'Email', required: false },
                        { label: 'Skills', required: false },
                      ].map((field, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50/50 transition-colors">
                          <Badge 
                            variant={field.required ? "default" : "outline"}
                            className={field.required ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : ""}
                          >
                            {field.required ? 'Required' : 'Optional'}
                          </Badge>
                          <span className="text-sm font-medium">{field.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="p-6 space-y-6">
              {importData && (
                <>
                  {importData.errors.length > 0 && (
                    <Alert variant="destructive" className="border-0 bg-gradient-to-r from-red-50 to-rose-50 shadow-lg">
                      <AlertTriangle className="h-5 w-5" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-semibold">Found {importData.errors.length} error(s):</p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {importData.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {importData.warnings.length > 0 && (
                    <Alert className="border-0 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg">
                      <Info className="h-5 w-5" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-semibold">Found {importData.warnings.length} warning(s):</p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {importData.warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {importData.tasks.length > 0 && (
                    <Card className="border-0 shadow-xl shadow-gray-900/10">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                        <CardTitle className="text-lg">Tasks to Import ({importData.tasks.length})</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-64">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50/50">
                                <TableHead className="font-semibold">Title</TableHead>
                                <TableHead className="font-semibold">Assigned To</TableHead>
                                <TableHead className="font-semibold">Start Date</TableHead>
                                <TableHead className="font-semibold">End Date</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold">Priority</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {importData.tasks.map((task, index) => (
                                <TableRow key={index} className="hover:bg-gray-50/50 transition-colors">
                                  <TableCell className="font-medium">{task.title}</TableCell>
                                  <TableCell>{task.assignedDeveloper}</TableCell>
                                  <TableCell>{format(new Date(task.startDate), 'dd/MM/yyyy')}</TableCell>
                                  <TableCell>{format(new Date(task.endDate), 'dd/MM/yyyy')}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="capitalize">{task.status}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={task.priority === 'critical' ? 'destructive' : 'secondary'}
                                      className="capitalize"
                                    >
                                      {task.priority}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}

                  {importData.developers.length > 0 && (
                    <Card className="border-0 shadow-xl shadow-gray-900/10">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                        <CardTitle className="text-lg">Team Members to Import ({importData.developers.length})</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-64">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50/50">
                                <TableHead className="font-semibold">Name</TableHead>
                                <TableHead className="font-semibold">Role</TableHead>
                                <TableHead className="font-semibold">Email</TableHead>
                                <TableHead className="font-semibold">Skills</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {importData.developers.map((dev, index) => (
                                <TableRow key={index} className="hover:bg-gray-50/50 transition-colors">
                                  <TableCell className="font-medium">{dev.name}</TableCell>
                                  <TableCell>{dev.role}</TableCell>
                                  <TableCell>{dev.email || '-'}</TableCell>
                                  <TableCell>{dev.skills || '-'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="import" className="p-6 space-y-6">
              <Card className="border-0 shadow-xl shadow-gray-900/10 bg-gradient-to-br from-white via-white to-green-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    Ready to Import
                  </CardTitle>
                  <CardDescription className="text-base">
                    {importData && (
                      <>
                        {importData.tasks.length > 0 && `${importData.tasks.length} tasks`}
                        {importData.tasks.length > 0 && importData.developers.length > 0 && ' and '}
                        {importData.developers.length > 0 && `${importData.developers.length} team members`}
                        {' '}will be imported into your project.
                      </>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoading && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Importing your data...</span>
                        <span>{importProgress}%</span>
                      </div>
                      <Progress value={importProgress} className="h-2" />
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={handleImport} 
                      disabled={isLoading || !importData || importData.errors.length > 0}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                    >
                      {isLoading ? 'Importing...' : 'Start Import'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('upload')}
                      disabled={isLoading}
                      className="border-2 hover:bg-gray-50"
                    >
                      Upload Different File
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="p-6 space-y-6">
              <Card className="border-0 shadow-xl shadow-gray-900/10 bg-gradient-to-br from-white via-white to-emerald-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    Import Complete
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="border-0 bg-gradient-to-r from-emerald-50 to-green-50 shadow-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <AlertDescription className="text-base">
                      Successfully imported {importData?.tasks.length || 0} tasks and {importData?.developers.length || 0} team members.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => {
                        setImportData(null);
                        setImportComplete(false);
                        setActiveTab('upload');
                      }}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                    >
                      Import More Files
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.reload()}
                      className="border-2 hover:bg-gray-50"
                    >
                      View Gantt Chart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}