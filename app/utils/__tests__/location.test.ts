import { describe, expect, it } from 'vitest';
import { distanceInKm } from '~/utils/location';

describe('distanceInKm', () => {
  it('uses stored coordinates and computes an approximate geographic distance', () => {
    const distance = distanceInKm(
      { city: 'București', latitude: 44.4268, longitude: 26.1025 },
      { city: 'Brașov', latitude: 45.6579, longitude: 25.6012 },
    );
    expect(distance).toBeGreaterThan(120);
    expect(distance).toBeLessThan(150);
  });
});
