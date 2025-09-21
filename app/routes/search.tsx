import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import { SearchHeader } from '~/components/search';
import { FilterPanel } from '~/components/search/FilterPanel';

import { CarGrid } from '~/components/car/CarGrid';
import { Badge } from '~/components/ui/Badge';
import { Button } from '~/components/ui/Button';
import { mockCars } from '~/data/mockData';
import { useFilters } from '~/hooks/useFilters';
import { useSortAndView } from '~/hooks/useSortAndView';
import { useFavorites, useComparison, useAppInitialization } from '~/stores/useAppStore';
import { RouteErrorBoundary } from '~/components/error';
import type { FilterState } from '~/types';

export function meta({}: any) {
  return [
    { title: "Căutare Mașini - AutoFans" },
    { name: "description", content: "Caută și găsește mașina perfectă din peste 15,000 de anunțuri verificate." },
  ];
}

function SearchContent() {
  const [showFilters, setShowFilters] = useState(false);
  const [displayedCars, setDisplayedCars] = useState(() => mockCars.slice(0, 12)); // Show first 12 cars initially
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { favorites, addToFavorites, removeFromFavorites, isFavorited } = useFavorites();
  const { comparisonCars, addToComparison, removeFromComparison, isInComparison } = useComparison();

  // Debug logging for comparison state
  useEffect(() => {
    console.log('🔍 Search page - comparisonCars:', comparisonCars);
  }, [comparisonCars]);

  // Debug logging for favorites state
  useEffect(() => {
    console.log('🔍 Search page - favorites:', favorites);
  }, [favorites]);
  const { isLoading } = useAppInitialization();

  const { filters, updateFilters, resetFilters, hasActiveFilters, activeFilterCount } = useFilters();
  const { activeSort, viewMode, setActiveSort, setViewMode } = useSortAndView();

  // Get search query from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
      updateFilters({ query });
      // Add to recent searches
      // This will be handled by the store automatically
    }
  }, []); // Remove updateFilters from dependencies to prevent infinite loop

  const handleSearch = (query: string) => {
    updateFilters({ query });
    // Add to recent searches
    // This will be handled by the store automatically
  };

  const handleFilterChange = (newFilters: FilterState) => {
    updateFilters(newFilters);
  };

  const handleFavorite = (carId: string) => {
    if (isFavorited(carId)) {
      removeFromFavorites(carId);
    } else {
      addToFavorites(carId);
    }
  };

  const handleCompare = (carId: string) => {
    if (isInComparison(carId)) {
      removeFromComparison(carId);
    } else {
      addToComparison(carId);
    }
  };

  const handleContact = (carId: string) => {
    alert(`Contactare vânzător pentru mașina ${carId}`);
  };

  const handleView = (carId: string) => {
    // Navigate to car details
    window.location.href = `/car/${carId}`;
  };

  const handleLoadMore = () => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);

    setTimeout(() => {
      setDisplayedCars(prev => {
        // Calculate how many more cars we need to show
        const currentLength = prev.length;
        const remainingSlots = Math.min(6, mockCars.length - currentLength); // Load 6 more cars

        if (remainingSlots <= 0) {
          setIsLoadingMore(false);
          return prev;
        }

        // Add the next batch of cars (avoiding duplicates)
        const newCars = mockCars.slice(currentLength, currentLength + remainingSlots);
        return [...prev, ...newCars];
      });
      setIsLoadingMore(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <SearchHeader
          onSearch={handleSearch}
          displayedCarsCount={displayedCars.length}
          comparisonCarsCount={comparisonCars.length}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          activeFilterCount={activeFilterCount}
          hasActiveFilters={hasActiveFilters}
          resetFilters={resetFilters}
          activeSort={activeSort}
          setActiveSort={setActiveSort}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-full flex-shrink-0 lg:w-80 lg:max-w-sm">
              <FilterPanel
                filters={filters}
                onFiltersChange={handleFilterChange}
                onReset={resetFilters}
                onClose={() => setShowFilters(false)}
                onApply={() => setShowFilters(false)}
              />
            </div>
          )}

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="mb-6 flex items-center justify-between">
              <div className="text-base text-white font-medium">
                {displayedCars.length} mașini găsite
              </div>

              {comparisonCars.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="primary" className="bg-accent-gold/20 text-accent-gold border-accent-gold/30">
                    {comparisonCars.length} mașini în comparație
                  </Badge>
                  <Link to={`/compare?cars=${comparisonCars.join(',')}`}>
                    <Button variant="outline" size="sm" className="border-accent-gold/30 text-accent-gold hover:bg-accent-gold/10">
                      Compară
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent-gold/20 border-t-accent-gold mx-auto"></div>
                    <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-accent-gold/40 animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
                  </div>
                  <p className="text-white text-lg font-medium">Căutăm mașini...</p>
                  <p className="text-gray-300 text-sm mt-2">Te rugăm să aștepți</p>
                </div>
              </div>
            ) : (
              <CarGrid
                cars={displayedCars}
                loading={isLoadingMore}
                onLoadMore={handleLoadMore}
                hasMore={displayedCars.length < mockCars.length && mockCars.length > 12}
                onFavorite={handleFavorite}
                onCompare={handleCompare}
                onContact={handleContact}
                onView={handleView}
                viewMode={viewMode}
                favoritedCars={favorites}
                comparisonCars={comparisonCars}
                emptyStateTitle="Nu am găsit mașini"
                emptyStateDescription="Încearcă să modifici filtrele de căutare pentru a găsi mai multe rezultate."
                emptyStateAction={{
                  label: "Resetează filtrele",
                  onClick: resetFilters
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Search() {
  return (
    <RouteErrorBoundary routeName="Căutare">
      <SearchContent />
    </RouteErrorBoundary>
  );
}
