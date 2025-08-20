import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AppState, Project, Cable, CableFunction } from '../types';

interface AppStore extends AppState {
  // Actions
  setProject: (project: Project | null) => void;
  setActiveTab: (tab: AppState['activeTab']) => void;
  setLoading: (loading: boolean) => void;
  setSaveStatus: (status: 'saved' | 'saving' | 'error') => void;
  setLastSaved: (date: Date) => void;
}

interface CableStore {
  cables: Cable[];
  selectedCables: number[];
  
  // Actions
  setCables: (cables: Cable[]) => void;
  addCable: (cable: Partial<Cable>) => void;
  updateCable: (id: number, updates: Partial<Cable>) => void;
  deleteCable: (id: number) => void;
  setSelectedCables: (ids: number[]) => void;
  
  // Bulk operations
  duplicateCables: (ids: number[]) => void;
  bulkUpdateCables: (ids: number[], updates: Partial<Cable>) => void;
}

// Main app store
export const useAppStore = create<AppStore>()(
  devtools(
    (set) => ({
      // Initial state
      project: null,
      activeTab: 'cables',
      isLoading: false,
      saveStatus: 'saved',
      lastSaved: undefined,

      // Actions
      setProject: (project) => set({ project }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setLoading: (isLoading) => set({ isLoading }),
      setSaveStatus: (saveStatus) => set({ saveStatus }),
      setLastSaved: (lastSaved) => set({ lastSaved }),
    }),
    {
      name: 'app-store',
    }
  )
);

// Cable store
export const useCableStore = create<CableStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      cables: [
        // Sample data for development
        {
          id: 1,
          tag: 'C-001',
          revisionId: 1,
          description: 'Control Power',
          function: CableFunction.Power,
          voltage: 120,
          size: '14 AWG',
          cores: 2,
          fromEquipment: 'MCC-1',
          toEquipment: 'PLC-1',
          length: 150,
          sparePercentage: 10,
          route: 'C01,C05',
          voltageDropPercentage: 1.2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          tag: 'C-002',
          revisionId: 1,
          description: '4-20mA Signal',
          function: CableFunction.Signal,
          voltage: 24,
          size: '18 AWG',
          cores: 2,
          fromEquipment: 'FT-001',
          toEquipment: 'PLC-1',
          length: 85,
          route: 'C01,C02',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          tag: 'C-003',
          revisionId: 1,
          description: 'Temperature RTD',
          function: CableFunction.Signal,
          voltage: 24,
          size: '16 AWG',
          cores: 3,
          fromEquipment: 'TT-002',
          toEquipment: 'PLC-1',
          length: 95,
          route: 'C01,C02',
          createdAt: new Date(),
          updatedAt: new Date(),
          segregationWarning: true,
        },
        {
          id: 4,
          tag: 'C-004',
          revisionId: 1,
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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 5,
          tag: 'C-005',
          revisionId: 1,
          description: 'Spare',
          function: CableFunction.Spare,
          size: '14 AWG',
          cores: 2,
          length: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ],
      selectedCables: [],

      // Actions
      setCables: (cables) => set({ cables }),
      
      addCable: (cableData) => {
        const { cables } = get();
        const newId = Math.max(...cables.map(c => c.id || 0)) + 1;
        const newCable: Cable = {
          id: newId,
          tag: cableData.tag || `C-${newId.toString().padStart(3, '0')}`,
          revisionId: 1,
          description: cableData.description || 'New Cable',
          function: cableData.function || CableFunction.Signal,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...cableData,
        };
        set({ cables: [...cables, newCable] });
      },
      
      updateCable: (id, updates) => {
        const { cables } = get();
        const updatedCables = cables.map(cable =>
          cable.id === id
            ? { ...cable, ...updates, updatedAt: new Date() }
            : cable
        );
        set({ cables: updatedCables });
      },
      
      deleteCable: (id) => {
        const { cables, selectedCables } = get();
        const filteredCables = cables.filter(cable => cable.id !== id);
        const filteredSelection = selectedCables.filter(selectedId => selectedId !== id);
        set({ 
          cables: filteredCables,
          selectedCables: filteredSelection 
        });
      },
      
      setSelectedCables: (selectedCables) => set({ selectedCables }),
      
      duplicateCables: (ids) => {
        const { cables } = get();
        const cablesToDuplicate = cables.filter(cable => ids.includes(cable.id!));
        const maxId = Math.max(...cables.map(c => c.id || 0));
        
        const duplicatedCables = cablesToDuplicate.map((cable, index) => ({
          ...cable,
          id: maxId + index + 1,
          tag: cable.tag.replace(/(\d+)$/, (match, num) => (parseInt(num) + 1).toString().padStart(num.length, '0')),
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        
        set({ cables: [...cables, ...duplicatedCables] });
      },
      
      bulkUpdateCables: (ids, updates) => {
        const { cables } = get();
        const updatedCables = cables.map(cable =>
          ids.includes(cable.id!)
            ? { ...cable, ...updates, updatedAt: new Date() }
            : cable
        );
        set({ cables: updatedCables });
      },
    }),
    {
      name: 'cable-store',
    }
  )
);