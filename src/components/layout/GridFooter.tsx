import React from 'react';

interface GridFooterProps {
  totalCables: number;
  selectedCount: number;
  filteredCount?: number;
  validationCounts?: {
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
  activeTab: string;
}

const GridFooter: React.FC<GridFooterProps> = ({
  totalCables,
  selectedCount,
  filteredCount,
  validationCounts,
  activeTab
}) => {
  // Calculate validation status
  const hasValidationErrors = validationCounts && validationCounts.errorCount > 0;
  const hasValidationWarnings = validationCounts && validationCounts.warningCount > 0;
  
  let validationStatus = 'All data validated';
  if (hasValidationErrors) {
    validationStatus = `${validationCounts!.errorCount} error${validationCounts!.errorCount !== 1 ? 's' : ''}`;
  } else if (hasValidationWarnings) {
    validationStatus = `${validationCounts!.warningCount} warning${validationCounts!.warningCount !== 1 ? 's' : ''}`;
  }

  // Get current tab display name
  const getTabDisplayName = (tab: string) => {
    switch (tab) {
      case 'cables': return 'cables';
      case 'io': return 'I/O points';
      case 'conduits': return 'conduits';
      case 'loads': return 'loads';
      default: return 'items';
    }
  };

  const itemName = getTabDisplayName(activeTab);
  const displayCount = filteredCount !== undefined ? filteredCount : totalCables;

  return (
    <div className="h-7 bg-slate-50 border-t border-slate-200 flex items-center justify-between px-4 text-xs text-slate-600">
      {/* Left: Item count and selection */}
      <div className="flex items-center gap-4">
        <span>
          {displayCount} {itemName}
          {filteredCount !== undefined && filteredCount !== totalCables && (
            <span className="text-slate-500"> of {totalCables}</span>
          )}
        </span>
        {selectedCount > 0 && (
          <>
            <span className="text-slate-400">•</span>
            <span>{selectedCount} selected</span>
          </>
        )}
      </div>

      {/* Right: Validation status */}
      <div className="flex items-center gap-2">
        <span>Page 1 of 1</span>
        <span className="text-slate-400">•</span>
        <span className={`
          ${hasValidationErrors ? 'text-red-600' : 
            hasValidationWarnings ? 'text-amber-600' : 
            'text-green-600'}
        `}>
          {validationStatus}
        </span>
      </div>
    </div>
  );
};

export default GridFooter;