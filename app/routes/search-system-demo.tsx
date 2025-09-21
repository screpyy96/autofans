import { useState, useEffect } from 'react';
import type { MetaFunction } from 'react-router';
import { SearchBar } from '~/components/search/SearchBar';
import { FilterPanel } from '~/components/search/FilterPanel';
import { SortControls } from '~/components/search/SortControls';
import type { SearchSuggestion } from '~/components/search/SearchBar';
import { useSearch } from '~/hooks/useSearch';
import { useFilters } from '~/hooks/useFilters';
import { useSortAndView } from '~/hooks/useSortAndView';
import { searchService } from '~/services/searchService';
import type { Car } from '~/types';
import { formatPrice, formatMileage, getFuelTypeLabel, getTransmissionLabel } from '~/utils/helpers';

// Import CSS for range slider
import '~/styles/range-slider.css';

export const meta: MetaFunction = () => {
  return [
    { title: "Search System Demo - Platforma Mașini Second-Hand" },
    { name: "description", content: "Demo complet pentru sistemul de căutare și filtrare" },
  ];
};

interface SearchResults {
  cars: Car[];
  total: number;
  hasMore: boolean;
}

export default function SearchSystemDemo() {
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Search hook
  const { 
    query, 
    setQuery, 
    recentSearches, 
    clearRecentSearches,
    handleSearch,
    handleSuggestionSelect 
  } = useSearch({
    onSearch: performSearch
  });

  // Filters hook
  const {
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
    savedSearches,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch
  } = useFilters({
    onFiltersChange: () => {
      setCurrentPage(1); // Reset to first page when filters change
      performSearch(query);
    }
  });

  // Sort and view hook
  const {
    activeSort,
    viewMode,
    resultsPerPage,
    handleSortChange,
    handleViewModeChange,
    handleResultsPerPageChange
  } = useSortAndView({
    onSortChange: () => {
      setCurrentPage(1); // Reset to first page when sort changes
      performSearch(query);
    },
    onResultsPerPageChange: () => {
      setCurrentPage(1); // Reset to first page when page size changes
      performSearch(query);
    }
  });

  // Perform search function
  async function performSearch(searchQuery: string = query) {
    setIsLoading(true);
    try {
      // Add sort to filters
      const searchFilters = {
        ...filters,
        sortBy: { 
          value: activeSort, 
          label: '', 
          field: 'createdAt' as keyof Car 
        },
        sortOrder: activeSort.includes('_asc') ? 'asc' as const : 'desc' as const
      };

      const results = await searchService.searchCars(
        searchQuery, 
        searchFilters, 
        currentPage, 
        resultsPerPage
      );
      
      setSearchResults({
        cars: results.cars,
        total: results.total,
        hasMore: results.hasMore
      });
      
      searchService.saveSearchQuery(searchQuery, results.total);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults({ cars: [], total: 0, hasMore: false });
    } finally {
      setIsLoading(false);
    }
  }

  // Load initial results
  useEffect(() => {
    performSearch('');
  }, []);

  // Handle suggestion selection
  const handleSuggestionSelectWithSearch = (suggestion: SearchSuggestion) => {
    handleSuggestionSelect(suggestion);
    performSearch(suggestion.text);
  };

  // Handle save search
  const handleSaveSearch = (name: string, searchFilters: typeof filters) => {
    saveSearch(name, { ...searchFilters, query });
  };

  // Handle load saved search
  const handleLoadSavedSearch = (search: typeof savedSearches[0]) => {
    loadSavedSearch(search);
    if (search.filters.query) {
      setQuery(search.filters.query);
      performSearch(search.filters.query);
    } else {
      performSearch('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Sistem Complet de Căutare și Filtrare
          </h1>

          {/* Search Bar */}
          <div className="mb-6">
            <SearchBar
              value={query}
              onSearch={handleSearch}
              onSuggestionSelect={handleSuggestionSelectWithSearch}
              placeholder="Caută BMW, Audi, diesel, automatic..."
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <FilterPanel
                filters={filters}
                onFiltersChange={updateFilters}
                onReset={resetFilters}
                onSaveSearch={handleSaveSearch}
                isCollapsed={isFiltersCollapsed}
                onToggleCollapse={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
              />

              {/* Saved Searches */}
              {savedSearches.length > 0 && (
                <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Căutări Salvate
                  </h3>
                  <div className="space-y-2">
                    {savedSearches.map((search) => (
                      <div key={search.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <button
                          onClick={() => handleLoadSavedSearch(search)}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex-1 text-left"
                        >
                          {search.name}
                        </button>
                        <button
                          onClick={() => deleteSavedSearch(search.id)}
                          className="text-xs text-red-600 hover:text-red-700 ml-2"
                        >
                          Șterge
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Căutări Recente
                    </h3>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Șterge toate
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setQuery(search);
                          performSearch(search);
                        }}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Results Area */}
            <div className="lg:col-span-3">
              {/* Sort Controls */}
              <div className="mb-6">
                <SortControls
                  activeSort={activeSort}
                  onSortChange={handleSortChange}
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  resultsPerPage={resultsPerPage}
                  onResultsPerPageChange={handleResultsPerPageChange}
                  totalResults={searchResults?.total}
                  currentPage={currentPage}
                />
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="bg-white rounded-lg shadow-sm p-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <span className="ml-3 text-gray-600">Se caută...</span>
                  </div>
                </div>
              )}

              {/* Search Results */}
              {searchResults && !isLoading && (
                <div className="bg-white rounded-lg shadow-sm">
                  {searchResults.cars.length > 0 ? (
                    <div className="p-6">
                      <div className={
                        viewMode === 'grid' 
                          ? "grid gap-6 md:grid-cols-2 xl:grid-cols-3" 
                          : "space-y-4"
                      }>
                        {searchResults.cars.map((car) => (
                          <div 
                            key={car.id} 
                            className={
                              viewMode === 'grid'
                                ? "border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                : "border border-gray-200 rounded-lg p-4 flex space-x-4 hover:shadow-md transition-shadow"
                            }
                          >
                            {/* Car Image */}
                            <div className={viewMode === 'grid' ? "mb-4" : "flex-shrink-0"}>
                              <div className={
                                viewMode === 'grid' 
                                  ? "w-full h-48 bg-gray-200 rounded-lg" 
                                  : "w-32 h-24 bg-gray-200 rounded-lg"
                              }>
                                {car.images[0] && (
                                  <img
                                    src={car.images[0].thumbnailUrl}
                                    alt={car.title}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                )}
                              </div>
                            </div>

                            {/* Car Info */}
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                {car.title}
                              </h3>
                              
                              <div className="text-lg font-bold text-primary-600 mb-2">
                                {formatPrice(car.price, car.currency)}
                                {car.negotiable && (
                                  <span className="text-sm text-gray-500 ml-1">(negociabil)</span>
                                )}
                              </div>

                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex flex-wrap gap-4">
                                  <span><strong>An:</strong> {car.year}</span>
                                  <span><strong>Km:</strong> {formatMileage(car.mileage)}</span>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                  <span><strong>Combustibil:</strong> {getFuelTypeLabel(car.fuelType)}</span>
                                  <span><strong>Transmisie:</strong> {getTransmissionLabel(car.transmission)}</span>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                  <span><strong>Putere:</strong> {car.specifications.power} CP</span>
                                  <span><strong>Locație:</strong> {car.location.city}</span>
                                </div>
                              </div>

                              {/* Tags */}
                              {car.tags && car.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                  {car.tags.slice(0, 3).map((tag, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">🔍</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nu au fost găsite rezultate
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {query ? (
                          <>Nu au fost găsite mașini pentru "<strong>{query}</strong>"</>
                        ) : (
                          <>Nu au fost găsite mașini care să corespundă filtrelor selectate</>
                        )}
                      </p>
                      <div className="space-x-3">
                        {hasActiveFilters && (
                          <button
                            onClick={resetFilters}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            Resetează filtrele
                          </button>
                        )}
                        {query && (
                          <button
                            onClick={() => {
                              setQuery('');
                              performSearch('');
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            Șterge căutarea
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Demo Info */}
          <div className="bg-blue-50 rounded-lg p-6 mt-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              Funcționalități Demo - Sistem Complet de Căutare
            </h2>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-blue-800">
              <div>
                <h3 className="font-semibold mb-2">SearchBar:</h3>
                <ul className="space-y-1">
                  <li>• Autocomplete cu sugestii inteligente</li>
                  <li>• Căutări recente salvate local</li>
                  <li>• Navigare cu tastatura</li>
                  <li>• Debounce pentru performanță</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">FilterPanel:</h3>
                <ul className="space-y-1">
                  <li>• Filtre colapsabile cu animații</li>
                  <li>• Range sliders pentru preț/an/km</li>
                  <li>• Multi-select pentru opțiuni</li>
                  <li>• Salvare căutări personalizate</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">SortControls:</h3>
                <ul className="space-y-1">
                  <li>• Sortare multiplă cu opțiuni</li>
                  <li>• Toggle Grid/List view</li>
                  <li>• Selector rezultate per pagină</li>
                  <li>• Responsive design</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Integrare:</h3>
                <ul className="space-y-1">
                  <li>• State management centralizat</li>
                  <li>• Persistență în localStorage</li>
                  <li>• Loading states și error handling</li>
                  <li>• Animații și tranziții smooth</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}