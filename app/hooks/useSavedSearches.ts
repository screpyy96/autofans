import { useState, useEffect } from 'react';
import type { SavedSearch, FilterState } from '../types';

interface UseSavedSearchesReturn {
  savedSearches: SavedSearch[];
  isLoading: boolean;
  error: string | null;
  createSavedSearch: (name: string, filters: FilterState, alertsEnabled: boolean) => Promise<void>;
  updateSavedSearch: (searchId: string, updates: Partial<SavedSearch>) => Promise<void>;
  deleteSavedSearch: (searchId: string) => Promise<void>;
  refreshSavedSearches: () => Promise<void>;
}

export const useSavedSearches = (userId?: string): UseSavedSearchesReturn => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSavedSearches = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      setSavedSearches([]);
    } catch (err) {
      setError('Eroare la încărcarea căutărilor salvate');
    } finally {
      setIsLoading(false);
    }
  };

  const createSavedSearch = async (name: string, filters: FilterState, alertsEnabled: boolean) => {
    setError(null);
    
    try {
      const newSearch: SavedSearch = {
        id: `search-${Date.now()}`,
        name,
        filters,
        alertsEnabled,
        createdAt: new Date()
      };
      
      setSavedSearches(prev => [newSearch, ...prev]);
    } catch (err) {
      setError('Eroare la salvarea căutării');
      throw err;
    }
  };

  const updateSavedSearch = async (searchId: string, updates: Partial<SavedSearch>) => {
    setError(null);
    
    try {
      setSavedSearches(prev => 
        prev.map(search => 
          search.id === searchId 
            ? { ...search, ...updates }
            : search
        )
      );
    } catch (err) {
      setError('Eroare la actualizarea căutării');
      throw err;
    }
  };

  const deleteSavedSearch = async (searchId: string) => {
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setSavedSearches(prev => prev.filter(search => search.id !== searchId));
    } catch (err) {
      setError('Eroare la ștergerea căutării');
      throw err;
    }
  };

  const refreshSavedSearches = async () => {
    await loadSavedSearches();
  };

  useEffect(() => {
    loadSavedSearches();
  }, [userId]);

  return {
    savedSearches,
    isLoading,
    error,
    createSavedSearch,
    updateSavedSearch,
    deleteSavedSearch,
    refreshSavedSearches
  };
};
