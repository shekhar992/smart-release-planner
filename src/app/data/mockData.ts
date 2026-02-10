export interface Ticket {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: 'in-progress' | 'planned' | 'completed';
  storyPoints: number;
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

export interface Release {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  features: Feature[];
  sprints?: Sprint[];
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
  notes?: string;
  pto: PTOEntry[];
  productId: string;
}

export interface Holiday {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

// ===========================================
// PRODUCT 1: Enterprise SaaS Platform
// ===========================================
const product1: Product = {
  id: 'p1',
  name: 'Enterprise SaaS Platform',
  releases: [
    {
      id: 'r1',
      name: 'Q1 2026 - Authentication & Core Features',
      startDate: new Date('2026-02-10'),
      endDate: new Date('2026-03-28'),
      features: [
        {
          id: 'f1',
          name: 'Authentication System',
          tickets: [
            {
              id: 't1',
              title: 'SSO Integration - OAuth 2.0',
              startDate: new Date('2026-02-10'),
              endDate: new Date('2026-02-17'),
              status: 'in-progress',
              storyPoints: 8,
              assignedTo: 'Sarah Chen'
            },
            {
              id: 't2',
              title: 'Multi-Factor Authentication (MFA)',
              startDate: new Date('2026-02-10'),
              endDate: new Date('2026-02-14'),
              status: 'in-progress',
              storyPoints: 5,
              assignedTo: 'Marcus Rivera'
            },
            // CONFLICT: Marcus has overlapping tasks
            {
              id: 't3',
              title: 'JWT Token Management',
              startDate: new Date('2026-02-12'),
              endDate: new Date('2026-02-16'),
              status: 'planned',
              storyPoints: 3,
              assignedTo: 'Marcus Rivera'
            },
            {
              id: 't4',
              title: 'Role-Based Access Control (RBAC)',
              startDate: new Date('2026-02-17'),
              endDate: new Date('2026-02-24'),
              status: 'planned',
              storyPoints: 8,
              assignedTo: 'Alex Thompson'
            },
            {
              id: 't5',
              title: 'Session Management System',
              startDate: new Date('2026-02-24'),
              endDate: new Date('2026-03-03'),
              status: 'planned',
              storyPoints: 5,
              assignedTo: 'Sarah Chen'
            },
            // PTO CONFLICT: Marcus on conference during this task
            {
              id: 't6',
              title: 'Password Policy Enforcement',
              startDate: new Date('2026-03-03'),
              endDate: new Date('2026-03-07'),
              status: 'planned',
              storyPoints: 3,
              assignedTo: 'Marcus Rivera'
            },
            {
              id: 't7',
              title: 'Audit Logging for Security Events',
              startDate: new Date('2026-03-10'),
              endDate: new Date('2026-03-17'),
              status: 'planned',
              storyPoints: 5,
              assignedTo: 'James Wilson'
            }
          ]
        },
        {
          id: 'f2',
          name: 'User Management',
          tickets: [
            {
              id: 't8',
              title: 'User Profile CRUD API',
              startDate: new Date('2026-02-10'),
              endDate: new Date('2026-02-17'),
              status: 'in-progress',
              storyPoints: 8,
              assignedTo: 'Priya Patel'
            },
            {
              id: 't9',
              title: 'Profile UI Components',
              startDate: new Date('2026-02-17'),
              endDate: new Date('2026-02-24'),
              status: 'planned',
              storyPoints: 5,
              assignedTo: 'Elena Zhang'
            },
            // CONFLICT: Elena has overlapping work
            {
              id: 't10',
              title: 'Avatar Upload & Management',
              startDate: new Date('2026-02-20'),
              endDate: new Date('2026-02-24'),
              status: 'planned',
              storyPoints: 3,
              assignedTo: 'Elena Zhang'
            },
            {
              id: 't11',
              title: 'User Settings Dashboard',
              startDate: new Date('2026-02-24'),
              endDate: new Date('2026-03-03'),
              status: 'planned',
              storyPoints: 8,
              assignedTo: 'Elena Zhang'
            },
            {
              id: 't12',
              title: 'Email Preferences & Notifications',
              startDate: new Date('2026-03-03'),
              endDate: new Date('2026-03-10'),
              status: 'planned',
              storyPoints: 5,
              assignedTo: 'Yuki Tanaka'
            }
          ]
        },
        {
          id: 'f3',
          name: 'Admin Dashboard',
          tickets: [
            {
              id: 't13',
              title: 'User Management Admin UI',
              startDate: new Date('2026-02-24'),
              endDate: new Date('2026-03-03'),
              status: 'planned',
              storyPoints: 8,
              assignedTo: 'Sofia Martinez'
            },
            {
              id: 't14',
              title: 'System Metrics Dashboard',
              startDate: new Date('2026-03-03'),
              endDate: new Date('2026-03-10'),
              status: 'planned',
              storyPoints: 8,
              assignedTo: 'Priya Patel'
            },
            {
              id: 't15',
              title: 'Audit Log Viewer',
              startDate: new Date('2026-03-10'),
              endDate: new Date('2026-03-17'),
              status: 'planned',
              storyPoints: 5,
              assignedTo: 'Yuki Tanaka'
            }
          ]
        }
      ],
      sprints: [
        {
          id: 's1',
          name: 'Sprint 1',
          startDate: new Date('2026-02-10'),
          endDate: new Date('2026-02-20')
        },
        {
          id: 's2',
          name: 'Sprint 2',
          startDate: new Date('2026-02-23'),
          endDate: new Date('2026-03-06')
        },
        {
          id: 's3',
          name: 'Sprint 3',
          startDate: new Date('2026-03-09'),
          endDate: new Date('2026-03-20')
        },
        {
          id: 's4',
          name: 'Sprint 4',
          startDate: new Date('2026-03-23'),
          endDate: new Date('2026-03-27')
        }
      ]
    },
    {
      id: 'r2',
      name: 'Q2 2026 - API & Integration Layer',
      startDate: new Date('2026-04-06'),
      endDate: new Date('2026-06-26'),
      features: [
        {
          id: 'f4',
          name: 'REST API Gateway',
          tickets: [
            {
              id: 't16',
              title: 'API Gateway Architecture',
              startDate: new Date('2026-04-06'),
              endDate: new Date('2026-04-13'),
              status: 'planned',
              storyPoints: 13,
              assignedTo: 'Alex Thompson'
            },
            {
              id: 't17',
              title: 'Rate Limiting Implementation',
              startDate: new Date('2026-04-13'),
              endDate: new Date('2026-04-20'),
              status: 'planned',
              storyPoints: 5,
              assignedTo: 'Alex Thompson'
            },
            {
              id: 't18',
              title: 'API Versioning Strategy',
              startDate: new Date('2026-04-20'),
              endDate: new Date('2026-04-27'),
              status: 'planned',
              storyPoints: 3,
              assignedTo: 'Yuki Tanaka'
            },
            {
              id: 't19',
              title: 'API Documentation Portal',
              startDate: new Date('2026-04-27'),
              endDate: new Date('2026-05-04'),
              status: 'planned',
              storyPoints: 8,
              assignedTo: 'Sofia Martinez'
            }
          ]
        },
        {
          id: 'f5',
          name: 'Third-Party Integrations',
          tickets: [
            {
              id: 't20',
              title: 'Salesforce Integration',
              startDate: new Date('2026-04-06'),
              endDate: new Date('2026-04-20'),
              status: 'planned',
              storyPoints: 13,
              assignedTo: 'Yuki Tanaka'
            },
            {
              id: 't21',
              title: 'Slack Notifications',
              startDate: new Date('2026-04-20'),
              endDate: new Date('2026-04-27'),
              status: 'planned',
              storyPoints: 5,
              assignedTo: 'Marcus Rivera'
            },
            {
              id: 't22',
              title: 'Google Workspace SSO',
              startDate: new Date('2026-04-27'),
              endDate: new Date('2026-05-04'),
              status: 'planned',
              storyPoints: 8,
              assignedTo: 'Sarah Chen'
            }
          ]
        },
        {
          id: 'f6',
          name: 'Webhook System',
          tickets: [
            {
              id: 't23',
              title: 'Webhook Infrastructure',
              startDate: new Date('2026-05-04'),
              endDate: new Date('2026-05-11'),
              status: 'planned',
              storyPoints: 8,
              assignedTo: 'James Wilson'
            },
            {
              id: 't24',
              title: 'Event Subscription Management',
              startDate: new Date('2026-05-11'),
              endDate: new Date('2026-05-18'),
              status: 'planned',
              storyPoints: 5,
              assignedTo: 'Yuki Tanaka'
            }
          ]
        }
      ],
      sprints: [
        {
          id: 's5',
          name: 'Sprint 5',
          startDate: new Date('2026-04-06'),
          endDate: new Date('2026-04-17')
        },
        {
          id: 's6',
          name: 'Sprint 6',
          startDate: new Date('2026-04-20'),
          endDate: new Date('2026-05-01')
        },
        {
          id: 's7',
          name: 'Sprint 7',
          startDate: new Date('2026-05-04'),
          endDate: new Date('2026-05-15')
        },
        {
          id: 's8',
          name: 'Sprint 8',
          startDate: new Date('2026-05-18'),
          endDate: new Date('2026-05-29')
        },
        {
          id: 's9',
          name: 'Sprint 9',
          startDate: new Date('2026-06-01'),
          endDate: new Date('2026-06-12')
        },
        {
          id: 's10',
          name: 'Sprint 10',
          startDate: new Date('2026-06-15'),
          endDate: new Date('2026-06-26')
        }
      ]
    }
  ]
};

// ===========================================
// PRODUCT 2: Mobile App Suite
// ===========================================
const product2: Product = {
  id: 'p2',
  name: 'Mobile App Suite',
  releases: [
    {
      id: 'r3',
      name: 'v3.0 - iOS & Android Rebuild',
      startDate: new Date('2026-02-10'),
      endDate: new Date('2026-04-24'),
      features: [
        {
          id: 'f7',
          name: 'Mobile Core',
          tickets: [
            {
              id: 't25',
              title: 'React Native Setup & Config',
              startDate: new Date('2026-02-10'),
              endDate: new Date('2026-02-14'),
              status: 'completed',
              storyPoints: 5,
              assignedTo: 'Maria Garcia'
            },
            {
              id: 't26',
              title: 'Navigation Architecture',
              startDate: new Date('2026-02-17'),
              endDate: new Date('2026-02-24'),
              status: 'in-progress',
              storyPoints: 8,
              assignedTo: 'Maria Garcia'
            },
            {
              id: 't27',
              title: 'Offline Data Sync',
              startDate: new Date('2026-02-24'),
              endDate: new Date('2026-03-10'),
              status: 'planned',
              storyPoints: 13,
              assignedTo: 'Sarah Chen'
            },
            // PTO CONFLICT: Sarah on Spring Break
            {
              id: 't28',
              title: 'Push Notification Integration',
              startDate: new Date('2026-03-24'),
              endDate: new Date('2026-03-31'),
              status: 'planned',
              storyPoints: 8,
              assignedTo: 'Sarah Chen'
            }
          ]
        },
        {
          id: 'f8',
          name: 'Mobile UI',
          tickets: [
            {
              id: 't29',
              title: 'Design System Implementation',
              startDate: new Date('2026-02-10'),
              endDate: new Date('2026-02-17'),
              status: 'completed',
              storyPoints: 8,
              assignedTo: 'Sofia Martinez'
            },
            {
              id: 't30',
              title: 'Onboarding Flow',
              startDate: new Date('2026-02-17'),
              endDate: new Date('2026-02-24'),
              status: 'in-progress',
              storyPoints: 5,
              assignedTo: 'David Kim'
            },
            {
              id: 't31',
              title: 'Dashboard UI Components',
              startDate: new Date('2026-02-24'),
              endDate: new Date('2026-03-03'),
              status: 'planned',
              storyPoints: 8,
              assignedTo: 'Sofia Martinez'
            },
            {
              id: 't32',
              title: 'Settings & Profile Screens',
              startDate: new Date('2026-03-03'),
              endDate: new Date('2026-03-10'),
              status: 'planned',
              storyPoints: 5,
              assignedTo: 'David Kim'
            }
          ]
        },
        {
          id: 'f9',
          name: 'Mobile Testing',
          tickets: [
            {
              id: 't33',
              title: 'iOS Testing - Core Features',
              startDate: new Date('2026-03-17'),
              endDate: new Date('2026-03-24'),
              status: 'planned',
              storyPoints: 8,
              assignedTo: 'Lisa Park'
            },
            {
              id: 't34',
              title: 'Android Testing - Core Features',
              startDate: new Date('2026-03-17'),
              endDate: new Date('2026-03-24'),
              status: 'planned',
              storyPoints: 8,
              assignedTo: 'Tom Zhang'
            },
            {
              id: 't35',
              title: 'Performance Testing',
              startDate: new Date('2026-03-24'),
              endDate: new Date('2026-03-31'),
              status: 'planned',
              storyPoints: 5,
              assignedTo: 'Tom Zhang'
            },
            {
              id: 't36',
              title: 'App Store Submission',
              startDate: new Date('2026-04-14'),
              endDate: new Date('2026-04-21'),
              status: 'planned',
              storyPoints: 3,
              assignedTo: 'Maria Garcia'
            }
          ]
        }
      ],
      sprints: [
        {
          id: 's11',
          name: 'Mobile Sprint 1',
          startDate: new Date('2026-02-10'),
          endDate: new Date('2026-02-24')
        },
        {
          id: 's12',
          name: 'Mobile Sprint 2',
          startDate: new Date('2026-02-24'),
          endDate: new Date('2026-03-10')
        },
        {
          id: 's13',
          name: 'Mobile Sprint 3',
          startDate: new Date('2026-03-10'),
          endDate: new Date('2026-03-24')
        },
        {
          id: 's14',
          name: 'Mobile Sprint 4',
          startDate: new Date('2026-03-24'),
          endDate: new Date('2026-04-07')
        },
        {
          id: 's15',
          name: 'Mobile Sprint 5',
          startDate: new Date('2026-04-07'),
          endDate: new Date('2026-04-21')
        }
      ]
    },
    {
      id: 'r4',
      name: 'v4.0 - Advanced Features',
      startDate: new Date('2026-05-04'),
      endDate: new Date('2026-07-17'),
      features: [
        {
          id: 'f10',
          name: 'Advanced Mobile Features',
          tickets: [
            {
              id: 't37',
              title: 'Biometric Authentication',
              startDate: new Date('2026-05-04'),
              endDate: new Date('2026-05-11'),
              status: 'planned',
              storyPoints: 8,
              assignedTo: 'Sarah Chen'
            },
            // PTO CONFLICT: Maria on vacation
            {
              id: 't38',
              title: 'Camera & Media Integration',
              startDate: new Date('2026-05-25'),
              endDate: new Date('2026-06-01'),
              status: 'planned',
              storyPoints: 8,
              assignedTo: 'Maria Garcia'
            },
            {
              id: 't39',
              title: 'AR Features - Proof of Concept',
              startDate: new Date('2026-06-01'),
              endDate: new Date('2026-06-15'),
              status: 'planned',
              storyPoints: 13,
              assignedTo: 'Maria Garcia'
            }
          ]
        },
        {
          id: 'f11',
          name: 'Mobile Analytics',
          tickets: [
            {
              id: 't40',
              title: 'Event Tracking System',
              startDate: new Date('2026-05-04'),
              endDate: new Date('2026-05-11'),
              status: 'planned',
              storyPoints: 5,
              assignedTo: 'Priya Patel'
            },
            {
              id: 't41',
              title: 'Crash Reporting Integration',
              startDate: new Date('2026-05-11'),
              endDate: new Date('2026-05-18'),
              status: 'planned',
              storyPoints: 3,
              assignedTo: 'Yuki Tanaka'
            }
          ]
        }
      ],
      sprints: [
        {
          id: 's16',
          name: 'Mobile Sprint 6',
          startDate: new Date('2026-05-04'),
          endDate: new Date('2026-05-18')
        },
        {
          id: 's17',
          name: 'Mobile Sprint 7',
          startDate: new Date('2026-05-18'),
          endDate: new Date('2026-06-01')
        },
        {
          id: 's18',
          name: 'Mobile Sprint 8',
          startDate: new Date('2026-06-01'),
          endDate: new Date('2026-06-15')
        },
        {
          id: 's19',
          name: 'Mobile Sprint 9',
          startDate: new Date('2026-06-15'),
          endDate: new Date('2026-06-29')
        },
        {
          id: 's20',
          name: 'Mobile Sprint 10',
          startDate: new Date('2026-06-29'),
          endDate: new Date('2026-07-13')
        }
      ]
    }
  ]
};

// ===========================================
// PRODUCT 3: Analytics & BI Dashboard
// ===========================================
const product3: Product = {
  id: 'p3',
  name: 'Analytics & BI Dashboard',
  releases: [
    {
      id: 'r5',
      name: '2026 Redesign & Feature Expansion',
      startDate: new Date('2026-03-02'),
      endDate: new Date('2026-06-13'),
      features: [
        {
          id: 'f12',
          name: 'Data Visualization',
          tickets: [
            {
              id: 't42',
              title: 'Chart Library Integration',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-09'),
              status: 'in-progress',
              storyPoints: 8,
              assignedTo: 'Elena Zhang'
            },
            {
              id: 't43',
              title: 'Real-time Data Streaming',
              startDate: new Date('2026-03-09'),
              endDate: new Date('2026-03-16'),
              status: 'planned',
              storyPoints: 13,
              assignedTo: 'Priya Patel'
            },
            // PTO CONFLICT: Priya has family event
            {
              id: 't44',
              title: 'Dashboard Builder UI',
              startDate: new Date('2026-03-16'),
              endDate: new Date('2026-03-23'),
              status: 'planned',
              storyPoints: 13,
              assignedTo: 'Priya Patel'
            },
            {
              id: 't45',
              title: 'Custom Report Engine',
              startDate: new Date('2026-03-23'),
              endDate: new Date('2026-03-30'),
              status: 'planned',
              storyPoints: 13,
              assignedTo: 'Yuki Tanaka'
            }
          ]
        },
        {
          id: 'f13',
          name: 'Data Processing',
          tickets: [
            {
              id: 't46',
              title: 'ETL Pipeline Architecture',
              startDate: new Date('2026-03-02'),
              endDate: new Date('2026-03-16'),
              status: 'in-progress',
              storyPoints: 13,
              assignedTo: 'James Wilson'
            },
            // CRITICAL: James has medical PTO during deployment
            {
              id: 't47',
              title: 'Data Warehouse Integration',
              startDate: new Date('2026-03-23'),
              endDate: new Date('2026-03-30'),
              status: 'planned',
              storyPoints: 13,
              assignedTo: 'James Wilson'
            },
            {
              id: 't48',
              title: 'Query Optimization',
              startDate: new Date('2026-03-30'),
              endDate: new Date('2026-04-06'),
              status: 'planned',
              storyPoints: 8,
              assignedTo: 'Alex Thompson'
            }
          ]
        },
        {
          id: 'f14',
          name: 'Analytics Features',
          tickets: [
            {
              id: 't49',
              title: 'Predictive Analytics Module',
              startDate: new Date('2026-04-06'),
              endDate: new Date('2026-04-20'),
              status: 'planned',
              storyPoints: 13,
              assignedTo: 'Priya Patel'
            },
            {
              id: 't50',
              title: 'AI-Powered Insights',
              startDate: new Date('2026-04-20'),
              endDate: new Date('2026-05-04'),
              status: 'planned',
              storyPoints: 13,
              assignedTo: 'Priya Patel'
            },
            {
              id: 't51',
              title: 'Automated Alerting System',
              startDate: new Date('2026-05-04'),
              endDate: new Date('2026-05-11'),
              status: 'planned',
              storyPoints: 8,
              assignedTo: 'Yuki Tanaka'
            },
            {
              id: 't52',
              title: 'Export & Sharing Features',
              startDate: new Date('2026-05-11'),
              endDate: new Date('2026-05-18'),
              status: 'planned',
              storyPoints: 5,
              assignedTo: 'Elena Zhang'
            }
          ]
        },
        {
          id: 'f15',
          name: 'Analytics Testing & QA',
          tickets: [
            {
              id: 't53',
              title: 'Data Accuracy Validation',
              startDate: new Date('2026-05-18'),
              endDate: new Date('2026-05-25'),
              status: 'planned',
              storyPoints: 8,
              assignedTo: 'Lisa Park'
            },
            {
              id: 't54',
              title: 'Performance Load Testing',
              startDate: new Date('2026-05-25'),
              endDate: new Date('2026-06-01'),
              status: 'planned',
              storyPoints: 8,
              assignedTo: 'Tom Zhang'
            },
            {
              id: 't55',
              title: 'UAT & Final Testing',
              startDate: new Date('2026-06-01'),
              endDate: new Date('2026-06-08'),
              status: 'planned',
              storyPoints: 5,
              assignedTo: 'Lisa Park'
            }
          ]
        }
      ],
      sprints: [
        {
          id: 's21',
          name: 'Analytics Sprint 1',
          startDate: new Date('2026-03-02'),
          endDate: new Date('2026-03-13')
        },
        {
          id: 's22',
          name: 'Analytics Sprint 2',
          startDate: new Date('2026-03-16'),
          endDate: new Date('2026-03-27')
        },
        {
          id: 's23',
          name: 'Analytics Sprint 3',
          startDate: new Date('2026-03-30'),
          endDate: new Date('2026-04-10')
        },
        {
          id: 's24',
          name: 'Analytics Sprint 4',
          startDate: new Date('2026-04-13'),
          endDate: new Date('2026-04-24')
        },
        {
          id: 's25',
          name: 'Analytics Sprint 5',
          startDate: new Date('2026-04-27'),
          endDate: new Date('2026-05-08')
        },
        {
          id: 's26',
          name: 'Analytics Sprint 6',
          startDate: new Date('2026-05-11'),
          endDate: new Date('2026-05-22')
        },
        {
          id: 's27',
          name: 'Analytics Sprint 7',
          startDate: new Date('2026-05-25'),
          endDate: new Date('2026-06-05')
        },
        {
          id: 's28',
          name: 'Analytics Sprint 8',
          startDate: new Date('2026-06-08'),
          endDate: new Date('2026-06-19')
        }
      ]
    }
  ]
};

// Combine all products
export const mockProducts: Product[] = [product1, product2, product3];

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
// TEAM MEMBERS (12 total, scoped to products)
// Product 1 (Enterprise SaaS): tm1-tm7, tm9 (8 members)
// Product 2 (Mobile Banking): tm1, tm8-tm12 (6 members) 
// Product 3 (Data Analytics): tm3, tm5-tm7, tm10-tm12 (7 members)
// Some members work across multiple products
// ===========================================
export const mockTeamMembers: TeamMember[] = [
  // --- Product 1: Enterprise SaaS Platform ---
  {
    id: 'tm1',
    name: 'Sarah Chen',
    role: 'Developer',
    notes: 'Senior Full-Stack Engineer, Mobile Expert',
    productId: 'p1',
    pto: [
      {
        id: 'pto1',
        name: 'Spring Break',
        startDate: new Date('2026-03-24'),
        endDate: new Date('2026-03-31')
      }
    ]
  },
  {
    id: 'tm2',
    name: 'Marcus Rivera',
    role: 'Developer',
    notes: 'Backend Specialist, Security Focus',
    productId: 'p1',
    pto: [
      {
        id: 'pto2',
        name: 'Tech Conference',
        startDate: new Date('2026-03-05'),
        endDate: new Date('2026-03-07')
      }
    ]
  },
  {
    id: 'tm3',
    name: 'Elena Zhang',
    role: 'Developer',
    notes: 'Frontend Lead, UI/UX Integration',
    productId: 'p1',
    pto: []
  },
  {
    id: 'tm4',
    name: 'James Wilson',
    role: 'Developer',
    notes: 'DevOps & Infrastructure Lead',
    productId: 'p1',
    pto: [
      {
        id: 'pto3',
        name: 'Medical Appointment',
        startDate: new Date('2026-03-27'),
        endDate: new Date('2026-03-28')
      }
    ]
  },
  {
    id: 'tm5',
    name: 'Priya Patel',
    role: 'Developer',
    notes: 'Data Engineering & Analytics',
    productId: 'p1',
    pto: [
      {
        id: 'pto4',
        name: 'Family Celebration',
        startDate: new Date('2026-03-19'),
        endDate: new Date('2026-03-21')
      }
    ]
  },
  {
    id: 'tm6',
    name: 'Alex Thompson',
    role: 'Developer',
    notes: 'API & Microservices Architecture',
    productId: 'p1',
    pto: []
  },
  {
    id: 'tm7',
    name: 'Yuki Tanaka',
    role: 'Developer',
    notes: 'Full-Stack, Integration Specialist',
    productId: 'p1',
    pto: []
  },
  {
    id: 'tm9',
    name: 'Sofia Martinez',
    role: 'Designer',
    notes: 'Senior Product Designer, Design Systems',
    productId: 'p1',
    pto: [
      {
        id: 'pto6',
        name: 'Design Workshop',
        startDate: new Date('2026-04-14'),
        endDate: new Date('2026-04-16')
      }
    ]
  },
  // --- Product 2: Mobile Banking App ---
  {
    id: 'tm1-p2',
    name: 'Sarah Chen',
    role: 'Developer',
    notes: 'Senior Full-Stack Engineer, Mobile Expert',
    productId: 'p2',
    pto: [
      {
        id: 'pto1-p2',
        name: 'Spring Break',
        startDate: new Date('2026-03-24'),
        endDate: new Date('2026-03-31')
      }
    ]
  },
  {
    id: 'tm8',
    name: 'Maria Garcia',
    role: 'Developer',
    notes: 'Mobile Development Lead (iOS & Android)',
    productId: 'p2',
    pto: [
      {
        id: 'pto5',
        name: 'Vacation',
        startDate: new Date('2026-05-25'),
        endDate: new Date('2026-05-29')
      }
    ]
  },
  {
    id: 'tm9-p2',
    name: 'Sofia Martinez',
    role: 'Designer',
    notes: 'Senior Product Designer, Design Systems',
    productId: 'p2',
    pto: [
      {
        id: 'pto6-p2',
        name: 'Design Workshop',
        startDate: new Date('2026-04-14'),
        endDate: new Date('2026-04-16')
      }
    ]
  },
  {
    id: 'tm10',
    name: 'David Kim',
    role: 'Designer',
    notes: 'UX Researcher & Interaction Designer',
    productId: 'p2',
    pto: []
  },
  {
    id: 'tm11',
    name: 'Lisa Park',
    role: 'QA',
    notes: 'QA Lead, Test Automation',
    productId: 'p2',
    pto: [
      {
        id: 'pto7',
        name: 'Training Course',
        startDate: new Date('2026-04-21'),
        endDate: new Date('2026-04-23')
      }
    ]
  },
  {
    id: 'tm12',
    name: 'Tom Zhang',
    role: 'QA',
    notes: 'Performance & Security Testing',
    productId: 'p2',
    pto: []
  },
  // --- Product 3: Data Analytics Platform ---
  {
    id: 'tm3-p3',
    name: 'Elena Zhang',
    role: 'Developer',
    notes: 'Frontend Lead, UI/UX Integration',
    productId: 'p3',
    pto: []
  },
  {
    id: 'tm5-p3',
    name: 'Priya Patel',
    role: 'Developer',
    notes: 'Data Engineering & Analytics',
    productId: 'p3',
    pto: [
      {
        id: 'pto4-p3',
        name: 'Family Celebration',
        startDate: new Date('2026-03-19'),
        endDate: new Date('2026-03-21')
      }
    ]
  },
  {
    id: 'tm6-p3',
    name: 'Alex Thompson',
    role: 'Developer',
    notes: 'API & Microservices Architecture',
    productId: 'p3',
    pto: []
  },
  {
    id: 'tm7-p3',
    name: 'Yuki Tanaka',
    role: 'Developer',
    notes: 'Full-Stack, Integration Specialist',
    productId: 'p3',
    pto: []
  },
  {
    id: 'tm10-p3',
    name: 'David Kim',
    role: 'Designer',
    notes: 'UX Researcher & Interaction Designer',
    productId: 'p3',
    pto: []
  },
  {
    id: 'tm11-p3',
    name: 'Lisa Park',
    role: 'QA',
    notes: 'QA Lead, Test Automation',
    productId: 'p3',
    pto: [
      {
        id: 'pto7-p3',
        name: 'Training Course',
        startDate: new Date('2026-04-21'),
        endDate: new Date('2026-04-23')
      }
    ]
  },
  {
    id: 'tm12-p3',
    name: 'Tom Zhang',
    role: 'QA',
    notes: 'Performance & Security Testing',
    productId: 'p3',
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
// COMPANY HOLIDAYS (4 key dates)
// ===========================================
export const mockHolidays: Holiday[] = [
  {
    id: 'h1',
    name: 'Presidents\' Day',
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
    name: 'Company All-Hands Meeting',
    startDate: new Date('2026-03-13'),
    endDate: new Date('2026-03-13')
  }
];
