/**
 * Validation Service
 * Interfaces with Rust validation engine via Tauri IPC
 */

import { invoke } from '@tauri-apps/api/core';
import { ValidationResult, ValidationSummary, ValidationStatus } from '../types/validation';
import { Cable } from '../types';

export class ValidationService {
  /**
   * Validate all cables in the current project
   */
  async validateAllCables(): Promise<ValidationSummary> {
    try {
      const summary = await invoke<ValidationSummary>('validate_all_cables');
      return summary;
    } catch (error) {
      console.error('Failed to validate all cables:', error);
      throw new Error('Validation failed: ' + error);
    }
  }

  /**
   * Validate a single cable
   */
  async validateCable(cableId: number): Promise<ValidationResult[]> {
    try {
      const results = await invoke<ValidationResult[]>('validate_cable', {
        cableId
      });
      return results;
    } catch (error) {
      console.error('Failed to validate cable:', error);
      throw new Error('Cable validation failed: ' + error);
    }
  }

  /**
   * Check if a cable tag is duplicated
   */
  async checkDuplicateTag(tag: string, excludeId?: number): Promise<boolean> {
    try {
      const isDuplicate = await invoke<boolean>('check_duplicate_tag', {
        tag,
        excludeId
      });
      return isDuplicate;
    } catch (error) {
      console.error('Failed to check duplicate tag:', error);
      throw new Error('Duplicate tag check failed: ' + error);
    }
  }

  /**
   * Get quick validation summary counts
   */
  async getValidationSummary(): Promise<{ errorCount: number; warningCount: number; infoCount: number }> {
    try {
      const [errorCount, warningCount, infoCount] = await invoke<[number, number, number]>('get_validation_summary');
      return { errorCount, warningCount, infoCount };
    } catch (error) {
      console.error('Failed to get validation summary:', error);
      throw new Error('Validation summary failed: ' + error);
    }
  }

  /**
   * Get validation status for a cable (used for real-time UI updates)
   */
  async getCableValidationStatus(cable: Cable, allCables: Cable[]): Promise<ValidationStatus> {
    if (!cable.id) {
      return { hasIssues: false, errorCount: 0, warningCount: 0 };
    }

    try {
      const results = await this.validateCable(cable.id);
      const errorCount = results.filter(r => r.severity === 'Error').length;
      const warningCount = results.filter(r => r.severity === 'Warning').length;
      
      return {
        hasIssues: errorCount > 0 || warningCount > 0,
        errorCount,
        warningCount
      };
    } catch (error) {
      console.error('Failed to get cable validation status:', error);
      return { hasIssues: false, errorCount: 0, warningCount: 0 };
    }
  }

  /**
   * Filter validation results by severity
   */
  filterBySeverity(results: ValidationResult[], severity: 'Error' | 'Warning' | 'Info'): ValidationResult[] {
    return results.filter(result => result.severity === severity);
  }

  /**
   * Group validation results by cable
   */
  groupByCable(results: ValidationResult[]): Map<string, ValidationResult[]> {
    const grouped = new Map<string, ValidationResult[]>();
    
    for (const result of results) {
      const key = result.cableTag;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(result);
    }
    
    return grouped;
  }

  /**
   * Get validation icon for display in UI
   */
  getValidationIcon(status: ValidationStatus): string {
    if (status.errorCount > 0) {
      return '❌'; // Error
    } else if (status.warningCount > 0) {
      return '⚠️'; // Warning
    } else if (status.hasIssues) {
      return 'ℹ️'; // Info
    }
    return '✅'; // OK
  }

  /**
   * Get validation message for tooltip
   */
  getValidationMessage(status: ValidationStatus): string {
    if (status.errorCount > 0) {
      return `${status.errorCount} error${status.errorCount !== 1 ? 's' : ''}`;
    } else if (status.warningCount > 0) {
      return `${status.warningCount} warning${status.warningCount !== 1 ? 's' : ''}`;
    } else if (status.hasIssues) {
      return 'Has validation issues';
    }
    return 'Validation passed';
  }

  /**
   * Get CSS class for validation status
   */
  getValidationClass(status: ValidationStatus): string {
    if (status.errorCount > 0) {
      return 'validation-error';
    } else if (status.warningCount > 0) {
      return 'validation-warning';
    } else if (status.hasIssues) {
      return 'validation-info';
    }
    return 'validation-ok';
  }
}

// Export singleton instance
export const validationService = new ValidationService();