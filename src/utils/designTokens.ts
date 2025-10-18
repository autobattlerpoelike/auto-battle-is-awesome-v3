// Design Tokens System for Consistent UI/UX
// This provides a centralized system for spacing, typography, colors, and animations

export const DESIGN_TOKENS: {
  spacing: Record<string, string>;
  typography: {
    sizes: Record<string, string>;
    weights: Record<string, number>;
    lineHeights: Record<string, number>;
  };
  colors: {
    rarity: Record<string, string>;
    elements: Record<string, string>;
    ui: Record<string, string>;
    surfaces: Record<string, string>;
    text: Record<string, string>;
    borders: Record<string, string>;
  };
  animations: {
    durations: Record<string, string>;
    easings: Record<string, string>;
  };
  components: {
    tooltip: Record<string, string | number>;
    panel: Record<string, string>;
    button: Record<string, string>;
    input: Record<string, string>;
  };
  breakpoints: Record<string, string>;
} = {
  // Spacing system (based on 4px grid)
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    xxl: '3rem',      // 48px
  },

  // Typography scale
  typography: {
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    }
  },

  // Color system with semantic meanings
  colors: {
    // Rarity colors (consistent across all components)
    rarity: {
      common: '#9CA3AF',
      magic: '#06B6D4',
      rare: '#8B5CF6',
      epic: '#F59E0B',
      legendary: '#EF4444',
      mythic: '#EC4899',
    },

    // Element colors
    elements: {
      fire: '#EF4444',
      ice: '#06B6D4',
      lightning: '#EAB308',
      poison: '#22C55E',
      physical: '#6B7280',
    },

    // UI semantic colors
    ui: {
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#06B6D4',
    },

    // Background and surface colors
    surfaces: {
      primary: '#111827',
      secondary: '#1F2937',
      tertiary: '#374151',
      overlay: 'rgba(0, 0, 0, 0.8)',
    },

    // Text colors
    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
      tertiary: '#9CA3AF',
      muted: '#6B7280',
    },

    // Border colors
    borders: {
      primary: '#374151',
      secondary: '#4B5563',
      accent: '#6B7280',
    }
  },

  // Animation and transition tokens
  animations: {
    durations: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easings: {
      easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
      easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    }
  },

  // Component-specific tokens
  components: {
    tooltip: {
      maxWidth: '400px',
      zIndex: 9999,
      borderRadius: '0.5rem',
      padding: '1rem',
      shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    
    panel: {
      borderRadius: '0.75rem',
      padding: '1.5rem',
      gap: '1rem',
    },
    
    button: {
      borderRadius: '0.375rem',
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
    },
    
    input: {
      borderRadius: '0.375rem',
      padding: '0.5rem',
      fontSize: '0.875rem',
    }
  },

  // Breakpoints for responsive design
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  }
} as const

// Utility functions for working with design tokens
export const getSpacing = (size: keyof typeof DESIGN_TOKENS.spacing) => DESIGN_TOKENS.spacing[size]
export const getColor = (category: keyof typeof DESIGN_TOKENS.colors, variant: string) => {
  const colorCategory = DESIGN_TOKENS.colors[category] as Record<string, string>
  return colorCategory?.[variant] || '#FFFFFF'
}
export const getFontSize = (size: keyof typeof DESIGN_TOKENS.typography.sizes) => DESIGN_TOKENS.typography.sizes[size]
export const getFontWeight = (weight: keyof typeof DESIGN_TOKENS.typography.weights) => DESIGN_TOKENS.typography.weights[weight]

// CSS-in-JS helper functions
export const createSpacingClasses = () => {
  const classes: Record<string, string> = {}
  Object.entries(DESIGN_TOKENS.spacing).forEach(([key, value]) => {
    classes[`spacing-${key}`] = value as string
  })
  return classes
}

// Tooltip positioning utilities
export const calculateTooltipPosition = (
  mouseX: number,
  mouseY: number,
  tooltipWidth: number = 400,
  tooltipHeight: number = 300,
  offset: number = 10
) => {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  let x = mouseX + offset
  let y = mouseY + offset
  
  // Prevent tooltip from going off-screen horizontally
  if (x + tooltipWidth > viewportWidth) {
    x = mouseX - tooltipWidth - offset
  }
  
  // Prevent tooltip from going off-screen vertically
  if (y + tooltipHeight > viewportHeight) {
    y = mouseY - tooltipHeight - offset
  }
  
  // Ensure tooltip doesn't go off the left edge
  if (x < 0) {
    x = offset
  }
  
  // Ensure tooltip doesn't go off the top edge
  if (y < 0) {
    y = offset
  }
  
  return { x, y }
}

// Information priority system
export interface InformationPriority {
  critical: string[]    // Always visible
  important: string[]   // Visible by default, collapsible
  optional: string[]    // Hidden by default, expandable
  advanced: string[]    // Expert mode only
}

export const INFORMATION_PRIORITIES = {
  equipment: {
    critical: ['name', 'rarity', 'type', 'level'] as const,
    important: ['baseStats', 'mainStat'] as const,
    optional: ['affixes', 'sockets', 'description'] as const,
    advanced: ['requirements', 'setBonus', 'durability'] as const
  },
  skillGem: {
    critical: ['name', 'level', 'type'] as const,
    important: ['damage', 'manaCost', 'cooldown'] as const,
    optional: ['description', 'tags'] as const,
    advanced: ['scaling', 'supportGems', 'requirements'] as const
  },
  stone: {
    critical: ['name', 'rarity', 'type'] as const,
    important: ['primaryStat', 'level'] as const,
    optional: ['secondaryStats', 'description'] as const,
    advanced: ['compatibility', 'setBonus'] as const
  },
  generic: {
    critical: ['name', 'type'] as const,
    important: ['value', 'description'] as const,
    optional: ['properties'] as const,
    advanced: ['metadata'] as const
  }
} as const

// UI state management for tooltips
export interface TooltipState {
  isVisible: boolean
  position: { x: number; y: number }
  content: any
  type: 'equipment' | 'skillGem' | 'stone' | 'generic'
  level: 'quick' | 'detailed' | 'comparison' | 'advanced'
  isPersistent: boolean
}

export const createInitialTooltipState = (): TooltipState => ({
  isVisible: false,
  position: { x: 0, y: 0 },
  content: null,
  type: 'generic',
  level: 'quick',
  isPersistent: false
})