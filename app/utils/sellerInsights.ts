import type { PriceScore } from '~/utils/priceScore';

export interface ListingMetrics {
  viewCount: number;
  favoriteCount: number;
  contactCount: number;
}

export interface SellerRecommendation {
  title: string;
  detail: string;
  tone: 'positive' | 'action';
}

export function getSellerRecommendation(metrics: ListingMetrics, priceScore?: PriceScore | null): SellerRecommendation {
  if (priceScore?.available && priceScore.level === 'above_market' && priceScore.recommendedOffer) {
    return {
      title: 'Preț de revizuit',
      detail: `Piața indică o țintă de negociere de aproximativ ${Math.round(priceScore.recommendedOffer).toLocaleString('ro-RO')} ${priceScore.currency}.`,
      tone: 'action',
    };
  }

  if (metrics.viewCount >= 10 && metrics.favoriteCount >= 3 && metrics.contactCount === 0) {
    return {
      title: 'Interes fără contacte',
      detail: 'Anunțul este salvat, dar nu generează contacte. O ajustare mică de preț poate debloca discuțiile.',
      tone: 'action',
    };
  }

  if (metrics.viewCount >= 20 && metrics.contactCount === 0) {
    return {
      title: 'Trafic fără conversie',
      detail: 'Ai vizualizări, dar încă nu ai contacte. Verifică prețul, prima poză și descrierea.',
      tone: 'action',
    };
  }

  if (metrics.contactCount > 0) {
    return {
      title: 'Anunț performant',
      detail: 'Anunțul generează contacte reale. Răspunde rapid pentru a păstra interesul activ.',
      tone: 'positive',
    };
  }

  return {
    title: 'Începe să aduni date',
    detail: 'Distribuie anunțul și completează toate detaliile pentru a îmbunătăți vizibilitatea.',
    tone: 'action',
  };
}
