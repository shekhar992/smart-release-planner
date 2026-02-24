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
      bg: '#93C5FD',              // Blue 300 (lighter solid filled)
      border: '#3B82F6',          // Blue 500
      text: '#1E3A8A',            // Blue 900
      accent: '#3B82F6'           // Left border accent
    },
    'in-progress': {
      bg: '#FBBF24',              // Amber 400 (solid filled)
      border: '#F59E0B',          // Amber 500
      text: '#78350F',            // Amber 900
      accent: '#F59E0B'
    },
    completed: {
      bg: '#34D399',              // Green 400 (solid filled)
      border: '#10B981',          // Green 500
      text: '#064E3B',            // Green 900
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
  // Standard shadows (enhanced depth)
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.12), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.12), 0 2px 4px -2px rgba(0, 0, 0, 0.08)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.12), 0 4px 6px -4px rgba(0, 0, 0, 0.08)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.14), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
  '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.35)',  // New - premium depth
  
  // Special shadows
  glow: '0 0 0 3px rgba(59, 130, 246, 0.5)',      // Selection glow
  glowLg: '0 0 20px 0 rgba(59, 130, 246, 0.6)',   // Emphasized glow (improved)
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)', // Inset shadow
  innerLg: 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.08)', // Deeper inset (new)
  
  // State-specific shadows
  hover: '0 12px 20px -4px rgba(0, 0, 0, 0.16), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
  active: '0 2px 4px 0 rgba(0, 0, 0, 0.12)',
  focus: '0 0 0 3px rgba(59, 130, 246, 0.5)',
  
  // Button shadows (new)
  button: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
  buttonHover: '0 4px 8px -2px rgba(0, 0, 0, 0.12), 0 2px 4px -2px rgba(0, 0, 0, 0.08)',
  
  // Card shadows (new)
  card: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
  cardHover: '0 10px 20px -5px rgba(0, 0, 0, 0.12), 0 4px 8px -4px rgba(0, 0, 0, 0.08)',
  
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
    base: '14px',    // Body text, descriptions (improved from 15px)
    md: '15px',      // Emphasized body text
    lg: '16px',      // Section headers (improved from 17px)
    xl: '20px',      // Page titles (improved from 19px)
    '2xl': '24px',   // Dashboard titles
    '3xl': '32px'    // Hero text (improved from 30px)
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800'  // Added for emphasis
  },
  
  lineHeight: {
    tight: '1.3',     // Headlines (improved from 1.25)
    snug: '1.4',      // Subheadings (new)
    normal: '1.5',    // Body text
    relaxed: '1.6',   // Comfortable reading (improved from 1.75)
    loose: '1.8'      // Spacious (new)
  },
  
  letterSpacing: {
    tighter: '-0.04em',  // Tight headlines (new)
    tight: '-0.02em',    // Headlines (improved from -0.025em)
    normal: '0',
    wide: '0.02em',      // Improved from 0.025em
    wider: '0.05em',     // Uppercase labels (new)
    widest: '0.1em'      // All caps (new)
  }
};

// ============================================
// BORDER RADIUS
// ============================================

export const borderRadius = {
  none: '0',
  sm: '6px',       // Improved from 4px - modern look
  base: '8px',     // Improved from 6px
  md: '10px',      // Improved from 8px
  lg: '12px',      // Unchanged
  xl: '16px',      // Unchanged
  '2xl': '20px',   // Improved from 24px - more subtle
  '3xl': '24px',   // New - large cards
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
// INTERACTION TOKENS
// ============================================

export const interaction = {
  hoverOpacity: 0.08,      // For hover overlay backgrounds
  hoverBrightness: 1.05,   // For button hover brightness (new)
  pressedScale: 0.97,      // For button press states (improved from 0.98)
  disabledOpacity: 0.5,    // For disabled states
  focusRingWidth: '3px',   // Focus ring width
  focusRingOffset: '2px',  // Focus ring offset
  
  // Touch/click targets (new)
  minTouchTarget: '44px',  // WCAG minimum touch target
  iconSize: {
    xs: '14px',
    sm: '16px',
    base: '20px',
    lg: '24px',
    xl: '32px'
  },
  iconStroke: '2px'        // Icon stroke width for better visibility
};

// ============================================
// GANTT-SPECIFIC CONSTANTS
// ============================================

export const gantt = {
  // Row dimensions
  rowHeight: '48px',
  featureHeaderHeight: '40px',
  phaseStripHeight: '60px',
  milestoneStripHeight: '50px',
  legendHeight: '48px',
  
  // Bar dimensions
  barHeight: '36px',
  barMarginTop: '6px',      // (rowHeight - barHeight) / 2
  barRadius: '6px',
  barMinWidth: '20px',
  barBorderWidth: '3px',     // For status left border
  
  // Column widths
  dayWidth: '40px',
  dayWidthWeek: '120px',     // Week zoom mode
  dayWidthMonth: '200px',    // Month zoom mode
  sidebarWidth: '320px',
  
  // Visual details
  weekendBg: 'rgba(0, 0, 0, 0.03)',
  holidayBg: 'rgba(239, 68, 68, 0.08)',
  todayLineColor: '#3B82F6',
  todayLineWidth: '2px',
  
  // Tooltip
  tooltipMaxWidth: '360px',
  tooltipOffset: '12px'
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
  interaction,
  gantt,
  zIndex,
  getTicketColors,
  getConflictColors,
  getPriorityColors,
  getShadow,
  getTransition
};
