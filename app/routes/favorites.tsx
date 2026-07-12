import { Link } from 'react-router';
import { useEffect, useState } from 'react';
import type { Route } from "./+types/favorites";
import type { Car } from '~/types';
import { mapListingToCar } from '~/utils/listingMapper';
import { signListingImages } from '~/utils/listingImages';
import { getSupabaseBrowserClient } from '~/lib/supabase.client';
import { CarGrid } from '~/components/car/CarGrid';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Heart, Search, Trash2 } from 'lucide-react';
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
  const [favoriteCars, setFavoriteCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFavoriteCars() {
      if (!favorites.length) {
        setFavoriteCars([]);
        return;
      }

      setIsLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: listings, error } = await supabase
          .from('listings')
          .select('id, slug, owner_id, title, description, price, currency, make, model, year, mileage, fuel_type, transmission, images, created_at, city, county')
          .in('id', favorites)
          .eq('status', 'published');
        if (error) throw error;

        const signedMap = await signListingImages(supabase, listings || []);

        const cars: Car[] = (listings || []).map((listing: any) => mapListingToCar(listing, signedMap));
        if (!cancelled) setFavoriteCars(cars);
      } catch (error) {
        console.error('favorites loader error:', error);
        if (!cancelled) setFavoriteCars([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadFavoriteCars();
    return () => { cancelled = true; };
  }, [favorites]);

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

        {isLoading ? (
          <div className="py-16 text-center text-white">Se încarcă favoritele...</div>
        ) : favoriteCars.length > 0 ? (
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
