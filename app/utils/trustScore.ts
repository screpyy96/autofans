export type TrustLevel = 'verified' | 'good' | 'basic';

export interface TrustScore {
  score: number;
  level: TrustLevel;
  label: string;
  signals: {
    sellerVerified: boolean;
    vinProvided: boolean;
    vinVerified: boolean;
    historyChecked: boolean;
    completeListing: boolean;
  };
}

export function calculateTrustScore(listing: any, seller?: any): TrustScore {
  const signals = {
    sellerVerified: Boolean(seller?.is_verified),
    vinProvided: Boolean(String(listing?.vin || '').trim()),
    vinVerified: Boolean(listing?.vin_verified),
    historyChecked: Boolean(listing?.history_checked),
    completeListing: Boolean(listing?.description && listing?.price && listing?.year && listing?.make && listing?.model),
  };

  const score = Math.min(100,
    (signals.sellerVerified ? 30 : 0) +
    (signals.vinVerified ? 30 : signals.vinProvided ? 10 : 0) +
    (signals.historyChecked ? 25 : 0) +
    (signals.completeListing ? 15 : 0),
  );

  const level: TrustLevel = score >= 80 ? 'verified' : score >= 45 ? 'good' : 'basic';
  return {
    score,
    level,
    label: level === 'verified' ? 'Verificat' : level === 'good' ? 'Încredere bună' : 'De verificat',
    signals,
  };
}
