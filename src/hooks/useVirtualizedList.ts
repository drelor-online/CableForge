import { useMemo, useState, useEffect, useCallback } from 'react';

interface VirtualizedListOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  threshold?: number; // Number of items to trigger virtualization
}

interface VirtualizedListResult<T> {
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  containerProps: {
    style: React.CSSProperties;
    onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  };
  itemProps: (index: number) => {
    style: React.CSSProperties;
    key: string | number;
  };
  shouldVirtualize: boolean;
}

export function useVirtualizedList<T>(
  items: T[],
  options: VirtualizedListOptions
): VirtualizedListResult<T> {
  const { itemHeight, containerHeight, overscan = 5, threshold = 100 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const shouldVirtualize = items.length > threshold;

  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    if (!shouldVirtualize) {
      return {
        startIndex: 0,
        endIndex: items.length - 1,
        visibleItems: items
      };
    }

    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(items.length - 1, visibleEnd + overscan);

    return {
      startIndex: start,
      endIndex: end,
      visibleItems: items.slice(start, end + 1)
    };
  }, [items, scrollTop, itemHeight, containerHeight, overscan, shouldVirtualize]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const containerProps = {
    style: {
      height: containerHeight,
      overflow: 'auto' as const,
      position: 'relative' as const
    },
    onScroll: handleScroll
  };

  const itemProps = useCallback((index: number) => {
    const actualIndex = startIndex + index;
    return {
      style: {
        position: 'absolute' as const,
        top: actualIndex * itemHeight,
        left: 0,
        right: 0,
        height: itemHeight
      },
      key: actualIndex
    };
  }, [startIndex, itemHeight]);

  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    containerProps,
    itemProps,
    shouldVirtualize
  };
}

// Hook for virtualized dropdowns specifically
export function useVirtualizedDropdown<T>(
  items: T[],
  maxHeight: number = 200,
  itemHeight: number = 32
) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    
    const term = searchTerm.toLowerCase();
    return items.filter(item => 
      String(item).toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  const virtualizedList = useVirtualizedList(filteredItems, {
    itemHeight,
    containerHeight: Math.min(maxHeight, filteredItems.length * itemHeight),
    threshold: 50 // Start virtualizing at 50 items
  });

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setSearchTerm('');
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchTerm('');
  }, []);

  return {
    ...virtualizedList,
    isOpen,
    searchTerm,
    filteredItems,
    setSearchTerm,
    handleOpen,
    handleClose,
    setIsOpen
  };
}