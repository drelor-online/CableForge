// Utility functions for Excel-like operations in AG-Grid
import { GridApi, CellRange } from 'ag-grid-community';

interface FillOptions {
  api: GridApi;
  direction: 'down' | 'right' | 'up' | 'left';
  ranges: CellRange[];
}

interface ClearOptions {
  api: GridApi;
  ranges: CellRange[];
}

/**
 * Fill selected range with value from first cell (like Excel's fill down/right)
 */
export const fillRange = ({ api, direction, ranges }: FillOptions): void => {
  if (!ranges || ranges.length === 0) return;

  // For now, just show an alert - full implementation requires AG-Grid Enterprise
  alert(`Fill ${direction} feature requires AG-Grid Enterprise edition. This is a placeholder for the functionality.`);
};

/**
 * Auto-fill series (increment numbers, dates, etc.)
 */
export const fillSeries = ({ api, direction, ranges }: FillOptions): void => {
  if (!ranges || ranges.length === 0) return;

  // For now, just show an alert - full implementation requires AG-Grid Enterprise
  alert(`Fill series feature requires AG-Grid Enterprise edition. This is a placeholder for the functionality.`);
};

/**
 * Clear contents of selected cells
 */
export const clearContents = ({ api, ranges }: ClearOptions): void => {
  if (!ranges || ranges.length === 0) return;

  // For now, just show an alert - full implementation requires AG-Grid Enterprise
  alert('Clear contents feature requires AG-Grid Enterprise edition. This is a placeholder for the functionality.');
};

/**
 * Copy range to clipboard in Excel format
 */
export const copyToClipboard = (api: GridApi, ranges: CellRange[]): void => {
  if (!ranges || ranges.length === 0) return;

  // AG-Grid community edition has built-in copy functionality
  alert('Copy feature is available via Ctrl+C in AG-Grid Community Edition.');
};

/**
 * Paste from clipboard with validation
 */
export const pasteFromClipboard = async (
  api: GridApi, 
  clipboardData: string, 
  targetRange: CellRange,
  validateFn?: (value: any, field: string) => boolean
): Promise<void> => {
  // For now, just show an alert - full implementation requires AG-Grid Enterprise
  alert('Paste feature requires AG-Grid Enterprise edition. This is a placeholder for the functionality.');
};

/**
 * Select entire column
 */
export const selectColumn = (api: GridApi, columnKey: string): void => {
  // For now, just show an alert - full implementation requires AG-Grid Enterprise
  alert('Column selection feature requires AG-Grid Enterprise edition. This is a placeholder for the functionality.');
};

/**
 * Keyboard navigation utilities
 */
export const handleKeyboardShortcuts = (
  event: KeyboardEvent, 
  api: GridApi, 
  onFillDown?: () => void,
  onFillRight?: () => void,
  onClearContents?: () => void
): boolean => {
  const { ctrlKey, code } = event;

  // Ctrl+A - Select All
  if (ctrlKey && code === 'KeyA') {
    event.preventDefault();
    api.selectAll();
    return true;
  }

  // Ctrl+D - Fill Down
  if (ctrlKey && code === 'KeyD') {
    event.preventDefault();
    onFillDown?.();
    return true;
  }

  // Ctrl+R - Fill Right
  if (ctrlKey && code === 'KeyR') {
    event.preventDefault();
    onFillRight?.();
    return true;
  }

  // Delete - Clear Contents
  if (code === 'Delete') {
    event.preventDefault();
    onClearContents?.();
    return true;
  }

  // F2 - Start Editing (handled by AG-Grid by default)
  if (code === 'F2') {
    // Let AG-Grid handle this
    return false;
  }

  return false;
};