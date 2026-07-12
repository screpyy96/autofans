import { describe, expect, it } from 'vitest';
import { calculatePriceScore } from '~/utils/priceScore';

describe('calculatePriceScore', () => {
  it('does not claim a market score without enough comparables', () => {
    const score = calculatePriceScore({ price: 20000, currency: 'EUR' }, [{ price: 19000, currency: 'EUR' }]);

    expect(score.available).toBe(false);
    expect(score.label).toBe('Date insuficiente');
    expect(score.monthlyPayment).toBeGreaterThan(0);
  });

  it('marks a listing below the market median', () => {
    const score = calculatePriceScore({ price: 18000, currency: 'EUR' }, [
      { price: 20000, currency: 'EUR' },
      { price: 21000, currency: 'EUR' },
      { price: 22000, currency: 'EUR' },
    ]);

    expect(score).toMatchObject({ available: true, level: 'below_market', marketMedian: 21000 });
  });

  it('normalizes EUR and RON comparables before calculating the median', () => {
    const score = calculatePriceScore({ price: 100000, currency: 'RON' }, [
      { price: 20000, currency: 'EUR' },
      { price: 102000, currency: 'RON' },
      { price: 98000, currency: 'RON' },
    ]);

    expect(score.available).toBe(true);
    expect(score.marketMedian).toBe(100000);
    expect(score.level).toBe('fair');
  });
});
