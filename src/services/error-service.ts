import { AppError, ToastNotification } from '../types/common';

// Error codes for categorization
export const ERROR_CODES = {
  // Network and API errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // File operation errors
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
  FILE_FORMAT_ERROR: 'FILE_FORMAT_ERROR',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  
  // Application errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',
  
  // React errors
  REACT_ERROR_BOUNDARY: 'REACT_ERROR_BOUNDARY',
  COMPONENT_ERROR: 'COMPONENT_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

class ErrorService {
  private static instance: ErrorService;
  private toastCallbacks: Set<(toast: ToastNotification) => void> = new Set();
  private errorLog: AppError[] = [];
  private maxLogSize = 1000;

  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  /**
   * Register a callback for displaying toast notifications
   */
  public registerToastCallback(callback: (toast: ToastNotification) => void): void {
    this.toastCallbacks.add(callback);
  }

  /**
   * Unregister a toast callback
   */
  public unregisterToastCallback(callback: (toast: ToastNotification) => void): void {
    this.toastCallbacks.delete(callback);
  }

  /**
   * Create a standardized error object
   */
  public createError(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
    severity: AppError['severity'] = 'medium'
  ): AppError {
    return {
      code,
      message,
      details,
      severity,
      timestamp: new Date(),
    };
  }

  /**
   * Handle an error - log it and optionally show user notification
   */
  public handleError(
    error: Error | AppError,
    showToast = true,
    customMessage?: string
  ): AppError {
    const appError = this.normalizeError(error, customMessage);
    
    // Add to error log
    this.addToLog(appError);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorService:', appError);
    }
    
    // Show user notification if requested
    if (showToast && this.shouldShowToast(appError)) {
      this.showErrorToast(appError);
    }
    
    // Report to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(appError);
    }
    
    return appError;
  }

  /**
   * Show a success message
   */
  public showSuccess(message: string, title = 'Success'): void {
    this.showToast({
      id: this.generateId(),
      type: 'success',
      title,
      message,
      duration: 4000,
    });
  }

  /**
   * Show a warning message
   */
  public showWarning(message: string, title = 'Warning'): void {
    this.showToast({
      id: this.generateId(),
      type: 'warning',
      title,
      message,
      duration: 6000,
    });
  }

  /**
   * Show an info message
   */
  public showInfo(message: string, title = 'Information'): void {
    this.showToast({
      id: this.generateId(),
      type: 'info',
      title,
      message,
      duration: 5000,
    });
  }

  /**
   * Get error history for debugging
   */
  public getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get user-friendly error message
   */
  public getUserFriendlyMessage(error: AppError): string {
    const messageMap: Record<ErrorCode, string> = {
      [ERROR_CODES.NETWORK_ERROR]: 'Network connection problem. Please check your internet connection.',
      [ERROR_CODES.API_ERROR]: 'Server error occurred. Please try again later.',
      [ERROR_CODES.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
      [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again.',
      [ERROR_CODES.REQUIRED_FIELD]: 'Please fill in all required fields.',
      [ERROR_CODES.INVALID_FORMAT]: 'Invalid format. Please check your input.',
      [ERROR_CODES.DUPLICATE_ENTRY]: 'This entry already exists.',
      [ERROR_CODES.FILE_READ_ERROR]: 'Could not read the file. Please try a different file.',
      [ERROR_CODES.FILE_WRITE_ERROR]: 'Could not save the file. Please try again.',
      [ERROR_CODES.FILE_FORMAT_ERROR]: 'Unsupported file format.',
      [ERROR_CODES.DATABASE_ERROR]: 'Database error occurred. Please try again.',
      [ERROR_CODES.CONNECTION_ERROR]: 'Could not connect to database.',
      [ERROR_CODES.QUERY_ERROR]: 'Database query failed.',
      [ERROR_CODES.PERMISSION_DENIED]: 'You do not have permission to perform this action.',
      [ERROR_CODES.FEATURE_NOT_AVAILABLE]: 'This feature is not available yet.',
      [ERROR_CODES.REACT_ERROR_BOUNDARY]: 'Application error occurred. Please refresh the page.',
      [ERROR_CODES.COMPONENT_ERROR]: 'Component error occurred.',
      [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred.',
    };

    return messageMap[error.code as ErrorCode] || error.message || 'An unknown error occurred.';
  }

  private normalizeError(error: Error | AppError, customMessage?: string): AppError {
    if ('code' in error && 'timestamp' in error) {
      // Already an AppError
      return customMessage ? { ...error, message: customMessage } : error;
    }

    // Convert Error to AppError
    const message = customMessage || error.message || 'Unknown error occurred';
    let code: ErrorCode = ERROR_CODES.UNKNOWN_ERROR;
    let severity: AppError['severity'] = 'medium';

    // Try to categorize the error based on message/name
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      code = ERROR_CODES.COMPONENT_ERROR;
      severity = 'high';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      code = ERROR_CODES.NETWORK_ERROR;
    } else if (error.message.includes('validation') || error.message.includes('invalid')) {
      code = ERROR_CODES.VALIDATION_ERROR;
      severity = 'low';
    }

    return {
      code,
      message,
      details: {
        originalError: error.name,
        stack: error.stack,
      },
      severity,
      timestamp: new Date(),
    };
  }

  private shouldShowToast(error: AppError): boolean {
    // Don't show toasts for low severity errors unless they're validation errors
    if (error.severity === 'low' && error.code !== ERROR_CODES.VALIDATION_ERROR) {
      return false;
    }
    
    // Always show critical and high severity errors
    return true;
  }

  private showErrorToast(error: AppError): void {
    const toast: ToastNotification = {
      id: this.generateId(),
      type: 'error',
      title: error.severity === 'critical' ? 'Critical Error' : 'Error',
      message: this.getUserFriendlyMessage(error),
      duration: error.severity === 'critical' ? 0 : 8000, // Critical errors don't auto-dismiss
    };

    this.showToast(toast);
  }

  private showToast(toast: ToastNotification): void {
    this.toastCallbacks.forEach(callback => {
      try {
        callback(toast);
      } catch (error) {
        console.error('Toast callback error:', error);
      }
    });
  }

  private addToLog(error: AppError): void {
    this.errorLog.unshift(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async reportError(error: AppError): Promise<void> {
    // In a real application, this would send the error to an external service
    // like Sentry, LogRocket, or a custom error reporting API
    try {
      // Example: await fetch('/api/errors', { method: 'POST', body: JSON.stringify(error) });
      console.log('Error reported:', error);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }
}

export const errorService = ErrorService.getInstance();

// Utility functions for common error scenarios
export const handleAsyncError = async <T>(
  operation: () => Promise<T>,
  errorMessage?: string,
  showToast = true
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    errorService.handleError(error as Error, showToast, errorMessage);
    return null;
  }
};

export const createValidationError = (
  field: string,
  message: string,
  value?: unknown
): AppError => {
  return errorService.createError(
    ERROR_CODES.VALIDATION_ERROR,
    message,
    { field, value },
    'low'
  );
};

export const createNetworkError = (endpoint: string, method: string): AppError => {
  return errorService.createError(
    ERROR_CODES.NETWORK_ERROR,
    'Network request failed',
    { endpoint, method },
    'medium'
  );
};