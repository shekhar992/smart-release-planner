/**
 * Local Storage utility for persisting sprint planning data
 * Handles serialization/deserialization with proper date handling
 */

import { Product, Release, Ticket, Holiday, TeamMember, Milestone, Phase } from '../data/mockData';

// Data version - increment this to force refresh of all localStorage data
const DATA_VERSION = '4.0.0'; // Updated for new FinTech + Life Sciences mock data

const STORAGE_KEYS = {
  PRODUCTS: 'timeline_view_products',
  HOLIDAYS: 'timeline_view_holidays',
  TEAM_MEMBERS: 'timeline_view_team_members',
  LAST_UPDATED: 'timeline_view_last_updated',
  DATA_VERSION: 'timeline_view_data_version',
} as const;

/**
 * Recursively converts date strings back to Date objects
 */
function reviveDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Check if string matches ISO date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (dateRegex.test(obj)) {
      return new Date(obj);
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => reviveDates(item));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (key === 'startDate' || key === 'endDate') {
        result[key] = new Date(obj[key]);
      } else {
        result[key] = reviveDates(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}

/**
 * Save products to localStorage
 */
export function saveProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
  } catch (error) {
    console.error('Failed to save products to localStorage:', error);
  }
}

/**
 * Load products from localStorage
 */
export function loadProducts(): Product[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    return reviveDates(parsed);
  } catch (error) {
    console.error('Failed to load products from localStorage:', error);
    return null;
  }
}

/**
 * Save holidays to localStorage
 */
export function saveHolidays(holidays: Holiday[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(holidays));
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
  } catch (error) {
    console.error('Failed to save holidays to localStorage:', error);
  }
}

/**
 * Load holidays from localStorage
 */
export function loadHolidays(): Holiday[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.HOLIDAYS);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    return reviveDates(parsed);
  } catch (error) {
    console.error('Failed to load holidays from localStorage:', error);
    return null;
  }
}

/**
 * Save milestones for a specific release to localStorage
 */
export function saveMilestones(releaseId: string, milestones: Milestone[]): void {
  try {
    const key = `milestones_${releaseId}`;
    const serialized = milestones.map(m => ({
      ...m,
      startDate: m.startDate.toISOString(),
      endDate: m.endDate?.toISOString(),
    }));
    localStorage.setItem(key, JSON.stringify(serialized));
  } catch (error) {
    console.error('Failed to save milestones to localStorage:', error);
  }
}

/**
 * Load milestones for a specific release from localStorage
 */
export function loadMilestones(releaseId: string): Milestone[] {
  try {
    const key = `milestones_${releaseId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((m: any) => ({
      ...m,
      startDate: new Date(m.startDate),
      endDate: m.endDate ? new Date(m.endDate) : undefined,
    }));
  } catch (error) {
    console.error('Failed to load milestones from localStorage:', error);
    return [];
  }
}

/**
 * Save team members to localStorage
 * Dispatches 'teamMembersUpdated' event for auto-refresh in planning views
 */
export function saveTeamMembers(teamMembers: TeamMember[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify(teamMembers));
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
    
    // Dispatch event for auto-refresh in planning views
    window.dispatchEvent(new Event('teamMembersUpdated'));
  } catch (error) {
    console.error('Failed to save team members to localStorage:', error);
  }
}

/**
 * Load team members from localStorage
 * Ensures backward compatibility by providing defaults for missing fields
 */
export function loadTeamMembers(): TeamMember[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TEAM_MEMBERS);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    const teamMembers = reviveDates(parsed);
    
    // Ensure backward compatibility: add default values for optional fields
    return teamMembers.map((member: TeamMember) => ({
      ...member,
      experienceLevel: member.experienceLevel || 'Mid',
      velocityMultiplier: member.velocityMultiplier ?? 1.0,
    }));
  } catch (error) {
    console.error('Failed to load team members from localStorage:', error);
    return null;
  }
}

/**
 * Load team members for a specific product
 */
export function loadTeamMembersByProduct(productId: string): TeamMember[] | null {
  const allMembers = loadTeamMembers();
  if (!allMembers) return null;
  return allMembers.filter(m => m.productId === productId);
}

/**
 * Save a specific release to localStorage
 */
export function saveRelease(productId: string, release: Release): void {
  try {
    const products = loadProducts();
    if (!products) return;
    
    const updatedProducts = products.map(product => {
      if (product.id === productId) {
        return {
          ...product,
          releases: product.releases.map(r => 
            r.id === release.id ? release : r
          )
        };
      }
      return product;
    });
    
    saveProducts(updatedProducts);
  } catch (error) {
    console.error('Failed to save release:', error);
  }
}

export function deleteRelease(productId: string, releaseId: string): void {
  try {
    const products = loadProducts();
    if (!products) return;

    const updatedProducts = products.map(product => {
      if (product.id === productId) {
        return {
          ...product,
          releases: product.releases.filter(r => r.id !== releaseId),
        };
      }
      return product;
    });

    saveProducts(updatedProducts);
  } catch (error) {
    console.error('Failed to delete release:', error);
  }
}

/**
 * Clear all stored data (useful for reset)
 */
export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.HOLIDAYS);
    localStorage.removeItem(STORAGE_KEYS.TEAM_MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.LAST_UPDATED);
    localStorage.removeItem(STORAGE_KEYS.DATA_VERSION);
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}

/**
 * Get last updated timestamp
 */
export function getLastUpdated(): Date | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
    return stored ? new Date(stored) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if storage has data and is current version
 */
export function hasStoredData(): boolean {
  const hasData = localStorage.getItem(STORAGE_KEYS.PRODUCTS) !== null;
  const storedVersion = localStorage.getItem(STORAGE_KEYS.DATA_VERSION);
  
  // If no data or version mismatch, return false to trigger initialization
  if (!hasData || storedVersion !== DATA_VERSION) {
    return false;
  }
  
  return true;
}

/**
 * Initialize storage with mock data if empty or version mismatch
 */
export function initializeStorage(
  mockProducts: Product[],
  mockHolidays?: Holiday[],
  mockTeamMembers?: TeamMember[]
): void {
  if (!hasStoredData()) {
    // Clear any old data first
    clearStorage();
    // Save new data
    saveProducts(mockProducts);
    if (mockHolidays) saveHolidays(mockHolidays);
    if (mockTeamMembers) saveTeamMembers(mockTeamMembers);
    
    // Save phases for releases that have them
    mockProducts.forEach(product => {
      product.releases.forEach(release => {
        if (release.phases && release.phases.length > 0) {
          savePhases(release.id, release.phases);
        }
      });
    });
    
    // Mark current version
    localStorage.setItem(STORAGE_KEYS.DATA_VERSION, DATA_VERSION);
  }
}

/**
 * Force refresh storage with new mock data (clears existing data)
 */
export function forceRefreshStorage(
  mockProducts: Product[],
  mockHolidays?: Holiday[],
  mockTeamMembers?: TeamMember[]
): void {
  clearStorage();
  saveProducts(mockProducts);
  if (mockHolidays) saveHolidays(mockHolidays);
  if (mockTeamMembers) saveTeamMembers(mockTeamMembers);
  
  // Save phases for releases that have them
  mockProducts.forEach(product => {
    product.releases.forEach(release => {
      if (release.phases && release.phases.length > 0) {
        savePhases(release.id, release.phases);
      }
    });
  });
  
  localStorage.setItem(STORAGE_KEYS.DATA_VERSION, DATA_VERSION);
}

/**
 * Update a specific ticket across products
 */
export function updateTicket(
  productId: string,
  releaseId: string,
  featureId: string,
  ticketId: string,
  updates: Partial<Ticket>
): void {
  try {
    const products = loadProducts();
    if (!products) return;
    
    const updatedProducts = products.map(product => {
      if (product.id === productId) {
        return {
          ...product,
          releases: product.releases.map(release => {
            if (release.id === releaseId) {
              return {
                ...release,
                features: release.features.map(feature => {
                  if (feature.id === featureId) {
                    return {
                      ...feature,
                      tickets: feature.tickets.map(ticket =>
                        ticket.id === ticketId ? { ...ticket, ...updates } : ticket
                      )
                    };
                  }
                  return feature;
                })
              };
            }
            return release;
          })
        };
      }
      return product;
    });
    
    saveProducts(updatedProducts);
  } catch (error) {
    console.error('Failed to update ticket:', error);
  }
}

/**
 * Save phases for a specific release to localStorage
 */
export function savePhases(releaseId: string, phases: Phase[]): void {
  const key = `phases_${releaseId}`;
  const serialized = phases.map(p => ({
    ...p,
    startDate: p.startDate.toISOString(),
    endDate: p.endDate.toISOString(),
  }));
  localStorage.setItem(key, JSON.stringify(serialized));
}

/**
 * Load phases for a specific release from localStorage
 */
export function loadPhases(releaseId: string): Phase[] {
  const key = `phases_${releaseId}`;
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  
  try {
    const parsed = JSON.parse(stored);
    return parsed.map((p: any) => ({
      ...p,
      startDate: new Date(p.startDate),
      endDate: new Date(p.endDate),
    }));
  } catch (error) {
    console.warn(`Failed to load phases for release ${releaseId}:`, error);
    return [];
  }
}
