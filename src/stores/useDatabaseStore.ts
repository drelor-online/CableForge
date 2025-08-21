/**
 * Database-aware Zustand store
 * Syncs UI state with Tauri SQLite backend
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { TauriDatabaseService } from '../services/tauri-database';
import { revisionService } from '../services/revision-service';
import { calculationService } from '../services/calculation-service';
import { fillCalculationService } from '../services/fill-calculation-service';
import { Cable, Project, CableFunction, IOPoint, IOType, SignalType, PLCCard, Load, Conduit, Tray } from '../types';

interface DatabaseStore {
  // Database instance
  db: TauriDatabaseService | null;
  
  // Loading states
  isInitializing: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Data
  project: Project | null;
  cables: Cable[];
  selectedCables: number[];
  ioPoints: IOPoint[];
  selectedIOPoints: number[];
  plcCards: PLCCard[];
  loads: Load[];
  selectedLoads: number[];
  conduits: Conduit[];
  selectedConduits: number[];
  trays: Tray[];
  selectedTrays: number[];
  
  // Actions
  initializeDatabase: () => Promise<void>;
  closeDatabase: () => Promise<void>;
  
  // Cable operations
  loadCables: () => Promise<void>;
  addCable: (cable: Partial<Cable>) => Promise<Cable>;
  updateCable: (id: number, updates: Partial<Cable>) => Promise<Cable>;
  deleteCable: (id: number) => Promise<void>;
  setSelectedCables: (ids: number[]) => void;
  getNextCableTag: (prefix?: string) => Promise<string>;
  
  // I/O Point operations
  loadIOPoints: () => Promise<void>;
  addIOPoint: (ioPoint: Partial<IOPoint>) => Promise<IOPoint>;
  updateIOPoint: (id: number, updates: Partial<IOPoint>) => Promise<IOPoint>;
  deleteIOPoint: (id: number) => Promise<void>;
  setSelectedIOPoints: (ids: number[]) => void;
  getNextIOTag: (prefix?: string) => Promise<string>;
  
  // PLC Card operations
  loadPLCCards: () => Promise<void>;
  addPLCCard: (plcCard: Partial<PLCCard>) => Promise<PLCCard>;
  updatePLCCard: (id: number, updates: Partial<PLCCard>) => Promise<PLCCard>;
  deletePLCCard: (id: number) => Promise<void>;
  
  // Load operations
  loadLoads: () => Promise<void>;
  addLoad: (load: Partial<Load>) => Promise<Load>;
  updateLoad: (id: number, updates: Partial<Load>) => Promise<Load>;
  deleteLoad: (id: number) => Promise<void>;
  setSelectedLoads: (ids: number[]) => void;
  getNextLoadTag: (prefix?: string) => Promise<string>;
  
  // Conduit operations
  loadConduits: () => Promise<void>;
  addConduit: (conduit: Partial<Conduit>) => Promise<Conduit>;
  updateConduit: (id: number, updates: Partial<Conduit>) => Promise<Conduit>;
  deleteConduit: (id: number) => Promise<void>;
  setSelectedConduits: (ids: number[]) => void;
  getNextConduitTag: (prefix?: string) => Promise<string>;
  
  // Tray operations
  loadTrays: () => Promise<void>;
  addTray: (tray: Partial<Tray>) => Promise<Tray>;
  updateTray: (id: number, updates: Partial<Tray>) => Promise<Tray>;
  deleteTray: (id: number) => Promise<void>;
  setSelectedTrays: (ids: number[]) => void;
  getNextTrayTag: (prefix?: string) => Promise<string>;
  
  // Project operations
  loadProject: () => Promise<void>;
  newProject: (name?: string) => Promise<Project>;
  openProject: (filePath?: string) => Promise<Project>;
  saveProject: (filePath?: string) => Promise<string>;
  saveProjectAs: () => Promise<string>;
  getCurrentProjectInfo: () => Promise<{ project: Project; filePath?: string } | null>;
  exportProject: () => Promise<Uint8Array>;
  importProject: (data: Uint8Array) => Promise<void>;
  
  // Utility
  clearError: () => void;
}

export const useDatabaseStore = create<DatabaseStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      db: null,
      isInitializing: false,
      isLoading: false,
      error: null,
      project: null,
      cables: [],
      selectedCables: [],
      ioPoints: [],
      selectedIOPoints: [],
      plcCards: [],
      loads: [],
      selectedLoads: [],
      conduits: [],
      selectedConduits: [],
      trays: [],
      selectedTrays: [],

      // Database lifecycle
      initializeDatabase: async () => {
        console.log('useDatabaseStore: Starting database initialization...');
        set({ isInitializing: true, error: null });
        
        try {
          console.log('useDatabaseStore: Getting TauriDatabaseService instance...');
          const db = TauriDatabaseService.getInstance();
          
          console.log('useDatabaseStore: Calling db.initialize()...');
          await db.initialize();
          console.log('useDatabaseStore: Database initialized successfully');
          
          set({ db, isInitializing: false });
          console.log('useDatabaseStore: Database set in store, loading initial data...');
          
          // Load initial data
          console.log('useDatabaseStore: Loading project...');
          await get().loadProject();
          console.log('useDatabaseStore: Loading cables...');
          await get().loadCables();
          console.log('useDatabaseStore: Loading I/O points...');
          await get().loadIOPoints();
          console.log('useDatabaseStore: Loading PLC cards...');
          await get().loadPLCCards();
          console.log('useDatabaseStore: Loading loads...');
          await get().loadLoads();
          console.log('useDatabaseStore: Loading conduits...');
          await get().loadConduits();
          console.log('useDatabaseStore: Loading trays...');
          await get().loadTrays();
          console.log('useDatabaseStore: Initial data loaded successfully');
        } catch (error) {
          console.error('useDatabaseStore: Database initialization failed:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to initialize database',
            isInitializing: false 
          });
          console.log('useDatabaseStore: Error state set:', error instanceof Error ? error.message : 'Failed to initialize database');
        }
      },

      closeDatabase: async () => {
        const { db } = get();
        if (db) {
          await db.close();
          set({ 
            db: null, 
            project: null, 
            cables: [], 
            selectedCables: [], 
            ioPoints: [], 
            selectedIOPoints: [], 
            plcCards: [],
            loads: [],
            selectedLoads: [],
            conduits: [],
            selectedConduits: []
          });
        }
      },

      // Cable operations
      loadCables: async () => {
        const { db } = get();
        if (!db) {
          console.log('useDatabaseStore: loadCables called but db is null');
          return;
        }

        console.log('useDatabaseStore: Loading cables...');
        set({ isLoading: true, error: null });
        
        try {
          console.log('useDatabaseStore: Calling db.getCables()');
          const cables = await db.getCables();
          console.log('useDatabaseStore: getCables returned:', cables);
          
          // If no cables exist, add sample data for development
          if (cables.length === 0) {
            console.log('No cables found, adding sample data...');
            const sampleCables = [
              {
                tag: 'C-001',
                description: 'Control Power',
                function: CableFunction.Power,
                voltage: 120,
                size: '14 AWG',
                cores: 2,
                fromEquipment: 'MCC-1',
                toEquipment: 'PLC-1',
                length: 150,
                route: 'C01,C05',
                voltageDropPercentage: 1.2,
              },
              {
                tag: 'C-002',
                description: '4-20mA Signal',
                function: CableFunction.Signal,
                voltage: 24,
                size: '18 AWG',
                cores: 2,
                fromEquipment: 'FT-001',
                toEquipment: 'PLC-1',
                length: 85,
                route: 'C01,C02',
              },
              {
                tag: 'C-003',
                description: 'Temperature RTD',
                function: CableFunction.Signal,
                voltage: 24,
                size: '16 AWG',
                cores: 3,
                fromEquipment: 'TT-002',
                toEquipment: 'PLC-1',
                length: 95,
                route: 'C01,C02',
              },
              {
                tag: 'C-004',
                description: 'Motor Power',
                function: CableFunction.Power,
                voltage: 480,
                size: '4/0 AWG',
                cores: 3,
                fromEquipment: 'MCC-2',
                toEquipment: 'M-001',
                length: 200,
                route: 'C10',
                voltageDropPercentage: 2.8,
              }
            ];
            
            // Add sample cables to database
            for (const cableData of sampleCables) {
              try {
                await db.createCable(cableData);
              } catch (error) {
                console.error('Failed to create sample cable:', cableData.tag, error);
              }
            }
            
            // Reload cables after adding samples
            console.log('useDatabaseStore: Reloading cables after adding samples');
            const updatedCables = await db.getCables();
            console.log('useDatabaseStore: Updated cables after samples:', updatedCables);
            set({ cables: updatedCables, isLoading: false });
          } else {
            console.log('useDatabaseStore: Setting cables from database:', cables);
            set({ cables, isLoading: false });
          }
        } catch (error) {
          console.error('Failed to load cables:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load cables',
            isLoading: false 
          });
        }
      },

      addCable: async (cableData: Partial<Cable>) => {
        const { db, cables } = get();
        if (!db) throw new Error('Database not initialized');

        set({ isLoading: true, error: null });
        
        try {
          const newCable = await db.createCable(cableData);
          
          // Track the creation in revision history
          if (newCable.id) {
            revisionService.trackChange(
              'cable',
              newCable.id,
              newCable.tag || `Cable ${newCable.id}`,
              'create'
            );

            // Recalculate fills for routes that now contain this cable
            if (newCable.route) {
              try {
                const affectedRoutes = fillCalculationService.findAffectedRoutes(undefined, newCable.route);
                const { conduits, trays } = get();
                
                // Recalculate fills for affected conduits
                for (const conduitTag of affectedRoutes.affectedConduitTags) {
                  const conduit = conduits.find(c => c.tag === conduitTag);
                  if (conduit && conduit.id) {
                    fillCalculationService.recalculateConduitFill(conduit.id)
                      .catch(error => console.warn(`Failed to recalculate fill for conduit ${conduitTag}:`, error));
                  }
                }
                
                // Recalculate fills for affected trays
                for (const trayTag of affectedRoutes.affectedTrayTags) {
                  const tray = trays.find(t => t.tag === trayTag);
                  if (tray && tray.id) {
                    fillCalculationService.recalculateTrayFill(tray.id)
                      .catch(error => console.warn(`Failed to recalculate fill for tray ${trayTag}:`, error));
                  }
                }
              } catch (error) {
                console.warn('Failed to recalculate fills after cable creation:', error);
              }
            }
          }
          
          const updatedCables = [...cables, newCable];
          set({ cables: updatedCables, isLoading: false });
          return newCable;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create cable',
            isLoading: false 
          });
          throw error;
        }
      },

      updateCable: async (id: number, updates: Partial<Cable>) => {
        const { db, cables } = get();
        if (!db) throw new Error('Database not initialized');

        set({ isLoading: true, error: null });
        
        try {
          // Get the current cable for change tracking
          const currentCable = cables.find(cable => cable.id === id);
          
          const updatedCable = await db.updateCable(id, updates);
          
          // Check if voltage drop calculation is needed
          const voltageDropRelevantFields = ['voltage', 'current', 'length', 'size', 'function'];
          const shouldRecalculateVoltage = voltageDropRelevantFields.some(field => 
            updates.hasOwnProperty(field)
          );
          
          let finalUpdatedCable = updatedCable;
          
          // Calculate voltage drop if relevant fields changed
          if (shouldRecalculateVoltage && updatedCable.id) {
            try {
              // Check if we have enough data for voltage drop calculation
              const hasRequiredData = updatedCable.voltage && 
                                    updatedCable.length && 
                                    updatedCable.size;
              
              if (hasRequiredData) {
                // Use current from cable if available, otherwise estimate based on function
                let current = updatedCable.current;
                if (!current && updatedCable.function && updatedCable.size) {
                  current = calculationService.estimateTypicalCurrent(updatedCable.function, updatedCable.size) ?? undefined;
                }
                
                if (current && current > 0) {
                  const voltageDropResult = await calculationService.calculateVoltageDropForCable(
                    updatedCable.voltage!,
                    current,
                    updatedCable.length!,
                    updatedCable.size!,
                    'Copper' // Default to copper, could be made configurable
                  );
                  
                  // Update the cable with calculated voltage drop
                  finalUpdatedCable = await db.updateCable(id, {
                    voltageDropPercentage: voltageDropResult.voltage_drop_percentage
                  });
                }
              }
            } catch (error) {
              console.warn('Failed to calculate voltage drop for cable:', error);
              // Don't fail the entire update if voltage drop calculation fails
            }
          }

          // Check if fill calculation is needed (when routing or cable properties change)
          const fillRelevantFields = ['route', 'outerDiameter', 'trayId', 'conduitId'];
          const shouldRecalculateFill = fillRelevantFields.some(field => 
            updates.hasOwnProperty(field)
          );

          if (shouldRecalculateFill && currentCable) {
            try {
              // Find affected conduits and trays from route changes
              const oldRoute = currentCable.route;
              const newRoute = finalUpdatedCable.route;
              
              if (oldRoute !== newRoute) {
                const affectedRoutes = fillCalculationService.findAffectedRoutes(oldRoute, newRoute);
                
                // Get conduits and trays to find IDs from tags
                const { conduits, trays } = get();
                
                // Recalculate fills for affected conduits
                for (const conduitTag of affectedRoutes.affectedConduitTags) {
                  const conduit = conduits.find(c => c.tag === conduitTag);
                  if (conduit && conduit.id) {
                    fillCalculationService.recalculateConduitFill(conduit.id)
                      .catch(error => console.warn(`Failed to recalculate fill for conduit ${conduitTag}:`, error));
                  }
                }
                
                // Recalculate fills for affected trays
                for (const trayTag of affectedRoutes.affectedTrayTags) {
                  const tray = trays.find(t => t.tag === trayTag);
                  if (tray && tray.id) {
                    fillCalculationService.recalculateTrayFill(tray.id)
                      .catch(error => console.warn(`Failed to recalculate fill for tray ${trayTag}:`, error));
                  }
                }
              }
            } catch (error) {
              console.warn('Failed to recalculate fills after cable update:', error);
              // Don't fail the entire update if fill calculation fails
            }
          }
          
          // Track field-level changes in revision history
          if (currentCable) {
            Object.keys(updates).forEach(field => {
              const oldValue = (currentCable as any)[field];
              const newValue = (updates as any)[field];
              
              if (oldValue !== newValue) {
                revisionService.trackChange(
                  'cable',
                  id,
                  currentCable.tag || `Cable ${id}`,
                  'update',
                  field,
                  oldValue,
                  newValue
                );
              }
            });
          }
          
          const updatedCables = cables.map(cable => 
            cable.id === id ? finalUpdatedCable : cable
          );
          set({ cables: updatedCables, isLoading: false });
          return finalUpdatedCable;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update cable',
            isLoading: false 
          });
          throw error;
        }
      },

      deleteCable: async (id: number) => {
        const { db, cables, selectedCables } = get();
        if (!db) throw new Error('Database not initialized');

        set({ isLoading: true, error: null });
        
        try {
          // Get the cable for change tracking before deletion
          const cableToDelete = cables.find(cable => cable.id === id);
          
          await db.deleteCable(id);
          
          // Track the deletion in revision history
          if (cableToDelete) {
            revisionService.trackChange(
              'cable',
              id,
              cableToDelete.tag || `Cable ${id}`,
              'delete'
            );

            // Recalculate fills for routes that contained this cable
            if (cableToDelete.route) {
              try {
                const affectedRoutes = fillCalculationService.findAffectedRoutes(cableToDelete.route);
                const { conduits, trays } = get();
                
                // Recalculate fills for affected conduits
                for (const conduitTag of affectedRoutes.affectedConduitTags) {
                  const conduit = conduits.find(c => c.tag === conduitTag);
                  if (conduit && conduit.id) {
                    fillCalculationService.recalculateConduitFill(conduit.id)
                      .catch(error => console.warn(`Failed to recalculate fill for conduit ${conduitTag}:`, error));
                  }
                }
                
                // Recalculate fills for affected trays
                for (const trayTag of affectedRoutes.affectedTrayTags) {
                  const tray = trays.find(t => t.tag === trayTag);
                  if (tray && tray.id) {
                    fillCalculationService.recalculateTrayFill(tray.id)
                      .catch(error => console.warn(`Failed to recalculate fill for tray ${trayTag}:`, error));
                  }
                }
              } catch (error) {
                console.warn('Failed to recalculate fills after cable deletion:', error);
              }
            }
          }
          
          const updatedCables = cables.filter(cable => cable.id !== id);
          const updatedSelection = selectedCables.filter(selectedId => selectedId !== id);
          set({ 
            cables: updatedCables, 
            selectedCables: updatedSelection,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete cable',
            isLoading: false 
          });
          throw error;
        }
      },

      setSelectedCables: (selectedCables: number[]) => {
        set({ selectedCables });
      },

      getNextCableTag: async (prefix = 'C') => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');
        
        return await db.getNextCableTag(prefix);
      },

      // Project operations
      loadProject: async () => {
        const { db } = get();
        if (!db) return;

        set({ isLoading: true, error: null });
        
        try {
          const projects = await db.getProjects();
          const project = projects.length > 0 ? projects[0] : null;
          set({ project, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load project',
            isLoading: false 
          });
        }
      },

      newProject: async (name?: string) => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');

        set({ isLoading: true, error: null });
        
        try {
          const project = await db.newProject(name);
          set({ 
            project, 
            cables: [], 
            selectedCables: [],
            isLoading: false 
          });
          return project;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create new project',
            isLoading: false 
          });
          throw error;
        }
      },

      openProject: async (filePath?: string) => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');

        set({ isLoading: true, error: null });
        
        try {
          let path = filePath;
          if (!path) {
            const selectedPath = await db.showOpenDialog();
            if (!selectedPath) {
              set({ isLoading: false });
              throw new Error('No file selected');
            }
            path = selectedPath;
          }

          const project = await db.openProject(path);
          const cables = await db.getCables();
          
          set({ 
            project, 
            cables,
            selectedCables: [],
            isLoading: false 
          });
          return project;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to open project',
            isLoading: false 
          });
          throw error;
        }
      },

      saveProject: async (filePath?: string) => {
        const { db, project } = get();
        if (!db) throw new Error('Database not initialized');
        if (!project) throw new Error('No project to save');

        set({ isLoading: true, error: null });
        
        try {
          let path = filePath;
          if (!path) {
            // Show save dialog if no path provided
            const defaultName = `${project.name}.cfp`;
            const selectedPath = await db.showSaveDialog(defaultName);
            if (!selectedPath) {
              set({ isLoading: false });
              throw new Error('No file path selected');
            }
            path = selectedPath;
          }

          const savedPath = await db.saveProject(path);
          set({ isLoading: false });
          return savedPath;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to save project',
            isLoading: false 
          });
          throw error;
        }
      },

      saveProjectAs: async () => {
        const { db, project } = get();
        if (!db) throw new Error('Database not initialized');
        if (!project) throw new Error('No project to save');

        set({ isLoading: true, error: null });
        
        try {
          const defaultName = `${project.name}.cfp`;
          const selectedPath = await db.showSaveDialog(defaultName);
          if (!selectedPath) {
            set({ isLoading: false });
            throw new Error('No file path selected');
          }

          const savedPath = await db.saveProjectAs(selectedPath);
          set({ isLoading: false });
          return savedPath;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to save project as',
            isLoading: false 
          });
          throw error;
        }
      },

      getCurrentProjectInfo: async () => {
        const { db } = get();
        if (!db) return null;

        try {
          return await db.getCurrentProjectInfo();
        } catch (error) {
          console.error('Failed to get current project info:', error);
          return null;
        }
      },

      exportProject: async () => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');
        
        return await db.exportProject();
      },

      importProject: async (data: Uint8Array) => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');

        set({ isLoading: true, error: null });
        
        try {
          await db.importProject(data);
          
          // Reload all data after import
          await get().loadProject();
          await get().loadCables();
          await get().loadIOPoints();
          await get().loadPLCCards();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to import project',
            isLoading: false 
          });
          throw error;
        }
      },

      // I/O Point operations
      loadIOPoints: async () => {
        const { db } = get();
        if (!db) {
          console.log('useDatabaseStore: loadIOPoints called but db is null');
          return;
        }

        console.log('useDatabaseStore: Loading I/O points...');
        set({ isLoading: true, error: null });
        
        try {
          const ioPoints = await db.getIOPoints();
          console.log('useDatabaseStore: getIOPoints returned:', ioPoints);
          
          // If no I/O points exist, add sample data for development
          if (ioPoints.length === 0) {
            console.log('No I/O points found, adding sample data...');
            const sampleIOPoints = [
              {
                tag: 'FT-001',
                description: 'Flow Transmitter',
                signalType: SignalType.FourToTwentyMA,
                ioType: IOType.AI,
                plcName: 'PLC-1',
                rack: 1,
                slot: 2,
                channel: 0,
                terminalBlock: 'TB-001',
              },
              {
                tag: 'TT-002',
                description: 'Temperature Transmitter',
                signalType: SignalType.RTD,
                ioType: IOType.AI,
                plcName: 'PLC-1',
                rack: 1,
                slot: 2,
                channel: 1,
                terminalBlock: 'TB-001',
              },
              {
                tag: 'LS-003',
                description: 'Level Switch',
                signalType: SignalType.DryContact,
                ioType: IOType.DI,
                plcName: 'PLC-1',
                rack: 1,
                slot: 3,
                channel: 0,
                terminalBlock: 'TB-002',
              },
              {
                tag: 'XV-001',
                description: 'Control Valve',
                signalType: SignalType.TwentyFourVDC,
                ioType: IOType.DO,
                plcName: 'PLC-1',
                rack: 1,
                slot: 4,
                channel: 0,
                terminalBlock: 'TB-003',
              }
            ];
            
            // Add sample I/O points to database
            for (const ioPointData of sampleIOPoints) {
              try {
                await db.createIOPoint(ioPointData);
              } catch (error) {
                console.error('Failed to create sample I/O point:', ioPointData.tag, error);
              }
            }
            
            // Reload I/O points after adding samples
            const updatedIOPoints = await db.getIOPoints();
            set({ ioPoints: updatedIOPoints, isLoading: false });
          } else {
            set({ ioPoints, isLoading: false });
          }
        } catch (error) {
          console.error('Failed to load I/O points:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load I/O points',
            isLoading: false 
          });
        }
      },

      addIOPoint: async (ioPointData: Partial<IOPoint>) => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');

        set({ isLoading: true, error: null });
        
        try {
          const newIOPoint = await db.createIOPoint(ioPointData);
          
          // Update local state
          set(state => ({ 
            ioPoints: [...state.ioPoints, newIOPoint],
            isLoading: false 
          }));
          
          return newIOPoint;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add I/O point',
            isLoading: false 
          });
          throw error;
        }
      },

      updateIOPoint: async (id: number, updates: Partial<IOPoint>) => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');

        set({ isLoading: true, error: null });
        
        try {
          const updatedIOPoint = await db.updateIOPoint(id, updates);
          
          // Update local state
          set(state => ({
            ioPoints: state.ioPoints.map(io => 
              io.id === id ? updatedIOPoint : io
            ),
            isLoading: false
          }));
          
          return updatedIOPoint;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update I/O point',
            isLoading: false 
          });
          throw error;
        }
      },

      deleteIOPoint: async (id: number) => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');

        set({ isLoading: true, error: null });
        
        try {
          await db.deleteIOPoint(id);
          
          // Update local state
          set(state => ({
            ioPoints: state.ioPoints.filter(io => io.id !== id),
            selectedIOPoints: state.selectedIOPoints.filter(selectedId => selectedId !== id),
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete I/O point',
            isLoading: false 
          });
          throw error;
        }
      },

      setSelectedIOPoints: (ids: number[]) => {
        set({ selectedIOPoints: ids });
      },

      getNextIOTag: async (prefix: string = 'IO-') => {
        const { ioPoints } = get();
        
        // Find the highest existing number for the given prefix
        const existingNumbers = ioPoints
          .map(io => io.tag)
          .filter(tag => tag.startsWith(prefix))
          .map(tag => {
            const numberPart = tag.substring(prefix.length);
            return parseInt(numberPart, 10);
          })
          .filter(num => !isNaN(num))
          .sort((a, b) => b - a);

        const nextNumber = existingNumbers.length > 0 ? existingNumbers[0] + 1 : 1;
        return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
      },

      // PLC Card operations
      loadPLCCards: async () => {
        const { db } = get();
        if (!db) {
          console.log('useDatabaseStore: loadPLCCards called but db is null');
          return;
        }

        console.log('useDatabaseStore: Loading PLC cards...');
        set({ isLoading: true, error: null });
        
        try {
          const plcCards = await db.getPLCCards();
          
          // If no PLC cards exist, add sample data for development
          if (plcCards.length === 0) {
            console.log('No PLC cards found, adding sample data...');
            const samplePLCCards = [
              {
                name: 'AI-Card-1',
                plcName: 'PLC-1',
                rack: 1,
                slot: 2,
                cardType: '1756-IF8',
                ioType: IOType.AI,
                totalChannels: 8,
                signalType: SignalType.FourToTwentyMA,
                usedChannels: 2,
                availableChannels: 6,
                manufacturer: 'Allen-Bradley',
                partNumber: '1756-IF8',
              },
              {
                name: 'DI-Card-1',
                plcName: 'PLC-1',
                rack: 1,
                slot: 3,
                cardType: '1756-IB16',
                ioType: IOType.DI,
                totalChannels: 16,
                signalType: SignalType.DryContact,
                usedChannels: 1,
                availableChannels: 15,
                manufacturer: 'Allen-Bradley',
                partNumber: '1756-IB16',
              },
              {
                name: 'DO-Card-1',
                plcName: 'PLC-1',
                rack: 1,
                slot: 4,
                cardType: '1756-OB16E',
                ioType: IOType.DO,
                totalChannels: 16,
                signalType: SignalType.TwentyFourVDC,
                usedChannels: 1,
                availableChannels: 15,
                manufacturer: 'Allen-Bradley',
                partNumber: '1756-OB16E',
              }
            ];
            
            // Add sample PLC cards to database
            for (const plcCardData of samplePLCCards) {
              try {
                await db.createPLCCard(plcCardData);
              } catch (error) {
                console.error('Failed to create sample PLC card:', plcCardData.name, error);
              }
            }
            
            // Reload PLC cards after adding samples
            const updatedPLCCards = await db.getPLCCards();
            set({ plcCards: updatedPLCCards, isLoading: false });
          } else {
            set({ plcCards, isLoading: false });
          }
        } catch (error) {
          console.error('Failed to load PLC cards:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load PLC cards',
            isLoading: false 
          });
        }
      },

      addPLCCard: async (plcCardData: Partial<PLCCard>) => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');

        set({ isLoading: true, error: null });
        
        try {
          const newPLCCard = await db.createPLCCard(plcCardData);
          
          // Update local state
          set(state => ({ 
            plcCards: [...state.plcCards, newPLCCard],
            isLoading: false 
          }));
          
          return newPLCCard;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add PLC card',
            isLoading: false 
          });
          throw error;
        }
      },

      updatePLCCard: async (id: number, updates: Partial<PLCCard>) => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');

        set({ isLoading: true, error: null });
        
        try {
          const updatedPLCCard = await db.updatePLCCard(id, updates);
          
          // Update local state
          set(state => ({
            plcCards: state.plcCards.map(card => 
              card.id === id ? updatedPLCCard : card
            ),
            isLoading: false
          }));
          
          return updatedPLCCard;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update PLC card',
            isLoading: false 
          });
          throw error;
        }
      },

      deletePLCCard: async (id: number) => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');

        set({ isLoading: true, error: null });
        
        try {
          await db.deletePLCCard(id);
          
          // Update local state
          set(state => ({
            plcCards: state.plcCards.filter(card => card.id !== id),
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete PLC card',
            isLoading: false 
          });
          throw error;
        }
      },

      // Load operations
      loadLoads: async () => {
        const { db } = get();
        if (!db) {
          console.log('useDatabaseStore: loadLoads called but db is null');
          return;
        }
        console.log('useDatabaseStore: Loading loads...');
        set({ isLoading: true, error: null });
        
        try {
          const loads = await db.getLoads();
          console.log('useDatabaseStore: getLoads returned:', loads);
          
          set({ loads, isLoading: false });
        } catch (error) {
          console.error('Failed to load loads:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load loads',
            isLoading: false 
          });
        }
      },

      addLoad: async (loadData: Partial<Load>) => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');
        set({ isLoading: true, error: null });
        
        try {
          const newLoad = await db.createLoad(loadData);
          
          // Update local state
          set(state => ({ 
            loads: [...state.loads, newLoad],
            isLoading: false 
          }));
          
          return newLoad;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add load',
            isLoading: false 
          });
          throw error;
        }
      },

      updateLoad: async (id: number, updates: Partial<Load>) => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');
        set({ isLoading: true, error: null });
        
        try {
          const updatedLoad = await db.updateLoad(id, updates);
          
          // Update local state
          set(state => ({
            loads: state.loads.map(load => 
              load.id === id ? updatedLoad : load
            ),
            isLoading: false
          }));
          
          return updatedLoad;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update load',
            isLoading: false 
          });
          throw error;
        }
      },

      deleteLoad: async (id: number) => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');
        set({ isLoading: true, error: null });
        
        try {
          await db.deleteLoad(id);
          
          // Update local state
          set(state => ({
            loads: state.loads.filter(load => load.id !== id),
            selectedLoads: state.selectedLoads.filter(selectedId => selectedId !== id),
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete load',
            isLoading: false 
          });
          throw error;
        }
      },

      setSelectedLoads: (ids: number[]) => {
        set({ selectedLoads: ids });
      },

      getNextLoadTag: async (prefix: string = 'L') => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');
        
        try {
          // For now, implement simple auto-increment logic
          const { loads } = get();
          const existingNumbers = loads
            .map(load => load.tag)
            .filter(tag => tag.startsWith(`${prefix}-`))
            .map(tag => {
              const match = tag.match(new RegExp(`^${prefix}-(\\d+)$`));
              return match ? parseInt(match[1], 10) : 0;
            })
            .filter(num => !isNaN(num));
          
          const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
          return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
        } catch (error) {
          console.error('Failed to get next load tag:', error);
          return `${prefix}-001`;
        }
      },

      // Conduit operations
      loadConduits: async () => {
        const { db } = get();
        if (!db) {
          console.log('useDatabaseStore: loadConduits called but db is null');
          return;
        }

        set({ isLoading: true, error: null });
        
        try {
          const conduits = await db.getConduits();
          set({ 
            conduits, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load conduits',
            isLoading: false 
          });
          throw error;
        }
      },

      addConduit: async (conduitData: Partial<Conduit>) => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');
        set({ isLoading: true, error: null });
        
        try {
          const newConduit = await db.createConduit(conduitData);
          
          // Update local state
          set(state => ({
            conduits: [...state.conduits, newConduit],
            isLoading: false
          }));
          
          return newConduit;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add conduit',
            isLoading: false 
          });
          throw error;
        }
      },

      updateConduit: async (id: number, updates: Partial<Conduit>) => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');
        set({ isLoading: true, error: null });
        
        try {
          const updatedConduit = await db.updateConduit(id, updates);
          
          // Update local state
          set(state => ({
            conduits: state.conduits.map(conduit => 
              conduit.id === id ? updatedConduit : conduit
            ),
            isLoading: false
          }));
          
          return updatedConduit;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update conduit',
            isLoading: false 
          });
          throw error;
        }
      },

      deleteConduit: async (id: number) => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');
        set({ isLoading: true, error: null });
        
        try {
          await db.deleteConduit(id);
          
          // Update local state
          set(state => ({
            conduits: state.conduits.filter(conduit => conduit.id !== id),
            selectedConduits: state.selectedConduits.filter(selectedId => selectedId !== id),
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete conduit',
            isLoading: false 
          });
          throw error;
        }
      },

      setSelectedConduits: (ids: number[]) => {
        set({ selectedConduits: ids });
      },

      getNextConduitTag: async (prefix: string = 'CDT') => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');
        
        try {
          // For now, implement simple auto-increment logic
          const { conduits } = get();
          const existingNumbers = conduits
            .map(conduit => conduit.tag)
            .filter(tag => tag.startsWith(`${prefix}-`))
            .map(tag => {
              const match = tag.match(new RegExp(`^${prefix}-(\\d+)$`));
              return match ? parseInt(match[1], 10) : 0;
            })
            .filter(num => !isNaN(num));
          
          const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
          return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
        } catch (error) {
          console.error('Failed to get next conduit tag:', error);
          return `${prefix}-001`;
        }
      },

      // Tray operations
      loadTrays: async () => {
        const { db } = get();
        if (!db) {
          console.log('useDatabaseStore: loadTrays called but db is null');
          return;
        }

        set({ isLoading: true, error: null });
        
        try {
          const trays = await db.getTrays();
          set({ 
            trays, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load trays',
            isLoading: false 
          });
          throw error;
        }
      },

      addTray: async (trayData: Partial<Tray>) => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');
        set({ isLoading: true, error: null });
        
        try {
          const newTray = await db.createTray(trayData);
          
          // Update local state
          set(state => ({
            trays: [...state.trays, newTray],
            isLoading: false
          }));
          
          return newTray;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add tray',
            isLoading: false 
          });
          throw error;
        }
      },

      updateTray: async (id: number, updates: Partial<Tray>) => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');
        set({ isLoading: true, error: null });
        
        try {
          const updatedTray = await db.updateTray(id, updates);
          
          // Update local state
          set(state => ({
            trays: state.trays.map(tray => 
              tray.id === id ? updatedTray : tray
            ),
            isLoading: false
          }));
          
          return updatedTray;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update tray',
            isLoading: false 
          });
          throw error;
        }
      },

      deleteTray: async (id: number) => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');
        set({ isLoading: true, error: null });
        
        try {
          await db.deleteTray(id);
          
          // Update local state
          set(state => ({
            trays: state.trays.filter(tray => tray.id !== id),
            selectedTrays: state.selectedTrays.filter(selectedId => selectedId !== id),
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete tray',
            isLoading: false 
          });
          throw error;
        }
      },

      setSelectedTrays: (ids: number[]) => {
        set({ selectedTrays: ids });
      },

      getNextTrayTag: async (prefix: string = 'TRAY') => {
        const { db } = get();
        if (!db) throw new Error('Database not initialized');
        
        try {
          // For now, implement simple auto-increment logic
          const { trays } = get();
          const existingNumbers = trays
            .map(tray => tray.tag)
            .filter(tag => tag.startsWith(`${prefix}-`))
            .map(tag => {
              const match = tag.match(new RegExp(`^${prefix}-(\\d+)$`));
              return match ? parseInt(match[1], 10) : 0;
            })
            .filter(num => !isNaN(num));
          
          const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
          return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
        } catch (error) {
          console.error('Failed to get next tray tag:', error);
          return `${prefix}-001`;
        }
      },

      // Utility
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'database-store',
    }
  )
);