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
import { Conduit, ConduitType, ConduitMaterial } from '../../types';
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

interface ConduitTableProps {
  conduits: Conduit[];
  onConduitUpdate: (id: number, updates: Partial<Conduit>) => void;
  onConduitDelete: (conduitId: number) => void;
  onConduitEdit?: (conduit: Conduit) => void;
  onAddConduit?: () => void;
  onAddFromLibrary?: () => void;
  onBulkEdit: () => void;
  selectedConduits: number[];
  onSelectionChange: (selectedIds: number[]) => void;
}

interface EditingCell {
  row: number;
  column: string;
}

interface UndoAction {
  action: 'update';
  conduitId: number;
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

const ConduitTable: React.FC<ConduitTableProps> = ({
  conduits,
  onConduitUpdate,
  onConduitDelete,
  onConduitEdit,
  onAddConduit,
  onAddFromLibrary,
  onBulkEdit,
  selectedConduits,
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

  // Validate conduits
  useEffect(() => {
    const validateConduits = async () => {
      const results = await validationService.validateConduits(conduits);
      setValidationResults(results);
    };
    validateConduits();
  }, [conduits]);

  // Define columns
  const columns: ColumnDef<Conduit>[] = useMemo(() => [
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
      accessorKey: 'type',
      header: 'Type',
      size: 120,
      cell: ({ getValue, row, column }) => {
        const value = getValue() as ConduitType;
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
              <option value="RIGID_STEEL">Rigid Steel</option>
              <option value="RIGID_ALUMINUM">Rigid Aluminum</option>
              <option value="EMT">EMT</option>
              <option value="PVC">PVC</option>
              <option value="FLEXIBLE">Flexible</option>
              <option value="LIQUID_TIGHT">Liquid Tight</option>
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
      accessorKey: 'tradeSize',
      header: 'Trade Size',
      size: 100,
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
              <option value="1/2">1/2"</option>
              <option value="3/4">3/4"</option>
              <option value="1">1"</option>
              <option value="1-1/4">1-1/4"</option>
              <option value="1-1/2">1-1/2"</option>
              <option value="2">2"</option>
              <option value="2-1/2">2-1/2"</option>
              <option value="3">3"</option>
              <option value="3-1/2">3-1/2"</option>
              <option value="4">4"</option>
              <option value="5">5"</option>
              <option value="6">6"</option>
            </select>
          );
        }
        
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
            onDoubleClick={() => handleStartEdit(row.index, column.id, value)}
          >
            {value ? `${value}"` : ''}
          </div>
        );
      },
    },
    {
      accessorKey: 'length',
      header: 'Length (m)',
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
            {value ? value.toFixed(1) : ''}
          </div>
        );
      },
    },
    {
      accessorKey: 'fillPercentage',
      header: 'Fill %',
      size: 80,
      cell: ({ getValue, row, column }) => {
        const value = getValue() as number;
        const maxFill = row.original.maxFillPercentage || 40; // NEC standard for conduit
        const isOverfilled = value > maxFill;
        const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
        
        if (isEditing) {
          return (
            <input
              ref={inputRef}
              type="number"
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
            className={`cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded text-right ${
              isOverfilled ? 'text-red-600 font-medium' : ''
            }`}
            onDoubleClick={() => handleStartEdit(row.index, column.id, value?.toString() || '')}
          >
            {value ? `${value.toFixed(1)}%` : ''}
          </div>
        );
      },
    },
    {
      accessorKey: 'maxFillPercentage',
      header: 'Max Fill %',
      size: 100,
      cell: ({ getValue, row, column }) => {
        const value = getValue() as number;
        const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
        
        if (isEditing) {
          return (
            <input
              ref={inputRef}
              type="number"
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
            {value ? `${value.toFixed(1)}%` : '40.0%'}
          </div>
        );
      },
    },
    {
      accessorKey: 'material',
      header: 'Material',
      size: 120,
      cell: ({ getValue, row, column }) => {
        const value = getValue() as ConduitMaterial;
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
              <option value="STEEL">Steel</option>
              <option value="ALUMINUM">Aluminum</option>
              <option value="PVC">PVC</option>
              <option value="STAINLESS_STEEL">Stainless Steel</option>
              <option value="FIBERGLASS">Fiberglass</option>
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
      accessorKey: 'fromLocation',
      header: 'From',
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
      accessorKey: 'toLocation',
      header: 'To',
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
      accessorKey: 'installationType',
      header: 'Installation',
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
              <option value="SURFACE">Surface</option>
              <option value="EMBEDDED">Embedded</option>
              <option value="UNDERGROUND">Underground</option>
              <option value="AERIAL">Aerial</option>
            </select>
          );
        }
        
        return (
          <div
            className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
            onDoubleClick={() => handleStartEdit(row.index, column.id, value || '')}
          >
            {value ? value.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : ''}
          </div>
        );
      },
    },
    {
      id: 'validation',
      header: 'Status',
      size: 80,
      cell: ({ row }) => {
        const conduit = row.original;
        const validation = validationResults.find(v => v.entityId === conduit.id);
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
        const conduit = row.original;
        return (
          <KebabMenu
            items={[
              {
                icon: <Edit2 className="w-4 h-4" />,
                label: 'Edit',
                onClick: () => onConduitEdit?.(conduit)
              },
              {
                icon: <Trash2 className="w-4 h-4" />,
                label: 'Delete',
                onClick: () => conduit.id && onConduitDelete(conduit.id),
                variant: 'danger'
              }
            ]}
          />
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ], [editingCell, editValue, validationResults, onConduitEdit, onConduitDelete]);

  // Create table instance
  const table = useReactTable({
    data: conduits,
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
        .map(key => conduits[parseInt(key)]?.id)
        .filter(id => id !== undefined) as number[];
      
      onSelectionChange(selectedIds);
    },
    globalFilterFn: 'includesString',
    state: {
      globalFilter,
      rowSelection: selectedConduits.reduce((acc, id) => {
        const index = conduits.findIndex(conduit => conduit.id === id);
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
    data: conduits,
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
    
    const conduit = conduits[editingCell.row];
    if (!conduit?.id) return;
    
    const field = editingCell.column;
    const oldValue = (conduit as any)[field];
    let newValue: any = editValue;
    
    // Type conversion based on field
    if (['length', 'fillPercentage', 'maxFillPercentage'].includes(field)) {
      newValue = editValue ? parseFloat(editValue) : null;
    }
    
    if (oldValue !== newValue) {
      // Record change for undo
      const action: UndoAction = {
        action: 'update',
        conduitId: conduit.id,
        field,
        oldValue,
        newValue,
        timestamp: Date.now()
      };
      
      setUndoStack(prev => [...prev.slice(-49), action]);
      setRedoStack([]);
      
      // Track revision
      revisionService.trackChange('conduit', conduit.id, conduit.tag, 'update', field, oldValue, newValue);
      
      // Update the conduit
      onConduitUpdate(conduit.id, { [field]: newValue });
    }
    
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, conduits, onConduitUpdate]);

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
    onConduitUpdate(action.conduitId, { [action.field]: action.oldValue });
  }, [undoStack, onConduitUpdate]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    const action = redoStack[0];
    setRedoStack(prev => prev.slice(1));
    setUndoStack(prev => [...prev, action]);
    
    // Reapply the change
    onConduitUpdate(action.conduitId, { [action.field]: action.newValue });
  }, [redoStack, onConduitUpdate]);

  // Keyboard shortcuts
  useKeyboardShortcuts(table, selectedRange, {
      onCopy: () => {
        if (selectedRange) {
          copyToClipboard(conduits, selectedRange, table.getAllColumns());
        }
      },
      onPaste: async () => {
        if (selectedRange) {
          try {
            const clipboardData = await navigator.clipboard.readText();
            const updates = await parseClipboardData(clipboardData, conduits, selectedRange, table.getAllColumns());
            
            updates.forEach(update => {
              if (update.id) {
                onConduitUpdate(update.id, update.changes);
              }
            });
          } catch (error) {
            console.error('Failed to paste:', error);
          }
        }
      },
      onDelete: () => {
        if (selectedRange) {
          clearContents(conduits, selectedRange, table.getAllColumns(), (id, changes) => {
            onConduitUpdate(id, changes);
          });
        }
      },
      onFillDown: () => {
        if (selectedRange) {
          fillDown(conduits, selectedRange, table.getAllColumns(), (id, changes) => {
            onConduitUpdate(id, changes);
          });
        }
      },
      onFillRight: () => {
        if (selectedRange) {
          fillRight(conduits, selectedRange, table.getAllColumns(), (id, changes) => {
            onConduitUpdate(id, changes);
          });
        }
      },
      onStartEdit: (rowIndex, columnId) => {
        const conduit = conduits[rowIndex];
        const currentValue = (conduit as any)[columnId];
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

  // Context menu
  const handleContextMenu = useCallback((e: React.MouseEvent, rowIndex?: number) => {
    e.preventDefault();
    
    const menuItems = [
      {
        label: 'Copy',
        action: () => {
          if (selectedRange) {
            copyToClipboard(conduits, selectedRange, table.getAllColumns());
          }
        },
        disabled: !selectedRange
      },
      {
        label: 'Paste',
        action: async () => {
          if (selectedRange) {
            try {
              const clipboardData = await navigator.clipboard.readText();
              const updates = await parseClipboardData(clipboardData, conduits, selectedRange, table.getAllColumns());
              
              updates.forEach(update => {
                if (update.id) {
                  onConduitUpdate(update.id, update.changes);
                }
              });
            } catch (error) {
              console.error('Failed to paste:', error);
            }
          }
        },
        disabled: !selectedRange
      },
      { type: 'separator' },
      {
        label: 'Fill Down',
        action: () => {
          if (selectedRange) {
            fillDown(conduits, selectedRange, table.getAllColumns(), (id, changes) => {
              onConduitUpdate(id, changes);
            });
          }
        },
        disabled: !selectedRange
      },
      {
        label: 'Fill Right',
        action: () => {
          if (selectedRange) {
            fillRight(conduits, selectedRange, table.getAllColumns(), (id, changes) => {
              onConduitUpdate(id, changes);
            });
          }
        },
        disabled: !selectedRange
      },
      { type: 'separator' },
      {
        label: 'Add Conduit',
        action: onAddConduit
      }
    ];
    
    if (onAddFromLibrary) {
      menuItems.push({
        label: 'Add from Library',
        action: onAddFromLibrary
      });
    }
    
    if (rowIndex !== undefined) {
      const conduit = conduits[rowIndex];
      menuItems.push(
        { type: 'separator' },
        {
          label: 'Edit Conduit',
          action: () => onConduitEdit?.(conduit)
        },
        {
          label: 'Delete Conduit',
          action: () => conduit.id && onConduitDelete(conduit.id)
        }
      );
    }
    
    // Context menu functionality removed - can be added later if needed
    console.log('Context menu requested with items:', menuItems);
  }, [selectedRange, conduits, table, onConduitUpdate, onAddConduit, onAddFromLibrary, onConduitEdit, onConduitDelete]);

  const selectedCount = Object.keys(table.getState().rowSelection).length;
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Conduits ({conduits.length})</h2>
          {hasSelection && (
            <span className="text-sm text-gray-500">
              {selectedCount} selected
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {onAddConduit && (
            <button
              onClick={onAddConduit}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Conduit
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
              .map(key => conduits[parseInt(key)]?.id)
              .filter(id => id !== undefined) as number[];
            
            selectedIds.forEach(id => onConduitDelete(id));
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
                  // onContextMenu={(e) => handleContextMenu(e, parseInt(row.id)))
                >
                  {row.getVisibleCells().map(cell => {
                    const rowIndex = parseInt(row.id);
                    const columnKey = ('accessorKey' in cell.column.columnDef) ? (cell.column.columnDef as any).accessorKey as string : undefined;
                    const isSelected = columnKey && isCellSelected(rowIndex, columnKey);
                    const rangeClass = columnKey ? getCellRangeClass(rowIndex, columnKey) : '';
                    
                    return (
                      <td 
                        key={cell.id}
                        className={`relative ${rangeClass} ${isSelected ? 'bg-blue-100' : ''}`}
                        onMouseDown={(e) => columnKey && handleCellMouseDown(e, rowIndex, columnKey)}
                        onMouseMove={(e) => columnKey && handleCellMouseMove(e, rowIndex, columnKey)}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          
          {table.getRowModel().rows.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Zap className="w-12 h-12 mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Conduits</h3>
              <p className="text-sm text-center mb-4">
                Get started by adding your first conduit run.
              </p>
              {onAddConduit && (
                <button
                  onClick={onAddConduit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Add Conduit
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConduitTable;