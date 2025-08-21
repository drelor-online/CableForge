import { Cable, IOPoint, Load, Conduit, Tray, Project, PLCCard } from './index';
import { ColumnDefinition } from '../services/column-service';

// Base export options (extending existing interface)
export interface ExportOptions {
  format: 'xlsx' | 'csv';
  filename?: string;
  includeHidden?: boolean;
  selectedColumns?: string[];
  selectedRows?: string[];
  sheetName?: string;
}

// Multi-sheet specific options
export interface MultiSheetExportOptions {
  filename?: string;
  sheets: SheetConfiguration[];
  includeRevisionInfo?: boolean;
  includeSummarySheet?: boolean;
  includeValidationSheet?: boolean;
  applyFormatting?: boolean;
  freezeHeaders?: boolean;
}

// Configuration for individual sheets
export interface SheetConfiguration {
  name: string;
  entityType: 'cables' | 'io' | 'loads' | 'conduits' | 'trays' | 'summary' | 'validation';
  enabled: boolean;
  includeHidden?: boolean;
  selectedColumns?: string[];
  selectedRows?: string[];
  customFilters?: ExportFilter[];
}

// Export filter for advanced data filtering
export interface ExportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
  value: string | number;
}

// Data structure for multi-sheet export
export interface ExportData {
  project?: Project;
  cables: Cable[];
  ioPoints: IOPoint[];
  loads: Load[];
  conduits: Conduit[];
  trays: Tray[];
  plcCards: PLCCard[];
  validation?: ValidationExportData;
  revision?: RevisionExportData;
}

// Column definitions for each entity type
export interface ExportColumnDefinitions {
  cables: ColumnDefinition[];
  io: ColumnDefinition[];
  loads: ColumnDefinition[];
  conduits: ColumnDefinition[];
  trays: ColumnDefinition[];
}

// Validation data for export
export interface ValidationExportData {
  summary: {
    totalErrors: number;
    totalWarnings: number;
    totalInfo: number;
    integrityPercentage: number;
  };
  issues: ValidationIssue[];
}

export interface ValidationIssue {
  id: string;
  entityType: string;
  entityId: number;
  entityTag?: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  field?: string;
  recommendation?: string;
}

// Revision data for export
export interface RevisionExportData {
  current: {
    id: number;
    name: string;
    description?: string;
    createdAt: string;
    userName?: string;
    isCheckpoint: boolean;
  };
  history: {
    totalRevisions: number;
    lastCheckpoint?: string;
    recentChanges: number;
  };
}

// Excel formatting options
export interface ExcelFormatting {
  headerStyle: {
    bold: boolean;
    backgroundColor: string;
    fontColor: string;
    fontSize: number;
  };
  dataStyle: {
    alternateRowColor?: string;
    borderStyle: 'thin' | 'medium' | 'thick' | 'none';
    fontSize: number;
  };
  conditionalFormatting: ConditionalFormat[];
}

export interface ConditionalFormat {
  field: string;
  condition: 'above' | 'below' | 'equals' | 'contains';
  value: string | number;
  style: {
    backgroundColor?: string;
    fontColor?: string;
    bold?: boolean;
  };
}

// Summary sheet data structure
export interface SummarySheetData {
  projectInfo: {
    name: string;
    revision: string;
    exportDate: string;
    userName?: string;
  };
  totals: {
    cables: number;
    ioPoints: number;
    loads: number;
    conduits: number;
    trays: number;
  };
  metrics: {
    totalCableLength: number;
    totalPowerConsumption: number;
    averageFillPercentage: number;
    criticalVoltageDrops: number;
  };
  validation: {
    overallIntegrity: number;
    errorCount: number;
    warningCount: number;
    lastValidation: string;
  };
}

// Export preset for saving/loading common configurations
export interface ExportPreset {
  id: string;
  name: string;
  description?: string;
  options: MultiSheetExportOptions;
  createdAt: Date;
  lastUsed?: Date;
}

// Progress tracking for large exports
export interface ExportProgress {
  stage: 'preparing' | 'processing' | 'formatting' | 'generating' | 'complete';
  progress: number; // 0-100
  currentSheet?: string;
  totalSheets: number;
  processedSheets: number;
  message?: string;
}

// Export result
export interface ExportResult {
  success: boolean;
  filename?: string;
  filePath?: string;
  sheetsGenerated: string[];
  recordsExported: number;
  fileSize?: number;
  duration: number; // milliseconds
  errors?: string[];
  warnings?: string[];
}