export type PriceLevel = 'below_market' | 'fair' | 'above_market' | 'insufficient';

export interface PriceComparable {
  id?: string | number;
  price: number | string | null;
  currency?: string | null;
  year?: number | null;
  mileage?: number | null;
}

export interface PriceScore {
  available: boolean;
  level: PriceLevel;
  label: string;
  comparableCount: number;
  marketMedian?: number;
  differencePercent?: number;
  recommendedOffer?: number;
  monthlyPayment: number;
  currency: string;
  assumptions: {
    downPaymentPercent: number;
    annualInterestRate: number;
    termMonths: number;
  };
}

// Keep this aligned with the display conversion used by formatPrice.
const EUR_TO_RON = 5;
const DEFAULT_ASSUMPTIONS = {
  downPaymentPercent: 20,
  annualInterestRate: 7.5,
  termMonths: 60,
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number | null {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  if (from === to) return amount;
  if (from === 'EUR' && to === 'RON') return amount * EUR_TO_RON;
  if (from === 'RON' && to === 'EUR') return amount / EUR_TO_RON;
  return null;
}

function calculateMonthlyPayment(price: number): number {
  const financedAmount = price * (1 - DEFAULT_ASSUMPTIONS.downPaymentPercent / 100);
  const monthlyRate = DEFAULT_ASSUMPTIONS.annualInterestRate / 100 / 12;
  const term = DEFAULT_ASSUMPTIONS.termMonths;
  return financedAmount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
}

export function calculatePriceScore(
  listing: PriceComparable & { currency?: string | null },
  comparables: PriceComparable[],
): PriceScore {
  const currency = String(listing.currency || 'EUR').toUpperCase();
  const price = Number(listing.price || 0);
  const validComparablePrices = comparables
    .map((comparable) => convertCurrency(Number(comparable.price || 0), String(comparable.currency || currency), currency))
    .filter((comparablePrice): comparablePrice is number => Number.isFinite(comparablePrice) && comparablePrice > 0);
  const comparableCount = validComparablePrices.length;

  const baseScore: Omit<PriceScore, 'available' | 'level' | 'label' | 'marketMedian' | 'differencePercent' | 'recommendedOffer'> = {
    comparableCount,
    monthlyPayment: price > 0 ? calculateMonthlyPayment(price) : 0,
    currency,
    assumptions: DEFAULT_ASSUMPTIONS,
  };

  if (price <= 0 || comparableCount < 3) {
    return {
      ...baseScore,
      available: false,
      level: 'insufficient',
      label: 'Date insuficiente',
    };
  }

  const marketMedian = median(validComparablePrices);
  const differencePercent = ((price - marketMedian) / marketMedian) * 100;
  const level: PriceLevel = differencePercent <= -8 ? 'below_market' : differencePercent >= 8 ? 'above_market' : 'fair';

  return {
    ...baseScore,
    available: true,
    level,
    label: level === 'below_market' ? 'Sub piață' : level === 'above_market' ? 'Peste piață' : 'Preț corect',
    marketMedian,
    differencePercent,
    recommendedOffer: level === 'above_market' ? marketMedian * 0.96 : undefined,
  };
}
