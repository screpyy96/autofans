/**
 * Performance monitoring utilities
 */

// Web Vitals tracking
export interface WebVitals {
  CLS: number;
  FID: number;
  FCP: number;
  LCP: number;
  TTFB: number;
}

class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers(): void {
    // Largest Contentful Paint
    this.observeMetric('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.metrics.set('LCP', lastEntry.startTime);
    });

    // First Input Delay
    this.observeMetric('first-input', (entries) => {
      const firstEntry = entries[0];
      this.metrics.set('FID', firstEntry.processingStart - firstEntry.startTime);
    });

    // Cumulative Layout Shift
    this.observeMetric('layout-shift', (entries) => {
      let clsValue = 0;
      for (const entry of entries) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.metrics.set('CLS', clsValue);
    });

    // Navigation timing
    if (performance.getEntriesByType) {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        const nav = navEntries[0];
        this.metrics.set('TTFB', nav.responseStart - nav.requestStart);
        this.metrics.set('FCP', nav.loadEventEnd - nav.fetchStart);
      }
    }
  }

  private observeMetric(type: string, callback: (entries: PerformanceEntry[]) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ type, buffered: true });
      this.observers.set(type, observer);
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error);
    }
  }

  // Measure function execution time
  measureFunction<T extends (...args: any[]) => any>(
    fn: T,
    name?: string
  ): T {
    return ((...args: Parameters<T>) => {
      const startTime = performance.now();
      const result = fn(...args);
      
      if (result instanceof Promise) {
        return result.finally(() => {
          const endTime = performance.now();
          this.metrics.set(name || fn.name, endTime - startTime);
        });
      }
      
      const endTime = performance.now();
      this.metrics.set(name || fn.name, endTime - startTime);
      return result;
    }) as T;
  }

  // Measure component render time
  measureRender(componentName: string): { start: () => void; end: () => void } {
    let startTime: number;
    
    return {
      start: () => {
        startTime = performance.now();
      },
      end: () => {
        const endTime = performance.now();
        this.metrics.set(`render_${componentName}`, endTime - startTime);
      }
    };
  }

  // Get all metrics
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Get specific metric
  getMetric(name: string): number | undefined {
    return this.metrics.get(name);
  }

  // Report metrics (for analytics)
  reportMetrics(callback: (metrics: Record<string, number>) => void): void {
    // Wait for page load to complete
    if (document.readyState === 'complete') {
      callback(this.getMetrics());
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => callback(this.getMetrics()), 0);
      });
    }
  }

  // Clear all observers
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Bundle size analyzer
export function analyzeBundleSize(): void {
  if (typeof window === 'undefined') return;

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  
  console.group('Bundle Analysis');
  
  scripts.forEach((script: HTMLScriptElement) => {
    if (script.src.includes('assets')) {
      console.log(`Script: ${script.src.split('/').pop()}`);
    }
  });
  
  styles.forEach((style: HTMLLinkElement) => {
    if (style.href.includes('assets')) {
      console.log(`Style: ${style.href.split('/').pop()}`);
    }
  });
  
  console.groupEnd();
}

// Memory usage monitoring
export function monitorMemoryUsage(): void {
  if (typeof window === 'undefined' || !(performance as any).memory) return;

  const memory = (performance as any).memory;
  
  console.group('Memory Usage');
  console.log(`Used: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`);
  console.log(`Total: ${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`);
  console.log(`Limit: ${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`);
  console.groupEnd();
}

// Resource timing analysis
export function analyzeResourceTiming(): void {
  if (typeof window === 'undefined') return;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  const analysis = resources.reduce((acc, resource) => {
    const type = resource.initiatorType;
    if (!acc[type]) acc[type] = { count: 0, totalTime: 0, totalSize: 0 };
    
    acc[type].count++;
    acc[type].totalTime += resource.responseEnd - resource.startTime;
    acc[type].totalSize += resource.transferSize || 0;
    
    return acc;
  }, {} as Record<string, { count: number; totalTime: number; totalSize: number }>);
  
  console.table(analysis);
}