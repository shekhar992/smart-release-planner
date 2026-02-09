export interface TeamMember {
  id: string;
  name: string;
  role: 'Developer' | 'Designer' | 'QA';
}

export interface Ticket {
  id: string;
  name: string;
  storyPoints: number;
  startDate: Date;
  developerId?: string;
  featureId: string;
}

export interface Feature {
  id: string;
  name: string;
  releaseId: string;
  collapsed?: boolean;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  releaseId: string;
}

export interface Release {
  id: string;
  name: string;
  startDate: Date;
  targetEndDate: Date;
}

export interface AppData {
  releases: Release[];
  features: Feature[];
  tickets: Ticket[];
  sprints: Sprint[];
  teamMembers: TeamMember[];
  settings: {
    storyPointToDays: number; // 1 story point = X days
  };
}
