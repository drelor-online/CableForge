/**
 * ValidationSummaryBadge Component  
 * Shows validation counts in a compact badge format
 */

import React from 'react';

interface ValidationSummaryBadgeProps {
  errorCount: number;
  warningCount: number;
  infoCount?: number;
  className?: string;
}

const ValidationSummaryBadge: React.FC<ValidationSummaryBadgeProps> = ({
  errorCount,
  warningCount,
  infoCount = 0,
  className = ''
}) => {
  const totalIssues = errorCount + warningCount + infoCount;

  if (totalIssues === 0) {
    return (
      <span className={`text-green-600 ${className}`}>
        ✅ All valid
      </span>
    );
  }

  const parts: string[] = [];
  
  if (errorCount > 0) {
    parts.push(`${errorCount} error${errorCount !== 1 ? 's' : ''}`);
  }
  
  if (warningCount > 0) {
    parts.push(`${warningCount} warning${warningCount !== 1 ? 's' : ''}`);
  }

  if (infoCount > 0) {
    parts.push(`${infoCount} info`);
  }

  const badgeColor = errorCount > 0 ? 'text-red-600' : 'text-yellow-600';

  return (
    <span className={`${badgeColor} ${className}`}>
      {errorCount > 0 ? '❌' : '⚠️'} {parts.join(', ')}
    </span>
  );
};

export default ValidationSummaryBadge;