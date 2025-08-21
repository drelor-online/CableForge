import { SETTINGS_KEYS } from '../types/settings';

export interface FilterCondition {
  field: string;
  type: 'text' | 'number' | 'enum' | 'date' | 'boolean';
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 
           'greater_than' | 'less_than' | 'between' | 'in' | 'not_in' | 'is_empty' | 'is_not_empty';
  value: any;
  values?: any[]; // For multi-select filters
  caseSensitive?: boolean;
}

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: FilterCondition[];
  createdAt: Date;
  isDefault?: boolean;
}

export interface FilterState {
  activeFilters: FilterCondition[];
  presets: FilterPreset[];
  quickFilters: { [key: string]: boolean }; // For toggle filters like "Show only incomplete"
}

class FilterService {
  private static instance: FilterService;
  private currentState: FilterState = {
    activeFilters: [],
    presets: [],
    quickFilters: {}
  };

  public static getInstance(): FilterService {
    if (!FilterService.instance) {
      FilterService.instance = new FilterService();
    }
    return FilterService.instance;
  }

  constructor() {
    this.loadFilterState();
    this.initializeDefaultPresets();
  }

  // Filter state management
  getFilterState(): FilterState {
    return { ...this.currentState };
  }

  setActiveFilters(filters: FilterCondition[]): void {
    this.currentState.activeFilters = filters;
    this.saveFilterState();
  }

  addFilter(filter: FilterCondition): void {
    // Remove existing filter for the same field
    this.currentState.activeFilters = this.currentState.activeFilters.filter(f => f.field !== filter.field);
    this.currentState.activeFilters.push(filter);
    this.saveFilterState();
  }

  removeFilter(field: string): void {
    this.currentState.activeFilters = this.currentState.activeFilters.filter(f => f.field !== field);
    this.saveFilterState();
  }

  clearAllFilters(): void {
    this.currentState.activeFilters = [];
    this.currentState.quickFilters = {};
    this.saveFilterState();
  }

  hasActiveFilters(): boolean {
    return this.currentState.activeFilters.length > 0 || Object.values(this.currentState.quickFilters).some(Boolean);
  }

  // Quick filters
  setQuickFilter(key: string, enabled: boolean): void {
    this.currentState.quickFilters[key] = enabled;
    this.saveFilterState();
  }

  getQuickFilter(key: string): boolean {
    return this.currentState.quickFilters[key] || false;
  }

  // Presets management
  savePreset(preset: Omit<FilterPreset, 'id' | 'createdAt'>): FilterPreset {
    const newPreset: FilterPreset = {
      ...preset,
      id: this.generateId(),
      createdAt: new Date()
    };
    
    this.currentState.presets.push(newPreset);
    this.saveFilterState();
    return newPreset;
  }

  deletePreset(id: string): void {
    this.currentState.presets = this.currentState.presets.filter(p => p.id !== id);
    this.saveFilterState();
  }

  applyPreset(id: string): void {
    const preset = this.currentState.presets.find(p => p.id === id);
    if (preset) {
      this.currentState.activeFilters = [...preset.filters];
      this.saveFilterState();
    }
  }

  getPresets(): FilterPreset[] {
    return [...this.currentState.presets];
  }

  // Data filtering
  applyFilters<T extends Record<string, any>>(data: T[]): T[] {
    let filtered = [...data];

    // Apply active filters
    for (const filter of this.currentState.activeFilters) {
      filtered = this.applyFilter(filtered, filter);
    }

    // Apply quick filters
    for (const [key, enabled] of Object.entries(this.currentState.quickFilters)) {
      if (enabled) {
        filtered = this.applyQuickFilter(filtered, key);
      }
    }

    return filtered;
  }

  private applyFilter<T extends Record<string, any>>(data: T[], filter: FilterCondition): T[] {
    return data.filter(item => {
      const value = this.getFieldValue(item, filter.field);
      return this.evaluateCondition(value, filter);
    });
  }

  private applyQuickFilter<T extends Record<string, any>>(data: T[], key: string): T[] {
    switch (key) {
      case 'incomplete':
        return data.filter(item => !item.tag || !item.description || !item.fromEquipment || !item.toEquipment);
      case 'no_route':
        return data.filter(item => !item.route);
      case 'validation_errors':
        return data.filter(item => item.hasValidationErrors);
      case 'power_cables':
        return data.filter(item => item.function === 'Power');
      case 'signal_cables':
        return data.filter(item => item.function === 'Signal');
      case 'control_cables':
        return data.filter(item => item.function === 'Control');
      default:
        return data;
    }
  }

  private evaluateCondition(value: any, filter: FilterCondition): boolean {
    const { operator, value: filterValue, values, caseSensitive = false } = filter;

    // Handle null/undefined values
    if (value == null) {
      return operator === 'is_empty' || (operator === 'not_equals' && filterValue != null);
    }

    // Convert to string for text operations
    const stringValue = caseSensitive ? String(value) : String(value).toLowerCase();
    const stringFilterValue = caseSensitive ? String(filterValue) : String(filterValue).toLowerCase();

    switch (operator) {
      case 'equals':
        return filter.type === 'number' ? Number(value) === Number(filterValue) : stringValue === stringFilterValue;
      
      case 'not_equals':
        return filter.type === 'number' ? Number(value) !== Number(filterValue) : stringValue !== stringFilterValue;
      
      case 'contains':
        return stringValue.includes(stringFilterValue);
      
      case 'not_contains':
        return !stringValue.includes(stringFilterValue);
      
      case 'starts_with':
        return stringValue.startsWith(stringFilterValue);
      
      case 'ends_with':
        return stringValue.endsWith(stringFilterValue);
      
      case 'greater_than':
        return Number(value) > Number(filterValue);
      
      case 'less_than':
        return Number(value) < Number(filterValue);
      
      case 'between':
        const [min, max] = Array.isArray(filterValue) ? filterValue : [filterValue, filterValue];
        return Number(value) >= Number(min) && Number(value) <= Number(max);
      
      case 'in':
        return values ? values.some(v => caseSensitive ? value === v : String(value).toLowerCase() === String(v).toLowerCase()) : false;
      
      case 'not_in':
        return values ? !values.some(v => caseSensitive ? value === v : String(value).toLowerCase() === String(v).toLowerCase()) : true;
      
      case 'is_empty':
        return value == null || String(value).trim() === '';
      
      case 'is_not_empty':
        return value != null && String(value).trim() !== '';
      
      default:
        return true;
    }
  }

  private getFieldValue(item: Record<string, any>, field: string): any {
    return field.includes('.') ? this.getNestedValue(item, field) : item[field];
  }

  private getNestedValue(item: Record<string, any>, path: string): any {
    return path.split('.').reduce((obj, key) => obj?.[key], item);
  }

  // Get unique values for a field (for filter dropdowns)
  getUniqueValues<T extends Record<string, any>>(data: T[], field: string): any[] {
    const values = data
      .map(item => this.getFieldValue(item, field))
      .filter(value => value != null && value !== '')
      .map(value => String(value).trim())
      .filter(value => value !== '');

    return Array.from(new Set(values)).sort();
  }

  // Get filter suggestions based on field type
  getFilterSuggestions(field: string, type: FilterCondition['type']): { operator: FilterCondition['operator']; label: string }[] {
    switch (type) {
      case 'text':
        return [
          { operator: 'contains', label: 'Contains' },
          { operator: 'not_contains', label: 'Does not contain' },
          { operator: 'equals', label: 'Equals' },
          { operator: 'not_equals', label: 'Does not equal' },
          { operator: 'starts_with', label: 'Starts with' },
          { operator: 'ends_with', label: 'Ends with' },
          { operator: 'is_empty', label: 'Is empty' },
          { operator: 'is_not_empty', label: 'Is not empty' }
        ];
      
      case 'number':
        return [
          { operator: 'equals', label: 'Equals' },
          { operator: 'not_equals', label: 'Does not equal' },
          { operator: 'greater_than', label: 'Greater than' },
          { operator: 'less_than', label: 'Less than' },
          { operator: 'between', label: 'Between' },
          { operator: 'is_empty', label: 'Is empty' },
          { operator: 'is_not_empty', label: 'Is not empty' }
        ];
      
      case 'enum':
        return [
          { operator: 'in', label: 'Is one of' },
          { operator: 'not_in', label: 'Is not one of' },
          { operator: 'is_empty', label: 'Is empty' },
          { operator: 'is_not_empty', label: 'Is not empty' }
        ];
      
      default:
        return [
          { operator: 'equals', label: 'Equals' },
          { operator: 'not_equals', label: 'Does not equal' }
        ];
    }
  }

  // Persistence
  private saveFilterState(): void {
    try {
      const stateToSave = {
        ...this.currentState,
        lastModified: new Date().toISOString()
      };
      localStorage.setItem(SETTINGS_KEYS.GRID_PREFERENCES, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save filter state:', error);
    }
  }

  private loadFilterState(): void {
    try {
      const saved = localStorage.getItem(SETTINGS_KEYS.GRID_PREFERENCES);
      if (saved) {
        const state = JSON.parse(saved);
        this.currentState = {
          activeFilters: state.activeFilters || [],
          presets: state.presets || [],
          quickFilters: state.quickFilters || {}
        };
      }
    } catch (error) {
      console.error('Failed to load filter state:', error);
    }
  }

  private initializeDefaultPresets(): void {
    if (this.currentState.presets.length === 0) {
      const defaultPresets: Omit<FilterPreset, 'id' | 'createdAt'>[] = [
        {
          name: 'Incomplete Cables',
          description: 'Cables missing required information',
          filters: [],
          isDefault: true
        },
        {
          name: 'Power Cables Only',
          description: 'Show only power cables',
          filters: [
            {
              field: 'function',
              type: 'enum',
              operator: 'equals',
              value: 'Power'
            }
          ],
          isDefault: true
        },
        {
          name: 'Signal & Control',
          description: 'Communication and control cables',
          filters: [
            {
              field: 'function',
              type: 'enum',
              operator: 'in',
              value: null,
              values: ['Signal', 'Control', 'Communication']
            }
          ],
          isDefault: true
        },
        {
          name: 'High Voltage (>600V)',
          description: 'Cables with voltage greater than 600V',
          filters: [
            {
              field: 'voltage',
              type: 'number',
              operator: 'greater_than',
              value: 600
            }
          ],
          isDefault: true
        }
      ];

      defaultPresets.forEach(preset => this.savePreset(preset));
    }
  }

  private generateId(): string {
    return `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const filterService = FilterService.getInstance();