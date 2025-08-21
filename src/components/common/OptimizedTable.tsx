import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useVirtualizedList } from '../../hooks/useVirtualizedList';
import { useDebouncedCallback } from '../../hooks/useDebounce';
import { useFilterWorker } from '../../hooks/useWebWorker';
import { colors, spacing, typography } from '../../theme';

interface Column<T> {
  key: keyof T;
  header: string;
  width?: number;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'text' | 'number' | 'date' | 'boolean';
}

interface OptimizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  height?: number;
  rowHeight?: number;
  onRowClick?: (item: T, index: number) => void;
  onRowSelect?: (selectedItems: T[]) => void;
  selectable?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
  pageSize?: number; // For pagination fallback
}

export function OptimizedTable<T extends Record<string, any>>({
  data,
  columns,
  height = 400,
  rowHeight = 40,
  onRowClick,
  onRowSelect,
  selectable = false,
  searchable = false,
  sortable = true,
  className = '',
  emptyMessage = 'No data available',
  loading = false,
  pageSize = 100
}: OptimizedTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [processedData, setProcessedData] = useState<T[]>(data);
  const [isProcessing, setIsProcessing] = useState(false);

  const { filterData, sortData, isAvailable: isWorkerAvailable } = useFilterWorker();

  // Process data with web worker when available, fallback to synchronous processing
  const processData = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      let result = data;

      // Apply search filter
      if (searchTerm.trim()) {
        const searchableColumns = columns.filter(col => col.filterable !== false);
        if (isWorkerAvailable()) {
          const filters = searchableColumns.map(col => ({
            field: String(col.key),
            type: col.type || 'text',
            operator: 'contains',
            value: searchTerm,
            caseSensitive: false
          }));
          
          const filterResult = await filterData(result, filters);
          result = filterResult.filteredData;
        } else {
          // Fallback to synchronous search
          const term = searchTerm.toLowerCase();
          result = result.filter(item =>
            searchableColumns.some(col => {
              const value = item[col.key];
              return value && String(value).toLowerCase().includes(term);
            })
          );
        }
      }

      // Apply sorting
      if (sortConfig) {
        if (isWorkerAvailable()) {
          const sortResult = await sortData(result, {
            field: String(sortConfig.key),
            direction: sortConfig.direction
          });
          result = sortResult.sortedData;
        } else {
          // Fallback to synchronous sorting
          result = [...result].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
            if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
            
            let comparison = 0;
            if (typeof aValue === 'string' && typeof bValue === 'string') {
              comparison = aValue.localeCompare(bValue);
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
              comparison = aValue - bValue;
            } else {
              comparison = String(aValue).localeCompare(String(bValue));
            }
            
            return sortConfig.direction === 'asc' ? comparison : -comparison;
          });
        }
      }

      setProcessedData(result);
    } catch (error) {
      console.error('Error processing table data:', error);
      setProcessedData(data);
    } finally {
      setIsProcessing(false);
    }
  }, [data, searchTerm, sortConfig, columns, filterData, sortData, isWorkerAvailable]);

  // Debounced data processing
  const debouncedProcessData = useDebouncedCallback(processData, 300);

  // Process data when dependencies change
  useEffect(() => {
    debouncedProcessData();
  }, [debouncedProcessData]);

  // Virtualization
  const {
    visibleItems,
    startIndex,
    containerProps,
    itemProps,
    shouldVirtualize
  } = useVirtualizedList(processedData, {
    itemHeight: rowHeight,
    containerHeight: height - 80, // Account for header and search
    threshold: 50
  });

  // Handle sorting
  const handleSort = useCallback((columnKey: keyof T) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column || column.sortable === false) return;

    setSortConfig(prev => {
      if (prev?.key === columnKey) {
        return {
          key: columnKey,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key: columnKey, direction: 'asc' };
    });
  }, [columns]);

  // Handle row selection
  const handleRowSelect = useCallback((index: number, selected: boolean) => {
    if (!selectable) return;

    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(index);
      } else {
        newSet.delete(index);
      }
      
      if (onRowSelect) {
        const selectedItems = Array.from(newSet).map(i => processedData[i]).filter(Boolean);
        onRowSelect(selectedItems);
      }
      
      return newSet;
    });
  }, [selectable, onRowSelect, processedData]);

  // Handle select all
  const handleSelectAll = useCallback((selected: boolean) => {
    if (!selectable) return;

    if (selected) {
      const allIndices = new Set(processedData.map((_, index) => index));
      setSelectedRows(allIndices);
      if (onRowSelect) {
        onRowSelect(processedData);
      }
    } else {
      setSelectedRows(new Set());
      if (onRowSelect) {
        onRowSelect([]);
      }
    }
  }, [selectable, onRowSelect, processedData]);

  // Calculate column widths
  const totalWidth = useMemo(() => {
    return columns.reduce((sum, col) => sum + (col.width || 100), selectable ? 50 : 0);
  }, [columns, selectable]);

  const isAllSelected = selectedRows.size > 0 && selectedRows.size === processedData.length;
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < processedData.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: colors.primary[600] }}></div>
          <div style={{ color: colors.gray[600], fontSize: typography.fontSize.sm }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`} style={{ height }}>
      {/* Search bar */}
      {searchable && (
        <div className="p-3 border-b border-gray-200" style={{ backgroundColor: colors.gray[50] }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Table header */}
      <div 
        className="flex items-center border-b border-gray-200" 
        style={{ 
          backgroundColor: colors.gray[50],
          height: rowHeight,
          minWidth: totalWidth
        }}
      >
        {selectable && (
          <div className="w-12 flex items-center justify-center">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isIndeterminate;
              }}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="h-4 w-4"
            />
          </div>
        )}
        
        {columns.map((column) => (
          <div
            key={String(column.key)}
            className={`flex items-center px-3 border-r border-gray-200 ${sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''}`}
            style={{ 
              width: column.width || 100,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.gray[700]
            }}
            onClick={() => sortable && handleSort(column.key)}
          >
            <span className="truncate">{column.header}</span>
            {sortable && sortConfig?.key === column.key && (
              <span className="ml-1">
                {sortConfig.direction === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Table body */}
      {processedData.length === 0 ? (
        <div className="flex items-center justify-center flex-1" style={{ color: colors.gray[500] }}>
          {isProcessing ? 'Searching...' : emptyMessage}
        </div>
      ) : (
        <div {...containerProps}>
          <div style={{ height: shouldVirtualize ? processedData.length * rowHeight : 'auto' }}>
            {visibleItems.map((item, index) => {
              const actualIndex = shouldVirtualize ? startIndex + index : index;
              const isSelected = selectedRows.has(actualIndex);
              
              return (
                <div
                  {...(shouldVirtualize ? itemProps(index) : { key: actualIndex })}
                  className={`flex items-center border-b border-gray-100 ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${isSelected ? 'bg-blue-50' : ''}`}
                  style={{ 
                    height: rowHeight,
                    minWidth: totalWidth,
                    ...(shouldVirtualize ? {} : {})
                  }}
                  onClick={() => onRowClick?.(item, actualIndex)}
                >
                  {selectable && (
                    <div className="w-12 flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleRowSelect(actualIndex, e.target.checked);
                        }}
                        className="h-4 w-4"
                      />
                    </div>
                  )}
                  
                  {columns.map((column) => (
                    <div
                      key={String(column.key)}
                      className="px-3 border-r border-gray-100 truncate"
                      style={{ 
                        width: column.width || 100,
                        fontSize: typography.fontSize.sm,
                        color: colors.gray[900]
                      }}
                      title={String(item[column.key] || '')}
                    >
                      {column.render ? 
                        column.render(item[column.key], item, actualIndex) : 
                        String(item[column.key] || '')
                      }
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status bar */}
      <div 
        className="flex items-center justify-between px-3 py-2 border-t border-gray-200" 
        style={{ 
          backgroundColor: colors.gray[50],
          fontSize: typography.fontSize.xs,
          color: colors.gray[600]
        }}
      >
        <div>
          {processedData.length} {processedData.length === 1 ? 'row' : 'rows'}
          {searchTerm && data.length !== processedData.length && ` (filtered from ${data.length})`}
          {isProcessing && ' - Processing...'}
        </div>
        
        {selectedRows.size > 0 && (
          <div>
            {selectedRows.size} selected
          </div>
        )}
        
        {shouldVirtualize && (
          <div>
            Virtualized (showing {visibleItems.length} of {processedData.length})
          </div>
        )}
      </div>
    </div>
  );
}

export default OptimizedTable;