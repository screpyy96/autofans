import { useState } from 'react';
import type { MetaFunction } from 'react-router';
import { SearchBar } from '~/components/search/SearchBar';
import type { SearchSuggestion } from '~/components/search/SearchBar';
import { useSearch } from '~/hooks/useSearch';
import { searchService } from '~/services/searchService';

export const meta: MetaFunction = () => {
  return [
    { title: "Search Demo - Platforma Mașini Second-Hand" },
    { name: "description", content: "Demo pentru componenta SearchBar" },
  ];
};

export default function SearchDemo() {
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { 
    query, 
    setQuery, 
    recentSearches, 
    clearRecentSearches,
    handleSearch,
    handleSuggestionSelect 
  } = useSearch({
    onSearch: async (searchQuery) => {
      setIsLoading(true);
      try {
        const results = await searchService.searchCars(searchQuery);
        setSearchResults(results);
        searchService.saveSearchQuery(searchQuery, results.total);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    },
    onSuggestionSelect: (suggestion) => {
      console.log('Suggestion selected:', suggestion);
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            SearchBar Component Demo
          </h1>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Căutare Mașini
            </h2>
            <SearchBar
              value={query}
              onSearch={handleSearch}
              onSuggestionSelect={handleSuggestionSelect}
              placeholder="Caută BMW, Audi, diesel, automatic..."
              autoFocus
            />
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Căutări Recente
                </h2>
                <button
                  onClick={clearRecentSearches}
                  className="text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  Șterge toate
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-gray-600">Se caută...</span>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults && !isLoading && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Rezultate Căutare
              </h2>
              
              <div className="mb-4 text-sm text-gray-600">
                {searchResults.total > 0 ? (
                  <>
                    Găsite <strong>{searchResults.total}</strong> rezultate
                    {query && <> pentru "<strong>{query}</strong>"</>}
                  </>
                ) : (
                  <>
                    Nu au fost găsite rezultate
                    {query && <> pentru "<strong>{query}</strong>"</>}
                  </>
                )}
              </div>

              {searchResults.cars.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {searchResults.cars.map((car: any) => (
                    <div key={car.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {car.title}
                      </h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Preț:</strong> {car.price.toLocaleString()} {car.currency}</p>
                        <p><strong>An:</strong> {car.year}</p>
                        <p><strong>Kilometraj:</strong> {car.mileage.toLocaleString()} km</p>
                        <p><strong>Combustibil:</strong> {car.fuelType}</p>
                        <p><strong>Transmisie:</strong> {car.transmission}</p>
                        <p><strong>Locație:</strong> {car.location.city}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">🔍</div>
                  <p className="text-gray-600">
                    Nu au fost găsite mașini care să corespundă criteriilor de căutare.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Încearcă să modifici termenii de căutare sau să folosești filtre mai puțin restrictive.
                  </p>
                </div>
              )}

              {/* Suggestions */}
              {searchResults.suggestions.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Sugestii de căutare
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {searchResults.suggestions.slice(0, 8).map((suggestion: SearchSuggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSuggestionSelect(suggestion)}
                        className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors"
                      >
                        {suggestion.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Demo Info */}
          <div className="bg-blue-50 rounded-lg p-6 mt-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              Funcționalități Demo
            </h2>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• <strong>Autocomplete:</strong> Tastează cel puțin 2 caractere pentru sugestii</li>
              <li>• <strong>Navigare cu tastatura:</strong> Folosește săgețile sus/jos și Enter</li>
              <li>• <strong>Căutări recente:</strong> Se salvează automat în localStorage</li>
              <li>• <strong>Sugestii populare:</strong> Afișate când câmpul este gol</li>
              <li>• <strong>Debounce:</strong> Căutarea se face cu întârziere de 300ms</li>
              <li>• <strong>Loading states:</strong> Indicator de încărcare pentru UX mai bun</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}