// CableForge Color System
// Centralized color definitions for consistent theming

export const colors = {
  // Brand colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb', // Main brand color
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Semantic colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Gray scale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Professional slate for headers and navigation
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Cable type specific colors
  cable: {
    power: '#dc2626',      // Red
    signal: '#2563eb',     // Blue
    control: '#059669',    // Green
    instrumentation: '#7c3aed', // Purple
    communication: '#ea580c',   // Orange
    spare: '#64748b',      // Gray
    fiber: '#0891b2',      // Cyan
    coax: '#9333ea',       // Violet
  },

  // Status colors
  status: {
    online: '#10b981',
    offline: '#ef4444',
    warning: '#f59e0b',
    maintenance: '#8b5cf6',
    unknown: '#6b7280',
  },

  // Validation colors
  validation: {
    valid: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
    overlay: 'rgba(0, 0, 0, 0.5)',
    glass: 'rgba(255, 255, 255, 0.8)',
  },

  // Border colors
  border: {
    light: '#f3f4f6',
    medium: '#e5e7eb',
    dark: '#d1d5db',
    focus: '#3b82f6',
  },

  // Text colors
  text: {
    primary: '#111827',
    secondary: '#4b5563',
    tertiary: '#6b7280',
    muted: '#9ca3af',
    inverse: '#ffffff',
    link: '#2563eb',
    linkHover: '#1d4ed8',
  },

  // Chart colors (for dashboard)
  chart: {
    primary: '#3b82f6',
    secondary: '#10b981',
    tertiary: '#f59e0b',
    quaternary: '#ef4444',
    quinary: '#8b5cf6',
    senary: '#06b6d4',
    septenary: '#84cc16',
    octonary: '#f97316',
  },
} as const;

// CSS Variables map for dynamic theming
export const cssVariables = {
  '--color-primary': colors.primary[600],
  '--color-primary-hover': colors.primary[700],
  '--color-primary-light': colors.primary[50],
  
  '--color-success': colors.success[600],
  '--color-success-light': colors.success[50],
  
  '--color-warning': colors.warning[600],
  '--color-warning-light': colors.warning[50],
  
  '--color-error': colors.error[600],
  '--color-error-light': colors.error[50],
  
  '--color-info': colors.info[600],
  '--color-info-light': colors.info[50],
  
  // Cable colors
  '--cable-power': colors.cable.power,
  '--cable-signal': colors.cable.signal,
  '--cable-control': colors.cable.control,
  '--cable-instrumentation': colors.cable.instrumentation,
  '--cable-communication': colors.cable.communication,
  '--cable-spare': colors.cable.spare,
  
  // Backgrounds
  '--bg-primary': colors.background.primary,
  '--bg-secondary': colors.background.secondary,
  '--bg-tertiary': colors.background.tertiary,
  
  // Text
  '--text-primary': colors.text.primary,
  '--text-secondary': colors.text.secondary,
  '--text-tertiary': colors.text.tertiary,
  '--text-muted': colors.text.muted,
  
  // Borders
  '--border-light': colors.border.light,
  '--border-medium': colors.border.medium,
  '--border-dark': colors.border.dark,
  '--border-focus': colors.border.focus,
  
  // Header (compact design)
  '--header-bg': colors.slate[700],
  '--header-text': colors.text.inverse,
  '--header-text-muted': 'rgba(255, 255, 255, 0.6)',
  
  // Filter bar
  '--filter-bar-bg': colors.gray[50],
  '--filter-bar-border': colors.gray[200],
  
  // AG-Grid theming
  '--ag-header-height': '32px',
  '--ag-header-background-color': colors.gray[50],
  '--ag-header-foreground-color': colors.text.secondary,
  '--ag-border-color': colors.border.light,
  '--ag-row-height': '32px',
  '--ag-cell-horizontal-padding': '12px',
  '--ag-row-hover-color': colors.gray[50],
  '--ag-selected-row-background-color': colors.primary[50],
  '--ag-odd-row-background-color': colors.background.primary,
  '--ag-even-row-background-color': colors.background.secondary,
} as const;

// Utility functions for color manipulation
export const colorUtils = {
  /**
   * Get color with alpha transparency
   */
  withAlpha: (color: string, alpha: number): string => {
    // Simple hex to rgba conversion
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  /**
   * Get cable color by type
   */
  getCableColor: (type: string): string => {
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes('power')) return colors.cable.power;
    if (normalizedType.includes('signal')) return colors.cable.signal;
    if (normalizedType.includes('control')) return colors.cable.control;
    if (normalizedType.includes('instrumentation')) return colors.cable.instrumentation;
    if (normalizedType.includes('communication')) return colors.cable.communication;
    if (normalizedType.includes('spare')) return colors.cable.spare;
    if (normalizedType.includes('fiber')) return colors.cable.fiber;
    if (normalizedType.includes('coax')) return colors.cable.coax;
    return colors.gray[500]; // Default
  },

  /**
   * Get status color
   */
  getStatusColor: (status: string): string => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes('online') || normalizedStatus.includes('active')) {
      return colors.status.online;
    }
    if (normalizedStatus.includes('offline') || normalizedStatus.includes('inactive')) {
      return colors.status.offline;
    }
    if (normalizedStatus.includes('warning') || normalizedStatus.includes('caution')) {
      return colors.status.warning;
    }
    if (normalizedStatus.includes('maintenance')) {
      return colors.status.maintenance;
    }
    return colors.status.unknown;
  },

  /**
   * Get validation color by severity
   */
  getValidationColor: (severity: 'valid' | 'warning' | 'error' | 'info'): string => {
    return colors.validation[severity];
  },

  /**
   * Generate chart color palette
   */
  getChartColors: (count: number): string[] => {
    const chartColors = Object.values(colors.chart);
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(chartColors[i % chartColors.length]);
    }
    return result;
  },
};