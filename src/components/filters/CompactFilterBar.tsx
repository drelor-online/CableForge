import React, { useState, useMemo, useCallback } from 'react';
import { ColumnDefinition } from '../../services/column-service';
import { FilterCondition, filterService } from '../../services/filter-service';
import { FilterConfigService } from '../../config/filter-types';
import { Filter, X, ChevronDown, ChevronUp, Save, FolderOpen } from 'lucide-react';
import { colors } from '../../theme';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import FilterDropdown from './FilterDropdown';

interface CompactFilterBarProps {
  columns: ColumnDefinition[];
  data: any[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  className?: string;
}

interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: FilterCondition[];
  createdAt: Date;
}

const CompactFilterBar: React.FC<CompactFilterBarProps> = ({
  columns,
  data,
  onFiltersChange,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const { value: filterPresets, setValue: setFilterPresets } = useLocalStorage<FilterPreset[]>('filter-presets', []);
  
  const filterState = filterService.getFilterState();
  const activeFilters = filterState.activeFilters;

  // Get filterable columns
  const filterableColumns = useMemo(() => {
    return columns.filter(col => 
      col.visible && 
      col.field !== 'actions' && 
      col.field !== 'selection'
    );
  }, [columns]);

  // Get field type for filtering using centralized configuration
  const getFieldType = (field: string): FilterCondition['type'] => {
    return FilterConfigService.getFieldType(field);
  };

  // Handle filter change
  const handleFilterChange = useCallback((field: string, filter: FilterCondition | null) => {
    let newFilters: FilterCondition[];
    
    if (filter) {
      newFilters = activeFilters.filter(f => f.field !== field);
      newFilters.push(filter);
    } else {
      newFilters = activeFilters.filter(f => f.field !== field);
    }
    
    filterService.setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  }, [activeFilters, onFiltersChange]);

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    filterService.clearAllFilters();
    onFiltersChange([]);
  }, [onFiltersChange]);

  // Get current filter for a field
  const getCurrentFilter = useCallback((field: string): FilterCondition | undefined => {
    return activeFilters.find(f => f.field === field);
  }, [activeFilters]);

  // Save current filters as preset
  const handleSavePreset = useCallback(() => {
    if (!presetName.trim() || activeFilters.length === 0) return;

    const newPreset: FilterPreset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: presetName.trim(),
      filters: [...activeFilters],
      createdAt: new Date()
    };

    setFilterPresets(prev => [...prev, newPreset]);
    setPresetName('');
    setShowSaveDialog(false);
  }, [presetName, activeFilters, setFilterPresets]);

  // Load preset
  const handleLoadPreset = useCallback((preset: FilterPreset) => {
    filterService.setActiveFilters(preset.filters);
    onFiltersChange(preset.filters);
    setShowPresetMenu(false);
  }, [onFiltersChange]);

  // Delete preset
  const handleDeletePreset = useCallback((presetId: string) => {
    setFilterPresets(prev => prev.filter(p => p.id !== presetId));
  }, [setFilterPresets]);

  const hasActiveFilters = activeFilters.length > 0;
  const filteredCount = hasActiveFilters ? filterService.applyFilters(data).length : data.length;

  return (
    <div className={className} style={{ borderBottom: `1px solid ${colors.gray[200]}` }}>
      {/* Compact Header Bar */}
      <div 
        className="flex items-center justify-between px-4 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ minHeight: '40px' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {hasActiveFilters ? `${filteredCount} of ${data.length} rows` : `All ${data.length} rows`}
            </span>
          </div>
          
          {hasActiveFilters && (
            <div className="flex items-center gap-1">
              {activeFilters.slice(0, 3).map(filter => {
                const column = filterableColumns.find(col => col.field === filter.field);
                return (
                  <div
                    key={filter.field}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                    style={{ 
                      backgroundColor: colors.blue[100], 
                      color: colors.blue[800] 
                    }}
                  >
                    <span className="font-medium">
                      {column?.headerName || filter.field}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFilterChange(filter.field, null);
                      }}
                      className="ml-1 hover:bg-blue-200 rounded"
                      style={{ color: colors.blue[600] }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
              {activeFilters.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{activeFilters.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearAllFilters();
              }}
              className="text-xs px-2 py-1 rounded hover:bg-red-50"
              style={{ color: colors.red[600] }}
            >
              Clear All
            </button>
          )}
          
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPresetMenu(!showPresetMenu);
              }}
              className="text-xs px-2 py-1 rounded hover:bg-gray-200 flex items-center gap-1"
              style={{ color: colors.gray[600] }}
            >
              <FolderOpen className="w-3 h-3" />
              Presets
            </button>
            
            {showPresetMenu && (
              <div 
                className="absolute right-0 top-full mt-1 bg-white rounded-md shadow-lg z-50 min-w-48"
                style={{ border: `1px solid ${colors.gray[200]}` }}
              >
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-700 mb-2">Filter Presets</div>
                  
                  {hasActiveFilters && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSaveDialog(true);
                        setShowPresetMenu(false);
                      }}
                      className="w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-50 flex items-center gap-1"
                      style={{ color: colors.green[600] }}
                    >
                      <Save className="w-3 h-3" />
                      Save Current Filters
                    </button>
                  )}
                  
                  {filterPresets.length > 0 && (
                    <>
                      <div className="border-t my-2" style={{ borderColor: colors.gray[200] }}></div>
                      {filterPresets.map(preset => (
                        <div key={preset.id} className="flex items-center justify-between group">
                          <button
                            onClick={() => handleLoadPreset(preset)}
                            className="flex-1 text-left px-2 py-1 text-xs rounded hover:bg-gray-50"
                          >
                            <div className="font-medium">{preset.name}</div>
                            <div className="text-gray-500">{preset.filters.length} filters</div>
                          </button>
                          <button
                            onClick={() => handleDeletePreset(preset.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded"
                            style={{ color: colors.red[600] }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                  
                  {filterPresets.length === 0 && !hasActiveFilters && (
                    <div className="text-xs text-gray-500 text-center py-2">
                      No presets saved yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div className="bg-white border-t" style={{ borderColor: colors.gray[200] }}>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filterableColumns.map(column => {
                const fieldType = getFieldType(column.field);
                const currentFilter = getCurrentFilter(column.field);
                
                return (
                  <div key={column.field}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {column.headerName}
                    </label>
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
            </div>
          </div>
        </div>
      )}

      {/* Save Preset Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="bg-white rounded-lg shadow-xl p-4 w-80"
            style={{ border: `1px solid ${colors.gray[200]}` }}
          >
            <h3 className="text-sm font-medium text-gray-900 mb-3">Save Filter Preset</h3>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Enter preset name"
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1"
              style={{ 
                borderColor: colors.gray[300]
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setPresetName('');
                }}
                className="px-3 py-1 text-xs text-gray-600 border rounded hover:bg-gray-50"
                style={{ borderColor: colors.gray[300] }}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className="px-3 py-1 text-xs text-white rounded hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: colors.blue[600] }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactFilterBar;