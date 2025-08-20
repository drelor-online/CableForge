/**
 * ValidationIndicator Component
 * Shows validation status with icon and tooltip
 */

import React from 'react';
import { ValidationStatus } from '../../types/validation';
import { validationService } from '../../services/validation-service';

interface ValidationIndicatorProps {
  status: ValidationStatus;
  className?: string;
  showTooltip?: boolean;
}

const ValidationIndicator: React.FC<ValidationIndicatorProps> = ({ 
  status, 
  className = '', 
  showTooltip = true 
}) => {
  const icon = validationService.getValidationIcon(status);
  const message = validationService.getValidationMessage(status);
  const validationClass = validationService.getValidationClass(status);

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