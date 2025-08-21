// CableForge Filter Type Configuration
// Centralized filter type definitions and operator mappings

export interface FilterTypeConfig {
  field: string;
  dataType: 'text' | 'number' | 'enum' | 'boolean' | 'date';
  operators: FilterOperator[];
  defaultOperator: string;
  enumValues?: string[];
  numberRange?: { min: number; max: number };
  placeholder?: string;
  description?: string;
}

export interface FilterOperator {
  value: string;
  label: string;
  description: string;
  requiresValue: boolean;
  supportsMultiple?: boolean;
}

// Common filter operators
export const filterOperators = {
  // Text operators
  contains: { value: 'contains', label: 'Contains', description: 'Field contains the text', requiresValue: true, supportsMultiple: false },
  equals: { value: 'equals', label: 'Equals', description: 'Field equals exactly', requiresValue: true, supportsMultiple: false },
  startsWith: { value: 'starts_with', label: 'Starts With', description: 'Field starts with the text', requiresValue: true, supportsMultiple: false },
  endsWith: { value: 'ends_with', label: 'Ends With', description: 'Field ends with the text', requiresValue: true, supportsMultiple: false },
  isEmpty: { value: 'is_empty', label: 'Is Empty', description: 'Field is empty or null', requiresValue: false, supportsMultiple: false },
  isNotEmpty: { value: 'is_not_empty', label: 'Is Not Empty', description: 'Field has a value', requiresValue: false, supportsMultiple: false },
  
  // Number operators
  greaterThan: { value: 'greater_than', label: 'Greater Than', description: 'Field is greater than value', requiresValue: true, supportsMultiple: false },
  lessThan: { value: 'less_than', label: 'Less Than', description: 'Field is less than value', requiresValue: true, supportsMultiple: false },
  greaterEqual: { value: 'greater_equal', label: 'Greater or Equal', description: 'Field is greater than or equal to value', requiresValue: true, supportsMultiple: false },
  lessEqual: { value: 'less_equal', label: 'Less or Equal', description: 'Field is less than or equal to value', requiresValue: true, supportsMultiple: false },
  between: { value: 'between', label: 'Between', description: 'Field is between two values', requiresValue: true, supportsMultiple: false },
  
  // Enum operators
  in: { value: 'in', label: 'Is One Of', description: 'Field matches one of the selected values', requiresValue: true, supportsMultiple: true },
  notIn: { value: 'not_in', label: 'Is Not One Of', description: 'Field does not match any of the selected values', requiresValue: true, supportsMultiple: true },
  
  // Boolean operators
  isTrue: { value: 'is_true', label: 'Is True', description: 'Field is true', requiresValue: false, supportsMultiple: false },
  isFalse: { value: 'is_false', label: 'Is False', description: 'Field is false', requiresValue: false, supportsMultiple: false },
} as const;

// Cable field filter configurations
export const cableFilterConfigs: FilterTypeConfig[] = [
  {
    field: 'tag',
    dataType: 'text',
    operators: [filterOperators.contains, filterOperators.equals, filterOperators.startsWith, filterOperators.endsWith, filterOperators.isEmpty, filterOperators.isNotEmpty],
    defaultOperator: 'contains',
    placeholder: 'Cable tag...',
    description: 'Filter by cable tag/number'
  },
  {
    field: 'description',
    dataType: 'text',
    operators: [filterOperators.contains, filterOperators.equals, filterOperators.startsWith, filterOperators.endsWith, filterOperators.isEmpty, filterOperators.isNotEmpty],
    defaultOperator: 'contains',
    placeholder: 'Description...',
    description: 'Filter by cable description'
  },
  {
    field: 'fromEquipment',
    dataType: 'text',
    operators: [filterOperators.contains, filterOperators.equals, filterOperators.startsWith, filterOperators.endsWith, filterOperators.isEmpty, filterOperators.isNotEmpty],
    defaultOperator: 'contains',
    placeholder: 'From equipment...',
    description: 'Filter by source equipment'
  },
  {
    field: 'toEquipment',
    dataType: 'text',
    operators: [filterOperators.contains, filterOperators.equals, filterOperators.startsWith, filterOperators.endsWith, filterOperators.isEmpty, filterOperators.isNotEmpty],
    defaultOperator: 'contains',
    placeholder: 'To equipment...',
    description: 'Filter by destination equipment'
  },
  {
    field: 'fromLocation',
    dataType: 'text',
    operators: [filterOperators.contains, filterOperators.equals, filterOperators.startsWith, filterOperators.endsWith, filterOperators.isEmpty, filterOperators.isNotEmpty],
    defaultOperator: 'contains',
    placeholder: 'From location...',
    description: 'Filter by source location'
  },
  {
    field: 'toLocation',
    dataType: 'text',
    operators: [filterOperators.contains, filterOperators.equals, filterOperators.startsWith, filterOperators.endsWith, filterOperators.isEmpty, filterOperators.isNotEmpty],
    defaultOperator: 'contains',
    placeholder: 'To location...',
    description: 'Filter by destination location'
  },
  {
    field: 'voltage',
    dataType: 'number',
    operators: [filterOperators.equals, filterOperators.greaterThan, filterOperators.lessThan, filterOperators.greaterEqual, filterOperators.lessEqual, filterOperators.between, filterOperators.isEmpty, filterOperators.isNotEmpty],
    defaultOperator: 'equals',
    numberRange: { min: 0, max: 50000 },
    placeholder: 'Voltage (V)...',
    description: 'Filter by voltage rating'
  },
  {
    field: 'current',
    dataType: 'number',
    operators: [filterOperators.equals, filterOperators.greaterThan, filterOperators.lessThan, filterOperators.greaterEqual, filterOperators.lessEqual, filterOperators.between, filterOperators.isEmpty, filterOperators.isNotEmpty],
    defaultOperator: 'equals',
    numberRange: { min: 0, max: 10000 },
    placeholder: 'Current (A)...',
    description: 'Filter by current rating'
  },
  {
    field: 'function',
    dataType: 'enum',
    operators: [filterOperators.in, filterOperators.notIn, filterOperators.isEmpty, filterOperators.isNotEmpty],
    defaultOperator: 'in',
    enumValues: ['Power', 'Signal', 'Control', 'Instrumentation', 'Communication', 'Fiber', 'Coax'],
    description: 'Filter by cable function'
  },
  {
    field: 'cableType',
    dataType: 'text',
    operators: [filterOperators.contains, filterOperators.equals, filterOperators.startsWith, filterOperators.endsWith, filterOperators.isEmpty, filterOperators.isNotEmpty],
    defaultOperator: 'contains',
    placeholder: 'Cable type...',
    description: 'Filter by cable type/model'
  },
  {
    field: 'size',
    dataType: 'enum',
    operators: [filterOperators.in, filterOperators.notIn, filterOperators.isEmpty, filterOperators.isNotEmpty],
    defaultOperator: 'in',
    enumValues: ['14 AWG', '12 AWG', '10 AWG', '8 AWG', '6 AWG', '4 AWG', '2 AWG', '1/0 AWG', '2/0 AWG', '3/0 AWG', '4/0 AWG', '250 MCM', '350 MCM', '500 MCM', '750 MCM'],
    description: 'Filter by conductor size'
  },
  {
    field: 'cores',
    dataType: 'number',
    operators: [filterOperators.equals, filterOperators.greaterThan, filterOperators.lessThan, filterOperators.greaterEqual, filterOperators.lessEqual, filterOperators.between, filterOperators.isEmpty, filterOperators.isNotEmpty],
    defaultOperator: 'equals',
    numberRange: { min: 1, max: 500 },
    placeholder: 'Number of cores...',
    description: 'Filter by core count'
  },
  {
    field: 'length',
    dataType: 'number',
    operators: [filterOperators.equals, filterOperators.greaterThan, filterOperators.lessThan, filterOperators.greaterEqual, filterOperators.lessEqual, filterOperators.between, filterOperators.isEmpty, filterOperators.isNotEmpty],
    defaultOperator: 'equals',
    numberRange: { min: 0, max: 50000 },
    placeholder: 'Length (ft)...',
    description: 'Filter by cable length'
  },
  {
    field: 'route',
    dataType: 'text',
    operators: [filterOperators.contains, filterOperators.equals, filterOperators.startsWith, filterOperators.endsWith, filterOperators.isEmpty, filterOperators.isNotEmpty],
    defaultOperator: 'contains',
    placeholder: 'Route/path...',
    description: 'Filter by cable route'
  },
  {
    field: 'segregationClass',
    dataType: 'enum',
    operators: [filterOperators.in, filterOperators.notIn, filterOperators.isEmpty, filterOperators.isNotEmpty],
    defaultOperator: 'in',
    enumValues: ['Class 1', 'Class 2', 'Class 3', 'PELV', 'SELV'],
    description: 'Filter by segregation class'
  },
  {
    field: 'manufacturer',
    dataType: 'text',
    operators: [filterOperators.contains, filterOperators.equals, filterOperators.startsWith, filterOperators.endsWith, filterOperators.isEmpty, filterOperators.isNotEmpty],
    defaultOperator: 'contains',
    placeholder: 'Manufacturer...',
    description: 'Filter by cable manufacturer'
  },
  {
    field: 'partNumber',
    dataType: 'text',
    operators: [filterOperators.contains, filterOperators.equals, filterOperators.startsWith, filterOperators.endsWith, filterOperators.isEmpty, filterOperators.isNotEmpty],
    defaultOperator: 'contains',
    placeholder: 'Part number...',
    description: 'Filter by manufacturer part number'
  },
  {
    field: 'sparePercentage',
    dataType: 'number',
    operators: [filterOperators.equals, filterOperators.greaterThan, filterOperators.lessThan, filterOperators.greaterEqual, filterOperators.lessEqual, filterOperators.between, filterOperators.isEmpty, filterOperators.isNotEmpty],
    defaultOperator: 'equals',
    numberRange: { min: 0, max: 100 },
    placeholder: 'Spare %...',
    description: 'Filter by spare percentage'
  },
  {
    field: 'outerDiameter',
    dataType: 'number',
    operators: [filterOperators.equals, filterOperators.greaterThan, filterOperators.lessThan, filterOperators.greaterEqual, filterOperators.lessEqual, filterOperators.between, filterOperators.isEmpty, filterOperators.isNotEmpty],
    defaultOperator: 'equals',
    numberRange: { min: 0, max: 500 },
    placeholder: 'Diameter (mm)...',
    description: 'Filter by outer diameter'
  },
  {
    field: 'segregationWarning',
    dataType: 'boolean',
    operators: [filterOperators.isTrue, filterOperators.isFalse],
    defaultOperator: 'is_true',
    description: 'Filter by segregation warning status'
  },
  {
    field: 'notes',
    dataType: 'text',
    operators: [filterOperators.contains, filterOperators.equals, filterOperators.isEmpty, filterOperators.isNotEmpty],
    defaultOperator: 'contains',
    placeholder: 'Notes/comments...',
    description: 'Filter by notes or comments'
  }
];

// Helper service for filter configurations
export class FilterConfigService {
  /**
   * Get filter configuration for a field
   */
  public static getFilterConfig(fieldName: string): FilterTypeConfig | undefined {
    return cableFilterConfigs.find(config => config.field === fieldName);
  }
  
  /**
   * Get available operators for a field
   */
  public static getFieldOperators(fieldName: string): FilterOperator[] {
    const config = this.getFilterConfig(fieldName);
    return config?.operators || [filterOperators.contains];
  }
  
  /**
   * Get default operator for a field
   */
  public static getDefaultOperator(fieldName: string): string {
    const config = this.getFilterConfig(fieldName);
    return config?.defaultOperator || 'contains';
  }
  
  /**
   * Get field data type
   */
  public static getFieldType(fieldName: string): 'text' | 'number' | 'enum' | 'boolean' | 'date' {
    const config = this.getFilterConfig(fieldName);
    return config?.dataType || 'text';
  }
  
  /**
   * Get enum values for a field
   */
  public static getEnumValues(fieldName: string): string[] {
    const config = this.getFilterConfig(fieldName);
    return config?.enumValues || [];
  }
  
  /**
   * Get number range for a field
   */
  public static getNumberRange(fieldName: string): { min: number; max: number } | undefined {
    const config = this.getFilterConfig(fieldName);
    return config?.numberRange;
  }
  
  /**
   * Get placeholder text for a field
   */
  public static getPlaceholder(fieldName: string): string {
    const config = this.getFilterConfig(fieldName);
    return config?.placeholder || `Enter ${fieldName}...`;
  }
  
  /**
   * Check if an operator requires a value
   */
  public static operatorRequiresValue(operatorValue: string): boolean {
    const operator = Object.values(filterOperators).find(op => op.value === operatorValue);
    return operator?.requiresValue || false;
  }
  
  /**
   * Check if an operator supports multiple values
   */
  public static operatorSupportsMultiple(operatorValue: string): boolean {
    const operator = Object.values(filterOperators).find(op => op.value === operatorValue);
    return operator?.supportsMultiple || false;
  }
  
  /**
   * Get all filterable fields
   */
  public static getFilterableFields(): string[] {
    return cableFilterConfigs.map(config => config.field);
  }
  
  /**
   * Get filter suggestions based on field type and existing data
   */
  public static getFilterSuggestions(fieldName: string, data: any[]): FilterOperator[] {
    const config = this.getFilterConfig(fieldName);
    if (!config) return [filterOperators.contains];
    
    // Get unique values count for the field
    const uniqueValues = new Set(data.map(item => item[fieldName]).filter(Boolean));
    
    // If enum type with many unique values, might want to switch to text operators
    if (config.dataType === 'enum' && uniqueValues.size > 20) {
      return [filterOperators.contains, filterOperators.equals, ...config.operators];
    }
    
    return config.operators;
  }
}