import type { FilterState } from '~/types';
import { normalizeLocationName } from '~/utils/location';

type ListingSignal = {
  id: number;
  make?: string | null;
  model?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  price?: number | null;
  city?: string | null;
  county?: string | null;
  created_at?: string | null;
};

export type Recommendation<T extends ListingSignal> = { listing: T; reason: string; score: number };

export function buildRecommendations<T extends ListingSignal>(input: {
  candidates: T[];
  favorites: ListingSignal[];
  savedSearches: Array<{ query?: FilterState | null; name?: string | null }>;
  limit?: number;
}): Recommendation<T>[] {
  const favoriteIds = new Set(input.favorites.map((listing) => listing.id));

  return input.candidates
    .filter((listing) => !favoriteIds.has(listing.id))
    .map((listing) => {
      let score = 0;
      let reason = '';
      for (const favorite of input.favorites) {
        if (favorite.model && favorite.model === listing.model && favorite.make === listing.make) {
          score += 14; reason ||= `Similară cu ${favorite.make} ${favorite.model}`;
        } else if (favorite.make && favorite.make === listing.make) {
          score += 7; reason ||= `Îți place marca ${favorite.make}`;
        }
        if (favorite.fuel_type && favorite.fuel_type === listing.fuel_type) score += 2;
        if (favorite.transmission && favorite.transmission === listing.transmission) score += 2;
      }
      for (const search of input.savedSearches) {
        const filters = search.query || {};
        if (filters.model?.includes(listing.model || '')) { score += 10; reason ||= `Potrivită pentru „${search.name || 'căutarea ta'}”`; }
        else if (filters.brand?.includes(listing.make || '')) { score += 6; reason ||= `Potrivită pentru „${search.name || 'căutarea ta'}”`; }
        if (filters.fuelType?.includes(listing.fuel_type as any)) score += 3;
        if (filters.transmission?.includes(listing.transmission as any)) score += 3;
        if (filters.priceRange && (listing.price ?? 0) >= filters.priceRange.min && (listing.price ?? 0) <= filters.priceRange.max) score += 4;
        if (filters.location && (
          normalizeLocationName(filters.location.city) === normalizeLocationName(listing.city || '') ||
          normalizeLocationName(filters.location.county || '') === normalizeLocationName(listing.county || '')
        )) score += 3;
      }
      const ageInDays = listing.created_at ? (Date.now() - new Date(listing.created_at).getTime()) / 86_400_000 : 99;
      if (ageInDays <= 7) score += 1;
      return { listing, reason, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || String(b.listing.created_at || '').localeCompare(String(a.listing.created_at || '')))
    .slice(0, input.limit || 6);
}
