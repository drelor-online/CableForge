/**
 * Tray Column Service
 * Manages column definitions and settings for Tray entities in exports and tables
 */

import { ColumnDefinition } from './column-service';
import { SETTINGS_KEYS } from '../types/settings';

export const defaultTrayColumns: ColumnDefinition[] = [
  // Core identification
  { field: 'tag', headerName: 'Tag', visible: true, pinned: true, width: 120, category: 'core', required: true, order: 0 },
  { field: 'description', headerName: 'Description', visible: false, width: 200, category: 'core', order: 1 },
  
  // Tray specifications
  { field: 'type', headerName: 'Type', visible: true, width: 100, category: 'physical', order: 2 },
  { field: 'width', headerName: 'Width (mm)', visible: true, width: 100, category: 'physical', order: 3 },
  { field: 'height', headerName: 'Height (mm)', visible: true, width: 100, category: 'physical', order: 4 },
  { field: 'depth', headerName: 'Depth (mm)', visible: false, width: 100, category: 'physical', order: 5 },
  
  // Fill analysis
  { field: 'fillPercentage', headerName: 'Fill %', visible: true, width: 120, category: 'electrical', order: 6 },
  { field: 'maxFillPercentage', headerName: 'Max Fill %', visible: true, width: 110, category: 'electrical', order: 7 },
  { field: 'crossSectionalArea', headerName: 'Cross-Sectional Area (mm²)', visible: false, width: 160, category: 'physical', order: 8 },
  
  // Material and construction
  { field: 'material', headerName: 'Material', visible: false, width: 120, category: 'physical', order: 9 },
  { field: 'finish', headerName: 'Finish', visible: false, width: 100, category: 'physical', order: 10 },
  { field: 'coverType', headerName: 'Cover Type', visible: false, width: 100, category: 'physical', order: 11 },
  { field: 'sideRails', headerName: 'Side Rails', visible: false, width: 100, category: 'physical', order: 12 },
  { field: 'dividers', headerName: 'Dividers', visible: false, width: 100, category: 'physical', order: 13 },
  
  // Installation details
  { field: 'installationType', headerName: 'Installation Type', visible: false, width: 130, category: 'routing', order: 14 },
  { field: 'supportType', headerName: 'Support Type', visible: false, width: 120, category: 'routing', order: 15 },
  { field: 'supportSpacing', headerName: 'Support Spacing (m)', visible: false, width: 140, category: 'routing', order: 16 },
  { field: 'mountingHeight', headerName: 'Mounting Height (m)', visible: false, width: 140, category: 'routing', order: 17 },
  
  // Routing information
  { field: 'fromLocation', headerName: 'From Location', visible: true, width: 140, category: 'routing', order: 18 },
  { field: 'toLocation', headerName: 'To Location', visible: true, width: 140, category: 'routing', order: 19 },
  { field: 'route', headerName: 'Route', visible: false, width: 200, category: 'routing', order: 20 },
  { field: 'length', headerName: 'Length (m)', visible: true, width: 100, category: 'routing', order: 21 },
  { field: 'elevation', headerName: 'Elevation', visible: false, width: 100, category: 'routing', order: 22 },
  { field: 'slope', headerName: 'Slope (%)', visible: false, width: 100, category: 'routing', order: 23 },
  
  // Environmental conditions
  { field: 'environment', headerName: 'Environment', visible: false, width: 120, category: 'metadata', order: 24 },
  { field: 'temperatureRating', headerName: 'Temp Rating (°C)', visible: false, width: 130, category: 'metadata', order: 25 },
  { field: 'hazardousArea', headerName: 'Hazardous Area', visible: false, width: 130, category: 'metadata', order: 26 },
  { field: 'ipRating', headerName: 'IP Rating', visible: false, width: 100, category: 'metadata', order: 27 },
  { field: 'fireRating', headerName: 'Fire Rating', visible: false, width: 110, category: 'metadata', order: 28 },
  
  // Load ratings
  { field: 'loadRating', headerName: 'Load Rating (kg/m)', visible: false, width: 140, category: 'metadata', order: 29 },
  { field: 'dynamicLoad', headerName: 'Dynamic Load (kg)', visible: false, width: 130, category: 'metadata', order: 30 },
  { field: 'staticLoad', headerName: 'Static Load (kg)', visible: false, width: 120, category: 'metadata', order: 31 },
  
  // Standards and compliance
  { field: 'standard', headerName: 'Standard', visible: false, width: 120, category: 'metadata', order: 32 },
  { field: 'certifications', headerName: 'Certifications', visible: false, width: 140, category: 'metadata', order: 33 },
  
  // Accessibility and maintenance
  { field: 'accessPoints', headerName: 'Access Points', visible: false, width: 120, category: 'metadata', order: 34 },
  { field: 'inspectionSchedule', headerName: 'Inspection Schedule', visible: false, width: 140, category: 'metadata', order: 35 },
  { field: 'lastInspection', headerName: 'Last Inspection', visible: false, width: 130, category: 'metadata', order: 36 },
  { field: 'accessibilityRating', headerName: 'Accessibility Rating', visible: false, width: 150, category: 'metadata', order: 37 },
  
  // Documentation
  { field: 'notes', headerName: 'Notes', visible: false, width: 200, category: 'metadata', order: 38 },
];

class TrayColumnService {
  private static instance: TrayColumnService;

  public static getInstance(): TrayColumnService {
    if (!TrayColumnService.instance) {
      TrayColumnService.instance = new TrayColumnService();
    }
    return TrayColumnService.instance;
  }

  saveTrayColumnSettings(columns: ColumnDefinition[]): void {
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
      
      localStorage.setItem(SETTINGS_KEYS.TRAY_COLUMN_VISIBILITY, JSON.stringify(settings));
      console.log('Tray column settings saved:', settings);
    } catch (error) {
      console.error('Failed to save Tray column settings:', error);
    }
  }

  loadTrayColumnSettings(): ColumnDefinition[] {
    try {
      const saved = localStorage.getItem(SETTINGS_KEYS.TRAY_COLUMN_VISIBILITY);
      if (!saved) {
        console.log('No saved Tray column settings found, using defaults');
        return [...defaultTrayColumns];
      }

      const settings = JSON.parse(saved);
      if (!settings.columns || !Array.isArray(settings.columns)) {
        console.log('Invalid Tray column settings format, using defaults');
        return [...defaultTrayColumns];
      }

      // Merge saved settings with default columns
      const mergedColumns = defaultTrayColumns.map(defaultCol => {
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

      console.log('Tray column settings loaded:', mergedColumns);
      return mergedColumns;
    } catch (error) {
      console.error('Failed to load Tray column settings:', error);
      return [...defaultTrayColumns];
    }
  }

  resetToDefaults(): ColumnDefinition[] {
    try {
      localStorage.removeItem(SETTINGS_KEYS.TRAY_COLUMN_VISIBILITY);
      console.log('Tray column settings reset to defaults');
      return [...defaultTrayColumns];
    } catch (error) {
      console.error('Failed to reset Tray column settings:', error);
      return [...defaultTrayColumns];
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
   * Get default export columns for Tray entities
   */
  getExportColumns(): ColumnDefinition[] {
    return [
      { field: 'tag', headerName: 'Tag', visible: true, pinned: false, width: 120, category: 'core', required: true, order: 0 },
      { field: 'type', headerName: 'Type', visible: true, pinned: false, width: 100, category: 'physical', order: 1 },
      { field: 'width', headerName: 'Width (mm)', visible: true, pinned: false, width: 100, category: 'physical', order: 2 },
      { field: 'height', headerName: 'Height (mm)', visible: true, pinned: false, width: 100, category: 'physical', order: 3 },
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
   * Get minimal export columns for Tray entities
   */
  getMinimalExportColumns(): ColumnDefinition[] {
    return [
      { field: 'tag', headerName: 'Tag', visible: true, pinned: false, width: 120, category: 'core', required: true, order: 0 },
      { field: 'type', headerName: 'Type', visible: true, pinned: false, width: 100, category: 'physical', order: 1 },
      { field: 'width', headerName: 'Width (mm)', visible: true, pinned: false, width: 100, category: 'physical', order: 2 },
      { field: 'height', headerName: 'Height (mm)', visible: true, pinned: false, width: 100, category: 'physical', order: 3 },
      { field: 'fillPercentage', headerName: 'Fill %', visible: true, pinned: false, width: 120, category: 'electrical', order: 4 },
      { field: 'fromLocation', headerName: 'From Location', visible: true, pinned: false, width: 140, category: 'routing', order: 5 },
      { field: 'toLocation', headerName: 'To Location', visible: true, pinned: false, width: 140, category: 'routing', order: 6 },
    ];
  }

  /**
   * Get fill analysis export columns for Tray entities
   */
  getFillAnalysisExportColumns(): ColumnDefinition[] {
    return [
      { field: 'tag', headerName: 'Tag', visible: true, pinned: false, width: 120, category: 'core', required: true, order: 0 },
      { field: 'type', headerName: 'Type', visible: true, pinned: false, width: 100, category: 'physical', order: 1 },
      { field: 'width', headerName: 'Width (mm)', visible: true, pinned: false, width: 100, category: 'physical', order: 2 },
      { field: 'height', headerName: 'Height (mm)', visible: true, pinned: false, width: 100, category: 'physical', order: 3 },
      { field: 'crossSectionalArea', headerName: 'Cross-Sectional Area (mm²)', visible: true, pinned: false, width: 160, category: 'physical', order: 4 },
      { field: 'fillPercentage', headerName: 'Fill %', visible: true, pinned: false, width: 120, category: 'electrical', order: 5 },
      { field: 'maxFillPercentage', headerName: 'Max Fill %', visible: true, pinned: false, width: 110, category: 'electrical', order: 6 },
      { field: 'fromLocation', headerName: 'From Location', visible: true, pinned: false, width: 140, category: 'routing', order: 7 },
      { field: 'toLocation', headerName: 'To Location', visible: true, pinned: false, width: 140, category: 'routing', order: 8 },
      { field: 'length', headerName: 'Length (m)', visible: true, pinned: false, width: 100, category: 'routing', order: 9 },
    ];
  }

  /**
   * Get installation export columns for Tray entities
   */
  getInstallationExportColumns(): ColumnDefinition[] {
    return [
      { field: 'tag', headerName: 'Tag', visible: true, pinned: false, width: 120, category: 'core', required: true, order: 0 },
      { field: 'type', headerName: 'Type', visible: true, pinned: false, width: 100, category: 'physical', order: 1 },
      { field: 'width', headerName: 'Width (mm)', visible: true, pinned: false, width: 100, category: 'physical', order: 2 },
      { field: 'height', headerName: 'Height (mm)', visible: true, pinned: false, width: 100, category: 'physical', order: 3 },
      { field: 'material', headerName: 'Material', visible: true, pinned: false, width: 120, category: 'physical', order: 4 },
      { field: 'finish', headerName: 'Finish', visible: true, pinned: false, width: 100, category: 'physical', order: 5 },
      { field: 'coverType', headerName: 'Cover Type', visible: true, pinned: false, width: 100, category: 'physical', order: 6 },
      { field: 'installationType', headerName: 'Installation Type', visible: true, pinned: false, width: 130, category: 'routing', order: 7 },
      { field: 'supportType', headerName: 'Support Type', visible: true, pinned: false, width: 120, category: 'routing', order: 8 },
      { field: 'supportSpacing', headerName: 'Support Spacing (m)', visible: true, pinned: false, width: 140, category: 'routing', order: 9 },
      { field: 'mountingHeight', headerName: 'Mounting Height (m)', visible: true, pinned: false, width: 140, category: 'routing', order: 10 },
      { field: 'fromLocation', headerName: 'From Location', visible: true, pinned: false, width: 140, category: 'routing', order: 11 },
      { field: 'toLocation', headerName: 'To Location', visible: true, pinned: false, width: 140, category: 'routing', order: 12 },
      { field: 'length', headerName: 'Length (m)', visible: true, pinned: false, width: 100, category: 'routing', order: 13 },
      { field: 'elevation', headerName: 'Elevation', visible: true, pinned: false, width: 100, category: 'routing', order: 14 },
      { field: 'loadRating', headerName: 'Load Rating (kg/m)', visible: true, pinned: false, width: 140, category: 'metadata', order: 15 },
    ];
  }

  /**
   * Get comprehensive export columns for Tray entities (includes all available fields)
   */
  getComprehensiveExportColumns(): ColumnDefinition[] {
    return defaultTrayColumns.map(col => ({
      ...col,
      visible: true,
      pinned: false
    }));
  }
}

export const trayColumnService = TrayColumnService.getInstance();