import { useState, useEffect } from 'react';
import type { Car } from '~/types';

interface UseFavoritesReturn {
  favorites: Car[];
  favoriteIds: string[];
  isLoading: boolean;
  error: string | null;
  addToFavorites: (carId: string) => Promise<void>;
  removeFromFavorites: (carId: string) => Promise<void>;
  isFavorite: (carId: string) => boolean;
  toggleFavorite: (carId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

export const useFavorites = (userId?: string): UseFavoritesReturn => {
  const [favorites, setFavorites] = useState<Car[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      setFavoriteIds([]);
      setFavorites([]);
    } catch (err) {
      setError('Eroare la încărcarea favoritelor');
    } finally {
      setIsLoading(false);
    }
  };

  const addToFavorites = async (carId: string) => {
    setError(null);
    
    try {
      setFavoriteIds(prev => [...prev, carId]);
      
      // In a real app, you would also fetch the car data and add it to favorites array
      // For now, we'll just update the IDs
    } catch (err) {
      setError('Eroare la adăugarea în favorite');
      throw err;
    }
  };

  const removeFromFavorites = async (carId: string) => {
    setError(null);
    
    try {
      setFavoriteIds(prev => prev.filter(id => id !== carId));
      setFavorites(prev => prev.filter(car => car.id !== carId));
    } catch (err) {
      setError('Eroare la eliminarea din favorite');
      throw err;
    }
  };

  const isFavorite = (carId: string): boolean => {
    return favoriteIds.includes(carId);
  };

  const toggleFavorite = async (carId: string) => {
    if (isFavorite(carId)) {
      await removeFromFavorites(carId);
    } else {
      await addToFavorites(carId);
    }
  };

  const refreshFavorites = async () => {
    await loadFavorites();
  };

  useEffect(() => {
    loadFavorites();
  }, [userId]);

  return {
    favorites,
    favoriteIds,
    isLoading,
    error,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
    refreshFavorites
  };
};
