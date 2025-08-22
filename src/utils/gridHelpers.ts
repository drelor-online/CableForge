interface Cable {
  id: number;
  tag: string;
  description: string;
  voltage: number;
  function: string;
  cableType?: string;
  size?: string;
  cores?: number;
  fromLocation?: string;
  toLocation?: string;
  length: number;
  route?: string;
  segregationClass?: string;
  sparePercentage?: number;
  loadPercentage?: number;
}

// Formatting utilities
export function formatVoltage(voltage: number): string {
  if (voltage === 0) return '0V';
  if (voltage >= 10000) {
    return `${(voltage / 1000).toFixed(1).replace('.0', '')}kV`;
  }
  return `${voltage}V`;
}

export function formatLength(length: number, unit: 'imperial' | 'metric' = 'imperial'): string {
  if (unit === 'metric') {
    const meters = length * 0.3048; // Convert feet to meters
    return `${meters.toFixed(1)} m`;
  }
  // Remove unnecessary decimal for whole numbers
  return length % 1 === 0 ? `${length} ft` : `${length.toFixed(1)} ft`;
}

// Color utilities
export function getVoltageColor(voltage: number): string {
  if (voltage === 0) return '#6B7280'; // Gray for no voltage
  if (voltage <= 50) return '#10B981'; // Green for ELV
  if (voltage <= 600) return '#F59E0B'; // Yellow for LV
  if (voltage <= 35000) return '#EF4444'; // Red for MV
  return '#7C3AED'; // Purple for HV
}

export function getFunctionIcon(cableFunction: string): string {
  const icons: Record<string, string> = {
    'Power': '⚡',
    'Control': '🎛️',
    'Instrumentation': '📊',
    'Communication': '📡'
  };
  return icons[cableFunction] || '🔌';
}

// Sorting utilities
export function sortCables(
  cables: Cable[], 
  field: keyof Cable, 
  direction: 'asc' | 'desc' = 'asc'
): Cable[] {
  return [...cables].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const comparison = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
      return direction === 'asc' ? comparison : -comparison;
    }
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    return 0;
  });
}

// Filtering utilities
export function filterCables(
  cables: Cable[], 
  filters: Record<string, any>
): Cable[] {
  return cables.filter(cable => {
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '') continue;
      
      if (key === 'search') {
        const searchTerm = value.toLowerCase();
        const searchableFields = ['tag', 'description', 'fromLocation', 'toLocation', 'cableType'];
        const matches = searchableFields.some(field => 
          cable[field as keyof Cable]?.toString().toLowerCase().includes(searchTerm)
        );
        if (!matches) return false;
      } else if (key === 'voltageMin') {
        if (cable.voltage < value) return false;
      } else if (key === 'voltageMax') {
        if (cable.voltage > value) return false;
      } else {
        const cableValue = cable[key as keyof Cable];
        if (cableValue !== value) return false;
      }
    }
    return true;
  });
}

// Export utilities
export function exportToCSV(cables: Cable[], fields?: string[]): string {
  const selectedFields = fields || [
    'tag', 'description', 'voltage', 'function', 'cableType', 
    'size', 'cores', 'fromLocation', 'toLocation', 'length', 
    'route', 'segregationClass', 'sparePercentage', 'loadPercentage'
  ];
  
  const headers = selectedFields.join(',');
  const rows = cables.map(cable => 
    selectedFields.map(field => {
      const value = cable[field as keyof Cable];
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value?.toString() || '';
    }).join(',')
  );
  
  return [headers, ...rows].join('\n');
}

// Statistics utilities
export function calculateTotalLength(
  cables: Cable[], 
  filters?: Record<string, any>
): number {
  const filtered = filters ? filterCables(cables, filters) : cables;
  const total = filtered.reduce((sum, cable) => sum + cable.length, 0);
  return Math.round(total * 10) / 10; // Round to 1 decimal place
}

// Grouping utilities
export function groupCablesByFunction(
  cables: Cable[], 
  options: { includeStats?: boolean } = {}
): Record<string, Cable[] & { stats?: any }> {
  const grouped = cables.reduce((acc, cable) => {
    if (!acc[cable.function]) {
      acc[cable.function] = [];
    }
    acc[cable.function].push(cable);
    return acc;
  }, {} as Record<string, Cable[]>);
  
  if (options.includeStats) {
    Object.keys(grouped).forEach(functionName => {
      const cablesInGroup = grouped[functionName];
      (grouped[functionName] as any).stats = {
        count: cablesInGroup.length,
        totalLength: calculateTotalLength(cablesInGroup),
        avgVoltage: Math.round(
          cablesInGroup.reduce((sum, cable) => sum + cable.voltage, 0) / cablesInGroup.length
        )
      };
    });
  }
  
  return grouped;
}

// Import validation utilities
export function validateCableImport(
  csvData: string,
  options: { existingTags?: string[] } = {}
): {
  total: number;
  valid: number;
  invalid: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  parseError?: string;
} {
  const result = {
    total: 0,
    valid: 0,
    invalid: 0,
    errors: [] as Array<{ row: number; field: string; message: string; }>
  };
  
  try {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      return { ...result, parseError: 'CSV must contain headers and at least one data row' };
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    const requiredFields = ['tag', 'description', 'voltage', 'function'];
    
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    if (missingFields.length > 0) {
      return { 
        ...result, 
        parseError: `Missing required fields: ${missingFields.join(', ')}` 
      };
    }
    
    const dataLines = lines.slice(1);
    result.total = dataLines.length;
    
    const tagsInImport = new Set<string>();
    
    dataLines.forEach((line, index) => {
      const rowNumber = index + 2; // +2 because index is 0-based and we skip header
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      if (values.length !== headers.length) {
        result.errors.push({
          row: rowNumber,
          field: 'general',
          message: 'Column count mismatch'
        });
        result.invalid++;
        return;
      }
      
      const cable: any = {};
      headers.forEach((header, i) => {
        cable[header] = values[i];
      });
      
      let rowHasErrors = false;
      
      // Tag validation
      if (!cable.tag || cable.tag.trim() === '') {
        result.errors.push({
          row: rowNumber,
          field: 'tag',
          message: 'Tag is required'
        });
        rowHasErrors = true;
      } else if (tagsInImport.has(cable.tag)) {
        result.errors.push({
          row: rowNumber,
          field: 'tag',
          message: 'Duplicate tag in import data'
        });
        rowHasErrors = true;
      } else if (options.existingTags?.includes(cable.tag)) {
        result.errors.push({
          row: rowNumber,
          field: 'tag',
          message: 'Tag already exists in database'
        });
        rowHasErrors = true;
      } else {
        tagsInImport.add(cable.tag);
      }
      
      // Voltage validation
      const voltage = parseFloat(cable.voltage);
      if (isNaN(voltage) || voltage < 0) {
        result.errors.push({
          row: rowNumber,
          field: 'voltage',
          message: 'Invalid voltage value'
        });
        rowHasErrors = true;
      }
      
      // Function validation
      const validFunctions = ['Power', 'Control', 'Instrumentation', 'Communication'];
      if (!validFunctions.includes(cable.function)) {
        result.errors.push({
          row: rowNumber,
          field: 'function',
          message: 'Invalid function'
        });
        rowHasErrors = true;
      }
      
      if (rowHasErrors) {
        result.invalid++;
      } else {
        result.valid++;
      }
    });
    
    return result;
  } catch (error) {
    return {
      ...result,
      parseError: `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}