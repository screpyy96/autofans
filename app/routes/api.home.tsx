import type { LoaderFunctionArgs } from 'react-router';
import { getSupabaseServerClient, hasSupabaseAuthCookie } from '~/lib/supabase.server';
import { LISTING_CARD_IMAGE_TRANSFORM, signListingImages } from '~/utils/listingImages';
import { buildRecommendations } from '~/utils/recommendations';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { supabase } = getSupabaseServerClient(request);
    const { data: { user } } = hasSupabaseAuthCookie(request)
      ? await supabase.auth.getUser()
      : { data: { user: null } };
    const [publishedCountResult, brandRowsResult, listingsResult] = await Promise.all([
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('listings').select('make').eq('status', 'published').not('make', 'is', null).limit(500),
      supabase.from('listings')
        .select('id, slug, owner_id, title, description, price, currency, make, model, year, mileage, fuel_type, transmission, vin, vin_verified, history_checked, images, created_at, city, county, latitude, longitude')
        .eq('status', 'published').order('created_at', { ascending: false }).limit(6),
    ]);

    let favoriteListings: any[] = [];
    let savedSearches: any[] = [];
    let recommendationListings: any[] = [];
    if (user) {
      const [{ data: favoriteRows }, { data: searches }, { data: candidates }] = await Promise.all([
        supabase.from('favorites').select('listing_id').eq('user_id', user.id),
        supabase.from('saved_searches').select('name, query').eq('user_id', user.id).limit(20),
        supabase.from('listings')
          .select('id, slug, owner_id, title, description, price, currency, make, model, year, mileage, fuel_type, transmission, vin, vin_verified, history_checked, images, created_at, city, county, latitude, longitude, service_history, owners')
          .eq('status', 'published').order('created_at', { ascending: false }).limit(60),
      ]);
      const favoriteIds = (favoriteRows || []).map((row: any) => row.listing_id);
      if (favoriteIds.length) {
        const { data } = await supabase.from('listings')
          .select('id, make, model, fuel_type, transmission, price, city, county, created_at')
          .in('id', favoriteIds).eq('status', 'published');
        favoriteListings = data || [];
      }
      savedSearches = searches || [];
      recommendationListings = candidates || [];
    }

    const listings = listingsResult.data || [];
    const recommendations = buildRecommendations({ candidates: recommendationListings, favorites: favoriteListings, savedSearches, limit: 6 });
    const signedMap = await signListingImages(
      supabase as any,
      [...listings, ...recommendations.map((item) => item.listing)],
      60 * 60,
      LISTING_CARD_IMAGE_TRANSFORM,
    );
    const brandCounts = (brandRowsResult.data || []).reduce((acc: Record<string, number>, row: any) => {
      if (row.make) acc[row.make] = (acc[row.make] || 0) + 1;
      return acc;
    }, {});
    const brands = Object.entries(brandCounts)
      .map(([name, count]) => ({ name, count: count as number }))
      .sort((a, b) => b.count - a.count).slice(0, 8);

    // Anonymous visitors receive the same catalogue. Let the CDN serve that
    // short-lived response, while a signed-in visitor's favourites/recommendations
    // remain strictly private.
    const headers = user
      ? { 'Cache-Control': 'private, no-store', Vary: 'Cookie' }
      : { 'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300', Vary: 'Cookie' };
    return Response.json({ listings, recommendations, signedMap, publishedCount: publishedCountResult.count || 0, brands }, { headers });
  } catch (error) {
    console.error('home catalog error:', error);
    return Response.json({ listings: [], recommendations: [], signedMap: {}, publishedCount: 0, brands: [] }, { status: 500 });
  }
}
