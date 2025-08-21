// Service-specific type definitions for CableForge

import { Cable, IOPoint, Load, Conduit, Tray, Project } from './index';
import { AsyncOperationResult, ProgressInfo, AppError, ValidationError } from './common';

// ===== IMPORT SERVICE TYPES =====

export interface ParsedCsvData {
  headers: string[];
  rows: (string | number | null)[][];
  metadata: {
    fileName: string;
    fileSize: number;
    rowCount: number;
    encoding?: string;
  };
}

export interface ImportOptions {
  format: 'csv' | 'xlsx';
  hasHeaders: boolean;
  startRow: number;
  columnMapping: Record<string, string>;
  skipEmptyRows: boolean;
  overwriteExisting: boolean;
  delimiter?: string;
  encoding?: string;
}

export interface ImportValidationResult {
  isValid: boolean;
  validRows: number;
  invalidRows: number;
  totalRows: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  previewData: Partial<Cable>[];
  duplicates: {
    tag: string;
    existingId?: number;
    action: 'skip' | 'overwrite' | 'rename';
  }[];
}

export interface ImportProgress extends ProgressInfo {
  stage: 'parsing' | 'validating' | 'mapping' | 'saving' | 'complete';
  processedRows: number;
  skippedRows: number;
  errorRows: number;
}

// ===== EXPORT SERVICE TYPES =====

export interface ExportOptions {
  format: 'xlsx' | 'csv' | 'pdf';
  filename?: string;
  includeHidden?: boolean;
  selectedColumns?: string[];
  selectedRows?: string[];
  sheetName?: string;
  includeMetadata?: boolean;
  compression?: boolean;
}

export interface ExportPreset {
  id: string;
  name: string;
  description?: string;
  options: ExportOptions;
  category: 'cables' | 'io-points' | 'loads' | 'conduits' | 'trays' | 'reports';
  isDefault?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ExportProgress extends ProgressInfo {
  stage: 'preparing' | 'formatting' | 'generating' | 'saving' | 'complete';
  sheetsProcessed?: number;
  totalSheets?: number;
  currentSheet?: string;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  rowsExported: number;
  columnsExported: number;
  warnings?: string[];
  errors?: AppError[];
  metadata: {
    exportedAt: Date;
    format: string;
    presetUsed?: string;
  };
}

// ===== VALIDATION SERVICE TYPES =====

export interface ValidationRule<T = unknown> {
  field: string;
  type: 'required' | 'pattern' | 'range' | 'custom' | 'unique' | 'reference';
  message: string;
  severity: 'error' | 'warning' | 'info';
  validate: (value: T, context?: unknown) => boolean;
  options?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    allowEmpty?: boolean;
    customValidator?: (value: T) => boolean;
  };
}

export interface ValidationContext {
  entity: 'cable' | 'iopoint' | 'load' | 'conduit' | 'tray' | 'project';
  operation: 'create' | 'update' | 'delete' | 'import' | 'bulk-edit';
  existingData?: unknown[];
  projectId?: number;
  revisionId?: number;
}

export interface FieldValidationResult {
  field: string;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions?: string[];
}

export interface EntityValidationResult {
  isValid: boolean;
  hasWarnings: boolean;
  fieldResults: Record<string, FieldValidationResult>;
  crossFieldErrors: ValidationError[];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    criticalErrors: number;
  };
}

// ===== FILTER SERVICE TYPES =====

export type FilterOperator = 
  | 'equals' | 'not_equals' 
  | 'contains' | 'not_contains' 
  | 'starts_with' | 'ends_with'
  | 'greater_than' | 'less_than' | 'between'
  | 'in' | 'not_in'
  | 'is_empty' | 'is_not_empty'
  | 'is_null' | 'is_not_null';

export type FilterDataType = 'text' | 'number' | 'date' | 'boolean' | 'enum' | 'array';

export interface FilterCondition {
  id: string;
  field: string;
  dataType: FilterDataType;
  operator: FilterOperator;
  value: unknown;
  values?: unknown[];
  caseSensitive?: boolean;
  enabled: boolean;
}

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: FilterCondition[];
  entity: 'cables' | 'io-points' | 'loads' | 'conduits' | 'trays';
  isDefault?: boolean;
  isShared?: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface FilterState {
  activeFilters: FilterCondition[];
  presets: FilterPreset[];
  quickFilters: Record<string, boolean>;
  searchTerm: string;
  appliedCount: number;
  totalRecords: number;
  filteredRecords: number;
}

// ===== COLUMN SERVICE TYPES =====

export interface ColumnPreset {
  id: string;
  name: string;
  description?: string;
  entity: 'cables' | 'io-points' | 'loads' | 'conduits' | 'trays';
  columns: string[];
  columnWidths?: Record<string, number>;
  sortConfig?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pinnedColumns?: {
    left: string[];
    right: string[];
  };
  isDefault?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ColumnState {
  visible: string[];
  hidden: string[];
  order: string[];
  widths: Record<string, number>;
  pinned: {
    left: string[];
    right: string[];
  };
  frozen: string[];
}

// ===== BULK OPERATION TYPES =====

export interface BulkOperation<T = unknown> {
  id: string;
  type: 'update' | 'delete' | 'import' | 'export';
  entity: 'cables' | 'io-points' | 'loads' | 'conduits' | 'trays';
  targetIds: (string | number)[];
  changes: Partial<T>;
  selectedFields: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: ProgressInfo;
  results?: {
    successful: number;
    failed: number;
    errors: AppError[];
    warnings: ValidationError[];
  };
  createdAt: Date;
  completedAt?: Date;
}

export interface BulkEditOptions<T = unknown> {
  selectedFields: string[];
  changes: Partial<T>;
  validateBeforeApply: boolean;
  skipInvalidRows: boolean;
  createBackup: boolean;
}

// ===== DATABASE SERVICE TYPES =====

export interface DatabaseQuery {
  table: string;
  select?: string[];
  where?: Record<string, unknown>;
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
  offset?: number;
  joins?: {
    table: string;
    on: string;
    type: 'inner' | 'left' | 'right' | 'full';
  }[];
}

export interface DatabaseResult<T = unknown> {
  rows: T[];
  count: number;
  affectedRows?: number;
  insertId?: number;
  metadata: {
    executionTime: number;
    query: string;
    parameters?: unknown[];
  };
}

export interface DatabaseTransaction {
  id: string;
  operations: {
    type: 'insert' | 'update' | 'delete';
    table: string;
    data: unknown;
    where?: Record<string, unknown>;
  }[];
  status: 'pending' | 'committed' | 'rolled_back';
  startedAt: Date;
  completedAt?: Date;
}

// ===== TEMPLATE SERVICE TYPES =====

export interface ProjectTemplate {
  id: number;
  name: string;
  description?: string;
  category: 'Oil & Gas' | 'Power' | 'Industrial' | 'Marine' | 'Other';
  version: string;
  createdBy: string;
  isPublic: boolean;
  isBuiltin: boolean;
  templateData: ProjectTemplateData;
  tags?: string[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectTemplateData {
  projectInfo: {
    name: string;
    description?: string;
    client?: string;
    location?: string;
  };
  defaultSettings: {
    voltages: number[];
    cableFunctions: string[];
    conduitTypes: string[];
    trayTypes: string[];
    defaultSparePercentage: number;
    defaultVoltageDropLimit: number;
  };
  sampleData?: {
    cables: Partial<Cable>[];
    ioPoints: Partial<IOPoint>[];
    loads: Partial<Load>[];
    conduits: Partial<Conduit>[];
    trays: Partial<Tray>[];
  };
}

export interface CreateTemplateOptions {
  name: string;
  description?: string;
  category: ProjectTemplate['category'];
  version?: string;
  isPublic?: boolean;
  tags?: string[];
  includeData?: boolean;
  includeColumnPresets?: boolean;
}

export interface TemplateSearchOptions {
  category?: ProjectTemplate['category'];
  tags?: string[];
  searchTerm?: string;
  includeBuiltin?: boolean;
  sortBy?: 'name' | 'category' | 'usageCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}