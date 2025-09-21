import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { CarCard } from '../CarCard';
import { mockCar, renderWithRouter } from '~/test/utils';

// Mock hooks
vi.mock('~/hooks/useResponsive', () => ({
    useResponsive: () => ({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false
    })
}));

describe('CarCard', () => {
    const mockHandlers = {
        onFavorite: vi.fn(),
        onCompare: vi.fn(),
        onContact: vi.fn(),
        onView: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders car information correctly', () => {
        const car = mockCar({
            title: 'BMW X5 2020',
            price: 45000,
            currency: 'EUR',
            year: 2020,
            mileage: 50000,
            location: { city: 'București', county: 'Ilfov' }
        });

        renderWithRouter(
            <CarCard car={car} {...mockHandlers} />
        );

        expect(screen.getByText('BMW X5 2020')).toBeInTheDocument();
        expect(screen.getByText('45.000 EUR')).toBeInTheDocument();
        expect(screen.getByText('2020')).toBeInTheDocument();
        expect(screen.getByText('50.000 km')).toBeInTheDocument();
        expect(screen.getByText('București, Ilfov')).toBeInTheDocument();
    });

    it('handles favorite button click', async () => {
        const user = userEvent.setup();
        const car = mockCar();

        renderWithRouter(
            <CarCard car={car} {...mockHandlers} />
        );

        const favoriteButton = screen.getByRole('button', { name: /favorite/i });
        await user.click(favoriteButton);

        expect(mockHandlers.onFavorite).toHaveBeenCalledWith(car.id);
    });

    it('handles compare button click', async () => {
        const user = userEvent.setup();
        const car = mockCar();

        renderWithRouter(
            <CarCard car={car} {...mockHandlers} />
        );

        const compareButton = screen.getByRole('button', { name: /compare/i });
        await user.click(compareButton);

        expect(mockHandlers.onCompare).toHaveBeenCalledWith(car.id);
    });

    it('handles contact button click', async () => {
        const user = userEvent.setup();
        const car = mockCar();

        renderWithRouter(
            <CarCard car={car} {...mockHandlers} />
        );

        const contactButton = screen.getByText('Contactează');
        await user.click(contactButton);

        expect(mockHandlers.onContact).toHaveBeenCalledWith(car.id);
    });

    it('handles card click for viewing details', async () => {
        const user = userEvent.setup();
        const car = mockCar();

        renderWithRouter(
            <CarCard car={car} {...mockHandlers} />
        );

        const card = screen.getByRole('article') || screen.getByText(car.title).closest('div');
        if (card) {
            await user.click(card);
            expect(mockHandlers.onView).toHaveBeenCalledWith(car.id);
        }
    });

    it('shows favorited state correctly', () => {
        const car = mockCar();

        renderWithRouter(
            <CarCard car={car} {...mockHandlers} isFavorited={true} />
        );

        const favoriteButton = screen.getByRole('button', { name: /favorite/i });
        expect(favoriteButton).toHaveClass('bg-red-500/90');
    });

    it('shows comparison state correctly', () => {
        const car = mockCar();

        renderWithRouter(
            <CarCard car={car} {...mockHandlers} isInComparison={true} />
        );

        const compareButton = screen.getByRole('button', { name: /compare/i });
        expect(compareButton).toHaveClass('bg-primary-500/90');
    });

    it('renders in list variant correctly', () => {
        const car = mockCar();

        renderWithRouter(
            <CarCard car={car} {...mockHandlers} variant="list" />
        );

        const card = screen.getByText(car.title).closest('div');
        expect(card).toHaveClass('flex-row');
    });

    it('displays seller information', () => {
        const car = mockCar({
            seller: {
                id: '1',
                name: 'John Doe',
                type: 'dealer',
                isVerified: true,
                responseTime: 'în 2 ore'
            }
        });

        renderWithRouter(
            <CarCard car={car} {...mockHandlers} />
        );

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Dealer')).toBeInTheDocument();
        expect(screen.getByText('Verificat')).toBeInTheDocument();
        expect(screen.getByText(/Răspunde în 2 ore/)).toBeInTheDocument();
    });

    it('displays car features', () => {
        const car = mockCar({
            features: [
                { id: '1', name: 'Climatronic', category: 'comfort' },
                { id: '2', name: 'Navigație GPS', category: 'technology' },
                { id: '3', name: 'Scaune încălzite', category: 'comfort' }
            ]
        });

        renderWithRouter(
            <CarCard car={car} {...mockHandlers} />
        );

        expect(screen.getByText('Climatronic')).toBeInTheDocument();
        expect(screen.getByText('Navigație GPS')).toBeInTheDocument();
        expect(screen.getByText('Scaune încălzite')).toBeInTheDocument();
    });

    it('shows image count badge when multiple images', () => {
        const car = mockCar({
            images: [
                { id: '1', url: '/image1.jpg', alt: 'Image 1', isMain: true },
                { id: '2', url: '/image2.jpg', alt: 'Image 2', isMain: false },
                { id: '3', url: '/image3.jpg', alt: 'Image 3', isMain: false }
            ]
        });

        renderWithRouter(
            <CarCard car={car} {...mockHandlers} />
        );

        expect(screen.getByText('3 poze')).toBeInTheDocument();
    });

    it('shows negotiable badge when price is negotiable', () => {
        const car = mockCar({ negotiable: true });

        renderWithRouter(
            <CarCard car={car} {...mockHandlers} />
        );

        expect(screen.getByText('Negociabil')).toBeInTheDocument();
    });

    it('displays car statistics', () => {
        const car = mockCar({
            viewCount: 150,
            favoriteCount: 12,
            contactCount: 5
        });

        renderWithRouter(
            <CarCard car={car} {...mockHandlers} />
        );

        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('handles image loading states', () => {
        const car = mockCar();

        renderWithRouter(
            <CarCard car={car} {...mockHandlers} />
        );

        const image = screen.getByRole('img');
        expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('prevents event bubbling on action buttons', async () => {
        const user = userEvent.setup();
        const car = mockCar();

        renderWithRouter(
            <CarCard car={car} {...mockHandlers} />
        );

        const favoriteButton = screen.getByRole('button', { name: /favorite/i });
        await user.click(favoriteButton);

        expect(mockHandlers.onFavorite).toHaveBeenCalledWith(car.id);
        expect(mockHandlers.onView).not.toHaveBeenCalled();
    });

    it('has proper accessibility attributes', () => {
        const car = mockCar();

        renderWithRouter(
            <CarCard car={car} {...mockHandlers} />
        );

        const image = screen.getByRole('img');
        expect(image).toHaveAttribute('alt', car.title);

        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
            expect(button).toBeVisible();
        });
    });
});