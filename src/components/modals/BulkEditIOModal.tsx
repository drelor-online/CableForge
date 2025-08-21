import React, { useState, useCallback } from 'react';
import { IoPoint } from '../../types';

interface BulkEditIOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<IoPoint>, selectedFields: string[]) => void;
  selectedIOPoints: IoPoint[];
}

const BulkEditIOModal: React.FC<BulkEditIOModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedIOPoints,
}) => {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [formData, setFormData] = useState<Partial<IoPoint>>({});

  const handleFieldToggle = useCallback((field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  }, []);

  const handleInputChange = useCallback((field: keyof IoPoint, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (!selectedFields.includes(field as string)) {
      setSelectedFields(prev => [...prev, field as string]);
    }
  }, [selectedFields]);

  const handleSave = useCallback(() => {
    if (selectedFields.length === 0) {
      alert('Please select at least one field to update.');
      return;
    }
    
    onSave(formData, selectedFields);
    onClose();
    setSelectedFields([]);
    setFormData({});
  }, [formData, selectedFields, onSave, onClose]);

  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'clear-plc':
        handleInputChange('plcName', '');
        handleInputChange('plcSlot', '');
        handleInputChange('plcPoint', '');
        break;
      case 'increment-point':
        const maxPoint = Math.max(...selectedIOPoints.map(io => parseInt(io.plcPoint || '0') || 0));
        setSelectedFields(prev => [...prev.filter(f => f !== 'plcPoint'), 'plcPoint']);
        setFormData(prev => ({ ...prev, plcPoint: (maxPoint + 1).toString() }));
        break;
      case 'reset-tag':
        handleInputChange('tag', '');
        break;
    }
  }, [selectedIOPoints, handleInputChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [handleSave, onClose]);

  if (!isOpen) return null;

  const validationErrors: string[] = [];
  
  if (selectedFields.includes('voltage') && formData.voltage) {
    const voltage = parseFloat(formData.voltage);
    if (isNaN(voltage) || voltage <= 0 || voltage > 1000) {
      validationErrors.push('Voltage must be between 0 and 1000V');
    }
  }

  if (selectedFields.includes('current') && formData.current) {
    const current = parseFloat(formData.current);
    if (isNaN(current) || current < 0 || current > 100) {
      validationErrors.push('Current must be between 0 and 100A');
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            Bulk Edit I/O Points ({selectedIOPoints.length} selected)
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickAction('clear-plc')}
              className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
            >
              Clear PLC Assignment
            </button>
            <button
              onClick={() => handleQuickAction('increment-point')}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
            >
              Auto-increment Point Numbers
            </button>
            <button
              onClick={() => handleQuickAction('reset-tag')}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
            >
              Reset Tags
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-1">
              Basic Information
            </h3>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="tag"
                checked={selectedFields.includes('tag')}
                onChange={() => handleFieldToggle('tag')}
              />
              <label htmlFor="tag" className="text-sm font-medium min-w-0 flex-1">Tag</label>
              <input
                type="text"
                value={formData.tag || ''}
                onChange={(e) => handleInputChange('tag', e.target.value)}
                className="px-2 py-1 border rounded text-sm w-24"
                placeholder="IO-001"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="description"
                checked={selectedFields.includes('description')}
                onChange={() => handleFieldToggle('description')}
              />
              <label htmlFor="description" className="text-sm font-medium min-w-0 flex-1">Description</label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="px-2 py-1 border rounded text-sm w-32"
                placeholder="Description"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="type"
                checked={selectedFields.includes('type')}
                onChange={() => handleFieldToggle('type')}
              />
              <label htmlFor="type" className="text-sm font-medium min-w-0 flex-1">Type</label>
              <select
                value={formData.type || ''}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="px-2 py-1 border rounded text-sm w-24"
              >
                <option value="">Select</option>
                <option value="AI">AI</option>
                <option value="AO">AO</option>
                <option value="DI">DI</option>
                <option value="DO">DO</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="function"
                checked={selectedFields.includes('function')}
                onChange={() => handleFieldToggle('function')}
              />
              <label htmlFor="function" className="text-sm font-medium min-w-0 flex-1">Function</label>
              <input
                type="text"
                value={formData.function || ''}
                onChange={(e) => handleInputChange('function', e.target.value)}
                className="px-2 py-1 border rounded text-sm w-32"
                placeholder="Process Control"
              />
            </div>
          </div>

          {/* PLC Assignment */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-1">
              PLC Assignment
            </h3>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="plcName"
                checked={selectedFields.includes('plcName')}
                onChange={() => handleFieldToggle('plcName')}
              />
              <label htmlFor="plcName" className="text-sm font-medium min-w-0 flex-1">PLC Name</label>
              <input
                type="text"
                value={formData.plcName || ''}
                onChange={(e) => handleInputChange('plcName', e.target.value)}
                className="px-2 py-1 border rounded text-sm w-24"
                placeholder="PLC-01"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="plcSlot"
                checked={selectedFields.includes('plcSlot')}
                onChange={() => handleFieldToggle('plcSlot')}
              />
              <label htmlFor="plcSlot" className="text-sm font-medium min-w-0 flex-1">PLC Slot</label>
              <input
                type="text"
                value={formData.plcSlot || ''}
                onChange={(e) => handleInputChange('plcSlot', e.target.value)}
                className="px-2 py-1 border rounded text-sm w-24"
                placeholder="0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="plcPoint"
                checked={selectedFields.includes('plcPoint')}
                onChange={() => handleFieldToggle('plcPoint')}
              />
              <label htmlFor="plcPoint" className="text-sm font-medium min-w-0 flex-1">PLC Point</label>
              <input
                type="text"
                value={formData.plcPoint || ''}
                onChange={(e) => handleInputChange('plcPoint', e.target.value)}
                className="px-2 py-1 border rounded text-sm w-24"
                placeholder="0"
              />
            </div>
          </div>

          {/* Electrical Properties */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-1">
              Electrical Properties
            </h3>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="voltage"
                checked={selectedFields.includes('voltage')}
                onChange={() => handleFieldToggle('voltage')}
              />
              <label htmlFor="voltage" className="text-sm font-medium min-w-0 flex-1">Voltage</label>
              <input
                type="number"
                value={formData.voltage || ''}
                onChange={(e) => handleInputChange('voltage', e.target.value)}
                className="px-2 py-1 border rounded text-sm w-24"
                placeholder="24"
                step="0.1"
              />
              <span className="text-xs text-gray-500">V</span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="current"
                checked={selectedFields.includes('current')}
                onChange={() => handleFieldToggle('current')}
              />
              <label htmlFor="current" className="text-sm font-medium min-w-0 flex-1">Current</label>
              <input
                type="number"
                value={formData.current || ''}
                onChange={(e) => handleInputChange('current', e.target.value)}
                className="px-2 py-1 border rounded text-sm w-24"
                placeholder="0.02"
                step="0.001"
              />
              <span className="text-xs text-gray-500">A</span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="signalType"
                checked={selectedFields.includes('signalType')}
                onChange={() => handleFieldToggle('signalType')}
              />
              <label htmlFor="signalType" className="text-sm font-medium min-w-0 flex-1">Signal Type</label>
              <select
                value={formData.signalType || ''}
                onChange={(e) => handleInputChange('signalType', e.target.value)}
                className="px-2 py-1 border rounded text-sm w-32"
              >
                <option value="">Select</option>
                <option value="4-20mA">4-20mA</option>
                <option value="0-10V">0-10V</option>
                <option value="24VDC">24VDC</option>
                <option value="120VAC">120VAC</option>
                <option value="Digital">Digital</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-1">
              Location
            </h3>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="location"
                checked={selectedFields.includes('location')}
                onChange={() => handleFieldToggle('location')}
              />
              <label htmlFor="location" className="text-sm font-medium min-w-0 flex-1">Location</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="px-2 py-1 border rounded text-sm w-32"
                placeholder="Field Panel"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="cabinet"
                checked={selectedFields.includes('cabinet')}
                onChange={() => handleFieldToggle('cabinet')}
              />
              <label htmlFor="cabinet" className="text-sm font-medium min-w-0 flex-1">Cabinet</label>
              <input
                type="text"
                value={formData.cabinet || ''}
                onChange={(e) => handleInputChange('cabinet', e.target.value)}
                className="px-2 py-1 border rounded text-sm w-24"
                placeholder="MCC-01"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terminalBlock"
                checked={selectedFields.includes('terminalBlock')}
                onChange={() => handleFieldToggle('terminalBlock')}
              />
              <label htmlFor="terminalBlock" className="text-sm font-medium min-w-0 flex-1">Terminal Block</label>
              <input
                type="text"
                value={formData.terminalBlock || ''}
                onChange={(e) => handleInputChange('terminalBlock', e.target.value)}
                className="px-2 py-1 border rounded text-sm w-24"
                placeholder="TB-01"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="wireNumber"
                checked={selectedFields.includes('wireNumber')}
                onChange={() => handleFieldToggle('wireNumber')}
              />
              <label htmlFor="wireNumber" className="text-sm font-medium min-w-0 flex-1">Wire Number</label>
              <input
                type="text"
                value={formData.wireNumber || ''}
                onChange={(e) => handleInputChange('wireNumber', e.target.value)}
                className="px-2 py-1 border rounded text-sm w-24"
                placeholder="1"
              />
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 rounded">
            <h4 className="text-sm font-medium text-red-800 mb-1">Validation Errors:</h4>
            <ul className="text-sm text-red-700 list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="text-sm text-gray-600">
            {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''} selected
            <div className="text-xs text-gray-500 mt-1">
              Ctrl+Enter to save • Escape to cancel
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={selectedFields.length === 0 || validationErrors.length > 0}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Update {selectedFields.length} Field{selectedFields.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkEditIOModal;