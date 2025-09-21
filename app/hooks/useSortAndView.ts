import { useState, useCallback, useEffect } from 'react';
import type { SortOption } from '~/types';
import type { ViewMode, ResultsPerPage } from '~/components/search/SortControls';
import { STORAGE_KEYS, SORT_OPTIONS } from '~/constants';

export interface UseSortAndViewOptions {
  initialSort?: string;
  initialViewMode?: ViewMode;
  initialResultsPerPage?: ResultsPerPage;
  onSortChange?: (sort: string) => void;
  onViewModeChange?: (viewMode: ViewMode) => void;
  onResultsPerPageChange?: (resultsPerPage: ResultsPerPage) => void;
  enablePersistence?: boolean;
}

export interface UseSortAndViewReturn {
  // Sort
  activeSort: string;
  setActiveSort: (sort: string) => void;
  sortOptions: readonly SortOption[];
  
  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  
  // Results per page
  resultsPerPage: ResultsPerPage;
  setResultsPerPage: (count: ResultsPerPage) => void;
  
  // Combined handlers
  handleSortChange: (sort: string) => void;
  handleViewModeChange: (mode: ViewMode) => void;
  handleResultsPerPageChange: (count: ResultsPerPage) => void;
  
  // Reset
  resetToDefaults: () => void;
}

const DEFAULT_SORT = 'relevance';
const DEFAULT_VIEW_MODE: ViewMode = 'grid';
const DEFAULT_RESULTS_PER_PAGE: ResultsPerPage = 12;

export const useSortAndView = (options: UseSortAndViewOptions = {}): UseSortAndViewReturn => {
  const {
    initialSort = DEFAULT_SORT,
    initialViewMode = DEFAULT_VIEW_MODE,
    initialResultsPerPage = DEFAULT_RESULTS_PER_PAGE,
    onSortChange,
    onViewModeChange,
    onResultsPerPageChange,
    enablePersistence = true
  } = options;

  const [activeSort, setActiveSortState] = useState(initialSort);
  const [viewMode, setViewModeState] = useState<ViewMode>(initialViewMode);
  const [resultsPerPage, setResultsPerPageState] = useState<ResultsPerPage>(initialResultsPerPage);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (!enablePersistence) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (stored) {
        const preferences = JSON.parse(stored);
        
        if (preferences.sort) {
          setActiveSortState(preferences.sort);
        }
        if (preferences.viewMode) {
          setViewModeState(preferences.viewMode);
        }
        if (preferences.resultsPerPage) {
          setResultsPerPageState(preferences.resultsPerPage);
        }
      }
    } catch (error) {
      console.warn('Failed to load sort and view preferences:', error);
    }
  }, [enablePersistence]);

  // Save preferences to localStorage
  const savePreferences = useCallback(() => {
    if (!enablePersistence) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      const preferences = stored ? JSON.parse(stored) : {};
      
      const updated = {
        ...preferences,
        sort: activeSort,
        viewMode,
        resultsPerPage
      };
      
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save sort and view preferences:', error);
    }
  }, [activeSort, viewMode, resultsPerPage, enablePersistence]);

  // Save preferences when they change
  useEffect(() => {
    savePreferences();
  }, [savePreferences]);

  // Set active sort
  const setActiveSort = useCallback((sort: string) => {
    setActiveSortState(sort);
    onSortChange?.(sort);
  }, [onSortChange]);

  // Set view mode
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    onViewModeChange?.(mode);
  }, [onViewModeChange]);

  // Set results per page
  const setResultsPerPage = useCallback((count: ResultsPerPage) => {
    setResultsPerPageState(count);
    onResultsPerPageChange?.(count);
  }, [onResultsPerPageChange]);

  // Handle sort change
  const handleSortChange = useCallback((sort: string) => {
    setActiveSort(sort);
  }, [setActiveSort]);

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, [setViewMode]);

  // Handle results per page change
  const handleResultsPerPageChange = useCallback((count: ResultsPerPage) => {
    setResultsPerPage(count);
  }, [setResultsPerPage]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setActiveSort(DEFAULT_SORT);
    setViewMode(DEFAULT_VIEW_MODE);
    setResultsPerPage(DEFAULT_RESULTS_PER_PAGE);
  }, [setActiveSort, setViewMode, setResultsPerPage]);

  return {
    // Sort
    activeSort,
    setActiveSort,
    sortOptions: SORT_OPTIONS,
    
    // View mode
    viewMode,
    setViewMode,
    
    // Results per page
    resultsPerPage,
    setResultsPerPage,
    
    // Combined handlers
    handleSortChange,
    handleViewModeChange,
    handleResultsPerPageChange,
    
    // Reset
    resetToDefaults
  };
};