import { describe, expect, it } from 'vitest';
import { calculateTrustScore } from '~/utils/trustScore';

describe('calculateTrustScore', () => {
  it('starts at basic when no trust signals are available', () => {
    const trust = calculateTrustScore({});

    expect(trust.score).toBe(0);
    expect(trust.level).toBe('basic');
    expect(trust.label).toBe('De verificat');
  });

  it('combines seller, VIN, history and completeness signals', () => {
    const trust = calculateTrustScore({
      vin: 'WVWZZZ1JZXW000001', vin_verified: true, history_checked: true,
      description: 'Întreținută la zi', price: 32000, year: 2020,
      make: 'Volkswagen', model: 'Golf',
    }, { is_verified: true });

    expect(trust.score).toBe(100);
    expect(trust.level).toBe('verified');
    expect(trust.signals).toEqual({ sellerVerified: true, vinProvided: true, vinVerified: true, historyChecked: true, completeListing: true });
  });
});
