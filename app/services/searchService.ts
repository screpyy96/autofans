import type { SearchSuggestion } from '~/components/search/SearchBar';
import type { Car, FilterState } from '~/types';
import { SEARCH_CONFIG, POPULAR_BRANDS } from '~/constants';
import { mockCars } from '~/data/mockData';

// Search suggestion types
export interface SearchSuggestionOptions {
  query: string;
  maxResults?: number;
  includeRecent?: boolean;
  includePopular?: boolean;
}

export interface SearchResult {
  cars: Car[];
  total: number;
  suggestions: SearchSuggestion[];
  hasMore: boolean;
}

// Popular models by brand (mock data)
const POPULAR_MODELS: Record<string, string[]> = {
  'BMW': ['Seria 1', 'Seria 3', 'Seria 5', 'X1', 'X3', 'X5'],
  'Audi': ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'E-Class', 'GLA', 'GLC', 'GLE'],
  'Volkswagen': ['Golf', 'Passat', 'Tiguan', 'Polo', 'Jetta', 'Touareg'],
  'Skoda': ['Octavia', 'Superb', 'Fabia', 'Kodiaq', 'Karoq', 'Scala'],
  'Ford': ['Focus', 'Fiesta', 'Mondeo', 'Kuga', 'EcoSport', 'Edge'],
  'Opel': ['Astra', 'Corsa', 'Insignia', 'Crossland', 'Grandland', 'Mokka'],
  'Renault': ['Clio', 'Megane', 'Captur', 'Kadjar', 'Koleos', 'Talisman'],
  'Peugeot': ['208', '308', '508', '2008', '3008', '5008'],
  'Toyota': ['Corolla', 'Camry', 'RAV4', 'C-HR', 'Prius', 'Highlander']
};

// Popular search queries (mock data)
const POPULAR_QUERIES = [
  'BMW Seria 3 diesel',
  'Audi A4 automatic',
  'VW Golf 2020',
  'Mercedes C-Class',
  'Skoda Octavia',
  'mașini sub 20000 euro',
  'SUV diesel',
  'mașini economice',
  'automatic transmission',
  'hybrid cars'
];

class SearchService {
  // Generate search suggestions based on query
  async getSuggestions(options: SearchSuggestionOptions): Promise<SearchSuggestion[]> {
    const { query, maxResults = SEARCH_CONFIG.MAX_SUGGESTIONS } = options;
    
    if (!query || query.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      return this.getDefaultSuggestions();
    }

    const suggestions: SearchSuggestion[] = [];
    const lowerQuery = query.toLowerCase().trim();

    // Brand suggestions
    POPULAR_BRANDS.forEach((brand, index) => {
      if (brand.toLowerCase().includes(lowerQuery) && suggestions.length < maxResults) {
        suggestions.push({
          id: `brand-${index}`,
          text: brand,
          type: 'brand',
          category: 'Mărci'
        });
      }
    });

    // Model suggestions
    Object.entries(POPULAR_MODELS).forEach(([brand, models]) => {
      if (suggestions.length >= maxResults) return;
      
      models.forEach((model, index) => {
        if (model.toLowerCase().includes(lowerQuery) && suggestions.length < maxResults) {
          suggestions.push({
            id: `model-${brand}-${index}`,
            text: `${brand} ${model}`,
            type: 'model',
            category: 'Modele'
          });
        }
      });
    });

    // Query suggestions based on popular searches
    POPULAR_QUERIES.forEach((popularQuery, index) => {
      if (popularQuery.toLowerCase().includes(lowerQuery) && 
          popularQuery.toLowerCase() !== lowerQuery &&
          suggestions.length < maxResults) {
        suggestions.push({
          id: `query-${index}`,
          text: popularQuery,
          type: 'query'
        });
      }
    });

    // Generate dynamic query suggestions
    if (suggestions.length < maxResults) {
      const dynamicSuggestions = this.generateDynamicSuggestions(query);
      suggestions.push(...dynamicSuggestions.slice(0, maxResults - suggestions.length));
    }

    return suggestions;
  }

  // Get default suggestions (recent + popular)
  private getDefaultSuggestions(): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];

    // Recent searches from localStorage
    try {
      const stored = localStorage.getItem('AutoFans_recent_searches');
      if (stored) {
        const recent = JSON.parse(stored) as string[];
        recent.slice(0, SEARCH_CONFIG.MAX_RECENT_SEARCHES).forEach((text, index) => {
          suggestions.push({
            id: `recent-${index}`,
            text,
            type: 'recent'
          });
        });
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
    }

    // Popular searches
    POPULAR_QUERIES.slice(0, 5).forEach((text, index) => {
      suggestions.push({
        id: `popular-${index}`,
        text,
        type: 'popular'
      });
    });

    return suggestions;
  }

  // Generate dynamic query suggestions
  private generateDynamicSuggestions(query: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const baseQuery = query.trim();

    // Add common modifiers
    const modifiers = [
      'diesel',
      'benzină',
      'automatic',
      'manual',
      '2020',
      '2019',
      'sub 30000',
      'recent',
      'impecabil'
    ];

    modifiers.forEach((modifier, index) => {
      if (!baseQuery.toLowerCase().includes(modifier.toLowerCase())) {
        suggestions.push({
          id: `dynamic-${index}`,
          text: `${baseQuery} ${modifier}`,
          type: 'query'
        });
      }
    });

    return suggestions.slice(0, 3);
  }

  // Search cars based on query and filters
  async searchCars(query: string, filters: FilterState = {}, page = 1, pageSize = 12): Promise<SearchResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    let filteredCars = [...mockCars];

    // Apply text search
    if (query.trim()) {
      const searchTerms = query.toLowerCase().trim().split(/\s+/);
      filteredCars = filteredCars.filter(car => {
        const searchableText = [
          car.title,
          car.brand,
          car.model,
          car.description,
          ...car.tags || []
        ].join(' ').toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    // Apply filters
    if (filters.brand?.length) {
      filteredCars = filteredCars.filter(car => 
        filters.brand!.includes(car.brand)
      );
    }

    if (filters.model?.length) {
      filteredCars = filteredCars.filter(car => 
        filters.model!.includes(car.model)
      );
    }

    if (filters.priceRange) {
      filteredCars = filteredCars.filter(car => 
        car.price >= filters.priceRange!.min && 
        car.price <= filters.priceRange!.max
      );
    }

    if (filters.yearRange) {
      filteredCars = filteredCars.filter(car => 
        car.year >= filters.yearRange!.min && 
        car.year <= filters.yearRange!.max
      );
    }

    if (filters.mileageRange) {
      filteredCars = filteredCars.filter(car => 
        car.mileage >= filters.mileageRange!.min && 
        car.mileage <= filters.mileageRange!.max
      );
    }

    if (filters.fuelType?.length) {
      filteredCars = filteredCars.filter(car => 
        filters.fuelType!.includes(car.fuelType)
      );
    }

    if (filters.transmission?.length) {
      filteredCars = filteredCars.filter(car => 
        filters.transmission!.includes(car.transmission)
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      filteredCars.sort((a, b) => {
        const field = filters.sortBy!.field;
        const order = filters.sortOrder || 'desc';
        
        let aValue: any = a[field];
        let bValue: any = b[field];
        
        // Handle undefined values
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;
        
        // Handle date fields
        if (aValue instanceof Date) aValue = aValue.getTime();
        if (bValue instanceof Date) bValue = bValue.getTime();
        
        if (order === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    // Pagination
    const total = filteredCars.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedCars = filteredCars.slice(startIndex, endIndex);
    const hasMore = endIndex < total;

    // Generate suggestions for the current search
    const suggestions = await this.getSuggestions({ query });

    return {
      cars: paginatedCars,
      total,
      suggestions,
      hasMore
    };
  }

  // Get search analytics (mock implementation)
  async getSearchAnalytics() {
    return {
      popularSearches: POPULAR_QUERIES.slice(0, 10),
      trendingBrands: POPULAR_BRANDS.slice(0, 5),
      searchVolume: Math.floor(Math.random() * 10000) + 5000
    };
  }

  // Save search query for analytics
  saveSearchQuery(query: string, resultCount: number) {
    // In a real app, this would send data to analytics service
    console.log('Search query saved:', { query, resultCount, timestamp: new Date() });
  }
}

// Export singleton instance
export const searchService = new SearchService();
export default searchService;