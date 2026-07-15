import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CarCard } from '../CarCard';
import { useAppStore } from '~/stores/useAppStore';
import { mockCar, renderWithRouter } from '~/test/utils';

vi.mock('~/hooks/useResponsive', () => ({
  useResponsive: () => ({ isMobile: false, isTablet: false, isDesktop: true, isTouchDevice: false }),
}));

describe('CarCard', () => {
  const handlers = { onFavorite: vi.fn(), onCompare: vi.fn(), onView: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.getState().setCurrency('EUR');
  });

  it('renders the listing information displayed in the compact card', () => {
    const car = mockCar({ title: 'BMW X5 2020', price: 45000, currency: 'EUR' });
    renderWithRouter(<CarCard car={car} {...handlers} />);

    expect(screen.getByRole('heading', { name: 'BMW X5 2020' })).toBeInTheDocument();
    expect(screen.getByText(/45\.000\s?EUR/)).toBeInTheDocument();
    expect(screen.getByText('50.000 km')).toBeInTheDocument();
    expect(screen.getByText('București, Ilfov')).toBeInTheDocument();
  });

  it('toggles a favorite without opening the listing', async () => {
    const user = userEvent.setup();
    const car = mockCar();
    renderWithRouter(<CarCard car={car} {...handlers} />);

    await user.click(screen.getByRole('button', { name: 'Adaugă la favorite' }));
    expect(handlers.onFavorite).toHaveBeenCalledWith(car.id);
    expect(handlers.onView).not.toHaveBeenCalled();
  });

  it('adds the listing to comparison', async () => {
    const user = userEvent.setup();
    const car = mockCar();
    renderWithRouter(<CarCard car={car} {...handlers} />);

    await user.click(screen.getByRole('button', { name: 'Adaugă la comparare' }));
    expect(handlers.onCompare).toHaveBeenCalledWith(car.id);
  });

  it('uses the canonical listing URL and keeps the legacy view callback', async () => {
    const user = userEvent.setup();
    const car = mockCar();
    renderWithRouter(<CarCard car={car} {...handlers} />);

    const link = screen.getByRole('link', { name: `Vezi anunțul: ${car.title}` });
    expect(link).toHaveAttribute('href', `/car/${car.slug}`);
    await user.click(link);
    expect(handlers.onView).toHaveBeenCalledWith(car.slug);
  });

  it('shows selected favorite and comparison states', () => {
    const car = mockCar();
    renderWithRouter(<CarCard car={car} {...handlers} isFavorited isInComparison />);

    expect(screen.getByRole('button', { name: 'Adaugă la favorite' })).toHaveClass('bg-red-500');
    expect(screen.getByRole('button', { name: 'Adaugă la comparare' })).toHaveClass('bg-accent-gold');
  });

  it('supports the list layout and preserves lazy image loading', () => {
    const car = mockCar();
    renderWithRouter(<CarCard car={car} {...handlers} variant="list" />);

    expect(screen.getByRole('heading', { name: car.title }).closest('[class*="sm:flex-row"]')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: car.title })).toHaveAttribute('loading', 'lazy');
  });

  it('shows real card badges when the listing has multiple images and is negotiable', () => {
    const car = mockCar({
      images: [
        { id: '1', url: '/one.jpg', alt: 'One', isMain: true },
        { id: '2', url: '/two.jpg', alt: 'Two', isMain: false },
      ],
      negotiable: true,
    });
    renderWithRouter(<CarCard car={car} {...handlers} />);

    expect(screen.getByText('2 poze')).toBeInTheDocument();
    expect(screen.getByText('Negociabil')).toBeInTheDocument();
  });
});
