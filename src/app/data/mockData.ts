export interface Ticket {
  id: string;
  title: string;
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
}

export interface Holiday {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

export const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'GenAI Chatbot & SAMD Mobile App',
    releases: [
      {
        id: 'r1',
        name: 'Q1 2026 Sprint Planning',
        startDate: new Date('2026-02-09'),
        endDate: new Date('2026-04-03'),
        features: [
          {
            id: 'f1',
            name: 'GenAI Chatbot (Web)',
            tickets: [
              // Sprint 1
              {
                id: 't1',
                title: 'LLM Integration Architecture',
                startDate: new Date('2026-02-09'),
                endDate: new Date('2026-02-13'),
                status: 'in-progress',
                storyPoints: 8,
                assignedTo: 'Marcus Rivera'
              },
              {
                id: 't2',
                title: 'Chat UI Components',
                startDate: new Date('2026-02-09'),
                endDate: new Date('2026-02-16'),
                status: 'in-progress',
                storyPoints: 5,
                assignedTo: 'Elena Zhang'
              },
              {
                id: 't3',
                title: 'Streaming Response Handler',
                startDate: new Date('2026-02-16'),
                endDate: new Date('2026-02-20'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'Marcus Rivera'
              },
              // CONFLICT: Marcus has overlapping task
              {
                id: 't3a',
                title: 'API Rate Limiting',
                startDate: new Date('2026-02-10'),
                endDate: new Date('2026-02-14'),
                status: 'planned',
                storyPoints: 3,
                assignedTo: 'Marcus Rivera'
              },
              // Sprint 2
              {
                id: 't4',
                title: 'Context Management System',
                startDate: new Date('2026-02-23'),
                endDate: new Date('2026-03-02'),
                status: 'planned',
                storyPoints: 8,
                assignedTo: 'Priya Patel'
              },
              {
                id: 't5',
                title: 'Prompt Engineering Module',
                startDate: new Date('2026-02-23'),
                endDate: new Date('2026-02-27'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'Kenji Nakamura'
              },
              {
                id: 't6',
                title: 'Conversation History API',
                startDate: new Date('2026-03-02'),
                endDate: new Date('2026-03-06'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'Marcus Rivera'
              },
              // Sprint 3
              {
                id: 't7',
                title: 'RAG Pipeline Integration',
                startDate: new Date('2026-03-09'),
                endDate: new Date('2026-03-16'),
                status: 'planned',
                storyPoints: 13,
                assignedTo: 'Kenji Nakamura'
              },
              {
                id: 't8',
                title: 'Token Usage Monitoring',
                startDate: new Date('2026-03-09'),
                endDate: new Date('2026-03-13'),
                status: 'planned',
                storyPoints: 3,
                assignedTo: 'Priya Patel'
              },
              // Sprint 4
              {
                id: 't9',
                title: 'Error Recovery & Fallbacks',
                startDate: new Date('2026-03-23'),
                endDate: new Date('2026-03-27'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'Marcus Rivera'
              },
              {
                id: 't10',
                title: 'Chat Export Feature',
                startDate: new Date('2026-03-30'),
                endDate: new Date('2026-04-03'),
                status: 'planned',
                storyPoints: 3,
                assignedTo: 'Elena Zhang'
              }
            ]
          },
          {
            id: 'f2',
            name: 'SAMD Mobile Application',
            tickets: [
              // Sprint 1
              {
                id: 't11',
                title: 'Medical Device Authorization Flow',
                startDate: new Date('2026-02-09'),
                endDate: new Date('2026-02-16'),
                status: 'in-progress',
                storyPoints: 8,
                assignedTo: 'Jin Park'
              },
              // CONFLICT: Elena has overlapping task with t2
              {
                id: 't11a',
                title: 'Mobile UI Design Review',
                startDate: new Date('2026-02-12'),
                endDate: new Date('2026-02-18'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'Elena Zhang'
              },
              {
                id: 't12',
                title: 'Patient Data Encryption',
                startDate: new Date('2026-02-16'),
                endDate: new Date('2026-02-20'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'Jin Park'
              },
              // Sprint 2
              {
                id: 't13',
                title: 'Biometric Authentication',
                startDate: new Date('2026-02-23'),
                endDate: new Date('2026-03-02'),
                status: 'planned',
                storyPoints: 8,
                assignedTo: 'Sofia Torres'
              },
              {
                id: 't14',
                title: 'HIPAA Compliance Audit Logs',
                startDate: new Date('2026-03-02'),
                endDate: new Date('2026-03-06'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'Marcus Rivera'
              },
              // Sprint 3
              {
                id: 't15',
                title: 'Vital Signs Dashboard',
                startDate: new Date('2026-03-09'),
                endDate: new Date('2026-03-16'),
                status: 'planned',
                storyPoints: 8,
                assignedTo: 'Sofia Torres'
              },
              {
                id: 't16',
                title: 'Offline Data Sync',
                startDate: new Date('2026-03-16'),
                endDate: new Date('2026-03-20'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'Jin Park'
              },
              // Sprint 4
              {
                id: 't17',
                title: 'Push Notification System',
                startDate: new Date('2026-03-23'),
                endDate: new Date('2026-03-27'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'Sofia Torres'
              },
              {
                id: 't18',
                title: 'Emergency Alert Protocol',
                startDate: new Date('2026-03-30'),
                endDate: new Date('2026-04-03'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'Jin Park'
              }
            ]
          },
          {
            id: 'f3',
            name: 'Design',
            tickets: [
              // Sprint 1
              {
                id: 't19',
                title: 'Chat Interface Design System',
                startDate: new Date('2026-02-09'),
                endDate: new Date('2026-02-13'),
                status: 'completed',
                storyPoints: 5,
                assignedTo: 'Aisha Williams'
              },
              // Sprint 2
              {
                id: 't20',
                title: 'Mobile App UI/UX Mockups',
                startDate: new Date('2026-02-23'),
                endDate: new Date('2026-03-02'),
                status: 'planned',
                storyPoints: 8,
                assignedTo: 'Aisha Williams'
              },
              // Sprint 3
              {
                id: 't21',
                title: 'Accessibility Audit',
                startDate: new Date('2026-03-09'),
                endDate: new Date('2026-03-13'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'Aisha Williams'
              }
            ]
          },
          {
            id: 'f4',
            name: 'QA',
            tickets: [
              // Sprint 2
              {
                id: 't22',
                title: 'Chatbot E2E Test Suite',
                startDate: new Date('2026-03-02'),
                endDate: new Date('2026-03-06'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'Omar Hassan'
              },
              // Sprint 3
              {
                id: 't23',
                title: 'Mobile Security Testing',
                startDate: new Date('2026-03-16'),
                endDate: new Date('2026-03-20'),
                status: 'planned',
                storyPoints: 5,
                assignedTo: 'Yuki Tanaka'
              },
              // Sprint 4
              {
                id: 't24',
                title: 'Performance & Load Testing',
                startDate: new Date('2026-03-23'),
                endDate: new Date('2026-03-31'),
                status: 'planned',
                storyPoints: 8,
                assignedTo: 'Omar Hassan'
              }
            ]
          }
        ],
        sprints: [
          {
            id: 's1',
            name: 'Sprint 1',
            startDate: new Date('2026-02-09'),
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
            endDate: new Date('2026-04-03')
          }
        ]
      }
    ]
  },
  {
    id: 'p2',
    name: 'Customer Portal',
    releases: [
      {
        id: 'r2',
        name: 'Q1 2026 Release',
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-03-31'),
        features: [
          {
            id: 'f5',
            name: 'User Authentication',
            tickets: [
              {
                id: 't25',
                title: 'Design login flow',
                startDate: new Date('2026-01-06'),
                endDate: new Date('2026-01-10'),
                status: 'completed',
                storyPoints: 5,
                assignedTo: 'Aisha Williams'
              },
              {
                id: 't26',
                title: 'Implement OAuth integration',
                startDate: new Date('2026-01-13'),
                endDate: new Date('2026-01-24'),
                status: 'completed',
                storyPoints: 8,
                assignedTo: 'Priya Patel'
              }
            ]
          }
        ],
        sprints: [
          {
            id: 's5',
            name: 'Sprint 1',
            startDate: new Date('2026-01-05'),
            endDate: new Date('2026-01-26')
          }
        ]
      }
    ]
  }
];

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

export const mockTeamMembers: TeamMember[] = [
  {
    id: 'tm1',
    name: 'Marcus Rivera',
    role: 'Developer',
    notes: 'Backend Engineer - Python, Node.js, ML Infrastructure',
    pto: [
      {
        id: 'pto1',
        name: 'Family Vacation',
        startDate: new Date('2026-03-16'),
        endDate: new Date('2026-03-20')
      }
    ]
  },
  {
    id: 'tm2',
    name: 'Elena Zhang',
    role: 'Developer',
    notes: 'Frontend Engineer - React, TypeScript, Design Systems',
    pto: []
  },
  {
    id: 'tm3',
    name: 'Priya Patel',
    role: 'Developer',
    notes: 'Full-Stack Engineer - API Design, Database Architecture',
    pto: [
      {
        id: 'pto2',
        name: 'Medical Appointment',
        startDate: new Date('2026-02-27'),
        endDate: new Date('2026-02-27')
      }
    ]
  },
  {
    id: 'tm4',
    name: 'Jin Park',
    role: 'Developer',
    notes: 'Mobile Engineer - iOS, Android, React Native',
    pto: []
  },
  {
    id: 'tm5',
    name: 'Sofia Torres',
    role: 'Developer',
    notes: 'Mobile Engineer - Flutter, Native Mobile Development',
    pto: [
      {
        id: 'pto3',
        name: 'Conference',
        startDate: new Date('2026-03-30'),
        endDate: new Date('2026-04-03')
      }
    ]
  },
  {
    id: 'tm6',
    name: 'Kenji Nakamura',
    role: 'Developer',
    notes: 'ML Engineer - NLP, LLM Fine-tuning, Vector Databases',
    pto: []
  },
  {
    id: 'tm7',
    name: 'Aisha Williams',
    role: 'Designer',
    notes: 'Product Designer - UI/UX, Design Systems, User Research',
    pto: [
      {
        id: 'pto4',
        name: 'Workshop',
        startDate: new Date('2026-02-16'),
        endDate: new Date('2026-02-17')
      }
    ]
  },
  {
    id: 'tm8',
    name: 'Omar Hassan',
    role: 'QA',
    notes: 'QA Engineer - Automation, Performance Testing',
    pto: []
  },
  {
    id: 'tm9',
    name: 'Yuki Tanaka',
    role: 'QA',
    notes: 'QA Engineer - Security Testing, Compliance Validation',
    pto: [
      {
        id: 'pto5',
        name: 'Personal Day',
        startDate: new Date('2026-03-13'),
        endDate: new Date('2026-03-13')
      }
    ]
  },
  {
    id: 'tm10',
    name: 'Chen Wei',
    role: 'Developer',
    notes: 'DevOps Engineer - CI/CD, Cloud Infrastructure, Monitoring',
    pto: []
  }
];

export const mockHolidays: Holiday[] = [
  {
    id: 'h1',
    name: 'New Year\'s Day',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-01')
  },
  {
    id: 'h2',
    name: 'Martin Luther King Jr. Day',
    startDate: new Date('2026-01-19'),
    endDate: new Date('2026-01-19')
  },
  {
    id: 'h3',
    name: 'Presidents\' Day',
    startDate: new Date('2026-02-16'),
    endDate: new Date('2026-02-16')
  },
  {
    id: 'h4',
    name: 'Memorial Day',
    startDate: new Date('2026-05-25'),
    endDate: new Date('2026-05-25')
  },
  {
    id: 'h5',
    name: 'Independence Day',
    startDate: new Date('2026-07-04'),
    endDate: new Date('2026-07-04')
  },
  {
    id: 'h6',
    name: 'Labor Day',
    startDate: new Date('2026-09-07'),
    endDate: new Date('2026-09-07')
  },
  {
    id: 'h7',
    name: 'Thanksgiving',
    startDate: new Date('2026-11-26'),
    endDate: new Date('2026-11-27')
  },
  {
    id: 'h8',
    name: 'Year-End Shutdown',
    startDate: new Date('2026-12-24'),
    endDate: new Date('2026-12-31')
  }
];