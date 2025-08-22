export interface CableData {
  id?: number;
  tag: string;
  description: string;
  voltage: number;
  function: string;
  cableType: string;
  size: string;
  cores: number;
  fromLocation: string;
  toLocation: string;
  length: number;
  route: string;
  segregationClass: string;
  sparePercentage: number;
  loadPercentage: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
  suggestions?: Record<string, string>;
}

export interface ValidationOptions {
  existingTags?: string[];
  existingCables?: Partial<CableData>[];
  suggestTag?: boolean;
}

export function validateCable(
  cable: Partial<CableData>,
  options: ValidationOptions = {}
): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};
  const suggestions: Record<string, string> = {};

  // Tag validation
  if (!cable.tag || cable.tag.trim() === '') {
    errors.tag = 'Tag is required';
  } else if (!/^[A-Z]{2,4}-\d{3}$/.test(cable.tag)) {
    errors.tag = 'Invalid format. Use format like CBL-001, PWR-001';
  } else if (options.existingTags?.includes(cable.tag)) {
    errors.tag = 'Tag already exists';
  }

  // Description validation
  if (!cable.description || cable.description.trim() === '') {
    errors.description = 'Description is required';
  }

  // Voltage validation
  if (cable.voltage === undefined || cable.voltage === null) {
    errors.voltage = 'Voltage is required';
  } else if (cable.voltage < 0) {
    errors.voltage = 'Voltage must be positive';
  } else if (cable.voltage > 50000) {
    errors.voltage = 'Voltage exceeds maximum allowed (50kV)';
  }
  
  // Allow zero voltage for communication cables
  if (cable.voltage === 0 && cable.function && cable.function !== 'Communication') {
    warnings.voltage = 'Zero voltage is unusual for non-communication cables';
  }

  // Function validation
  if (!cable.function) {
    errors.function = 'Function is required';
  } else {
    const validFunctions = ['Power', 'Control', 'Instrumentation', 'Communication'];
    if (!validFunctions.includes(cable.function)) {
      errors.function = 'Invalid function';
    }
  }

  // Cable type and function compatibility
  if (cable.function && cable.cableType) {
    const incompatibleCombos = [
      { function: 'Communication', types: ['XLPE', 'VFD', 'EPR'] },
      { function: 'Power', types: ['Cat6', 'Cat5e'] },
      { function: 'Instrumentation', types: ['VFD'] }
    ];

    const incompatible = incompatibleCombos.find(combo => 
      combo.function === cable.function && cable.cableType && combo.types.includes(cable.cableType)
    );

    if (incompatible) {
      errors.cableType = `Cable type ${cable.cableType} is incompatible with ${cable.function} function`;
    }
  }

  // Cores validation
  if (cable.cores !== undefined) {
    if (cable.cores < 1) {
      errors.cores = 'Core count must be at least 1';
    } else if (cable.cores > 48) {
      errors.cores = 'Core count exceeds maximum (48)';
    } else if (cable.size === 'Cat6' && cable.cores === 1) {
      warnings.cores = 'Cat6 cables are typically multi-conductor (8 cores)';
    }
  } else {
    errors.cores = 'Core count is required';
  }

  // Required field validations
  if (!cable.cableType || cable.cableType.trim() === '') {
    errors.cableType = 'Cable type is required';
  }
  
  if (!cable.size || cable.size.trim() === '') {
    errors.size = 'Size is required';
  }
  
  if (!cable.fromLocation || cable.fromLocation.trim() === '') {
    errors.fromLocation = 'From location is required';
  }
  
  if (!cable.toLocation || cable.toLocation.trim() === '') {
    errors.toLocation = 'To location is required';
  }
  
  if (!cable.route || cable.route.trim() === '') {
    errors.route = 'Route is required';
  }
  
  if (!cable.segregationClass || cable.segregationClass.trim() === '') {
    errors.segregationClass = 'Segregation class is required';
  }

  // Location validation
  const locationPattern = /^[A-Z0-9-]+$/;
  if (cable.fromLocation && !locationPattern.test(cable.fromLocation)) {
    errors.fromLocation = 'Invalid location format. Use uppercase letters, numbers, and hyphens only';
  }
  if (cable.toLocation && !locationPattern.test(cable.toLocation)) {
    errors.toLocation = 'Invalid location format. Use uppercase letters, numbers, and hyphens only';
  }
  if (cable.fromLocation && cable.toLocation && cable.fromLocation === cable.toLocation) {
    errors.toLocation = 'From and To locations cannot be the same';
  }

  // Length validation
  if (cable.length !== undefined) {
    if (cable.length <= 0) {
      errors.length = 'Length must be greater than 0';
    } else if (cable.length > 5000) {
      errors.length = 'Length exceeds practical maximum (5000 ft)';
    } else if (cable.length > 300 && cable.route === 'Direct') {
      warnings.route = 'Long cable with direct route may need intermediate support';
    } else if (cable.length < 20 && cable.route === 'Cable Tray') {
      warnings.route = 'Short cable in cable tray may be unnecessary';
    }
  }

  // Percentage validations
  if (cable.sparePercentage !== undefined) {
    if (cable.sparePercentage < 0) {
      errors.sparePercentage = 'Spare percentage cannot be negative';
    } else if (cable.sparePercentage > 100) {
      errors.sparePercentage = 'Spare percentage cannot exceed 100%';
    }
  }

  if (cable.loadPercentage !== undefined) {
    if (cable.loadPercentage < 0) {
      errors.loadPercentage = 'Load percentage cannot be negative';
    } else if (cable.loadPercentage > 100) {
      errors.loadPercentage = 'Load percentage cannot exceed 100%';
    } else if (cable.loadPercentage < 10) {
      warnings.loadPercentage = 'Load percentage seems unusually low';
    } else if (cable.loadPercentage > 90) {
      warnings.loadPercentage = 'High load percentage - consider larger cable';
    }
  }

  // Segregation class validation
  if (cable.voltage !== undefined && cable.segregationClass) {
    if (cable.voltage > 1000 && cable.segregationClass === 'ELV') {
      errors.segregationClass = 'High voltage incompatible with ELV segregation';
    } else if (cable.voltage < 50 && cable.segregationClass === 'HV') {
      warnings.segregationClass = 'Consider ELV segregation for low voltage cables';
    }
  }

  // Context-aware validation
  if (options.existingCables && cable.fromLocation && cable.toLocation) {
    const similarRoute = options.existingCables.find(existing => 
      existing.fromLocation === cable.fromLocation && 
      existing.toLocation === cable.toLocation
    );
    if (similarRoute) {
      warnings.route = 'Similar cable route exists - check if routing is intentional';
    }
  }

  // Tag suggestions
  if (options.suggestTag && options.existingTags) {
    const numbers = options.existingTags
      .filter(tag => tag.startsWith('CBL-'))
      .map(tag => parseInt(tag.split('-')[1]))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);
    
    if (numbers.length > 0) {
      // Find the first missing number in sequence
      let suggestedNumber = 1;
      for (let i = 0; i < numbers.length; i++) {
        if (numbers[i] === suggestedNumber) {
          suggestedNumber++;
        } else {
          break;
        }
      }
      suggestions.tag = `CBL-${String(suggestedNumber).padStart(3, '0')}`;
    }
  }

  const result: ValidationResult = {
    isValid: Object.keys(errors).length === 0,
    errors
  };

  if (Object.keys(warnings).length > 0) {
    result.warnings = warnings;
  }

  if (Object.keys(suggestions).length > 0) {
    result.suggestions = suggestions;
  }

  return result;
}