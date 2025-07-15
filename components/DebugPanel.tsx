import { useState } from 'react';
import { useReleases } from '../contexts/ReleaseContext';
import { Button } from './ui/button';
import { RefreshCw, Database, Eye } from 'lucide-react';

export function DebugPanel() {
  const { releases, currentRelease, setCurrentRelease, createRelease, updateRelease } = useReleases();
  const [isCreating, setIsCreating] = useState(false);

  const forceCreateData = async () => {
    setIsCreating(true);
    try {
      console.log('Force creating demo data...');
      
      const today = new Date();
      const testTeam = [
        { id: 'alice-123', name: 'Alice Johnson', role: 'Lead Developer', email: 'alice@company.com' },
        { id: 'bob-123', name: 'Bob Smith', role: 'Backend Engineer', email: 'bob@company.com' }
      ];

      const testRelease = await createRelease({
        name: 'Debug Sample Project',
        description: 'Manually created debug project',
        version: '1.0.0',
        startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        targetDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
        status: 'in-progress',
        priority: 'high',
        color: '#3b82f6'
      });

      const testTasks = [
        {
          id: 'task-1',
          title: 'Debug Critical Task',
          description: 'Test task for debugging',
          taskType: 'bug' as const,
          startDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
          endDate: today,
          assignedDeveloperId: 'alice-123',
          status: 'in-progress' as const,
          priority: 'critical' as const
        }
      ];

      await updateRelease(testRelease.id, {
        team: testTeam,
        tasks: testTasks
      });

      console.log('Debug data created successfully!');
      alert('Debug data created! Check the releases list.');
    } catch (error) {
      console.error('Error creating debug data:', error);
      alert('Error creating debug data: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const clearAllData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const selectFirstRelease = () => {
    if (releases.length > 0) {
      setCurrentRelease(releases[0]);
    } else {
      alert('No releases found!');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg p-4 shadow-lg z-50">
      <h3 className="font-bold mb-2">Debug Panel</h3>
      <div className="space-y-2 text-sm">
        <p>Releases: {releases.length}</p>
        <p>Current: {currentRelease?.name || 'None'}</p>
        <div className="flex flex-col gap-2">
          <Button 
            size="sm" 
            onClick={forceCreateData} 
            disabled={isCreating}
            className="flex items-center gap-1"
          >
            <Database className="w-3 h-3" />
            {isCreating ? 'Creating...' : 'Force Create Data'}
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={selectFirstRelease}
            className="flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            Select First Release
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={clearAllData}
            className="flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Clear & Reload
          </Button>
        </div>
      </div>
    </div>
  );
}
