import React, { useState, useCallback, useEffect } from 'react';
import { CableTypeLibrary, Cable, CableFunction, SegregationClass } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { invoke } from '@tauri-apps/api/core';
import { 
  X,
  Search,
  BookOpen,
  Plus
} from 'lucide-react';

// Backend types for cable library
interface CableLibraryItem {
  id?: number;
  name: string;
  manufacturer?: string;
  part_number?: string;
  cable_type: string;
  size: string;
  cores: number;
  voltage_rating?: number;
  current_rating?: number;
  outer_diameter?: number;
  weight_per_meter?: number;
  temperature_rating?: number;
  conductor_material: string;
  insulation_type?: string;
  jacket_material?: string;
  shielding?: string;
  armor?: string;
  fire_rating?: string;
  category: string;
  description?: string;
  specifications?: string;
  datasheet_url?: string;
  cost_per_meter?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface NewCableLibraryItem {
  name: string;
  manufacturer?: string;
  part_number?: string;
  cable_type: string;
  size: string;
  cores?: number;
  voltage_rating?: number;
  current_rating?: number;
  outer_diameter?: number;
  weight_per_meter?: number;
  temperature_rating?: number;
  conductor_material: string;
  insulation_type?: string;
  jacket_material?: string;
  shielding?: string;
  armor?: string;
  fire_rating?: string;
  category: string;
  description?: string;
  specifications?: string;
  datasheet_url?: string;
  cost_per_meter?: number;
  is_active?: boolean;
}

interface CableLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFromLibrary: (libraryItem: CableLibraryItem) => Promise<void>;
  onSaveToLibrary?: (cable: Cable) => Promise<void>;
  isLoading?: boolean;
}

export const CableLibraryModal: React.FC<CableLibraryModalProps> = ({
  isOpen,
  onClose,
  onAddFromLibrary,
  onSaveToLibrary,
  isLoading = false
}) => {
  const { showError, showSuccess } = useUI();
  
  const [activeTab, setActiveTab] = useState<'browse' | 'add'>('browse');
  const [library, setLibrary] = useState<CableLibraryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CableLibraryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // New library item form
  const [newItem, setNewItem] = useState<NewCableLibraryItem>({
    name: '',
    manufacturer: '',
    part_number: '',
    cable_type: '',
    size: '',
    cores: undefined,
    voltage_rating: undefined,
    current_rating: undefined,
    outer_diameter: undefined,
    weight_per_meter: undefined,
    temperature_rating: undefined,
    conductor_material: 'Copper',
    insulation_type: '',
    jacket_material: '',
    shielding: '',
    armor: '',
    fire_rating: '',
    category: 'Power',
    description: '',
    specifications: '',
    datasheet_url: '',
    cost_per_meter: undefined,
    is_active: true
  });

  const loadLibrary = useCallback(async () => {
    try {
      setLoading(true);
      const items = await invoke<CableLibraryItem[]>('get_cable_library_items', {
        search_term: searchTerm || null,
        category: selectedCategory || null
      });
      setLibrary(items);
    } catch (error) {
      console.error('Failed to load cable library:', error);
      showError('Failed to load cable library');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, showError]);

  // Load library on mount and when search/category changes
  useEffect(() => {
    if (isOpen) {
      loadLibrary();
    }
  }, [isOpen, loadLibrary]);

  // No need for client-side filtering since backend handles it
  const filteredLibrary = library;

  const handleAddFromLibrary = useCallback(async () => {
    if (!selectedItem) {
      showError('Please select a cable from the library');
      return;
    }

    try {
      await onAddFromLibrary(selectedItem);
      showSuccess(`Added ${selectedItem.name} from library`);
      onClose();
    } catch (error) {
      showError(`Failed to add cable from library: ${error}`);
    }
  }, [selectedItem, onAddFromLibrary, showSuccess, showError, onClose]);

  const handleSaveToLibrary = useCallback(async () => {
    if (!newItem.name?.trim()) {
      showError('Cable name is required');
      return;
    }

    try {
      // TODO: Implement save to database
      const libraryItem: CableLibraryItem = {
        ...newItem,
        id: Math.max(...library.map(i => i.id || 0)) + 1,
        cores: newItem.cores || 1,
        conductor_material: newItem.conductor_material as 'Copper' | 'Aluminum',
        category: newItem.category as 'Power' | 'Control' | 'Instrumentation' | 'Communication' | 'Fiber Optic',
        is_active: newItem.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add to local library for now
      setLibrary(prev => [...prev, libraryItem]);
      
      showSuccess(`Saved ${newItem.name} to library`);
      
      // Reset form
      setNewItem({
        name: '',
        manufacturer: '',
        part_number: '',
        description: '',
        voltage_rating: undefined,
        cores: undefined,
        size: '',
        cable_type: '',
        outer_diameter: undefined,
        weight_per_meter: undefined,
        temperature_rating: undefined,
        conductor_material: 'Copper',
        category: 'Power',
        is_active: true
      });
      
      setActiveTab('browse');
    } catch (error) {
      showError(`Failed to save to library: ${error}`);
    }
  }, [newItem, showSuccess, showError]);

  if (!isOpen) return null;

  const inputClass = "w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Cable Library</h2>
            <p className="text-sm text-gray-500 mt-1">Browse and add standard cable types</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'browse'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Browse Library ({library.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'add'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Add to Library
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {activeTab === 'browse' ? (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative max-w-md">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by name, manufacturer, part number..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Library Items */}
              <div className="grid gap-4 max-h-96 overflow-y-auto">
                {filteredLibrary.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <div className="text-lg font-medium mb-2">No cables found</div>
                    <div className="text-sm">Try a different search term or add cables to the library</div>
                  </div>
                ) : (
                  filteredLibrary.map(item => (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedItem?.id === item.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                            {item.armor && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">{item.armor}</span>}
                            {item.shielding && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{item.shielding}</span>}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
                            <div><span className="font-medium">Size:</span> {item.size}</div>
                            <div><span className="font-medium">Cores:</span> {item.cores}</div>
                            <div><span className="font-medium">Voltage:</span> {item.voltage_rating}V</div>
                            <div><span className="font-medium">Temp:</span> {item.temperature_rating}°C</div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            <span className="font-medium">Manufacturer:</span> {item.manufacturer} | 
                            <span className="ml-1 font-medium">Part #:</span> {item.part_number}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
                            {selectedItem?.id === item.id && (
                              <div className="w-2 h-2 rounded-full bg-primary-600"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Cable Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newItem.name || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g., TECK90 Power Cable"
                  />
                </div>

                {/* Manufacturer */}
                <div>
                  <label className={labelClass}>Manufacturer</label>
                  <input
                    type="text"
                    value={newItem.manufacturer || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, manufacturer: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g., Nexans, Belden"
                  />
                </div>

                {/* Part Number */}
                <div>
                  <label className={labelClass}>Part Number</label>
                  <input
                    type="text"
                    value={newItem.part_number || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, part_number: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g., T90-12-3C"
                  />
                </div>

                {/* Cable Type */}
                <div>
                  <label className={labelClass}>Cable Type</label>
                  <input
                    type="text"
                    value={newItem.cable_type || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, cable_type: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g., TECK90, THWN-2"
                  />
                </div>

                {/* Size */}
                <div>
                  <label className={labelClass}>Size</label>
                  <input
                    type="text"
                    value={newItem.size || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, size: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g., 12 AWG, #10"
                  />
                </div>

                {/* Voltage Rating */}
                <div>
                  <label className={labelClass}>Voltage Rating (V)</label>
                  <input
                    type="number"
                    value={newItem.voltage_rating || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, voltage_rating: e.target.value ? Number(e.target.value) : undefined }))}
                    className={inputClass}
                    placeholder="e.g., 600"
                  />
                </div>

                {/* Cores */}
                <div>
                  <label className={labelClass}>Number of Cores</label>
                  <input
                    type="number"
                    value={newItem.cores || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, cores: e.target.value ? Number(e.target.value) : undefined }))}
                    className={inputClass}
                    placeholder="e.g., 3"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className={labelClass}>Description</label>
                  <textarea
                    value={newItem.description || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                    className={`${inputClass} h-20 resize-none`}
                    placeholder="Brief description of the cable"
                  />
                </div>

                {/* Checkboxes */}
                <div className="md:col-span-2 flex items-center gap-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => {}}
                      className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Armored</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => {}}
                      className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Shielded</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {activeTab === 'browse' 
              ? `${filteredLibrary.length} cable${filteredLibrary.length !== 1 ? 's' : ''} available`
              : 'Add reusable cable types to your library'
            }
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              disabled={isLoading}
            >
              Cancel
            </button>
            {activeTab === 'browse' ? (
              <button
                onClick={handleAddFromLibrary}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !selectedItem}
              >
                {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                Add Selected Cable
              </button>
            ) : (
              <button
                onClick={handleSaveToLibrary}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !newItem.name?.trim()}
              >
                {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                Save to Library
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CableLibraryModal;