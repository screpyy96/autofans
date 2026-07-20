import { Link, useNavigate } from 'react-router';
import type { Route } from "./+types/home";
import type { LinksFunction } from 'react-router';
import { Search, Shield, GitCompare, Heart, MessageCircle, SlidersHorizontal, Plus, CircleCheck, MapPin } from 'lucide-react';
import { Card } from '~/components/ui/Card';
import { Hero } from '~/components/home/Hero';
import { RouteErrorBoundary } from '~/components/error';

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

function HomeContent() {
  const navigate = useNavigate();
  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };
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
                <Link to="/search" prefetch="intent" className="inline-block text-center text-accent-gold border border-accent-gold hover:bg-accent-gold/10 font-bold py-2.5 px-6 rounded-xl transition-colors">
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
                <Link to="/create-listing" prefetch="intent" className="inline-block text-center text-accent-gold border border-accent-gold hover:bg-accent-gold/10 font-bold py-2.5 px-6 rounded-xl transition-colors">
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
                <Link to="/login" prefetch="intent" className="inline-block text-center text-accent-gold border border-accent-gold hover:bg-accent-gold/10 font-bold py-2.5 px-6 rounded-xl transition-colors">
                  Autentificare
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seller invitation — intentionally contains no made-up platform statistics. */}
      <section className="defer-render border-y border-premium bg-glass py-20 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-gold/35 bg-accent-gold/10 px-4 py-2 text-sm font-bold text-accent-gold">
              <Plus className="h-4 w-4" /> Pentru proprietari
            </span>
            <h2 className="mt-5 text-3xl font-bold text-white sm:text-4xl">Ai o mașină de vândut?</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-300">
              Creează un anunț cu detaliile care contează: fotografii, specificații, preț și locație. Astfel, cumpărătorii pot înțelege clar ce oferi înainte să te contacteze.
            </p>
            <Link to="/create-listing" prefetch="intent" className="mt-8 inline-flex items-center justify-center rounded-xl bg-gold-gradient px-7 py-4 text-lg font-bold text-secondary-900 transition hover:brightness-110">
              <Plus className="mr-2 h-5 w-5" /> Listează-ți mașina
            </Link>
          </div>
          <div className="rounded-3xl border border-white/10 bg-secondary-950/50 p-7 shadow-2xl sm:p-8">
            <h3 className="text-xl font-bold text-white">Ce poți completa în anunț</h3>
            <ul className="mt-6 space-y-4 text-gray-300">
              {['Fotografii relevante ale mașinii', 'Detalii despre echipare, kilometraj și istoric', 'Prețul și localitatea pentru vizionare'].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-gold" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
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
                <Link to={feature.href} prefetch="intent" className="mt-6 text-sm font-bold text-accent-gold transition-colors hover:text-white">
                  {feature.action} →
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="defer-render border-t border-white/5 bg-secondary-950 py-16 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-accent-gold"><MapPin className="h-4 w-4" /> Caută mai aproape de tine</span>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Mașini second-hand în Moldova</h2>
              <p className="mt-3 text-gray-400">Vezi anunțuri din Suceava, Iași, Botoșani, Neamț, Bacău, Vaslui, Vrancea și Galați — organizate pe județ și oraș.</p>
            </div>
            <Link to="/masini-second-hand/moldova" prefetch="intent" className="inline-flex shrink-0 items-center justify-center rounded-xl border border-accent-gold/40 px-5 py-3 text-sm font-bold text-accent-gold transition-colors hover:bg-accent-gold/10">Explorează Moldova</Link>
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
            Publică mașina cu informații complete, ca oamenii potriviți să o poată descoperi și contacta.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              to="/search" 
              prefetch="intent"
              className="inline-flex items-center justify-center bg-secondary-900 text-white hover:bg-secondary-800 hover:shadow-lg transition-all duration-300 px-8 py-4 rounded-xl font-bold text-lg"
            >
              <Search className="h-5 w-5 mr-2" />
              Caută mașini
            </Link>
            <Link 
              to="/create-listing" 
              prefetch="intent"
              className="inline-flex items-center justify-center text-secondary-900 border-2 border-secondary-900 hover:bg-secondary-900/10 transition-all duration-300 px-8 py-4 rounded-xl font-bold text-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Listează-ți mașina
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
