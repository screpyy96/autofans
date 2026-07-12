import { describe, expect, it } from 'vitest';
import { mapListingStatus, mapListingToCar } from '~/utils/listingMapper';

describe('mapListingToCar', () => {
  it('uses safe fallbacks when listing fields are missing', () => {
    const car = mapListingToCar({ id: 7, make: 'BMW', model: '320d' });

    expect(car.id).toBe('7');
    expect(car.slug).toBe('7');
    expect(car.title).toBe('BMW 320d');
    expect(car.location.city).toBe('București');
    expect(car.images[0].url).toBe('/placeholder-car.jpg');
  });

  it('maps signed listing images and keeps the main image', () => {
    const car = mapListingToCar({
      id: 8,
      slug: 'audi-a4',
      title: 'Audi A4',
      images: [{ path: '8/main.jpg', isMain: true }],
    }, { '8/main.jpg': 'https://cdn.example/main.jpg' });

    expect(car.slug).toBe('audi-a4');
    expect(car.images[0]).toMatchObject({ url: 'https://cdn.example/main.jpg', isMain: true });
  });

  it('normalizes database statuses to application statuses', () => {
    expect(mapListingStatus('published')).toBe('active');
    expect(mapListingStatus('draft')).toBe('draft');
    expect(mapListingStatus('pending-approval')).toBe('pending_approval');
    expect(mapListingStatus('unknown')).toBe('active');
  });
});
