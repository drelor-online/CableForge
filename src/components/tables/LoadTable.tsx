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
import { Load } from '../../types';
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
import { Edit2, Trash2, ChevronDown, Zap, TrendingUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { ColumnDefinition, columnService } from '../../services/column-service';
import { FilterCondition, filterService } from '../../services/filter-service';
import '../../styles/tanstack-table.css';

interface LoadTableProps {
  loads: Load[];
  onLoadUpdate: (id: number, updates: Partial<Load>) => void;
  onLoadDelete: (loadId: number) => void;
  onLoadEdit?: (load: Load) => void;
  onAddLoad?: () => void;
  onAddFromLibrary?: () => void;
  onBulkEdit: () => void;
  selectedLoads: number[];
  onSelectionChange: (selectedIds: number[]) => void;
}

interface EditingCell {
  row: number;
  column: string;
}

interface UndoAction {
  action: 'update';
  loadId: number;
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

const LoadTable: React.FC<LoadTableProps> = ({
  loads,
  onLoadUpdate,
  onLoadDelete,
  onLoadEdit,
  onAddLoad,
  onAddFromLibrary,
  onBulkEdit,
  selectedLoads,
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

  // Validate loads
  useEffect(() => {
    const validateLoads = async () => {
      const results = await validationService.validateLoads(loads);
      setValidationResults(results);
    };
    validateLoads();
  }, [loads]);

  // Define columns
  const columns: ColumnDef<Load>[] = useMemo(() => [
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
      accessorKey: 'loadType',
      header: 'Load Type',
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
              <option value="">Select...</option>
              <option value="MOTOR">Motor</option>
              <option value="HEATER">Heater</option>
              <option value="LIGHTING">Lighting</option>
              <option value="GENERAL">General</option>
              <option value="UPS">UPS</option>
              <option value="HVAC">HVAC</option>
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
      accessorKey: 'powerKw',
      header: 'Power (kW)',
      size: 100,
      cell: ({ getValue, row, column }) => {
        const value = getValue() as number;
        const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
        
        if (isEditing) {
          return (
            <input
              ref={inputRef}
              type="number"
              step="0.01"
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
            className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded text-right"
            onDoubleClick={() => handleStartEdit(row.index, column.id, value?.toString() || '')}
          >
            {value ? value.toFixed(2) : ''}
          </div>
        );
      },
    },
    {
      accessorKey: 'powerHp',
      header: 'Power (HP)',
      size: 100,
      cell: ({ getValue, row, column }) => {
        const value = getValue() as number;
        const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
        
        if (isEditing) {
          return (
            <input
              ref={inputRef}
              type="number"
              step="0.01"
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
            className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded text-right"
            onDoubleClick={() => handleStartEdit(row.index, column.id, value?.toString() || '')}
          >
            {value ? value.toFixed(2) : ''}
          </div>
        );
      },
    },
    {
      accessorKey: 'voltage',
      header: 'Voltage (V)',
      size: 100,
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
            className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded text-right"
            onDoubleClick={() => handleStartEdit(row.index, column.id, value?.toString() || '')}
          >
            {value || ''}
          </div>
        );
      },
    },
    {
      accessorKey: 'current',
      header: 'Current (A)',
      size: 100,
      cell: ({ getValue, row, column }) => {
        const value = getValue() as number;
        const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
        
        if (isEditing) {
          return (
            <input
              ref={inputRef}
              type="number"
              step="0.01"
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
            className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded text-right"
            onDoubleClick={() => handleStartEdit(row.index, column.id, value?.toString() || '')}
          >
            {value ? value.toFixed(2) : ''}
          </div>
        );
      },
    },
    {
      accessorKey: 'powerFactor',
      header: 'Power Factor',
      size: 100,
      cell: ({ getValue, row, column }) => {
        const value = getValue() as number;
        const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
        
        if (isEditing) {
          return (
            <input
              ref={inputRef}
              type="number"
              step="0.01"
              min="0"
              max="1"
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
            className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded text-right"
            onDoubleClick={() => handleStartEdit(row.index, column.id, value?.toString() || '')}
          >
            {value ? value.toFixed(2) : ''}
          </div>
        );
      },
    },
    {
      accessorKey: 'efficiency',
      header: 'Efficiency (%)',
      size: 100,
      cell: ({ getValue, row, column }) => {
        const value = getValue() as number;
        const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
        
        if (isEditing) {
          return (
            <input
              ref={inputRef}
              type="number"
              step="0.1"
              min="0"
              max="100"
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
            className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded text-right"
            onDoubleClick={() => handleStartEdit(row.index, column.id, value?.toString() || '')}
          >
            {value ? `${value.toFixed(1)}%` : ''}
          </div>
        );
      },
    },
    {
      accessorKey: 'demandFactor',
      header: 'Demand Factor',
      size: 120,
      cell: ({ getValue, row, column }) => {
        const value = getValue() as number;
        const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
        
        if (isEditing) {
          return (
            <input
              ref={inputRef}
              type="number"
              step="0.01"
              min="0"
              max="1"
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
            className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded text-right"
            onDoubleClick={() => handleStartEdit(row.index, column.id, value?.toString() || '')}
          >
            {value ? value.toFixed(2) : ''}
          </div>
        );
      },
    },
    {
      accessorKey: 'feederCable',
      header: 'Feeder Cable',
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
      id: 'validation',
      header: 'Status',
      size: 80,
      cell: ({ row }) => {
        const load = row.original;
        const validation = validationResults.find(v => v.entityId === load.id);
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
        const load = row.original;
        return (
          <KebabMenu
            items={[
              {
                icon: <Edit2 className="w-4 h-4" />,
                label: 'Edit',
                onClick: () => onLoadEdit?.(load)
              },
              {
                icon: <Trash2 className="w-4 h-4" />,
                label: 'Delete',
                onClick: () => load.id && onLoadDelete(load.id),
                variant: 'danger'
              }
            ]}
          />
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ], [editingCell, editValue, validationResults, onLoadEdit, onLoadDelete]);

  // Table selection hook
  const {
    selectedRows,
    selectedRange,
    isRangeSelecting,
    lastClickedRow,
    handleRowClick,
    handleRowMouseEnter,
    clearSelection,
    selectAll,
    getSelectedData
  } = useTableSelection({
    data: loads,
    onSelectionChange: (selectedIds) => {
      onSelectionChange(selectedIds);
    }
  });

  // Create table instance
  const table = useReactTable({
    data: loads,
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
        .map(key => loads[parseInt(key)]?.id)
        .filter(id => id !== undefined) as number[];
      
      onSelectionChange(selectedIds);
    },
    globalFilterFn: 'includesString',
    state: {
      globalFilter,
      rowSelection: selectedLoads.reduce((acc, id) => {
        const index = loads.findIndex(load => load.id === id);
        if (index !== -1) {
          acc[index] = true;
        }
        return acc;
      }, {} as Record<string, boolean>)
    }
  });

  // Editing functions
  const handleStartEdit = useCallback((rowIndex: number, columnId: string, currentValue: any) => {
    setEditingCell({ row: rowIndex, column: columnId });
    setEditValue(currentValue?.toString() || '');
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingCell) return;
    
    const load = loads[editingCell.row];
    if (!load?.id) return;
    
    const field = editingCell.column;
    const oldValue = (load as any)[field];
    let newValue: any = editValue;
    
    // Type conversion based on field
    if (['powerKw', 'powerHp', 'voltage', 'current', 'powerFactor', 'efficiency', 'demandFactor'].includes(field)) {
      newValue = editValue ? parseFloat(editValue) : null;
    }
    
    if (oldValue !== newValue) {
      // Record change for undo
      const action: UndoAction = {
        action: 'update',
        loadId: load.id,
        field,
        oldValue,
        newValue,
        timestamp: Date.now()
      };
      
      setUndoStack(prev => [...prev.slice(-49), action]);
      setRedoStack([]);
      
      // Track revision
      revisionService.trackChange('load', load.id, load.tag, 'update', field, oldValue, newValue);
      
      // Update the load
      onLoadUpdate(load.id, { [field]: newValue });
    }
    
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, loads, onLoadUpdate]);

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
    onLoadUpdate(action.loadId, { [action.field]: action.oldValue });
  }, [undoStack, onLoadUpdate]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    const action = redoStack[0];
    setRedoStack(prev => prev.slice(1));
    setUndoStack(prev => [...prev, action]);
    
    // Reapply the change
    onLoadUpdate(action.loadId, { [action.field]: action.newValue });
  }, [redoStack, onLoadUpdate]);

  // Keyboard shortcuts
  useKeyboardShortcuts(table, selectedRange, {
      onCopy: () => {
        if (selectedRange) {
          copyToClipboard(loads, selectedRange, table.getAllColumns());
        }
      },
      onPaste: async () => {
        if (selectedRange) {
          try {
            const clipboardData = await navigator.clipboard.readText();
            const updates = await parseClipboardData(clipboardData, loads, selectedRange, table.getAllColumns());
            
            updates.forEach(update => {
              if (update.id) {
                onLoadUpdate(update.id, update.changes);
              }
            });
          } catch (error) {
            console.error('Failed to paste:', error);
          }
        }
      },
      onDelete: () => {
        if (selectedRange) {
          clearContents(loads, selectedRange, table.getAllColumns(), (id, changes) => {
            onLoadUpdate(id, changes);
          });
        }
      },
      onFillDown: () => {
        if (selectedRange) {
          fillDown(loads, selectedRange, table.getAllColumns(), (id, changes) => {
            onLoadUpdate(id, changes);
          });
        }
      },
      onFillRight: () => {
        if (selectedRange) {
          fillRight(loads, selectedRange, table.getAllColumns(), (id, changes) => {
            onLoadUpdate(id, changes);
          });
        }
      },
      onStartEdit: (rowIndex, columnId) => {
        const load = loads[rowIndex];
        const currentValue = (load as any)[columnId];
        handleStartEdit(rowIndex, columnId, currentValue);
      },
      onUndo: handleUndo,
      onRedo: handleRedo
  });

  // Context menu functionality removed - can be added later if needed
  // const handleContextMenu = useCallback((e: React.MouseEvent, rowIndex?: number) => {
  //   e.preventDefault();
  //   // Context menu implementation would go here
  // }, []);

  const selectedCount = Object.keys(table.getState().rowSelection).length;
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Loads ({loads.length})</h2>
          {hasSelection && (
            <span className="text-sm text-gray-500">
              {selectedCount} selected
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {onAddLoad && (
            <button
              onClick={onAddLoad}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Load
            </button>
          )}
          {onAddFromLibrary && (
            <button
              onClick={onAddFromLibrary}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add from Library
            </button>
          )}
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
              .map(key => loads[parseInt(key)]?.id)
              .filter(id => id !== undefined) as number[];
            
            selectedIds.forEach(id => onLoadDelete(id));
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
          // onContextMenu={(e) => handleContextMenu(e)}
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
                  // onContextMenu={(e) => handleContextMenu(e, parseInt(row.id))}
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
              <Zap className="w-12 h-12 mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Loads</h3>
              <p className="text-sm text-center mb-4">
                Get started by adding your first electrical load.
              </p>
              {onAddLoad && (
                <button
                  onClick={onAddLoad}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Add Load
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadTable;