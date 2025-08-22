import { useEffect, useCallback } from 'react';
import { Table } from '@tanstack/react-table';
import { SelectionRange } from './useTableSelection';

export interface KeyboardShortcutActions {
  onCopy?: () => void;
  onPaste?: () => void;
  onFillDown?: () => void;
  onFillRight?: () => void;
  onClearContents?: () => void;
  onSelectAll?: () => void;
  onDelete?: () => void;
  onStartEdit?: (rowIndex: number, columnKey: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

/**
 * Custom hook for handling Excel-like keyboard shortcuts
 */
export const useKeyboardShortcuts = <TData>(
  table: Table<TData>,
  selectedRange: SelectionRange | null,
  actions: KeyboardShortcutActions
) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { ctrlKey, shiftKey, key, code } = event;
    
    // Ignore if user is typing in an input field
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    // Ctrl+C - Copy
    if (ctrlKey && key === 'c') {
      event.preventDefault();
      actions.onCopy?.();
      return;
    }

    // Ctrl+V - Paste
    if (ctrlKey && key === 'v') {
      event.preventDefault();
      actions.onPaste?.();
      return;
    }

    // Ctrl+A - Select All
    if (ctrlKey && key === 'a') {
      event.preventDefault();
      actions.onSelectAll?.();
      return;
    }

    // Ctrl+D - Fill Down
    if (ctrlKey && key === 'd') {
      event.preventDefault();
      if (selectedRange) {
        actions.onFillDown?.();
      }
      return;
    }

    // Ctrl+R - Fill Right
    if (ctrlKey && key === 'r') {
      event.preventDefault();
      if (selectedRange) {
        actions.onFillRight?.();
      }
      return;
    }

    // Delete - Clear Contents
    if (key === 'Delete') {
      event.preventDefault();
      if (selectedRange) {
        actions.onClearContents?.();
      }
      return;
    }

    // F2 - Start editing current cell
    if (key === 'F2') {
      event.preventDefault();
      if (selectedRange && selectedRange.start) {
        actions.onStartEdit?.(selectedRange.start.row, selectedRange.start.column);
      }
      return;
    }

    // Enter - Save edit (when editing)
    if (key === 'Enter' && target.tagName === 'INPUT') {
      event.preventDefault();
      actions.onSaveEdit?.();
      return;
    }

    // Escape - Cancel edit (when editing)
    if (key === 'Escape' && target.tagName === 'INPUT') {
      event.preventDefault();
      actions.onCancelEdit?.();
      return;
    }

    // Ctrl+Z - Undo
    if (ctrlKey && key === 'z') {
      event.preventDefault();
      actions.onUndo?.();
      return;
    }

    // Ctrl+Y - Redo
    if (ctrlKey && key === 'y') {
      event.preventDefault();
      actions.onRedo?.();
      return;
    }

    // Escape - Clear Selection
    if (key === 'Escape') {
      event.preventDefault();
      // Clear selection logic would be handled by parent
      return;
    }

    // Arrow keys for navigation (basic implementation)
    // More sophisticated navigation would require focus management
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      // Let the default behavior handle this for now
      // In a full implementation, we'd manage cell focus here
      return;
    }

    // Tab - Move to next cell
    if (key === 'Tab') {
      event.preventDefault();
      // Tab navigation would be implemented here
      return;
    }

    // Enter - Move down or start editing
    if (key === 'Enter') {
      event.preventDefault();
      // Enter navigation would be implemented here
      return;
    }

    // F2 - Start editing (if applicable)
    if (key === 'F2') {
      event.preventDefault();
      // Start editing current cell
      return;
    }

  }, [selectedRange, actions]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    // Return any utilities if needed
  };
};