import React, { useState, useCallback, useEffect } from 'react';
import { Cable, CableFunction, SegregationClass } from '../../types';
import { useUI } from '../../contexts/UIContext';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<Cable>) => Promise<void>;
  selectedCables: Cable[];
  isLoading?: boolean;
}

interface BulkUpdateData {
  description?: string;
  function?: CableFunction;
  voltage?: number;
  cableType?: string;
  size?: string;
  cores?: number;
  fromLocation?: string;
  toLocation?: string;
  sparePercentage?: number;
  route?: string;
  segregationClass?: SegregationClass;
  manufacturer?: string;
  partNumber?: string;
  outerDiameter?: number;
  notes?: string;
  fromEquipment?: string;
  toEquipment?: string;
  length?: number;
}

interface FieldUpdateState {
  description: boolean;
  function: boolean;
  voltage: boolean;
  cableType: boolean;
  size: boolean;
  cores: boolean;
  fromLocation: boolean;
  toLocation: boolean;
  sparePercentage: boolean;
  route: boolean;
  segregationClass: boolean;
  manufacturer: boolean;
  partNumber: boolean;
  outerDiameter: boolean;
  notes: boolean;
  fromEquipment: boolean;
  toEquipment: boolean;
  length: boolean;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  selectedCables,
  isLoading = false
}) => {
  const { showError } = useUI();
  
  const [updateData, setUpdateData] = useState<BulkUpdateData>({});
  const [fieldsToUpdate, setFieldsToUpdate] = useState<FieldUpdateState>({
    description: false,
    function: false,
    voltage: false,
    cableType: false,
    size: false,
    cores: false,
    fromLocation: false,
    toLocation: false,
    sparePercentage: false,
    route: false,
    segregationClass: false,
    manufacturer: false,
    partNumber: false,
    outerDiameter: false,
    notes: false,
    fromEquipment: false,
    toEquipment: false,
    length: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setUpdateData({});
      setFieldsToUpdate({
        description: false,
        function: false,
        voltage: false,
        cableType: false,
        size: false,
        cores: false,
        fromLocation: false,
        toLocation: false,
        sparePercentage: false,
        route: false,
        segregationClass: false,
        manufacturer: false,
        partNumber: false,
        outerDiameter: false,
        notes: false,
        fromEquipment: false,
        toEquipment: false,
        length: false
      });
      setErrors({});
    }
  }, [isOpen]);

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (fieldsToUpdate.voltage && updateData.voltage && (updateData.voltage <= 0 || updateData.voltage > 50000)) {
      newErrors.voltage = 'Voltage must be between 1 and 50,000 volts';
    }

    if (fieldsToUpdate.sparePercentage && updateData.sparePercentage && (updateData.sparePercentage < 0 || updateData.sparePercentage > 100)) {
      newErrors.sparePercentage = 'Spare percentage must be between 0 and 100';
    }

    if (fieldsToUpdate.cores && updateData.cores && updateData.cores <= 0) {
      newErrors.cores = 'Number of cores must be greater than 0';
    }

    if (fieldsToUpdate.outerDiameter && updateData.outerDiameter && updateData.outerDiameter <= 0) {
      newErrors.outerDiameter = 'Outer diameter must be greater than 0';
    }

    if (fieldsToUpdate.length && updateData.length && updateData.length <= 0) {
      newErrors.length = 'Cable length must be greater than 0';
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
      const updates: Partial<Cable> = {};
      Object.entries(fieldsToUpdate).forEach(([key, shouldUpdate]) => {
        if (shouldUpdate) {
          const fieldKey = key as keyof BulkUpdateData;
          const value = updateData[fieldKey];
          if (value !== undefined) {
            (updates as any)[fieldKey] = typeof value === 'string' && value.trim() === '' ? undefined : value;
          }
        }
      });

      await onUpdate(updates);
      onClose();
    } catch (error) {
      showError(`Failed to update cables: ${error}`);
    }
  }, [fieldsToUpdate, updateData, validateForm, onUpdate, onClose, showError]);

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

  const getUniqueValues = (field: keyof Cable): string[] => {
    const values = selectedCables
      .map(cable => cable[field])
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
            <h2 className="text-xl font-semibold text-gray-900">Bulk Edit Cables</h2>
            <p className="text-sm text-gray-500 mt-1">
              Editing {selectedCables.length} cable{selectedCables.length !== 1 ? 's' : ''}: {' '}
              {selectedCables.slice(0, 3).map(c => c.tag).join(', ')}
              {selectedCables.length > 3 && ` and ${selectedCables.length - 3} more`}
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
                  const commonFields = ['description', 'function', 'voltage', 'route'];
                  setFieldsToUpdate(prev => {
                    const newState = { ...prev };
                    commonFields.forEach(field => {
                      newState[field as keyof FieldUpdateState] = true;
                    });
                    return newState;
                  });
                }}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                disabled={isLoading}
              >
                Select Common Fields
              </button>
              <button
                type="button"
                onClick={() => {
                  const physicalFields = ['cableType', 'size', 'cores', 'manufacturer', 'partNumber'];
                  setFieldsToUpdate(prev => {
                    const newState = { ...prev };
                    physicalFields.forEach(field => {
                      newState[field as keyof FieldUpdateState] = true;
                    });
                    return newState;
                  });
                }}
                className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
                disabled={isLoading}
              >
                Select Physical Properties
              </button>
              <button
                type="button"
                onClick={() => {
                  setFieldsToUpdate({
                    description: false,
                    function: false,
                    voltage: false,
                    cableType: false,
                    size: false,
                    cores: false,
                    fromLocation: false,
                    toLocation: false,
                    sparePercentage: false,
                    route: false,
                    segregationClass: false,
                    manufacturer: false,
                    partNumber: false,
                    outerDiameter: false,
                    notes: false,
                    fromEquipment: false,
                    toEquipment: false,
                    length: false
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
            
            {/* Description */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.description}
                  onChange={() => handleFieldToggle('description')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Description</label>
              </div>
              <input
                type="text"
                value={updateData.description || ''}
                onChange={e => handleInputChange('description', e.target.value)}
                className={fieldsToUpdate.description ? inputClass : disabledInputClass}
                placeholder="New description for all selected cables"
                disabled={!fieldsToUpdate.description || isLoading}
              />
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('description').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Function */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.function}
                  onChange={() => handleFieldToggle('function')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Function</label>
              </div>
              <select
                value={updateData.function || ''}
                onChange={e => handleInputChange('function', e.target.value || undefined)}
                className={fieldsToUpdate.function ? inputClass : disabledInputClass}
                disabled={!fieldsToUpdate.function || isLoading}
              >
                <option value="">Select function...</option>
                {Object.values(CableFunction).map(func => (
                  <option key={func} value={func}>{func}</option>
                ))}
              </select>
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('function').join(', ') || 'Various or empty'}
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
              <input
                type="number"
                value={updateData.voltage || ''}
                onChange={e => handleInputChange('voltage', e.target.value ? Number(e.target.value) : undefined)}
                className={fieldsToUpdate.voltage ? (errors.voltage ? errorInputClass : inputClass) : disabledInputClass}
                placeholder="e.g., 480"
                disabled={!fieldsToUpdate.voltage || isLoading}
              />
              {errors.voltage && <div className={errorClass}>{errors.voltage}</div>}
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('voltage').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Cable Type */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.cableType}
                  onChange={() => handleFieldToggle('cableType')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Cable Type</label>
              </div>
              <input
                type="text"
                value={updateData.cableType || ''}
                onChange={e => handleInputChange('cableType', e.target.value)}
                className={fieldsToUpdate.cableType ? inputClass : disabledInputClass}
                placeholder="e.g., TECK90, THWN-2"
                disabled={!fieldsToUpdate.cableType || isLoading}
              />
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('cableType').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Route */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.route}
                  onChange={() => handleFieldToggle('route')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Route</label>
              </div>
              <input
                type="text"
                value={updateData.route || ''}
                onChange={e => handleInputChange('route', e.target.value)}
                className={fieldsToUpdate.route ? inputClass : disabledInputClass}
                placeholder="e.g., TR-1, UG-2"
                disabled={!fieldsToUpdate.route || isLoading}
              />
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('route').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Segregation Class */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.segregationClass}
                  onChange={() => handleFieldToggle('segregationClass')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Segregation Class</label>
              </div>
              <select
                value={updateData.segregationClass || ''}
                onChange={e => handleInputChange('segregationClass', e.target.value || undefined)}
                className={fieldsToUpdate.segregationClass ? inputClass : disabledInputClass}
                disabled={!fieldsToUpdate.segregationClass || isLoading}
              >
                <option value="">Select segregation class...</option>
                {Object.values(SegregationClass).map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('segregationClass').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* From Equipment */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.fromEquipment}
                  onChange={() => handleFieldToggle('fromEquipment')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>From Equipment</label>
              </div>
              <input
                type="text"
                value={updateData.fromEquipment || ''}
                onChange={e => handleInputChange('fromEquipment', e.target.value)}
                className={fieldsToUpdate.fromEquipment ? inputClass : disabledInputClass}
                placeholder="e.g., MCC-01, Panel A"
                disabled={!fieldsToUpdate.fromEquipment || isLoading}
              />
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('fromEquipment').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* To Equipment */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.toEquipment}
                  onChange={() => handleFieldToggle('toEquipment')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>To Equipment</label>
              </div>
              <input
                type="text"
                value={updateData.toEquipment || ''}
                onChange={e => handleInputChange('toEquipment', e.target.value)}
                className={fieldsToUpdate.toEquipment ? inputClass : disabledInputClass}
                placeholder="e.g., Motor M-01, Light L-05"
                disabled={!fieldsToUpdate.toEquipment || isLoading}
              />
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('toEquipment').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Size */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.size}
                  onChange={() => handleFieldToggle('size')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Size</label>
              </div>
              <select
                value={updateData.size || ''}
                onChange={e => handleInputChange('size', e.target.value || undefined)}
                className={fieldsToUpdate.size ? inputClass : disabledInputClass}
                disabled={!fieldsToUpdate.size || isLoading}
              >
                <option value="">Select size...</option>
                <option value="14 AWG">14 AWG</option>
                <option value="12 AWG">12 AWG</option>
                <option value="10 AWG">10 AWG</option>
                <option value="8 AWG">8 AWG</option>
                <option value="6 AWG">6 AWG</option>
                <option value="4 AWG">4 AWG</option>
                <option value="2 AWG">2 AWG</option>
                <option value="1 AWG">1 AWG</option>
                <option value="1/0 AWG">1/0 AWG</option>
                <option value="2/0 AWG">2/0 AWG</option>
                <option value="3/0 AWG">3/0 AWG</option>
                <option value="4/0 AWG">4/0 AWG</option>
                <option value="250 MCM">250 MCM</option>
                <option value="300 MCM">300 MCM</option>
                <option value="350 MCM">350 MCM</option>
                <option value="400 MCM">400 MCM</option>
                <option value="500 MCM">500 MCM</option>
                <option value="600 MCM">600 MCM</option>
                <option value="750 MCM">750 MCM</option>
              </select>
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('size').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Cores */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.cores}
                  onChange={() => handleFieldToggle('cores')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Cores</label>
              </div>
              <input
                type="number"
                value={updateData.cores || ''}
                onChange={e => handleInputChange('cores', e.target.value ? Number(e.target.value) : undefined)}
                className={fieldsToUpdate.cores ? (errors.cores ? errorInputClass : inputClass) : disabledInputClass}
                placeholder="e.g., 3"
                min="1"
                disabled={!fieldsToUpdate.cores || isLoading}
              />
              {errors.cores && <div className={errorClass}>{errors.cores}</div>}
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('cores').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Length */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.length}
                  onChange={() => handleFieldToggle('length')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Length (ft)</label>
              </div>
              <input
                type="number"
                value={updateData.length || ''}
                onChange={e => handleInputChange('length', e.target.value ? Number(e.target.value) : undefined)}
                className={fieldsToUpdate.length ? (errors.length ? errorInputClass : inputClass) : disabledInputClass}
                placeholder="e.g., 150"
                min="0"
                step="0.1"
                disabled={!fieldsToUpdate.length || isLoading}
              />
              {errors.length && <div className={errorClass}>{errors.length}</div>}
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('length').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Manufacturer */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.manufacturer}
                  onChange={() => handleFieldToggle('manufacturer')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Manufacturer</label>
              </div>
              <input
                type="text"
                value={updateData.manufacturer || ''}
                onChange={e => handleInputChange('manufacturer', e.target.value)}
                className={fieldsToUpdate.manufacturer ? inputClass : disabledInputClass}
                placeholder="e.g., Southwire, General Cable"
                disabled={!fieldsToUpdate.manufacturer || isLoading}
              />
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('manufacturer').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Part Number */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.partNumber}
                  onChange={() => handleFieldToggle('partNumber')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Part Number</label>
              </div>
              <input
                type="text"
                value={updateData.partNumber || ''}
                onChange={e => handleInputChange('partNumber', e.target.value)}
                className={fieldsToUpdate.partNumber ? inputClass : disabledInputClass}
                placeholder="e.g., TC12-3C-600V"
                disabled={!fieldsToUpdate.partNumber || isLoading}
              />
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('partNumber').join(', ') || 'Various or empty'}
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
                placeholder="Additional notes or comments for all selected cables"
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
              Update {selectedCables.length} Cable{selectedCables.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkEditModal;