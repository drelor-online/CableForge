import React, { useState, useCallback, useMemo } from 'react';
import { Cable } from '../../types';
import { ColumnDefinition } from '../../services/column-service';
import { ImportOptions, ImportValidationResult, ParsedCsvData, importService } from '../../services/import-service';

interface ImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (cables: Partial<Cable>[]) => Promise<void>;
  columns: ColumnDefinition[];
  existingCables: Cable[];
}

type Step = 'upload' | 'configure' | 'map' | 'validate' | 'confirm';

const ImportWizardModal: React.FC<ImportWizardModalProps> = ({
  isOpen,
  onClose,
  onImport,
  columns,
  existingCables
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCsvData | null>(null);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    format: 'csv',
    hasHeaders: true,
    startRow: 0,
    columnMapping: {},
    skipEmptyRows: true,
    overwriteExisting: false
  });
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    
    try {
      const parsed = await importService.parseFile(file);
      setParsedData(parsed);
      
      // Auto-detect format
      const format = file.name.endsWith('.csv') ? 'csv' : 'xlsx';
      setImportOptions(prev => ({ ...prev, format }));
      
      // Auto-suggest column mapping
      const suggestedMapping = importService.suggestFieldMapping(parsed.headers, columns);
      setImportOptions(prev => ({ ...prev, columnMapping: suggestedMapping }));
      
      setCurrentStep('configure');
    } catch (error) {
      console.error('Failed to parse file:', error);
      alert(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [columns]);

  const handleConfigureNext = useCallback(() => {
    if (parsedData) {
      setCurrentStep('map');
    }
  }, [parsedData]);

  const handleMapNext = useCallback(() => {
    if (parsedData) {
      setIsProcessing(true);
      try {
        const result = importService.validateAndConvertData(
          parsedData,
          importOptions,
          columns,
          existingCables
        );
        setValidationResult(result);
        setCurrentStep('validate');
      } catch (error) {
        console.error('Validation failed:', error);
        alert(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [parsedData, importOptions, columns, existingCables]);

  const handleValidateNext = useCallback(() => {
    if (validationResult?.isValid || (validationResult?.validRows && validationResult.validRows > 0)) {
      setCurrentStep('confirm');
    }
  }, [validationResult]);

  const handleImport = useCallback(async () => {
    if (validationResult?.parsedData) {
      setIsProcessing(true);
      try {
        await onImport(validationResult.parsedData);
        handleClose();
      } catch (error) {
        console.error('Import failed:', error);
        alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [validationResult, onImport]);

  const handleClose = useCallback(() => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setParsedData(null);
    setValidationResult(null);
    setImportOptions({
      format: 'csv',
      hasHeaders: true,
      startRow: 0,
      columnMapping: {},
      skipEmptyRows: true,
      overwriteExisting: false
    });
    onClose();
  }, [onClose]);

  const availableHeaders = useMemo(() => {
    return parsedData?.headers || [];
  }, [parsedData]);

  const requiredFields = useMemo(() => {
    return columns.filter(col => col.required);
  }, [columns]);

  const canProceedFromMapping = useMemo(() => {
    return requiredFields.every(field => importOptions.columnMapping[field.field]);
  }, [requiredFields, importOptions.columnMapping]);

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Cable Data</h3>
              <p className="text-gray-600 mb-6">Select a CSV or Excel file containing your cable data</p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer block text-center"
              >
                <div className="space-y-2">
                  <div className="text-gray-400">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-lg text-gray-600">
                    Drop your file here or <span className="text-blue-600 underline">browse</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Supports CSV and Excel files
                  </div>
                </div>
              </label>
            </div>

            {selectedFile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-green-800 font-medium">{selectedFile.name}</span>
                  <span className="text-green-600 ml-2">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'configure':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configure Import Settings</h3>
              <p className="text-gray-600 mb-6">Adjust the settings for parsing your data</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Format
                </label>
                <select
                  value={importOptions.format}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, format: e.target.value as 'csv' | 'xlsx' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled
                >
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Row
                </label>
                <input
                  type="number"
                  min="0"
                  value={importOptions.startRow}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, startRow: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={importOptions.hasHeaders}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, hasHeaders: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">First row contains headers</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={importOptions.skipEmptyRows}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, skipEmptyRows: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Skip empty rows</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={importOptions.overwriteExisting}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, overwriteExisting: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Overwrite existing cables with same tag</span>
              </label>
            </div>

            {parsedData && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Data Preview</h4>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 max-h-32 overflow-auto">
                  <div className="text-xs">
                    <div className="font-medium mb-1">Headers:</div>
                    <div className="text-gray-600">{parsedData.headers.join(', ')}</div>
                    <div className="font-medium mt-2 mb-1">Total Rows: {parsedData.totalRows}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'map':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Map Columns</h3>
              <p className="text-gray-600 mb-6">Map your file columns to cable fields</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-yellow-800 text-sm">
                  Fields marked with * are required and must be mapped
                </span>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {columns.map(column => (
                <div key={column.field} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {column.headerName}
                        {column.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                      <span className="text-xs text-gray-500 ml-2 px-2 py-1 bg-gray-100 rounded">
                        {column.category}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{column.field}</div>
                  </div>
                  <div className="w-48">
                    <select
                      value={importOptions.columnMapping[column.field] || ''}
                      onChange={(e) => setImportOptions(prev => ({
                        ...prev,
                        columnMapping: {
                          ...prev.columnMapping,
                          [column.field]: e.target.value
                        }
                      }))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        column.required && !importOptions.columnMapping[column.field] 
                          ? 'border-red-300' 
                          : 'border-gray-300'
                      }`}
                    >
                      <option value="">-- Select Column --</option>
                      {availableHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                Mapped: {Object.keys(importOptions.columnMapping).filter(key => importOptions.columnMapping[key]).length} / {columns.length} fields
              </div>
              {!canProceedFromMapping && (
                <div className="text-sm text-red-600 mt-1">
                  Please map all required fields to continue
                </div>
              )}
            </div>
          </div>
        );

      case 'validate':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Validation Results</h3>
              <p className="text-gray-600 mb-6">Review the validation results before importing</p>
            </div>

            {validationResult && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{validationResult.totalRows}</div>
                    <div className="text-sm text-blue-800">Total Rows</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{validationResult.validRows}</div>
                    <div className="text-sm text-green-800">Valid Rows</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{validationResult.errors.length}</div>
                    <div className="text-sm text-red-800">Errors</div>
                  </div>
                </div>

                {/* Errors */}
                {validationResult.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-800 mb-2">Errors</h4>
                    <div className="bg-red-50 border border-red-200 rounded max-h-32 overflow-y-auto">
                      {validationResult.errors.map((error, index) => (
                        <div key={index} className="px-3 py-2 text-sm text-red-700 border-b border-red-200 last:border-b-0">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {validationResult.warnings.length > 0 && (
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-2">Warnings</h4>
                    <div className="bg-yellow-50 border border-yellow-200 rounded max-h-32 overflow-y-auto">
                      {validationResult.warnings.map((warning, index) => (
                        <div key={index} className="px-3 py-2 text-sm text-yellow-700 border-b border-yellow-200 last:border-b-0">
                          {warning}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Duplicates */}
                {validationResult.duplicates.length > 0 && (
                  <div>
                    <h4 className="font-medium text-orange-800 mb-2">Duplicates Found</h4>
                    <div className="bg-orange-50 border border-orange-200 rounded max-h-32 overflow-y-auto">
                      {validationResult.duplicates.map((duplicate, index) => (
                        <div key={index} className="px-3 py-2 text-sm text-orange-700 border-b border-orange-200 last:border-b-0">
                          {duplicate}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Import</h3>
              <p className="text-gray-600 mb-6">
                {validationResult?.validRows} cables will be imported into your project
              </p>
            </div>

            {validationResult && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Import Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Valid cables:</span>
                    <span className="font-medium">{validationResult.validRows}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Errors:</span>
                    <span className="font-medium text-red-600">{validationResult.errors.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Warnings:</span>
                    <span className="font-medium text-yellow-600">{validationResult.warnings.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duplicates:</span>
                    <span className="font-medium text-orange-600">{validationResult.duplicates.length}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-1">Before you proceed:</div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Make sure you have a backup of your current data</li>
                    <li>Review the validation results above</li>
                    <li>Only valid cables will be imported</li>
                    {importOptions.overwriteExisting && (
                      <li className="text-red-600">Existing cables with duplicate tags will be overwritten</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepButtons = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        );

      case 'configure':
        return (
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep('upload')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleConfigureNext}
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Next: Map Columns
            </button>
          </div>
        );

      case 'map':
        return (
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep('configure')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleMapNext}
              disabled={!canProceedFromMapping || isProcessing}
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Validating...' : 'Next: Validate'}
            </button>
          </div>
        );

      case 'validate':
        return (
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep('map')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleValidateNext}
              disabled={!validationResult?.isValid && validationResult?.validRows === 0}
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Confirm
            </button>
          </div>
        );

      case 'confirm':
        return (
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep('validate')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Back
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={isProcessing}
                className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Importing...' : `Import ${validationResult?.validRows} Cables`}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const steps = [
    { key: 'upload', label: 'Upload', completed: ['configure', 'map', 'validate', 'confirm'].includes(currentStep) },
    { key: 'configure', label: 'Configure', completed: ['map', 'validate', 'confirm'].includes(currentStep) },
    { key: 'map', label: 'Map Columns', completed: ['validate', 'confirm'].includes(currentStep) },
    { key: 'validate', label: 'Validate', completed: ['confirm'].includes(currentStep) },
    { key: 'confirm', label: 'Confirm', completed: false }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header with Steps */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Import Cable Data</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step.key === currentStep 
                    ? 'bg-blue-600 text-white' 
                    : step.completed 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {step.completed ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step.key === currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    step.completed ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          {getStepButtons()}
        </div>
      </div>
    </div>
  );
};

export default ImportWizardModal;