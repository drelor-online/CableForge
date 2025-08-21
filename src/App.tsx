import React, { useCallback, useEffect, useState } from 'react';
import AppShell from './components/layout/AppShell';
import CableTable from './components/tables/CableTable';
import EditCableModal from './components/modals/EditCableModal';
import BulkEditModal from './components/modals/BulkEditModal';
import CableLibraryModal from './components/modals/CableLibraryModal';
import AutoNumberingModal from './components/modals/AutoNumberingModal';
import FindReplaceModal from './components/modals/FindReplaceModal';
import { useAppStore } from './stores/useAppStore';
import { useDatabaseStore } from './stores/useDatabaseStore';
import { validationService } from './services/validation-service';
import { useUI } from './contexts/UIContext';
import { Cable, CableTypeLibrary } from './types';
import { AutoNumberingSettings } from './types/settings';

function App() {
  const { showSuccess, showError, showInfo } = useUI();
  
  const {
    activeTab,
    isLoading: appLoading,
    saveStatus,
    lastSaved,
    setActiveTab,
    // setLoading,
    setSaveStatus,
    setLastSaved
  } = useAppStore();

  const {
    db,
    project,
    cables,
    selectedCables,
    isInitializing,
    isLoading: dbLoading,
    error,
    initializeDatabase,
    addCable,
    updateCable,
    deleteCable,
    setSelectedCables,
    getNextCableTag,
    newProject,
    openProject,
    saveProject,
    saveProjectAs,
    clearError
  } = useDatabaseStore();

  // Validation state
  const [validationCounts, setValidationCounts] = useState<{
    errorCount: number;
    warningCount: number;
    infoCount: number;
  }>({ errorCount: 0, warningCount: 0, infoCount: 0 });

  // Filter state for cables
  const [cableFilters, setCableFilters] = useState({
    searchTerm: '',
    selectedFunction: 'Any',
    selectedVoltage: 'Any',
    selectedFrom: 'Any',
    selectedTo: 'Any',
    selectedRoute: 'Any'
  });

  // Modal states
  const [showEditCableModal, setShowEditCableModal] = useState(false);
  const [editingCable, setEditingCable] = useState<Cable | null>(null);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showAutoNumberingModal, setShowAutoNumberingModal] = useState(false);
  const [showFindReplaceModal, setShowFindReplaceModal] = useState(false);

  // Initialize database on mount
  useEffect(() => {
    if (!db && !isInitializing) {
      console.log('App.tsx: Initializing database...');
      initializeDatabase();
    }
  }, [db, isInitializing, initializeDatabase]);

  // Debug effect to monitor cables changes
  useEffect(() => {
    console.log('App.tsx: Component re-rendered. Current state:', {
      db: !!db,
      isInitializing,
      isLoading: dbLoading,
      error,
      cablesCount: cables.length,
      cables: cables.slice(0, 2) // Show first 2 cables for debugging
    });
  });

  // Update validation counts when cables change
  useEffect(() => {
    console.log('App.tsx: cables state changed, length:', cables.length);
    console.log('App.tsx: cables data:', cables);
    
    const updateValidationCounts = async () => {
      if (cables.length === 0) {
        console.log('App.tsx: No cables, setting zero counts');
        setValidationCounts({ errorCount: 0, warningCount: 0, infoCount: 0 });
        return;
      }

      try {
        const counts = await validationService.getValidationSummary();
        console.log('App.tsx: validation counts:', counts);
        setValidationCounts(counts);
      } catch (error) {
        console.error('Failed to get validation summary:', error);
        setValidationCounts({ errorCount: 0, warningCount: 0, infoCount: 0 });
      }
    };

    updateValidationCounts();
  }, [cables]);

  // Combined loading state
  const isLoading = appLoading || dbLoading || isInitializing;

  // Handlers
  const handleTabChange = useCallback((tab: typeof activeTab) => {
    setActiveTab(tab);
  }, [setActiveTab]);

  const handleNewProject = useCallback(async () => {
    try {
      await newProject();
      console.log('New project created');
    } catch (error) {
      console.error('Failed to create new project:', error);
    }
  }, [newProject]);

  const handleSaveProject = useCallback(async () => {
    try {
      setSaveStatus('saving');
      await saveProject();
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to save project:', error);
    }
  }, [saveProject, setSaveStatus, setLastSaved]);

  const handleSaveProjectAs = useCallback(async () => {
    try {
      setSaveStatus('saving');
      await saveProjectAs();
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to save project as:', error);
    }
  }, [saveProjectAs, setSaveStatus, setLastSaved]);

  const handleOpenProject = useCallback(async () => {
    try {
      await openProject();
      console.log('Project opened');
    } catch (error) {
      console.error('Failed to open project:', error);
    }
  }, [openProject]);


  const handleEditCable = useCallback((cable: Cable) => {
    console.log('handleEditCable: Opening edit modal for cable:', cable.tag);
    setEditingCable(cable);
    setShowEditCableModal(true);
  }, []);

  const handleModalUpdateCable = useCallback(async (id: number, cableData: Partial<Cable>) => {
    console.log('handleModalUpdateCable: Updating cable with ID:', id, 'Data:', cableData);
    try {
      await updateCable(id, cableData);
      showSuccess(`Cable ${cableData.tag || editingCable?.tag} updated successfully!`);
    } catch (error) {
      console.error('handleModalUpdateCable: Failed to update cable:', error);
      throw error; // Re-throw so modal can handle it
    }
  }, [updateCable, editingCable?.tag, showSuccess]);

  const handleCloseEditCableModal = useCallback(() => {
    setShowEditCableModal(false);
    setEditingCable(null);
  }, []);

  const handleAddFromLibrary = useCallback(() => {
    console.log('handleAddFromLibrary: Opening library modal');
    setShowLibraryModal(true);
  }, []);

  const handleExport = useCallback(() => {
    console.log('handleExport: Export functionality to be implemented');
    // TODO: Implement export functionality
  }, []);

  const handleFiltersChange = useCallback((filters: {
    searchTerm: string;
    selectedFunction: string;
    selectedVoltage: string;
    selectedFrom: string;
    selectedTo: string;
    selectedRoute: string;
  }) => {
    setCableFilters(filters);
  }, []);

  const handleLibraryAddCable = useCallback(async (libraryItem: CableTypeLibrary) => {
    console.log('handleLibraryAddCable: Adding cable from library:', libraryItem);
    try {
      const nextTag = await getNextCableTag();
      const cableData: Partial<Cable> = {
        tag: nextTag,
        description: libraryItem.description || libraryItem.name,
        cableType: libraryItem.cableType,
        size: libraryItem.size,
        cores: libraryItem.cores,
        voltage: libraryItem.voltageRating,
        manufacturer: libraryItem.manufacturer,
        partNumber: libraryItem.partNumber,
        outerDiameter: libraryItem.outerDiameter,
        notes: `Added from library: ${libraryItem.name}`
      };
      const newCable = await addCable(cableData);
      showSuccess(`Cable ${newCable.tag} added from library successfully!`);
    } catch (error) {
      console.error('handleLibraryAddCable: Failed to add cable from library:', error);
      throw error;
    }
  }, [addCable, getNextCableTag, showSuccess]);

  const handleCloseLibraryModal = useCallback(() => {
    setShowLibraryModal(false);
  }, []);

  const handleBulkEdit = useCallback(() => {
    console.log('handleBulkEdit: Opening bulk edit modal with selected cables:', selectedCables);
    if (selectedCables.length === 0) {
      showError('Please select cables to edit');
      return;
    }
    setShowBulkEditModal(true);
  }, [selectedCables, showError]);

  const handleModalBulkUpdate = useCallback(async (updates: Partial<Cable>) => {
    console.log('handleModalBulkUpdate: Updating cables with data:', updates);
    try {
      // Update each selected cable
      const promises = selectedCables.map(id => updateCable(id, updates));
      await Promise.all(promises);
      showSuccess(`${selectedCables.length} cable${selectedCables.length !== 1 ? 's' : ''} updated successfully!`);
    } catch (error) {
      console.error('handleModalBulkUpdate: Failed to update cables:', error);
      throw error; // Re-throw so modal can handle it
    }
  }, [selectedCables, updateCable, showSuccess]);

  const handleCloseBulkEditModal = useCallback(() => {
    setShowBulkEditModal(false);
  }, []);

  const handleOpenAutoNumbering = useCallback(() => {
    setShowAutoNumberingModal(true);
  }, []);

  const handleCloseAutoNumbering = useCallback(() => {
    setShowAutoNumberingModal(false);
  }, []);

  const handleSaveAutoNumbering = useCallback((settings: AutoNumberingSettings) => {
    // Settings are automatically saved by the service
    // Could show a success message here if needed
    showSuccess('Auto-numbering settings saved successfully!');
    console.log('Auto-numbering settings saved:', settings);
  }, [showSuccess]);

  const handleOpenFindReplace = useCallback(() => {
    setShowFindReplaceModal(true);
  }, []);

  const handleCloseFindReplace = useCallback(() => {
    setShowFindReplaceModal(false);
  }, []);

  const handleFindReplace = useCallback(async (updates: { cableId: number; field: string; newValue: string }[]) => {
    console.log('handleFindReplace: Applying updates:', updates);
    try {
      // Group updates by cable ID
      const updatesByCable = updates.reduce((acc, update) => {
        if (!acc[update.cableId]) {
          acc[update.cableId] = {};
        }
        (acc[update.cableId] as any)[update.field] = update.newValue;
        return acc;
      }, {} as Record<number, Partial<Cable>>);

      // Apply updates
      const promises = Object.entries(updatesByCable).map(([cableId, cableUpdates]) => 
        updateCable(parseInt(cableId), cableUpdates)
      );
      
      await Promise.all(promises);
      showSuccess(`${updates.length} field${updates.length !== 1 ? 's' : ''} updated successfully!`);
    } catch (error) {
      console.error('handleFindReplace: Failed to apply updates:', error);
      throw error;
    }
  }, [updateCable, showSuccess]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'cables':
        console.log('App.tsx: Rendering CableTable with cables:', cables);
        return (
          <CableTable
            cables={cables}
            onCableUpdate={updateCable}
            onCableDelete={deleteCable}
            onCableEdit={handleEditCable}
            onBulkEdit={handleBulkEdit}
            selectedCables={selectedCables}
            onSelectionChange={setSelectedCables}
            onAddCable={addCable}
            onGetNextTag={getNextCableTag}
            searchTerm={cableFilters.searchTerm}
            functionFilter={cableFilters.selectedFunction}
            voltageFilter={cableFilters.selectedVoltage}
            fromFilter={cableFilters.selectedFrom}
            toFilter={cableFilters.selectedTo}
            routeFilter={cableFilters.selectedRoute}
          />
        );
      case 'io':
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-4">📡</div>
              <div className="text-lg font-medium mb-2">I/O List</div>
              <div className="text-sm">Coming soon...</div>
            </div>
          </div>
        );
      case 'conduits':
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-4">🔧</div>
              <div className="text-lg font-medium mb-2">Conduit Management</div>
              <div className="text-sm">Coming soon...</div>
            </div>
          </div>
        );
      case 'loads':
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <div className="text-lg font-medium mb-2">Load Management</div>
              <div className="text-sm">Coming soon...</div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <div className="text-lg font-medium mb-2">Reports & Export</div>
              <div className="text-sm">Coming soon...</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Show error overlay if there's a database error
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-red-600 text-4xl mb-4 text-center">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Database Error</h2>
          <p className="text-gray-600 mb-6 text-center">{error}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={clearError}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Dismiss
            </button>
            <button
              onClick={initializeDatabase}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate current view stats (TODO: get actual filtered count from CableTable)
  const currentViewStats = {
    displayed: cables.length, // This will be updated when we implement proper filtering
    selected: selectedCables.length,
    filtered: 0 // This will be updated when we implement proper filtering
  };

  // Calculate project totals (for now using actual data, could come from database summary)
  const projectTotals = {
    cables: cables.length,
    ioPoints: 0, // TODO: implement I/O points counting
    conduits: 0, // TODO: implement conduit counting
    loads: 0 // TODO: implement load counting
  };

  return (
    <>
      <AppShell
        appState={{ project, activeTab, isLoading, saveStatus, lastSaved }}
        onTabChange={handleTabChange}
        onExport={handleExport}
        currentViewStats={currentViewStats}
        projectTotals={projectTotals}
        validationCounts={validationCounts}
        onFiltersChange={handleFiltersChange}
        onOpenAutoNumbering={handleOpenAutoNumbering}
        onOpenFindReplace={handleOpenFindReplace}
      >
        {renderTabContent()}
      </AppShell>

      {/* Modals */}
      <EditCableModal
        isOpen={showEditCableModal}
        onClose={handleCloseEditCableModal}
        onUpdate={handleModalUpdateCable}
        cable={editingCable}
        isLoading={isLoading}
      />

      <BulkEditModal
        isOpen={showBulkEditModal}
        onClose={handleCloseBulkEditModal}
        onUpdate={handleModalBulkUpdate}
        selectedCables={cables.filter(cable => cable.id && selectedCables.includes(cable.id))}
        isLoading={isLoading}
      />

      <CableLibraryModal
        isOpen={showLibraryModal}
        onClose={handleCloseLibraryModal}
        onAddFromLibrary={handleLibraryAddCable}
        isLoading={isLoading}
      />

      <AutoNumberingModal
        isOpen={showAutoNumberingModal}
        onClose={handleCloseAutoNumbering}
        onSave={handleSaveAutoNumbering}
      />

      <FindReplaceModal
        isOpen={showFindReplaceModal}
        onClose={handleCloseFindReplace}
        onReplace={handleFindReplace}
        cables={cables}
        isLoading={isLoading}
      />
    </>
  );
}

export default App;
