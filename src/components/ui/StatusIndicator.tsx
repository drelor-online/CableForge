import React from 'react';

interface StatusIndicatorProps {
  status: 'ok' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, children }) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'ok':
        return 'status-ok';
      case 'warning':
        return 'status-warning';
      case 'error':
        return 'status-error';
      case 'info':
        return 'text-blue-600';
      default:
        return '';
    }
  };

  return (
    <span className={`status-indicator ${getStatusClass(status)}`}>
      {children}
    </span>
  );
};

export default StatusIndicator;