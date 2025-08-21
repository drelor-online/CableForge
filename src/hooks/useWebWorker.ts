import { useRef, useCallback, useEffect } from 'react';
import { FilterWorkerMessage, FilterWorkerResponse } from '../workers/filterWorker';

export interface UseWebWorkerOptions {
  timeout?: number;
  terminateOnUnmount?: boolean;
}

export function useWebWorker<T = any>(
  workerPath: string,
  options: UseWebWorkerOptions = {}
) {
  const { timeout = 30000, terminateOnUnmount = true } = options;
  const workerRef = useRef<Worker | null>(null);
  const pendingPromises = useRef<Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeoutId: NodeJS.Timeout;
  }>>(new Map());

  // Initialize worker
  const initWorker = useCallback(() => {
    if (!workerRef.current) {
      try {
        workerRef.current = new Worker(workerPath);
        
        workerRef.current.onmessage = (event: MessageEvent<FilterWorkerResponse>) => {
          const { id, type, payload } = event.data;
          const pending = pendingPromises.current.get(id);
          
          if (pending) {
            clearTimeout(pending.timeoutId);
            pendingPromises.current.delete(id);
            
            if (type === 'ERROR') {
              pending.reject(new Error(payload.error || 'Worker error'));
            } else {
              pending.resolve(payload);
            }
          }
        };

        workerRef.current.onerror = (error) => {
          console.error('Web Worker error:', error);
          // Reject all pending promises
          pendingPromises.current.forEach(({ reject, timeoutId }) => {
            clearTimeout(timeoutId);
            reject(new Error('Worker error'));
          });
          pendingPromises.current.clear();
        };
      } catch (error) {
        console.error('Failed to create worker:', error);
      }
    }
    return workerRef.current;
  }, [workerPath]);

  // Send message to worker
  const postMessage = useCallback(<TPayload = any, TResult = T>(
    type: string,
    payload: TPayload
  ): Promise<TResult> => {
    return new Promise((resolve, reject) => {
      const worker = initWorker();
      if (!worker) {
        reject(new Error('Worker not available'));
        return;
      }

      const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const timeoutId = setTimeout(() => {
        pendingPromises.current.delete(id);
        reject(new Error('Worker timeout'));
      }, timeout);

      pendingPromises.current.set(id, { resolve, reject, timeoutId });

      const message: FilterWorkerMessage = { type, payload, id } as any;
      worker.postMessage(message);
    });
  }, [initWorker, timeout]);

  // Terminate worker
  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    
    // Reject all pending promises
    pendingPromises.current.forEach(({ reject, timeoutId }) => {
      clearTimeout(timeoutId);
      reject(new Error('Worker terminated'));
    });
    pendingPromises.current.clear();
  }, []);

  // Check if worker is available
  const isAvailable = useCallback(() => {
    return typeof Worker !== 'undefined';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (terminateOnUnmount) {
        terminate();
      }
    };
  }, [terminate, terminateOnUnmount]);

  return {
    postMessage,
    terminate,
    isAvailable,
    isWorkerReady: () => workerRef.current !== null
  };
}

// Specific hook for filter operations
export function useFilterWorker() {
  const { postMessage, terminate, isAvailable } = useWebWorker('/workers/filterWorker.js');

  const filterData = useCallback(async (data: any[], filters: any[]) => {
    if (!isAvailable()) {
      // Fallback to synchronous filtering
      return { filteredData: data, count: data.length };
    }
    
    return postMessage('FILTER_DATA', { data, filters });
  }, [postMessage, isAvailable]);

  const validateData = useCallback(async (data: any[], rules: any[]) => {
    if (!isAvailable()) {
      // Fallback to synchronous validation
      return { validationResults: [] };
    }
    
    return postMessage('VALIDATE_DATA', { data, rules });
  }, [postMessage, isAvailable]);

  const sortData = useCallback(async (data: any[], sortConfig: { field: string; direction: 'asc' | 'desc' }) => {
    if (!isAvailable()) {
      // Fallback to synchronous sorting
      const sortedData = [...data].sort((a, b) => {
        const aValue = a[sortConfig.field];
        const bValue = b[sortConfig.field];
        
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
        if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
        
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }
        
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
      
      return { sortedData };
    }
    
    return postMessage('SORT_DATA', { data, sortConfig });
  }, [postMessage, isAvailable]);

  return {
    filterData,
    validateData,
    sortData,
    terminate,
    isAvailable
  };
}