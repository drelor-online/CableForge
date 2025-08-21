// CableForge Import Mapping Configuration
// Centralized field mapping heuristics for import operations

export interface FieldMappingRule {
  field: string;
  headerName: string;
  aliases: string[];
  patterns: string[];
  priority: number;
  required?: boolean;
  dataType: 'text' | 'number' | 'boolean' | 'enum' | 'date';
  validation?: {
    min?: number;
    max?: number;
    enumValues?: string[];
    format?: RegExp;
  };
}

// Core cable field mappings
export const cableFieldMappings: FieldMappingRule[] = [
  {
    field: 'tag',
    headerName: 'Cable Tag',
    aliases: ['cable tag', 'cable_tag', 'number', 'id', 'identifier', 'tag number', 'cable number'],
    patterns: ['^tag', '^cable.*tag', '^cable.*number', '^id$', '^identifier'],
    priority: 10,
    required: true,
    dataType: 'text',
    validation: {
      format: /^[A-Za-z0-9-_]+$/
    }
  },
  {
    field: 'description',
    headerName: 'Description',
    aliases: ['desc', 'name', 'title', 'cable description', 'cable name'],
    patterns: ['^desc', '^description', '^name$', '^title$'],
    priority: 8,
    dataType: 'text'
  },
  {
    field: 'fromEquipment',
    headerName: 'From Equipment',
    aliases: ['from', 'source', 'origin', 'from equipment', 'from_equipment', 'source equipment'],
    patterns: ['^from', '^source', '^origin', '.*from.*equipment'],
    priority: 9,
    dataType: 'text'
  },
  {
    field: 'toEquipment',
    headerName: 'To Equipment',
    aliases: ['to', 'destination', 'dest', 'to equipment', 'to_equipment', 'destination equipment'],
    patterns: ['^to', '^destination', '^dest', '.*to.*equipment'],
    priority: 9,
    dataType: 'text'
  },
  {
    field: 'fromLocation',
    headerName: 'From Location',
    aliases: ['from location', 'from_location', 'source location', 'origin location'],
    patterns: ['^from.*location', '^source.*location', '^origin.*location'],
    priority: 7,
    dataType: 'text'
  },
  {
    field: 'toLocation',
    headerName: 'To Location',
    aliases: ['to location', 'to_location', 'destination location', 'dest location'],
    patterns: ['^to.*location', '^dest.*location', '^destination.*location'],
    priority: 7,
    dataType: 'text'
  },
  {
    field: 'voltage',
    headerName: 'Voltage',
    aliases: ['volt', 'v', 'voltage rating', 'rated voltage', 'nominal voltage'],
    patterns: ['^volt', '^v$', '.*voltage', '.*volt.*rating'],
    priority: 8,
    dataType: 'number',
    validation: {
      min: 0,
      max: 50000
    }
  },
  {
    field: 'current',
    headerName: 'Current',
    aliases: ['amp', 'ampere', 'current rating', 'amps', 'rated current', 'nominal current'],
    patterns: ['^amp', '^current', '.*current.*rating', '.*amp.*rating'],
    priority: 8,
    dataType: 'number',
    validation: {
      min: 0,
      max: 10000
    }
  },
  {
    field: 'function',
    headerName: 'Function',
    aliases: ['function', 'cable function', 'type', 'cable type', 'purpose'],
    patterns: ['^function', '.*cable.*function', '^purpose$'],
    priority: 9,
    dataType: 'enum',
    validation: {
      enumValues: ['Power', 'Signal', 'Control', 'Instrumentation', 'Communication', 'Fiber', 'Coax']
    }
  },
  {
    field: 'cableType',
    headerName: 'Cable Type',
    aliases: ['type', 'cable type', 'cable_type', 'manufacturer type', 'part type'],
    patterns: ['^type$', '^cable.*type', '^manufacturer.*type'],
    priority: 7,
    dataType: 'text'
  },
  {
    field: 'size',
    headerName: 'Size',
    aliases: ['size', 'cable size', 'conductor size', 'awg', 'gauge'],
    patterns: ['^size', '.*conductor.*size', '^awg$', '^gauge$'],
    priority: 8,
    dataType: 'text'
  },
  {
    field: 'cores',
    headerName: 'Cores',
    aliases: ['cores', 'core count', 'conductors', 'conductor count', 'pairs'],
    patterns: ['^cores?$', '.*core.*count', '^conductors?$', '.*conductor.*count'],
    priority: 8,
    dataType: 'number',
    validation: {
      min: 1,
      max: 500
    }
  },
  {
    field: 'length',
    headerName: 'Length',
    aliases: ['length', 'cable length', 'distance', 'run length'],
    patterns: ['^length', '.*cable.*length', '^distance$', '.*run.*length'],
    priority: 7,
    dataType: 'number',
    validation: {
      min: 0,
      max: 50000
    }
  },
  {
    field: 'route',
    headerName: 'Route',
    aliases: ['route', 'cable route', 'routing', 'path', 'raceway'],
    patterns: ['^route', '.*cable.*route', '^routing$', '^path$', '^raceway$'],
    priority: 7,
    dataType: 'text'
  },
  {
    field: 'segregationClass',
    headerName: 'Segregation Class',
    aliases: ['segregation', 'seg class', 'class', 'separation class'],
    patterns: ['^segregation', '.*seg.*class', '^class$', '.*separation.*class'],
    priority: 6,
    dataType: 'enum',
    validation: {
      enumValues: ['Class 1', 'Class 2', 'Class 3', 'PELV', 'SELV']
    }
  },
  {
    field: 'manufacturer',
    headerName: 'Manufacturer',
    aliases: ['manufacturer', 'mfg', 'mfr', 'vendor', 'supplier', 'brand'],
    patterns: ['^manufacturer', '^mfg$', '^mfr$', '^vendor$', '^supplier$', '^brand$'],
    priority: 5,
    dataType: 'text'
  },
  {
    field: 'partNumber',
    headerName: 'Part Number',
    aliases: ['part number', 'part_number', 'part no', 'model', 'catalog number', 'cat no'],
    patterns: ['^part.*number', '^part.*no', '^model$', '.*catalog.*number', '^cat.*no'],
    priority: 6,
    dataType: 'text'
  },
  {
    field: 'sparePercentage',
    headerName: 'Spare Percentage',
    aliases: ['spare', 'spare %', 'spare percent', 'spare percentage'],
    patterns: ['^spare', '.*spare.*percent'],
    priority: 4,
    dataType: 'number',
    validation: {
      min: 0,
      max: 100
    }
  },
  {
    field: 'outerDiameter',
    headerName: 'Outer Diameter',
    aliases: ['outer diameter', 'od', 'outside diameter', 'cable diameter'],
    patterns: ['^od$', '.*outer.*diameter', '.*outside.*diameter', '.*cable.*diameter'],
    priority: 5,
    dataType: 'number',
    validation: {
      min: 0,
      max: 500
    }
  },
  {
    field: 'notes',
    headerName: 'Notes',
    aliases: ['notes', 'comments', 'remarks', 'description notes'],
    patterns: ['^notes?$', '^comments?$', '^remarks?$'],
    priority: 3,
    dataType: 'text'
  }
];

// Helper functions for field mapping
export class FieldMappingService {
  /**
   * Suggest field mappings based on header names
   */
  public static suggestFieldMapping(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    
    // Sort fields by priority (highest first)
    const sortedFields = [...cableFieldMappings].sort((a, b) => b.priority - a.priority);
    
    for (const field of sortedFields) {
      const matchedHeader = this.findBestMatch(field, headers);
      if (matchedHeader && !Object.values(mapping).includes(matchedHeader)) {
        mapping[field.field] = matchedHeader;
      }
    }
    
    return mapping;
  }
  
  /**
   * Find the best matching header for a field
   */
  private static findBestMatch(field: FieldMappingRule, headers: string[]): string | null {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    
    // Check exact matches with aliases first
    for (const alias of field.aliases) {
      const index = normalizedHeaders.indexOf(alias.toLowerCase());
      if (index !== -1) {
        return headers[index];
      }
    }
    
    // Check pattern matches
    for (const pattern of field.patterns) {
      const regex = new RegExp(pattern, 'i');
      for (let i = 0; i < normalizedHeaders.length; i++) {
        if (regex.test(normalizedHeaders[i])) {
          return headers[i];
        }
      }
    }
    
    // Check partial matches
    for (const alias of field.aliases) {
      for (let i = 0; i < normalizedHeaders.length; i++) {
        if (normalizedHeaders[i].includes(alias.toLowerCase()) || 
            alias.toLowerCase().includes(normalizedHeaders[i])) {
          return headers[i];
        }
      }
    }
    
    return null;
  }
  
  /**
   * Get field configuration by field name
   */
  public static getFieldConfig(fieldName: string): FieldMappingRule | undefined {
    return cableFieldMappings.find(f => f.field === fieldName);
  }
  
  /**
   * Validate field value against its configuration
   */
  public static validateFieldValue(fieldName: string, value: any): { isValid: boolean; errors: string[] } {
    const config = this.getFieldConfig(fieldName);
    if (!config) {
      return { isValid: true, errors: [] };
    }
    
    const errors: string[] = [];
    
    // Check required fields
    if (config.required && (value === null || value === undefined || value === '')) {
      errors.push(`${config.headerName} is required`);
      return { isValid: false, errors };
    }
    
    // Skip validation for empty optional fields
    if (!value && !config.required) {
      return { isValid: true, errors: [] };
    }
    
    // Type validation
    if (config.dataType === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        errors.push(`${config.headerName} must be a valid number`);
      } else if (config.validation) {
        if (config.validation.min !== undefined && numValue < config.validation.min) {
          errors.push(`${config.headerName} must be at least ${config.validation.min}`);
        }
        if (config.validation.max !== undefined && numValue > config.validation.max) {
          errors.push(`${config.headerName} must be at most ${config.validation.max}`);
        }
      }
    }
    
    // Enum validation
    if (config.dataType === 'enum' && config.validation?.enumValues) {
      if (!config.validation.enumValues.includes(String(value))) {
        errors.push(`${config.headerName} must be one of: ${config.validation.enumValues.join(', ')}`);
      }
    }
    
    // Format validation
    if (config.validation?.format && !config.validation.format.test(String(value))) {
      errors.push(`${config.headerName} has invalid format`);
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Get all required fields
   */
  public static getRequiredFields(): string[] {
    return cableFieldMappings.filter(f => f.required).map(f => f.field);
  }
  
  /**
   * Get field data type
   */
  public static getFieldType(fieldName: string): 'text' | 'number' | 'enum' | 'boolean' | 'date' {
    const config = this.getFieldConfig(fieldName);
    return config?.dataType || 'text';
  }
}