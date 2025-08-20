import React, { useState } from 'react';
import { AppState } from '../../types';
import CompactHeader from './CompactHeader';
import FilterBar from './FilterBar';
import GridFooter from './GridFooter';

interface AppShellProps {
  appState: AppState;
  onTabChange: (tab: AppState['activeTab']) => void;
  onExport: () => void;
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
}

const AppShell: React.FC<AppShellProps> = ({
  appState,
  onTabChange,
  onExport,
  children,
  currentViewStats,
  projectTotals,
  validationCounts,
  onFiltersChange,
  onOpenAutoNumbering
}) => {

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFunction, setSelectedFunction] = useState('Any');
  const [selectedVoltage, setSelectedVoltage] = useState('Any');
  const [selectedFrom, setSelectedFrom] = useState('Any');
  const [selectedTo, setSelectedTo] = useState('Any');
  const [selectedRoute, setSelectedRoute] = useState('Any');

  // Handle filter changes
  const handleFiltersChange = () => {
    if (onFiltersChange) {
      onFiltersChange({
        searchTerm,
        selectedFunction,
        selectedVoltage,
        selectedFrom,
        selectedTo,
        selectedRoute
      });
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedFunction('Any');
    setSelectedVoltage('Any');
    setSelectedFrom('Any');
    setSelectedTo('Any');
    setSelectedRoute('Any');
    handleFiltersChange();
  };

  // Call handleFiltersChange whenever filter values change
  React.useEffect(() => {
    handleFiltersChange();
  }, [searchTerm, selectedFunction, selectedVoltage, selectedFrom, selectedTo, selectedRoute]);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Compact Header */}
      <CompactHeader
        activeTab={appState.activeTab}
        onTabChange={onTabChange}
        validationCounts={validationCounts}
        onExport={onExport}
        onOpenAutoNumbering={onOpenAutoNumbering}
      />
      
      {/* Filter Bar - only show on cable tab for now */}
      {appState.activeTab === 'cables' && (
        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedFunction={selectedFunction}
          onFunctionChange={setSelectedFunction}
          selectedVoltage={selectedVoltage}
          onVoltageChange={setSelectedVoltage}
          selectedFrom={selectedFrom}
          onFromChange={setSelectedFrom}
          selectedTo={selectedTo}
          onToChange={setSelectedTo}
          selectedRoute={selectedRoute}
          onRouteChange={setSelectedRoute}
          onClearFilters={handleClearFilters}
        />
      )}
      
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