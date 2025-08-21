import React from 'react';
import { AppState } from '../../types';
import CompactHeader from './CompactHeader';
import GridFooter from './GridFooter';

interface AppShellProps {
  appState: AppState;
  onTabChange: (tab: AppState['activeTab']) => void;
  onExport: () => void;
  onMultiSheetExport?: () => void;
  onImport?: () => void;
  children: React.ReactNode;
  // Add optional data for GridFooter
  currentViewStats?: {
    displayed: number;
    selected: number;
    filtered: number;
  };
  projectTotals?: {
    cables: number;
    ioPoints: number;
    conduits: number;
    loads: number;
    trays: number;
  };
  validationCounts?: {
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
  // Filter props
  onFiltersChange?: (filters: {
    searchTerm: string;
    selectedFunction: string;
    selectedVoltage: string;
    selectedFrom: string;
    selectedTo: string;
    selectedRoute: string;
  }) => void;
  // Auto-numbering settings
  onOpenAutoNumbering?: () => void;
  // Find & replace
  onOpenFindReplace?: () => void;
  // Revision control
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
}

const AppShell: React.FC<AppShellProps> = ({
  appState,
  onTabChange,
  onExport,
  onMultiSheetExport,
  onImport,
  children,
  currentViewStats,
  projectTotals,
  validationCounts,
  onFiltersChange,
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
}) => {


  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Compact Header */}
      <CompactHeader
        activeTab={appState.activeTab}
        onTabChange={onTabChange}
        validationCounts={validationCounts}
        onExport={onExport}
        onMultiSheetExport={onMultiSheetExport}
        onImport={onImport}
        onOpenAutoNumbering={onOpenAutoNumbering}
        onOpenFindReplace={onOpenFindReplace}
        onShowRevisionHistory={onShowRevisionHistory}
        onCreateCheckpoint={onCreateCheckpoint}
        onNewProject={onNewProject}
        onSaveProject={onSaveProject}
        onSaveProjectAs={onSaveProjectAs}
        onOpenProject={onOpenProject}
        onSaveAsTemplate={onSaveAsTemplate}
        onQuickExportAll={onQuickExportAll}
        onQuickExportSummary={onQuickExportSummary}
        onQuickExportCSV={onQuickExportCSV}
        isLoading={appState.isLoading}
      />
      
      {/* Main Content Area - fills remaining space */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      
      {/* Grid Footer */}
      <GridFooter
        totalCables={projectTotals?.cables || 0}
        selectedCount={currentViewStats?.selected || 0}
        filteredCount={currentViewStats?.filtered}
        validationCounts={validationCounts}
        activeTab={appState.activeTab}
      />
    </div>
  );
};

export default AppShell;