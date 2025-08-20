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
  InvalidValue = 'InvalidValue',
  NecCompliance = 'NecCompliance'
}

export interface ValidationResult {
  cableId?: number;
  cableTag: string;
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