import { useEffect, useState } from 'react';
import { useReleases } from '../contexts/ReleaseContext';
import { Task, Developer, TaskStatus, TaskPriority } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { addDays, addWeeks, addMonths, subDays, subWeeks } from 'date-fns';

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
        // Create all developer profiles with IDs upfront
        const allDevelopers: Developer[] = [
          { id: uuidv4(), name: 'Sarah Chen', role: 'Senior Full Stack Developer', email: 'sarah.chen@company.com' },
          { id: uuidv4(), name: 'Marcus Rodriguez', role: 'Lead Frontend Developer', email: 'marcus.r@company.com' },
          { id: uuidv4(), name: 'Emily Watson', role: 'Backend Engineer', email: 'emily.watson@company.com' },
          { id: uuidv4(), name: 'David Kim', role: 'DevOps Engineer', email: 'david.kim@company.com' },
          { id: uuidv4(), name: 'Jessica Thompson', role: 'UI/UX Developer', email: 'jessica.t@company.com' },
          { id: uuidv4(), name: 'Alex Petrov', role: 'QA Engineer', email: 'alex.petrov@company.com' },
          { id: uuidv4(), name: 'Rachel Green', role: 'Product Manager', email: 'rachel.green@company.com' },
          { id: uuidv4(), name: 'Tom Wilson', role: 'Senior Backend Developer', email: 'tom.wilson@company.com' },
          { id: uuidv4(), name: 'Lisa Chang', role: 'Security Engineer', email: 'lisa.chang@company.com' },
          { id: uuidv4(), name: 'James Miller', role: 'Data Engineer', email: 'james.miller@company.com' }
        ];

        // Release 1: Current Major Release - Mobile App 3.0
        const mobileAppRelease = await createRelease({
          name: 'Mobile App 3.0',
          description: 'Complete redesign of mobile application with new user experience, enhanced performance, and AI-powered features',
          version: '3.0.0',
          startDate: subWeeks(today, 8),
          targetDate: addWeeks(today, 6),
          status: 'in-progress',
          priority: 'critical'
        });

        // Team for Mobile App Release
        const mobileTeam = allDevelopers.slice(0, 6);

        // Mobile App Tasks with proper developer ID references
        const mobileTasks: Task[] = [
          {
            id: uuidv4(),
            title: 'UI/UX Design System Implementation',
            description: 'Implement new design system components and guidelines across the mobile app',
            startDate: subWeeks(today, 7),
            endDate: addDays(today, 3),
            assignedDeveloperId: mobileTeam[4].id, // Jessica Thompson
            status: 'in-progress',
            priority: 'high'
          },
          {
            id: uuidv4(),
            title: 'Authentication & Security Overhaul',
            description: 'Implement OAuth 2.0, biometric authentication, and enhanced security measures',
            startDate: subWeeks(today, 6),
            endDate: addDays(today, 5),
            assignedDeveloperId: mobileTeam[0].id, // Sarah Chen
            status: 'in-progress',
            priority: 'critical'
          },
          {
            id: uuidv4(),
            title: 'Performance Optimization',
            description: 'Optimize app startup time, memory usage, and battery consumption',
            startDate: subDays(today, 10),
            endDate: addDays(today, 8),
            assignedDeveloperId: mobileTeam[1].id, // Marcus Rodriguez
            status: 'in-progress',
            priority: 'high'
          },
          {
            id: uuidv4(),
            title: 'AI Features Integration',
            description: 'Integrate machine learning models for personalized content and recommendations',
            startDate: addDays(today, 1),
            endDate: addWeeks(today, 3),
            assignedDeveloperId: mobileTeam[0].id, // Sarah Chen - CONFLICT!
            status: 'not-started',
            priority: 'medium'
          },
          {
            id: uuidv4(),
            title: 'Backend API Modernization',
            description: 'Migrate legacy APIs to GraphQL and implement real-time subscriptions',
            startDate: subWeeks(today, 4),
            endDate: addDays(today, 12),
            assignedDeveloperId: mobileTeam[2].id, // Emily Watson
            status: 'in-progress',
            priority: 'high'
          },
          {
            id: uuidv4(),
            title: 'Comprehensive Testing Suite',
            description: 'Automated testing, integration tests, and performance benchmarking',
            startDate: addDays(today, 5),
            endDate: addWeeks(today, 4),
            assignedDeveloperId: mobileTeam[5].id, // Alex Petrov
            status: 'not-started',
            priority: 'high'
          },
          {
            id: uuidv4(),
            title: 'App Store Optimization',
            description: 'Prepare app store listings, screenshots, and marketing materials',
            startDate: addWeeks(today, 3),
            endDate: addWeeks(today, 5),
            assignedDeveloperId: mobileTeam[4].id, // Jessica Thompson
            status: 'not-started',
            priority: 'medium'
          },
          {
            id: uuidv4(),
            title: 'Beta Testing & Feedback Integration',
            description: 'Coordinate beta testing program and integrate user feedback',
            startDate: addWeeks(today, 2),
            endDate: addWeeks(today, 5),
            assignedDeveloperId: mobileTeam[3].id, // David Kim
            status: 'not-started',
            priority: 'medium'
          }
        ];

        await updateRelease(mobileAppRelease.id, { 
          team: mobileTeam,
          tasks: mobileTasks
        });

        // Release 2: Web Platform Upgrade - Quarterly Release
        const webPlatformRelease = await createRelease({
          name: 'Web Platform 2.5',
          description: 'Major web platform upgrade with new dashboard, analytics, and enterprise features',
          version: '2.5.0',
          startDate: addWeeks(today, 2),
          targetDate: addMonths(today, 3),
          status: 'planning',
          priority: 'high'
        });

        // Team for Web Platform Release
        const webTeam = [
          allDevelopers[2], // Emily Watson
          allDevelopers[3], // David Kim
          allDevelopers[4], // Jessica Thompson
          allDevelopers[6], // Rachel Green
          allDevelopers[7], // Tom Wilson
          allDevelopers[8]  // Lisa Chang
        ];

        // Web Platform Tasks
        const webTasks: Task[] = [
          {
            id: uuidv4(),
            title: 'Dashboard Redesign & Analytics',
            description: 'Complete redesign of admin dashboard with advanced analytics and reporting',
            startDate: addWeeks(today, 3),
            endDate: addWeeks(today, 8),
            assignedDeveloperId: webTeam[0].id, // Emily Watson
            status: 'not-started',
            priority: 'high'
          },
          {
            id: uuidv4(),
            title: 'Enterprise SSO Integration',
            description: 'Implement SAML, LDAP, and enterprise authentication systems',
            startDate: addWeeks(today, 4),
            endDate: addWeeks(today, 9),
            assignedDeveloperId: webTeam[5].id, // Lisa Chang
            status: 'not-started',
            priority: 'critical'
          },
          {
            id: uuidv4(),
            title: 'Advanced Reporting System',
            description: 'Build customizable reporting engine with export capabilities',
            startDate: addWeeks(today, 5),
            endDate: addWeeks(today, 10),
            assignedDeveloperId: webTeam[4].id, // Tom Wilson
            status: 'not-started',
            priority: 'medium'
          },
          {
            id: uuidv4(),
            title: 'Multi-tenant Architecture',
            description: 'Implement scalable multi-tenant infrastructure for enterprise clients',
            startDate: addWeeks(today, 3),
            endDate: addWeeks(today, 11),
            assignedDeveloperId: webTeam[4].id, // Tom Wilson
            status: 'not-started',
            priority: 'high'
          },
          {
            id: uuidv4(),
            title: 'API Rate Limiting & Monitoring',
            description: 'Implement advanced API governance and monitoring solutions',
            startDate: addWeeks(today, 6),
            endDate: addWeeks(today, 10),
            assignedDeveloperId: webTeam[1].id, // David Kim
            status: 'not-started',
            priority: 'medium'
          },
          {
            id: uuidv4(),
            title: 'Performance & Scalability Testing',
            description: 'Load testing, performance optimization, and scalability validation',
            startDate: addWeeks(today, 8),
            endDate: addWeeks(today, 12),
            assignedDeveloperId: webTeam[2].id, // Jessica Thompson
            status: 'not-started',
            priority: 'high'
          }
        ];

        await updateRelease(webPlatformRelease.id, { 
          team: webTeam,
          tasks: webTasks
        });

        // Release 3: AI/ML Infrastructure - Future Release
        const aiInfraRelease = await createRelease({
          name: 'AI/ML Platform 1.0',
          description: 'New AI/ML infrastructure for intelligent automation, predictive analytics, and machine learning workflows',
          version: '1.0.0',
          startDate: addMonths(today, 2),
          targetDate: addMonths(today, 6),
          status: 'planning',
          priority: 'medium'
        });

        // Team for AI/ML Release
        const aiTeam = [
          allDevelopers[0], // Sarah Chen
          allDevelopers[2], // Emily Watson
          allDevelopers[7], // Tom Wilson
          allDevelopers[9], // James Miller
          allDevelopers[8]  // Lisa Chang
        ];

        // AI/ML Tasks
        const aiTasks: Task[] = [
          {
            id: uuidv4(),
            title: 'ML Pipeline Architecture',
            description: 'Design and implement scalable machine learning pipeline infrastructure',
            startDate: addMonths(today, 2),
            endDate: addMonths(today, 4),
            assignedDeveloperId: aiTeam[0].id, // Sarah Chen
            status: 'not-started',
            priority: 'critical'
          },
          {
            id: uuidv4(),
            title: 'Data Lake & ETL Processes',
            description: 'Build data lake infrastructure and automated ETL processes for ML training',
            startDate: addWeeks(addMonths(today, 2), 1),
            endDate: addWeeks(addMonths(today, 4), 2),
            assignedDeveloperId: aiTeam[3].id, // James Miller
            status: 'not-started',
            priority: 'high'
          },
          {
            id: uuidv4(),
            title: 'Model Training & Deployment',
            description: 'Automated model training, validation, and deployment systems',
            startDate: addMonths(today, 3),
            endDate: addMonths(today, 5),
            assignedDeveloperId: aiTeam[2].id, // Tom Wilson
            status: 'not-started',
            priority: 'high'
          },
          {
            id: uuidv4(),
            title: 'AI Security & Compliance',
            description: 'Implement AI governance, model explainability, and compliance frameworks',
            startDate: addWeeks(addMonths(today, 3), 2),
            endDate: addWeeks(addMonths(today, 5), 3),
            assignedDeveloperId: aiTeam[4].id, // Lisa Chang
            status: 'not-started',
            priority: 'medium'
          },
          {
            id: uuidv4(),
            title: 'Predictive Analytics Dashboard',
            description: 'User-facing dashboard for AI insights and predictive analytics',
            startDate: addMonths(today, 4),
            endDate: addMonths(today, 6),
            assignedDeveloperId: aiTeam[1].id, // Emily Watson
            status: 'not-started',
            priority: 'medium'
          }
        ];

        await updateRelease(aiInfraRelease.id, { 
          team: aiTeam,
          tasks: aiTasks
        });

        // Release 4: Security & Compliance - Ongoing Release
        const securityRelease = await createRelease({
          name: 'Security & Compliance 2024',
          description: 'Comprehensive security audit implementation, GDPR compliance, and enterprise security features',
          version: '2024.1',
          startDate: subWeeks(today, 4),
          targetDate: addMonths(today, 2),
          status: 'in-progress',
          priority: 'critical'
        });

        // Team for Security Release
        const securityTeam = [
          allDevelopers[8], // Lisa Chang
          allDevelopers[0], // Sarah Chen
          allDevelopers[3], // David Kim
          allDevelopers[5]  // Alex Petrov
        ];

        // Security Tasks with some completed ones
        const securityTasks: Task[] = [
          {
            id: uuidv4(),
            title: 'Security Audit & Penetration Testing',
            description: 'Complete third-party security audit and vulnerability assessment',
            startDate: subWeeks(today, 4),
            endDate: subWeeks(today, 1),
            assignedDeveloperId: securityTeam[0].id, // Lisa Chang
            status: 'completed',
            priority: 'critical'
          },
          {
            id: uuidv4(),
            title: 'GDPR Compliance Implementation',
            description: 'Implement GDPR requirements including data portability and right to deletion',
            startDate: subWeeks(today, 3),
            endDate: addWeeks(today, 2),
            assignedDeveloperId: securityTeam[1].id, // Sarah Chen
            status: 'in-progress',
            priority: 'critical'
          },
          {
            id: uuidv4(),
            title: 'Infrastructure Security Hardening',
            description: 'Implement security best practices across all infrastructure components',
            startDate: subWeeks(today, 2),
            endDate: addWeeks(today, 4),
            assignedDeveloperId: securityTeam[2].id, // David Kim
            status: 'in-progress',
            priority: 'high'
          },
          {
            id: uuidv4(),
            title: 'Security Monitoring & Alerting',
            description: 'Deploy comprehensive security monitoring and incident response systems',
            startDate: addDays(today, 3),
            endDate: addWeeks(today, 6),
            assignedDeveloperId: securityTeam[0].id, // Lisa Chang - POTENTIAL CONFLICT
            status: 'not-started',
            priority: 'high'
          },
          {
            id: uuidv4(),
            title: 'Security Training & Documentation',
            description: 'Create security guidelines and conduct team training sessions',
            startDate: addWeeks(today, 1),
            endDate: addWeeks(today, 5),
            assignedDeveloperId: securityTeam[3].id, // Alex Petrov
            status: 'not-started',
            priority: 'medium'
          }
        ];

        await updateRelease(securityRelease.id, { 
          team: securityTeam,
          tasks: securityTasks
        });

        // Release 5: Legacy System Migration - Long-term Project
        const migrationRelease = await createRelease({
          name: 'Legacy Migration 2024',
          description: 'Migration from legacy systems to modern cloud-native architecture',
          version: '1.0.0',
          startDate: addWeeks(today, 1),
          targetDate: addMonths(today, 8),
          status: 'planning',
          priority: 'medium'
        });

        // Team for Migration Release
        const migrationTeam = [
          allDevelopers[7], // Tom Wilson
          allDevelopers[2], // Emily Watson
          allDevelopers[3], // David Kim
          allDevelopers[9], // James Miller
          allDevelopers[5]  // Alex Petrov
        ];

        // Migration Tasks - Long-term planning
        const migrationTasks: Task[] = [
          {
            id: uuidv4(),
            title: 'Legacy System Assessment',
            description: 'Complete audit of existing legacy systems and migration planning',
            startDate: addWeeks(today, 2),
            endDate: addWeeks(today, 6),
            assignedDeveloperId: migrationTeam[0].id, // Tom Wilson
            status: 'not-started',
            priority: 'high'
          },
          {
            id: uuidv4(),
            title: 'Data Migration Strategy',
            description: 'Design and implement data migration tools and processes',
            startDate: addWeeks(today, 4),
            endDate: addMonths(today, 3),
            assignedDeveloperId: migrationTeam[3].id, // James Miller
            status: 'not-started',
            priority: 'critical'
          },
          {
            id: uuidv4(),
            title: 'Cloud Infrastructure Setup',
            description: 'Provision and configure cloud infrastructure for migrated systems',
            startDate: addWeeks(today, 6),
            endDate: addMonths(today, 4),
            assignedDeveloperId: migrationTeam[2].id, // David Kim
            status: 'not-started',
            priority: 'high'
          },
          {
            id: uuidv4(),
            title: 'Application Modernization',
            description: 'Refactor and modernize legacy applications for cloud deployment',
            startDate: addMonths(today, 2),
            endDate: addMonths(today, 6),
            assignedDeveloperId: migrationTeam[1].id, // Emily Watson
            status: 'not-started',
            priority: 'high'
          },
          {
            id: uuidv4(),
            title: 'Testing & Validation',
            description: 'Comprehensive testing of migrated systems and performance validation',
            startDate: addMonths(today, 5),
            endDate: addMonths(today, 7),
            assignedDeveloperId: migrationTeam[4].id, // Alex Petrov
            status: 'not-started',
            priority: 'medium'
          },
          {
            id: uuidv4(),
            title: 'Go-Live & Monitoring',
            description: 'Production deployment and post-migration monitoring',
            startDate: addMonths(today, 7),
            endDate: addMonths(today, 8),
            assignedDeveloperId: migrationTeam[0].id, // Tom Wilson
            status: 'not-started',
            priority: 'critical'
          }
        ];

        await updateRelease(migrationRelease.id, { 
          team: migrationTeam,
          tasks: migrationTasks
        });

        setHasInitialized(true);
        console.log('Demo data initialized successfully!');
        
      } catch (error) {
        console.error('Error initializing demo data:', error);
      }
    };

    initializeDemoData();
  }, [releases.length, hasInitialized, createRelease, updateRelease]);

  return <>{children}</>;
}