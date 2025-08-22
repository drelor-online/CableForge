import { useState, useCallback, useRef } from 'react';

export interface CellPosition {
  row: number;
  column: string;
}

export interface SelectionRange {
  start: CellPosition;
  end: CellPosition;
}

export interface UseTableSelectionReturn {
  selectedRange: SelectionRange | null;
  selectedCells: Set<string>;
  selectedRows: Set<number>;
  isSelecting: boolean;
  isRangeSelecting: boolean;
  lastClickedRow: number | null;
  handleMouseDown: (row: number, column: string, event: React.MouseEvent) => void;
  handleMouseMove: (row: number, column: string, event: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleRowClick: (event: React.MouseEvent, rowIndex: number) => void;
  handleRowMouseEnter: (rowIndex: number) => void;
  clearSelection: () => void;
  selectAll: () => void;
  isCellSelected: (row: number, column: string) => boolean;
  getCellRangeClass: (row: number, column: string) => string;
  getSelectedData: () => any[];
}

/**
 * Custom hook for handling Excel-like table range selection
 */
export const useTableSelection = (options?: {
  data?: any[];
  columns?: string[];
  onSelectionChange?: (selectedIds: number[]) => void;
}): UseTableSelectionReturn => {
  const [selectedRange, setSelectedRange] = useState<SelectionRange | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [isRangeSelecting, setIsRangeSelecting] = useState(false);
  const [lastClickedRow, setLastClickedRow] = useState<number | null>(null);
  const selectionStartRef = useRef<CellPosition | null>(null);

  const getCellKey = useCallback((row: number, column: string) => `${row}-${column}`, []);

  const calculateCellsInRange = useCallback((start: CellPosition, end: CellPosition, columns: string[]) => {
    const cells = new Set<string>();
    
    const startRow = Math.min(start.row, end.row);
    const endRow = Math.max(start.row, end.row);
    
    const startColIndex = columns.indexOf(start.column);
    const endColIndex = columns.indexOf(end.column);
    const startCol = Math.min(startColIndex, endColIndex);
    const endCol = Math.max(startColIndex, endColIndex);
    
    for (let row = startRow; row <= endRow; row++) {
      for (let colIndex = startCol; colIndex <= endCol; colIndex++) {
        const column = columns[colIndex];
        if (column) {
          cells.add(getCellKey(row, column));
        }
      }
    }
    
    return cells;
  }, [getCellKey]);

  const handleMouseDown = useCallback((row: number, column: string, event: React.MouseEvent) => {
    event.preventDefault();
    
    const newStart = { row, column };
    selectionStartRef.current = newStart;
    
    setIsSelecting(true);
    setSelectedRange({ start: newStart, end: newStart });
    setSelectedCells(new Set([getCellKey(row, column)]));
  }, [getCellKey]);

  const handleMouseMove = useCallback((row: number, column: string, event: React.MouseEvent) => {
    if (!isSelecting || !selectionStartRef.current) return;
    
    event.preventDefault();
    
    const start = selectionStartRef.current;
    const end = { row, column };
    
    setSelectedRange({ start, end });
    
    // Calculate the full rectangular range if columns are provided
    if (options?.columns) {
      const rangeIntersection = calculateCellsInRange(start, end, options.columns);
      setSelectedCells(rangeIntersection);
    } else {
      // Fallback to single cell if no columns provided
      setSelectedCells(new Set([getCellKey(row, column)]));
    }
  }, [isSelecting, getCellKey, calculateCellsInRange, options?.columns]);

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
    selectionStartRef.current = null;
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRange(null);
    setSelectedCells(new Set());
    setIsSelecting(false);
    selectionStartRef.current = null;
  }, []);

  const selectAll = useCallback(() => {
    // For now, this is a simplified version
    // Full implementation would select all rows in the table
    const data = options?.data || [];
    const allRows = new Set<number>();
    for (let i = 0; i < data.length; i++) {
      allRows.add(i);
    }
    setSelectedRows(allRows);
    
    if (options?.onSelectionChange) {
      const selectedIds = data.map((item, index) => item.id).filter((id, index) => allRows.has(index));
      options.onSelectionChange(selectedIds);
    }
  }, [options]);

  const handleRowClick = useCallback((event: React.MouseEvent, rowIndex: number) => {
    event.preventDefault();
    
    if (event.shiftKey && lastClickedRow !== null) {
      // Range selection
      setIsRangeSelecting(true);
      const start = Math.min(lastClickedRow, rowIndex);
      const end = Math.max(lastClickedRow, rowIndex);
      const newSelectedRows = new Set<number>();
      for (let i = start; i <= end; i++) {
        newSelectedRows.add(i);
      }
      setSelectedRows(newSelectedRows);
    } else if (event.ctrlKey || event.metaKey) {
      // Multi-select
      const newSelectedRows = new Set(selectedRows);
      if (newSelectedRows.has(rowIndex)) {
        newSelectedRows.delete(rowIndex);
      } else {
        newSelectedRows.add(rowIndex);
      }
      setSelectedRows(newSelectedRows);
    } else {
      // Single select
      setSelectedRows(new Set([rowIndex]));
      setIsRangeSelecting(false);
    }
    
    setLastClickedRow(rowIndex);
    
    // Notify parent of selection change
    if (options?.onSelectionChange && options?.data) {
      const selectedIds = Array.from(selectedRows).map(index => options.data?.[index]?.id).filter(id => id !== undefined);
      options.onSelectionChange(selectedIds);
    }
  }, [lastClickedRow, selectedRows, options]);

  const handleRowMouseEnter = useCallback((rowIndex: number) => {
    if (isRangeSelecting && lastClickedRow !== null) {
      const start = Math.min(lastClickedRow, rowIndex);
      const end = Math.max(lastClickedRow, rowIndex);
      const newSelectedRows = new Set<number>();
      for (let i = start; i <= end; i++) {
        newSelectedRows.add(i);
      }
      setSelectedRows(newSelectedRows);
    }
  }, [isRangeSelecting, lastClickedRow]);

  const getSelectedData = useCallback(() => {
    if (!options?.data) return [];
    return Array.from(selectedRows).map(index => options.data?.[index]).filter(Boolean);
  }, [selectedRows, options?.data]);

  const isCellSelected = useCallback((row: number, column: string) => {
    return selectedCells.has(getCellKey(row, column));
  }, [selectedCells, getCellKey]);

  const getCellRangeClass = useCallback((row: number, column: string) => {
    if (!selectedRange) return '';
    
    const isSelected = isCellSelected(row, column);
    if (!isSelected) return '';
    
    const { start, end } = selectedRange;
    const isStartCell = start.row === row && start.column === column;
    const isEndCell = end.row === row && end.column === column;
    
    if (isStartCell && isEndCell) return 'cell-selected-single';
    if (isStartCell) return 'cell-selected cell-selected-start';
    if (isEndCell) return 'cell-selected cell-selected-end';
    
    return 'cell-selected';
  }, [selectedRange, isCellSelected]);

  return {
    selectedRange,
    selectedCells,
    selectedRows,
    isSelecting,
    isRangeSelecting,
    lastClickedRow,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleRowClick,
    handleRowMouseEnter,
    clearSelection,
    selectAll,
    isCellSelected,
    getCellRangeClass,
    getSelectedData
  };
};