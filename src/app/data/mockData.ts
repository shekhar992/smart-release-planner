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
// COMPREHENSIVE MOCK DATA - ALL CAPABILITIES
// ===========================================
/*
 * 🎯 SHOWCASE DATASET - 4 Products with Complete Feature Coverage
 * 
 * PRODUCT 1: ✨ Perfect Pipeline (ZERO CONFLICTS)
 * - Showcases ideal planning with no issues
 * - Well-paced sprints, no PTO conflicts
 * - All tickets within dev window
 * - Proper dependency chains
 * - Baseline for comparison
 * 
 * PRODUCT 2: 🛒 E-Commerce Express (COMPLEX)
 * - Multiple assignee conflicts
 * - PTO overlaps with critical tickets
 * - Holiday impact on capacity
 * - Dev window spillover scenarios
 * - Complex dependency chains
 * - Milestones for deployment gates
 * 
 * PRODUCT 3: 📱 MobileFit Tracker (MOBILE)
 * - iOS/Android development
 * - Cross-platform coordination
 * - App store submission milestones
 * - Some PTO conflicts
 * - Designer involvement
 * 
 * PRODUCT 4: 📊 DataHub Analytics (COMPREHENSIVE)
 * - Full team diversity (DataEngineer, Designer, QA)
 * - Complex data pipeline dependencies
 * - Testing phase workflows
 * - Approval milestones
 * - Holiday & PTO impact
 */

// ===========================================
// PRODUCT 1: ✨ PERFECT PIPELINE (0 CONFLICTS)
// ===========================================
const product1: Product = {
  id: 'perfect-pipeline-01',
  name: '✨ Perfect Pipeline - CRM Platform',
  releases: [
    {
      id: 'rel-perfect-1',
      name: 'v2.0 - Customer Management Suite',
      startDate: new Date('2026-03-02'),
      endDate: new Date('2026-05-29'),
      storyPointMapping: SP_PRESETS.fibonacci,
      milestones: [
        {
          id: 'ms-perfect-1',
          releaseId: 'rel-perfect-1',
          name: 'Code Freeze',
          type: 'Freeze',
          dateType: 'single',
          startDate: new Date('2026-04-30'),
          description: 'No new features after this date',
          isBlocking: true,
          order: 1
        },
        {
          id: 'ms-perfect-2',
          releaseId: 'rel-perfect-1',
          name: 'UAT Sign-off',
          type: 'Approval',
          dateType: 'single',
          startDate: new Date('2026-05-22'),
          description: 'Stakeholder approval required',
          isBlocking: true,
          order: 2
        },
        {
          id: 'ms-perfect-3',
          releaseId: 'rel-perfect-1',
          name: 'Production Launch',
          type: 'Launch',
          dateType: 'single',
          startDate: new Date('2026-05-29'),
          description: 'Go-live to production',
          isBlocking: false,
          order: 3
        }
      ],
      features: [
        {
          id: 'pf1',
          name: '👤 Customer Profile Management',
          tickets: [
            {
              id: 'pt1',
              title: 'Customer Database Schema',
              description: 'PostgreSQL schema design and migrations',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-06'),
              status: 'completed',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Jennifer Wu',
              requiredRole: 'Backend'
            },
            {
              id: 'pt2',
              title: 'REST API Endpoints',
              description: 'CRUD APIs for customer management',
              startDate: new Date('2026-03-09'),
              endDate: new Date('2026-03-13'),
              status: 'in-progress',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Jennifer Wu',
              requiredRole: 'Backend',
              dependencies: { blockedBy: ['pt1'] }
            },
            {
              id: 'pt3',
              title: 'Customer Profile UI',
              description: 'React components for customer profiles',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-20'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Lucas Brown',
              requiredRole: 'Frontend',
              dependencies: { blockedBy: ['pt2'] }
            }
          ]
        },
        {
          id: 'pf2',
          name: '📞 Communication Hub',
          tickets: [
            {
              id: 'pt4',
              title: 'Email Integration Service',
              description: 'SendGrid integration for customer emails',
              startDate: new Date('2026-03-23'),
              endDate: new Date('2026-03-27'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Marcus Johnson',
              requiredRole: 'Backend'
            },
            {
              id: 'pt5',
              title: 'SMS Notification System',
              description: 'Twilio integration for SMS alerts',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-03'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Marcus Johnson',
              requiredRole: 'Backend'
            },
            {
              id: 'pt6',
              title: 'Communication Dashboard UI',
              description: 'Message history and templates UI',
              startDate: new Date('2026-04-06'),
              endDate: new Date('2026-04-10'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Lucas Brown',
              requiredRole: 'Frontend',
              dependencies: { blockedBy: ['pt4', 'pt5'] }
            }
          ]
        },
        {
          id: 'pf3',
          name: '📊 Analytics & Reporting',
          tickets: [
            {
              id: 'pt7',
              title: 'Analytics Data Pipeline',
              description: 'ETL pipeline for customer analytics',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-17'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Jennifer Wu',
              requiredRole: 'Backend'
            },
            {
              id: 'pt8',
              title: 'Reporting Dashboard',
              description: 'Interactive charts and reports',
              startDate: new Date('2026-04-20'),
              endDate: new Date('2026-04-24'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Lucas Brown',
              requiredRole: 'Frontend',
              dependencies: { blockedBy: ['pt7'] }
            }
          ]
        }
      ],
      sprints: [
        {
          id: 'ps1',
          name: 'Sprint 1: Foundation',
          startDate: new Date('2026-03-02'),
          endDate: new Date('2026-03-13')
        },
        {
          id: 'ps2',
          name: 'Sprint 2: Core Features',
          startDate: new Date('2026-03-16'),
          endDate: new Date('2026-03-27')
        },
        {
          id: 'ps3',
          name: 'Sprint 3: Integration',
          startDate: new Date('2026-03-30'),
          endDate: new Date('2026-04-10')
        },
        {
          id: 'ps4',
          name: 'Sprint 4: Polish & Testing',
          startDate: new Date('2026-04-13'),
          endDate: new Date('2026-04-24')
        }
      ]
    }
  ]
};

// ===========================================
// PRODUCT 2: 🛒 E-COMMERCE EXPRESS (COMPLEX)
// ===========================================
const product2: Product = {
  id: 'ecommerce-01',
  name: '🛒 E-Commerce Express - Online Store',
  releases: [
    {
      id: 'rel-ecom-1',
      name: 'v4.0 - Marketplace Expansion',
      startDate: new Date('2026-02-16'),
      endDate: new Date('2026-05-15'),
      storyPointMapping: SP_PRESETS.fibonacci,
      milestones: [
        {
          id: 'ms-ecom-1',
          releaseId: 'rel-ecom-1',
          name: 'Beta Launch',
          type: 'Launch',
          dateType: 'single',
          startDate: new Date('2026-04-10'),
          description: 'Limited beta release to select customers',
          isBlocking: false,
          order: 1
        },
        {
          id: 'ms-ecom-2',
          releaseId: 'rel-ecom-1',
          name: 'Security Audit',
          type: 'Approval',
          dateType: 'range',
          startDate: new Date('2026-04-20'),
          endDate: new Date('2026-04-24'),
          description: 'External security audit required',
          isBlocking: true,
          order: 2
        },
        {
          id: 'ms-ecom-3',
          releaseId: 'rel-ecom-1',
          name: 'Production Release',
          type: 'Deployment',
          dateType: 'single',
          startDate: new Date('2026-05-15'),
          description: 'Full production deployment',
          isBlocking: false,
          order: 3
        }
      ],
      features: [
        {
          id: 'ef1',
          name: '🛍️ Product Catalog & Search',
          tickets: [
            {
              id: 'et1',
              title: 'Product Search Engine',
              description: 'Elasticsearch integration for product search',
              startDate: new Date('2026-02-16'),
              endDate: new Date('2026-02-20'),
              status: 'completed',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Sophia Rodriguez',
              requiredRole: 'Backend'
            },
            {
              id: 'et2',
              title: '⚡ CONFLICT: Category Management',
              description: 'Product category hierarchy - OVERLAPS with et1',
              startDate: new Date('2026-02-18'),
              endDate: new Date('2026-02-24'),
              status: 'in-progress',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Sophia Rodriguez',
              requiredRole: 'Backend'
            },
            {
              id: 'et3',
              title: 'Product Detail Pages',
              description: 'Rich product detail UI with zoom',
              startDate: new Date('2026-02-25'),
              endDate: new Date('2026-03-03'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Emma Watson',
              requiredRole: 'Frontend',
              dependencies: { blockedBy: ['et1'] }
            },
            {
              id: 'et4',
              title: '🏖️ PTO CONFLICT: Product Recommendations',
              description: 'ML-based recommendations - during PTO (Mar 10-14)',
              startDate: new Date('2026-03-10'),
              endDate: new Date('2026-03-16'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Sophia Rodriguez',
              requiredRole: 'Backend'
            },
            {
              id: 'et31',
              title: 'Advanced Filters & Faceting',
              description: 'Multi-attribute filtering with faceted search',
              startDate: new Date('2026-03-04'),
              endDate: new Date('2026-03-10'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Jake Morrison',
              requiredRole: 'Backend',
              dependencies: { blockedBy: ['et1'] }
            },
            {
              id: 'et32',
              title: 'Product Comparison Tool',
              description: 'Side-by-side product comparison UI',
              startDate: new Date('2026-03-17'),
              endDate: new Date('2026-03-23'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Emma Watson',
              requiredRole: 'Frontend',
              dependencies: { blockedBy: ['et3'] }
            }
          ]
        },
        {
          id: 'ef2',
          name: '🛒 Shopping Cart & Checkout',
          tickets: [
            {
              id: 'et5',
              title: 'Shopping Cart Service',
              description: 'Redis-backed cart with session management',
              startDate: new Date('2026-03-04'),
              endDate: new Date('2026-03-10'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Oliver Kim',
              requiredRole: 'Backend'
            },
            {
              id: 'et6',
              title: 'Payment Gateway Integration',
              description: 'Stripe payment processing integration',
              startDate: new Date('2026-03-11'),
              endDate: new Date('2026-03-17'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Oliver Kim',
              requiredRole: 'Backend',
              dependencies: { blockedBy: ['et5'] }
            },
            {
              id: 'et7',
              title: '⚡ CONFLICT: Order Confirmation System',
              description: 'Email confirmations - OVERLAPS with et6',
              startDate: new Date('2026-03-13'),
              endDate: new Date('2026-03-19'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Oliver Kim',
              requiredRole: 'Backend'
            },
            {
              id: 'et8',
              title: 'Checkout UI Flow',
              description: 'Multi-step checkout with validation',
              startDate: new Date('2026-03-20'),
              endDate: new Date('2026-03-26'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Emma Watson',
              requiredRole: 'Frontend',
              dependencies: { blockedBy: ['et6'] }
            },
            {
              id: 'et33',
              title: 'Coupon & Discount Engine',
              description: 'Promotional codes and discount calculation',
              startDate: new Date('2026-03-24'),
              endDate: new Date('2026-03-30'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Jake Morrison',
              requiredRole: 'Backend',
              dependencies: { blockedBy: ['et5'] }
            },
            {
              id: 'et34',
              title: 'Cart Analytics & Abandonment',
              description: 'Track cart abandonment and recovery emails',
              startDate: new Date('2026-04-03'),
              endDate: new Date('2026-04-09'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Jake Morrison',
              requiredRole: 'Backend',
              dependencies: { blockedBy: ['et5'] }
            }
          ]
        },
        {
          id: 'ef3',
          name: '📦 Inventory & Warehouse',
          tickets: [
            {
              id: 'et9',
              title: 'Warehouse Integration API',
              description: 'Real-time inventory sync with warehouses',
              startDate: new Date('2026-03-27'),
              endDate: new Date('2026-04-02'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Sophia Rodriguez',
              requiredRole: 'Backend'
            },
            {
              id: 'et10',
              title: '🏖️ PTO CONFLICT: Stock Level Alerts',
              description: 'Low stock notification system - during PTO (Apr 7-11)',
              startDate: new Date('2026-04-07'),
              endDate: new Date('2026-04-13'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Oliver Kim',
              requiredRole: 'Backend'
            },
            {
              id: 'et11',
              title: '🚨 SPILLOVER: Inventory Dashboard',
              description: 'UI for inventory management - EXTENDS INTO SIT',
              startDate: new Date('2026-04-25'),
              endDate: new Date('2026-05-01'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Emma Watson',
              requiredRole: 'Frontend'
            },
            {
              id: 'et35',
              title: 'Multi-Warehouse Routing',
              description: 'Smart order routing across warehouses',
              startDate: new Date('2026-04-10'),
              endDate: new Date('2026-04-16'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Jake Morrison',
              requiredRole: 'Backend',
              dependencies: { blockedBy: ['et9'] }
            },
            {
              id: 'et36',
              title: 'Supplier Management Portal',
              description: 'Supplier onboarding and inventory updates',
              startDate: new Date('2026-04-17'),
              endDate: new Date('2026-04-23'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Emma Watson',
              requiredRole: 'Frontend'
            }
          ]
        },
        {
          id: 'ef4',
          name: '⭐ Reviews & Ratings',
          tickets: [
            {
              id: 'et12',
              title: 'Review Database Schema',
              description: 'Review and rating data models',
              startDate: new Date('2026-02-23'),
              endDate: new Date('2026-02-27'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 5,
              assignedTo: 'Jake Morrison',
              requiredRole: 'Backend'
            },
            {
              id: 'et13',
              title: 'Review Submission API',
              description: 'REST API for submitting reviews with moderation',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-06'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Jake Morrison',
              requiredRole: 'Backend',
              dependencies: { blockedBy: ['et12'] }
            },
            {
              id: 'et14',
              title: 'Review Display Component',
              description: 'Star ratings and review cards UI',
              startDate: new Date('2026-03-09'),
              endDate: new Date('2026-03-13'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Natalie Brooks',
              requiredRole: 'Frontend',
              dependencies: { blockedBy: ['et13'] }
            },
            {
              id: 'et15',
              title: 'Image Upload & Gallery',
              description: 'Customer photo uploads with CDN integration',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-20'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Natalie Brooks',
              requiredRole: 'Frontend'
            },
            {
              id: 'et16',
              title: 'Review Moderation Dashboard',
              description: 'Admin tool for reviewing and moderating content',
              startDate: new Date('2026-03-23'),
              endDate: new Date('2026-03-27'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Natalie Brooks',
              requiredRole: 'Frontend',
              dependencies: { blockedBy: ['et13'] }
            }
          ]
        },
        {
          id: 'ef5',
          name: '👔 Seller Dashboard & Tools',
          tickets: [
            {
              id: 'et17',
              title: 'Seller Onboarding Flow',
              description: 'Multi-step seller registration and verification',
              startDate: new Date('2026-02-16'),
              endDate: new Date('2026-02-20'),
              status: 'completed',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Jake Morrison',
              requiredRole: 'Backend'
            },
            {
              id: 'et18',
              title: 'Product Upload & Management',
              description: 'Bulk product upload with CSV/API',
              startDate: new Date('2026-02-23'),
              endDate: new Date('2026-02-27'),
              status: 'in-progress',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Oliver Kim',
              requiredRole: 'Backend',
              dependencies: { blockedBy: ['et17'] }
            },
            {
              id: 'et19',
              title: 'Seller Dashboard UI',
              description: 'Sales analytics and inventory management interface',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-06'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Natalie Brooks',
              requiredRole: 'Frontend',
              dependencies: { blockedBy: ['et18'] }
            },
            {
              id: 'et20',
              title: 'Order Fulfillment System',
              description: 'Seller order management and shipping integration',
              startDate: new Date('2026-03-09'),
              endDate: new Date('2026-03-13'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Jake Morrison',
              requiredRole: 'Backend',
              dependencies: { blockedBy: ['et18'] }
            },
            {
              id: 'et21',
              title: 'Seller Payout System',
              description: 'Commission calculation and automated payouts',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-20'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Jake Morrison',
              requiredRole: 'Backend',
              dependencies: { blockedBy: ['et20'] }
            }
          ]
        },
        {
          id: 'ef6',
          name: '🎯 Marketing & Promotions',
          tickets: [
            {
              id: 'et22',
              title: 'Email Campaign Engine',
              description: 'SendGrid integration for marketing emails',
              startDate: new Date('2026-03-23'),
              endDate: new Date('2026-03-27'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Oliver Kim',
              requiredRole: 'Backend'
            },
            {
              id: 'et23',
              title: 'Promotional Banner System',
              description: 'Dynamic homepage banners with A/B testing',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-03'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Natalie Brooks',
              requiredRole: 'Frontend'
            },
            {
              id: 'et24',
              title: 'Flash Sale System',
              description: 'Time-limited sales with countdown timers',
              startDate: new Date('2026-04-06'),
              endDate: new Date('2026-04-10'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Jake Morrison',
              requiredRole: 'Backend'
            },
            {
              id: 'et25',
              title: 'Loyalty Points & Rewards',
              description: 'Customer loyalty program with points tracking',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-17'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Jake Morrison',
              requiredRole: 'Backend'
            },
            {
              id: 'et26',
              title: 'Referral Program UI',
              description: 'Customer referral dashboard and tracking',
              startDate: new Date('2026-04-20'),
              endDate: new Date('2026-04-24'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Emma Watson',
              requiredRole: 'Frontend',
              dependencies: { blockedBy: ['et25'] }
            }
          ]
        },
        {
          id: 'ef7',
          name: '🔐 Security & Fraud Detection',
          tickets: [
            {
              id: 'et27',
              title: 'Fraud Detection Engine',
              description: 'ML-based fraud detection for transactions',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-05'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Sophia Rodriguez',
              requiredRole: 'Backend'
            },
            {
              id: 'et28',
              title: 'Account Security Features',
              description: '2FA, login alerts, and session management',
              startDate: new Date('2026-04-06'),
              endDate: new Date('2026-04-10'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Oliver Kim',
              requiredRole: 'Backend'
            },
            {
              id: 'et29',
              title: 'PCI Compliance Implementation',
              description: 'Payment card security standards compliance',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-19'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Sophia Rodriguez',
              requiredRole: 'Backend'
            },
            {
              id: 'et30',
              title: 'Security Monitoring Dashboard',
              description: 'Real-time security alerts and monitoring',
              startDate: new Date('2026-04-20'),
              endDate: new Date('2026-04-24'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Natalie Brooks',
              requiredRole: 'Frontend',
              dependencies: { blockedBy: ['et27', 'et29'] }
            }
          ]
        },
        {
          id: 'ef8',
          name: '📱 Mobile App & PWA',
          tickets: [
            {
              id: 'et37',
              title: 'PWA Service Worker',
              description: 'Progressive web app with offline support',
              startDate: new Date('2026-03-23'),
              endDate: new Date('2026-03-29'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Emma Watson',
              requiredRole: 'Frontend'
            },
            {
              id: 'et38',
              title: 'Push Notification Service',
              description: 'Web push notifications for orders',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-05'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Jake Morrison',
              requiredRole: 'Backend',
              dependencies: { blockedBy: ['et37'] }
            },
            {
              id: 'et39',
              title: 'Mobile-Optimized UI',
              description: 'Responsive design for mobile web',
              startDate: new Date('2026-04-06'),
              endDate: new Date('2026-04-12'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Natalie Brooks',
              requiredRole: 'Frontend'
            },
            {
              id: 'et40',
              title: 'Mobile Payment Flow',
              description: 'Apple Pay and Google Pay integration',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-17'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Oliver Kim',
              requiredRole: 'Backend',
              dependencies: { blockedBy: ['et6'] }
            }
          ]
        },
        {
          id: 'ef9',
          name: '🧪 Testing & QA',
          tickets: [
            {
              id: 'et41',
              title: 'E2E Test Automation',
              description: 'Cypress test suite for critical flows',
              startDate: new Date('2026-04-06'),
              endDate: new Date('2026-04-12'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Chris Taylor',
              requiredRole: 'QA',
              dependencies: { blockedBy: ['et8'] }
            },
            {
              id: 'et42',
              title: 'Performance Testing Suite',
              description: 'Load testing with JMeter for checkout flow',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-17'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Chris Taylor',
              requiredRole: 'QA'
            },
            {
              id: 'et43',
              title: 'Payment Gateway Testing',
              description: 'Test all payment scenarios and edge cases',
              startDate: new Date('2026-04-20'),
              endDate: new Date('2026-04-24'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Chris Taylor',
              requiredRole: 'QA',
              dependencies: { blockedBy: ['et6', 'et40'] }
            },
            {
              id: 'et44',
              title: 'Security Penetration Testing',
              description: 'Third-party security audit and fixes',
              startDate: new Date('2026-04-20'),
              endDate: new Date('2026-04-26'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Sophia Rodriguez',
              requiredRole: 'Backend'
            },
            {
              id: 'et45',
              title: 'Browser Compatibility Testing',
              description: 'Cross-browser testing and fixes',
              startDate: new Date('2026-04-27'),
              endDate: new Date('2026-05-01'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Chris Taylor',
              requiredRole: 'QA'
            }
          ]
        }
      ],
      sprints: [
        {
          id: 'es1',
          name: 'Sprint 1: Catalog Foundation',
          startDate: new Date('2026-02-16'),
          endDate: new Date('2026-02-27')
        },
        {
          id: 'es2',
          name: 'Sprint 2: Search & Discovery',
          startDate: new Date('2026-03-02'),
          endDate: new Date('2026-03-13')
        },
        {
          id: 'es3',
          name: 'Sprint 3: Cart & Payments',
          startDate: new Date('2026-03-16'),
          endDate: new Date('2026-03-27')
        },
        {
          id: 'es4',
          name: 'Sprint 4: Inventory',
          startDate: new Date('2026-03-30'),
          endDate: new Date('2026-04-10')
        },
        {
          id: 'es5',
          name: 'Sprint 5: Integration & Polish',
          startDate: new Date('2026-04-13'),
          endDate: new Date('2026-04-24')
        },
        {
          id: 'es6',
          name: 'Sprint 6: Testing & Hardening',
          startDate: new Date('2026-04-27'),
          endDate: new Date('2026-05-08')
        }
      ]
    }
  ]
};

// ===========================================
// PRODUCT 3: 📱 MOBILEFIT TRACKER (MOBILE)
// ===========================================
const product3: Product = {
  id: 'mobilefit-01',
  name: '📱 MobileFit - Fitness Tracker App',
  releases: [
    {
      id: 'rel-mobile-1',
      name: 'v3.0 - Health Integration & Social Features',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-26'),
      storyPointMapping: SP_PRESETS.fibonacci,
      milestones: [
        {
          id: 'ms-mobile-1',
          releaseId: 'rel-mobile-1',
          name: 'iOS App Store Submission',
          type: 'Deployment',
          dateType: 'single',
          startDate: new Date('2026-06-05'),
          description: 'Submit to Apple App Store for review',
          isBlocking: true,
          order: 1
        },
        {
          id: 'ms-mobile-2',
          releaseId: 'rel-mobile-1',
          name: 'Android Play Store Submission',
          type: 'Deployment',
          dateType: 'single',
          startDate: new Date('2026-06-08'),
          description: 'Submit to Google Play Store',
          isBlocking: true,
          order: 2
        },
        {
          id: 'ms-mobile-3',
          releaseId: 'rel-mobile-1',
          name: 'Public Launch',
          type: 'Launch',
          dateType: 'single',
          startDate: new Date('2026-06-26'),
          description: 'Marketing campaign begins',
          isBlocking: false,
          order: 3
        }
      ],
      features: [
        {
          id: 'mf1',
          name: '💪 Workout Tracking',
          tickets: [
            {
              id: 'mt1',
              title: 'iOS Workout Recording',
              description: 'HealthKit integration for workout data',
              startDate: new Date('2026-04-01'),
              endDate: new Date('2026-04-07'),
              status: 'in-progress',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Daniel Park',
              requiredRole: 'iOS'
            },
            {
              id: 'mt2',
              title: 'Android Workout Recording',
              description: 'Google Fit integration for workout data',
              startDate: new Date('2026-04-01'),
              endDate: new Date('2026-04-07'),
              status: 'in-progress',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Nina Patel',
              requiredRole: 'Android'
            },
            {
              id: 'mt3',
              title: 'Backend Workout API',
              description: 'REST API for workout data sync',
              startDate: new Date('2026-04-08'),
              endDate: new Date('2026-04-14'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Thomas Lin',
              requiredRole: 'Backend',
              dependencies: { blockedBy: ['mt1', 'mt2'] }
            },
            {
              id: 'mt4',
              title: '🏖️ PTO CONFLICT: Workout Analytics',
              description: 'Exercise pattern analysis - during PTO (Apr 21-25)',
              startDate: new Date('2026-04-21'),
              endDate: new Date('2026-04-28'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Thomas Lin',
              requiredRole: 'Backend',
              dependencies: { blockedBy: ['mt3'] }
            }
          ]
        },
        {
          id: 'mf2',
          name: '👥 Social Features',
          tickets: [
            {
              id: 'mt5',
              title: 'User Profile & Feed (iOS)',
              description: 'Social profile and activity feed',
              startDate: new Date('2026-04-29'),
              endDate: new Date('2026-05-05'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Daniel Park',
              requiredRole: 'iOS'
            },
            {
              id: 'mt6',
              title: 'User Profile & Feed (Android)',
              description: 'Social profile and activity feed',
              startDate: new Date('2026-04-29'),
              endDate: new Date('2026-05-05'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Nina Patel',
              requiredRole: 'Android'
            },
            {
              id: 'mt7',
              title: 'Social Backend Service',
              description: 'Follow/friend system with notifications',
              startDate: new Date('2026-05-06'),
              endDate: new Date('2026-05-12'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Thomas Lin',
              requiredRole: 'Backend',
              dependencies: { blockedBy: ['mt5', 'mt6'] }
            },
            {
              id: 'mt8',
              title: 'App UI/UX Polish',
              description: 'Design refinements and animations',
              startDate: new Date('2026-05-13'),
              endDate: new Date('2026-05-19'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Isabella Chen',
              requiredRole: 'Designer'
            }
          ]
        },
        {
          id: 'mf3',
          name: '🧪 Testing & QA',
          tickets: [
            {
              id: 'mt9',
              title: 'Automated Testing Suite',
              description: 'E2E tests for iOS and Android',
              startDate: new Date('2026-05-20'),
              endDate: new Date('2026-05-26'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Ryan Adams',
              requiredRole: 'QA',
              dependencies: { blockedBy: ['mt5', 'mt6'] }
            },
            {
              id: 'mt10',
              title: 'Performance Testing',
              description: 'Load testing and optimization',
              startDate: new Date('2026-05-27'),
              endDate: new Date('2026-06-02'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Ryan Adams',
              requiredRole: 'QA'
            }
          ]
        }
      ],
      sprints: [
        {
          id: 'ms1',
          name: 'Sprint 1: Catalog Launch',
          startDate: new Date('2026-02-16'),
          endDate: new Date('2026-02-27')
        },
        {
          id: 'ms2',
          name: 'Sprint 2: Search & Discovery',
          startDate: new Date('2026-03-02'),
          endDate: new Date('2026-03-13')
        },
        {
          id: 'ms3',
          name: 'Sprint 3: Workout Tracking',
          startDate: new Date('2026-04-01'),
          endDate: new Date('2026-04-14')
        },
        {
          id: 'ms4',
          name: 'Sprint 4: Analytics',
          startDate: new Date('2026-04-15'),
          endDate: new Date('2026-04-28')
        },
        {
          id: 'ms5',
          name: 'Sprint 5: Social Features',
          startDate: new Date('2026-04-29'),
          endDate: new Date('2026-05-12')
        },
        {
          id: 'ms6',
          name: 'Sprint 6: Polish & Testing',
          startDate: new Date('2026-05-13'),
          endDate: new Date('2026-05-26')
        },
        {
          id: 'ms7',
          name: 'Sprint 7: Store Prep',
          startDate: new Date('2026-05-27'),
          endDate: new Date('2026-06-09')
        }
      ]
    }
  ]
};

// ===========================================
// PRODUCT 4: 📊 DATAHUB ANALYTICS (COMPREHENSIVE)
// ===========================================
const product4: Product = {
  id: 'datahub-01',
  name: '📊 DataHub - Enterprise Analytics Platform',
  releases: [
    {
      id: 'rel-data-1',
      name: 'v5.0 - Real-time Data Pipelines',
      startDate: new Date('2026-03-16'),
      endDate: new Date('2026-06-12'),
      storyPointMapping: SP_PRESETS.linear,
      milestones: [
        {
          id: 'ms-data-1',
          releaseId: 'rel-data-1',
          name: 'Data Migration Complete',
          type: 'Other',
          dateType: 'single',
          startDate: new Date('2026-04-24'),
          description: 'Legacy data migration finished',
          isBlocking: true,
          order: 1
        },
        {
          id: 'ms-data-2',
          releaseId: 'rel-data-1',
          name: 'Performance Testing',
          type: 'Testing',
          dateType: 'range',
          startDate: new Date('2026-05-18'),
          endDate: new Date('2026-05-22'),
          description: 'Load testing with production data volumes',
          isBlocking: true,
          order: 2
        },
        {
          id: 'ms-data-3',
          releaseId: 'rel-data-1',
          name: 'Stakeholder Demo',
          type: 'Approval',
          dateType: 'single',
          startDate: new Date('2026-05-29'),
          description: 'Executive review and approval',
          isBlocking: true,
          order: 3
        },
        {
          id: 'ms-data-4',
          releaseId: 'rel-data-1',
          name: 'Production Cutover',
          type: 'Deployment',
          dateType: 'single',
          startDate: new Date('2026-06-12'),
          description: 'Production deployment',
          isBlocking: false,
          order: 4
        }
      ],
      features: [
        {
          id: 'df1',
          name: '🔄 Data Pipeline Infrastructure',
          tickets: [
            {
              id: 'dt1',
              title: 'Kafka Cluster Setup',
              description: 'Multi-node Kafka cluster configuration',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-20'),
              status: 'completed',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Raj Malhotra',
              requiredRole: 'DataEngineer'
            },
            {
              id: 'dt2',
              title: 'Stream Processing Engine',
              description: 'Flink/Spark streaming jobs',
              startDate: new Date('2026-03-23'),
              endDate: new Date('2026-03-31'),
              status: 'in-progress',
              storyPoints: 13,
              effortDays: 8,
              assignedTo: 'Raj Malhotra',
              requiredRole: 'DataEngineer',
              dependencies: { blockedBy: ['dt1'] }
            },
            {
              id: 'dt3',
              title: 'Data Lake Storage Layer',
              description: 'S3/Delta Lake integration with partitioning',
              startDate: new Date('2026-04-01'),
              endDate: new Date('2026-04-07'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Yuki Nakamura',
              requiredRole: 'DataEngineer',
              dependencies: { blockedBy: ['dt1'] }
            },
            {
              id: 'dt4',
              title: 'Schema Registry & Governance',
              description: 'Centralized schema management with versioning',
              startDate: new Date('2026-04-08'),
              endDate: new Date('2026-04-14'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Yuki Nakamura',
              requiredRole: 'DataEngineer',
              dependencies: { blockedBy: ['dt3'] }
            }
          ]
        },
        {
          id: 'df2',
          name: '📈 Visualization & Dashboards',
          tickets: [
            {
              id: 'dt5',
              title: 'Dashboard Design System',
              description: 'UI component library for analytics',
              startDate: new Date('2026-04-15'),
              endDate: new Date('2026-04-21'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Maya Singh',
              requiredRole: 'Designer'
            },
            {
              id: 'dt6',
              title: 'Real-time Chart Components',
              description: 'D3.js interactive charts with WebSocket updates',
              startDate: new Date('2026-04-22'),
              endDate: new Date('2026-04-28'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Carlos Mendez',
              requiredRole: 'Frontend',
              dependencies: { blockedBy: ['dt5'] }
            },
            {
              id: 'dt7',
              title: '🏖️ PTO CONFLICT: Dashboard Builder',
              description: 'Drag-drop dashboard creation - during PTO (May 4-8)',
              startDate: new Date('2026-05-04'),
              endDate: new Date('2026-05-12'),
              status: 'planned',
              storyPoints: 13,
              effortDays: 8,
              assignedTo: 'Carlos Mendez',
              requiredRole: 'Frontend',
              dependencies: { blockedBy: ['dt6'] }
            },
            {
              id: 'dt8',
              title: 'Export & Scheduling',
              description: 'PDF/Excel export and scheduled reports',
              startDate: new Date('2026-05-13'),
              endDate: new Date('2026-05-19'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Liam Foster',
              requiredRole: 'Backend',
              dependencies: { blockedBy: ['dt7'] }
            }
          ]
        },
        {
          id: 'df3',
          name: '🔍 Data Quality & Testing',
          tickets: [
            {
              id: 'dt9',
              title: 'Data Quality Framework',
              description: 'Automated data validation and alerts',
              startDate: new Date('2026-05-20'),
              endDate: new Date('2026-05-26'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Raj Malhotra',
              requiredRole: 'DataEngineer'
            },
            {
              id: 'dt10',
              title: 'Integration Testing Suite',
              description: 'End-to-end pipeline testing',
              startDate: new Date('2026-05-27'),
              endDate: new Date('2026-06-02'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 5,
              assignedTo: 'Sophie Martinez',
              requiredRole: 'QA',
              dependencies: { blockedBy: ['dt2', 'dt4', 'dt8'] }
            }
          ]
        }
      ],
      sprints: [
        {
          id: 'ds1',
          name: 'Sprint 1: Infrastructure',
          startDate: new Date('2026-03-16'),
          endDate: new Date('2026-03-27')
        },
        {
          id: 'ds2',
          name: 'Sprint 2: Streaming',
          startDate: new Date('2026-03-30'),
          endDate: new Date('2026-04-10')
        },
        {
          id: 'ds3',
          name: 'Sprint 3: Storage',
          startDate: new Date('2026-04-13'),
          endDate: new Date('2026-04-24')
        },
        {
          id: 'ds4',
          name: 'Sprint 4: Visualization',
          startDate: new Date('2026-04-27'),
          endDate: new Date('2026-05-08')
        },
        {
          id: 'ds5',
          name: 'Sprint 5: Dashboard Builder',
          startDate: new Date('2026-05-11'),
          endDate: new Date('2026-05-22')
        },
        {
          id: 'ds6',
          name: 'Sprint 6: Testing & Launch',
          startDate: new Date('2026-05-25'),
          endDate: new Date('2026-06-05')
        }
      ]
    }
  ]
};

export const mockTeamMembers: TeamMember[] = [
  // ===========================================
  // PRODUCT 1: PERFECT PIPELINE TEAM
  // ===========================================
  {
    id: 'tm-perfect-1',
    name: 'Jennifer Wu',
    role: 'Backend',
    experienceLevel: 'Senior',
    productId: 'perfect-pipeline-01',
    velocityMultiplier: 1.2,
    notes: 'Backend lead, database expert',
    pto: [
      // PTO scheduled AFTER dev window to avoid conflicts
      { id: 'pto-p1', name: 'Vacation', startDate: new Date('2026-05-18'), endDate: new Date('2026-05-22') }
    ]
  },
  {
    id: 'tm-perfect-2',
    name: 'Lucas Brown',
    role: 'Frontend',
    experienceLevel: 'Senior',
    productId: 'perfect-pipeline-01',
    velocityMultiplier: 1.2,
    notes: 'Frontend specialist, React expert',
    pto: [
      // PTO scheduled AFTER dev window to avoid conflicts
      { id: 'pto-p2', name: 'Conference', startDate: new Date('2026-05-25'), endDate: new Date('2026-05-27') }
    ]
  },
  {
    id: 'tm-perfect-3',
    name: 'Marcus Johnson',
    role: 'Backend',
    experienceLevel: 'Mid',
    productId: 'perfect-pipeline-01',
    velocityMultiplier: 1.0,
    notes: 'Integration specialist',
    pto: []
  },

  // ===========================================
  // PRODUCT 2: E-COMMERCE TEAM
  // ===========================================
  {
    id: 'tm-ecom-1',
    name: 'Sophia Rodriguez',
    role: 'Backend',
    experienceLevel: 'Lead',
    productId: 'ecommerce-01',
    velocityMultiplier: 1.3,
    notes: 'Backend architect, microservices expert',
    pto: [
      { id: 'pto-e1', name: 'Spring Break', startDate: new Date('2026-03-10'), endDate: new Date('2026-03-14') },
      { id: 'pto-e2', name: 'Wedding', startDate: new Date('2026-04-27'), endDate: new Date('2026-05-01') }
    ]
  },
  {
    id: 'tm-ecom-2',
    name: 'Oliver Kim',
    role: 'Backend',
    experienceLevel: 'Senior',
    productId: 'ecommerce-01',
    velocityMultiplier: 1.2,
    notes: 'Payment systems specialist',
    pto: [
      { id: 'pto-e3', name: 'Family Trip', startDate: new Date('2026-04-07'), endDate: new Date('2026-04-11') }
    ]
  },
  {
    id: 'tm-ecom-3',
    name: 'Emma Watson',
    role: 'Frontend',
    experienceLevel: 'Senior',
    productId: 'ecommerce-01',
    velocityMultiplier: 1.2,
    notes: 'E-commerce UI expert',
    pto: [
      { id: 'pto-e4', name: 'Medical', startDate: new Date('2026-03-30'), endDate: new Date('2026-04-03') }
    ]
  },
  {
    id: 'tm-ecom-4',
    name: 'Jake Morrison',
    role: 'Backend',
    experienceLevel: 'Mid',
    productId: 'ecommerce-01',
    velocityMultiplier: 1.0,
    notes: 'Backend developer, API specialist',
    pto: [
      { id: 'pto-e5', name: 'Vacation', startDate: new Date('2026-02-23'), endDate: new Date('2026-02-27') }
    ]
  },
  {
    id: 'tm-ecom-5',
    name: 'Natalie Brooks',
    role: 'Frontend',
    experienceLevel: 'Mid',
    productId: 'ecommerce-01',
    velocityMultiplier: 1.0,
    notes: 'UI developer, responsive design',
    pto: []
  },
  {
    id: 'tm-ecom-6',
    name: 'Chris Taylor',
    role: 'QA',
    experienceLevel: 'Senior',
    productId: 'ecommerce-01',
    velocityMultiplier: 1.2,
    notes: 'Test automation specialist',
    pto: [
      { id: 'pto-e6', name: 'Personal', startDate: new Date('2026-04-13'), endDate: new Date('2026-04-17') }
    ]
  },

  // ===========================================
  // PRODUCT 3: MOBILEFIT TEAM
  // ===========================================
  {
    id: 'tm-mobile-1',
    name: 'Daniel Park',
    role: 'iOS',
    experienceLevel: 'Lead',
    productId: 'mobilefit-01',
    velocityMultiplier: 1.4,
    notes: 'iOS architect, Swift/SwiftUI expert',
    pto: [
      { id: 'pto-m1', name: 'Conference', startDate: new Date('2026-05-11'), endDate: new Date('2026-05-15') }
    ]
  },
  {
    id: 'tm-mobile-2',
    name: 'Nina Patel',
    role: 'Android',
    experienceLevel: 'Senior',
    productId: 'mobilefit-01',
    velocityMultiplier: 1.3,
    notes: 'Android lead, Kotlin/Jetpack Compose',
    pto: [
      { id: 'pto-m2', name: 'Personal', startDate: new Date('2026-06-08'), endDate: new Date('2026-06-12') }
    ]
  },
  {
    id: 'tm-mobile-3',
    name: 'Thomas Lin',
    role: 'Backend',
    experienceLevel: 'Senior',
    productId: 'mobilefit-01',
    velocityMultiplier: 1.2,
    notes: 'Mobile backend, Node.js specialist',
    pto: [
      { id: 'pto-m3', name: 'Vacation', startDate: new Date('2026-04-21'), endDate: new Date('2026-04-25') }
    ]
  },
  {
    id: 'tm-mobile-4',
    name: 'Isabella Chen',
    role: 'Designer',
    experienceLevel: 'Senior',
    productId: 'mobilefit-01',
    velocityMultiplier: 1.1,
    notes: 'Mobile UX/UI designer',
    pto: []
  },
  {
    id: 'tm-mobile-5',
    name: 'Ryan Adams',
    role: 'QA',
    experienceLevel: 'Mid',
    productId: 'mobilefit-01',
    velocityMultiplier: 1.0,
    notes: 'Mobile testing specialist',
    pto: []
  },

  // ===========================================
  // PRODUCT 4: DATAHUB TEAM
  // ===========================================
  {
    id: 'tm-data-1',
    name: 'Raj Malhotra',
    role: 'DataEngineer',
    experienceLevel: 'Lead',
    productId: 'datahub-01',
    velocityMultiplier: 1.4,
    notes: 'Data platform architect, Spark expert',
    pto: [
      { id: 'pto-d1', name: 'Conference', startDate: new Date('2026-04-13'), endDate: new Date('2026-04-17') }
    ]
  },
  {
    id: 'tm-data-2',
    name: 'Yuki Nakamura',
    role: 'DataEngineer',
    experienceLevel: 'Senior',
    productId: 'datahub-01',
    velocityMultiplier: 1.3,
    notes: 'ETL pipeline specialist',
    pto: []
  },
  {
    id: 'tm-data-3',
    name: 'Carlos Mendez',
    role: 'Frontend',
    experienceLevel: 'Senior',
    productId: 'datahub-01',
    velocityMultiplier: 1.2,
    notes: 'Data visualization expert, D3.js',
    pto: [
      { id: 'pto-d2', name: 'Family Vacation', startDate: new Date('2026-05-04'), endDate: new Date('2026-05-08') }
    ]
  },
  {
    id: 'tm-data-4',
    name: 'Liam Foster',
    role: 'Backend',
    experienceLevel: 'Mid',
    productId: 'datahub-01',
    velocityMultiplier: 1.0,
    notes: 'API development',
    pto: []
  },
  {
    id: 'tm-data-5',
    name: 'Maya Singh',
    role: 'Designer',
    experienceLevel: 'Senior',
    productId: 'datahub-01',
    velocityMultiplier: 1.1,
    notes: 'Data dashboard UX specialist',
    pto: []
  },
  {
    id: 'tm-data-6',
    name: 'Sophie Martinez',
    role: 'QA',
    experienceLevel: 'Senior',
    productId: 'datahub-01',
    velocityMultiplier: 1.2,
    notes: 'Data quality & testing lead',
    pto: [
      { id: 'pto-d3', name: 'Moving', startDate: new Date('2026-05-18'), endDate: new Date('2026-05-22') }
    ]
  }
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
    name: 'Good Friday',
    startDate: new Date('2026-04-03'),
    endDate: new Date('2026-04-03')
  },
  {
    id: 'hol-5',
    name: 'Memorial Day',
    startDate: new Date('2026-05-25'),
    endDate: new Date('2026-05-25')
  },
  {
    id: 'hol-6',
    name: 'Independence Day',
    startDate: new Date('2026-07-04'),
    endDate: new Date('2026-07-04')
  },
  {
    id: 'hol-7',
    name: 'Company Offsite',
    startDate: new Date('2026-03-19'),
    endDate: new Date('2026-03-20')
  }
];



// ===========================================
// EXPORTS AND HELPER FUNCTIONS
// ===========================================
export const mockProducts: Product[] = [product1, product2, product3, product4];

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
