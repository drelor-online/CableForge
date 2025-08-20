import React, { useState, useCallback, useEffect } from 'react';
import { Cable, CableFunction, SegregationClass, CableFormData } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { validationService } from '../../services/validation-service';

interface EditCableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, cableData: Partial<Cable>) => Promise<void>;
  cable: Cable | null;
  isLoading?: boolean;
}

export const EditCableModal: React.FC<EditCableModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  cable,
  isLoading = false
}) => {
  const { showError } = useUI();
  
  const [formData, setFormData] = useState<CableFormData>({
    tag: '',
    description: '',
    function: undefined,
    voltage: undefined,
    cableType: '',
    size: '',
    cores: undefined,
    fromLocation: '',
    fromEquipment: '',
    toLocation: '',
    toEquipment: '',
    length: undefined,
    sparePercentage: undefined,
    route: '',
    segregationClass: undefined,
    manufacturer: '',
    partNumber: '',
    outerDiameter: undefined,
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isCheckingTag, setIsCheckingTag] = useState(false);

  // Populate form when cable changes
  useEffect(() => {
    if (isOpen && cable) {
      const newFormData: CableFormData = {
        tag: cable.tag || '',
        description: cable.description || '',
        function: cable.function,
        voltage: cable.voltage,
        cableType: cable.cableType || '',
        size: cable.size || '',
        cores: cable.cores,
        fromLocation: cable.fromLocation || '',
        fromEquipment: cable.fromEquipment || '',
        toLocation: cable.toLocation || '',
        toEquipment: cable.toEquipment || '',
        length: cable.length,
        sparePercentage: cable.sparePercentage,
        route: cable.route || '',
        segregationClass: cable.segregationClass,
        manufacturer: cable.manufacturer || '',
        partNumber: cable.partNumber || '',
        outerDiameter: cable.outerDiameter,
        notes: cable.notes || ''
      };
      setFormData(newFormData);
      setHasChanges(false);
      setErrors({});
    }
  }, [isOpen, cable]);

  // Track changes
  useEffect(() => {
    if (!cable) {
      setHasChanges(false);
      return;
    }

    const changed = 
      formData.tag !== (cable.tag || '') ||
      formData.description !== (cable.description || '') ||
      formData.function !== cable.function ||
      formData.voltage !== cable.voltage ||
      formData.cableType !== (cable.cableType || '') ||
      formData.size !== (cable.size || '') ||
      formData.cores !== cable.cores ||
      formData.fromLocation !== (cable.fromLocation || '') ||
      formData.fromEquipment !== (cable.fromEquipment || '') ||
      formData.toLocation !== (cable.toLocation || '') ||
      formData.toEquipment !== (cable.toEquipment || '') ||
      formData.length !== cable.length ||
      formData.sparePercentage !== cable.sparePercentage ||
      formData.route !== (cable.route || '') ||
      formData.segregationClass !== cable.segregationClass ||
      formData.manufacturer !== (cable.manufacturer || '') ||
      formData.partNumber !== (cable.partNumber || '') ||
      formData.outerDiameter !== cable.outerDiameter ||
      formData.notes !== (cable.notes || '');

    setHasChanges(changed);
  }, [formData, cable]);

  // Validation (same as AddCableModal)
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tag.trim()) {
      newErrors.tag = 'Tag is required';
    } else if (!/^[A-Z0-9-_]+$/i.test(formData.tag)) {
      newErrors.tag = 'Tag can only contain letters, numbers, hyphens, and underscores';
    }

    if (formData.voltage && (formData.voltage <= 0 || formData.voltage > 50000)) {
      newErrors.voltage = 'Voltage must be between 1 and 50,000 volts';
    }

    if (formData.length && formData.length <= 0) {
      newErrors.length = 'Length must be greater than 0';
    }

    if (formData.sparePercentage && (formData.sparePercentage < 0 || formData.sparePercentage > 100)) {
      newErrors.sparePercentage = 'Spare percentage must be between 0 and 100';
    }

    if (formData.cores && formData.cores <= 0) {
      newErrors.cores = 'Number of cores must be greater than 0';
    }

    if (formData.outerDiameter && formData.outerDiameter <= 0) {
      newErrors.outerDiameter = 'Outer diameter must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Debounced duplicate tag checking
  const checkDuplicateTag = useCallback(
    async (tag: string) => {
      if (!tag.trim() || !cable?.id) return;
      
      setIsCheckingTag(true);
      try {
        const isDuplicate = await validationService.checkDuplicateTag(tag, cable.id);
        if (isDuplicate) {
          setErrors(prev => ({
            ...prev,
            tag: 'This cable tag already exists'
          }));
        } else {
          setErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors.tag === 'This cable tag already exists') {
              delete newErrors.tag;
            }
            return newErrors;
          });
        }
      } catch (error) {
        console.error('Failed to check duplicate tag:', error);
      } finally {
        setIsCheckingTag(false);
      }
    },
    [cable?.id]
  );

  // Debounce the duplicate check
  useEffect(() => {
    if (!formData.tag.trim() || !cable?.id) return;
    
    const timeoutId = setTimeout(() => {
      checkDuplicateTag(formData.tag);
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [formData.tag, checkDuplicateTag, cable?.id]);

  // Handle input changes
  const handleInputChange = useCallback((field: keyof CableFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing (except duplicate check)
    if (errors[field] && errors[field] !== 'This cable tag already exists') {
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

    if (!cable?.id) {
      showError('No cable selected for editing');
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (!hasChanges) {
      onClose();
      return;
    }

    try {
      // Convert form data to Cable interface
      const cableData: Partial<Cable> = {
        tag: formData.tag.trim(),
        description: formData.description?.trim() || undefined,
        function: formData.function,
        voltage: formData.voltage,
        cableType: formData.cableType?.trim() || undefined,
        size: formData.size?.trim() || undefined,
        cores: formData.cores,
        fromLocation: formData.fromLocation?.trim() || undefined,
        fromEquipment: formData.fromEquipment?.trim() || undefined,
        toLocation: formData.toLocation?.trim() || undefined,
        toEquipment: formData.toEquipment?.trim() || undefined,
        length: formData.length,
        sparePercentage: formData.sparePercentage,
        route: formData.route?.trim() || undefined,
        segregationClass: formData.segregationClass,
        manufacturer: formData.manufacturer?.trim() || undefined,
        partNumber: formData.partNumber?.trim() || undefined,
        outerDiameter: formData.outerDiameter,
        notes: formData.notes?.trim() || undefined,
      };

      await onUpdate(cable.id, cableData);
      onClose();
    } catch (error) {
      showError(`Failed to update cable: ${error}`);
    }
  }, [formData, cable?.id, validateForm, hasChanges, onUpdate, onClose, showError]);

  // Handle modal close with unsaved changes warning
  const handleClose = useCallback(async () => {
    if (hasChanges) {
      // Simple confirm for now - could be enhanced with custom modal
      const confirmDiscard = window.confirm('You have unsaved changes. Are you sure you want to close without saving?');
      if (!confirmDiscard) {
        return;
      }
    }
    onClose();
  }, [hasChanges, onClose]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'Enter' && e.ctrlKey) {
        handleSubmit(e as any);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, handleSubmit]);

  if (!isOpen || !cable) return null;

  const inputClass = "w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";
  const errorInputClass = "w-full px-3 py-2 text-sm border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const errorClass = "text-red-600 text-xs mt-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Cable</h2>
            <p className="text-sm text-gray-500 mt-1">Cable: {cable.tag}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Tag - Required */}
            <div className="md:col-span-2">
              <label className={labelClass}>
                Cable Tag <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.tag}
                  onChange={e => handleInputChange('tag', e.target.value)}
                  className={`${errors.tag ? errorInputClass : inputClass} pr-10`}
                  placeholder="e.g., PC-001"
                  disabled={isLoading}
                  autoFocus
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {isCheckingTag ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin"></div>
                  ) : formData.tag.trim() && !errors.tag ? (
                    <span className="text-green-500">✓</span>
                  ) : formData.tag.trim() && errors.tag === 'This cable tag already exists' ? (
                    <span className="text-red-500">⚠</span>
                  ) : null}
                </div>
              </div>
              {errors.tag && <div className={errorClass}>{errors.tag}</div>}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className={labelClass}>Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                className={inputClass}
                placeholder="Brief description of cable purpose"
                disabled={isLoading}
              />
            </div>

            {/* Function */}
            <div>
              <label className={labelClass}>Function</label>
              <select
                value={formData.function || ''}
                onChange={e => handleInputChange('function', e.target.value || undefined)}
                className={inputClass}
                disabled={isLoading}
              >
                <option value="">Select function...</option>
                {Object.values(CableFunction).map(func => (
                  <option key={func} value={func}>{func}</option>
                ))}
              </select>
            </div>

            {/* Voltage */}
            <div>
              <label className={labelClass}>Voltage (V)</label>
              <input
                type="number"
                value={formData.voltage || ''}
                onChange={e => handleInputChange('voltage', e.target.value ? Number(e.target.value) : undefined)}
                className={errors.voltage ? errorInputClass : inputClass}
                placeholder="e.g., 480"
                disabled={isLoading}
              />
              {errors.voltage && <div className={errorClass}>{errors.voltage}</div>}
            </div>

            {/* Cable Type */}
            <div>
              <label className={labelClass}>Cable Type</label>
              <input
                type="text"
                value={formData.cableType}
                onChange={e => handleInputChange('cableType', e.target.value)}
                className={inputClass}
                placeholder="e.g., TECK90, THWN-2"
                disabled={isLoading}
              />
            </div>

            {/* Size */}
            <div>
              <label className={labelClass}>Size</label>
              <input
                type="text"
                value={formData.size}
                onChange={e => handleInputChange('size', e.target.value)}
                className={inputClass}
                placeholder="e.g., 12 AWG, #10"
                disabled={isLoading}
              />
            </div>

            {/* From Equipment */}
            <div>
              <label className={labelClass}>From Equipment</label>
              <input
                type="text"
                value={formData.fromEquipment}
                onChange={e => handleInputChange('fromEquipment', e.target.value)}
                className={inputClass}
                placeholder="e.g., MCC-01"
                disabled={isLoading}
              />
            </div>

            {/* To Equipment */}
            <div>
              <label className={labelClass}>To Equipment</label>
              <input
                type="text"
                value={formData.toEquipment}
                onChange={e => handleInputChange('toEquipment', e.target.value)}
                className={inputClass}
                placeholder="e.g., P-001"
                disabled={isLoading}
              />
            </div>

            {/* Length */}
            <div>
              <label className={labelClass}>Length (ft)</label>
              <input
                type="number"
                value={formData.length || ''}
                onChange={e => handleInputChange('length', e.target.value ? Number(e.target.value) : undefined)}
                className={errors.length ? errorInputClass : inputClass}
                placeholder="e.g., 150"
                disabled={isLoading}
                step="0.1"
              />
              {errors.length && <div className={errorClass}>{errors.length}</div>}
            </div>

            {/* Route */}
            <div>
              <label className={labelClass}>Route</label>
              <input
                type="text"
                value={formData.route}
                onChange={e => handleInputChange('route', e.target.value)}
                className={inputClass}
                placeholder="e.g., TR-1, UG-2"
                disabled={isLoading}
              />
            </div>

            {/* Segregation Class */}
            <div className="md:col-span-2">
              <label className={labelClass}>Segregation Class</label>
              <select
                value={formData.segregationClass || ''}
                onChange={e => handleInputChange('segregationClass', e.target.value || undefined)}
                className={inputClass}
                disabled={isLoading}
              >
                <option value="">Select segregation class...</option>
                {Object.values(SegregationClass).map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className={labelClass}>Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => handleInputChange('notes', e.target.value)}
                className={`${inputClass} h-20 resize-none`}
                placeholder="Additional notes or comments"
                disabled={isLoading}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              <span className="text-red-500">*</span> Required fields | 
              <span className="ml-1 font-medium">Ctrl+Enter</span> to save
            </div>
            {hasChanges && (
              <div className="text-sm text-amber-600 font-medium">• Unsaved changes</div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !hasChanges}
            >
              {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              Update Cable
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCableModal;