import * as XLSX from 'xlsx';
import { Cable } from '../types';
import { ColumnDefinition } from './column-service';

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

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

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

  private generateFilename(customFilename?: string, extension: string = 'xlsx'): string {
    if (customFilename) {
      return customFilename.endsWith(`.${extension}`) 
        ? customFilename 
        : `${customFilename}.${extension}`;
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    return `CableForge_Export_${timestamp}.${extension}`;
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

  // Preset management
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

  private generateId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const exportService = ExportService.getInstance();