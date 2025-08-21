// Web Worker for heavy filtering operations
// This runs in a separate thread to avoid blocking the UI

export interface FilterWorkerMessage {
  type: 'FILTER_DATA' | 'VALIDATE_DATA' | 'SORT_DATA';
  payload: any;
  id: string;
}

export interface FilterWorkerResponse {
  type: 'FILTER_RESULT' | 'VALIDATE_RESULT' | 'SORT_RESULT' | 'ERROR';
  payload: any;
  id: string;
}

export interface FilterCondition {
  field: string;
  type: 'text' | 'number' | 'enum' | 'boolean' | 'date';
  operator: string;
  value: any;
  values?: any[];
  caseSensitive?: boolean;
}

// Main message handler
self.onmessage = function(event: MessageEvent<FilterWorkerMessage>) {
  const { type, payload, id } = event.data;

  try {
    switch (type) {
      case 'FILTER_DATA':
        handleFilterData(payload, id);
        break;
      case 'VALIDATE_DATA':
        handleValidateData(payload, id);
        break;
      case 'SORT_DATA':
        handleSortData(payload, id);
        break;
      default:
        postMessage({
          type: 'ERROR',
          payload: { error: `Unknown message type: ${type}` },
          id
        });
    }
  } catch (error) {
    postMessage({
      type: 'ERROR',
      payload: { error: error instanceof Error ? error.message : 'Unknown error' },
      id
    });
  }
};

function handleFilterData(payload: { data: any[]; filters: FilterCondition[] }, id: string) {
  const { data, filters } = payload;
  
  if (!filters || filters.length === 0) {
    postMessage({
      type: 'FILTER_RESULT',
      payload: { filteredData: data, count: data.length },
      id
    });
    return;
  }

  const filteredData = data.filter(item => {
    return filters.every(filter => applyFilter(item, filter));
  });

  postMessage({
    type: 'FILTER_RESULT',
    payload: { filteredData, count: filteredData.length },
    id
  });
}

function handleValidateData(payload: { data: any[]; rules: any[] }, id: string) {
  const { data, rules } = payload;
  const validationResults = data.map((item, index) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    rules.forEach(rule => {
      const value = item[rule.field];
      const result = validateField(value, rule);
      
      if (result.errors.length > 0) {
        errors.push(...result.errors);
      }
      if (result.warnings.length > 0) {
        warnings.push(...result.warnings);
      }
    });

    return {
      index,
      isValid: errors.length === 0,
      errors,
      warnings
    };
  });

  postMessage({
    type: 'VALIDATE_RESULT',
    payload: { validationResults },
    id
  });
}

function handleSortData(payload: { data: any[]; sortConfig: { field: string; direction: 'asc' | 'desc' } }, id: string) {
  const { data, sortConfig } = payload;
  
  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortConfig.field];
    const bValue = b[sortConfig.field];
    
    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
    if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
    
    // Compare values
    let comparison = 0;
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue);
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else {
      comparison = String(aValue).localeCompare(String(bValue));
    }
    
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  postMessage({
    type: 'SORT_RESULT',
    payload: { sortedData },
    id
  });
}

function applyFilter(item: any, filter: FilterCondition): boolean {
  const value = item[filter.field];
  
  switch (filter.operator) {
    case 'equals':
      return value == filter.value;
    case 'not_equals':
      return value != filter.value;
    case 'contains':
      if (!value) return false;
      const searchStr = filter.caseSensitive ? String(value) : String(value).toLowerCase();
      const filterStr = filter.caseSensitive ? String(filter.value) : String(filter.value).toLowerCase();
      return searchStr.includes(filterStr);
    case 'not_contains':
      if (!value) return true;
      const searchStr2 = filter.caseSensitive ? String(value) : String(value).toLowerCase();
      const filterStr2 = filter.caseSensitive ? String(filter.value) : String(filter.value).toLowerCase();
      return !searchStr2.includes(filterStr2);
    case 'starts_with':
      if (!value) return false;
      const startStr = filter.caseSensitive ? String(value) : String(value).toLowerCase();
      const startFilter = filter.caseSensitive ? String(filter.value) : String(filter.value).toLowerCase();
      return startStr.startsWith(startFilter);
    case 'ends_with':
      if (!value) return false;
      const endStr = filter.caseSensitive ? String(value) : String(value).toLowerCase();
      const endFilter = filter.caseSensitive ? String(filter.value) : String(filter.value).toLowerCase();
      return endStr.endsWith(endFilter);
    case 'greater_than':
      return Number(value) > Number(filter.value);
    case 'less_than':
      return Number(value) < Number(filter.value);
    case 'greater_equal':
      return Number(value) >= Number(filter.value);
    case 'less_equal':
      return Number(value) <= Number(filter.value);
    case 'between':
      if (!Array.isArray(filter.value) || filter.value.length !== 2) return false;
      const numValue = Number(value);
      return numValue >= Number(filter.value[0]) && numValue <= Number(filter.value[1]);
    case 'in':
      return filter.values ? filter.values.includes(value) : false;
    case 'not_in':
      return filter.values ? !filter.values.includes(value) : true;
    case 'is_empty':
      return value == null || value === '' || value === undefined;
    case 'is_not_empty':
      return value != null && value !== '' && value !== undefined;
    case 'is_true':
      return Boolean(value) === true;
    case 'is_false':
      return Boolean(value) === false;
    default:
      return true;
  }
}

function validateField(value: any, rule: any): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (rule.required && (value == null || value === '')) {
    errors.push(`${rule.label || rule.field} is required`);
    return { errors, warnings };
  }

  // Skip further validation for empty optional fields
  if (!rule.required && (value == null || value === '')) {
    return { errors, warnings };
  }

  // Type validation
  if (rule.type === 'number') {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      errors.push(`${rule.label || rule.field} must be a valid number`);
    } else {
      if (rule.min !== undefined && numValue < rule.min) {
        errors.push(`${rule.label || rule.field} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && numValue > rule.max) {
        errors.push(`${rule.label || rule.field} must be at most ${rule.max}`);
      }
    }
  }

  // Enum validation
  if (rule.type === 'enum' && rule.enumValues) {
    if (!rule.enumValues.includes(String(value))) {
      errors.push(`${rule.label || rule.field} must be one of: ${rule.enumValues.join(', ')}`);
    }
  }

  // Format validation
  if (rule.format && !rule.format.test(String(value))) {
    errors.push(`${rule.label || rule.field} has invalid format`);
  }

  return { errors, warnings };
}

export {}; // Ensure this is treated as a module