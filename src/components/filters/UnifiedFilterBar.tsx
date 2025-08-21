import React, { useState, useCallback, useMemo } from 'react';
import { ColumnDefinition } from '../../services/column-service';
import { FilterCondition, filterService } from '../../services/filter-service';
import FilterDropdown from './FilterDropdown';

interface UnifiedFilterBarProps {
  columns: ColumnDefinition[];
  data: any[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  // Legacy simple filter props for backward compatibility
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  selectedFunction?: string;
  onFunctionChange?: (value: string) => void;
  selectedVoltage?: string;
  onVoltageChange?: (value: string) => void;
  selectedFrom?: string;
  onFromChange?: (value: string) => void;
  selectedTo?: string;
  onToChange?: (value: string) => void;
  selectedRoute?: string;
  onRouteChange?: (value: string) => void;
  onClearFilters?: () => void;
  className?: string;
}

type FilterMode = 'simple' | 'advanced';

const UnifiedFilterBar: React.FC<UnifiedFilterBarProps> = ({
  columns,
  data,
  onFiltersChange,
  searchTerm = '',
  onSearchChange,
  selectedFunction = 'Any',
  onFunctionChange,
  selectedVoltage = 'Any',
  onVoltageChange,
  selectedFrom = 'Any',
  onFromChange,
  selectedTo = 'Any',
  onToChange,
  selectedRoute = 'Any',
  onRouteChange,
  onClearFilters,
  className = ''
}) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('simple');
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const filterState = filterService.getFilterState();
  const activeAdvancedFilters = filterState.activeFilters;

  // Get filterable columns for advanced mode
  const filterableColumns = useMemo(() => {
    return columns.filter(col => 
      col.visible && 
      col.field !== 'actions' && 
      col.field !== 'selection'
    );
  }, [columns]);

  // Check if we have any active filters
  const hasActiveSimpleFilters = 
    selectedFunction !== 'Any' || 
    selectedVoltage !== 'Any' || 
    selectedFrom !== 'Any' || 
    selectedTo !== 'Any' || 
    selectedRoute !== 'Any' ||
    searchTerm.length > 0;

  const hasActiveAdvancedFilters = activeAdvancedFilters.length > 0;
  const totalActiveFilters = (hasActiveSimpleFilters ? 1 : 0) + activeAdvancedFilters.length;

  // Handle mode toggle
  const handleModeToggle = useCallback((newMode: FilterMode) => {
    setFilterMode(newMode);
    
    // If switching to simple mode and we have advanced filters, clear them
    if (newMode === 'simple' && hasActiveAdvancedFilters) {
      filterService.clearAllFilters();
      onFiltersChange([]);
    }
  }, [hasActiveAdvancedFilters, onFiltersChange]);

  // Handle advanced filter changes
  const handleAdvancedFiltersChange = useCallback((filters: FilterCondition[]) => {
    onFiltersChange(filters);
  }, [onFiltersChange]);

  // Handle clear all filters
  const handleClearAll = useCallback(() => {
    if (filterMode === 'simple' && onClearFilters) {
      onClearFilters();
    } else if (filterMode === 'advanced') {
      filterService.clearAllFilters();
      onFiltersChange([]);
    }
  }, [filterMode, onClearFilters, onFiltersChange]);

  // Get field type for filtering
  const getFieldType = (field: string): FilterCondition['type'] => {
    switch (field) {
      case 'tag':
      case 'description':
      case 'fromEquipment':
      case 'toEquipment':
      case 'fromLocation':
      case 'toLocation':
      case 'route':
      case 'manufacturer':
      case 'partNumber':
      case 'notes':
      case 'cableType':
        return 'text';
      case 'voltage':
      case 'current':
      case 'cores':
      case 'length':
      case 'sparePercentage':
      case 'calculatedLength':
      case 'outerDiameter':
      case 'voltageDropPercentage':
        return 'number';
      case 'function':
      case 'size':
      case 'segregationClass':
        return 'enum';
      case 'segregationWarning':
        return 'boolean';
      default:
        return 'text';
    }
  };

  if (isCollapsed) {
    return (
      <div className={`bg-gray-50 border-b border-gray-200 ${className}`}>
        <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={() => setIsCollapsed(false)}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Show Filters
            {totalActiveFilters > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {totalActiveFilters}
              </span>
            )}
          </button>
          
          {totalActiveFilters > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 border-b border-gray-200 ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-gray-500 hover:text-gray-700"
            title="Collapse Filters"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Filters</span>
            {totalActiveFilters > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {totalActiveFilters} active
              </span>
            )}
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-white border border-gray-300 rounded overflow-hidden">
            <button
              onClick={() => handleModeToggle('simple')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                filterMode === 'simple'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Simple
            </button>
            <button
              onClick={() => handleModeToggle('advanced')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                filterMode === 'advanced'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Advanced
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalActiveFilters > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Content */}
      {filterMode === 'simple' ? (
        /* Simple Filter Mode */
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Search Field */}
          <div className="flex-1 max-w-80">
            <input
              type="text"
              placeholder="Quick search cables..."
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Key Filter Dropdowns */}
          <select
            value={selectedFunction}
            onChange={(e) => onFunctionChange?.(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-600 min-w-0"
          >
            <option value="Any">Function</option>
            <option value="Power">Power</option>
            <option value="Control">Control</option>
            <option value="Signal">Signal</option>
            <option value="Communication">Communication</option>
            <option value="Lighting">Lighting</option>
          </select>

          <select
            value={selectedVoltage}
            onChange={(e) => onVoltageChange?.(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-600 min-w-0"
          >
            <option value="Any">Voltage</option>
            <option value="120">120V</option>
            <option value="240">240V</option>
            <option value="480">480V</option>
            <option value="600">600V</option>
            <option value="4160">4.16kV</option>
          </select>

          <select
            value={selectedFrom}
            onChange={(e) => onFromChange?.(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-600 min-w-0"
          >
            <option value="Any">From Equipment</option>
            <option value="MCC-1">MCC-1</option>
            <option value="MCC-2">MCC-2</option>
            <option value="Panel-A">Panel-A</option>
            <option value="Panel-B">Panel-B</option>
          </select>
        </div>
      ) : (
        /* Advanced Filter Mode */
        <div>
          {/* Advanced Filter Instructions */}
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
            <div className="text-xs text-blue-700">
              Click column headers below to set advanced filters with custom operators and conditions.
            </div>
          </div>

          {/* Advanced Filter Dropdowns Row */}
          <div className="flex overflow-x-auto" style={{ paddingLeft: '50px' }}>
            {filterableColumns.map(column => {
              const fieldType = getFieldType(column.field);
              const currentFilter = activeAdvancedFilters.find(f => f.field === column.field);
              
              return (
                <div
                  key={column.field}
                  className="border-r border-gray-200 p-1 flex-shrink-0"
                  style={{ width: column.width || 120 }}
                >
                  <FilterDropdown
                    field={column.field}
                    headerName={column.headerName}
                    type={fieldType}
                    data={data}
                    currentFilter={currentFilter}
                    onFilterChange={(filter) => {
                      let newFilters: FilterCondition[];
                      
                      if (filter) {
                        newFilters = activeAdvancedFilters.filter(f => f.field !== column.field);
                        newFilters.push(filter);
                      } else {
                        newFilters = activeAdvancedFilters.filter(f => f.field !== column.field);
                      }
                      
                      filterService.setActiveFilters(newFilters);
                      handleAdvancedFiltersChange(newFilters);
                    }}
                    className="w-full"
                  />
                </div>
              );
            })}
            
            {/* Actions column spacer */}
            <div className="w-20 p-1 flex-shrink-0">
              <div className="h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                <span className="text-xs text-gray-400">Actions</span>
              </div>
            </div>
          </div>

          {/* Active Advanced Filters Summary */}
          {hasActiveAdvancedFilters && (
            <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-blue-700 font-medium">Active filters:</span>
                {activeAdvancedFilters.map(filter => (
                  <div
                    key={filter.field}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                  >
                    <span className="font-medium">
                      {filterableColumns.find(col => col.field === filter.field)?.headerName || filter.field}
                    </span>
                    <span className="text-blue-600">
                      {filter.operator === 'contains' ? 'contains' :
                       filter.operator === 'equals' ? '=' :
                       filter.operator === 'greater_than' ? '>' :
                       filter.operator === 'less_than' ? '<' :
                       filter.operator === 'in' ? 'in' :
                       filter.operator}
                    </span>
                    <span>
                      {filter.values ? filter.values.join(', ') : filter.value}
                    </span>
                    <button
                      onClick={() => {
                        const newFilters = activeAdvancedFilters.filter(f => f.field !== filter.field);
                        filterService.setActiveFilters(newFilters);
                        handleAdvancedFiltersChange(newFilters);
                      }}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                      title="Remove filter"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnifiedFilterBar;