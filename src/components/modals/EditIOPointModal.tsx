import React, { useState, useCallback, useEffect } from 'react';
import { IOPoint, IOPointFormData, SignalType, IOType, Cable, PLCCard } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { X, Save, AlertTriangle, Zap } from 'lucide-react';

interface EditIOPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, ioPointData: Partial<IOPoint>) => Promise<void>;
  ioPoint: IOPoint | null;
  cables: Cable[];
  plcCards: PLCCard[];
  isLoading?: boolean;
}

export const EditIOPointModal: React.FC<EditIOPointModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  ioPoint,
  cables,
  plcCards,
  isLoading = false
}) => {
  const { showError, showSuccess } = useUI();
  
  const [formData, setFormData] = useState<IOPointFormData>({
    tag: '',
    description: '',
    signalType: undefined,
    ioType: undefined,
    plcName: '',
    rack: undefined,
    slot: undefined,
    channel: undefined,
    terminalBlock: '',
    cableId: undefined,
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when IO point changes
  useEffect(() => {
    if (isOpen && ioPoint) {
      const newFormData: IOPointFormData = {
        tag: ioPoint.tag || '',
        description: ioPoint.description || '',
        signalType: ioPoint.signalType,
        ioType: ioPoint.ioType,
        plcName: ioPoint.plcName || '',
        rack: ioPoint.rack,
        slot: ioPoint.slot,
        channel: ioPoint.channel,
        terminalBlock: ioPoint.terminalBlock || '',
        cableId: ioPoint.cableId,
        notes: ioPoint.notes || ''
      };
      setFormData(newFormData);
      setHasChanges(false);
      setErrors({});
    }
  }, [isOpen, ioPoint]);

  // Track changes
  useEffect(() => {
    if (ioPoint) {
      const hasFormChanges = 
        formData.tag !== (ioPoint.tag || '') ||
        formData.description !== (ioPoint.description || '') ||
        formData.signalType !== ioPoint.signalType ||
        formData.ioType !== ioPoint.ioType ||
        formData.plcName !== (ioPoint.plcName || '') ||
        formData.rack !== ioPoint.rack ||
        formData.slot !== ioPoint.slot ||
        formData.channel !== ioPoint.channel ||
        formData.terminalBlock !== (ioPoint.terminalBlock || '') ||
        formData.cableId !== ioPoint.cableId ||
        formData.notes !== (ioPoint.notes || '');
      
      setHasChanges(hasFormChanges);
    }
  }, [formData, ioPoint]);

  const handleInputChange = useCallback((field: keyof IOPointFormData, value: any) => {
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

    // PLC assignment validation
    if (formData.plcName && !formData.rack) {
      newErrors.rack = 'Rack is required when PLC is assigned';
    }
    if (formData.rack && !formData.slot) {
      newErrors.slot = 'Slot is required when rack is assigned';
    }
    if (formData.slot && !formData.channel) {
      newErrors.channel = 'Channel is required when slot is assigned';
    }

    // Numeric validation
    if (formData.rack !== undefined && (formData.rack < 0 || formData.rack > 99)) {
      newErrors.rack = 'Rack must be between 0 and 99';
    }
    if (formData.slot !== undefined && (formData.slot < 0 || formData.slot > 31)) {
      newErrors.slot = 'Slot must be between 0 and 31';
    }
    if (formData.channel !== undefined && (formData.channel < 0 || formData.channel > 31)) {
      newErrors.channel = 'Channel must be between 0 and 31';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ioPoint || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updateData: Partial<IOPoint> = {
        tag: formData.tag.trim(),
        description: formData.description?.trim() || undefined,
        signalType: formData.signalType,
        ioType: formData.ioType,
        plcName: formData.plcName?.trim() || undefined,
        rack: formData.rack,
        slot: formData.slot,
        channel: formData.channel,
        terminalBlock: formData.terminalBlock?.trim() || undefined,
        cableId: formData.cableId,
        notes: formData.notes?.trim() || undefined
      };

      await onUpdate(ioPoint.id!, updateData);
      showSuccess('IO point updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update IO point:', error);
      showError(`Failed to update IO point: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, ioPoint, validateForm, onUpdate, showSuccess, showError, onClose]);

  const handleClose = useCallback(() => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [hasChanges, onClose]);

  // Get assigned cable info
  const assignedCable = cables.find(cable => cable.id === formData.cableId);

  // Get available PLC names
  const availablePLCs = plcCards.map(plc => plc.name).filter(Boolean);

  if (!isOpen || !ioPoint) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit IO Point</h2>
              <p className="text-sm text-gray-600">Tag: {ioPoint.tag}</p>
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
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.tag ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., PT-101A"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Pressure transmitter"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Signal and IO Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Signal Type
                  </label>
                  <select
                    value={formData.signalType || ''}
                    onChange={(e) => handleInputChange('signalType', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="">Select signal type</option>
                    {Object.values(SignalType).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IO Type
                  </label>
                  <select
                    value={formData.ioType || ''}
                    onChange={(e) => handleInputChange('ioType', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="">Select IO type</option>
                    {Object.values(IOType).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PLC Assignment */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">PLC Assignment</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PLC Name
                    </label>
                    <select
                      value={formData.plcName || ''}
                      onChange={(e) => handleInputChange('plcName', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSubmitting}
                    >
                      <option value="">Select PLC</option>
                      {availablePLCs.map(plcName => (
                        <option key={plcName} value={plcName}>{plcName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Terminal Block
                    </label>
                    <input
                      type="text"
                      value={formData.terminalBlock || ''}
                      onChange={(e) => handleInputChange('terminalBlock', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., TB-01"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rack
                    </label>
                    <input
                      type="number"
                      value={formData.rack || ''}
                      onChange={(e) => handleInputChange('rack', e.target.value ? parseInt(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.rack ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0-99"
                      min="0"
                      max="99"
                      disabled={isSubmitting}
                    />
                    {errors.rack && (
                      <p className="mt-1 text-sm text-red-600">{errors.rack}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slot
                    </label>
                    <input
                      type="number"
                      value={formData.slot || ''}
                      onChange={(e) => handleInputChange('slot', e.target.value ? parseInt(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.slot ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0-31"
                      min="0"
                      max="31"
                      disabled={isSubmitting}
                    />
                    {errors.slot && (
                      <p className="mt-1 text-sm text-red-600">{errors.slot}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Channel
                    </label>
                    <input
                      type="number"
                      value={formData.channel || ''}
                      onChange={(e) => handleInputChange('channel', e.target.value ? parseInt(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.channel ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0-31"
                      min="0"
                      max="31"
                      disabled={isSubmitting}
                    />
                    {errors.channel && (
                      <p className="mt-1 text-sm text-red-600">{errors.channel}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cable Assignment */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cable Assignment</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Cable
                  </label>
                  <select
                    value={formData.cableId || ''}
                    onChange={(e) => handleInputChange('cableId', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="">No cable assigned</option>
                    {cables.map(cable => (
                      <option key={cable.id} value={cable.id}>
                        {cable.tag} - {cable.description || 'No description'}
                      </option>
                    ))}
                  </select>
                  
                  {assignedCable && (
                    <div className="mt-2 p-2 bg-blue-50 rounded border">
                      <p className="text-sm text-blue-800">
                        <strong>Cable:</strong> {assignedCable.tag}<br />
                        <strong>From:</strong> {assignedCable.fromLocation} → <strong>To:</strong> {assignedCable.toLocation}<br />
                        <strong>Type:</strong> {assignedCable.cableType}, <strong>Size:</strong> {assignedCable.size}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!hasChanges || isSubmitting || isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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