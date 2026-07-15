import { useState, useEffect } from 'react';
import type { Route } from "./+types/compare";
import type { LoaderFunctionArgs } from 'react-router';
import { ComparisonTable } from '~/components/ui/ComparisonTable';
import { CarCard } from '~/components/car/CarCard';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Badge } from '~/components/ui/Badge';
import { ArrowLeft, Plus, X, Download, Share2 } from 'lucide-react';
import { Link, useLoaderData, useNavigate } from 'react-router';
import { getSupabaseServerClient } from '~/lib/supabase.server';
import type { Car } from '~/types';
import { mapListingToCar } from '~/utils/listingMapper';
import { signListingImages } from '~/utils/listingImages';
import { useComparison, useFavorites } from '~/stores/useAppStore';
import { trackAnalyticsEvent } from '~/utils/analytics.client';

const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Compară mașini - AutoFans" },
    { name: "description", content: "Compară specificațiile și prețurile mașinilor pentru a lua cea mai bună decizie." },
    { name: "robots", content: "noindex,follow" },
    { tagName: "link", rel: "canonical", href: "https://www.autofans.ro/compare" },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const ids = [...new Set(
    (new URL(request.url).searchParams.get('cars')?.split(',') || [])
      .filter((id) => /^\d+$/.test(id)),
  )].slice(0, 3);
  if (!ids.length) return { listings: [], signedMap: {} as Record<string, string>, unavailableCount: 0, loadError: null };

  try {
    const { supabase } = getSupabaseServerClient(request);
    const { data: listings } = await supabase
      .from('listings')
      .select('id, slug, owner_id, title, description, price, currency, make, model, year, mileage, fuel_type, transmission, body_type, vin, vin_verified, history_checked, images, created_at, owners, service_history, engine_size, power, doors, seats, condition_overall, condition_exterior, condition_interior, condition_engine, condition_transmission, has_accidents, features, city, county')
      .in('id', ids)
      .eq('status', 'published');

    const signedMap = await signListingImages(supabase, listings || [], 60 * 60, {
      width: 720, height: 450, quality: 72, resize: 'cover',
    });

    const listingById = new Map((listings || []).map((listing: any) => [String(listing.id), listing]));
    const orderedListings = ids.map((id) => listingById.get(id)).filter(Boolean);
    return {
      listings: orderedListings,
      signedMap,
      unavailableCount: ids.length - orderedListings.length,
      loadError: null,
    };
  } catch (error) {
    console.error('compare loader error:', error);
    return {
      listings: [],
      signedMap: {} as Record<string, string>,
      unavailableCount: 0,
      loadError: 'Nu am putut încărca comparația. Reîncarcă pagina și încearcă din nou.',
    };
  }
}

export default function Compare() {
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [comparisonCars, setComparisonCars] = useState<Car[]>([]);
  const [shareStatus, setShareStatus] = useState('');
  const { addToComparison, removeFromComparison, clearComparison: clearStoredComparison } = useComparison();
  const { isFavorited, addToFavorites, removeFromFavorites } = useFavorites();

  useEffect(() => {
    const mappedCars = data.listings.map((listing: any) => mapListingToCar(listing, data.signedMap));
    setComparisonCars(mappedCars);
    mappedCars.forEach((car) => addToComparison(car.id));
  }, [addToComparison, data]);

  const setComparisonUrl = (cars: Car[]) => {
    const ids = cars.map((car) => car.id).join(',');
    navigate(ids ? `/compare?cars=${ids}` : '/compare', { replace: true });
  };

  const removeCarFromComparison = (carId: string) => {
    const newComparison = comparisonCars.filter(car => car.id !== carId);
    removeFromComparison(carId);
    setComparisonCars(newComparison);
    setComparisonUrl(newComparison);
  };

  const clearComparison = () => {
    clearStoredComparison();
    setComparisonCars([]);
    setComparisonUrl([]);
  };

  const exportComparison = () => {
    if (!comparisonCars.length) return;
    const columns = comparisonCars.map((car) => car.title);
    const rows: Array<Array<string | number>> = [
      ['Caracteristică', ...columns],
      ['Preț', ...comparisonCars.map((car) => new Intl.NumberFormat('ro-RO', { style: 'currency', currency: car.currency, minimumFractionDigits: 0 }).format(car.price))],
      ['An fabricație', ...comparisonCars.map((car) => car.year)],
      ['Kilometraj', ...comparisonCars.map((car) => `${new Intl.NumberFormat('ro-RO').format(car.mileage)} km`)],
      ['Combustibil', ...comparisonCars.map((car) => car.fuelType)],
      ['Transmisie', ...comparisonCars.map((car) => car.transmission)],
      ['Locație', ...comparisonCars.map((car) => `${car.location.city}, ${car.location.county}`)],
      ['Istoric service', ...comparisonCars.map((car) => car.serviceHistory ? 'Declarat' : 'Nedeclarat')],
      ['Accidente', ...comparisonCars.map((car) => car.condition.hasAccidents ? 'Declarate' : 'Nedeclarate')],
      ['Link anunț', ...comparisonCars.map((car) => `${window.location.origin}/car/${encodeURIComponent(car.slug || car.id)}`)],
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\n')}`;
    const dataBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'comparatie-masini-autofans.csv';
    link.click();
    URL.revokeObjectURL(url);
    setShareStatus('Comparația a fost descărcată în format CSV.');
  };

  const shareComparison = () => {
    const carIds = comparisonCars.map(c => c.id).join(',');
    const shareUrl = `${window.location.origin}/compare?cars=${carIds}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Comparație mașini - AutoFans',
        text: `Compară aceste ${comparisonCars.length} mașini pe AutoFans`,
        url: shareUrl,
      }).then(() => trackAnalyticsEvent('comparison_shared', { listing_count: comparisonCars.length })).catch(() => undefined);
    } else {
      const copyLink = navigator.clipboard?.writeText(shareUrl);
      if (!copyLink) {
        setShareStatus(`Copiază linkul: ${shareUrl}`);
        return;
      }
      copyLink
        .then(() => {
          setShareStatus('Linkul de comparație a fost copiat.');
          trackAnalyticsEvent('comparison_shared', { listing_count: comparisonCars.length });
        })
        .catch(() => setShareStatus(`Copiază linkul: ${shareUrl}`));
    }
  };

  const handleFavorite = (carId: string) => {
    if (isFavorited(carId)) removeFromFavorites(carId);
    else {
      addToFavorites(carId);
      trackAnalyticsEvent('favorite_added', { listing_id: carId, source: 'comparison' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/search" className="mb-4 inline-flex items-center text-accent-gold hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Înapoi la căutare
          </Link>
          
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-white">
                Compară mașini
              </h1>
              <p className="text-gray-400">
                {comparisonCars.length > 0 
                  ? `Compari ${comparisonCars.length} ${comparisonCars.length === 1 ? 'mașină' : 'mașini'}`
                  : 'Selectează mașini pentru a le compara'
                }
              </p>
            </div>

            {comparisonCars.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={exportComparison}
                  className="flex items-center gap-2 border-white/20 text-white"
                >
                  <Download className="h-4 w-4" />
                  Descarcă CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={shareComparison}
                  className="flex items-center gap-2 border-white/20 text-white"
                >
                  <Share2 className="h-4 w-4" />
                  Partajează
                </Button>
                <Button
                  variant="outline"
                  onClick={clearComparison}
                  className="flex items-center gap-2 border-white/20 text-white"
                >
                  <X className="h-4 w-4" />
                  Șterge toate
                </Button>
              </div>
            )}
          </div>
          {shareStatus && <p className="mt-3 max-w-2xl break-words text-sm text-gray-300" role="status">{shareStatus}</p>}
          {data.loadError && <p className="mt-3 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-100" role="alert">{data.loadError}</p>}
          {data.unavailableCount > 0 && (
            <p className="mt-3 rounded-xl border border-accent-gold/25 bg-accent-gold/10 p-3 text-sm text-gray-200" role="status">
              {data.unavailableCount === 1 ? 'Un anunț din link nu mai este disponibil și nu a fost inclus.' : `${data.unavailableCount} anunțuri din link nu mai sunt disponibile și nu au fost incluse.`}
            </p>
          )}
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
                    variant="grid"
                    isFavorited={isFavorited(car.id)}
                    isInComparison={true}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCarFromComparison(car.id)}
                  className="absolute right-2 top-2 border border-white/20 bg-secondary-950/90 text-white hover:bg-secondary-900"
                  aria-label={`Elimină ${car.title} din comparație`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {comparisonCars.length < 3 && (
                <Link to="/search" className="block">
                <Card variant="outlined" padding="lg" className="h-full border-2 border-dashed border-white/20 bg-white/[0.03] transition hover:border-accent-gold/60 hover:bg-accent-gold/[0.04]">
                  <div className="text-center py-8">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-gold/15">
                      <Plus className="h-6 w-6 text-accent-gold" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-white">
                      Adaugă o mașină
                    </h3>
                    <p className="mb-4 text-gray-400">
                      Poți compara până la 3 mașini
                    </p>
                    <Badge variant="secondary">
                      {comparisonCars.length}/3 mașini
                    </Badge>
                  </div>
                </Card>
                </Link>
              )}
            </div>

            {/* Comparison Table */}
            <ComparisonTable cars={comparisonCars} onRemoveCar={removeCarFromComparison} enableExport={false} />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Empty State */}
            <Card variant="elevated" padding="lg" className="py-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent-gold/15">
                  <Plus className="h-8 w-8 text-accent-gold" />
                </div>
                <h3 className="mb-4 text-xl font-semibold text-white">
                  Începe o comparație
                </h3>
                <p className="mb-8 text-gray-400">
                  Selectează mașinile pe care vrei să le compari pentru a vedea diferențele 
                  între specificații, prețuri și caracteristici.
                </p>
                <Button asChild variant="primary">
                  <Link to="/search">
                    Caută mașini
                  </Link>
                </Button>
              </div>
            </Card>

          </div>
        )}
    </div>
  );
}
