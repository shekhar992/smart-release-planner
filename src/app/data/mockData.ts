export interface Ticket {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: 'in-progress' | 'planned' | 'completed';
  storyPoints: number;
  effortDays?: number; // New primary estimation field
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
  /** Ordered list of SP → days pairs (ascending by sp) */
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

/**
 * Convert a story-point value to days using the mapping.
 * For SP values not in the table, interpolates linearly between nearest entries.
 * Falls back to 1:1 when no mapping provided.
 */
export function storyPointsToDays(sp: number, mapping?: StoryPointMapping): number {
  if (!mapping || mapping.entries.length === 0) return sp; // 1:1 fallback
  const entries = mapping.entries;
  // Exact match
  const exact = entries.find(e => e.sp === sp);
  if (exact) return exact.days;
  // Below minimum → proportional
  if (sp <= entries[0].sp) return (sp / entries[0].sp) * entries[0].days;
  // Above maximum → proportional from last entry
  const last = entries[entries.length - 1];
  if (sp >= last.sp) return (sp / last.sp) * last.days;
  // Between two entries → linear interpolation
  for (let i = 0; i < entries.length - 1; i++) {
    if (sp > entries[i].sp && sp < entries[i + 1].sp) {
      const ratio = (sp - entries[i].sp) / (entries[i + 1].sp - entries[i].sp);
      return entries[i].days + ratio * (entries[i + 1].days - entries[i].days);
    }
  }
  return sp; // ultimate fallback
}

export interface Release {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  features: Feature[];
  sprints?: Sprint[];
  storyPointMapping?: StoryPointMapping;
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
  velocityMultiplier?: number; // Optional: defaults to 1. Adjusts capacity calculations (e.g., 0.5 = half speed, 2.0 = double speed)
}

export interface Holiday {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

// ===========================================
// PRODUCT 1: FinTech Payment Gateway
// ===========================================
const product1: Product = {
  id: 'p1',
  name: 'FinTech Payment Gateway',
  releases: [
    {
      id: 'r1',
      name: 'R1 2026 - Core Payment Infrastructure',
      startDate: new Date('2026-02-17'),
      endDate: new Date('2026-04-24'),
      storyPointMapping: SP_PRESETS.fibonacci,
      features: [
        {
          id: 'f1',
          name: 'Payment API & Authentication',
          tickets: [
            {
              id: 't1',
              title: 'Design payment API architecture',
              description: 'Priority: High | Design RESTful payment API with proper versioning and error handling patterns.',
              startDate: new Date('2026-02-17'),
              endDate: new Date('2026-02-21'),
              status: 'completed',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Arjun Mehta'
            },
            {
              id: 't2',
              title: 'Implement OAuth 2.0 authentication',
              description: 'Priority: High | Implement secure OAuth 2.0 flow for API access with JWT tokens.',
              startDate: new Date('2026-02-17'),
              endDate: new Date('2026-02-24'),
              status: 'in-progress',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Priya Sharma'
            },
            {
              id: 't3',
              title: 'API rate limiting and throttling',
              description: 'Priority: Medium | Implement rate limiting per merchant with Redis-based throttling.',
              startDate: new Date('2026-02-24'),
              endDate: new Date('2026-02-27'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 3,
              assignedTo: 'Vikram Singh'
            },
            {
              id: 't4',
              title: 'API key management system',
              description: 'Priority: High | Build API key generation, rotation, and revocation system.',
              startDate: new Date('2026-02-27'),
              endDate: new Date('2026-03-05'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Priya Sharma'
            },
            {
              id: 't5',
              title: 'Webhook signature verification',
              description: 'Priority: Medium | Implement HMAC-based webhook signature verification for security.',
              startDate: new Date('2026-03-05'),
              endDate: new Date('2026-03-09'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 3,
              assignedTo: 'Vikram Singh'
            }
          ]
        },
        {
          id: 'f2',
          name: 'Transaction Processing Engine',
          tickets: [
            {
              id: 't6',
              title: 'Design transaction state machine',
              description: 'Priority: High | Design robust state machine for payment lifecycle (pending, processing, completed, failed).',
              startDate: new Date('2026-02-24'),
              endDate: new Date('2026-03-02'),
              status: 'in-progress',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Arjun Mehta'
            },
            {
              id: 't7',
              title: 'Implement payment initiation flow',
              description: 'Priority: High | Build payment initiation with validation and preliminary fraud checks.',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-09'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Neha Patel'
            },
            {
              id: 't8',
              title: 'Payment processing worker service',
              description: 'Priority: High | Build async worker service for processing payments using message queue.',
              startDate: new Date('2026-03-09'),
              endDate: new Date('2026-03-16'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Vikram Singh'
            },
            {
              id: 't9',
              title: 'Transaction reconciliation service',
              description: 'Priority: Medium | Build automated reconciliation between internal ledger and payment gateway.',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-23'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Arjun Mehta'
            },
            {
              id: 't10',
              title: 'Refund and reversal logic',
              description: 'Priority: Medium | Implement refund processing with partial and full refund support.',
              startDate: new Date('2026-03-23'),
              endDate: new Date('2026-03-27'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Neha Patel'
            }
          ]
        },
        {
          id: 'f3',
          name: 'Security & Compliance',
          tickets: [
            {
              id: 't11',
              title: 'PCI DSS compliance audit preparation',
              description: 'Priority: High | Prepare infrastructure and code for PCI DSS Level 1 compliance audit.',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-09'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Rajesh Kumar'
            },
            {
              id: 't12',
              title: 'Card data encryption at rest',
              description: 'Priority: High | Implement AES-256 encryption for sensitive card data storage.',
              startDate: new Date('2026-03-09'),
              endDate: new Date('2026-03-13'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Priya Sharma'
            },
            {
              id: 't13',
              title: 'TLS 1.3 implementation',
              description: 'Priority: High | Upgrade all API endpoints to TLS 1.3 with proper cipher suites.',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-19'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 3,
              assignedTo: 'Vikram Singh'
            },
            {
              id: 't14',
              title: 'Audit logging system',
              description: 'Priority: Medium | Implement comprehensive audit logging for all financial transactions.',
              startDate: new Date('2026-03-23'),
              endDate: new Date('2026-03-30'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Rajesh Kumar'
            },
            {
              id: 't15',
              title: 'Data retention policy implementation',
              description: 'Priority: Medium | Implement automated data retention and purging based on regulatory requirements.',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-03'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Rajesh Kumar'
            }
          ]
        },
        {
          id: 'f4',
          name: 'Merchant Dashboard',
          tickets: [
            {
              id: 't16',
              title: 'Dashboard UI framework setup',
              description: 'Priority: Medium | Setup React dashboard with authentication and routing.',
              startDate: new Date('2026-03-09'),
              endDate: new Date('2026-03-13'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Ananya Reddy'
            },
            {
              id: 't17',
              title: 'Transaction listing and search',
              description: 'Priority: High | Build transaction listing with filters, search, and pagination.',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-23'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Ananya Reddy'
            },
            {
              id: 't18',
              title: 'Real-time transaction status updates',
              description: 'Priority: Medium | Implement WebSocket-based real-time status updates for transactions.',
              startDate: new Date('2026-03-23'),
              endDate: new Date('2026-03-27'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Kabir Joshi'
            },
            {
              id: 't19',
              title: 'Merchant settings management',
              description: 'Priority: Medium | Build UI for merchant profile, API keys, and webhook configuration.',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-06'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Ananya Reddy'
            },
            {
              id: 't20',
              title: 'Basic analytics dashboard',
              description: 'Priority: Low | Build basic analytics with transaction volume and success rate charts.',
              startDate: new Date('2026-04-07'),
              endDate: new Date('2026-04-13'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Kabir Joshi'
            }
          ]
        },
        {
          id: 'f5',
          name: 'Testing & Documentation',
          tickets: [
            {
              id: 't21',
              title: 'Integration test suite setup',
              description: 'Priority: High | Setup integration testing framework with test data management.',
              startDate: new Date('2026-03-23'),
              endDate: new Date('2026-03-27'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Lakshmi Iyer'
            },
            {
              id: 't22',
              title: 'API endpoint testing',
              description: 'Priority: High | Write comprehensive tests for all payment API endpoints.',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-06'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Lakshmi Iyer'
            },
            {
              id: 't23',
              title: 'API documentation with OpenAPI',
              description: 'Priority: Medium | Create comprehensive API documentation using OpenAPI 3.0 spec.',
              startDate: new Date('2026-04-07'),
              endDate: new Date('2026-04-13'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Arjun Mehta'
            },
            {
              id: 't24',
              title: 'Sandbox environment testing',
              description: 'Priority: Medium | Setup and test sandbox environment for merchant integration testing.',
              startDate: new Date('2026-04-14'),
              endDate: new Date('2026-04-20'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Lakshmi Iyer'
            }
          ]
        }
      ],
      sprints: [
        {
          id: 's1',
          name: 'Sprint 1 - Foundation',
          startDate: new Date('2026-02-17'),
          endDate: new Date('2026-02-28')
        },
        {
          id: 's2',
          name: 'Sprint 2 - Core APIs',
          startDate: new Date('2026-03-02'),
          endDate: new Date('2026-03-13')
        },
        {
          id: 's3',
          name: 'Sprint 3 - Transaction Engine',
          startDate: new Date('2026-03-16'),
          endDate: new Date('2026-03-27')
        },
        {
          id: 's4',
          name: 'Sprint 4 - Dashboard & Security',
          startDate: new Date('2026-03-30'),
          endDate: new Date('2026-04-10')
        },
        {
          id: 's5',
          name: 'Sprint 5 - Testing & Polish',
          startDate: new Date('2026-04-13'),
          endDate: new Date('2026-04-24')
        }
      ]
    },
    {
      id: 'r2',
      name: 'R2 2026 - Advanced Features & Scale',
      startDate: new Date('2026-04-27'),
      endDate: new Date('2026-06-26'),
      storyPointMapping: SP_PRESETS.fibonacci,
      features: [
        {
          id: 'f6',
          name: 'Multi-Currency Support',
          tickets: [
            {
              id: 't25',
              title: 'Currency conversion engine',
              description: 'Priority: High | Implement real-time currency conversion with multiple FX providers.',
              startDate: new Date('2026-04-27'),
              endDate: new Date('2026-05-04'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Neha Patel'
            },
            {
              id: 't26',
              title: 'Multi-currency transaction support',
              description: 'Priority: High | Extend payment processing to handle multiple currencies.',
              startDate: new Date('2026-05-04'),
              endDate: new Date('2026-05-11'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Arjun Mehta'
            },
            {
              id: 't27',
              title: 'Currency settlement workflow',
              description: 'Priority: Medium | Implement settlement workflow for multi-currency transactions.',
              startDate: new Date('2026-05-11'),
              endDate: new Date('2026-05-18'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Neha Patel'
            },
            {
              id: 't28',
              title: 'FX rate caching and optimization',
              description: 'Priority: Low | Implement intelligent FX rate caching to reduce API calls.',
              startDate: new Date('2026-05-18'),
              endDate: new Date('2026-05-22'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Vikram Singh'
            }
          ]
        },
        {
          id: 'f7',
          name: 'Fraud Detection System',
          tickets: [
            {
              id: 't29',
              title: 'Fraud detection rule engine',
              description: 'Priority: High | Build configurable rule engine for fraud detection with scoring system.',
              startDate: new Date('2026-04-27'),
              endDate: new Date('2026-05-04'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Rajesh Kumar'
            },
            {
              id: 't30',
              title: 'Velocity checks implementation',
              description: 'Priority: High | Implement velocity checks for cards, IPs, and merchant patterns.',
              startDate: new Date('2026-05-04'),
              endDate: new Date('2026-05-08'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Priya Sharma'
            },
            {
              id: 't31',
              title: 'Machine learning fraud model integration',
              description: 'Priority: Medium | Integrate ML-based fraud detection model with fallback rules.',
              startDate: new Date('2026-05-11'),
              endDate: new Date('2026-05-18'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Rajesh Kumar'
            },
            {
              id: 't32',
              title: 'Fraud review dashboard',
              description: 'Priority: Medium | Build dashboard for fraud team to review flagged transactions.',
              startDate: new Date('2026-05-18'),
              endDate: new Date('2026-05-25'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Ananya Reddy'
            },
            {
              id: 't33',
              title: 'Automated fraud alerts',
              description: 'Priority: Low | Implement real-time alerts for high-risk transactions.',
              startDate: new Date('2026-05-26'),
              endDate: new Date('2026-05-29'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 3,
              assignedTo: 'Vikram Singh'
            }
          ]
        },
        {
          id: 'f8',
          name: 'Advanced Analytics & Reporting',
          tickets: [
            {
              id: 't34',
              title: 'Data warehouse ETL pipeline',
              description: 'Priority: High | Build ETL pipeline to extract transaction data into analytics warehouse.',
              startDate: new Date('2026-05-04'),
              endDate: new Date('2026-05-11'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Arjun Mehta'
            },
            {
              id: 't35',
              title: 'Advanced analytics dashboard',
              description: 'Priority: Medium | Build comprehensive analytics with revenue, trends, and cohort analysis.',
              startDate: new Date('2026-05-11'),
              endDate: new Date('2026-05-18'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Kabir Joshi'
            },
            {
              id: 't36',
              title: 'Custom report builder',
              description: 'Priority: Low | Allow merchants to create custom reports with flexible filters.',
              startDate: new Date('2026-05-18'),
              endDate: new Date('2026-05-25'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Kabir Joshi'
            },
            {
              id: 't37',
              title: 'Scheduled report generation',
              description: 'Priority: Low | Implement scheduled reports with email delivery.',
              startDate: new Date('2026-05-26'),
              endDate: new Date('2026-06-01'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Neha Patel'
            },
            {
              id: 't38',
              title: 'Export functionality (CSV, Excel, PDF)',
              description: 'Priority: Medium | Add export functionality for all reports in multiple formats.',
              startDate: new Date('2026-06-01'),
              endDate: new Date('2026-06-05'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Ananya Reddy'
            }
          ]
        },
        {
          id: 'f9',
          name: 'Webhooks & Integration',
          tickets: [
            {
              id: 't39',
              title: 'Webhook delivery system',
              description: 'Priority: High | Build reliable webhook delivery with retry logic and dead letter queue.',
              startDate: new Date('2026-05-11'),
              endDate: new Date('2026-05-18'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Vikram Singh'
            },
            {
              id: 't40',
              title: 'Webhook testing tools',
              description: 'Priority: Medium | Build webhook testing UI with payload preview and retry controls.',
              startDate: new Date('2026-05-18'),
              endDate: new Date('2026-05-22'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Ananya Reddy'
            },
            {
              id: 't41',
              title: 'SDK development (Node.js)',
              description: 'Priority: Medium | Develop official Node.js SDK for payment API integration.',
              startDate: new Date('2026-05-26'),
              endDate: new Date('2026-06-01'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Arjun Mehta'
            },
            {
              id: 't42',
              title: 'SDK development (Python)',
              description: 'Priority: Low | Develop official Python SDK for payment API integration.',
              startDate: new Date('2026-06-01'),
              endDate: new Date('2026-06-08'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Priya Sharma'
            },
            {
              id: 't43',
              title: 'Integration examples and tutorials',
              description: 'Priority: Medium | Create comprehensive integration guides with code examples.',
              startDate: new Date('2026-06-08'),
              endDate: new Date('2026-06-12'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Kabir Joshi'
            }
          ]
        },
        {
          id: 'f10',
          name: 'Performance & Scalability',
          tickets: [
            {
              id: 't44',
              title: 'Load testing and optimization',
              description: 'Priority: High | Conduct load testing and optimize for 10k TPS throughput.',
              startDate: new Date('2026-05-26'),
              endDate: new Date('2026-06-01'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Lakshmi Iyer'
            },
            {
              id: 't45',
              title: 'Database query optimization',
              description: 'Priority: High | Optimize slow queries and add proper indexes for scale.',
              startDate: new Date('2026-06-01'),
              endDate: new Date('2026-06-05'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Rajesh Kumar'
            },
            {
              id: 't46',
              title: 'Caching layer implementation',
              description: 'Priority: Medium | Implement Redis caching for frequently accessed data.',
              startDate: new Date('2026-06-05'),
              endDate: new Date('2026-06-12'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Vikram Singh'
            },
            {
              id: 't47',
              title: 'Auto-scaling configuration',
              description: 'Priority: Medium | Configure auto-scaling for payment processing services.',
              startDate: new Date('2026-06-12'),
              endDate: new Date('2026-06-15'),
              status: 'planned',
              storyPoints: 3,
              effortDays: 3,
              assignedTo: 'Rajesh Kumar'
            },
            {
              id: 't48',
              title: 'Monitoring and alerting setup',
              description: 'Priority: High | Setup comprehensive monitoring with SLA-based alerts.',
              startDate: new Date('2026-06-15'),
              endDate: new Date('2026-06-19'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Lakshmi Iyer'
            },
            {
              id: 't49',
              title: 'Disaster recovery testing',
              description: 'Priority: High | Test and document disaster recovery procedures.',
              startDate: new Date('2026-06-19'),
              endDate: new Date('2026-06-26'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Lakshmi Iyer'
            }
          ]
        }
      ],
      sprints: [
        {
          id: 's6',
          name: 'Sprint 6 - Multi-currency & Fraud',
          startDate: new Date('2026-04-27'),
          endDate: new Date('2026-05-08')
        },
        {
          id: 's7',
          name: 'Sprint 7 - Analytics & Integration',
          startDate: new Date('2026-05-11'),
          endDate: new Date('2026-05-22')
        },
        {
          id: 's8',
          name: 'Sprint 8 - SDKs & Webhooks',
          startDate: new Date('2026-05-26'),
          endDate: new Date('2026-06-05')
        },
        {
          id: 's9',
          name: 'Sprint 9 - Performance & Scale',
          startDate: new Date('2026-06-08'),
          endDate: new Date('2026-06-19')
        },
        {
          id: 's10',
          name: 'Sprint 10 - Launch Prep',
          startDate: new Date('2026-06-22'),
          endDate: new Date('2026-06-26')
        }
      ]
    }
  ]
};

// ===========================================
// PRODUCT 2: Life Sciences Clinical Trial Management
// ===========================================
const product2: Product = {
  id: 'p2',
  name: 'Clinical Trial Management Platform',
  releases: [
    {
      id: 'r3',
      name: 'R1 2026 - Patient & Site Management',
      startDate: new Date('2026-03-02'),
      endDate: new Date('2026-05-15'),
      storyPointMapping: SP_PRESETS.fibonacci,
      features: [
        {
          id: 'f11',
          name: 'Product Vision & Governance',
          tickets: [
            {
              id: 't50',
              title: 'Define product vision & outcomes',
              description: 'Priority: High | Establish clear product vision, success metrics, and business outcomes for clinical trial platform.',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-09'),
              status: 'completed',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Emma Rodriguez'
            },
            {
              id: 't51',
              title: 'Prioritize clinical use cases',
              description: 'Priority: High | Identify and prioritize top clinical trial management use cases with stakeholders.',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-09'),
              status: 'completed',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Aisha Osman'
            },
            {
              id: 't52',
              title: 'Establish governance framework',
              description: 'Priority: High | Define decision rights, approval workflows, and governance structure.',
              startDate: new Date('2026-03-09'),
              endDate: new Date('2026-03-13'),
              status: 'in-progress',
              storyPoints: 3,
              effortDays: 3,
              assignedTo: 'Emma Rodriguez'
            },
            {
              id: 't53',
              title: 'Define personas & patient journeys',
              description: 'Priority: Medium | Map end-to-end patient, site coordinator, and investigator journeys.',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-23'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Zara Khanna'
            }
          ]
        },
        {
          id: 'f12',
          name: 'Platform & Security Infrastructure',
          tickets: [
            {
              id: 't54',
              title: 'Provision HIPAA-compliant cloud infrastructure',
              description: 'Priority: High | Setup AWS infrastructure with HIPAA BAA and proper network isolation.',
              startDate: new Date('2026-03-09'),
              endDate: new Date('2026-03-16'),
              status: 'in-progress',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Raj Kapoor'
            },
            {
              id: 't55',
              title: 'Configure secrets and key management',
              description: 'Priority: Medium | Setup AWS KMS for encryption keys and secrets management.',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-23'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Raj Kapoor'
            },
            {
              id: 't56',
              title: 'Implement SAML-based authentication',
              description: 'Priority: High | Build SAML 2.0 authentication for hospital SSO integration.',
              startDate: new Date('2026-03-23'),
              endDate: new Date('2026-03-27'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Chen Wei'
            },
            {
              id: 't57',
              title: 'Enable comprehensive audit logging',
              description: 'Priority: High | Implement audit logging for all PHI access per HIPAA requirements.',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-06'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Marcus Johnson'
            },
            {
              id: 't58',
              title: 'Apply content filtering policies',
              description: 'Priority: Medium | Implement content validation and sanitization for data entry.',
              startDate: new Date('2026-04-07'),
              endDate: new Date('2026-04-13'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Chen Wei'
            },
            {
              id: 't59',
              title: 'PII detection and redaction',
              description: 'Priority: Medium | Implement automated PII detection and redaction for exports.',
              startDate: new Date('2026-04-14'),
              endDate: new Date('2026-04-20'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Marcus Johnson'
            }
          ]
        },
        {
          id: 'f13',
          name: 'Patient Enrollment System',
          tickets: [
            {
              id: 't60',
              title: 'Patient registration workflow',
              description: 'Priority: High | Build patient registration with eligibility criteria validation.',
              startDate: new Date('2026-03-23'),
              endDate: new Date('2026-03-30'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Sofia Kowalski'
            },
            {
              id: 't61',
              title: 'Consent management system',
              description: 'Priority: High | Implement digital consent capture with version control and audit trail.',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-06'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Liam O\'Brien'
            },
            {
              id: 't62',
              title: 'Patient screening questionnaire',
              description: 'Priority: Medium | Build configurable screening questionnaire with branching logic.',
              startDate: new Date('2026-04-07'),
              endDate: new Date('2026-04-13'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Yuki Tanaka'
            },
            {
              id: 't63',
              title: 'Patient randomization engine',
              description: 'Priority: High | Implement stratified randomization for treatment arm assignment.',
              startDate: new Date('2026-04-14'),
              endDate: new Date('2026-04-20'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Aisha Osman'
            },
            {
              id: 't64',
              title: 'Patient dashboard and portal',
              description: 'Priority: Medium | Build patient-facing portal for appointments and data review.',
              startDate: new Date('2026-04-21'),
              endDate: new Date('2026-04-27'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Sofia Kowalski'
            }
          ]
        },
        {
          id: 'f14',
          name: 'Site Management',
          tickets: [
            {
              id: 't65',
              title: 'Site registration and onboarding',
              description: 'Priority: High | Build site registration with investigator credentials verification.',
              startDate: new Date('2026-04-07'),
              endDate: new Date('2026-04-13'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Priya Singh'
            },
            {
              id: 't66',
              title: 'Site coordinator dashboard',
              description: 'Priority: High | Build coordinator dashboard for patient management and visit tracking.',
              startDate: new Date('2026-04-14'),
              endDate: new Date('2026-04-20'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Liam O\'Brien'
            },
            {
              id: 't67',
              title: 'Visit scheduling system',
              description: 'Priority: Medium | Implement visit scheduling with automated reminders.',
              startDate: new Date('2026-04-21'),
              endDate: new Date('2026-04-27'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Yuki Tanaka'
            },
            {
              id: 't68',
              title: 'Site performance metrics',
              description: 'Priority: Low | Build metrics dashboard for enrollment rate and protocol adherence.',
              startDate: new Date('2026-04-28'),
              endDate: new Date('2026-05-04'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Priya Singh'
            }
          ]
        },
        {
          id: 'f15',
          name: 'Protocol Compliance',
          tickets: [
            {
              id: 't69',
              title: 'Protocol deviation tracking',
              description: 'Priority: High | Implement system to log and track protocol deviations.',
              startDate: new Date('2026-04-21'),
              endDate: new Date('2026-04-27'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Marcus Johnson'
            },
            {
              id: 't70',
              title: 'Adverse event reporting',
              description: 'Priority: High | Build adverse event capture with severity classification and reporting.',
              startDate: new Date('2026-04-28'),
              endDate: new Date('2026-05-04'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Aisha Osman'
            },
            {
              id: 't71',
              title: 'Visit window compliance checks',
              description: 'Priority: Medium | Implement automated checks for visit window compliance.',
              startDate: new Date('2026-05-05'),
              endDate: new Date('2026-05-11'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Chen Wei'
            },
            {
              id: 't72',
              title: 'SAE reporting workflow',
              description: 'Priority: High | Build serious adverse event (SAE) expedited reporting workflow.',
              startDate: new Date('2026-05-11'),
              endDate: new Date('2026-05-15'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Aisha Osman'
            }
          ]
        }
      ],
      sprints: [
        {
          id: 's11',
          name: 'Sprint 1 - Foundation',
          startDate: new Date('2026-03-02'),
          endDate: new Date('2026-03-13')
        },
        {
          id: 's12',
          name: 'Sprint 2 - Platform Setup',
          startDate: new Date('2026-03-16'),
          endDate: new Date('2026-03-27')
        },
        {
          id: 's13',
          name: 'Sprint 3 - Patient & Auth',
          startDate: new Date('2026-03-30'),
          endDate: new Date('2026-04-10')
        },
        {
          id: 's14',
          name: 'Sprint 4 - Enrollment & Sites',
          startDate: new Date('2026-04-13'),
          endDate: new Date('2026-04-24')
        },
        {
          id: 's15',
          name: 'Sprint 5 - Compliance',
          startDate: new Date('2026-04-27'),
          endDate: new Date('2026-05-08')
        },
        {
          id: 's16',
          name: 'Sprint 6 - Polish & Testing',
          startDate: new Date('2026-05-11'),
          endDate: new Date('2026-05-15')
        }
      ]
    },
    {
      id: 'r4',
      name: 'R2 2026 - Analytics & Regulatory Reporting',
      startDate: new Date('2026-05-18'),
      endDate: new Date('2026-07-24'),
      storyPointMapping: SP_PRESETS.fibonacci,
      features: [
        {
          id: 'f16',
          name: 'Data Collection & EDC',
          tickets: [
            {
              id: 't73',
              title: 'Electronic data capture forms',
              description: 'Priority: High | Build configurable EDC forms with validation rules.',
              startDate: new Date('2026-05-18'),
              endDate: new Date('2026-05-25'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Yuki Tanaka'
            },
            {
              id: 't74',
              title: 'Data validation engine',
              description: 'Priority: High | Implement real-time data validation with query generation.',
              startDate: new Date('2026-05-25'),
              endDate: new Date('2026-06-01'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Chen Wei'
            },
            {
              id: 't75',
              title: 'Medical coding integration (MedDRA)',
              description: 'Priority: Medium | Integrate MedDRA coding for adverse events.',
              startDate: new Date('2026-06-01'),
              endDate: new Date('2026-06-08'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Aisha Osman'
            },
            {
              id: 't76',
              title: 'Source document verification',
              description: 'Priority: Medium | Build workflow for source data verification (SDV).',
              startDate: new Date('2026-06-08'),
              endDate: new Date('2026-06-15'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Marcus Johnson'
            },
            {
              id: 't77',
              title: 'Query management system',
              description: 'Priority: High | Implement data query workflow with resolution tracking.',
              startDate: new Date('2026-06-15'),
              endDate: new Date('2026-06-19'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Priya Singh'
            }
          ]
        },
        {
          id: 'f17',
          name: 'Clinical Data Analytics',
          tickets: [
            {
              id: 't78',
              title: 'Real-time enrollment analytics',
              description: 'Priority: High | Build real-time enrollment tracking with projections.',
              startDate: new Date('2026-05-18'),
              endDate: new Date('2026-05-25'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Raj Kapoor'
            },
            {
              id: 't79',
              title: 'Safety analytics dashboard',
              description: 'Priority: High | Build safety signals detection and trend analysis.',
              startDate: new Date('2026-05-25'),
              endDate: new Date('2026-06-01'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Raj Kapoor'
            },
            {
              id: 't80',
              title: 'Efficacy endpoint analysis',
              description: 'Priority: Medium | Implement analysis tools for primary/secondary endpoints.',
              startDate: new Date('2026-06-01'),
              endDate: new Date('2026-06-08'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Priya Singh'
            },
            {
              id: 't81',
              title: 'Data export for statistical analysis',
              description: 'Priority: Medium | Build CDISC-compliant data export (SDTM, ADaM).',
              startDate: new Date('2026-06-08'),
              endDate: new Date('2026-06-15'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Raj Kapoor'
            }
          ]
        },
        {
          id: 'f18',
          name: 'Regulatory Reporting',
          tickets: [
            {
              id: 't82',
              title: 'IRB/EC reporting module',
              description: 'Priority: High | Build automated reports for institutional review board submissions.',
              startDate: new Date('2026-06-08'),
              endDate: new Date('2026-06-15'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Emma Rodriguez'
            },
            {
              id: 't83',
              title: 'Regulatory authority reporting (FDA/EMA)',
              description: 'Priority: High | Implement ICSR generation for regulatory reporting.',
              startDate: new Date('2026-06-15'),
              endDate: new Date('2026-06-22'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Emma Rodriguez'
            },
            {
              id: 't84',
              title: 'Clinical study report generation',
              description: 'Priority: Medium | Build CSR template system with automated data population.',
              startDate: new Date('2026-06-22'),
              endDate: new Date('2026-06-29'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Aisha Osman'
            },
            {
              id: 't85',
              title: 'TMF document management',
              description: 'Priority: Medium | Build trial master file system with version control.',
              startDate: new Date('2026-06-29'),
              endDate: new Date('2026-07-06'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Marcus Johnson'
            }
          ]
        },
        {
          id: 'f19',
          name: 'Safety Monitoring',
          tickets: [
            {
              id: 't86',
              title: 'Data safety monitoring board portal',
              description: 'Priority: High | Build secure DSMB portal with unblinded data access.',
              startDate: new Date('2026-06-15'),
              endDate: new Date('2026-06-22'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Sofia Kowalski'
            },
            {
              id: 't87',
              title: 'Safety signal detection',
              description: 'Priority: High | Implement automated safety signal detection algorithms.',
              startDate: new Date('2026-06-22'),
              endDate: new Date('2026-06-29'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Chen Wei'
            },
            {
              id: 't88',
              title: 'Patient safety dashboard',
              description: 'Priority: Medium | Build real-time patient safety monitoring dashboard.',
              startDate: new Date('2026-06-29'),
              endDate: new Date('2026-07-06'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Liam O\'Brien'
            },
            {
              id: 't89',
              title: 'Safety report automation',
              description: 'Priority: Medium | Automate periodic safety update reports (PSUR/DSUR).',
              startDate: new Date('2026-07-06'),
              endDate: new Date('2026-07-13'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Aisha Osman'
            }
          ]
        },
        {
          id: 'f20',
          name: 'Trial Quality & Performance',
          tickets: [
            {
              id: 't90',
              title: 'Risk-based monitoring framework',
              description: 'Priority: High | Implement risk indicators and site monitoring prioritization.',
              startDate: new Date('2026-06-29'),
              endDate: new Date('2026-07-06'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Emma Rodriguez'
            },
            {
              id: 't91',
              title: 'Site performance scorecard',
              description: 'Priority: Medium | Build comprehensive site performance metrics dashboard.',
              startDate: new Date('2026-07-06'),
              endDate: new Date('2026-07-13'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Priya Singh'
            },
            {
              id: 't92',
              title: 'Data quality metrics',
              description: 'Priority: Medium | Implement data quality KPIs and trend tracking.',
              startDate: new Date('2026-07-13'),
              endDate: new Date('2026-07-17'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Raj Kapoor'
            },
            {
              id: 't93',
              title: 'Training tracking and certification',
              description: 'Priority: Low | Build system to track site staff training and certifications.',
              startDate: new Date('2026-07-17'),
              endDate: new Date('2026-07-24'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Yuki Tanaka'
            }
          ]
        }
      ],
      sprints: [
        {
          id: 's17',
          name: 'Sprint 7 - EDC Foundation',
          startDate: new Date('2026-05-18'),
          endDate: new Date('2026-05-29')
        },
        {
          id: 's18',
          name: 'Sprint 8 - Analytics',
          startDate: new Date('2026-06-01'),
          endDate: new Date('2026-06-12')
        },
        {
          id: 's19',
          name: 'Sprint 9 - Regulatory',
          startDate: new Date('2026-06-15'),
          endDate: new Date('2026-06-26')
        },
        {
          id: 's20',
          name: 'Sprint 10 - Safety Monitoring',
          startDate: new Date('2026-06-29'),
          endDate: new Date('2026-07-10')
        },
        {
          id: 's21',
          name: 'Sprint 11 - Quality & Launch',
          startDate: new Date('2026-07-13'),
          endDate: new Date('2026-07-24')
        }
      ]
    }
  ]
};

// ===========================================
// SHOWCASE PRODUCT 1: Balanced Planning
// ===========================================
const product3: Product = {
  id: 'p_showcase_balanced',
  name: 'Showcase A – Balanced Planning',
  releases: [
    {
      id: 'r_balanced',
      name: 'Q1 2026 - Balanced Release',
      startDate: new Date('2026-03-02'),
      endDate: new Date('2026-04-24'),
      storyPointMapping: SP_PRESETS.linear,
      features: [
        {
          id: 'f_bal_1',
          name: 'Authentication & User Management',
          tickets: [
            {
              id: 't_bal_1',
              title: 'Implement OAuth 2.0 Integration',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-11'),
              status: 'planned',
              storyPoints: 10,
              effortDays: 10,
              assignedTo: 'Alex Chen'
            },
            {
              id: 't_bal_2',
              title: 'Build User Profile Service',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-09'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Jordan Smith'
            },
            {
              id: 't_bal_3',
              title: 'Create Permission Framework',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-09'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Taylor Brown'
            },
            {
              id: 't_bal_4',
              title: 'Add Session Management',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-08'),
              status: 'planned',
              storyPoints: 7,
              effortDays: 7,
              assignedTo: 'Casey Lee'
            },
            {
              id: 't_bal_5',
              title: 'Write Auth Test Suite',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-08'),
              status: 'planned',
              storyPoints: 7,
              effortDays: 7,
              assignedTo: 'Morgan Davis'
            }
          ]
        },
        {
          id: 'f_bal_2',
          name: 'API Gateway & Rate Limiting',
          tickets: [
            {
              id: 't_bal_6',
              title: 'Design API Gateway Architecture',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-26'),
              status: 'planned',
              storyPoints: 11,
              effortDays: 11,
              assignedTo: 'Alex Chen'
            },
            {
              id: 't_bal_7',
              title: 'Implement Rate Limiting Logic',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-24'),
              status: 'planned',
              storyPoints: 9,
              effortDays: 9,
              assignedTo: 'Jordan Smith'
            },
            {
              id: 't_bal_8',
              title: 'Build Request Throttling',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-24'),
              status: 'planned',
              storyPoints: 9,
              effortDays: 9,
              assignedTo: 'Taylor Brown'
            },
            {
              id: 't_bal_9',
              title: 'Add API Monitoring',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-22'),
              status: 'planned',
              storyPoints: 7,
              effortDays: 7,
              assignedTo: 'Casey Lee'
            },
            {
              id: 't_bal_10',
              title: 'Test Gateway Performance',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-21'),
              status: 'planned',
              storyPoints: 6,
              effortDays: 6,
              assignedTo: 'Morgan Davis'
            }
          ]
        },
        {
          id: 'f_bal_3',
          name: 'Data Processing Pipeline',
          tickets: [
            {
              id: 't_bal_11',
              title: 'Build ETL Framework',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-09'),
              status: 'planned',
              storyPoints: 7,
              effortDays: 7,
              assignedTo: 'Alex Chen'
            },
            {
              id: 't_bal_12',
              title: 'Implement Data Validation',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-06'),
              status: 'planned',
              storyPoints: 6,
              effortDays: 6,
              assignedTo: 'Jordan Smith'
            },
            {
              id: 't_bal_13',
              title: 'Create Data Transformers',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-06'),
              status: 'planned',
              storyPoints: 6,
              effortDays: 6,
              assignedTo: 'Taylor Brown'
            },
            {
              id: 't_bal_14',
              title: 'Add Error Recovery',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-04'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Casey Lee'
            },
            {
              id: 't_bal_15',
              title: 'Test Pipeline Reliability',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-05'),
              status: 'planned',
              storyPoints: 7,
              effortDays: 7,
              assignedTo: 'Morgan Davis'
            }
          ]
        },
        {
          id: 'f_bal_4',
          name: 'Reporting & Analytics',
          tickets: [
            {
              id: 't_bal_16',
              title: 'Design Analytics Engine',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-23'),
              status: 'planned',
              storyPoints: 11,
              effortDays: 11,
              assignedTo: 'Alex Chen'
            },
            {
              id: 't_bal_17',
              title: 'Build Report Generator',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-21'),
              status: 'planned',
              storyPoints: 9,
              effortDays: 9,
              assignedTo: 'Jordan Smith'
            },
            {
              id: 't_bal_18',
              title: 'Create Dashboard Widgets',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-20'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Taylor Brown'
            },
            {
              id: 't_bal_19',
              title: 'Add Export Functionality',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-19'),
              status: 'planned',
              storyPoints: 7,
              effortDays: 7,
              assignedTo: 'Casey Lee'
            },
            {
              id: 't_bal_20',
              title: 'Test Report Accuracy',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-18'),
              status: 'planned',
              storyPoints: 6,
              effortDays: 6,
              assignedTo: 'Morgan Davis'
            }
          ]
        }
      ],
      sprints: [
        {
          id: 's_bal_1',
          name: 'Sprint 1 - Foundation',
          startDate: new Date('2026-03-02'),
          endDate: new Date('2026-03-13')
        },
        {
          id: 's_bal_2',
          name: 'Sprint 2 - Gateway',
          startDate: new Date('2026-03-16'),
          endDate: new Date('2026-03-27')
        },
        {
          id: 's_bal_3',
          name: 'Sprint 3 - Pipeline',
          startDate: new Date('2026-03-30'),
          endDate: new Date('2026-04-10')
        },
        {
          id: 's_bal_4',
          name: 'Sprint 4 - Analytics',
          startDate: new Date('2026-04-13'),
          endDate: new Date('2026-04-24')
        }
      ]
    }
  ]
};

// ===========================================
// SHOWCASE PRODUCT 2: Overload & Velocity Impact
// ===========================================
const product4: Product = {
  id: 'p_showcase_overload',
  name: 'Showcase B – Overload & Velocity Impact',
  releases: [
    {
      id: 'r_overload',
      name: 'Q1 2026 - Overload Demonstration',
      startDate: new Date('2026-03-02'),
      endDate: new Date('2026-04-24'),
      storyPointMapping: SP_PRESETS.linear,
      features: [
        {
          id: 'f_over_1',
          name: 'Core Infrastructure',
          tickets: [
            {
              id: 't_over_1',
              title: 'Setup Database Architecture',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-11'),
              status: 'planned',
              storyPoints: 10,
              effortDays: 10,
              assignedTo: 'Sam Wilson'
            },
            {
              id: 't_over_2',
              title: 'Configure Cloud Infrastructure',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-09'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Riley Martinez'
            },
            {
              id: 't_over_3',
              title: 'Implement Caching Layer',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-09'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Avery Johnson'
            },
            {
              id: 't_over_4',
              title: 'Setup Monitoring Stack',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-08'),
              status: 'planned',
              storyPoints: 7,
              effortDays: 7,
              assignedTo: 'Dakota White'
            },
            {
              id: 't_over_5',
              title: 'Create Infrastructure Tests',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-08'),
              status: 'planned',
              storyPoints: 7,
              effortDays: 7,
              assignedTo: 'Quinn Taylor'
            }
          ]
        },
        {
          id: 'f_over_2',
          name: 'Heavy Feature Load (Overload Sprint)',
          tickets: [
            {
              id: 't_over_6',
              title: 'Build Complex API Gateway (Senior Task)',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-23'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Sam Wilson',
              description: '8 days for Senior (1.3x multiplier) - demonstrates velocity impact'
            },
            {
              id: 't_over_7',
              title: 'Build Complex Data Processor (Junior Task)',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-23'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Dakota White',
              description: '8 days for Junior (0.7x multiplier) - will show overload impact'
            },
            {
              id: 't_over_8',
              title: 'Implement Real-time Streaming',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-20'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Sam Wilson'
            },
            {
              id: 't_over_9',
              title: 'Build Notification System',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-26'),
              status: 'planned',
              storyPoints: 11,
              effortDays: 11,
              assignedTo: 'Riley Martinez'
            },
            {
              id: 't_over_10',
              title: 'Create Webhook Handler',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-26'),
              status: 'planned',
              storyPoints: 11,
              effortDays: 11,
              assignedTo: 'Avery Johnson'
            },
            {
              id: 't_over_11',
              title: 'Add Event Sourcing',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-19'),
              status: 'planned',
              storyPoints: 4,
              effortDays: 4,
              assignedTo: 'Dakota White'
            },
            {
              id: 't_over_12',
              title: 'Test Event Flow',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-23'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Quinn Taylor'
            }
          ]
        },
        {
          id: 'f_over_3',
          name: 'Integration Services',
          tickets: [
            {
              id: 't_over_13',
              title: 'Build Third-Party Connectors',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-09'),
              status: 'planned',
              storyPoints: 10,
              effortDays: 10,
              assignedTo: 'Sam Wilson'
            },
            {
              id: 't_over_14',
              title: 'Implement OAuth Flows',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-06'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Riley Martinez'
            },
            {
              id: 't_over_15',
              title: 'Create API Client SDK',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-06'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Avery Johnson'
            },
            {
              id: 't_over_16',
              title: 'Add Error Handling',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-05'),
              status: 'planned',
              storyPoints: 6,
              effortDays: 6,
              assignedTo: 'Dakota White'
            },
            {
              id: 't_over_17',
              title: 'Test Integration Points',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-05'),
              status: 'planned',
              storyPoints: 6,
              effortDays: 6,
              assignedTo: 'Quinn Taylor'
            }
          ]
        },
        {
          id: 'f_over_4',
          name: 'Security & Compliance',
          tickets: [
            {
              id: 't_over_18',
              title: 'Implement Security Audit',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-22'),
              status: 'planned',
              storyPoints: 10,
              effortDays: 10,
              assignedTo: 'Sam Wilson'
            },
            {
              id: 't_over_19',
              title: 'Build Encryption Layer',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-20'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Riley Martinez'
            },
            {
              id: 't_over_20',
              title: 'Add Compliance Reports',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-21'),
              status: 'planned',
              storyPoints: 9,
              effortDays: 9,
              assignedTo: 'Avery Johnson'
            },
            {
              id: 't_over_21',
              title: 'Create Audit Logs',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-19'),
              status: 'planned',
              storyPoints: 7,
              effortDays: 7,
              assignedTo: 'Dakota White'
            },
            {
              id: 't_over_22',
              title: 'Test Security Controls',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-18'),
              status: 'planned',
              storyPoints: 6,
              effortDays: 6,
              assignedTo: 'Quinn Taylor'
            }
          ]
        }
      ],
      sprints: [
        {
          id: 's_over_1',
          name: 'Sprint 1 - Infrastructure',
          startDate: new Date('2026-03-02'),
          endDate: new Date('2026-03-13')
        },
        {
          id: 's_over_2',
          name: 'Sprint 2 - OVERLOAD',
          startDate: new Date('2026-03-16'),
          endDate: new Date('2026-03-27')
        },
        {
          id: 's_over_3',
          name: 'Sprint 3 - Integration',
          startDate: new Date('2026-03-30'),
          endDate: new Date('2026-04-10')
        },
        {
          id: 's_over_4',
          name: 'Sprint 4 - Security',
          startDate: new Date('2026-04-13'),
          endDate: new Date('2026-04-24')
        }
      ]
    }
  ]
};

// ===========================================
// SHOWCASE PRODUCT 3: Scope Shock & PTO Stress
// ===========================================
const product5: Product = {
  id: 'p_showcase_scope',
  name: 'Showcase C – Scope Shock & PTO Stress',
  releases: [
    {
      id: 'r_scope',
      name: 'Q1 2026 - Scope & PTO Impact',
      startDate: new Date('2026-03-02'),
      endDate: new Date('2026-04-24'),
      storyPointMapping: SP_PRESETS.linear,
      features: [
        {
          id: 'f_scope_1',
          name: 'Platform Foundation',
          tickets: [
            {
              id: 't_scope_1',
              title: 'Design System Architecture',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-11'),
              status: 'planned',
              storyPoints: 10,
              effortDays: 10,
              assignedTo: 'Jamie Carter'
            },
            {
              id: 't_scope_2',
              title: 'Build Core Services',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-09'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Morgan Reed'
            },
            {
              id: 't_scope_3',
              title: 'Setup Service Mesh',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-09'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Parker Kim'
            },
            {
              id: 't_scope_4',
              title: 'Implement Health Checks',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-08'),
              status: 'planned',
              storyPoints: 7,
              effortDays: 7,
              assignedTo: 'Cameron Gray'
            },
            {
              id: 't_scope_5',
              title: 'Create Platform Tests',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-08'),
              status: 'planned',
              storyPoints: 7,
              effortDays: 7,
              assignedTo: 'Skylar Brooks'
            }
          ]
        },
        {
          id: 'f_scope_2',
          name: 'Business Logic Layer',
          tickets: [
            {
              id: 't_scope_6',
              title: 'Build Workflow Engine',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-26'),
              status: 'planned',
              storyPoints: 11,
              effortDays: 11,
              assignedTo: 'Jamie Carter'
            },
            {
              id: 't_scope_7',
              title: 'Implement Business Rules',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-24'),
              status: 'planned',
              storyPoints: 9,
              effortDays: 9,
              assignedTo: 'Morgan Reed'
            },
            {
              id: 't_scope_8',
              title: 'Create State Machine',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-24'),
              status: 'planned',
              storyPoints: 9,
              effortDays: 9,
              assignedTo: 'Parker Kim'
            },
            {
              id: 't_scope_9',
              title: 'Add Validation Framework',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-22'),
              status: 'planned',
              storyPoints: 7,
              effortDays: 7,
              assignedTo: 'Cameron Gray'
            },
            {
              id: 't_scope_10',
              title: 'Test Business Logic',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-21'),
              status: 'planned',
              storyPoints: 6,
              effortDays: 6,
              assignedTo: 'Skylar Brooks'
            }
          ]
        },
        {
          id: 'f_scope_3',
          name: 'SCOPE SHOCK - Additional Requirements',
          tickets: [
            {
              id: 't_scope_11',
              title: '[EMERGENCY] Implement New Regulatory Feature',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-09'),
              status: 'planned',
              storyPoints: 5,
              effortDays: 5,
              assignedTo: 'Jamie Carter',
              description: 'Late-breaking requirement adding scope'
            },
            {
              id: 't_scope_12',
              title: '[URGENT] Build Compliance Dashboard',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-09'),
              status: 'planned',
              storyPoints: 6,
              effortDays: 6,
              assignedTo: 'Morgan Reed',
              description: 'Additional scope from stakeholder'
            },
            {
              id: 't_scope_13',
              title: '[NEW] Add Audit Trail System',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-09'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Parker Kim',
              description: 'Scope creep from requirements change'
            },
            {
              id: 't_scope_14',
              title: '[CRITICAL] Implement Data Export',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-07'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Cameron Gray',
              description: 'New regulatory requirement'
            },
            {
              id: 't_scope_15',
              title: '[URGENT] Test All Compliance Features',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-06'),
              status: 'planned',
              storyPoints: 7,
              effortDays: 7,
              assignedTo: 'Skylar Brooks',
              description: 'Extended testing needed'
            }
          ]
        },
        {
          id: 'f_scope_4',
          name: 'Spillover & Stabilization',
          tickets: [
            {
              id: 't_scope_16',
              title: 'Complete Outstanding Work',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-23'),
              status: 'planned',
              storyPoints: 10,
              effortDays: 10,
              assignedTo: 'Jamie Carter',
              description: 'Spillover from Sprint 3'
            },
            {
              id: 't_scope_17',
              title: 'Refactor Core Components',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-22'),
              status: 'planned',
              storyPoints: 9,
              effortDays: 9,
              assignedTo: 'Morgan Reed'
            },
            {
              id: 't_scope_18',
              title: 'Optimize Performance',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-22'),
              status: 'planned',
              storyPoints: 9,
              effortDays: 9,
              assignedTo: 'Parker Kim'
            },
            {
              id: 't_scope_19',
              title: 'Fix Integration Issues',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-21'),
              status: 'planned',
              storyPoints: 9,
              effortDays: 9,
              assignedTo: 'Cameron Gray'
            },
            {
              id: 't_scope_20',
              title: 'Final Testing & Documentation',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-20'),
              status: 'planned',
              storyPoints: 8,
              effortDays: 8,
              assignedTo: 'Skylar Brooks'
            }
          ]
        }
      ],
      sprints: [
        {
          id: 's_scope_1',
          name: 'Sprint 1 - Foundation',
          startDate: new Date('2026-03-02'),
          endDate: new Date('2026-03-13')
        },
        {
          id: 's_scope_2',
          name: 'Sprint 2 - Business Logic',
          startDate: new Date('2026-03-16'),
          endDate: new Date('2026-03-27')
        },
        {
          id: 's_scope_3',
          name: 'Sprint 3 - SCOPE SHOCK + PTO',
          startDate: new Date('2026-03-30'),
          endDate: new Date('2026-04-10')
        },
        {
          id: 's_scope_4',
          name: 'Sprint 4 - Spillover',
          startDate: new Date('2026-04-13'),
          endDate: new Date('2026-04-24')
        }
      ]
    }
  ]
};

// Combine all products
export const mockProducts: Product[] = [product1, product2, product3, product4, product5];

// Helper function to find a release by ID across all products
export function findReleaseById(releaseId: string): { product: Product; release: Release } | null {
  for (const product of mockProducts) {
    const release = product.releases.find(r => r.id === releaseId);
    if (release) {
      return { product, release };
    }
  }
  return null;
}

// ===========================================
// TEAM MEMBERS
// ===========================================
export const mockTeamMembers: TeamMember[] = [
  // --- Product 1: FinTech Payment Gateway (10 members) ---
  {
    id: 'tm1',
    name: 'Arjun Mehta',
    role: 'Developer',
    experienceLevel: 'Senior',
    notes: 'Tech Lead - Payment Systems Architecture',
    productId: 'p1',
    velocityMultiplier: 1.3,
    pto: [
      {
        id: 'pto1',
        name: 'Family Wedding',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-04')
      }
    ]
  },
  {
    id: 'tm2',
    name: 'Priya Sharma',
    role: 'Developer',
    experienceLevel: 'Senior',
    notes: 'Senior Backend Engineer - Security & Auth',
    productId: 'p1',
    velocityMultiplier: 1.3,
    pto: [
      {
        id: 'pto2',
        name: 'Vacation',
        startDate: new Date('2026-05-18'),
        endDate: new Date('2026-05-25')
      }
    ]
  },
  {
    id: 'tm3',
    name: 'Vikram Singh',
    role: 'Developer',
    experienceLevel: 'Mid',
    notes: 'Backend Engineer - Transaction Processing',
    productId: 'p1',
    velocityMultiplier: 1.0,
    pto: [
      {
        id: 'pto3',
        name: 'Tech Conference',
        startDate: new Date('2026-06-16'),
        endDate: new Date('2026-06-19')
      }
    ]
  },
  {
    id: 'tm4',
    name: 'Neha Patel',
    role: 'Developer',
    experienceLevel: 'Junior',
    notes: 'Backend Engineer - Financial Operations',
    productId: 'p1',
    velocityMultiplier: 0.7,
    pto: []
  },
  {
    id: 'tm5',
    name: 'Rajesh Kumar',
    role: 'Developer',
    experienceLevel: 'Mid',
    notes: 'DevOps & Security Engineer',
    productId: 'p1',
    velocityMultiplier: 1.0,
    pto: [
      {
        id: 'pto5',
        name: 'Personal',
        startDate: new Date('2026-03-25'),
        endDate: new Date('2026-03-27')
      }
    ]
  },
  {
    id: 'tm6',
    name: 'Ananya Reddy',
    role: 'Developer',
    experienceLevel: 'Senior',
    notes: 'Frontend Lead - Dashboard & UX',
    productId: 'p1',
    velocityMultiplier: 1.3,
    pto: [
      {
        id: 'pto6',
        name: 'Spring Break',
        startDate: new Date('2026-05-04'),
        endDate: new Date('2026-05-08')
      }
    ]
  },
  {
    id: 'tm7',
    name: 'Kabir Joshi',
    role: 'Developer',
    experienceLevel: 'Mid',
    notes: 'Frontend Engineer - Analytics & Reporting',
    productId: 'p1',
    velocityMultiplier: 1.0,
    pto: []
  },
  {
    id: 'tm8',
    name: 'Lakshmi Iyer',
    role: 'QA',
    experienceLevel: 'Mid',
    notes: 'QA Lead - Test Automation',
    productId: 'p1',
    velocityMultiplier: 1.0,
    pto: [
      {
        id: 'pto8',
        name: 'Training Workshop',
        startDate: new Date('2026-06-08'),
        endDate: new Date('2026-06-10')
      }
    ]
  },
  {
    id: 'tm9',
    name: 'Amit Desai',
    role: 'Designer',
    experienceLevel: 'Mid',
    notes: 'Product Designer - UX Research',
    productId: 'p1',
    velocityMultiplier: 1.0,
    pto: []
  },
  {
    id: 'tm10',
    name: 'Sanjay Reddy',
    role: 'Developer',
    experienceLevel: 'Junior',
    notes: 'Full-Stack Engineer',
    productId: 'p1',
    velocityMultiplier: 0.7,
    pto: [
      {
        id: 'pto10',
        name: 'Pilgrimage',
        startDate: new Date('2026-04-20'),
        endDate: new Date('2026-04-24')
      }
    ]
  },
  
  // --- Product 2: Clinical Trial Management (9 members) ---
  {
    id: 'tm11',
    name: 'Emma Rodriguez',
    role: 'Developer',
    experienceLevel: 'Senior',
    notes: 'Tech Lead - Clinical Systems',
    productId: 'p2',
    velocityMultiplier: 1.3,
    pto: [
      {
        id: 'pto11',
        name: 'Medical Conference',
        startDate: new Date('2026-06-22'),
        endDate: new Date('2026-06-26')
      }
    ]
  },
  {
    id: 'tm12',
    name: 'Raj Kapoor',
    role: 'Developer',
    experienceLevel: 'Senior',
    notes: 'Backend Lead - Data & Analytics',
    productId: 'p2',
    velocityMultiplier: 1.3,
    pto: [
      {
        id: 'pto12',
        name: 'Vacation',
        startDate: new Date('2026-06-08'),
        endDate: new Date('2026-06-15')
      }
    ]
  },
  {
    id: 'tm13',
    name: 'Chen Wei',
    role: 'Developer',
    experienceLevel: 'Mid',
    notes: 'Backend Engineer - Platform & Security',
    productId: 'p2',
    velocityMultiplier: 1.0,
    pto: []
  },
  {
    id: 'tm14',
    name: 'Aisha Osman',
    role: 'Developer',
    experienceLevel: 'Mid',
    notes: 'Backend Engineer - Regulatory & Compliance',
    productId: 'p2',
    velocityMultiplier: 1.0,
    pto: [
      {
        id: 'pto14',
        name: 'Family Event',
        startDate: new Date('2026-07-06'),
        endDate: new Date('2026-07-10')
      }
    ]
  },
  {
    id: 'tm15',
    name: 'Marcus Johnson',
    role: 'Developer',
    experienceLevel: 'Mid',
    notes: 'Backend Engineer - Patient Safety',
    productId: 'p2',
    velocityMultiplier: 1.0,
    pto: [
      {
        id: 'pto15',
        name: 'Summer Vacation',
        startDate: new Date('2026-05-25'),
        endDate: new Date('2026-05-29')
      }
    ]
  },
  {
    id: 'tm16',
    name: 'Sofia Kowalski',
    role: 'Developer',
    experienceLevel: 'Senior',
    notes: 'Frontend Lead - Patient Portal',
    productId: 'p2',
    velocityMultiplier: 1.3,
    pto: [
      {
        id: 'pto16',
        name: 'Conference',
        startDate: new Date('2026-04-13'),
        endDate: new Date('2026-04-17')
      }
    ]
  },
  {
    id: 'tm17',
    name: 'Liam O\'Brien',
    role: 'Developer',
    experienceLevel: 'Junior',
    notes: 'Frontend Engineer - Site Coordinator UI',
    productId: 'p2',
    velocityMultiplier: 0.7,
    pto: []
  },
  {
    id: 'tm18',
    name: 'Yuki Tanaka',
    role: 'Developer',
    experienceLevel: 'Mid',
    notes: 'Full-Stack Engineer - EDC Forms',
    productId: 'p2',
    velocityMultiplier: 1.0,
    pto: [
      {
        id: 'pto18',
        name: 'Personal',
        startDate: new Date('2026-03-30'),
        endDate: new Date('2026-04-03')
      }
    ]
  },
  {
    id: 'tm19',
    name: 'Priya Singh',
    role: 'Developer',
    experienceLevel: 'Junior',
    notes: 'Full-Stack Engineer - Data Validation',
    productId: 'p2',
    velocityMultiplier: 0.7,
    pto: []
  },
  {
    id: 'tm20',
    name: 'Zara Khanna',
    role: 'Designer',
    experienceLevel: 'Mid',
    notes: 'UX Designer - Healthcare Experience',
    productId: 'p2',
    velocityMultiplier: 1.0,
    pto: [
      {
        id: 'pto20',
        name: 'Diwali Celebration',
        startDate: new Date('2026-06-29'),
        endDate: new Date('2026-07-03')
      }
    ]
  },
  
  // --- Showcase Product 1: Balanced Planning (5 members) ---
  {
    id: 'tm21',
    name: 'Alex Chen',
    role: 'Developer',
    experienceLevel: 'Senior',
    notes: 'Senior Developer - System Architecture',
    productId: 'p_showcase_balanced',
    velocityMultiplier: 1.3,
    pto: []
  },
  {
    id: 'tm22',
    name: 'Jordan Smith',
    role: 'Developer',
    experienceLevel: 'Mid',
    notes: 'Mid-Level Developer - Backend Services',
    productId: 'p_showcase_balanced',
    velocityMultiplier: 1.0,
    pto: []
  },
  {
    id: 'tm23',
    name: 'Taylor Brown',
    role: 'Developer',
    experienceLevel: 'Mid',
    notes: 'Mid-Level Developer - API Development',
    productId: 'p_showcase_balanced',
    velocityMultiplier: 1.0,
    pto: []
  },
  {
    id: 'tm24',
    name: 'Casey Lee',
    role: 'Developer',
    experienceLevel: 'Junior',
    notes: 'Junior Developer - Learning & Growing',
    productId: 'p_showcase_balanced',
    velocityMultiplier: 0.7,
    pto: [
      {
        id: 'pto21',
        name: 'Personal Time',
        startDate: new Date('2026-04-06'),
        endDate: new Date('2026-04-07')
      }
    ]
  },
  {
    id: 'tm25',
    name: 'Morgan Davis',
    role: 'QA',
    experienceLevel: 'Mid',
    notes: 'QA Engineer - Test Automation',
    productId: 'p_showcase_balanced',
    velocityMultiplier: 0.8,
    pto: []
  },
  
  // --- Showcase Product 2: Overload & Velocity Impact (5 members) ---
  {
    id: 'tm26',
    name: 'Sam Wilson',
    role: 'Developer',
    experienceLevel: 'Senior',
    notes: 'Senior Developer - Infrastructure Lead',
    productId: 'p_showcase_overload',
    velocityMultiplier: 1.3,
    pto: []
  },
  {
    id: 'tm27',
    name: 'Riley Martinez',
    role: 'Developer',
    experienceLevel: 'Mid',
    notes: 'Mid-Level Developer - Platform Engineering',
    productId: 'p_showcase_overload',
    velocityMultiplier: 1.0,
    pto: []
  },
  {
    id: 'tm28',
    name: 'Avery Johnson',
    role: 'Developer',
    experienceLevel: 'Mid',
    notes: 'Mid-Level Developer - Integration Specialist',
    productId: 'p_showcase_overload',
    velocityMultiplier: 1.0,
    pto: []
  },
  {
    id: 'tm29',
    name: 'Dakota White',
    role: 'Developer',
    experienceLevel: 'Junior',
    notes: 'Junior Developer - Early Career',
    productId: 'p_showcase_overload',
    velocityMultiplier: 0.7,
    pto: []
  },
  {
    id: 'tm30',
    name: 'Quinn Taylor',
    role: 'QA',
    experienceLevel: 'Mid',
    notes: 'QA Engineer - Quality Assurance',
    productId: 'p_showcase_overload',
    velocityMultiplier: 0.8,
    pto: []
  },
  
  // --- Showcase Product 3: Scope Shock & PTO Stress (5 members) ---
  {
    id: 'tm31',
    name: 'Jamie Carter',
    role: 'Developer',
    experienceLevel: 'Senior',
    notes: 'Senior Developer - Technical Lead',
    productId: 'p_showcase_scope',
    velocityMultiplier: 1.3,
    pto: [
      {
        id: 'pto22',
        name: 'Medical Appointment',
        startDate: new Date('2026-04-02'),
        endDate: new Date('2026-04-03')
      }
    ]
  },
  {
    id: 'tm32',
    name: 'Morgan Reed',
    role: 'Developer',
    experienceLevel: 'Mid',
    notes: 'Mid-Level Developer - Full Stack',
    productId: 'p_showcase_scope',
    velocityMultiplier: 1.0,
    pto: [
      {
        id: 'pto23',
        name: 'Family Emergency',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-03')
      }
    ]
  },
  {
    id: 'tm33',
    name: 'Parker Kim',
    role: 'Developer',
    experienceLevel: 'Mid',
    notes: 'Mid-Level Developer - Service Oriented',
    productId: 'p_showcase_scope',
    velocityMultiplier: 1.0,
    pto: []
  },
  {
    id: 'tm34',
    name: 'Cameron Gray',
    role: 'Developer',
    experienceLevel: 'Junior',
    notes: 'Junior Developer - Growing Skills',
    productId: 'p_showcase_scope',
    velocityMultiplier: 0.7,
    pto: []
  },
  {
    id: 'tm35',
    name: 'Skylar Brooks',
    role: 'QA',
    experienceLevel: 'Mid',
    notes: 'QA Engineer - Testing & Automation',
    productId: 'p_showcase_scope',
    velocityMultiplier: 0.8,
    pto: []
  }
];

/**
 * Get team members for a specific product
 */
export function getTeamMembersByProduct(productId: string, allMembers: TeamMember[] = mockTeamMembers): TeamMember[] {
  return allMembers.filter(m => m.productId === productId);
}

// ===========================================
// INDIAN NATIONAL HOLIDAYS & FESTIVALS (Feb - Jul 2026)
// ===========================================
export const mockHolidays: Holiday[] = [
  {
    id: 'h1',
    name: 'Maha Shivaratri',
    startDate: new Date('2026-02-26'),
    endDate: new Date('2026-02-26')
  },
  {
    id: 'h2',
    name: 'Holi',
    startDate: new Date('2026-03-14'),
    endDate: new Date('2026-03-14')
  },
  {
    id: 'h3',
    name: 'Good Friday',
    startDate: new Date('2026-04-03'),
    endDate: new Date('2026-04-03')
  },
  {
    id: 'h4',
    name: 'Eid ul-Fitr',
    startDate: new Date('2026-04-03'),
    endDate: new Date('2026-04-03')
  },
  {
    id: 'h5',
    name: 'Mahavir Jayanti',
    startDate: new Date('2026-04-06'),
    endDate: new Date('2026-04-06')
  },
  {
    id: 'h6',
    name: 'Ambedkar Jayanti',
    startDate: new Date('2026-04-14'),
    endDate: new Date('2026-04-14')
  },
  {
    id: 'h7',
    name: 'Buddha Purnima',
    startDate: new Date('2026-05-01'),
    endDate: new Date('2026-05-01')
  },
  {
    id: 'h8',
    name: 'Eid ul-Adha (Bakrid)',
    startDate: new Date('2026-06-10'),
    endDate: new Date('2026-06-10')
  },
  {
    id: 'h9',
    name: 'Company Offsite',
    startDate: new Date('2026-06-19'),
    endDate: new Date('2026-06-19')
  }
];
