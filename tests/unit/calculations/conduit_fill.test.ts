import { describe, it, expect } from 'vitest';
import { ConduitFillCalculator } from '@/lib/calculations/conduit-fill';
import type { Cable, Conduit } from '@/types';

describe('ConduitFillCalculator', () => {
  const calculator = new ConduitFillCalculator();

  describe('calculateFillPercentage', () => {
    it('should calculate fill percentage for single cable', () => {
      const conduit: Conduit = {
        id: 1,
        tag: 'C01',
        type: 'EMT',
        size: '1"',
        internalDiameter: 1.049, // inches
        maxFillPercentage: 40,
        fillPercentage: 0,
        fromLocation: 'MCC-1',
        toLocation: 'PLC-1',
        cables: [],
        revisionId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const cables: Cable[] = [
        {
          id: 1,
          tag: 'C-001',
          outerDiameter: 0.5, // inches
          revisionId: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const fillPercentage = calculator.calculateFillPercentage(conduit, cables);
      
      // Cable area: π × (0.5/2)² = 0.196 sq in
      // Conduit area: π × (1.049/2)² = 0.864 sq in
      // Fill area (40%): 0.864 × 0.4 = 0.346 sq in
      // Fill percentage: 0.196 / 0.346 = 56.6%
      expect(fillPercentage).toBeCloseTo(56.6, 1);
    });

    it('should calculate fill percentage for multiple cables', () => {
      const conduit: Conduit = {
        id: 1,
        tag: 'C01',
        type: 'EMT',
        size: '3/4"',
        internalDiameter: 0.824, // inches
        maxFillPercentage: 40,
        fillPercentage: 0,
        fromLocation: 'MCC-1',
        toLocation: 'PLC-1',
        cables: [],
        revisionId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const cables: Cable[] = [
        {
          id: 1,
          tag: 'C-001',
          outerDiameter: 0.25, // 18 AWG
          revisionId: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          tag: 'C-002',
          outerDiameter: 0.32, // 16 AWG
          revisionId: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          tag: 'C-003',
          outerDiameter: 0.45, // 14 AWG
          revisionId: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const fillPercentage = calculator.calculateFillPercentage(conduit, cables);
      
      // Total cable area: π×(0.25/2)² + π×(0.32/2)² + π×(0.45/2)² = 0.289 sq in
      // Conduit area: π×(0.824/2)² = 0.533 sq in
      // Fill area (40%): 0.533 × 0.4 = 0.213 sq in
      // Fill percentage: 0.289 / 0.213 = 135.7% (over capacity)
      expect(fillPercentage).toBeCloseTo(135.7, 1);
    });

    it('should return 0 for conduit with no cables', () => {
      const conduit: Conduit = {
        id: 1,
        tag: 'C01',
        type: 'EMT',
        size: '1"',
        internalDiameter: 1.049,
        maxFillPercentage: 40,
        fillPercentage: 0,
        fromLocation: 'MCC-1',
        toLocation: 'PLC-1',
        cables: [],
        revisionId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const fillPercentage = calculator.calculateFillPercentage(conduit, []);
      expect(fillPercentage).toBe(0);
    });

    it('should handle cables without outer diameter', () => {
      const conduit: Conduit = {
        id: 1,
        tag: 'C01',
        type: 'EMT',
        size: '1"',
        internalDiameter: 1.049,
        maxFillPercentage: 40,
        fillPercentage: 0,
        fromLocation: 'MCC-1',
        toLocation: 'PLC-1',
        cables: [],
        revisionId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const cables: Cable[] = [
        {
          id: 1,
          tag: 'C-001',
          // outerDiameter is undefined
          revisionId: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      expect(() => calculator.calculateFillPercentage(conduit, cables))
        .toThrow('Cable C-001 missing outer diameter for fill calculation');
    });
  });

  describe('isOverCapacity', () => {
    it('should return true when fill exceeds maximum', () => {
      const conduit: Conduit = {
        id: 1,
        tag: 'C01',
        type: 'EMT',
        size: '1"',
        internalDiameter: 1.049,
        maxFillPercentage: 40,
        fillPercentage: 45, // Over capacity
        fromLocation: 'MCC-1',
        toLocation: 'PLC-1',
        cables: [],
        revisionId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(calculator.isOverCapacity(conduit)).toBe(true);
    });

    it('should return false when fill is within capacity', () => {
      const conduit: Conduit = {
        id: 1,
        tag: 'C01',
        type: 'EMT',
        size: '1"',
        internalDiameter: 1.049,
        maxFillPercentage: 40,
        fillPercentage: 35, // Within capacity
        fromLocation: 'MCC-1',
        toLocation: 'PLC-1',
        cables: [],
        revisionId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(calculator.isOverCapacity(conduit)).toBe(false);
    });
  });

  describe('getNECFillFactor', () => {
    it('should return 53% for single conductor', () => {
      expect(calculator.getNECFillFactor(1)).toBe(53);
    });

    it('should return 31% for two conductors', () => {
      expect(calculator.getNECFillFactor(2)).toBe(31);
    });

    it('should return 40% for three or more conductors', () => {
      expect(calculator.getNECFillFactor(3)).toBe(40);
      expect(calculator.getNECFillFactor(5)).toBe(40);
      expect(calculator.getNECFillFactor(10)).toBe(40);
    });

    it('should throw error for invalid conductor count', () => {
      expect(() => calculator.getNECFillFactor(0))
        .toThrow('Invalid conductor count: 0');
      expect(() => calculator.getNECFillFactor(-1))
        .toThrow('Invalid conductor count: -1');
    });
  });
});