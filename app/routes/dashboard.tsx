import { type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "react-router";
import { useLoaderData, Link, Form } from "react-router";
import { getSupabaseServerClient } from "~/lib/supabase.server";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Car, Eye, Heart, Lightbulb, MessageCircle, TrendingUp } from 'lucide-react';
import { formatPrice } from '~/utils/helpers';
import { calculatePriceScore } from '~/utils/priceScore';
import { getSellerRecommendation } from '~/utils/sellerInsights';
import { DeleteListingControl } from '~/components/listing/DeleteListingControl';
import { formatListingUpdatedAt, listingStatusLabel } from '~/utils/listingStatus';
import { formatActivityWindow } from '~/utils/dashboardActivity';
import { publishOwnedListing } from '~/utils/publishListing.server';

export function meta() {
  return [
    { title: 'Dashboard vânzător - AutoFans.ro' },
    { name: 'robots', content: 'noindex,nofollow' },
  ];
}

type ListingMetrics = {
  viewCount: number;
  contactCount: number;
  favoriteCount: number;
};

type RecentActivity = {
  views: { current: number; previous: number };
  contacts: { current: number; previous: number };
};

type MetricsAvailability = 'available' | 'unavailable';

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect(`/login?next=${encodeURIComponent(new URL(request.url).pathname)}`, { headers });

  // These account counters are independent of the seller data below. Fetching
  // them together removes two sequential database round-trips from the
  // dashboard's critical path.
  const [profileResult, favoritesCountResult, savedSearchesCountResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, role, display_name, email')
      .eq('id', user.id)
      .single(),
    supabase
      .from('favorites')
      .select('listing_id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('saved_searches')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);
  const profile = profileResult.data;

  if (!profile) {
    const { data: newUserProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        role: 'buyer',
      })
      .select('id, role, display_name, email')
      .single();

    if (insertError) {
      // Handle the insert error, maybe log it or throw an error
      console.error('Error creating profile:', insertError);
      // For now, we'll throw an error to prevent proceeding with a null profile
      throw new Response("Could not create user profile.", { status: 500 });
    }
    // The component will now receive the newly created profile
    return { user, profile: newUserProfile, isSeller: false, counts: { listings: 0, favorites: 0, saved: 0 }, recent: [], sellerMetrics: { views: 0, contacts: 0, favorites: 0, conversionRate: 0 }, performance: [] };
  }

  const isSeller = profile?.role === 'seller';

  // Default counts
  let counts = { listings: 0, favorites: 0, saved: 0 };
  let recent: Array<{ id: number; title: string; price: number; currency: string; status: string; updated_at: string; make?: string; model?: string; year?: number; mileage?: number; images?: { path: string; isMain?: boolean }[] }> = [];
  let thumbs: Record<number, string> = {};
  let sellerMetrics = { views: 0, contacts: 0, favorites: 0, conversionRate: 0 };
  let recentActivity: RecentActivity = {
    views: { current: 0, previous: 0 },
    contacts: { current: 0, previous: 0 },
  };
  let metricsAvailability: MetricsAvailability = 'available';
  let performance: Array<any> = [];

  if (isSeller) {
    const [listingsCountResult, recentListingsResult, metricsResult, marketListingsResult] = await Promise.all([
      supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user.id)
        .eq('status', 'published'),
      supabase
        .from('listings')
        .select('id, title, price, currency, status, updated_at, make, model, year, mileage, images')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5),
      supabase.rpc('get_seller_listing_metrics'),
      supabase
        .from('listings')
        .select('id, price, currency, make, model, year, mileage')
        .eq('status', 'published')
        .limit(500),
    ]);
    const listingsCount = listingsCountResult.count;
    counts.listings = listingsCount ?? 0;
    recent = recentListingsResult.data ?? [];

    if (metricsResult.error) {
      // A failed aggregation is not zero interest. Keep the seller-facing UI
      // explicit instead of silently replacing unavailable data with 0.
      console.error('Could not load seller metrics:', metricsResult.error);
      metricsAvailability = 'unavailable';
    }
    const metricsByListing = new Map<number, ListingMetrics>((metricsResult.data || []).map((metric: any) => [Number(metric.listing_id), {
      viewCount: Number(metric.view_count || 0),
      contactCount: Number(metric.contact_count || 0),
      favoriteCount: Number(metric.favorite_count || 0),
    }]));
    const allMetrics: ListingMetrics[] = Array.from(metricsByListing.values());
    sellerMetrics = {
      views: allMetrics.reduce((total, metric) => total + metric.viewCount, 0),
      contacts: allMetrics.reduce((total, metric) => total + metric.contactCount, 0),
      favorites: allMetrics.reduce((total, metric) => total + metric.favoriteCount, 0),
      conversionRate: 0,
    };
    sellerMetrics.conversionRate = sellerMetrics.views ? (sellerMetrics.contacts / sellerMetrics.views) * 100 : 0;

    // Keep dashboard trends truthful: compare two completed, equal seven-day
    // windows instead of presenting a cumulative total as a recent result.
    const listingIds = Array.from(metricsByListing.keys());
    if (listingIds.length) {
      const now = new Date();
      const currentWindowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const previousWindowStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const [currentViews, previousViews, currentContacts, previousContacts] = await Promise.all([
        supabase.from('listing_views').select('id', { count: 'exact', head: true }).in('listing_id', listingIds).gte('created_at', currentWindowStart),
        supabase.from('listing_views').select('id', { count: 'exact', head: true }).in('listing_id', listingIds).gte('created_at', previousWindowStart).lt('created_at', currentWindowStart),
        supabase.from('listing_contacts').select('id', { count: 'exact', head: true }).in('listing_id', listingIds).gte('created_at', currentWindowStart),
        supabase.from('listing_contacts').select('id', { count: 'exact', head: true }).in('listing_id', listingIds).gte('created_at', previousWindowStart).lt('created_at', currentWindowStart),
      ]);
      if (currentViews.error || previousViews.error || currentContacts.error || previousContacts.error) {
        console.error('Could not load recent seller activity:', currentViews.error || previousViews.error || currentContacts.error || previousContacts.error);
        metricsAvailability = 'unavailable';
      } else {
        recentActivity = {
          views: { current: currentViews.count ?? 0, previous: previousViews.count ?? 0 },
          contacts: { current: currentContacts.count ?? 0, previous: previousContacts.count ?? 0 },
        };
      }
    }

    const marketListings = marketListingsResult.data || [];
    performance = metricsAvailability === 'available' ? recent.map((listing) => {
      const metrics: ListingMetrics = metricsByListing.get(Number(listing.id)) || { viewCount: 0, contactCount: 0, favoriteCount: 0 };
      const comparables = listing.status === 'published'
        ? marketListings.filter((comparable: any) => comparable.id !== listing.id && comparable.make === listing.make && comparable.model === listing.model && Math.abs(Number(comparable.year || 0) - Number(listing.year || 0)) <= 3)
        : [];
      const priceScore = listing.status === 'published' ? calculatePriceScore(listing, comparables) : null;
      return {
        ...listing,
        ...metrics,
        conversionRate: metrics.viewCount ? (metrics.contactCount / metrics.viewCount) * 100 : 0,
        recommendation: getSellerRecommendation(metrics, priceScore),
      };
    }) : [];

    // Build signed URLs for main images
    const paths = recent
      .map((l) => (l.images || []).find((img: any) => img.isMain)?.path || (l.images || [])[0]?.path)
      .filter(Boolean) as string[];
    if (paths.length) {
      const { data: signed } = await (supabase.storage
        .from('listing-images') as any)
        .createSignedUrls(paths, 60 * 60, {
          transform: { width: 480, height: 360, quality: 68, resize: 'cover' },
        });
      const map: Record<string, string> = {};
      for (const item of signed || []) {
        if ((item as any)?.path && (item as any)?.signedUrl) map[(item as any).path] = (item as any).signedUrl as string;
      }
      recent.forEach((l) => {
        const p = (l.images || []).find((img: any) => img.isMain)?.path || (l.images || [])[0]?.path;
        if (p && map[p]) thumbs[l.id] = map[p];
      });
    }
  }

  counts.favorites = favoritesCountResult.count ?? 0;
  counts.saved = savedSearchesCountResult.count ?? 0;

  return { user, profile, isSeller, counts, recent, thumbs, sellerMetrics, recentActivity, metricsAvailability, performance };
}

export async function action({ request }: ActionFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login', { headers });

  const form = await request.formData();
  const intent = String(form.get('intent') || '');
  const id = form.get('id') ? Number(form.get('id')) : undefined;

  if (intent === 'promote') {
    const { error } = await supabase.rpc('promote_to_seller');
    if (error) {
      return { ok: false, error: error.message };
    }
    return redirect('/dashboard', { headers });
  }

  if (intent === 'publish' && id) {
    const result = await publishOwnedListing(supabase, user.id, id);
    if (!result.ok) return result;
    return redirect('/dashboard', { headers });
  }
  if (intent === 'draft' && id) {
    const { error } = await supabase.from('listings').update({ status: 'draft' }).eq('id', id).eq('owner_id', user.id);
    if (error) return { ok: false, error: error.message };
    return redirect('/dashboard', { headers });
  }
  if (intent === 'delete' && id) {
    const { error } = await supabase.from('listings').delete().eq('id', id).eq('owner_id', user.id);
    if (error) return { ok: false, error: error.message };
    return redirect('/dashboard', { headers });
  }

  return { ok: true };
}

interface LoaderData {
  user: any;
  profile: {
    id: string;
    role: string;
    display_name: string | null;
    email: string | undefined;
  } | null;
  isSeller: boolean;
  counts: {
    listings: number;
    favorites: number;
    saved: number;
  };
  recent: Array<{ id: number; title: string; price: number; currency: string; status: string; updated_at: string; make?: string; model?: string; year?: number; mileage?: number; images?: { path: string; isMain?: boolean }[] }>;
  thumbs: Record<number, string>;
  sellerMetrics: { views: number; contacts: number; favorites: number; conversionRate: number };
  recentActivity: RecentActivity;
  metricsAvailability: MetricsAvailability;
  performance: Array<any>;
}

export default function Dashboard() {
  const { profile, isSeller, counts, recent, thumbs, sellerMetrics, recentActivity, metricsAvailability, performance } = useLoaderData<LoaderData>();
  const metricsAvailable = metricsAvailability === 'available';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
      <h1 className="mb-1 text-2xl font-bold text-white sm:mb-2 sm:text-3xl">Dashboard</h1>
      <p className="mb-5 text-sm text-gray-300 sm:mb-6 sm:text-base">Bun venit, {profile?.display_name || profile?.email}.</p>

      {!isSeller ? (
        <Card variant="elevated" padding="lg" className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-2">Devino vânzător</h2>
          <p className="text-gray-300 mb-4">Activează-ți contul de vânzător pentru a putea publica anunțuri.</p>
          <Form method="post">
            <input type="hidden" name="intent" value="promote" />
            <Button type="submit" className="bg-gold-gradient text-secondary-900">Devino vânzător</Button>
          </Form>
        </Card>
      ) : (
        <div className="mb-6 sm:mb-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Card variant="elevated" padding="none" className="min-h-[118px] p-4 sm:min-h-0 sm:p-6">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-300 sm:text-sm"><Car className="h-4 w-4 text-accent-gold" />Anunțuri active</div>
              <p className="mt-2 text-3xl font-semibold leading-none text-accent-gold">{counts.listings}</p>
              <p className="mt-2 text-xs text-gray-400">publicate acum</p>
            </Card>
            <Card variant="elevated" padding="none" className="min-h-[118px] p-4 sm:min-h-0 sm:p-6">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-300 sm:text-sm"><Eye className="h-4 w-4 text-accent-gold" />Vizualizări totale</div>
              <p className="mt-2 text-3xl font-semibold leading-none text-accent-gold">{metricsAvailable ? sellerMetrics.views : '—'}</p>
              <p className="mt-2 text-xs leading-5 text-gray-400">{metricsAvailable ? formatActivityWindow(recentActivity.views) : 'date indisponibile momentan'}</p>
            </Card>
            <Card variant="elevated" padding="none" className="min-h-[118px] p-4 sm:min-h-0 sm:p-6">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-300 sm:text-sm"><Heart className="h-4 w-4 text-accent-gold" />Salvări primite</div>
              <p className="mt-2 text-3xl font-semibold leading-none text-accent-gold">{metricsAvailable ? sellerMetrics.favorites : '—'}</p>
              <p className="mt-2 text-xs text-gray-400">{metricsAvailable ? 'interes primit' : 'date indisponibile momentan'}</p>
            </Card>
            <Card variant="elevated" padding="none" className="min-h-[118px] p-4 sm:min-h-0 sm:p-6">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-300 sm:text-sm"><MessageCircle className="h-4 w-4 text-accent-gold" />Contactări</div>
              <p className="mt-2 text-3xl font-semibold leading-none text-accent-gold">{metricsAvailable ? sellerMetrics.contacts : '—'}</p>
              <p className="mt-2 text-xs leading-5 text-gray-400">{metricsAvailable ? `${formatActivityWindow(recentActivity.contacts)} · conversie ${sellerMetrics.conversionRate.toFixed(1)}%` : 'date indisponibile momentan'}</p>
            </Card>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:flex sm:justify-end">
            <Link to="/dashboard/listings" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/5">Gestionează</Link>
            <Link to="/create-listing" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gold-gradient px-4 text-sm font-bold text-secondary-900 transition-transform hover:scale-[1.01]">Adaugă anunț</Link>
          </div>
        </div>
      )}

      {isSeller && !metricsAvailable && (
        <Card variant="outlined" padding="none" className="mb-6 border-accent-gold/25 bg-accent-gold/5 p-4 sm:mb-8 sm:p-5">
          <p className="font-semibold text-white">Statisticile sunt momentan indisponibile.</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-300">Anunțurile tale rămân active. Reîncarcă pagina mai târziu pentru datele actualizate.</p>
        </Card>
      )}

      {isSeller && performance.length > 0 && (
        <Card variant="elevated" padding="none" className="mb-6 p-4 sm:mb-8 sm:p-8">
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent-gold" />
            <div>
              <h2 className="text-xl font-semibold text-white">Performanța anunțurilor</h2>
              <p className="text-sm text-gray-400">Ultimele anunțuri și următoarea acțiune recomandată.</p>
            </div>
          </div>
          <div className="space-y-3">
            {performance.map((listing) => (
              <div key={listing.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{listing.title}</p>
                    <p className="mt-1 text-sm text-accent-gold">{formatPrice(Number(listing.price), listing.currency)}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-300">
                    <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-accent-gold" />{listing.viewCount}</span>
                    <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-accent-gold" />{listing.favoriteCount}</span>
                    <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5 text-accent-gold" />{listing.contactCount}</span>
                    <span>Conversie {listing.conversionRate.toFixed(1)}%</span>
                  </div>
                </div>
                <div className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${listing.recommendation.tone === 'positive' ? 'bg-emerald-400/10 text-emerald-200' : 'bg-accent-gold/10 text-gray-200'}`}>
                  <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-gold" />
                  <p><strong>{listing.recommendation.title}.</strong> {listing.recommendation.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {isSeller && (
        <Card variant="elevated" padding="none" className="p-4 sm:p-8">
          <h2 className="mb-4 text-lg font-semibold text-white sm:text-xl">Anunțuri recente</h2>
          {recent.length === 0 ? (
            <p className="text-gray-400">Încă nu ai anunțuri.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {recent.map((l) => (
                <li key={l.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 py-4 first:pt-0 md:grid-cols-12 md:items-center">
                  <div className="md:col-span-1">
                    {thumbs?.[l.id] ? (
                      <img src={thumbs[l.id]} alt={l.title} className="w-14 h-14 rounded-lg object-cover border border-white/10" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-white/5 border border-white/10" />
                    )}
                  </div>
                  <div className="min-w-0 md:col-span-5">
                    <p className="text-white font-medium">{l.title}</p>
                    <p className="text-gray-400 text-sm">{listingStatusLabel(l.status)} · {formatListingUpdatedAt(l.updated_at)}</p>
                  </div>
                  <div className="col-span-2 text-sm font-semibold text-accent-gold md:col-span-2 md:text-base">{formatPrice(Number(l.price), l.currency)}</div>
                  <div className="col-span-2 grid grid-cols-3 gap-2 md:col-span-4 md:flex md:items-center md:justify-end">
                    {l.status !== 'published' ? (
                      <Form method="post">
                        <input type="hidden" name="intent" value="publish" />
                        <input type="hidden" name="id" value={String(l.id)} />
                        <Button type="submit" size="sm" className="w-full md:w-auto">Publică</Button>
                      </Form>
                    ) : (
                      <Form method="post">
                        <input type="hidden" name="intent" value="draft" />
                        <input type="hidden" name="id" value={String(l.id)} />
                        <Button type="submit" variant="outline" size="sm" className="w-full md:w-auto">Draft</Button>
                      </Form>
                    )}
                    <Button asChild variant="outline" size="sm" className="w-full border-accent-gold/20 text-accent-gold md:w-auto">
                      <Link to={`/create-listing?edit=${l.id}`}>Editează</Link>
                    </Button>
                    <DeleteListingControl listingId={l.id} className="w-full md:w-auto" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
