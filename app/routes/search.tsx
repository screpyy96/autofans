import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import type { Route } from "./+types/search";
import { SearchBar } from '~/components/search/SearchBar';
import { FilterPanel } from '~/components/search/FilterPanel';
import { SortControls } from '~/components/search/SortControls';
import { CarGrid } from '~/components/car/CarGrid';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Badge } from '~/components/ui/Badge';
import { RouteErrorBoundary } from '~/components/error';
import { Filter, X } from 'lucide-react';
import { mockCars } from '~/data/mockData';
import { useFilters } from '~/hooks/useFilters';
import { useSortAndView } from '~/hooks/useSortAndView';
import { useFavorites, useComparison, useAppInitialization } from '~/stores/useAppStore';
import type { FilterState } from '~/types';
import { cn } from '~/lib/utils';

export function meta({}: Route.MetaArgs) {
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
        {/* Search Header */}
        <div className="mb-8 sm:mb-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              Caută mașini
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
              Găsește mașina perfectă din peste 15,000 de anunțuri verificate
            </p>
          </div>

          <Card
            variant="elevated"
            padding="lg"
            className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-lg border border-white/20 text-white shadow-2xl"
          >
            <div className="space-y-6">
              {/* Search Bar Section */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:gap-8">
                <div className="w-full lg:flex-1">
                  <SearchBar
                    onSearch={handleSearch}
                    placeholder="Caută după marcă, model, oraș..."
                    className="w-full"
                  />
                </div>

                {/* Results Info */}
                <div className="flex w-full flex-col gap-3 text-sm text-white/80 sm:text-base lg:items-end lg:text-right">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 font-semibold text-white/90 backdrop-blur-sm">
                      <div className="w-2 h-2 bg-accent-gold rounded-full"></div>
                      {displayedCars.length} rezultate
                    </span>
                    {comparisonCars.length > 0 && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-accent-gold/30 bg-accent-gold/15 px-4 py-2 font-semibold text-accent-gold backdrop-blur-sm">
                        <div className="w-2 h-2 bg-accent-gold rounded-full animate-pulse"></div>
                        {comparisonCars.length} în comparație
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 sm:text-sm">
                    <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                    Actualizat automat după aplicarea filtrelor
                  </p>
                </div>
              </div>

              {/* Controls Section */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-white/10">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant={showFilters ? "primary" : "outline"}
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border-2 transition-all duration-200",
                      showFilters
                        ? "bg-gold-gradient text-secondary-900 shadow-lg shadow-accent-gold/25 border-accent-gold"
                        : "bg-white/10 text-white hover:bg-white/20 border-white/20 hover:border-white/40"
                    )}
                  >
                    <Filter className="h-4 w-4" />
                    Filtre
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" size="sm" className="bg-red-500/20 text-red-300 border-red-500/30">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>

                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition-all duration-200 hover:bg-red-500/20 hover:border-red-500/30"
                    >
                      <X className="h-4 w-4" />
                      Șterge filtrele
                    </button>
                  )}
                </div>

                <div className="sm:ml-auto">
                  <SortControls
                    activeSort={activeSort}
                    onSortChange={setActiveSort}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    resultsPerPage={12}
                    onResultsPerPageChange={() => {}}
                    totalResults={displayedCars.length}
                    showResultsInfo={false}
                    compact={false}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

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
                  <p className="text-gray-400 text-sm mt-2">Te rugăm să aștepți</p>
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
