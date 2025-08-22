/**
 * Validation Service
 * Interfaces with Rust validation engine via Tauri IPC
 */

import { invoke } from '@tauri-apps/api/core';
import { ValidationResult, ValidationSummary, ValidationStatus, ValidationSeverity, ValidationType } from '../types/validation';
import { Cable, IOPoint, Load, Tray, Conduit } from '../types';

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
      const errorCount = results.filter(r => r.severity === ValidationSeverity.Error).length;
      const warningCount = results.filter(r => r.severity === ValidationSeverity.Warning).length;
      
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
  filterBySeverity(results: ValidationResult[], severity: ValidationSeverity): ValidationResult[] {
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

  /**
   * Get validation icon for status
   */
  getValidationIcon(status: ValidationStatus): string {
    if (status.errorCount > 0) {
      return '❌';
    } else if (status.warningCount > 0) {
      return '⚠️';
    } else if (status.hasIssues) {
      return 'ℹ️';
    }
    return '✅';
  }

  /**
   * Get validation message for status
   */
  getValidationMessage(status: ValidationStatus): string {
    if (status.errorCount > 0) {
      return `${status.errorCount} error(s)${status.warningCount > 0 ? `, ${status.warningCount} warning(s)` : ''}`;
    } else if (status.warningCount > 0) {
      return `${status.warningCount} warning(s)`;
    } else if (status.hasIssues) {
      return 'Has validation issues';
    }
    return 'Validation passed';
  }

  /**
   * Validate I/O points
   */
  async validateIOPoints(ioPoints: IOPoint[]): Promise<ValidationResult[]> {
    // For now, return basic validation results
    // This would typically interface with Rust validation engine
    const results: ValidationResult[] = [];
    
    for (const ioPoint of ioPoints) {
      if (!ioPoint.tag || ioPoint.tag.trim() === '') {
        results.push({
          cableTag: ioPoint.tag || 'Unnamed',
          severity: ValidationSeverity.Error,
          validationType: ValidationType.Required,
          message: 'I/O Point tag is required',
          field: 'tag',
          overrideAllowed: false
        });
      }
    }
    
    return results;
  }

  /**
   * Validate loads
   */
  async validateLoads(loads: Load[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const load of loads) {
      if (!load.tag || load.tag.trim() === '') {
        results.push({
          cableTag: load.tag || 'Unnamed',
          severity: ValidationSeverity.Error,
          validationType: ValidationType.Required,
          message: 'Load tag is required',
          field: 'tag',
          overrideAllowed: false
        });
      }
    }
    
    return results;
  }

  /**
   * Validate trays
   */
  async validateTrays(trays: Tray[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const tray of trays) {
      if (!tray.tag || tray.tag.trim() === '') {
        results.push({
          cableTag: tray.tag || 'Unnamed',
          severity: ValidationSeverity.Error,
          validationType: ValidationType.Required,
          message: 'Tray tag is required',
          field: 'tag',
          overrideAllowed: false
        });
      }
      
      if (tray.fillPercentage > tray.maxFillPercentage) {
        results.push({
          cableTag: tray.tag,
          severity: ValidationSeverity.Warning,
          validationType: ValidationType.Capacity,
          message: `Tray fill percentage (${tray.fillPercentage}%) exceeds maximum (${tray.maxFillPercentage}%)`,
          field: 'fillPercentage',
          overrideAllowed: true
        });
      }
    }
    
    return results;
  }

  /**
   * Validate conduits
   */
  async validateConduits(conduits: Conduit[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const conduit of conduits) {
      if (!conduit.tag || conduit.tag.trim() === '') {
        results.push({
          cableTag: conduit.tag || 'Unnamed',
          severity: ValidationSeverity.Error,
          validationType: ValidationType.Required,
          message: 'Conduit tag is required',
          field: 'tag',
          overrideAllowed: false
        });
      }
      
      if (conduit.fillPercentage > conduit.maxFillPercentage) {
        results.push({
          cableTag: conduit.tag,
          severity: ValidationSeverity.Warning,
          validationType: ValidationType.Capacity,
          message: `Conduit fill percentage (${conduit.fillPercentage}%) exceeds maximum (${conduit.maxFillPercentage}%)`,
          field: 'fillPercentage',
          overrideAllowed: true
        });
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const validationService = new ValidationService();