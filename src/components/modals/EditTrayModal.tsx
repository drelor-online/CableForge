import React, { useState, useCallback, useEffect } from 'react';
import { Tray, TrayFormData, TrayType, TrayMaterial, Cable } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { X, Save, AlertTriangle, Grid3X3, Info, Calculator } from 'lucide-react';

interface EditTrayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, trayData: Partial<Tray>) => Promise<void>;
  tray: Tray | null;
  cables: Cable[];
  isLoading?: boolean;
}

export const EditTrayModal: React.FC<EditTrayModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  tray,
  cables,
  isLoading = false
}) => {
  const { showError, showSuccess } = useUI();
  
  const [formData, setFormData] = useState<TrayFormData>({
    tag: '',
    description: '',
    type: undefined,
    width: undefined,
    height: undefined,
    length: undefined,
    material: undefined,
    fromLocation: '',
    toLocation: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when tray changes
  useEffect(() => {
    if (isOpen && tray) {
      const newFormData: TrayFormData = {
        tag: tray.tag || '',
        description: tray.description || '',
        type: tray.type,
        width: tray.width,
        height: tray.height,
        length: tray.length,
        material: tray.material,
        fromLocation: tray.fromLocation || '',
        toLocation: tray.toLocation || '',
        notes: tray.notes || ''
      };
      setFormData(newFormData);
      setHasChanges(false);
      setErrors({});
    }
  }, [isOpen, tray]);

  // Track changes
  useEffect(() => {
    if (tray) {
      const hasFormChanges = 
        formData.tag !== (tray.tag || '') ||
        formData.description !== (tray.description || '') ||
        formData.type !== tray.type ||
        formData.width !== tray.width ||
        formData.height !== tray.height ||
        formData.length !== tray.length ||
        formData.material !== tray.material ||
        formData.fromLocation !== (tray.fromLocation || '') ||
        formData.toLocation !== (tray.toLocation || '') ||
        formData.notes !== (tray.notes || '');
      
      setHasChanges(hasFormChanges);
    }
  }, [formData, tray]);

  const handleInputChange = useCallback((field: keyof TrayFormData, value: any) => {
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

    // Dimension validation
    if (formData.width !== undefined && formData.width <= 0) {
      newErrors.width = 'Width must be positive';
    }
    if (formData.height !== undefined && formData.height <= 0) {
      newErrors.height = 'Height must be positive';
    }
    if (formData.length !== undefined && formData.length <= 0) {
      newErrors.length = 'Length must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tray || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updateData: Partial<Tray> = {
        tag: formData.tag.trim(),
        description: formData.description?.trim() || undefined,
        type: formData.type,
        width: formData.width,
        height: formData.height,
        length: formData.length,
        material: formData.material,
        fromLocation: formData.fromLocation?.trim() || undefined,
        toLocation: formData.toLocation?.trim() || undefined,
        notes: formData.notes?.trim() || undefined
      };

      await onUpdate(tray.id!, updateData);
      showSuccess('Tray updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update tray:', error);
      showError(`Failed to update tray: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, tray, validateForm, onUpdate, showSuccess, showError, onClose]);

  const handleClose = useCallback(() => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [hasChanges, onClose]);

  // Get cables routed through this tray
  const routedCables = cables.filter(cable => cable.trayId === tray?.id);

  // Calculate cross-sectional area
  const crossSectionalArea = (formData.width && formData.height) ? 
    formData.width * formData.height : undefined;

  // Get fill information
  const fillPercentage = tray?.fillPercentage || 0;
  const maxFillPercentage = tray?.maxFillPercentage || 50;
  const isOverFilled = fillPercentage > maxFillPercentage;

  if (!isOpen || !tray) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Grid3X3 className="h-6 w-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Tray</h2>
              <p className="text-sm text-gray-600">Tag: {tray.tag}</p>
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
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.tag ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., T-101"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., Main power tray"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Physical Specifications */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Physical Specifications
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={formData.type || ''}
                      onChange={(e) => handleInputChange('type', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      disabled={isSubmitting}
                    >
                      <option value="">Select type</option>
                      {Object.values(TrayType).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Material
                    </label>
                    <select
                      value={formData.material || ''}
                      onChange={(e) => handleInputChange('material', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      disabled={isSubmitting}
                    >
                      <option value="">Select material</option>
                      {Object.values(TrayMaterial).map(material => (
                        <option key={material} value={material}>{material}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width (mm)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={formData.width || ''}
                      onChange={(e) => handleInputChange('width', e.target.value ? parseInt(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors.width ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 300"
                      disabled={isSubmitting}
                    />
                    {errors.width && (
                      <p className="mt-1 text-sm text-red-600">{errors.width}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (mm)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={formData.height || ''}
                      onChange={(e) => handleInputChange('height', e.target.value ? parseInt(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors.height ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 60"
                      disabled={isSubmitting}
                    />
                    {errors.height && (
                      <p className="mt-1 text-sm text-red-600">{errors.height}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Depth (mm)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={formData.length || ''}
                      onChange={(e) => handleInputChange('length', e.target.value ? parseInt(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors.length ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 50"
                      disabled={isSubmitting}
                    />
                    {errors.length && (
                      <p className="mt-1 text-sm text-red-600">{errors.length}</p>
                    )}
                  </div>
                </div>

                {/* Calculated Cross-sectional Area */}
                {crossSectionalArea && (
                  <div className="mt-4 p-3 bg-purple-50 rounded border border-purple-200">
                    <div className="text-sm text-purple-800">
                      <strong>Cross-sectional Area:</strong> {crossSectionalArea.toLocaleString()} mm²
                      {crossSectionalArea > 1000000 && (
                        <span className="ml-2">({(crossSectionalArea / 1000000).toFixed(2)} m²)</span>
                      )}
                    </div>
                  </div>
                )}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="e.g., Building A"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="e.g., Building B"
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
                      <span className="font-medium">Warning: Tray is over-filled</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      This tray exceeds the NEC maximum fill percentage. Consider using a larger tray or distributing cables across multiple trays.
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!hasChanges || isSubmitting || isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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