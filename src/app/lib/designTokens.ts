/**
 * Design Token System
 * 
 * Centralized design tokens for consistent visual system.
 * Replace hard-coded colors, spacing, and shadows with semantic tokens.
 * 
 * Benefits:
 * - Easy theme switching (light/dark mode)
 * - Consistent visual language
 * - Single source of truth for design decisions
 * - Better maintainability
 */

// ============================================
// COLOR SYSTEM
// ============================================

export const colors = {
  // Timeline colors
  timeline: {
    background: '#F9FAFB',        // Main timeline background
    gridLine: '#E5E7EB',          // Subtle grid lines
    weekBoundary: '#D1D5DB',      // Week separator lines (thicker)
    selected: '#DBEAFE',          // Selected row background
    hover: '#F3F4F6',             // Hover state background
    weekend: 'rgba(0, 0, 0, 0.02)' // Weekend shading
  },
  
  // Ticket status colors (3-shade system: bg, border, text)
  ticket: {
    planned: {
      bg: '#EFF6FF',              // Blue 50
      border: '#3B82F6',          // Blue 500
      text: '#1E40AF',            // Blue 800
      accent: '#3B82F6'           // Left border accent
    },
    'in-progress': {
      bg: '#FEF3C7',              // Amber 100
      border: '#F59E0B',          // Amber 500
      text: '#92400E',            // Amber 800
      accent: '#F59E0B'
    },
    completed: {
      bg: '#D1FAE5',              // Green 200
      border: '#10B981',          // Green 500
      text: '#065F46',            // Green 800
      accent: '#10B981'
    }
  },
  
  // Conflict indicators
  conflict: {
    error: '#FEE2E2',             // Red 100 - background
    errorBorder: '#DC2626',       // Red 600 - border
    errorText: '#991B1B',         // Red 800 - text
    warning: '#FEF3C7',           // Amber 100
    warningBorder: '#F59E0B',     // Amber 500
    warningText: '#92400E'        // Amber 800
  },
  
  // Sprint colors
  sprint: {
    primary: '#3B82F6',           // Sprint label color
    background: 'rgba(59, 130, 246, 0.03)',
    backgroundAlt: 'rgba(59, 130, 246, 0.06)',
    border: 'rgba(0, 0, 0, 0.1)'
  },
  
  // Holiday & PTO overlays
  overlay: {
    holiday: {
      primary: 'rgba(100, 116, 139, 0.04)',
      secondary: 'rgba(100, 116, 139, 0.08)',
      badge: 'rgba(100, 116, 139, 0.9)'
    },
    pto: {
      background: 'rgba(245, 158, 11, 0.08)',
      border: 'rgba(245, 158, 11, 0.3)'
    }
  },
  
  // Today indicator
  today: {
    line: '#EF4444',              // Red 500
    badge: '#EF4444',
    text: '#FFFFFF'
  },
  
  // Priority colors (for future use)
  priority: {
    critical: {
      bg: '#FEE2E2',
      border: '#DC2626',
      text: '#991B1B'
    },
    high: {
      bg: '#FEF3C7',
      border: '#F59E0B',
      text: '#92400E'
    },
    medium: {
      bg: '#DBEAFE',
      border: '#3B82F6',
      text: '#1E40AF'
    },
    low: {
      bg: '#F3F4F6',
      border: '#6B7280',
      text: '#374151'
    }
  },
  
  // Neutral colors (grays)
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  },
  
  // Semantic colors
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#DC2626',
    info: '#3B82F6'
  }
};

// ============================================
// SPACING SYSTEM (4px base grid)
// ============================================

export const spacing = {
  0: '0px',
  1: '4px',      // 0.25rem
  2: '8px',      // 0.5rem
  3: '12px',     // 0.75rem
  4: '16px',     // 1rem
  5: '20px',     // 1.25rem
  6: '24px',     // 1.5rem
  8: '32px',     // 2rem
  10: '40px',    // 2.5rem
  12: '48px',    // 3rem
  16: '64px',    // 4rem
  20: '80px',    // 5rem
  24: '96px'     // 6rem
};

// ============================================
// SHADOW SYSTEM
// ============================================

export const shadows = {
  // Standard shadows
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Special shadows
  glow: '0 0 0 3px rgba(59, 130, 246, 0.5)',      // Selection glow
  glowLg: '0 0 15px 0 rgba(59, 130, 246, 0.5)',   // Emphasized glow
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)', // Inset shadow
  
  // State-specific shadows
  hover: '0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  active: '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
  focus: '0 0 0 3px rgba(59, 130, 246, 0.5)',
  
  // Conflict shadows
  conflictError: '0 0 0 2px rgba(220, 38, 38, 0.3), 0 4px 6px -1px rgba(220, 38, 38, 0.1)',
  conflictWarning: '0 0 0 2px rgba(245, 158, 11, 0.3), 0 4px 6px -1px rgba(245, 158, 11, 0.1)'
};

// ============================================
// TYPOGRAPHY
// ============================================

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'
  },
  
  fontSize: {
    xs: '11px',      // Metadata, counts, tiny labels
    sm: '13px',      // Ticket names, labels
    base: '15px',    // Body text, descriptions
    lg: '17px',      // Section headers
    xl: '19px',      // Page titles
    '2xl': '24px',   // Dashboard titles
    '3xl': '30px'    // Hero text
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75'
  },
  
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em'
  }
};

// ============================================
// BORDER RADIUS
// ============================================

export const borderRadius = {
  none: '0',
  sm: '4px',
  base: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px'
};

// ============================================
// TRANSITIONS
// ============================================

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Timing functions
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
};

// ============================================
// Z-INDEX SYSTEM
// ============================================

export const zIndex = {
  base: 1,
  grid: 1,
  sprintBands: 2,
  holidays: 3,
  tickets: 10,
  ticketSelected: 100,
  tooltip: 1000,
  modal: 2000,
  dropdown: 3000,
  notification: 4000
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get ticket colors based on status
 */
export const getTicketColors = (status: 'planned' | 'in-progress' | 'completed') => {
  return colors.ticket[status] || colors.ticket.planned;
};

/**
 * Get conflict colors based on severity
 */
export const getConflictColors = (severity: 'error' | 'warning') => {
  if (severity === 'error') {
    return {
      bg: colors.conflict.error,
      border: colors.conflict.errorBorder,
      text: colors.conflict.errorText,
      shadow: shadows.conflictError
    };
  }
  return {
    bg: colors.conflict.warning,
    border: colors.conflict.warningBorder,
    text: colors.conflict.warningText,
    shadow: shadows.conflictWarning
  };
};

/**
 * Get priority colors based on level
 */
export const getPriorityColors = (priority: 'critical' | 'high' | 'medium' | 'low') => {
  return colors.priority[priority] || colors.priority.medium;
};

/**
 * Build shadow string from token
 */
export const getShadow = (shadowKey: keyof typeof shadows) => {
  return shadows[shadowKey];
};

/**
 * Create transition string
 */
export const getTransition = (properties: string[], duration: keyof typeof transitions = 'base') => {
  return properties.map(prop => `${prop} ${transitions[duration]}`).join(', ');
};

// Export all tokens as default for convenience
export default {
  colors,
  spacing,
  shadows,
  typography,
  borderRadius,
  transitions,
  zIndex,
  getTicketColors,
  getConflictColors,
  getPriorityColors,
  getShadow,
  getTransition
};
