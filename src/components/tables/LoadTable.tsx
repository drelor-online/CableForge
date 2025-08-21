import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, CellValueChangedEvent, SelectionChangedEvent } from 'ag-grid-community';
import { Load, LoadType, StarterType, ProtectionType } from '../../types';
import { revisionService } from '../../services/revision-service';
import KebabMenu from '../ui/KebabMenu';
import BulkActionsBar from './BulkActionsBar';
import { useUI } from '../../contexts/UIContext';

interface LoadTableProps {
  loads: Load[];
  onLoadUpdate: (id: number, updates: Partial<Load>) => void;
  onLoadDelete: (loadId: number) => void;
  onLoadEdit?: (load: Load) => void;
  onAddLoad: () => void;
  onAddFromLibrary: () => void;
  onBulkEdit: () => void;
  selectedLoads: number[];
  onSelectionChange: (selectedIds: number[]) => void;
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
  onSelectionChange,
}) => {
  const { showConfirm, showSuccess, showError } = useUI();
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLoads, setFilteredLoads] = useState<Load[]>([]);
  const [filters, setFilters] = useState({
    loadType: '',
    voltage: '',
    powerRange: '',
    starter: ''
  });
  
  // Refs for keyboard navigation
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [gridApi, setGridApi] = useState<any>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Filter loads based on search term and filters
  useEffect(() => {
    let filtered = [...loads];
    
    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(load => {
        return (
          load.tag?.toLowerCase().includes(searchLower) ||
          load.description?.toLowerCase().includes(searchLower) ||
          load.loadType?.toLowerCase().includes(searchLower) ||
          load.feederCable?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply load type filter
    if (filters.loadType) {
      filtered = filtered.filter(load => load.loadType === filters.loadType);
    }

    // Apply voltage filter
    if (filters.voltage) {
      const voltageNum = parseFloat(filters.voltage);
      filtered = filtered.filter(load => load.voltage === voltageNum);
    }

    // Apply power range filter
    if (filters.powerRange) {
      const [min, max] = filters.powerRange.split('-').map(v => parseFloat(v));
      filtered = filtered.filter(load => {
        const power = load.powerKw || (load.powerHp ? load.powerHp * 0.746 : 0);
        return power >= min && (max ? power <= max : true);
      });
    }

    // Apply starter filter
    if (filters.starter) {
      filtered = filtered.filter(load => load.starterType === filters.starter);
    }
    
    setFilteredLoads(filtered);
  }, [loads, searchTerm, filters]);

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
      loadType: '',
      voltage: '',
      powerRange: '',
      starter: ''
    });
  }, []);

  const handleEdit = useCallback((load: Load) => {
    if (onLoadEdit) {
      onLoadEdit(load);
    } else {
      console.log('Edit load:', load.tag, '(no handler provided)');
    }
  }, [onLoadEdit]);

  const handleDelete = useCallback(async (load: Load) => {
    const confirmed = await showConfirm({
      title: 'Delete Load',
      message: `Are you sure you want to delete load ${load.tag}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      try {
        onLoadDelete(load.id!);
        showSuccess(`Load ${load.tag} deleted successfully`);
      } catch (error) {
        showError(`Failed to delete load ${load.tag}: ${error}`);
      }
    }
  }, [onLoadDelete, showConfirm, showSuccess, showError]);

  // Power display helper
  const formatPower = useCallback((load: Load) => {
    if (load.powerKw && load.powerHp) {
      return `${load.powerKw} kW (${load.powerHp} HP)`;
    } else if (load.powerKw) {
      return `${load.powerKw} kW`;
    } else if (load.powerHp) {
      return `${load.powerHp} HP`;
    }
    return '-';
  }, []);

  // Column definitions for Load table
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
      headerName: 'Description',
      field: 'description',
      width: 200,
      pinned: 'left',
      editable: true,
      cellEditor: 'agTextCellEditor'
    },
    {
      headerName: 'Type',
      field: 'loadType',
      width: 100,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: Object.values(LoadType)
      },
      cellRenderer: (params: any): React.ReactElement | string => {
        if (!params.value) return '-';
        const colors = {
          'Motor': 'bg-blue-100 text-blue-800',
          'Lighting': 'bg-yellow-100 text-yellow-800',
          'Heating': 'bg-red-100 text-red-800',
          'Power': 'bg-green-100 text-green-800',
          'Variable': 'bg-purple-100 text-purple-800',
          'Other': 'bg-gray-100 text-gray-800'
        };
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colors[params.value as LoadType] || 'bg-gray-100 text-gray-800'}`}>
            {params.value}
          </span>
        );
      }
    },
    {
      headerName: 'Power',
      field: 'power',
      width: 140,
      cellClass: 'font-mono text-center',
      headerClass: 'text-center',
      valueGetter: (params: any) => formatPower(params.data),
      cellRenderer: (params: any): React.ReactElement | string => {
        const load = params.data as Load;
        if (load.powerKw || load.powerHp) {
          return (
            <div className="text-center">
              <div className="font-semibold">{formatPower(load)}</div>
              {load.connectedLoadKw && (
                <div className="text-xs text-gray-500">
                  Connected: {load.connectedLoadKw.toFixed(1)} kW
                </div>
              )}
            </div>
          );
        }
        return '-';
      }
    },
    {
      headerName: 'Voltage',
      field: 'voltage',
      width: 80,
      editable: true,
      cellClass: 'font-mono text-center',
      cellEditor: 'agNumberCellEditor',
      headerClass: 'text-center',
      valueFormatter: (params: any) => params.value ? `${params.value}V` : '-'
    },
    {
      headerName: 'Current',
      field: 'current',
      width: 80,
      editable: true,
      cellClass: 'font-mono text-center',
      cellEditor: 'agNumberCellEditor',
      headerClass: 'text-center',
      valueFormatter: (params: any) => params.value ? `${params.value.toFixed(1)}A` : '-',
      cellRenderer: (params: any): React.ReactElement | string => {
        const current = params.value;
        if (current) {
          let className = 'font-mono text-center ';
          if (current > 100) {
            className += 'text-red-600 font-semibold';
          } else if (current > 50) {
            className += 'text-orange-600';
          } else {
            className += 'text-gray-900';
          }
          return `<div class="${className}">${current.toFixed(1)}A</div>`;
        }
        return '-';
      }
    },
    {
      headerName: 'PF',
      field: 'powerFactor',
      width: 60,
      editable: true,
      cellClass: 'font-mono text-center',
      cellEditor: 'agNumberCellEditor',
      headerClass: 'text-center',
      valueFormatter: (params: any) => params.value ? params.value.toFixed(2) : '-'
    },
    {
      headerName: 'Demand kW',
      field: 'demandLoadKw',
      width: 100,
      cellClass: 'font-mono text-center',
      headerClass: 'text-center',
      valueFormatter: (params: any) => params.value ? `${params.value.toFixed(1)} kW` : '-'
    },
    {
      headerName: 'Feeder Cable',
      field: 'feederCable',
      width: 120,
      editable: true,
      cellEditor: 'agTextCellEditor',
      cellClass: 'font-mono'
    },
    {
      headerName: 'Starter',
      field: 'starterType',
      width: 100,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: Object.values(StarterType)
      }
    },
    {
      headerName: 'Protection',
      field: 'protectionType',
      width: 100,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: Object.values(ProtectionType)
      }
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
              { label: 'Delete', onClick: () => handleDelete(params.data), variant: 'danger' }
            ]}
          />
        </div>
      ),
      suppressMovable: true,
      lockPosition: 'right'
    }
  ], [formatPower, handleEdit, handleDelete]);

  // Grid event handlers
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
  }, []);

  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    const { data, colDef, newValue, oldValue } = event;
    const load = data as Load;
    
    if (newValue !== oldValue && load.id && colDef.field) {
      // Track the change in revision history
      revisionService.trackChange(
        'load',
        load.id,
        load.tag || `Load ${load.id}`,
        'update',
        colDef.field,
        oldValue,
        newValue
      );
      
      const updates: Partial<Load> = {
        [colDef.field]: newValue
      };
      
      onLoadUpdate(load.id, updates);
    }
  }, [onLoadUpdate]);

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    const selectedRows = event.api.getSelectedRows();
    const selectedIds = selectedRows.map((row: Load) => row.id!);
    onSelectionChange(selectedIds);
  }, [onSelectionChange]);

  // Generate next load tag
  const generateNextLoadTag = useCallback(() => {
    const existingTags = loads
      .map(l => l.tag)
      .filter(tag => tag?.match(/^L-\d+$/))
      .map(tag => parseInt(tag!.replace('L-', '')))
      .filter(num => !isNaN(num));
    
    const nextNumber = existingTags.length > 0 ? Math.max(...existingTags) + 1 : 1;
    return `L-${nextNumber.toString().padStart(3, '0')}`;
  }, [loads]);

  // Handle inline add load
  const handleInlineAddLoad = useCallback(() => {
    if (isAddingNew) return;
    
    setIsAddingNew(true);
    const newLoad: Load = {
      tag: generateNextLoadTag(),
      description: '',
      loadType: 'Motor',
      voltage: 480,
      current: 0,
      powerKw: 0,
      powerHp: 0,
      efficiency: 85,
      powerFactor: 0.85,
      starterType: 'Direct Online',
      protectionType: 'Overload + Short Circuit',
      notes: '',
      revisionId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to filtered loads for immediate display
    setFilteredLoads(prev => [newLoad, ...prev]);

    // Focus on the tag cell after a short delay
    setTimeout(() => {
      if (gridApi) {
        gridApi.setFocusedCell(0, 'tag');
        gridApi.startEditingCell({ rowIndex: 0, colKey: 'tag' });
      }
    }, 100);
  }, [isAddingNew, generateNextLoadTag, gridApi]);

  // Handle row value change for new load
  const handleRowValueChanged = useCallback((event: CellValueChangedEvent) => {
    const { data, colDef, newValue, oldValue } = event;
    
    if (newValue !== oldValue) {
      // If this is a new load (no id), create it
      if (!data.id && isAddingNew) {
        const loadData: Load = {
          ...data,
          [colDef.field!]: newValue,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Save to database - use onLoadUpdate with special id -1 to indicate new record
        onLoadUpdate(-1, loadData);
        setIsAddingNew(false);
        
        // Remove the temporary row from filtered data since it will be added properly via props
        setFilteredLoads(prev => prev.filter((_, index) => index !== 0 || prev[0].id));
      } else if (data.id) {
        // Existing load, update normally
        const updates: Partial<Load> = {
          [colDef.field!]: newValue
        };
        onLoadUpdate(data.id, updates);
      }
    }
  }, [isAddingNew, onLoadUpdate]);

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
              placeholder="Search loads..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <select
            value={filters.loadType}
            onChange={(e) => handleFilterChange('loadType', e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-600"
          >
            <option value="">All Types</option>
            {Object.values(LoadType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={filters.voltage}
            onChange={(e) => handleFilterChange('voltage', e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-600"
          >
            <option value="">All Voltages</option>
            <option value="120">120V</option>
            <option value="240">240V</option>
            <option value="480">480V</option>
            <option value="600">600V</option>
            <option value="4160">4.16kV</option>
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
              onClick={handleInlineAddLoad}
              disabled={isAddingNew}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddingNew ? 'Adding...' : 'Add Load'}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedLoads.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedLoads.length}
          entityName="load"
          onBulkEdit={onBulkEdit}
          onBulkDelete={async () => {
            const confirmed = await showConfirm({
              title: 'Delete Loads',
              message: `Are you sure you want to delete ${selectedLoads.length} selected loads? This action cannot be undone.`,
              confirmText: 'Delete All',
              cancelText: 'Cancel',
              type: 'danger'
            });

            if (confirmed) {
              try {
                for (const loadId of selectedLoads) {
                  onLoadDelete(loadId);
                }
                showSuccess(`Successfully deleted ${selectedLoads.length} loads`);
                onSelectionChange([]);
              } catch (error) {
                showError(`Failed to delete loads: ${error}`);
              }
            }
          }}
          onBulkExport={() => {
            // Export only selected loads
            const selectedLoadData = filteredLoads.filter(load => selectedLoads.includes(load.id!));
            
            try {
              const headers = [
                'Tag',
                'Description',
                'Load Type',
                'Power (kW)',
                'Power (HP)',
                'Voltage',
                'Current',
                'Power Factor',
                'Demand Load (kW)',
                'Connected Load (kW)',
                'Efficiency',
                'Feeder Cable',
                'Starter Type',
                'Protection Type',
                'Notes'
              ];

              const csvContent = [
                headers.join(','),
                ...selectedLoadData.map(load => [
                  `"${load.tag || ''}"`,
                  `"${load.description || ''}"`,
                  `"${load.loadType || ''}"`,
                  load.powerKw || '',
                  load.powerHp || '',
                  load.voltage || '',
                  load.current || '',
                  load.powerFactor || '',
                  load.demandLoadKw || '',
                  load.connectedLoadKw || '',
                  load.efficiency || '',
                  `"${load.feederCable || ''}"`,
                  `"${load.starterType || ''}"`,
                  `"${load.protectionType || ''}"`,
                  `"${load.notes?.replace(/"/g, '""') || ''}"`
                ].join(','))
              ].join('\n');

              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              
              if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                
                const now = new Date();
                const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
                const filename = `selected-loads-${timestamp}.csv`;
                
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showSuccess(`Exported ${selectedLoadData.length} selected loads to ${filename}`);
              }
            } catch (error) {
              console.error('Export failed:', error);
              showError(`Export failed: ${error}`);
            }
          }}
          onClearSelection={() => {
            onSelectionChange([]);
          }}
        />
      )}

      {/* AG-Grid Table */}
      <div className="flex-1 ag-theme-alpine">
        <AgGridReact
          rowData={filteredLoads}
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
          onRowValueChanged={handleRowValueChanged}
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

export default LoadTable;