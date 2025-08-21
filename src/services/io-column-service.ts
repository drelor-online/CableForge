/**
 * IO Points Column Service
 * Manages column definitions and settings for IO Points in exports and tables
 */

import { ColumnDefinition } from './column-service';
import { SETTINGS_KEYS } from '../types/settings';

export const defaultIOColumns: ColumnDefinition[] = [
  // Core identification
  { field: 'tag', headerName: 'Tag', visible: true, pinned: true, width: 120, category: 'core', required: true, order: 0 },
  { field: 'description', headerName: 'Description', visible: true, width: 200, category: 'core', order: 1 },
  
  // Signal properties
  { field: 'signalType', headerName: 'Signal Type', visible: true, width: 120, category: 'electrical', order: 2 },
  { field: 'ioType', headerName: 'I/O Type', visible: true, width: 100, category: 'electrical', order: 3 },
  { field: 'voltage', headerName: 'Voltage', visible: false, width: 80, category: 'electrical', order: 4 },
  { field: 'current', headerName: 'Current', visible: false, width: 80, category: 'electrical', order: 5 },
  
  // PLC assignment
  { field: 'plcName', headerName: 'PLC Name', visible: true, width: 120, category: 'physical', order: 6 },
  { field: 'rack', headerName: 'Rack', visible: true, width: 80, category: 'physical', order: 7 },
  { field: 'slot', headerName: 'Slot', visible: true, width: 80, category: 'physical', order: 8 },
  { field: 'channel', headerName: 'Channel', visible: true, width: 80, category: 'physical', order: 9 },
  { field: 'terminalBlock', headerName: 'Terminal Block', visible: false, width: 120, category: 'physical', order: 10 },
  
  // Field connection
  { field: 'fieldDevice', headerName: 'Field Device', visible: true, width: 150, category: 'routing', order: 11 },
  { field: 'location', headerName: 'Location', visible: true, width: 120, category: 'routing', order: 12 },
  { field: 'equipmentTag', headerName: 'Equipment Tag', visible: false, width: 120, category: 'routing', order: 13 },
  { field: 'wireNumber', headerName: 'Wire Number', visible: false, width: 100, category: 'routing', order: 14 },
  
  // Engineering data
  { field: 'scalingMin', headerName: 'Scale Min', visible: false, width: 100, category: 'metadata', order: 15 },
  { field: 'scalingMax', headerName: 'Scale Max', visible: false, width: 100, category: 'metadata', order: 16 },
  { field: 'units', headerName: 'Units', visible: false, width: 80, category: 'metadata', order: 17 },
  { field: 'alarmHigh', headerName: 'Alarm High', visible: false, width: 100, category: 'metadata', order: 18 },
  { field: 'alarmLow', headerName: 'Alarm Low', visible: false, width: 100, category: 'metadata', order: 19 },
  
  // Status and control
  { field: 'interlock', headerName: 'Interlock', visible: false, width: 100, category: 'metadata', order: 20 },
  { field: 'isSpare', headerName: 'Spare', visible: false, width: 80, category: 'metadata', order: 21 },
  { field: 'isActive', headerName: 'Active', visible: false, width: 80, category: 'metadata', order: 22 },
  
  // Documentation
  { field: 'notes', headerName: 'Notes', visible: false, width: 200, category: 'metadata', order: 23 },
];

class IOColumnService {
  private static instance: IOColumnService;

  public static getInstance(): IOColumnService {
    if (!IOColumnService.instance) {
      IOColumnService.instance = new IOColumnService();
    }
    return IOColumnService.instance;
  }

  saveIOColumnSettings(columns: ColumnDefinition[]): void {
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
      
      localStorage.setItem(SETTINGS_KEYS.IO_COLUMN_VISIBILITY, JSON.stringify(settings));
      console.log('IO column settings saved:', settings);
    } catch (error) {
      console.error('Failed to save IO column settings:', error);
    }
  }

  loadIOColumnSettings(): ColumnDefinition[] {
    try {
      const saved = localStorage.getItem(SETTINGS_KEYS.IO_COLUMN_VISIBILITY);
      if (!saved) {
        console.log('No saved IO column settings found, using defaults');
        return [...defaultIOColumns];
      }

      const settings = JSON.parse(saved);
      if (!settings.columns || !Array.isArray(settings.columns)) {
        console.log('Invalid IO column settings format, using defaults');
        return [...defaultIOColumns];
      }

      // Merge saved settings with default columns
      const mergedColumns = defaultIOColumns.map(defaultCol => {
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

      console.log('IO column settings loaded:', mergedColumns);
      return mergedColumns;
    } catch (error) {
      console.error('Failed to load IO column settings:', error);
      return [...defaultIOColumns];
    }
  }

  resetToDefaults(): ColumnDefinition[] {
    try {
      localStorage.removeItem(SETTINGS_KEYS.IO_COLUMN_VISIBILITY);
      console.log('IO column settings reset to defaults');
      return [...defaultIOColumns];
    } catch (error) {
      console.error('Failed to reset IO column settings:', error);
      return [...defaultIOColumns];
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
   * Get default export columns for IO points
   */
  getExportColumns(): ColumnDefinition[] {
    return [
      { field: 'tag', headerName: 'Tag', visible: true, pinned: false, width: 120, category: 'core', required: true, order: 0 },
      { field: 'description', headerName: 'Description', visible: true, pinned: false, width: 200, category: 'core', order: 1 },
      { field: 'signalType', headerName: 'Signal Type', visible: true, pinned: false, width: 120, category: 'electrical', order: 2 },
      { field: 'ioType', headerName: 'I/O Type', visible: true, pinned: false, width: 100, category: 'electrical', order: 3 },
      { field: 'plcName', headerName: 'PLC Name', visible: true, pinned: false, width: 120, category: 'physical', order: 4 },
      { field: 'rack', headerName: 'Rack', visible: true, pinned: false, width: 80, category: 'physical', order: 5 },
      { field: 'slot', headerName: 'Slot', visible: true, pinned: false, width: 80, category: 'physical', order: 6 },
      { field: 'channel', headerName: 'Channel', visible: true, pinned: false, width: 80, category: 'physical', order: 7 },
      { field: 'fieldDevice', headerName: 'Field Device', visible: true, pinned: false, width: 150, category: 'routing', order: 8 },
      { field: 'location', headerName: 'Location', visible: true, pinned: false, width: 120, category: 'routing', order: 9 },
      { field: 'voltage', headerName: 'Voltage', visible: true, pinned: false, width: 80, category: 'electrical', order: 10 },
      { field: 'current', headerName: 'Current', visible: true, pinned: false, width: 80, category: 'electrical', order: 11 },
      { field: 'units', headerName: 'Units', visible: true, pinned: false, width: 80, category: 'metadata', order: 12 },
      { field: 'notes', headerName: 'Notes', visible: true, pinned: false, width: 200, category: 'metadata', order: 13 },
    ];
  }

  /**
   * Get minimal export columns for IO points
   */
  getMinimalExportColumns(): ColumnDefinition[] {
    return [
      { field: 'tag', headerName: 'Tag', visible: true, pinned: false, width: 120, category: 'core', required: true, order: 0 },
      { field: 'description', headerName: 'Description', visible: true, pinned: false, width: 200, category: 'core', order: 1 },
      { field: 'signalType', headerName: 'Signal Type', visible: true, pinned: false, width: 120, category: 'electrical', order: 2 },
      { field: 'ioType', headerName: 'I/O Type', visible: true, pinned: false, width: 100, category: 'electrical', order: 3 },
      { field: 'plcName', headerName: 'PLC Name', visible: true, pinned: false, width: 120, category: 'physical', order: 4 },
      { field: 'fieldDevice', headerName: 'Field Device', visible: true, pinned: false, width: 150, category: 'routing', order: 5 },
    ];
  }

  /**
   * Get comprehensive export columns for IO points (includes all available fields)
   */
  getComprehensiveExportColumns(): ColumnDefinition[] {
    return defaultIOColumns.map(col => ({
      ...col,
      visible: true,
      pinned: false
    }));
  }
}

export const ioColumnService = IOColumnService.getInstance();