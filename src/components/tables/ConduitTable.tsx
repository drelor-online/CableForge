import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, CellValueChangedEvent, SelectionChangedEvent } from 'ag-grid-community';
import { Conduit, ConduitType } from '../../types';
import { revisionService } from '../../services/revision-service';
import { fillCalculationService } from '../../services/fill-calculation-service';
import KebabMenu from '../ui/KebabMenu';
import BulkActionsBar from './BulkActionsBar';
import { useUI } from '../../contexts/UIContext';

interface ConduitTableProps {
  conduits: Conduit[];
  onConduitUpdate: (id: number, updates: Partial<Conduit>) => void;
  onConduitDelete: (conduitId: number) => void;
  onConduitEdit?: (conduit: Conduit) => void;
  onAddConduit: () => void;
  onAddFromLibrary: () => void;
  onBulkEdit: () => void;
  selectedConduits: number[];
  onSelectionChange: (selectedIds: number[]) => void;
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
  onSelectionChange,
}) => {
  const { showConfirm, showSuccess, showError } = useUI();
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConduits, setFilteredConduits] = useState<Conduit[]>([]);
  const [filters, setFilters] = useState({
    conduitType: '',
    size: '',
    fillRange: '',
    location: ''
  });
  
  // Refs for keyboard navigation
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [gridApi, setGridApi] = useState<any>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Filter conduits based on search term and filters
  useEffect(() => {
    let filtered = [...conduits];
    
    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(conduit => {
        return (
          conduit.tag?.toLowerCase().includes(searchLower) ||
          conduit.type?.toLowerCase().includes(searchLower) ||
          conduit.size?.toLowerCase().includes(searchLower) ||
          conduit.fromLocation?.toLowerCase().includes(searchLower) ||
          conduit.toLocation?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply conduit type filter
    if (filters.conduitType) {
      filtered = filtered.filter(conduit => conduit.type === filters.conduitType);
    }

    // Apply size filter
    if (filters.size) {
      filtered = filtered.filter(conduit => conduit.size === filters.size);
    }

    // Apply fill range filter
    if (filters.fillRange) {
      const [min, max] = filters.fillRange.split('-').map(v => parseFloat(v));
      filtered = filtered.filter(conduit => {
        const fill = conduit.fillPercentage || 0;
        return fill >= min && (max ? fill <= max : true);
      });
    }

    // Apply location filter
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filtered = filtered.filter(conduit => 
        conduit.fromLocation?.toLowerCase().includes(locationLower) ||
        conduit.toLocation?.toLowerCase().includes(locationLower)
      );
    }
    
    setFilteredConduits(filtered);
  }, [conduits, searchTerm, filters]);

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setFilters({
      conduitType: '',
      size: '',
      fillRange: '',
      location: ''
    });
  }, []);

  const handleEdit = useCallback((conduit: Conduit) => {
    if (onConduitEdit) {
      onConduitEdit(conduit);
    } else {
      console.log('Edit conduit:', conduit.tag, '(no handler provided)');
    }
  }, [onConduitEdit]);

  const handleDelete = useCallback(async (conduit: Conduit) => {
    const confirmed = await showConfirm({
      title: 'Delete Conduit',
      message: `Are you sure you want to delete conduit ${conduit.tag}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      try {
        onConduitDelete(conduit.id!);
        showSuccess(`Conduit ${conduit.tag} deleted successfully`);
      } catch (error) {
        showError(`Failed to delete conduit ${conduit.tag}: ${error}`);
      }
    }
  }, [onConduitDelete, showConfirm, showSuccess, showError]);

  // Handle fill recalculation for a specific conduit
  const handleRecalculateFill = useCallback(async (conduit: Conduit) => {
    if (!conduit.id) return;

    try {
      const fillPercentage = await fillCalculationService.recalculateConduitFill(conduit.id);
      
      // Update the conduit with new fill percentage
      onConduitUpdate(conduit.id, { fillPercentage });
      
      showSuccess(`Fill recalculated for conduit ${conduit.tag}: ${fillPercentage.toFixed(1)}%`);
    } catch (error) {
      showError(`Failed to recalculate fill for conduit ${conduit.tag}: ${error}`);
    }
  }, [onConduitUpdate, showSuccess, showError]);

  // Handle batch fill recalculation for all conduits
  const handleRecalculateAllFills = useCallback(async () => {
    try {
      showSuccess('Starting fill recalculation for all conduits...');
      
      await fillCalculationService.recalculateAllFills();
      
      // Refresh the conduits data from the parent
      // In a real implementation, this would trigger a data refresh from the parent component
      showSuccess('Fill calculations completed for all conduits and trays!');
    } catch (error) {
      showError(`Failed to recalculate fills: ${error}`);
    }
  }, [showSuccess, showError]);

  // Get fill percentage color based on NEC standards
  const getFillColor = useCallback((fillPercentage: number) => {
    if (fillPercentage <= 30) return 'bg-green-500';
    if (fillPercentage <= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  }, []);

  // Get standard conduit sizes
  const getStandardSizes = useCallback((type?: ConduitType) => {
    const sizes = ['1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"', '3-1/2"', '4"', '5"', '6"'];
    return sizes;
  }, []);

  // Column definitions for Conduit table
  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: '',
      field: 'selected',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 50,
      pinned: 'left',
      lockPosition: 'left',
      suppressMovable: true
    },
    {
      headerName: 'Tag',
      field: 'tag',
      width: 120,
      pinned: 'left',
      editable: true,
      cellClass: 'font-mono font-semibold text-primary-600',
      cellEditor: 'agTextCellEditor'
    },
    {
      headerName: 'Type',
      field: 'type',
      width: 100,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: Object.values(ConduitType)
      },
      cellRenderer: (params: any): React.ReactElement | string => {
        if (!params.value) return '-';
        const colors = {
          'EMT': 'bg-blue-100 text-blue-800',
          'RMC': 'bg-gray-100 text-gray-800',
          'IMC': 'bg-purple-100 text-purple-800',
          'PVC': 'bg-green-100 text-green-800',
          'LFNC': 'bg-yellow-100 text-yellow-800',
          'FMC': 'bg-orange-100 text-orange-800',
          'Cable Run': 'bg-indigo-100 text-indigo-800',
          'Cable Ladder': 'bg-pink-100 text-pink-800',
          'Cable Tray': 'bg-teal-100 text-teal-800'
        };
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colors[params.value as ConduitType] || 'bg-gray-100 text-gray-800'}`}>
            {params.value}
          </span>
        );
      }
    },
    {
      headerName: 'Size',
      field: 'size',
      width: 80,
      editable: true,
      cellClass: 'font-mono text-center',
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: (params: any) => ({
        values: getStandardSizes(params.data?.type)
      }),
      headerClass: 'text-center',
      valueFormatter: (params: any) => params.value || '-'
    },
    {
      headerName: 'Internal Ø',
      field: 'internalDiameter',
      width: 100,
      editable: true,
      cellClass: 'font-mono text-center',
      cellEditor: 'agNumberCellEditor',
      headerClass: 'text-center',
      valueFormatter: (params: any) => params.value ? `${params.value.toFixed(1)}mm` : '-'
    },
    {
      headerName: 'Fill %',
      field: 'fillPercentage',
      width: 120,
      cellClass: 'text-center',
      headerClass: 'text-center',
      cellRenderer: (params: any): React.ReactElement | string => {
        const fillPercentage = params.value || 0;
        const maxFill = params.data?.maxFillPercentage || 40;
        const fillColor = getFillColor(fillPercentage);
        const isOverfilled = fillPercentage > maxFill;
        
        const fillStatus = fillCalculationService.getConduitFillStatus(params.data);
        
        return (
          <div 
            className="flex items-center justify-center h-full"
            title={fillStatus.message}
          >
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${fillColor}`}
                  style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-semibold ${isOverfilled ? 'text-red-600' : 'text-gray-700'}`}>
                {fillPercentage.toFixed(1)}%
              </span>
              {isOverfilled && (
                <span className="text-red-500 text-xs" title="Exceeds NEC limit">⚠</span>
              )}
              {fillPercentage > maxFill * 0.75 && fillPercentage <= maxFill && (
                <span className="text-yellow-500 text-xs" title="Approaching fill limit">⚡</span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      headerName: 'Max Fill %',
      field: 'maxFillPercentage',
      width: 90,
      editable: true,
      cellClass: 'font-mono text-center',
      cellEditor: 'agNumberCellEditor',
      headerClass: 'text-center',
      valueFormatter: (params: any) => params.value ? `${params.value}%` : '40%'
    },
    {
      headerName: 'From Location',
      field: 'fromLocation',
      width: 130,
      editable: true,
      cellEditor: 'agTextCellEditor'
    },
    {
      headerName: 'To Location',
      field: 'toLocation',
      width: 130,
      editable: true,
      cellEditor: 'agTextCellEditor'
    },
    {
      headerName: 'Notes',
      field: 'notes',
      width: 150,
      editable: true,
      cellEditor: 'agLargeTextCellEditor'
    },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 60,
      pinned: 'right',
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center h-full">
          <KebabMenu
            items={[
              { label: 'Edit', onClick: () => handleEdit(params.data) },
              { label: 'View Cables', onClick: () => console.log('View cables for', params.data.tag) },
              { label: 'Recalculate Fill', onClick: () => handleRecalculateFill(params.data) },
              { label: 'Delete', onClick: () => handleDelete(params.data), variant: 'danger' }
            ]}
          />
        </div>
      ),
      suppressMovable: true,
      lockPosition: 'right'
    }
  ], [getFillColor, getStandardSizes, handleEdit, handleDelete, handleRecalculateFill]);

  // Grid event handlers
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
  }, []);

  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    const { data, colDef, newValue, oldValue } = event;
    const conduit = data as Conduit;
    
    if (newValue !== oldValue && conduit.id && colDef.field) {
      // Track the change in revision history
      revisionService.trackChange(
        'conduit',
        conduit.id,
        conduit.tag || `Conduit ${conduit.id}`,
        'update',
        colDef.field,
        oldValue,
        newValue
      );
      
      const updates: Partial<Conduit> = {
        [colDef.field]: newValue
      };
      
      onConduitUpdate(conduit.id, updates);
    }
  }, [onConduitUpdate]);

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    const selectedRows = event.api.getSelectedRows();
    const selectedIds = selectedRows.map((row: Conduit) => row.id!);
    onSelectionChange(selectedIds);
  }, [onSelectionChange]);

  // Generate next conduit tag
  const generateNextConduitTag = useCallback(() => {
    const existingTags = conduits
      .map(c => c.tag)
      .filter(tag => tag?.match(/^CDT-\d+$/))
      .map(tag => parseInt(tag!.replace('CDT-', '')))
      .filter(num => !isNaN(num));
    
    const nextNumber = existingTags.length > 0 ? Math.max(...existingTags) + 1 : 1;
    return `CDT-${nextNumber.toString().padStart(3, '0')}`;
  }, [conduits]);

  // Handle inline add conduit
  const handleInlineAddConduit = useCallback(() => {
    if (isAddingNew) return;
    
    setIsAddingNew(true);
    const newConduit: Conduit = {
      tag: generateNextConduitTag(),
      type: 'EMT' as ConduitType,
      size: '1"',
      internalDiameter: 26.6, // 1" EMT internal diameter in mm
      fillPercentage: 0,
      maxFillPercentage: 40,
      fromLocation: '',
      toLocation: '',
      notes: '',
      revisionId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to filtered conduits for immediate display
    setFilteredConduits(prev => [newConduit, ...prev]);

    // Focus on the tag cell after a short delay
    setTimeout(() => {
      if (gridApi) {
        gridApi.setFocusedCell(0, 'tag');
        gridApi.startEditingCell({ rowIndex: 0, colKey: 'tag' });
      }
    }, 100);
  }, [isAddingNew, generateNextConduitTag, gridApi]);

  // Handle row value change for new conduit
  const handleRowValueChanged = useCallback((event: CellValueChangedEvent) => {
    const { data, colDef, newValue, oldValue } = event;
    
    if (newValue !== oldValue) {
      // If this is a new conduit (no id), create it
      if (!data.id && isAddingNew) {
        const conduitData: Conduit = {
          ...data,
          [colDef.field!]: newValue
        };
        
        // Save to database
        onConduitUpdate(-1, conduitData);
        setIsAddingNew(false);
      } else if (data.id) {
        // Existing conduit, update normally
        const updates: Partial<Conduit> = {
          [colDef.field!]: newValue
        };
        onConduitUpdate(data.id, updates);
      }
    }
  }, [isAddingNew, onConduitUpdate]);

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Search Field */}
          <div className="flex-1 max-w-80">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search conduits..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <select
            value={filters.conduitType}
            onChange={(e) => handleFilterChange('conduitType', e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-600"
          >
            <option value="">All Types</option>
            {Object.values(ConduitType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={filters.fillRange}
            onChange={(e) => handleFilterChange('fillRange', e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-600"
          >
            <option value="">All Fill %</option>
            <option value="0-30">0-30% (Safe)</option>
            <option value="30-40">30-40% (Near Limit)</option>
            <option value="40-100">40%+ (Overfilled)</option>
          </select>

          {/* Clear Filters */}
          {(searchTerm || Object.values(filters).some(v => v)) && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
            >
              Clear
            </button>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleRecalculateAllFills}
              className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700"
              title="Recalculate fill percentages for all conduits and trays"
            >
              Recalculate All Fills
            </button>
            <button
              onClick={handleInlineAddConduit}
              disabled={isAddingNew}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddingNew ? 'Adding...' : 'Add Conduit'}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedConduits.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedConduits.length}
          entityName="conduit"
          onBulkEdit={onBulkEdit}
          onBulkDelete={() => {
            // TODO: Implement bulk delete for conduits
            console.log('Bulk delete conduits:', selectedConduits);
          }}
          onBulkExport={() => {
            // TODO: Implement bulk export for conduits
            console.log('Bulk export conduits:', selectedConduits);
          }}
          onClearSelection={() => {
            onSelectionChange([]);
          }}
        />
      )}

      {/* AG-Grid Table */}
      <div className="flex-1 ag-theme-alpine">
        <AgGridReact
          rowData={filteredConduits}
          columnDefs={columnDefs}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
            cellClass: 'flex items-center'
          }}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          onGridReady={onGridReady}
          onCellValueChanged={handleRowValueChanged}
          onSelectionChanged={onSelectionChanged}
          getRowId={(params) => params.data.id?.toString() || params.data.tag || Math.random().toString()}
          headerHeight={32}
          rowHeight={40}
          animateRows={true}
          pagination={true}
          paginationPageSize={50}
          suppressCellFocus={true}
          enterNavigatesVertically={true}
          enableCellTextSelection={true}
        />
      </div>
    </div>
  );
};

export default ConduitTable;