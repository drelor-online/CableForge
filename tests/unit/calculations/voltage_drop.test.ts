import { describe, it, expect } from 'vitest';
import { VoltageDropCalculator } from '@/lib/calculations/voltage-drop';
import { ConductorMaterial, ConductorSize } from '@/types';

describe('VoltageDropCalculator', () => {
  const calculator = new VoltageDropCalculator();

  describe('calculateVoltageDropPercentage', () => {
    it('should calculate voltage drop for copper conductor', () => {
      const result = calculator.calculateVoltageDropPercentage({
        voltage: 120,
        current: 20,
        distance: 100, // feet one-way
        conductorSize: '12 AWG' as ConductorSize,
        material: ConductorMaterial.Copper,
        powerFactor: 1.0 // DC or unity power factor
      });

      // 12 AWG copper resistance: ~2.0 ohms per 1000 ft
      // Total distance: 200 ft (round trip)
      // Voltage drop = (20A × 2.0Ω × 200ft) / 1000 = 8V
      // Percentage = (8V / 120V) × 100 = 6.67%
      expect(result.voltageDropVolts).toBeCloseTo(8, 1);
      expect(result.voltageDropPercentage).toBeCloseTo(6.67, 1);
    });

    it('should calculate voltage drop for aluminum conductor', () => {
      const result = calculator.calculateVoltageDropPercentage({
        voltage: 480,
        current: 50,
        distance: 200,
        conductorSize: '4 AWG' as ConductorSize,
        material: ConductorMaterial.Aluminum,
        powerFactor: 0.85
      });

      // 4 AWG aluminum resistance: ~0.40 ohms per 1000 ft
      // Account for power factor in AC calculations
      expect(result.voltageDropPercentage).toBeGreaterThan(0);
      expect(result.voltageDropPercentage).toBeLessThan(5); // Should be reasonable
    });

    it('should handle different conductor sizes', () => {
      const baseParams = {
        voltage: 240,
        current: 30,
        distance: 150,
        material: ConductorMaterial.Copper,
        powerFactor: 1.0
      };

      const result14AWG = calculator.calculateVoltageDropPercentage({
        ...baseParams,
        conductorSize: '14 AWG' as ConductorSize
      });

      const result10AWG = calculator.calculateVoltageDropPercentage({
        ...baseParams,
        conductorSize: '10 AWG' as ConductorSize
      });

      // Larger conductor should have lower voltage drop
      expect(result10AWG.voltageDropPercentage).toBeLessThan(result14AWG.voltageDropPercentage);
    });

    it('should throw error for unsupported conductor size', () => {
      expect(() => calculator.calculateVoltageDropPercentage({
        voltage: 120,
        current: 20,
        distance: 100,
        conductorSize: 'Unknown' as ConductorSize,
        material: ConductorMaterial.Copper,
        powerFactor: 1.0
      })).toThrow('Unsupported conductor size: Unknown');
    });
  });

  describe('exceedsNECLimit', () => {
    it('should return true for branch circuits exceeding 3%', () => {
      const result = {
        voltageDropPercentage: 3.5,
        voltageDropVolts: 4.2
      };

      expect(calculator.exceedsNECLimit(result, 'branch')).toBe(true);
    });

    it('should return false for branch circuits within 3%', () => {
      const result = {
        voltageDropPercentage: 2.5,
        voltageDropVolts: 3.0
      };

      expect(calculator.exceedsNECLimit(result, 'branch')).toBe(false);
    });

    it('should return true for feeders exceeding 2.5%', () => {
      const result = {
        voltageDropPercentage: 3.0,
        voltageDropVolts: 7.2
      };

      expect(calculator.exceedsNECLimit(result, 'feeder')).toBe(true);
    });

    it('should return false for feeders within 2.5%', () => {
      const result = {
        voltageDropPercentage: 2.0,
        voltageDropVolts: 4.8
      };

      expect(calculator.exceedsNECLimit(result, 'feeder')).toBe(false);
    });
  });

  describe('getConductorResistance', () => {
    it('should return correct resistance for copper conductors', () => {
      expect(calculator.getConductorResistance('14 AWG', ConductorMaterial.Copper))
        .toBeCloseTo(3.1, 1);
      expect(calculator.getConductorResistance('12 AWG', ConductorMaterial.Copper))
        .toBeCloseTo(2.0, 1);
      expect(calculator.getConductorResistance('10 AWG', ConductorMaterial.Copper))
        .toBeCloseTo(1.2, 1);
    });

    it('should return correct resistance for aluminum conductors', () => {
      expect(calculator.getConductorResistance('12 AWG', ConductorMaterial.Aluminum))
        .toBeCloseTo(3.2, 1);
      expect(calculator.getConductorResistance('10 AWG', ConductorMaterial.Aluminum))
        .toBeCloseTo(2.0, 1);
    });

    it('should return 0 for unknown conductor sizes', () => {
      expect(calculator.getConductorResistance('Unknown' as ConductorSize, ConductorMaterial.Copper))
        .toBe(0);
    });
  });

  describe('recommendConductorSize', () => {
    it('should recommend larger conductor when voltage drop exceeds limit', () => {
      const params = {
        voltage: 120,
        current: 20,
        distance: 150,
        material: ConductorMaterial.Copper,
        powerFactor: 1.0,
        circuitType: 'branch' as const
      };

      const recommendation = calculator.recommendConductorSize(params);
      
      expect(recommendation.currentSize).toBeDefined();
      expect(recommendation.recommendedSize).toBeDefined();
      expect(recommendation.meetsNECLimit).toBeDefined();
      
      if (!recommendation.meetsNECLimit) {
        expect(recommendation.recommendedSize).not.toBe(recommendation.currentSize);
      }
    });

    it('should indicate compliance when current size is adequate', () => {
      const params = {
        voltage: 120,
        current: 10, // Low current
        distance: 50,  // Short distance
        material: ConductorMaterial.Copper,
        powerFactor: 1.0,
        circuitType: 'branch' as const
      };

      const recommendation = calculator.recommendConductorSize(params);
      expect(recommendation.meetsNECLimit).toBe(true);
    });
  });
});