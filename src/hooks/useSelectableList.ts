import { useState, useCallback, useMemo } from 'react';
import { SelectionState } from '../types/common';

interface UseSelectableListOptions<T> {
  initialSelection?: Set<T>;
  onChange?: (selection: Set<T>) => void;
  getKey?: (item: T) => string;
}

/**
 * Hook for managing selectable lists with select all/none functionality
 */
export function useSelectableList<T>(
  items: T[],
  options: UseSelectableListOptions<T> = {}
) {
  const { initialSelection = new Set(), onChange, getKey = (item) => String(item) } = options;
  
  const [selectedItems, setSelectedItems] = useState<Set<T>>(initialSelection);

  // Create key-to-item mapping for efficient lookups
  const itemMap = useMemo(() => {
    return new Map(items.map(item => [getKey(item), item]));
  }, [items, getKey]);

  const itemKeys = useMemo(() => {
    return items.map(getKey);
  }, [items, getKey]);

  const selectedKeys = useMemo(() => {
    return new Set(Array.from(selectedItems).map(getKey));
  }, [selectedItems, getKey]);

  // Calculate selection state
  const selectionState: SelectionState<T> = useMemo(() => {
    const selectedCount = selectedItems.size;
    const totalCount = items.length;
    
    return {
      selectedItems,
      selectAll: selectedCount === totalCount && totalCount > 0,
      indeterminate: selectedCount > 0 && selectedCount < totalCount,
    };
  }, [selectedItems, items.length]);

  // Toggle selection of a single item
  const toggleItem = useCallback((item: T) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(item)) {
        newSelection.delete(item);
      } else {
        newSelection.add(item);
      }
      onChange?.(newSelection);
      return newSelection;
    });
  }, [onChange]);

  // Toggle selection by key
  const toggleItemByKey = useCallback((key: string) => {
    const item = itemMap.get(key);
    if (item) {
      toggleItem(item);
    }
  }, [itemMap, toggleItem]);

  // Select all items
  const selectAll = useCallback(() => {
    const newSelection = new Set(items);
    setSelectedItems(newSelection);
    onChange?.(newSelection);
  }, [items, onChange]);

  // Deselect all items
  const selectNone = useCallback(() => {
    const newSelection = new Set<T>();
    setSelectedItems(newSelection);
    onChange?.(newSelection);
  }, [onChange]);

  // Toggle between select all and select none
  const toggleSelectAll = useCallback(() => {
    if (selectionState.selectAll) {
      selectNone();
    } else {
      selectAll();
    }
  }, [selectionState.selectAll, selectAll, selectNone]);

  // Select items that match a predicate
  const selectWhere = useCallback((predicate: (item: T) => boolean) => {
    const matchingItems = items.filter(predicate);
    const newSelection = new Set([...selectedItems, ...matchingItems]);
    setSelectedItems(newSelection);
    onChange?.(newSelection);
  }, [items, selectedItems, onChange]);

  // Deselect items that match a predicate
  const deselectWhere = useCallback((predicate: (item: T) => boolean) => {
    const newSelection = new Set(Array.from(selectedItems).filter(item => !predicate(item)));
    setSelectedItems(newSelection);
    onChange?.(newSelection);
  }, [selectedItems, onChange]);

  // Check if item is selected
  const isSelected = useCallback((item: T) => {
    return selectedItems.has(item);
  }, [selectedItems]);

  // Check if item is selected by key
  const isSelectedByKey = useCallback((key: string) => {
    return selectedKeys.has(key);
  }, [selectedKeys]);

  // Get selected items as array
  const getSelectedArray = useCallback(() => {
    return Array.from(selectedItems);
  }, [selectedItems]);

  // Get selected keys as array
  const getSelectedKeys = useCallback(() => {
    return Array.from(selectedKeys);
  }, [selectedKeys]);

  // Set selection directly
  const setSelection = useCallback((selection: T[] | Set<T>) => {
    const newSelection = Array.isArray(selection) ? new Set(selection) : selection;
    setSelectedItems(newSelection);
    onChange?.(newSelection);
  }, [onChange]);

  // Clear selection
  const clearSelection = useCallback(() => {
    selectNone();
  }, [selectNone]);

  // Invert selection
  const invertSelection = useCallback(() => {
    const newSelection = new Set(items.filter(item => !selectedItems.has(item)));
    setSelectedItems(newSelection);
    onChange?.(newSelection);
  }, [items, selectedItems, onChange]);

  return {
    // State
    ...selectionState,
    selectedCount: selectedItems.size,
    totalCount: items.length,
    
    // Actions
    toggleItem,
    toggleItemByKey,
    selectAll,
    selectNone,
    toggleSelectAll,
    selectWhere,
    deselectWhere,
    setSelection,
    clearSelection,
    invertSelection,
    
    // Queries
    isSelected,
    isSelectedByKey,
    getSelectedArray,
    getSelectedKeys,
  };
}

/**
 * Hook for managing column selection specifically
 */
export function useColumnSelection(
  columns: { field: string; headerName: string; visible?: boolean }[],
  options: { initialVisible?: string[]; onChange?: (visible: string[]) => void } = {}
) {
  const { initialVisible, onChange } = options;
  
  const visibleColumns = useMemo(() => {
    return columns.filter(col => col.visible !== false).map(col => col.field);
  }, [columns]);

  const selection = useSelectableList(
    columns.map(col => col.field),
    {
      initialSelection: new Set(initialVisible || visibleColumns),
      onChange: (selection) => onChange?.(Array.from(selection)),
    }
  );

  const availableColumns = useMemo(() => {
    return columns.map(col => ({
      ...col,
      selected: selection.isSelected(col.field),
    }));
  }, [columns, selection]);

  const getVisibleColumns = useCallback(() => {
    return columns.filter(col => selection.isSelected(col.field));
  }, [columns, selection]);

  const getHiddenColumns = useCallback(() => {
    return columns.filter(col => !selection.isSelected(col.field));
  }, [columns, selection]);

  return {
    ...selection,
    availableColumns,
    getVisibleColumns,
    getHiddenColumns,
    visibleCount: selection.selectedCount,
    hiddenCount: columns.length - selection.selectedCount,
  };
}

/**
 * Hook for managing row selection with optional key extraction
 */
export function useRowSelection<T extends Record<string, unknown>>(
  rows: T[],
  options: {
    keyField?: keyof T;
    initialSelection?: (string | number)[];
    onChange?: (selection: (string | number)[]) => void;
  } = {}
) {
  const { keyField = 'id', initialSelection = [], onChange } = options;
  
  const getRowKey = useCallback((row: T): string => {
    return String(row[keyField]);
  }, [keyField]);

  const rowKeys = useMemo(() => {
    return rows.map(getRowKey);
  }, [rows, getRowKey]);

  const selection = useSelectableList(rowKeys, {
    initialSelection: new Set(initialSelection.map(String)),
    onChange: (selection) => onChange?.(Array.from(selection)),
  });

  const getSelectedRows = useCallback(() => {
    const selectedKeys = selection.getSelectedKeys();
    return rows.filter(row => selectedKeys.includes(getRowKey(row)));
  }, [rows, selection, getRowKey]);

  const isRowSelected = useCallback((row: T) => {
    return selection.isSelected(getRowKey(row));
  }, [selection, getRowKey]);

  const toggleRow = useCallback((row: T) => {
    selection.toggleItem(getRowKey(row));
  }, [selection, getRowKey]);

  return {
    ...selection,
    getSelectedRows,
    isRowSelected,
    toggleRow,
    selectedRowKeys: selection.getSelectedKeys(),
  };
}