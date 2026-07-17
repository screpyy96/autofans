import { Link, useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { ChevronRight, MapPin, Search, ShieldCheck } from 'lucide-react';
import { CarGrid } from '~/components/car/CarGrid';
import { Card } from '~/components/ui/Card';
import { getSupabaseServerClient } from '~/lib/supabase.server';
import {
  DOMAIN,
  LOCAL_PAGE_SIZE,
  MOLDOVA_GUIDES,
  cityUrl,
  countyUrl,
} from '~/utils/localSeo';
import {
  getMoldovaCountySummaries,
  getMoldovaInventoryStats,
  loadLocalInventory,
  parseLocalPage,
  resolveLocalLocation,
} from '~/utils/localSeo.server';

export function meta({ data }: any) {
  const location = data?.location;
  if (!location) return [{ title: 'Pagina nu a fost găsită | AutoFans' }, { name: 'robots', content: 'noindex,follow' }];
  const placeName = location.city?.name || location.county.name;
  const pageSuffix = data.page > 1 ? ` – pagina ${data.page}` : '';
  const title = `Mașini second-hand în ${placeName}${pageSuffix} | AutoFans`;
  const description = `Vezi ${location.listingCount} anunțuri auto second-hand în ${placeName}. Compară prețul, anul, kilometrajul și detaliile fiecărei mașini pe AutoFans.`;
  return [
    { title },
    { name: 'description', content: description },
    { name: 'robots', content: location.isIndexable ? 'index,follow,max-image-preview:large' : 'noindex,follow' },
    { tagName: 'link', rel: 'canonical', href: data.canonicalUrl },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: data.canonicalUrl },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ];
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { supabase } = getSupabaseServerClient(request);
  const stats = await getMoldovaInventoryStats(supabase as any);
  const location = resolveLocalLocation(stats, params.county, params.city);
  if (!location) throw new Response('Not Found', { status: 404 });

  const page = parseLocalPage(new URL(request.url).searchParams.get('p'));
  const { cars, total } = await loadLocalInventory(supabase as any, location, page);
  const summaries = getMoldovaCountySummaries(stats);
  const currentSummary = summaries.find((summary) => summary.slug === location.county.slug);
  const baseUrl = location.city ? cityUrl(location.county, location.city.name) : countyUrl(location.county);
  const canonicalUrl = `${DOMAIN}${baseUrl}${page > 1 ? `?p=${page}` : ''}`;

  return {
    location: { ...location, listingCount: total },
    cars,
    page,
    pageCount: Math.max(1, Math.ceil(total / LOCAL_PAGE_SIZE)),
    canonicalUrl,
    relatedCities: currentSummary?.cities || [],
    relatedCounties: summaries.filter((summary) => summary.isIndexable && summary.slug !== location.county.slug),
  };
}

export default function LocalInventoryPage() {
  const data = useLoaderData<typeof loader>();
  const { location } = data;
  const placeName = location.city?.name || location.county.name;
  const basePath = location.city ? cityUrl(location.county, location.city.name) : countyUrl(location.county);
  const relatedGuides = MOLDOVA_GUIDES.filter((guide) => guide.counties.length === 0 || (guide.counties as readonly string[]).includes(location.county.slug)).slice(0, 2);
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${data.canonicalUrl}#collection`,
    name: `Mașini second-hand în ${placeName}`,
    url: data.canonicalUrl,
    inLanguage: 'ro-RO',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: data.location.listingCount,
      itemListElement: data.cars.map((car: any, index: number) => ({
        '@type': 'ListItem',
        position: (data.page - 1) * LOCAL_PAGE_SIZE + index + 1,
        url: `${DOMAIN}/car/${encodeURIComponent(car.slug)}`,
        name: car.title,
      })),
    },
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Acasă', item: `${DOMAIN}/` },
      { '@type': 'ListItem', position: 2, name: 'Mașini second-hand Moldova', item: `${DOMAIN}/masini-second-hand/moldova` },
      { '@type': 'ListItem', position: 3, name: location.county.name, item: `${DOMAIN}${countyUrl(location.county)}` },
      ...(location.city ? [{ '@type': 'ListItem', position: 4, name: location.city.name, item: data.canonicalUrl }] : []),
    ],
  };

  return (
    <div className="min-h-screen bg-secondary-950 pb-20 pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-400">
          <Link to="/" className="transition-colors hover:text-white">Acasă</Link><ChevronRight className="h-4 w-4" aria-hidden="true" />
          <Link to="/masini-second-hand/moldova" className="transition-colors hover:text-white">Moldova</Link><ChevronRight className="h-4 w-4" aria-hidden="true" />
          {location.city && <><Link to={countyUrl(location.county)} className="transition-colors hover:text-white">{location.county.name}</Link><ChevronRight className="h-4 w-4" aria-hidden="true" /></>}
          <span aria-current="page" className="text-gray-200">{placeName}</span>
        </nav>

        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-premium-gradient px-6 py-10 shadow-card sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-accent-gold/10 blur-3xl" aria-hidden="true" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-gold/30 bg-accent-gold/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-accent-gold"><MapPin className="h-3.5 w-3.5" /> Moldova</span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-5xl">Mașini second-hand în {placeName}</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg">Compară anunțurile auto publicate în {placeName}: preț, an, kilometraj și informațiile care contează înainte de vizionare.</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-gray-200"><ShieldCheck className="h-4 w-4 text-accent-gold" /> {location.listingCount} anunțuri disponibile</div>
          </div>
        </section>

        {location.city === null && data.relatedCities.length > 0 && (
          <section className="mt-8" aria-labelledby="city-links-heading">
            <h2 id="city-links-heading" className="text-lg font-bold text-white">Caută pe orașe în județul {location.county.name}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.relatedCities.map((city) => <Link key={city.slug} to={cityUrl(location.county, city.name)} className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-gray-300 transition-colors hover:border-accent-gold/50 hover:text-white">{city.name} <span className="text-gray-500">({city.listingCount})</span></Link>)}
            </div>
          </section>
        )}

        <section className="mt-10" aria-labelledby="inventory-heading">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div><h2 id="inventory-heading" className="text-2xl font-bold text-white">Anunțuri auto din {placeName}</h2><p className="mt-1 text-sm text-gray-400">Pagina {data.page} din {data.pageCount}</p></div>
            <Link to="/search" className="inline-flex items-center gap-2 rounded-xl border border-accent-gold/35 px-4 py-2 text-sm font-semibold text-accent-gold transition-colors hover:bg-accent-gold/10"><Search className="h-4 w-4" /> Toate filtrele</Link>
          </div>
          <CarGrid cars={data.cars} loading={false} hasMore={false} onLoadMore={() => undefined} onFavorite={() => undefined} onCompare={() => undefined} emptyStateTitle={`Nu sunt încă anunțuri în ${placeName}`} emptyStateDescription="Revino curând sau extinde căutarea la nivel de județ." />
          {data.pageCount > 1 && <nav aria-label="Paginare anunțuri" className="mt-10 flex items-center justify-between gap-4"><span className="text-sm text-gray-400">Pagina {data.page} din {data.pageCount}</span><div className="flex gap-3">{data.page > 1 && <Link to={`${basePath}${data.page === 2 ? '' : `?p=${data.page - 1}`}`} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-white/5">Înapoi</Link>}{data.page < data.pageCount && <Link to={`${basePath}?p=${data.page + 1}`} className="rounded-xl bg-gold-gradient px-4 py-2 text-sm font-bold text-secondary-900">Următoarea</Link>}</div></nav>}
        </section>

        {data.relatedCounties.length > 0 && <section className="mt-14 border-t border-white/10 pt-8" aria-labelledby="county-links-heading"><h2 id="county-links-heading" className="text-lg font-bold text-white">Mai multe mașini second-hand în Moldova</h2><div className="mt-4 flex flex-wrap gap-2">{data.relatedCounties.map((county) => <Link key={county.slug} to={countyUrl(county)} className="rounded-full border border-white/15 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-accent-gold/50 hover:text-white">{county.name} <span className="text-gray-500">({county.listingCount})</span></Link>)}</div></section>}
        {relatedGuides.length > 0 && <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6" aria-labelledby="local-guides-heading"><h2 id="local-guides-heading" className="text-lg font-bold text-white">Ghiduri pentru cumpărare informată</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{relatedGuides.map((guide) => <Link key={guide.slug} to={`/blog/${guide.slug}`} className="rounded-xl border border-white/10 bg-secondary-900/50 p-4 text-sm font-semibold text-gray-200 transition-colors hover:border-accent-gold/50 hover:text-accent-gold">{guide.title}</Link>)}</div></section>}
      </div>
    </div>
  );
}
