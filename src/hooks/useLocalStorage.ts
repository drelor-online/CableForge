import { useState, useEffect, useCallback } from 'react';
import { UseLocalStorageResult, AppError } from '../types/common';
import { errorService, ERROR_CODES } from '../services/error-service';

/**
 * Hook for managing localStorage with proper error handling and type safety
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
    validator?: (value: unknown) => value is T;
    onError?: (error: AppError) => void;
  } = {}
): UseLocalStorageResult<T> {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    validator,
    onError,
  } = options;

  const [value, setStoredValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  // Load initial value from localStorage
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        const parsedValue = deserialize(item);
        
        // Validate if validator is provided
        if (validator && !validator(parsedValue)) {
          throw new Error(`Invalid data format for key: ${key}`);
        }
        
        setStoredValue(parsedValue);
      }
    } catch (err) {
      const appError = errorService.createError(
        ERROR_CODES.UNKNOWN_ERROR,
        `Failed to load data from localStorage for key: ${key}`,
        { key, error: (err as Error).message },
        'low'
      );
      
      setError(appError);
      onError?.(appError);
      
      // Use default value on error
      setStoredValue(defaultValue);
    } finally {
      setLoading(false);
    }
  }, [key, defaultValue, deserialize, validator, onError]);

  // Set value in localStorage
  const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
    try {
      setError(null);
      
      const valueToStore = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(value)
        : newValue;

      // Validate if validator is provided
      if (validator && !validator(valueToStore)) {
        throw new Error(`Invalid data format for key: ${key}`);
      }

      setStoredValue(valueToStore);
      window.localStorage.setItem(key, serialize(valueToStore));
    } catch (err) {
      const appError = errorService.createError(
        ERROR_CODES.UNKNOWN_ERROR,
        `Failed to save data to localStorage for key: ${key}`,
        { key, value: newValue, error: (err as Error).message },
        'medium'
      );
      
      setError(appError);
      onError?.(appError);
      
      // Show user notification for save errors
      errorService.handleError(appError, true);
    }
  }, [key, value, serialize, validator, onError]);

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setError(null);
      setStoredValue(defaultValue);
      window.localStorage.removeItem(key);
    } catch (err) {
      const appError = errorService.createError(
        ERROR_CODES.UNKNOWN_ERROR,
        `Failed to remove data from localStorage for key: ${key}`,
        { key, error: (err as Error).message },
        'low'
      );
      
      setError(appError);
      onError?.(appError);
    }
  }, [key, defaultValue, onError]);

  return {
    value,
    setValue,
    removeValue,
    loading,
    error,
  };
}

/**
 * Hook for managing preset data in localStorage
 */
export function usePresets<T extends { id: string; name: string }>(
  storageKey: string,
  defaultPresets: T[] = []
) {
  const { value: presets, setValue: setPresets, error, loading } = useLocalStorage<T[]>(
    storageKey,
    defaultPresets,
    {
      validator: (value): value is T[] => {
        return Array.isArray(value) && value.every(item => 
          typeof item === 'object' && 
          typeof item.id === 'string' && 
          typeof item.name === 'string'
        );
      },
    }
  );

  const addPreset = useCallback((preset: T) => {
    setPresets(prev => {
      // Remove existing preset with same id if it exists
      const filtered = prev.filter(p => p.id !== preset.id);
      return [...filtered, preset];
    });
  }, [setPresets]);

  const updatePreset = useCallback((id: string, updates: Partial<T>) => {
    setPresets(prev => prev.map(preset => 
      preset.id === id ? { ...preset, ...updates } : preset
    ));
  }, [setPresets]);

  const removePreset = useCallback((id: string) => {
    setPresets(prev => prev.filter(preset => preset.id !== id));
  }, [setPresets]);

  const getPreset = useCallback((id: string) => {
    return presets.find(preset => preset.id === id) || null;
  }, [presets]);

  const duplicatePreset = useCallback((id: string, newName?: string) => {
    const preset = getPreset(id);
    if (preset) {
      const newId = `${id}_copy_${Date.now()}`;
      const duplicated = {
        ...preset,
        id: newId,
        name: newName || `${preset.name} (Copy)`,
      };
      addPreset(duplicated);
      return duplicated;
    }
    return null;
  }, [getPreset, addPreset]);

  return {
    presets,
    addPreset,
    updatePreset,
    removePreset,
    getPreset,
    duplicatePreset,
    loading,
    error,
  };
}

/**
 * Hook for managing user settings
 */
export function useSettings<T extends Record<string, unknown>>(
  defaultSettings: T
) {
  return useLocalStorage('cableforge_settings', defaultSettings, {
    validator: (value): value is T => {
      return typeof value === 'object' && value !== null;
    },
  });
}

/**
 * Hook for managing recent items list
 */
export function useRecentItems<T extends { id: string; name: string; timestamp?: number }>(
  storageKey: string,
  maxItems = 10
) {
  const { value: items, setValue: setItems, error, loading } = useLocalStorage<T[]>(
    storageKey,
    [],
    {
      validator: (value): value is T[] => {
        return Array.isArray(value);
      },
    }
  );

  const addItem = useCallback((item: Omit<T, 'timestamp'>) => {
    const timestampedItem = {
      ...item,
      timestamp: Date.now(),
    } as T;

    setItems(prev => {
      // Remove existing item if it exists
      const filtered = prev.filter(existing => existing.id !== item.id);
      // Add new item to beginning and limit length
      return [timestampedItem, ...filtered].slice(0, maxItems);
    });
  }, [setItems, maxItems]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, [setItems]);

  const clearAll = useCallback(() => {
    setItems([]);
  }, [setItems]);

  return {
    items,
    addItem,
    removeItem,
    clearAll,
    loading,
    error,
  };
}