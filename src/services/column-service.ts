import { SETTINGS_KEYS } from '../types/settings';

export interface ColumnDefinition {
  field: string;
  headerName: string;
  visible: boolean;
  pinned?: boolean;
  width?: number;
  category: 'core' | 'electrical' | 'physical' | 'routing' | 'metadata';
  required?: boolean;
  order?: number;
}

export const defaultColumns: ColumnDefinition[] = [
  // Core fields (always visible)
  { field: 'tag', headerName: 'Tag', visible: true, pinned: true, width: 120, category: 'core', required: true, order: 0 },
  { field: 'description', headerName: 'Description', visible: true, width: 200, category: 'core', order: 1 },
  
  // Electrical
  { field: 'function', headerName: 'Function', visible: true, width: 120, category: 'electrical', order: 2 },
  { field: 'voltage', headerName: 'Voltage', visible: true, width: 100, category: 'electrical', order: 3 },
  { field: 'current', headerName: 'Current', visible: false, width: 100, category: 'electrical', order: 4 },
  { field: 'segregationClass', headerName: 'Segregation', visible: false, width: 120, category: 'electrical', order: 5 },
  
  // Physical
  { field: 'cableType', headerName: 'Cable Type', visible: true, width: 120, category: 'physical', order: 6 },
  { field: 'size', headerName: 'Size', visible: true, width: 100, category: 'physical', order: 7 },
  { field: 'cores', headerName: 'Cores', visible: true, width: 80, category: 'physical', order: 8 },
  { field: 'manufacturer', headerName: 'Manufacturer', visible: false, width: 140, category: 'physical', order: 9 },
  { field: 'partNumber', headerName: 'Part Number', visible: false, width: 140, category: 'physical', order: 10 },
  { field: 'outerDiameter', headerName: 'OD (mm)', visible: false, width: 100, category: 'physical', order: 11 },
  
  // Routing
  { field: 'fromLocation', headerName: 'From Location', visible: false, width: 140, category: 'routing', order: 12 },
  { field: 'fromEquipment', headerName: 'From Equipment', visible: true, width: 140, category: 'routing', order: 13 },
  { field: 'toLocation', headerName: 'To Location', visible: false, width: 140, category: 'routing', order: 14 },
  { field: 'toEquipment', headerName: 'To Equipment', visible: true, width: 140, category: 'routing', order: 15 },
  { field: 'route', headerName: 'Route', visible: true, width: 100, category: 'routing', order: 16 },
  { field: 'length', headerName: 'Length', visible: true, width: 100, category: 'routing', order: 17 },
  { field: 'sparePercentage', headerName: 'Spare %', visible: false, width: 100, category: 'routing', order: 18 },
  { field: 'calculatedLength', headerName: 'Calc. Length', visible: false, width: 120, category: 'routing', order: 19 },
  
  // Metadata
  { field: 'notes', headerName: 'Notes', visible: false, width: 200, category: 'metadata', order: 20 },
  { field: 'voltageDropPercentage', headerName: 'Voltage Drop %', visible: false, width: 130, category: 'metadata', order: 21 },
  { field: 'segregationWarning', headerName: 'Segregation Warning', visible: false, width: 160, category: 'metadata', order: 22 },
];

class ColumnService {
  private static instance: ColumnService;

  public static getInstance(): ColumnService {
    if (!ColumnService.instance) {
      ColumnService.instance = new ColumnService();
    }
    return ColumnService.instance;
  }

  saveColumnSettings(columns: ColumnDefinition[]): void {
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
      
      localStorage.setItem(SETTINGS_KEYS.COLUMN_VISIBILITY, JSON.stringify(settings));
      console.log('Column settings saved:', settings);
    } catch (error) {
      console.error('Failed to save column settings:', error);
    }
  }

  loadColumnSettings(): ColumnDefinition[] {
    try {
      const saved = localStorage.getItem(SETTINGS_KEYS.COLUMN_VISIBILITY);
      if (!saved) {
        console.log('No saved column settings found, using defaults');
        return [...defaultColumns];
      }

      const settings = JSON.parse(saved);
      if (!settings.columns || !Array.isArray(settings.columns)) {
        console.log('Invalid column settings format, using defaults');
        return [...defaultColumns];
      }

      // Merge saved settings with default columns
      const mergedColumns = defaultColumns.map(defaultCol => {
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

      console.log('Column settings loaded:', mergedColumns);
      return mergedColumns;
    } catch (error) {
      console.error('Failed to load column settings:', error);
      return [...defaultColumns];
    }
  }

  resetToDefaults(): ColumnDefinition[] {
    try {
      localStorage.removeItem(SETTINGS_KEYS.COLUMN_VISIBILITY);
      console.log('Column settings reset to defaults');
      return [...defaultColumns];
    } catch (error) {
      console.error('Failed to reset column settings:', error);
      return [...defaultColumns];
    }
  }

  getVisibleColumns(columns: ColumnDefinition[]): ColumnDefinition[] {
    return columns.filter(col => col.visible);
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
}

export const columnService = ColumnService.getInstance();