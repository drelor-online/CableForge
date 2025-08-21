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
  GRID_PREFERENCES: 'cableforge_grid_preferences',
  // Column service keys
  IO_COLUMN_VISIBILITY: 'cableforge_io_column_visibility',
  LOAD_COLUMN_VISIBILITY: 'cableforge_load_column_visibility',
  CONDUIT_COLUMN_VISIBILITY: 'cableforge_conduit_column_visibility',
  TRAY_COLUMN_VISIBILITY: 'cableforge_tray_column_visibility'
} as const;