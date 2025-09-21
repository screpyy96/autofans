import { useState } from 'react';
import type { Route } from "./+types/car.$id";
import { type LoaderFunctionArgs, useLoaderData } from "react-router";
import { getSupabaseServerClient } from "~/lib/supabase.server";
import { CarDetails } from '~/components/car/CarDetails';
import { LoanCalculator } from '~/components/calculator/LoanCalculator';
import { ContactModal } from '~/components/ui/ContactModal';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Calculator, MessageCircle } from 'lucide-react';
import { mockCars } from '~/data/mockData';
import type { Car, Image } from '~/types';
import { FuelType, TransmissionType } from "~/types";
import { useComparison } from '~/stores/useAppStore';

export function meta({ params }: Route.MetaArgs) {
  const car = mockCars.find(c => c.id === params.id);
  
  if (!car) {
    return [
      { title: "Mașină nu a fost găsită - AutoFans" },
    ];
  }

  return [
    { title: `${car.title} - AutoFans` },
    { name: "description", content: car.description.substring(0, 160) + "..." },
  ];
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const idParam = params.id;
  if (!idParam) return { listing: null };
  try {
    const { supabase, headers } = getSupabaseServerClient(request);
    const { data: listing } = await supabase
      .from('listings')
      .select('id, title, description, price, currency, make, model, year, mileage, fuel_type, transmission, body_type, images, created_at')
      .eq('id', Number(idParam))
      .single();

    let signedMap: Record<string, string> = {};
    if (listing?.images?.length) {
      const paths: string[] = (listing.images as any[])
        .map((i) => i?.path)
        .filter(Boolean);
      if (paths.length) {
        const { data: signed } = await supabase
          .storage
          .from('listing-images')
          .createSignedUrls(paths, 60 * 60);
        for (const item of signed || []) {
          const it: any = item;
          if (it?.path && it?.signedUrl) signedMap[it.path] = it.signedUrl as string;
        }
      }
    }

    return { listing: listing ?? null, signedMap };
  } catch (e) {
    console.error('car.$id loader error:', e);
    return { listing: null, signedMap: {} };
  }
}

export default function CarDetail({ params }: Route.ComponentProps) {
  const data = useLoaderData() as any;
  const [isFavorited, setIsFavorited] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  let car: Car | undefined = undefined;
  if (data?.listing) {
    const l = data.listing as any;
    const images: Image[] = (l.images || [])
      .map((img: any, idx: number) => ({
        id: String(idx),
        url: data.signedMap?.[img.path] || '',
        thumbnailUrl: data.signedMap?.[img.path] || '',
        alt: l.title,
        order: idx,
        isMain: !!img.isMain,
      }))
      .filter((i: Image) => !!i.url);

    car = {
      id: String(l.id),
      title: l.title || `${l.make} ${l.model}`,
      brand: l.make || '—',
      model: l.model || '—',
      year: l.year || new Date().getFullYear(),
      mileage: l.mileage || 0,
      fuelType: (l.fuel_type as FuelType) || FuelType.PETROL,
      transmission: (l.transmission as TransmissionType) || TransmissionType.MANUAL,
      price: Number(l.price || 0),
      currency: l.currency || 'EUR',
      negotiable: false,
      location: { id: 'loc-1', city: 'București', county: 'București', country: 'RO' },
      images: images.length ? images : [{ id: '0', url: '/placeholder-car.jpg', thumbnailUrl: '/placeholder-car.jpg', alt: 'car', order: 0, isMain: true }],
      specifications: { engineSize: 0, power: 0, doors: 4, seats: 5 },
      features: [],
      condition: { overall: 3 as any, exterior: 3 as any, interior: 3 as any, engine: 3 as any, transmission: 3 as any, hasAccidents: false },
      seller: {
        id: 'seller', type: 'dealer', name: 'Vânzător', email: '', phone: '',
        location: { id: 'loc-1', city: 'București', county: 'București', country: 'RO' }, isVerified: true,
      },
      description: l.description || '',
      createdAt: l.created_at ? new Date(l.created_at) : new Date(),
      updatedAt: l.created_at ? new Date(l.created_at) : new Date(),
      status: 'active' as any,
      viewCount: 0,
      favoriteCount: 0,
      contactCount: 0,
      owners: 1,
      serviceHistory: false,
    };
  }

  if (!car) {
    car = mockCars.find(c => c.id === params.id);
  }
  const similarCars = mockCars.filter(c => c.id !== params.id && c.brand === car?.brand).slice(0, 4);

  const { isInComparison, addToComparison, removeFromComparison } = useComparison();

  if (!car) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Mașina nu a fost găsită
          </h1>
          <p className="text-gray-300 mb-8">
            Mașina pe care o cauți nu există sau a fost ștearsă.
          </p>
          <a href="/search" className="text-accent-gold hover:text-accent-gold/80">
            ← Înapoi la căutare
          </a>
        </div>
    );
  }

  const handleContactSeller = () => {
    setShowContactModal(true);
  };

  const handleScheduleViewing = () => {
    alert('Deschidere modal programare vizionare');
  };

  const handleAddToCompare = () => {
    if (isInComparison(car.id)) {
      removeFromComparison(car.id);
    } else {
      addToComparison(car.id);
    }
  };

  const handleAddToFavorites = () => {
    setIsFavorited(!isFavorited);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: car.title,
        text: `Verifică această mașină pe AutoFans: ${car.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiat în clipboard!');
    }
  };

  const handleSimilarCarClick = (carId: string) => {
    window.location.href = `/car/${carId}`;
  };

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <CarDetails
              car={car}
              onContactSeller={handleContactSeller}
              onScheduleViewing={handleScheduleViewing}
              onAddToCompare={handleAddToCompare}
              onAddToFavorites={handleAddToFavorites}
              onShare={handleShare}
              similarCars={similarCars}
              onSimilarCarClick={handleSimilarCarClick}
              isFavorited={isFavorited}
              isInComparison={isInComparison(car.id)}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <Card variant="elevated" padding="lg">
              <h3 className="text-lg font-semibold text-white mb-4">
                Acțiuni rapide
              </h3>
              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={handleContactSeller}
                  className="w-full flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Contactează vânzătorul
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="w-full flex items-center gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  Calculator credit
                </Button>
              </div>
            </Card>

            {/* Loan Calculator */}
            {showCalculator && (
              <Card variant="elevated" padding="lg">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Calculator credit auto
                </h3>
                <LoanCalculator car={car} />
              </Card>
            )}
          </div>
        </div>

        {/* Contact Modal */}
        {showContactModal && (
          <ContactModal
            isOpen={showContactModal}
            onClose={() => setShowContactModal(false)}
            car={car}
            seller={{
              id: 'seller-1',
              type: 'dealer',
              name: 'Ion Popescu',
              phone: '+40721123456',
              email: 'ion.popescu@email.com',
              isVerified: true,
              responseTime: '2 ore',
              rating: 4.8,
              location: {
                id: 'loc-bucuresti',
                city: 'București',
                county: 'București',
                country: 'RO'
              }
            }}
          />
        )}
      </div>
  );
}
