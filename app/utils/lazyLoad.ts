import { lazy, ComponentType } from 'react';

/**
 * Utility for lazy loading components with better error handling
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ComponentType
): T {
  const LazyComponent = lazy(importFunc);
  
  // Add display name for debugging
  LazyComponent.displayName = `LazyLoaded(${importFunc.toString().match(/\/([^/]+)\.tsx?/)?.[1] || 'Component'})`;
  
  return LazyComponent as T;
}

/**
 * Preload a lazy component
 */
export function preloadComponent(importFunc: () => Promise<any>): void {
  importFunc().catch(() => {
    // Silently handle preload errors
  });
}

/**
 * Lazy load with retry mechanism
 */
export function lazyLoadWithRetry<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  retries = 3
): T {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      let attempt = 0;
      
      const tryImport = () => {
        importFunc()
          .then(resolve)
          .catch((error) => {
            attempt++;
            if (attempt < retries) {
              setTimeout(tryImport, 1000 * attempt); // Exponential backoff
            } else {
              reject(error);
            }
          });
      };
      
      tryImport();
    });
  }) as T;
}