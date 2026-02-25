export interface Ticket {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: 'in-progress' | 'planned' | 'completed';
  storyPoints: number;
  effortDays?: number;
  assignedTo: string;
  requiredRole?: 'Frontend' | 'Backend' | 'Fullstack' | 'QA' | 'Designer' | 'DataEngineer' | 'iOS' | 'Android';
  dependencies?: {
    blockedBy?: string[];  // Ticket IDs that must complete before this
    blocks?: string[];     // Calculated: Tickets waiting on this (auto-populated)
  };
}

export interface Feature {
  id: string;
  name: string;
  tickets: Ticket[];
}

export interface Sprint {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

// ── Story Point ↔ Days Mapping ──

export type SPMappingPreset = 'fibonacci' | 'linear' | 'custom';

export interface SPMappingEntry {
  sp: number;
  days: number;
}

export interface StoryPointMapping {
  preset: SPMappingPreset;
  entries: SPMappingEntry[];
}

export const SP_PRESETS: Record<Exclude<SPMappingPreset, 'custom'>, StoryPointMapping> = {
  fibonacci: {
    preset: 'fibonacci',
    entries: [
      { sp: 1, days: 0.5 },
      { sp: 2, days: 1 },
      { sp: 3, days: 2 },
      { sp: 5, days: 3 },
      { sp: 8, days: 5 },
      { sp: 13, days: 8 },
    ],
  },
  linear: {
    preset: 'linear',
    entries: [
      { sp: 1, days: 1 },
      { sp: 2, days: 2 },
      { sp: 3, days: 3 },
      { sp: 5, days: 5 },
      { sp: 8, days: 8 },
      { sp: 13, days: 13 },
    ],
  },
};

export function storyPointsToDays(sp: number, mapping?: StoryPointMapping): number {
  if (!mapping || mapping.entries.length === 0) return sp;
  const entries = mapping.entries;
  const exact = entries.find(e => e.sp === sp);
  if (exact) return exact.days;
  if (sp <= entries[0].sp) return (sp / entries[0].sp) * entries[0].days;
  const last = entries[entries.length - 1];
  if (sp >= last.sp) return (sp / last.sp) * last.days;
  for (let i = 0; i < entries.length - 1; i++) {
    if (sp > entries[i].sp && sp < entries[i + 1].sp) {
      const ratio = (sp - entries[i].sp) / (entries[i + 1].sp - entries[i].sp);
      return entries[i].days + ratio * (entries[i + 1].days - entries[i].days);
    }
  }
  return sp;
}

export interface Release {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  features: Feature[];
  sprints?: Sprint[];
  storyPointMapping?: StoryPointMapping;
  milestones: Milestone[];
  phases?: Phase[];
}

export interface Product {
  id: string;
  name: string;
  releases: Release[];
}

export interface PTOEntry {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  role: 'Developer' | 'Designer' | 'QA' | 'Frontend' | 'Backend' | 'Fullstack' | 'DataEngineer' | 'iOS' | 'Android';
  experienceLevel?: 'Junior' | 'Mid' | 'Senior' | 'Lead';
  notes?: string;
  pto: PTOEntry[];
  productId: string;
  velocityMultiplier?: number;
}

export interface Holiday {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

// ── Milestones ──

export type MilestoneType = 'Testing' | 'Deployment' | 'Approval' | 'Freeze' | 'Launch' | 'Other';

export interface Milestone {
  id: string;
  releaseId: string;
  name: string;
  type: MilestoneType;
  dateType: 'single' | 'range';
  startDate: Date;
  endDate?: Date;
  description?: string;
  isBlocking?: boolean;
  order?: number;
}

// ── Phases ──

export type PhaseType = 'DevWindow' | 'Testing' | 'Deployment' | 'Approval' | 'Launch' | 'Custom';

export interface Phase {
  id: string;
  releaseId: string;
  name: string;
  type: PhaseType;
  startDate: Date;
  endDate: Date;
  allowsWork: boolean;
  order: number;
  description?: string;
}

export function getMockPhasesForRelease(release: Release): Phase[] {
  const goLiveDate = new Date(release.endDate);
  
  const uatEnd = new Date(goLiveDate);
  uatEnd.setDate(uatEnd.getDate() - 1);
  const uatStart = new Date(uatEnd);
  uatStart.setDate(uatStart.getDate() - 13);
  
  const sitEnd = new Date(uatStart);
  sitEnd.setDate(sitEnd.getDate() - 1);
  const sitStart = new Date(sitEnd);
  sitStart.setDate(sitStart.getDate() - 13);
  
  const devEnd = new Date(sitStart);
  devEnd.setDate(devEnd.getDate() - 1);
  const devStart = new Date(release.startDate);
  
  return [
    {
      id: `phase-dev-${release.id}`,
      releaseId: release.id,
      name: 'Dev Window',
      type: 'DevWindow',
      startDate: devStart,
      endDate: devEnd,
      allowsWork: true,
      order: 1,
    },
    {
      id: `phase-sit-${release.id}`,
      releaseId: release.id,
      name: 'SIT',
      type: 'Testing',
      startDate: sitStart,
      endDate: sitEnd,
      allowsWork: false,
      order: 2,
    },
    {
      id: `phase-uat-${release.id}`,
      releaseId: release.id,
      name: 'UAT',
      type: 'Testing',
      startDate: uatStart,
      endDate: uatEnd,
      allowsWork: false,
      order: 3,
    },
    {
      id: `phase-golive-${release.id}`,
      releaseId: release.id,
      name: 'Go-Live',
      type: 'Launch',
      startDate: goLiveDate,
      endDate: goLiveDate,
      allowsWork: false,
      order: 4,
    },
  ];
}

// ===========================================
// MOCK DATA - ENHANCED WITH ROLES & DEPENDENCIES
// ===========================================
/*
 * This mock data demonstrates the new role-based allocation and dependency management system.
 * 
 * Key Features:
 * - 3 Products (E-Commerce Web, Analytics Dashboard Web, Food Delivery Mobile)
 * - Role-based team composition (Frontend, Backend, iOS, Android, QA, Designer, DataEngineer, Fullstack)
 * - Realistic dependency chains (blockedBy relationships)
 * - Required roles per ticket
 * - Mixed experience levels (Junior, Mid, Senior, Lead)
 * - Realistic PTO schedules
 */

// ===========================================
// PRODUCT 1: E-Commerce Platform (Web)
// ===========================================
const product1: Product = {
  id: 'ecom01',
  name: 'ShopEasy - E-Commerce Platform',
  releases: [
    {
      id: 'ecom-r1',
      name: 'v2.0 - Payment & Checkout Redesign',
      startDate: new Date('2026-01-06'),
      endDate: new Date('2026-03-31'),
      storyPointMapping: SP_PRESETS.fibonacci,
      milestones: [],
      features: [
        {
          id: 'ecom-f1',
          name: '💰 Payment Gateway Integration',
          tickets: [
            {
              id: 'ecom-t1',
              title: 'Payment Gateway API Integration',
              description: 'Integrate Stripe Payment Intent API with webhook handlers',
              startDate: new Date('2026-01-06'),
              endDate: new Date('2026-01-15'),
              status: 'completed',
              storyPoints: 8,
              effortDays: 12,
              assignedTo: 'Alex Kumar',
              requiredRole: 'Backend',
            },
            {
              id: 'ecom-t2',
              title: 'Order Processing Service',
              description: 'Build order management microservice with payment status tracking',
              startDate: new Date('2026-01-16'),
              endDate: new Date('2026-01-22'),
              status: 'completed',
              storyPoints: 5,
              effortDays: 8,
              assignedTo: 'Alex Kumar',
              requiredRole: 'Backend',
              dependencies: {
                blockedBy: ['ecom-t1'],
              },
            },
            {
              id: 'ecom-t3',
              title: 'User Wallet Backend',
              description: 'Implement stored payment methods and wallet balance APIs',
              startDate: new Date('2026-01-23'),
              endDate: new Date('2026-01-29'),
              status: 'in-progress',
              storyPoints: 5,
              effortDays: 8,
              assignedTo: 'Maria Lopez',
              requiredRole: 'Backend',
              dependencies: {
                blockedBy: ['ecom-t1'],
              },
            },
          ]
        },
        {
          id: 'ecom-f2',
          name: '🛒 Checkout UI Redesign',
          tickets: [
            {
              id: 'ecom-t4',
              title: 'Checkout Flow UI Components',
              description: 'Build reusable checkout step components with validation',
              startDate: new Date('2026-01-27'),
              endDate: new Date('2026-02-04'),
              status: 'in-progress',
              storyPoints: 6,
              effortDays: 10,
              assignedTo: 'Sarah Chen',
              requiredRole: 'Frontend',
              dependencies: {
                blockedBy: ['ecom-t1', 'ecom-t2'],
              },
            },
            {
              id: 'ecom-t5',
              title: 'Payment Method Selector UI',
              description: 'Interactive payment selection with card input and validation',
              startDate: new Date('2026-02-05'),
              endDate: new Date('2026-02-09'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 5,
              assignedTo: 'Sarah Chen',
              requiredRole: 'Frontend',
              dependencies: {
                blockedBy: ['ecom-t1', 'ecom-t4'],
              },
            },
            {
              id: 'ecom-t6',
              title: 'Order Summary Page',
              description: 'Final review screen with edit capability',
              startDate: new Date('2026-02-10'),
              endDate: new Date('2026-02-15'),
              status: 'planned',
              storyPoints: 4,
              effortDays: 6,
              assignedTo: 'Tom Wilson',
              requiredRole: 'Frontend',
              dependencies: {
                blockedBy: ['ecom-t4'],
              },
            },
            {
              id: 'ecom-t7',
              title: 'Wallet Dashboard UI',
              description: 'Saved payment methods management interface',
              startDate: new Date('2026-02-16'),
              endDate: new Date('2026-02-22'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 8,
              assignedTo: 'Sarah Chen',
              requiredRole: 'Frontend',
              dependencies: {
                blockedBy: ['ecom-t3'],
              },
            },
          ]
        },
        {
          id: 'ecom-f3',
          name: '🎨 UI/UX Design',
          tickets: [
            {
              id: 'ecom-t8',
              title: 'Checkout Flow Mockups',
              description: 'Design multi-step checkout experience in Figma',
              startDate: new Date('2026-01-06'),
              endDate: new Date('2026-01-08'),
              status: 'completed',
              storyPoints: 2,
              effortDays: 2,
              assignedTo: 'Emma Davis',
              requiredRole: 'Designer',
            },
            {
              id: 'ecom-t9',
              title: 'Payment UI Components Design',
              description: 'Design system components for payment forms',
              startDate: new Date('2026-01-09'),
              endDate: new Date('2026-01-11'),
              status: 'completed',
              storyPoints: 2,
              effortDays: 2,
              assignedTo: 'Emma Davis',
              requiredRole: 'Designer',
            },
          ]
        },
        {
          id: 'ecom-f4',
          name: '✅ QA & Testing',
          tickets: [
            {
              id: 'ecom-t10',
              title: 'Payment Flow E2E Testing',
              description: 'Automated test suite for complete payment scenarios',
              startDate: new Date('2026-02-16'),
              endDate: new Date('2026-02-22'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 8,
              assignedTo: 'David Lee',
              requiredRole: 'QA',
              dependencies: {
                blockedBy: ['ecom-t4', 'ecom-t5'],
              },
            },
            {
              id: 'ecom-t11',
              title: 'Checkout Integration Tests',
              description: 'Test checkout with various payment methods and edge cases',
              startDate: new Date('2026-02-23'),
              endDate: new Date('2026-02-27'),
              status: 'planned',
              storyPoints: 4,
              effortDays: 6,
              assignedTo: 'David Lee',
              requiredRole: 'QA',
              dependencies: {
                blockedBy: ['ecom-t10'],
              },
            },
          ]
        },
      ],
      sprints: [
        {
          id: 'ecom-s1',
          name: 'Sprint 1',
          startDate: new Date('2026-01-06'),
          endDate: new Date('2026-01-19')
        },
        {
          id: 'ecom-s2',
          name: 'Sprint 2',
          startDate: new Date('2026-01-20'),
          endDate: new Date('2026-02-02')
        },
        {
          id: 'ecom-s3',
          name: 'Sprint 3',
          startDate: new Date('2026-02-03'),
          endDate: new Date('2026-02-16')
        },
        {
          id: 'ecom-s4',
          name: 'Sprint 4',
          startDate: new Date('2026-02-17'),
          endDate: new Date('2026-03-02')
        },
        {
          id: 'ecom-s5',
          name: 'Sprint 5',
          startDate: new Date('2026-03-03'),
          endDate: new Date('2026-03-16')
        },
        {
          id: 'ecom-s6',
          name: 'Sprint 6',
          startDate: new Date('2026-03-17'),
          endDate: new Date('2026-03-31')
        },
      ],
    }
  ]
};

// ===========================================
// PRODUCT 2: Analytics Dashboard (Web)
// ===========================================
const product2: Product = {
  id: 'analytics01',
  name: 'DataViz Pro - Analytics Dashboard',
  releases: [
    {
      id: 'analytics-r1',
      name: 'v1.0 - Initial Launch',
      startDate: new Date('2026-02-02'),
      endDate: new Date('2026-03-31'),
      storyPointMapping: SP_PRESETS.fibonacci,
      milestones: [],
      features: [
        {
          id: 'analytics-f1',
          name: '📊 Data Pipeline',
          tickets: [
            {
              id: 'analytics-t1',
              title: 'Data Pipeline Setup',
              description: 'Configure Apache Airflow for ETL orchestration',
              startDate: new Date('2026-02-02'),
              endDate: new Date('2026-02-11'),
              status: 'completed',
              storyPoints: 8,
              effortDays: 10,
              assignedTo: 'Priya Sharma',
              requiredRole: 'DataEngineer',
            },
            {
              id: 'analytics-t2',
              title: 'ETL Jobs for Analytics',
              description: 'Build data transformation pipelines for metrics calculation',
              startDate: new Date('2026-02-12'),
              endDate: new Date('2026-02-19'),
              status: 'in-progress',
              storyPoints: 6,
              effortDays: 8,
              assignedTo: 'Priya Sharma',
              requiredRole: 'DataEngineer',
              dependencies: {
                blockedBy: ['analytics-t1'],
              },
            },
            {
              id: 'analytics-t3',
              title: 'Real-time Data Streaming',
              description: 'Kafka-based streaming pipeline for live metrics',
              startDate: new Date('2026-02-20'),
              endDate: new Date('2026-02-26'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 7,
              assignedTo: 'Priya Sharma',
              requiredRole: 'DataEngineer',
              dependencies: {
                blockedBy: ['analytics-t1'],
              },
            },
          ]
        },
        {
          id: 'analytics-f2',
          name: '🔌 Backend APIs',
          tickets: [
            {
              id: 'analytics-t4',
              title: 'Analytics API Endpoints',
              description: 'REST API for querying aggregated metrics',
              startDate: new Date('2026-02-20'),
              endDate: new Date('2026-02-26'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 7,
              assignedTo: 'Carlos Rodriguez',
              requiredRole: 'Backend',
              dependencies: {
                blockedBy: ['analytics-t2'],
              },
            },
            {
              id: 'analytics-t5',
              title: 'Aggregation Service',
              description: 'Pre-compute common metric aggregations for performance',
              startDate: new Date('2026-02-27'),
              endDate: new Date('2026-03-04'),
              status: 'planned',
              storyPoints: 4,
              effortDays: 6,
              assignedTo: 'Carlos Rodriguez',
              requiredRole: 'Backend',
              dependencies: {
                blockedBy: ['analytics-t2'],
              },
            },
            {
              id: 'analytics-t6',
              title: 'Export Service',
              description: 'CSV/PDF export functionality for reports',
              startDate: new Date('2026-03-05'),
              endDate: new Date('2026-03-08'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 3,
              assignedTo: 'Lisa Chang',
              requiredRole: 'Fullstack',
            },
          ]
        },
        {
          id: 'analytics-f3',
          name: '📈 Dashboard Frontend',
          tickets: [
            {
              id: 'analytics-t7',
              title: 'Dashboard Layout',
              description: 'Responsive grid layout with widget system',
              startDate: new Date('2026-02-16'),
              endDate: new Date('2026-02-21'),
              status: 'planned',
              storyPoints: 4,
              effortDays: 4,
              assignedTo: 'Jake Thompson',
              requiredRole: 'Frontend',
            },
            {
              id: 'analytics-t8',
              title: 'Chart Components',
              description: 'Reusable chart library (line, bar, pie) using D3.js',
              startDate: new Date('2026-02-27'),
              endDate: new Date('2026-03-05'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 7,
              assignedTo: 'Jake Thompson',
              requiredRole: 'Frontend',
              dependencies: {
                blockedBy: ['analytics-t4'],
              },
            },
            {
              id: 'analytics-t9',
              title: 'Data Table Widget',
              description: 'Sortable, filterable data table component',
              startDate: new Date('2026-03-06'),
              endDate: new Date('2026-03-11'),
              status: 'planned',
              storyPoints: 4,
              effortDays: 4,
              assignedTo: 'Jake Thompson',
              requiredRole: 'Frontend',
              dependencies: {
                blockedBy: ['analytics-t4'],
              },
            },
            {
              id: 'analytics-t10',
              title: 'Filters & Date Pickers',
              description: 'Advanced filtering UI for time-based analytics',
              startDate: new Date('2026-03-12'),
              endDate: new Date('2026-03-15'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 3,
              assignedTo: 'Jake Thompson',
              requiredRole: 'Frontend',
            },
          ]
        },
        {
          id: 'analytics-f4',
          name: '🧪 Testing & QA',
          tickets: [
            {
              id: 'analytics-t11',
              title: 'Data Accuracy Testing',
              description: 'Validate metric calculations against source data',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-21'),
              status: 'planned',
              storyPoints: 4,
              effortDays: 5,
              assignedTo: 'Nina Patel',
              requiredRole: 'QA',
              dependencies: {
                blockedBy: ['analytics-t8', 'analytics-t9'],
              },
            },
          ]
        },
      ],
      sprints: [
        {
          id: 'analytics-s1',
          name: 'Sprint 1',
          startDate: new Date('2026-02-02'),
          endDate: new Date('2026-02-15')
        },
        {
          id: 'analytics-s2',
          name: 'Sprint 2',
          startDate: new Date('2026-02-16'),
          endDate: new Date('2026-03-01')
        },
        {
          id: 'analytics-s3',
          name: 'Sprint 3',
          startDate: new Date('2026-03-02'),
          endDate: new Date('2026-03-15')
        },
        {
          id: 'analytics-s4',
          name: 'Sprint 4',
          startDate: new Date('2026-03-16'),
          endDate: new Date('2026-03-31')
        },
      ],
    }
  ]
};

// ===========================================
// PRODUCT 3: Food Delivery App (Mobile)
// ===========================================
const product3: Product = {
  id: 'foodapp01',
  name: 'QuickBite - Food Delivery App',
  releases: [
    {
      id: 'food-r1',
      name: 'v3.0 - Live Tracking & Multi-Payment',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-03-31'),
      storyPointMapping: SP_PRESETS.fibonacci,
      milestones: [],
      features: [
        {
          id: 'food-f1',
          name: '📍 Location Services',
          tickets: [
            {
              id: 'food-t1',
              title: 'Real-time Location Service',
              description: 'WebSocket service for driver location updates',
              startDate: new Date('2026-01-15'),
              endDate: new Date('2026-01-23'),
              status: 'completed',
              storyPoints: 7,
              effortDays: 10,
              assignedTo: 'Ryan Cooper',
              requiredRole: 'Backend',
            },
            {
              id: 'food-t2',
              title: 'Delivery Status WebSocket',
              description: 'Real-time order status push notifications',
              startDate: new Date('2026-01-24'),
              endDate: new Date('2026-01-30'),
              status: 'in-progress',
              storyPoints: 5,
              effortDays: 7,
              assignedTo: 'Ryan Cooper',
              requiredRole: 'Backend',
              dependencies: {
                blockedBy: ['food-t1'],
              },
            },
            {
              id: 'food-t3',
              title: 'Multi-Payment Gateway',
              description: 'Support for credit cards, digital wallets, and cash',
              startDate: new Date('2026-01-27'),
              endDate: new Date('2026-02-04'),
              status: 'in-progress',
              storyPoints: 6,
              effortDays: 8,
              assignedTo: 'Sophie Martin',
              requiredRole: 'Backend',
            },
            {
              id: 'food-t4',
              title: 'Promo Code Engine',
              description: '  Backend service for discount codes and promotions',
              startDate: new Date('2026-02-05'),
              endDate: new Date('2026-02-10'),
              status: 'planned',
              storyPoints: 4,
              effortDays: 6,
              assignedTo: 'Sophie Martin',
              requiredRole: 'Backend',
            },
          ]
        },
        {
          id: 'food-f2',
          name: '📱 iOS App',
          tickets: [
            {
              id: 'food-t5',
              title: 'Map View Integration (iOS)',
              description: 'MapKit integration with driver marker animation',
              startDate: new Date('2026-02-02'),
              endDate: new Date('2026-02-08'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 7,
              assignedTo: 'Michael Chen',
              requiredRole: 'iOS',
              dependencies: {
                blockedBy: ['food-t1'],
              },
            },
            {
              id: 'food-t6',
              title: 'Live Tracking UI (iOS)',
              description: 'Real-time order tracking screen with ETA',
              startDate: new Date('2026-02-09'),
              endDate: new Date('2026-02-14'),
              status: 'planned',
              storyPoints: 4,
              effortDays: 4,
              assignedTo: 'Michael Chen',
              requiredRole: 'iOS',
              dependencies: {
                blockedBy: ['food-t2'],
              },
            },
            {
              id: 'food-t7',
              title: 'Payment Sheet (iOS)',
              description: 'Native payment UI with Apple Pay support',
              startDate: new Date('2026-02-16'),
              endDate: new Date('2026-02-22'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 7,
              assignedTo: 'Michael Chen',
              requiredRole: 'iOS',
              dependencies: {
                blockedBy: ['food-t3'],
              },
            },
            {
              id: 'food-t8',
              title: 'Order History Redesign (iOS)',
              description: 'Swipeable order cards with reorder functionality',
              startDate: new Date('2026-02-23'),
              endDate: new Date('2026-02-27'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 3,
              assignedTo: 'Michael Chen',
              requiredRole: 'iOS',
            },
          ]
        },
        {
          id: 'food-f3',
          name: '🤖 Android App',
          tickets: [
            {
              id: 'food-t9',
              title: 'Map View Integration (Android)',
              description: 'Google Maps integration with driver marker animation',
              startDate: new Date('2026-02-02'),
              endDate: new Date('2026-02-08'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 7,
              assignedTo: 'Amit Singh',
              requiredRole: 'Android',
              dependencies: {
                blockedBy: ['food-t1'],
              },
            },
            {
              id: 'food-t10',
              title: 'Live Tracking UI (Android)',
              description: 'Real-time order tracking screen with ETA',
              startDate: new Date('2026-02-09'),
              endDate: new Date('2026-02-14'),
              status: 'planned',
              storyPoints: 4,
              effortDays: 4,
              assignedTo: 'Amit Singh',
              requiredRole: 'Android',
              dependencies: {
                blockedBy: ['food-t2'],
              },
            },
            {
              id: 'food-t11',
              title: 'Payment Sheet (Android)',
              description: 'Native payment UI with Google Pay support',
              startDate: new Date('2026-02-16'),
              endDate: new Date('2026-02-22'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 7,
              assignedTo: 'Amit Singh',
              requiredRole: 'Android',
              dependencies: {
                blockedBy: ['food-t3'],
              },
            },
            {
              id: 'food-t12',
              title: 'Push Notification Handler (Android)',
              description: 'FCM integration for order status updates',
              startDate: new Date('2026-02-23'),
              endDate: new Date('2026-02-27'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 3,
              assignedTo: 'Amit Singh',
              requiredRole: 'Android',
            },
          ]
        },
        {
          id: 'food-f4',
          name: '🎨 Design & QA',
          tickets: [
            {
              id: 'food-t13',
              title: 'Tracking UI Mockups',
              description: 'Mobile-first design for live tracking experience',
              startDate: new Date('2026-01-15'),
              endDate: new Date('2026-01-17'),
              status: 'completed',
              storyPoints: 2,
              effortDays: 2,
              assignedTo: 'Olivia White',
              requiredRole: 'Designer',
            },
            {
              id: 'food-t14',
              title: 'Payment Flow Designs',
              description: 'Multi-payment UI screens and flows',
              startDate: new Date('2026-01-20'),
              endDate: new Date('2026-01-22'),
              status: 'completed',
              storyPoints: 2,
              effortDays: 2,
              assignedTo: 'Olivia White',
              requiredRole: 'Designer',
            },
            {
              id: 'food-t15',
              title: 'Live Tracking E2E Test',
              description: 'End-to-end testing of real-time tracking on both platforms',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-08'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 7,
              assignedTo: 'Grace Kim',
              requiredRole: 'QA',
              dependencies: {
                blockedBy: ['food-t6', 'food-t10'],
              },
            },
            {
              id: 'food-t16',
              title: 'Payment Flow Testing',
              description: 'Cross-platform payment integration testing',
              startDate: new Date('2026-03-09'),
              endDate: new Date('2026-03-14'),
              status: 'planned',
              storyPoints: 4,
              effortDays: 6,
              assignedTo: 'Grace Kim',
              requiredRole: 'QA',
              dependencies: {
                blockedBy: ['food-t7', 'food-t11'],
              },
            },
            {
              id: 'food-t17',
              title: 'Regression Suite',
              description: 'Automated regression tests for critical flows',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-23'),
              status: 'planned',
              storyPoints: 6,
              effortDays: 8,
              assignedTo: 'Grace Kim',
              requiredRole: 'QA',
            },
          ]
        },
      ],
      sprints: [
        {
          id: 'food-s1',
          name: 'Sprint 1',
          startDate: new Date('2026-01-15'),
          endDate: new Date('2026-01-28')
        },
        {
          id: 'food-s2',
          name: 'Sprint 2',
          startDate: new Date('2026-01-29'),
          endDate: new Date('2026-02-11')
        },
        {
          id: 'food-s3',
          name: 'Sprint 3',
          startDate: new Date('2026-02-12'),
          endDate: new Date('2026-02-25')
        },
        {
          id: 'food-s4',
          name: 'Sprint 4',
          startDate: new Date('2026-02-26'),
          endDate: new Date('2026-03-11')
        },
        {
          id: 'food-s5',
          name: 'Sprint 5',
          startDate: new Date('2026-03-12'),
          endDate: new Date('2026-03-25')
        },
      ],
    }
  ]
};

export const mockTeamMembers: TeamMember[] = [
  // ═══════════════════════════════════════════
  // E-COMMERCE PLATFORM TEAM (ecom01)
  // ═══════════════════════════════════════════
  {
    id: 'tm-ecom-1',
    name: 'Sarah Chen',
    role: 'Frontend',
    experienceLevel: 'Senior',
    productId: 'ecom01',
    velocityMultiplier: 1.3,
    notes: 'React specialist, TypeScript expert',
    pto: [
      {
        id: 'pto-ecom-1',
        name: 'Vacation',
        startDate: new Date('2026-02-16'),
        endDate: new Date('2026-02-20')
      }
    ]
  },
  {
    id: 'tm-ecom-2',
    name: 'Alex Kumar',
    role: 'Backend',
    experienceLevel: 'Lead',
    productId: 'ecom01',
    velocityMultiplier: 1.5,
    notes: 'Payment systems architect, Node.js expert',
    pto: []
  },
  {
    id: 'tm-ecom-3',
    name: 'Tom Wilson',
    role: 'Frontend',
    experienceLevel: 'Mid',
    productId: 'ecom01',
    velocityMultiplier: 1.0,
    notes: 'UI developer, CSS specialist',
    pto: [
      {
        id: 'pto-ecom-3',
        name: 'Conference',
        startDate: new Date('2026-03-09'),
        endDate: new Date('2026-03-13')
      }
    ]
  },
  {
    id: 'tm-ecom-4',
    name: 'Maria Lopez',
    role: 'Backend',
    experienceLevel: 'Senior',
    productId: 'ecom01',
    velocityMultiplier: 1.3,
    notes: 'Microservices expert, API design',
    pto: []
  },
  {
    id: 'tm-ecom-5',
    name: 'Emma Davis',
    role: 'Designer',
    experienceLevel: 'Senior',
    productId: 'ecom01',
    velocityMultiplier: 1.3,
    notes: 'UI/UX designer, Figma lead',
    pto: []
  },
  {
    id: 'tm-ecom-6',
    name: 'David Lee',
    role: 'QA',
    experienceLevel: 'Senior',
    productId: 'ecom01',
    velocityMultiplier: 1.3,
    notes: 'Test automation, Cypress specialist',
    pto: [
      {
        id: 'pto-ecom-6',
        name: 'Medical Leave',
        startDate: new Date('2026-03-02'),
        endDate: new Date('2026-03-06')
      }
    ]
  },

  // ═══════════════════════════════════════════
  // ANALYTICS DASHBOARD TEAM (analytics01)
  // ═══════════════════════════════════════════
  {
    id: 'tm-analytics-1',
    name: 'Priya Sharma',
    role: 'DataEngineer',
    experienceLevel: 'Lead',
    productId: 'analytics01',
    velocityMultiplier: 1.5,
    notes: 'Big data architect, Kafka expert',
    pto: []
  },
  {
    id: 'tm-analytics-2',
    name: 'Carlos Rodriguez',
    role: 'Backend',
    experienceLevel: 'Senior',
    productId: 'analytics01',
    velocityMultiplier: 1.3,
    notes: 'API developer, Python/FastAPI',
    pto: [
      {
        id: 'pto-analytics-2',
        name: 'Family Event',
        startDate: new Date('2026-03-16'),
        endDate: new Date('2026-03-20')
      }
    ]
  },
  {
    id: 'tm-analytics-3',
    name: 'Jake Thompson',
    role: 'Frontend',
    experienceLevel: 'Senior',
    productId: 'analytics01',
    velocityMultiplier: 1.3,
    notes: 'Data visualization, D3.js expert',
    pto: []
  },
  {
    id: 'tm-analytics-4',
    name: 'Lisa Chang',
    role: 'Fullstack',
    experienceLevel: 'Mid',
    productId: 'analytics01',
    velocityMultiplier: 1.0,
    notes: 'Full-stack developer, versatile',
    pto: []
  },
  {
    id: 'tm-analytics-5',
    name: 'Nina Patel',
    role: 'QA',
    experienceLevel: 'Mid',
    productId: 'analytics01',
    velocityMultiplier: 1.0,
    notes: 'Data testing specialist',
    pto: []
  },

  // ═══════════════════════════════════════════
  // FOOD DELIVERY APP TEAM (foodapp01)
  // ═══════════════════════════════════════════
  {
    id: 'tm-food-1',
    name: 'Michael Chen',
    role: 'iOS',
    experienceLevel: 'Lead',
    productId: 'foodapp01',
    velocityMultiplier: 1.5,
    notes: 'iOS architect, Swift expert',
    pto: []
  },
  {
    id: 'tm-food-2',
    name: 'Amit Singh',
    role: 'Android',
    experienceLevel: 'Senior',
    productId: 'foodapp01',
    velocityMultiplier: 1.3,
    notes: 'Android lead, Kotlin specialist',
    pto: [
      {
        id: 'pto-food-2',
        name: 'Wedding',
        startDate: new Date('2026-03-02'),
        endDate: new Date('2026-03-06')
      }
    ]
  },
  {
    id: 'tm-food-3',
    name: 'Ryan Cooper',
    role: 'Backend',
    experienceLevel: 'Lead',
    productId: 'foodapp01',
    velocityMultiplier: 1.5,
    notes: 'Real-time systems, WebSocket expert',
    pto: []
  },
  {
    id: 'tm-food-4',
    name: 'Sophie Martin',
    role: 'Backend',
    experienceLevel: 'Senior',
    productId: 'foodapp01',
    velocityMultiplier: 1.3,
    notes: 'Payment integration specialist',
    pto: []
  },
  {
    id: 'tm-food-5',
    name: 'Olivia White',
    role: 'Designer',
    experienceLevel: 'Senior',
    productId: 'foodapp01',
    velocityMultiplier: 1.3,
    notes: 'Mobile UI/UX designer',
    pto: []
  },
  {
    id: 'tm-food-6',
    name: 'Grace Kim',
    role: 'QA',
    experienceLevel: 'Senior',
    productId: 'foodapp01',
    velocityMultiplier: 1.3,
    notes: 'Mobile testing, Appium specialist',
    pto: [
      {
        id: 'pto-food-6',
        name: 'Training',
        startDate: new Date('2026-02-23'),
        endDate: new Date('2026-02-27')
      }
    ]
  },
];

export const mockHolidays: Holiday[] = [
  {
    id: 'hol-1',
    name: "New Year's Day",
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-01')
  },
  {
    id: 'hol-2',
    name: "Martin Luther King Jr. Day",
    startDate: new Date('2026-01-19'),
    endDate: new Date('2026-01-19')
  },
  {
    id: 'hol-3',
    name: "Presidents' Day",
    startDate: new Date('2026-02-16'),
    endDate: new Date('2026-02-16')
  },
  {
    id: 'hol-4',
    name: 'Memorial Day',
    startDate: new Date('2026-05-25'),
    endDate: new Date('2026-05-25')
  },
  {
    id: 'hol-5',
    name: 'Independence Day',
    startDate: new Date('2026-07-04'),
    endDate: new Date('2026-07-04')
  },
];



// ===========================================
// EXPORTS AND HELPER FUNCTIONS
// ===========================================
export const mockProducts: Product[] = [product1, product2, product3];

export function findReleaseById(releaseId: string): { product: Product; release: Release } | null {
  for (const product of mockProducts) {
    const release = product.releases.find(r => r.id === releaseId);
    if (release) return { product, release };
  }
  return null;
}

export function getTeamMembersByProduct(productId: string, allMembers: TeamMember[] = mockTeamMembers): TeamMember[] {
  return allMembers.filter(m => m.productId === productId);
}
