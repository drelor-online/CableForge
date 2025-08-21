import React, { useState, useEffect } from 'react';
import { AutoNumberingSettings } from '../../types/settings';
import { autoNumberingService } from '../../services/auto-numbering-service';
import Modal, { ModalFooter } from '../ui/Modal';
import Input from '../ui/Input';

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Auto-numbering Settings"
      size="md"
      footer={
        <ModalFooter
          onCancel={handleCancel}
          onConfirm={handleSave}
          cancelLabel="Cancel"
          confirmLabel="Save Settings"
        />
      }
    >

        <div style={{ 
          marginBottom: '16px',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          Configure how cable tags are automatically generated
        </div>
        
        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Prefix */}
          <Input
            label="Prefix"
            value={settings.prefix}
            onChange={(e) => setSettings(prev => ({ ...prev, prefix: e.target.value }))}
            placeholder="C-"
          />

          {/* Starting Number */}
          <Input
            label="Starting Number"
            type="number"
            min="1"
            value={settings.startNumber.toString()}
            onChange={(e) => setSettings(prev => ({ ...prev, startNumber: parseInt(e.target.value) || 1 }))}
          />

          {/* Increment */}
          <Input
            label="Increment"
            type="number"
            min="1"
            value={settings.increment.toString()}
            onChange={(e) => setSettings(prev => ({ ...prev, increment: parseInt(e.target.value) || 1 }))}
          />

          {/* Padding */}
          <Input
            label="Number Padding (digits)"
            type="number"
            min="1"
            max="6"
            value={settings.padding.toString()}
            onChange={(e) => setSettings(prev => ({ ...prev, padding: parseInt(e.target.value) || 3 }))}
          />

          {/* Suffix */}
          <Input
            label="Suffix"
            value={settings.suffix}
            onChange={(e) => setSettings(prev => ({ ...prev, suffix: e.target.value }))}
            placeholder="(optional)"
          />

          {/* Preview */}
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '16px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Preview
            </div>
            <div style={{ display: 'grid', gap: '4px' }}>
              <div style={{ fontSize: '14px' }}>
                <span style={{ fontWeight: '500' }}>First tag:</span>{' '}
                <span style={{
                  fontFamily: 'monospace',
                  backgroundColor: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db'
                }}>
                  {getPreviewTag()}
                </span>
              </div>
              <div style={{ fontSize: '14px' }}>
                <span style={{ fontWeight: '500' }}>Next few tags:</span>{' '}
                <span style={{
                  fontFamily: 'monospace',
                  color: '#6b7280'
                }}>
                  {getNextFewTags().join(', ')}
                </span>
              </div>
            </div>
          </div>
        </div>
    </Modal>
  );
};

export default AutoNumberingModal;