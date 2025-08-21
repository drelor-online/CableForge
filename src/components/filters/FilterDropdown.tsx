import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FilterCondition, filterService } from '../../services/filter-service';

interface FilterDropdownProps {
  field: string;
  headerName: string;
  type: FilterCondition['type'];
  data: any[];
  currentFilter?: FilterCondition;
  onFilterChange: (filter: FilterCondition | null) => void;
  className?: string;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  field,
  headerName,
  type,
  data,
  currentFilter,
  onFilterChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [operator, setOperator] = useState<FilterCondition['operator']>(
    currentFilter?.operator || (type === 'text' ? 'contains' : type === 'enum' ? 'in' : 'equals')
  );
  const [textValue, setTextValue] = useState(currentFilter?.value || '');
  const [numberValue, setNumberValue] = useState(currentFilter?.value || '');
  const [numberValue2, setNumberValue2] = useState(''); // For between operator
  const [selectedValues, setSelectedValues] = useState<string[]>(currentFilter?.values || []);
  const [caseSensitive, setCaseSensitive] = useState(currentFilter?.caseSensitive || false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get unique values for enum type filters
  const uniqueValues = useMemo(() => {
    if (type !== 'enum') return [];
    return filterService.getUniqueValues(data, field);
  }, [data, field, type]);

  // Get filter operator suggestions
  const operatorSuggestions = useMemo(() => {
    return filterService.getFilterSuggestions(field, type);
  }, [field, type]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle value selection for enum types
  const handleValueToggle = (value: string) => {
    setSelectedValues(prev => {
      if (prev.includes(value)) {
        return prev.filter(v => v !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedValues(uniqueValues);
  };

  const handleClearAll = () => {
    setSelectedValues([]);
  };

  // Apply filter
  const handleApplyFilter = () => {
    let filterValue: any;
    let filterValues: any[] | undefined;

    switch (type) {
      case 'text':
        if (!textValue.trim()) {
          onFilterChange(null);
          setIsOpen(false);
          return;
        }
        filterValue = textValue.trim();
        break;

      case 'number':
        if (operator === 'between') {
          if (!numberValue || !numberValue2) {
            onFilterChange(null);
            setIsOpen(false);
            return;
          }
          filterValue = [Number(numberValue), Number(numberValue2)];
        } else {
          if (!numberValue) {
            onFilterChange(null);
            setIsOpen(false);
            return;
          }
          filterValue = Number(numberValue);
        }
        break;

      case 'enum':
        if (selectedValues.length === 0) {
          onFilterChange(null);
          setIsOpen(false);
          return;
        }
        filterValues = selectedValues;
        filterValue = null;
        break;

      default:
        onFilterChange(null);
        setIsOpen(false);
        return;
    }

    const filter: FilterCondition = {
      field,
      type,
      operator,
      value: filterValue,
      values: filterValues,
      caseSensitive: type === 'text' ? caseSensitive : undefined
    };

    onFilterChange(filter);
    setIsOpen(false);
  };

  // Clear filter
  const handleClearFilter = () => {
    setTextValue('');
    setNumberValue('');
    setNumberValue2('');
    setSelectedValues([]);
    onFilterChange(null);
    setIsOpen(false);
  };

  // Check if filter is active
  const hasActiveFilter = currentFilter != null;
  const filteredCount = hasActiveFilter ? 
    filterService.applyFilters(data.map(item => ({ [field]: item[field] }))).length : 
    data.length;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full h-8 px-2 text-xs border rounded flex items-center justify-between
          hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500
          ${hasActiveFilter 
            ? 'bg-blue-50 border-blue-300 text-blue-700' 
            : 'bg-white border-gray-300 text-gray-700'
          }
        `}
        title={`Filter ${headerName}`}
      >
        <span className="truncate flex-1 text-left">
          {hasActiveFilter ? `${filteredCount} of ${data.length}` : 'All'}
        </span>
        <svg 
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 min-w-64 max-w-80"
        >
          <div className="p-3 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-medium text-sm text-gray-900">Filter {headerName}</span>
              {hasActiveFilter && (
                <button
                  onClick={handleClearFilter}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Operator Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Condition:
              </label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value as FilterCondition['operator'])}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {operatorSuggestions.map(suggestion => (
                  <option key={suggestion.operator} value={suggestion.operator}>
                    {suggestion.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Value Input Based on Type */}
            {type === 'text' && !['is_empty', 'is_not_empty'].includes(operator) && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Value:
                </label>
                <input
                  type="text"
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  placeholder="Enter text..."
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <label className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={caseSensitive}
                    onChange={(e) => setCaseSensitive(e.target.checked)}
                    className="mr-1 h-3 w-3"
                  />
                  <span className="text-xs text-gray-600">Case sensitive</span>
                </label>
              </div>
            )}

            {type === 'number' && !['is_empty', 'is_not_empty'].includes(operator) && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {operator === 'between' ? 'Range:' : 'Value:'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={numberValue}
                    onChange={(e) => setNumberValue(e.target.value)}
                    placeholder={operator === 'between' ? 'Min' : 'Enter number...'}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {operator === 'between' && (
                    <input
                      type="number"
                      value={numberValue2}
                      onChange={(e) => setNumberValue2(e.target.value)}
                      placeholder="Max"
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>
            )}

            {type === 'enum' && ['in', 'not_in'].includes(operator) && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-gray-700">
                    Values:
                  </label>
                  <div className="flex gap-1">
                    <button
                      onClick={handleSelectAll}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      All
                    </button>
                    <span className="text-xs text-gray-400">|</span>
                    <button
                      onClick={handleClearAll}
                      className="text-xs text-gray-600 hover:text-gray-800"
                    >
                      None
                    </button>
                  </div>
                </div>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded">
                  {uniqueValues.length === 0 ? (
                    <div className="p-2 text-xs text-gray-500 text-center">
                      No values available
                    </div>
                  ) : (
                    uniqueValues.map(value => (
                      <label
                        key={value}
                        className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedValues.includes(value)}
                          onChange={() => handleValueToggle(value)}
                          className="mr-2 h-3 w-3"
                        />
                        <span className="text-xs truncate flex-1">{value}</span>
                      </label>
                    ))
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {selectedValues.length} of {uniqueValues.length} selected
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyFilter}
                className="px-3 py-1 text-xs text-white bg-blue-600 border border-blue-600 rounded hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;