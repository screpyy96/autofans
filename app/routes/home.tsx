import { Link, useLoaderData } from 'react-router';
import type { Route } from "./+types/home";
import type { LoaderFunctionArgs } from 'react-router';
import { Search, Car as CarIcon, Shield, Clock, TrendingUp, FileText, ShieldCheck, Calculator, Tag, Plus, Sparkles } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Hero } from '~/components/home/Hero';
import { RouteErrorBoundary } from '~/components/error';
import { CarCard } from '~/components/car/CarCard';
import { useFavorites, useComparison } from '~/stores/useAppStore';
import { getSupabaseServerClient } from '~/lib/supabase.server';
import type { Car } from '~/types';
import { mapListingToCar } from '~/utils/listingMapper';
import { signListingImages } from '~/utils/listingImages';
import { buildRecommendations } from '~/utils/recommendations';

export function meta({ }: Route.MetaArgs) {
  const title = "AutoFans.ro - Platforma Premium de Anunțuri Auto";
  const description = "Cumpără sau vinde mașina ta rapid și sigur. Pe Autofans.ro găsești mii de anunțuri auto din toată țara, verificate manual.";
  const image = "https://autofans.ro/hero_background.jpg";

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "AutoFans.ro" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image }
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { supabase } = getSupabaseServerClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    const [publishedCountResult, brandRowsResult, listingsResult] = await Promise.all([
      supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published'),
      supabase
        .from('listings')
        .select('make')
        .eq('status', 'published')
        .not('make', 'is', null)
        .limit(500),
      supabase
        .from('listings')
        .select('id, slug, owner_id, title, description, price, currency, make, model, year, mileage, fuel_type, transmission, vin, vin_verified, history_checked, images, created_at, city, county, latitude, longitude')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(6),
    ]);

    const publishedCount = publishedCountResult.count;
    const brandRows = brandRowsResult.data;
    const listings = listingsResult.data;

    let favoriteListings: any[] = [];
    let savedSearches: any[] = [];
    let recommendationListings: any[] = [];
    if (user) {
      const [{ data: favoriteRows }, { data: searches }, { data: candidates }] = await Promise.all([
        supabase.from('favorites').select('listing_id').eq('user_id', user.id),
        supabase.from('saved_searches').select('name, query').eq('user_id', user.id).limit(20),
        supabase.from('listings')
          .select('id, slug, owner_id, title, description, price, currency, make, model, year, mileage, fuel_type, transmission, vin, vin_verified, history_checked, images, created_at, city, county, latitude, longitude, service_history, owners')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(60),
      ]);
      const favoriteIds = (favoriteRows || []).map((row: any) => row.listing_id);
      if (favoriteIds.length) {
        const { data } = await supabase.from('listings')
          .select('id, make, model, fuel_type, transmission, price, city, county, created_at')
          .in('id', favoriteIds)
          .eq('status', 'published');
        favoriteListings = data || [];
      }
      savedSearches = searches || [];
      recommendationListings = candidates || [];
    }

    const recommendations = buildRecommendations({ candidates: recommendationListings, favorites: favoriteListings, savedSearches, limit: 6 });
    const allListingsForImages = [...(listings || []), ...recommendations.map((item) => item.listing)];
    const signedMap = await signListingImages(supabase as any, allListingsForImages);
    
    // Calculate brand frequencies
    const brandCounts = (brandRows || []).reduce((acc: Record<string, number>, row: any) => {
      if (row.make) acc[row.make] = (acc[row.make] || 0) + 1;
      return acc;
    }, {});
    
    const brands = Object.entries(brandCounts)
      .map(([name, count]) => ({ name, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return { listings: listings || [], recommendations, signedMap, publishedCount: publishedCount || 0, brands };
  } catch (error) {
    console.error('home loader error:', error);
    return { listings: [], recommendations: [], signedMap: {} as Record<string, string>, publishedCount: 0, brands: [] };
  }
}

function HomeContent() {
  const data = useLoaderData<typeof loader>();
  const recentCars = data.listings.map((listing: any) => mapListingToCar(listing, data.signedMap));
  const recommendedCars = data.recommendations.map((item: any) => ({ car: mapListingToCar(item.listing, data.signedMap), reason: item.reason }));
  const { favorites, addToFavorites, removeFromFavorites, isFavorited } = useFavorites();
  const { comparisonCars, addToComparison, removeFromComparison, isInComparison } = useComparison();

  const handleSearch = (query: string) => {
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  };

  const handleFavorite = (carId: string) => {
    if (isFavorited(carId)) {
      removeFromFavorites(carId);
    } else {
      addToFavorites(carId);
    }
  };

  const handleCompare = (carId: string) => {
    if (isInComparison(carId)) {
      removeFromComparison(carId);
    } else {
      addToComparison(carId);
    }
  };

  const handleContact = (carId: string) => {
    alert(`Contactare vânzător pentru mașina ${carId}`);
  };

  const handleView = (carId: string) => {
    const car = [...recentCars, ...recommendedCars.map((item) => item.car)].find((item) => item.id === carId);
    window.location.href = `/car/${encodeURIComponent(car?.slug || carId)}`;
  };

  const stats = [
    { label: 'Anunțuri active', value: data.publishedCount.toLocaleString('ro-RO'), icon: CarIcon },
    { label: 'Mărci disponibile', value: String(data.brands.length), icon: Shield },
    { label: 'Adăugate recent', value: String(recentCars.length), icon: TrendingUp },
    { label: 'Platformă', value: 'LIVE', icon: Clock },
  ];

  return (
    <>
      <Hero onSearch={handleSearch} />

      {/* Info Cards Section */}
      <section className="py-16 w-full bg-glass/10 backdrop-blur-md text-white border-b border-white/5">
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
                  Prețul pe care îl vezi este prețul final. Descoperă mii de mașini verificate și alege-o pe cea perfectă pentru tine.
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
      <section className="py-16 bg-glass/20 backdrop-blur-md w-full border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Caută după marca ta preferată
            </h2>
            <p className="text-sm text-gray-400">Cele mai căutate mărci auto pe platforma noastră în România</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {data.brands.map((brand) => (
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

      {/* Recent Listings Section */}
      {recommendedCars.length > 0 && (
        <section className="border-y border-accent-gold/15 bg-accent-gold/[0.04] py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2 text-accent-gold"><Sparkles className="h-5 w-5" /><span className="text-sm font-bold uppercase tracking-[0.18em]">Personalizat</span></div>
                <h2 className="text-3xl font-bold text-white">Recomandate pentru tine</h2>
                <p className="mt-3 text-gray-400">Selectate din favoritele și căutările tale salvate.</p>
              </div>
              <Link to="/search"><Button variant="outline" className="border-accent-gold/45 text-accent-gold hover:bg-accent-gold/10">Explorează toate mașinile</Button></Link>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedCars.map(({ car, reason }) => (
                <div key={car.id} className="relative">
                  <div className="absolute left-4 top-4 z-10 rounded-full border border-accent-gold/30 bg-secondary-950/95 px-3 py-1 text-xs font-semibold text-accent-gold shadow-lg">{reason}</div>
                  <CarCard car={car} onFavorite={handleFavorite} onCompare={handleCompare} onContact={handleContact} onView={handleView} isFavorited={isFavorited(car.id)} isInComparison={isInComparison(car.id)} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Listings Section */}
      <section className="py-20 w-full max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Ultimele anunțuri adăugate
            </h2>
            <p className="text-gray-400">Mașini gata de drum, adăugate recent de proprietari și dealeri verificați din România.</p>
          </div>
          <Link to="/search">
            <Button variant="outline" className="border-accent-gold/45 text-accent-gold hover:bg-accent-gold/10 hover:border-accent-gold font-bold transition-all">
              Vezi toate anunțurile
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {recentCars.length > 0 ? recentCars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                onFavorite={handleFavorite}
                onCompare={handleCompare}
                onContact={handleContact}
                onView={handleView}
                isFavorited={isFavorited(car.id)}
                isInComparison={isInComparison(car.id)}
              />
            )) : (
              <div className="col-span-full rounded-2xl border border-white/10 bg-glass p-10 text-center text-gray-300">
                Nu există încă anunțuri publicate.
              </div>
            )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-glass backdrop-blur-xl border-y border-premium w-full">
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
      <section className="py-20 bg-glass backdrop-blur-xl w-full border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Esențiale pentru cumpărători
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Card variant="outlined" className="text-center bg-glass border-white/10 hover:border-accent-gold/50 transition-all duration-300 p-8 rounded-2xl flex flex-col items-center justify-start group">
              <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-12 w-12 text-accent-gold stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">
                Verifică istoricul auto
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Ai liniște sufletească deplină înainte de a cumpăra următoarea mașină.
              </p>
            </Card>

            <Card variant="outlined" className="text-center bg-glass border-white/10 hover:border-accent-gold/50 transition-all duration-300 p-8 rounded-2xl flex flex-col items-center justify-start group">
              <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="h-12 w-12 text-accent-gold stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">
                Sfaturi de siguranță
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Recomandări și ghiduri despre cum să cumperi și să vinzi vehicule în siguranță.
              </p>
            </Card>

            <Card variant="outlined" className="text-center bg-glass border-white/10 hover:border-accent-gold/50 transition-all duration-300 p-8 rounded-2xl flex flex-col items-center justify-start group">
              <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                <Calculator className="h-12 w-12 text-accent-gold stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">
                Finanțare și Credit
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Descoperă cât poți împrumuta și găsește pachetul de rate potrivit pentru tine.
              </p>
            </Card>

            <Card variant="outlined" className="text-center bg-glass border-white/10 hover:border-accent-gold/50 transition-all duration-300 p-8 rounded-2xl flex flex-col items-center justify-start group">
              <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                <Tag className="h-12 w-12 text-accent-gold stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">
                Vânzare rapidă
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Fără bătăi de cap. Găsește cumpărători reali și vinde mașina ta la prețul corect.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gold-gradient relative overflow-hidden w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/20 via-transparent to-accent-gold/10"></div>
        <div className="relative w-full px-6 text-center">
          <h2 className="text-4xl font-bold text-secondary-900 mb-6">
            Gata să-ți schimbi mașina?
          </h2>
          <p className="text-xl text-secondary-800 mb-10 leading-relaxed max-w-2xl mx-auto">
            Adaugă un anunț acum sau caută în miile de oferte active de pe Autofans.ro
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
