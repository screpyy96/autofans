import { useEffect } from 'react';
import { Link } from 'react-router';
import type { Route } from "./+types/favorites";
import { CarGrid } from '~/components/car/CarGrid';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Heart, Search, Trash2 } from 'lucide-react';
import { mockCars } from '~/data/mockData';
import { useFavorites, useComparison } from '~/stores/useAppStore';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Favorite - AutoFans" },
    { name: "description", content: "Mașinile tale favorite salvate pentru vizualizare rapidă." },
  ];
}

export default function Favorites() {
  const { favorites, removeFromFavorites } = useFavorites();
  const { comparisonCars, addToComparison, removeFromComparison } = useComparison();

  // Debug logging
  useEffect(() => {
    console.log('📱 Favorites page - favorites:', favorites);
  }, [favorites]);

  const favoriteCars = mockCars.filter(car => favorites.includes(car.id));

  const handleFavorite = (carId: string) => {
    removeFromFavorites(carId);
  };

  const handleCompare = (carId: string) => {
    if (comparisonCars.includes(carId)) {
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

  const clearAllFavorites = () => {
    // Remove all favorites from the global store
    favoriteCars.forEach(car => removeFromFavorites(car.id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Mașinile tale favorite
              </h1>
              <p className="text-white">
                {favoriteCars.length} {favoriteCars.length === 1 ? 'mașină salvată' : 'mașini salvate'}
              </p>
            </div>

            {favoriteCars.length > 0 && (
              <Button
                variant="outline"
                onClick={clearAllFavorites}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Șterge toate
              </Button>
            )}
          </div>
        </div>

        {favoriteCars.length > 0 ? (
          <CarGrid
            cars={favoriteCars}
            loading={false}
            onLoadMore={() => {}}
            hasMore={false}
            onFavorite={handleFavorite}
            onCompare={handleCompare}
            onContact={handleContact}
            onView={handleView}
            viewMode="grid"
            favoritedCars={favorites}
            comparisonCars={comparisonCars}
          />
        ) : (
          <Card variant="elevated" padding="lg" className="text-center py-16">
            <div className=" mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
                <Heart className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Nu ai mașini favorite încă
              </h3>
              <p className="text-white mb-8">
                Salvează mașinile care îți plac pentru a le găsi mai ușor mai târziu.
                Apasă pe inima din colțul unei mașini pentru a o adăuga la favorite.
              </p>
              <Link to="/search">
                <Button variant="primary" className="flex items-center gap-2 mx-auto">
                  <Search className="h-4 w-4" />
                  Caută mașini
                </Button>
              </Link>
            </div>
          </Card>
        )}
    </div>
  );
}