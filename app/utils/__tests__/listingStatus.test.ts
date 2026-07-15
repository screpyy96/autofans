import { describe, expect, it } from 'vitest';
import { formatListingUpdatedAt, listingStatusLabel } from '../listingStatus';

describe('listing dashboard labels', () => {
  it('turns database statuses into seller-friendly Romanian labels', () => {
    expect(listingStatusLabel('published')).toBe('Publicat');
    expect(listingStatusLabel('draft')).toBe('Ciornă');
    expect(listingStatusLabel('unknown')).toBe('unknown');
  });

  it('formats timestamps consistently in the marketplace timezone', () => {
    expect(formatListingUpdatedAt('2026-07-14T10:30:00.000Z')).toContain('14 iul. 2026');
    expect(formatListingUpdatedAt('not-a-date')).toBe('Dată indisponibilă');
  });
});
