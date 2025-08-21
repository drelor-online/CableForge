// CableForge Typography System
// Centralized typography definitions for consistent text styling

export const typography = {
  // Font families
  fontFamily: {
    sans: [
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'Noto Sans',
      'sans-serif',
      'Apple Color Emoji',
      'Segoe UI Emoji',
      'Segoe UI Symbol',
      'Noto Color Emoji',
    ],
    mono: [
      'SFMono-Regular',
      'Consolas',
      'Liberation Mono',
      'Menlo',
      'Courier New',
      'monospace',
    ],
    display: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'sans-serif',
    ],
  },

  // Font sizes
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
  },

  // Font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Line heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Text styles - semantic combinations
  textStyles: {
    // Display text
    displayLarge: {
      fontSize: '3.75rem', // 60px
      fontWeight: '700',
      lineHeight: '1.1',
      letterSpacing: '-0.025em',
    },
    displayMedium: {
      fontSize: '3rem', // 48px
      fontWeight: '700',
      lineHeight: '1.2',
      letterSpacing: '-0.025em',
    },
    displaySmall: {
      fontSize: '2.25rem', // 36px
      fontWeight: '600',
      lineHeight: '1.25',
      letterSpacing: '-0.025em',
    },

    // Headings
    h1: {
      fontSize: '1.875rem', // 30px
      fontWeight: '600',
      lineHeight: '1.25',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '1.5rem', // 24px
      fontWeight: '600',
      lineHeight: '1.3',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.25rem', // 20px
      fontWeight: '600',
      lineHeight: '1.375',
    },
    h4: {
      fontSize: '1.125rem', // 18px
      fontWeight: '600',
      lineHeight: '1.375',
    },
    h5: {
      fontSize: '1rem', // 16px
      fontWeight: '600',
      lineHeight: '1.5',
    },
    h6: {
      fontSize: '0.875rem', // 14px
      fontWeight: '600',
      lineHeight: '1.5',
    },

    // Body text
    bodyLarge: {
      fontSize: '1.125rem', // 18px
      fontWeight: '400',
      lineHeight: '1.625',
    },
    bodyMedium: {
      fontSize: '1rem', // 16px
      fontWeight: '400',
      lineHeight: '1.5',
    },
    bodySmall: {
      fontSize: '0.875rem', // 14px
      fontWeight: '400',
      lineHeight: '1.5',
    },

    // UI elements
    labelLarge: {
      fontSize: '0.875rem', // 14px
      fontWeight: '500',
      lineHeight: '1.375',
    },
    labelMedium: {
      fontSize: '0.75rem', // 12px
      fontWeight: '500',
      lineHeight: '1.375',
    },
    labelSmall: {
      fontSize: '0.6875rem', // 11px
      fontWeight: '500',
      lineHeight: '1.375',
    },

    // Buttons
    buttonLarge: {
      fontSize: '1rem', // 16px
      fontWeight: '500',
      lineHeight: '1.5',
      letterSpacing: '0.025em',
    },
    buttonMedium: {
      fontSize: '0.875rem', // 14px
      fontWeight: '500',
      lineHeight: '1.375',
      letterSpacing: '0.025em',
    },
    buttonSmall: {
      fontSize: '0.75rem', // 12px
      fontWeight: '500',
      lineHeight: '1.375',
      letterSpacing: '0.025em',
    },

    // Code and monospace
    codeLarge: {
      fontSize: '0.875rem', // 14px
      fontWeight: '400',
      lineHeight: '1.625',
      fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
    },
    codeMedium: {
      fontSize: '0.75rem', // 12px
      fontWeight: '400',
      lineHeight: '1.5',
      fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
    },
    codeSmall: {
      fontSize: '0.6875rem', // 11px
      fontWeight: '400',
      lineHeight: '1.375',
      fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
    },

    // Table text
    tableHeader: {
      fontSize: '0.75rem', // 12px
      fontWeight: '600',
      lineHeight: '1.375',
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
    },
    tableCell: {
      fontSize: '0.875rem', // 14px
      fontWeight: '400',
      lineHeight: '1.375',
    },
    tableCellSmall: {
      fontSize: '0.75rem', // 12px
      fontWeight: '400',
      lineHeight: '1.375',
    },

    // Captions and metadata
    caption: {
      fontSize: '0.75rem', // 12px
      fontWeight: '400',
      lineHeight: '1.375',
    },
    overline: {
      fontSize: '0.6875rem', // 11px
      fontWeight: '500',
      lineHeight: '1.375',
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
    },

    // Status and badges
    badgeLarge: {
      fontSize: '0.75rem', // 12px
      fontWeight: '500',
      lineHeight: '1.375',
    },
    badgeMedium: {
      fontSize: '0.6875rem', // 11px
      fontWeight: '500',
      lineHeight: '1.375',
    },
    badgeSmall: {
      fontSize: '0.625rem', // 10px
      fontWeight: '500',
      lineHeight: '1.375',
    },
  },
} as const;

// CSS Variables for typography
export const typographyVariables = {
  '--font-sans': typography.fontFamily.sans.join(', '),
  '--font-mono': typography.fontFamily.mono.join(', '),
  '--font-display': typography.fontFamily.display.join(', '),

  // Base text settings
  '--text-base-size': typography.fontSize.base,
  '--text-base-weight': typography.fontWeight.normal,
  '--text-base-line-height': typography.lineHeight.normal,

  // Header text
  '--text-header-weight': typography.fontWeight.semibold,
  '--text-header-line-height': typography.lineHeight.tight,

  // Table text
  '--text-table-header-size': typography.textStyles.tableHeader.fontSize,
  '--text-table-header-weight': typography.textStyles.tableHeader.fontWeight,
  '--text-table-cell-size': typography.textStyles.tableCell.fontSize,

  // Button text
  '--text-button-weight': typography.fontWeight.medium,
  '--text-button-letter-spacing': typography.letterSpacing.wide,

  // Code text
  '--text-code-family': typography.fontFamily.mono.join(', '),
  '--text-code-size': typography.textStyles.codeMedium.fontSize,
} as const;

// Utility functions for typography
export const typographyUtils = {
  /**
   * Get text style CSS properties
   */
  getTextStyle: (styleName: keyof typeof typography.textStyles) => {
    return typography.textStyles[styleName];
  },

  /**
   * Generate responsive font size
   */
  getResponsiveFontSize: (base: string, sm?: string, md?: string, lg?: string) => {
    let styles = `font-size: ${base};`;
    if (sm) styles += `@media (min-width: 640px) { font-size: ${sm}; }`;
    if (md) styles += `@media (min-width: 768px) { font-size: ${md}; }`;
    if (lg) styles += `@media (min-width: 1024px) { font-size: ${lg}; }`;
    return styles;
  },

  /**
   * Get font size in pixels
   */
  getFontSizeInPixels: (size: keyof typeof typography.fontSize): number => {
    const remValue = parseFloat(typography.fontSize[size]);
    return remValue * 16; // Assuming 1rem = 16px
  },

  /**
   * Create text truncation styles
   */
  getTruncationStyles: (lines: number = 1) => {
    if (lines === 1) {
      return {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
      };
    }
    
    return {
      display: '-webkit-box',
      WebkitLineClamp: lines,
      WebkitBoxOrient: 'vertical' as const,
      overflow: 'hidden',
    };
  },

  /**
   * Get contrast-appropriate text color
   */
  getContrastTextColor: (backgroundColor: string): string => {
    // Simple contrast calculation - in a real app you'd use a proper contrast library
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#111827' : '#ffffff';
  },
};