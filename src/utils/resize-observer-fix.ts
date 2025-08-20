/**
 * ResizeObserver Debounce Fix
 * 
 * This utility patches the ResizeObserver API to debounce notifications,
 * preventing the "ResizeObserver loop completed with undelivered notifications" error
 * that commonly occurs with grid components and rapid resize operations.
 */

// Debounce utility function
const debounce = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
};

/**
 * Patches the global ResizeObserver to debounce notifications
 * This prevents ResizeObserver loop errors by ensuring notifications
 * are delivered in a controlled manner
 */
export const patchResizeObserver = (): void => {
  // Only patch if ResizeObserver exists and hasn't been patched already
  if (!window.ResizeObserver || (window.ResizeObserver as any).__patched) {
    return;
  }

  const OriginalResizeObserver = window.ResizeObserver;
  
  // Create patched ResizeObserver class
  class PatchedResizeObserver extends OriginalResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      // Debounce the callback with a 20ms delay
      // This is long enough to break loops but short enough to feel responsive
      super(debounce(callback, 20));
    }
  }

  // Mark as patched to prevent double-patching
  (PatchedResizeObserver as any).__patched = true;
  
  // Replace the global ResizeObserver
  window.ResizeObserver = PatchedResizeObserver as any;
  
  console.log('ResizeObserver patched successfully - loop errors prevented');
};