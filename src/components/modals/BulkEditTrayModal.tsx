import React, { useState, useCallback, useEffect } from 'react';
import { Tray } from '../../types';
import { useUI } from '../../contexts/UIContext';

interface BulkEditTrayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<Tray>) => Promise<void>;
  selectedTrays: Tray[];
  isLoading?: boolean;
}

interface BulkUpdateData {
  type?: string;
  material?: string;
  width?: number;
  height?: number;
  length?: number;
  maxFillPercentage?: number;
  supportSpacing?: number;
  loadRating?: number;
  notes?: string;
}

interface FieldUpdateState {
  type: boolean;
  material: boolean;
  width: boolean;
  height: boolean;
  length: boolean;
  maxFillPercentage: boolean;
  supportSpacing: boolean;
  loadRating: boolean;
  notes: boolean;
}

export const BulkEditTrayModal: React.FC<BulkEditTrayModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  selectedTrays,
  isLoading = false
}) => {
  const { showError } = useUI();
  
  const [updateData, setUpdateData] = useState<BulkUpdateData>({});
  const [fieldsToUpdate, setFieldsToUpdate] = useState<FieldUpdateState>({
    type: false,
    material: false,
    width: false,
    height: false,
    length: false,
    maxFillPercentage: false,
    supportSpacing: false,
    loadRating: false,
    notes: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setUpdateData({});
      setFieldsToUpdate({
        type: false,
        material: false,
        width: false,
        height: false,
        length: false,
        maxFillPercentage: false,
        supportSpacing: false,
        loadRating: false,
        notes: false
      });
      setErrors({});
    }
  }, [isOpen]);

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (fieldsToUpdate.width && updateData.width && updateData.width <= 0) {
      newErrors.width = 'Width must be greater than 0';
    }

    if (fieldsToUpdate.height && updateData.height && updateData.height <= 0) {
      newErrors.height = 'Height must be greater than 0';
    }

    if (fieldsToUpdate.length && updateData.length && updateData.length <= 0) {
      newErrors.length = 'Length must be greater than 0';
    }

    if (fieldsToUpdate.maxFillPercentage && updateData.maxFillPercentage && 
        (updateData.maxFillPercentage <= 0 || updateData.maxFillPercentage > 100)) {
      newErrors.maxFillPercentage = 'Max fill percentage must be between 1 and 100';
    }

    if (fieldsToUpdate.supportSpacing && updateData.supportSpacing && updateData.supportSpacing <= 0) {
      newErrors.supportSpacing = 'Support spacing must be greater than 0';
    }

    if (fieldsToUpdate.loadRating && updateData.loadRating && updateData.loadRating <= 0) {
      newErrors.loadRating = 'Load rating must be greater than 0';
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
      const updates: Partial<Tray> = {};
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
      showError(`Failed to update trays: ${error}`);
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

  const getUniqueValues = (field: keyof Tray): string[] => {
    const values = selectedTrays
      .map(tray => tray[field])
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
            <h2 className="text-xl font-semibold text-gray-900">Bulk Edit Cable Trays</h2>
            <p className="text-sm text-gray-500 mt-1">
              Editing {selectedTrays.length} tray{selectedTrays.length !== 1 ? 's' : ''}: {' '}
              {selectedTrays.slice(0, 3).map(t => t.tag).join(', ')}
              {selectedTrays.length > 3 && ` and ${selectedTrays.length - 3} more`}
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
                  const physicalFields = ['type', 'material', 'width', 'height', 'maxFillPercentage'];
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
                  const structuralFields = ['length', 'supportSpacing', 'loadRating'];
                  setFieldsToUpdate(prev => {
                    const newState = { ...prev };
                    structuralFields.forEach(field => {
                      newState[field as keyof FieldUpdateState] = true;
                    });
                    return newState;
                  });
                }}
                className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
                disabled={isLoading}
              >
                Select Structural Properties
              </button>
              <button
                type="button"
                onClick={() => {
                  setFieldsToUpdate({
                    type: false,
                    material: false,
                    width: false,
                    height: false,
                    length: false,
                    maxFillPercentage: false,
                    supportSpacing: false,
                    loadRating: false,
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
                <label className={labelClass}>Tray Type</label>
              </div>
              <select
                value={updateData.type || ''}
                onChange={e => handleInputChange('type', e.target.value || undefined)}
                className={fieldsToUpdate.type ? inputClass : disabledInputClass}
                disabled={!fieldsToUpdate.type || isLoading}
              >
                <option value="">Select type...</option>
                <option value="Ladder">Ladder Tray</option>
                <option value="Solid Bottom">Solid Bottom Tray</option>
                <option value="Ventilated">Ventilated Tray</option>
                <option value="Wire Mesh">Wire Mesh Tray</option>
                <option value="Channel">Channel Tray</option>
              </select>
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('type').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Material */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.material}
                  onChange={() => handleFieldToggle('material')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Material</label>
              </div>
              <select
                value={updateData.material || ''}
                onChange={e => handleInputChange('material', e.target.value || undefined)}
                className={fieldsToUpdate.material ? inputClass : disabledInputClass}
                disabled={!fieldsToUpdate.material || isLoading}
              >
                <option value="">Select material...</option>
                <option value="Aluminum">Aluminum</option>
                <option value="Galvanized Steel">Galvanized Steel</option>
                <option value="Stainless Steel">Stainless Steel</option>
                <option value="Fiberglass">Fiberglass (FRP)</option>
                <option value="PVC">PVC</option>
              </select>
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('material').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Width */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.width}
                  onChange={() => handleFieldToggle('width')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Width (mm)</label>
              </div>
              <input
                type="number"
                value={updateData.width || ''}
                onChange={e => handleInputChange('width', e.target.value ? Number(e.target.value) : undefined)}
                className={fieldsToUpdate.width ? (errors.width ? errorInputClass : inputClass) : disabledInputClass}
                placeholder="e.g., 300"
                min="0"
                step="1"
                disabled={!fieldsToUpdate.width || isLoading}
              />
              {errors.width && <div className={errorClass}>{errors.width}</div>}
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('width').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Height */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.height}
                  onChange={() => handleFieldToggle('height')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Height (mm)</label>
              </div>
              <input
                type="number"
                value={updateData.height || ''}
                onChange={e => handleInputChange('height', e.target.value ? Number(e.target.value) : undefined)}
                className={fieldsToUpdate.height ? (errors.height ? errorInputClass : inputClass) : disabledInputClass}
                placeholder="e.g., 100"
                min="0"
                step="1"
                disabled={!fieldsToUpdate.height || isLoading}
              />
              {errors.height && <div className={errorClass}>{errors.height}</div>}
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('height').join(', ') || 'Various or empty'}
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
                placeholder="e.g., 100"
                min="0"
                step="0.1"
                disabled={!fieldsToUpdate.length || isLoading}
              />
              {errors.length && <div className={errorClass}>{errors.length}</div>}
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('length').join(', ') || 'Various or empty'}
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
                placeholder="e.g., 50"
                min="1"
                max="100"
                disabled={!fieldsToUpdate.maxFillPercentage || isLoading}
              />
              {errors.maxFillPercentage && <div className={errorClass}>{errors.maxFillPercentage}</div>}
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('maxFillPercentage').join(', ') || 'Various or empty'} | Typically 50% max
              </div>
            </div>

            {/* Support Spacing */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.supportSpacing}
                  onChange={() => handleFieldToggle('supportSpacing')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Support Spacing (ft)</label>
              </div>
              <input
                type="number"
                value={updateData.supportSpacing || ''}
                onChange={e => handleInputChange('supportSpacing', e.target.value ? Number(e.target.value) : undefined)}
                className={fieldsToUpdate.supportSpacing ? (errors.supportSpacing ? errorInputClass : inputClass) : disabledInputClass}
                placeholder="e.g., 6"
                min="0"
                step="0.1"
                disabled={!fieldsToUpdate.supportSpacing || isLoading}
              />
              {errors.supportSpacing && <div className={errorClass}>{errors.supportSpacing}</div>}
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('supportSpacing').join(', ') || 'Various or empty'}
              </div>
            </div>

            {/* Load Rating */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={fieldsToUpdate.loadRating}
                  onChange={() => handleFieldToggle('loadRating')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label className={labelClass}>Load Rating (lbs/ft)</label>
              </div>
              <input
                type="number"
                value={updateData.loadRating || ''}
                onChange={e => handleInputChange('loadRating', e.target.value ? Number(e.target.value) : undefined)}
                className={fieldsToUpdate.loadRating ? (errors.loadRating ? errorInputClass : inputClass) : disabledInputClass}
                placeholder="e.g., 100"
                min="0"
                disabled={!fieldsToUpdate.loadRating || isLoading}
              />
              {errors.loadRating && <div className={errorClass}>{errors.loadRating}</div>}
              <div className="text-xs text-gray-500 mt-1">
                Current: {getUniqueValues('loadRating').join(', ') || 'Various or empty'}
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
                placeholder="Additional notes or comments for all selected trays"
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
              Update {selectedTrays.length} Tray{selectedTrays.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkEditTrayModal;