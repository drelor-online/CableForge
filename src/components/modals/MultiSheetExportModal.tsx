import React, { useState, useMemo, useEffect } from 'react';
import { 
  ExportData, 
  MultiSheetExportOptions, 
  SheetConfiguration, 
  ExportProgress,
  ExportResult,
  ExportColumnDefinitions
} from '../../types/export';
import { exportService, ExportProgress as ExportProgressType } from '../../services/export-service';
import { columnServiceAggregator } from '../../services/column-service-aggregator';
import { useUI } from '../../contexts/UIContext';
import { X, Settings } from 'lucide-react';

interface MultiSheetExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ExportData;
  columnDefinitions: ExportColumnDefinitions;
}

const MultiSheetExportModal: React.FC<MultiSheetExportModalProps> = ({
  isOpen,
  onClose,
  data,
  columnDefinitions
}) => {
  const { showSuccess, showError } = useUI();
  
  // Export configuration state
  const [filename, setFilename] = useState('');
  const [sheets, setSheets] = useState<SheetConfiguration[]>([]);
  const [includeSummarySheet, setIncludeSummarySheet] = useState(true);
  const [includeValidationSheet, setIncludeValidationSheet] = useState(true);
  const [includeRevisionInfo, setIncludeRevisionInfo] = useState(true);
  const [applyFormatting, setApplyFormatting] = useState(true);
  const [freezeHeaders, setFreezeHeaders] = useState(true);
  
  // Progress tracking
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  
  // Column preset management
  const [columnPresets, setColumnPresets] = useState({
    cables: 'standard',
    io: 'standard',
    loads: 'standard',
    conduits: 'standard',
    trays: 'standard'
  });
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  
  // Preset management
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  
  const presets = exportService.getMultiSheetPresets();

  // Initialize sheets configuration
  useEffect(() => {
    if (sheets.length === 0) {
      setSheets(exportService.getDefaultMultiSheetConfig());
    }
  }, [sheets.length]);

  // Calculate totals for display
  const totals = useMemo(() => ({
    cables: data.cables.length,
    ioPoints: data.ioPoints.length,
    loads: data.loads.length,
    conduits: data.conduits.length,
    trays: data.trays.length
  }), [data]);

  // Handle sheet configuration changes
  const handleSheetToggle = (index: number) => {
    setSheets(prev => prev.map((sheet, i) => 
      i === index ? { ...sheet, enabled: !sheet.enabled } : sheet
    ));
  };

  const handleSheetOptionChange = (index: number, option: keyof SheetConfiguration, value: any) => {
    setSheets(prev => prev.map((sheet, i) => 
      i === index ? { ...sheet, [option]: value } : sheet
    ));
  };

  // Handle column selection for a sheet
  const handleColumnSelection = (sheetIndex: number, field: string) => {
    setSheets(prev => prev.map((sheet, i) => {
      if (i !== sheetIndex) return sheet;
      
      const currentColumns = sheet.selectedColumns || [];
      const newColumns = currentColumns.includes(field)
        ? currentColumns.filter(col => col !== field)
        : [...currentColumns, field];
      
      return { ...sheet, selectedColumns: newColumns };
    }));
  };

  // Get available columns for a sheet using current presets
  const getAvailableColumns = (entityType: string) => {
    const preset = columnPresets[entityType as keyof typeof columnPresets] || 'standard';
    switch (entityType) {
      case 'cables': return columnServiceAggregator.getCableColumns(preset);
      case 'io': return columnServiceAggregator.getIOColumns(preset);
      case 'loads': return columnServiceAggregator.getLoadColumns(preset);
      case 'conduits': return columnServiceAggregator.getConduitColumns(preset);
      case 'trays': return columnServiceAggregator.getTrayColumns(preset);
      default: return [];
    }
  };

  // Handle column preset changes
  const handleColumnPresetChange = (entityType: string, preset: string) => {
    setColumnPresets(prev => ({
      ...prev,
      [entityType]: preset
    }));
  };

  // Handle export
  const handleExport = async () => {
    if (sheets.filter(s => s.enabled).length === 0 && !includeSummarySheet && !includeValidationSheet) {
      showError('Please select at least one sheet to export');
      return;
    }

    setIsExporting(true);
    
    // Set progress callback
    exportService.setProgressCallback((progress: ExportProgressType) => {
      setExportProgress(progress);
    });

    const options: MultiSheetExportOptions = {
      filename: filename.trim() || undefined,
      sheets,
      includeSummarySheet,
      includeValidationSheet,
      includeRevisionInfo,
      applyFormatting,
      freezeHeaders
    };

    try {
      // Get dynamic column definitions based on current presets
      const dynamicColumnDefinitions = columnServiceAggregator.getExportColumnDefinitionsWithPresets(columnPresets);
      const result = await exportService.exportMultiSheet(data, dynamicColumnDefinitions, options);
      
      if (result.success) {
        showSuccess(`Export completed successfully! Generated ${result.sheetsGenerated.length} sheets with ${result.recordsExported} records.`);
        onClose();
      } else {
        showError(`Export failed: ${result.errors?.join(', ') || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      showError(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
      exportService.clearProgressCallback();
    }
  };

  // Handle quick exports
  const handleQuickExportAll = async () => {
    setIsExporting(true);
    try {
      const dynamicColumnDefinitions = columnServiceAggregator.getExportColumnDefinitionsWithPresets(columnPresets);
      const result = await exportService.quickExportAllSheets(data, dynamicColumnDefinitions);
      if (result.success) {
        showSuccess(`Quick export completed! File: ${result.filename}`);
        onClose();
      } else {
        showError(`Export failed: ${result.errors?.join(', ') || 'Unknown error'}`);
      }
    } catch (error) {
      showError(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickExportSummary = async () => {
    setIsExporting(true);
    try {
      const dynamicColumnDefinitions = columnServiceAggregator.getExportColumnDefinitionsWithPresets(columnPresets);
      const result = await exportService.quickExportSummaryOnly(data, dynamicColumnDefinitions);
      if (result.success) {
        showSuccess(`Summary export completed! File: ${result.filename}`);
        onClose();
      } else {
        showError(`Export failed: ${result.errors?.join(', ') || 'Unknown error'}`);
      }
    } catch (error) {
      showError(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle preset management
  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    const preset = {
      name: presetName,
      description: presetDescription,
      options: {
        format: 'xlsx' as const,
        sheets,
        includeSummarySheet,
        includeValidationSheet,
        includeRevisionInfo,
        applyFormatting,
        freezeHeaders
      }
    };

    exportService.saveMultiSheetPreset(preset);
    showSuccess('Preset saved successfully!');
    setPresetName('');
    setPresetDescription('');
    setShowPresets(false);
  };

  const handleLoadPreset = (preset: any) => {
    setSheets(preset.options.sheets);
    setIncludeSummarySheet(preset.options.includeSummarySheet);
    setIncludeValidationSheet(preset.options.includeValidationSheet);
    setIncludeRevisionInfo(preset.options.includeRevisionInfo);
    setApplyFormatting(preset.options.applyFormatting);
    setFreezeHeaders(preset.options.freezeHeaders);
    showSuccess(`Preset "${preset.name}" loaded`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Multi-Sheet Excel Export</h2>
            <p className="text-sm text-gray-600 mt-1">
              Export project data to professionally formatted Excel workbook
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickExportAll}
              disabled={isExporting}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Quick Export All
            </button>
            <button
              onClick={handleQuickExportSummary}
              disabled={isExporting}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Summary Only
            </button>
            <button
              onClick={onClose}
              disabled={isExporting}
              className="text-gray-500 hover:text-gray-700 p-2 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {isExporting && exportProgress && (
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">
                {exportProgress.message || `Processing ${exportProgress.currentSheet || '...'}`}
              </span>
              <span className="text-sm text-gray-600">
                {exportProgress.processedSheets} / {exportProgress.totalSheets} sheets
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${exportProgress.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Configuration Panel */}
          <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Export Configuration</h3>
            
            {/* Basic Options */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filename (optional)
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="Leave blank for auto-generated name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeSummarySheet}
                    onChange={(e) => setIncludeSummarySheet(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Include Summary Sheet</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeValidationSheet}
                    onChange={(e) => setIncludeValidationSheet(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Include Validation Report</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeRevisionInfo}
                    onChange={(e) => setIncludeRevisionInfo(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Include Revision Info</span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={applyFormatting}
                    onChange={(e) => setApplyFormatting(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Apply Professional Formatting</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={freezeHeaders}
                    onChange={(e) => setFreezeHeaders(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Freeze Header Rows</span>
                </label>
              </div>
            </div>

            {/* Sheet Selection */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Data Sheets</h4>
              <div className="space-y-3">
                {sheets.map((sheet, index) => {
                  const availableColumns = getAvailableColumns(sheet.entityType);
                  const recordCount = totals[sheet.entityType as keyof typeof totals] || 0;
                  
                  return (
                    <div key={sheet.entityType} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={sheet.enabled}
                            onChange={() => handleSheetToggle(index)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {sheet.name}
                          </span>
                          <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            {recordCount} records
                          </span>
                        </label>
                      </div>

                      {sheet.enabled && (
                        <div className="ml-6 space-y-2">
                          <label className="flex items-center text-sm">
                            <input
                              type="checkbox"
                              checked={sheet.includeHidden}
                              onChange={(e) => handleSheetOptionChange(index, 'includeHidden', e.target.checked)}
                              className="mr-2"
                            />
                            Include hidden columns
                          </label>

                          <div>
                            <span className="text-xs text-gray-600 mb-1 block">
                              Selected columns ({sheet.selectedColumns?.length || availableColumns.length} of {availableColumns.length}):
                            </span>
                            <div className="max-h-24 overflow-y-auto text-xs text-gray-500">
                              {(sheet.selectedColumns?.length ? 
                                sheet.selectedColumns.map(col => availableColumns.find(c => c.field === col)?.headerName).filter(Boolean) :
                                availableColumns.map(col => col.headerName)
                              ).join(', ')}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Preview/Presets Panel */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Export Preview</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowColumnSettings(!showColumnSettings)}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <Settings className="h-4 w-4" />
                  {showColumnSettings ? 'Hide' : 'Show'} Column Settings
                </button>
                <button
                  onClick={() => setShowPresets(!showPresets)}
                  className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  {showPresets ? 'Hide' : 'Show'} Presets
                </button>
              </div>
            </div>

            {showColumnSettings && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-3">Column Settings</h4>
                <div className="space-y-4">
                  {sheets.map((sheet, index) => {
                    if (!sheet.enabled) return null;
                    const availablePresets = columnServiceAggregator.getAvailablePresets(sheet.entityType);
                    const currentPreset = columnPresets[sheet.entityType as keyof typeof columnPresets];
                    
                    return (
                      <div key={sheet.entityType} className="border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{sheet.name}</span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Column Preset:
                          </label>
                          <select
                            value={currentPreset}
                            onChange={(e) => handleColumnPresetChange(sheet.entityType, e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {Object.entries(availablePresets).map(([key, description]) => (
                              <option key={key} value={key}>{description}</option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            {columnServiceAggregator.getPresetDescription(sheet.entityType, currentPreset)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {showPresets && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-3">Preset Management</h4>
                
                {/* Save New Preset */}
                <div className="space-y-2 mb-4">
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Preset name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={presetDescription}
                    onChange={(e) => setPresetDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleSavePreset}
                    disabled={!presetName.trim()}
                    className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    Save Current Configuration
                  </button>
                </div>

                {/* Load Existing Presets */}
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">Saved Presets:</h5>
                  {presets.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No saved presets</p>
                  ) : (
                    <div className="space-y-2">
                      {presets.map(preset => (
                        <div key={preset.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{preset.name}</div>
                            {preset.description && (
                              <div className="text-xs text-gray-500">{preset.description}</div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleLoadPreset(preset)}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => {
                                exportService.deleteMultiSheetPreset(preset.id);
                                showSuccess('Preset deleted');
                              }}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Export Summary */}
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-2">Export Summary</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Total sheets: {sheets.filter(s => s.enabled).length + (includeSummarySheet ? 1 : 0) + (includeValidationSheet ? 1 : 0) + (includeRevisionInfo ? 1 : 0)}</div>
                  <div>Total records: {sheets.filter(s => s.enabled).reduce((sum, sheet) => sum + (totals[sheet.entityType as keyof typeof totals] || 0), 0)}</div>
                  <div>Format: Excel (.xlsx)</div>
                  <div>Formatting: {applyFormatting ? 'Professional' : 'Basic'}</div>
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-2">Sheets to Export</h4>
                <div className="space-y-1 text-sm">
                  {includeSummarySheet && <div className="text-blue-600">✓ Summary</div>}
                  {sheets.filter(s => s.enabled).map(sheet => {
                    const preset = columnPresets[sheet.entityType as keyof typeof columnPresets];
                    const availableColumns = getAvailableColumns(sheet.entityType);
                    return (
                      <div key={sheet.entityType} className="text-green-600">
                        ✓ {sheet.name} ({totals[sheet.entityType as keyof typeof totals]} records, {availableColumns.length} columns, {preset} preset)
                      </div>
                    );
                  })}
                  {includeValidationSheet && <div className="text-purple-600">✓ Validation Report</div>}
                  {includeRevisionInfo && <div className="text-orange-600">✓ Revision Info</div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {!isExporting ? 
              `Ready to export ${sheets.filter(s => s.enabled).length} data sheets` :
              `Exporting... ${exportProgress?.progress || 0}% complete`
            }
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || (sheets.filter(s => s.enabled).length === 0 && !includeSummarySheet && !includeValidationSheet)}
              className="px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isExporting ? 'Exporting...' : 'Export to Excel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiSheetExportModal;