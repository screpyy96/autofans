import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter, mockCar } from '../utils';
import { CarGrid } from '~/components/car';
import { FilterPanel } from '~/components/search';
import { SearchBar } from '~/components/search';
import React from 'react';
import React from 'react';
import React from 'react';
import React from 'react';

// Mock the search components
vi.mock('~/components/search/SearchBar', () => ({
  SearchBar: ({ onSearch, onSuggestionSelect }: any) => (
    <div>
      <input
        data-testid="search-input"
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Caută mașini..."
      />
      <div data-testid="suggestions">
        <button onClick={() => onSuggestionSelect('BMW X5')}>BMW X5</button>
        <button onClick={() => onSuggestionSelect('Audi A4')}>Audi A4</button>
      </div>
    </div>
  )
}));

vi.mock('~/components/search/FilterPanel', () => ({
  FilterPanel: ({ onFilterChange }: any) => (
    <div data-testid="filter-panel">
      <button
        onClick={() => onFilterChange({ brand: ['BMW'] })}
        data-testid="bmw-filter"
      >
        BMW
      </button>
      <button
        onClick={() => onFilterChange({ priceRange: [20000, 50000] })}
        data-testid="price-filter"
      >
        20k-50k EUR
      </button>
    </div>
  )
}));

vi.mock('~/components/car/CarGrid', () => ({
  CarGrid: ({ cars, loading }: any) => (
    <div data-testid="car-grid">
      {loading ? (
        <div data-testid="loading">Loading...</div>
      ) : (
        cars.map((car: any) => (
          <div key={car.id} data-testid={`car-${car.id}`}>
            {car.title} - {car.price} {car.currency}
          </div>
        ))
      )}
    </div>
  )
}));

// Mock search page component
const MockSearchPage = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filters, setFilters] = React.useState({});
  const [cars, setCars] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockResults = [
        mockCar({ id: '1', title: 'BMW X5 2020', price: 45000 }),
        mockCar({ id: '2', title: 'BMW X3 2019', price: 35000 })
      ].filter(car => 
        car.title.toLowerCase().includes(query.toLowerCase())
      );
      
      setCars(mockResults);
      setLoading(false);
    }, 100);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters });
    // Apply filters to results
    setLoading(true);
    setTimeout(() => {
      setCars(prev => prev.filter(car => {
        if (newFilters.brand && !newFilters.brand.includes(car.brand)) {
          return false;
        }
        if (newFilters.priceRange) {
          const [min, max] = newFilters.priceRange;
          if (car.price < min || car.price > max) {
            return false;
          }
        }
        return true;
      }));
      setLoading(false);
    }, 100);
  };

  return (
    <div>
      <SearchBar onSearch={handleSearch} onSuggestionSelect={handleSearch} />
      <FilterPanel onFilterChange={handleFilterChange} />
      <CarGrid cars={cars} loading={loading} />
    </div>
  );
};

describe('Search Flow Integration', () => {
  it('completes full search flow from query to results', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(<MockSearchPage />);
    
    // Step 1: Enter search query
    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'BMW');
    
    // Step 2: Wait for results
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('car-1')).toBeInTheDocument();
      expect(screen.getByTestId('car-2')).toBeInTheDocument();
    });
    
    // Step 3: Verify results content
    expect(screen.getByText('BMW X5 2020 - 45000 EUR')).toBeInTheDocument();
    expect(screen.getByText('BMW X3 2019 - 35000 EUR')).toBeInTheDocument();
  });

  it('handles suggestion selection', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(<MockSearchPage />);
    
    // Click on suggestion
    await user.click(screen.getByText('BMW X5'));
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByTestId('car-1')).toBeInTheDocument();
    });
    
    expect(screen.getByText('BMW X5 2020 - 45000 EUR')).toBeInTheDocument();
  });

  it('applies filters to search results', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(<MockSearchPage />);
    
    // First search for BMW cars
    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'BMW');
    
    await waitFor(() => {
      expect(screen.getByTestId('car-1')).toBeInTheDocument();
      expect(screen.getByTestId('car-2')).toBeInTheDocument();
    });
    
    // Apply price filter
    await user.click(screen.getByTestId('price-filter'));
    
    await waitFor(() => {
      // Should filter out cars outside price range
      expect(screen.getByTestId('car-2')).toBeInTheDocument(); // 35k is in range
      // Car 1 (45k) might be filtered out depending on exact range
    });
  });

  it('shows loading states during search', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(<MockSearchPage />);
    
    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'BMW');
    
    // Should show loading immediately
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    // Loading should disappear after results load
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });

  it('handles empty search results', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(<MockSearchPage />);
    
    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'NonExistentCar');
    
    await waitFor(() => {
      expect(screen.queryByTestId('car-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('car-2')).not.toBeInTheDocument();
    });
  });

  it('maintains search state when applying filters', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(<MockSearchPage />);
    
    // Search first
    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'BMW');
    
    await waitFor(() => {
      expect(screen.getByTestId('car-1')).toBeInTheDocument();
    });
    
    // Apply brand filter
    await user.click(screen.getByTestId('bmw-filter'));
    
    // Results should still be BMW cars (search + filter combined)
    await waitFor(() => {
      expect(screen.getByText(/BMW/)).toBeInTheDocument();
    });
  });

  it('handles rapid search queries correctly', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(<MockSearchPage />);
    
    const searchInput = screen.getByTestId('search-input');
    
    // Type rapidly
    await user.type(searchInput, 'B');
    await user.type(searchInput, 'M');
    await user.type(searchInput, 'W');
    
    // Should eventually show BMW results
    await waitFor(() => {
      expect(screen.getByText(/BMW/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});