/**
 * ValidationPanel Component
 * Displays detailed validation results in a collapsible panel
 */

import React, { useState } from 'react';
import { ValidationResult, ValidationSeverity } from '../../types/validation';
import ValidationIndicator from '../ui/ValidationIndicator';

interface ValidationPanelProps {
  results: ValidationResult[];
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({
  results,
  isOpen = false,
  onToggle,
  className = ''
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(isOpen);
  
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const actualIsOpen = onToggle !== undefined ? isOpen : internalIsOpen;

  const errorResults = results.filter(r => r.severity === ValidationSeverity.Error);
  const warningResults = results.filter(r => r.severity === ValidationSeverity.Warning);
  const infoResults = results.filter(r => r.severity === ValidationSeverity.Info);

  const totalIssues = results.length;

  if (totalIssues === 0) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-md p-3 ${className}`}>
        <div className="flex items-center">
          <ValidationIndicator status={{ hasIssues: false, errorCount: 0, warningCount: 0 }} />
          <span className="ml-2 text-sm text-green-800">All validations passed</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-md ${errorResults.length > 0 ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'} ${className}`}>
      <div 
        className="px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-opacity-75"
        onClick={handleToggle}
      >
        <div className="flex items-center">
          <ValidationIndicator 
            status={{ 
              hasIssues: totalIssues > 0, 
              errorCount: errorResults.length, 
              warningCount: warningResults.length 
            }} 
          />
          <span className="ml-2 text-sm font-medium">
            {errorResults.length > 0 && `${errorResults.length} error${errorResults.length !== 1 ? 's' : ''}`}
            {errorResults.length > 0 && warningResults.length > 0 && ', '}
            {warningResults.length > 0 && `${warningResults.length} warning${warningResults.length !== 1 ? 's' : ''}`}
            {infoResults.length > 0 && (errorResults.length > 0 || warningResults.length > 0) && ', '}
            {infoResults.length > 0 && `${infoResults.length} info`}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          {actualIsOpen ? '▼' : '▶'}
        </span>
      </div>
      
      {actualIsOpen && (
        <div className="border-t border-gray-200 px-4 py-3">
          <div className="space-y-2">
            {/* Errors first */}
            {errorResults.map((result, index) => (
              <ValidationItem key={`error-${index}`} result={result} />
            ))}
            
            {/* Then warnings */}
            {warningResults.map((result, index) => (
              <ValidationItem key={`warning-${index}`} result={result} />
            ))}
            
            {/* Finally info */}
            {infoResults.map((result, index) => (
              <ValidationItem key={`info-${index}`} result={result} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ValidationItem: React.FC<{ result: ValidationResult }> = ({ result }) => {
  const severityColor = {
    [ValidationSeverity.Error]: 'text-red-700',
    [ValidationSeverity.Warning]: 'text-yellow-700', 
    [ValidationSeverity.Info]: 'text-blue-700'
  }[result.severity];

  const severityIcon = {
    [ValidationSeverity.Error]: '❌',
    [ValidationSeverity.Warning]: '⚠️',
    [ValidationSeverity.Info]: 'ℹ️'
  }[result.severity];

  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="mt-0.5">{severityIcon}</span>
      <div className="flex-1">
        <div className={`font-medium ${severityColor}`}>
          {result.cableTag}: {result.message}
        </div>
        {result.field && (
          <div className="text-gray-600 text-xs mt-1">
            Field: {result.field}
          </div>
        )}
        {result.suggestedFix && (
          <div className="text-gray-600 text-xs mt-1">
            Suggestion: {result.suggestedFix}
          </div>
        )}
        {result.overrideAllowed && (
          <div className="text-gray-500 text-xs mt-1">
            Override allowed
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationPanel;