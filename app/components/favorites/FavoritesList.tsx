import React, { useState } from 'react';
import type { Car } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CarCard } from '../car/CarCard';
import { Select } from '../ui/Select';

interface FavoritesListProps {
  favorites: Car[];
  onRemoveFavorite: (carId: string) => void;
  onContactSeller: (carId: string) => void;
  onCompare: (carId: string) => void;
  onViewCar: (carId: string) => void;
  className?: string;
}

type SortOption = 'date_added' | 'price_asc' | 'price_desc' | 'year_desc' | 'mileage_asc';
type ViewMode = 'grid' | 'list';

export const FavoritesList: React.FC<FavoritesListProps> = ({
  favorites,
  onRemoveFavorite,
  onContactSeller,
  onCompare,
  onViewCar,
  className = ''
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('date_added');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCars, setSelectedCars] = useState<string[]>([]);

  const sortOptions = [
    { value: 'date_added', label: 'Data adăugării' },
    { value: 'price_asc', label: 'Preț crescător' },
    { value: 'price_desc', label: 'Preț descrescător' },
    { value: 'year_desc', label: 'An descrescător' },
    { value: 'mileage_asc', label: 'Kilometraj crescător' }
  ];

  const sortedFavorites = [...favorites].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      case 'year_desc':
        return b.year - a.year;
      case 'mileage_asc':
        return a.mileage - b.mileage;
      case 'date_added':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const handleSelectCar = (carId: string) => {
    setSelectedCars(prev => 
      prev.includes(carId) 
        ? prev.filter(id => id !== carId)
        : [...prev, carId]
    );
  };

  const handleCompareSelected = () => {
    selectedCars.forEach(carId => onCompare(carId));
    setSelectedCars([]);
  };

  const handleRemoveSelected = () => {
    selectedCars.forEach(carId => onRemoveFavorite(carId));
    setSelectedCars([]);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Mașinile Mele Favorite
          </h2>
          <p className="text-gray-600">
            {favorites.length} {favorites.length === 1 ? 'mașină salvată' : 'mașini salvate'}
          </p>
        </div>
        
        {favorites.length > 0 && (
          <div className="flex items-center space-x-4">
            <Select
              value={sortBy}
              onChange={(value) => setSortBy(value as unknown as SortOption)}
              options={sortOptions}
              className="w-48"
            />
            
            <div className="flex rounded-lg border border-gray-300">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm font-medium rounded-l-lg ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium rounded-r-lg ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedCars.length > 0 && (
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedCars.length} mașini selectate
            </span>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCompareSelected}
                disabled={selectedCars.length < 2}
              >
                Compară ({selectedCars.length})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRemoveSelected}
                className="text-red-600 hover:text-red-700"
              >
                Elimină din favorite
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedCars([])}
              >
                Anulează
              </Button>
            </div>
          </div>
        </Card>
      )}

      {favorites.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Nicio mașină în favorite
          </h3>
          <p className="text-gray-600 mb-6">
            Salvează mașinile care îți plac pentru a le accesa rapid mai târziu
          </p>
          <Button onClick={() => window.location.href = '/search'}>
            Explorează mașinile
          </Button>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {sortedFavorites.map((car) => (
            <div key={car.id} className="relative">
              {viewMode === 'grid' && (
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedCars.includes(car.id)}
                    onChange={() => handleSelectCar(car.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              )}
              <CarCard
                car={car}
                onFavorite={() => onRemoveFavorite(car.id)}
                onCompare={() => onCompare(car.id)}
                onContact={() => onContactSeller(car.id)}
                onClick={() => onViewCar(car.id)}
                variant={viewMode}
                isFavorite={true}
                showCheckbox={viewMode === 'list'}
                isSelected={selectedCars.includes(car.id)}
                onSelect={() => handleSelectCar(car.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};