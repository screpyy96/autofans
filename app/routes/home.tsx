import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useLoaderData } from 'react-router';
import type { Route } from "./+types/home";
import type { LinksFunction } from 'react-router';
import { Search, Car as CarIcon, Shield, Clock, TrendingUp, GitCompare, Heart, MessageCircle, SlidersHorizontal, Plus } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Hero } from '~/components/home/Hero';
import { RouteErrorBoundary } from '~/components/error';
import { DeferredMount } from '~/components/performance/DeferredMount';
import type { Car } from '~/types';
import { mapListingToCar } from '~/utils/listingMapper';

const HomeListings = lazy(() =>
  import('~/components/home/HomeListings').then(({ HomeListings: HomeListingsComponent }) => ({ default: HomeListingsComponent })),
);

export function meta({ }: Route.MetaArgs) {
  const title = "AutoFans.ro - Platforma Premium de Anunțuri Auto";
  const description = "Cumpără sau vinde mașina ta pe AutoFans.ro. Caută anunțuri auto după marcă, model, preț, an și locație.";
  const image = "https://www.autofans.ro/hero_background.jpg";

  return [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "index,follow,max-image-preview:large" },
    { tagName: "link", rel: "canonical", href: "https://www.autofans.ro/" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { property: "og:url", content: "https://www.autofans.ro/" },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "AutoFans.ro" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image }
  ];
}

export const links: LinksFunction = () => [
  {
    rel: 'preload',
    as: 'image',
    href: '/hero_background.webp',
    type: 'image/webp',
    imageSrcSet: '/hero_background-768.webp 768w, /hero_background-1024.webp 1024w, /hero_background.webp 1376w',
    imageSizes: '100vw',
    fetchPriority: 'high',
  },
];

export async function loader() {
  return { listings: [], recommendations: [], signedMap: {} as Record<string, string>, publishedCount: 0, brands: [] };
}

function HomeContent() {
  const initialData = useLoaderData<typeof loader>();
  const [data, setData] = useState<any>(initialData);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [catalogError, setCatalogError] = useState(false);
  const [catalogRequest, setCatalogRequest] = useState(0);

  useEffect(() => {
    let controller: AbortController | undefined;
    let cancelled = false;

    const loadCatalog = () => {
      if (cancelled) return;
      setCatalogError(false);
      controller = new AbortController();
      fetch('/api/home', { signal: controller.signal })
        .then((response) => response.ok ? response.json() : Promise.reject(new Error('Home catalog failed')))
        .then((catalog) => {
          if (!cancelled) setData(catalog);
        })
        .catch((error) => {
          if (!cancelled && error.name !== 'AbortError') setCatalogError(true);
        })
        .finally(() => {
          if (!cancelled) setCatalogLoaded(true);
        });
    };

    // The hero image is the LCP element. Defer the non-critical catalog request
    // until the browser is idle so it cannot steal bandwidth on slow mobile data.
    const idleId = catalogRequest === 0 && 'requestIdleCallback' in window
      ? window.requestIdleCallback(loadCatalog, { timeout: 900 })
      : undefined;
    const timeoutId = idleId === undefined ? window.setTimeout(loadCatalog, catalogRequest === 0 ? 250 : 0) : undefined;

    return () => {
      cancelled = true;
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      controller?.abort();
    };
  }, [catalogRequest]);
  const recentCars = data.listings.map((listing: any) => mapListingToCar(listing, data.signedMap));
  const recommendedCars = data.recommendations.map((item: any) => ({ car: mapListingToCar(item.listing, data.signedMap), reason: item.reason }));
  const handleSearch = (query: string) => {
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  };

  const stats = [
    { label: 'Anunțuri active', value: catalogLoaded ? data.publishedCount.toLocaleString('ro-RO') : '—', icon: CarIcon },
    { label: 'Mărci disponibile', value: catalogLoaded ? String(data.brands.length) : '—', icon: Shield },
    { label: 'Adăugate recent', value: catalogLoaded ? String(recentCars.length) : '—', icon: TrendingUp },
    { label: 'Platformă', value: 'LIVE', icon: Clock },
  ];
  const buyerFeatures = [
    {
      icon: SlidersHorizontal,
      title: 'Filtre care contează',
      description: 'Restrânge rezultatele după marcă, preț, an, kilometraj și locație, fără să pierzi timp în liste inutile.',
      href: '/search',
      action: 'Deschide căutarea',
    },
    {
      icon: GitCompare,
      title: 'Compară pe bune',
      description: 'Păstrează mașinile relevante și compară prețul, specificațiile și declarațiile vânzătorului într-un singur loc.',
      href: '/search',
      action: 'Alege mașini',
    },
    {
      icon: MessageCircle,
      title: 'Contact direct',
      description: 'Trimite mesaj, programează o vizionare sau continuă discuția în chatul securizat al platformei.',
      href: '/search',
      action: 'Vezi anunțurile',
    },
    {
      icon: Heart,
      title: 'Favorite sincronizate',
      description: 'Salvează ofertele care contează și revino la ele de pe orice dispozitiv după ce intri în cont.',
      href: '/favorites',
      action: 'Vezi favoritele',
    },
  ];
  const homeSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://www.autofans.ro/#organization',
        name: 'AutoFans.ro',
        url: 'https://www.autofans.ro/',
        logo: 'https://www.autofans.ro/logo-header.webp',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://www.autofans.ro/#website',
        name: 'AutoFans.ro',
        url: 'https://www.autofans.ro/',
        inLanguage: 'ro-RO',
        publisher: { '@id': 'https://www.autofans.ro/#organization' },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://www.autofans.ro/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }} />
      <Hero onSearch={handleSearch} />

      {/* Info Cards Section */}
      <section className="defer-render py-16 w-full bg-glass/10 backdrop-blur-md text-white border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">
              Descoperă mai multe de la AutoFans
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Card 1 */}
            <div className="md:col-span-2 bg-glass border border-white/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-glow hover:border-accent-gold/50 transition-all duration-300 flex flex-col group">
              <picture className="block h-48 w-full">
                <source srcSet="/card_buying.webp" type="image/webp" />
                <img src="/card_buying.jpg" alt="Cumpără mașini" width={1200} height={896} loading="lazy" decoding="async" className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
              </picture>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-accent-gold transition-colors">Cumpără cu încredere</h3>
                <p className="text-gray-400 mb-6 flex-1">
                  Compară ofertele după preț, an, kilometraj și locație, apoi alege mașina care ți se potrivește.
                </p>
                <Link to="/search" className="inline-block text-center text-accent-gold border border-accent-gold hover:bg-accent-gold/10 font-bold py-2.5 px-6 rounded-xl transition-colors">
                  Caută mașini
                </Link>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-glass border border-white/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-glow hover:border-accent-gold/50 transition-all duration-300 flex flex-col group">
              <picture className="block h-48 w-full">
                <source srcSet="/card_selling.webp" type="image/webp" />
                <img src="/card_selling.jpg" alt="Vinde mașina" width={1200} height={896} loading="lazy" decoding="async" className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
              </picture>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-accent-gold transition-colors">Vinde mașina ta simplu</h3>
                <p className="text-gray-400 mb-6 flex-1">
                  Adaugă un anunț în doar câteva minute și alege cea mai bună variantă de a vinde rapid și sigur pe platforma noastră.
                </p>
                <Link to="/create-listing" className="inline-block text-center text-accent-gold border border-accent-gold hover:bg-accent-gold/10 font-bold py-2.5 px-6 rounded-xl transition-colors">
                  Vinde mașina
                </Link>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-glass border border-white/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-glow hover:border-accent-gold/50 transition-all duration-300 flex flex-col group">
              <picture className="block h-48 w-full">
                <source srcSet="/card_experience.webp" type="image/webp" />
                <img src="/card_experience.jpg" alt="Experiența completă" width={1200} height={896} loading="lazy" decoding="async" className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
              </picture>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-accent-gold transition-colors">Experiența completă</h3>
                <p className="text-gray-400 mb-6 flex-1">
                  Vezi mașinile salvate, urmărește progresul anunțurilor tale și reia exact de unde ai rămas pe orice dispozitiv.
                </p>
                <Link to="/login" className="inline-block text-center text-accent-gold border border-accent-gold hover:bg-accent-gold/10 font-bold py-2.5 px-6 rounded-xl transition-colors">
                  Autentificare
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="defer-render py-16 bg-glass/20 backdrop-blur-md w-full border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Caută după marca ta preferată
            </h2>
            <p className="text-sm text-gray-400">Cele mai căutate mărci auto pe platforma noastră în România</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {data.brands.map((brand: { name: string; count: number }) => (
              <Link
                key={brand.name}
                to={`/search?q=${encodeURIComponent(brand.name)}`}
                className="flex flex-col items-center justify-center p-5 rounded-2xl bg-glass border border-white/10 hover:border-accent-gold transition-all duration-300 hover:shadow-glow hover:-translate-y-1 text-center group"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-accent-gold/20 transition-colors">
                  <CarIcon className="w-5 h-5 text-gray-400 group-hover:text-accent-gold transition-colors" />
                </div>
                <span className="text-base font-bold text-white mb-1 group-hover:text-accent-gold transition-colors">{brand.name}</span>
                <span className="text-xs text-gray-400">{brand.count} anunțuri</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <DeferredMount
        placeholder={<section className="defer-render min-h-[440px] py-20" aria-hidden="true" />}
      >
        <Suspense fallback={<section className="min-h-[440px] py-20" aria-label="Se încarcă anunțurile" />}>
          <HomeListings
            catalogLoaded={catalogLoaded}
            catalogError={catalogError}
            recentCars={recentCars}
            recommendedCars={recommendedCars}
            onRetry={() => {
              setCatalogLoaded(false);
              setCatalogError(false);
              setCatalogRequest((request) => request + 1);
            }}
          />
        </Suspense>
      </DeferredMount>

      {/* Stats Section */}
      <section className="defer-render py-20 bg-glass backdrop-blur-xl border-y border-premium w-full">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-gold/20 rounded-2xl mb-6 group-hover:bg-accent-gold/30 transition-all duration-300">
                  <stat.icon className="h-8 w-8 text-accent-gold" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-2 group-hover-text-glow transition-all duration-300">
                  {stat.value}
                </div>
                <div className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="defer-render py-20 bg-glass backdrop-blur-xl w-full border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Esențiale pentru cumpărători
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
            {buyerFeatures.map((feature) => (
              <Card key={feature.title} variant="outlined" className="group flex flex-col items-center rounded-2xl border-white/10 bg-glass p-7 text-center transition-all duration-300 hover:border-accent-gold/50 sm:p-8">
                <div className="mb-6 transition-transform duration-300 group-hover:scale-110">
                  <feature.icon className="h-12 w-12 text-accent-gold stroke-[1.5]" />
                </div>
                <h3 className="mb-3 text-lg font-bold text-white">{feature.title}</h3>
                <p className="flex-1 text-sm leading-relaxed text-gray-400">{feature.description}</p>
                <Link to={feature.href} className="mt-6 text-sm font-bold text-accent-gold transition-colors hover:text-white">
                  {feature.action} →
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="defer-render py-20 bg-gold-gradient relative overflow-hidden w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/20 via-transparent to-accent-gold/10"></div>
        <div className="relative w-full px-6 text-center">
          <h2 className="text-4xl font-bold text-secondary-900 mb-6">
            Gata să-ți schimbi mașina?
          </h2>
          <p className="text-xl text-secondary-800 mb-10 leading-relaxed max-w-2xl mx-auto">
            Adaugă un anunț acum sau caută ofertele active de pe AutoFans.ro
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              to="/search" 
              className="inline-flex items-center justify-center bg-secondary-900 text-white hover:bg-secondary-800 hover:shadow-lg transition-all duration-300 px-8 py-4 rounded-xl font-bold text-lg"
            >
              <Search className="h-5 w-5 mr-2" />
              Caută Anunțuri
            </Link>
            <Link 
              to="/create-listing" 
              className="inline-flex items-center justify-center text-secondary-900 border-2 border-secondary-900 hover:bg-secondary-900/10 transition-all duration-300 px-8 py-4 rounded-xl font-bold text-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Pune Anunț Gratuit
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default function Home() {
  return (
    <RouteErrorBoundary routeName="Acasă">
      <HomeContent />
    </RouteErrorBoundary>
  );
}
