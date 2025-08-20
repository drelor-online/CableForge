import React from 'react';

interface BulkActionsBarProps {
  selectedCount: number;
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
                {selectedCount} cable{selectedCount !== 1 ? 's' : ''} selected
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
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>

            {onBulkDuplicate && (
              <button
                onClick={onBulkDuplicate}
                disabled={isLoading}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-white/10 border border-white/20 rounded hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Duplicate
              </button>
            )}

            <button
              onClick={onBulkExport}
              disabled={isLoading}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-white/10 border border-white/20 rounded hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>

            {onBulkValidate && (
              <button
                onClick={onBulkValidate}
                disabled={isLoading}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-white/10 border border-white/20 rounded hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
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