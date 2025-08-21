import React from 'react';
import { Edit2, Trash2, Download, CheckCircle, Copy, X } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  entityName?: string;
  onBulkEdit: () => void;
  onBulkDelete: () => void;
  onBulkExport: () => void;
  onBulkValidate?: () => void;
  onBulkDuplicate?: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  entityName = 'item',
  onBulkEdit,
  onBulkDelete,
  onBulkExport,
  onBulkValidate,
  onBulkDuplicate,
  onClearSelection,
  isLoading = false
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-0 z-10 bg-slate-700 border-t border-slate-600 shadow-lg">
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Selection info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm font-medium text-white">
                {selectedCount} {entityName}{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              onClick={onClearSelection}
              className="text-xs text-white/60 hover:text-white/80 underline"
              disabled={isLoading}
            >
              Clear selection
            </button>
          </div>

          {/* Bulk actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onBulkEdit}
              disabled={isLoading}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-white/10 border border-white/20 rounded hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Edit2 className="h-3 w-3" />
              Edit
            </button>

            {onBulkDuplicate && (
              <button
                onClick={onBulkDuplicate}
                disabled={isLoading}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-white/10 border border-white/20 rounded hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Copy className="h-3 w-3" />
                Duplicate
              </button>
            )}

            <button
              onClick={onBulkExport}
              disabled={isLoading}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-white/10 border border-white/20 rounded hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="h-3 w-3" />
              Export
            </button>

            {onBulkValidate && (
              <button
                onClick={onBulkValidate}
                disabled={isLoading}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-white/10 border border-white/20 rounded hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircle className="h-3 w-3" />
                Validate
              </button>
            )}

            {/* Destructive action - visually separated */}
            <div className="ml-2 pl-2 border-l border-white/20">
              <button
                onClick={onBulkDelete}
                disabled={isLoading}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-300 bg-red-500/10 border border-red-500/20 rounded hover:bg-red-500/20 hover:text-red-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Action hint */}
        <div className="mt-1 text-xs text-white/60">
          Use Shift+click to select ranges, Ctrl/Cmd+click for individual selection, Ctrl/Cmd+A to select all
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;