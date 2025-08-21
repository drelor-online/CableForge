/**
 * Conduit Column Service
 * Manages column definitions and settings for Conduit entities in exports and tables
 */

import { ColumnDefinition } from './column-service';
import { SETTINGS_KEYS } from '../types/settings';

export const defaultConduitColumns: ColumnDefinition[] = [
  // Core identification
  { field: 'tag', headerName: 'Tag', visible: true, pinned: true, width: 120, category: 'core', required: true, order: 0 },
  { field: 'description', headerName: 'Description', visible: false, width: 200, category: 'core', order: 1 },
  
  // Conduit specifications
  { field: 'type', headerName: 'Type', visible: true, width: 100, category: 'physical', order: 2 },
  { field: 'size', headerName: 'Size', visible: true, width: 100, category: 'physical', order: 3 },
  { field: 'internalDiameter', headerName: 'Internal Dia. (mm)', visible: false, width: 130, category: 'physical', order: 4 },
  
  // Fill analysis
  { field: 'fillPercentage', headerName: 'Fill %', visible: true, width: 120, category: 'electrical', order: 5 },
  { field: 'maxFillPercentage', headerName: 'Max Fill %', visible: true, width: 110, category: 'electrical', order: 6 },
  
  // Material and construction
  { field: 'material', headerName: 'Material', visible: false, width: 120, category: 'physical', order: 7 },
  { field: 'coating', headerName: 'Coating', visible: false, width: 100, category: 'physical', order: 8 },
  { field: 'wallThickness', headerName: 'Wall Thickness (mm)', visible: false, width: 140, category: 'physical', order: 9 },
  
  // Installation details
  { field: 'installationType', headerName: 'Installation Type', visible: false, width: 130, category: 'routing', order: 10 },
  { field: 'mountingMethod', headerName: 'Mounting Method', visible: false, width: 130, category: 'routing', order: 11 },
  { field: 'supportSpacing', headerName: 'Support Spacing (m)', visible: false, width: 140, category: 'routing', order: 12 },
  
  // Routing information
  { field: 'fromLocation', headerName: 'From Location', visible: true, width: 140, category: 'routing', order: 13 },
  { field: 'toLocation', headerName: 'To Location', visible: true, width: 140, category: 'routing', order: 14 },
  { field: 'route', headerName: 'Route', visible: false, width: 200, category: 'routing', order: 15 },
  { field: 'length', headerName: 'Length (m)', visible: false, width: 100, category: 'routing', order: 16 },
  { field: 'elevation', headerName: 'Elevation', visible: false, width: 100, category: 'routing', order: 17 },
  
  // Environmental conditions
  { field: 'environment', headerName: 'Environment', visible: false, width: 120, category: 'metadata', order: 18 },
  { field: 'temperatureRating', headerName: 'Temp Rating (°C)', visible: false, width: 130, category: 'metadata', order: 19 },
  { field: 'hazardousArea', headerName: 'Hazardous Area', visible: false, width: 130, category: 'metadata', order: 20 },
  { field: 'ipRating', headerName: 'IP Rating', visible: false, width: 100, category: 'metadata', order: 21 },
  
  // Standards and compliance
  { field: 'standard', headerName: 'Standard', visible: false, width: 120, category: 'metadata', order: 22 },
  { field: 'certifications', headerName: 'Certifications', visible: false, width: 140, category: 'metadata', order: 23 },
  
  // Maintenance and inspection
  { field: 'accessPoints', headerName: 'Access Points', visible: false, width: 120, category: 'metadata', order: 24 },
  { field: 'inspectionSchedule', headerName: 'Inspection Schedule', visible: false, width: 140, category: 'metadata', order: 25 },
  { field: 'lastInspection', headerName: 'Last Inspection', visible: false, width: 130, category: 'metadata', order: 26 },
  
  // Documentation
  { field: 'notes', headerName: 'Notes', visible: false, width: 200, category: 'metadata', order: 27 },
];

class ConduitColumnService {
  private static instance: ConduitColumnService;

  public static getInstance(): ConduitColumnService {
    if (!ConduitColumnService.instance) {
      ConduitColumnService.instance = new ConduitColumnService();
    }
    return ConduitColumnService.instance;
  }

  saveConduitColumnSettings(columns: ColumnDefinition[]): void {
    try {
      const settings = {
        columns: columns.map(col => ({
          field: col.field,
          visible: col.visible,
          pinned: col.pinned,
          width: col.width,
          order: col.order
        })),
        lastModified: new Date().toISOString()
      };
      
      localStorage.setItem(SETTINGS_KEYS.CONDUIT_COLUMN_VISIBILITY, JSON.stringify(settings));
      console.log('Conduit column settings saved:', settings);
    } catch (error) {
      console.error('Failed to save Conduit column settings:', error);
    }
  }

  loadConduitColumnSettings(): ColumnDefinition[] {
    try {
      const saved = localStorage.getItem(SETTINGS_KEYS.CONDUIT_COLUMN_VISIBILITY);
      if (!saved) {
        console.log('No saved Conduit column settings found, using defaults');
        return [...defaultConduitColumns];
      }

      const settings = JSON.parse(saved);
      if (!settings.columns || !Array.isArray(settings.columns)) {
        console.log('Invalid Conduit column settings format, using defaults');
        return [...defaultConduitColumns];
      }

      // Merge saved settings with default columns
      const mergedColumns = defaultConduitColumns.map(defaultCol => {
        const savedCol = settings.columns.find((col: any) => col.field === defaultCol.field);
        if (savedCol) {
          return {
            ...defaultCol,
            visible: defaultCol.required ? true : savedCol.visible,
            pinned: savedCol.pinned,
            width: savedCol.width || defaultCol.width,
            order: savedCol.order !== undefined ? savedCol.order : defaultCol.order
          };
        }
        return defaultCol;
      });

      // Sort by order
      mergedColumns.sort((a, b) => (a.order || 0) - (b.order || 0));

      console.log('Conduit column settings loaded:', mergedColumns);
      return mergedColumns;
    } catch (error) {
      console.error('Failed to load Conduit column settings:', error);
      return [...defaultConduitColumns];
    }
  }

  resetToDefaults(): ColumnDefinition[] {
    try {
      localStorage.removeItem(SETTINGS_KEYS.CONDUIT_COLUMN_VISIBILITY);
      console.log('Conduit column settings reset to defaults');
      return [...defaultConduitColumns];
    } catch (error) {
      console.error('Failed to reset Conduit column settings:', error);
      return [...defaultConduitColumns];
    }
  }

  getVisibleColumns(columns: ColumnDefinition[]): ColumnDefinition[] {
    return columns.filter(col => col.visible);
  }

  getColumnsByCategory(columns: ColumnDefinition[]): Map<string, ColumnDefinition[]> {
    const categoryMap = new Map<string, ColumnDefinition[]>();
    
    columns.forEach(col => {
      if (!categoryMap.has(col.category)) {
        categoryMap.set(col.category, []);
      }
      categoryMap.get(col.category)!.push(col);
    });
    
    return categoryMap;
  }

  updateColumnOrder(columns: ColumnDefinition[], fromIndex: number, toIndex: number): ColumnDefinition[] {
    const result = [...columns];
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    
    // Update order values
    result.forEach((col, index) => {
      col.order = index;
    });
    
    return result;
  }

  findColumnByField(columns: ColumnDefinition[], field: string): ColumnDefinition | undefined {
    return columns.find(col => col.field === field);
  }

  toggleColumnVisibility(columns: ColumnDefinition[], field: string): ColumnDefinition[] {
    return columns.map(col => {
      if (col.field === field && !col.required) {
        return { ...col, visible: !col.visible };
      }
      return col;
    });
  }

  updateColumnWidth(columns: ColumnDefinition[], field: string, width: number): ColumnDefinition[] {
    return columns.map(col => {
      if (col.field === field) {
        return { ...col, width: Math.max(50, Math.min(500, width)) };
      }
      return col;
    });
  }

  toggleColumnPin(columns: ColumnDefinition[], field: string): ColumnDefinition[] {
    return columns.map(col => {
      if (col.field === field && !col.required) {
        return { ...col, pinned: !col.pinned };
      }
      return col;
    });
  }

  /**
   * Get default export columns for Conduit entities
   */
  getExportColumns(): ColumnDefinition[] {
    return [
      { field: 'tag', headerName: 'Tag', visible: true, pinned: false, width: 120, category: 'core', required: true, order: 0 },
      { field: 'type', headerName: 'Type', visible: true, pinned: false, width: 100, category: 'physical', order: 1 },
      { field: 'size', headerName: 'Size', visible: true, pinned: false, width: 100, category: 'physical', order: 2 },
      { field: 'internalDiameter', headerName: 'Internal Dia. (mm)', visible: true, pinned: false, width: 130, category: 'physical', order: 3 },
      { field: 'fillPercentage', headerName: 'Fill %', visible: true, pinned: false, width: 120, category: 'electrical', order: 4 },
      { field: 'maxFillPercentage', headerName: 'Max Fill %', visible: true, pinned: false, width: 110, category: 'electrical', order: 5 },
      { field: 'fromLocation', headerName: 'From Location', visible: true, pinned: false, width: 140, category: 'routing', order: 6 },
      { field: 'toLocation', headerName: 'To Location', visible: true, pinned: false, width: 140, category: 'routing', order: 7 },
      { field: 'length', headerName: 'Length (m)', visible: true, pinned: false, width: 100, category: 'routing', order: 8 },
      { field: 'material', headerName: 'Material', visible: true, pinned: false, width: 120, category: 'physical', order: 9 },
      { field: 'notes', headerName: 'Notes', visible: true, pinned: false, width: 200, category: 'metadata', order: 10 },
    ];
  }

  /**
   * Get minimal export columns for Conduit entities
   */
  getMinimalExportColumns(): ColumnDefinition[] {
    return [
      { field: 'tag', headerName: 'Tag', visible: true, pinned: false, width: 120, category: 'core', required: true, order: 0 },
      { field: 'type', headerName: 'Type', visible: true, pinned: false, width: 100, category: 'physical', order: 1 },
      { field: 'size', headerName: 'Size', visible: true, pinned: false, width: 100, category: 'physical', order: 2 },
      { field: 'fillPercentage', headerName: 'Fill %', visible: true, pinned: false, width: 120, category: 'electrical', order: 3 },
      { field: 'fromLocation', headerName: 'From Location', visible: true, pinned: false, width: 140, category: 'routing', order: 4 },
      { field: 'toLocation', headerName: 'To Location', visible: true, pinned: false, width: 140, category: 'routing', order: 5 },
    ];
  }

  /**
   * Get fill analysis export columns for Conduit entities
   */
  getFillAnalysisExportColumns(): ColumnDefinition[] {
    return [
      { field: 'tag', headerName: 'Tag', visible: true, pinned: false, width: 120, category: 'core', required: true, order: 0 },
      { field: 'type', headerName: 'Type', visible: true, pinned: false, width: 100, category: 'physical', order: 1 },
      { field: 'size', headerName: 'Size', visible: true, pinned: false, width: 100, category: 'physical', order: 2 },
      { field: 'internalDiameter', headerName: 'Internal Dia. (mm)', visible: true, pinned: false, width: 130, category: 'physical', order: 3 },
      { field: 'fillPercentage', headerName: 'Fill %', visible: true, pinned: false, width: 120, category: 'electrical', order: 4 },
      { field: 'maxFillPercentage', headerName: 'Max Fill %', visible: true, pinned: false, width: 110, category: 'electrical', order: 5 },
      { field: 'fromLocation', headerName: 'From Location', visible: true, pinned: false, width: 140, category: 'routing', order: 6 },
      { field: 'toLocation', headerName: 'To Location', visible: true, pinned: false, width: 140, category: 'routing', order: 7 },
      { field: 'length', headerName: 'Length (m)', visible: true, pinned: false, width: 100, category: 'routing', order: 8 },
    ];
  }

  /**
   * Get installation export columns for Conduit entities
   */
  getInstallationExportColumns(): ColumnDefinition[] {
    return [
      { field: 'tag', headerName: 'Tag', visible: true, pinned: false, width: 120, category: 'core', required: true, order: 0 },
      { field: 'type', headerName: 'Type', visible: true, pinned: false, width: 100, category: 'physical', order: 1 },
      { field: 'size', headerName: 'Size', visible: true, pinned: false, width: 100, category: 'physical', order: 2 },
      { field: 'material', headerName: 'Material', visible: true, pinned: false, width: 120, category: 'physical', order: 3 },
      { field: 'coating', headerName: 'Coating', visible: true, pinned: false, width: 100, category: 'physical', order: 4 },
      { field: 'installationType', headerName: 'Installation Type', visible: true, pinned: false, width: 130, category: 'routing', order: 5 },
      { field: 'mountingMethod', headerName: 'Mounting Method', visible: true, pinned: false, width: 130, category: 'routing', order: 6 },
      { field: 'supportSpacing', headerName: 'Support Spacing (m)', visible: true, pinned: false, width: 140, category: 'routing', order: 7 },
      { field: 'fromLocation', headerName: 'From Location', visible: true, pinned: false, width: 140, category: 'routing', order: 8 },
      { field: 'toLocation', headerName: 'To Location', visible: true, pinned: false, width: 140, category: 'routing', order: 9 },
      { field: 'length', headerName: 'Length (m)', visible: true, pinned: false, width: 100, category: 'routing', order: 10 },
      { field: 'elevation', headerName: 'Elevation', visible: true, pinned: false, width: 100, category: 'routing', order: 11 },
    ];
  }

  /**
   * Get comprehensive export columns for Conduit entities (includes all available fields)
   */
  getComprehensiveExportColumns(): ColumnDefinition[] {
    return defaultConduitColumns.map(col => ({
      ...col,
      visible: true,
      pinned: false
    }));
  }
}

export const conduitColumnService = ConduitColumnService.getInstance();