// Auto-numbering settings for cable tags
export interface AutoNumberingSettings {
  prefix: string;
  startNumber: number;
  increment: number;
  padding: number;
  suffix: string;
}

export const DEFAULT_AUTO_NUMBERING: AutoNumberingSettings = {
  prefix: 'C-',
  startNumber: 1,
  increment: 1,
  padding: 3,
  suffix: ''
};

// Settings storage keys
export const SETTINGS_KEYS = {
  AUTO_NUMBERING: 'cableforge_auto_numbering',
  COLUMN_VISIBILITY: 'cableforge_column_visibility',
  GRID_PREFERENCES: 'cableforge_grid_preferences'
} as const;