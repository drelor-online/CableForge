/**
 * Workflow Service
 * Manages workflow recording storage, retrieval, and cleanup
 */

import { invoke } from '@tauri-apps/api/core';
import { WorkflowSession, WorkflowExportData, InteractionEvent } from '../types/workflow';
import { useLocalStorage } from '../hooks/useLocalStorage';

export interface WorkflowMetrics {
  totalSessions: number;
  totalScreenshots: number;
  totalInteractions: number;
  storageSize: string;
  oldestSession?: Date;
  newestSession?: Date;
}

export interface WorkflowPreset {
  id: string;
  name: string;
  description: string;
  stepSequence: string[];
  expectedDuration: number;
  createdAt: Date;
}

class WorkflowService {
  private storageKey = 'cableforge-workflow-sessions';
  private presetsKey = 'cableforge-workflow-presets';

  /**
   * Save workflow session to local storage
   */
  async saveWorkflowSession(session: WorkflowSession): Promise<void> {
    try {
      // Save to Tauri backend for persistence
      await invoke('save_workflow_json', {
        sessionId: session.sessionId,
        workflowData: JSON.stringify(session)
      });

      // Also save metadata to localStorage for quick access
      const existingSessions = this.getSessionMetadata();
      existingSessions.push({
        sessionId: session.sessionId,
        startTime: session.startTime,
        endTime: session.endTime,
        interactionCount: session.interactions.length,
        screenshotCount: session.screenshots.length,
        lastStep: this.getLastWorkflowStep(session.interactions)
      });

      localStorage.setItem(this.storageKey, JSON.stringify(existingSessions));
    } catch (error) {
      console.error('Failed to save workflow session:', error);
      throw error;
    }
  }

  /**
   * Get all workflow session metadata
   */
  getSessionMetadata(): Array<{
    sessionId: string;
    startTime: string;
    endTime?: string;
    interactionCount: number;
    screenshotCount: number;
    lastStep: string;
  }> {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get session metadata:', error);
      return [];
    }
  }

  /**
   * Get full workflow session data
   */
  async getWorkflowSession(sessionId: string): Promise<WorkflowSession | null> {
    try {
      // This would require implementing a get_workflow command in Tauri
      // For now, return null and indicate it's not implemented
      console.warn('getWorkflowSession not implemented yet');
      return null;
    } catch (error) {
      console.error('Failed to get workflow session:', error);
      return null;
    }
  }

  /**
   * Delete a specific workflow session
   */
  async deleteWorkflowSession(sessionId: string): Promise<void> {
    try {
      // This would require implementing a delete_workflow command in Tauri
      // For now, just remove from localStorage
      const existingSessions = this.getSessionMetadata();
      const filtered = existingSessions.filter(s => s.sessionId !== sessionId);
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
      
      console.warn('Full workflow deletion not implemented yet - only removed from localStorage');
    } catch (error) {
      console.error('Failed to delete workflow session:', error);
      throw error;
    }
  }

  /**
   * Delete all workflow sessions
   */
  async deleteAllWorkflowSessions(): Promise<void> {
    try {
      await invoke('delete_all_workflows');
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to delete all workflow sessions:', error);
      throw error;
    }
  }

  /**
   * Export workflow session as ZIP
   */
  async exportWorkflowSession(sessionId: string): Promise<string> {
    try {
      const session = await this.getWorkflowSession(sessionId);
      if (!session) {
        throw new Error('Workflow session not found');
      }

      const exportPath = await invoke<string>('export_workflow_zip', {
        sessionId: session.sessionId,
        workflowData: JSON.stringify(session),
        screenshotPaths: session.screenshots
      });

      return exportPath;
    } catch (error) {
      console.error('Failed to export workflow session:', error);
      throw error;
    }
  }

  /**
   * Get workflow metrics and statistics
   */
  async getWorkflowMetrics(): Promise<WorkflowMetrics> {
    try {
      const sessions = this.getSessionMetadata();
      const totalInteractions = sessions.reduce((sum, s) => sum + s.interactionCount, 0);
      const totalScreenshots = sessions.reduce((sum, s) => sum + s.screenshotCount, 0);

      const dates = sessions
        .filter(s => s.startTime)
        .map(s => new Date(s.startTime))
        .sort((a, b) => a.getTime() - b.getTime());

      return {
        totalSessions: sessions.length,
        totalScreenshots,
        totalInteractions,
        storageSize: 'Unknown', // Would need to implement file size calculation
        oldestSession: dates[0],
        newestSession: dates[dates.length - 1],
      };
    } catch (error) {
      console.error('Failed to get workflow metrics:', error);
      throw error;
    }
  }

  /**
   * Clean up old workflow sessions (older than specified days)
   */
  async cleanupOldSessions(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const sessions = this.getSessionMetadata();
      const oldSessions = sessions.filter(s => {
        const sessionDate = new Date(s.startTime);
        return sessionDate < cutoffDate;
      });

      // Delete old sessions
      for (const session of oldSessions) {
        await this.deleteWorkflowSession(session.sessionId);
      }

      return oldSessions.length;
    } catch (error) {
      console.error('Failed to cleanup old sessions:', error);
      throw error;
    }
  }

  /**
   * Get workflow presets
   */
  getWorkflowPresets(): WorkflowPreset[] {
    try {
      const data = localStorage.getItem(this.presetsKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get workflow presets:', error);
      return [];
    }
  }

  /**
   * Save workflow preset
   */
  saveWorkflowPreset(preset: WorkflowPreset): void {
    try {
      const existingPresets = this.getWorkflowPresets();
      const filteredPresets = existingPresets.filter(p => p.id !== preset.id);
      filteredPresets.push(preset);
      localStorage.setItem(this.presetsKey, JSON.stringify(filteredPresets));
    } catch (error) {
      console.error('Failed to save workflow preset:', error);
      throw error;
    }
  }

  /**
   * Delete workflow preset
   */
  deleteWorkflowPreset(presetId: string): void {
    try {
      const existingPresets = this.getWorkflowPresets();
      const filteredPresets = existingPresets.filter(p => p.id !== presetId);
      localStorage.setItem(this.presetsKey, JSON.stringify(filteredPresets));
    } catch (error) {
      console.error('Failed to delete workflow preset:', error);
      throw error;
    }
  }

  /**
   * Create workflow preset from session
   */
  createPresetFromSession(session: WorkflowSession, name: string, description: string): WorkflowPreset {
    const stepSequence = session.interactions
      .filter(i => i.step && i.step !== 'unknown')
      .map(i => i.step!)
      .filter((step, index, arr) => arr.indexOf(step) === index); // Remove duplicates

    const duration = session.endTime && session.startTime 
      ? new Date(session.endTime).getTime() - new Date(session.startTime).getTime()
      : 0;

    return {
      id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      stepSequence,
      expectedDuration: Math.round(duration / 1000), // Convert to seconds
      createdAt: new Date()
    };
  }

  /**
   * Analyze workflow patterns
   */
  analyzeWorkflowPatterns(sessions: WorkflowSession[]): {
    commonSteps: { step: string; frequency: number }[];
    averageSessionDuration: number;
    mostUsedFeatures: { feature: string; count: number }[];
  } {
    if (!sessions.length) {
      return {
        commonSteps: [],
        averageSessionDuration: 0,
        mostUsedFeatures: []
      };
    }

    // Analyze common steps
    const stepCounts: { [key: string]: number } = {};
    const featureCounts: { [key: string]: number } = {};
    let totalDuration = 0;

    sessions.forEach(session => {
      // Calculate duration
      if (session.endTime && session.startTime) {
        const duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
        totalDuration += duration;
      }

      // Count steps and features
      session.interactions.forEach(interaction => {
        if (interaction.step) {
          stepCounts[interaction.step] = (stepCounts[interaction.step] || 0) + 1;
        }
        
        if (interaction.elementTag || interaction.selector) {
          const feature = this.extractFeatureName(interaction);
          featureCounts[feature] = (featureCounts[feature] || 0) + 1;
        }
      });
    });

    const commonSteps = Object.entries(stepCounts)
      .map(([step, frequency]) => ({ step, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    const mostUsedFeatures = Object.entries(featureCounts)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      commonSteps,
      averageSessionDuration: Math.round(totalDuration / sessions.length / 1000), // Convert to seconds
      mostUsedFeatures
    };
  }

  /**
   * Get the last workflow step from interactions
   */
  private getLastWorkflowStep(interactions: InteractionEvent[]): string {
    const stepInteractions = interactions.filter(i => i.step && i.step !== 'unknown');
    return stepInteractions.length > 0 
      ? stepInteractions[stepInteractions.length - 1].step! 
      : 'unknown';
  }

  /**
   * Extract feature name from interaction
   */
  private extractFeatureName(interaction: InteractionEvent): string {
    if (interaction.selector.includes('data-testid')) {
      const match = interaction.selector.match(/data-testid="([^"]+)"/);
      return match ? match[1] : 'unknown-feature';
    }
    
    if (interaction.elementTag) {
      return `${interaction.elementTag}-element`;
    }
    
    return 'unknown-feature';
  }
}

export const workflowService = new WorkflowService();
export default workflowService;