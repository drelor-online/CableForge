// Centralized Settings Management Service
// Consolidates all app settings that were previously scattered across different services

import { RevisionSettings } from './revision-service';

export interface GeneralSettings {
  autoSaveInterval: number; // minutes
  maxAutoSaveRevisions: number;
  enableChangeTracking: boolean;
  userName?: string;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'fr' | 'de';
}

export interface DisplaySettings {
  compactMode: boolean;
  showGridLines: boolean;
  defaultRowHeight: 'compact' | 'normal' | 'comfortable';
  showValidationIndicators: boolean;
  animationsEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface ImportExportSettings {
  defaultImportFormat: 'excel' | 'csv' | 'json';
  defaultExportFormat: 'excel' | 'csv' | 'pdf';
  autoMapColumns: boolean;
  validateOnImport: boolean;
  includeValidationInExports: boolean;
  defaultExportPath?: string;
}

export interface AdvancedSettings {
  enableWorkflowRecording: boolean;
  workflowRecordingInterval: number; // seconds
  enableDebugMode: boolean;
  enableExperimentalFeatures: boolean;
  maxUndoLevels: number;
  enableAutoBackup: boolean;
  backupInterval: number; // hours
}

export interface ColumnSettings {
  [tableName: string]: {
    visibleColumns: string[];
    columnOrder: string[];
    columnWidths: { [columnId: string]: number };
    pinnedColumns: { left: string[]; right: string[] };
  };
}

export interface FilterSettings {
  savedFilters: { [filterName: string]: any };
  defaultFilters: { [tableName: string]: any };
  rememberLastFilter: boolean;
}

export interface AllSettings {
  general: GeneralSettings;
  display: DisplaySettings;
  importExport: ImportExportSettings;
  advanced: AdvancedSettings;
  columns: ColumnSettings;
  filters: FilterSettings;
}

export class SettingsService {
  private static instance: SettingsService;
  private settings: AllSettings;
  private storageKey = 'cableforge-settings';
  private subscribers: Set<(settings: AllSettings) => void> = new Set();

  private defaultSettings: AllSettings = {
    general: {
      autoSaveInterval: 5,
      maxAutoSaveRevisions: 20,
      enableChangeTracking: true,
      theme: 'light',
      language: 'en',
    },
    display: {
      compactMode: false,
      showGridLines: true,
      defaultRowHeight: 'normal',
      showValidationIndicators: true,
      animationsEnabled: true,
      fontSize: 'medium',
    },
    importExport: {
      defaultImportFormat: 'excel',
      defaultExportFormat: 'excel',
      autoMapColumns: true,
      validateOnImport: true,
      includeValidationInExports: false,
    },
    advanced: {
      enableWorkflowRecording: false,
      workflowRecordingInterval: 60,
      enableDebugMode: false,
      enableExperimentalFeatures: false,
      maxUndoLevels: 50,
      enableAutoBackup: true,
      backupInterval: 24,
    },
    columns: {},
    filters: {
      savedFilters: {},
      defaultFilters: {},
      rememberLastFilter: true,
    },
  };

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  private constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): AllSettings {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all settings exist
        return this.mergeWithDefaults(parsed);
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
    return { ...this.defaultSettings };
  }

  private mergeWithDefaults(saved: any): AllSettings {
    const merged: AllSettings = { ...this.defaultSettings };
    
    if (saved && typeof saved === 'object') {
      // Merge each settings category
      Object.keys(this.defaultSettings).forEach((category) => {
        if (saved[category] && typeof saved[category] === 'object') {
          merged[category as keyof AllSettings] = {
            ...merged[category as keyof AllSettings],
            ...saved[category],
          };
        }
      });
    }
    
    return merged;
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(this.settings);
      } catch (error) {
        console.error('Settings subscriber callback failed:', error);
      }
    });
  }

  // Subscribe to settings changes
  public subscribe(callback: (settings: AllSettings) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Get all settings
  public getSettings(): AllSettings {
    return { ...this.settings };
  }

  // Get specific category
  public getGeneralSettings(): GeneralSettings {
    return { ...this.settings.general };
  }

  public getDisplaySettings(): DisplaySettings {
    return { ...this.settings.display };
  }

  public getImportExportSettings(): ImportExportSettings {
    return { ...this.settings.importExport };
  }

  public getAdvancedSettings(): AdvancedSettings {
    return { ...this.settings.advanced };
  }

  public getColumnSettings(tableName?: string): ColumnSettings | ColumnSettings[string] {
    if (tableName) {
      return this.settings.columns[tableName] || {
        visibleColumns: [],
        columnOrder: [],
        columnWidths: {},
        pinnedColumns: { left: [], right: [] },
      };
    }
    return { ...this.settings.columns };
  }

  public getFilterSettings(): FilterSettings {
    return { ...this.settings.filters };
  }

  // Update settings
  public updateGeneralSettings(updates: Partial<GeneralSettings>): void {
    this.settings.general = { ...this.settings.general, ...updates };
    this.saveSettings();
  }

  public updateDisplaySettings(updates: Partial<DisplaySettings>): void {
    this.settings.display = { ...this.settings.display, ...updates };
    this.saveSettings();
  }

  public updateImportExportSettings(updates: Partial<ImportExportSettings>): void {
    this.settings.importExport = { ...this.settings.importExport, ...updates };
    this.saveSettings();
  }

  public updateAdvancedSettings(updates: Partial<AdvancedSettings>): void {
    this.settings.advanced = { ...this.settings.advanced, ...updates };
    this.saveSettings();
  }

  public updateColumnSettings(tableName: string, updates: Partial<ColumnSettings[string]>): void {
    if (!this.settings.columns[tableName]) {
      this.settings.columns[tableName] = {
        visibleColumns: [],
        columnOrder: [],
        columnWidths: {},
        pinnedColumns: { left: [], right: [] },
      };
    }
    this.settings.columns[tableName] = { 
      ...this.settings.columns[tableName], 
      ...updates 
    };
    this.saveSettings();
  }

  public updateFilterSettings(updates: Partial<FilterSettings>): void {
    this.settings.filters = { ...this.settings.filters, ...updates };
    this.saveSettings();
  }

  // Utility methods
  public exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  public importSettings(settingsJson: string): boolean {
    try {
      const imported = JSON.parse(settingsJson);
      this.settings = this.mergeWithDefaults(imported);
      this.saveSettings();
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }

  public resetSettings(): void {
    this.settings = { ...this.defaultSettings };
    this.saveSettings();
  }

  public resetCategory(category: keyof AllSettings): void {
    this.settings[category] = { ...this.defaultSettings[category] } as any;
    this.saveSettings();
  }

  // Migration helpers for existing scattered settings
  public migrateRevisionSettings(revisionSettings: RevisionSettings): void {
    this.updateGeneralSettings({
      autoSaveInterval: revisionSettings.autoSaveInterval,
      maxAutoSaveRevisions: revisionSettings.maxAutoSaveRevisions,
      enableChangeTracking: revisionSettings.enableChangeTracking,
      userName: revisionSettings.userName,
    });
  }

  public migrateColumnSettings(tableName: string, columnSettings: any): void {
    if (columnSettings) {
      this.updateColumnSettings(tableName, {
        visibleColumns: columnSettings.visibleColumns || [],
        columnOrder: columnSettings.columnOrder || [],
        columnWidths: columnSettings.columnWidths || {},
        pinnedColumns: columnSettings.pinnedColumns || { left: [], right: [] },
      });
    }
  }
}

// Singleton export
export const settingsService = SettingsService.getInstance();