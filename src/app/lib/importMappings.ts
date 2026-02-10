/**
 * Import Mappings and Validators
 * Defines CSV column mappings for each entity type
 */

import { ColumnMapping, transformers, validators } from './csvParser';
import { Ticket, TeamMember, Feature, Sprint, Release } from '../data/mockData';

/**
 * Ticket Import Mapping
 * Required columns: id, title, startDate, endDate, status, storyPoints, assignedTo
 */
export const ticketImportMapping: ColumnMapping[] = [
  {
    csvColumn: 'id',
    dataField: 'id',
    required: true,
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
  },
  {
    csvColumn: 'status',
    dataField: 'status',
    required: true,
    transformer: transformers.toEnum(['planned', 'in-progress', 'completed']),
    validator: (value) => ['planned', 'in-progress', 'completed'].includes(value)
  },
  {
    csvColumn: 'storyPoints',
    dataField: 'storyPoints',
    required: true,
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
  }
];

/**
 * Team Member Import Mapping
 * Required columns: id, name, role
 * Optional: notes
 */
export const teamMemberImportMapping: ColumnMapping[] = [
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
    csvColumn: 'role',
    dataField: 'role',
    required: true,
    transformer: transformers.toEnum(['Developer', 'Designer', 'QA']),
    validator: (value) => ['Developer', 'Designer', 'QA'].includes(value)
  },
  {
    csvColumn: 'notes',
    dataField: 'notes',
    required: false,
    transformer: transformers.toString
  }
];

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
