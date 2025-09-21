import { useState } from 'react';
import { motion } from 'framer-motion';
import { Grid, List, Eye } from 'lucide-react';
import { CarCard, CarGrid, CarDetails } from '~/components/car';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { mockCars } from '~/data/mockData';
import type { Car } from '~/types';

export default function CarListingDemo() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [favoritedCars, setFavoritedCars] = useState<string[]>([]);
  const [comparisonCars, setComparisonCars] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [displayedCars, setDisplayedCars] = useState(mockCars.slice(0, 6));

  const handleFavorite = (carId: string) => {
    setFavoritedCars(prev => 
      prev.includes(carId) 
        ? prev.filter(id => id !== carId)
        : [...prev, carId]
    );
  };

  const handleCompare = (carId: string) => {
    setComparisonCars(prev => {
      if (prev.includes(carId)) {
        return prev.filter(id => id !== carId);
      }
      if (prev.length >= 3) {
        // Replace the first car if we already have 3
        return [prev[1], prev[2], carId];
      }
      return [...prev, carId];
    });
  };

  const handleContact = (carId: string) => {
    alert(`Contactare vânzător pentru mașina ${carId}`);
  };

  const handleView = (carId: string) => {
    const car = mockCars.find(c => c.id === carId);
    if (car) {
      setSelectedCar(car);
    }
  };

  const handleLoadMore = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setDisplayedCars(prev => [...prev, ...mockCars.slice(prev.length, prev.length + 3)]);
      setLoading(false);
    }, 1000);
  };

  const handleContactSeller = () => {
    alert('Deschidere modal contact vânzător');
  };

  const handleScheduleViewing = () => {
    alert('Deschidere modal programare vizionare');
  };

  const handleAddToCompare = () => {
    if (selectedCar) {
      handleCompare(selectedCar.id);
    }
  };

  const handleAddToFavorites = () => {
    if (selectedCar) {
      handleFavorite(selectedCar.id);
    }
  };

  const handleShare = () => {
    alert('Deschidere modal partajare');
  };

  if (selectedCar) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setSelectedCar(null)}
              className="mb-4"
            >
              ← Înapoi la listă
            </Button>
          </div>

          <CarDetails
            car={selectedCar}
            onContactSeller={handleContactSeller}
            onScheduleViewing={handleScheduleViewing}
            onAddToCompare={handleAddToCompare}
            onAddToFavorites={handleAddToFavorites}
            onShare={handleShare}
            similarCars={mockCars.filter(c => c.id !== selectedCar.id).slice(0, 4)}
            onSimilarCarClick={handleView}
            isFavorited={favoritedCars.includes(selectedCar.id)}
            isInComparison={comparisonCars.includes(selectedCar.id)}
          />
        </div>
    );
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Demo Componente Listare Mașini
            </h1>
            <p className="text-gray-600">
              Demonstrație pentru componentele CarCard, CarGrid și CarDetails
            </p>
          </motion.div>
        </div>

        {/* Controls */}
        <Card variant="elevated" padding="md" className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">
                Mod vizualizare:
              </span>
              <div className="flex rounded-lg border border-gray-300 p-1">
                <button
                  className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                  Grid
                </button>
                <button
                  className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                  Listă
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span>Favorite:</span>
                <span className="font-medium">{favoritedCars.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Comparație:</span>
                <span className="font-medium">{comparisonCars.length}/3</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Individual CarCard Demo */}
        <Card variant="elevated" padding="lg" className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Demo CarCard Individual
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Grid View</h3>
              <div className="">
                <CarCard
                  car={mockCars[0]}
                  onFavorite={handleFavorite}
                  onCompare={handleCompare}
                  onContact={handleContact}
                  onView={handleView}
                  variant="grid"
                  isFavorited={favoritedCars.includes(mockCars[0].id)}
                  isInComparison={comparisonCars.includes(mockCars[0].id)}
                />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">List View</h3>
              <CarCard
                car={mockCars[1]}
                onFavorite={handleFavorite}
                onCompare={handleCompare}
                onContact={handleContact}
                onView={handleView}
                variant="list"
                isFavorited={favoritedCars.includes(mockCars[1].id)}
                isInComparison={comparisonCars.includes(mockCars[1].id)}
              />
            </div>
          </div>
        </Card>

        {/* CarGrid Demo */}
        <Card variant="elevated" padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Demo CarGrid cu Infinite Scroll
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Eye className="h-4 w-4" />
              <span>{displayedCars.length} din {mockCars.length} mașini</span>
            </div>
          </div>

          <CarGrid
            cars={displayedCars}
            loading={loading}
            onLoadMore={handleLoadMore}
            hasMore={displayedCars.length < mockCars.length}
            onFavorite={handleFavorite}
            onCompare={handleCompare}
            onContact={handleContact}
            onView={handleView}
            viewMode={viewMode}
            favoritedCars={favoritedCars}
            comparisonCars={comparisonCars}
            emptyStateTitle="Nu există mașini disponibile"
            emptyStateDescription="Încearcă să modifici filtrele de căutare."
            emptyStateAction={{
              label: "Resetează filtrele",
              onClick: () => alert("Resetare filtre")
            }}
          />
        </Card>
      </div>
  );
}