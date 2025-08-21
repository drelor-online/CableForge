import React, { useState, useMemo } from 'react';
import { Cable } from '../../types';
import { ColumnDefinition } from '../../services/column-service';
import { ExportOptions, ExportPreset, exportService } from '../../services/export-service';
import { useColumnSelection } from '../../hooks/useSelectableList';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { useToast } from '../common/ToastContainer';
import { colors, spacing, typography } from '../../theme';
import { 
  X,
  FileText,
  CheckCircle2,
  Download,
  Loader2
} from 'lucide-react';

interface ExportBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Cable[];
  columns: ColumnDefinition[];
  selectedRowIds?: string[];
}

const ExportBuilderModal: React.FC<ExportBuilderModalProps> = ({
  isOpen,
  onClose,
  data,
  columns,
  selectedRowIds = []
}) => {
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [filename, setFilename] = useState('');
  const [includeHidden, setIncludeHidden] = useState(false);
  const [exportScope, setExportScope] = useState<'all' | 'visible' | 'selected'>('visible');
  const [sheetName, setSheetName] = useState('Cables');
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');

  const { showSuccess, showError } = useToast();
  const exportPresets = exportService.getExportPresets();

  // Use column selection hook
  const columnSelection = useColumnSelection(
    includeHidden ? columns : columns.filter(col => col.visible !== false),
    {
      onChange: (visible) => {
        // Column selection change handled by hook
      }
    }
  );

  // Async operation for export
  const exportOperation = useAsyncOperation(async (options: ExportOptions) => {
    await exportService.exportData(data, columns, options);
    showSuccess(`Successfully exported ${data.length} cables`);
    onClose();
  });

  const handleColumnToggle = (field: string) => {
    columnSelection.toggleItem(field);
  };

  const handleSelectAllColumns = () => {
    columnSelection.selectAll();
  };

  const handleDeselectAllColumns = () => {
    columnSelection.selectNone();
  };

  const handleExport = async () => {
    const exportOptions: ExportOptions = {
      format,
      filename: filename.trim() || undefined,
      includeHidden,
      selectedColumns: columnSelection.getSelectedKeys(),
      selectedRows: exportScope === 'selected' ? selectedRowIds : undefined,
      sheetName: format === 'xlsx' ? sheetName : undefined
    };

    await exportOperation.execute(exportOptions);
  };

  const handleQuickExport = (type: 'all' | 'selected' | 'csv') => {
    switch (type) {
      case 'all':
        exportService.exportAllData(data, columns);
        break;
      case 'selected':
        if (selectedRowIds.length > 0) {
          exportService.exportSelectedData(data, columns, selectedRowIds);
        }
        break;
      case 'csv':
        exportService.exportData(data, columns, { format: 'csv', includeHidden: false });
        break;
    }
    onClose();
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    const exportOptions: ExportOptions = {
      format,
      includeHidden,
      selectedColumns: columnSelection.getSelectedKeys(),
      sheetName: format === 'xlsx' ? sheetName : undefined
    };

    exportService.saveExportPreset({
      name: presetName.trim(),
      description: presetDescription.trim() || undefined,
      options: exportOptions
    });

    setPresetName('');
    setPresetDescription('');
    setShowPresets(false);
  };

  const handleLoadPreset = (preset: ExportPreset) => {
    const options = preset.options;
    setFormat(options.format);
    setIncludeHidden(options.includeHidden || false);
    columnSelection.setSelection(options.selectedColumns || columnSelection.availableColumns.map(col => col.field));
    setSheetName(options.sheetName || 'Cables');
  };

  const getRowCountText = () => {
    const totalRows = data.length;
    const selectedRows = selectedRowIds.length;
    
    switch (exportScope) {
      case 'all':
        return `All ${totalRows} cables`;
      case 'selected':
        return `${selectedRows} selected cables`;
      case 'visible':
      default:
        return `All ${totalRows} visible cables`;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div 
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
        style={{
          backgroundColor: colors.white,
          borderRadius: spacing[2],
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between"
          style={{
            padding: spacing[6],
            borderBottom: `1px solid ${colors.gray[200]}`
          }}
        >
          <h2 
            style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.semibold,
              color: colors.gray[900]
            }}
          >
            Export Builder
          </h2>
          <button
            onClick={onClose}
            style={{
              color: colors.gray[400],
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              padding: spacing[1],
              borderRadius: spacing[1]
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = colors.gray[600]}
            onMouseLeave={(e) => e.currentTarget.style.color = colors.gray[400]}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[600px]">
          {/* Left Panel - Quick Actions */}
          <div 
            className="w-1/3"
            style={{
              padding: spacing[6],
              borderRight: `1px solid ${colors.gray[200]}`,
              backgroundColor: colors.gray[50]
            }}
          >
            <h3 
              style={{
                fontWeight: typography.fontWeight.medium,
                color: colors.gray[900],
                marginBottom: spacing[4]
              }}
            >
              Quick Export
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => handleQuickExport('all')}
                className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-3"
              >
                <FileText className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium">Export All to Excel</div>
                  <div className="text-sm text-gray-500">{data.length} cables</div>
                </div>
              </button>

              {selectedRowIds.length > 0 && (
                <button
                  onClick={() => handleQuickExport('selected')}
                  className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Export Selected to Excel</div>
                    <div className="text-sm text-gray-500">{selectedRowIds.length} cables</div>
                  </div>
                </button>
              )}

              <button
                onClick={() => handleQuickExport('csv')}
                className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-3"
              >
                <Download className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="font-medium">Export to CSV</div>
                  <div className="text-sm text-gray-500">Visible columns only</div>
                </div>
              </button>
            </div>

            {/* Preset Management */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Export Presets</h4>
                <button
                  onClick={() => setShowPresets(!showPresets)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showPresets ? 'Hide' : 'Show'}
                </button>
              </div>

              {showPresets && (
                <div className="space-y-2">
                  {exportPresets.map(preset => (
                    <div key={preset.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{preset.name}</div>
                        {preset.description && (
                          <div className="text-xs text-gray-500">{preset.description}</div>
                        )}
                      </div>
                      <button
                        onClick={() => handleLoadPreset(preset)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Load
                      </button>
                    </div>
                  ))}
                  
                  {exportPresets.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No presets saved</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Custom Export */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="font-medium text-gray-900 mb-4">Custom Export</h3>

            <div className="space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="xlsx"
                      checked={format === 'xlsx'}
                      onChange={(e) => setFormat(e.target.value as 'xlsx')}
                      className="mr-2"
                    />
                    Excel (.xlsx)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="csv"
                      checked={format === 'csv'}
                      onChange={(e) => setFormat(e.target.value as 'csv')}
                      className="mr-2"
                    />
                    CSV (.csv)
                  </label>
                </div>
              </div>

              {/* Filename */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filename (optional)
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="Leave empty for auto-generated name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Sheet Name (Excel only) */}
              {format === 'xlsx' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sheet Name
                  </label>
                  <input
                    type="text"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Data Scope */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data to Export ({getRowCountText()})
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="visible"
                      checked={exportScope === 'visible'}
                      onChange={(e) => setExportScope(e.target.value as 'visible')}
                      className="mr-2"
                    />
                    All visible data
                  </label>
                  {selectedRowIds.length > 0 && (
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="selected"
                        checked={exportScope === 'selected'}
                        onChange={(e) => setExportScope(e.target.value as 'selected')}
                        className="mr-2"
                      />
                      Selected rows only ({selectedRowIds.length} cables)
                    </label>
                  )}
                </div>
              </div>

              {/* Column Options */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Columns to Export
                  </label>
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={includeHidden}
                      onChange={(e) => setIncludeHidden(e.target.checked)}
                      className="mr-1"
                    />
                    Include hidden columns
                  </label>
                </div>

                <div className="flex gap-2 mb-3">
                  <button
                    onClick={handleSelectAllColumns}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAllColumns}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Deselect All
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded p-3 bg-gray-50">
                  <div className="grid grid-cols-2 gap-2">
                    {columnSelection.availableColumns.map(column => (
                      <label key={column.field} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={column.selected}
                          onChange={() => handleColumnToggle(column.field)}
                          className="mr-2"
                        />
                        <span className="truncate">{column.headerName}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="text-sm text-gray-500 mt-2">
                  {columnSelection.selectedCount} of {columnSelection.totalCount} columns selected
                </div>
              </div>

              {/* Save Preset */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Save as Preset</span>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Preset name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={presetDescription}
                    onChange={(e) => setPresetDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSavePreset}
                    disabled={!presetName.trim()}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Preset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={columnSelection.selectedCount === 0}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export ({columnSelection.selectedCount} columns)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportBuilderModal;