import { validateCable, CableData } from '../cableValidation';

describe('Cable Validation Utilities', () => {
  const validCable: CableData = {
    tag: 'CBL-001',
    description: 'Test Cable',
    voltage: 480,
    function: 'Power',
    cableType: 'XLPE',
    size: '500MCM',
    cores: 3,
    fromLocation: 'MCC-1',
    toLocation: 'PANEL-A',
    length: 100.5,
    route: 'Direct',
    segregationClass: 'LV',
    sparePercentage: 20,
    loadPercentage: 85
  };

  describe('Tag Validation', () => {
    it('should accept valid tag formats', () => {
      const validTags = ['CBL-001', 'CBL-999', 'PWR-001', 'CTRL-001'];
      
      validTags.forEach(tag => {
        const cable = { ...validCable, tag };
        const result = validateCable(cable);
        expect(result.isValid).toBe(true);
        expect(result.errors.tag).toBeUndefined();
      });
    });

    it('should reject invalid tag formats', () => {
      const invalidTags = ['', 'CBL', '001', 'CBL-', 'CBL-A', 'cbl-001'];
      
      invalidTags.forEach(tag => {
        const cable = { ...validCable, tag };
        const result = validateCable(cable);
        expect(result.isValid).toBe(false);
        expect(result.errors.tag).toBeDefined();
      });
    });

    it('should check tag uniqueness when provided existing tags', () => {
      const existingTags = ['CBL-001', 'CBL-002'];
      const cable = { ...validCable, tag: 'CBL-001' };
      
      const result = validateCable(cable, { existingTags });
      expect(result.isValid).toBe(false);
      expect(result.errors.tag).toContain('already exists');
    });
  });

  describe('Voltage Validation', () => {
    it('should accept valid voltage values', () => {
      const validVoltages = [24, 48, 120, 240, 480, 4160, 13800];
      
      validVoltages.forEach(voltage => {
        const cable = { ...validCable, voltage };
        const result = validateCable(cable);
        expect(result.isValid).toBe(true);
        expect(result.errors.voltage).toBeUndefined();
      });
    });

    it('should reject negative voltages', () => {
      const cable = { ...validCable, voltage: -100 };
      const result = validateCable(cable);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.voltage).toContain('must be positive');
    });

    it('should reject extremely high voltages', () => {
      const cable = { ...validCable, voltage: 100000 };
      const result = validateCable(cable);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.voltage).toContain('exceeds maximum');
    });

    it('should allow zero voltage for communication cables', () => {
      const cable = { ...validCable, voltage: 0, function: 'Communication', cableType: 'Cat6' };
      const result = validateCable(cable);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.voltage).toBeUndefined();
    });
  });

  describe('Function and Type Compatibility', () => {
    it('should validate power cable types', () => {
      const powerTypes = ['XLPE', 'VFD', 'EPR'];
      
      powerTypes.forEach(cableType => {
        const cable = { ...validCable, function: 'Power', cableType };
        const result = validateCable(cable);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject incompatible function-type combinations', () => {
      const cable = { ...validCable, function: 'Communication', cableType: 'XLPE' };
      const result = validateCable(cable);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.cableType).toContain('incompatible with Communication');
    });

    it('should validate instrumentation cable requirements', () => {
      const cable = {
        ...validCable,
        function: 'Instrumentation',
        cableType: 'Instrumentation',
        voltage: 24,
        cores: 2
      };
      const result = validateCable(cable);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('Size and Cores Validation', () => {
    it('should validate wire gauge formats', () => {
      const validSizes = ['12AWG', '16AWG', '4/0AWG', '500MCM', 'Cat6'];
      
      validSizes.forEach(size => {
        const cable = { ...validCable, size };
        const result = validateCable(cable);
        expect(result.errors.size).toBeUndefined();
      });
    });

    it('should validate core count ranges', () => {
      const cable = { ...validCable, cores: 0 };
      let result = validateCable(cable);
      expect(result.errors.cores).toContain('must be at least 1');

      cable.cores = 100;
      result = validateCable(cable);
      expect(result.errors.cores).toContain('exceeds maximum');
    });

    it('should validate size-cores compatibility', () => {
      // Single core with multi-conductor size should warn
      const cable = { ...validCable, size: 'Cat6', cores: 1 };
      const result = validateCable(cable);
      
      expect(result.warnings?.cores).toContain('typically multi-conductor');
    });
  });

  describe('Location Validation', () => {
    it('should validate location naming conventions', () => {
      const validLocations = ['MCC-1', 'PANEL-A', 'VFD-001', 'MOTOR-001'];
      
      validLocations.forEach(location => {
        const cable = { ...validCable, fromLocation: location };
        const result = validateCable(cable);
        expect(result.errors.fromLocation).toBeUndefined();
      });
    });

    it('should reject invalid location formats', () => {
      const invalidLocations = ['mcc-1', 'Panel A', 'VFD@001'];
      
      invalidLocations.forEach(location => {
        const cable = { ...validCable, fromLocation: location };
        const result = validateCable(cable);
        expect(result.errors.fromLocation).toBeDefined();
      });
    });

    it('should prevent same from/to locations', () => {
      const cable = { ...validCable, fromLocation: 'MCC-1', toLocation: 'MCC-1' };
      const result = validateCable(cable);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.toLocation).toContain('cannot be the same');
    });
  });

  describe('Length and Route Validation', () => {
    it('should validate length ranges', () => {
      const cable = { ...validCable, length: 0 };
      let result = validateCable(cable);
      expect(result.errors.length).toContain('must be greater than 0');

      cable.length = 10000;
      result = validateCable(cable);
      expect(result.errors.length).toContain('exceeds practical maximum');
    });

    it('should warn about long direct routes', () => {
      const cable = { ...validCable, length: 500, route: 'Direct' };
      const result = validateCable(cable);
      
      expect(result.warnings?.route).toContain('Long cable with direct route');
    });

    it('should validate route appropriateness', () => {
      const cable = { ...validCable, length: 10, route: 'Cable Tray' };
      const result = validateCable(cable);
      
      expect(result.warnings?.route).toContain('Short cable in cable tray');
    });
  });

  describe('Percentage Validations', () => {
    it('should validate spare percentage ranges', () => {
      const cable = { ...validCable, sparePercentage: -5 };
      let result = validateCable(cable);
      expect(result.errors.sparePercentage).toContain('cannot be negative');

      cable.sparePercentage = 150;
      result = validateCable(cable);
      expect(result.errors.sparePercentage).toContain('cannot exceed 100%');
    });

    it('should validate load percentage ranges', () => {
      const cable = { ...validCable, loadPercentage: 0 };
      let result = validateCable(cable);
      expect(result.warnings?.loadPercentage).toContain('unusually low');

      cable.loadPercentage = 110;
      result = validateCable(cable);
      expect(result.errors.loadPercentage).toContain('cannot exceed 100%');
    });

    it('should warn about high load percentages', () => {
      const cable = { ...validCable, loadPercentage: 95 };
      const result = validateCable(cable);
      
      expect(result.warnings?.loadPercentage).toContain('High load percentage');
    });
  });

  describe('Segregation Class Validation', () => {
    it('should validate voltage-segregation compatibility', () => {
      // High voltage with ELV segregation should fail
      const cable = { ...validCable, voltage: 4160, segregationClass: 'ELV' };
      const result = validateCable(cable);
      
      expect(result.errors.segregationClass).toContain('High voltage incompatible with ELV');
    });

    it('should suggest appropriate segregation class', () => {
      const cable = { ...validCable, voltage: 12, segregationClass: 'HV' };
      const result = validateCable(cable);
      
      expect(result.warnings?.segregationClass).toContain('Consider ELV');
    });
  });

  describe('Comprehensive Validation', () => {
    it('should return multiple errors for invalid cable', () => {
      const invalidCable = {
        tag: '',
        description: '',
        voltage: -100,
        function: 'Invalid',
        cableType: '',
        size: '',
        cores: 0,
        fromLocation: '',
        toLocation: '',
        length: -10,
        route: '',
        segregationClass: '',
        sparePercentage: -5,
        loadPercentage: 110
      };

      const result = validateCable(invalidCable);
      
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors)).toHaveLength(14); // All required fields have errors
    });

    it('should provide field-specific error messages', () => {
      const cable = { ...validCable, tag: 'invalid', voltage: -100 };
      const result = validateCable(cable);
      
      expect(result.errors.tag).toContain('Invalid format');
      expect(result.errors.voltage).toContain('must be positive');
      expect(result.errors.description).toBeUndefined(); // Valid field
    });

    it('should distinguish between errors and warnings', () => {
      const cable = { 
        ...validCable, 
        loadPercentage: 95, // Warning
        length: 500,
        route: 'Direct' // Warning
      };
      const result = validateCable(cable);
      
      expect(result.isValid).toBe(true); // Warnings don't make it invalid
      expect(result.warnings?.loadPercentage).toBeDefined();
      expect(result.warnings?.route).toBeDefined();
    });
  });

  describe('Context-Aware Validation', () => {
    it('should validate against existing cable database', () => {
      const existingCables = [
        { tag: 'CBL-001', fromLocation: 'MCC-1', toLocation: 'PANEL-A' },
        { tag: 'CBL-002', fromLocation: 'MCC-1', toLocation: 'PANEL-B' }
      ];

      // Duplicate route should warn
      const cable = { ...validCable, fromLocation: 'MCC-1', toLocation: 'PANEL-A' };
      const result = validateCable(cable, { existingCables });
      
      expect(result.warnings?.route).toContain('Similar cable route exists');
    });

    it('should suggest sequential tag numbers', () => {
      const existingTags = ['CBL-001', 'CBL-002', 'CBL-004'];
      const result = validateCable(validCable, { existingTags, suggestTag: true });
      
      expect(result.suggestions?.tag).toBe('CBL-003');
    });
  });
});