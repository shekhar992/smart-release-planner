import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Download, 
  FileText, 
  Info,
  Target,
  Layers
} from 'lucide-react';

interface EpicImportProps {
  releaseId?: string;
  onImportComplete?: (success: number, errors: number) => void;
}

export function EpicImport({ releaseId, onImportComplete }: EpicImportProps) {
  const getEpicTemplate = () => {
    const headers = [
      'title',
      'description',
      'startDate',
      'endDate',
      'status',
      'priority',
      'color',
      'labels'
    ];

    const sampleData = [
      [
        'User Authentication System',
        'Complete user authentication system with JWT tokens, role-based access, and security features',
        '2025-07-20',
        '2025-08-15',
        'in-progress',
        'high',
        '#3b82f6',
        'backend,security,authentication'
      ],
      [
        'Dashboard Redesign',
        'Modern dashboard redesign with improved UX and real-time data visualization',
        '2025-08-01',
        '2025-09-01',
        'planning',
        'medium',
        '#10b981',
        'frontend,ui,design,dashboard'
      ]
    ];

    return [headers, ...sampleData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\\n');
  };

  const downloadTemplate = () => {
    const csvContent = getEpicTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `epics_import_template_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Epic Import Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Download the CSV template to import epic and feature definitions.
          </p>
          
          <div className="flex items-center gap-4">
            <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Template
            </Button>
            <div className="text-xs text-muted-foreground">
              Includes: Title, Description, Dates, Status, Priority, Colors
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Template includes:</strong> Title, Description, Start/End Dates, Status, 
              Priority, Color coding, and Labels for epic organization.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <Layers className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold">Epic Import Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Epic import functionality is currently under development. 
              Use the template to prepare your epic data for when this feature becomes available.
            </p>
            <Badge variant="secondary">In Development</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
