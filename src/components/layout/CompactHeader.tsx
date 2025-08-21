import React from 'react';
import { AppState } from '../../types';

interface CompactHeaderProps {
  activeTab: AppState['activeTab'];
  onTabChange: (tab: AppState['activeTab']) => void;
  validationCounts?: {
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
  onExport: () => void;
  onImport?: () => void;
  onOpenAutoNumbering?: () => void;
  onOpenFindReplace?: () => void;
}

const CompactHeader: React.FC<CompactHeaderProps> = ({
  activeTab,
  onTabChange,
  validationCounts,
  onExport,
  onImport,
  onOpenAutoNumbering,
  onOpenFindReplace
}) => {
  // Calculate overall integrity percentage
  const calculateIntegrityPercentage = () => {
    if (!validationCounts) return 100;
    
    const totalChecks = 6; // Based on original integrity panel
    const passedChecks = totalChecks - (validationCounts.errorCount + validationCounts.warningCount);
    return Math.max(0, Math.round((passedChecks / totalChecks) * 100));
  };

  const integrityPercentage = calculateIntegrityPercentage();

  const tabs = [
    { key: 'cables' as const, label: 'Cable Schedule' },
    { key: 'io' as const, label: 'I/O List' },
    { key: 'conduits' as const, label: 'Conduits' },
    { key: 'loads' as const, label: 'Analysis' },
  ];

  return (
    <div className="h-9 bg-slate-700 flex items-center justify-between px-4 border-b border-slate-600">
      {/* Left: Navigation Pills */}
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`
              px-3 py-1.5 text-xs font-medium rounded transition-all duration-200
              ${activeTab === tab.key
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Right: Integrity Indicator + Actions */}
      <div className="flex items-center gap-4">
        {/* Engineering Integrity Bar */}
        <div className="flex items-center gap-2 text-white/80">
          <span className="text-xs">Integrity</span>
          <div className="w-10 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                integrityPercentage >= 90 ? 'bg-green-400' :
                integrityPercentage >= 70 ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              style={{ width: `${integrityPercentage}%` }}
            />
          </div>
          <span className="text-xs font-medium">{integrityPercentage}%</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onOpenFindReplace && activeTab === 'cables' && (
            <button
              onClick={onOpenFindReplace}
              className="px-2 py-1 text-xs font-medium bg-white/10 text-white border border-white/20 rounded hover:bg-white/20 transition-colors"
              title="Find & Replace"
            >
              🔍
            </button>
          )}
          {onOpenAutoNumbering && activeTab === 'cables' && (
            <button
              onClick={onOpenAutoNumbering}
              className="px-2 py-1 text-xs font-medium bg-white/10 text-white border border-white/20 rounded hover:bg-white/20 transition-colors"
              title="Auto-numbering Settings"
            >
              ⚙️
            </button>
          )}
          {onImport && activeTab === 'cables' && (
            <button
              onClick={onImport}
              className="px-3 py-1 text-xs font-medium bg-white/10 text-white border border-white/20 rounded hover:bg-white/20 transition-colors"
            >
              Import
            </button>
          )}
          <button
            onClick={onExport}
            className="px-3 py-1 text-xs font-medium bg-white/10 text-white border border-white/20 rounded hover:bg-white/20 transition-colors"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompactHeader;