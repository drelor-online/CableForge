import React, { useEffect, useRef } from 'react';
import { 
  Copy, 
  Clipboard, 
  ArrowDown, 
  ArrowRight, 
  TrendingUp, 
  Trash2,
  Plus,
  Minus
} from 'lucide-react';

export interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onFillDown?: () => void;
  onFillRight?: () => void;
  onFillSeries?: () => void;
  onClearContents?: () => void;
  onInsertRow?: () => void;
  onDeleteRow?: () => void;
  hasSelection?: boolean;
  canPaste?: boolean;
}

const TableContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onCopy,
  onPaste,
  onFillDown,
  onFillRight,
  onFillSeries,
  onClearContents,
  onInsertRow,
  onDeleteRow,
  hasSelection = false,
  canPaste = false
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position if menu would go off screen
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 1000
  };

  const handleMenuClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48"
      style={menuStyle}
    >
      {/* Copy */}
      <button
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        disabled={!hasSelection}
        onClick={() => onCopy && handleMenuClick(onCopy)}
      >
        <Copy className="w-4 h-4" />
        <span>Copy</span>
        <span className="ml-auto text-xs text-gray-400">Ctrl+C</span>
      </button>

      {/* Paste */}
      <button
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        disabled={!canPaste}
        onClick={() => onPaste && handleMenuClick(onPaste)}
      >
        <Clipboard className="w-4 h-4" />
        <span>Paste</span>
        <span className="ml-auto text-xs text-gray-400">Ctrl+V</span>
      </button>

      {/* Separator */}
      <div className="border-t border-gray-200 my-2" />

      {/* Fill Down */}
      <button
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        disabled={!hasSelection}
        onClick={() => onFillDown && handleMenuClick(onFillDown)}
      >
        <ArrowDown className="w-4 h-4" />
        <span>Fill Down</span>
        <span className="ml-auto text-xs text-gray-400">Ctrl+D</span>
      </button>

      {/* Fill Right */}
      <button
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        disabled={!hasSelection}
        onClick={() => onFillRight && handleMenuClick(onFillRight)}
      >
        <ArrowRight className="w-4 h-4" />
        <span>Fill Right</span>
        <span className="ml-auto text-xs text-gray-400">Ctrl+R</span>
      </button>

      {/* Fill Series */}
      <button
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        disabled={!hasSelection}
        onClick={() => onFillSeries && handleMenuClick(onFillSeries)}
      >
        <TrendingUp className="w-4 h-4" />
        <span>Fill Series</span>
      </button>

      {/* Clear Contents */}
      <button
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        disabled={!hasSelection}
        onClick={() => onClearContents && handleMenuClick(onClearContents)}
      >
        <Trash2 className="w-4 h-4" />
        <span>Clear Contents</span>
        <span className="ml-auto text-xs text-gray-400">Delete</span>
      </button>

      {/* Separator */}
      <div className="border-t border-gray-200 my-2" />

      {/* Insert Row */}
      <button
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        onClick={() => onInsertRow && handleMenuClick(onInsertRow)}
      >
        <Plus className="w-4 h-4" />
        <span>Insert Row</span>
      </button>

      {/* Delete Row */}
      <button
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:text-gray-400 disabled:cursor-not-allowed"
        disabled={!hasSelection}
        onClick={() => onDeleteRow && handleMenuClick(onDeleteRow)}
      >
        <Minus className="w-4 h-4" />
        <span>Delete Row</span>
      </button>
    </div>
  );
};

export default TableContextMenu;