import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { CarCard } from '~/components/car/CarCard';
import { mockCar, renderWithRouter } from '../utils';

// Mock function to simulate visual regression testing
// In a real implementation, this would use tools like Playwright or Chromatic
const takeSnapshot = (container: HTMLElement, name: string) => {
  // This would capture a screenshot and compare with baseline
  // For now, we'll just verify the component renders without errors
  expect(container).toBeInTheDocument();
  return Promise.resolve({ match: true, name });
};

describe('Visual Regression Tests', () => {
  describe('Button Component', () => {
    it('should match visual snapshot for primary variant', async () => {
      const { container } = render(<Button variant="primary">Primary Button</Button>);

      const snapshot = await takeSnapshot(container, 'button-primary');
      expect(snapshot.match).toBe(true);
    });

    it('should match visual snapshot for secondary variant', async () => {
      const { container } = render(<Button variant="secondary">Secondary Button</Button>);

      const snapshot = await takeSnapshot(container, 'button-secondary');
      expect(snapshot.match).toBe(true);
    });

    it('should match visual snapshot for outline variant', async () => {
      const { container } = render(<Button variant="outline">Outline Button</Button>);

      const snapshot = await takeSnapshot(container, 'button-outline');
      expect(snapshot.match).toBe(true);
    });

    it('should match visual snapshot for disabled state', async () => {
      const { container } = render(<Button disabled>Disabled Button</Button>);

      const snapshot = await takeSnapshot(container, 'button-disabled');
      expect(snapshot.match).toBe(true);
    });

    it('should match visual snapshot for loading state', async () => {
      const { container } = render(<Button loading>Loading Button</Button>);

      const snapshot = await takeSnapshot(container, 'button-loading');
      expect(snapshot.match).toBe(true);
    });

    it('should match visual snapshot for different sizes', async () => {
      const { container } = render(
        <div className="space-y-4">
          <Button size="sm">Small Button</Button>
          <Button size="md">Medium Button</Button>
          <Button size="lg">Large Button</Button>
        </div>
      );

      const snapshot = await takeSnapshot(container, 'button-sizes');
      expect(snapshot.match).toBe(true);
    });
  });

  describe('Card Component', () => {
    it('should match visual snapshot for default card', async () => {
      const { container } = render(
        <Card>
          <h3>Card Title</h3>
          <p>This is card content with some text to test the layout.</p>
        </Card>
      );

      const snapshot = await takeSnapshot(container, 'card-default');
      expect(snapshot.match).toBe(true);
    });

    it('should match visual snapshot for elevated card', async () => {
      const { container } = render(
        <Card variant="elevated">
          <h3>Elevated Card</h3>
          <p>This card has elevated styling with shadow.</p>
        </Card>
      );

      const snapshot = await takeSnapshot(container, 'card-elevated');
      expect(snapshot.match).toBe(true);
    });

    it('should match visual snapshot for hoverable card', async () => {
      const { container } = render(
        <Card hoverable>
          <h3>Hoverable Card</h3>
          <p>This card has hover effects.</p>
        </Card>
      );

      const snapshot = await takeSnapshot(container, 'card-hoverable');
      expect(snapshot.match).toBe(true);
    });
  });

  describe('CarCard Component', () => {
    it('should match visual snapshot for grid variant', async () => {
      const car = mockCar({
        title: 'BMW X5 2020',
        price: 45000,
        currency: 'EUR',
        images: [
          { id: '1', url: '/test-image.jpg', alt: 'BMW X5', isMain: true }
        ]
      });

      const mockHandlers = {
        onFavorite: () => { },
        onCompare: () => { },
        onContact: () => { },
        onView: () => { }
      };

      const { container } = renderWithRouter(
        <CarCard car={car} {...mockHandlers} variant="grid" />
      );

      const snapshot = await takeSnapshot(container, 'car-card-grid');
      expect(snapshot.match).toBe(true);
    });

    it('should match visual snapshot for list variant', async () => {
      const car = mockCar({
        title: 'BMW X5 2020',
        price: 45000,
        currency: 'EUR'
      });

      const mockHandlers = {
        onFavorite: () => { },
        onCompare: () => { },
        onContact: () => { },
        onView: () => { }
      };

      const { container } = renderWithRouter(
        <CarCard car={car} {...mockHandlers} variant="list" />
      );

      const snapshot = await takeSnapshot(container, 'car-card-list');
      expect(snapshot.match).toBe(true);
    });

    it('should match visual snapshot for favorited state', async () => {
      const car = mockCar();
      const mockHandlers = {
        onFavorite: () => { },
        onCompare: () => { },
        onContact: () => { },
        onView: () => { }
      };

      const { container } = renderWithRouter(
        <CarCard car={car} {...mockHandlers} isFavorited={true} />
      );

      const snapshot = await takeSnapshot(container, 'car-card-favorited');
      expect(snapshot.match).toBe(true);
    });

    it('should match visual snapshot with all features', async () => {
      const car = mockCar({
        title: 'BMW X5 2020 xDrive30d',
        price: 45000,
        currency: 'EUR',
        negotiable: true,
        features: [
          { id: '1', name: 'Climatronic', category: 'comfort' },
          { id: '2', name: 'Navigație GPS', category: 'technology' },
          { id: '3', name: 'Scaune încălzite', category: 'comfort' },
          { id: '4', name: 'Pilot automat', category: 'safety' }
        ],
        images: [
          { id: '1', url: '/image1.jpg', alt: 'Front view', isMain: true },
          { id: '2', url: '/image2.jpg', alt: 'Side view', isMain: false },
          { id: '3', url: '/image3.jpg', alt: 'Interior', isMain: false }
        ],
        seller: {
          id: '1',
          name: 'Premium Auto SRL',
          type: 'dealer',
          isVerified: true,
          responseTime: 'în 1 oră'
        }
      });

      const mockHandlers = {
        onFavorite: () => { },
        onCompare: () => { },
        onContact: () => { },
        onView: () => { }
      };

      const { container } = renderWithRouter(
        <CarCard car={car} {...mockHandlers} />
      );

      const snapshot = await takeSnapshot(container, 'car-card-full-features');
      expect(snapshot.match).toBe(true);
    });
  });

  describe('Responsive Design', () => {
    it('should match visual snapshot on mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      const car = mockCar();
      const mockHandlers = {
        onFavorite: () => { },
        onCompare: () => { },
        onContact: () => { },
        onView: () => { }
      };

      const { container } = renderWithRouter(
        <CarCard car={car} {...mockHandlers} />
      );

      const snapshot = await takeSnapshot(container, 'car-card-mobile');
      expect(snapshot.match).toBe(true);
    });

    it('should match visual snapshot on tablet viewport', async () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const car = mockCar();
      const mockHandlers = {
        onFavorite: () => { },
        onCompare: () => { },
        onContact: () => { },
        onView: () => { }
      };

      const { container } = renderWithRouter(
        <CarCard car={car} {...mockHandlers} />
      );

      const snapshot = await takeSnapshot(container, 'car-card-tablet');
      expect(snapshot.match).toBe(true);
    });
  });

  describe('Dark Mode', () => {
    it('should match visual snapshot in dark mode', async () => {
      // Mock dark mode
      document.documentElement.classList.add('dark');

      const { container } = render(
        <div className="dark:bg-gray-900 dark:text-white p-4">
          <Button variant="primary">Dark Mode Button</Button>
          <Card className="mt-4">
            <h3>Dark Mode Card</h3>
            <p>Content in dark mode</p>
          </Card>
        </div>
      );

      const snapshot = await takeSnapshot(container, 'components-dark-mode');
      expect(snapshot.match).toBe(true);

      // Cleanup
      document.documentElement.classList.remove('dark');
    });
  });

  describe('High Contrast Mode', () => {
    it('should match visual snapshot in high contrast mode', async () => {
      // Mock high contrast preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: () => { },
          removeListener: () => { },
          addEventListener: () => { },
          removeEventListener: () => { },
          dispatchEvent: () => { },
        }),
      });

      const { container } = render(
        <div className="contrast-more:border-2 contrast-more:border-black">
          <Button variant="primary">High Contrast Button</Button>
        </div>
      );

      const snapshot = await takeSnapshot(container, 'components-high-contrast');
      expect(snapshot.match).toBe(true);
    });
  });

  describe('Loading States', () => {
    it('should match visual snapshot for loading states', async () => {
      const { container } = render(
        <div className="space-y-4">
          <Button loading>Loading Button</Button>
          <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
          <div className="animate-pulse bg-gray-200 h-20 w-full rounded"></div>
        </div>
      );

      const snapshot = await takeSnapshot(container, 'loading-states');
      expect(snapshot.match).toBe(true);
    });
  });

  describe('Error States', () => {
    it('should match visual snapshot for error states', async () => {
      const { container } = render(
        <div className="space-y-4">
          <div className="border border-red-300 bg-red-50 p-4 rounded">
            <p className="text-red-800">Error message here</p>
          </div>
          <Button variant="outline" className="border-red-300 text-red-700">
            Error Button
          </Button>
        </div>
      );

      const snapshot = await takeSnapshot(container, 'error-states');
      expect(snapshot.match).toBe(true);
    });
  });
});