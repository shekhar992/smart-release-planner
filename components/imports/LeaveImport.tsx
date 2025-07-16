import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Download, 
  Calendar, 
  Info,
  Clock
} from 'lucide-react';

interface LeaveImportProps {
  releaseId?: string;
  onImportComplete?: (success: number, errors: number) => void;
}

export function LeaveImport({}: LeaveImportProps) {
  const getLeaveTemplate = () => {
    const headers = [
      'developerEmail',
      'startDate',
      'endDate',
      'leaveType',
      'status',
      'reason',
      'isPartialDay',
      'hoursPerDay'
    ];

    const sampleData = [
      [
        'john.doe@company.com',
        '2025-08-01',
        '2025-08-05',
        'annual',
        'approved',
        'Summer vacation',
        'false',
        '8'
      ],
      [
        'jane.smith@company.com',
        '2025-07-25',
        '2025-07-25',
        'personal',
        'pending',
        'Personal appointment',
        'true',
        '4'
      ]
    ];

    return [headers, ...sampleData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\\n');
  };

  const downloadTemplate = () => {
    const csvContent = getLeaveTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leaves_import_template_${new Date().toISOString().split('T')[0]}.csv`);
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
            <Calendar className="w-5 h-5" />
            Leave Import Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Download the CSV template to import leave requests and time-off data.
          </p>
          
          <div className="flex items-center gap-4">
            <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Template
            </Button>
            <div className="text-xs text-muted-foreground">
              Includes: Developer Email, Dates, Leave Type, Status
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Template includes:</strong> Developer Email, Start/End Dates, Leave Type 
              (annual, sick, personal, etc.), Status, Reason, and Partial Day options.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold">Leave Import Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Leave import functionality is currently under development. 
              Use the template to prepare your data for when this feature becomes available.
            </p>
            <Badge variant="secondary">In Development</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
