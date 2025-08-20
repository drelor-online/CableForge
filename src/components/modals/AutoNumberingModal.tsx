import React, { useState, useEffect } from 'react';
import { AutoNumberingSettings } from '../../types/settings';
import { autoNumberingService } from '../../services/auto-numbering-service';

interface AutoNumberingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AutoNumberingSettings) => void;
}

const AutoNumberingModal: React.FC<AutoNumberingModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [settings, setSettings] = useState<AutoNumberingSettings>(
    autoNumberingService.getSettings()
  );

  useEffect(() => {
    if (isOpen) {
      setSettings(autoNumberingService.getSettings());
    }
  }, [isOpen]);

  const handleSave = () => {
    autoNumberingService.saveSettings(settings);
    onSave(settings);
    onClose();
  };

  const handleCancel = () => {
    setSettings(autoNumberingService.getSettings()); // Reset to saved values
    onClose();
  };

  const getPreviewTag = () => {
    const paddedNumber = settings.startNumber.toString().padStart(settings.padding, '0');
    return `${settings.prefix}${paddedNumber}${settings.suffix}`;
  };

  const getNextFewTags = () => {
    const tags = [];
    for (let i = 0; i < 3; i++) {
      const number = settings.startNumber + (i * settings.increment);
      const paddedNumber = number.toString().padStart(settings.padding, '0');
      tags.push(`${settings.prefix}${paddedNumber}${settings.suffix}`);
    }
    return tags;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Auto-numbering Settings
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure how cable tags are automatically generated
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Prefix */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prefix
            </label>
            <input
              type="text"
              value={settings.prefix}
              onChange={(e) => setSettings(prev => ({ ...prev, prefix: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="C-"
            />
          </div>

          {/* Starting Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Starting Number
            </label>
            <input
              type="number"
              min="1"
              value={settings.startNumber}
              onChange={(e) => setSettings(prev => ({ ...prev, startNumber: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Increment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Increment
            </label>
            <input
              type="number"
              min="1"
              value={settings.increment}
              onChange={(e) => setSettings(prev => ({ ...prev, increment: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Padding */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number Padding (digits)
            </label>
            <input
              type="number"
              min="1"
              max="6"
              value={settings.padding}
              onChange={(e) => setSettings(prev => ({ ...prev, padding: parseInt(e.target.value) || 3 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Suffix */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Suffix
            </label>
            <input
              type="text"
              value={settings.suffix}
              onChange={(e) => setSettings(prev => ({ ...prev, suffix: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="(optional)"
            />
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="font-medium">First tag:</span>{' '}
                <span className="font-mono bg-white px-2 py-1 rounded border">
                  {getPreviewTag()}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Next few tags:</span>{' '}
                <span className="font-mono text-gray-600">
                  {getNextFewTags().join(', ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoNumberingModal;