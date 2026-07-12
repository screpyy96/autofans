import { Link } from 'react-router';
import type { Route } from "./+types/home";
import { Search, Car, Shield, Clock, TrendingUp } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Hero } from '~/components/home/Hero';
import { RouteErrorBoundary } from '~/components/error';
import { mockCars } from '~/data/mockData';
import { CarCard } from '~/components/car/CarCard';
import { useFavorites, useComparison } from '~/stores/useAppStore';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "AutoFans.ro - Anunțuri Auto Second-Hand și Noi în România" },
    { name: "description", content: "Cumpără sau vinde mașina ta rapid și sigur. Pe Autofans.ro găsești mii de anunțuri auto din toată țara, verificate manual." },
  ];
}

function HomeContent() {
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
    window.location.href = `/car/${carId}`;
  };

  const stats = [
    { label: 'Mașini active', value: '15.234', icon: Car },
    { label: 'Utilizatori verificați', value: '8.567', icon: Shield },
    { label: 'Anunțuri vândute', value: '3.421', icon: TrendingUp },
    { label: 'Timp mediu vânzare', value: '12 zile', icon: Clock },
  ];

  return (
    <>
      <Hero onSearch={handleSearch} />

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
            {[
              { name: 'Dacia', count: '1.420 anunțuri' },
              { name: 'Volkswagen', count: '2.890 anunțuri' },
              { name: 'BMW', count: '2.110 anunțuri' },
              { name: 'Audi', count: '1.780 anunțuri' },
              { name: 'Mercedes-Benz', count: '1.450 anunțuri' },
              { name: 'Ford', count: '1.230 anunțuri' },
              { name: 'Opel', count: '980 anunțuri' },
              { name: 'Skoda', count: '890 anunțuri' },
            ].map((brand) => (
              <Link
                key={brand.name}
                to={`/search?q=${brand.name}`}
                className="flex flex-col items-center justify-center p-5 rounded-2xl bg-glass border border-white/10 hover:border-accent-gold transition-all duration-300 hover:shadow-glow hover:-translate-y-1 text-center group"
              >
                <span className="text-base font-bold text-white mb-1 group-hover:text-accent-gold transition-colors">{brand.name}</span>
                <span className="text-xs text-gray-400">{brand.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

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
          {mockCars.map((car) => (
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
          ))}
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
      <section className="py-20 bg-glass backdrop-blur-xl w-full">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              De ce să alegi AutoFans.ro?
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
              Punem accent pe transparență și utilitate, oferindu-ți instrumentele necesare pentru a vinde sau cumpăra rapid, fără bătăi de cap.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Card variant="elevated" padding="lg" className="text-center bg-glass border-premium hover:border-accent-gold transition-all duration-300 group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-gold/20 rounded-full mb-8 group-hover:bg-accent-gold/30 transition-all duration-300">
                <Shield className="h-10 w-10 text-accent-gold" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-6">
                Anunțuri Verificate
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Fiecare anunț este moderat manual de echipa noastră înainte de publicare pentru a elimina tentativele de fraudă și datele eronate.
              </p>
            </Card>

            <Card variant="elevated" padding="lg" className="text-center bg-glass border-premium hover:border-accent-gold transition-all duration-300 group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-gold/20 rounded-full mb-8 group-hover:bg-accent-gold/30 transition-all duration-300">
                <Search className="h-10 w-10 text-accent-gold" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-6">
                Filtre Inteligente
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Găsești exact ce cauți după criterii detaliate: buget, an de fabricație, motorizare, transmisie, combustibil sau locație geografică.
              </p>
            </Card>

            <Card variant="elevated" padding="lg" className="text-center bg-glass border-premium hover:border-accent-gold transition-all duration-300 group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-gold/20 rounded-full mb-8 group-hover:bg-accent-gold/30 transition-all duration-300">
                <Clock className="h-10 w-10 text-accent-gold" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-6">
                Fără Intermediari
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Cumpărătorii iau legătura direct cu proprietarii sau dealerii autorizați. Fără taxe ascunse sau comisioane reținute din tranzacție.
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
            <Link to="/search">
              <Button variant="secondary" size="lg" className="bg-secondary-900 text-white hover:bg-secondary-800 hover:shadow-lg transition-all duration-300">
                <Search className="h-5 w-5 mr-2" />
                Caută Anunțuri
              </Button>
            </Link>
            <Link to="/create-listing">
              <Button variant="ghost" size="lg" className="text-secondary-900 border-secondary-900 hover:bg-secondary-900/10 transition-all duration-300 font-bold">
                Pune Anunț Gratuit
              </Button>
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
