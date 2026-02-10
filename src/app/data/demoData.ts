/**
 * DEMO DATASET FOR INVESTOR PRESENTATION
 * 
 * This dataset is specifically designed to showcase ALL features:
 * ✅ Conflict Detection (over-allocated developers)
 * ✅ Sprint Capacity Management (over/under capacity)
 * ✅ Holiday Impact Visualization
 * ✅ PTO Impact on Tickets
 * ✅ Multi-feature coordination
 * ✅ Drag & Drop functionality
 * ✅ Data persistence
 */

import { Product, Holiday, TeamMember } from './mockData';

// ========================================
// DEMO TEAM: 8 Developers (all belong to prod1)
// ========================================
export const demoTeamMembers: TeamMember[] = [
  {
    id: 'tm1',
    name: 'Sarah Chen',
    role: 'Developer',
    productId: 'prod1',
    pto: [
      { id: 'pto1', name: 'Spring Break', startDate: new Date('2026-03-10'), endDate: new Date('2026-03-14') },
      { id: 'pto2', name: 'Family Vacation', startDate: new Date('2026-04-20'), endDate: new Date('2026-04-25') }
    ],
    notes: 'Senior Full-Stack Engineer, Tech Lead'
  },
  {
    id: 'tm2',
    name: 'Marcus Rivera',
    role: 'Developer',
    productId: 'prod1',
    pto: [
      { id: 'pto3', name: 'Conference', startDate: new Date('2026-02-23'), endDate: new Date('2026-02-28') },
      { id: 'pto4', name: 'Wedding', startDate: new Date('2026-04-06'), endDate: new Date('2026-04-10') }
    ],
    notes: 'Backend Specialist, Performance Expert'
  },
  {
    id: 'tm3',
    name: 'Elena Zhang',
    role: 'Developer',
    productId: 'prod1',
    pto: [
      { id: 'pto5', name: 'Medical', startDate: new Date('2026-03-23'), endDate: new Date('2026-03-27') }
    ],
    notes: 'Frontend Expert, UX Engineer'
  },
  {
    id: 'tm4',
    name: 'James Wilson',
    role: 'Developer',
    productId: 'prod1',
    pto: [
      { id: 'pto6', name: 'Personal', startDate: new Date('2026-05-04'), endDate: new Date('2026-05-08') }
    ],
    notes: 'DevOps & Infrastructure'
  },
  {
    id: 'tm5',
    name: 'Priya Patel',
    role: 'Developer',
    productId: 'prod1',
    pto: [
      { id: 'pto7', name: 'Diwali Vacation', startDate: new Date('2026-02-16'), endDate: new Date('2026-02-20') }
    ],
    notes: 'Mobile & Cross-Platform'
  },
  {
    id: 'tm6',
    name: 'Alex Thompson',
    role: 'Developer',
    productId: 'prod1',
    pto: [
      { id: 'pto8', name: 'Moving', startDate: new Date('2026-04-27'), endDate: new Date('2026-05-01') }
    ],
    notes: 'Security & Compliance'
  },
  {
    id: 'tm7',
    name: 'Yuki Tanaka',
    role: 'Developer',
    productId: 'prod1',
    pto: [
      { id: 'pto9', name: 'Training', startDate: new Date('2026-03-02'), endDate: new Date('2026-03-06') }
    ],
    notes: 'API & Integrations'
  },
  {
    id: 'tm8',
    name: 'Maria Garcia',
    role: 'Developer',
    productId: 'prod1',
    pto: [
      { id: 'pto10', name: 'Vacation', startDate: new Date('2026-05-18'), endDate: new Date('2026-05-22') }
    ],
    notes: 'Data & Analytics'
  }
];

// ========================================
// DEMO HOLIDAYS: Q1-Q2 2026
// ========================================
export const demoHolidays: Holiday[] = [
  {
    id: 'h1',
    name: 'Presidents Day',
    startDate: new Date('2026-02-16'),
    endDate: new Date('2026-02-16')
  },
  {
    id: 'h2',
    name: 'Good Friday',
    startDate: new Date('2026-04-03'),
    endDate: new Date('2026-04-03')
  },
  {
    id: 'h3',
    name: 'Memorial Day',
    startDate: new Date('2026-05-25'),
    endDate: new Date('2026-05-25')
  },
  {
    id: 'h4',
    name: 'Company Offsite',
    startDate: new Date('2026-03-30'),
    endDate: new Date('2026-03-31')
  }
];

// ========================================
// DEMO PRODUCT: "TechPlatform 2.0"
// ========================================
export const demoProducts: Product[] = [
  {
    id: 'prod1',
    name: 'TechPlatform 2.0',
    releases: [
      {
        id: 'rel1',
        name: 'Q1/Q2 2026 - Platform Modernization',
        startDate: new Date('2026-02-10'),
        endDate: new Date('2026-05-30'),
        sprints: [
          {
            id: 's1',
            name: 'Sprint 1: Foundation',
            startDate: new Date('2026-02-10'),
            endDate: new Date('2026-02-21')
          },
          {
            id: 's2',
            name: 'Sprint 2: Core Features',
            startDate: new Date('2026-02-24'),
            endDate: new Date('2026-03-07')
          },
          {
            id: 's3',
            name: 'Sprint 3: Integration',
            startDate: new Date('2026-03-10'),
            endDate: new Date('2026-03-21')
          },
          {
            id: 's4',
            name: 'Sprint 4: Polish',
            startDate: new Date('2026-03-24'),
            endDate: new Date('2026-04-04')
          },
          {
            id: 's5',
            name: 'Sprint 5: Beta Launch',
            startDate: new Date('2026-04-07'),
            endDate: new Date('2026-04-18')
          },
          {
            id: 's6',
            name: 'Sprint 6: Hardening',
            startDate: new Date('2026-04-21'),
            endDate: new Date('2026-05-02')
          },
          {
            id: 's7',
            name: 'Sprint 7: Production Release',
            startDate: new Date('2026-05-05'),
            endDate: new Date('2026-05-16')
          },
          {
            id: 's8',
            name: 'Sprint 8: Post-Launch Support',
            startDate: new Date('2026-05-19'),
            endDate: new Date('2026-05-30')
          }
        ],
        features: [
          {
            id: 'f1',
            name: '🔐 Authentication & Security (Critical Path)',
            tickets: [
              {
                id: 't1',
                title: 'OAuth 2.0 Integration',
                startDate: new Date('2026-02-10'),
                endDate: new Date('2026-02-14'),
                status: 'in-progress',
                storyPoints: 5,
                assignedTo: 'Sarah Chen'
              },
              {
                id: 't2',
                title: 'JWT Token Management',
                startDate: new Date('2026-02-12'),
                endDate: new Date('2026-02-16'),
                status: 'planned',
                storyPoints: 3,
                assignedTo: 'Sarah Chen' // CONFLICT: Overlaps with t1
              },
              {
                id: 't3',
                title: 'Role-Based Access Control (RBAC)',
                startDate: new Date('2026-02-17'),
                endDate: new Date('2026-02-21'),
                status: 'planned',
                storyPoints: 8,
                assignedTo: 'Alex Thompson'
              },
              {
                id: 't4',
                title: 'Multi-Factor Authentication',
                startDate: new Date('2026-02-24'),
                endDate: new Date('2026-02-28'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'Alex Thompson'
              },
              {
                id: 't5',
                title: 'Security Audit & Penetration Testing',
                startDate: new Date('2026-03-03'),
                endDate: new Date('2026-03-07'),
                status: 'planned',
                storyPoints: 8,
                assignedTo: 'Alex Thompson'
              }
            ]
          },
          {
            id: 'f2',
            name: '📊 Analytics Dashboard',
            tickets: [
              {
                id: 't6',
                title: 'Real-time Data Pipeline',
                startDate: new Date('2026-02-10'),
                endDate: new Date('2026-02-17'),
                status: 'in-progress',
                storyPoints: 8,
                assignedTo: 'Marcus Rivera'
              },
              {
                id: 't7',
                title: 'Chart Components Library',
                startDate: new Date('2026-02-12'),
                endDate: new Date('2026-02-19'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'Elena Zhang'
              },
              {
                id: 't8',
                title: 'Custom Dashboard Builder',
                startDate: new Date('2026-02-18'),
                endDate: new Date('2026-02-25'),
                status: 'planned',
                storyPoints: 8,
                assignedTo: 'Marcus Rivera' // PTO impact: 2/23-2/28
              },
              {
                id: 't9',
                title: 'Export & Reporting Module',
                startDate: new Date('2026-02-20'),
                endDate: new Date('2026-02-27'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'Maria Garcia'
              },
              {
                id: 't10',
                title: 'Performance Optimization',
                startDate: new Date('2026-03-02'),
                endDate: new Date('2026-03-07'),
                status: 'planned',
                storyPoints: 3,
                assignedTo: 'Marcus Rivera'
              }
            ]
          },
          {
            id: 'f3',
            name: '🔌 API Gateway & Integrations',
            tickets: [
              {
                id: 't11',
                title: 'GraphQL API Design',
                startDate: new Date('2026-02-24'),
                endDate: new Date('2026-03-03'),
                status: 'planned',
                storyPoints: 8,
                assignedTo: 'Yuki Tanaka'
              },
              {
                id: 't12',
                title: 'Rate Limiting & Throttling',
                startDate: new Date('2026-03-04'),
                endDate: new Date('2026-03-08'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'Yuki Tanaka' // PTO: 3/2-3/6 - Major conflict!
              },
              {
                id: 't13',
                title: 'Webhook System',
                startDate: new Date('2026-03-10'),
                endDate: new Date('2026-03-17'),
                status: 'planned',
                storyPoints: 8,
                assignedTo: 'Yuki Tanaka'
              },
              {
                id: 't14',
                title: 'Third-party Integrations (Slack, Teams)',
                startDate: new Date('2026-03-18'),
                endDate: new Date('2026-03-24'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'Yuki Tanaka'
              }
            ]
          },
          {
            id: 'f4',
            name: '📱 Mobile App (React Native)',
            tickets: [
              {
                id: 't15',
                title: 'Cross-platform Setup & Navigation',
                startDate: new Date('2026-03-10'),
                endDate: new Date('2026-03-17'),
                status: 'planned',
                storyPoints: 8,
                assignedTo: 'Priya Patel'
              },
              {
                id: 't16',
                title: 'Offline Mode & Sync',
                startDate: new Date('2026-03-18'),
                endDate: new Date('2026-03-25'),
                status: 'planned',
                storyPoints: 8,
                assignedTo: 'Priya Patel'
              },
              {
                id: 't17',
                title: 'Push Notifications',
                startDate: new Date('2026-03-26'),
                endDate: new Date('2026-03-31'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'Priya Patel'
              },
              {
                id: 't18',
                title: 'App Store Submission & Review',
                startDate: new Date('2026-04-01'),
                endDate: new Date('2026-04-08'),
                status: 'planned',
                storyPoints: 3,
                assignedTo: 'Priya Patel'
              }
            ]
          },
          {
            id: 'f5',
            name: '⚙️ DevOps & Infrastructure',
            tickets: [
              {
                id: 't19',
                title: 'Kubernetes Cluster Setup',
                startDate: new Date('2026-02-10'),
                endDate: new Date('2026-02-17'),
                status: 'in-progress',
                storyPoints: 8,
                assignedTo: 'James Wilson'
              },
              {
                id: 't20',
                title: 'CI/CD Pipeline Automation',
                startDate: new Date('2026-02-18'),
                endDate: new Date('2026-02-24'),
                status: 'planned',
                storyPoints: 8,
                assignedTo: 'James Wilson'
              },
              {
                id: 't21',
                title: 'Monitoring & Alerting (DataDog)',
                startDate: new Date('2026-02-25'),
                endDate: new Date('2026-03-03'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'James Wilson'
              },
              {
                id: 't22',
                title: 'Auto-scaling Configuration',
                startDate: new Date('2026-03-10'),
                endDate: new Date('2026-03-14'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'James Wilson'
              },
              {
                id: 't23',
                title: 'Disaster Recovery & Backup',
                startDate: new Date('2026-03-17'),
                endDate: new Date('2026-03-21'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'James Wilson'
              },
              {
                id: 't24',
                title: 'Production Deployment',
                startDate: new Date('2026-05-05'),
                endDate: new Date('2026-05-09'),
                status: 'planned',
                storyPoints: 8,
                assignedTo: 'James Wilson' // PTO: 5/4-5/8 - Critical conflict!
              }
            ]
          },
          {
            id: 'f6',
            name: '🧪 Testing & QA',
            tickets: [
              {
                id: 't25',
                title: 'Unit Test Coverage (80%+)',
                startDate: new Date('2026-03-24'),
                endDate: new Date('2026-03-31'),
                status: 'planned',
                storyPoints: 8,
                assignedTo: 'Elena Zhang'
              },
              {
                id: 't26',
                title: 'E2E Test Suite (Cypress)',
                startDate: new Date('2026-04-01'),
                endDate: new Date('2026-04-08'),
                status: 'planned',
                storyPoints: 8,
                assignedTo: 'Elena Zhang'
              },
              {
                id: 't27',
                title: 'Load Testing (k6)',
                startDate: new Date('2026-04-09'),
                endDate: new Date('2026-04-15'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'Marcus Rivera'
              },
              {
                id: 't28',
                title: 'Security Testing & Compliance',
                startDate: new Date('2026-04-16'),
                endDate: new Date('2026-04-22'),
                status: 'planned',
                storyPoints: 8,
                assignedTo: 'Alex Thompson'
              }
            ]
          }
        ]
      }
    ]
  }
];

// ========================================
// KEY DEMO SCENARIOS IN THIS DATASET
// ========================================
/*

✅ SCENARIO 1: Developer Conflicts
- Sarah Chen: t1 and t2 overlap (Feb 10-16)
- Shows conflict detection badge and tooltip

✅ SCENARIO 2: PTO Impact on Critical Path
- James Wilson: Production Deployment (t24) during PTO (May 4-8)
- Marcus Rivera: Dashboard work (t8) during conference (Feb 23-28)
- Yuki Tanaka: API work (t12) during training (Mar 2-6)
- Shows 📅 icon and "+Xd" extension badge

✅ SCENARIO 3: Sprint Capacity Issues
- Sprint 1: OVER-CAPACITY (Presidents Day + PTOs)
- Sprint 2: OVER-CAPACITY (Marcus out for conference)
- Sprint 4: NEAR-CAPACITY (Company offsite Mar 30-31)
- Sprint 7: CRITICAL (James PTO during production deploy)

✅ SCENARIO 4: Holiday Impact
- Presidents Day (Feb 16): Reduces Sprint 1 capacity
- Company Offsite (Mar 30-31): Major Sprint 4 disruption
- Memorial Day (May 25): Sprint 8 capacity hit

✅ SCENARIO 5: Multi-feature Dependencies
- Auth (f1) is critical path for everything else
- Mobile (f4) depends on API Gateway (f3)
- Testing (f6) happens after features stabilize

✅ SCENARIO 6: Data Persistence
- All changes to tickets, sprints, dates persist
- Drag & drop updates localStorage
- Navigation maintains state

*/

// ========================================
// DEMO TESTING WORKFLOW
// ========================================
/*

STEP 1: Load Demo Data
- Click "Reset" button
- Confirm reset
- Data loads from this file

STEP 2: Show Conflict Detection
- Look at Sprint 1: Sarah Chen has red badge
- Hover to see conflict details
- Show tooltip breakdown

STEP 3: Show PTO Impact
- Look at Sprint 2: Marcus Rivera's Dashboard ticket
- See 📅 icon and "+3d" badge
- Hover to see PTO analysis

STEP 4: Show Sprint Capacity
- Sprint 1: RED percentage (over-capacity)
- Sprint 4: YELLOW (near-capacity with offsite)
- Sprint 7: RED (James PTO during deploy)
- Hover sprint headers to see capacity breakdown

STEP 5: Drag & Drop
- Drag a ticket to new dates
- See auto-save indicator update
- Navigate away and back - change persists

STEP 6: Navigation
- Click "Team Roster" - see 8 developers
- Click "Holidays" - see 4 holidays
- Click back - return to timeline

STEP 7: Data Persistence
- Make a change (move ticket)
- Refresh page
- Change is still there
- Click "Reset" to restore original

*/
