import { useState, useCallback, useEffect } from 'react';
import type { FilterState, SavedSearch } from '~/types';
import { STORAGE_KEYS } from '~/constants';

export interface UseFiltersOptions {
  initialFilters?: FilterState;
  onFiltersChange?: (filters: FilterState) => void;
  enablePersistence?: boolean;
  persistenceKey?: string;
}

export interface UseFiltersReturn {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  updateFilters: (updates: Partial<FilterState>) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  savedSearches: SavedSearch[];
  saveSearch: (name: string, filters: FilterState) => void;
  loadSavedSearch: (search: SavedSearch) => void;
  deleteSavedSearch: (searchId: string) => void;
  clearSavedSearches: () => void;
}

export const useFilters = (options: UseFiltersOptions = {}): UseFiltersReturn => {
  const {
    initialFilters = {},
    onFiltersChange,
    enablePersistence = true,
    persistenceKey = STORAGE_KEYS.SAVED_FILTERS
  } = options;

  const [filters, setFiltersState] = useState<FilterState>(initialFilters);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Load saved filters and searches from localStorage on mount
  useEffect(() => {
    if (!enablePersistence) return;

    try {
      // Load saved filters
      const savedFilters = localStorage.getItem(persistenceKey);
      if (savedFilters) {
        const parsed = JSON.parse(savedFilters) as FilterState;
        setFiltersState(prev => ({ ...prev, ...parsed }));
      }

      // Load saved searches
      const savedSearchesData = localStorage.getItem(STORAGE_KEYS.SAVED_FILTERS + '_searches');
      if (savedSearchesData) {
        const parsed = JSON.parse(savedSearchesData) as SavedSearch[];
        setSavedSearches(parsed);
      }
    } catch (error) {
      console.warn('Failed to load saved filters:', error);
    }
  }, [enablePersistence, persistenceKey]);

  // Save filters to localStorage when they change
  useEffect(() => {
    if (!enablePersistence) return;

    try {
      localStorage.setItem(persistenceKey, JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to save filters:', error);
    }
  }, [filters, enablePersistence, persistenceKey]);

  // Set filters
  const setFilters = useCallback((newFilters: FilterState) => {
    setFiltersState(newFilters);
    onFiltersChange?.(newFilters);
  }, [onFiltersChange]);

  // Update filters (merge with existing)
  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFiltersState(prevFilters => {
      const newFilters = { ...prevFilters, ...updates };
      
      // Remove undefined values to keep the object clean
      Object.keys(newFilters).forEach(key => {
        const value = newFilters[key as keyof FilterState];
        if (value === undefined || (Array.isArray(value) && value.length === 0)) {
          delete newFilters[key as keyof FilterState];
        }
      });

      onFiltersChange?.(newFilters);
      return newFilters;
    });
  }, [onFiltersChange]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);

  // Check if there are active filters
  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof FilterState];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return true;
    return value !== undefined && value !== null && value !== '';
  });

  // Count active filters
  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof FilterState];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return true;
    return value !== undefined && value !== null && value !== '';
  }).length;

  // Save search
  const saveSearch = useCallback((name: string, searchFilters: FilterState) => {
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: name.trim(),
      filters: { ...searchFilters },
      alertsEnabled: false,
      createdAt: new Date()
    };

    setSavedSearches(prev => {
      const updated = [newSearch, ...prev];
      
      // Save to localStorage
      try {
        localStorage.setItem(
          STORAGE_KEYS.SAVED_FILTERS + '_searches', 
          JSON.stringify(updated)
        );
      } catch (error) {
        console.warn('Failed to save search:', error);
      }
      
      return updated;
    });
  }, []);

  // Load saved search
  const loadSavedSearch = useCallback((search: SavedSearch) => {
    setFilters(search.filters);
  }, [setFilters]);

  // Delete saved search
  const deleteSavedSearch = useCallback((searchId: string) => {
    setSavedSearches(prev => {
      const updated = prev.filter(search => search.id !== searchId);
      
      // Update localStorage
      try {
        localStorage.setItem(
          STORAGE_KEYS.SAVED_FILTERS + '_searches', 
          JSON.stringify(updated)
        );
      } catch (error) {
        console.warn('Failed to delete saved search:', error);
      }
      
      return updated;
    });
  }, []);

  // Clear all saved searches
  const clearSavedSearches = useCallback(() => {
    setSavedSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.SAVED_FILTERS + '_searches');
    } catch (error) {
      console.warn('Failed to clear saved searches:', error);
    }
  }, []);

  return {
    filters,
    setFilters,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
    savedSearches,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch,
    clearSavedSearches
  };
};