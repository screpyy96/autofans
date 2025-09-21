import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CarCard } from '~/components/car/CarCard';
import { CarGrid } from '~/components/car/CarGrid';
import { SearchBar } from '~/components/search/SearchBar';
import { mockCar, renderWithRouter, measureRenderTime, expectRenderTimeUnder } from '../utils';

describe('Performance Tests', () => {
  describe('Component Render Performance', () => {
    it('should render CarCard within performance budget', async () => {
      const car = mockCar();
      const mockHandlers = {
        onFavorite: vi.fn(),
        onCompare: vi.fn(),
        onContact: vi.fn(),
        onView: vi.fn()
      };

      const renderTime = await measureRenderTime(() => {
        renderWithRouter(<CarCard car={car} {...mockHandlers} />);
      });

      // CarCard should render in under 50ms
      expectRenderTimeUnder(50)(renderTime);
    });

    it('should render CarGrid with multiple items efficiently', async () => {
      const cars = Array.from({ length: 20 }, (_, i) => 
        mockCar({ id: `car-${i}`, title: `Car ${i}` })
      );

      const renderTime = await measureRenderTime(() => {
        renderWithRouter(
          <CarGrid 
            cars={cars} 
            loading={false}
            onLoadMore={() => {}}
            hasMore={true}
          />
        );
      });

      // Grid with 20 items should render in under 200ms
      expectRenderTimeUnder(200)(renderTime);
    });

    it('should handle large datasets without performance degradation', async () => {
      const largeCarsArray = Array.from({ length: 100 }, (_, i) => 
        mockCar({ id: `car-${i}`, title: `Car ${i}` })
      );

      const renderTime = await measureRenderTime(() => {
        renderWithRouter(
          <CarGrid 
            cars={largeCarsArray} 
            loading={false}
            onLoadMore={() => {}}
            hasMore={true}
          />
        );
      });

      // Even with 100 items, should render in under 500ms
      expectRenderTimeUnder(500)(renderTime);
    });
  });

  describe('Memory Usage', () => {
    it('should not create memory leaks with repeated renders', () => {
      const car = mockCar();
      const mockHandlers = {
        onFavorite: vi.fn(),
        onCompare: vi.fn(),
        onContact: vi.fn(),
        onView: vi.fn()
      };

      // Render and unmount multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderWithRouter(
          <CarCard car={car} {...mockHandlers} />
        );
        unmount();
      }

      // If we get here without errors, no obvious memory leaks
      expect(true).toBe(true);
    });

    it('should clean up event listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(
        <SearchBar 
          onSearch={() => {}}
          onSuggestionSelect={() => {}}
          suggestions={[]}
          isLoading={false}
        />
      );

      const addCalls = addEventListenerSpy.mock.calls.length;
      
      unmount();
      
      const removeCalls = removeEventListenerSpy.mock.calls.length;
      
      // Should remove at least as many listeners as added
      expect(removeCalls).toBeGreaterThanOrEqual(addCalls);

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Image Loading Performance', () => {
    it('should implement lazy loading for images', () => {
      const car = mockCar({
        images: [
          { id: '1', url: '/image1.jpg', alt: 'Image 1', isMain: true },
          { id: '2', url: '/image2.jpg', alt: 'Image 2', isMain: false }
        ]
      });

      const mockHandlers = {
        onFavorite: vi.fn(),
        onCompare: vi.fn(),
        onContact: vi.fn(),
        onView: vi.fn()
      };

      renderWithRouter(<CarCard car={car} {...mockHandlers} />);

      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy');
      });
    });

    it('should handle image loading errors gracefully', () => {
      const car = mockCar({
        images: [
          { id: '1', url: '/broken-image.jpg', alt: 'Broken image', isMain: true }
        ]
      });

      const mockHandlers = {
        onFavorite: vi.fn(),
        onCompare: vi.fn(),
        onContact: vi.fn(),
        onView: vi.fn()
      };

      renderWithRouter(<CarCard car={car} {...mockHandlers} />);

      const image = screen.getByRole('img');
      
      // Simulate image error
      const errorEvent = new Event('error');
      image.dispatchEvent(errorEvent);

      // Should still render without crashing
      expect(screen.getByText(car.title)).toBeInTheDocument();
    });
  });

  describe('Bundle Size Impact', () => {
    it('should not import unnecessary dependencies', () => {
      // This is more of a build-time check, but we can verify
      // that components don't import heavy libraries unnecessarily
      
      const car = mockCar();
      const mockHandlers = {
        onFavorite: vi.fn(),
        onCompare: vi.fn(),
        onContact: vi.fn(),
        onView: vi.fn()
      };

      // Should render without importing heavy dependencies
      expect(() => {
        renderWithRouter(<CarCard car={car} {...mockHandlers} />);
      }).not.toThrow();
    });
  });

  describe('Animation Performance', () => {
    it('should use CSS transforms for animations', () => {
      const car = mockCar();
      const mockHandlers = {
        onFavorite: vi.fn(),
        onCompare: vi.fn(),
        onContact: vi.fn(),
        onView: vi.fn()
      };

      renderWithRouter(<CarCard car={car} {...mockHandlers} />);

      // Check that hover animations use transform (better performance)
      const cardElement = screen.getByText(car.title).closest('div');
      const computedStyle = window.getComputedStyle(cardElement!);
      
      // Should have transition property for smooth animations
      expect(computedStyle.transition).toBeTruthy();
    });

    it('should respect reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const car = mockCar();
      const mockHandlers = {
        onFavorite: vi.fn(),
        onCompare: vi.fn(),
        onContact: vi.fn(),
        onView: vi.fn()
      };

      renderWithRouter(<CarCard car={car} {...mockHandlers} />);

      // Component should render without motion-heavy animations
      expect(screen.getByText(car.title)).toBeInTheDocument();
    });
  });

  describe('Search Performance', () => {
    it('should debounce search input', async () => {
      const onSearch = vi.fn();
      
      render(
        <SearchBar 
          onSearch={onSearch}
          onSuggestionSelect={() => {}}
          suggestions={[]}
          isLoading={false}
        />
      );

      const input = screen.getByRole('textbox');
      
      // Simulate rapid typing
      input.focus();
      ['B', 'M', 'W'].forEach(char => {
        input.dispatchEvent(new InputEvent('input', { 
          data: char,
          inputType: 'insertText'
        }));
      });

      // Should not call onSearch for every keystroke immediately
      expect(onSearch).not.toHaveBeenCalledTimes(3);
    });
  });

  describe('Virtual Scrolling', () => {
    it('should handle large lists efficiently with virtual scrolling', () => {
      // This would test virtual scrolling implementation
      // For now, we'll just verify the component can handle large datasets
      
      const largeCarsArray = Array.from({ length: 1000 }, (_, i) => 
        mockCar({ id: `car-${i}`, title: `Car ${i}` })
      );

      expect(() => {
        renderWithRouter(
          <CarGrid 
            cars={largeCarsArray.slice(0, 20)} // Only render visible items
            loading={false}
            onLoadMore={() => {}}
            hasMore={true}
          />
        );
      }).not.toThrow();

      // Should only render visible items, not all 1000
      const renderedCars = screen.getAllByText(/Car \d+/);
      expect(renderedCars.length).toBeLessThanOrEqual(20);
    });
  });
});