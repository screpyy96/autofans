import { useRef, useState, useEffect } from 'react';
import type { Route } from "./+types/car.$slug";
import { type LoaderFunctionArgs, useLoaderData } from "react-router";
import { getSupabaseServerClient } from "~/lib/supabase.server";
import { CarDetails } from '~/components/car/CarDetails';
import { LoanCalculator } from '~/components/calculator/LoanCalculator';
import { ContactModal } from '~/components/ui/ContactModal';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Calculator, MessageCircle } from 'lucide-react';
import type { Car, Image } from '~/types';
import { FuelType, TransmissionType } from "~/types";
import { useComparison } from '~/stores/useAppStore';

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: "Detalii mașină - AutoFans" },
    { name: "description", content: "Vezi detaliile anunțului auto pe AutoFans." },
  ];
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const slugParam = params.slug;
  if (!slugParam) return { listing: null };
  try {
    const { supabase, headers } = getSupabaseServerClient(request);
    let { data: listing } = await supabase
      .from('listings')
      .select('id, slug, owner_id, title, description, price, currency, make, model, year, mileage, fuel_type, transmission, body_type, images, created_at, owners, service_history, engine_size, power, doors, seats, condition_overall, condition_exterior, condition_interior, condition_engine, condition_transmission, has_accidents, features, city, county')
      .eq('slug', slugParam)
      .maybeSingle();

    // Keep old/id links working while all new search links use the canonical slug.
    if (!listing && (/^\d+$/.test(slugParam) || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugParam))) {
      const byId = await supabase
        .from('listings')
        .select('id, slug, owner_id, title, description, price, currency, make, model, year, mileage, fuel_type, transmission, body_type, images, created_at, owners, service_history, engine_size, power, doors, seats, condition_overall, condition_exterior, condition_interior, condition_engine, condition_transmission, has_accidents, features, city, county')
        .eq('id', slugParam)
        .maybeSingle();
      listing = byId.data;
    }

    let sellerProfile = null;
    if (listing?.owner_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, display_name, phone, avatar_url, role, is_verified, created_at')
        .eq('id', listing.owner_id)
        .single();
      sellerProfile = profile;
    }

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

    return { listing: listing ?? null, signedMap, sellerProfile };
  } catch (e) {
    console.error('car.$id loader error:', e);
    return { listing: null, signedMap: {}, sellerProfile: null };
  }
}

export default function CarDetail({ params }: Route.ComponentProps) {
  const data = useLoaderData() as any;
  const [isFavorited, setIsFavorited] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const contactRecorded = useRef(false);

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
      slug: l.slug || '',
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
      location: { id: 'loc-1', city: l.city || 'București', county: l.county || 'București', country: 'RO' },
      images: images.length ? images : [{ id: '0', url: '/placeholder-car.jpg', thumbnailUrl: '/placeholder-car.jpg', alt: 'car', order: 0, isMain: true }],
      specifications: {
        engineSize: l.engine_size ?? 0,
        power: l.power ?? 0,
        doors: l.doors ?? 4,
        seats: l.seats ?? 5,
        bodyType: l.body_type || undefined
      },
      features: l.features || [],
      condition: {
        overall: (l.condition_overall ?? 3) as any,
        exterior: (l.condition_exterior ?? 3) as any,
        interior: (l.condition_interior ?? 3) as any,
        engine: (l.condition_engine ?? 3) as any,
        transmission: (l.condition_transmission ?? 3) as any,
        hasAccidents: !!l.has_accidents
      },
      seller: {
        id: data.sellerProfile?.id || 'unknown',
        type: data.sellerProfile?.role === 'seller' ? 'dealer' : 'individual',
        name: data.sellerProfile?.display_name || data.sellerProfile?.email?.split('@')[0] || 'Vânzător',
        email: data.sellerProfile?.email || '',
        phone: data.sellerProfile?.phone || '',
        location: { id: 'loc-1', city: 'București', county: 'București', country: 'RO' },
        avatar: data.sellerProfile?.avatar_url || undefined,
        isVerified: !!data.sellerProfile?.is_verified,
      },
      description: l.description || '',
      createdAt: l.created_at ? new Date(l.created_at) : new Date(),
      updatedAt: l.created_at ? new Date(l.created_at) : new Date(),
      status: 'active' as any,
      viewCount: 0,
      favoriteCount: 0,
      contactCount: 0,
      owners: l.owners ?? 1,
      serviceHistory: !!l.service_history,
    };
  }

  const similarCars: Car[] = [];

  const listingId = car?.id;
  useEffect(() => {
    if (!listingId || typeof window === 'undefined') return;
    const viewedKey = `autofans:viewed:${listingId}`;
    if (sessionStorage.getItem(viewedKey)) return;
    sessionStorage.setItem(viewedKey, '1');

    void import('~/lib/supabase.client').then(({ getSupabaseBrowserClient }) => {
      const supabase = getSupabaseBrowserClient();
      let sessionId = localStorage.getItem('autofans_visitor_session');
      if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem('autofans_visitor_session', sessionId);
      }
      return supabase.from('listing_views').insert({ listing_id: Number(listingId), session_id: sessionId });
    }).catch((error) => console.warn('Unable to record listing view:', error));
  }, [listingId]);

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

  const recordContact = async () => {
    if (contactRecorded.current || !listingId) return;
    contactRecorded.current = true;
    try {
      const { getSupabaseBrowserClient } = await import('~/lib/supabase.client');
      await getSupabaseBrowserClient().from('listing_contacts').insert({ listing_id: Number(listingId), contact_type: 'seller' });
    } catch (error) {
      console.warn('Unable to record listing contact:', error);
    }
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
    window.location.href = `/car/${encodeURIComponent(carId)}`;
  };

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
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
          onSendMessage={async () => { await recordContact(); }}
          onScheduleCall={async () => { await recordContact(); }}
          onWhatsAppContact={() => { void recordContact(); }}
        />
      )}
    </div>
  );
}
