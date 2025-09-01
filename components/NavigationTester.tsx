import { useState } from 'react';
import { useProjects } from '../contexts/ProjectContext';
import { Release } from '../contexts/ReleaseContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface NavigationTesterProps {
  onNavigateToProject: (project: any) => void;
  onNavigateToRelease: (release: Release) => void;
  onNavigateToProjects: () => void;
}

export function NavigationTester({ 
  onNavigateToProject, 
  onNavigateToRelease, 
  onNavigateToProjects 
}: NavigationTesterProps) {
  const { projects, getProjectReleases } = useProjects();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testFlow1 = () => {
    // Dashboard → Project Detail → Release Detail
    addTestResult('Testing Flow 1: Dashboard → Project → Release');
    const project = projects[0];
    if (project) {
      addTestResult(`Navigating to project: ${project.name}`);
      onNavigateToProject(project);
    }
  };

  const testFlow2 = () => {
    // Dashboard → Release Detail (direct)
    addTestResult('Testing Flow 2: Dashboard → Release (direct)');
    const project = projects[0];
    if (project) {
      const releases = getProjectReleases(project.id);
      if (releases.length > 0) {
        addTestResult(`Navigating directly to release: ${releases[0].name}`);
        onNavigateToRelease(releases[0]);
      }
    }
  };

  const testBackToDashboard = () => {
    addTestResult('Testing: Back to Dashboard');
    onNavigateToProjects();
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-80 overflow-hidden z-50">
      <CardHeader>
        <CardTitle className="text-sm">Navigation Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={testFlow1}>
            Test Flow 1
          </Button>
          <Button size="sm" onClick={testFlow2}>
            Test Flow 2
          </Button>
          <Button size="sm" onClick={testBackToDashboard}>
            Dashboard
          </Button>
        </div>
        
        <div className="max-h-40 overflow-y-auto text-xs space-y-1">
          {testResults.map((result, i) => (
            <div key={i} className="text-muted-foreground">
              {result}
            </div>
          ))}
        </div>
        
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => setTestResults([])}
        >
          Clear
        </Button>
      </CardContent>
    </Card>
  );
}
