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
import { Cable, Tray, Conduit } from '../../types';
import { ValidationResult } from '../../types/validation';
import { validationService } from '../../services/validation-service';
import { revisionService } from '../../services/revision-service';
import { useTableSelection } from '../../hooks/useTableSelection';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { 
  copyToClipboard, 
  parseClipboardData,
  parseClipboardDataRaw,
  fillDown,
  fillRight,
  fillSeries,
  clearContents 
} from '../../utils/tanstack-helpers';
import TableContextMenu from './TableContextMenu';
import FilterBar from '../layout/FilterBar';
import CableTypeBadge from '../ui/CableTypeBadge';
import StatusIndicator from '../ui/StatusIndicator';
import ValidationIndicator from '../ui/ValidationIndicator';
import KebabMenu from '../ui/KebabMenu';
import BulkActionsBar from './BulkActionsBar';
import DuplicateCablesModal from '../modals/DuplicateCablesModal';
import ColumnManagerModal from '../modals/ColumnManagerModal';
import { useUI } from '../../contexts/UIContext';
import { Edit2, Trash2, ChevronDown, Calculator, TrendingUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { ColumnDefinition, columnService } from '../../services/column-service';
import { FilterCondition, filterService } from '../../services/filter-service';
import { calculationService } from '../../services/calculation-service';
import { TauriDatabaseService } from '../../services/tauri-database';
import '../../styles/tanstack-table.css';

interface CableTableProps {
  cables: Cable[];
  trays: Tray[];
  conduits: Conduit[];
  onCableUpdate: (id: number, updates: Partial<Cable>) => void;
  onCableDelete: (cableId: number) => void;
  onCableEdit?: (cable: Cable) => void;
  onBulkEdit: () => void;
  selectedCables: number[];
  onSelectionChange: (selectedIds: number[]) => void;
  onAddCable: (cableData: Partial<Cable>) => Promise<Cable>;
  onGetNextTag: () => Promise<string>;
  onDuplicate?: (cables: Cable[], count: number) => Promise<void>;
  // Filter props from parent
  searchTerm?: string;
  functionFilter?: string;
  voltageFilter?: string;
  fromFilter?: string;
  toFilter?: string;
  routeFilter?: string;
}

const CableTable: React.FC<CableTableProps> = ({
  cables,
  trays,
  conduits,
  onCableUpdate,
  onCableDelete,
  onCableEdit,
  onBulkEdit,
  selectedCables,
  onSelectionChange,
  onAddCable,
  onGetNextTag,
  onDuplicate,
  searchTerm = '',
  functionFilter = '',
  voltageFilter = '',
  fromFilter = '',
  toFilter = '',
  routeFilter = ''
}) => {
  const { showSuccess, showError } = useUI();
  const tableRef = useRef<HTMLTableElement>(null);
  
  // State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    visible: boolean;
  } | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [duplicatesModalOpen, setDuplicatesModalOpen] = useState(false);
  const [columnManagerOpen, setColumnManagerOpen] = useState(false);
  const [validationResults, setValidationResults] = useState<{[key: number]: ValidationResult[]}>({});
  const [bulkCalculationInProgress, setBulkCalculationInProgress] = useState(false);
  const [editingCell, setEditingCell] = useState<{row: number, column: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>({});
  const [columnSizingInfo, setColumnSizingInfo] = useState<any>({});
  const [undoStack, setUndoStack] = useState<Array<{
    action: 'update';
    cableId: number;
    field: string;
    oldValue: any;
    newValue: any;
    timestamp: number;
  }>>([]);
  const [redoStack, setRedoStack] = useState<Array<{
    action: 'update';
    cableId: number;
    field: string;
    oldValue: any;
    newValue: any;
    timestamp: number;
  }>>([]);

  // Table selection hook for range selection
  const {
    selectedRange,
    selectedCells,
    isSelecting,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearSelection,
    selectAll,
    isCellSelected,
    getCellRangeClass
  } = useTableSelection();

  // Filter cables based on props
  const filteredCables = useMemo(() => {
    return cables.filter(cable => {
      if (searchTerm && !Object.values(cable).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )) return false;
      
      if (functionFilter && cable.function !== functionFilter) return false;
      if (voltageFilter && cable.voltage?.toString() !== voltageFilter) return false;
      if (fromFilter && cable.fromLocation !== fromFilter) return false;
      if (toFilter && cable.toLocation !== toFilter) return false;
      
      // Route filter checks trays and conduits
      if (routeFilter) {
        const hasTrayRoute = cable.trayId && 
          trays.find(t => t.id === cable.trayId)?.tag?.includes(routeFilter);
        const hasConduitRoute = cable.conduitId && 
          conduits.find(c => c.id === cable.conduitId)?.tag?.includes(routeFilter);
        if (!hasTrayRoute && !hasConduitRoute) return false;
      }
      
      return true;
    });
  }, [cables, searchTerm, functionFilter, voltageFilter, fromFilter, toFilter, routeFilter, trays, conduits]);

  // Column definitions
  const columns = useMemo<ColumnDef<Cable>[]>(() => [
    // Selection column
    {
      id: 'selection',
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
      size: 50,
      enableSorting: false,
      enableColumnFilter: false
    },
    // Tag column
    {
      accessorKey: 'tag',
      header: 'Tag',
      cell: ({ getValue, row }) => (
        <span className="font-mono font-semibold text-blue-600">
          {getValue() as string}
        </span>
      ),
      size: 120
    },
    // Description column
    {
      accessorKey: 'description',
      header: 'Description',
      size: 200
    },
    // Voltage column
    {
      accessorKey: 'voltage',
      header: 'Voltage',
      cell: ({ getValue }) => {
        const voltage = getValue() as number;
        const formatVoltage = (v: number) => {
          if (v === 0) return '0V';
          if (v >= 10000) return `${(v / 1000).toFixed(1).replace('.0', '')}kV`;
          return `${v}V`;
        };
        return <span>{formatVoltage(voltage)}</span>;
      },
      size: 100
    },
    // Function column
    {
      accessorKey: 'function',
      header: 'Function',
      cell: ({ getValue }) => {
        const cableFunction = getValue() as string | undefined;
        if (!cableFunction) return null;
        const getIcon = (func: string) => {
          const icons: Record<string, string> = {
            'Power': '⚡',
            'Control': '🎛️',
            'Signal': '📊',
            'Communication': '📡',
            'Lighting': '💡',
            'Spare': '🔌'
          };
          return icons[func] || '🔌';
        };
        return (
          <span className="flex items-center gap-2">
            <span>{getIcon(cableFunction)}</span>
            {cableFunction}
          </span>
        );
      },
      size: 150
    },
    // Cable Type column
    {
      accessorKey: 'cableType',
      header: 'Cable Type',
      cell: ({ getValue }) => {
        const cableType = getValue() as string;
        return cableType ? <span className="text-sm">{cableType}</span> : null;
      },
      size: 120
    },
    // Size column
    {
      accessorKey: 'size',
      header: 'Size',
      size: 100
    },
    // Cores column
    {
      accessorKey: 'cores',
      header: 'Cores',
      size: 80
    },
    // From Location column
    {
      accessorKey: 'fromLocation',
      header: 'From',
      size: 150
    },
    // To Location column
    {
      accessorKey: 'toLocation',
      header: 'To',
      size: 150
    },
    // Length column
    {
      accessorKey: 'length',
      header: 'Length (ft)',
      cell: ({ getValue }) => {
        const length = getValue() as number;
        return <span>{length?.toFixed(1) || ''}</span>;
      },
      size: 100
    },
    // Validation column
    {
      id: 'validation',
      header: 'Status',
      cell: ({ row }) => {
        const validationList = validationResults[row.original.id!];
        if (!validationList || validationList.length === 0) return null;
        
        // Show the highest severity issue
        const hasError = validationList.some(v => v.severity === 'Error');
        const hasWarning = validationList.some(v => v.severity === 'Warning');
        
        const status = hasError ? 'error' : hasWarning ? 'warning' : 'valid';
        return (
          <ValidationIndicator 
            status={status as any}
          />
        );
      },
      size: 80,
      enableSorting: false
    },
    // Actions column
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCableEdit?.(row.original)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit cable"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onCableDelete(row.original.id!)}
            className="text-red-600 hover:text-red-800"
            title="Delete cable"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      size: 100,
      enableSorting: false,
      enableColumnFilter: false
    }
  ], [onCableEdit, onCableDelete, validationResults]);

  // Create table instance
  const table = useReactTable({
    data: filteredCables,
    columns,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    onColumnSizingInfoChange: setColumnSizingInfo,
    state: {
      rowSelection,
      columnSizing,
      columnSizingInfo
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id?.toString() || row.tag || Math.random().toString()
  });

  // Get column keys for selection operations
  const columnKeys = useMemo(() => 
    columns.filter(col => 'accessorKey' in col && col.accessorKey).map(col => (col as any).accessorKey as string),
    [columns]
  );

  // Update parent selection when row selection changes
  useEffect(() => {
    const selectedIds = Object.keys(rowSelection)
      .filter(id => rowSelection[id])
      .map(id => parseInt(id))
      .filter(id => !isNaN(id));
    onSelectionChange(selectedIds);
  }, [rowSelection, onSelectionChange]);

  // Validate cables when they change
  useEffect(() => {
    const validateCables = async () => {
      const results: {[key: number]: ValidationResult[]} = {};
      for (const cable of filteredCables) {
        if (cable.id) {
          results[cable.id] = await validationService.validateCable(cable.id);
        }
      }
      setValidationResults(results);
    };

    if (filteredCables.length > 0) {
      validateCables();
    }
  }, [filteredCables]);

  // Cell update function
  const updateCell = useCallback((rowIndex: number, columnKey: string, value: any, skipUndo = false) => {
    const cable = filteredCables[rowIndex];
    if (cable && cable.id) {
      const oldValue = cable[columnKey as keyof Cable];
      
      // Record in undo stack (unless this is part of an undo/redo operation)
      if (!skipUndo && oldValue !== value) {
        const operation = {
          action: 'update' as const,
          cableId: cable.id,
          field: columnKey,
          oldValue,
          newValue: value,
          timestamp: Date.now()
        };
        
        setUndoStack(prev => [...prev, operation].slice(-50)); // Keep last 50 operations
        setRedoStack([]); // Clear redo stack when new action is performed
      }
      
      onCableUpdate(cable.id, { [columnKey]: value });
      
      // Record revision
      revisionService.trackChange('cable', cable.id, cable.tag, 'update', columnKey, oldValue, value);
      
      // Show success message
      if (!skipUndo) {
        showSuccess(`Updated ${columnKey} for cable ${cable.tag}`);
      }
    }
  }, [filteredCables, onCableUpdate, showSuccess]);

  // Clipboard operations
  const handleCopy = useCallback(async () => {
    if (!selectedRange) return;
    
    try {
      await copyToClipboard(filteredCables, selectedRange, columnKeys);
      showSuccess('Copied to clipboard');
    } catch (error) {
      console.error('Copy failed:', error);
      showError('Failed to copy selection');
    }
  }, [selectedRange, filteredCables, columnKeys, showSuccess, showError]);

  const handlePaste = useCallback(async () => {
    if (!selectedRange) return;
    
    try {
      const clipboardData = await parseClipboardDataRaw();
      const { start } = selectedRange;
      
      clipboardData.forEach((row, rowOffset) => {
        const targetRowIndex = start.row + rowOffset;
        if (targetRowIndex >= filteredCables.length) return;
        
        row.forEach((cellValue, colOffset) => {
          const sourceColIndex = columnKeys.indexOf(start.column);
          const targetColIndex = sourceColIndex + colOffset;
          if (targetColIndex >= columnKeys.length) return;
          
          const targetColumnKey = columnKeys[targetColIndex];
          updateCell(targetRowIndex, targetColumnKey, cellValue);
        });
      });
      
      showSuccess('Pasted successfully');
    } catch (error) {
      console.error('Paste failed:', error);
      showError('Failed to paste data');
    }
  }, [selectedRange, filteredCables, columnKeys, updateCell, showSuccess, showError]);

  // Fill operations
  const handleFillDown = useCallback(() => {
    if (!selectedRange) return;
    fillDown(filteredCables, selectedRange, columnKeys, (id, changes) => {
      const rowIndex = filteredCables.findIndex(cable => cable.id === id);
      if (rowIndex !== -1) {
        Object.entries(changes).forEach(([key, value]) => {
          updateCell(rowIndex, key, value);
        });
      }
    });
    showSuccess('Filled down successfully');
  }, [selectedRange, filteredCables, columnKeys, updateCell, showSuccess]);

  const handleFillRight = useCallback(() => {
    if (!selectedRange) return;
    fillRight(filteredCables, selectedRange, columnKeys, (id, changes) => {
      const rowIndex = filteredCables.findIndex(cable => cable.id === id);
      if (rowIndex !== -1) {
        Object.entries(changes).forEach(([key, value]) => {
          updateCell(rowIndex, key, value);
        });
      }
    });
    showSuccess('Filled right successfully');
  }, [selectedRange, filteredCables, columnKeys, updateCell, showSuccess]);

  const handleFillSeries = useCallback(() => {
    if (!selectedRange) return;
    fillSeries(filteredCables, selectedRange, columnKeys, (id, changes) => {
      const rowIndex = filteredCables.findIndex(cable => cable.id === id);
      if (rowIndex !== -1) {
        Object.entries(changes).forEach(([key, value]) => {
          updateCell(rowIndex, key, value);
        });
      }
    });
    showSuccess('Filled series successfully');
  }, [selectedRange, filteredCables, columnKeys, updateCell, showSuccess]);

  const handleClearContents = useCallback(() => {
    if (!selectedRange) return;
    clearContents(filteredCables, selectedRange, columnKeys, (id, changes) => {
      const rowIndex = filteredCables.findIndex(cable => cable.id === id);
      if (rowIndex !== -1) {
        Object.entries(changes).forEach(([key, value]) => {
          updateCell(rowIndex, key, value);
        });
      }
    });
    showSuccess('Cleared contents');
  }, [selectedRange, filteredCables, columnKeys, updateCell, showSuccess]);

  const handleSelectAll = useCallback(() => {
    selectAll();
  }, [selectAll]);

  // Cell editing handlers
  const startEditing = useCallback((rowIndex: number, columnKey: string) => {
    const cable = filteredCables[rowIndex];
    if (cable && columnKey in cable) {
      const currentValue = cable[columnKey as keyof Cable];
      setEditingCell({ row: rowIndex, column: columnKey });
      setEditValue(String(currentValue || ''));
    }
  }, [filteredCables]);

  const saveEdit = useCallback(() => {
    if (editingCell) {
      updateCell(editingCell.row, editingCell.column, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  }, [editingCell, editValue, updateCell]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const handleCellDoubleClick = useCallback((rowIndex: number, columnKey: string) => {
    startEditing(rowIndex, columnKey);
  }, [startEditing]);

  // Undo/Redo functions
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;

    const lastOperation = undoStack[undoStack.length - 1];
    const cable = filteredCables.find(c => c.id === lastOperation.cableId);
    
    if (cable) {
      const rowIndex = filteredCables.indexOf(cable);
      if (rowIndex >= 0) {
        // Perform the undo by restoring old value
        updateCell(rowIndex, lastOperation.field, lastOperation.oldValue, true);
        
        // Move operation from undo stack to redo stack
        setUndoStack(prev => prev.slice(0, -1));
        setRedoStack(prev => [...prev, lastOperation]);
        
        showSuccess('Undid last action');
      }
    }
  }, [undoStack, filteredCables, updateCell, showSuccess]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;

    const lastUndoneOperation = redoStack[redoStack.length - 1];
    const cable = filteredCables.find(c => c.id === lastUndoneOperation.cableId);
    
    if (cable) {
      const rowIndex = filteredCables.indexOf(cable);
      if (rowIndex >= 0) {
        // Perform the redo by applying new value
        updateCell(rowIndex, lastUndoneOperation.field, lastUndoneOperation.newValue, true);
        
        // Move operation from redo stack back to undo stack
        setRedoStack(prev => prev.slice(0, -1));
        setUndoStack(prev => [...prev, lastUndoneOperation]);
        
        showSuccess('Redid last action');
      }
    }
  }, [redoStack, filteredCables, updateCell, showSuccess]);

  // Context menu handlers
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      visible: true
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Bulk operations
  const handleBulkCalculation = useCallback(async () => {
    if (selectedCables.length === 0) {
      showError('Please select cables first');
      return;
    }

    setBulkCalculationInProgress(true);
    try {
      const results = await calculationService.batchUpdateVoltageDrops(selectedCables);
      
      // results is a Map<number, number | null>, where key is cable ID and value is voltage drop %
      const successCount = Array.from(results.values()).filter(v => v !== null).length;
      
      showSuccess(`Updated voltage drop calculations for ${successCount} cables`);
    } catch (error) {
      showError('Bulk calculation failed');
    } finally {
      setBulkCalculationInProgress(false);
    }
  }, [selectedCables, onCableUpdate, showSuccess, showError]);

  // Keyboard shortcuts
  useKeyboardShortcuts(table, selectedRange, {
    onCopy: handleCopy,
    onPaste: handlePaste,
    onFillDown: handleFillDown,
    onFillRight: handleFillRight,
    onClearContents: handleClearContents,
    onSelectAll: handleSelectAll,
    onStartEdit: (rowIndex: number, columnKey: string) => {
      startEditing(rowIndex, columnKey);
    },
    onSaveEdit: saveEdit,
    onCancelEdit: cancelEdit,
    onUndo: handleUndo,
    onRedo: handleRedo
  });

  // Mouse event handlers for range selection
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

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={() => {}} // These are controlled by parent
        selectedFunction={functionFilter}
        onFunctionChange={() => {}}
        selectedVoltage={voltageFilter}
        onVoltageChange={() => {}}
        selectedFrom={fromFilter}
        onFromChange={() => {}}
        selectedTo={toFilter}
        onToChange={() => {}}
        selectedRoute={routeFilter}
        onRouteChange={() => {}}
        onClearFilters={() => {}}
      />

      {/* Bulk Actions Bar */}
      {selectedCables.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedCables.length}
          onBulkEdit={onBulkEdit}
          onBulkCalculation={handleBulkCalculation}
          calculationInProgress={bulkCalculationInProgress}
          onDuplicateCheck={() => setDuplicatesModalOpen(true)}
        />
      )}

      {/* Table container */}
      <div className="flex-1 overflow-auto">
        <div className="tanstack-table-container">
          <table
            ref={tableRef}
            className="tanstack-table"
            onContextMenu={handleContextMenu}
          >
            {/* Header */}
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      style={{
                        width: header.getSize(),
                        position: 'relative'
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      
                      {/* Resize handle */}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={`resize-handle ${header.column.getIsResizing() ? 'isResizing' : ''}`}
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            height: '100%',
                            width: '5px',
                            background: header.column.getIsResizing() ? '#2196f3' : 'transparent',
                            cursor: 'col-resize',
                            userSelect: 'none',
                            touchAction: 'none',
                          }}
                        />
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            {/* Body */}
            <tbody>
              {table.getRowModel().rows.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  className={`${
                    row.getIsSelected() ? 'row-selected' : ''
                  }`}
                >
                  {row.getVisibleCells().map(cell => {
                    const columnKey = ('accessorKey' in cell.column.columnDef) ? (cell.column.columnDef as any).accessorKey as string : undefined;
                    const isSelected = columnKey && isCellSelected(rowIndex, columnKey);
                    const rangeClass = columnKey ? getCellRangeClass(rowIndex, columnKey) : '';
                    const isEditing = editingCell?.row === rowIndex && editingCell?.column === columnKey;
                    const isEditable = columnKey && ['tag', 'description', 'voltage', 'size', 'cores', 'fromLocation', 'toLocation', 'length'].includes(columnKey);
                    
                    return (
                      <td
                        key={cell.id}
                        className={`${
                          isSelected ? 'cell-selected' : ''
                        } ${rangeClass} ${isEditing ? 'editing' : ''}`}
                        onMouseDown={(e) => columnKey && handleCellMouseDown(e, rowIndex, columnKey)}
                        onMouseMove={(e) => columnKey && handleCellMouseMove(e, rowIndex, columnKey)}
                        onDoubleClick={() => isEditable && columnKey && handleCellDoubleClick(rowIndex, columnKey)}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                saveEdit();
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                cancelEdit();
                              }
                            }}
                            className="w-full border-none outline-none bg-transparent"
                            autoFocus
                          />
                        ) : (
                          flexRender(cell.column.columnDef.cell, cell.getContext())
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <TableContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onFillDown={handleFillDown}
          onFillRight={handleFillRight}
          onFillSeries={handleFillSeries}
          onClearContents={handleClearContents}
          hasSelection={!!selectedRange}
          canPaste={true}
        />
      )}

      {/* Modals */}
      {duplicatesModalOpen && onDuplicate && (
        <DuplicateCablesModal
          isOpen={duplicatesModalOpen}
          onClose={() => setDuplicatesModalOpen(false)}
          selectedCables={filteredCables.filter(c => c.id && selectedCables.includes(c.id))}
          allCables={cables}
          onDuplicate={onDuplicate}
        />
      )}
    </div>
  );
};

export default CableTable;