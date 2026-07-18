import { describe, expect, it } from 'vitest';
import { validateListingDraft, validateListingForPublication } from '../listingPublication';

const ownerId = '11111111-1111-1111-1111-111111111111';
const validListing = {
  title: 'BMW 320d 2019 cu istoric complet',
  description: 'Mașina este întreținută la timp, are istoric complet și toate reviziile documentate.',
  price: 18500,
  currency: 'EUR',
  make: 'BMW',
  model: '320d',
  year: 2019,
  mileage: 124000,
  fuel_type: 'diesel',
  transmission: 'automatic',
  city: 'Cluj-Napoca',
  county: 'Cluj',
  images: [{ path: `${ownerId}/front.jpg`, isMain: false }],
};

describe('validateListingForPublication', () => {
  it('normalizes a publishable listing and makes its first image the cover', () => {
    const result = validateListingForPublication(validListing, ownerId);

    expect('data' in result).toBe(true);
    if ('data' in result) {
      expect(result.data.images).toEqual([{ path: `${ownerId}/front.jpg`, isMain: true }]);
      expect(result.data.title).toBe('BMW 320d 2019 cu istoric complet');
    }
  });

  it('rejects incomplete listings before they reach the database', () => {
    const result = validateListingForPublication({ ...validListing, description: 'Prea scurt' }, ownerId);

    expect(result).toEqual({ error: 'Descrierea trebuie să aibă cel puțin 50 de caractere.' });
  });

  it('rejects image references owned by another seller', () => {
    const result = validateListingForPublication({
      ...validListing,
      images: [{ path: '22222222-2222-2222-2222-222222222222/other-car.jpg', isMain: true }],
    }, ownerId);

    expect(result).toEqual({ error: 'Una sau mai multe imagini nu îți aparțin sau nu sunt valide.' });
  });

  it('allows an incomplete draft but keeps its fields safe for the database', () => {
    const result = validateListingDraft({ title: '  Mașina mea  ', price: 'nu este un număr' }, ownerId);

    expect('data' in result).toBe(true);
    if ('data' in result) {
      expect(result.data).toMatchObject({ title: 'Mașina mea', price: 0, make: 'Necunoscută', model: 'Nespecificat', images: [] });
      expect(result.data.year).toBeNull();
    }
  });
});
