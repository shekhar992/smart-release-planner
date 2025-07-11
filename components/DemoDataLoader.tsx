import { useEffect, useState } from 'react';
import { useReleases } from '../contexts/ReleaseContext';
import { Task, Developer } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { addDays, addWeeks, subDays } from 'date-fns';

interface DemoDataLoaderProps {
  children: React.ReactNode;
}

export function DemoDataLoader({ children }: DemoDataLoaderProps) {
  const { releases, createRelease, updateRelease } = useReleases();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const initializeDemoData = async () => {
      // Only initialize if no releases exist and we haven't initialized before
      if (releases.length > 0 || hasInitialized) return;

      const today = new Date();
      
      try {
        // Create core team members
        const coreTeam: Developer[] = [
          { id: uuidv4(), name: 'Sarah Chen', role: 'Full Stack Developer', email: 'sarah@company.com' },
          { id: uuidv4(), name: 'Marcus Rodriguez', role: 'Frontend Developer', email: 'marcus@company.com' },
          { id: uuidv4(), name: 'Emily Watson', role: 'Backend Engineer', email: 'emily@company.com' },
          { id: uuidv4(), name: 'David Kim', role: 'DevOps Engineer', email: 'david@company.com' }
        ];

        // Release 1: Current Sprint - Web App v2.1
        const webAppRelease = await createRelease({
          name: 'Web App v2.1',
          description: 'New dashboard and user management features',
          version: '2.1.0',
          startDate: subDays(today, 14),
          targetDate: addDays(today, 7),
          status: 'in-progress',
          priority: 'high',
          color: '#3b82f6'
        });

        const webAppTasks: Task[] = [
          {
            id: uuidv4(),
            title: 'User Dashboard Redesign',
            description: 'Implement new dashboard with improved UX',
            taskType: 'story',
            startDate: subDays(today, 12),
            endDate: addDays(today, 2),
            assignedDeveloperId: coreTeam[1].id, // Marcus
            status: 'in-progress',
            priority: 'high'
          },
          {
            id: uuidv4(),
            title: 'Authentication System',
            description: 'Implement secure user authentication',
            taskType: 'task',
            startDate: subDays(today, 10),
            endDate: today,
            assignedDeveloperId: coreTeam[0].id, // Sarah
            status: 'completed',
            priority: 'critical'
          },
          {
            id: uuidv4(),
            title: 'API Integration',
            description: 'Connect frontend with new backend APIs',
            taskType: 'task',
            startDate: subDays(today, 5),
            endDate: addDays(today, 3),
            assignedDeveloperId: coreTeam[2].id, // Emily
            status: 'in-progress',
            priority: 'high'
          },
          {
            id: uuidv4(),
            title: 'Deployment Pipeline',
            description: 'Set up automated deployment process',
            taskType: 'task',
            startDate: today,
            endDate: addDays(today, 5),
            assignedDeveloperId: coreTeam[3].id, // David
            status: 'not-started',
            priority: 'medium'
          }
        ];

        await updateRelease(webAppRelease.id, { 
          team: coreTeam,
          tasks: webAppTasks
        });

        // Release 2: Mobile App v1.0
        const mobileAppRelease = await createRelease({
          name: 'Mobile App v1.0',
          description: 'First mobile application release',
          version: '1.0.0',
          startDate: addDays(today, 7),
          targetDate: addWeeks(today, 6),
          status: 'planning',
          priority: 'medium',
          color: '#10b981'
        });

        const mobileTeam = [coreTeam[0], coreTeam[1], coreTeam[2]]; // Sarah, Marcus, Emily

        const mobileAppTasks: Task[] = [
          {
            id: uuidv4(),
            title: 'Mobile UI Framework',
            description: 'Set up React Native framework and basic components',
            taskType: 'story',
            startDate: addDays(today, 10),
            endDate: addWeeks(today, 3),
            assignedDeveloperId: mobileTeam[1].id, // Marcus
            status: 'not-started',
            priority: 'high'
          },
          {
            id: uuidv4(),
            title: 'Mobile API Services',
            description: 'Implement mobile-specific API endpoints',
            taskType: 'task',
            startDate: addDays(today, 14),
            endDate: addWeeks(today, 4),
            assignedDeveloperId: mobileTeam[2].id, // Emily
            status: 'not-started',
            priority: 'high'
          },
          {
            id: uuidv4(),
            title: 'App Store Preparation',
            description: 'Prepare app for iOS and Android stores',
            taskType: 'task',
            startDate: addWeeks(today, 4),
            endDate: addWeeks(today, 6),
            assignedDeveloperId: mobileTeam[0].id, // Sarah
            status: 'not-started',
            priority: 'medium'
          }
        ];

        await updateRelease(mobileAppRelease.id, { 
          team: mobileTeam,
          tasks: mobileAppTasks
        });

        setHasInitialized(true);
        console.log('Clean demo data initialized successfully!');
        
      } catch (error) {
        console.error('Error initializing demo data:', error);
      }
    };

    initializeDemoData();
  }, [releases.length, hasInitialized, createRelease, updateRelease]);

  return <>{children}</>;
}