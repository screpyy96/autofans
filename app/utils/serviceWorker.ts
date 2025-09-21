/**
 * Service Worker registration and management
 */

interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private config: ServiceWorkerConfig = {};

  async register(config: ServiceWorkerConfig = {}): Promise<void> {
    this.config = config;

    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('Service Worker registration skipped in development');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      this.registration = registration;

      // Check for updates
      registration.addEventListener('updatefound', () => {
        this.handleUpdateFound(registration);
      });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      console.log('Service Worker registered successfully');
      this.config.onSuccess?.(registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      this.config.onError?.(error as Error);
    }
  }

  private handleUpdateFound(registration: ServiceWorkerRegistration): void {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // New content available
          console.log('New content available');
          this.config.onUpdate?.(registration);
        } else {
          // Content cached for first time
          console.log('Content cached for offline use');
          this.config.onSuccess?.(registration);
        }
      }
    });
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const result = await this.registration.unregister();
      console.log('Service Worker unregistered');
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  async update(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      console.log('Service Worker update check completed');
    } catch (error) {
      console.error('Service Worker update failed:', error);
    }
  }

  // Skip waiting and activate new service worker
  skipWaiting(): void {
    if (!this.registration?.waiting) return;

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  // Check if app is running in standalone mode (PWA)
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Request persistent storage
  async requestPersistentStorage(): Promise<boolean> {
    if (!('storage' in navigator) || !('persist' in navigator.storage)) {
      return false;
    }

    try {
      const persistent = await navigator.storage.persist();
      console.log(`Persistent storage: ${persistent ? 'granted' : 'denied'}`);
      return persistent;
    } catch (error) {
      console.error('Persistent storage request failed:', error);
      return false;
    }
  }

  // Get storage usage
  async getStorageUsage(): Promise<{ used: number; quota: number } | null> {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return null;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    } catch (error) {
      console.error('Storage estimate failed:', error);
      return null;
    }
  }

  // Clear all caches
  async clearCaches(): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    } catch (error) {
      console.error('Cache clearing failed:', error);
    }
  }
}

export const serviceWorkerManager = new ServiceWorkerManager();

// Auto-register service worker
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    serviceWorkerManager.register({
      onUpdate: (registration) => {
        // Show update notification to user
        if (confirm('Versiune nouă disponibilă! Reîncarcă pagina?')) {
          serviceWorkerManager.skipWaiting();
        }
      },
      onSuccess: (registration) => {
        console.log('App ready for offline use');
      },
      onError: (error) => {
        console.error('Service Worker error:', error);
      }
    });
  });
}

// Utility functions for PWA features
export function isOnline(): boolean {
  return navigator.onLine;
}

export function addOnlineListener(callback: () => void): () => void {
  window.addEventListener('online', callback);
  return () => window.removeEventListener('online', callback);
}

export function addOfflineListener(callback: () => void): () => void {
  window.addEventListener('offline', callback);
  return () => window.removeEventListener('offline', callback);
}