import { AppData, Release, Feature, Ticket, Sprint, TeamMember } from './types';
import { deserializeDate, serializeDate } from './dateUtils';

const STORAGE_KEY = 'release-planning-data';

const DEFAULT_DATA: AppData = {
  releases: [],
  features: [],
  tickets: [],
  sprints: [],
  teamMembers: [],
  settings: {
    storyPointToDays: 1, // Default: 1 story point = 1 day
  },
};

/**
 * Load data from localStorage
 */
export function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_DATA;

    const parsed = JSON.parse(stored);

    // Deserialize dates
    return {
      ...parsed,
      releases: parsed.releases.map((r: any) => ({
        ...r,
        startDate: deserializeDate(r.startDate),
        targetEndDate: deserializeDate(r.targetEndDate),
      })),
      tickets: parsed.tickets.map((t: any) => ({
        ...t,
        startDate: deserializeDate(t.startDate),
      })),
      sprints: parsed.sprints.map((s: any) => ({
        ...s,
        startDate: deserializeDate(s.startDate),
        endDate: deserializeDate(s.endDate),
      })),
    };
  } catch (error) {
    console.error('Failed to load data:', error);
    return DEFAULT_DATA;
  }
}

/**
 * Save data to localStorage
 */
export function saveData(data: AppData): void {
  try {
    // Serialize dates
    const toSave = {
      ...data,
      releases: data.releases.map((r) => ({
        ...r,
        startDate: serializeDate(r.startDate),
        targetEndDate: serializeDate(r.targetEndDate),
      })),
      tickets: data.tickets.map((t) => ({
        ...t,
        startDate: serializeDate(t.startDate),
      })),
      sprints: data.sprints.map((s) => ({
        ...s,
        startDate: serializeDate(s.startDate),
        endDate: serializeDate(s.endDate),
      })),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error('Failed to save data:', error);
  }
}

// Helper functions for CRUD operations
export function createRelease(data: AppData, release: Release): AppData {
  const newData = {
    ...data,
    releases: [...data.releases, release],
  };
  saveData(newData);
  return newData;
}

export function updateRelease(data: AppData, releaseId: string, updates: Partial<Release>): AppData {
  const newData = {
    ...data,
    releases: data.releases.map((r) => (r.id === releaseId ? { ...r, ...updates } : r)),
  };
  saveData(newData);
  return newData;
}

export function deleteRelease(data: AppData, releaseId: string): AppData {
  const newData = {
    ...data,
    releases: data.releases.filter((r) => r.id !== releaseId),
    features: data.features.filter((f) => f.releaseId !== releaseId),
    tickets: data.tickets.filter((t) => {
      const feature = data.features.find((f) => f.id === t.featureId);
      return feature?.releaseId !== releaseId;
    }),
    sprints: data.sprints.filter((s) => s.releaseId !== releaseId),
  };
  saveData(newData);
  return newData;
}

export function createFeature(data: AppData, feature: Feature): AppData {
  const newData = {
    ...data,
    features: [...data.features, feature],
  };
  saveData(newData);
  return newData;
}

export function updateFeature(data: AppData, featureId: string, updates: Partial<Feature>): AppData {
  const newData = {
    ...data,
    features: data.features.map((f) => (f.id === featureId ? { ...f, ...updates } : f)),
  };
  saveData(newData);
  return newData;
}

export function deleteFeature(data: AppData, featureId: string): AppData {
  const newData = {
    ...data,
    features: data.features.filter((f) => f.id !== featureId),
    tickets: data.tickets.filter((t) => t.featureId !== featureId),
  };
  saveData(newData);
  return newData;
}

export function createTicket(data: AppData, ticket: Ticket): AppData {
  const newData = {
    ...data,
    tickets: [...data.tickets, ticket],
  };
  saveData(newData);
  return newData;
}

export function updateTicket(data: AppData, ticketId: string, updates: Partial<Ticket>): AppData {
  const newData = {
    ...data,
    tickets: data.tickets.map((t) => (t.id === ticketId ? { ...t, ...updates } : t)),
  };
  saveData(newData);
  return newData;
}

export function deleteTicket(data: AppData, ticketId: string): AppData {
  const newData = {
    ...data,
    tickets: data.tickets.filter((t) => t.id !== ticketId),
  };
  saveData(newData);
  return newData;
}

export function createSprint(data: AppData, sprint: Sprint): AppData {
  const newData = {
    ...data,
    sprints: [...data.sprints, sprint],
  };
  saveData(newData);
  return newData;
}

export function updateSprint(data: AppData, sprintId: string, updates: Partial<Sprint>): AppData {
  const newData = {
    ...data,
    sprints: data.sprints.map((s) => (s.id === sprintId ? { ...s, ...updates } : s)),
  };
  saveData(newData);
  return newData;
}

export function deleteSprint(data: AppData, sprintId: string): AppData {
  const newData = {
    ...data,
    sprints: data.sprints.filter((s) => s.id !== sprintId),
  };
  saveData(newData);
  return newData;
}

export function createTeamMember(data: AppData, member: TeamMember): AppData {
  const newData = {
    ...data,
    teamMembers: [...data.teamMembers, member],
  };
  saveData(newData);
  return newData;
}

export function updateTeamMember(data: AppData, memberId: string, updates: Partial<TeamMember>): AppData {
  const newData = {
    ...data,
    teamMembers: data.teamMembers.map((m) => (m.id === memberId ? { ...m, ...updates } : m)),
  };
  saveData(newData);
  return newData;
}

export function deleteTeamMember(data: AppData, memberId: string): AppData {
  const newData = {
    ...data,
    teamMembers: data.teamMembers.filter((m) => m.id !== memberId),
    tickets: data.tickets.map((t) => (t.developerId === memberId ? { ...t, developerId: undefined } : t)),
  };
  saveData(newData);
  return newData;
}

export function updateSettings(data: AppData, settings: Partial<AppData['settings']>): AppData {
  const newData = {
    ...data,
    settings: { ...data.settings, ...settings },
  };
  saveData(newData);
  return newData;
}
