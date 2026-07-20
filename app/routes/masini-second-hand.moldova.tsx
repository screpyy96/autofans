import { Link, useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { ArrowRight, MapPinned, Search, ShieldCheck } from 'lucide-react';
import { CarGrid } from '~/components/car/CarGrid';
import { Card } from '~/components/ui/Card';
import { getSupabaseServerClient } from '~/lib/supabase.server';
import { DOMAIN, MOLDOVA_COUNTIES, MOLDOVA_GUIDES, countyUrl } from '~/utils/localSeo';
import { getMoldovaCountySummaries, getMoldovaInventoryStats } from '~/utils/localSeo.server';
import { signListingImages } from '~/utils/listingImages';
import { mapListingToCar } from '~/utils/listingMapper';

const LISTING_FIELDS = 'id, slug, owner_id, title, description, price, currency, make, model, year, mileage, fuel_type, transmission, images, status, created_at, city, county, latitude, longitude, features, owners, service_history';

export function headers() {
  return {
    "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
  };
}

export function meta({ data }: any) {
  const title = 'Mașini second-hand în Moldova | Suceava, Iași, Bacău și alte județe | AutoFans';
  const description = 'Caută mașini second-hand în Moldova: Suceava, Iași, Botoșani, Neamț, Bacău, Vaslui, Vrancea și Galați. Compară anunțuri auto locale pe AutoFans.';
  const canonicalUrl = `${DOMAIN}/masini-second-hand/moldova`;
  return [
    { title },
    { name: 'description', content: description },
    { name: 'robots', content: data?.hasInventory ? 'index,follow,max-image-preview:large' : 'noindex,follow' },
    { tagName: 'link', rel: 'canonical', href: canonicalUrl },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase } = getSupabaseServerClient(request);
  const stats = await getMoldovaInventoryStats(supabase as any);
  const counties = getMoldovaCountySummaries(stats);
  const countyNames = MOLDOVA_COUNTIES.map((county) => county.name);
  const { data: listings, error } = await supabase
    .from('listings')
    .select(LISTING_FIELDS)
    .eq('status', 'published')
    .in('county', countyNames)
    .order('created_at', { ascending: false })
    .limit(8);
  if (error) throw error;
  const signedMap = await signListingImages(supabase as any, listings || [], 60 * 60, {
    width: 720, height: 450, quality: 70, resize: 'cover',
  });
  return { counties, hasInventory: counties.some((county) => county.isIndexable), cars: (listings || []).map((listing: any) => mapListingToCar(listing, signedMap)) };
}

export default function MoldovaInventoryHub() {
  const { counties, cars } = useLoaderData<typeof loader>();
  const activeCounties = counties.filter((county) => county.isIndexable);
  const totalListings = counties.reduce((total, county) => total + county.listingCount, 0);
  const hubSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${DOMAIN}/masini-second-hand/moldova#collection`,
    name: 'Mașini second-hand în Moldova',
    url: `${DOMAIN}/masini-second-hand/moldova`,
    inLanguage: 'ro-RO',
  };

  return (
    <div className="min-h-screen bg-secondary-950 pb-20 pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(hubSchema) }} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-premium-gradient px-6 py-12 shadow-card sm:px-10 sm:py-16">
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-accent-gold/10 blur-3xl" aria-hidden="true" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-gold/30 bg-accent-gold/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-accent-gold"><MapPinned className="h-3.5 w-3.5" /> Găsește local</span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-5xl">Mașini second-hand în Moldova</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg">Anunțuri auto din Suceava, Iași, Botoșani, Neamț, Bacău, Vaslui, Vrancea și Galați. Compară mașini reale, aproape de tine.</p>
            <div className="mt-7 flex flex-wrap gap-3"><span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-gray-200"><ShieldCheck className="h-4 w-4 text-accent-gold" /> {totalListings} anunțuri în regiune</span><Link to="/search" className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2 text-sm font-bold text-secondary-900"><Search className="h-4 w-4" /> Căutare avansată</Link></div>
          </div>
        </section>

        <section className="mt-12" aria-labelledby="counties-heading">
          <div className="mb-6"><h2 id="counties-heading" className="text-2xl font-bold text-white">Caută mașini pe județe</h2><p className="mt-2 text-gray-400">Afișăm județele și orașele unde există anunțuri publicate, nu pagini goale.</p></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {activeCounties.map((county) => <Card key={county.slug} variant="elevated" padding="md" hoverable className="flex min-h-48 flex-col"><h3 className="text-xl font-bold text-white">{county.name}</h3><p className="mt-2 text-sm text-gray-400">{county.listingCount} anunțuri auto disponibile</p>{county.cities.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{county.cities.slice(0, 4).map((city) => <Link key={city.slug} to={`${countyUrl(county)}/${city.slug}`} className="text-xs text-gray-300 hover:text-accent-gold">{city.name}</Link>)}</div>}<Link to={countyUrl(county)} className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-accent-gold transition-colors hover:text-white">Vezi anunțurile <ArrowRight className="h-4 w-4" /></Link></Card>)}
          </div>
          {activeCounties.length === 0 && <Card className="text-center text-gray-300">Stocul regional va apărea aici pe măsură ce sunt publicate anunțuri complete.</Card>}
        </section>

        <section className="mt-14" aria-labelledby="recent-heading"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h2 id="recent-heading" className="text-2xl font-bold text-white">Anunțuri recente din Moldova</h2><p className="mt-2 text-gray-400">Cele mai noi mașini publicate în regiune.</p></div></div><CarGrid cars={cars} loading={false} hasMore={false} onLoadMore={() => undefined} onFavorite={() => undefined} onCompare={() => undefined} emptyStateTitle="Nu sunt încă anunțuri în Moldova" emptyStateDescription="Revino curând sau caută în toată România." /></section>

        <section className="mt-14 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8"><h2 className="text-xl font-bold text-white">Cumperi din alt oraș?</h2><p className="mt-2 max-w-3xl text-gray-300">Cere VIN-ul înainte de drum, stabilește vizionarea ziua și păstrează buget pentru o inspecție independentă. Citește ghidurile noastre înainte să contactezi vânzătorul.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{MOLDOVA_GUIDES.map((guide) => <Link key={guide.slug} to={`/blog/${guide.slug}`} className="rounded-xl border border-white/10 bg-secondary-900/60 p-4 text-sm font-semibold text-gray-200 transition-colors hover:border-accent-gold/50 hover:text-accent-gold">{guide.title}</Link>)}</div></section>
      </div>
    </div>
  );
}
