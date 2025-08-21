import * as XLSX from 'xlsx';
import { Cable } from '../types';
import { ColumnDefinition } from './column-service';

export interface ImportOptions {
  format: 'csv' | 'xlsx';
  hasHeaders: boolean;
  sheetName?: string;
  startRow: number;
  columnMapping: { [key: string]: string }; // field -> column index/name
  skipEmptyRows: boolean;
  overwriteExisting: boolean;
}

export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  duplicates: string[];
  parsedData: Partial<Cable>[];
  totalRows: number;
  validRows: number;
}

export interface ImportPreset {
  id: string;
  name: string;
  description?: string;
  options: ImportOptions;
  createdAt: Date;
}

export interface ParsedCsvData {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

class ImportService {
  private static instance: ImportService;

  public static getInstance(): ImportService {
    if (!ImportService.instance) {
      ImportService.instance = new ImportService();
    }
    return ImportService.instance;
  }

  // Parse file content into structured data
  parseFile(file: File): Promise<ParsedCsvData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let parsedData: ParsedCsvData;

          if (file.name.endsWith('.csv')) {
            parsedData = this.parseCSV(content);
          } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            parsedData = this.parseExcel(content);
          } else {
            throw new Error('Unsupported file format. Please use CSV or Excel files.');
          }

          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  }

  private parseCSV(content: string): ParsedCsvData {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length === 0) {
      throw new Error('File is empty');
    }

    // Simple CSV parsing (handles basic cases, could be enhanced for complex CSV)
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    };

    const rows = lines.map(parseCSVLine);
    const headers = rows[0] || [];
    
    return {
      headers,
      rows,
      totalRows: rows.length
    };
  }

  private parseExcel(content: string): ParsedCsvData {
    const workbook = XLSX.read(content, { type: 'binary' });
    const firstSheetName = workbook.SheetNames[0];
    
    if (!firstSheetName) {
      throw new Error('Excel file contains no sheets');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      raw: false
    }) as string[][];

    if (jsonData.length === 0) {
      throw new Error('Excel sheet is empty');
    }

    const headers = jsonData[0] || [];
    
    return {
      headers,
      rows: jsonData,
      totalRows: jsonData.length
    };
  }

  // Validate and convert parsed data to Cable objects
  validateAndConvertData(
    parsedData: ParsedCsvData, 
    options: ImportOptions,
    columns: ColumnDefinition[],
    existingCables: Cable[] = []
  ): ImportValidationResult {
    const result: ImportValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      duplicates: [],
      parsedData: [],
      totalRows: parsedData.totalRows,
      validRows: 0
    };

    try {
      const { headers, rows } = parsedData;
      const startIndex = options.hasHeaders ? 1 : 0;
      const dataRows = rows.slice(startIndex + options.startRow);

      // Validate column mapping
      const mappingErrors = this.validateColumnMapping(options.columnMapping, headers, columns);
      if (mappingErrors.length > 0) {
        result.errors.push(...mappingErrors);
        result.isValid = false;
        return result;
      }

      // Process each row
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNumber = startIndex + options.startRow + i + 1;

        // Skip empty rows if requested
        if (options.skipEmptyRows && this.isEmptyRow(row)) {
          continue;
        }

        try {
          const cableData = this.convertRowToCable(row, options.columnMapping, headers, columns);
          
          // Validate required fields
          const validationErrors = this.validateCableData(cableData, rowNumber);
          if (validationErrors.length > 0) {
            result.errors.push(...validationErrors);
            continue;
          }

          // Check for duplicates
          const duplicateCheck = this.checkForDuplicates(cableData, existingCables, result.parsedData);
          if (duplicateCheck.length > 0) {
            result.duplicates.push(...duplicateCheck);
            if (!options.overwriteExisting) {
              result.warnings.push(`Row ${rowNumber}: Duplicate cable tag "${cableData.tag}" found`);
            }
          }

          result.parsedData.push(cableData);
          result.validRows++;
        } catch (error) {
          result.errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      result.isValid = result.errors.length === 0;
      return result;
    } catch (error) {
      result.errors.push(`Import validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.isValid = false;
      return result;
    }
  }

  private validateColumnMapping(
    mapping: { [key: string]: string },
    headers: string[],
    columns: ColumnDefinition[]
  ): string[] {
    const errors: string[] = [];
    const requiredFields = columns.filter(col => col.required).map(col => col.field);

    // Check if required fields are mapped
    for (const field of requiredFields) {
      if (!mapping[field]) {
        errors.push(`Required field "${field}" is not mapped to any column`);
      }
    }

    // Check if mapped columns exist in headers
    for (const [field, columnRef] of Object.entries(mapping)) {
      if (columnRef && !headers.includes(columnRef)) {
        // If it's not a header name, check if it's a valid column index
        const columnIndex = parseInt(columnRef);
        if (isNaN(columnIndex) || columnIndex < 0 || columnIndex >= headers.length) {
          errors.push(`Column "${columnRef}" mapped to field "${field}" does not exist`);
        }
      }
    }

    return errors;
  }

  private isEmptyRow(row: string[]): boolean {
    return row.every(cell => !cell || cell.trim() === '');
  }

  private convertRowToCable(
    row: string[],
    mapping: { [key: string]: string },
    headers: string[],
    columns: ColumnDefinition[]
  ): Partial<Cable> {
    const cable: Partial<Cable> = {};

    for (const [field, columnRef] of Object.entries(mapping)) {
      if (!columnRef) continue;

      let cellValue: string;
      
      // Get cell value by header name or column index
      const headerIndex = headers.indexOf(columnRef);
      if (headerIndex !== -1) {
        cellValue = row[headerIndex] || '';
      } else {
        const columnIndex = parseInt(columnRef);
        if (!isNaN(columnIndex) && columnIndex >= 0 && columnIndex < row.length) {
          cellValue = row[columnIndex] || '';
        } else {
          continue;
        }
      }

      // Convert cell value to appropriate type
      const column = columns.find(col => col.field === field);
      if (column) {
        (cable as any)[field] = this.convertCellValue(cellValue, field);
      }
    }

    return cable;
  }

  private convertCellValue(value: string, field: string): any {
    if (!value || value.trim() === '') return null;

    const trimmedValue = value.trim();

    switch (field) {
      case 'voltage':
      case 'current':
      case 'cores':
      case 'length':
      case 'sparePercentage':
      case 'calculatedLength':
      case 'outerDiameter':
      case 'voltageDropPercentage':
        // Extract numbers from strings like "480V", "25A", "12mm", "15%"
        const numMatch = trimmedValue.match(/[\d.]+/);
        return numMatch ? parseFloat(numMatch[0]) : null;

      case 'segregationWarning':
        return ['true', 'yes', '1', 'on'].includes(trimmedValue.toLowerCase());

      case 'createdAt':
      case 'lastModified':
        const date = new Date(trimmedValue);
        return isNaN(date.getTime()) ? null : date;

      default:
        return trimmedValue;
    }
  }

  private validateCableData(cable: Partial<Cable>, rowNumber: number): string[] {
    const errors: string[] = [];

    // Validate required fields
    if (!cable.tag || cable.tag.trim() === '') {
      errors.push(`Row ${rowNumber}: Cable tag is required`);
    }

    // Validate data types and ranges
    if (cable.voltage !== null && cable.voltage !== undefined) {
      if (isNaN(cable.voltage as number) || (cable.voltage as number) < 0) {
        errors.push(`Row ${rowNumber}: Invalid voltage value`);
      }
    }

    if (cable.current !== null && cable.current !== undefined) {
      if (isNaN(cable.current as number) || (cable.current as number) < 0) {
        errors.push(`Row ${rowNumber}: Invalid current value`);
      }
    }

    if (cable.cores !== null && cable.cores !== undefined) {
      if (isNaN(cable.cores as number) || (cable.cores as number) < 1) {
        errors.push(`Row ${rowNumber}: Invalid cores value (must be at least 1)`);
      }
    }

    return errors;
  }

  private checkForDuplicates(
    cable: Partial<Cable>,
    existingCables: Cable[],
    parsedCables: Partial<Cable>[]
  ): string[] {
    const duplicates: string[] = [];

    if (!cable.tag) return duplicates;

    // Check against existing cables
    const existingDuplicate = existingCables.find(existing => existing.tag === cable.tag);
    if (existingDuplicate) {
      duplicates.push(`Existing cable with tag "${cable.tag}"`);
    }

    // Check against previously parsed cables in this import
    const parsedDuplicate = parsedCables.find(parsed => parsed.tag === cable.tag);
    if (parsedDuplicate) {
      duplicates.push(`Duplicate in import data: "${cable.tag}"`);
    }

    return duplicates;
  }

  // Import preset management
  saveImportPreset(preset: Omit<ImportPreset, 'id' | 'createdAt'>): ImportPreset {
    const newPreset: ImportPreset = {
      ...preset,
      id: this.generateId(),
      createdAt: new Date()
    };
    
    const existingPresets = this.getImportPresets();
    existingPresets.push(newPreset);
    localStorage.setItem('import-presets', JSON.stringify(existingPresets));
    
    return newPreset;
  }

  getImportPresets(): ImportPreset[] {
    try {
      const saved = localStorage.getItem('import-presets');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load import presets:', error);
      return [];
    }
  }

  deleteImportPreset(id: string): void {
    const presets = this.getImportPresets().filter(p => p.id !== id);
    localStorage.setItem('import-presets', JSON.stringify(presets));
  }

  // Get field suggestions for mapping
  suggestFieldMapping(headers: string[], columns: ColumnDefinition[]): { [key: string]: string } {
    const mapping: { [key: string]: string } = {};

    for (const column of columns) {
      const suggestions = this.getFieldSuggestions(column.field, column.headerName);
      
      for (const suggestion of suggestions) {
        const matchingHeader = headers.find(header => 
          header.toLowerCase().includes(suggestion.toLowerCase()) ||
          suggestion.toLowerCase().includes(header.toLowerCase())
        );
        
        if (matchingHeader) {
          mapping[column.field] = matchingHeader;
          break;
        }
      }
    }

    return mapping;
  }

  private getFieldSuggestions(field: string, headerName: string): string[] {
    const suggestions = [headerName.toLowerCase(), field.toLowerCase()];

    // Add field-specific suggestions
    switch (field) {
      case 'tag':
        suggestions.push('cable tag', 'cable_tag', 'number', 'id', 'identifier');
        break;
      case 'description':
        suggestions.push('desc', 'name', 'title', 'cable description');
        break;
      case 'fromEquipment':
        suggestions.push('from', 'source', 'origin', 'from equipment', 'from_equipment');
        break;
      case 'toEquipment':
        suggestions.push('to', 'destination', 'dest', 'to equipment', 'to_equipment');
        break;
      case 'voltage':
        suggestions.push('volt', 'v', 'voltage rating');
        break;
      case 'current':
        suggestions.push('amp', 'ampere', 'current rating', 'amps');
        break;
      case 'cableType':
        suggestions.push('type', 'cable type', 'cable_type');
        break;
      // Add more field-specific suggestions as needed
    }

    return suggestions;
  }

  private generateId(): string {
    return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const importService = ImportService.getInstance();