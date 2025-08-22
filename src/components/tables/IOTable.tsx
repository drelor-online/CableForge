import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  Row,
  Table as TanStackTable
} from '@tanstack/react-table';
import { IOPoint, PLCCard, SignalType, IOType } from '../../types';
import { ValidationResult } from '../../types/validation';
import { validationService } from '../../services/validation-service';
import { revisionService } from '../../services/revision-service';
import { useTableSelection } from '../../hooks/useTableSelection';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { 
  copyToClipboard, 
  parseClipboardData,
  fillDown,
  fillRight,
  fillSeries,
  clearContents 
} from '../../utils/tanstack-helpers';
import TableContextMenu from './TableContextMenu';
import FilterBar from '../layout/FilterBar';
import StatusIndicator from '../ui/StatusIndicator';
import ValidationIndicator from '../ui/ValidationIndicator';
import KebabMenu from '../ui/KebabMenu';
import BulkActionsBar from './BulkActionsBar';
// import { useUI } from '../../contexts/UIContext';
import { Edit2, Trash2, ChevronDown, Calculator, TrendingUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { ColumnDefinition, columnService } from '../../services/column-service';
import { FilterCondition, filterService } from '../../services/filter-service';
import '../../styles/tanstack-table.css';

interface IOTableProps {
  ioPoints: IOPoint[];
  plcCards: PLCCard[];
  onIOPointUpdate: (id: number, updates: Partial<IOPoint>) => void;
  onIOPointDelete: (ioPointId: number) => void;
  onIOPointEdit?: (ioPoint: IOPoint) => void;
  onAddIOPoint: () => void;
  onAddFromLibrary: () => void;
  onBulkEdit: () => void;
  selectedIOPoints: number[];
  onSelectionChange: (selectedIds: number[]) => void;
}

interface EditingCell {
  row: number;
  column: string;
}

interface UndoAction {
  action: 'update';
  ioPointId: number;
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

const IOTable: React.FC<IOTableProps> = ({
  ioPoints,
  plcCards,
  onIOPointUpdate,
  onIOPointDelete,
  onIOPointEdit,
  onAddIOPoint,
  onAddFromLibrary,
  onBulkEdit,
  selectedIOPoints,
  onSelectionChange
}) => {
  // const { showContextMenu, hideContextMenu } = useUI();
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<FilterCondition[]>([]);
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoAction[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const tableRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Validate IO points
  useEffect(() => {
    const validateIOPoints = async () => {
      const results = await validationService.validateIOPoints(ioPoints);
      setValidationResults(results);
    };
    validateIOPoints();
  }, [ioPoints]);

  // Define columns
  const columns: ColumnDef<IOPoint>[] = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="rounded border-gray-300"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded border-gray-300"
        />
      ),
      size: 40,
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      accessorKey: 'tag',
      header: 'Tag',
      size: 120,
      cell: ({ getValue, row, column }) => {
        const value = getValue() as string;
        const cellKey = `${row.index}-${column.id}`;
        const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
        
        if (isEditing) {
          return (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleEditKeyDown}
              className="w-full px-1 py-0.5 text-sm border border-blue-500 rounded focus:outline-none"
              autoFocus
            />
          );
        }
        
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
            onDoubleClick={() => handleStartEdit(row.index, column.id, value)}
          >
            {value || ''}
          </div>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      size: 200,
      cell: ({ getValue, row, column }) => {
        const value = getValue() as string;
        const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
        
        if (isEditing) {
          return (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleEditKeyDown}
              className="w-full px-1 py-0.5 text-sm border border-blue-500 rounded focus:outline-none"
              autoFocus
            />
          );
        }
        
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
            onDoubleClick={() => handleStartEdit(row.index, column.id, value)}
          >
            {value || ''}
          </div>
        );
      },
    },
    {
      accessorKey: 'signalType',
      header: 'Signal Type',
      size: 120,
      cell: ({ getValue, row, column }) => {
        const value = getValue() as SignalType;
        const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
        
        if (isEditing) {
          return (
            <select
              ref={inputRef as any}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleEditKeyDown}
              className="w-full px-1 py-0.5 text-sm border border-blue-500 rounded focus:outline-none"
              autoFocus
            >
              <option value="">Select...</option>
              <option value="ANALOG_INPUT">Analog Input</option>
              <option value="ANALOG_OUTPUT">Analog Output</option>
              <option value="DIGITAL_INPUT">Digital Input</option>
              <option value="DIGITAL_OUTPUT">Digital Output</option>
            </select>
          );
        }
        
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
            onDoubleClick={() => handleStartEdit(row.index, column.id, value || '')}
          >
            {value ? value.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : ''}
          </div>
        );
      },
    },
    {
      accessorKey: 'ioType',
      header: 'I/O Type',
      size: 100,
      cell: ({ getValue, row, column }) => {
        const value = getValue() as IOType;
        const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
        
        if (isEditing) {
          return (
            <select
              ref={inputRef as any}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleEditKeyDown}
              className="w-full px-1 py-0.5 text-sm border border-blue-500 rounded focus:outline-none"
              autoFocus
            >
              <option value="">Select...</option>
              <option value="INPUT">Input</option>
              <option value="OUTPUT">Output</option>
            </select>
          );
        }
        
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
            onDoubleClick={() => handleStartEdit(row.index, column.id, value || '')}
          >
            {value || ''}
          </div>
        );
      },
    },
    {
      accessorKey: 'plcName',
      header: 'PLC Name',
      size: 120,
      cell: ({ getValue, row, column }) => {
        const value = getValue() as string;
        const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
        
        if (isEditing) {
          return (
            <select
              ref={inputRef as any}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleEditKeyDown}
              className="w-full px-1 py-0.5 text-sm border border-blue-500 rounded focus:outline-none"
              autoFocus
            >
              <option value="">Select PLC...</option>
              {Array.from(new Set(plcCards.map(card => card.plcName))).map(plcName => (
                <option key={plcName} value={plcName}>{plcName}</option>
              ))}
            </select>
          );
        }
        
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
            onDoubleClick={() => handleStartEdit(row.index, column.id, value)}
          >
            {value || ''}
          </div>
        );
      },
    },
    {
      accessorKey: 'rack',
      header: 'Rack',
      size: 80,
      cell: ({ getValue, row, column }) => {
        const value = getValue() as number;
        const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
        
        if (isEditing) {
          return (
            <input
              ref={inputRef}
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleEditKeyDown}
              className="w-full px-1 py-0.5 text-sm border border-blue-500 rounded focus:outline-none"
              autoFocus
            />
          );
        }
        
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
            onDoubleClick={() => handleStartEdit(row.index, column.id, value?.toString() || '')}
          >
            {value || ''}
          </div>
        );
      },
    },
    {
      accessorKey: 'slot',
      header: 'Slot',
      size: 80,
      cell: ({ getValue, row, column }) => {
        const value = getValue() as number;
        const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
        
        if (isEditing) {
          return (
            <input
              ref={inputRef}
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleEditKeyDown}
              className="w-full px-1 py-0.5 text-sm border border-blue-500 rounded focus:outline-none"
              autoFocus
            />
          );
        }
        
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
            onDoubleClick={() => handleStartEdit(row.index, column.id, value?.toString() || '')}
          >
            {value || ''}
          </div>
        );
      },
    },
    {
      accessorKey: 'channel',
      header: 'Channel',
      size: 80,
      cell: ({ getValue, row, column }) => {
        const value = getValue() as number;
        const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
        
        if (isEditing) {
          return (
            <input
              ref={inputRef}
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleEditKeyDown}
              className="w-full px-1 py-0.5 text-sm border border-blue-500 rounded focus:outline-none"
              autoFocus
            />
          );
        }
        
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
            onDoubleClick={() => handleStartEdit(row.index, column.id, value?.toString() || '')}
          >
            {value || ''}
          </div>
        );
      },
    },
    {
      accessorKey: 'terminalBlock',
      header: 'Terminal Block',
      size: 120,
      cell: ({ getValue, row, column }) => {
        const value = getValue() as string;
        const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
        
        if (isEditing) {
          return (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleEditKeyDown}
              className="w-full px-1 py-0.5 text-sm border border-blue-500 rounded focus:outline-none"
              autoFocus
            />
          );
        }
        
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
            onDoubleClick={() => handleStartEdit(row.index, column.id, value)}
          >
            {value || ''}
          </div>
        );
      },
    },
    {
      accessorKey: 'function',
      header: 'Function',
      size: 150,
      cell: ({ getValue, row, column }) => {
        const value = getValue() as string;
        const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
        
        if (isEditing) {
          return (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleEditKeyDown}
              className="w-full px-1 py-0.5 text-sm border border-blue-500 rounded focus:outline-none"
              autoFocus
            />
          );
        }
        
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
            onDoubleClick={() => handleStartEdit(row.index, column.id, value)}
          >
            {value || ''}
          </div>
        );
      },
    },
    {
      id: 'validation',
      header: 'Status',
      size: 80,
      cell: ({ row }) => {
        const ioPoint = row.original;
        const validation = validationResults.find(v => v.entityId === ioPoint.id);
        return <ValidationIndicator validation={validation} />;
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      id: 'actions',
      header: '',
      size: 60,
      cell: ({ row }) => {
        const ioPoint = row.original;
        return (
          <KebabMenu
            items={[
              {
                icon: <Edit2 className="w-4 h-4" />,
                label: 'Edit',
                onClick: () => onIOPointEdit?.(ioPoint)
              },
              {
                icon: <Trash2 className="w-4 h-4" />,
                label: 'Delete',
                onClick: () => ioPoint.id && onIOPointDelete(ioPoint.id),
                variant: 'danger'
              }
            ]}
          />
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ], [editingCell, editValue, validationResults, onIOPointEdit, onIOPointDelete, plcCards]);

  // Create table instance
  const table = useReactTable({
    data: ioPoints,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' 
        ? updater(table.getState().rowSelection)
        : updater;
      
      const selectedIds = Object.keys(newSelection)
        .filter(key => newSelection[key])
        .map(key => ioPoints[parseInt(key)]?.id)
        .filter(id => id !== undefined) as number[];
      
      onSelectionChange(selectedIds);
    },
    globalFilterFn: 'includesString',
    state: {
      globalFilter,
      rowSelection: selectedIOPoints.reduce((acc, id) => {
        const index = ioPoints.findIndex(ioPoint => ioPoint.id === id);
        if (index !== -1) {
          acc[index] = true;
        }
        return acc;
      }, {} as Record<string, boolean>)
    }
  });

  // Table selection hook
  const {
    selectedRows,
    selectedRange,
    selectedCells,
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
  } = useTableSelection({
    data: ioPoints,
    columns: table.getAllColumns().map(col => col.id),
    onSelectionChange: (selectedIds) => {
      onSelectionChange(selectedIds);
    }
  });

  // Editing functions
  const handleStartEdit = useCallback((rowIndex: number, columnId: string, currentValue: any) => {
    setEditingCell({ row: rowIndex, column: columnId });
    setEditValue(currentValue?.toString() || '');
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingCell) return;
    
    const ioPoint = ioPoints[editingCell.row];
    if (!ioPoint?.id) return;
    
    const field = editingCell.column;
    const oldValue = (ioPoint as any)[field];
    let newValue: any = editValue;
    
    // Type conversion based on field
    if (field === 'rack' || field === 'slot' || field === 'channel') {
      newValue = editValue ? parseInt(editValue) : null;
    }
    
    if (oldValue !== newValue) {
      // Record change for undo
      const action: UndoAction = {
        action: 'update',
        ioPointId: ioPoint.id,
        field,
        oldValue,
        newValue,
        timestamp: Date.now()
      };
      
      setUndoStack(prev => [...prev.slice(-49), action]);
      setRedoStack([]);
      
      // Track revision
      revisionService.trackChange('iopoint', ioPoint.id, ioPoint.tag, 'update', field, oldValue, newValue);
      
      // Update the IO point
      onIOPointUpdate(ioPoint.id, { [field]: newValue });
    }
    
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, ioPoints, onIOPointUpdate]);

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingCell(null);
      setEditValue('');
    }
  }, [handleSaveEdit]);

  // Undo/Redo functions
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    
    const action = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [action, ...prev.slice(0, 49)]);
    
    // Revert the change
    onIOPointUpdate(action.ioPointId, { [action.field]: action.oldValue });
  }, [undoStack, onIOPointUpdate]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    const action = redoStack[0];
    setRedoStack(prev => prev.slice(1));
    setUndoStack(prev => [...prev, action]);
    
    // Reapply the change
    onIOPointUpdate(action.ioPointId, { [action.field]: action.newValue });
  }, [redoStack, onIOPointUpdate]);

  // Keyboard shortcuts
  useKeyboardShortcuts(table, selectedRange, {
      onCopy: () => {
        if (selectedRange) {
          copyToClipboard(ioPoints, selectedRange, table.getAllColumns());
        }
      },
      onPaste: async () => {
        if (selectedRange) {
          try {
            const clipboardData = await navigator.clipboard.readText();
            const updates = await parseClipboardData(clipboardData, ioPoints, selectedRange, table.getAllColumns());
            
            updates.forEach(update => {
              if (update.id) {
                onIOPointUpdate(update.id, update.changes);
              }
            });
          } catch (error) {
            console.error('Failed to paste:', error);
          }
        }
      },
      onDelete: () => {
        if (selectedRange) {
          clearContents(ioPoints, selectedRange, table.getAllColumns(), (id, changes) => {
            onIOPointUpdate(id, changes);
          });
        }
      },
      onFillDown: () => {
        if (selectedRange) {
          fillDown(ioPoints, selectedRange, table.getAllColumns(), (id, changes) => {
            onIOPointUpdate(id, changes);
          });
        }
      },
      onFillRight: () => {
        if (selectedRange) {
          fillRight(ioPoints, selectedRange, table.getAllColumns(), (id, changes) => {
            onIOPointUpdate(id, changes);
          });
        }
      },
      onStartEdit: (rowIndex, columnId) => {
        const ioPoint = ioPoints[rowIndex];
        const currentValue = (ioPoint as any)[columnId];
        handleStartEdit(rowIndex, columnId, currentValue);
      },
      onUndo: handleUndo,
      onRedo: handleRedo
  });

  // Cell mouse handlers for selection
  const handleCellMouseDown = useCallback((
    event: React.MouseEvent,
    rowIndex: number,
    columnKey: string
  ) => {
    if (event.button === 0) { // Left click only
      handleMouseDown(rowIndex, columnKey, event);
    }
  }, [handleMouseDown]);

  const handleCellMouseMove = useCallback((
    event: React.MouseEvent,
    rowIndex: number,
    columnKey: string
  ) => {
    if (isSelecting) {
      handleMouseMove(rowIndex, columnKey, event);
    }
  }, [isSelecting, handleMouseMove]);

  // Global mouse up handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        handleMouseUp();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isSelecting, handleMouseUp]);

  // Context menu functionality removed - can be added later if needed

  const selectedCount = Object.keys(table.getState().rowSelection).length;
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">I/O Points ({ioPoints.length})</h2>
          {hasSelection && (
            <span className="text-sm text-gray-500">
              {selectedCount} selected
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onAddIOPoint}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add IO Point
          </button>
          <button
            onClick={onAddFromLibrary}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add from Library
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {hasSelection && (
        <BulkActionsBar
          selectedCount={selectedCount}
          onBulkEdit={onBulkEdit}
          onBulkDelete={() => {
            const selectedIds = Object.keys(table.getState().rowSelection)
              .filter(key => table.getState().rowSelection[key])
              .map(key => ioPoints[parseInt(key)]?.id)
              .filter(id => id !== undefined) as number[];
            
            selectedIds.forEach(id => onIOPointDelete(id));
          }}
        />
      )}

      {/* Filters */}
      <FilterBar
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        columns={table.getAllColumns().map(col => ({
          id: col.id,
          label: typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id
        }))}
      />

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <div 
          ref={tableRef}
          className="h-full overflow-auto"
          // Context menu removed for now
        >
          <table className="tanstack-table">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={header.column.getCanSort() ? 'sortable' : ''}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          <ChevronDown 
                            className={`w-4 h-4 transition-transform ${
                              header.column.getIsSorted() === 'desc' ? 'rotate-180' : ''
                            }`}
                          />
                        )}
                      </div>
                      {header.column.getCanResize() && (
                        <div
                          className="resize-handle"
                          onMouseDown={header.getResizeHandler()}
                        />
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className={`
                    ${row.getIsSelected() ? 'selected' : ''}
                    ${selectedRows.has(parseInt(row.id)) ? 'table-row-selected' : ''}
                    ${isRangeSelecting && selectedRange && 
                      parseInt(row.id) >= Math.min(selectedRange.start.row, selectedRange.end.row) &&
                      parseInt(row.id) <= Math.max(selectedRange.start.row, selectedRange.end.row)
                      ? 'table-row-range' : ''}
                  `}
                  onClick={(e) => handleRowClick(e, parseInt(row.id))}
                  onMouseEnter={() => handleRowMouseEnter(parseInt(row.id))}
                  // Row context menu removed for now
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          
          {table.getRowModel().rows.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Calculator className="w-12 h-12 mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No I/O Points</h3>
              <p className="text-sm text-center mb-4">
                Get started by adding your first I/O point.
              </p>
              <button
                onClick={onAddIOPoint}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Add IO Point
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IOTable;