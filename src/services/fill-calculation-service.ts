/**
 * Fill Calculation Service
 * Frontend service for conduit and tray fill calculations
 */

import { invoke } from '@tauri-apps/api/core';
import { Conduit, Tray } from '../types';

export interface FillCalculationResult {
  entityId: number;
  entityType: 'conduit' | 'tray';
  entityTag: string;
  fillPercentage: number;
  maxFillPercentage: number;
  isOverfilled: boolean;
  severity: 'ok' | 'warning' | 'error';
  message: string;
}

export class FillCalculationService {
  /**
   * Recalculate fill for a specific conduit
   */
  async recalculateConduitFill(conduitId: number): Promise<number> {
    try {
      const fillPercentage = await invoke<number>('recalculate_conduit_fill', {
        conduitId
      });
      return fillPercentage;
    } catch (error) {
      console.error('Failed to recalculate conduit fill:', error);
      throw new Error('Conduit fill calculation failed: ' + error);
    }
  }

  /**
   * Recalculate fill for a specific tray
   */
  async recalculateTrayFill(trayId: number): Promise<number> {
    try {
      const fillPercentage = await invoke<number>('recalculate_tray_fill', {
        trayId
      });
      return fillPercentage;
    } catch (error) {
      console.error('Failed to recalculate tray fill:', error);
      throw new Error('Tray fill calculation failed: ' + error);
    }
  }

  /**
   * Recalculate all fills (conduits and trays)
   */
  async recalculateAllFills(): Promise<void> {
    try {
      await invoke<void>('recalculate_all_fills');
    } catch (error) {
      console.error('Failed to recalculate all fills:', error);
      throw new Error('Bulk fill calculation failed: ' + error);
    }
  }

  /**
   * Batch recalculate fills for multiple conduits and trays
   */
  async batchRecalculateFills(
    conduitIds: number[],
    trayIds: number[]
  ): Promise<Map<string, FillCalculationResult>> {
    const results = new Map<string, FillCalculationResult>();
    
    // Process conduits
    for (const conduitId of conduitIds) {
      try {
        const fillPercentage = await this.recalculateConduitFill(conduitId);
        results.set(`conduit-${conduitId}`, {
          entityId: conduitId,
          entityType: 'conduit',
          entityTag: `C-${conduitId}`, // Will be updated with actual tag
          fillPercentage,
          maxFillPercentage: 40, // NEC standard for conduits
          isOverfilled: fillPercentage > 40,
          severity: this.getFillSeverity(fillPercentage, 40),
          message: this.getFillMessage(fillPercentage, 40, 'conduit')
        });
      } catch (error) {
        console.error(`Failed to calculate fill for conduit ${conduitId}:`, error);
      }
    }

    // Process trays
    for (const trayId of trayIds) {
      try {
        const fillPercentage = await this.recalculateTrayFill(trayId);
        results.set(`tray-${trayId}`, {
          entityId: trayId,
          entityType: 'tray',
          entityTag: `T-${trayId}`, // Will be updated with actual tag
          fillPercentage,
          maxFillPercentage: 50, // Typical limit for trays
          isOverfilled: fillPercentage > 50,
          severity: this.getFillSeverity(fillPercentage, 50),
          message: this.getFillMessage(fillPercentage, 50, 'tray')
        });
      } catch (error) {
        console.error(`Failed to calculate fill for tray ${trayId}:`, error);
      }
    }

    return results;
  }

  /**
   * Extract conduit/tray identifiers from cable route string
   */
  extractRouteReferences(route: string): {
    conduitTags: string[];
    trayTags: string[];
  } {
    if (!route) {
      return { conduitTags: [], trayTags: [] };
    }

    const conduitTags: string[] = [];
    const trayTags: string[] = [];

    // Split route by common delimiters
    const routeParts = route.split(/[,;/\->\s]+/).filter(part => part.trim());

    for (const part of routeParts) {
      const trimmed = part.trim().toUpperCase();
      
      // Common conduit naming patterns
      if (trimmed.match(/^C[-_]?\d+$/) || 
          trimmed.match(/^CONDUIT[-_]?\d+$/i) ||
          trimmed.match(/^EMT[-_]?\d+$/i)) {
        conduitTags.push(trimmed);
      }
      
      // Common tray naming patterns
      if (trimmed.match(/^T[-_]?\d+$/) || 
          trimmed.match(/^TRAY[-_]?\d+$/i) ||
          trimmed.match(/^CT[-_]?\d+$/i)) {
        trayTags.push(trimmed);
      }
    }

    return { conduitTags, trayTags };
  }

  /**
   * Find conduits and trays that need recalculation based on cable changes
   */
  findAffectedRoutes(
    oldRoute?: string,
    newRoute?: string
  ): {
    affectedConduitTags: Set<string>;
    affectedTrayTags: Set<string>;
  } {
    const affectedConduitTags = new Set<string>();
    const affectedTrayTags = new Set<string>();

    // Extract references from old route
    if (oldRoute) {
      const oldRefs = this.extractRouteReferences(oldRoute);
      oldRefs.conduitTags.forEach(tag => affectedConduitTags.add(tag));
      oldRefs.trayTags.forEach(tag => affectedTrayTags.add(tag));
    }

    // Extract references from new route
    if (newRoute) {
      const newRefs = this.extractRouteReferences(newRoute);
      newRefs.conduitTags.forEach(tag => affectedConduitTags.add(tag));
      newRefs.trayTags.forEach(tag => affectedTrayTags.add(tag));
    }

    return { affectedConduitTags, affectedTrayTags };
  }

  /**
   * Get fill severity level based on percentage and limits
   */
  getFillSeverity(fillPercentage: number, maxFillPercentage: number): 'ok' | 'warning' | 'error' {
    if (fillPercentage <= maxFillPercentage * 0.75) {
      return 'ok'; // Below 75% of limit
    } else if (fillPercentage <= maxFillPercentage) {
      return 'warning'; // Between 75% and 100% of limit
    } else {
      return 'error'; // Over limit
    }
  }

  /**
   * Get fill status message
   */
  getFillMessage(fillPercentage: number, maxFillPercentage: number, entityType: 'conduit' | 'tray'): string {
    const severity = this.getFillSeverity(fillPercentage, maxFillPercentage);
    const percentage = fillPercentage.toFixed(1);
    const limit = maxFillPercentage.toFixed(0);

    switch (severity) {
      case 'ok':
        return `${percentage}% fill - Within safe limits (${entityType} limit: ${limit}%)`;
      case 'warning':
        return `${percentage}% fill - Approaching limit (${entityType} limit: ${limit}%)`;
      case 'error':
        return `${percentage}% fill - Exceeds NEC limit (${entityType} limit: ${limit}%)`;
    }
  }

  /**
   * Get fill CSS class for UI styling
   */
  getFillClass(fillPercentage: number, maxFillPercentage: number): string {
    const severity = this.getFillSeverity(fillPercentage, maxFillPercentage);
    
    switch (severity) {
      case 'ok':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
    }
  }

  /**
   * Validate NEC compliance for conduit fills
   */
  validateConduitFill(fillPercentage: number, conduitType?: string): {
    isCompliant: boolean;
    violations: string[];
    recommendations: string[];
  } {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // NEC Article 356 - EMT fills
    if (fillPercentage > 40) {
      violations.push(`Fill percentage (${fillPercentage.toFixed(1)}%) exceeds NEC limit of 40%`);
      recommendations.push('Consider using larger conduit or multiple conduits');
    }

    // Additional checks based on conduit type
    if (conduitType?.toLowerCase().includes('emt') && fillPercentage > 35) {
      if (fillPercentage <= 40) {
        recommendations.push('EMT fill approaching limit - monitor cable additions carefully');
      }
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      recommendations
    };
  }

  /**
   * Validate tray fill compliance
   */
  validateTrayFill(fillPercentage: number, trayType?: string): {
    isCompliant: boolean;
    violations: string[];
    recommendations: string[];
  } {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Typical tray fill limits
    if (fillPercentage > 50) {
      violations.push(`Fill percentage (${fillPercentage.toFixed(1)}%) exceeds recommended limit of 50%`);
      recommendations.push('Consider using wider tray or multiple trays');
    }

    // Additional checks for tray types
    if (trayType?.toLowerCase().includes('perforated') && fillPercentage > 45) {
      if (fillPercentage <= 50) {
        recommendations.push('Perforated tray approaching limit - ensure adequate ventilation');
      }
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      recommendations
    };
  }

  /**
   * Get fill status with color coding for conduits
   */
  getConduitFillStatus(conduit: Conduit): FillCalculationResult {
    const fillPercentage = conduit.fillPercentage || 0;
    const maxFillPercentage = conduit.maxFillPercentage || 40;

    return {
      entityId: conduit.id || 0,
      entityType: 'conduit',
      entityTag: conduit.tag,
      fillPercentage,
      maxFillPercentage,
      isOverfilled: fillPercentage > maxFillPercentage,
      severity: this.getFillSeverity(fillPercentage, maxFillPercentage),
      message: this.getFillMessage(fillPercentage, maxFillPercentage, 'conduit')
    };
  }

  /**
   * Get fill status with color coding for trays
   */
  getTrayFillStatus(tray: Tray): FillCalculationResult {
    const fillPercentage = tray.fillPercentage || 0;
    const maxFillPercentage = tray.maxFillPercentage || 50;

    return {
      entityId: tray.id || 0,
      entityType: 'tray',
      entityTag: tray.tag,
      fillPercentage,
      maxFillPercentage,
      isOverfilled: fillPercentage > maxFillPercentage,
      severity: this.getFillSeverity(fillPercentage, maxFillPercentage),
      message: this.getFillMessage(fillPercentage, maxFillPercentage, 'tray')
    };
  }
}

// Export singleton instance
export const fillCalculationService = new FillCalculationService();