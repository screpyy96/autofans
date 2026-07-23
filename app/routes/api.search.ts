import type { ActionFunctionArgs } from 'react-router';
import type { FilterState } from '~/types';
import { LISTING_CARD_IMAGE_TRANSFORM, signListingImages } from '~/utils/listingImages';
import { getSupabaseServerClient } from '~/lib/supabase.server';

const PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;
const SORTS = new Set([
  'relevance', 'price_asc', 'price_desc', 'year_desc', 'year_asc',
  'mileage_asc', 'mileage_desc', 'date_desc', 'date_asc',
]);

/** A search result needs one display image, not every original upload. Keeping
 * the total separately preserves the gallery count on the card while avoiding
 * dozens of signed URLs and JSON entries per results page. */
function toSearchPreview(listing: any) {
  const images = Array.isArray(listing?.images) ? listing.images : [];
  const cover = images.find((image: any) => image?.isMain) || images[0];
  return {
    ...listing,
    images: cover ? [cover] : [],
    image_count: images.length,
  };
}

const asStringArray = (value: unknown, maximum = 20) => {
  if (!Array.isArray(value)) return null;
  const values = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maximum);
  return values.length ? values : null;
};

const asBoundedNumber = (value: unknown, minimum: number, maximum: number) => {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? Math.min(maximum, Math.max(minimum, numeric)) : null;
};

function rangeValue(value: unknown, minimum: number, maximum: number) {
  if (!value || typeof value !== 'object') return { min: null, max: null };
  const range = value as { min?: unknown; max?: unknown };
  return {
    min: asBoundedNumber(range.min, minimum, maximum),
    max: asBoundedNumber(range.max, minimum, maximum),
  };
}

/** Public, paginated catalogue endpoint. It only calls a SECURITY INVOKER RPC
 * which still applies RLS, so the client never receives draft listings. */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST' } });
  }

  let payload: { query?: unknown; filters?: unknown; page?: unknown; pageSize?: unknown; sort?: unknown };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Payload invalid.' }, { status: 400 });
  }

  const rawFilters = payload.filters && typeof payload.filters === 'object'
    ? payload.filters as FilterState
    : {};
  const page = Math.floor(asBoundedNumber(payload.page, 1, 10_000) ?? 1);
  const pageSize = Math.floor(asBoundedNumber(payload.pageSize, 1, MAX_PAGE_SIZE) ?? PAGE_SIZE);
  const sort = typeof payload.sort === 'string' && SORTS.has(payload.sort) ? payload.sort : 'relevance';
  const query = typeof payload.query === 'string' ? payload.query.trim().slice(0, 120) : '';
  const price = rangeValue(rawFilters.priceRange, 0, 10_000_000);
  const year = rangeValue(rawFilters.yearRange, 1886, new Date().getFullYear() + 1);
  const mileage = rangeValue(rawFilters.mileageRange, 0, 5_000_000);
  const location = rawFilters.location;
  const latitude = asBoundedNumber(location?.latitude, -90, 90);
  const longitude = asBoundedNumber(location?.longitude, -180, 180);
  const radius = asBoundedNumber(rawFilters.radius, 1, 1_000);

  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: listings, error, count } = await supabase
    .rpc('search_published_listings', {
      p_query: query || null,
      p_brands: asStringArray(rawFilters.brand),
      p_models: asStringArray(rawFilters.model),
      p_price_min: price.min,
      p_price_max: price.max,
      p_year_min: year.min,
      p_year_max: year.max,
      p_mileage_min: mileage.min,
      p_mileage_max: mileage.max,
      p_fuel_types: asStringArray(rawFilters.fuelType),
      p_transmissions: asStringArray(rawFilters.transmission),
      p_city: typeof location?.city === 'string' ? location.city.slice(0, 100) : null,
      p_county: typeof location?.county === 'string' ? location.county.slice(0, 100) : null,
      p_latitude: latitude,
      p_longitude: longitude,
      p_radius_km: radius,
      p_service_history: rawFilters.hasServiceHistory === true ? true : null,
      p_max_owners: asBoundedNumber(rawFilters.maxOwners, 1, 100),
      p_sort: sort,
    }, { count: 'exact' })
    .select('id, slug, title, description, price, currency, make, model, year, mileage, fuel_type, transmission, vin, vin_verified, history_checked, images, created_at, city, county, latitude, longitude')
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error('catalogue search failed:', error);
    return Response.json({ error: 'Nu am putut încărca anunțurile.' }, { status: 500, headers });
  }

  // Search cards never need original camera files. A compact cover image keeps
  // the first mobile render fast even when sellers upload large photos.
  const previews = (listings || []).map(toSearchPreview);
  const signedMap = await signListingImages(supabase as any, previews, 60 * 60, LISTING_CARD_IMAGE_TRANSFORM);
  const total = count || 0;
  return Response.json({
    listings: previews,
    signedMap,
    total,
    hasMore: page * pageSize < total,
  }, { headers });
}
