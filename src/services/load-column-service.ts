/**
 * Load Column Service
 * Manages column definitions and settings for Load entities in exports and tables
 */

import { ColumnDefinition } from './column-service';
import { SETTINGS_KEYS } from '../types/settings';

export const defaultLoadColumns: ColumnDefinition[] = [
  // Core identification
  { field: 'tag', headerName: 'Tag', visible: true, pinned: true, width: 120, category: 'core', required: true, order: 0 },
  { field: 'description', headerName: 'Description', visible: true, width: 200, category: 'core', order: 1 },
  
  // Load classification
  { field: 'loadType', headerName: 'Load Type', visible: true, width: 120, category: 'electrical', order: 2 },
  { field: 'starterType', headerName: 'Starter Type', visible: false, width: 120, category: 'electrical', order: 3 },
  { field: 'protectionType', headerName: 'Protection Type', visible: false, width: 120, category: 'electrical', order: 4 },
  
  // Power specifications
  { field: 'powerKw', headerName: 'Power (kW)', visible: true, width: 100, category: 'electrical', order: 5 },
  { field: 'powerHp', headerName: 'Power (HP)', visible: false, width: 100, category: 'electrical', order: 6 },
  { field: 'voltage', headerName: 'Voltage (V)', visible: true, width: 100, category: 'electrical', order: 7 },
  { field: 'current', headerName: 'Current (A)', visible: true, width: 100, category: 'electrical', order: 8 },
  
  // Electrical characteristics
  { field: 'powerFactor', headerName: 'Power Factor', visible: false, width: 110, category: 'electrical', order: 9 },
  { field: 'efficiency', headerName: 'Efficiency (%)', visible: false, width: 110, category: 'electrical', order: 10 },
  
  // Demand calculations
  { field: 'demandFactor', headerName: 'Demand Factor', visible: false, width: 120, category: 'electrical', order: 11 },
  { field: 'connectedLoadKw', headerName: 'Connected Load (kW)', visible: false, width: 150, category: 'electrical', order: 12 },
  { field: 'demandLoadKw', headerName: 'Demand Load (kW)', visible: true, width: 140, category: 'electrical', order: 13 },
  
  // Cable connection
  { field: 'cableId', headerName: 'Cable ID', visible: false, width: 100, category: 'physical', order: 14 },
  { field: 'feederCable', headerName: 'Feeder Cable', visible: true, width: 120, category: 'physical', order: 15 },
  
  // Equipment details
  { field: 'manufacturer', headerName: 'Manufacturer', visible: false, width: 140, category: 'physical', order: 16 },
  { field: 'model', headerName: 'Model', visible: false, width: 120, category: 'physical', order: 17 },
  { field: 'serialNumber', headerName: 'Serial Number', visible: false, width: 120, category: 'physical', order: 18 },
  
  // Location and installation
  { field: 'location', headerName: 'Location', visible: false, width: 120, category: 'routing', order: 19 },
  { field: 'area', headerName: 'Area', visible: false, width: 100, category: 'routing', order: 20 },
  { field: 'building', headerName: 'Building', visible: false, width: 100, category: 'routing', order: 21 },
  { field: 'floor', headerName: 'Floor', visible: false, width: 80, category: 'routing', order: 22 },
  
  // Status and control
  { field: 'operatingMode', headerName: 'Operating Mode', visible: false, width: 120, category: 'metadata', order: 23 },
  { field: 'controlMethod', headerName: 'Control Method', visible: false, width: 120, category: 'metadata', order: 24 },
  { field: 'isEssential', headerName: 'Essential Load', visible: false, width: 110, category: 'metadata', order: 25 },
  { field: 'isCritical', headerName: 'Critical Load', visible: false, width: 100, category: 'metadata', order: 26 },
  
  // Documentation
  { field: 'notes', headerName: 'Notes', visible: false, width: 200, category: 'metadata', order: 27 },
];

class LoadColumnService {
  private static instance: LoadColumnService;

  public static getInstance(): LoadColumnService {
    if (!LoadColumnService.instance) {
      LoadColumnService.instance = new LoadColumnService();
    }
    return LoadColumnService.instance;
  }

  saveLoadColumnSettings(columns: ColumnDefinition[]): void {
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
      
      localStorage.setItem(SETTINGS_KEYS.LOAD_COLUMN_VISIBILITY, JSON.stringify(settings));
      console.log('Load column settings saved:', settings);
    } catch (error) {
      console.error('Failed to save Load column settings:', error);
    }
  }

  loadLoadColumnSettings(): ColumnDefinition[] {
    try {
      const saved = localStorage.getItem(SETTINGS_KEYS.LOAD_COLUMN_VISIBILITY);
      if (!saved) {
        console.log('No saved Load column settings found, using defaults');
        return [...defaultLoadColumns];
      }

      const settings = JSON.parse(saved);
      if (!settings.columns || !Array.isArray(settings.columns)) {
        console.log('Invalid Load column settings format, using defaults');
        return [...defaultLoadColumns];
      }

      // Merge saved settings with default columns
      const mergedColumns = defaultLoadColumns.map(defaultCol => {
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

      console.log('Load column settings loaded:', mergedColumns);
      return mergedColumns;
    } catch (error) {
      console.error('Failed to load Load column settings:', error);
      return [...defaultLoadColumns];
    }
  }

  resetToDefaults(): ColumnDefinition[] {
    try {
      localStorage.removeItem(SETTINGS_KEYS.LOAD_COLUMN_VISIBILITY);
      console.log('Load column settings reset to defaults');
      return [...defaultLoadColumns];
    } catch (error) {
      console.error('Failed to reset Load column settings:', error);
      return [...defaultLoadColumns];
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
   * Get default export columns for Load entities
   */
  getExportColumns(): ColumnDefinition[] {
    return [
      { field: 'tag', headerName: 'Tag', visible: true, pinned: false, width: 120, category: 'core', required: true, order: 0 },
      { field: 'description', headerName: 'Description', visible: true, pinned: false, width: 200, category: 'core', order: 1 },
      { field: 'loadType', headerName: 'Load Type', visible: true, pinned: false, width: 120, category: 'electrical', order: 2 },
      { field: 'powerKw', headerName: 'Power (kW)', visible: true, pinned: false, width: 100, category: 'electrical', order: 3 },
      { field: 'voltage', headerName: 'Voltage (V)', visible: true, pinned: false, width: 100, category: 'electrical', order: 4 },
      { field: 'current', headerName: 'Current (A)', visible: true, pinned: false, width: 100, category: 'electrical', order: 5 },
      { field: 'demandLoadKw', headerName: 'Demand Load (kW)', visible: true, pinned: false, width: 140, category: 'electrical', order: 6 },
      { field: 'feederCable', headerName: 'Feeder Cable', visible: true, pinned: false, width: 120, category: 'physical', order: 7 },
      { field: 'starterType', headerName: 'Starter Type', visible: true, pinned: false, width: 120, category: 'electrical', order: 8 },
      { field: 'protectionType', headerName: 'Protection Type', visible: true, pinned: false, width: 120, category: 'electrical', order: 9 },
      { field: 'notes', headerName: 'Notes', visible: true, pinned: false, width: 200, category: 'metadata', order: 10 },
    ];
  }

  /**
   * Get minimal export columns for Load entities
   */
  getMinimalExportColumns(): ColumnDefinition[] {
    return [
      { field: 'tag', headerName: 'Tag', visible: true, pinned: false, width: 120, category: 'core', required: true, order: 0 },
      { field: 'description', headerName: 'Description', visible: true, pinned: false, width: 200, category: 'core', order: 1 },
      { field: 'loadType', headerName: 'Load Type', visible: true, pinned: false, width: 120, category: 'electrical', order: 2 },
      { field: 'powerKw', headerName: 'Power (kW)', visible: true, pinned: false, width: 100, category: 'electrical', order: 3 },
      { field: 'voltage', headerName: 'Voltage (V)', visible: true, pinned: false, width: 100, category: 'electrical', order: 4 },
      { field: 'current', headerName: 'Current (A)', visible: true, pinned: false, width: 100, category: 'electrical', order: 5 },
    ];
  }

  /**
   * Get comprehensive export columns for Load entities (includes all available fields)
   */
  getComprehensiveExportColumns(): ColumnDefinition[] {
    return defaultLoadColumns.map(col => ({
      ...col,
      visible: true,
      pinned: false
    }));
  }

  /**
   * Get power analysis export columns
   */
  getPowerAnalysisExportColumns(): ColumnDefinition[] {
    return [
      { field: 'tag', headerName: 'Tag', visible: true, pinned: false, width: 120, category: 'core', required: true, order: 0 },
      { field: 'description', headerName: 'Description', visible: true, pinned: false, width: 200, category: 'core', order: 1 },
      { field: 'powerKw', headerName: 'Power (kW)', visible: true, pinned: false, width: 100, category: 'electrical', order: 2 },
      { field: 'powerHp', headerName: 'Power (HP)', visible: true, pinned: false, width: 100, category: 'electrical', order: 3 },
      { field: 'voltage', headerName: 'Voltage (V)', visible: true, pinned: false, width: 100, category: 'electrical', order: 4 },
      { field: 'current', headerName: 'Current (A)', visible: true, pinned: false, width: 100, category: 'electrical', order: 5 },
      { field: 'powerFactor', headerName: 'Power Factor', visible: true, pinned: false, width: 110, category: 'electrical', order: 6 },
      { field: 'efficiency', headerName: 'Efficiency (%)', visible: true, pinned: false, width: 110, category: 'electrical', order: 7 },
      { field: 'demandFactor', headerName: 'Demand Factor', visible: true, pinned: false, width: 120, category: 'electrical', order: 8 },
      { field: 'connectedLoadKw', headerName: 'Connected Load (kW)', visible: true, pinned: false, width: 150, category: 'electrical', order: 9 },
      { field: 'demandLoadKw', headerName: 'Demand Load (kW)', visible: true, pinned: false, width: 140, category: 'electrical', order: 10 },
    ];
  }
}

export const loadColumnService = LoadColumnService.getInstance();