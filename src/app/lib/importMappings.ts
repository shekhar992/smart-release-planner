/**
 * Import Mappings and Validators
 * Defines CSV column mappings for each entity type
 */

import { ColumnMapping, transformers, validators } from './csvParser';
import { Ticket, TeamMember, Feature, Sprint, Release } from '../data/mockData';

/**
 * Ticket Import Mapping
 * Required columns: title, assignedTo
 * Optional columns: epic/feature, effortDays, storyPoints, priority, description, id, startDate, endDate, status
 * Note: id, startDate, endDate, status are auto-generated if missing
 */
export const ticketImportMapping: ColumnMapping[] = [
  {
    csvColumn: 'id',
    dataField: 'id',
    required: false, // Auto-generated if missing
    transformer: transformers.toString,
    validator: validators.isNotEmpty
  },
  {
    csvColumn: 'title',
    dataField: 'title',
    required: true,
    transformer: transformers.toString,
    validator: validators.isNotEmpty
  },
  {
    csvColumn: 'startDate',
    dataField: 'startDate',
    required: false, // Auto-generated if missing
    transformer: transformers.toDate,
    validator: validators.isDate
  },
  {
    csvColumn: 'endDate',
    dataField: 'endDate',
    required: false, // Auto-generated if missing
    transformer: transformers.toDate,
    validator: validators.isDate
  },
  {
    csvColumn: 'status',
    dataField: 'status',
    required: false, // Defaults to 'planned'
    transformer: transformers.toEnum(['planned', 'in-progress', 'completed']),
    validator: (value) => ['planned', 'in-progress', 'completed'].includes(value)
  },
  {
    csvColumn: 'effortDays',
    dataField: 'effortDays',
    required: false, // Optional - can use storyPoints as fallback
    transformer: transformers.toNumber,
    validator: validators.isPositive
  },
  {
    csvColumn: 'storyPoints',
    dataField: 'storyPoints',
    required: false, // Optional - backward compatibility
    transformer: transformers.toNumber,
    validator: validators.isPositive
  },
  {
    csvColumn: 'assignedTo',
    dataField: 'assignedTo',
    required: true,
    transformer: transformers.toString,
    validator: validators.isNotEmpty
  },
  {
    csvColumn: 'priority',
    dataField: 'priority',
    required: false,
    transformer: transformers.toString,
  },
  {
    csvColumn: 'description',
    dataField: 'description',
    required: false,
    transformer: transformers.toString,
  },
  {
    csvColumn: 'feature',
    dataField: 'feature',
    required: false,
    transformer: transformers.toString,
  },
  {
    csvColumn: 'epic',
    dataField: 'feature', // Map 'epic' to 'feature' field
    required: false,
    transformer: transformers.toString,
  },
  {
    csvColumn: 'requiredRole',
    dataField: 'requiredRole',
    required: false,
    transformer: transformers.toEnum(['Frontend', 'Backend', 'Fullstack', 'QA', 'Designer', 'DataEngineer', 'iOS', 'Android']),
    validator: (value) => !value || ['Frontend', 'Backend', 'Fullstack', 'QA', 'Designer', 'DataEngineer', 'iOS', 'Android'].includes(value)
  },
  {
    csvColumn: 'blockedBy',
    dataField: 'blockedBy',
    required: false,
    transformer: (value: any): string[] => {
      if (!value || !value.trim()) return [];
      // Split by comma and trim each ID
      return value.toString().split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
    },
  }
];

/**
 * Team Member Import Mapping
 * Required columns: name, role
 * Optional: experienceLevel (defaults to 'Mid')
 */
export const teamMemberImportMapping: ColumnMapping[] = [
  {
    csvColumn: 'name',
    dataField: 'name',
    required: true,
    transformer: transformers.toString,
    validator: validators.isNotEmpty
  },
  {
    csvColumn: 'role',
    dataField: 'role',
    required: true,
    transformer: transformers.toEnum(['Developer', 'Designer', 'QA', 'Frontend', 'Backend', 'Fullstack', 'DataEngineer', 'iOS', 'Android']),
    validator: (value) => ['Developer', 'Designer', 'QA', 'Frontend', 'Backend', 'Fullstack', 'DataEngineer', 'iOS', 'Android'].includes(value)
  },
  {
    csvColumn: 'experienceLevel',
    dataField: 'experienceLevel',
    required: false,
    transformer: (value: any): string => {
      if (!value || !value.trim()) return 'Mid';
      const normalized = value.trim();
      const firstChar = normalized.charAt(0).toUpperCase();
      const rest = normalized.slice(1).toLowerCase();
      return firstChar + rest; // Capitalize first letter
    },
    validator: (value) => ['Junior', 'Mid', 'Senior', 'Lead'].includes(value)
  }
];

/**
 * Derive velocity multiplier from experience level
 * Used during CSV import to automatically calculate velocity
 */
export const deriveVelocityMultiplier = (experienceLevel?: string): number => {
  switch (experienceLevel?.toLowerCase()) {
    case 'junior':
      return 0.7;
    case 'senior':
      return 1.3;
    case 'lead':
      return 1.5;
    case 'mid':
    default:
      return 1.0;
  }
};

/**
 * Feature Import Mapping
 * Required columns: id, name
 */
export const featureImportMapping: ColumnMapping[] = [
  {
    csvColumn: 'id',
    dataField: 'id',
    required: true,
    transformer: transformers.toString,
    validator: validators.isNotEmpty
  },
  {
    csvColumn: 'name',
    dataField: 'name',
    required: true,
    transformer: transformers.toString,
    validator: validators.isNotEmpty
  }
];

/**
 * Sprint Import Mapping
 * Required columns: id, name, startDate, endDate
 */
export const sprintImportMapping: ColumnMapping[] = [
  {
    csvColumn: 'id',
    dataField: 'id',
    required: true,
    transformer: transformers.toString,
    validator: validators.isNotEmpty
  },
  {
    csvColumn: 'name',
    dataField: 'name',
    required: true,
    transformer: transformers.toString,
    validator: validators.isNotEmpty
  },
  {
    csvColumn: 'startDate',
    dataField: 'startDate',
    required: true,
    transformer: transformers.toDate,
    validator: validators.isDate
  },
  {
    csvColumn: 'endDate',
    dataField: 'endDate',
    required: true,
    transformer: transformers.toDate,
    validator: validators.isDate
  }
];

/**
 * Release Import Mapping
 * Required columns: id, name, startDate, endDate
 */
export const releaseImportMapping: ColumnMapping[] = [
  {
    csvColumn: 'id',
    dataField: 'id',
    required: true,
    transformer: transformers.toString,
    validator: validators.isNotEmpty
  },
  {
    csvColumn: 'name',
    dataField: 'name',
    required: true,
    transformer: transformers.toString,
    validator: validators.isNotEmpty
  },
  {
    csvColumn: 'startDate',
    dataField: 'startDate',
    required: true,
    transformer: transformers.toDate,
    validator: validators.isDate
  },
  {
    csvColumn: 'endDate',
    dataField: 'endDate',
    required: true,
    transformer: transformers.toDate,
    validator: validators.isDate
  }
];

/**
 * PTO Entry Import Mapping
 * Required columns: id, name, startDate, endDate
 */
export const ptoImportMapping: ColumnMapping[] = [
  {
    csvColumn: 'id',
    dataField: 'id',
    required: true,
    transformer: transformers.toString,
    validator: validators.isNotEmpty
  },
  {
    csvColumn: 'name',
    dataField: 'name',
    required: true,
    transformer: transformers.toString,
    validator: validators.isNotEmpty
  },
  {
    csvColumn: 'startDate',
    dataField: 'startDate',
    required: true,
    transformer: transformers.toDate,
    validator: validators.isDate
  },
  {
    csvColumn: 'endDate',
    dataField: 'endDate',
    required: true,
    transformer: transformers.toDate,
    validator: validators.isDate
  }
];

/**
 * Holiday Import Mapping
 * Required columns: id, name, startDate, endDate
 */
export const holidayImportMapping: ColumnMapping[] = [
  {
    csvColumn: 'id',
    dataField: 'id',
    required: true,
    transformer: transformers.toString,
    validator: validators.isNotEmpty
  },
  {
    csvColumn: 'name',
    dataField: 'name',
    required: true,
    transformer: transformers.toString,
    validator: validators.isNotEmpty
  },
  {
    csvColumn: 'startDate',
    dataField: 'startDate',
    required: true,
    transformer: transformers.toDate,
    validator: validators.isDate
  },
  {
    csvColumn: 'endDate',
    dataField: 'endDate',
    required: true,
    transformer: transformers.toDate,
    validator: validators.isDate
  }
];

/**
 * Entity type definitions for import wizard
 */
export type ImportEntityType = 
  | 'tickets'
  | 'team-members'
  | 'features'
  | 'sprints'
  | 'releases'
  | 'pto'
  | 'holidays';

export const entityTypeConfig = {
  tickets: {
    label: 'Tickets',
    description: 'Import work items/tasks with assignments and dates',
    icon: '📋',
    mapping: ticketImportMapping,
    exampleFilename: 'tickets-template.csv'
  },
  'team-members': {
    label: 'Team Members',
    description: 'Import developers, designers, and QA engineers',
    icon: '👥',
    mapping: teamMemberImportMapping,
    exampleFilename: 'team-members-template.csv'
  },
  features: {
    label: 'Features',
    description: 'Import feature groupings for organizing tickets',
    icon: '🎯',
    mapping: featureImportMapping,
    exampleFilename: 'features-template.csv'
  },
  sprints: {
    label: 'Sprints',
    description: 'Import sprint/iteration definitions with date ranges',
    icon: '🏃',
    mapping: sprintImportMapping,
    exampleFilename: 'sprints-template.csv'
  },
  releases: {
    label: 'Releases',
    description: 'Import release milestones and timelines',
    icon: '🚀',
    mapping: releaseImportMapping,
    exampleFilename: 'releases-template.csv'
  },
  pto: {
    label: 'PTO/Leave',
    description: 'Import time-off and vacation schedules',
    icon: '🌴',
    mapping: ptoImportMapping,
    exampleFilename: 'pto-template.csv'
  },
  holidays: {
    label: 'Holidays',
    description: 'Import company holidays and non-working days',
    icon: '🎉',
    mapping: holidayImportMapping,
    exampleFilename: 'holidays-template.csv'
  }
};

/**
 * Validate relationships between imported entities
 */
export const validateRelationships = (
  entityType: ImportEntityType,
  data: any[],
  existingData: {
    tickets?: Ticket[];
    teamMembers?: TeamMember[];
    features?: Feature[];
    sprints?: Sprint[];
    releases?: Release[];
  }
): string[] => {
  const warnings: string[] = [];
  
  switch (entityType) {
    case 'tickets':
      // Validate assigned developer exists
      if (existingData.teamMembers) {
        const teamMemberNames = new Set(existingData.teamMembers.map(tm => tm.name));
        data.forEach((ticket, index) => {
          if (!teamMemberNames.has(ticket.assignedTo)) {
            warnings.push(
              `Row ${index + 2}: Developer "${ticket.assignedTo}" not found in team members`
            );
          }
        });
      }
      
      // Validate dates are logical
      data.forEach((ticket, index) => {
        if (ticket.endDate < ticket.startDate) {
          warnings.push(
            `Row ${index + 2}: End date (${ticket.endDate.toISOString().split('T')[0]}) is before start date (${ticket.startDate.toISOString().split('T')[0]})`
          );
        }
      });
      break;
      
    case 'sprints':
    case 'releases':
    case 'pto':
    case 'holidays':
      // Validate date ranges
      data.forEach((item, index) => {
        if (item.endDate < item.startDate) {
          warnings.push(
            `Row ${index + 2}: End date is before start date`
          );
        }
      });
      break;
  }
  
  return warnings;
};
