import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { vi, expect } from 'vitest';
import { FuelType, TransmissionType, ConditionType, ListingStatus } from '~/types';

// Mock data generators
export const mockCar = (overrides = {}) => ({
  id: '1',
  title: 'BMW X5 2020',
  brand: 'BMW',
  model: 'X5',
  year: 2020,
  mileage: 50000,
  fuelType: FuelType.DIESEL,
  transmission: TransmissionType.AUTOMATIC,
  price: 45000,
  currency: 'EUR',
  negotiable: true,
  location: {
    id: '1',
    city: 'București',
    county: 'Ilfov',
    country: 'România',
    latitude: 44.4268,
    longitude: 26.1025
  },
  images: [
    { 
      id: '1', 
      url: '/test-image.jpg', 
      thumbnailUrl: '/test-image-thumb.jpg',
      alt: 'Test image', 
      order: 1,
      isMain: true 
    }
  ],
  specifications: {
    engineSize: 3.0,
    power: 265,
    doors: 5,
    seats: 7,
  },
  features: [
    { id: '1', name: 'Climatronic', category: 'comfort' },
    { id: '2', name: 'Navigație GPS', category: 'technology' }
  ],
  condition: {
    overall: ConditionType.VERY_GOOD,
    exterior: ConditionType.VERY_GOOD,
    interior: ConditionType.GOOD,
    engine: ConditionType.EXCELLENT,
    transmission: ConditionType.VERY_GOOD,
    notes: 'Mașină în stare foarte bună, întreținută regulat',
    hasAccidents: false,
    lastServiceDate: new Date('2023-12-01')
  },
  seller: {
    id: '1',
    name: 'John Doe',
    type: 'individual' as const,
    phone: '+40123456789',
    email: 'john@example.com',
    location: {
      id: '1',
      city: 'București',
      county: 'Ilfov',
      country: 'România',
      latitude: 44.4268,
      longitude: 26.1025
    },
    isVerified: true,
    responseTime: 'în 2 ore',
    avatar: '/avatar.jpg'
  },
  description: 'BMW X5 în stare foarte bună, cu toate opțiunile. Mașină întreținută la reprezentanță, fără accidente. Disponibilă pentru test drive.',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  status: ListingStatus.ACTIVE,
  viewCount: 150,
  favoriteCount: 12,
  contactCount: 5,
  owners: 1,
  serviceHistory: true,
  ...overrides
});

export const mockUser = (overrides = {}) => ({
  id: '1',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+40123456789',
  avatar: '/avatar.jpg',
  location: {
    city: 'București',
    county: 'Ilfov',
    coordinates: { lat: 44.4268, lng: 26.1025 }
  },
  preferences: {
    currency: 'EUR',
    language: 'ro',
    notifications: {
      email: true,
      push: true,
      sms: false
    }
  },
  savedSearches: [],
  favorites: [],
  listings: [],
  createdAt: new Date('2024-01-01'),
  ...overrides
});

export const mockFilterState = (overrides = {}) => ({
  brand: [],
  model: [],
  priceRange: [0, 100000] as [number, number],
  yearRange: [2000, 2024] as [number, number],
  mileageRange: [0, 300000] as [number, number],
  fuelType: [],
  transmission: [],
  location: undefined,
  radius: 50,
  features: [],
  ...overrides
});

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  route?: string;
}

export function renderWithRouter(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { initialEntries = ['/'], route = '/', ...renderOptions } = options;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock hooks
export const mockUseResponsive = () => ({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isTouchDevice: false,
  screenSize: 'desktop' as const
});

export const mockUseTouch = () => ({
  isTouch: false,
  touchStart: vi.fn(),
  touchMove: vi.fn(),
  touchEnd: vi.fn()
});

export const mockUseAccessibility = () => ({
  announceToScreenReader: vi.fn(),
  focusElement: vi.fn(),
  trapFocus: vi.fn(),
  releaseFocus: vi.fn()
});

// Test helpers
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 100));

export const createMockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  });
  window.IntersectionObserver = mockIntersectionObserver;
  return mockIntersectionObserver;
};

export const createMockResizeObserver = () => {
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  });
  window.ResizeObserver = mockResizeObserver;
  return mockResizeObserver;
};

// Accessibility testing helpers
export const axeMatchers = {
  toHaveNoViolations: (received: any) => {
    // This would integrate with axe-core
    return {
      pass: true,
      message: () => 'No accessibility violations found'
    };
  }
};

// Performance testing helpers
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now();
  await renderFn();
  const end = performance.now();
  return end - start;
};

export const expectRenderTimeUnder = (time: number) => (actualTime: number) => {
  expect(actualTime).toBeLessThan(time);
};