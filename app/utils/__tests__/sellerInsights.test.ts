import { describe, expect, it } from 'vitest';
import { getSellerRecommendation } from '~/utils/sellerInsights';

describe('getSellerRecommendation', () => {
  it('prioritizes an above-market price recommendation', () => {
    const recommendation = getSellerRecommendation(
      { viewCount: 30, favoriteCount: 4, contactCount: 0 },
      { available: true, level: 'above_market', recommendedOffer: 18000, currency: 'EUR' } as any,
    );

    expect(recommendation.title).toBe('Preț de revizuit');
    expect(recommendation.detail).toContain('18.000 EUR');
  });

  it('recognizes listings that produce real contacts', () => {
    const recommendation = getSellerRecommendation({ viewCount: 8, favoriteCount: 1, contactCount: 2 });

    expect(recommendation).toMatchObject({ title: 'Anunț performant', tone: 'positive' });
  });
});
