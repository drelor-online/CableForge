// CableForge Spacing System
// Centralized spacing definitions for consistent layout

export const spacing = {
  // Base spacing scale (in rem)
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const;

// Semantic spacing for specific components
export const componentSpacing = {
  // Button spacing
  button: {
    paddingX: {
      sm: spacing[2.5],    // 10px
      md: spacing[4],      // 16px
      lg: spacing[5],      // 20px
      xl: spacing[6],      // 24px
    },
    paddingY: {
      sm: spacing[1.5],    // 6px
      md: spacing[2],      // 8px
      lg: spacing[2.5],    // 10px
      xl: spacing[3],      // 12px
    },
    gap: spacing[2],       // 8px (between icon and text)
  },

  // Card spacing
  card: {
    padding: {
      sm: spacing[3],      // 12px
      md: spacing[4],      // 16px
      lg: spacing[6],      // 24px
      xl: spacing[8],      // 32px
    },
    gap: spacing[4],       // 16px (between card elements)
    margin: spacing[4],    // 16px (between cards)
  },

  // Modal spacing
  modal: {
    padding: spacing[6],   // 24px
    headerPadding: spacing[6], // 24px
    footerPadding: spacing[6], // 24px
    gap: spacing[6],       // 24px (between sections)
    margin: spacing[4],    // 16px (from viewport edges)
  },

  // Form spacing
  form: {
    fieldGap: spacing[4],  // 16px (between form fields)
    labelGap: spacing[2],  // 8px (between label and input)
    groupGap: spacing[6],  // 24px (between form groups)
    sectionGap: spacing[8], // 32px (between form sections)
  },

  // Table spacing
  table: {
    cellPadding: {
      compact: spacing[2], // 8px
      normal: spacing[3],  // 12px
      comfortable: spacing[4], // 16px
    },
    headerPadding: spacing[3], // 12px
    rowGap: spacing[1],    // 4px
  },

  // Navigation spacing
  navigation: {
    itemPadding: spacing[3], // 12px
    itemGap: spacing[1],   // 4px
    sectionGap: spacing[6], // 24px
  },

  // Layout spacing
  layout: {
    containerPadding: {
      sm: spacing[4],      // 16px
      md: spacing[6],      // 24px
      lg: spacing[8],      // 32px
    },
    sectionGap: {
      sm: spacing[8],      // 32px
      md: spacing[12],     // 48px
      lg: spacing[16],     // 64px
    },
    contentGap: spacing[6], // 24px
  },

  // Toast spacing
  toast: {
    padding: spacing[4],   // 16px
    gap: spacing[3],       // 12px (between elements)
    margin: spacing[4],    // 16px (between toasts)
    offset: spacing[6],    // 24px (from screen edge)
  },

  // Toolbar spacing
  toolbar: {
    padding: spacing[2],   // 8px
    itemGap: spacing[2],   // 8px
    groupGap: spacing[4],  // 16px
  },

  // Badge spacing
  badge: {
    paddingX: spacing[2],  // 8px
    paddingY: spacing[1],  // 4px
    gap: spacing[1],       // 4px (between icon and text)
  },

  // Dropdown spacing
  dropdown: {
    padding: spacing[1],   // 4px
    itemPadding: spacing[2], // 8px
    separatorMargin: spacing[1], // 4px
  },
} as const;

// Responsive spacing breakpoints
export const responsiveSpacing = {
  mobile: {
    container: spacing[4],   // 16px
    section: spacing[6],     // 24px
    card: spacing[4],        // 16px
  },
  tablet: {
    container: spacing[6],   // 24px
    section: spacing[8],     // 32px
    card: spacing[6],        // 24px
  },
  desktop: {
    container: spacing[8],   // 32px
    section: spacing[12],    // 48px
    card: spacing[8],        // 32px
  },
} as const;

// Grid spacing
export const gridSpacing = {
  gap: {
    xs: spacing[1],        // 4px
    sm: spacing[2],        // 8px
    md: spacing[4],        // 16px
    lg: spacing[6],        // 24px
    xl: spacing[8],        // 32px
  },
  columns: {
    mobile: 4,
    tablet: 8,
    desktop: 12,
  },
  gutter: {
    mobile: spacing[4],    // 16px
    tablet: spacing[6],    // 24px
    desktop: spacing[8],   // 32px
  },
} as const;

// CSS Variables for spacing
export const spacingVariables = {
  // Base spacing
  '--spacing-0': spacing[0],
  '--spacing-px': spacing.px,
  '--spacing-1': spacing[1],
  '--spacing-2': spacing[2],
  '--spacing-3': spacing[3],
  '--spacing-4': spacing[4],
  '--spacing-5': spacing[5],
  '--spacing-6': spacing[6],
  '--spacing-8': spacing[8],
  '--spacing-10': spacing[10],
  '--spacing-12': spacing[12],
  '--spacing-16': spacing[16],
  '--spacing-20': spacing[20],
  '--spacing-24': spacing[24],

  // Component spacing
  '--button-padding-x': componentSpacing.button.paddingX.md,
  '--button-padding-y': componentSpacing.button.paddingY.md,
  '--card-padding': componentSpacing.card.padding.md,
  '--modal-padding': componentSpacing.modal.padding,
  '--form-field-gap': componentSpacing.form.fieldGap,
  '--table-cell-padding': componentSpacing.table.cellPadding.normal,

  // Layout spacing
  '--container-padding': componentSpacing.layout.containerPadding.md,
  '--section-gap': componentSpacing.layout.sectionGap.md,
  '--content-gap': componentSpacing.layout.contentGap,

  // Grid spacing
  '--grid-gap': gridSpacing.gap.md,
  '--grid-gutter': gridSpacing.gutter.desktop,
} as const;

// Utility functions for spacing
export const spacingUtils = {
  /**
   * Get spacing value by key
   */
  get: (key: keyof typeof spacing): string => {
    return spacing[key];
  },

  /**
   * Get component spacing
   */
  getComponentSpacing: (component: keyof typeof componentSpacing, property?: string): any => {
    if (property) {
      return (componentSpacing[component] as any)[property];
    }
    return componentSpacing[component];
  },

  /**
   * Convert spacing to pixels (assuming 1rem = 16px)
   */
  toPixels: (spacingValue: string): number => {
    if (spacingValue === '0') return 0;
    if (spacingValue.endsWith('px')) return parseInt(spacingValue);
    if (spacingValue.endsWith('rem')) {
      return parseFloat(spacingValue) * 16;
    }
    return 0;
  },

  /**
   * Get responsive spacing for breakpoint
   */
  getResponsiveSpacing: (breakpoint: keyof typeof responsiveSpacing) => {
    return responsiveSpacing[breakpoint];
  },

  /**
   * Create spacing classes for CSS-in-JS
   */
  createSpacingClasses: () => {
    const classes: Record<string, string> = {};
    
    Object.entries(spacing).forEach(([key, value]) => {
      // Padding classes
      classes[`p-${key}`] = `padding: ${value}`;
      classes[`px-${key}`] = `padding-left: ${value}; padding-right: ${value}`;
      classes[`py-${key}`] = `padding-top: ${value}; padding-bottom: ${value}`;
      classes[`pt-${key}`] = `padding-top: ${value}`;
      classes[`pr-${key}`] = `padding-right: ${value}`;
      classes[`pb-${key}`] = `padding-bottom: ${value}`;
      classes[`pl-${key}`] = `padding-left: ${value}`;

      // Margin classes
      classes[`m-${key}`] = `margin: ${value}`;
      classes[`mx-${key}`] = `margin-left: ${value}; margin-right: ${value}`;
      classes[`my-${key}`] = `margin-top: ${value}; margin-bottom: ${value}`;
      classes[`mt-${key}`] = `margin-top: ${value}`;
      classes[`mr-${key}`] = `margin-right: ${value}`;
      classes[`mb-${key}`] = `margin-bottom: ${value}`;
      classes[`ml-${key}`] = `margin-left: ${value}`;

      // Gap classes
      classes[`gap-${key}`] = `gap: ${value}`;
      classes[`gap-x-${key}`] = `column-gap: ${value}`;
      classes[`gap-y-${key}`] = `row-gap: ${value}`;
    });

    return classes;
  },

  /**
   * Calculate spacing with ratio
   */
  scale: (baseSpacing: string, ratio: number): string => {
    const pixels = spacingUtils.toPixels(baseSpacing);
    return `${(pixels * ratio) / 16}rem`;
  },
};