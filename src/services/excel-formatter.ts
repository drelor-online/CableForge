import * as XLSX from 'xlsx';
import { 
  ExcelFormatting, 
  ConditionalFormat, 
  SummarySheetData, 
  ValidationExportData,
  RevisionExportData 
} from '../types/export';
import { ColumnDefinition } from './column-service';

export class ExcelFormatter {
  private static instance: ExcelFormatter;

  public static getInstance(): ExcelFormatter {
    if (!ExcelFormatter.instance) {
      ExcelFormatter.instance = new ExcelFormatter();
    }
    return ExcelFormatter.instance;
  }

  // Default formatting styles
  private defaultFormatting: ExcelFormatting = {
    headerStyle: {
      bold: true,
      backgroundColor: 'FF4472C4', // Excel blue
      fontColor: 'FFFFFFFF', // White
      fontSize: 12,
    },
    dataStyle: {
      alternateRowColor: 'FFF2F2F2', // Light gray
      borderStyle: 'thin',
      fontSize: 11,
    },
    conditionalFormatting: [
      {
        field: 'fillPercentage',
        condition: 'above',
        value: 90,
        style: { backgroundColor: 'FFFF0000', fontColor: 'FFFFFFFF' } // Red background
      },
      {
        field: 'voltageDropPercentage',
        condition: 'above',
        value: 3,
        style: { backgroundColor: 'FFFF9900', fontColor: 'FFFFFFFF' } // Orange background
      },
      {
        field: 'segregationWarning',
        condition: 'equals',
        value: true,
        style: { backgroundColor: 'FFFFFF00' } // Yellow background
      }
    ]
  };

  /**
   * Create and format a worksheet with data
   */
  public createFormattedWorksheet(
    data: any[], 
    columns: ColumnDefinition[],
    sheetName: string,
    options: {
      includeHidden?: boolean;
      selectedColumns?: string[];
      applyFormatting?: boolean;
      freezeHeaders?: boolean;
    } = {}
  ): XLSX.WorkSheet {
    // Prepare columns
    const exportColumns = this.prepareColumns(columns, options);
    
    // Transform data
    const exportData = this.transformData(data, exportColumns);

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    if (options.applyFormatting !== false) {
      this.applyWorksheetFormatting(worksheet, exportColumns, exportData.length);
    }

    if (options.freezeHeaders) {
      worksheet['!freeze'] = { xSplit: 0, ySplit: 1, state: 'frozen' };
    }

    // Set column widths
    worksheet['!cols'] = this.calculateColumnWidths(exportData, exportColumns);

    return worksheet;
  }

  /**
   * Create a summary sheet with project metrics
   */
  public createSummaryWorksheet(summaryData: SummarySheetData): XLSX.WorkSheet {
    const data = [
      ['Project Information', ''],
      ['Project Name', summaryData.projectInfo.name],
      ['Revision', summaryData.projectInfo.revision],
      ['Export Date', summaryData.projectInfo.exportDate],
      ['User', summaryData.projectInfo.userName || 'Unknown'],
      ['', ''],
      ['Entity Totals', ''],
      ['Cables', summaryData.totals.cables],
      ['I/O Points', summaryData.totals.ioPoints],
      ['Loads', summaryData.totals.loads],
      ['Conduits', summaryData.totals.conduits],
      ['Trays', summaryData.totals.trays],
      ['', ''],
      ['Key Metrics', ''],
      ['Total Cable Length (m)', summaryData.metrics.totalCableLength.toFixed(2)],
      ['Total Power Consumption (kW)', summaryData.metrics.totalPowerConsumption.toFixed(2)],
      ['Average Fill Percentage (%)', summaryData.metrics.averageFillPercentage.toFixed(1)],
      ['Critical Voltage Drops', summaryData.metrics.criticalVoltageDrops],
      ['', ''],
      ['Validation Status', ''],
      ['Overall Integrity (%)', summaryData.validation.overallIntegrity],
      ['Error Count', summaryData.validation.errorCount],
      ['Warning Count', summaryData.validation.warningCount],
      ['Last Validation', summaryData.validation.lastValidation]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Apply summary sheet formatting
    this.applySummaryFormatting(worksheet);

    return worksheet;
  }

  /**
   * Create a validation results worksheet
   */
  public createValidationWorksheet(validationData: ValidationExportData): XLSX.WorkSheet {
    const data = validationData.issues.map(issue => ({
      'Entity Type': issue.entityType,
      'Entity ID': issue.entityId,
      'Entity Tag': issue.entityTag || '',
      'Severity': issue.severity,
      'Category': issue.category,
      'Field': issue.field || '',
      'Message': issue.message,
      'Recommendation': issue.recommendation || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Apply validation sheet formatting with conditional formatting for severity
    this.applyValidationFormatting(worksheet, data.length);

    return worksheet;
  }

  /**
   * Create a revision info worksheet
   */
  public createRevisionWorksheet(revisionData: RevisionExportData): XLSX.WorkSheet {
    const data = [
      ['Current Revision', ''],
      ['ID', revisionData.current.id],
      ['Name', revisionData.current.name],
      ['Description', revisionData.current.description || 'No description'],
      ['Created', revisionData.current.createdAt],
      ['User', revisionData.current.userName || 'Unknown'],
      ['Is Checkpoint', revisionData.current.isCheckpoint ? 'Yes' : 'No'],
      ['', ''],
      ['History Summary', ''],
      ['Total Revisions', revisionData.history.totalRevisions],
      ['Last Checkpoint', revisionData.history.lastCheckpoint || 'None'],
      ['Recent Changes', revisionData.history.recentChanges]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    this.applySummaryFormatting(worksheet);

    return worksheet;
  }

  /**
   * Prepare columns for export based on options
   */
  private prepareColumns(
    columns: ColumnDefinition[], 
    options: { includeHidden?: boolean; selectedColumns?: string[] }
  ): ColumnDefinition[] {
    let exportColumns = columns;

    if (!options.includeHidden) {
      exportColumns = columns.filter(col => col.visible);
    }

    if (options.selectedColumns && options.selectedColumns.length > 0) {
      exportColumns = exportColumns.filter(col => 
        options.selectedColumns!.includes(col.field)
      );
    }

    return exportColumns;
  }

  /**
   * Transform data for export using column definitions
   */
  private transformData(data: any[], columns: ColumnDefinition[]): any[] {
    return data.map(item => {
      const row: any = {};
      columns.forEach(column => {
        const value = this.getFieldValue(item, column.field);
        row[column.headerName] = this.formatCellValue(value, column.field);
      });
      return row;
    });
  }

  /**
   * Get field value from object, supporting nested fields
   */
  private getFieldValue(obj: any, field: string): any {
    if (field.includes('.')) {
      return field.split('.').reduce((current, key) => current?.[key], obj);
    }
    return obj[field];
  }

  /**
   * Format cell values based on field type
   */
  private formatCellValue(value: any, field: string): string {
    if (value == null) return '';
    
    switch (field) {
      case 'createdAt':
      case 'lastModified':
        return value instanceof Date ? value.toLocaleString() : value;
      case 'voltage':
        return value ? `${value}V` : '';
      case 'current':
        return value ? `${value}A` : '';
      case 'power':
        return value ? `${value}kW` : '';
      case 'length':
      case 'calculatedLength':
        return value ? `${value}m` : '';
      case 'outerDiameter':
      case 'innerDiameter':
        return value ? `${value}mm` : '';
      case 'sparePercentage':
      case 'voltageDropPercentage':
      case 'fillPercentage':
        return value ? `${value}%` : '';
      case 'segregationWarning':
        return value ? 'Yes' : 'No';
      case 'isActive':
      case 'isSpare':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  }

  /**
   * Apply standard worksheet formatting
   */
  private applyWorksheetFormatting(
    worksheet: XLSX.WorkSheet, 
    columns: ColumnDefinition[], 
    dataRows: number
  ): void {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Apply header formatting (row 1)
    for (let col = range.s.c; col <= range.e.c; col++) {
      const headerCell = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[headerCell]) continue;

      worksheet[headerCell].s = {
        font: { 
          bold: true, 
          sz: this.defaultFormatting.headerStyle.fontSize,
          color: { rgb: this.defaultFormatting.headerStyle.fontColor }
        },
        fill: { 
          patternType: 'solid',
          fgColor: { rgb: this.defaultFormatting.headerStyle.backgroundColor }
        },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      };
    }

    // Apply data row formatting
    for (let row = 1; row <= dataRows; row++) {
      const isEvenRow = row % 2 === 0;
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!worksheet[cellRef]) continue;

        worksheet[cellRef].s = {
          font: { sz: this.defaultFormatting.dataStyle.fontSize },
          fill: isEvenRow && this.defaultFormatting.dataStyle.alternateRowColor ? {
            patternType: 'solid',
            fgColor: { rgb: this.defaultFormatting.dataStyle.alternateRowColor }
          } : undefined,
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      }
    }
  }

  /**
   * Apply summary sheet specific formatting
   */
  private applySummaryFormatting(worksheet: XLSX.WorkSheet): void {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Headers (column A) - bold formatting for category headers
    const categoryRows = [0, 6, 13, 19]; // Project Information, Entity Totals, etc.
    
    categoryRows.forEach(rowIndex => {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          font: { bold: true, sz: 12, color: { rgb: 'FF000000' } },
          fill: { patternType: 'solid', fgColor: { rgb: 'FFE0E0E0' } }
        };
      }
    });

    // Set column widths
    worksheet['!cols'] = [
      { width: 25 }, // Category/Label column
      { width: 20 }  // Value column
    ];
  }

  /**
   * Apply validation sheet specific formatting
   */
  private applyValidationFormatting(worksheet: XLSX.WorkSheet, dataRows: number): void {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Apply conditional formatting based on severity
    for (let row = 1; row <= dataRows; row++) {
      const severityCell = XLSX.utils.encode_cell({ r: row, c: 3 }); // Severity column
      if (!worksheet[severityCell]) continue;

      const severity = worksheet[severityCell].v;
      let backgroundColor = 'FFFFFFFF'; // White default

      switch (severity) {
        case 'error':
          backgroundColor = 'FFFF0000'; // Red
          break;
        case 'warning':
          backgroundColor = 'FFFF9900'; // Orange
          break;
        case 'info':
          backgroundColor = 'FF0099CC'; // Blue
          break;
      }

      // Apply to entire row
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = {
            fill: { patternType: 'solid', fgColor: { rgb: backgroundColor } },
            font: { color: { rgb: 'FFFFFFFF' } } // White text
          };
        }
      }
    }
  }

  /**
   * Calculate optimal column widths
   */
  private calculateColumnWidths(data: any[], columns: ColumnDefinition[]): any[] {
    if (data.length === 0) return [];

    const maxWidths: number[] = [];
    const headers = Object.keys(data[0]);

    headers.forEach((header, index) => {
      // Start with header width
      let maxWidth = header.length;

      // Check data widths
      data.forEach(row => {
        const cellValue = String(row[header] || '');
        maxWidth = Math.max(maxWidth, cellValue.length);
      });

      // Apply reasonable limits
      maxWidth = Math.min(Math.max(maxWidth, 10), 50);
      maxWidths.push(maxWidth);
    });

    return maxWidths.map(width => ({ width }));
  }

  /**
   * Get default sheet configuration for entity types
   */
  public getDefaultSheetConfig(entityType: string): { name: string; color?: string } {
    const configs = {
      summary: { name: 'Summary', color: 'FF4472C4' },
      cables: { name: 'Cables', color: 'FF70AD47' },
      io: { name: 'I/O Points', color: 'FFFFC000' },
      loads: { name: 'Loads', color: 'FF5B9BD5' },
      conduits: { name: 'Conduits', color: 'FFA5A5A5' },
      trays: { name: 'Trays', color: 'FF264478' },
      validation: { name: 'Validation', color: 'FFE74C3C' },
      revision: { name: 'Revision Info', color: 'FF9B59B6' }
    };

    return configs[entityType as keyof typeof configs] || { name: entityType };
  }

  /**
   * Apply print settings to worksheet
   */
  public applyPrintSettings(worksheet: XLSX.WorkSheet): void {
    worksheet['!printHeader'] = '&C&"Arial,Bold"&14CableForge Export';
    worksheet['!printFooter'] = '&L&D &T&R&P of &N';
    worksheet['!margins'] = {
      left: 0.7,
      right: 0.7,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3
    };
  }
}