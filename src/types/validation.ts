/**
 * Validation type definitions for CableForge
 * Maps to Rust validation structures via Tauri IPC
 */

export enum ValidationSeverity {
  Error = 'Error',
  Warning = 'Warning',
  Info = 'Info'
}

export enum ValidationType {
  DuplicateTag = 'DuplicateTag',
  SegregationViolation = 'SegregationViolation',
  RequiredField = 'RequiredField',
  Required = 'Required',
  InvalidValue = 'InvalidValue',
  NecCompliance = 'NecCompliance',
  Capacity = 'Capacity'
}

export interface ValidationResult {
  entityId?: number;
  cableId?: number; // Keep for backwards compatibility
  cableTag: string; // This could be renamed to entityTag in future
  severity: ValidationSeverity;
  validationType: ValidationType;
  message: string;
  field?: string;
  suggestedFix?: string;
  overrideAllowed: boolean;
}

export interface ValidationSummary {
  totalCables: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  results: ValidationResult[];
  validationTime: string; // ISO date string from chrono::DateTime
}

export interface ValidationStatus {
  hasIssues: boolean;
  errorCount: number;
  warningCount: number;
}