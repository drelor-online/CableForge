import { 
  formatVoltage, 
  formatLength, 
  getVoltageColor,
  getFunctionIcon,
  sortCables,
  filterCables,
  exportToCSV,
  calculateTotalLength,
  groupCablesByFunction,
  validateCableImport
} from '../gridHelpers';

describe('Grid Helper Utilities', () => {
  const sampleCables = [
    {
      id: 1,
      tag: 'CBL-001',
      description: 'Main Power Feed',
      voltage: 480,
      function: 'Power',
      cableType: 'XLPE',
      length: 150.5,
      cores: 3,
      fromLocation: 'MCC-1',
      toLocation: 'PANEL-A'
    },
    {
      id: 2,
      tag: 'CBL-002',
      description: 'Control Cable',
      voltage: 24,
      function: 'Control',
      cableType: 'PVC',
      length: 85.2,
      cores: 8,
      fromLocation: 'PLC-01',
      toLocation: 'VALVE-01'
    },
    {
      id: 3,
      tag: 'CBL-003',
      description: 'Instrumentation Signal',
      voltage: 24,
      function: 'Instrumentation',
      cableType: 'Instrumentation',
      length: 45.8,
      cores: 2,
      fromLocation: 'AI-MODULE',
      toLocation: 'PT-001'
    }
  ];

  describe('formatVoltage', () => {
    it('should format standard voltages with V suffix', () => {
      expect(formatVoltage(24)).toBe('24V');
      expect(formatVoltage(480)).toBe('480V');
      expect(formatVoltage(4160)).toBe('4160V');
    });

    it('should format high voltages with kV', () => {
      expect(formatVoltage(13800)).toBe('13.8kV');
      expect(formatVoltage(34500)).toBe('34.5kV');
      expect(formatVoltage(138000)).toBe('138kV');
    });

    it('should handle zero voltage for communication cables', () => {
      expect(formatVoltage(0)).toBe('0V');
    });

    it('should handle decimal voltages', () => {
      expect(formatVoltage(208.5)).toBe('208.5V');
      expect(formatVoltage(13.8)).toBe('13.8V');
    });
  });

  describe('formatLength', () => {
    it('should format length with appropriate units', () => {
      expect(formatLength(150.5)).toBe('150.5 ft');
      expect(formatLength(45)).toBe('45 ft');
      expect(formatLength(1000)).toBe('1000 ft');
    });

    it('should handle metric conversion option', () => {
      expect(formatLength(150.5, 'metric')).toBe('45.9 m');
      expect(formatLength(100, 'metric')).toBe('30.5 m');
    });

    it('should round to reasonable precision', () => {
      expect(formatLength(150.547, 'imperial')).toBe('150.5 ft');
      expect(formatLength(150.547, 'metric')).toBe('45.9 m');
    });
  });

  describe('getVoltageColor', () => {
    it('should return appropriate colors for voltage levels (USA standards)', () => {
      expect(getVoltageColor(0)).toBe('#6B7280'); // Gray for no voltage
      expect(getVoltageColor(24)).toBe('#10B981'); // Green for ELV
      expect(getVoltageColor(120)).toBe('#F59E0B'); // Yellow for LV
      expect(getVoltageColor(480)).toBe('#F59E0B'); // Yellow for LV (USA: ≤600V is LV)
      expect(getVoltageColor(4160)).toBe('#EF4444'); // Red for MV
      expect(getVoltageColor(69000)).toBe('#7C3AED'); // Purple for HV
    });

    it('should handle edge cases at voltage boundaries (USA standards)', () => {
      expect(getVoltageColor(50)).toBe('#10B981'); // ELV boundary
      expect(getVoltageColor(600)).toBe('#F59E0B'); // LV upper boundary (USA)
      expect(getVoltageColor(1000)).toBe('#EF4444'); // MV range
    });
  });

  describe('getFunctionIcon', () => {
    it('should return appropriate icons for cable functions', () => {
      expect(getFunctionIcon('Power')).toBe('⚡');
      expect(getFunctionIcon('Control')).toBe('🎛️');
      expect(getFunctionIcon('Instrumentation')).toBe('📊');
      expect(getFunctionIcon('Communication')).toBe('📡');
    });

    it('should return default icon for unknown function', () => {
      expect(getFunctionIcon('Unknown')).toBe('🔌');
      expect(getFunctionIcon('')).toBe('🔌');
    });
  });

  describe('sortCables', () => {
    it('should sort by tag ascending', () => {
      const sorted = sortCables(sampleCables, 'tag', 'asc');
      expect(sorted[0].tag).toBe('CBL-001');
      expect(sorted[2].tag).toBe('CBL-003');
    });

    it('should sort by voltage descending', () => {
      const sorted = sortCables(sampleCables, 'voltage', 'desc');
      expect(sorted[0].voltage).toBe(480);
      expect(sorted[1].voltage).toBe(24);
    });

    it('should sort by length ascending', () => {
      const sorted = sortCables(sampleCables, 'length', 'asc');
      expect(sorted[0].length).toBe(45.8);
      expect(sorted[2].length).toBe(150.5);
    });

    it('should handle string sorting case-insensitively', () => {
      const cables = [
        { ...sampleCables[0], description: 'zebra' },
        { ...sampleCables[1], description: 'Apple' },
        { ...sampleCables[2], description: 'banana' }
      ];
      
      const sorted = sortCables(cables, 'description', 'asc');
      expect(sorted[0].description).toBe('Apple');
      expect(sorted[1].description).toBe('banana');
      expect(sorted[2].description).toBe('zebra');
    });
  });

  describe('filterCables', () => {
    it('should filter by single field', () => {
      const filtered = filterCables(sampleCables, { function: 'Power' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].function).toBe('Power');
    });

    it('should filter by multiple fields', () => {
      const filtered = filterCables(sampleCables, { 
        voltage: 24, 
        function: 'Control' 
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].tag).toBe('CBL-002');
    });

    it('should filter by text search', () => {
      const filtered = filterCables(sampleCables, { search: 'Control' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].description).toContain('Control');
    });

    it('should perform case-insensitive text search', () => {
      const filtered = filterCables(sampleCables, { search: 'control' });
      expect(filtered).toHaveLength(1);
    });

    it('should search across multiple fields', () => {
      const filtered = filterCables(sampleCables, { search: 'MCC' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].fromLocation).toBe('MCC-1');
    });

    it('should filter by voltage range', () => {
      const filtered = filterCables(sampleCables, { 
        voltageMin: 20, 
        voltageMax: 100 
      });
      expect(filtered).toHaveLength(2);
      expect(filtered.every(cable => cable.voltage >= 20 && cable.voltage <= 100)).toBe(true);
    });

    it('should return empty array when no matches', () => {
      const filtered = filterCables(sampleCables, { function: 'NonExistent' });
      expect(filtered).toHaveLength(0);
    });
  });

  describe('exportToCSV', () => {
    it('should generate CSV with headers', () => {
      const csv = exportToCSV(sampleCables);
      const lines = csv.split('\n');
      
      expect(lines[0]).toContain('tag,description,voltage,function');
    });

    it('should include all cable data', () => {
      const csv = exportToCSV(sampleCables);
      const lines = csv.split('\n');
      
      expect(lines).toHaveLength(4); // Header + 3 data rows
      expect(lines[1]).toContain('CBL-001');
      expect(lines[2]).toContain('CBL-002');
      expect(lines[3]).toContain('CBL-003');
    });

    it('should handle special characters in descriptions', () => {
      const cables = [{
        ...sampleCables[0],
        description: 'Cable with "quotes" and, commas'
      }];
      
      const csv = exportToCSV(cables);
      expect(csv).toContain('"Cable with ""quotes"" and, commas"');
    });

    it('should allow custom field selection', () => {
      const csv = exportToCSV(sampleCables, ['tag', 'voltage']);
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('tag,voltage');
      expect(lines[1]).toBe('CBL-001,480');
    });
  });

  describe('calculateTotalLength', () => {
    it('should sum cable lengths', () => {
      const total = calculateTotalLength(sampleCables);
      expect(total).toBe(281.5); // 150.5 + 85.2 + 45.8
    });

    it('should handle empty array', () => {
      const total = calculateTotalLength([]);
      expect(total).toBe(0);
    });

    it('should filter by function before calculating', () => {
      const total = calculateTotalLength(sampleCables, { function: 'Control' });
      expect(total).toBe(85.2);
    });

    it('should round to reasonable precision', () => {
      const cables = [{ ...sampleCables[0], length: 10.333 }];
      const total = calculateTotalLength(cables);
      expect(total).toBe(10.3);
    });
  });

  describe('groupCablesByFunction', () => {
    it('should group cables by function', () => {
      const grouped = groupCablesByFunction(sampleCables);
      
      expect(grouped.Power).toHaveLength(1);
      expect(grouped.Control).toHaveLength(1);
      expect(grouped.Instrumentation).toHaveLength(1);
    });

    it('should include summary statistics', () => {
      const grouped = groupCablesByFunction(sampleCables, { includeStats: true });
      
      expect(grouped.Power.stats.totalLength).toBe(150.5);
      expect(grouped.Power.stats.count).toBe(1);
      expect(grouped.Control.stats.avgVoltage).toBe(24);
    });

    it('should handle empty groups', () => {
      const cables = [sampleCables[0]]; // Only Power cable
      const grouped = groupCablesByFunction(cables);
      
      expect(grouped.Power).toHaveLength(1);
      expect(grouped.Control).toBeUndefined();
    });
  });

  describe('validateCableImport', () => {
    const csvData = `tag,description,voltage,function
CBL-001,Power Cable,480,Power
CBL-002,Control Cable,24,Control
,Missing Tag,240,Power
CBL-003,Invalid Voltage,-100,Power`;

    it('should parse CSV and validate each row', () => {
      const result = validateCableImport(csvData);
      
      expect(result.total).toBe(4);
      expect(result.valid).toBe(2);
      expect(result.invalid).toBe(2);
    });

    it('should identify specific validation errors', () => {
      const result = validateCableImport(csvData);
      
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].row).toBe(4);
      expect(result.errors[0].field).toBe('tag');
      expect(result.errors[1].row).toBe(5);
      expect(result.errors[1].field).toBe('voltage');
    });

    it('should handle malformed CSV gracefully', () => {
      const malformedCSV = 'tag,description\nCBL-001,"Unclosed quote';
      const result = validateCableImport(malformedCSV);
      
      expect(result.parseError).toBeDefined();
      expect(result.total).toBe(0);
    });

    it('should detect duplicate tags in import', () => {
      const duplicateCSV = `tag,description,voltage,function
CBL-001,Cable 1,480,Power
CBL-001,Cable 2,240,Control`;
      
      const result = validateCableImport(duplicateCSV);
      expect(result.errors.some(e => e.message.includes('Duplicate tag in import data'))).toBe(true);
    });

    it('should validate against existing cables', () => {
      const existingTags = ['CBL-001'];
      const result = validateCableImport(csvData, { existingTags });
      
      expect(result.errors.some(e => 
        e.field === 'tag' && e.message.includes('already exists')
      )).toBe(true);
    });
  });

  describe('Performance with Large Datasets', () => {
    const largeCableSet = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      tag: `CBL-${String(i + 1).padStart(3, '0')}`,
      description: `Cable ${i + 1}`,
      voltage: [24, 120, 480, 4160][i % 4],
      function: ['Power', 'Control', 'Instrumentation'][i % 3],
      length: Math.random() * 500 + 10,
      cores: Math.floor(Math.random() * 8) + 1
    }));

    it('should filter large datasets efficiently', () => {
      const startTime = performance.now();
      const filtered = filterCables(largeCableSet, { function: 'Power' });
      const endTime = performance.now();
      
      expect(filtered.length).toBeGreaterThan(300);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should sort large datasets efficiently', () => {
      const startTime = performance.now();
      const sorted = sortCables(largeCableSet, 'voltage', 'desc');
      const endTime = performance.now();
      
      expect(sorted[0].voltage).toBeGreaterThanOrEqual(sorted[999].voltage);
      expect(endTime - startTime).toBeLessThan(50); // Should complete in under 50ms
    });

    it('should export large datasets efficiently', () => {
      const startTime = performance.now();
      const csv = exportToCSV(largeCableSet);
      const endTime = performance.now();
      
      expect(csv.split('\n')).toHaveLength(1001); // Header + 1000 rows
      expect(endTime - startTime).toBeLessThan(200); // Should complete in under 200ms
    });
  });
});