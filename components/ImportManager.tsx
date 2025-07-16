import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Upload, 
  FileText, 
  Users, 
  Calendar, 
  Target, 
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { TaskImport } from './imports/TaskImport';
import { DeveloperImport } from './imports/DeveloperImport';
import { ReleaseImport } from './imports/ReleaseImport';
import { LeaveImport } from './imports/LeaveImport';
import { EpicImport } from './imports/EpicImport';

interface ImportManagerProps {
  releaseId?: string;
  onImportComplete?: (type: string, count: number) => void;
}

export function ImportManager({ releaseId, onImportComplete }: ImportManagerProps) {
  const [activeTab, setActiveTab] = useState('tasks');
  const [importStats, setImportStats] = useState<{
    [key: string]: { success: number; errors: number; }
  }>({});

  const handleImportComplete = (type: string, success: number, errors: number) => {
    setImportStats(prev => ({
      ...prev,
      [type]: { success, errors }
    }));
    onImportComplete?.(type, success);
  };

  const importTypes = [
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckCircle2,
      description: 'Import tasks, stories, epics, and bugs',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'developers',
      label: 'Team Members',
      icon: Users,
      description: 'Import developers and team members',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'releases',
      label: 'Releases',
      icon: Target,
      description: 'Import release and version information',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'leaves',
      label: 'Leave Requests',
      icon: Calendar,
      description: 'Import leave and time-off data',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: 'epics',
      label: 'Epics',
      icon: FileText,
      description: 'Import epic and feature definitions',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  const getTotalStats = () => {
    const totals = Object.values(importStats).reduce(
      (acc, curr) => ({
        success: acc.success + curr.success,
        errors: acc.errors + curr.errors
      }),
      { success: 0, errors: 0 }
    );
    return totals;
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Import Center</h2>
          <p className="text-muted-foreground">
            Import data using CSV templates or custom formats
          </p>
        </div>
        
        {/* Import Statistics */}
        {(stats.success > 0 || stats.errors > 0) && (
          <div className="flex items-center gap-4">
            {stats.success > 0 && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {stats.success} imported
              </Badge>
            )}
            {stats.errors > 0 && (
              <Badge variant="destructive" className="bg-red-100 text-red-800">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {stats.errors} errors
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Release Context Alert */}
      {releaseId && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Importing data for the current release. All imported items will be associated with this release.
          </AlertDescription>
        </Alert>
      )}

      {/* Import Type Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {importTypes.map((type) => {
          const Icon = type.icon;
          const typeStats = importStats[type.id];
          
          return (
            <Card 
              key={type.id}
              className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
                activeTab === type.id 
                  ? 'border-l-primary bg-primary/5' 
                  : 'border-l-transparent hover:border-l-gray-300'
              }`}
              onClick={() => setActiveTab(type.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${type.bgColor}`}>
                    <Icon className={`w-5 h-5 ${type.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{type.label}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {type.description}
                    </p>
                    {typeStats && (
                      <div className="flex items-center gap-2 mt-1">
                        {typeStats.success > 0 && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            {typeStats.success}
                          </Badge>
                        )}
                        {typeStats.errors > 0 && (
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                            {typeStats.errors} errors
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Import Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {importTypes.find(t => t.id === activeTab)?.label} Import
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              {importTypes.map((type) => (
                <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-1">
                  <type.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{type.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="tasks" className="mt-6">
              <TaskImport 
                releaseId={releaseId} 
                onImportComplete={(success, errors) => handleImportComplete('tasks', success, errors)}
              />
            </TabsContent>

            <TabsContent value="developers" className="mt-6">
              <DeveloperImport 
                releaseId={releaseId}
                onImportComplete={(success, errors) => handleImportComplete('developers', success, errors)}
              />
            </TabsContent>

            <TabsContent value="releases" className="mt-6">
              <ReleaseImport 
                onImportComplete={(success, errors) => handleImportComplete('releases', success, errors)}
              />
            </TabsContent>

            <TabsContent value="leaves" className="mt-6">
              <LeaveImport 
                releaseId={releaseId}
                onImportComplete={(success, errors) => handleImportComplete('leaves', success, errors)}
              />
            </TabsContent>

            <TabsContent value="epics" className="mt-6">
              <EpicImport 
                releaseId={releaseId}
                onImportComplete={(success, errors) => handleImportComplete('epics', success, errors)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
