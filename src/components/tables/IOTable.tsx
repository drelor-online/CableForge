import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, CellValueChangedEvent, SelectionChangedEvent } from 'ag-grid-community';
import { IOPoint, SignalType, IOType, PLCCard } from '../../types';
import { revisionService } from '../../services/revision-service';
import KebabMenu from '../ui/KebabMenu';
import BulkActionsBar from './BulkActionsBar';
// Toolbar removed - functionality moved to CompactHeader
import PLCCardPanel from '../ui/PLCCardPanel';
import { PLCAssignmentService } from '../../services/plc-assignment-service';
import { useUI } from '../../contexts/UIContext';
import { Filter, SortAsc, SortDesc, ChevronDown, Plus, Search, X, Edit2, Copy, Zap, Trash2 } from 'lucide-react';
import ContextMenu, { useContextMenu, ContextMenuItem } from '../ui/ContextMenu';

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
  onSelectionChange,
}) => {
  const { showConfirm, showSuccess, showError } = useUI();
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredIOPoints, setFilteredIOPoints] = useState<IOPoint[]>([]);
  const [filters, setFilters] = useState({
    ioType: '',
    signalType: '',
    plc: '',
    assigned: ''
  });
  
  // Refs for keyboard navigation
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [gridApi, setGridApi] = useState<any>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // PLC card panel state
  const [showPLCPanel, setShowPLCPanel] = useState(true);

  // Context menu
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();

  // Filter I/O points based on search term and filters
  useEffect(() => {
    let filtered = [...ioPoints];
    
    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(ioPoint => {
        return (
          ioPoint.tag?.toLowerCase().includes(searchLower) ||
          ioPoint.description?.toLowerCase().includes(searchLower) ||
          ioPoint.plcName?.toLowerCase().includes(searchLower) ||
          ioPoint.signalType?.toLowerCase().includes(searchLower) ||
          ioPoint.ioType?.toLowerCase().includes(searchLower) ||
          ioPoint.terminalBlock?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply I/O type filter
    if (filters.ioType) {
      filtered = filtered.filter(ioPoint => ioPoint.ioType === filters.ioType);
    }

    // Apply signal type filter
    if (filters.signalType) {
      filtered = filtered.filter(ioPoint => ioPoint.signalType === filters.signalType);
    }

    // Apply PLC filter
    if (filters.plc) {
      filtered = filtered.filter(ioPoint => ioPoint.plcName === filters.plc);
    }

    // Apply assignment filter
    if (filters.assigned) {
      if (filters.assigned === 'assigned') {
        filtered = filtered.filter(ioPoint => ioPoint.plcName && ioPoint.channel !== undefined);
      } else if (filters.assigned === 'unassigned') {
        filtered = filtered.filter(ioPoint => !ioPoint.plcName || ioPoint.channel === undefined);
      }
    }
    
    setFilteredIOPoints(filtered);
  }, [ioPoints, searchTerm, filters]);

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Handle search clear
  const handleSearchClear = useCallback(() => {
    setSearchTerm('');
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
      ioType: '',
      signalType: '',
      plc: '',
      assigned: ''
    });
  }, []);

  // Get unique values for filter dropdowns
  const getUniqueFilterValues = useCallback((field: keyof IOPoint): string[] => {
    const values = ioPoints
      .map(ioPoint => ioPoint[field])
      .filter((value, index, arr) => value && arr.indexOf(value) === index)
      .map(v => String(v))
      .sort();
    return values;
  }, [ioPoints]);

  // Get unique PLC names
  const getUniquePLCNames = useCallback((): string[] => {
    const plcNames = new Set<string>();
    ioPoints.forEach(ioPoint => {
      if (ioPoint.plcName) plcNames.add(ioPoint.plcName);
    });
    plcCards.forEach(card => {
      plcNames.add(card.plcName);
    });
    return Array.from(plcNames).sort();
  }, [ioPoints, plcCards]);

  const handleEdit = useCallback((ioPoint: IOPoint) => {
    if (onIOPointEdit) {
      onIOPointEdit(ioPoint);
    } else {
      console.log('Edit I/O point:', ioPoint.tag, '(no handler provided)');
    }
  }, [onIOPointEdit]);

  const handleDelete = useCallback(async (ioPoint: IOPoint) => {
    const confirmed = await showConfirm({
      title: 'Delete I/O Point',
      message: `Are you sure you want to delete I/O point ${ioPoint.tag}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      try {
        onIOPointDelete(ioPoint.id!);
        showSuccess(`I/O point ${ioPoint.tag} deleted successfully`);
      } catch (error) {
        showError(`Failed to delete I/O point ${ioPoint.tag}: ${error}`);
      }
    }
  }, [onIOPointDelete, showConfirm, showSuccess, showError]);

  // Get PLC card utilization for a specific card
  const getPLCCardUtilization = useCallback((plcName: string, rack: number, slot: number) => {
    const card = plcCards.find(c => c.plcName === plcName && c.rack === rack && c.slot === slot);
    if (!card) return null;
    
    const usedChannels = ioPoints.filter(io => 
      io.plcName === plcName && io.rack === rack && io.slot === slot && io.channel !== undefined
    ).length;
    
    return {
      used: usedChannels,
      total: card.totalChannels,
      percentage: Math.round((usedChannels / card.totalChannels) * 100)
    };
  }, [plcCards, ioPoints]);

  // Column definitions for I/O table
  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: '',
      field: 'selected',
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
      headerName: 'I/O Type',
      field: 'ioType',
      width: 80,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: Object.values(IOType)
      },
      cellRenderer: (params: any) => {
        if (!params.value) return '-';
        const colors = {
          'AI': 'bg-blue-100 text-blue-800',
          'AO': 'bg-green-100 text-green-800',
          'DI': 'bg-yellow-100 text-yellow-800',
          'DO': 'bg-purple-100 text-purple-800'
        };
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colors[params.value as IOType] || 'bg-gray-100 text-gray-800'}`}>
            {params.value}
          </span>
        );
      }
    },
    {
      headerName: 'Signal Type',
      field: 'signalType',
      width: 120,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: Object.values(SignalType)
      }
    },
    {
      headerName: 'PLC',
      field: 'plcName',
      width: 100,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: () => getUniquePLCNames()
      }
    },
    {
      headerName: 'Rack',
      field: 'rack',
      width: 60,
      editable: true,
      cellClass: 'font-mono text-center',
      cellEditor: 'agNumberCellEditor',
      headerClass: 'text-center',
      valueFormatter: (params: any) => params.value ?? '-'
    },
    {
      headerName: 'Slot',
      field: 'slot',
      width: 60,
      editable: true,
      cellClass: 'font-mono text-center',
      cellEditor: 'agNumberCellEditor',
      headerClass: 'text-center',
      valueFormatter: (params: any) => params.value ?? '-'
    },
    {
      headerName: 'Channel',
      field: 'channel',
      width: 80,
      editable: true,
      cellClass: 'font-mono text-center',
      cellEditor: 'agNumberCellEditor',
      headerClass: 'text-center',
      valueFormatter: (params: any) => params.value ?? '-',
      cellRenderer: (params: any) => {
        if (params.value === undefined || params.value === null) return '-';
        
        const ioPoint = params.data as IOPoint;
        if (!ioPoint.plcName || ioPoint.rack === undefined || ioPoint.slot === undefined) {
          return params.value;
        }
        
        const utilization = getPLCCardUtilization(ioPoint.plcName, ioPoint.rack, ioPoint.slot);
        if (!utilization) return params.value;
        
        return (
          <div className="flex items-center gap-2">
            <span>{params.value}</span>
            <div className="w-12 bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  utilization.percentage > 90 ? 'bg-red-500' :
                  utilization.percentage > 75 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${utilization.percentage}%` }}
                title={`Card utilization: ${utilization.used}/${utilization.total} channels (${utilization.percentage}%)`}
              ></div>
            </div>
          </div>
        );
      }
    },
    {
      headerName: 'Terminal Block',
      field: 'terminalBlock',
      width: 120,
      editable: true,
      cellClass: 'font-mono',
      cellEditor: 'agTextCellEditor'
    },
    {
      headerName: 'Cable',
      field: 'cableId',
      width: 100,
      cellRenderer: (params: any) => {
        if (!params.value) return '-';
        // TODO: Look up cable tag from cableId
        return (
          <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200" 
                title="Click to view cable details">
            Cable-{params.value}
          </span>
        );
      }
    }
  ], [handleDelete, handleEdit, getPLCCardUtilization, getUniquePLCNames]);

  const defaultColDef: ColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    editable: false,
    suppressHeaderMenuButton: false
  }), []);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    console.log('IOTable: Grid ready');
  }, []);

  const onCellValueChanged = useCallback(async (event: CellValueChangedEvent) => {
    const ioPoint = event.data as IOPoint;
    const field = event.column.getColId();
    const newValue = event.newValue;
    const oldValue = event.oldValue;
    
    if (ioPoint.id && field) {
      // Track the change in revision history
      revisionService.trackChange(
        'io_point',
        ioPoint.id,
        ioPoint.tag || `IO Point ${ioPoint.id}`,
        'update',
        field,
        oldValue,
        newValue
      );
      
      const updates: Partial<IOPoint> = { [field]: newValue };
      onIOPointUpdate(ioPoint.id, updates);
    }
  }, [onIOPointUpdate]);

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    const selectedRows = event.api.getSelectedRows();
    const selectedIds = selectedRows.map((row: IOPoint) => row.id!);
    onSelectionChange(selectedIds);
  }, [onSelectionChange]);

  // Generate next I/O point tag
  const generateNextIOTag = useCallback(() => {
    const existingTags = ioPoints
      .map(io => io.tag)
      .filter(tag => tag?.match(/^IO-\d+$/))
      .map(tag => parseInt(tag!.replace('IO-', '')))
      .filter(num => !isNaN(num));
    
    const nextNumber = existingTags.length > 0 ? Math.max(...existingTags) + 1 : 1;
    return `IO-${nextNumber.toString().padStart(3, '0')}`;
  }, [ioPoints]);

  // Handle inline add I/O point
  const handleInlineAddIOPoint = useCallback(() => {
    if (isAddingNew) return;
    
    setIsAddingNew(true);
    const newIOPoint: IOPoint = {
      tag: generateNextIOTag(),
      description: '',
      ioType: IOType.DI,
      signalType: SignalType.TwentyFourVDC,
      plcName: '',
      rack: undefined,
      slot: undefined,
      channel: undefined,
      terminalBlock: '',
      cableId: undefined,
      notes: '',
      revisionId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to filtered I/O points for immediate display
    setFilteredIOPoints(prev => [newIOPoint, ...prev]);

    // Focus on the tag cell after a short delay
    setTimeout(() => {
      if (gridApi) {
        gridApi.setFocusedCell(0, 'tag');
        gridApi.startEditingCell({ rowIndex: 0, colKey: 'tag' });
      }
    }, 100);
  }, [isAddingNew, generateNextIOTag, gridApi]);

  // Handle row value change for new I/O point
  const handleRowValueChanged = useCallback((event: CellValueChangedEvent) => {
    const { data, column, newValue, oldValue } = event;
    const field = column.getColId();
    
    if (newValue !== oldValue) {
      // If this is a new I/O point (no id), create it
      if (!data.id && isAddingNew) {
        const ioData: IOPoint = {
          ...data,
          [field]: newValue,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Save to database - use onIOPointUpdate with special id -1 to indicate new record
        onIOPointUpdate(-1, ioData);
        setIsAddingNew(false);
        
        // Remove the temporary row from filtered data since it will be added properly via props
        setFilteredIOPoints(prev => prev.filter((_, index) => index !== 0 || prev[0].id));
      } else if (data.id) {
        // Existing I/O point, update normally
        const updates: Partial<IOPoint> = {
          [field]: newValue
        };
        onIOPointUpdate(data.id, updates);
      }
    }
  }, [isAddingNew, onIOPointUpdate]);

  // Bulk action handlers
  const handleBulkDelete = useCallback(async () => {
    const confirmed = await showConfirm({
      title: 'Delete I/O Points',
      message: `Are you sure you want to delete ${selectedIOPoints.length} selected I/O points? This action cannot be undone.`,
      confirmText: 'Delete All',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      try {
        for (const ioPointId of selectedIOPoints) {
          onIOPointDelete(ioPointId);
        }
        showSuccess(`Successfully deleted ${selectedIOPoints.length} I/O points`);
        onSelectionChange([]);
      } catch (error) {
        showError(`Failed to delete I/O points: ${error}`);
      }
    }
  }, [selectedIOPoints, onIOPointDelete, onSelectionChange, showConfirm, showSuccess, showError]);

  const handleBulkExport = useCallback(() => {
    // Export only selected I/O points
    const selectedIOData = filteredIOPoints.filter(io => selectedIOPoints.includes(io.id!));
    
    try {
      const headers = [
        'Tag',
        'Description',
        'I/O Type',
        'Signal Type',
        'PLC',
        'Rack',
        'Slot',
        'Channel',
        'Terminal Block',
        'Cable ID',
        'Notes'
      ];

      const csvContent = [
        headers.join(','),
        ...selectedIOData.map(io => [
          `"${io.tag || ''}"`,
          `"${io.description || ''}"`,
          `"${io.ioType || ''}"`,
          `"${io.signalType || ''}"`,
          `"${io.plcName || ''}"`,
          io.rack || '',
          io.slot || '',
          io.channel || '',
          `"${io.terminalBlock || ''}"`,
          io.cableId || '',
          `"${io.notes?.replace(/"/g, '""') || ''}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `selected-io-points-${timestamp}.csv`;
        
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showSuccess(`Exported ${selectedIOData.length} selected I/O points to ${filename}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      showError(`Export failed: ${error}`);
    }
  }, [selectedIOPoints, filteredIOPoints, showSuccess, showError]);

  const handleClearSelection = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  // Auto-assign channel for an I/O point
  const handleAutoAssignChannel = useCallback(async (ioPoint: IOPoint) => {
    try {
      const result = PLCAssignmentService.autoAssignChannel(ioPoint, plcCards, ioPoints);
      
      if (result.success && result.assignedChannel !== undefined) {
        // Find the best card for assignment
        let targetCard: PLCCard | undefined;
        
        if (ioPoint.plcName && ioPoint.rack !== undefined && ioPoint.slot !== undefined) {
          // Use specified card
          targetCard = plcCards.find(card => 
            card.plcName === ioPoint.plcName &&
            card.rack === ioPoint.rack &&
            card.slot === ioPoint.slot
          );
        } else {
          // Find best available card
          const compatibleCards = plcCards.filter(card => 
            card.ioType === ioPoint.ioType
          );
          
          if (compatibleCards.length > 0) {
            // Sort by utilization and pick the least utilized
            const cardUtilizations = compatibleCards.map(card => {
              const usedChannels = ioPoints.filter(io => 
                io.plcName === card.plcName && 
                io.rack === card.rack && 
                io.slot === card.slot &&
                io.channel !== undefined
              ).length;
              return { card, utilization: usedChannels / card.totalChannels };
            });
            
            cardUtilizations.sort((a, b) => a.utilization - b.utilization);
            targetCard = cardUtilizations[0]?.card;
          }
        }
        
        if (targetCard && ioPoint.id) {
          const updates: Partial<IOPoint> = {
            plcName: targetCard.plcName,
            rack: targetCard.rack,
            slot: targetCard.slot,
            channel: result.assignedChannel
          };
          
          await onIOPointUpdate(ioPoint.id, updates);
          showSuccess(`Assigned ${ioPoint.tag} to ${targetCard.plcName} Rack ${targetCard.rack} Slot ${targetCard.slot} Channel ${result.assignedChannel}`);
        }
      } else {
        showError(`Auto-assignment failed: ${result.errorMessage}`);
        if (result.suggestions && result.suggestions.length > 0) {
          console.log('Suggestions:', result.suggestions);
        }
      }
    } catch (error) {
      showError(`Auto-assignment failed: ${error}`);
    }
  }, [plcCards, ioPoints, onIOPointUpdate, showSuccess, showError]);

  // Handle row context menu
  const handleRowContextMenu = useCallback((event: React.MouseEvent, ioPoint?: IOPoint) => {
    const menuItems: ContextMenuItem[] = [];

    if (ioPoint) {
      // Row-specific actions
      menuItems.push(
        {
          id: 'edit',
          label: 'Edit I/O Point',
          icon: Edit2,
          onClick: () => handleEdit(ioPoint),
        },
        {
          id: 'duplicate',
          label: 'Duplicate I/O Point',
          icon: Copy,
          onClick: () => {
            const duplicatedIOPoint = { ...ioPoint };
            delete duplicatedIOPoint.id;
            duplicatedIOPoint.tag = `${ioPoint.tag}_copy`;
            if (onIOPointEdit) {
              onIOPointEdit(duplicatedIOPoint);
            }
          },
        },
        {
          id: 'auto-assign',
          label: 'Auto-assign Channel',
          icon: Zap,
          onClick: () => handleAutoAssignChannel(ioPoint),
          disabled: !ioPoint.ioType,
        },
        {
          id: 'delete',
          label: 'Delete I/O Point',
          icon: Trash2,
          onClick: () => handleDelete(ioPoint),
          variant: 'danger',
          divider: true,
        }
      );
    }

    // Add new I/O point option (always available)
    menuItems.push({
      id: 'add-new',
      label: 'Add New I/O Point',
      icon: Plus,
      onClick: () => handleInlineAddIOPoint(),
    });

    showContextMenu(event, menuItems);
  }, [handleEdit, onIOPointEdit, handleAutoAssignChannel, handleDelete, handleInlineAddIOPoint, showContextMenu]);

  // Keyboard navigation handlers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (event.key === 'Escape') {
        if (searchTerm) {
          event.preventDefault();
          setSearchTerm('');
          return;
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'a' && gridApi) {
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          event.preventDefault();
          gridApi.selectAll();
          return;
        }
      }

      if (event.key === 'Delete' && selectedIOPoints.length > 0) {
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          event.preventDefault();
          handleBulkDelete();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm, selectedIOPoints.length, gridApi, handleBulkDelete]);

  return (
    <div className="flex flex-col h-full">
      {/* I/O-specific Toolbar moved to CompactHeader */}
      
      {/* Enhanced Search & Filter Section */}
      <div className="bg-white border-b border-gray-200">
        {/* Primary Search Bar */}
        <div className="px-4 py-4">
          <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search I/O tag, description, PLC, signal type... (Ctrl+/)"
              className="block w-full pl-10 pr-12 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={handleSearchClear}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                title="Clear search (Esc)"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Quick Filters Bar */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Quick filters:</span>
            
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 font-medium">I/O Type</label>
              <select 
                value={filters.ioType}
                onChange={e => handleFilterChange('ioType', e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white min-w-20"
              >
                <option value="">Any</option>
                {Object.values(IOType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 font-medium">Signal Type</label>
              <select 
                value={filters.signalType}
                onChange={e => handleFilterChange('signalType', e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white min-w-24"
              >
                <option value="">Any</option>
                {getUniqueFilterValues('signalType').map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 font-medium">PLC</label>
              <select 
                value={filters.plc}
                onChange={e => handleFilterChange('plc', e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white min-w-24"
              >
                <option value="">Any</option>
                {getUniquePLCNames().map(plc => (
                  <option key={plc} value={plc}>{plc}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 font-medium">Assignment</label>
              <select 
                value={filters.assigned}
                onChange={e => handleFilterChange('assigned', e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white min-w-24"
              >
                <option value="">Any</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
            
            {/* Clear filters button */}
            {(searchTerm || filters.ioType || filters.signalType || filters.plc || filters.assigned) && (
              <button 
                onClick={handleClearFilters}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-md bg-white hover:bg-gray-50 transition-colors"
                title="Clear all filters and search"
              >
                Clear all
              </button>
            )}
            
          </div>
          
          {/* Filter summary */}
          {(searchTerm || filters.ioType || filters.signalType || filters.plc || filters.assigned) && (
            <div className="mt-2 text-xs text-gray-600">
              Showing {filteredIOPoints.length} of {ioPoints.length} I/O points
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* AG-Grid Table */}
        <div className="flex-1 ag-theme-quartz">
        <AgGridReact
          rowData={filteredIOPoints}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          onCellValueChanged={handleRowValueChanged}
          onSelectionChanged={onSelectionChanged}
          onCellContextMenu={(event) => {
            const ioPoint = event.data as IOPoint;
            if (event.event) {
              handleRowContextMenu(event.event as any as React.MouseEvent, ioPoint);
            }
          }}
          rowSelection={{
            mode: 'multiRow',
            checkboxes: true,
            headerCheckbox: true,
            enableClickSelection: false
          }}
          animateRows={true}
          enableCellTextSelection={true}
          ensureDomOrder={true}
          getRowId={(params) => params.data.id?.toString() || params.data.tag || Math.random().toString()}
          noRowsOverlayComponent={() => (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <div className="text-2xl mb-2">📡</div>
                <div className="text-sm font-medium mb-1">No I/O points found</div>
                <div className="text-xs">Right-click in the table to add new I/O points</div>
              </div>
            </div>
          )}
        />
        </div>

        {/* PLC Card Panel */}
        {showPLCPanel && (
          <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white">
              <h3 className="text-sm font-medium text-gray-900">PLC Cards</h3>
              <button
                onClick={() => setShowPLCPanel(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Hide PLC panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 p-3 overflow-hidden">
              <PLCCardPanel 
                plcCards={plcCards} 
                ioPoints={filteredIOPoints}
                className="h-full"
              />
            </div>
          </div>
        )}

        {/* PLC Panel Toggle (when hidden) */}
        {!showPLCPanel && (
          <div className="w-8 border-l border-gray-200 bg-gray-50 flex items-center justify-center">
            <button
              onClick={() => setShowPLCPanel(true)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded transform -rotate-90"
              title="Show PLC panel"
            >
              <span className="text-xs font-medium">PLC</span>
            </button>
          </div>
        )}
      </div>

      {/* Table Footer - Pagination */}
      <div className="flex items-center justify-center px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <button 
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={true}
          >
            Previous
          </button>
          <span className="text-sm px-2">Page 1 of 1</span>
          <button 
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={true}
          >
            Next
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIOPoints.length}
        entityName="I/O point"
        onBulkEdit={onBulkEdit}
        onBulkDelete={handleBulkDelete}
        onBulkExport={handleBulkExport}
        onClearSelection={handleClearSelection}
        isLoading={false}
      />

      {/* Context Menu */}
      <ContextMenu
        items={contextMenu.items}
        x={contextMenu.x}
        y={contextMenu.y}
        isOpen={contextMenu.isOpen}
        onClose={hideContextMenu}
      />
    </div>
  );
};

export default IOTable;