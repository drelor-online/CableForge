import React, { useState, useCallback, useEffect } from 'react';
import { Conduit, ConduitFormData, ConduitType, Cable } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { X, Save, AlertTriangle, Package, Info } from 'lucide-react';

interface EditConduitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, conduitData: Partial<Conduit>) => Promise<void>;
  conduit: Conduit | null;
  cables: Cable[];
  isLoading?: boolean;
}

export const EditConduitModal: React.FC<EditConduitModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  conduit,
  cables,
  isLoading = false
}) => {
  const { showError, showSuccess } = useUI();
  
  const [formData, setFormData] = useState<ConduitFormData>({
    tag: '',
    description: '',
    type: undefined,
    size: '',
    internalDiameter: undefined,
    fromLocation: '',
    toLocation: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when conduit changes
  useEffect(() => {
    if (isOpen && conduit) {
      const newFormData: ConduitFormData = {
        tag: conduit.tag || '',
        description: conduit.description || '',
        type: conduit.type,
        size: conduit.size || '',
        internalDiameter: conduit.internalDiameter,
        fromLocation: conduit.fromLocation || '',
        toLocation: conduit.toLocation || '',
        notes: conduit.notes || ''
      };
      setFormData(newFormData);
      setHasChanges(false);
      setErrors({});
    }
  }, [isOpen, conduit]);

  // Track changes
  useEffect(() => {
    if (conduit) {
      const hasFormChanges = 
        formData.tag !== (conduit.tag || '') ||
        formData.description !== (conduit.description || '') ||
        formData.type !== conduit.type ||
        formData.size !== (conduit.size || '') ||
        formData.internalDiameter !== conduit.internalDiameter ||
        formData.fromLocation !== (conduit.fromLocation || '') ||
        formData.toLocation !== (conduit.toLocation || '') ||
        formData.notes !== (conduit.notes || '');
      
      setHasChanges(hasFormChanges);
    }
  }, [formData, conduit]);

  const handleInputChange = useCallback((field: keyof ConduitFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.tag?.trim()) {
      newErrors.tag = 'Tag is required';
    }

    // Tag format validation
    if (formData.tag && !/^[A-Z][A-Z0-9_-]*$/i.test(formData.tag)) {
      newErrors.tag = 'Tag must start with a letter and contain only letters, numbers, underscores, and hyphens';
    }

    // Size validation
    if (formData.size && !/^\d+(\.\d+)?"?\s*(mm|in)?$/i.test(formData.size)) {
      newErrors.size = 'Size must be a number with optional unit (e.g., "25mm", "1in")';
    }

    // Internal diameter validation
    if (formData.internalDiameter !== undefined && formData.internalDiameter <= 0) {
      newErrors.internalDiameter = 'Internal diameter must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!conduit || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updateData: Partial<Conduit> = {
        tag: formData.tag.trim(),
        description: formData.description?.trim() || undefined,
        type: formData.type,
        size: formData.size?.trim() || undefined,
        internalDiameter: formData.internalDiameter,
        fromLocation: formData.fromLocation?.trim() || undefined,
        toLocation: formData.toLocation?.trim() || undefined,
        notes: formData.notes?.trim() || undefined
      };

      await onUpdate(conduit.id!, updateData);
      showSuccess('Conduit updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update conduit:', error);
      showError(`Failed to update conduit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, conduit, validateForm, onUpdate, showSuccess, showError, onClose]);

  const handleClose = useCallback(() => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [hasChanges, onClose]);

  // Get cables routed through this conduit
  const routedCables = cables.filter(cable => cable.conduitId === conduit?.id);

  // Get fill information
  const fillPercentage = conduit?.fillPercentage || 0;
  const maxFillPercentage = conduit?.maxFillPercentage || 40;
  const isOverFilled = fillPercentage > maxFillPercentage;

  if (!isOpen || !conduit) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-orange-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Conduit</h2>
              <p className="text-sm text-gray-600">Tag: {conduit.tag}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-2"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col max-h-full">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tag <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => handleInputChange('tag', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.tag ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., C-101"
                    disabled={isSubmitting}
                  />
                  {errors.tag && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {errors.tag}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="e.g., Power cable conduit"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Physical Specifications */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Physical Specifications</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={formData.type || ''}
                      onChange={(e) => handleInputChange('type', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      disabled={isSubmitting}
                    >
                      <option value="">Select type</option>
                      {Object.values(ConduitType).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size
                    </label>
                    <input
                      type="text"
                      value={formData.size || ''}
                      onChange={(e) => handleInputChange('size', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                        errors.size ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 25mm, 1in"
                      disabled={isSubmitting}
                    />
                    {errors.size && (
                      <p className="mt-1 text-sm text-red-600">{errors.size}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Internal Diameter (mm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.internalDiameter || ''}
                      onChange={(e) => handleInputChange('internalDiameter', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                        errors.internalDiameter ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.0"
                      disabled={isSubmitting}
                    />
                    {errors.internalDiameter && (
                      <p className="mt-1 text-sm text-red-600">{errors.internalDiameter}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Routing Information */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Routing Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Location
                    </label>
                    <input
                      type="text"
                      value={formData.fromLocation || ''}
                      onChange={(e) => handleInputChange('fromLocation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="e.g., MCC-1"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Location
                    </label>
                    <input
                      type="text"
                      value={formData.toLocation || ''}
                      onChange={(e) => handleInputChange('toLocation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="e.g., Motor M-101"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Fill Information */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Fill Information (Read-only)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="text-sm text-gray-600">Current Fill</div>
                    <div className={`text-lg font-semibold ${isOverFilled ? 'text-red-600' : 'text-green-600'}`}>
                      {fillPercentage.toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="text-sm text-gray-600">Max Fill (NEC)</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {maxFillPercentage.toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="text-sm text-gray-600">Status</div>
                    <div className={`text-lg font-semibold ${isOverFilled ? 'text-red-600' : 'text-green-600'}`}>
                      {isOverFilled ? 'Over-filled' : 'OK'}
                    </div>
                  </div>
                </div>

                {isOverFilled && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Warning: Conduit is over-filled</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      This conduit exceeds the NEC maximum fill percentage. Consider using a larger conduit or distributing cables across multiple conduits.
                    </p>
                  </div>
                )}
              </div>

              {/* Associated Cables */}
              {routedCables.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Associated Cables ({routedCables.length})
                  </h3>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {routedCables.map(cable => (
                      <div key={cable.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                        <div>
                          <span className="font-medium text-gray-900">{cable.tag}</span>
                          {cable.description && (
                            <span className="ml-2 text-sm text-gray-600">- {cable.description}</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {cable.cableType} - {cable.size}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows={3}
                  placeholder="Additional notes..."
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              {hasChanges && '• Unsaved changes'}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!hasChanges || isSubmitting || isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};