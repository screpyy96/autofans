import { useState, useEffect } from 'react';
import type { Route } from "./+types/compare";
import type { LoaderFunctionArgs } from 'react-router';
import { ComparisonTable } from '~/components/ui/ComparisonTable';
import { CarCard } from '~/components/car/CarCard';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Badge } from '~/components/ui/Badge';
import { ArrowLeft, Plus, X, Download, Share2 } from 'lucide-react';
import { Link, useLoaderData } from 'react-router';
import { getSupabaseServerClient } from '~/lib/supabase.server';
import type { Car } from '~/types';
import { mapListingToCar } from '~/utils/listingMapper';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Compară mașini - AutoFans" },
    { name: "description", content: "Compară specificațiile și prețurile mașinilor pentru a lua cea mai bună decizie." },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const ids = new URL(request.url).searchParams.get('cars')?.split(',').filter(Boolean) || [];
  if (!ids.length) return { listings: [], signedMap: {} as Record<string, string> };

  try {
    const { supabase } = getSupabaseServerClient(request);
    const { data: listings } = await supabase
      .from('listings')
      .select('id, slug, owner_id, title, description, price, currency, make, model, year, mileage, fuel_type, transmission, body_type, images, created_at, owners, service_history, engine_size, power, doors, seats, condition_overall, condition_exterior, condition_interior, condition_engine, condition_transmission, has_accidents, features, city, county')
      .in('id', ids)
      .eq('status', 'published');

    const paths = (listings || []).flatMap((listing: any) => {
      const images = Array.isArray(listing.images) ? listing.images : [];
      const main = images.find((image: any) => image?.isMain) || images[0];
      return main?.path ? [main.path] : [];
    });

    const signedMap: Record<string, string> = {};
    if (paths.length) {
      const { data: signed } = await supabase.storage.from('listing-images').createSignedUrls(paths, 60 * 60);
      for (const item of signed || []) {
        if (item?.path && item?.signedUrl) signedMap[item.path] = item.signedUrl;
      }
    }

    return { listings: listings || [], signedMap };
  } catch (error) {
    console.error('compare loader error:', error);
    return { listings: [], signedMap: {} as Record<string, string> };
  }
}

export default function Compare() {
  const data = useLoaderData<typeof loader>();
  const [comparisonCars, setComparisonCars] = useState<Car[]>([]);

  useEffect(() => {
    setComparisonCars(data.listings.map((listing: any) => mapListingToCar(listing, data.signedMap)));
  }, [data]);

  const removeCarFromComparison = (carId: string) => {
    const newComparison = comparisonCars.filter(car => car.id !== carId);
    setComparisonCars(newComparison);
    
    // Update localStorage
    const carIds = newComparison.map(c => c.id);
    localStorage.setItem('autofans_comparison', JSON.stringify(carIds));
  };

  const clearComparison = () => {
    setComparisonCars([]);
    localStorage.removeItem('autofans_comparison');
  };

  const exportComparison = () => {
    // Create a simple text export
    const exportData = comparisonCars.map(car => ({
      title: car.title,
      price: car.price,
      year: car.year,
      mileage: car.mileage,
      fuelType: car.fuelType,
      transmission: car.transmission,
      location: car.location
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'comparatie-masini-autofans.json';
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const shareComparison = () => {
    const carIds = comparisonCars.map(c => c.id).join(',');
    const shareUrl = `${window.location.origin}/compare?cars=${carIds}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Comparație mașini - AutoFans',
        text: `Compară aceste ${comparisonCars.length} mașini pe AutoFans`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link-ul de comparație a fost copiat în clipboard!');
    }
  };

  const handleFavorite = (carId: string) => {
    // Handle favorite logic
    console.log('Toggle favorite for car:', carId);
  };

  const handleContact = (carId: string) => {
    alert(`Contactare vânzător pentru mașina ${carId}`);
  };

  const handleView = (carId: string) => {
    window.location.href = `/car/${encodeURIComponent(carId)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/search" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Înapoi la căutare
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Compară mașini
              </h1>
              <p className="text-gray-600">
                {comparisonCars.length > 0 
                  ? `Compari ${comparisonCars.length} ${comparisonCars.length === 1 ? 'mașină' : 'mașini'}`
                  : 'Selectează mașini pentru a le compara'
                }
              </p>
            </div>

            {comparisonCars.length > 0 && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={exportComparison}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportă
                </Button>
                <Button
                  variant="outline"
                  onClick={shareComparison}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Partajează
                </Button>
                <Button
                  variant="outline"
                  onClick={clearComparison}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Șterge toate
                </Button>
              </div>
            )}
          </div>
        </div>

        {comparisonCars.length > 0 ? (
          <div className="space-y-8">
            {/* Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comparisonCars.map((car) => (
                <div key={car.id} className="relative">
                  <CarCard
                    car={car}
                    onFavorite={handleFavorite}
                    onCompare={() => removeCarFromComparison(car.id)}
                    onContact={handleContact}
                    onView={handleView}
                    variant="grid"
                    isFavorited={false}
                    isInComparison={true}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCarFromComparison(car.id)}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {comparisonCars.length < 3 && (
                <Card variant="outlined" padding="lg" className="border-dashed border-2 border-gray-300">
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                      <Plus className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Adaugă o mașină
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Poți compara până la 3 mașini
                    </p>
                    <Badge variant="secondary">
                      {comparisonCars.length}/3 mașini
                    </Badge>
                  </div>
                </Card>
              )}
            </div>

            {/* Comparison Table */}
            <ComparisonTable cars={comparisonCars} onRemoveCar={removeCarFromComparison} />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Empty State */}
            <Card variant="elevated" padding="lg" className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Începe o comparație
                </h3>
                <p className="text-gray-600 mb-8">
                  Selectează mașinile pe care vrei să le compari pentru a vedea diferențele 
                  între specificații, prețuri și caracteristici.
                </p>
                <Link to="/search">
                  <Button variant="primary">
                    Caută mașini
                  </Button>
                </Link>
              </div>
            </Card>

          </div>
        )}
    </div>
  );
}
