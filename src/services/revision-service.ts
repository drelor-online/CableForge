import { invoke } from '@tauri-apps/api/core';

// Types matching the Rust models
export interface Revision {
  id?: number;
  projectId: number;
  majorRevision: string;
  minorRevision: number;
  description?: string;
  isCheckpoint: boolean;
  isAutoSave: boolean;
  userName?: string;
  changeCount: number;
  parentRevisionId?: number;
  createdAt: string;
}

export interface RevisionSummary {
  id: number;
  majorRevision: string;
  minorRevision: number;
  description?: string;
  isCheckpoint: boolean;
  isAutoSave: boolean;
  userName?: string;
  changeCount: number;
  createdAt: string;
}

export interface RevisionChange {
  id?: number;
  revisionId: number;
  entityType: string; // 'cable', 'io_point', 'load', 'conduit', 'tray'
  entityId: number;
  entityTag?: string;
  changeType: string; // 'create', 'update', 'delete'
  fieldName?: string; // null for create/delete
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface RevisionSettings {
  autoSaveInterval: number; // minutes
  maxAutoSaveRevisions: number;
  enableChangeTracking: boolean;
  userName?: string;
}

export class RevisionService {
  private static instance: RevisionService;
  private settings: RevisionSettings = {
    autoSaveInterval: 5, // 5 minutes default
    maxAutoSaveRevisions: 20,
    enableChangeTracking: true,
  };
  private autoSaveTimer?: NodeJS.Timeout;
  private pendingChanges: Map<string, any> = new Map();
  private batchTimeout?: NodeJS.Timeout;
  private changeQueue: Array<{
    entityType: string;
    entityId: number;
    entityTag?: string;
    changeType: string;
    fieldName?: string;
    oldValue?: string;
    newValue?: string;
  }> = [];

  public static getInstance(): RevisionService {
    if (!RevisionService.instance) {
      RevisionService.instance = new RevisionService();
    }
    return RevisionService.instance;
  }

  private constructor() {
    this.loadSettings();
  }

  // Settings management
  private loadSettings(): void {
    const saved = localStorage.getItem('revision-settings');
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch (error) {
        console.warn('Failed to load revision settings:', error);
      }
    }
  }

  private saveSettings(): void {
    localStorage.setItem('revision-settings', JSON.stringify(this.settings));
  }

  public updateSettings(newSettings: Partial<RevisionSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    
    // Restart auto-save timer if interval changed
    if (newSettings.autoSaveInterval !== undefined) {
      this.stopAutoSave();
      this.startAutoSave();
    }
  }

  public getSettings(): RevisionSettings {
    return { ...this.settings };
  }

  // Initialize revision service (start auto-save, etc.)
  public initialize(): void {
    console.log('RevisionService: Initializing...');
    this.startAutoSave();
    console.log(`RevisionService: Auto-save enabled with ${this.settings.autoSaveInterval} minute interval`);
  }

  // Auto-save management
  public startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    if (this.settings.autoSaveInterval > 0) {
      this.autoSaveTimer = setInterval(async () => {
        await this.createAutoSave();
      }, this.settings.autoSaveInterval * 60 * 1000);
    }
  }

  public stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
    }
  }

  private async createAutoSave(): Promise<void> {
    if (!this.settings.enableChangeTracking) return;

    try {
      await invoke<Revision>('create_auto_save_revision');
      console.log('Auto-save revision created');
      
      // Prune old auto-save revisions
      await invoke<number>('prune_old_revisions', {
        keepCount: this.settings.maxAutoSaveRevisions
      });
    } catch (error) {
      console.error('Failed to create auto-save revision:', error);
    }
  }

  // Change tracking
  public trackChange(
    entityType: string,
    entityId: number,
    entityTag: string,
    changeType: 'create' | 'update' | 'delete',
    fieldName?: string,
    oldValue?: any,
    newValue?: any
  ): void {
    if (!this.settings.enableChangeTracking) return;

    const change = {
      entityType,
      entityId,
      entityTag,
      changeType,
      fieldName,
      oldValue: oldValue !== undefined ? String(oldValue) : undefined,
      newValue: newValue !== undefined ? String(newValue) : undefined,
    };

    // Add to queue for batch processing
    this.changeQueue.push(change);

    // Debounce batch processing
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = setTimeout(() => {
      this.processBatchedChanges();
    }, 100); // 100ms debounce
  }

  private async processBatchedChanges(): Promise<void> {
    if (this.changeQueue.length === 0) return;

    const changes = [...this.changeQueue];
    this.changeQueue = [];

    try {
      for (const change of changes) {
        await invoke<RevisionChange>('track_entity_change', change);
      }
    } catch (error) {
      console.error('Failed to track changes:', error);
      // Re-queue failed changes
      this.changeQueue.unshift(...changes);
    }
  }

  // Field-level change tracking for objects
  public trackObjectChanges<T extends Record<string, any>>(
    entityType: string,
    entityId: number,
    entityTag: string,
    oldObject: T,
    newObject: T,
    ignoredFields: string[] = ['updatedAt', 'updated_at']
  ): void {
    if (!this.settings.enableChangeTracking) return;

    const allKeys = new Set([...Object.keys(oldObject), ...Object.keys(newObject)]);
    
    for (const key of allKeys) {
      if (ignoredFields.includes(key)) continue;
      
      const oldValue = oldObject[key];
      const newValue = newObject[key];
      
      // Skip if values are the same
      if (oldValue === newValue) continue;
      
      // Special handling for null/undefined
      if ((oldValue == null && newValue == null)) continue;
      
      this.trackChange(
        entityType,
        entityId,
        entityTag,
        'update',
        key,
        oldValue,
        newValue
      );
    }
  }

  // Revision CRUD operations
  public async createRevision(
    majorRevision: string,
    minorRevision: number,
    description?: string,
    isCheckpoint: boolean = false,
    userName?: string
  ): Promise<Revision> {
    return await invoke<Revision>('create_revision', {
      majorRevision,
      minorRevision,
      description,
      isCheckpoint,
      userName: userName || this.settings.userName,
    });
  }

  public async getRevisionHistory(limit?: number): Promise<RevisionSummary[]> {
    return await invoke<RevisionSummary[]>('get_revision_history', { limit });
  }

  public async getRevisionById(revisionId: number): Promise<Revision> {
    return await invoke<Revision>('get_revision_by_id', { revisionId });
  }

  public async getRevisionChanges(revisionId: number): Promise<RevisionChange[]> {
    return await invoke<RevisionChange[]>('get_revision_changes', { revisionId });
  }

  public async getEntityChangeHistory(
    entityType: string,
    entityId: number
  ): Promise<RevisionChange[]> {
    return await invoke<RevisionChange[]>('get_entity_change_history', {
      entityType,
      entityId,
    });
  }

  public async createCheckpoint(description: string, userName?: string): Promise<Revision> {
    return await invoke<Revision>('create_checkpoint', {
      description,
      userName: userName || this.settings.userName,
    });
  }

  // Utility methods
  public formatRevisionName(revision: RevisionSummary): string {
    if (revision.isCheckpoint) {
      return `${revision.majorRevision}.${revision.minorRevision} (Checkpoint)`;
    } else if (revision.isAutoSave) {
      return `Auto-save ${new Date(revision.createdAt).toLocaleTimeString()}`;
    } else {
      return `${revision.majorRevision}.${revision.minorRevision}`;
    }
  }

  public formatChangeDescription(change: RevisionChange): string {
    const entity = change.entityTag || `${change.entityType} #${change.entityId}`;
    
    switch (change.changeType) {
      case 'create':
        return `Created ${entity}`;
      case 'delete':
        return `Deleted ${entity}`;
      case 'update':
        if (change.fieldName) {
          const fieldDisplay = change.fieldName.replace(/([A-Z])/g, ' $1').toLowerCase();
          return `Updated ${fieldDisplay} for ${entity}`;
        }
        return `Updated ${entity}`;
      default:
        return `Modified ${entity}`;
    }
  }

  public getChangeIcon(change: RevisionChange): string {
    switch (change.changeType) {
      case 'create':
        return '➕';
      case 'delete':
        return '🗑️';
      case 'update':
        return '✏️';
      default:
        return '📝';
    }
  }

  public getEntityTypeIcon(entityType: string): string {
    switch (entityType.toLowerCase()) {
      case 'cable':
        return '🔌';
      case 'io_point':
      case 'iopoint':
        return '📡';
      case 'load':
        return '⚡';
      case 'conduit':
        return '🟫';
      case 'tray':
        return '📋';
      default:
        return '📄';
    }
  }

  // Cleanup
  public destroy(): void {
    this.stopAutoSave();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    this.processBatchedChanges(); // Flush any pending changes
  }
}

// Singleton export
export const revisionService = RevisionService.getInstance();