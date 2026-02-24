/**
 * Role Color Configuration
 * 
 * Manages color assignments for different team roles.
 * Users can customize these colors via settings.
 */

export type TeamRole = 
  | 'Frontend' 
  | 'Backend' 
  | 'Fullstack' 
  | 'QA' 
  | 'Designer' 
  | 'DataEngineer' 
  | 'iOS' 
  | 'Android'
  | 'Developer'; // Legacy role (maps to Fullstack)

export interface RoleColorConfig {
  Frontend: string;
  Backend: string;
  Fullstack: string;
  QA: string;
  Designer: string;
  DataEngineer: string;
  iOS: string;
  Android: string;
}

/**
 * Default role color presets (industry-standard conventions)
 */
export const DEFAULT_ROLE_COLORS: RoleColorConfig = {
  Frontend: '#3B82F6',     // Blue - UI/Frontend standard
  Backend: '#8B5CF6',      // Purple - Server-side
  Fullstack: '#6366F1',    // Indigo - Blend of FE+BE
  QA: '#F59E0B',           // Orange - Testing/caution
  Designer: '#EC4899',     // Pink - Creative/artistic
  DataEngineer: '#10B981', // Emerald - Data/growth
  iOS: '#6B7280',          // Gray - Apple aesthetic
  Android: '#84CC16',      // Lime - Android brand
};

/**
 * LocalStorage key for user's custom role colors
 */
const ROLE_COLORS_STORAGE_KEY = 'release-planner-role-colors';

/**
 * Load role colors from localStorage or return defaults
 */
export function loadRoleColors(): RoleColorConfig {
  try {
    const stored = localStorage.getItem(ROLE_COLORS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle new roles added in updates
      return { ...DEFAULT_ROLE_COLORS, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load role colors from localStorage:', error);
  }
  return DEFAULT_ROLE_COLORS;
}

/**
 * Save role colors to localStorage
 */
export function saveRoleColors(colors: RoleColorConfig): void {
  try {
    localStorage.setItem(ROLE_COLORS_STORAGE_KEY, JSON.stringify(colors));
  } catch (error) {
    console.error('Failed to save role colors to localStorage:', error);
  }
}

/**
 * Reset role colors to defaults
 */
export function resetRoleColors(): RoleColorConfig {
  try {
    localStorage.removeItem(ROLE_COLORS_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to reset role colors:', error);
  }
  return DEFAULT_ROLE_COLORS;
}

/**
 * Get color for a specific role
 * Handles legacy "Developer" role by mapping to Fullstack
 */
export function getRoleColor(role: TeamRole | string, colors?: RoleColorConfig): string {
  const colorConfig = colors || loadRoleColors();
  
  // Handle legacy "Developer" role
  if (role === 'Developer') {
    return colorConfig.Fullstack;
  }
  
  // Return color if exists, otherwise default to gray
  return (colorConfig as any)[role] || '#6B7280';
}

/**
 * Get all available roles
 */
export function getAllRoles(): TeamRole[] {
  return [
    'Frontend',
    'Backend',
    'Fullstack',
    'QA',
    'Designer',
    'DataEngineer',
    'iOS',
    'Android',
  ];
}

/**
 * Check if a role is mobile-specific
 */
export function isMobileRole(role: TeamRole): boolean {
  return role === 'iOS' || role === 'Android';
}

/**
 * Check if a role is web-specific
 */
export function isWebRole(role: TeamRole): boolean {
  return role === 'Frontend' || role === 'Backend' || role === 'Fullstack';
}
