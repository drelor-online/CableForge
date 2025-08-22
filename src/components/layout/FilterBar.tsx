import React from 'react';
import { FilterCondition } from '../../services/filter-service';

interface FilterBarProps {
  // Generic filter props that work with any table
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  columnFilters?: FilterCondition[];
  onColumnFiltersChange?: (filters: FilterCondition[]) => void;
  columns?: { id: string; label: string; }[];
  
  // Legacy props for backward compatibility
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
}

const FilterBar: React.FC<FilterBarProps> = ({
  // Generic props
  globalFilter,
  onGlobalFilterChange,
  columnFilters = [],
  onColumnFiltersChange,
  columns = [],
  
  // Legacy props
  searchTerm,
  onSearchChange,
  selectedFunction,
  onFunctionChange,
  selectedVoltage,
  onVoltageChange,
  selectedFrom,
  onFromChange,
  selectedTo,
  onToChange,
  selectedRoute,
  onRouteChange,
  onClearFilters
}) => {
  // Use generic props if available, otherwise fall back to legacy
  const currentSearchTerm = globalFilter ?? searchTerm ?? '';
  const handleSearchChange = onGlobalFilterChange ?? onSearchChange ?? (() => {});
  
  const hasActiveFilters = 
    (selectedFunction && selectedFunction !== 'Any') || 
    (selectedVoltage && selectedVoltage !== 'Any') || 
    (selectedFrom && selectedFrom !== 'Any') || 
    (selectedTo && selectedTo !== 'Any') || 
    (selectedRoute && selectedRoute !== 'Any') ||
    currentSearchTerm.length > 0 ||
    columnFilters.length > 0;

  return (
    <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center gap-3 px-4">
      {/* Search Field */}
      <input
        type="text"
        placeholder="Quick search..."
        value={currentSearchTerm}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="flex-1 max-w-80 px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      />

      {/* Legacy Filter Dropdowns - only show if legacy props provided */}
      {selectedFunction !== undefined && onFunctionChange && (
        <select
          value={selectedFunction}
          onChange={(e) => onFunctionChange(e.target.value)}
          className="px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-600"
        >
          <option value="Any">Function ▼</option>
          <option value="Power">Power</option>
          <option value="Control">Control</option>
          <option value="Instrumentation">Instrumentation</option>
          <option value="Data">Data</option>
          <option value="Lighting">Lighting</option>
        </select>
      )}

      {selectedVoltage !== undefined && onVoltageChange && (
        <select
          value={selectedVoltage}
          onChange={(e) => onVoltageChange(e.target.value)}
          className="px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-600"
        >
          <option value="Any">Voltage ▼</option>
          <option value="120">120V</option>
          <option value="240">240V</option>
          <option value="480">480V</option>
          <option value="600">600V</option>
          <option value="4160">4.16kV</option>
        </select>
      )}

      {selectedFrom !== undefined && onFromChange && (
        <select
          value={selectedFrom}
          onChange={(e) => onFromChange(e.target.value)}
          className="px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-600"
        >
          <option value="Any">From ▼</option>
          <option value="MCC-1">MCC-1</option>
          <option value="MCC-2">MCC-2</option>
          <option value="Panel-A">Panel-A</option>
          <option value="Panel-B">Panel-B</option>
        </select>
      )}

      {selectedTo !== undefined && onToChange && (
        <select
          value={selectedTo}
          onChange={(e) => onToChange(e.target.value)}
          className="px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-600"
        >
          <option value="Any">To ▼</option>
          <option value="Motor-1">Motor-1</option>
          <option value="Motor-2">Motor-2</option>
          <option value="Light-Panel">Light-Panel</option>
          <option value="Instrument">Instrument</option>
        </select>
      )}

      {selectedRoute !== undefined && onRouteChange && (
        <select
          value={selectedRoute}
          onChange={(e) => onRouteChange(e.target.value)}
          className="px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-600"
        >
          <option value="Any">Route ▼</option>
          <option value="Overhead">Overhead</option>
          <option value="Underground">Underground</option>
          <option value="Cable Tray">Cable Tray</option>
          <option value="Conduit">Conduit</option>
        </select>
      )}

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-300 rounded hover:bg-slate-100 transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
};

export default FilterBar;