import React, { useState, useEffect } from 'react';
import Modal, { ModalFooter } from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { Settings, User, Monitor, Download, Upload, Wrench } from 'lucide-react';
import { theme, colors } from '../../theme';
import { settingsService, AllSettings, GeneralSettings, DisplaySettings, ImportExportSettings, AdvancedSettings } from '../../services/settings-service';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'general' | 'display' | 'importexport' | 'advanced';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<AllSettings>(settingsService.getSettings());
  const [hasChanges, setHasChanges] = useState(false);

  // Load current settings when modal opens
  useEffect(() => {
    if (isOpen) {
      setSettings(settingsService.getSettings());
      setHasChanges(false);
    }
  }, [isOpen]);

  // Subscribe to settings changes
  useEffect(() => {
    const unsubscribe = settingsService.subscribe((newSettings) => {
      setSettings(newSettings);
    });
    return unsubscribe;
  }, []);

  const handleGeneralChange = (field: keyof GeneralSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      general: { ...prev.general, [field]: value }
    }));
    setHasChanges(true);
  };

  const handleDisplayChange = (field: keyof DisplaySettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      display: { ...prev.display, [field]: value }
    }));
    setHasChanges(true);
  };

  const handleImportExportChange = (field: keyof ImportExportSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      importExport: { ...prev.importExport, [field]: value }
    }));
    setHasChanges(true);
  };

  const handleAdvancedChange = (field: keyof AdvancedSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      advanced: { ...prev.advanced, [field]: value }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    settingsService.updateGeneralSettings(settings.general);
    settingsService.updateDisplaySettings(settings.display);
    settingsService.updateImportExportSettings(settings.importExport);
    settingsService.updateAdvancedSettings(settings.advanced);
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    settingsService.resetSettings();
    setSettings(settingsService.getSettings());
    setHasChanges(false);
  };

  const handleCancel = () => {
    setSettings(settingsService.getSettings());
    setHasChanges(false);
    onClose();
  };

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'display' as const, label: 'Display', icon: Monitor },
    { id: 'importexport' as const, label: 'Import/Export', icon: Download },
    { id: 'advanced' as const, label: 'Advanced', icon: Wrench },
  ];

  const renderGeneralSettings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
      <div>
        <h3 style={{ 
          fontSize: theme.typography.fontSize.lg, 
          fontWeight: theme.typography.fontWeight.semibold,
          color: colors.text.primary,
          marginBottom: theme.spacing[3]
        }}>
          Auto-save & Revisions
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          <Input
            label="Auto-save interval (minutes)"
            type="number"
            value={settings.general.autoSaveInterval}
            onChange={(e) => handleGeneralChange('autoSaveInterval', parseInt(e.target.value) || 5)}
            helperText="Set to 0 to disable auto-save"
          />
          <Input
            label="Maximum auto-save revisions"
            type="number"
            value={settings.general.maxAutoSaveRevisions}
            onChange={(e) => handleGeneralChange('maxAutoSaveRevisions', parseInt(e.target.value) || 20)}
            helperText="Older auto-saves will be deleted automatically"
          />
          <Input
            label="User name"
            value={settings.general.userName || ''}
            onChange={(e) => handleGeneralChange('userName', e.target.value)}
            helperText="Used for revision tracking and change logs"
          />
        </div>
      </div>

      <div>
        <h3 style={{ 
          fontSize: theme.typography.fontSize.lg, 
          fontWeight: theme.typography.fontWeight.semibold,
          color: colors.text.primary,
          marginBottom: theme.spacing[3]
        }}>
          Preferences
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
            <input
              type="checkbox"
              id="enableChangeTracking"
              checked={settings.general.enableChangeTracking}
              onChange={(e) => handleGeneralChange('enableChangeTracking', e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="enableChangeTracking" style={{ color: colors.text.primary }}>
              Enable change tracking
            </label>
          </div>
          <Select
            label="Theme"
            value={settings.general.theme}
            onChange={(e) => handleGeneralChange('theme', e.target.value)}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' }
            ]}
          />
          <Select
            label="Language"
            value={settings.general.language}
            onChange={(e) => handleGeneralChange('language', e.target.value)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Spanish' },
              { value: 'fr', label: 'French' },
              { value: 'de', label: 'German' }
            ]}
          />
        </div>
      </div>
    </div>
  );

  const renderDisplaySettings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
      <h3 style={{ 
        fontSize: theme.typography.fontSize.lg, 
        fontWeight: theme.typography.fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: theme.spacing[3]
      }}>
        Table Display
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <input
            type="checkbox"
            id="compactMode"
            checked={settings.display.compactMode}
            onChange={(e) => handleDisplayChange('compactMode', e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          <label htmlFor="compactMode" style={{ color: colors.text.primary }}>
            Compact mode (smaller row heights)
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <input
            type="checkbox"
            id="showGridLines"
            checked={settings.display.showGridLines}
            onChange={(e) => handleDisplayChange('showGridLines', e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          <label htmlFor="showGridLines" style={{ color: colors.text.primary }}>
            Show grid lines
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <input
            type="checkbox"
            id="showValidationIndicators"
            checked={settings.display.showValidationIndicators}
            onChange={(e) => handleDisplayChange('showValidationIndicators', e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          <label htmlFor="showValidationIndicators" style={{ color: colors.text.primary }}>
            Show validation indicators
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <input
            type="checkbox"
            id="animationsEnabled"
            checked={settings.display.animationsEnabled}
            onChange={(e) => handleDisplayChange('animationsEnabled', e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          <label htmlFor="animationsEnabled" style={{ color: colors.text.primary }}>
            Enable animations
          </label>
        </div>
        <Select
          label="Font size"
          value={settings.display.fontSize}
          onChange={(e) => handleDisplayChange('fontSize', e.target.value)}
          options={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' }
          ]}
        />
      </div>
    </div>
  );

  const renderImportExportSettings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
      <h3 style={{ 
        fontSize: theme.typography.fontSize.lg, 
        fontWeight: theme.typography.fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: theme.spacing[3]
      }}>
        Default Formats
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
        <Select
          label="Default import format"
          value={settings.importExport.defaultImportFormat}
          onChange={(e) => handleImportExportChange('defaultImportFormat', e.target.value)}
          options={[
            { value: 'excel', label: 'Excel (.xlsx)' },
            { value: 'csv', label: 'CSV' },
            { value: 'json', label: 'JSON' }
          ]}
        />
        <Select
          label="Default export format"
          value={settings.importExport.defaultExportFormat}
          onChange={(e) => handleImportExportChange('defaultExportFormat', e.target.value)}
          options={[
            { value: 'excel', label: 'Excel (.xlsx)' },
            { value: 'csv', label: 'CSV' },
            { value: 'pdf', label: 'PDF' }
          ]}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <input
            type="checkbox"
            id="autoMapColumns"
            checked={settings.importExport.autoMapColumns}
            onChange={(e) => handleImportExportChange('autoMapColumns', e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          <label htmlFor="autoMapColumns" style={{ color: colors.text.primary }}>
            Auto-map columns during import
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <input
            type="checkbox"
            id="validateOnImport"
            checked={settings.importExport.validateOnImport}
            onChange={(e) => handleImportExportChange('validateOnImport', e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          <label htmlFor="validateOnImport" style={{ color: colors.text.primary }}>
            Validate data on import
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <input
            type="checkbox"
            id="includeValidationInExports"
            checked={settings.importExport.includeValidationInExports}
            onChange={(e) => handleImportExportChange('includeValidationInExports', e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          <label htmlFor="includeValidationInExports" style={{ color: colors.text.primary }}>
            Include validation results in exports
          </label>
        </div>
      </div>
    </div>
  );

  const renderAdvancedSettings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
      <h3 style={{ 
        fontSize: theme.typography.fontSize.lg, 
        fontWeight: theme.typography.fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: theme.spacing[3]
      }}>
        Advanced Options
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <input
            type="checkbox"
            id="enableDebugMode"
            checked={settings.advanced.enableDebugMode}
            onChange={(e) => handleAdvancedChange('enableDebugMode', e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          <label htmlFor="enableDebugMode" style={{ color: colors.text.primary }}>
            Enable debug mode
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <input
            type="checkbox"
            id="enableExperimentalFeatures"
            checked={settings.advanced.enableExperimentalFeatures}
            onChange={(e) => handleAdvancedChange('enableExperimentalFeatures', e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          <label htmlFor="enableExperimentalFeatures" style={{ color: colors.text.primary }}>
            Enable experimental features
          </label>
        </div>
        <Input
          label="Maximum undo levels"
          type="number"
          value={settings.advanced.maxUndoLevels}
          onChange={(e) => handleAdvancedChange('maxUndoLevels', parseInt(e.target.value) || 50)}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <input
            type="checkbox"
            id="enableAutoBackup"
            checked={settings.advanced.enableAutoBackup}
            onChange={(e) => handleAdvancedChange('enableAutoBackup', e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          <label htmlFor="enableAutoBackup" style={{ color: colors.text.primary }}>
            Enable automatic backups
          </label>
        </div>
        {settings.advanced.enableAutoBackup && (
          <Input
            label="Backup interval (hours)"
            type="number"
            value={settings.advanced.backupInterval}
            onChange={(e) => handleAdvancedChange('backupInterval', parseInt(e.target.value) || 24)}
          />
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'display':
        return renderDisplaySettings();
      case 'importexport':
        return renderImportExportSettings();
      case 'advanced':
        return renderAdvancedSettings();
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Settings"
      size="lg"
      footer={
        <ModalFooter
          onCancel={handleCancel}
          onConfirm={handleSave}
          cancelLabel="Cancel"
          confirmLabel="Save"
          isLoading={false}
          additionalActions={
            <Button
              variant="outline"
              onClick={handleReset}
            >
              Reset All
            </Button>
          }
        />
      }
    >
      <div style={{ display: 'flex', height: '500px' }}>
        {/* Tab sidebar */}
        <div style={{
          width: '200px',
          borderRight: `1px solid ${colors.border.light}`,
          paddingRight: theme.spacing[4],
          marginRight: theme.spacing[4]
        }}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing[2],
                  width: '100%',
                  padding: theme.spacing[3],
                  borderRadius: theme.borderRadius.md,
                  border: 'none',
                  backgroundColor: isActive ? colors.primary[50] : 'transparent',
                  color: isActive ? colors.primary[600] : colors.text.secondary,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: isActive ? theme.typography.fontWeight.medium : theme.typography.fontWeight.normal,
                  cursor: 'pointer',
                  transition: theme.transitions.colors,
                  marginBottom: theme.spacing[1],
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = colors.gray[50];
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <IconComponent size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {renderTabContent()}
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;