import { useState, useCallback, useEffect } from 'react';
import type { SearchSuggestion } from '~/components/search/SearchBar';
import { SEARCH_CONFIG, STORAGE_KEYS } from '~/constants';

export interface UseSearchOptions {
  onSearch?: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  initialQuery?: string;
  enableHistory?: boolean;
}

export interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  recentSearches: string[];
  clearRecentSearches: () => void;
  handleSearch: (query: string) => void;
  handleSuggestionSelect: (suggestion: SearchSuggestion) => void;
}

export const useSearch = (options: UseSearchOptions = {}): UseSearchReturn => {
  const {
    onSearch,
    onSuggestionSelect,
    initialQuery = '',
    enableHistory = true
  } = options;

  const [query, setQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    if (!enableHistory) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
      if (stored) {
        const recent = JSON.parse(stored) as string[];
        setRecentSearches(recent.slice(0, SEARCH_CONFIG.MAX_RECENT_SEARCHES));
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
    }
  }, [enableHistory]);

  // Save recent search to localStorage
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!enableHistory || !searchQuery.trim()) return;

    try {
      const trimmedQuery = searchQuery.trim();
      
      setRecentSearches(prev => {
        // Remove if already exists
        const filtered = prev.filter(item => item !== trimmedQuery);
        
        // Add to beginning
        const updated = [trimmedQuery, ...filtered];
        
        // Keep only last N searches
        const limited = updated.slice(0, SEARCH_CONFIG.MAX_RECENT_SEARCHES);
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(limited));
        
        return limited;
      });
    } catch (error) {
      console.warn('Failed to save recent search:', error);
    }
  }, [enableHistory]);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
    } catch (error) {
      console.warn('Failed to clear recent searches:', error);
    }
  }, []);

  // Handle search
  const handleSearch = useCallback((searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    setQuery(trimmedQuery);
    saveRecentSearch(trimmedQuery);
    onSearch?.(trimmedQuery);
  }, [onSearch, saveRecentSearch]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    saveRecentSearch(suggestion.text);
    onSuggestionSelect?.(suggestion);
    onSearch?.(suggestion.text);
  }, [onSearch, onSuggestionSelect, saveRecentSearch]);

  return {
    query,
    setQuery,
    recentSearches,
    clearRecentSearches,
    handleSearch,
    handleSuggestionSelect
  };
};