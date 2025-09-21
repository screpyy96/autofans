import { useEffect, useRef } from 'react';
import { useAppStore, hydrateStore } from '~/stores/useAppStore';

// Global flag to ensure initialization only happens once
let globalInitialized = false;

export function useAppInitialization() {
  const { isLoading, error, initializeApp } = useAppStore();
  const isInitialized = useRef(false);

  useEffect(() => {
    // Only initialize once globally
    if (globalInitialized || isInitialized.current) return;
    
    globalInitialized = true;
    isInitialized.current = true;
    
    // Hydrate and initialize
    hydrateStore();
    initializeApp();
  }, [initializeApp]);

  return {
    isInitialized: !isLoading,
    error,
  };
}
