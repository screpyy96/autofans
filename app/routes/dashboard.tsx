import { type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "react-router";
import { useLoaderData, Link, Form } from "react-router";
import { getSupabaseServerClient } from "~/lib/supabase.server";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Eye, Heart, Lightbulb, MessageCircle, TrendingUp } from 'lucide-react';
import { formatPrice } from '~/utils/helpers';
import { calculatePriceScore } from '~/utils/priceScore';
import { getSellerRecommendation } from '~/utils/sellerInsights';

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect(`/login?next=${encodeURIComponent(new URL(request.url).pathname)}`, { headers });

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, display_name, email')
    .eq('id', user.id)
    .single();

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
  let performance: Array<any> = [];

  if (isSeller) {
    const [listingsCountResult, recentListingsResult, metricsResult, marketListingsResult] = await Promise.all([
      supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user.id),
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

    const metricsByListing = new Map((metricsResult.data || []).map((metric: any) => [Number(metric.listing_id), {
      viewCount: Number(metric.view_count || 0),
      contactCount: Number(metric.contact_count || 0),
      favoriteCount: Number(metric.favorite_count || 0),
    }]));
    const allMetrics = Array.from(metricsByListing.values());
    sellerMetrics = {
      views: allMetrics.reduce((total, metric) => total + metric.viewCount, 0),
      contacts: allMetrics.reduce((total, metric) => total + metric.contactCount, 0),
      favorites: allMetrics.reduce((total, metric) => total + metric.favoriteCount, 0),
      conversionRate: 0,
    };
    sellerMetrics.conversionRate = sellerMetrics.views ? (sellerMetrics.contacts / sellerMetrics.views) * 100 : 0;

    const marketListings = marketListingsResult.data || [];
    performance = recent.map((listing) => {
      const metrics = metricsByListing.get(Number(listing.id)) || { viewCount: 0, contactCount: 0, favoriteCount: 0 };
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
    });

    // Build signed URLs for main images
    const paths = recent
      .map((l) => (l.images || []).find((img: any) => img.isMain)?.path || (l.images || [])[0]?.path)
      .filter(Boolean) as string[];
    if (paths.length) {
      const { data: signed } = await supabase
        .storage
        .from('listing-images')
        .createSignedUrls(paths, 60 * 60);
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

  const { count: favs } = await supabase
    .from('favorites')
    .select('listing_id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  counts.favorites = favs ?? 0;

  const { count: saved } = await supabase
    .from('saved_searches')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  counts.saved = saved ?? 0;

  return { user, profile, isSeller, counts, recent, thumbs, sellerMetrics, performance };
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
    const { error } = await supabase.from('listings').update({ status: 'published' }).eq('id', id).eq('owner_id', user.id);
    if (error) return { ok: false, error: error.message };
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
  performance: Array<any>;
}

export default function Dashboard() {
  const { profile, isSeller, counts, recent, thumbs, sellerMetrics, performance } = useLoaderData<LoaderData>();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
      <p className="text-gray-300 mb-6">Bun venit, {profile?.display_name || profile?.email}.</p>

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card variant="elevated" padding="lg">
            <h3 className="text-white font-semibold">Anunțurile mele</h3>
            <p className="text-3xl text-accent-gold mt-2">{counts.listings}</p>
            <div className="flex items-center gap-3 mt-2">
              <Link to="/create-listing" className="text-sm text-accent-gold hover:underline inline-block">Creează</Link>
              <Link to="/dashboard/listings" className="text-sm text-accent-gold hover:underline inline-block">Toate anunțurile</Link>
            </div>
          </Card>
          <Card variant="elevated" padding="lg">
            <div className="flex items-center gap-2 text-white font-semibold"><Eye className="h-4 w-4 text-accent-gold" />Vizualizări</div>
            <p className="text-3xl text-accent-gold mt-2">{sellerMetrics.views}</p>
            <p className="mt-1 text-xs text-gray-400">pentru anunțurile tale</p>
          </Card>
          <Card variant="elevated" padding="lg">
            <div className="flex items-center gap-2 text-white font-semibold"><Heart className="h-4 w-4 text-accent-gold" />Favorite primite</div>
            <p className="text-3xl text-accent-gold mt-2">{sellerMetrics.favorites}</p>
            <p className="mt-1 text-xs text-gray-400">interes real din partea cumpărătorilor</p>
          </Card>
          <Card variant="elevated" padding="lg">
            <div className="flex items-center gap-2 text-white font-semibold"><MessageCircle className="h-4 w-4 text-accent-gold" />Contacte</div>
            <p className="text-3xl text-accent-gold mt-2">{sellerMetrics.contacts}</p>
            <p className="mt-1 text-xs text-gray-400">conversie {sellerMetrics.conversionRate.toFixed(1)}%</p>
          </Card>
        </div>
      )}

      {isSeller && performance.length > 0 && (
        <Card variant="elevated" padding="lg" className="mb-8">
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
        <Card variant="elevated" padding="lg">
          <h2 className="text-xl font-semibold text-white mb-4">Anunțuri recente</h2>
          {recent.length === 0 ? (
            <p className="text-gray-400">Încă nu ai anunțuri.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {recent.map((l) => (
                <li key={l.id} className="py-2 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-1">
                    {thumbs?.[l.id] ? (
                      <img src={thumbs[l.id]} alt="thumb" className="w-14 h-14 rounded-lg object-cover border border-white/10" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-white/5 border border-white/10" />
                    )}
                  </div>
                  <div className="md:col-span-5">
                    <p className="text-white font-medium">{l.title}</p>
                    <p className="text-gray-400 text-sm">{l.status} • {new Date(l.updated_at).toLocaleString()}</p>
                  </div>
                  <div className="md:col-span-2 text-accent-gold font-semibold">{formatPrice(Number(l.price), l.currency)}</div>
                  <div className="md:col-span-4 flex gap-2 justify-end items-center">
                    {l.status !== 'published' ? (
                      <Form method="post">
                        <input type="hidden" name="intent" value="publish" />
                        <input type="hidden" name="id" value={String(l.id)} />
                        <Button type="submit" size="sm">Publică</Button>
                      </Form>
                    ) : (
                      <Form method="post">
                        <input type="hidden" name="intent" value="draft" />
                        <input type="hidden" name="id" value={String(l.id)} />
                        <Button type="submit" variant="outline" size="sm">Draft</Button>
                      </Form>
                    )}
                    <Link to={`/create-listing?edit=${l.id}`}>
                      <Button variant="outline" size="sm" className="border-accent-gold/20 text-accent-gold">Editează</Button>
                    </Link>
                    <Form method="post">
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="id" value={String(l.id)} />
                      <Button type="submit" variant="danger" size="sm">Șterge</Button>
                    </Form>
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
