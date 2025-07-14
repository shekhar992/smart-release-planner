import { useEffect, useState } from 'react';
import { useReleases } from '../contexts/ReleaseContext';
import { Task, Developer } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { addDays, subDays } from 'date-fns';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';

interface DemoDataLoaderProps {
  children: React.ReactNode;
}

export function DemoDataLoader({ children }: DemoDataLoaderProps) {
  const { releases, createRelease, updateRelease } = useReleases();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showClearButton, setShowClearButton] = useState(false);

  const clearAllData = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Show clear button if there are releases
  useEffect(() => {
    setShowClearButton(releases.length > 0);
  }, [releases.length]);

  useEffect(() => {
    const initializeDemoData = async () => {
      // Only initialize if no releases exist and we haven't initialized before
      if (releases.length > 0 || hasInitialized) return;

      const today = new Date();
      
      try {
        // Create minimal team for testing
        const testTeam: Developer[] = [
          { id: uuidv4(), name: 'Alice Johnson', role: 'Lead Developer', email: 'alice@company.com' },
          { id: uuidv4(), name: 'Bob Smith', role: 'Backend Engineer', email: 'bob@company.com' }
        ];

        // Single test release with minimal data
        const testRelease = await createRelease({
          name: 'Sample Project v1.0',
          description: 'A minimal sample project for testing',
          version: '1.0.0',
          startDate: subDays(today, 7),
          targetDate: addDays(today, 14),
          status: 'in-progress',
          priority: 'high',
          color: '#3b82f6'
        });

        // Minimal set of tasks with different priorities to test the priority dashboard
        const testTasks: Task[] = [
          {
            id: uuidv4(),
            title: 'Critical Bug Fix',
            description: 'Fix security vulnerability in authentication',
            taskType: 'bug',
            startDate: subDays(today, 2),
            endDate: today,
            assignedDeveloperId: testTeam[0].id, // Alice
            status: 'in-progress',
            priority: 'critical'
          },
          {
            id: uuidv4(),
            title: 'Feature Implementation',
            description: 'Implement new user dashboard',
            taskType: 'story',
            startDate: today,
            endDate: addDays(today, 5),
            assignedDeveloperId: testTeam[1].id, // Bob
            status: 'not-started',
            priority: 'high'
          },
          {
            id: uuidv4(),
            title: 'Documentation Update',
            description: 'Update API documentation',
            taskType: 'task',
            startDate: addDays(today, 3),
            endDate: addDays(today, 7),
            assignedDeveloperId: testTeam[0].id, // Alice
            status: 'not-started',
            priority: 'low'
          }
        ];

        await updateRelease(testRelease.id, { 
          team: testTeam,
          tasks: testTasks
        });

        setHasInitialized(true);
        console.log('Minimal demo data initialized successfully!');
        
      } catch (error) {
        console.error('Error initializing demo data:', error);
      }
    };

    initializeDemoData();
  }, [releases.length, hasInitialized, createRelease, updateRelease]);

  return (
    <>
      {showClearButton && (
        <div className="fixed top-4 right-4 z-50">
          <Button
            variant="destructive"
            size="sm"
            onClick={clearAllData}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear Demo Data
          </Button>
        </div>
      )}
      {children}
    </>
  );
}