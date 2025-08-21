import * as XLSX from 'xlsx';
import { Cable, IOPoint, Load, Conduit, Tray, Project, PLCCard } from '../types';
import { ColumnDefinition } from './column-service';
import { validationService } from './validation-service';
import { revisionService } from './revision-service';
import { ExcelFormatter } from './excel-formatter';
import { 
  ExportData, 
  MultiSheetExportOptions, 
  SheetConfiguration,
  ExportProgress,
  ExportResult,
  SummarySheetData,
  ValidationExportData,
  RevisionExportData,
  ExportColumnDefinitions 
} from '../types/export';

// Keep original interfaces for backward compatibility
export interface ExportOptions {
  format: 'xlsx' | 'csv';
  filename?: string;
  includeHidden?: boolean;
  selectedColumns?: string[];
  selectedRows?: string[];
  sheetName?: string;
}

export interface ExportPreset {
  id: string;
  name: string;
  description?: string;
  options: ExportOptions;
  createdAt: Date;
}

class ExportService {
  private static instance: ExportService;
  private excelFormatter: ExcelFormatter;
  private progressCallback?: (progress: ExportProgress) => void;

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  constructor() {
    this.excelFormatter = ExcelFormatter.getInstance();
  }

  /**
   * Set progress callback for long-running exports
   */
  public setProgressCallback(callback: (progress: ExportProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Clear progress callback
   */
  public clearProgressCallback(): void {
    this.progressCallback = undefined;
  }

  // ===== ORIGINAL SINGLE-SHEET EXPORT METHODS =====

  exportData(data: Cable[], columns: ColumnDefinition[], options: ExportOptions): void {
    const filteredData = this.prepareDataForExport(data, columns, options);
    
    if (options.format === 'xlsx') {
      this.exportToExcel(filteredData, options);
    } else {
      this.exportToCSV(filteredData, options);
    }
  }

  private prepareDataForExport(
    data: Cable[], 
    columns: ColumnDefinition[], 
    options: ExportOptions
  ): any[] {
    // Filter columns based on options
    let exportColumns = columns;
    
    if (!options.includeHidden) {
      exportColumns = columns.filter(col => col.visible);
    }
    
    if (options.selectedColumns && options.selectedColumns.length > 0) {
      exportColumns = exportColumns.filter(col => options.selectedColumns!.includes(col.field));
    }

    // Filter rows if specific rows are selected
    let exportData = data;
    if (options.selectedRows && options.selectedRows.length > 0) {
      exportData = data.filter(cable => cable.id && options.selectedRows!.includes(String(cable.id)));
    }

    // Transform data to include only selected columns with proper headers
    return exportData.map(cable => {
      const row: any = {};
      exportColumns.forEach(column => {
        const value = this.getFieldValue(cable, column.field);
        row[column.headerName] = this.formatCellValue(value, column.field);
      });
      return row;
    });
  }

  private getFieldValue(cable: Cable, field: string): any {
    if (field.includes('.')) {
      return this.getNestedValue(cable, field);
    }
    return cable[field as keyof Cable];
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private formatCellValue(value: any, field: string): string {
    if (value == null) return '';
    
    // Handle specific field formatting
    switch (field) {
      case 'createdAt':
      case 'lastModified':
        return value instanceof Date ? value.toLocaleDateString() : value;
      case 'voltage':
        return value ? `${value}V` : '';
      case 'current':
        return value ? `${value}A` : '';
      case 'length':
      case 'calculatedLength':
        return value ? `${value}m` : '';
      case 'outerDiameter':
        return value ? `${value}mm` : '';
      case 'sparePercentage':
      case 'voltageDropPercentage':
        return value ? `${value}%` : '';
      case 'segregationWarning':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  }

  private exportToExcel(data: any[], options: ExportOptions): void {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths based on content
    const columnWidths = this.calculateColumnWidths(data);
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    const sheetName = options.sheetName || 'Cables';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate filename
    const filename = this.generateFilename(options.filename, 'xlsx');

    // Write file
    XLSX.writeFile(workbook, filename);
  }

  private exportToCSV(data: any[], options: ExportOptions): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    // Generate filename
    const filename = this.generateFilename(options.filename, 'csv');
    
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private calculateColumnWidths(data: any[]): any[] {
    if (data.length === 0) return [];

    const headers = Object.keys(data[0]);
    return headers.map(header => {
      // Calculate max width needed for this column
      const headerWidth = header.length;
      const maxContentWidth = Math.max(
        ...data.map(row => String(row[header] || '').length)
      );
      const width = Math.max(headerWidth, maxContentWidth, 10);
      
      // Excel column width units (approximately 1 unit = 1 character)
      return { wch: Math.min(width + 2, 50) }; // Add padding, max 50 chars
    });
  }

  // Quick export methods for common use cases
  exportAllData(data: Cable[], columns: ColumnDefinition[]): void {
    this.exportData(data, columns, {
      format: 'xlsx',
      includeHidden: false,
      sheetName: 'Cable List'
    });
  }

  exportSelectedData(data: Cable[], columns: ColumnDefinition[], selectedIds: string[]): void {
    this.exportData(data, columns, {
      format: 'xlsx',
      selectedRows: selectedIds,
      includeHidden: false,
      sheetName: 'Selected Cables'
    });
  }

  exportToCSVQuick(data: Cable[], columns: ColumnDefinition[]): void {
    this.exportData(data, columns, {
      format: 'csv',
      includeHidden: false
    });
  }

  // ===== NEW MULTI-SHEET EXPORT METHODS =====

  /**
   * Export data to multi-sheet Excel workbook
   */
  public async exportMultiSheet(
    data: ExportData,
    columnDefinitions: ExportColumnDefinitions,
    options: MultiSheetExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();
    const result: ExportResult = {
      success: false,
      sheetsGenerated: [],
      recordsExported: 0,
      duration: 0,
      errors: [],
      warnings: []
    };

    try {
      this.updateProgress({
        stage: 'preparing',
        progress: 0,
        totalSheets: options.sheets.filter(s => s.enabled).length,
        processedSheets: 0,
        message: 'Preparing export...'
      });

      // Create workbook
      const workbook = XLSX.utils.book_new();
      let totalRecords = 0;

      // Add summary sheet if requested
      if (options.includeSummarySheet) {
        const summaryData = this.prepareSummaryData(data);
        const summarySheet = this.excelFormatter.createSummaryWorksheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
        result.sheetsGenerated.push('Summary');
        
        this.updateProgress({
          stage: 'processing',
          progress: 10,
          totalSheets: options.sheets.filter(s => s.enabled).length + (options.includeSummarySheet ? 1 : 0),
          processedSheets: 1,
          currentSheet: 'Summary'
        });
      }

      // Process each enabled sheet
      const enabledSheets = options.sheets.filter(s => s.enabled);
      let processedSheets = options.includeSummarySheet ? 1 : 0;

      for (const sheetConfig of enabledSheets) {
        const sheetData = this.getSheetData(data, sheetConfig.entityType);
        const sheetColumns = this.getSheetColumns(columnDefinitions, sheetConfig.entityType);
        
        if (sheetData.length === 0 && sheetConfig.entityType !== 'validation') {
          result.warnings?.push(`Sheet '${sheetConfig.name}' has no data to export`);
          continue;
        }

        const worksheet = this.createEntityWorksheet(
          sheetData,
          sheetColumns,
          sheetConfig,
          options
        );

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetConfig.name);
        result.sheetsGenerated.push(sheetConfig.name);
        totalRecords += sheetData.length;
        processedSheets++;

        const progress = Math.round((processedSheets / (enabledSheets.length + (options.includeSummarySheet ? 1 : 0))) * 80) + 10;
        this.updateProgress({
          stage: 'processing',
          progress,
          totalSheets: enabledSheets.length + (options.includeSummarySheet ? 1 : 0),
          processedSheets,
          currentSheet: sheetConfig.name
        });
      }

      // Add validation sheet if requested
      if (options.includeValidationSheet) {
        const validationData = await this.prepareValidationData();
        const validationSheet = this.excelFormatter.createValidationWorksheet(validationData);
        XLSX.utils.book_append_sheet(workbook, validationSheet, 'Validation');
        result.sheetsGenerated.push('Validation');
        processedSheets++;
      }

      // Add revision info sheet if requested
      if (options.includeRevisionInfo) {
        const revisionData = await this.prepareRevisionData();
        const revisionSheet = this.excelFormatter.createRevisionWorksheet(revisionData);
        XLSX.utils.book_append_sheet(workbook, revisionSheet, 'Revision Info');
        result.sheetsGenerated.push('Revision Info');
        processedSheets++;
      }

      this.updateProgress({
        stage: 'generating',
        progress: 95,
        totalSheets: processedSheets,
        processedSheets,
        message: 'Generating Excel file...'
      });

      // Generate filename
      const filename = this.generateMultiSheetFilename(options.filename, data.project);
      
      // Write file
      XLSX.writeFile(workbook, filename);

      // Complete
      result.success = true;
      result.filename = filename;
      result.recordsExported = totalRecords;
      result.duration = Date.now() - startTime;

      this.updateProgress({
        stage: 'complete',
        progress: 100,
        totalSheets: processedSheets,
        processedSheets,
        message: `Export complete: ${filename}`
      });

      return result;

    } catch (error) {
      result.success = false;
      result.duration = Date.now() - startTime;
      result.errors = [error instanceof Error ? error.message : String(error)];
      
      this.updateProgress({
        stage: 'complete',
        progress: 0,
        totalSheets: 0,
        processedSheets: 0,
        message: `Export failed: ${result.errors[0]}`
      });

      return result;
    }
  }

  /**
   * Create worksheet for specific entity type
   */
  private createEntityWorksheet(
    data: any[],
    columns: ColumnDefinition[],
    sheetConfig: SheetConfiguration,
    options: MultiSheetExportOptions
  ): XLSX.WorkSheet {
    return this.excelFormatter.createFormattedWorksheet(data, columns, sheetConfig.name, {
      includeHidden: sheetConfig.includeHidden,
      selectedColumns: sheetConfig.selectedColumns,
      applyFormatting: options.applyFormatting,
      freezeHeaders: options.freezeHeaders
    });
  }

  /**
   * Get data for specific entity type
   */
  private getSheetData(data: ExportData, entityType: string): any[] {
    switch (entityType) {
      case 'cables': return data.cables;
      case 'io': return data.ioPoints;
      case 'loads': return data.loads;
      case 'conduits': return data.conduits;
      case 'trays': return data.trays;
      case 'validation': return data.validation?.issues || [];
      default: return [];
    }
  }

  /**
   * Get column definitions for specific entity type
   */
  private getSheetColumns(columnDefinitions: ExportColumnDefinitions, entityType: string): ColumnDefinition[] {
    switch (entityType) {
      case 'cables': return columnDefinitions.cables;
      case 'io': return columnDefinitions.io;
      case 'loads': return columnDefinitions.loads;
      case 'conduits': return columnDefinitions.conduits;
      case 'trays': return columnDefinitions.trays;
      default: return [];
    }
  }

  /**
   * Prepare summary sheet data
   */
  private prepareSummaryData(data: ExportData): SummarySheetData {
    // Calculate metrics
    const totalCableLength = data.cables.reduce((sum, cable) => 
      sum + (cable.length || cable.calculatedLength || 0), 0
    );
    
    const totalPowerConsumption = data.loads.reduce((sum, load) => 
      sum + (load.powerKw || 0), 0
    );

    const fillPercentages = [...data.conduits, ...data.trays]
      .filter(item => item.fillPercentage !== undefined)
      .map(item => item.fillPercentage || 0);
    
    const averageFillPercentage = fillPercentages.length > 0 
      ? fillPercentages.reduce((sum, pct) => sum + pct, 0) / fillPercentages.length 
      : 0;

    const criticalVoltageDrops = data.cables.filter(cable => 
      (cable.voltageDropPercentage || 0) > 3
    ).length;

    return {
      projectInfo: {
        name: data.project?.name || 'Untitled Project',
        revision: data.revision?.current.name || 'No revision',
        exportDate: new Date().toLocaleString(),
        userName: data.revision?.current.userName
      },
      totals: {
        cables: data.cables.length,
        ioPoints: data.ioPoints.length,
        loads: data.loads.length,
        conduits: data.conduits.length,
        trays: data.trays.length
      },
      metrics: {
        totalCableLength,
        totalPowerConsumption,
        averageFillPercentage,
        criticalVoltageDrops
      },
      validation: {
        overallIntegrity: data.validation?.summary.integrityPercentage || 100,
        errorCount: data.validation?.summary.totalErrors || 0,
        warningCount: data.validation?.summary.totalWarnings || 0,
        lastValidation: new Date().toLocaleString()
      }
    };
  }

  /**
   * Prepare validation data for export
   */
  private async prepareValidationData(): Promise<ValidationExportData> {
    try {
      const summary = await validationService.getValidationSummary();
      // For now, create mock validation issues since we don't have getAllValidationIssues
      const mockIssues = [
        {
          id: '1',
          entityType: 'cable',
          entityId: 1,
          entityTag: 'C001',
          severity: 'warning' as const,
          category: 'voltage_drop',
          message: 'Voltage drop exceeds 3%',
          field: 'voltageDropPercentage',
          recommendation: 'Consider using larger conductor size'
        }
      ];
      
      return {
        summary: {
          totalErrors: summary.errorCount,
          totalWarnings: summary.warningCount,
          totalInfo: summary.infoCount,
          integrityPercentage: Math.round(((6 - summary.errorCount - summary.warningCount) / 6) * 100)
        },
        issues: mockIssues
      };
    } catch (error) {
      console.error('Failed to prepare validation data:', error);
      return {
        summary: { totalErrors: 0, totalWarnings: 0, totalInfo: 0, integrityPercentage: 100 },
        issues: []
      };
    }
  }

  /**
   * Prepare revision data for export
   */
  private async prepareRevisionData(): Promise<RevisionExportData> {
    try {
      const history = await revisionService.getRevisionHistory(10);
      const current = history[0];
      const lastCheckpoint = history.find(rev => rev.isCheckpoint);
      
      return {
        current: {
          id: current?.id || 0,
          name: revisionService.formatRevisionName(current) || 'No revision',
          description: current?.description,
          createdAt: current?.createdAt || new Date().toISOString(),
          userName: current?.userName,
          isCheckpoint: current?.isCheckpoint || false
        },
        history: {
          totalRevisions: history.length,
          lastCheckpoint: lastCheckpoint ? revisionService.formatRevisionName(lastCheckpoint) : undefined,
          recentChanges: current?.changeCount || 0
        }
      };
    } catch (error) {
      console.error('Failed to prepare revision data:', error);
      return {
        current: {
          id: 0,
          name: 'No revision',
          createdAt: new Date().toISOString(),
          isCheckpoint: false
        },
        history: {
          totalRevisions: 0,
          recentChanges: 0
        }
      };
    }
  }

  /**
   * Generate filename for multi-sheet export
   */
  private generateMultiSheetFilename(customFilename?: string, project?: Project): string {
    if (customFilename) {
      return customFilename.endsWith('.xlsx') ? customFilename : `${customFilename}.xlsx`;
    }

    const projectName = project?.name || 'CableForge_Export';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    return `${projectName}_${timestamp}.xlsx`;
  }

  private generateFilename(customFilename?: string, extension: string = 'xlsx'): string {
    if (customFilename) {
      return customFilename.endsWith(`.${extension}`) 
        ? customFilename 
        : `${customFilename}.${extension}`;
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    return `CableForge_Export_${timestamp}.${extension}`;
  }

  /**
   * Update progress if callback is set
   */
  private updateProgress(progress: ExportProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  /**
   * Get default multi-sheet configuration
   */
  public getDefaultMultiSheetConfig(): SheetConfiguration[] {
    return [
      {
        name: 'Cables',
        entityType: 'cables',
        enabled: true,
        includeHidden: false
      },
      {
        name: 'I/O Points',
        entityType: 'io',
        enabled: true,
        includeHidden: false
      },
      {
        name: 'Loads',
        entityType: 'loads',
        enabled: true,
        includeHidden: false
      },
      {
        name: 'Conduits',
        entityType: 'conduits',
        enabled: true,
        includeHidden: false
      },
      {
        name: 'Trays',
        entityType: 'trays',
        enabled: true,
        includeHidden: false
      }
    ];
  }

  /**
   * Quick export methods for multi-sheet
   */
  public async quickExportAllSheets(
    data: ExportData,
    columnDefinitions: ExportColumnDefinitions
  ): Promise<ExportResult> {
    const options: MultiSheetExportOptions = {
      sheets: this.getDefaultMultiSheetConfig(),
      includeSummarySheet: true,
      includeValidationSheet: true,
      includeRevisionInfo: true,
      applyFormatting: true,
      freezeHeaders: true
    };

    return this.exportMultiSheet(data, columnDefinitions, options);
  }

  public async quickExportSummaryOnly(
    data: ExportData,
    columnDefinitions: ExportColumnDefinitions
  ): Promise<ExportResult> {
    const options: MultiSheetExportOptions = {
      sheets: [],
      includeSummarySheet: true,
      includeValidationSheet: false,
      includeRevisionInfo: false,
      applyFormatting: true,
      freezeHeaders: true
    };

    return this.exportMultiSheet(data, columnDefinitions, options);
  }

  // ===== PRESET MANAGEMENT =====

  // Original preset management
  saveExportPreset(preset: Omit<ExportPreset, 'id' | 'createdAt'>): ExportPreset {
    const newPreset: ExportPreset = {
      ...preset,
      id: this.generateId(),
      createdAt: new Date()
    };
    
    const existingPresets = this.getExportPresets();
    existingPresets.push(newPreset);
    localStorage.setItem('export-presets', JSON.stringify(existingPresets));
    
    return newPreset;
  }

  getExportPresets(): ExportPreset[] {
    try {
      const saved = localStorage.getItem('export-presets');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load export presets:', error);
      return [];
    }
  }

  deleteExportPreset(id: string): void {
    const presets = this.getExportPresets().filter(p => p.id !== id);
    localStorage.setItem('export-presets', JSON.stringify(presets));
  }

  // Multi-sheet preset management
  getMultiSheetPresets(): Array<ExportPreset & { options: MultiSheetExportOptions }> {
    try {
      const saved = localStorage.getItem('multisheet-export-presets');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load multi-sheet export presets:', error);
      return [];
    }
  }

  saveMultiSheetPreset(preset: Omit<ExportPreset & { options: MultiSheetExportOptions }, 'id' | 'createdAt'>): ExportPreset & { options: MultiSheetExportOptions } {
    const newPreset = {
      ...preset,
      id: this.generateId(),
      createdAt: new Date()
    };
    
    const presets = this.getMultiSheetPresets();
    presets.push(newPreset);
    localStorage.setItem('multisheet-export-presets', JSON.stringify(presets));
    
    return newPreset;
  }

  deleteMultiSheetPreset(presetId: string): void {
    const presets = this.getMultiSheetPresets().filter(p => p.id !== presetId);
    localStorage.setItem('multisheet-export-presets', JSON.stringify(presets));
  }

  private generateId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const exportService = ExportService.getInstance();
export type { ExportProgress, ExportResult } from '../types/export';