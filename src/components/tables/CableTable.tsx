import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, CellValueChangedEvent, SelectionChangedEvent } from 'ag-grid-community';
import { Cable } from '../../types';
import { ValidationStatus } from '../../types/validation';
import { validationService } from '../../services/validation-service';
import { autoNumberingService } from '../../services/auto-numbering-service';
import { ColumnDefinition, columnService } from '../../services/column-service';
import { FilterCondition, filterService } from '../../services/filter-service';
import { createColumnDef, createSelectionColumn } from '../../utils/ag-grid-utils';
import FilterRow from '../filters/FilterRow';
import CableTypeBadge from '../ui/CableTypeBadge';
import StatusIndicator from '../ui/StatusIndicator';
import ValidationIndicator from '../ui/ValidationIndicator';
import KebabMenu from '../ui/KebabMenu';
import BulkActionsBar from './BulkActionsBar';
import DuplicateCablesModal from '../modals/DuplicateCablesModal';
import ColumnManagerModal from '../modals/ColumnManagerModal';
import { useUI } from '../../contexts/UIContext';

interface CableTableProps {
  cables: Cable[];
  onCableUpdate: (id: number, updates: Partial<Cable>) => void;
  onCableDelete: (cableId: number) => void;
  onCableEdit?: (cable: Cable) => void;
  onBulkEdit: () => void;
  selectedCables: number[];
  onSelectionChange: (selectedIds: number[]) => void;
  onAddCable: (cableData: Partial<Cable>) => Promise<Cable>;
  onGetNextTag: () => Promise<string>;
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
  onCableUpdate,
  onCableDelete,
  onCableEdit,
  onBulkEdit,
  selectedCables,
  onSelectionChange,
  onAddCable,
  onGetNextTag,
  searchTerm = '',
  functionFilter = 'Any',
  voltageFilter = 'Any',
  fromFilter = 'Any',
  toFilter = 'Any',
  routeFilter = 'Any'
}) => {
  const { showConfirm, showSuccess, showError } = useUI();
  
  // Filtered cables state
  const [filteredCables, setFilteredCables] = useState<Cable[]>([]);
  const [gridApi, setGridApi] = useState<any>(null);
  
  // Track validation status for each cable
  const [cableValidationStatus, setCableValidationStatus] = useState<Map<number, ValidationStatus>>(new Map());
  
  // Empty row state for Excel-like editing
  const [isCreatingNewCable, setIsCreatingNewCable] = useState(false);
  
  // Duplicate modal state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  
  // Column management state
  const [columnDefinitions, setColumnDefinitions] = useState<ColumnDefinition[]>([]);
  const [showColumnManager, setShowColumnManager] = useState(false);
  
  // Filter state
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Load column settings and filters on mount
  useEffect(() => {
    const savedColumns = columnService.loadColumnSettings();
    setColumnDefinitions(savedColumns);
    
    const filterState = filterService.getFilterState();
    setActiveFilters(filterState.activeFilters);
  }, []);

  // Apply filters using props
  useEffect(() => {
    let filtered = [...cables];
    
    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(cable => {
        return (
          cable.tag?.toLowerCase().includes(searchLower) ||
          cable.description?.toLowerCase().includes(searchLower) ||
          cable.fromEquipment?.toLowerCase().includes(searchLower) ||
          cable.toEquipment?.toLowerCase().includes(searchLower) ||
          cable.route?.toLowerCase().includes(searchLower) ||
          cable.function?.toLowerCase().includes(searchLower) ||
          cable.cableType?.toLowerCase().includes(searchLower) ||
          cable.size?.toLowerCase().includes(searchLower) ||
          cable.fromLocation?.toLowerCase().includes(searchLower) ||
          cable.toLocation?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply function filter
    if (functionFilter && functionFilter !== 'Any') {
      filtered = filtered.filter(cable => cable.function === functionFilter);
    }

    // Apply voltage filter
    if (voltageFilter && voltageFilter !== 'Any') {
      filtered = filtered.filter(cable => cable.voltage?.toString() === voltageFilter);
    }

    // Apply route filter
    if (routeFilter && routeFilter !== 'Any') {
      filtered = filtered.filter(cable => cable.route === routeFilter);
    }

    // Apply from equipment filter
    if (fromFilter && fromFilter !== 'Any') {
      filtered = filtered.filter(cable => cable.fromEquipment === fromFilter);
    }

    // Apply to equipment filter
    if (toFilter && toFilter !== 'Any') {
      filtered = filtered.filter(cable => cable.toEquipment === toFilter);
    }
    
    // Add empty row at the bottom for new cable entry
    const emptyRow: Cable = {
      id: -1, // Special ID for empty row
      tag: '',
      revisionId: 0, // Required field
      description: '',
      function: undefined,
      voltage: undefined,
      cableType: '',
      size: '',
      cores: undefined,
      fromLocation: '',
      fromEquipment: '',
      toLocation: '',
      toEquipment: '',
      length: undefined,
      route: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    filtered.push(emptyRow);
    setFilteredCables(filtered);
    
    // Apply advanced filters
    if (activeFilters.length > 0) {
      // Create a temporary filter service instance with current filters
      const tempFilterService = filterService;
      tempFilterService.setActiveFilters(activeFilters);
      filtered = tempFilterService.applyFilters(filtered);
    }
  }, [cables, searchTerm, functionFilter, voltageFilter, routeFilter, fromFilter, toFilter, activeFilters]);

  // AG-Grid event handlers
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    console.log('CableTable: Grid ready, API available');
  }, []);

  const onCellValueChanged = useCallback(async (event: CellValueChangedEvent) => {
    const cable = event.data as Cable;
    const field = event.colDef.field as keyof Cable;
    const newValue = event.newValue;

    console.log(`CableTable: Cell value changed - ${field}: ${event.oldValue} → ${newValue}`);

    // Handle empty row (new cable creation)
    if (cable.id === -1) {
      console.log('CableTable: Creating new cable from empty row');
      try {
        // Get next tag if tag field is empty or use auto-numbering
        let tag = newValue;
        if (field !== 'tag' || !tag) {
          // Use auto-numbering service to generate next tag
          tag = autoNumberingService.getNextTag(cables);
        }
        
        // Create the cable
        const cableData: Partial<Cable> = {
          tag,
          [field]: newValue
        };
        
        const newCable = await onAddCable(cableData);
        console.log('CableTable: New cable created:', newCable);
        
        showSuccess(`Cable ${newCable.tag} created successfully!`);
      } catch (error) {
        console.error('CableTable: Failed to create new cable:', error);
        showError(`Failed to create cable: ${error}`);
      }
    }
    // Handle existing cable updates
    else if (cable.id && field) {
      onCableUpdate(cable.id, { [field]: newValue });
    }
  }, [onCableUpdate, onAddCable, onGetNextTag, showSuccess, showError]);

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    const selectedRows = event.api.getSelectedRows();
    const selectedIds = selectedRows
      .filter((cable: Cable) => cable.id !== undefined)
      .map((cable: Cable) => cable.id!);
    
    console.log('CableTable: Selection changed', selectedIds);
    onSelectionChange(selectedIds);
  }, [onSelectionChange]);

  // Excel-like keyboard navigation
  const navigateToNextCell = useCallback((params: any) => {
    const suggestedNextCell = params.nextCellPosition;
    
    // Don't navigate to empty row for non-editing actions
    if (suggestedNextCell && suggestedNextCell.rowIndex === filteredCables.length - 1) {
      const cable = filteredCables[suggestedNextCell.rowIndex];
      if (cable?.id === -1 && !params.editing) {
        return null; // Stay in current cell
      }
    }
    
    return suggestedNextCell;
  }, [filteredCables]);

  const tabToNextCell = useCallback((params: any) => {
    const suggestedNextCell = params.nextCellPosition;
    
    // Handle tab navigation in empty row to create new cable
    if (suggestedNextCell && suggestedNextCell.rowIndex === filteredCables.length - 1) {
      const cable = filteredCables[suggestedNextCell.rowIndex];
      if (cable?.id === -1) {
        // Allow tabbing to start editing in empty row
        return suggestedNextCell;
      }
    }
    
    return suggestedNextCell;
  }, [filteredCables]);

  // Delete handlers
  const handleDeleteCable = useCallback(async (cable: Cable) => {
    const confirmed = await showConfirm({
      title: `Delete Cable ${cable.tag}`,
      message: 'Are you sure you want to delete this cable? This action cannot be undone.'
    });

    if (confirmed && cable.id) {
      try {
        onCableDelete(cable.id);
        showSuccess(`Cable "${cable.tag}" deleted successfully`);
      } catch (error) {
        showError(`Failed to delete cable: ${error}`);
      }
    }
  }, [onCableDelete, showConfirm, showSuccess, showError]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedCables.length === 0) return;

    const confirmed = await showConfirm({
      title: `Delete ${selectedCables.length} Cable${selectedCables.length !== 1 ? 's' : ''}`,
      message: 'Are you sure you want to delete the selected cables? This action cannot be undone.'
    });

    if (confirmed) {
      try {
        for (const id of selectedCables) {
          onCableDelete(id);
        }
        showSuccess(`${selectedCables.length} cable${selectedCables.length !== 1 ? 's' : ''} deleted successfully`);
      } catch (error) {
        showError(`Failed to delete cables: ${error}`);
      }
    }
  }, [selectedCables, onCableDelete, showConfirm, showSuccess, showError]);

  const handleBulkDuplicate = useCallback(() => {
    if (selectedCables.length === 0) return;
    setShowDuplicateModal(true);
  }, [selectedCables.length]);

  const handleDuplicateCables = useCallback(async (cablesToDuplicate: Cable[], count: number) => {
    try {
      const totalCopies = cablesToDuplicate.length * count;
      const newTags = autoNumberingService.getNextTags(cables, totalCopies);
      
      let tagIndex = 0;
      const promises = [];
      
      for (let i = 0; i < count; i++) {
        for (const cable of cablesToDuplicate) {
          const cableData: Partial<Cable> = {
            ...cable,
            id: undefined, // Remove ID so it creates a new cable
            tag: newTags[tagIndex++],
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          promises.push(onAddCable(cableData));
        }
      }
      
      await Promise.all(promises);
      showSuccess(`${totalCopies} cable${totalCopies !== 1 ? 's' : ''} duplicated successfully!`);
      setShowDuplicateModal(false);
    } catch (error) {
      console.error('Failed to duplicate cables:', error);
      showError(`Failed to duplicate cables: ${error}`);
    }
  }, [cables, onAddCable, showSuccess, showError]);

  // Column manager handlers
  const handleOpenColumnManager = useCallback(() => {
    setShowColumnManager(true);
  }, []);

  const handleCloseColumnManager = useCallback(() => {
    setShowColumnManager(false);
  }, []);

  const handleApplyColumns = useCallback((newColumns: ColumnDefinition[]) => {
    setColumnDefinitions(newColumns);
    showSuccess('Column settings applied successfully!');
  }, [showSuccess]);

  // Filter handlers
  const handleToggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters]);

  const handleFiltersChange = useCallback((filters: FilterCondition[]) => {
    setActiveFilters(filters);
  }, []);

  // Get validation status for a cable
  const getCableValidationStatus = useCallback((cableId?: number): ValidationStatus => {
    if (!cableId) return { hasIssues: false, errorCount: 0, warningCount: 0 };
    return cableValidationStatus.get(cableId) || { hasIssues: false, errorCount: 0, warningCount: 0 };
  }, [cableValidationStatus]);

  // Get validation CSS class for a row
  const getRowClass = useCallback((params: any) => {
    const cable = params.data as Cable;
    
    // Special styling for empty row
    if (cable.id === -1) {
      return 'empty-row';
    }
    
    const status = getCableValidationStatus(cable.id);
    
    if (status.errorCount > 0) {
      return 'validation-error-row';
    } else if (status.warningCount > 0) {
      return 'validation-warning-row';
    }
    
    return '';
  }, [getCableValidationStatus]);

  // Column definitions
  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: '',
      field: 'selection',
      width: 50,
      pinned: 'left',
      lockPosition: 'left',
      suppressMovable: true,
    },
    {
      headerName: 'Tag',
      field: 'tag',
      width: 120,
      pinned: 'left',
      cellClass: (params: any) => {
        let baseClass = '';
        
        if (params.data.id === -1 && !params.value) {
          baseClass = 'font-mono font-semibold text-gray-400 italic';
        } else {
          baseClass = params.data.id === -1 
            ? 'font-mono font-semibold text-gray-400 italic' 
            : 'font-mono font-semibold text-blue-600';
        }
        
        // Add validation styling
        if (params.data.id !== -1) {
          if (!params.value || params.value.trim() === '') {
            baseClass += ' validation-error-cell';
          }
        }
        
        return baseClass;
      },
      editable: true,
      cellEditor: 'agTextCellEditor',
      cellRenderer: (params: any) => {
        if (params.data.id === -1 && !params.value) {
          return 'Enter cable tag...';
        }
        return params.value || '';
      }
    },
    {
      headerName: 'Description',
      field: 'description',
      width: 200,
      editable: true,
      cellEditor: 'agTextCellEditor',
      cellClass: (params: any) => {
        if (params.data.id === -1 && !params.value) {
          return 'text-gray-400 italic';
        }
        return '';
      },
      cellRenderer: (params: any) => {
        if (params.data.id === -1 && !params.value) {
          return 'Enter description...';
        }
        return params.value || '';
      }
    },
    {
      headerName: 'Function',
      field: 'function',
      width: 130,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Power', 'Signal', 'Control', 'Lighting', 'Communication', 'Spare']
      },
      cellClass: (params: any) => {
        if (params.data.id === -1 && !params.value) {
          return 'text-gray-400 italic';
        }
        return '';
      },
      cellRenderer: (params: any) => {
        if (params.data.id === -1 && !params.value) {
          return 'Select function...';
        }
        return params.value || '';
      }
    },
    {
      headerName: 'Type',
      field: 'cableType',
      width: 120,
      cellRenderer: (params: any) => {
        if (!params.value) return '-';
        return <CableTypeBadge type={params.value} />;
      }
    },
    {
      headerName: 'Size (AWG)',
      field: 'size',
      width: 100,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [
          '22 AWG', '20 AWG', '18 AWG', '16 AWG', '14 AWG', '12 AWG', '10 AWG',
          '8 AWG', '6 AWG', '4 AWG', '2 AWG', '1 AWG', '1/0 AWG', '2/0 AWG',
          '3/0 AWG', '4/0 AWG', '250 MCM', '300 MCM', '350 MCM', '400 MCM',
          '500 MCM', '600 MCM', '750 MCM', '1000 MCM'
        ]
      }
    },
    {
      headerName: 'Voltage (V)',
      field: 'voltage',
      width: 100,
      editable: true,
      type: 'numericColumn',
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: {
        min: 0,
        max: 50000,
        precision: 0
      }
    },
    {
      headerName: 'From',
      field: 'fromEquipment',
      width: 150,
      editable: true,
      cellEditor: 'agTextCellEditor',
      cellClass: (params: any) => {
        if (params.data.id === -1 && !params.value) {
          return 'text-gray-400 italic';
        }
        return '';
      },
      cellRenderer: (params: any) => {
        if (params.data.id === -1 && !params.value) {
          return 'From equipment...';
        }
        return params.value || '';
      }
    },
    {
      headerName: 'To',
      field: 'toEquipment',
      width: 150,
      editable: true,
      cellEditor: 'agTextCellEditor',
      cellClass: (params: any) => {
        if (params.data.id === -1 && !params.value) {
          return 'text-gray-400 italic';
        }
        return '';
      },
      cellRenderer: (params: any) => {
        if (params.data.id === -1 && !params.value) {
          return 'To equipment...';
        }
        return params.value || '';
      }
    },
    {
      headerName: 'Length (ft)',
      field: 'length',
      width: 100,
      editable: true,
      type: 'numericColumn',
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: {
        min: 0,
        max: 50000,
        precision: 1
      }
    },
    {
      headerName: 'Route',
      field: 'route',
      width: 120,
      editable: true,
      cellEditor: 'agTextCellEditor',
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 100,
      cellRenderer: (params: any) => {
        const cable = params.data as Cable;
        const validationStatus = getCableValidationStatus(cable.id);
        return (
          <ValidationIndicator 
            status={validationStatus}
            className="text-sm"
          />
        );
      }
    },
    {
      headerName: '',
      field: 'actions',
      width: 60,
      pinned: 'right',
      suppressMovable: true,
      resizable: false,
      cellRenderer: (params: any) => {
        const cable = params.data as Cable;
        
        // Don't show actions for empty row
        if (cable.id === -1) {
          return null;
        }
        
        const menuItems = [
          { 
            label: 'Edit', 
            onClick: () => onCableEdit?.(cable),
            icon: '✏️'
          },
          { 
            label: 'Delete', 
            onClick: () => handleDeleteCable(cable),
            icon: '🗑️',
            variant: 'danger' as const
          }
        ];
        return <KebabMenu items={menuItems} />;
      }
    }
  ], [columnDefinitions, onCableEdit, handleDeleteCable, getCableValidationStatus]);

  // Dynamic column definitions (replacing the static ones above)
  const dynamicColumnDefs: ColDef[] = useMemo(() => {
    if (columnDefinitions.length === 0) return [];
    
    const visibleColumns = columnService.getVisibleColumns(columnDefinitions);
    const dynamicColumns = visibleColumns.map(colDef => createColumnDef(colDef));
    
    // Add selection column and actions column
    const columns = [
      createSelectionColumn(),
      ...dynamicColumns,
      // Actions column (always present)
      {
        headerName: '',
        field: 'actions',
        width: 80,
        pinned: 'right' as const,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          if (params.data.id === -1) return null; // No actions for empty row
          
          const cable = params.data as Cable;
          const status = getCableValidationStatus(cable.id);
          
          return (
            <div className="flex items-center gap-1 h-full">
              <ValidationIndicator 
                status={status}
              />
              <KebabMenu
                items={[
                  {
                    label: 'Edit',
                    onClick: () => onCableEdit?.(cable),
                    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  },
                  {
                    label: 'Delete',
                    onClick: () => handleDeleteCable(cable),
                    variant: 'danger' as const,
                    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  }
                ]}
              />
            </div>
          );
        }
      }
    ];
    
    return columns;
  }, [columnDefinitions, onCableEdit, handleDeleteCable, getCableValidationStatus]);

  // Default column definition
  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true,
    editable: false,
    enableRowGroup: false,
    enablePivot: false,
    enableValue: false,
  };

  return (
    <div className="h-full flex flex-col">
      {/* Table Toolbar */}
      <div className="flex items-center justify-end gap-2 p-2 bg-gray-50 border-b border-gray-200">
        <button
          onClick={handleToggleFilters}
          className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium border rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            showFilters 
              ? 'bg-blue-50 border-blue-300 text-blue-700' 
              : 'bg-white border-gray-300 text-gray-700'
          }`}
          title="Toggle Advanced Filters"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
          </svg>
          Filters
          {activeFilters.length > 0 && (
            <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
              {activeFilters.length}
            </span>
          )}
        </button>
        
        <button
          onClick={handleOpenColumnManager}
          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="Manage Columns"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          Columns
        </button>
      </div>

      {/* Advanced Filters Row */}
      {showFilters && (
        <FilterRow
          columns={columnDefinitions}
          data={cables}
          onFiltersChange={handleFiltersChange}
        />
      )}

      {/* AG-Grid Table - fills all available space */}
      <div className="flex-1 ag-theme-quartz">
        <AgGridReact
          rowData={filteredCables}
          columnDefs={dynamicColumnDefs.length > 0 ? dynamicColumnDefs : columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          onCellValueChanged={onCellValueChanged}
          onSelectionChanged={onSelectionChanged}
          rowSelection={{
            mode: 'multiRow',
            checkboxes: true,
            headerCheckbox: true,
            enableClickSelection: false,
            isRowSelectable: (params) => params.data.id !== -1 // Don't allow selection of empty row
          }}
          // Excel-like features (Community version limited)
          enableCellTextSelection={true}
          suppressCopyRowsToClipboard={false}
          suppressCopySingleCellRanges={false}
          // Cell navigation
          suppressMovableColumns={false}
          ensureDomOrder={true}
          animateRows={true}
          navigateToNextCell={navigateToNextCell}
          tabToNextCell={tabToNextCell}
          getRowId={(params) => params.data.id?.toString() || params.data.tag}
          getRowClass={getRowClass}
          noRowsOverlayComponent={() => (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-sm font-medium mb-1">No cables found</div>
                <div className="text-xs">Add cables to get started</div>
              </div>
            </div>
          )}
        />
      </div>

      {/* Bulk Actions Bar - appears when items are selected */}
      <BulkActionsBar
        selectedCount={selectedCables.length}
        onBulkEdit={onBulkEdit}
        onBulkDelete={handleBulkDelete}
        onBulkExport={() => {}} // TODO: implement bulk export
        onBulkDuplicate={handleBulkDuplicate}
        onClearSelection={() => onSelectionChange([])}
        isLoading={false}
      />

      {/* Duplicate Cables Modal */}
      <DuplicateCablesModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        onDuplicate={handleDuplicateCables}
        selectedCables={cables.filter(cable => cable.id && selectedCables.includes(cable.id))}
        allCables={cables}
        isLoading={false}
      />

      {/* Column Manager Modal */}
      <ColumnManagerModal
        isOpen={showColumnManager}
        onClose={handleCloseColumnManager}
        onApply={handleApplyColumns}
        currentColumns={columnDefinitions}
      />
    </div>
  );
};

export default CableTable;