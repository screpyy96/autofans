import { describe, expect, it } from 'vitest';
import { FuelType, TransmissionType } from '~/types';
import { matchesSavedSearch } from '~/utils/savedSearchMatcher';

const listing = {
  title: 'BMW Seria 3 320d', make: 'BMW', model: 'Seria 3', description: 'Automată, istoric complet',
  price: 18000, year: 2020, mileage: 120000, fuel_type: 'diesel', transmission: 'automatic',
  city: 'Cluj-Napoca', county: 'Cluj', latitude: 46.7712, longitude: 23.5947, images: [{}], service_history: true, owners: 1,
};

describe('matchesSavedSearch', () => {
  it('matches the filter criteria used by a saved search', () => {
    expect(matchesSavedSearch(listing, {
      brand: ['BMW'], fuelType: [FuelType.DIESEL], transmission: [TransmissionType.AUTOMATIC],
      priceRange: { min: 15000, max: 20000 }, location: { id: 'cluj', city: 'Cluj-Napoca', county: 'Cluj', country: 'RO' }, radius: 50,
    })).toBe(true);
  });
  it('does not match a listing outside the saved radius', () => {
    expect(matchesSavedSearch({ ...listing, city: 'București', latitude: 44.4268, longitude: 26.1025 }, {
      location: { id: 'cluj', city: 'Cluj-Napoca', county: 'Cluj', country: 'RO' }, radius: 50,
    })).toBe(false);
  });
});
