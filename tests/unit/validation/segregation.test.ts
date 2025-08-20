import { describe, it, expect } from 'vitest';
import { SegregationValidator } from '@/lib/validation/segregation';
import { SegregationClass } from '@/types';

describe('SegregationValidator', () => {
  const validator = new SegregationValidator();

  describe('validateCableSegregation', () => {
    it('should allow compatible cable types in same conduit', () => {
      const cables = [
        { tag: 'C-001', segregationClass: SegregationClass.NonISSignal },
        { tag: 'C-002', segregationClass: SegregationClass.NonISSignal },
        { tag: 'C-003', segregationClass: SegregationClass.ControlPower24VDC }
      ];

      const result = validator.validateCableSegregation(cables);
      
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect IS and non-IS signal segregation violation', () => {
      const cables = [
        { tag: 'C-001', segregationClass: SegregationClass.ISSignal },
        { tag: 'C-002', segregationClass: SegregationClass.NonISSignal }
      ];

      const result = validator.validateCableSegregation(cables);
      
      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('IS_SEPARATION');
      expect(result.violations[0].severity).toBe('ERROR');
    });

    it('should detect high voltage power with signal violation', () => {
      const cables = [
        { tag: 'C-001', segregationClass: SegregationClass.NonISSignal },
        { tag: 'C-002', segregationClass: SegregationClass.Power120VAC }
      ];

      const result = validator.validateCableSegregation(cables);
      
      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('POWER_SIGNAL_SEPARATION');
      expect(result.violations[0].severity).toBe('ERROR');
    });

    it('should allow 24VDC power with signals (with warning)', () => {
      const cables = [
        { tag: 'C-001', segregationClass: SegregationClass.NonISSignal },
        { tag: 'C-002', segregationClass: SegregationClass.ControlPower24VDC }
      ];

      const result = validator.validateCableSegregation(cables);
      
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('LOW_VOLTAGE_SIGNAL_MIX');
      expect(result.violations[0].severity).toBe('WARNING');
    });

    it('should detect multiple voltage levels in same conduit', () => {
      const cables = [
        { tag: 'C-001', segregationClass: SegregationClass.Power120VAC },
        { tag: 'C-002', segregationClass: SegregationClass.Power480VAC }
      ];

      const result = validator.validateCableSegregation(cables);
      
      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('VOLTAGE_LEVEL_SEPARATION');
      expect(result.violations[0].severity).toBe('ERROR');
    });

    it('should handle empty cable list', () => {
      const result = validator.validateCableSegregation([]);
      
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should handle single cable (always valid)', () => {
      const cables = [
        { tag: 'C-001', segregationClass: SegregationClass.ISSignal }
      ];

      const result = validator.validateCableSegregation(cables);
      
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('getSegregationRules', () => {
    it('should return IS signal rules', () => {
      const rules = validator.getSegregationRules(SegregationClass.ISSignal);
      
      expect(rules.cannotMixWith).toContain(SegregationClass.NonISSignal);
      expect(rules.cannotMixWith).toContain(SegregationClass.Power120VAC);
      expect(rules.cannotMixWith).toContain(SegregationClass.Power480VAC);
      expect(rules.description).toContain('intrinsically safe');
    });

    it('should return power cable rules', () => {
      const rules = validator.getSegregationRules(SegregationClass.Power480VAC);
      
      expect(rules.cannotMixWith).toContain(SegregationClass.ISSignal);
      expect(rules.cannotMixWith).toContain(SegregationClass.NonISSignal);
      expect(rules.cannotMixWith).toContain(SegregationClass.Power120VAC);
    });
  });

  describe('createCustomSegregationClass', () => {
    it('should create custom segregation class', () => {
      const customClass = validator.createCustomSegregationClass({
        name: 'FIBER_OPTIC',
        description: 'Fiber optic communication cables',
        cannotMixWith: [SegregationClass.Power120VAC, SegregationClass.Power480VAC],
        warningMixWith: [SegregationClass.NonISSignal]
      });

      expect(customClass.name).toBe('FIBER_OPTIC');
      expect(customClass.cannotMixWith).toHaveLength(2);
      expect(customClass.warningMixWith).toHaveLength(1);
    });
  });

  describe('overrideViolation', () => {
    it('should allow violation override with justification', () => {
      const cables = [
        { tag: 'C-001', segregationClass: SegregationClass.NonISSignal },
        { tag: 'C-002', segregationClass: SegregationClass.Power120VAC }
      ];

      // First validate to get violation
      const result = validator.validateCableSegregation(cables);
      expect(result.isValid).toBe(false);

      // Override the violation
      const violationId = result.violations[0].id;
      validator.overrideViolation(violationId, {
        justification: 'Approved by chief engineer - separate conduit sections',
        approvedBy: 'John Smith, PE',
        date: new Date()
      });

      // Validate again with override
      const resultWithOverride = validator.validateCableSegregation(cables, [violationId]);
      expect(resultWithOverride.isValid).toBe(true);
      expect(resultWithOverride.overrides).toHaveLength(1);
    });
  });

  describe('generateSegregationReport', () => {
    it('should generate comprehensive segregation report', () => {
      const conduits = [
        {
          tag: 'C01',
          cables: [
            { tag: 'C-001', segregationClass: SegregationClass.ISSignal },
            { tag: 'C-002', segregationClass: SegregationClass.NonISSignal }
          ]
        },
        {
          tag: 'C02', 
          cables: [
            { tag: 'C-003', segregationClass: SegregationClass.NonISSignal },
            { tag: 'C-004', segregationClass: SegregationClass.ControlPower24VDC }
          ]
        }
      ];

      const report = validator.generateSegregationReport(conduits);
      
      expect(report.totalConduits).toBe(2);
      expect(report.violationCount).toBeGreaterThan(0);
      expect(report.conduitViolations).toHaveLength(2);
      expect(report.conduitViolations[0].conduitTag).toBe('C01');
      expect(report.conduitViolations[0].isValid).toBe(false);
    });
  });
});