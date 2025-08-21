/**
 * Column Service Aggregator
 * Provides unified access to all column services for export functionality
 */

import { ColumnDefinition } from './column-service';
import { ioColumnService } from './io-column-service';
import { loadColumnService } from './load-column-service';
import { conduitColumnService } from './conduit-column-service';
import { trayColumnService } from './tray-column-service';
import { ExportColumnDefinitions } from '../types/export';

export interface ColumnServicePresets {
  minimal: string;
  standard: string;
  comprehensive: string;
  fillAnalysis?: string;
  installation?: string;
  powerAnalysis?: string;
}

export interface EntityColumnService {
  getExportColumns(): ColumnDefinition[];
  getMinimalExportColumns(): ColumnDefinition[];
  getComprehensiveExportColumns(): ColumnDefinition[];
  getFillAnalysisExportColumns?(): ColumnDefinition[];
  getInstallationExportColumns?(): ColumnDefinition[];
  getPowerAnalysisExportColumns?(): ColumnDefinition[];
}

class ColumnServiceAggregator {
  private static instance: ColumnServiceAggregator;

  public static getInstance(): ColumnServiceAggregator {
    if (!ColumnServiceAggregator.instance) {
      ColumnServiceAggregator.instance = new ColumnServiceAggregator();
    }
    return ColumnServiceAggregator.instance;
  }

  /**
   * Get all column definitions for multi-sheet export
   */
  getExportColumnDefinitions(): ExportColumnDefinitions {
    return {
      cables: this.getCableColumns('standard'),
      io: this.getIOColumns('standard'),
      loads: this.getLoadColumns('standard'),
      conduits: this.getConduitColumns('standard'),
      trays: this.getTrayColumns('standard')
    };
  }

  /**
   * Get column definitions with specified presets
   */
  getExportColumnDefinitionsWithPresets(presets: {
    cables?: string;
    io?: string;
    loads?: string;
    conduits?: string;
    trays?: string;
  }): ExportColumnDefinitions {
    return {
      cables: this.getCableColumns(presets.cables || 'standard'),
      io: this.getIOColumns(presets.io || 'standard'),
      loads: this.getLoadColumns(presets.loads || 'standard'),
      conduits: this.getConduitColumns(presets.conduits || 'standard'),
      trays: this.getTrayColumns(presets.trays || 'standard')
    };
  }

  /**
   * Get IO columns by preset
   */
  getIOColumns(preset: string): ColumnDefinition[] {
    switch (preset) {
      case 'minimal':
        return ioColumnService.getMinimalExportColumns();
      case 'comprehensive':
        return ioColumnService.getComprehensiveExportColumns();
      case 'standard':
      default:
        return ioColumnService.getExportColumns();
    }
  }

  /**
   * Get Load columns by preset
   */
  getLoadColumns(preset: string): ColumnDefinition[] {
    switch (preset) {
      case 'minimal':
        return loadColumnService.getMinimalExportColumns();
      case 'comprehensive':
        return loadColumnService.getComprehensiveExportColumns();
      case 'powerAnalysis':
        return loadColumnService.getPowerAnalysisExportColumns();
      case 'standard':
      default:
        return loadColumnService.getExportColumns();
    }
  }

  /**
   * Get Conduit columns by preset
   */
  getConduitColumns(preset: string): ColumnDefinition[] {
    switch (preset) {
      case 'minimal':
        return conduitColumnService.getMinimalExportColumns();
      case 'comprehensive':
        return conduitColumnService.getComprehensiveExportColumns();
      case 'fillAnalysis':
        return conduitColumnService.getFillAnalysisExportColumns();
      case 'installation':
        return conduitColumnService.getInstallationExportColumns();
      case 'standard':
      default:
        return conduitColumnService.getExportColumns();
    }
  }

  /**
   * Get Tray columns by preset
   */
  getTrayColumns(preset: string): ColumnDefinition[] {
    switch (preset) {
      case 'minimal':
        return trayColumnService.getMinimalExportColumns();
      case 'comprehensive':
        return trayColumnService.getComprehensiveExportColumns();
      case 'fillAnalysis':
        return trayColumnService.getFillAnalysisExportColumns();
      case 'installation':
        return trayColumnService.getInstallationExportColumns();
      case 'standard':
      default:
        return trayColumnService.getExportColumns();
    }
  }

  /**
   * Get Cable columns by preset (using existing cable column service)
   */
  getCableColumns(preset: string): ColumnDefinition[] {
    // This would integrate with the existing cable column service
    // For now, returning a basic set that matches the current export structure
    const baseColumns: ColumnDefinition[] = [
      { field: 'tag', headerName: 'Tag', visible: true, pinned: false, width: 120, category: 'core', required: true, order: 0 },
      { field: 'function', headerName: 'Function', visible: true, pinned: false, width: 120, category: 'core', order: 1 },
      { field: 'from', headerName: 'From', visible: true, pinned: false, width: 140, category: 'routing', order: 2 },
      { field: 'to', headerName: 'To', visible: true, pinned: false, width: 140, category: 'routing', order: 3 },
      { field: 'size', headerName: 'Size', visible: true, pinned: false, width: 100, category: 'physical', order: 4 },
      { field: 'type', headerName: 'Type', visible: true, pinned: false, width: 120, category: 'physical', order: 5 },
      { field: 'cores', headerName: 'Cores', visible: true, pinned: false, width: 80, category: 'physical', order: 6 },
      { field: 'voltage', headerName: 'Voltage (V)', visible: true, pinned: false, width: 100, category: 'electrical', order: 7 },
      { field: 'current', headerName: 'Current (A)', visible: true, pinned: false, width: 100, category: 'electrical', order: 8 },
      { field: 'length', headerName: 'Length (m)', visible: true, pinned: false, width: 100, category: 'routing', order: 9 },
      { field: 'voltageDropPercentage', headerName: 'Voltage Drop %', visible: true, pinned: false, width: 130, category: 'electrical', order: 10 },
      { field: 'routing', headerName: 'Routing', visible: true, pinned: false, width: 200, category: 'routing', order: 11 },
      { field: 'notes', headerName: 'Notes', visible: true, pinned: false, width: 200, category: 'metadata', order: 12 },
    ];

    switch (preset) {
      case 'minimal':
        return baseColumns.filter(col => 
          ['tag', 'function', 'from', 'to', 'size', 'type', 'voltage', 'current'].includes(col.field)
        );
      case 'comprehensive':
        return [
          ...baseColumns,
          { field: 'description', headerName: 'Description', visible: true, pinned: false, width: 200, category: 'core', order: 13 },
          { field: 'cableSpec', headerName: 'Cable Spec', visible: true, pinned: false, width: 150, category: 'physical', order: 14 },
          { field: 'insulation', headerName: 'Insulation', visible: true, pinned: false, width: 120, category: 'physical', order: 15 },
          { field: 'armour', headerName: 'Armour', visible: true, pinned: false, width: 100, category: 'physical', order: 16 },
          { field: 'sheath', headerName: 'Sheath', visible: true, pinned: false, width: 100, category: 'physical', order: 17 },
          { field: 'installationMethod', headerName: 'Installation Method', visible: true, pinned: false, width: 150, category: 'routing', order: 18 },
          { field: 'referenceDesignation', headerName: 'Reference Designation', visible: true, pinned: false, width: 160, category: 'metadata', order: 19 },
        ];
      case 'standard':
      default:
        return baseColumns;
    }
  }

  /**
   * Get available presets for an entity type
   */
  getAvailablePresets(entityType: string): ColumnServicePresets {
    switch (entityType) {
      case 'io':
        return {
          minimal: 'Minimal - Essential fields only',
          standard: 'Standard - Commonly used fields',
          comprehensive: 'Comprehensive - All available fields'
        };
      case 'loads':
        return {
          minimal: 'Minimal - Essential fields only',
          standard: 'Standard - Commonly used fields',
          comprehensive: 'Comprehensive - All available fields',
          powerAnalysis: 'Power Analysis - Power calculation focused'
        };
      case 'conduits':
        return {
          minimal: 'Minimal - Essential fields only',
          standard: 'Standard - Commonly used fields',
          comprehensive: 'Comprehensive - All available fields',
          fillAnalysis: 'Fill Analysis - Fill calculation focused',
          installation: 'Installation - Installation details focused'
        };
      case 'trays':
        return {
          minimal: 'Minimal - Essential fields only',
          standard: 'Standard - Commonly used fields',
          comprehensive: 'Comprehensive - All available fields',
          fillAnalysis: 'Fill Analysis - Fill calculation focused',
          installation: 'Installation - Installation details focused'
        };
      case 'cables':
      default:
        return {
          minimal: 'Minimal - Essential fields only',
          standard: 'Standard - Commonly used fields',
          comprehensive: 'Comprehensive - All available fields'
        };
    }
  }

  /**
   * Get preset description
   */
  getPresetDescription(entityType: string, preset: string): string {
    const presets = this.getAvailablePresets(entityType);
    return presets[preset as keyof ColumnServicePresets] || 'Standard export columns';
  }

  /**
   * Validate column definition array
   */
  validateColumnDefinitions(columns: ColumnDefinition[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for required fields
    const hasRequiredTag = columns.some(col => col.field === 'tag' && col.required);
    if (!hasRequiredTag) {
      errors.push('Missing required "tag" field');
    }
    
    // Check for duplicate fields
    const fields = columns.map(col => col.field);
    const duplicates = fields.filter((field, index) => fields.indexOf(field) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate fields found: ${duplicates.join(', ')}`);
    }
    
    // Check for valid widths
    const invalidWidths = columns.filter(col => col.width && (col.width < 50 || col.width > 500));
    if (invalidWidths.length > 0) {
      errors.push(`Invalid column widths (must be 50-500px): ${invalidWidths.map(col => col.field).join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const columnServiceAggregator = ColumnServiceAggregator.getInstance();