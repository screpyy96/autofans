import { describe, expect, it } from 'vitest';
import { buildRecommendations } from '~/utils/recommendations';

describe('buildRecommendations', () => {
  it('ranks matches from favorites and excludes already favorited cars', () => {
    const results = buildRecommendations({
      favorites: [{ id: 1, make: 'BMW', model: 'Seria 3', fuel_type: 'diesel' }],
      savedSearches: [],
      candidates: [
        { id: 1, make: 'BMW', model: 'Seria 3' },
        { id: 2, make: 'BMW', model: 'Seria 3', fuel_type: 'diesel' },
        { id: 3, make: 'Audi', model: 'A4' },
      ],
    });
    expect(results.map((item) => item.listing.id)).toEqual([2]);
    expect(results[0].reason).toContain('BMW Seria 3');
  });

  it('uses saved searches when there are no favorites', () => {
    const results = buildRecommendations({
      favorites: [],
      savedSearches: [{ name: 'SUV diesel', query: { brand: ['BMW'], fuelType: ['diesel' as any] } }],
      candidates: [{ id: 2, make: 'BMW', model: 'X3', fuel_type: 'diesel' }],
    });
    expect(results[0].reason).toContain('SUV diesel');
  });
});
