// CableForge Design System
// Centralized theme configuration for consistent design

import { colors, cssVariables as colorVariables, colorUtils } from './colors';
import { typography, typographyVariables, typographyUtils } from './typography';
import { spacing, componentSpacing, spacingVariables, spacingUtils } from './spacing';

// Main theme object
export const theme = {
  colors,
  typography,
  spacing,
  componentSpacing,
  
  // Utility functions
  utils: {
    color: colorUtils,
    typography: typographyUtils,
    spacing: spacingUtils,
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Shadows
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Z-index scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },

  // Transitions
  transitions: {
    none: 'none',
    all: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'color 150ms cubic-bezier(0.4, 0, 0.2, 1), background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), border-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    fast: 'all 100ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Animation durations
  durations: {
    instant: '0ms',
    fast: '100ms',
    normal: '150ms',
    slow: '300ms',
    slower: '500ms',
  },

  // Easing functions
  easings: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },

  // Icon sizes for consistent visual hierarchy
  iconSizes: {
    xs: '12px',    // 0.75rem - Small inline icons
    sm: '16px',    // 1rem - Default size for most icons
    md: '20px',    // 1.25rem - Medium icons in buttons/headers
    lg: '24px',    // 1.5rem - Large feature icons
    xl: '32px',    // 2rem - Hero icons, main actions
    '2xl': '48px', // 3rem - Display icons
  },

  // Consistent element heights
  heights: {
    control: '32px',       // Standard form controls
    controlSm: '28px',     // Small form controls
    controlLg: '40px',     // Large form controls
    button: '36px',        // Standard buttons
    buttonSm: '28px',      // Small buttons
    buttonLg: '44px',      // Large buttons
    tableRow: '40px',      // Table rows
    tableRowCompact: '32px', // Compact table rows
    header: '56px',        // Header/toolbar height
    headerCompact: '48px', // Compact header
  },
} as const;

// All CSS variables combined
export const allCSSVariables = {
  ...colorVariables,
  ...typographyVariables,
  ...spacingVariables,

  // Shadow variables
  '--shadow-sm': theme.shadows.sm,
  '--shadow-base': theme.shadows.base,
  '--shadow-md': theme.shadows.md,
  '--shadow-lg': theme.shadows.lg,
  '--shadow-xl': theme.shadows.xl,

  // Border radius variables
  '--radius-sm': theme.borderRadius.sm,
  '--radius-base': theme.borderRadius.base,
  '--radius-md': theme.borderRadius.md,
  '--radius-lg': theme.borderRadius.lg,
  '--radius-xl': theme.borderRadius.xl,

  // Transition variables
  '--transition-colors': theme.transitions.colors,
  '--transition-opacity': theme.transitions.opacity,
  '--transition-shadow': theme.transitions.shadow,
  '--transition-transform': theme.transitions.transform,

  // Z-index variables
  '--z-dropdown': String(theme.zIndex.dropdown),
  '--z-modal': String(theme.zIndex.modal),
  '--z-overlay': String(theme.zIndex.overlay),
  '--z-toast': String(theme.zIndex.toast),
  '--z-tooltip': String(theme.zIndex.tooltip),
} as const;

// Component-specific theme configurations
export const componentThemes = {
  button: {
    base: {
      fontWeight: theme.typography.fontWeight.medium,
      borderRadius: theme.borderRadius.md,
      transition: theme.transitions.colors,
      focusRing: '0 0 0 2px rgba(59, 130, 246, 0.5)',
    },
    variants: {
      primary: {
        backgroundColor: colors.primary[600],
        color: colors.text.inverse,
        hoverBackgroundColor: colors.primary[700],
        activeBackgroundColor: colors.primary[800],
      },
      secondary: {
        backgroundColor: colors.gray[100],
        color: colors.text.primary,
        hoverBackgroundColor: colors.gray[200],
        activeBackgroundColor: colors.gray[300],
      },
      outline: {
        backgroundColor: 'transparent',
        color: colors.primary[600],
        borderColor: colors.primary[600],
        hoverBackgroundColor: colors.primary[50],
        activeBackgroundColor: colors.primary[100],
      },
      ghost: {
        backgroundColor: 'transparent',
        color: colors.text.primary,
        hoverBackgroundColor: colors.gray[100],
        activeBackgroundColor: colors.gray[200],
      },
      danger: {
        backgroundColor: colors.error[600],
        color: colors.text.inverse,
        hoverBackgroundColor: colors.error[700],
        activeBackgroundColor: colors.error[800],
      },
    },
    sizes: {
      sm: {
        paddingX: componentSpacing.button.paddingX.sm,
        paddingY: componentSpacing.button.paddingY.sm,
        fontSize: theme.typography.fontSize.sm,
      },
      md: {
        paddingX: componentSpacing.button.paddingX.md,
        paddingY: componentSpacing.button.paddingY.md,
        fontSize: theme.typography.fontSize.base,
      },
      lg: {
        paddingX: componentSpacing.button.paddingX.lg,
        paddingY: componentSpacing.button.paddingY.lg,
        fontSize: theme.typography.fontSize.lg,
      },
    },
  },

  input: {
    base: {
      borderWidth: '1px',
      borderColor: colors.border.medium,
      borderRadius: theme.borderRadius.md,
      fontSize: theme.typography.fontSize.base,
      paddingX: spacing[3],
      paddingY: spacing[2],
      transition: theme.transitions.colors,
      focusRing: '0 0 0 2px rgba(59, 130, 246, 0.5)',
      focusBorderColor: colors.border.focus,
    },
    variants: {
      default: {
        backgroundColor: colors.background.primary,
        color: colors.text.primary,
      },
      error: {
        borderColor: colors.error[600],
        focusRing: '0 0 0 2px rgba(239, 68, 68, 0.5)',
      },
      disabled: {
        backgroundColor: colors.gray[100],
        color: colors.text.muted,
        cursor: 'not-allowed',
      },
    },
  },

  card: {
    base: {
      backgroundColor: colors.background.primary,
      borderWidth: '1px',
      borderColor: colors.border.light,
      borderRadius: theme.borderRadius.lg,
      boxShadow: theme.shadows.sm,
      padding: componentSpacing.card.padding.md,
    },
    variants: {
      elevated: {
        boxShadow: theme.shadows.md,
      },
      outlined: {
        borderColor: colors.border.medium,
        boxShadow: 'none',
      },
      filled: {
        backgroundColor: colors.background.secondary,
        borderWidth: '0',
      },
    },
  },

  modal: {
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: theme.zIndex.overlay,
    },
    content: {
      backgroundColor: colors.background.primary,
      borderRadius: theme.borderRadius.lg,
      boxShadow: theme.shadows.xl,
      padding: componentSpacing.modal.padding,
      zIndex: theme.zIndex.modal,
    },
  },

  table: {
    base: {
      backgroundColor: colors.background.primary,
      borderColor: colors.border.light,
    },
    header: {
      backgroundColor: colors.background.secondary,
      color: colors.text.secondary,
      fontSize: theme.typography.textStyles.tableHeader.fontSize,
      fontWeight: theme.typography.textStyles.tableHeader.fontWeight,
      padding: componentSpacing.table.headerPadding,
    },
    cell: {
      fontSize: theme.typography.textStyles.tableCell.fontSize,
      padding: componentSpacing.table.cellPadding.normal,
      borderColor: colors.border.light,
    },
    row: {
      hoverBackgroundColor: colors.gray[50],
      selectedBackgroundColor: colors.primary[50],
    },
  },
} as const;

// Utility function to apply theme to CSS-in-JS
export const createThemeStyles = () => {
  const styles: Record<string, any> = {};

  // Apply CSS variables to root
  styles[':root'] = allCSSVariables;

  // Add utility classes
  styles['.theme-transition'] = {
    transition: theme.transitions.all,
  };

  styles['.theme-focus-ring'] = {
    '&:focus': {
      outline: 'none',
      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)',
    },
  };

  return styles;
};

// Export individual theme parts
export {
  colors,
  typography,
  spacing,
  componentSpacing,
  colorUtils,
  typographyUtils,
  spacingUtils,
};

// Default export
export default theme;