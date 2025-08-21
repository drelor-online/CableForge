import React, { useState, useRef, useEffect } from 'react';
import { AppState } from '../../types';
import RevisionControls from '../revision/RevisionControls';
import { FileMenu } from '../menu/FileMenu';
import { Search, Settings, Download, Upload, ChevronDown, FileText, Database, BarChart3 } from 'lucide-react';

interface CompactHeaderProps {
  activeTab: AppState['activeTab'];
  onTabChange: (tab: AppState['activeTab']) => void;
  validationCounts?: {
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
  onExport: () => void;
  onMultiSheetExport?: () => void;
  onImport?: () => void;
  onOpenAutoNumbering?: () => void;
  onOpenFindReplace?: () => void;
  onShowRevisionHistory?: () => void;
  onCreateCheckpoint?: () => void;
  // Project menu handlers
  onNewProject?: () => void;
  onSaveProject?: () => void;
  onSaveProjectAs?: () => void;
  onOpenProject?: () => void;
  onSaveAsTemplate?: () => void;
  // Quick export handlers
  onQuickExportAll?: () => void;
  onQuickExportSummary?: () => void;
  onQuickExportCSV?: () => void;
  isLoading?: boolean;
}

const CompactHeader: React.FC<CompactHeaderProps> = ({
  activeTab,
  onTabChange,
  validationCounts,
  onExport,
  onMultiSheetExport,
  onImport,
  onOpenAutoNumbering,
  onOpenFindReplace,
  onShowRevisionHistory,
  onCreateCheckpoint,
  onNewProject,
  onSaveProject,
  onSaveProjectAs,
  onOpenProject,
  onSaveAsTemplate,
  onQuickExportAll,
  onQuickExportSummary,
  onQuickExportCSV,
  isLoading = false
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
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
    { key: 'trays' as const, label: 'Trays' },
    { key: 'loads' as const, label: 'Analysis' },
  ];

  return (
    <div className="h-9 bg-slate-700 flex items-center justify-between px-4 border-b border-slate-600">
      {/* Left: File Menu + Navigation Pills */}
      <div className="flex items-center gap-4">
        {/* File Menu */}
        <div className="text-white">
          <FileMenu
            onNewProject={onNewProject}
            onSaveProject={onSaveProject}
            onSaveProjectAs={onSaveProjectAs}
            onOpenProject={onOpenProject}
            onSaveAsTemplate={onSaveAsTemplate}
            isLoading={isLoading}
          />
        </div>
        
        {/* Navigation Pills */}
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
      </div>

      {/* Right: Revision Controls + Integrity Indicator + Actions */}
      <div className="flex items-center gap-4">
        {/* Revision Controls */}
        {onShowRevisionHistory && onCreateCheckpoint && (
          <RevisionControls
            onShowHistory={onShowRevisionHistory}
            onCreateCheckpoint={onCreateCheckpoint}
          />
        )}

        {/* Engineering Integrity Bar */}
        <div className="flex items-center gap-2 text-white/80">
          <span className="text-xs">Integrity</span>
          <div className="w-8 h-1 bg-white/20 rounded-full overflow-hidden">
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
        <div className="flex gap-1.5">
          {onOpenFindReplace && activeTab === 'cables' && (
            <button
              onClick={onOpenFindReplace}
              className="p-1.5 text-xs font-medium bg-white/10 text-white border border-white/20 rounded hover:bg-white/20 transition-colors"
              title="Find & Replace"
            >
              <Search className="h-4 w-4" />
            </button>
          )}
          {onOpenAutoNumbering && activeTab === 'cables' && (
            <button
              onClick={onOpenAutoNumbering}
              className="p-1.5 text-xs font-medium bg-white/10 text-white border border-white/20 rounded hover:bg-white/20 transition-colors"
              title="Auto-numbering Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
          {onImport && activeTab === 'cables' && (
            <button
              onClick={onImport}
              className="px-2.5 py-1.5 text-xs font-medium bg-white/10 text-white border border-white/20 rounded hover:bg-white/20 transition-colors flex items-center gap-1"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
          )}
          {/* Enhanced Export Menu */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-2.5 py-1.5 text-xs font-medium bg-white/10 text-white border border-white/20 rounded hover:bg-white/20 transition-colors flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className="h-3 w-3 ml-1" />
            </button>

            {/* Export Dropdown Menu */}
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  {/* Multi-Sheet Export */}
                  {onMultiSheetExport && (
                    <button
                      onClick={() => {
                        onMultiSheetExport();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                    >
                      <Database className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Multi-Sheet Export</div>
                        <div className="text-xs text-gray-500">Complete project workbook</div>
                      </div>
                    </button>
                  )}
                  
                  {/* Single Sheet Export */}
                  <button
                    onClick={() => {
                      onExport();
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Current Tab Export</div>
                      <div className="text-xs text-gray-500">Export active data only</div>
                    </div>
                  </button>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  {/* Quick Export Options */}
                  <div className="px-4 py-2">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Quick Export</div>
                    {onQuickExportAll && (
                      <button
                        onClick={() => {
                          onQuickExportAll();
                          setShowExportMenu(false);
                        }}
                        className="w-full text-left text-xs text-gray-600 hover:text-gray-800 py-1"
                      >
                        ↗ Export All Data
                      </button>
                    )}
                    {onQuickExportSummary && (
                      <button
                        onClick={() => {
                          onQuickExportSummary();
                          setShowExportMenu(false);
                        }}
                        className="w-full text-left text-xs text-gray-600 hover:text-gray-800 py-1"
                      >
                        📊 Summary Report Only
                      </button>
                    )}
                    {onQuickExportCSV && (
                      <button
                        onClick={() => {
                          onQuickExportCSV();
                          setShowExportMenu(false);
                        }}
                        className="w-full text-left text-xs text-gray-600 hover:text-gray-800 py-1"
                      >
                        📄 Export to CSV
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactHeader;