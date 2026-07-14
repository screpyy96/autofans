import { Link, useNavigate } from 'react-router';
import { Sparkles } from 'lucide-react';
import { CarCard } from '~/components/car/CarCard';
import { Button } from '~/components/ui/Button';
import { useComparison, useFavorites } from '~/stores/useAppStore';
import type { Car } from '~/types';

interface RecommendedCar {
  car: Car;
  reason: string;
}

interface HomeListingsProps {
  catalogLoaded: boolean;
  recentCars: Car[];
  recommendedCars: RecommendedCar[];
}

export function HomeListings({ catalogLoaded, recentCars, recommendedCars }: HomeListingsProps) {
  const navigate = useNavigate();
  const { addToFavorites, removeFromFavorites, isFavorited } = useFavorites();
  const { addToComparison, removeFromComparison, isInComparison } = useComparison();

  const handleFavorite = (carId: string) => {
    if (isFavorited(carId)) removeFromFavorites(carId);
    else addToFavorites(carId);
  };

  const handleCompare = (carId: string) => {
    if (isInComparison(carId)) removeFromComparison(carId);
    else addToComparison(carId);
  };

  const handleView = (carId: string) => {
    const car = [...recentCars, ...recommendedCars.map((item) => item.car)].find((item) => item.id === carId);
    navigate(`/car/${encodeURIComponent(car?.slug || carId)}`);
  };

  return (
    <>
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
                  <CarCard car={car} onFavorite={handleFavorite} onCompare={handleCompare} onView={handleView} isFavorited={isFavorited(car.id)} isInComparison={isInComparison(car.id)} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20 w-full max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-3">Ultimele anunțuri adăugate</h2>
            <p className="text-gray-400">Mașini gata de drum, adăugate recent de proprietari și dealeri verificați din România.</p>
          </div>
          <Link to="/search">
            <Button variant="outline" className="border-accent-gold/45 text-accent-gold hover:bg-accent-gold/10 hover:border-accent-gold font-bold transition-all">Vezi toate anunțurile</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {recentCars.length > 0 ? recentCars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              onFavorite={handleFavorite}
              onCompare={handleCompare}
              onView={handleView}
              isFavorited={isFavorited(car.id)}
              isInComparison={isInComparison(car.id)}
            />
          )) : catalogLoaded ? (
            <div className="col-span-full rounded-2xl border border-white/10 bg-glass p-10 text-center text-gray-300">Nu există încă anunțuri publicate.</div>
          ) : (
            <div className="col-span-full rounded-2xl border border-white/10 bg-glass p-10 text-center text-gray-400">Se încarcă anunțurile recente…</div>
          )}
        </div>
      </section>
    </>
  );
}
