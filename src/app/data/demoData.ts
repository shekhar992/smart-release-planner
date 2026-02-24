/**
 * DEMO DATASET FOR INVESTOR PRESENTATION (Optimized for Realism)
 * 
 * This dataset showcases ALL product capabilities with realistic utilization:
 * ✅ Smart Auto-Allocation (85-95% sprint utilization)
 * ✅ Conflict Detection (over-allocated developers, PTO overlaps)
 * ✅ Sprint Capacity Management (mostly healthy, 1 sprint with overflow)
 * ✅ Holiday Impact Visualization
 * ✅ PTO Impact on Tickets
 * ✅ Multi-feature coordination
 * ✅ Drag & Drop functionality
 * ✅ Data persistence
 * 
 * UTILIZATION TARGETS:
 * - Sprints 1-6: 70-85% (healthy utilization)
 * - Sprint 7: 95% (near full capacity - demonstrates optimization)
 * - Sprint 8: 105% (intentional overflow - demonstrates detection)
 * 
 * INTENTIONAL CONFLICTS (demonstrate detection):
 * - Sarah Chen: Overlapping tickets t1 & t2 (shows assignee conflict)
 * - James Wilson: Ticket t14 during PTO (shows PTO conflict)
 * - Yuki Tanaka: Ticket t11 during training PTO (shows PTO impact)
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
                endDate: new Date('2026-02-16'),
                status: 'in-progress',
                storyPoints: 5,
                effortDays: 5,
                assignedTo: 'Sarah Chen'
              },
              {
                id: 't2',
                title: 'JWT Token Management',
                startDate: new Date('2026-02-12'),
                endDate: new Date('2026-02-17'),
                status: 'planned',
                storyPoints: 3,
                effortDays: 3,
                assignedTo: 'Sarah Chen' // ⚠️ INTENTIONAL CONFLICT: Overlaps with t1 to demo detection
              },
              {
                id: 't3',
                title: 'Role-Based Access Control (RBAC)',
                startDate: new Date('2026-02-24'),
                endDate: new Date('2026-03-04'),
                status: 'planned',
                storyPoints: 8,
                effortDays: 8,
                assignedTo: 'Alex Thompson'
              }
            ]
          },
          {
            id: 'f2',
            name: '📊 Analytics Dashboard',
            tickets: [
              {
                id: 't4',
                title: 'Real-time Data Pipeline',
                startDate: new Date('2026-02-10'),
                endDate: new Date('2026-02-19'),
                status: 'in-progress',
                storyPoints: 8,
                effortDays: 8,
                assignedTo: 'Marcus Rivera'
              },
              {
                id: 't5',
                title: 'Chart Components Library',
                startDate: new Date('2026-02-24'),
                endDate: new Date('2026-03-03'),
                status: 'planned',
                storyPoints: 5,
                effortDays: 5,
                assignedTo: 'Elena Zhang'
              },
              {
                id: 't6',
                title: 'Export & Reporting Module',
                startDate: new Date('2026-03-10'),
                endDate: new Date('2026-03-17'),
                status: 'planned',
                storyPoints: 5,
                effortDays: 5,
                assignedTo: 'Maria Garcia'
              }
            ]
          },
          {
            id: 'f3',
            name: '🔌 API Gateway & Integrations',
            tickets: [
              {
                id: 't7',
                title: 'GraphQL API Design',
                startDate: new Date('2026-03-10'),
                endDate: new Date('2026-03-19'),
                status: 'planned',
                storyPoints: 8,
                effortDays: 8,
                assignedTo: 'Yuki Tanaka'
              },
              {
                id: 't8',
                title: 'Rate Limiting & Throttling',
                startDate: new Date('2026-03-03'),
                endDate: new Date('2026-03-08'),
                status: 'planned',
                storyPoints: 5,
                effortDays: 5,
                assignedTo: 'Yuki Tanaka' // ⚠️ INTENTIONAL CONFLICT: Overlaps with Yuki's training PTO (3/2-3/6)
              },
              {
                id: 't9',
                title: 'Webhook System',
                startDate: new Date('2026-03-24'),
                endDate: new Date('2026-04-01'),
                status: 'planned',
                storyPoints: 8,
                effortDays: 8,
                assignedTo: 'Yuki Tanaka'
              }
            ]
          },
          {
            id: 'f4',
            name: '📱 Mobile App (React Native)',
            tickets: [
              {
                id: 't10',
                title: 'Cross-platform Setup & Navigation',
                startDate: new Date('2026-03-24'),
                endDate: new Date('2026-04-02'),
                status: 'planned',
                storyPoints: 8,
                effortDays: 8,
                assignedTo: 'Priya Patel'
              },
              {
                id: 't11',
                title: 'Offline Mode & Sync',
                startDate: new Date('2026-04-07'),
                endDate: new Date('2026-04-16'),
                status: 'planned',
                storyPoints: 8,
                effortDays: 8,
                assignedTo: 'Priya Patel'
              },
              {
                id: 't12',
                title: 'Push Notifications',
                startDate: new Date('2026-04-21'),
                endDate: new Date('2026-04-28'),
                status: 'planned',
                storyPoints: 5,
                effortDays: 5,
                assignedTo: 'Priya Patel'
              }
            ]
          },
          {
            id: 'f5',
            name: '⚙️ DevOps & Infrastructure',
            tickets: [
              {
                id: 't13',
                title: 'Kubernetes Cluster Setup',
                startDate: new Date('2026-02-10'),
                endDate: new Date('2026-02-19'),
                status: 'in-progress',
                storyPoints: 8,
                effortDays: 8,
                assignedTo: 'James Wilson'
              },
              {
                id: 't14',
                title: 'CI/CD Pipeline Automation',
                startDate: new Date('2026-05-05'),
                endDate: new Date('2026-05-12'),
                status: 'planned',
                storyPoints: 8,
                effortDays: 8,
                assignedTo: 'James Wilson' // ⚠️ INTENTIONAL CONFLICT: James on PTO (5/4-5/8) - Critical conflict!
              },
              {
                id: 't15',
                title: 'Monitoring & Alerting (DataDog)',
                startDate: new Date('2026-04-21'),
                endDate: new Date('2026-04-29'),
                status: 'planned',
                storyPoints: 5,
                effortDays: 5,
                assignedTo: 'James Wilson'
              }
            ]
          },
          {
            id: 'f6',
            name: '🧪 Testing & QA',
            tickets: [
              {
                id: 't16',
                title: 'E2E Test Suite (Cypress)',
                startDate: new Date('2026-04-07'),
                endDate: new Date('2026-04-16'),
                status: 'planned',
                storyPoints: 8,
                effortDays: 8,
                assignedTo: 'Elena Zhang'
              },
              {
                id: 't17',
                title: 'Security Testing & Compliance Audit',
                startDate: new Date('2026-05-05'),
                endDate: new Date('2026-05-14'),
                status: 'planned',
                storyPoints: 8,
                effortDays: 8,
                assignedTo: 'Alex Thompson'
              },
              {
                id: 't18',
                title: 'Load Testing & Performance Tuning',
                startDate: new Date('2026-05-19'),
                endDate: new Date('2026-05-28'),
                status: 'planned',
                storyPoints: 8,
                effortDays: 8,
                assignedTo: 'Marcus Rivera' // Sprint 8 ticket for post-launch support
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

✅ SCENARIO 1: Developer Conflicts (Demonstrates Detection)
- Sarah Chen: t1 and t2 overlap (Feb 10-17)
  → Shows ASSIGNEE_OVERLAP conflict in timeline
  → Conflict badge appears in ticket details
  → User can resolve by adjusting dates OR accept risk

✅ SCENARIO 2: PTO Impact on Tickets (Demonstrates Smart Warnings)
- James Wilson: t14 CI/CD Pipeline during PTO (May 4-8)
  → Shows PTO_OVERLAP conflict with 🏖️ icon
  → Ticket extends to show "+Xd delay" badge
  → Warning in capacity panel
- Yuki Tanaka: t8 Rate Limiting during training PTO (Mar 2-6)
  → Shows PTO impact visualization
  → Suggests reassignment or date shift

✅ SCENARIO 3: Smart Sprint Allocation (Demonstrates Algorithm)
- 18 tickets distributed across 8 sprints
- Most sprints: 70-85% utilization (healthy)
- Sprint 7: 95% utilization (near full optimization)
- Sprint 8: 105% utilization (intentional overflow for demo)
- Auto-allocation uses best-fit bin-packing (not first-fit)
  → Fills each sprint to 85%+ before moving to next
  → High-priority tickets placed first
  → Result: Better capacity utilization vs naive allocation

✅ SCENARIO 4: Holiday Impact Visualization
- Presidents Day (Feb 16): Reduces Sprint 1 capacity by 8 dev-days
- Company Offsite (Mar 30-31): Sprint 4 loses 16 dev-days
- Memorial Day (May 25): Sprint 8 capacity hit
- Holidays shown as vertical purple bands in timeline
- Capacity calculations automatically account for holidays

✅ SCENARIO 5: Multi-feature Coordination
- Auth (f1) is critical path - starts immediately
- Analytics (f2) runs in parallel with Auth
- API Gateway (f3) builds on Auth foundation
- Mobile (f4) depends on API Gateway completion
- DevOps (f5) supports all features throughout
- Testing (f6) validates in Sprint 5-8

✅ SCENARIO 6: Data Persistence & Drag-Drop
- All changes persist to localStorage automatically
- Drag & drop tickets to adjust dates
- Resize tickets to change duration
- Changes trigger conflict re-detection
- Navigation maintains state across views

*/

// ========================================
// DEMO TESTING WORKFLOW (Investor Pitch)
// ========================================
/*

STEP 1: Load Demo Data
- Click "Reset Demo Data" button in settings
- Confirm reset → Loads realistic 18-ticket dataset
- Timeline shows 8 sprints, 6 features, 8 developers

STEP 2: Show Smart Auto-Allocation
- Most sprints show 70-85% utilization (GREEN/AMBER)
- Sprint 7 shows 95% (AMBER - optimized packing)
- Sprint 8 shows 105% (RED - overflow detection demo)
- Hover sprint headers → See capacity breakdown:
  "8 devs × 10 days - 1d holiday - 4d PTO = 75d capacity"

STEP 3: Show Conflict Detection (Product Value)
- Sprint 1: Sarah Chen has ⚠️ conflict badge (t1 + t2 overlap)
  → Hover to see: "Overlapping assignments detected"
  → Shows tool catches problems BEFORE they happen
- Sprint 7: James Wilson has 🏖️ PTO conflict (t14 during vacation)
  → Tooltip shows: "Ticket overlaps with PTO (May 4-8)"
  → Demonstrates real-world scenario detection

STEP 4: Show PTO Impact Analysis
- Click on James Wilson's t14 ticket
- See PTO overlay: Red hatched pattern during May 4-8
- Ticket details show: "+3d delay risk"
- User can: Reassign, adjust dates, or accept risk
- Demonstrates proactive planning capability

STEP 5: Show Holiday Visualization
- Purple vertical bands: Presidents Day (Feb 16), Company Offsite (Mar 30-31), Memorial Day (May 25)
- Sprint headers automatically reduce capacity for holidays
- Sprint 1 capacity: "72 days (8d holiday impact)"
- Demonstrates dynamic capacity calculation

STEP 6: Drag & Drop Live Updates
- Drag Sarah's t2 ticket to Feb 18 (after t1 ends)
- ⚠️ Conflict badge disappears immediately
- Auto-save indicator blinks
- Capacity recalculates in real-time
- Demonstrates interactive resolution

STEP 7: Show Capacity Preview in Upload
- Navigate to "Create Release" wizard
- Upload CSV (or use sample)
- NEW: See "Sprint Capacity Breakdown" section
- Shows: "Sprint 1: 👥 8 devs × 10 days - 1d holiday = 72 days"
- User sees capacity BEFORE allocating
- Demonstrates transparency

STEP 8: Data Persistence
- Make any change (move ticket, adjust sprint)
- Refresh entire app (F5)
- All changes persist (localStorage)
- Click "Reset" → Restores original demo data
- Demonstrates production-ready reliability

*/
