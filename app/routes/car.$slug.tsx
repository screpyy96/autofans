import { lazy, Suspense, useRef, useState, useEffect, type FormEvent } from 'react';
import type { Route } from "./+types/car.$slug";
import { type LoaderFunctionArgs, useLoaderData } from "react-router";
import { getSupabaseServerClient, hasSupabaseAuthCookie } from "~/lib/supabase.server";
import { CarDetails } from '~/components/car/CarDetails';
import type { ContactMode } from '~/components/ui/ContactModal';
import type { Car, Image } from '~/types';
import { FuelType, TransmissionType } from "~/types";
import { useComparison, useFavorites } from '~/stores/useAppStore';
import { mapListingStatus, mapListingToCar } from '~/utils/listingMapper';
import { calculateTrustScore } from '~/utils/trustScore';
import { calculatePriceScore } from '~/utils/priceScore';
import { trackAnalyticsEvent } from '~/utils/analytics.client';
import { signListingImages } from '~/utils/listingImages';

const ContactModal = lazy(() => import('~/components/ui/ContactModal').then(({ ContactModal: ContactModalComponent }) => ({ default: ContactModalComponent })));

function getVisitorSessionId() {
  const key = 'autofans_visitor_session';
  try {
    let sessionId = localStorage.getItem(key);
    if (!sessionId) {
      sessionId = typeof crypto?.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(key, sessionId);
    }
    return sessionId;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function currentActivityDay() {
  return new Date().toISOString().slice(0, 10);
}

export function meta({ data }: Route.MetaArgs) {
  const listing = data?.listing as any;
  if (!listing) return [{ title: "Anunț invalid - AutoFans" }];

  const title = `${listing.make} ${listing.model} ${listing.year} - ${listing.price?.toLocaleString('ro-RO')} ${listing.currency} | AutoFans`;
  const description = listing.description ? (listing.description.substring(0, 150) + "...") : `Cumpără ${listing.make} ${listing.model} din ${listing.year} la prețul de ${listing.price} ${listing.currency}.`;
  const canonicalUrl = `https://www.autofans.ro/car/${encodeURIComponent(listing.slug)}`;

  // A short-lived Storage URL breaks social previews after its expiry. Keep the
  // metadata URL stable; the image route signs a fresh cover when crawled.
  const mainImage = Array.isArray(listing.images) && listing.images.length
    ? `https://www.autofans.ro/og/car/${encodeURIComponent(listing.slug)}`
    : "https://www.autofans.ro/hero_background.jpg";

  return [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "index,follow,max-image-preview:large" },
    { tagName: "link", rel: "canonical", href: canonicalUrl },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: mainImage },
    { property: "og:url", content: canonicalUrl },
    { property: "og:type", content: "product" },
    { property: "og:site_name", content: "AutoFans.ro" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: mainImage }
  ];
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const slugParam = params.slug;
  if (!slugParam) return { listing: null };
  try {
    const { supabase, headers } = getSupabaseServerClient(request);
    const { data: { user } } = hasSupabaseAuthCookie(request)
      ? await supabase.auth.getUser()
      : { data: { user: null } };
    let { data: listing } = await supabase
      .from('listings')
      .select('id, slug, owner_id, title, description, price, currency, make, model, year, mileage, fuel_type, transmission, body_type, vin, vin_verified, history_checked, images, status, created_at, owners, service_history, engine_size, power, doors, seats, condition_overall, condition_exterior, condition_interior, condition_engine, condition_transmission, has_accidents, features, city, county')
      .eq('slug', slugParam)
      .eq('status', 'published')
      .maybeSingle();

    // Keep old/id links working while all new search links use the canonical slug.
    if (!listing && (/^\d+$/.test(slugParam) || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugParam))) {
      const byId = await supabase
        .from('listings')
        .select('id, slug, owner_id, title, description, price, currency, make, model, year, mileage, fuel_type, transmission, body_type, vin, vin_verified, history_checked, images, status, created_at, owners, service_history, engine_size, power, doors, seats, condition_overall, condition_exterior, condition_interior, condition_engine, condition_transmission, has_accidents, features, city, county')
        .eq('id', slugParam)
        .eq('status', 'published')
        .maybeSingle();
      listing = byId.data;
    }

    if (!listing) throw new Response('Not Found', { status: 404 });

    const [sellerProfileResult, comparablesResult, similarListingsResult, metricsResult] = listing
      ? await Promise.all([
          listing.owner_id
            ? supabase
                .from('profiles')
                // Public listing data identifies the seller without exposing
                // the email address stored on their account.
                .select('id, display_name, phone, avatar_url, role, is_verified, created_at')
                .eq('id', listing.owner_id)
                .single()
            : Promise.resolve({ data: null }),
          listing.make && listing.model && listing.year
            ? supabase
                .from('listings')
                .select('id, price, currency, year, mileage')
                .eq('status', 'published')
                .eq('make', listing.make)
                .eq('model', listing.model)
                .neq('id', listing.id)
                .gte('year', Number(listing.year) - 3)
                .lte('year', Number(listing.year) + 3)
                .limit(60)
            : Promise.resolve({ data: [] }),
          listing.make && listing.model && listing.year
            ? supabase
                .from('listings')
                .select('id, slug, owner_id, title, price, currency, make, model, year, mileage, fuel_type, transmission, images, status, city, county, created_at')
                .eq('status', 'published')
                .eq('make', listing.make)
                .eq('model', listing.model)
                .neq('id', listing.id)
                .gte('year', Number(listing.year) - 3)
                .lte('year', Number(listing.year) + 3)
                .order('created_at', { ascending: false })
                .limit(6)
            : Promise.resolve({ data: [] }),
          supabase.rpc('get_public_listing_metrics', { p_listing_id: listing.id }).maybeSingle(),
        ])
      : [{ data: null }, { data: [] }, { data: [] }, { data: null }];
    const sellerProfile = sellerProfileResult.data;
    const priceScore = listing ? calculatePriceScore(listing, comparablesResult.data || []) : null;
    const listingMetricsAvailable = !metricsResult.error;
    const listingMetrics = metricsResult.data || { view_count: 0, contact_count: 0, favorite_count: 0 };
    const similarListings = similarListingsResult.data || [];

    let signedMap: Record<string, string> = {};
    let mobileMap: Record<string, string> = {};
    let thumbnailMap: Record<string, string> = {};
    let similarImageMap: Record<string, string> = {};
    if (listing?.images?.length || similarListings.length) {
      // The gallery's main image needs detail, while every visible thumbnail
      // must stay tiny. Reusing the full photo for both wastes multiple MB on
      // mobile as soon as a listing has several photos.
      [signedMap, mobileMap, thumbnailMap, similarImageMap] = await Promise.all([
        signListingImages(supabase as any, [listing], 60 * 60, {
          width: 1440, height: 1080, quality: 78, resize: 'contain',
        }),
        signListingImages(supabase as any, [listing], 60 * 60, {
          width: 640, height: 480, quality: 68, resize: 'contain',
        }),
        signListingImages(supabase as any, [listing], 60 * 60, {
          width: 240, height: 180, quality: 58, resize: 'cover',
        }),
        signListingImages(supabase as any, similarListings, 60 * 60, {
          width: 480, height: 360, quality: 65, resize: 'cover',
        }),
      ]);
    }

    return { listing: listing ?? null, signedMap, mobileMap, thumbnailMap, similarListings, similarImageMap, sellerProfile, listingMetrics, listingMetricsAvailable, priceScore, userId: user?.id || null };
  } catch (e) {
    if (e instanceof Response) throw e;
    console.error('car.$id loader error:', e);
    throw new Response('Could not load listing', { status: 500 });
  }
}

export default function CarDetail({ params }: Route.ComponentProps) {
  const data = useLoaderData() as any;
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMode, setContactMode] = useState<ContactMode>('message');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const contactRecorded = useRef(false);
  const viewedListingId = useRef<string | null>(null);

  useEffect(() => {
    const id = data?.listing?.id ? String(data.listing.id) : null;
    if (!id || viewedListingId.current === id) return;
    viewedListingId.current = id;
    trackAnalyticsEvent('listing_view', { listing_id: id });
  }, [data?.listing?.id]);

  let car: Car | undefined = undefined;
  if (data?.listing) {
    const l = data.listing as any;
    const trust = calculateTrustScore(l, data.sellerProfile);
    const images: Image[] = (l.images || [])
      .map((img: any, idx: number) => {
        const desktopUrl = data.signedMap?.[img.path] || '';
        const mobileUrl = data.mobileMap?.[img.path] || desktopUrl;
        return {
          id: String(idx),
          url: desktopUrl,
          thumbnailUrl: data.thumbnailMap?.[img.path] || desktopUrl,
          srcSet: mobileUrl && desktopUrl ? `${mobileUrl} 640w, ${desktopUrl} 1440w` : undefined,
          sizes: '(max-width: 767px) 100vw, (max-width: 1440px) 100vw, 1440px',
          alt: l.title,
          order: idx,
          isMain: !!img.isMain,
        };
      })
      .filter((i: Image) => !!i.url);

    car = {
      id: String(l.id),
      slug: l.slug || '',
      trustScore: trust.score,
      trustLevel: trust.level,
      trustSignals: trust.signals,
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
      images,
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
        id: data.sellerProfile?.id || l.owner_id || 'unknown',
        type: data.sellerProfile?.role === 'seller' ? 'dealer' : 'individual',
        name: data.sellerProfile?.display_name || 'Vânzător',
        email: '',
        phone: data.sellerProfile?.phone || '',
        location: { id: 'loc-1', city: 'București', county: 'București', country: 'RO' },
        avatar: data.sellerProfile?.avatar_url || undefined,
        isVerified: !!data.sellerProfile?.is_verified,
      },
      description: l.description || '',
      createdAt: l.created_at ? new Date(l.created_at) : new Date(),
      updatedAt: l.created_at ? new Date(l.created_at) : new Date(),
      status: mapListingStatus(l.status),
      viewCount: Number(data.listingMetrics?.view_count || 0),
      favoriteCount: Number(data.listingMetrics?.favorite_count || 0),
      contactCount: Number(data.listingMetrics?.contact_count || 0),
      owners: l.owners ?? 1,
      serviceHistory: !!l.service_history,
    };
  }

  const similarCars: Car[] = (data.similarListings || []).map((listing: any) =>
    mapListingToCar(listing, data.similarImageMap || {}),
  );

  const listingId = car?.id;
  useEffect(() => {
    if (!listingId || typeof window === 'undefined') return;
    // A seller previewing their own listing is not buyer interest and must not
    // inflate the real dashboard metrics.
    if (data.userId && data.userId === data.listing?.owner_id) return;
    const viewedKey = `autofans:viewed:${listingId}`;
    if (sessionStorage.getItem(viewedKey)) return;
    sessionStorage.setItem(viewedKey, '1');

    void import('~/lib/supabase.client').then(async ({ getSupabaseBrowserClient }) => {
      const supabase = getSupabaseBrowserClient();
      // The browser records this only once per tab/session. Using INSERT keeps
      // this write compatible with the intentionally restrictive RLS policy:
      // Postgres upserts also require read/update access to activity rows.
      const { error } = await supabase.from('listing_views').insert({
        listing_id: Number(listingId),
        visitor_id: data.userId || null,
        session_id: getVisitorSessionId(),
        viewed_on: currentActivityDay(),
      });
      // A second tab can race with this tab. That is an expected duplicate,
      // not an error a visitor or developer needs to act on.
      if (error && error.code !== '23505') throw error;
    }).catch((error) => console.warn('Unable to record listing view:', error));
  }, [listingId, data.userId, data.listing?.owner_id]);

  const { isInComparison, addToComparison, removeFromComparison } = useComparison();
  const { isFavorited: isListingFavorited, addToFavorites, removeFromFavorites } = useFavorites();

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

  const openContact = (mode: ContactMode) => {
    if (!data.userId) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (data.userId === data.listing?.owner_id) {
      setFeedbackMessage('Acesta este anunțul tău. Mesajele cumpărătorilor apar în secțiunea „Mesaje”.');
      return;
    }
    setContactMode(mode);
    setShowContactModal(true);
  };

  const handleContactSeller = () => openContact('message');

  const recordContact = async (contactType: 'message' | 'viewing' | 'whatsapp') => {
    if (contactRecorded.current || !listingId) return;
    try {
      const { getSupabaseBrowserClient } = await import('~/lib/supabase.client');
      const { error } = await getSupabaseBrowserClient().from('listing_contacts').insert({
        listing_id: Number(listingId),
        visitor_id: data.userId || null,
        session_id: getVisitorSessionId(),
        contact_type: contactType,
        contacted_on: currentActivityDay(),
      });
      // A duplicate contact event from another tab is deliberately ignored;
      // one interest signal per listing, session and day is enough.
      if (error && error.code !== '23505') throw error;
      contactRecorded.current = true;
    } catch (error) {
      console.warn('Unable to record listing contact:', error);
    }
  };

  const handleScheduleViewing = () => openContact('viewing');

  const handleAddToCompare = () => {
    if (isInComparison(car.id)) {
      removeFromComparison(car.id);
    } else {
      addToComparison(car.id);
      trackAnalyticsEvent('comparison_added', { listing_id: car.id });
    }
  };

  const handleAddToFavorites = () => {
    if (!car) return;
    if (isListingFavorited(car.id)) removeFromFavorites(car.id);
    else {
      addToFavorites(car.id);
      trackAnalyticsEvent('favorite_added', { listing_id: car.id });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: car.title,
          text: `Verifică această mașină pe AutoFans: ${car.title}`,
          url: window.location.href,
        });
      } catch (error) {
        if ((error as DOMException)?.name !== 'AbortError') {
          setFeedbackMessage('Nu am putut deschide opțiunile de distribuire. Încearcă din nou.');
        }
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setFeedbackMessage('Link copiat în clipboard.');
    } catch {
      setFeedbackMessage('Nu am putut copia linkul. Poți copia adresa direct din browser.');
    }
  };

  const openReport = () => {
    if (!data.userId) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (data.userId === data.listing?.owner_id) {
      setFeedbackMessage('Nu poți raporta propriul anunț.');
      return;
    }
    setReportOpen(true);
  };

  const submitReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!listingId || !data.userId || !reportReason || reportSubmitting) return;
    setReportSubmitting(true);
    try {
      const { getSupabaseBrowserClient } = await import('~/lib/supabase.client');
      const { error } = await getSupabaseBrowserClient().from('listing_reports').insert({
        listing_id: Number(listingId),
        reporter_id: data.userId,
        reason: reportReason,
        details: reportDetails.trim().slice(0, 1000),
      });
      if (error) {
        if (error.code === '23505') throw new Error('Ai deja un raport deschis pentru acest motiv.');
        throw error;
      }
      setReportOpen(false);
      setReportReason('');
      setReportDetails('');
      setFeedbackMessage('Mulțumim. Echipa AutoFans va verifica raportul.');
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : 'Raportul nu a putut fi trimis. Încearcă din nou.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: car.title,
    description: car.description || `${car.brand} ${car.model}, ${car.year}`,
    sku: car.id,
    url: `https://www.autofans.ro/car/${encodeURIComponent(car.slug)}`,
    // Use the stable image endpoint rather than an expiring Storage URL so
    // Google's structured-data crawler can retrieve the cover consistently.
    image: car.images.length ? `https://www.autofans.ro/og/car/${encodeURIComponent(car.slug)}` : undefined,
    brand: { '@type': 'Brand', name: car.brand },
    category: 'Autoturism',
    itemCondition: 'https://schema.org/UsedCondition',
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'An fabricație', value: car.year },
      { '@type': 'PropertyValue', name: 'Kilometraj', value: car.mileage, unitCode: 'KMT' },
      { '@type': 'PropertyValue', name: 'Combustibil', value: car.fuelType },
      { '@type': 'PropertyValue', name: 'Transmisie', value: car.transmission },
    ],
    offers: {
      '@type': 'Offer',
      url: `https://www.autofans.ro/car/${encodeURIComponent(car.slug)}`,
      price: car.price,
      priceCurrency: car.currency,
      availability: car.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/UsedCondition',
    },
  };

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      {feedbackMessage && (
        <div className="fixed inset-x-4 top-20 z-[70] mx-auto max-w-md rounded-2xl border border-accent-gold/35 bg-secondary-950/95 px-4 py-3 text-sm font-medium text-white shadow-modal backdrop-blur-xl" role="status" aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <span>{feedbackMessage}</span>
            <button type="button" onClick={() => setFeedbackMessage('')} className="shrink-0 text-accent-gold hover:text-white" aria-label="Închide mesajul">×</button>
          </div>
        </div>
      )}
      <CarDetails
        car={car}
        priceScore={data.priceScore}
        metricsAvailable={data.listingMetricsAvailable !== false}
        onContactSeller={handleContactSeller}
        onScheduleViewing={handleScheduleViewing}
        onAddToCompare={handleAddToCompare}
        onAddToFavorites={handleAddToFavorites}
        onShare={handleShare}
        similarCars={similarCars}
        isFavorited={isListingFavorited(car.id)}
        isInComparison={isInComparison(car.id)}
      />

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5" aria-labelledby="report-listing-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="report-listing-heading" className="text-sm font-semibold text-white">Ai observat ceva în neregulă?</h2>
            <p className="mt-1 text-sm text-gray-400">Raportează doar informații false, tentative de fraudă sau conținut nepotrivit.</p>
          </div>
          <button type="button" onClick={openReport} className="min-h-10 shrink-0 rounded-xl border border-white/15 px-4 text-sm font-semibold text-gray-200 transition hover:border-red-300/50 hover:bg-red-500/10 hover:text-red-100">
            Raportează anunțul
          </button>
        </div>

        {reportOpen && (
          <form onSubmit={submitReport} className="mt-4 grid gap-3 border-t border-white/10 pt-4">
            <label className="grid gap-1.5 text-sm font-medium text-gray-200">
              Motivul raportării
              <select value={reportReason} onChange={(event) => setReportReason(event.target.value)} required className="min-h-11 rounded-xl border border-white/15 bg-secondary-900 px-3 text-white outline-none focus:border-accent-gold">
                <option value="">Alege un motiv</option>
                <option value="fraud">Posibilă fraudă sau solicitare suspectă</option>
                <option value="incorrect_details">Informații importante incorecte</option>
                <option value="duplicate">Anunț duplicat</option>
                <option value="offensive_content">Conținut nepotrivit</option>
                <option value="other">Alt motiv</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-gray-200">
              Detalii (opțional)
              <textarea value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} maxLength={1000} rows={3} className="resize-y rounded-xl border border-white/15 bg-secondary-900 px-3 py-2 text-white outline-none placeholder:text-gray-500 focus:border-accent-gold" placeholder="Spune-ne pe scurt ce ai observat." />
            </label>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setReportOpen(false)} className="min-h-10 rounded-xl px-4 text-sm font-semibold text-gray-300 hover:bg-white/5">Anulează</button>
              <button type="submit" disabled={!reportReason || reportSubmitting} className="min-h-10 rounded-xl bg-red-500 px-4 text-sm font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50">
                {reportSubmitting ? 'Se trimite…' : 'Trimite raportul'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Contact Modal */}
      {showContactModal && (
        <Suspense fallback={null}>
          <ContactModal
            isOpen={showContactModal}
            onClose={() => setShowContactModal(false)}
            car={car}
            seller={car.seller}
            initialMode={contactMode}
            onSendMessage={async (message) => {
              const response = await fetch('/api/messages/start', {
                method: 'POST',
                headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: new URLSearchParams({ intent: 'start', listingId: car.id, body: message.message }),
              });
              const result = await response.json().catch(() => null) as { error?: string; conversationId?: number } | null;
              if (!response.ok || !result?.conversationId) {
                const fallback = response.status === 401
                  ? 'Sesiunea a expirat. Autentifică-te din nou și retrimite mesajul.'
                  : response.status === 404
                    ? 'Anunțul sau serviciul de mesagerie nu este disponibil momentan. Reîncarcă pagina și încearcă din nou.'
                    : 'Mesajul nu a putut fi trimis. Încearcă din nou.';
                throw new Error(result?.error || fallback);
              }
              await recordContact(message.mode === 'viewing' ? 'viewing' : 'message');
              window.location.href = `/messages?conversation=${result.conversationId}`;
            }}
            onWhatsAppContact={(message) => { void recordContact(message.mode === 'viewing' ? 'viewing' : 'whatsapp'); }}
          />
        </Suspense>
      )}
    </div>
  );
}
