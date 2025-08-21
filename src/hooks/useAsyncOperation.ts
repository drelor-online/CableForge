import { useState, useCallback, useRef } from 'react';
import { UseAsyncResult, AppError, ProgressInfo } from '../types/common';
import { errorService } from '../services/error-service';

interface UseAsyncOperationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: AppError) => void;
  showToastOnError?: boolean;
  showToastOnSuccess?: boolean;
  successMessage?: string;
}

/**
 * Hook for managing async operations with loading states, error handling, and progress tracking
 */
export function useAsyncOperation<T = unknown>(
  operation: (...args: any[]) => Promise<T>,
  options: UseAsyncOperationOptions<T> = {}
): UseAsyncResult<T> & {
  progress: ProgressInfo | null;
  setProgress: (progress: ProgressInfo | null) => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  
  const abortController = useRef<AbortController | null>(null);

  const execute = useCallback(async (...args: any[]): Promise<void> => {
    // Cancel any ongoing operation
    if (abortController.current) {
      abortController.current.abort();
    }

    abortController.current = new AbortController();
    
    setLoading(true);
    setError(null);
    setProgress(null);

    try {
      const result = await operation(...args);
      
      if (!abortController.current.signal.aborted) {
        setData(result);
        options.onSuccess?.(result);
        
        if (options.showToastOnSuccess && options.successMessage) {
          errorService.showSuccess(options.successMessage);
        }
      }
    } catch (err) {
      if (!abortController.current.signal.aborted) {
        const appError = errorService.handleError(
          err as Error,
          options.showToastOnError !== false
        );
        setError(appError);
        options.onError?.(appError);
      }
    } finally {
      if (!abortController.current.signal.aborted) {
        setLoading(false);
        setProgress(null);
      }
    }
  }, [operation, options]);

  const reset = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
    setData(null);
    setLoading(false);
    setError(null);
    setProgress(null);
  }, []);

  const cancel = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
    setLoading(false);
    setProgress(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    progress,
    setProgress,
  };
}

/**
 * Hook for simple async operations without progress tracking
 */
export function useSimpleAsync<T = unknown>(
  operation: (...args: any[]) => Promise<T>,
  options: UseAsyncOperationOptions<T> = {}
): UseAsyncResult<T> {
  const {
    progress: _progress,
    setProgress: _setProgress,
    ...asyncResult
  } = useAsyncOperation(operation, options);
  
  return asyncResult;
}

/**
 * Hook for operations that need to show immediate feedback
 */
export function useAsyncWithToast<T = unknown>(
  operation: (...args: any[]) => Promise<T>,
  successMessage: string,
  errorMessage?: string
): UseAsyncResult<T> {
  return useSimpleAsync(operation, {
    showToastOnSuccess: true,
    showToastOnError: true,
    successMessage,
    onError: errorMessage ? (error) => {
      errorService.handleError(new Error(errorMessage), true);
    } : undefined,
  });
}

/**
 * Hook for file operations with progress tracking
 */
export function useFileOperation<T = unknown>(
  operation: (file: File, onProgress?: (progress: ProgressInfo) => void) => Promise<T>,
  options: UseAsyncOperationOptions<T> = {}
): UseAsyncResult<T> & {
  progress: ProgressInfo | null;
  executeWithFile: (file: File) => Promise<void>;
} {
  const asyncOp = useAsyncOperation<T>(operation, options);

  const executeWithFile = useCallback(async (file: File): Promise<void> => {
    await asyncOp.execute(file);
  }, [asyncOp.execute]);

  return {
    ...asyncOp,
    executeWithFile,
  };
}