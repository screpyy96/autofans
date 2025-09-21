/**
 * Simple in-memory cache with TTL support
 */
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expires });
  }

  get<T = any>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) return false;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
export const memoryCache = new MemoryCache();

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    memoryCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Browser storage cache with compression
 */
class StorageCache {
  private storage: Storage;
  private prefix: string;

  constructor(storage: Storage = localStorage, prefix = 'app_cache_') {
    this.storage = storage;
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  set(key: string, data: any, ttl?: number): void {
    try {
      const item = {
        data,
        expires: ttl ? Date.now() + ttl : null,
        timestamp: Date.now()
      };
      
      this.storage.setItem(this.getKey(key), JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  get<T = any>(key: string): T | null {
    try {
      const itemStr = this.storage.getItem(this.getKey(key));
      
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      
      if (item.expires && Date.now() > item.expires) {
        this.delete(key);
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return null;
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.storage.removeItem(this.getKey(key));
  }

  clear(): void {
    const keys = Object.keys(this.storage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        this.storage.removeItem(key);
      }
    });
  }
}

export const localCache = new StorageCache(
  typeof window !== 'undefined' ? localStorage : undefined as any
);

export const sessionCache = new StorageCache(
  typeof window !== 'undefined' ? sessionStorage : undefined as any,
  'session_cache_'
);

/**
 * Cache decorator for functions
 */
export function cached<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    ttl?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
    cache?: MemoryCache | StorageCache;
  } = {}
): T {
  const {
    ttl = 5 * 60 * 1000,
    keyGenerator = (...args) => JSON.stringify(args),
    cache = memoryCache
  } = options;

  return ((...args: Parameters<T>) => {
    const key = `fn_${fn.name}_${keyGenerator(...args)}`;
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    
    // Handle promises
    if (result instanceof Promise) {
      return result.then(data => {
        cache.set(key, data, ttl);
        return data;
      });
    }
    
    cache.set(key, result, ttl);
    return result;
  }) as T;
}