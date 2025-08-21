import React, { useCallback, useEffect, useState } from 'react';
import AppShell from './components/layout/AppShell';
import CableTable from './components/tables/CableTable';
import IOTable from './components/tables/IOTable';
import LoadTable from './components/tables/LoadTable';
import ConduitTable from './components/tables/ConduitTable';
import TrayTable from './components/tables/TrayTable';
import EngineeringDashboard from './components/dashboard/EngineeringDashboard';
import EditCableModal from './components/modals/EditCableModal';
import { EditIOPointModal } from './components/modals/EditIOPointModal';
import { EditLoadModal } from './components/modals/EditLoadModal';
import { EditConduitModal } from './components/modals/EditConduitModal';
import { EditTrayModal } from './components/modals/EditTrayModal';
import BulkEditModal from './components/modals/BulkEditModal';
import BulkEditConduitModal from './components/modals/BulkEditConduitModal';
import BulkEditTrayModal from './components/modals/BulkEditTrayModal';
import BulkEditLoadModal from './components/modals/BulkEditLoadModal';
import BulkEditIOModal from './components/modals/BulkEditIOModal';
import CableLibraryModal from './components/modals/CableLibraryModal';
import AutoNumberingModal from './components/modals/AutoNumberingModal';
import FindReplaceModal from './components/modals/FindReplaceModal';
import ExportBuilderModal from './components/modals/ExportBuilderModal';
import MultiSheetExportModal from './components/modals/MultiSheetExportModal';
import ImportWizardModal from './components/modals/ImportWizardModal';
import RevisionHistoryPanel from './components/revision/RevisionHistoryPanel';
import RevisionComparisonModal from './components/revision/RevisionComparisonModal';
import TemplateSelectionModal from './components/modals/TemplateSelectionModal';
import { useAppStore } from './stores/useAppStore';
import { useDatabaseStore } from './stores/useDatabaseStore';
import { validationService } from './services/validation-service';
import { revisionService } from './services/revision-service';
import { templateService } from './services/template-service';
import { useUI } from './contexts/UIContext';
import { Cable, CableTypeLibrary, ProjectTemplate, IOPoint, Load, Conduit, Tray } from './types';
import { AutoNumberingSettings } from './types/settings';
import { columnService } from './services/column-service';
import { columnServiceAggregator } from './services/column-service-aggregator';

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
    ioPoints,
    selectedIOPoints,
    setSelectedIOPoints,
    plcCards,
    loads,
    selectedLoads,
    setSelectedLoads,
    conduits,
    selectedConduits,
    setSelectedConduits,
    trays,
    selectedTrays,
    setSelectedTrays,
    isInitializing,
    isLoading: dbLoading,
    error,
    initializeDatabase,
    addCable,
    updateCable,
    deleteCable,
    addIOPoint,
    updateIOPoint,
    deleteIOPoint,
    updateLoad,
    deleteLoad,
    addLoad,
    addConduit,
    updateConduit,
    deleteConduit,
    addTray,
    updateTray,
    deleteTray,
    setSelectedCables,
    getNextCableTag,
    getNextConduitTag,
    getNextLoadTag,
    getNextTrayTag,
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
  const [showEditIOPointModal, setShowEditIOPointModal] = useState(false);
  const [editingIOPoint, setEditingIOPoint] = useState<IOPoint | null>(null);
  const [showEditLoadModal, setShowEditLoadModal] = useState(false);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const [showEditConduitModal, setShowEditConduitModal] = useState(false);
  const [editingConduit, setEditingConduit] = useState<Conduit | null>(null);
  const [showEditTrayModal, setShowEditTrayModal] = useState(false);
  const [editingTray, setEditingTray] = useState<Tray | null>(null);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showBulkEditConduitModal, setShowBulkEditConduitModal] = useState(false);
  const [showBulkEditTrayModal, setShowBulkEditTrayModal] = useState(false);
  const [showBulkEditLoadModal, setShowBulkEditLoadModal] = useState(false);
  const [showBulkEditIOModal, setShowBulkEditIOModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showAutoNumberingModal, setShowAutoNumberingModal] = useState(false);
  const [showFindReplaceModal, setShowFindReplaceModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMultiSheetExportModal, setShowMultiSheetExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);
  const [showRevisionComparison, setShowRevisionComparison] = useState(false);
  const [comparisonRevisions, setComparisonRevisions] = useState<{ revisionA: number | null; revisionB: number | null }>({ revisionA: null, revisionB: null });
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);

  // Initialize database and revision service on mount
  useEffect(() => {
    if (!db && !isInitializing) {
      console.log('App.tsx: Initializing database...');
      initializeDatabase();
    } else if (db && !isInitializing) {
      // Initialize revision and template services after database is ready
      console.log('App.tsx: Initializing revision service...');
      revisionService.initialize();
      console.log('App.tsx: Initializing template service...');
      templateService.initialize(db);
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

  const handleNewProject = useCallback(() => {
    // Show template selection modal instead of creating project directly
    setShowTemplateSelection(true);
  }, []);

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

  const handleCloseEditIOPointModal = useCallback(() => {
    setShowEditIOPointModal(false);
    setEditingIOPoint(null);
  }, []);

  const handleCloseEditLoadModal = useCallback(() => {
    setShowEditLoadModal(false);
    setEditingLoad(null);
  }, []);

  const handleCloseEditConduitModal = useCallback(() => {
    setShowEditConduitModal(false);
    setEditingConduit(null);
  }, []);

  const handleCloseEditTrayModal = useCallback(() => {
    setShowEditTrayModal(false);
    setEditingTray(null);
  }, []);

  const handleAddFromLibrary = useCallback(() => {
    console.log('handleAddFromLibrary: Opening library modal');
    setShowLibraryModal(true);
  }, []);

  // I/O Point handlers
  const handleIOPointEdit = useCallback((ioPoint: IOPoint) => {
    setEditingIOPoint(ioPoint);
    setShowEditIOPointModal(true);
  }, []);

  const handleIOBulkEdit = useCallback(() => {
    console.log('Bulk edit IO points:', selectedIOPoints);
    if (selectedIOPoints.length === 0) {
      showError('Please select I/O points to edit');
      return;
    }
    setShowBulkEditIOModal(true);
  }, [selectedIOPoints, showError]);

  const handleAddIOPoint = useCallback(() => {
    // TODO: Implement add I/O point modal
    console.log('Add I/O point');
  }, []);

  const handleIOPointUpdate = useCallback(async (id: number, updates: any) => {
    try {
      if (id === -1) {
        // Create new I/O point
        await addIOPoint(updates);
        showSuccess('I/O point created successfully');
      } else {
        // Update existing I/O point
        await updateIOPoint(id, updates);
        showSuccess('I/O point updated successfully');
      }
    } catch (error) {
      console.error('Failed to update I/O point:', error);
      showError(id === -1 ? 'Failed to create I/O point' : 'Failed to update I/O point');
    }
  }, [addIOPoint, updateIOPoint, showSuccess, showError]);

  // Load handlers
  const handleLoadEdit = useCallback((load: Load) => {
    setEditingLoad(load);
    setShowEditLoadModal(true);
  }, []);

  const handleLoadBulkEdit = useCallback(() => {
    console.log('Bulk edit loads:', selectedLoads);
    if (selectedLoads.length === 0) {
      showError('Please select loads to edit');
      return;
    }
    setShowBulkEditLoadModal(true);
  }, [selectedLoads, showError]);

  const handleAddLoad = useCallback(() => {
    // TODO: Trigger inline add in LoadTable
    console.log('Add load inline');
  }, []);

  const handleLoadUpdate = useCallback(async (id: number, updates: any) => {
    try {
      if (id === -1) {
        // Create new load
        await addLoad(updates);
        showSuccess('Load created successfully');
      } else {
        // Update existing load
        await updateLoad(id, updates);
        showSuccess('Load updated successfully');
      }
    } catch (error) {
      console.error('Failed to update load:', error);
      showError(id === -1 ? 'Failed to create load' : 'Failed to update load');
    }
  }, [addLoad, updateLoad, showSuccess, showError]);

  // Conduit handlers
  const handleAddConduit = useCallback(() => {
    // TODO: Trigger inline add in ConduitTable
    console.log('Add conduit inline');
  }, []);

  const handleConduitUpdate = useCallback(async (id: number, updates: any) => {
    try {
      if (id === -1) {
        // Create new conduit
        await addConduit(updates);
        showSuccess('Conduit created successfully');
      } else {
        // Update existing conduit
        await updateConduit(id, updates);
        showSuccess('Conduit updated successfully');
      }
    } catch (error) {
      console.error('Failed to update conduit:', error);
      showError(id === -1 ? 'Failed to create conduit' : 'Failed to update conduit');
    }
  }, [addConduit, updateConduit, showSuccess, showError]);

  const handleConduitDelete = useCallback(async (id: number) => {
    try {
      await deleteConduit(id);
      showSuccess('Conduit deleted successfully');
    } catch (error) {
      console.error('Failed to delete conduit:', error);
      showError('Failed to delete conduit');
    }
  }, [deleteConduit, showSuccess, showError]);

  const handleConduitEdit = useCallback((conduit: Conduit) => {
    setEditingConduit(conduit);
    setShowEditConduitModal(true);
  }, []);

  const handleConduitBulkEdit = useCallback(() => {
    console.log('Bulk edit conduits:', selectedConduits);
    if (selectedConduits.length === 0) {
      showError('Please select conduits to edit');
      return;
    }
    setShowBulkEditConduitModal(true);
  }, [selectedConduits, showError]);

  // Tray handlers
  const handleAddTray = useCallback(() => {
    // TODO: Implement inline add for trays
    console.log('Add tray inline');
  }, []);

  const handleTrayUpdate = useCallback(async (id: number, updates: any) => {
    try {
      if (id === -1) {
        // Create new tray
        await addTray(updates);
        showSuccess('Tray created successfully');
      } else {
        // Update existing tray
        await updateTray(id, updates);
        showSuccess('Tray updated successfully');
      }
    } catch (error) {
      console.error('Failed to update tray:', error);
      showError(id === -1 ? 'Failed to create tray' : 'Failed to update tray');
    }
  }, [addTray, updateTray, showSuccess, showError]);

  const handleTrayDelete = useCallback(async (id: number) => {
    try {
      await deleteTray(id);
      showSuccess('Tray deleted successfully');
    } catch (error) {
      console.error('Failed to delete tray:', error);
      showError('Failed to delete tray');
    }
  }, [deleteTray, showSuccess, showError]);

  const handleTrayEdit = useCallback((tray: Tray) => {
    setEditingTray(tray);
    setShowEditTrayModal(true);
  }, []);

  const handleTrayBulkEdit = useCallback(() => {
    console.log('Bulk edit trays:', selectedTrays);
    if (selectedTrays.length === 0) {
      showError('Please select trays to edit');
      return;
    }
    setShowBulkEditTrayModal(true);
  }, [selectedTrays, showError]);

  const handleExport = useCallback(() => {
    console.log('handleExport: Opening export modal');
    setShowExportModal(true);
  }, []);

  const handleMultiSheetExport = useCallback(() => {
    console.log('handleMultiSheetExport: Opening multi-sheet export modal');
    setShowMultiSheetExportModal(true);
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
      
      // If tray or conduit assignments were updated, recalculate fill percentages
      if (updates.trayId !== undefined || updates.conduitId !== undefined) {
        try {
          console.log('Bulk update: Recalculating fill percentages...');
          const databaseService = (await import('./services/tauri-database')).TauriDatabaseService.getInstance();
          
          // Collect unique tray/conduit IDs that were affected
          const affectedTrayIds = new Set<number>();
          const affectedConduitIds = new Set<number>();
          
          // Add new assignments
          if (updates.trayId) {
            affectedTrayIds.add(updates.trayId);
          }
          if (updates.conduitId) {
            affectedConduitIds.add(updates.conduitId);
          }
          
          // Add old assignments (cables that were moved from other containers)
          const affectedCables = cables.filter(cable => cable.id && selectedCables.includes(cable.id));
          affectedCables.forEach(cable => {
            if (cable.trayId && cable.trayId !== updates.trayId) {
              affectedTrayIds.add(cable.trayId);
            }
            if (cable.conduitId && cable.conduitId !== updates.conduitId) {
              affectedConduitIds.add(cable.conduitId);
            }
          });
          
          // Recalculate fills for all affected containers
          const recalcPromises = [];
          for (const trayId of affectedTrayIds) {
            recalcPromises.push(databaseService.recalculateTrayFill(trayId));
          }
          for (const conduitId of affectedConduitIds) {
            recalcPromises.push(databaseService.recalculateConduitFill(conduitId));
          }
          
          await Promise.all(recalcPromises);
          console.log(`Bulk update: Recalculated fills for ${affectedTrayIds.size} trays and ${affectedConduitIds.size} conduits`);
        } catch (fillError) {
          console.error('Failed to recalculate fill percentages:', fillError);
          // Don't fail the entire operation for fill calculation errors
        }
      }
      
      showSuccess(`${selectedCables.length} cable${selectedCables.length !== 1 ? 's' : ''} updated successfully!`);
    } catch (error) {
      console.error('handleModalBulkUpdate: Failed to update cables:', error);
      throw error; // Re-throw so modal can handle it
    }
  }, [selectedCables, updateCable, cables, showSuccess]);

  const handleCloseBulkEditModal = useCallback(() => {
    setShowBulkEditModal(false);
  }, []);

  const handleCloseBulkEditConduitModal = useCallback(() => {
    setShowBulkEditConduitModal(false);
  }, []);

  const handleCloseBulkEditTrayModal = useCallback(() => {
    setShowBulkEditTrayModal(false);
  }, []);

  const handleCloseBulkEditLoadModal = useCallback(() => {
    setShowBulkEditLoadModal(false);
  }, []);

  const handleCloseBulkEditIOModal = useCallback(() => {
    setShowBulkEditIOModal(false);
  }, []);

  const handleBulkUpdateConduits = useCallback(async (updates: Partial<any>, selectedFields: string[]) => {
    try {
      const fieldsToUpdate = selectedFields.reduce((acc, field) => {
        if (updates[field] !== undefined) {
          acc[field] = updates[field];
        }
        return acc;
      }, {} as any);

      const promises = selectedConduits.map(id => updateConduit(id, fieldsToUpdate));
      await Promise.all(promises);
      showSuccess(`${selectedConduits.length} conduit${selectedConduits.length !== 1 ? 's' : ''} updated successfully!`);
    } catch (error) {
      console.error('Failed to bulk update conduits:', error);
      throw error;
    }
  }, [selectedConduits, updateConduit, showSuccess]);

  const handleBulkUpdateTrays = useCallback(async (updates: Partial<any>, selectedFields: string[]) => {
    try {
      const fieldsToUpdate = selectedFields.reduce((acc, field) => {
        if (updates[field] !== undefined) {
          acc[field] = updates[field];
        }
        return acc;
      }, {} as any);

      const promises = selectedTrays.map(id => updateTray(id, fieldsToUpdate));
      await Promise.all(promises);
      showSuccess(`${selectedTrays.length} tray${selectedTrays.length !== 1 ? 's' : ''} updated successfully!`);
    } catch (error) {
      console.error('Failed to bulk update trays:', error);
      throw error;
    }
  }, [selectedTrays, updateTray, showSuccess]);

  const handleBulkUpdateLoads = useCallback(async (updates: Partial<any>, selectedFields: string[]) => {
    try {
      const fieldsToUpdate = selectedFields.reduce((acc, field) => {
        if (updates[field] !== undefined) {
          acc[field] = updates[field];
        }
        return acc;
      }, {} as any);

      const promises = selectedLoads.map(id => updateLoad(id, fieldsToUpdate));
      await Promise.all(promises);
      showSuccess(`${selectedLoads.length} load${selectedLoads.length !== 1 ? 's' : ''} updated successfully!`);
    } catch (error) {
      console.error('Failed to bulk update loads:', error);
      throw error;
    }
  }, [selectedLoads, updateLoad, showSuccess]);

  const handleBulkUpdateIOPoints = useCallback(async (updates: Partial<any>, selectedFields: string[]) => {
    try {
      const fieldsToUpdate = selectedFields.reduce((acc, field) => {
        if (updates[field] !== undefined) {
          acc[field] = updates[field];
        }
        return acc;
      }, {} as any);

      const promises = selectedIOPoints.map(id => updateIOPoint(id, fieldsToUpdate));
      await Promise.all(promises);
      showSuccess(`${selectedIOPoints.length} I/O point${selectedIOPoints.length !== 1 ? 's' : ''} updated successfully!`);
    } catch (error) {
      console.error('Failed to bulk update I/O points:', error);
      throw error;
    }
  }, [selectedIOPoints, updateIOPoint, showSuccess]);

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

  const handleCloseExport = useCallback(() => {
    setShowExportModal(false);
  }, []);

  const handleCloseMultiSheetExport = useCallback(() => {
    setShowMultiSheetExportModal(false);
  }, []);

  const handleImport = useCallback(() => {
    console.log('handleImport: Opening import modal');
    setShowImportModal(true);
  }, []);

  const handleCloseImport = useCallback(() => {
    setShowImportModal(false);
  }, []);

  // Revision control handlers
  const handleShowRevisionHistory = useCallback(() => {
    setShowRevisionHistory(true);
  }, []);

  const handleCloseRevisionHistory = useCallback(() => {
    setShowRevisionHistory(false);
  }, []);

  const handleCreateCheckpoint = useCallback(async () => {
    try {
      const description = prompt('Enter a description for this checkpoint (optional):');
      await revisionService.createCheckpoint(description || undefined);
      showSuccess('Checkpoint created successfully!');
      // Refresh revision history if it's open
      if (showRevisionHistory) {
        // The panel will automatically refresh when it detects new data
      }
    } catch (error) {
      console.error('Failed to create checkpoint:', error);
      showError('Failed to create checkpoint');
    }
  }, [showSuccess, showError, showRevisionHistory]);

  const handleCompareRevisions = useCallback((revisionA: number, revisionB: number) => {
    setComparisonRevisions({ revisionA, revisionB });
    setShowRevisionComparison(true);
  }, []);

  const handleCloseRevisionComparison = useCallback(() => {
    setShowRevisionComparison(false);
    setComparisonRevisions({ revisionA: null, revisionB: null });
  }, []);

  const handleImportCables = useCallback(async (cables: Partial<Cable>[]) => {
    console.log('handleImportCables: Importing cables:', cables);
    try {
      // Add each cable to the database
      const promises = cables.map(cableData => addCable(cableData));
      await Promise.all(promises);
      showSuccess(`${cables.length} cable${cables.length !== 1 ? 's' : ''} imported successfully!`);
    } catch (error) {
      console.error('handleImportCables: Failed to import cables:', error);
      throw error;
    }
  }, [addCable, showSuccess]);

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

  // Template handlers
  const handleSelectTemplate = useCallback(async (template: ProjectTemplate, projectName: string) => {
    try {
      console.log('Creating project from template:', template.name, 'with name:', projectName);
      
      // Create project from template
      const { project: projectData, data: templateData } = await templateService.createProjectFromTemplate(template, projectName);
      
      // Create new project in database
      await newProject(projectData);
      
      // If template includes sample data, add it to the project
      if (templateData) {
        // Add sample cables
        if (templateData.cables && templateData.cables.length > 0) {
          for (const cableData of templateData.cables) {
            await addCable(cableData);
          }
        }
        
        // Add sample loads
        if (templateData.loads && templateData.loads.length > 0) {
          for (const loadData of templateData.loads) {
            await addLoad(loadData);
          }
        }
        
        // Add sample conduits
        if (templateData.conduits && templateData.conduits.length > 0) {
          for (const conduitData of templateData.conduits) {
            await addConduit(conduitData);
          }
        }
        
        // Add sample trays
        if (templateData.trays && templateData.trays.length > 0) {
          for (const trayData of templateData.trays) {
            await addTray(trayData);
          }
        }
        
        // Add sample I/O points
        if (templateData.ioPoints && templateData.ioPoints.length > 0) {
          for (const ioData of templateData.ioPoints) {
            await addIOPoint(ioData);
          }
        }
      }
      
      setShowTemplateSelection(false);
      showSuccess(`Project "${projectName}" created from template "${template.name}"`);
    } catch (error) {
      console.error('Failed to create project from template:', error);
      showError('Failed to create project from template');
    }
  }, [templateService, newProject, addCable, addLoad, addConduit, addTray, addIOPoint, showSuccess, showError]);

  const handleCreateFromScratch = useCallback(async (projectName: string) => {
    try {
      console.log('Creating empty project:', projectName);
      await newProject({ name: projectName });
      setShowTemplateSelection(false);
      showSuccess(`Empty project "${projectName}" created`);
    } catch (error) {
      console.error('Failed to create empty project:', error);
      showError('Failed to create project');
    }
  }, [newProject, showSuccess, showError]);

  const handleSaveAsTemplate = useCallback(async () => {
    if (!project) {
      showError('No project to save as template');
      return;
    }
    
    try {
      // For now, just show a placeholder
      const templateName = prompt('Enter template name:', `${project.name} Template`);
      if (!templateName) return;
      
      const description = prompt('Enter template description (optional):');
      
      await templateService.createTemplateFromProject(
        project,
        { cables, ioPoints, loads, conduits, trays },
        {
          name: templateName,
          description: description || undefined,
          category: 'Custom',
          includeData: true,
          includeColumnPresets: false,
        }
      );
      
      showSuccess(`Template "${templateName}" saved successfully`);
    } catch (error) {
      console.error('Failed to save template:', error);
      showError('Failed to save template');
    }
  }, [project, cables, ioPoints, loads, conduits, trays, templateService, showSuccess, showError]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'cables':
        console.log('App.tsx: Rendering CableTable with cables:', cables);
        return (
          <CableTable
            cables={cables}
            trays={trays}
            conduits={conduits}
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
          <IOTable
            ioPoints={ioPoints}
            plcCards={plcCards}
            onIOPointUpdate={handleIOPointUpdate}
            onIOPointDelete={deleteIOPoint}
            onIOPointEdit={handleIOPointEdit}
            onAddIOPoint={handleAddIOPoint}
            onAddFromLibrary={handleAddFromLibrary}
            onBulkEdit={handleIOBulkEdit}
            selectedIOPoints={selectedIOPoints}
            onSelectionChange={setSelectedIOPoints}
          />
        );
      case 'conduits':
        return (
          <ConduitTable
            conduits={conduits}
            onConduitUpdate={handleConduitUpdate}
            onConduitDelete={handleConduitDelete}
            onConduitEdit={handleConduitEdit}
            onAddConduit={handleAddConduit}
            onAddFromLibrary={handleAddFromLibrary}
            onBulkEdit={handleConduitBulkEdit}
            selectedConduits={selectedConduits}
            onSelectionChange={setSelectedConduits}
          />
        );
      case 'loads':
        return (
          <LoadTable
            loads={loads}
            onLoadUpdate={handleLoadUpdate}
            onLoadDelete={deleteLoad}
            onLoadEdit={handleLoadEdit}
            onAddLoad={handleAddLoad}
            onAddFromLibrary={handleAddFromLibrary}
            onBulkEdit={handleLoadBulkEdit}
            selectedLoads={selectedLoads}
            onSelectionChange={setSelectedLoads}
          />
        );
      case 'trays':
        return (
          <TrayTable
            trays={trays}
            onTrayUpdate={handleTrayUpdate}
            onTrayDelete={handleTrayDelete}
            onTrayEdit={handleTrayEdit}
            onAddTray={handleAddTray}
            onAddFromLibrary={handleAddFromLibrary}
            onBulkEdit={handleTrayBulkEdit}
            selectedTrays={selectedTrays}
            onSelectionChange={setSelectedTrays}
          />
        );
      case 'reports':
        return (
          <EngineeringDashboard
            project={project}
            cables={cables}
            trays={trays}
            conduits={conduits}
            loads={loads}
            ioPoints={ioPoints}
            plcCards={plcCards}
          />
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
    ioPoints: ioPoints.length,
    conduits: conduits.length,
    loads: loads.length,
    trays: trays.length
  };

  return (
    <>
      <AppShell
        appState={{ project, activeTab, isLoading, saveStatus, lastSaved }}
        onTabChange={handleTabChange}
        onExport={handleExport}
        onMultiSheetExport={handleMultiSheetExport}
        onImport={handleImport}
        currentViewStats={currentViewStats}
        projectTotals={projectTotals}
        validationCounts={validationCounts}
        onFiltersChange={handleFiltersChange}
        onOpenAutoNumbering={handleOpenAutoNumbering}
        onOpenFindReplace={handleOpenFindReplace}
        onShowRevisionHistory={handleShowRevisionHistory}
        onCreateCheckpoint={handleCreateCheckpoint}
        onNewProject={handleNewProject}
        onSaveProject={handleSaveProject}
        onSaveProjectAs={handleSaveProjectAs}
        onOpenProject={handleOpenProject}
        onSaveAsTemplate={handleSaveAsTemplate}
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

      <EditIOPointModal
        isOpen={showEditIOPointModal}
        onClose={handleCloseEditIOPointModal}
        onUpdate={handleIOPointUpdate}
        ioPoint={editingIOPoint}
        cables={cables}
        plcCards={plcCards}
        isLoading={isLoading}
      />

      <EditLoadModal
        isOpen={showEditLoadModal}
        onClose={handleCloseEditLoadModal}
        onUpdate={handleLoadUpdate}
        load={editingLoad}
        cables={cables}
        isLoading={isLoading}
      />

      <EditConduitModal
        isOpen={showEditConduitModal}
        onClose={handleCloseEditConduitModal}
        onUpdate={handleConduitUpdate}
        conduit={editingConduit}
        cables={cables}
        isLoading={isLoading}
      />

      <EditTrayModal
        isOpen={showEditTrayModal}
        onClose={handleCloseEditTrayModal}
        onUpdate={handleTrayUpdate}
        tray={editingTray}
        cables={cables}
        isLoading={isLoading}
      />

      <BulkEditModal
        isOpen={showBulkEditModal}
        onClose={handleCloseBulkEditModal}
        onUpdate={handleModalBulkUpdate}
        selectedCables={cables.filter(cable => cable.id && selectedCables.includes(cable.id))}
        trays={trays}
        conduits={conduits}
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

      <ExportBuilderModal
        isOpen={showExportModal}
        onClose={handleCloseExport}
        data={cables}
        columns={columnService.loadColumnSettings()}
        selectedRowIds={selectedCables.map(id => String(id))}
      />

      <ImportWizardModal
        isOpen={showImportModal}
        onClose={handleCloseImport}
        onImport={handleImportCables}
        columns={columnService.loadColumnSettings()}
        existingCables={cables}
      />

      <MultiSheetExportModal
        isOpen={showMultiSheetExportModal}
        onClose={handleCloseMultiSheetExport}
        data={{
          cables,
          ioPoints,
          loads,
          conduits,
          trays,
          plcCards
        }}
        columnDefinitions={columnServiceAggregator.getExportColumnDefinitions()}
      />

      <BulkEditConduitModal
        isOpen={showBulkEditConduitModal}
        onClose={handleCloseBulkEditConduitModal}
        onSave={handleBulkUpdateConduits}
        selectedConduits={conduits.filter(conduit => conduit.id && selectedConduits.includes(conduit.id))}
      />

      <BulkEditTrayModal
        isOpen={showBulkEditTrayModal}
        onClose={handleCloseBulkEditTrayModal}
        onSave={handleBulkUpdateTrays}
        selectedTrays={trays.filter(tray => tray.id && selectedTrays.includes(tray.id))}
      />

      <BulkEditLoadModal
        isOpen={showBulkEditLoadModal}
        onClose={handleCloseBulkEditLoadModal}
        onSave={handleBulkUpdateLoads}
        selectedLoads={loads.filter(load => load.id && selectedLoads.includes(load.id))}
      />

      <BulkEditIOModal
        isOpen={showBulkEditIOModal}
        onClose={handleCloseBulkEditIOModal}
        onSave={handleBulkUpdateIOPoints}
        selectedIOPoints={ioPoints.filter(io => io.id && selectedIOPoints.includes(io.id))}
      />

      {/* Revision Control Components */}
      <RevisionHistoryPanel
        isOpen={showRevisionHistory}
        onClose={handleCloseRevisionHistory}
        onCompareRevisions={handleCompareRevisions}
        onCreateCheckpoint={handleCreateCheckpoint}
      />

      <RevisionComparisonModal
        isOpen={showRevisionComparison}
        onClose={handleCloseRevisionComparison}
        revisionA={comparisonRevisions.revisionA}
        revisionB={comparisonRevisions.revisionB}
      />

      {/* Template System */}
      <TemplateSelectionModal
        isOpen={showTemplateSelection}
        onClose={() => setShowTemplateSelection(false)}
        onSelectTemplate={handleSelectTemplate}
        onCreateFromScratch={handleCreateFromScratch}
      />
    </>
  );
}

export default App;
