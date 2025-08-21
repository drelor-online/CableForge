import React from 'react';
import { Loader2 } from 'lucide-react';
import { ProgressInfo } from '../../types/common';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  progress?: ProgressInfo;
  className?: string;
  overlay?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'md',
  text,
  progress,
  className = '',
  overlay = false,
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'md':
        return 'w-6 h-6';
      case 'lg':
        return 'w-8 h-8';
      case 'xl':
        return 'w-12 h-12';
      default:
        return 'w-6 h-6';
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'md':
        return 'text-base';
      case 'lg':
        return 'text-lg';
      case 'xl':
        return 'text-xl';
      default:
        return 'text-base';
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className={`${getSizeClasses()} animate-spin text-blue-600`} />
      
      {text && (
        <p className={`mt-2 text-gray-600 ${getTextSizeClasses()}`}>
          {text}
        </p>
      )}
      
      {progress && (
        <div className="mt-3 w-full max-w-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">{progress.stage}</span>
            <span className="text-sm text-gray-500">
              {progress.percentage.toFixed(0)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
            <span>{progress.current} / {progress.total}</span>
            {progress.estimatedTimeRemaining && (
              <span>~{Math.ceil(progress.estimatedTimeRemaining / 1000)}s remaining</span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

// Inline spinner for buttons and small spaces
export const Spinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'sm', className = '' }) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'md':
        return 'w-5 h-5';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-4 h-4';
    }
  };

  return (
    <Loader2 className={`${getSizeClasses()} animate-spin ${className}`} />
  );
};

// Full page loading overlay
export const FullPageLoader: React.FC<{
  text?: string;
  progress?: ProgressInfo;
}> = ({ text = 'Loading...', progress }) => {
  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
      <LoadingIndicator
        size="xl"
        text={text}
        progress={progress}
        className="p-8"
      />
    </div>
  );
};

// Card loading state
export const CardLoader: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-3">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={`h-4 bg-gray-200 rounded ${
              i === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Table loading state
export const TableLoader: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-2">
        {/* Header */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }, (_, i) => (
            <div key={`header-${i}`} className="h-4 bg-gray-300 rounded" />
          ))}
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }, (_, colIndex) => (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                className="h-4 bg-gray-200 rounded"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingIndicator;