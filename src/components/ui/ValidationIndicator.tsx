/**
 * ValidationIndicator Component
 * Shows validation status with icon and tooltip
 */

import React from 'react';
import { ValidationStatus, ValidationResult } from '../../types/validation';
import { validationService } from '../../services/validation-service';

interface ValidationIndicatorProps {
  status?: ValidationStatus;
  validation?: ValidationResult;
  className?: string;
  showTooltip?: boolean;
}

const ValidationIndicator: React.FC<ValidationIndicatorProps> = ({ 
  status, 
  validation,
  className = '', 
  showTooltip = true 
}) => {
  // Convert ValidationResult to ValidationStatus if needed
  const actualStatus = status || (validation ? {
    hasIssues: true,
    errorCount: validation.severity === 'Error' ? 1 : 0,
    warningCount: validation.severity === 'Warning' ? 1 : 0
  } : { hasIssues: false, errorCount: 0, warningCount: 0 });

  const icon = validationService.getValidationIcon(actualStatus);
  const message = validation?.message || validationService.getValidationMessage(actualStatus);
  const validationClass = validationService.getValidationClass(actualStatus);

  const combinedClassName = `inline-flex items-center ${validationClass} ${className}`;

  if (showTooltip) {
    return (
      <span 
        className={combinedClassName}
        title={message}
      >
        {icon}
      </span>
    );
  }

  return (
    <span className={combinedClassName}>
      {icon}
    </span>
  );
};

export default ValidationIndicator;