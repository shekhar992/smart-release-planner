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
  role: 'Developer' | 'Designer' | 'QA';
  experienceLevel?: 'Junior' | 'Mid' | 'Senior';
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
// PRODUCT 1: E-Commerce Platform
// Real-world retail e-commerce scenario
// ===========================================
const product1: Product = {
  id: 'ecom01',
  name: 'ShopEasy - E-Commerce Platform',
  releases: [
    {
      id: 'ecom-r1',
      name: 'Q2 2026 - Spring Launch',
      startDate: new Date('2026-03-02'),
      endDate: new Date('2026-06-06'),
      storyPointMapping: SP_PRESETS.fibonacci,
      features: [
        {
          id: 'ecom-f1',
          name: '🛒 Shopping Cart & Checkout',
          tickets: [
            {
              id: 'ecom-t1',
              title: 'Shopping cart state management',
              description: 'Priority: High | Design Redux-based cart with persistence and real-time updates',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-06'),
              status: 'completed',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Sarah Chen'
            },
            {
              id: 'ecom-t2',
              title: 'One-click checkout flow',
              description: 'Priority: High | Build streamlined single-page checkout with saved payment methods',
              startDate: new Date('2026-03-09'),
              endDate: new Date('2026-03-16'),
              status: 'in-progress',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Michael Rodriguez'
            },
            {
              id: 'ecom-t3',
              title: 'Stripe payment integration',
              description: 'Priority: High | Integrate Stripe with PCI compliance and 3D Secure support',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-23'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Sarah Chen'
            },
            {
              id: 'ecom-t4',
              title: 'Guest checkout option',
              description: 'Priority: Medium | Allow checkout without account creation',
              startDate: new Date('2026-03-23'),
              endDate: new Date('2026-03-27'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Michael Rodriguez'
            },
            {
              id: 'ecom-t5',
              title: 'Abandoned cart recovery emails',
              description: 'Priority: Low | Email automation for cart abandonment with discount codes',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-03'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Emily Watson'
            }
          ]
        },
        {
          id: 'ecom-f2',
          name: '🔍 Product Search & Discovery',
          tickets: [
            {
              id: 'ecom-t6',
              title: 'Elasticsearch integration',
              description: 'Priority: High | Set up Elasticsearch cluster for product search',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-09'),
              status: 'completed',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'James Kim'
            },
            {
              id: 'ecom-t7',
              title: 'Smart search with autocomplete',
              description: 'Priority: High | Implement typeahead search with product suggestions',
              startDate: new Date('2026-03-09'),
              endDate: new Date('2026-03-16'),
              status: 'in-progress',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'James Kim'
            },
            {
              id: 'ecom-t8',
              title: 'Advanced filtering system',
              description: 'Priority: Medium | Multi-faceted filters (price, category, brand, ratings)',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-23'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Emily Watson'
            },
            {
              id: 'ecom-t9',
              title: 'Product recommendations engine',
              description: 'Priority: Medium | ML-based "You might also like" recommendations',
              startDate: new Date('2026-03-23'),
              endDate: new Date('2026-04-03'),
              status: 'planned',
              storyPoints: 13,
              effortDays: 13,
              assignedTo: 'James Kim'
            }
          ]
        },
        {
          id: 'ecom-f3',
          name: '👤 User Accounts & Profiles',
          tickets: [
            {
              id: 'ecom-t10',
              title: 'OAuth social login (Google, Facebook)',
              description: 'Priority: High | Implement social authentication with profile sync',
              startDate: new Date('2026-03-09'),
              endDate: new Date('2026-03-16'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Sarah Chen'
            },
            {
              id: 'ecom-t11',
              title: 'User profile management',
              description: 'Priority: High | Build profile editor with avatar upload and address book',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-23'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Michael Rodriguez'
            },
            {
              id: 'ecom-t12',
              title: 'Order history and tracking',
              description: 'Priority: High | Display order history with real-time shipment tracking',
              startDate: new Date('2026-03-23'),
              endDate: new Date('2026-03-30'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Emily Watson'
            },
            {
              id: 'ecom-t13',
              title: 'Wishlist functionality',
              description: 'Priority: Low | Allow users to save favorite products',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-06'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Michael Rodriguez'
            }
          ]
        },
        {
          id: 'ecom-f4',
          name: '📊 Admin Dashboard & Inventory',
          tickets: [
            {
              id: 'ecom-t14',
              title: 'Product catalog management',
              description: 'Priority: High | CRUD interface for products with bulk operations',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-23'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'James Kim'
            },
            {
              id: 'ecom-t15',
              title: 'Real-time inventory tracking',
              description: 'Priority: High | Live stock updates with low-inventory alerts',
              startDate: new Date('2026-03-23'),
              endDate: new Date('2026-03-30'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Sarah Chen'
            },
            {
              id: 'ecom-t16',
              title: 'Sales analytics dashboard',
              description: 'Priority: Medium | Revenue tracking, top products, conversion metrics',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-10'),
              status: 'planned',
              storyPoints: 13,
              effortDays: 13,
              assignedTo: 'James Kim'
            },
            {
              id: 'ecom-t17',
              title: 'Order fulfillment workflow',
              description: 'Priority: High | Order processing pipeline with status updates',
              startDate: new Date('2026-04-10'),
              endDate: new Date('2026-04-17'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Michael Rodriguez'
            }
          ]
        },
        {
          id: 'ecom-f5',
          name: '🚀 Performance & DevOps',
          tickets: [
            {
              id: 'ecom-t18',
              title: 'CDN integration for static assets',
              description: 'Priority: High | CloudFlare CDN setup for images and CSS/JS',
              startDate: new Date('2026-04-10'),
              endDate: new Date('2026-04-14'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'David Lee'
            },
            {
              id: 'ecom-t19',
              title: 'Redis caching layer',
              description: 'Priority: High | Implement Redis for product catalog and session caching',
              startDate: new Date('2026-04-14'),
              endDate: new Date('2026-04-18'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'David Lee'
            },
            {
             id: 'ecom-t20',
              title: 'Load testing & optimization',
              description: 'Priority: High | k6 load tests targeting 10k concurrent users',
              startDate: new Date('2026-04-21'),
              endDate: new Date('2026-04-25'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'David Lee'
            },
            {
              id: 'ecom-t21',
              title: 'Production monitoring setup',
              description: 'Priority: Medium | DataDog APM with custom dashboards',
              startDate: new Date('2026-04-28'),
              endDate: new Date('2026-05-02'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'David Lee'
            }
          ]
        },
        {
          id: 'ecom-f6',
          name: '🧪 QA & Testing',
          tickets: [
            {
              id: 'ecom-t22',
              title: 'E2E test suite (Playwright)',
              description: 'Priority: High | Complete user journey tests from browse to checkout',
              startDate: new Date('2026-04-21'),
              endDate: new Date('2026-04-28'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Lisa Park'
            },
            {
              id: 'ecom-t23',
              title: 'Payment gateway testing',
              description: 'Priority: High | Test all payment scenarios including failures',
              startDate: new Date('2026-04-28'),
              endDate: new Date('2026-05-05'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Lisa Park'
            },
            {
              id: 'ecom-t24',
              title: 'Mobile responsiveness testing',
              description: 'Priority: Medium | Cross-device testing on iOS/Android',
              startDate: new Date('2026-05-05'),
              endDate: new Date('2026-05-09'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Lisa Park'
            },
            {
              id: 'ecom-t25',
              title: 'Security penetration testing',
              description: 'Priority: High | Third-party security audit and fixes',
              startDate: new Date('2026-05-12'),
              endDate: new Date('2026-05-19'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'David Lee'
            }
          ]
        }
      ],
      sprints: [
        {
          id: 'ecom-s1',
          name: 'Sprint 1 - Foundation',
          startDate: new Date('2026-03-02'),
          endDate: new Date('2026-03-15')
        },
        {
          id: 'ecom-s2',
          name: 'Sprint 2 - Core Features',
          startDate: new Date('2026-03-16'),
          endDate: new Date('2026-03-29')
        },
        {
          id: 'ecom-s3',
          name: 'Sprint 3 - User Experience',
          startDate: new Date('2026-03-30'),
          endDate: new Date('2026-04-12')
        },
        {
          id: 'ecom-s4',
          name: 'Sprint 4 - Admin & Analytics',
          startDate: new Date('2026-04-13'),
          endDate: new Date('2026-04-26')
        },
        {
          id: 'ecom-s5',
          name: 'Sprint 5 - Testing & Polish',
          startDate: new Date('2026-04-27'),
          endDate: new Date('2026-05-10')
        },
        {
          id: 'ecom-s6',
          name: 'Sprint 6 - UAT & Launch Prep',
          startDate: new Date('2026-05-11'),
          endDate: new Date('2026-05-24')
        }
      ],
      milestones: [
        {
          id: 'ecom-m1',
          releaseId: 'ecom-r1',
          name: 'Code Freeze',
          type: 'Freeze',
          dateType: 'single',
          startDate: new Date('2026-05-08'),
          description: 'No new features, bug fixes only',
          isBlocking: true,
          order: 1
        },
        {
          id: 'ecom-m2',
          releaseId: 'ecom-r1',
          name: 'Security Audit',
          type: 'Testing',
          dateType: 'range',
          startDate: new Date('2026-05-12'),
          endDate: new Date('2026-05-16'),
          description: 'External penetration testing',
          isBlocking: true,
          order: 2
        },
        {
          id: 'ecom-m3',
          releaseId: 'ecom-r1',
          name: 'UAT Approval Gate',
          type: 'Approval',
          dateType: 'single',
          startDate: new Date('2026-05-23'),
          description: 'Stakeholder sign-off required',
          isBlocking: true,
          order: 3
        },
        {
          id: 'ecom-m4',
          releaseId: 'ecom-r1',
          name: 'Production Deployment',
          type: 'Deployment',
          dateType: 'single',
          startDate: new Date('2026-06-02'),
          description: 'Blue-green deployment to production',
          isBlocking: false,
          order: 4
        },
        {
          id: 'ecom-m5',
          releaseId: 'ecom-r1',
          name: 'Public Launch 🎉',
          type: 'Launch',
          dateType: 'single',
          startDate: new Date('2026-06-06'),
          description: 'Marketing campaign goes live',
          isBlocking: false,
          order: 5
        }
      ],
      phases: [
        {
          id: 'ecom-p1',
          releaseId: 'ecom-r1',
          name: 'Development',
          type: 'DevWindow',
          startDate: new Date('2026-03-02'),
          endDate: new Date('2026-05-08'),
          allowsWork: true,
          order: 1,
          description: 'Active feature development'
        },
        {
          id: 'ecom-p2',
          releaseId: 'ecom-r1',
          name: 'System Testing (SIT)',
          type: 'Testing',
          startDate: new Date('2026-05-09'),
          endDate: new Date('2026-05-19'),
          allowsWork: false,
          order: 2,
          description: 'Integration and system testing'
        },
        {
          id: 'ecom-p3',
          releaseId: 'ecom-r1',
          name: 'User Acceptance (UAT)',
          type: 'Approval',
          startDate: new Date('2026-05-20'),
          endDate: new Date('2026-05-30'),
          allowsWork: false,
          order: 3,
          description: 'Business stakeholder validation'
        },
        {
          id: 'ecom-p4',
          releaseId: 'ecom-r1',
          name: 'Deployment & Launch',
          type: 'Launch',
          startDate: new Date('2026-06-01'),
          endDate: new Date('2026-06-06'),
          allowsWork: false,
          order: 4,
          description: 'Production deployment and go-live'
        }
      ]
    }
  ]
};

// ===========================================
// PRODUCT 2: Healthcare Patient Portal
// HIPAA-compliant digital health platform
// ===========================================
const product2: Product = {
  id: 'health01',
  name: 'HealthConnect - Patient Portal',
  releases: [
    {
      id: 'health-r1',
      name: 'Q2 2026 - Digital Health Launch',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-07-12'),
      storyPointMapping: SP_PRESETS.fibonacci,
      features: [
        {
          id: 'health-f1',
          name: '📋 Patient Records & EHR Integration',
          tickets: [
            {
              id: 'health-t1',
              title: 'HL7 FHIR API integration',
              description: 'Priority: High | Connect to hospital EHR systems via FHIR standard',
              startDate: new Date('2026-04-01'),
              endDate: new Date('2026-04-08'),
              status: 'completed',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Dr. Raj Patel'
            },
            {
              id: 'health-t2',
              title: 'Patient records dashboard',
              description: 'Priority: High | Display medical history, lab results, and imaging reports',
              startDate: new Date('2026-04-08'),
              endDate: new Date('2026-04-14'),
              status: 'completed',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Nina Santos'
            },
            {
              id: 'health-t3',
              title: 'Document upload and storage',
              description: 'Priority: Medium | HIPAA-compliant encrypted file storage for patient documents',
              startDate: new Date('2026-04-14'),
              endDate: new Date('2026-04-21'),
              status: 'in-progress',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Alex Kim'
            },
            {
              id: 'health-t4',
              title: 'Health summary PDF export',
              description: 'Priority: Low | Generate printable health records in PDF format',
              startDate: new Date('2026-04-21'),
              endDate: new Date('2026-04-24'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 3,
              assignedTo: 'Nina Santos'
            },
            {
              id: 'health-t5',
              title: 'Vaccination history tracker',
              description: 'Priority: Medium | Track immunization records with CDC compliance',
              startDate: new Date('2026-04-24'),
              endDate: new Date('2026-04-28'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Priya Gupta'
            }
          ]
        },
        {
          id: 'health-f2',
          name: '📅 Appointment Booking & Scheduling',
          tickets: [
            {
              id: 'health-t6',
              title: 'Real-time provider availability',
              description: 'Priority: High | Integrate with hospital scheduling systems for live availability',
              startDate: new Date('2026-04-28'),
              endDate: new Date('2026-05-05'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Dr. Raj Patel'
            },
            {
              id: 'health-t7',
              title: 'Multi-provider booking UI',
              description: 'Priority: High | Search and filter doctors by specialty, location, and insurance',
              startDate: new Date('2026-05-05'),
              endDate: new Date('2026-05-09'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Nina Santos'
            },
            {
              id: 'health-t8',
              title: 'Appointment reminders (SMS/Email)',
              description: 'Priority: Medium | Automated notifications 24hrs before appointments',
              startDate: new Date('2026-05-09'),
              endDate: new Date('2026-05-13'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Tom Wilson'
            },
            {
              id: 'health-t9',
              title: 'Cancellation and rescheduling',
              description: 'Priority: High | Allow patients to modify appointments with proper notifications',
              startDate: new Date('2026-05-13'),
              endDate: new Date('2026-05-16'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 3,
              assignedTo: 'Alex Kim'
            }
          ]
        },
        {
          id: 'health-f3',
          name: '💻 Telemedicine & Virtual Visits',
          tickets: [
            {
              id: 'health-t10',
              title: 'WebRTC video consultation',
              description: 'Priority: High | HIPAA-compliant video chat with end-to-end encryption',
              startDate: new Date('2026-05-16'),
              endDate: new Date('2026-05-26'),
              status: 'planned',
              storyPoints: 13,
              effortDays: 13,
              assignedTo: 'Dr. Raj Patel'
            },
            {
              id: 'health-t11',
              title: 'Virtual waiting room',
              description: 'Priority: Medium | Queue management for telehealth appointments',
              startDate: new Date('2026-05-26'),
              endDate: new Date('2026-05-29'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 3,
              assignedTo: 'Nina Santos'
            },
            {
              id: 'health-t12',
              title: 'Screen share and annotation tools',
              description: 'Priority: Low | Enable doctors to share medical images during consultations',
              startDate: new Date('2026-05-29'),
              endDate: new Date('2026-06-02'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Alex Kim'
            },
            {
              id: 'health-t13',
              title: 'Post-visit summary notes',
              description: 'Priority: Medium | Auto-generate visit summaries with prescriptions',
              startDate: new Date('2026-06-02'),
              endDate: new Date('2026-06-05'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 3,
              assignedTo: 'Priya Gupta'
            }
          ]
        },
        {
          id: 'health-f4',
          name: '💊 Prescription Refills & Pharmacy',
          tickets: [
            {
              id: 'health-t14',
              title: 'Medication list and refill requests',
              description: 'Priority: High | View current prescriptions and request refills',
              startDate: new Date('2026-06-05'),
              endDate: new Date('2026-06-09'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Tom Wilson'
            },
            {
              id: 'health-t15',
              title: 'Pharmacy integration (Surescripts)',
              description: 'Priority: High | E-prescribing with preferred pharmacy network',
              startDate: new Date('2026-06-09'),
              endDate: new Date('2026-06-17'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Dr. Raj Patel'
            },
            {
              id: 'health-t16',
              title: 'Drug interaction warnings',
              description: 'Priority: High | Alert patients and doctors about contraindications',
              startDate: new Date('2026-06-17'),
              endDate: new Date('2026-06-20'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Priya Gupta'
            },
            {
              id: 'health-t17',
              title: 'Refill status tracking',
              description: 'Priority: Low | Notify patients when prescriptions are ready for pickup',
              startDate: new Date('2026-06-20'),
              endDate: new Date('2026-06-23'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 3,
              assignedTo: 'Nina Santos'
            }
          ]
        },
        {
          id: 'health-f5',
          name: '💳 Billing & Insurance Claims',
          tickets: [
            {
              id: 'health-t18',
              title: 'Insurance verification API',
              description: 'Priority: High | Check coverage and benefits in real-time',
              startDate: new Date('2026-06-23'),
              endDate: new Date('2026-06-27'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Alex Kim'
            },
            {
              id: 'health-t19',
              title: 'Medical billing statements',
              description: 'Priority: Medium | Display charges, payments, and outstanding balances',
              startDate: new Date('2026-06-27'),
              endDate: new Date('2026-07-01'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Tom Wilson'
            },
            {
              id: 'health-t20',
              title: 'Online payment processing',
              description: 'Priority: High | Secure credit card payments for copays and balances',
              startDate: new Date('2026-07-01'),
              endDate: new Date('2026-07-06'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Dr. Raj Patel'
            },
            {
              id: 'health-t21',
              title: 'Payment plan setup',
              description: 'Priority: Low | Allow patients to create installment payment plans',
              startDate: new Date('2026-07-06'),
              endDate: new Date('2026-07-09'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 3,
              assignedTo: 'Nina Santos'
            }
          ]
        }
      ],
      sprints: [
        {
          id: 'health-s1',
          name: 'Sprint 1',
          startDate: new Date('2026-04-01'),
          endDate: new Date('2026-04-14')
        },
        {
          id: 'health-s2',
          name: 'Sprint 2',
          startDate: new Date('2026-04-15'),
          endDate: new Date('2026-04-28')
        },
        {
          id: 'health-s3',
          name: 'Sprint 3',
          startDate: new Date('2026-04-29'),
          endDate: new Date('2026-05-12')
        },
        {
          id: 'health-s4',
          name: 'Sprint 4',
          startDate: new Date('2026-05-13'),
          endDate: new Date('2026-05-26')
        },
        {
          id: 'health-s5',
          name: 'Sprint 5',
          startDate: new Date('2026-05-27'),
          endDate: new Date('2026-06-09')
        },
        {
          id: 'health-s6',
          name: 'Sprint 6',
          startDate: new Date('2026-06-10'),
          endDate: new Date('2026-06-23')
        }
      ],
      milestones: [
        {
          id: 'health-m1',
          releaseId: 'health-r1',
          name: 'HIPAA Security Audit',
          type: 'Approval',
          dateType: 'range',
          startDate: new Date('2026-06-15'),
          endDate: new Date('2026-06-19'),
          description: 'Third-party HIPAA compliance audit',
          isBlocking: true,
          order: 1
        },
        {
          id: 'health-m2',
          releaseId: 'health-r1',
          name: 'Code Freeze',
          type: 'Freeze',
          dateType: 'single',
          startDate: new Date('2026-06-24'),
          description: 'No new features after this date',
          isBlocking: true,
          order: 2
        },
        {
          id: 'health-m3',
          releaseId: 'health-r1',
          name: 'UAT Sign-off',
          type: 'Approval',
          dateType: 'single',
          startDate: new Date('2026-07-02'),
          description: 'Clinical stakeholder approval required',
          isBlocking: true,
          order: 3
        },
        {
          id: 'health-m4',
          releaseId: 'health-r1',
          name: 'Production Deployment',
          type: 'Deployment',
          dateType: 'single',
          startDate: new Date('2026-07-08'),
          description: 'Deploy to production environment',
          isBlocking: false,
          order: 4
        },
        {
          id: 'health-m5',
          releaseId: 'health-r1',
          name: 'Patient Portal Launch 🏥',
          type: 'Launch',
          dateType: 'single',
          startDate: new Date('2026-07-12'),
          description: 'Portal accessible to all patients',
          isBlocking: false,
          order: 5
        }
      ],
      phases: [
        {
          id: 'health-p1',
          releaseId: 'health-r1',
          name: 'Development Window',
          type: 'DevWindow',
          startDate: new Date('2026-04-01'),
          endDate: new Date('2026-06-23'),
          allowsWork: true,
          order: 1,
          description: 'Active development and feature implementation'
        },
        {
          id: 'health-p2',
          releaseId: 'health-r1',
          name: 'System Integration Testing',
          type: 'Testing',
          startDate: new Date('2026-06-24'),
          endDate: new Date('2026-06-30'),
          allowsWork: false,
          order: 2,
          description: 'Integration testing with EHR systems'
        },
        {
          id: 'health-p3',
          releaseId: 'health-r1',
          name: 'UAT & Clinical Validation',
          type: 'Testing',
          startDate: new Date('2026-07-01'),
          endDate: new Date('2026-07-07'),
          allowsWork: false,
          order: 3,
          description: 'User acceptance testing with medical staff'
        },
        {
          id: 'health-p4',
          releaseId: 'health-r1',
          name: 'Go-Live',
          type: 'Launch',
          startDate: new Date('2026-07-08'),
          endDate: new Date('2026-07-12'),
          allowsWork: false,
          order: 4,
          description: 'Production launch and monitoring'
        }
      ]
    }
  ]
};

// ===========================================
// PRODUCT 3: Digital Banking App
// Secure mobile banking with fraud detection
// ===========================================
const product3: Product = {
  id: 'bank01',
  name: 'SecureBank - Mobile Banking',
  releases: [
    {
      id: 'bank-r1',
      name: 'H2 2026 - Summer Release',
      startDate: new Date('2026-05-04'),
      endDate: new Date('2026-08-21'),
      storyPointMapping: SP_PRESETS.fibonacci,
      features: [
        {
          id: 'bank-f1',
          name: '💰 Account Management',
          tickets: [
            {
              id: 'bank-t1',
              title: 'Multi-account dashboard',
              description: 'Priority: High | Display checking, savings, credit cards with real-time balances',
              startDate: new Date('2026-05-04'),
              endDate: new Date('2026-05-11'),
              status: 'completed',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Carlos Martinez'
            },
            {
              id: 'bank-t2',
              title: 'Transaction history with search',
              description: 'Priority: High | Filterable transaction list with categorization',
              startDate: new Date('2026-05-11'),
              endDate: new Date('2026-05-16'),
              status: 'completed',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Jennifer Wu'
            },
            {
              id: 'bank-t3',
              title: 'Spending insights and analytics',
              description: 'Priority: Medium | Charts showing spending by category and trends',
              startDate: new Date('2026-05-16'),
              endDate: new Date('2026-05-21'),
              status: 'in-progress',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Ahmed Hassan'
            },
            {
              id: 'bank-t4',
              title: 'Account statements PDF download',
              description: 'Priority: Low | Generate monthly/quarterly statements',
              startDate: new Date('2026-05-21'),
              endDate: new Date('2026-05-23'),
              status: 'planned',
              storyPoints: 2,
              effortDays: 2,
              assignedTo: 'Sofia Rossi'
            },
            {
              id: 'bank-t5',
              title: 'Account alerts and notifications',
              description: 'Priority: Medium | Push notifications for low balance, large transactions',
              startDate: new Date('2026-05-23'),
              endDate: new Date('2026-05-28'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Mark Thompson'
            }
          ]
        },
        {
          id: 'bank-f2',
          name: '💸 Fund Transfers',
          tickets: [
            {
              id: 'bank-t6',
              title: 'Internal account transfers',
              description: 'Priority: High | Move money between own accounts instantly',
              startDate: new Date('2026-05-28'),
              endDate: new Date('2026-06-01'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Carlos Martinez'
            },
            {
              id: 'bank-t7',
              title: 'External bank transfers (ACH)',
              description: 'Priority: High | Link external accounts and initiate ACH transfers',
              startDate: new Date('2026-06-01'),
              endDate: new Date('2026-06-09'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Jennifer Wu'
            },
            {
              id: 'bank-t8',
              title: 'Wire transfer functionality',
              description: 'Priority: Medium | Domestic and international wire transfers',
              startDate: new Date('2026-06-09'),
              endDate: new Date('2026-06-16'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Ahmed Hassan'
            },
            {
              id: 'bank-t9',
              title: 'Transfer scheduling and recurring',
              description: 'Priority: Medium | Set up one-time or recurring transfers',
              startDate: new Date('2026-06-16'),
              endDate: new Date('2026-06-20'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Sofia Rossi'
            },
            {
              id: 'bank-t10',
              title: 'Transfer limits and approvals',
              description: 'Priority: High | Implement daily limits and two-factor approval for large transfers',
              startDate: new Date('2026-06-20'),
              endDate: new Date('2026-06-24'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Mark Thompson'
            }
          ]
        },
        {
          id: 'bank-f3',
          name: '📱 Bill Payments',
          tickets: [
            {
              id: 'bank-t11',
              title: 'Payee management system',
              description: 'Priority: High | Add, edit, and save bill payees',
              startDate: new Date('2026-06-24'),
              endDate: new Date('2026-06-29'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Carlos Martinez'
            },
            {
              id: 'bank-t12',
              title: 'One-time bill payment',
              description: 'Priority: High | Pay bills with custom amounts and memo',
              startDate: new Date('2026-06-29'),
              endDate: new Date('2026-07-03'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Jennifer Wu'
            },
            {
              id: 'bank-t13',
              title: 'Recurring bill payments (AutoPay)',
              description: 'Priority: Medium | Set up automatic monthly bill payments',
              startDate: new Date('2026-07-03'),
              endDate: new Date('2026-07-08'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Ahmed Hassan'
            },
            {
              id: 'bank-t14',
              title: 'Payment history and receipts',
              description: 'Priority: Low | View past payments with confirmation numbers',
              startDate: new Date('2026-07-08'),
              endDate: new Date('2026-07-11'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 3,
              assignedTo: 'Sofia Rossi'
            }
          ]
        },
        {
          id: 'bank-f4',
          name: '📸 Mobile Deposit',
          tickets: [
            {
              id: 'bank-t15',
              title: 'Check capture with camera',
              description: 'Priority: High | Capture front/back of checks with edge detection',
              startDate: new Date('2026-07-11'),
              endDate: new Date('2026-07-21'),
              status: 'planned',
              storyPoints: 13,
              effortDays: 13,
              assignedTo: 'Carlos Martinez'
            },
            {
              id: 'bank-t16',
              title: 'OCR amount verification',
              description: 'Priority: High | Extract check amount using AI/ML for validation',
              startDate: new Date('2026-07-21'),
              endDate: new Date('2026-07-28'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Jennifer Wu'
            },
            {
              id: 'bank-t17',
              title: 'Deposit status tracking',
              description: 'Priority: Medium | Show pending, processing, cleared statuses',
              startDate: new Date('2026-07-28'),
              endDate: new Date('2026-07-31'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 3,
              assignedTo: 'Ahmed Hassan'
            },
            {
              id: 'bank-t18',
              title: 'Deposit limits and holds',
              description: 'Priority: Medium | Enforce daily limits and hold periods',
              startDate: new Date('2026-07-31'),
              endDate: new Date('2026-08-04'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Sofia Rossi'
            }
          ]
        },
        {
          id: 'bank-f5',
          name: '🔒 Security & Fraud Detection',
          tickets: [
            {
              id: 'bank-t19',
              title: 'Biometric authentication (Face/Touch ID)',
              description: 'Priority: High | Implement biometric login for iOS and Android',
              startDate: new Date('2026-08-04'),
              endDate: new Date('2026-08-08'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Mark Thompson'
            },
            {
              id: 'bank-t20',
              title: 'Two-factor authentication (2FA)',
              description: 'Priority: High | SMS/email verification codes for sensitive actions',
              startDate: new Date('2026-08-08'),
              endDate: new Date('2026-08-12'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Carlos Martinez'
            },
            {
              id: 'bank-t21',
              title: 'Fraud detection alerting',
              description: 'Priority: High | Real-time notifications for suspicious transactions',
              startDate: new Date('2026-08-12'),
              endDate: new Date('2026-08-15'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 3,
              assignedTo: 'Jennifer Wu'
            },
            {
              id: 'bank-t22',
              title: 'Card lock/unlock feature',
              description: 'Priority: Medium | Instantly freeze/unfreeze debit cards',
              startDate: new Date('2026-08-15'),
              endDate: new Date('2026-08-18'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 3,
              assignedTo: 'Ahmed Hassan'
            }
          ]
        }
      ],
      sprints: [
        {
          id: 'bank-s1',
          name: 'Sprint 1',
          startDate: new Date('2026-05-04'),
          endDate: new Date('2026-05-17')
        },
        {
          id: 'bank-s2',
          name: 'Sprint 2',
          startDate: new Date('2026-05-18'),
          endDate: new Date('2026-05-31')
        },
        {
          id: 'bank-s3',
          name: 'Sprint 3',
          startDate: new Date('2026-06-01'),
          endDate: new Date('2026-06-14')
        },
        {
          id: 'bank-s4',
          name: 'Sprint 4',
          startDate: new Date('2026-06-15'),
          endDate: new Date('2026-06-28')
        },
        {
          id: 'bank-s5',
          name: 'Sprint 5',
          startDate: new Date('2026-06-29'),
          endDate: new Date('2026-07-12')
        },
        {
          id: 'bank-s6',
          name: 'Sprint 6',
          startDate: new Date('2026-07-13'),
          endDate: new Date('2026-07-26')
        },
        {
          id: 'bank-s7',
          name: 'Sprint 7',
          startDate: new Date('2026-07-27'),
          endDate: new Date('2026-08-09')
        }
      ],
      milestones: [
        {
          id: 'bank-m1',
          releaseId: 'bank-r1',
          name: 'Security Audit Complete',
          type: 'Approval',
          dateType: 'single',
          startDate: new Date('2026-07-20'),
          description: 'Third-party security assessment',
          isBlocking: true,
          order: 1
        },
        {
          id: 'bank-m2',
          releaseId: 'bank-r1',
          name: 'Penetration Testing',
          type: 'Testing',
          dateType: 'range',
          startDate: new Date('2026-07-28'),
          endDate: new Date('2026-08-01'),
          description: 'External pen test for vulnerabilities',
          isBlocking: true,
          order: 2
        },
        {
          id: 'bank-m3',
          releaseId: 'bank-r1',
          name: 'Regulatory Approval (OCC)',
          type: 'Approval',
          dateType: 'single',
          startDate: new Date('2026-08-08'),
          description: 'Office of Comptroller of Currency approval',
          isBlocking: true,
          order: 3
        },
        {
          id: 'bank-m4',
          releaseId: 'bank-r1',
          name: 'Soft Launch (Beta Users)',
          type: 'Launch',
          dateType: 'single',
          startDate: new Date('2026-08-15'),
          description: 'Limited release to 5% of users',
          isBlocking: false,
          order: 4
        },
        {
          id: 'bank-m5',
          releaseId: 'bank-r1',
          name: 'Public Launch 🏦',
          type: 'Launch',
          dateType: 'single',
          startDate: new Date('2026-08-21'),
          description: 'Full rollout to all customers',
          isBlocking: false,
          order: 5
        }
      ],
      phases: [
        {
          id: 'bank-p1',
          releaseId: 'bank-r1',
          name: 'Development Window',
          type: 'DevWindow',
          startDate: new Date('2026-05-04'),
          endDate: new Date('2026-07-26'),
          allowsWork: true,
          order: 1,
          description: 'Feature development and testing'
        },
        {
          id: 'bank-p2',
          releaseId: 'bank-r1',
          name: 'Security Testing',
          type: 'Testing',
          startDate: new Date('2026-07-27'),
          endDate: new Date('2026-08-05'),
          allowsWork: false,
          order: 2,
          description: 'Security audit and penetration testing'
        },
        {
          id: 'bank-p3',
          releaseId: 'bank-r1',
          name: 'UAT & Compliance',
          type: 'Approval',
          startDate: new Date('2026-08-06'),
          endDate: new Date('2026-08-14'),
          allowsWork: false,
          order: 3,
          description: 'Regulatory approval and user testing'
        },
        {
          id: 'bank-p4',
          releaseId: 'bank-r1',
          name: 'Phased Launch',
          type: 'Launch',
          startDate: new Date('2026-08-15'),
          endDate: new Date('2026-08-21'),
          allowsWork: false,
          order: 4,
          description: 'Soft launch to public rollout'
        }
      ]
    }
  ]
};

// ===========================================
// TEAM MEMBERS
// ===========================================
export const mockTeamMembers: TeamMember[] = [
  // ═══════════════════════════════════════════
  // E-COMMERCE PLATFORM TEAM (ecom01)
  // ═══════════════════════════════════════════
  {
    id: 'tm-ecom-1',
    name: 'Sarah Chen',
    role: 'Developer',
    experienceLevel: 'Senior',
    productId: 'ecom01',
    velocityMultiplier: 1.3,
    notes: 'Frontend specialist, React expert',
    pto: [
      {
        id: 'pto-ecom-1',
        name: 'Spring Break Vacation',
        startDate: new Date('2026-03-15'),
        endDate: new Date('2026-03-19')
      }
    ]
  },
  {
    id: 'tm-ecom-2',
    name: 'Michael Rodriguez',
    role: 'Developer',
    experienceLevel: 'Senior',
    productId: 'ecom01',
    velocityMultiplier: 1.2,
    notes: 'Backend lead, microservices architecture',
    pto: [
      {
        id: 'pto-ecom-2',
        name: 'Family Wedding',
        startDate: new Date('2026-05-25'),
        endDate: new Date('2026-05-29')
      }
    ]
  },
  {
    id: 'tm-ecom-3',
    name: 'Emily Watson',
    role: 'Developer',
    experienceLevel: 'Mid',
    productId: 'ecom01',
    velocityMultiplier: 1.0,
    notes: 'Full-stack developer',
    pto: [
      {
        id: 'pto-ecom-3',
        name: 'Tech Conference',
        startDate: new Date('2026-04-20'),
        endDate: new Date('2026-04-24')
      }
    ]
  },
  {
    id: 'tm-ecom-4',
    name: 'James Kim',
    role: 'Developer',
    experienceLevel: 'Mid',
    productId: 'ecom01',
    velocityMultiplier: 1.0,
    notes: 'Backend developer, API specialist',
    pto: []
  },
  {
    id: 'tm-ecom-5',
    name: 'David Lee',
    role: 'QA',
    experienceLevel: 'Senior',
    productId: 'ecom01',
    velocityMultiplier: 1.1,
    notes: 'Test automation expert',
    pto: [
      {
        id: 'pto-ecom-5',
        name: 'Medical Procedure',
        startDate: new Date('2026-05-11'),
        endDate: new Date('2026-05-16')
      }
    ]
  },
  {
    id: 'tm-ecom-6',
    name: 'Lisa Park',
    role: 'Designer',
    experienceLevel: 'Senior',
    productId: 'ecom01',
    velocityMultiplier: 1.2,
    notes: 'UI/UX lead designer',
    pto: []
  },
  {
    id: 'tm-ecom-7',
    name: 'Robert Johnson',
    role: 'Developer',
    experienceLevel: 'Junior',
    productId: 'ecom01',
    velocityMultiplier: 0.7,
    notes: 'Junior frontend developer',
    pto: [
      {
        id: 'pto-ecom-7',
        name: 'Moving Week',
        startDate: new Date('2026-04-06'),
        endDate: new Date('2026-04-10')
      }
    ]
  },
  {
    id: 'tm-ecom-8',
    name: 'Amanda Smith',
    role: 'QA',
    experienceLevel: 'Mid',
    productId: 'ecom01',
    velocityMultiplier: 0.9,
    notes: 'Manual and automation testing',
    pto: []
  },
  {
    id: 'tm-ecom-9',
    name: 'Kevin Zhang',
    role: 'Developer',
    experienceLevel: 'Junior',
    productId: 'ecom01',
    velocityMultiplier: 0.8,
    notes: 'Backend junior, learning Go',
    pto: [
      {
        id: 'pto-ecom-9',
        name: 'Summer Vacation',
        startDate: new Date('2026-06-08'),
        endDate: new Date('2026-06-15')
      }
    ]
  },
  {
    id: 'tm-ecom-10',
    name: 'Rachel Green',
    role: 'Designer',
    experienceLevel: 'Mid',
    productId: 'ecom01',
    velocityMultiplier: 1.0,
    notes: 'Product designer, Figma specialist',
    pto: []
  },

  // ═══════════════════════════════════════════
  // HEALTHCARE PATIENT PORTAL TEAM (health01)
  // ═══════════════════════════════════════════
  {
    id: 'tm-health-1',
    name: 'Dr. Raj Patel',
    role: 'Developer',
    experienceLevel: 'Senior',
    productId: 'health01',
    velocityMultiplier: 1.4,
    notes: 'Healthcare tech lead, FHIR expert',
    pto: [
      {
        id: 'pto-health-1',
        name: 'Medical Conference',
        startDate: new Date('2026-06-15'),
        endDate: new Date('2026-06-19')
      }
    ]
  },
  {
    id: 'tm-health-2',
    name: 'Nina Santos',
    role: 'Developer',
    experienceLevel: 'Mid',
    productId: 'health01',
    velocityMultiplier: 1.0,
    notes: 'Frontend developer, healthcare UI',
    pto: []
  },
  {
    id: 'tm-health-3',
    name: 'Alex Kim',
    role: 'Developer',
    experienceLevel: 'Senior',
    productId: 'health01',
    velocityMultiplier: 1.2,
    notes: 'Security specialist, HIPAA compliance',
    pto: [
      {
        id: 'pto-health-3',
        name: 'Certification Training',
        startDate: new Date('2026-04-20'),
        endDate: new Date('2026-04-24')
      }
    ]
  },
  {
    id: 'tm-health-4',
    name: 'Priya Gupta',
    role: 'Developer',
    experienceLevel: 'Mid',
    productId: 'health01',
    velocityMultiplier: 0.9,
    notes: 'Backend developer, API integration',
    pto: []
  },
  {
    id: 'tm-health-5',
    name: 'Tom Wilson',
    role: 'Developer',
    experienceLevel: 'Senior',
    productId: 'health01',
    velocityMultiplier: 1.1,
    notes: 'DevOps and cloud infrastructure',
    pto: [
      {
        id: 'pto-health-5',
        name: 'Family Reunion',
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-05')
      }
    ]
  },
  {
    id: 'tm-health-6',
    name: 'Maria Lopez',
    role: 'QA',
    experienceLevel: 'Senior',
    productId: 'health01',
    velocityMultiplier: 1.2,
    notes: 'Healthcare QA specialist',
    pto: []
  },
  {
    id: 'tm-health-7',
    name: 'Daniel Brown',
    role: 'Designer',
    experienceLevel: 'Senior',
    productId: 'health01',
    velocityMultiplier: 1.1,
    notes: 'Healthcare UX designer',
    pto: [
      {
        id: 'pto-health-7',
        name: 'UX Workshop',
        startDate: new Date('2026-05-25'),
        endDate: new Date('2026-05-29')
      }
    ]
  },
  {
    id: 'tm-health-8',
    name: 'Samantha White',
    role: 'QA',
    experienceLevel: 'Mid',
    productId: 'health01',
    velocityMultiplier: 0.9,
    notes: 'Compliance testing',
    pto: []
  },
  {
    id: 'tm-health-9',
    name: 'Eric Davis',
    role: 'Developer',
    experienceLevel: 'Junior',
    productId: 'health01',
    velocityMultiplier: 0.7,
    notes: 'Junior developer learning healthcare systems',
    pto: []
  },
  {
    id: 'tm-health-10',
    name: 'Jessica Turner',
    role: 'Designer',
    experienceLevel: 'Mid',
    productId: 'health01',
    velocityMultiplier: 1.0,
    notes: 'UI designer with healthcare focus',
    pto: []
  },

  // ═══════════════════════════════════════════
  // DIGITAL BANKING APP TEAM (bank01)
  // ═══════════════════════════════════════════
  {
    id: 'tm-bank-1',
    name: 'Carlos Martinez',
    role: 'Developer',
    experienceLevel: 'Senior',
    productId: 'bank01',
    velocityMultiplier: 1.3,
    notes: 'Mobile architect, fintech expert',
    pto: [
      {
        id: 'pto-bank-1',
        name: 'Wedding Anniversary',
        startDate: new Date('2026-07-13'),
        endDate: new Date('2026-07-17')
      }
    ]
  },
  {
    id: 'tm-bank-2',
    name: 'Jennifer Wu',
    role: 'Developer',
    experienceLevel: 'Senior',
    productId: 'bank01',
    velocityMultiplier: 1.2,
    notes: 'iOS/Android native development',
    pto: []
  },
  {
    id: 'tm-bank-3',
    name: 'Ahmed Hassan',
    role: 'Developer',
    experienceLevel: 'Mid',
    productId: 'bank01',
    velocityMultiplier: 1.0,
    notes: 'Backend developer, payment systems',
    pto: [
      {
        id: 'pto-bank-3',
        name: 'Hajj Pilgrimage',
        startDate: new Date('2026-06-08'),
        endDate: new Date('2026-06-15')
      }
    ]
  },
  {
    id: 'tm-bank-4',
    name: 'Sofia Rossi',
    role: 'Developer',
    experienceLevel: 'Mid',
    productId: 'bank01',
    velocityMultiplier: 1.0,
    notes: 'Full-stack developer',
    pto: []
  },
  {
    id: 'tm-bank-5',
    name: 'Mark Thompson',
    role: 'Developer',
    experienceLevel: 'Senior',
    productId: 'bank01',
    velocityMultiplier: 1.2,
    notes: 'Security engineer, fraud detection',
    pto: [
      {
        id: 'pto-bank-5',
        name: 'Security Conference',
        startDate: new Date('2026-08-10'),
        endDate: new Date('2026-08-14')
      }
    ]
  },
  {
    id: 'tm-bank-6',
    name: 'Olivia Martin',
    role: 'QA',
    experienceLevel: 'Senior',
    productId: 'bank01',
    velocityMultiplier: 1.1,
    notes: 'Mobile testing specialist',
    pto: []
  },
  {
    id: 'tm-bank-7',
    name: 'Lucas Anderson',
    role: 'Developer',
    experienceLevel: 'Junior',
    productId: 'bank01',
    velocityMultiplier: 0.8,
    notes: 'Junior mobile developer',
    pto: [
      {
        id: 'pto-bank-7',
        name: 'Family Vacation',
        startDate: new Date('2026-05-25'),
        endDate: new Date('2026-05-29')
      }
    ]
  },
  {
    id: 'tm-bank-8',
    name: 'Emma Johnson',
    role: 'Designer',
    experienceLevel: 'Senior',
    productId: 'bank01',
    velocityMultiplier: 1.2,
    notes: 'Mobile UX/UI design lead',
    pto: []
  },
  {
    id: 'tm-bank-9',
    name: 'Noah Williams',
    role: 'QA',
    experienceLevel: 'Mid',
    productId: 'bank01',
    velocityMultiplier: 0.9,
    notes: 'Test automation engineer',
    pto: []
  },
  {
    id: 'tm-bank-10',
    name: 'Sophia Taylor',
    role: 'Designer',
    experienceLevel: 'Mid',
    productId: 'bank01',
    velocityMultiplier: 1.0,
    notes: 'Product designer, mobile apps',
    pto: [
      {
        id: 'pto-bank-10',
        name: 'Design Summit',
        startDate: new Date('2026-08-17'),
        endDate: new Date('2026-08-21')
      }
    ]
  }
];

// ===========================================
// HOLIDAYS
// ===========================================
export const mockHolidays: Holiday[] = [
  {
    id: 'holiday-1',
    name: "Presidents' Day",
    startDate: new Date('2026-02-17'),
    endDate: new Date('2026-02-17')
  },
  {
    id: 'holiday-2',
    name: 'Memorial Day',
    startDate: new Date('2026-05-25'),
    endDate: new Date('2026-05-25')
  },
  {
    id: 'holiday-3',
    name: 'Company Offsite',
    startDate: new Date('2026-06-05'),
    endDate: new Date('2026-06-06')
  },
  {
    id: 'holiday-4',
    name: 'Juneteenth',
    startDate: new Date('2026-06-19'),
    endDate: new Date('2026-06-19')
  },
  {
    id: 'holiday-5',
    name: 'Independence Day',
    startDate: new Date('2026-07-04'),
    endDate: new Date('2026-07-04')
  }
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
