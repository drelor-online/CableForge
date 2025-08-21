import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook that debounces a value for the specified delay
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook that debounces a callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Hook for debounced search functionality
 */
export function useDebouncedSearch<T>(
  items: T[],
  searchFields: (keyof T)[],
  delay: number = 300
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  const filteredItems = useCallback(() => {
    if (!debouncedSearchTerm.trim()) {
      setIsSearching(false);
      return items;
    }

    setIsSearching(true);
    
    const term = debouncedSearchTerm.toLowerCase();
    const filtered = items.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(term);
      });
    });

    setIsSearching(false);
    return filtered;
  }, [items, debouncedSearchTerm, searchFields]);

  // Effect to show searching state when user is typing
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm && searchTerm.trim()) {
      setIsSearching(true);
    }
  }, [searchTerm, debouncedSearchTerm]);

  const results = filteredItems();

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setIsSearching(false);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    filteredItems: results,
    isSearching,
    clearSearch,
    hasResults: results.length > 0,
    isEmpty: results.length === 0 && debouncedSearchTerm.trim() !== ''
  };
}

/**
 * Hook for throttling values (useful for scroll events)
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}