import { mapListingToCar } from '~/utils/listingMapper';
import { LISTING_CARD_IMAGE_TRANSFORM, signListingImages } from '~/utils/listingImages';
import {
  CITY_INDEX_THRESHOLD,
  COUNTY_INDEX_THRESHOLD,
  LOCAL_PAGE_SIZE,
  MOLDOVA_COUNTIES,
  countyBySlug,
  slugifyLocation,
  type MoldovaCounty,
} from '~/utils/localSeo';

const LISTING_FIELDS = 'id, slug, owner_id, title, description, price, currency, make, model, year, mileage, fuel_type, transmission, images, status, created_at, city, county, latitude, longitude, features, owners, service_history';

export type LocalInventoryStat = {
  county: string;
  city: string;
  listing_count: number;
};

export type LocalCountySummary = MoldovaCounty & {
  listingCount: number;
  cities: Array<{ name: string; slug: string; listingCount: number }>;
  isIndexable: boolean;
};

export type ResolvedLocalLocation = {
  county: MoldovaCounty;
  city: { name: string; slug: string; listingCount: number } | null;
  listingCount: number;
  isIndexable: boolean;
};

type SupabaseLike = {
  from: (table: string) => any;
  rpc: (functionName: string, args?: Record<string, unknown>) => any;
  storage: { from: (bucket: string) => { createSignedUrls: (...args: any[]) => Promise<any> } };
};

function normalizeStat(row: any): LocalInventoryStat | null {
  const county = typeof row?.county === 'string' ? row.county.trim() : '';
  const city = typeof row?.city === 'string' ? row.city.trim() : '';
  const listingCount = Number(row?.listing_count);
  if (!county || !city || !Number.isFinite(listingCount) || listingCount < 1) return null;
  return { county, city, listing_count: listingCount };
}

export async function getMoldovaInventoryStats(supabase: SupabaseLike) {
  const { data, error } = await supabase.rpc('get_public_inventory_location_stats');
  if (error) throw error;

  const countyNames = new Set(MOLDOVA_COUNTIES.map((county) => county.name.toLocaleLowerCase('ro-RO')));
  return ((data || []) as unknown[])
    .map(normalizeStat)
    .filter((stat): stat is LocalInventoryStat => Boolean(stat))
    .filter((stat) => countyNames.has(stat.county.toLocaleLowerCase('ro-RO')));
}

export function getMoldovaCountySummaries(stats: LocalInventoryStat[]): LocalCountySummary[] {
  return MOLDOVA_COUNTIES.map((county) => {
    const countyStats = stats.filter((stat) => stat.county.localeCompare(county.name, 'ro', { sensitivity: 'accent' }) === 0);
    const cities = countyStats
      .map((stat) => ({ name: stat.city, slug: slugifyLocation(stat.city), listingCount: stat.listing_count }))
      .filter((city) => city.listingCount >= CITY_INDEX_THRESHOLD)
      .sort((left, right) => right.listingCount - left.listingCount || left.name.localeCompare(right.name, 'ro'));
    const listingCount = countyStats.reduce((total, stat) => total + stat.listing_count, 0);
    return { ...county, listingCount, cities, isIndexable: listingCount >= COUNTY_INDEX_THRESHOLD };
  });
}

export function resolveLocalLocation(stats: LocalInventoryStat[], countySlug: string | undefined, citySlug?: string | undefined): ResolvedLocalLocation | null {
  const county = countyBySlug(countySlug);
  if (!county) return null;
  const summary = getMoldovaCountySummaries(stats).find((item) => item.slug === county.slug);
  if (!summary) return null;
  if (!citySlug) {
    return { county, city: null, listingCount: summary.listingCount, isIndexable: summary.isIndexable };
  }
  const cityStat = stats.find((stat) => (
    stat.county.localeCompare(county.name, 'ro', { sensitivity: 'accent' }) === 0
    && slugifyLocation(stat.city) === citySlug
  ));
  if (!cityStat) return null;
  const city = { name: cityStat.city, slug: citySlug, listingCount: cityStat.listing_count };
  return { county, city, listingCount: city.listingCount, isIndexable: city.listingCount >= CITY_INDEX_THRESHOLD };
}

export async function loadLocalInventory(
  supabase: SupabaseLike,
  location: ResolvedLocalLocation,
  page: number,
) {
  let query = supabase
    .from('listings')
    .select(LISTING_FIELDS, { count: 'exact' })
    .eq('status', 'published')
    .eq('county', location.county.name)
    .order('created_at', { ascending: false });
  if (location.city) query = query.eq('city', location.city.name);
  const { data: listings, error, count } = await query.range((page - 1) * LOCAL_PAGE_SIZE, page * LOCAL_PAGE_SIZE - 1);
  if (error) throw error;
  const signedMap = await signListingImages(supabase, listings || [], 60 * 60, LISTING_CARD_IMAGE_TRANSFORM);
  return {
    cars: (listings || []).map((listing: any) => mapListingToCar(listing, signedMap)),
    total: Number(count || 0),
  };
}

export function parseLocalPage(value: string | null) {
  const parsed = Number(value || '1');
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 100 ? parsed : 1;
}
