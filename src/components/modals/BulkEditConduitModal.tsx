import React, { useState, useCallback, useEffect } from 'react';
import { Conduit } from '../../types';
import { useUI } from '../../contexts/UIContext';

interface BulkEditConduitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Conduit>, selectedFields: string[]) => Promise<void>;
  selectedConduits: Conduit[];
  isLoading?: boolean;
}

interface BulkUpdateData {
  type?: string;
  size?: string;
  internalDiameter?: number;
  maxFillPercentage?: number;
  fromLocation?: string;
  toLocation?: string;
  notes?: string;
}

interface FieldUpdateState {
  type: boolean;
  size: boolean;
  internalDiameter: boolean;
  maxFillPercentage: boolean;
  fromLocation: boolean;
  toLocation: boolean;
  notes: boolean;
}

export const BulkEditConduitModal: React.FC<BulkEditConduitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedConduits,
  isLoading = false
}) => {
  const { showError } = useUI();
  
  const [updateData, setUpdateData] = useState<BulkUpdateData>({});
  const [fieldsToUpdate, setFieldsToUpdate] = useState<FieldUpdateState>({
    type: false,
    size: false,
    internalDiameter: false,
    maxFillPercentage: false,
    fromLocation: false,
    toLocation: false,
    notes: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setUpdateData({});
      setFieldsToUpdate({
        type: false,
        size: false,
        internalDiameter: false,
        maxFillPercentage: false,
        fromLocation: false,
        toLocation: false,
        notes: false
      });
      setErrors({});
    }
  }, [isOpen]);

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (fieldsToUpdate.internalDiameter && updateData.internalDiameter && updateData.internalDiameter <= 0) {
      newErrors.internalDiameter = 'Internal diameter must be greater than 0';
    }

    if (fieldsToUpdate.maxFillPercentage && updateData.maxFillPercentage && 
        (updateData.maxFillPercentage <= 0 || updateData.maxFillPercentage > 100)) {
      newErrors.maxFillPercentage = 'Max fill percentage must be between 1 and 100';
    }

    // NEC compliance check for max fill percentage
    if (fieldsToUpdate.maxFillPercentage && updateData.maxFillPercentage && updateData.maxFillPercentage > 40) {
      newErrors.maxFillPercentage = 'NEC recommends maximum 40% fill for conduits';
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
      const updates: Partial<Conduit> = {};
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
      showError(`Failed to update conduits: ${error}`);
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

  const getUniqueValues = (field: keyof Conduit): string[] => {
    const values = selectedConduits
      .map(conduit => conduit[field])
      .filter((value, index, arr) => value && arr.indexOf(value) === index)
      .map(v => String(v));
    return values;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Bulk Edit Conduits</h2>
            <p className="text-sm text-gray-500 mt-1">
              Editing {selectedConduits.length} conduit{selectedConduits.length !== 1 ? 's' : ''}: {' '}
              {selectedConduits.slice(0, 3).map(c => c.tag).join(', ')}
              {selectedConduits.length > 3 && ` and ${selectedConduits.length - 3} more`}
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
                  const physicalFields = ['type', 'size', 'internalDiameter', 'maxFillPercentage'];
                  setFieldsToUpdate(prev => {
                    const newState = { ...prev };
                    physicalFields.forEach(field => {
                      newState[field as keyof FieldUpdateState] = true;
                    });
                    return newState;
                  });
                }}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                disabled={isLoading}
              >
                Select Physical Properties
              </button>
              <button
                type="button"
                onClick={() => {
                  const locationFields = ['fromLocation', 'toLocation'];
                  setFieldsToUpdate(prev => {
                    const newState = { ...prev };
                    locationFields.forEach(field => {
                      newState[field as keyof FieldUpdateState] = true;
                    });
                    return newState;
                  });
                }}
                className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
                disabled={isLoading}
              >
                Select Locations
              </button>
              <button
                type="button"
                onClick={() => {
                  setFieldsToUpdate({
                    type: false,
                    size: false,
                    internalDiameter: false,
                    maxFillPercentage: false,
                    fromLocation: false,
                    toLocation: false,
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
            
            {/* Type */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.type}
                  onChange={() => handleFieldToggle('type')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Type</label>
              </div>
              <select
                value={updateData.type || ''}
                onChange={e => handleInputChange('type', e.target.value || undefined)}
                className={fieldsToUpdate.type ? inputClass : disabledInputClass}
                disabled={!fieldsToUpdate.type || isLoading}
              >
                <option value="">Select type...</option>
                <option value="PVC">PVC (Polyvinyl Chloride)</option>
                <option value="EMT">EMT (Electrical Metallic Tubing)</option>
                <option value="RGS">RGS (Rigid Galvanized Steel)</option>
                <option value="RNC">RNC (Rigid Nonmetallic Conduit)</option>
                <option value="IMC">IMC (Intermediate Metal Conduit)</option>
                <option value="FMC">FMC (Flexible Metal Conduit)</option>
                <option value="LFMC">LFMC (Liquid-tight Flexible Metal Conduit)</option>
                <option value="LFNC">LFNC (Liquid-tight Flexible Nonmetallic Conduit)</option>
              </select>
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('type').join(', ') || 'Various or empty'}
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
                <option value="1/2">1/2"</option>
                <option value="3/4">3/4"</option>
                <option value="1">1"</option>
                <option value="1-1/4">1-1/4"</option>
                <option value="1-1/2">1-1/2"</option>
                <option value="2">2"</option>
                <option value="2-1/2">2-1/2"</option>
                <option value="3">3"</option>
                <option value="3-1/2">3-1/2"</option>
                <option value="4">4"</option>
                <option value="5">5"</option>
                <option value="6">6"</option>
              </select>
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('size').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Internal Diameter */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.internalDiameter}
                  onChange={() => handleFieldToggle('internalDiameter')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Internal Diameter (mm)</label>
              </div>
              <input
                type="number"
                value={updateData.internalDiameter || ''}
                onChange={e => handleInputChange('internalDiameter', e.target.value ? Number(e.target.value) : undefined)}
                className={fieldsToUpdate.internalDiameter ? (errors.internalDiameter ? errorInputClass : inputClass) : disabledInputClass}
                placeholder="e.g., 25.4"
                min="0"
                step="0.1"
                disabled={!fieldsToUpdate.internalDiameter || isLoading}
              />
              {errors.internalDiameter && <div className={errorClass}>{errors.internalDiameter}</div>}
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('internalDiameter').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Max Fill Percentage */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.maxFillPercentage}
                  onChange={() => handleFieldToggle('maxFillPercentage')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Max Fill Percentage (%)</label>
              </div>
              <input
                type="number"
                value={updateData.maxFillPercentage || ''}
                onChange={e => handleInputChange('maxFillPercentage', e.target.value ? Number(e.target.value) : undefined)}
                className={fieldsToUpdate.maxFillPercentage ? (errors.maxFillPercentage ? errorInputClass : inputClass) : disabledInputClass}
                placeholder="e.g., 40"
                min="1"
                max="100"
                disabled={!fieldsToUpdate.maxFillPercentage || isLoading}
              />
              {errors.maxFillPercentage && <div className={errorClass}>{errors.maxFillPercentage}</div>}
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('maxFillPercentage').join(', ') || 'Various or empty'} | NEC recommends 40% max
              </div>
            </div>

            {/* From Location */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.fromLocation}
                  onChange={() => handleFieldToggle('fromLocation')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>From Location</label>
              </div>
              <input
                type="text"
                value={updateData.fromLocation || ''}
                onChange={e => handleInputChange('fromLocation', e.target.value)}
                className={fieldsToUpdate.fromLocation ? inputClass : disabledInputClass}
                placeholder="e.g., MCC Room"
                disabled={!fieldsToUpdate.fromLocation || isLoading}
              />
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('fromLocation').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* To Location */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.toLocation}
                  onChange={() => handleFieldToggle('toLocation')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>To Location</label>
              </div>
              <input
                type="text"
                value={updateData.toLocation || ''}
                onChange={e => handleInputChange('toLocation', e.target.value)}
                className={fieldsToUpdate.toLocation ? inputClass : disabledInputClass}
                placeholder="e.g., Control Panel"
                disabled={!fieldsToUpdate.toLocation || isLoading}
              />
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('toLocation').join(', ') || 'Various or empty'}
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
                placeholder="Additional notes or comments for all selected conduits"
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
              Update {selectedConduits.length} Conduit{selectedConduits.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkEditConduitModal;