import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, CellValueChangedEvent, SelectionChangedEvent } from 'ag-grid-community';
import { Tray, TrayType, TrayMaterial } from '../../types';
import { revisionService } from '../../services/revision-service';
import { fillCalculationService } from '../../services/fill-calculation-service';
import KebabMenu from '../ui/KebabMenu';
import BulkActionsBar from './BulkActionsBar';
import { useUI } from '../../contexts/UIContext';
import { Edit2, ClipboardList, Trash2 } from 'lucide-react';

interface TrayTableProps {
  trays: Tray[];
  onTrayUpdate: (id: number, updates: Partial<Tray>) => void;
  onTrayDelete: (trayId: number) => void;
  onTrayEdit?: (tray: Tray) => void;
  onAddTray: () => void;
  onAddFromLibrary: () => void;
  onBulkEdit: () => void;
  selectedTrays: number[];
  onSelectionChange: (selectedIds: number[]) => void;
}

const TrayTable: React.FC<TrayTableProps> = ({
  trays,
  onTrayUpdate,
  onTrayDelete,
  onTrayEdit,
  onAddTray,
  onAddFromLibrary,
  onBulkEdit,
  selectedTrays,
  onSelectionChange,
}) => {
  const { showConfirm, showSuccess, showError } = useUI();
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTrays, setFilteredTrays] = useState<Tray[]>([]);
  const [filters, setFilters] = useState({
    trayType: '',
    material: '',
    fillRange: '',
    location: ''
  });
  
  // Refs for keyboard navigation
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [gridApi, setGridApi] = useState<any>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Filter trays based on search term and filters
  useEffect(() => {
    let filtered = [...trays];
    
    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(tray => {
        return (
          tray.tag?.toLowerCase().includes(searchLower) ||
          tray.type?.toLowerCase().includes(searchLower) ||
          tray.material?.toLowerCase().includes(searchLower) ||
          tray.fromLocation?.toLowerCase().includes(searchLower) ||
          tray.toLocation?.toLowerCase().includes(searchLower) ||
          tray.notes?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply tray type filter
    if (filters.trayType) {
      filtered = filtered.filter(tray => tray.type === filters.trayType);
    }

    // Apply material filter
    if (filters.material) {
      filtered = filtered.filter(tray => tray.material === filters.material);
    }

    // Apply fill percentage range filter
    if (filters.fillRange) {
      filtered = filtered.filter(tray => {
        const fill = tray.fillPercentage;
        switch (filters.fillRange) {
          case 'low': return fill < 30;
          case 'medium': return fill >= 30 && fill < 60;
          case 'high': return fill >= 60;
          case 'overfilled': return fill > tray.maxFillPercentage;
          default: return true;
        }
      });
    }

    // Apply location filter
    if (filters.location) {
      filtered = filtered.filter(tray => 
        tray.fromLocation?.toLowerCase().includes(filters.location.toLowerCase()) ||
        tray.toLocation?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    setFilteredTrays(filtered);
  }, [trays, searchTerm, filters]);

  // Fill percentage renderer with color coding
  const fillPercentageRenderer = useCallback(({ value, data }: { value: number, data: Tray }) => {
    const fillPercentage = value || 0;
    const maxFill = data.maxFillPercentage || 50;
    const isOverfilled = fillPercentage > maxFill;
    const isApproachingLimit = fillPercentage > maxFill * 0.75 && fillPercentage <= maxFill;
    
    let colorClass = 'bg-green-100 text-green-800';
    let bgColor = 'bg-green-500';
    
    if (fillPercentage > maxFill) {
      colorClass = 'bg-red-100 text-red-800';
      bgColor = 'bg-red-500';
    } else if (fillPercentage > maxFill * 0.8) {
      colorClass = 'bg-yellow-100 text-yellow-800';
      bgColor = 'bg-yellow-500';
    }

    const fillStatus = fillCalculationService.getTrayFillStatus(data);

    return (
      <div 
        className="flex items-center gap-2"
        title={fillStatus.message}
      >
        <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${bgColor}`}
            style={{ width: `${Math.min(fillPercentage, 100)}%` }}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
            {fillPercentage.toFixed(1)}%
          </span>
          {isOverfilled && (
            <span className="text-red-500 text-xs" title="Exceeds tray limit">⚠</span>
          )}
          {isApproachingLimit && (
            <span className="text-yellow-500 text-xs" title="Approaching fill limit">⚡</span>
          )}
        </div>
      </div>
    );
  }, []);

  // Dimensions renderer (W×H×L format)
  const dimensionsRenderer = useCallback(({ data }: { data: Tray }) => {
    const { width, height, length } = data;
    if (!width && !height && !length) return '—';
    
    const w = width ? `${width}` : '—';
    const h = height ? `${height}` : '—';
    const l = length ? `${length}` : '—';
    
    return (
      <div className="text-sm">
        <div>{w} × {h} × {l}</div>
        <div className="text-xs text-gray-500">W × H × L (mm)</div>
      </div>
    );
  }, []);

  // Actions cell renderer
  const actionsCellRenderer = useCallback(({ data }: { data: Tray }) => {
    const menuItems = [
      {
        label: 'Edit Tray',
        onClick: () => onTrayEdit?.(data),
        icon: <Edit2 className="h-4 w-4" />
      },
      {
        label: 'Duplicate',
        onClick: () => {
          // TODO: Implement duplicate functionality
          console.log('Duplicate tray:', data);
        },
        icon: <ClipboardList className="h-4 w-4" />
      },
      {
        label: 'Recalculate Fill',
        onClick: () => handleRecalculateFill(data)
      },
      {
        label: 'Delete',
        onClick: () => handleDelete(data.id!),
        icon: <Trash2 className="h-4 w-4" />,
        variant: 'danger' as const
      }
    ];

    return (
      <div className="flex items-center justify-center">
        <KebabMenu items={menuItems} />
      </div>
    );
  }, [onTrayEdit, handleRecalculateFill]);

  // Handle delete with confirmation
  const handleDelete = useCallback(async (id: number) => {
    const tray = trays.find(t => t.id === id);
    if (!tray) return;

    const confirmed = await showConfirm({
      title: 'Delete Tray',
      message: `Are you sure you want to delete tray "${tray.tag}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      try {
        await onTrayDelete(id);
        showSuccess(`Tray ${tray.tag} deleted successfully`);
      } catch (error) {
        showError(`Failed to delete tray: ${error}`);
      }
    }
  }, [trays, onTrayDelete, showConfirm, showSuccess, showError]);

  // Handle fill recalculation for a specific tray
  const handleRecalculateFill = useCallback(async (tray: Tray) => {
    if (!tray.id) return;

    try {
      const fillPercentage = await fillCalculationService.recalculateTrayFill(tray.id);
      
      // Update the tray with new fill percentage
      onTrayUpdate(tray.id, { fillPercentage });
      
      showSuccess(`Fill recalculated for tray ${tray.tag}: ${fillPercentage.toFixed(1)}%`);
    } catch (error) {
      showError(`Failed to recalculate fill for tray ${tray.tag}: ${error}`);
    }
  }, [onTrayUpdate, showSuccess, showError]);

  // Handle batch fill recalculation for all trays
  const handleRecalculateAllFills = useCallback(async () => {
    try {
      showSuccess('Starting fill recalculation for all trays...');
      
      await fillCalculationService.recalculateAllFills();
      
      // Refresh the trays data from the parent
      // In a real implementation, this would trigger a data refresh from the parent component
      showSuccess('Fill calculations completed for all conduits and trays!');
    } catch (error) {
      showError(`Failed to recalculate fills: ${error}`);
    }
  }, [showSuccess, showError]);

  // Column definitions
  const columnDefinitions: ColDef[] = useMemo(() => [
    {
      headerName: '',
      field: 'selected',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 50,
      pinned: 'left',
      lockPinned: true,
      suppressMovable: true,
      suppressResize: true
    },
    {
      headerName: 'Tag',
      field: 'tag',
      width: 120,
      pinned: 'left',
      editable: true,
      cellStyle: { fontWeight: '600' }
    },
    {
      headerName: 'Type',
      field: 'type',
      width: 130,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: Object.values(TrayType)
      }
    },
    {
      headerName: 'Dimensions',
      field: 'dimensions',
      width: 150,
      cellRenderer: dimensionsRenderer,
      sortable: false
    },
    {
      headerName: 'Width (mm)',
      field: 'width',
      width: 110,
      editable: true,
      type: 'numericColumn',
      valueFormatter: ({ value }) => value ? `${value}` : '—'
    },
    {
      headerName: 'Height (mm)',
      field: 'height',
      width: 110,
      editable: true,
      type: 'numericColumn',
      valueFormatter: ({ value }) => value ? `${value}` : '—'
    },
    {
      headerName: 'Length (m)',
      field: 'length',
      width: 110,
      editable: true,
      type: 'numericColumn',
      valueFormatter: ({ value }) => value ? `${value}` : '—'
    },
    {
      headerName: 'Material',
      field: 'material',
      width: 120,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: Object.values(TrayMaterial)
      }
    },
    {
      headerName: 'Fill %',
      field: 'fillPercentage',
      width: 150,
      cellRenderer: fillPercentageRenderer,
      sortable: true
    },
    {
      headerName: 'Max Fill %',
      field: 'maxFillPercentage',
      width: 110,
      editable: true,
      type: 'numericColumn',
      valueFormatter: ({ value }) => `${value || 50}%`
    },
    {
      headerName: 'From Location',
      field: 'fromLocation',
      width: 140,
      editable: true
    },
    {
      headerName: 'To Location',
      field: 'toLocation',
      width: 140,
      editable: true
    },
    {
      headerName: 'Elevation (mm)',
      field: 'elevation',
      width: 120,
      editable: true,
      type: 'numericColumn',
      valueFormatter: ({ value }) => value ? `${value}` : '—'
    },
    {
      headerName: 'Support Spacing (mm)',
      field: 'supportSpacing',
      width: 150,
      editable: true,
      type: 'numericColumn',
      valueFormatter: ({ value }) => value ? `${value}` : '—'
    },
    {
      headerName: 'Load Rating (kg/m)',
      field: 'loadRating',
      width: 140,
      editable: true,
      type: 'numericColumn',
      valueFormatter: ({ value }) => value ? `${value}` : '—'
    },
    {
      headerName: 'Finish',
      field: 'finish',
      width: 120,
      editable: true
    },
    {
      headerName: 'Notes',
      field: 'notes',
      width: 200,
      editable: true,
      wrapText: true,
      autoHeight: true
    },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 80,
      cellRenderer: actionsCellRenderer,
      sortable: false,
      filter: false,
      resizable: false,
      pinned: 'right'
    }
  ], [fillPercentageRenderer, dimensionsRenderer, actionsCellRenderer]);

  // Handle grid events
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
  }, []);

  const onCellValueChanged = useCallback(async (event: CellValueChangedEvent) => {
    const { data, colDef, newValue, oldValue } = event;
    const tray = data as Tray;
    const field = colDef.field!;
    
    try {
      // Track the change in revision history
      if (tray.id && field && newValue !== oldValue) {
        revisionService.trackChange(
          'tray',
          tray.id,
          tray.tag || `Tray ${tray.id}`,
          'update',
          field,
          oldValue,
          newValue
        );
      }
      
      await onTrayUpdate(tray.id, { [field]: newValue });
      showSuccess(`Tray ${tray.tag} updated successfully`);
    } catch (error) {
      showError(`Failed to update tray: ${error}`);
      // Revert the change
      event.api.refreshCells({ rowNodes: [event.node!], force: true });
    }
  }, [onTrayUpdate, showSuccess, showError]);

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    const selectedNodes = event.api.getSelectedNodes();
    const selectedIds = selectedNodes.map(node => node.data.id).filter(Boolean);
    onSelectionChange(selectedIds);
  }, [onSelectionChange]);

  // Generate next tray tag
  const generateNextTrayTag = useCallback(() => {
    const existingTags = trays
      .map(t => t.tag)
      .filter(tag => tag?.match(/^TRY-\d+$/))
      .map(tag => parseInt(tag!.replace('TRY-', '')))
      .filter(num => !isNaN(num));
    
    const nextNumber = existingTags.length > 0 ? Math.max(...existingTags) + 1 : 1;
    return `TRY-${nextNumber.toString().padStart(3, '0')}`;
  }, [trays]);

  // Handle inline add tray
  const handleInlineAddTray = useCallback(() => {
    if (isAddingNew) return;
    
    setIsAddingNew(true);
    const newTray: Tray = {
      tag: generateNextTrayTag(),
      type: TrayType.Ladder,
      width: 300, // mm
      height: 100, // mm (side rail height)
      length: 3, // meters
      fillPercentage: 0,
      maxFillPercentage: 50,
      material: TrayMaterial.Aluminum,
      fromLocation: '',
      toLocation: '',
      notes: '',
      revisionId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to filtered trays for immediate display
    setFilteredTrays(prev => [newTray, ...prev]);

    // Focus on the tag cell after a short delay
    setTimeout(() => {
      if (gridApi) {
        gridApi.setFocusedCell(0, 'tag');
        gridApi.startEditingCell({ rowIndex: 0, colKey: 'tag' });
      }
    }, 100);
  }, [isAddingNew, generateNextTrayTag, gridApi]);

  // Handle row value change for new tray
  const handleRowValueChanged = useCallback((event: CellValueChangedEvent) => {
    const { data, colDef, newValue, oldValue } = event;
    
    if (newValue !== oldValue) {
      // If this is a new tray (no id), create it
      if (!data.id && isAddingNew) {
        const trayData: Tray = {
          ...data,
          [colDef.field!]: newValue
        };
        
        // Save to database
        onTrayUpdate(-1, trayData);
        setIsAddingNew(false);
      } else if (data.id) {
        // Existing tray, update normally
        const updates: Partial<Tray> = {
          [colDef.field!]: newValue
        };
        onTrayUpdate(data.id, updates);
      }
    }
  }, [isAddingNew, onTrayUpdate]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'f':
            e.preventDefault();
            searchInputRef.current?.focus();
            break;
          case 'n':
            if (e.shiftKey) {
              e.preventDefault();
              onAddTray();
            }
            break;
        }
      } else if (e.key === 'Escape') {
        searchInputRef.current?.blur();
        gridApi?.deselectAll();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [gridApi, onAddTray]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with search and filters */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Cable Trays</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRecalculateAllFills}
              className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              title="Recalculate fill percentages for all conduits and trays"
            >
              Recalculate All Fills
            </button>
            <button
              onClick={handleInlineAddTray}
              disabled={isAddingNew}
              className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddingNew ? 'Adding...' : '+ Add Tray'}
            </button>
            <button
              onClick={onAddFromLibrary}
              className="px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              + From Library
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search trays... (Ctrl+F)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <select
            value={filters.trayType}
            onChange={(e) => setFilters(prev => ({ ...prev, trayType: e.target.value }))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {Object.values(TrayType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={filters.material}
            onChange={(e) => setFilters(prev => ({ ...prev, material: e.target.value }))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Materials</option>
            {Object.values(TrayMaterial).map(material => (
              <option key={material} value={material}>{material}</option>
            ))}
          </select>

          <select
            value={filters.fillRange}
            onChange={(e) => setFilters(prev => ({ ...prev, fillRange: e.target.value }))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Fill Levels</option>
            <option value="low">Low (&lt; 30%)</option>
            <option value="medium">Medium (30-60%)</option>
            <option value="high">High (≥ 60%)</option>
            <option value="overfilled">Overfilled</option>
          </select>

          <input
            type="text"
            placeholder="Filter by location..."
            value={filters.location}
            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-40"
          />

          {/* Clear filters */}
          {(searchTerm || filters.trayType || filters.material || filters.fillRange || filters.location) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({ trayType: '', material: '', fillRange: '', location: '' });
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedTrays.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedTrays.length}
          entityName="tray"
          onBulkEdit={onBulkEdit}
          onBulkDelete={() => {
            // TODO: Implement bulk delete for trays
            console.log('Bulk delete trays:', selectedTrays);
          }}
          onBulkExport={() => {
            // TODO: Implement bulk export for trays
            console.log('Bulk export trays:', selectedTrays);
          }}
          onClearSelection={() => {
            onSelectionChange([]);
          }}
        />
      )}

      {/* Results summary */}
      <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-200">
        Showing {filteredTrays.length} of {trays.length} trays
        {selectedTrays.length > 0 && ` • ${selectedTrays.length} selected`}
      </div>

      {/* Grid */}
      <div className="flex-1 ag-theme-alpine">
        <AgGridReact
          rowData={filteredTrays}
          columnDefs={columnDefinitions}
          onGridReady={onGridReady}
          onCellValueChanged={handleRowValueChanged}
          onSelectionChanged={onSelectionChanged}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
            editable: false
          }}
          getRowId={(params) => params.data.id?.toString() || params.data.tag || Math.random().toString()}
        />
      </div>
    </div>
  );
};

export default TrayTable;