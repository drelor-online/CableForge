import React, { useState, useCallback, useEffect } from 'react';
import { Load } from '../../types';
import { useUI } from '../../contexts/UIContext';

interface BulkEditLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Load>, selectedFields: string[]) => Promise<void>;
  selectedLoads: Load[];
  isLoading?: boolean;
}

interface BulkUpdateData {
  loadType?: string;
  powerKw?: number;
  voltage?: number;
  powerFactor?: number;
  efficiency?: number;
  demandFactor?: number;
  startingCurrentMultiplier?: number;
  location?: string;
  notes?: string;
}

interface FieldUpdateState {
  loadType: boolean;
  powerKw: boolean;
  voltage: boolean;
  powerFactor: boolean;
  efficiency: boolean;
  demandFactor: boolean;
  startingCurrentMultiplier: boolean;
  location: boolean;
  notes: boolean;
}

export const BulkEditLoadModal: React.FC<BulkEditLoadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedLoads,
  isLoading = false
}) => {
  const { showError } = useUI();
  
  const [updateData, setUpdateData] = useState<BulkUpdateData>({});
  const [fieldsToUpdate, setFieldsToUpdate] = useState<FieldUpdateState>({
    loadType: false,
    powerKw: false,
    voltage: false,
    powerFactor: false,
    efficiency: false,
    demandFactor: false,
    startingCurrentMultiplier: false,
    location: false,
    notes: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setUpdateData({});
      setFieldsToUpdate({
        loadType: false,
        powerKw: false,
        voltage: false,
        powerFactor: false,
        efficiency: false,
        demandFactor: false,
        startingCurrentMultiplier: false,
        location: false,
        notes: false
      });
      setErrors({});
    }
  }, [isOpen]);

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (fieldsToUpdate.powerKw && updateData.powerKw && updateData.powerKw <= 0) {
      newErrors.powerKw = 'Power must be greater than 0';
    }

    if (fieldsToUpdate.voltage && updateData.voltage && updateData.voltage <= 0) {
      newErrors.voltage = 'Voltage must be greater than 0';
    }

    if (fieldsToUpdate.powerFactor && updateData.powerFactor && 
        (updateData.powerFactor <= 0 || updateData.powerFactor > 1)) {
      newErrors.powerFactor = 'Power factor must be between 0 and 1';
    }

    if (fieldsToUpdate.efficiency && updateData.efficiency && 
        (updateData.efficiency <= 0 || updateData.efficiency > 100)) {
      newErrors.efficiency = 'Efficiency must be between 1 and 100';
    }

    if (fieldsToUpdate.demandFactor && updateData.demandFactor && 
        (updateData.demandFactor <= 0 || updateData.demandFactor > 1)) {
      newErrors.demandFactor = 'Demand factor must be between 0 and 1';
    }

    if (fieldsToUpdate.startingCurrentMultiplier && updateData.startingCurrentMultiplier && 
        updateData.startingCurrentMultiplier <= 0) {
      newErrors.startingCurrentMultiplier = 'Starting current multiplier must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [updateData, fieldsToUpdate]);

  // Handle field selection change
  const handleFieldToggle = useCallback((field: keyof FieldUpdateState) => {
    setFieldsToUpdate(prev => {
      const newState = { ...prev, [field]: !prev[field] };
      
      // Clear the data if field is unchecked
      if (!newState[field]) {
        setUpdateData(prevData => {
          const newData = { ...prevData };
          delete newData[field as keyof BulkUpdateData];
          return newData;
        });
      }
      
      return newState;
    });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle input changes
  const handleInputChange = useCallback((field: keyof BulkUpdateData, value: any) => {
    setUpdateData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if any fields are selected for update
    const hasSelectedFields = Object.values(fieldsToUpdate).some(Boolean);
    if (!hasSelectedFields) {
      showError('Please select at least one field to update');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      // Build the update object with only selected fields
      const updates: Partial<Load> = {};
      Object.entries(fieldsToUpdate).forEach(([key, shouldUpdate]) => {
        if (shouldUpdate) {
          const fieldKey = key as keyof BulkUpdateData;
          const value = updateData[fieldKey];
          if (value !== undefined) {
            (updates as any)[fieldKey] = typeof value === 'string' && value.trim() === '' ? undefined : value;
          }
        }
      });

      await onSave(updates, Object.keys(fieldsToUpdate).filter(key => fieldsToUpdate[key as keyof FieldUpdateState]));
      onClose();
    } catch (error) {
      showError(`Failed to update loads: ${error}`);
    }
  }, [fieldsToUpdate, updateData, validateForm, onSave, onClose, showError]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && e.ctrlKey) {
        handleSubmit(e as any);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleSubmit]);

  if (!isOpen) return null;

  const inputClass = "w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";
  const disabledInputClass = "w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-400";
  const errorInputClass = "w-full px-3 py-2 text-sm border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const errorClass = "text-red-600 text-xs mt-1";

  const getUniqueValues = (field: keyof Load): string[] => {
    const values = selectedLoads
      .map(load => load[field])
      .filter((value, index, arr) => value && arr.indexOf(value) === index)
      .map(v => String(v));
    return values;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Bulk Edit Loads</h2>
            <p className="text-sm text-gray-500 mt-1">
              Editing {selectedLoads.length} load{selectedLoads.length !== 1 ? 's' : ''}: {' '}
              {selectedLoads.slice(0, 3).map(l => l.tag).join(', ')}
              {selectedLoads.length > 3 && ` and ${selectedLoads.length - 3} more`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        {/* Instructions */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-start gap-2">
            <div className="text-blue-600 mt-0.5">ℹ️</div>
            <div className="text-sm text-blue-800">
              <p className="font-medium">How bulk edit works:</p>
              <p className="mt-1">
                Check the fields you want to update, then set their new values. 
                Only checked fields will be modified. Unchecked fields will remain unchanged.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const electricalFields = ['powerKw', 'voltage', 'powerFactor'];
                  setFieldsToUpdate(prev => {
                    const newState = { ...prev };
                    electricalFields.forEach(field => {
                      newState[field as keyof FieldUpdateState] = true;
                    });
                    return newState;
                  });
                }}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                disabled={isLoading}
              >
                Select Electrical Properties
              </button>
              <button
                type="button"
                onClick={() => {
                  const performanceFields = ['efficiency', 'demandFactor', 'startingCurrentMultiplier'];
                  setFieldsToUpdate(prev => {
                    const newState = { ...prev };
                    performanceFields.forEach(field => {
                      newState[field as keyof FieldUpdateState] = true;
                    });
                    return newState;
                  });
                }}
                className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
                disabled={isLoading}
              >
                Select Performance Properties
              </button>
              <button
                type="button"
                onClick={() => {
                  setFieldsToUpdate({
                    loadType: false,
                    powerKw: false,
                    voltage: false,
                    powerFactor: false,
                    efficiency: false,
                    demandFactor: false,
                    startingCurrentMultiplier: false,
                    location: false,
                    notes: false
                  });
                  setUpdateData({});
                }}
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Load Type */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.loadType}
                  onChange={() => handleFieldToggle('loadType')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Load Type</label>
              </div>
              <select
                value={updateData.loadType || ''}
                onChange={e => handleInputChange('loadType', e.target.value || undefined)}
                className={fieldsToUpdate.loadType ? inputClass : disabledInputClass}
                disabled={!fieldsToUpdate.loadType || isLoading}
              >
                <option value="">Select type...</option>
                <option value="Motor">Motor</option>
                <option value="Lighting">Lighting</option>
                <option value="HVAC">HVAC</option>
                <option value="Receptacle">Receptacle</option>
                <option value="UPS">UPS</option>
                <option value="Server">Server</option>
                <option value="Compressor">Compressor</option>
                <option value="Heater">Heater</option>
                <option value="Pump">Pump</option>
                <option value="Fan">Fan</option>
                <option value="Transformer">Transformer</option>
                <option value="Other">Other</option>
              </select>
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('loadType').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Power */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.powerKw}
                  onChange={() => handleFieldToggle('powerKw')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Power (kW)</label>
              </div>
              <input
                type="number"
                value={updateData.powerKw || ''}
                onChange={e => handleInputChange('powerKw', e.target.value ? Number(e.target.value) : undefined)}
                className={fieldsToUpdate.powerKw ? (errors.powerKw ? errorInputClass : inputClass) : disabledInputClass}
                placeholder="e.g., 15.5"
                min="0"
                step="0.1"
                disabled={!fieldsToUpdate.powerKw || isLoading}
              />
              {errors.powerKw && <div className={errorClass}>{errors.powerKw}</div>}
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('powerKw').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Voltage */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.voltage}
                  onChange={() => handleFieldToggle('voltage')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Voltage (V)</label>
              </div>
              <select
                value={updateData.voltage || ''}
                onChange={e => handleInputChange('voltage', e.target.value ? Number(e.target.value) : undefined)}
                className={fieldsToUpdate.voltage ? (errors.voltage ? errorInputClass : inputClass) : disabledInputClass}
                disabled={!fieldsToUpdate.voltage || isLoading}
              >
                <option value="">Select voltage...</option>
                <option value="120">120V</option>
                <option value="208">208V</option>
                <option value="240">240V</option>
                <option value="277">277V</option>
                <option value="480">480V</option>
                <option value="600">600V</option>
                <option value="4160">4160V</option>
                <option value="13800">13.8kV</option>
              </select>
              {errors.voltage && <div className={errorClass}>{errors.voltage}</div>}
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('voltage').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Power Factor */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.powerFactor}
                  onChange={() => handleFieldToggle('powerFactor')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Power Factor</label>
              </div>
              <input
                type="number"
                value={updateData.powerFactor || ''}
                onChange={e => handleInputChange('powerFactor', e.target.value ? Number(e.target.value) : undefined)}
                className={fieldsToUpdate.powerFactor ? (errors.powerFactor ? errorInputClass : inputClass) : disabledInputClass}
                placeholder="e.g., 0.85"
                min="0"
                max="1"
                step="0.01"
                disabled={!fieldsToUpdate.powerFactor || isLoading}
              />
              {errors.powerFactor && <div className={errorClass}>{errors.powerFactor}</div>}
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('powerFactor').join(', ') || 'Various or empty'} | 0-1 range
              </div>
            </div>

            {/* Efficiency */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.efficiency}
                  onChange={() => handleFieldToggle('efficiency')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Efficiency (%)</label>
              </div>
              <input
                type="number"
                value={updateData.efficiency || ''}
                onChange={e => handleInputChange('efficiency', e.target.value ? Number(e.target.value) : undefined)}
                className={fieldsToUpdate.efficiency ? (errors.efficiency ? errorInputClass : inputClass) : disabledInputClass}
                placeholder="e.g., 92"
                min="1"
                max="100"
                step="0.1"
                disabled={!fieldsToUpdate.efficiency || isLoading}
              />
              {errors.efficiency && <div className={errorClass}>{errors.efficiency}</div>}
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('efficiency').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Demand Factor */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.demandFactor}
                  onChange={() => handleFieldToggle('demandFactor')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Demand Factor</label>
              </div>
              <input
                type="number"
                value={updateData.demandFactor || ''}
                onChange={e => handleInputChange('demandFactor', e.target.value ? Number(e.target.value) : undefined)}
                className={fieldsToUpdate.demandFactor ? (errors.demandFactor ? errorInputClass : inputClass) : disabledInputClass}
                placeholder="e.g., 0.8"
                min="0"
                max="1"
                step="0.01"
                disabled={!fieldsToUpdate.demandFactor || isLoading}
              />
              {errors.demandFactor && <div className={errorClass}>{errors.demandFactor}</div>}
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('demandFactor').join(', ') || 'Various or empty'} | 0-1 range
              </div>
            </div>

            {/* Starting Current Multiplier */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.startingCurrentMultiplier}
                  onChange={() => handleFieldToggle('startingCurrentMultiplier')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Starting Current Multiplier</label>
              </div>
              <input
                type="number"
                value={updateData.startingCurrentMultiplier || ''}
                onChange={e => handleInputChange('startingCurrentMultiplier', e.target.value ? Number(e.target.value) : undefined)}
                className={fieldsToUpdate.startingCurrentMultiplier ? (errors.startingCurrentMultiplier ? errorInputClass : inputClass) : disabledInputClass}
                placeholder="e.g., 6"
                min="0"
                step="0.1"
                disabled={!fieldsToUpdate.startingCurrentMultiplier || isLoading}
              />
              {errors.startingCurrentMultiplier && <div className={errorClass}>{errors.startingCurrentMultiplier}</div>}
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('startingCurrentMultiplier').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Location */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.location}
                  onChange={() => handleFieldToggle('location')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Location</label>
              </div>
              <input
                type="text"
                value={updateData.location || ''}
                onChange={e => handleInputChange('location', e.target.value)}
                className={fieldsToUpdate.location ? inputClass : disabledInputClass}
                placeholder="e.g., Building A - Room 101"
                disabled={!fieldsToUpdate.location || isLoading}
              />
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('location').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Notes */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.notes}
                  onChange={() => handleFieldToggle('notes')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Notes</label>
              </div>
              <textarea
                value={updateData.notes || ''}
                onChange={e => handleInputChange('notes', e.target.value)}
                className={`${fieldsToUpdate.notes ? inputClass : disabledInputClass} h-20 resize-none`}
                placeholder="Additional notes or comments for all selected loads"
                disabled={!fieldsToUpdate.notes || isLoading}
              />
              <div className="text-xs text-gray-500 mt-1">
                Current: Various notes or empty
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            <span className="font-medium">Ctrl+Enter</span> to apply changes |
            <span className="ml-1">Only checked fields will be updated</span>
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
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              Update {selectedLoads.length} Load{selectedLoads.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkEditLoadModal;