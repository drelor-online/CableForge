import { Cable } from '../types';
import { SelectionRange } from '../hooks/useTableSelection';
import { Column } from '@tanstack/react-table';

/**
 * Utility functions for TanStack Table operations
 */

export interface FillOperation {
  type: 'down' | 'right' | 'series' | 'clear';
  range: SelectionRange;
  sourceValue?: any;
}

/**
 * Copy selected cells to clipboard in Excel-compatible format
 */
export const copyToClipboard = async <T extends Record<string, any>>(
  data: T[],
  range: SelectionRange,
  columns: Column<T, unknown>[] | string[]
): Promise<void> => {
  try {
    const { start, end } = range;
    
    const startRow = Math.min(start.row, end.row);
    const endRow = Math.max(start.row, end.row);
    
    // Handle both Column objects and string arrays
    const columnKeys = Array.isArray(columns) && columns.length > 0 && typeof columns[0] === 'string' 
      ? columns as string[]
      : (columns as Column<T, unknown>[]).map(col => col.id);
    
    const startColIndex = columnKeys.indexOf(start.column);
    const endColIndex = columnKeys.indexOf(end.column);
    const startCol = Math.min(startColIndex, endColIndex);
    const endCol = Math.max(startColIndex, endColIndex);
    
    const rows: string[] = [];
    
    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      const rowData = data[rowIndex];
      if (!rowData) continue;
      
      const cells: string[] = [];
      for (let colIndex = startCol; colIndex <= endCol; colIndex++) {
        const columnKey = columnKeys[colIndex];
        const cellValue = rowData[columnKey as keyof T];
        
        // Convert to string and escape if needed
        let stringValue = cellValue?.toString() || '';
        if (stringValue.includes('\t') || stringValue.includes('\n') || stringValue.includes('"')) {
          stringValue = `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        cells.push(stringValue);
      }
      rows.push(cells.join('\t'));
    }
    
    const clipboardText = rows.join('\n');
    
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(clipboardText);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = clipboardText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    throw error;
  }
};

/**
 * Parse clipboard data for pasting (legacy version)
 */
export const parseClipboardDataRaw = async (): Promise<string[][]> => {
  try {
    let clipboardText = '';
    
    if (navigator.clipboard && window.isSecureContext) {
      clipboardText = await navigator.clipboard.readText();
    } else {
      // Fallback for older browsers - would need user to paste into a hidden textarea
      throw new Error('Clipboard access not available');
    }
    
    // Parse tab-delimited data
    const rows = clipboardText.split('\n').filter(row => row.trim());
    return rows.map(row => {
      const cells: string[] = [];
      let currentCell = '';
      let inQuotes = false;
      let i = 0;
      
      while (i < row.length) {
        const char = row[i];
        
        if (char === '"') {
          if (inQuotes && i + 1 < row.length && row[i + 1] === '"') {
            // Escaped quote
            currentCell += '"';
            i += 2;
          } else {
            // Toggle quote mode
            inQuotes = !inQuotes;
            i++;
          }
        } else if (char === '\t' && !inQuotes) {
          // End of cell
          cells.push(currentCell);
          currentCell = '';
          i++;
        } else {
          currentCell += char;
          i++;
        }
      }
      
      // Add the last cell
      cells.push(currentCell);
      return cells;
    });
  } catch (error) {
    console.error('Failed to parse clipboard data:', error);
    throw error;
  }
};

/**
 * Parse clipboard data and return updates for entities
 */
export const parseClipboardData = async <T extends Record<string, any>>(
  clipboardText: string,
  data: T[],
  range: SelectionRange,
  columns: Column<T, unknown>[]
): Promise<Array<{ id: number; changes: Partial<T> }>> => {
  try {
    const updates: Array<{ id: number; changes: Partial<T> }> = [];
    
    // Parse tab-delimited data
    const rows = clipboardText.split('\n').filter(row => row.trim());
    const { start } = range;
    
    const columnKeys = columns.map(col => col.id);
    const startColIndex = columnKeys.indexOf(start.column);
    if (startColIndex === -1) return updates;
    
    rows.forEach((row, rowOffset) => {
      const targetRowIndex = start.row + rowOffset;
      const targetItem = data[targetRowIndex];
      if (!targetItem?.id) return;
      
      const cells = row.split('\t');
      const changes: Partial<T> = {};
      
      cells.forEach((cell, cellOffset) => {
        const targetColIndex = startColIndex + cellOffset;
        if (targetColIndex >= columnKeys.length) return;
        
        const columnKey = columnKeys[targetColIndex];
        (changes as any)[columnKey] = cell;
      });
      
      if (Object.keys(changes).length > 0) {
        updates.push({ id: targetItem.id, changes });
      }
    });
    
    return updates;
  } catch (error) {
    console.error('Failed to parse clipboard data:', error);
    return [];
  }
};

/**
 * Fill down operation - copy the top cell to all selected cells below
 */
export const fillDown = <T extends Record<string, any>>(
  data: T[],
  range: SelectionRange,
  columns: Column<T, unknown>[] | string[],
  onUpdate: (id: number, changes: Partial<T>) => void
): void => {
  const { start, end } = range;
  
  const startRow = Math.min(start.row, end.row);
  const endRow = Math.max(start.row, end.row);
  
  // Handle both Column objects and string arrays
  const columnKeys = Array.isArray(columns) && columns.length > 0 && typeof columns[0] === 'string' 
    ? columns as string[]
    : (columns as Column<T, unknown>[]).map(col => col.id);
  
  const startColIndex = columnKeys.indexOf(start.column);
  const endColIndex = columnKeys.indexOf(end.column);
  const startCol = Math.min(startColIndex, endColIndex);
  const endCol = Math.max(startColIndex, endColIndex);
  
  // Get source values from the first row
  const sourceRow = data[startRow];
  if (!sourceRow) return;
  
  for (let colIndex = startCol; colIndex <= endCol; colIndex++) {
    const columnKey = columnKeys[colIndex];
    const sourceValue = sourceRow[columnKey as keyof T];
    
    // Fill down to all rows below the source
    for (let rowIndex = startRow + 1; rowIndex <= endRow; rowIndex++) {
      const rowItem = data[rowIndex];
      if (rowItem?.id) {
        onUpdate(rowItem.id, { [columnKey]: sourceValue } as Partial<T>);
      }
    }
  }
};

/**
 * Fill right operation - copy the leftmost cell to all selected cells to the right
 */
export const fillRight = <T extends Record<string, any>>(
  data: T[],
  range: SelectionRange,
  columns: Column<T, unknown>[] | string[],
  onUpdate: (id: number, changes: Partial<T>) => void
): void => {
  const { start, end } = range;
  
  const startRow = Math.min(start.row, end.row);
  const endRow = Math.max(start.row, end.row);
  
  // Handle both Column objects and string arrays
  const columnKeys = Array.isArray(columns) && columns.length > 0 && typeof columns[0] === 'string' 
    ? columns as string[]
    : (columns as Column<T, unknown>[]).map(col => col.id);
  
  const startColIndex = columnKeys.indexOf(start.column);
  const endColIndex = columnKeys.indexOf(end.column);
  const startCol = Math.min(startColIndex, endColIndex);
  const endCol = Math.max(startColIndex, endColIndex);
  
  const sourceColumnKey = columnKeys[startCol];
  
  for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
    const sourceRow = data[rowIndex];
    if (!sourceRow) continue;
    
    const sourceValue = sourceRow[sourceColumnKey as keyof T];
    
    // Fill right to all columns to the right of the source
    for (let colIndex = startCol + 1; colIndex <= endCol; colIndex++) {
      const columnKey = columnKeys[colIndex];
      const rowItem = data[rowIndex];
      if (rowItem?.id) {
        onUpdate(rowItem.id, { [columnKey]: sourceValue } as Partial<T>);
      }
    }
  }
};

/**
 * Fill series operation - auto-increment numbers
 */
export const fillSeries = <T extends Record<string, any>>(
  data: T[],
  range: SelectionRange,
  columns: Column<T, unknown>[] | string[],
  onUpdate: (id: number, changes: Partial<T>) => void
): void => {
  const { start, end } = range;
  
  const startRow = Math.min(start.row, end.row);
  const endRow = Math.max(start.row, end.row);
  
  // Handle both Column objects and string arrays
  const columnKeys = Array.isArray(columns) && columns.length > 0 && typeof columns[0] === 'string' 
    ? columns as string[]
    : (columns as Column<T, unknown>[]).map(col => col.id);
  
  const startColIndex = columnKeys.indexOf(start.column);
  const endColIndex = columnKeys.indexOf(end.column);
  const startCol = Math.min(startColIndex, endColIndex);
  const endCol = Math.max(startColIndex, endColIndex);
  
  for (let colIndex = startCol; colIndex <= endCol; colIndex++) {
    const columnKey = columnKeys[colIndex];
    const sourceRow = data[startRow];
    if (!sourceRow) continue;
    
    const sourceValue = sourceRow[columnKey as keyof T];
    const numValue = parseFloat(sourceValue?.toString() || '0');
    
    if (isNaN(numValue)) {
      // If not a number, just fill down
      for (let rowIndex = startRow + 1; rowIndex <= endRow; rowIndex++) {
        const rowItem = data[rowIndex];
        if (rowItem?.id) {
          onUpdate(rowItem.id, { [columnKey]: sourceValue } as Partial<T>);
        }
      }
    } else {
      // Create series
      for (let rowIndex = startRow + 1; rowIndex <= endRow; rowIndex++) {
        const rowItem = data[rowIndex];
        if (rowItem?.id) {
          const increment = rowIndex - startRow;
          const newValue = numValue + increment;
          onUpdate(rowItem.id, { [columnKey]: newValue } as Partial<T>);
        }
      }
    }
  }
};

/**
 * Clear contents operation
 */
export const clearContents = <T extends Record<string, any>>(
  data: T[],
  range: SelectionRange,
  columns: Column<T, unknown>[] | string[],
  onUpdate: (id: number, changes: Partial<T>) => void
): void => {
  const { start, end } = range;
  
  const startRow = Math.min(start.row, end.row);
  const endRow = Math.max(start.row, end.row);
  
  // Handle both Column objects and string arrays
  const columnKeys = Array.isArray(columns) && columns.length > 0 && typeof columns[0] === 'string' 
    ? columns as string[]
    : (columns as Column<T, unknown>[]).map(col => col.id);
  
  const startColIndex = columnKeys.indexOf(start.column);
  const endColIndex = columnKeys.indexOf(end.column);
  const startCol = Math.min(startColIndex, endColIndex);
  const endCol = Math.max(startColIndex, endColIndex);
  
  for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
    for (let colIndex = startCol; colIndex <= endCol; colIndex++) {
      const columnKey = columnKeys[colIndex];
      
      // Don't clear readonly fields like id
      if (columnKey !== 'id' && columnKey !== 'selection') {
        const rowItem = data[rowIndex];
        if (rowItem?.id) {
          onUpdate(rowItem.id, { [columnKey]: '' } as Partial<T>);
        }
      }
    }
  }
};

/**
 * Validate if a paste operation can be performed
 */
export const validatePasteOperation = (
  clipboardData: string[][],
  targetRange: SelectionRange,
  totalRows: number,
  totalColumns: number
): { valid: boolean; message?: string } => {
  const { start } = targetRange;
  const requiredRows = start.row + clipboardData.length;
  const requiredColumns = start.column ? 1 : 0; // Simplified for now
  
  if (requiredRows > totalRows) {
    return {
      valid: false,
      message: `Not enough rows. Need ${requiredRows}, have ${totalRows}`
    };
  }
  
  return { valid: true };
};

/**
 * Get Excel-like column letter (A, B, C, ..., AA, AB, etc.)
 */
export const getColumnLetter = (index: number): string => {
  let letter = '';
  while (index >= 0) {
    letter = String.fromCharCode(65 + (index % 26)) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
};

/**
 * Format cell address like Excel (A1, B2, etc.)
 */
export const getCellAddress = (row: number, columnIndex: number): string => {
  return `${getColumnLetter(columnIndex)}${row + 1}`;
};