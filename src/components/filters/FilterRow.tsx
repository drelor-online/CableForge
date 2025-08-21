import React, { useMemo, useCallback } from 'react';
import { ColumnDefinition } from '../../services/column-service';
import { FilterCondition, filterService } from '../../services/filter-service';
import { FilterConfigService } from '../../config/filter-types';
import FilterDropdown from './FilterDropdown';

interface FilterRowProps {
  columns: ColumnDefinition[];
  data: any[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  className?: string;
}

// Get field type using centralized configuration
const getFieldType = (field: string): FilterCondition['type'] => {
  return FilterConfigService.getFieldType(field);
};

const FilterRow: React.FC<FilterRowProps> = ({
  columns,
  data,
  onFiltersChange,
  className = ''
}) => {
  const filterState = filterService.getFilterState();
  const activeFilters = filterState.activeFilters;

  // Get visible columns that can be filtered
  const filterableColumns = useMemo(() => {
    return columns.filter(col => 
      col.visible && 
      col.field !== 'actions' && 
      col.field !== 'selection'
    );
  }, [columns]);

  // Handle filter change for a specific column
  const handleFilterChange = useCallback((field: string, filter: FilterCondition | null) => {
    let newFilters: FilterCondition[];
    
    if (filter) {
      // Add or update filter
      newFilters = activeFilters.filter(f => f.field !== field);
      newFilters.push(filter);
    } else {
      // Remove filter
      newFilters = activeFilters.filter(f => f.field !== field);
    }
    
    filterService.setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  }, [activeFilters, onFiltersChange]);

  // Get current filter for a field
  const getCurrentFilter = useCallback((field: string): FilterCondition | undefined => {
    return activeFilters.find(f => f.field === field);
  }, [activeFilters]);

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    filterService.clearAllFilters();
    onFiltersChange([]);
  }, [onFiltersChange]);

  // Calculate column widths to match the main table
  const getColumnStyle = (column: ColumnDefinition) => ({
    width: column.width || 100,
    minWidth: column.width || 100,
    maxWidth: column.width || 100,
  });

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className={`bg-gray-50 border-b border-gray-200 ${className}`}>
      {/* Filter Controls Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            Filters
          </span>
          {hasActiveFilters && (
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
              {activeFilters.length} active
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleClearAllFilters}
              className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded"
            >
              Clear All
            </button>
          )}
          
          {/* TODO: Add preset management buttons */}
          <button
            className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 px-2 py-1 rounded"
            title="Save Filter Preset (Coming Soon)"
            disabled
          >
            Save
          </button>
          
          <button
            className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 px-2 py-1 rounded"
            title="Load Filter Preset (Coming Soon)"
            disabled
          >
            Load
          </button>
        </div>
      </div>

      {/* Filter Dropdowns Row */}
      <div className="flex" style={{ paddingLeft: '50px' }}> {/* Account for selection column */}
        {filterableColumns.map(column => {
          const fieldType = getFieldType(column.field);
          const currentFilter = getCurrentFilter(column.field);
          
          return (
            <div
              key={column.field}
              className="border-r border-gray-200 p-1"
              style={getColumnStyle(column)}
            >
              <FilterDropdown
                field={column.field}
                headerName={column.headerName}
                type={fieldType}
                data={data}
                currentFilter={currentFilter}
                onFilterChange={(filter) => handleFilterChange(column.field, filter)}
                className="w-full"
              />
            </div>
          );
        })}
        
        {/* Actions column spacer */}
        <div className="w-20 p-1">
          <div className="h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
            <span className="text-xs text-gray-400">Actions</span>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      {hasActiveFilters && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-blue-700 font-medium">Active filters:</span>
            {activeFilters.map(filter => (
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
                  onClick={() => handleFilterChange(filter.field, null)}
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
  );
};

export default FilterRow;