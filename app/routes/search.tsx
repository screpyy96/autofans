import { Link, useLoaderData, useNavigate } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { useState, useEffect, useMemo } from 'react';
import { SearchHeader } from '~/components/search';
import { FilterPanel } from '~/components/search/FilterPanel';
import { CarGrid } from '~/components/car/CarGrid';
import { Badge } from '~/components/ui/Badge';
import { Button } from '~/components/ui/Button';
import { useFilters } from '~/hooks/useFilters';
import { useSortAndView } from '~/hooks/useSortAndView';
import { useFavorites, useComparison, useAppInitialization } from '~/stores/useAppStore';
import { RouteErrorBoundary } from '~/components/error';
import type { Car, FilterState } from '~/types';
import { mapListingToCar } from '~/utils/listingMapper';
import { signListingImages } from '~/utils/listingImages';
import { getSupabaseServerClient } from '~/lib/supabase.server';
import { searchService } from '~/services/searchService';
import { parseNaturalSearch } from '~/utils/naturalSearch';
import { MapResults } from '~/components/search/MapResults';
import { Map } from 'lucide-react';

export function meta({}: any) {
  const title = "Căutare Mașini Auto Second-Hand și Noi | AutoFans";
  const description = "Caută și găsește mașina perfectă din mii de anunțuri verificate pe AutoFans.ro. Filtrează după preț, an, marcă, model și locație.";
  const image = "https://autofans.ro/hero_background.jpg";

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "AutoFans.ro" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image }
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { supabase, headers } = getSupabaseServerClient(request);

    // Fetch all published listings from Supabase
    const { data: listings } = await supabase
      .from('listings')
      .select('id, slug, owner_id, title, description, price, currency, make, model, year, mileage, fuel_type, transmission, body_type, vin, vin_verified, history_checked, images, created_at, city, county')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    const signedMap = await signListingImages(supabase, listings || []);

    return { dbListings: listings || [], signedMap };
  } catch (e) {
    console.error('search loader error:', e);
    return { dbListings: [], signedMap: {} };
  }
}

function SearchContent() {
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [displayedCars, setDisplayedCars] = useState<Car[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const { favorites, addToFavorites, removeFromFavorites, isFavorited } = useFavorites();
  const { comparisonCars, addToComparison, removeFromComparison, isInComparison } = useComparison();
  const { isLoading: isInitLoading } = useAppInitialization();

  const { filters, updateFilters, resetFilters, hasActiveFilters, activeFilterCount } = useFilters();
  const { activeSort, viewMode, setActiveSort, setViewMode } = useSortAndView();
  const naturalSearch = useMemo(() => parseNaturalSearch(filters.query || ''), [filters.query]);

  const dbCars: Car[] = (data?.dbListings || []).map((listing: any) => mapListingToCar(listing, data.signedMap));

  const allCars = dbCars;

  const fetchCars = async (currentPage: number, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsSearching(true);
    }
    try {
      const result = await searchService.searchCars(
        naturalSearch.remainingQuery,
        { ...filters, ...naturalSearch.filters, sortBy: activeSort as any },
        currentPage,
        12,
        allCars
      );
      setDisplayedCars(prev => append ? [...prev, ...result.cars] : result.cars);
      setTotalCount(result.total);
      setHasMore(result.hasMore);
    } catch (e) {
      console.error('Error searching cars:', e);
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  };

  // Trigger search when filters or activeSort changes
  useEffect(() => {
    setPage(1);
    fetchCars(1, false);
  }, [filters, activeSort]);

  // Get search query from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
      updateFilters({ query });
    }
  }, []);

  const handleSearch = (query: string) => {
    updateFilters({ query });
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
    const car = allCars.find((item) => item.id === carId);
    navigate(`/car/${encodeURIComponent(car?.slug || carId)}`);
  };

  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCars(nextPage, true);
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

        {naturalSearch.summary.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-gray-300">
            <span>Am înțeles:</span>
            {naturalSearch.summary.map((item) => <Badge key={item} variant="secondary" className="border-accent-gold/30 bg-accent-gold/10 text-accent-gold">{item}</Badge>)}
          </div>
        )}

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
                isCollapsed={false}
              />
            </div>
          )}

          {/* Results */}
          <div className="flex-1 min-w-0">
              <div className="mb-6 flex items-center justify-between">
              <div className="text-base text-white font-medium">
                {totalCount} mașini găsite
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
              <Button variant="outline" size="sm" onClick={() => setShowMap((open) => !open)} className="ml-3 border-white/20 text-white">
                <Map className="mr-1.5 h-4 w-4" />{showMap ? 'Ascunde harta' : 'Vezi harta'}
              </Button>
            </div>

            {showMap && <MapResults cars={displayedCars} onCarClick={(car) => handleView(car.id)} />}

            {isSearching || isInitLoading ? (
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
                hasMore={hasMore}
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
