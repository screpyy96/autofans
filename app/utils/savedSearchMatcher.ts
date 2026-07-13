import type { FilterState } from '~/types';
import { distanceInKm, normalizeLocationName } from '~/utils/location';

type AlertListing = {
  title?: string | null;
  description?: string | null;
  make?: string | null;
  model?: string | null;
  price?: number | null;
  year?: number | null;
  mileage?: number | null;
  fuel_type?: string | null;
  transmission?: string | null;
  city?: string | null;
  county?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  images?: unknown[] | null;
  service_history?: boolean | null;
  owners?: number | null;
};

export function matchesSavedSearch(listing: AlertListing, filters: FilterState): boolean {
  const query = filters.query?.trim().toLowerCase();
  if (query) {
    const text = [listing.title, listing.description, listing.make, listing.model].filter(Boolean).join(' ').toLowerCase();
    if (!query.split(/\s+/).every((term) => text.includes(term))) return false;
  }
  if (filters.brand?.length && !filters.brand.includes(listing.make || '')) return false;
  if (filters.model?.length && !filters.model.includes(listing.model || '')) return false;
  if (filters.priceRange && ((listing.price ?? 0) < filters.priceRange.min || (listing.price ?? 0) > filters.priceRange.max)) return false;
  if (filters.yearRange && ((listing.year ?? 0) < filters.yearRange.min || (listing.year ?? 0) > filters.yearRange.max)) return false;
  if (filters.mileageRange && ((listing.mileage ?? 0) < filters.mileageRange.min || (listing.mileage ?? 0) > filters.mileageRange.max)) return false;
  if (filters.fuelType?.length && !filters.fuelType.includes(listing.fuel_type as any)) return false;
  if (filters.transmission?.length && !filters.transmission.includes(listing.transmission as any)) return false;
  if (filters.hasImages && !listing.images?.length) return false;
  if (filters.hasServiceHistory && !listing.service_history) return false;
  if (filters.maxOwners && (listing.owners ?? Number.POSITIVE_INFINITY) > filters.maxOwners) return false;

  if (filters.location) {
    const listingLocation = { city: listing.city || '', latitude: listing.latitude ?? undefined, longitude: listing.longitude ?? undefined };
    if (filters.radius) {
      const distance = distanceInKm(filters.location, listingLocation);
      if (distance === null || distance > filters.radius) return false;
    } else if (
      normalizeLocationName(listing.city || '') !== normalizeLocationName(filters.location.city) &&
      normalizeLocationName(listing.county || '') !== normalizeLocationName(filters.location.county || '')
    ) return false;
  }
  return true;
}
