import React, { useState, useCallback, useEffect } from 'react';
import { Load, LoadFormData, LoadType, StarterType, ProtectionType, Cable } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { X, Save, AlertTriangle, Zap, Calculator } from 'lucide-react';

interface EditLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, loadData: Partial<Load>) => Promise<void>;
  load: Load | null;
  cables: Cable[];
  isLoading?: boolean;
}

export const EditLoadModal: React.FC<EditLoadModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  load,
  cables,
  isLoading = false
}) => {
  const { showError, showSuccess } = useUI();
  
  const [formData, setFormData] = useState<LoadFormData>({
    tag: '',
    description: '',
    loadType: undefined,
    powerKw: undefined,
    powerHp: undefined,
    voltage: undefined,
    current: undefined,
    powerFactor: undefined,
    efficiency: undefined,
    demandFactor: undefined,
    connectedLoadKw: undefined,
    demandLoadKw: undefined,
    cableId: undefined,
    feederCable: '',
    starterType: undefined,
    protectionType: undefined,
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when load changes
  useEffect(() => {
    if (isOpen && load) {
      const newFormData: LoadFormData = {
        tag: load.tag || '',
        description: load.description || '',
        loadType: load.loadType as LoadType,
        powerKw: load.powerKw,
        powerHp: load.powerHp,
        voltage: load.voltage,
        current: load.current,
        powerFactor: load.powerFactor,
        efficiency: load.efficiency,
        demandFactor: load.demandFactor,
        connectedLoadKw: load.connectedLoadKw,
        demandLoadKw: load.demandLoadKw,
        cableId: load.cableId,
        feederCable: load.feederCable || '',
        starterType: load.starterType as StarterType,
        protectionType: load.protectionType as ProtectionType,
        notes: load.notes || ''
      };
      setFormData(newFormData);
      setHasChanges(false);
      setErrors({});
    }
  }, [isOpen, load]);

  // Track changes
  useEffect(() => {
    if (load) {
      const hasFormChanges = 
        formData.tag !== (load.tag || '') ||
        formData.description !== (load.description || '') ||
        formData.loadType !== load.loadType ||
        formData.powerKw !== load.powerKw ||
        formData.powerHp !== load.powerHp ||
        formData.voltage !== load.voltage ||
        formData.current !== load.current ||
        formData.powerFactor !== load.powerFactor ||
        formData.efficiency !== load.efficiency ||
        formData.demandFactor !== load.demandFactor ||
        formData.connectedLoadKw !== load.connectedLoadKw ||
        formData.demandLoadKw !== load.demandLoadKw ||
        formData.cableId !== load.cableId ||
        formData.feederCable !== (load.feederCable || '') ||
        formData.starterType !== load.starterType ||
        formData.protectionType !== load.protectionType ||
        formData.notes !== (load.notes || '');
      
      setHasChanges(hasFormChanges);
    }
  }, [formData, load]);

  // Auto-calculate values
  useEffect(() => {
    // Calculate connected load from power and demand factor
    if (formData.powerKw && formData.demandFactor) {
      const calculatedConnectedLoad = formData.powerKw;
      const calculatedDemandLoad = formData.powerKw * (formData.demandFactor / 100);
      
      setFormData(prev => ({
        ...prev,
        connectedLoadKw: calculatedConnectedLoad,
        demandLoadKw: calculatedDemandLoad
      }));
    }

    // Calculate current from power, voltage, and power factor
    if (formData.powerKw && formData.voltage && formData.powerFactor) {
      // I = P / (√3 × V × cosφ × η) for 3-phase
      const efficiency = formData.efficiency || 0.9; // Default 90% efficiency
      const calculatedCurrent = (formData.powerKw * 1000) / 
        (Math.sqrt(3) * formData.voltage * formData.powerFactor * efficiency);
      
      setFormData(prev => ({
        ...prev,
        current: Math.round(calculatedCurrent * 100) / 100 // Round to 2 decimal places
      }));
    }
  }, [formData.powerKw, formData.voltage, formData.powerFactor, formData.efficiency, formData.demandFactor]);

  const handleInputChange = useCallback((field: keyof LoadFormData, value: any) => {
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

    // Power validation
    if (formData.powerKw !== undefined && formData.powerKw < 0) {
      newErrors.powerKw = 'Power (kW) must be positive';
    }
    if (formData.powerHp !== undefined && formData.powerHp < 0) {
      newErrors.powerHp = 'Power (HP) must be positive';
    }

    // Electrical validation
    if (formData.voltage !== undefined && (formData.voltage < 0 || formData.voltage > 50000)) {
      newErrors.voltage = 'Voltage must be between 0 and 50,000V';
    }
    if (formData.current !== undefined && formData.current < 0) {
      newErrors.current = 'Current must be positive';
    }

    // Factor validation (0-1 or 0-100%)
    if (formData.powerFactor !== undefined && (formData.powerFactor < 0 || formData.powerFactor > 1)) {
      newErrors.powerFactor = 'Power factor must be between 0 and 1';
    }
    if (formData.efficiency !== undefined && (formData.efficiency < 0 || formData.efficiency > 1)) {
      newErrors.efficiency = 'Efficiency must be between 0 and 1';
    }
    if (formData.demandFactor !== undefined && (formData.demandFactor < 0 || formData.demandFactor > 100)) {
      newErrors.demandFactor = 'Demand factor must be between 0 and 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!load || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updateData: Partial<Load> = {
        tag: formData.tag.trim(),
        description: formData.description?.trim() || undefined,
        loadType: formData.loadType,
        powerKw: formData.powerKw,
        powerHp: formData.powerHp,
        voltage: formData.voltage,
        current: formData.current,
        powerFactor: formData.powerFactor,
        efficiency: formData.efficiency,
        demandFactor: formData.demandFactor,
        connectedLoadKw: formData.connectedLoadKw,
        demandLoadKw: formData.demandLoadKw,
        cableId: formData.cableId,
        feederCable: formData.feederCable?.trim() || undefined,
        starterType: formData.starterType,
        protectionType: formData.protectionType,
        notes: formData.notes?.trim() || undefined
      };

      await onUpdate(load.id!, updateData);
      showSuccess('Load updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update load:', error);
      showError(`Failed to update load: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, load, validateForm, onUpdate, showSuccess, showError, onClose]);

  const handleClose = useCallback(() => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [hasChanges, onClose]);

  // Get assigned cable info
  const assignedCable = cables.find(cable => cable.id === formData.cableId);

  if (!isOpen || !load) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Load</h2>
              <p className="text-sm text-gray-600">Tag: {load.tag}</p>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tag <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => handleInputChange('tag', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      errors.tag ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., M-101A"
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
                    Load Type
                  </label>
                  <select
                    value={formData.loadType || ''}
                    onChange={(e) => handleInputChange('loadType', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={isSubmitting}
                  >
                    <option value="">Select type</option>
                    {Object.values(LoadType).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Cooling water pump"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Power Specifications */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Power Specifications
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Power (kW)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.powerKw || ''}
                      onChange={(e) => handleInputChange('powerKw', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        errors.powerKw ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.0"
                      disabled={isSubmitting}
                    />
                    {errors.powerKw && (
                      <p className="mt-1 text-sm text-red-600">{errors.powerKw}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Power (HP)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.powerHp || ''}
                      onChange={(e) => handleInputChange('powerHp', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        errors.powerHp ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.0"
                      disabled={isSubmitting}
                    />
                    {errors.powerHp && (
                      <p className="mt-1 text-sm text-red-600">{errors.powerHp}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Voltage (V)
                    </label>
                    <input
                      type="number"
                      value={formData.voltage || ''}
                      onChange={(e) => handleInputChange('voltage', e.target.value ? parseInt(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        errors.voltage ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="480"
                      disabled={isSubmitting}
                    />
                    {errors.voltage && (
                      <p className="mt-1 text-sm text-red-600">{errors.voltage}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current (A)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.current || ''}
                      onChange={(e) => handleInputChange('current', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        errors.current ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Auto-calculated"
                      disabled={isSubmitting}
                    />
                    {errors.current && (
                      <p className="mt-1 text-sm text-red-600">{errors.current}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Power Factor
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={formData.powerFactor || ''}
                      onChange={(e) => handleInputChange('powerFactor', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        errors.powerFactor ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.85"
                      disabled={isSubmitting}
                    />
                    {errors.powerFactor && (
                      <p className="mt-1 text-sm text-red-600">{errors.powerFactor}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Efficiency
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={formData.efficiency || ''}
                      onChange={(e) => handleInputChange('efficiency', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        errors.efficiency ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.90"
                      disabled={isSubmitting}
                    />
                    {errors.efficiency && (
                      <p className="mt-1 text-sm text-red-600">{errors.efficiency}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Demand Factor (%)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={formData.demandFactor || ''}
                      onChange={(e) => handleInputChange('demandFactor', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        errors.demandFactor ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="80"
                      disabled={isSubmitting}
                    />
                    {errors.demandFactor && (
                      <p className="mt-1 text-sm text-red-600">{errors.demandFactor}</p>
                    )}
                  </div>
                </div>

                {/* Calculated Values */}
                {(formData.connectedLoadKw || formData.demandLoadKw) && (
                  <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                    <h4 className="text-sm font-medium text-green-900 mb-2">Calculated Values</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {formData.connectedLoadKw && (
                        <div>
                          <span className="text-green-700">Connected Load:</span>
                          <span className="ml-2 font-medium">{formData.connectedLoadKw.toFixed(2)} kW</span>
                        </div>
                      )}
                      {formData.demandLoadKw && (
                        <div>
                          <span className="text-green-700">Demand Load:</span>
                          <span className="ml-2 font-medium">{formData.demandLoadKw.toFixed(2)} kW</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Motor Control (show for Motor loads) */}
              {formData.loadType === LoadType.Motor && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Motor Control</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Starter Type
                      </label>
                      <select
                        value={formData.starterType || ''}
                        onChange={(e) => handleInputChange('starterType', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        disabled={isSubmitting}
                      >
                        <option value="">Select starter type</option>
                        {Object.values(StarterType).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Protection Type
                      </label>
                      <select
                        value={formData.protectionType || ''}
                        onChange={(e) => handleInputChange('protectionType', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        disabled={isSubmitting}
                      >
                        <option value="">Select protection type</option>
                        {Object.values(ProtectionType).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Cable Assignment */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cable Assignment</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned Cable
                    </label>
                    <select
                      value={formData.cableId || ''}
                      onChange={(e) => handleInputChange('cableId', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      disabled={isSubmitting}
                    >
                      <option value="">No cable assigned</option>
                      {cables.map(cable => (
                        <option key={cable.id} value={cable.id}>
                          {cable.tag} - {cable.description || 'No description'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Feeder Cable
                    </label>
                    <input
                      type="text"
                      value={formData.feederCable || ''}
                      onChange={(e) => handleInputChange('feederCable', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., MCC-1-01"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                
                {assignedCable && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Cable:</strong> {assignedCable.tag}<br />
                      <strong>From:</strong> {assignedCable.fromLocation} → <strong>To:</strong> {assignedCable.toLocation}<br />
                      <strong>Type:</strong> {assignedCable.cableType}, <strong>Size:</strong> {assignedCable.size}
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!hasChanges || isSubmitting || isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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