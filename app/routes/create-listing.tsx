import { useEffect, useRef, useState } from 'react';
import type { LoaderFunctionArgs } from 'react-router';
import { redirect, useLoaderData } from 'react-router';
import { getSupabaseServerClient } from '~/lib/supabase.server';
import type { Route } from "./+types/create-listing";
import { CreateListingWizard } from '~/components/listing/CreateListingWizard';
import type { ListingImageUpload } from '~/components/listing/ImageUpload';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { ArrowLeft, Shield, Clock, Star } from 'lucide-react';
import { Link } from 'react-router';
import { getSupabaseBrowserClient } from '~/lib/supabase.client';
import { generateUniqueSlug } from '~/utils/helpers';
import { coordinatesForLocation } from '~/utils/location';
import { isValidVin, normalizeVin } from '~/utils/vin';
import { validateListingForPublication } from '~/utils/listingPublication';
import { trackAnalyticsEvent } from '~/utils/analytics.client';

type StoredListingImage = { path?: string; isMain?: boolean };

async function getSignedImageMap(
  supabase: ReturnType<typeof getSupabaseServerClient>['supabase'],
  images: StoredListingImage[] | undefined,
) {
  const paths = (images || []).map((image) => image.path).filter((path): path is string => Boolean(path));
  if (!paths.length) return {} as Record<string, string>;

  const { data: signed } = await supabase.storage.from('listing-images').createSignedUrls(paths, 3600);
  return (signed || []).reduce<Record<string, string>>((map, item) => {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
    return map;
  }, {});
}

async function geocodeListingLocation(city: string, county: string): Promise<{ latitude: number; longitude: number } | null> {
  const fallback = coordinatesForLocation({ city });
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  if (!token || !city.trim()) return fallback ? { longitude: fallback[0], latitude: fallback[1] } : null;

  try {
    const query = encodeURIComponent(`${city}, ${county || 'Romania'}, Romania`);
    const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?q=${query}&country=ro&types=place,locality&limit=1&access_token=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error(`Mapbox geocoding failed: ${response.status}`);
    const payload = await response.json() as { features?: Array<{ geometry?: { coordinates?: [number, number] } }> };
    const [longitude, latitude] = payload.features?.[0]?.geometry?.coordinates || [];
    if (typeof latitude === 'number' && typeof longitude === 'number' && Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }
  } catch (error) {
    console.warn('Listing geocoding unavailable:', error);
  }

  return fallback ? { longitude: fallback[0], latitude: fallback[1] } : null;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Creează anunț - AutoFans" },
    { name: "description", content: "Creează un anunț pentru mașina ta și găsește cumpărători rapid și sigur." },
    { name: 'robots', content: 'noindex,nofollow' },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect(`/login?next=${encodeURIComponent(new URL(request.url).pathname)}`, { headers });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'seller') {
    return redirect('/dashboard', { headers });
  }

  const url = new URL(request.url);
  const editId = url.searchParams.get("edit");
  if (editId) {
    const { data: listing } = await supabase
      .from('listings')
      .select('*')
      .eq('id', Number(editId))
      .single();

    if (listing) {
      if (listing.owner_id !== user.id) {
        return redirect('/dashboard', { headers });
      }

      const signedMap = await getSignedImageMap(supabase, listing.images);

      return { listing, signedMap, userId: user.id };
    }
  }

  return { listing: null, signedMap: {}, userId: user.id };
}

export async function action({ request }: { request: Request }) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login', { headers });

  const url = new URL(request.url);
  const editId = url.searchParams.get("edit");

  const body = await request.json().catch(() => ({} as any));
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'seller') {
    return Response.json({ error: 'Doar conturile de vânzător pot crea sau salva anunțuri.' }, { status: 403 });
  }

  const vin = normalizeVin(body.vin);
  if (body.vin && !isValidVin(body.vin)) {
    return Response.json({ error: 'VIN-ul trebuie să aibă 17 caractere și nu poate conține I, O sau Q.' }, { status: 400 });
  }
  const validation = validateListingForPublication(body, user.id);
  if ('error' in validation) return Response.json({ error: validation.error }, { status: 400 });
  const published = validation.data;
  const coordinates = await geocodeListingLocation(published.city, published.county);
  const insert = {
    owner_id: user.id,
    title: published.title,
    description: published.description,
    price: published.price,
    currency: published.currency,
    make: published.make,
    model: published.model,
    year: published.year,
    mileage: published.mileage,
    fuel_type: published.fuelType,
    transmission: published.transmission,
    body_type: body.body_type,
    vin,
    images: published.images,
    status: 'published',
    // Condition, specs, location and detail columns
    owners: body.owners,
    service_history: body.service_history,
    engine_size: body.engine_size,
    power: body.power,
    doors: body.doors,
    seats: body.seats,
    condition_overall: body.condition_overall,
    condition_exterior: body.condition_exterior,
    condition_interior: body.condition_interior,
    condition_engine: body.condition_engine,
    condition_transmission: body.condition_transmission,
    has_accidents: body.has_accidents,
    features: body.features || [],
    city: published.city,
    county: published.county,
    latitude: coordinates?.latitude ?? null,
    longitude: coordinates?.longitude ?? null,
  };

  if (editId) {
    const { error } = await supabase
      .from('listings')
      .update(insert)
      .eq('id', Number(editId))
      .eq('owner_id', user.id);
    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ ok: true });
  } else {
    const finalInsert = {
      ...insert,
      slug: generateUniqueSlug(body.make, body.model, body.year)
    };
    const { error } = await supabase.from('listings').insert(finalInsert);
    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ ok: true });
  }
}

type LocalListingDraft = {
  formData: Record<string, unknown>;
  images: { path: string; isMain: boolean }[];
  signedMap: Record<string, string>;
};

export default function CreateListing() {
  const { listing, signedMap, userId } = useLoaderData<typeof loader>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploaded, setUploaded] = useState<{ path: string; isMain: boolean }[]>(() => {
    return listing?.images || [];
  });
  const [localDraft, setLocalDraft] = useState<LocalListingDraft | null>(null);
  const [isDraftHydrated, setIsDraftHydrated] = useState(Boolean(listing));
  const wizardEventTracked = useRef(false);
  const draftEventTracked = useRef(false);

  useEffect(() => {
    if (wizardEventTracked.current) return;
    wizardEventTracked.current = true;
    trackAnalyticsEvent('listing_wizard_opened', { mode: listing ? 'edit' : 'create' });
  }, [listing?.id]);

  useEffect(() => {
    if (listing || !userId) return;

    let isActive = true;
    const restoreDraft = async () => {
      try {
        const raw = window.localStorage.getItem(`autofans_listing_draft:${userId}`);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Omit<LocalListingDraft, 'signedMap'>;
        if (!parsed?.formData || !Array.isArray(parsed.images)) return;

        const paths = parsed.images.map((image) => image.path).filter(Boolean);
        const { data: signed } = paths.length
          ? await getSupabaseBrowserClient().storage.from('listing-images').createSignedUrls(paths, 3600)
          : { data: [] as Array<{ path?: string; signedUrl?: string }> };
        const restoredSignedMap = ((signed || []) as Array<{ path?: string; signedUrl?: string }>).reduce<Record<string, string>>((map, item) => {
          if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
          return map;
        }, {});

        if (isActive) {
          setUploaded(parsed.images);
          setLocalDraft({ ...parsed, signedMap: restoredSignedMap });
        }
      } catch (error) {
        console.warn('Nu am putut restaura draftul local:', error);
      } finally {
        if (isActive) setIsDraftHydrated(true);
      }
    };
    void restoreDraft();
    return () => { isActive = false; };
  }, [listing, userId]);

  const handleSubmit = async (formDataVal: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: formDataVal.title,
        description: formDataVal.description,
        price: Number(formDataVal.price || 0),
        currency: formDataVal.currency || 'EUR',
        make: formDataVal.brand,
        model: formDataVal.model,
        year: Number(formDataVal.year || 0),
        mileage: Number(formDataVal.mileage || 0),
        fuel_type: formDataVal.fuelType,
        transmission: formDataVal.transmission,
        body_type: formDataVal.specifications?.bodyType || null,
        vin: formDataVal.vin || null,
        images: uploaded,
        status: 'published',
        // Condition, specs and details values
        owners: Number(formDataVal.owners || 1),
        service_history: !!formDataVal.serviceHistory,
        engine_size: formDataVal.specifications?.engineSize ? Number(formDataVal.specifications.engineSize) : null,
        power: formDataVal.specifications?.power ? Number(formDataVal.specifications.power) : null,
        doors: formDataVal.specifications?.doors ? Number(formDataVal.specifications.doors) : 4,
        seats: formDataVal.specifications?.seats ? Number(formDataVal.specifications.seats) : 5,
        condition_overall: formDataVal.condition?.overall ? Number(formDataVal.condition.overall) : 3,
        condition_exterior: formDataVal.condition?.exterior ? Number(formDataVal.condition.exterior) : 3,
        condition_interior: formDataVal.condition?.interior ? Number(formDataVal.condition.interior) : 3,
        condition_engine: formDataVal.condition?.engine ? Number(formDataVal.condition.engine) : 3,
        condition_transmission: formDataVal.condition?.transmission ? Number(formDataVal.condition.transmission) : 3,
        has_accidents: !!formDataVal.condition?.hasAccidents,
        features: formDataVal.features || [],
        // Location fields
        city: formDataVal.location?.city || '',
        county: formDataVal.location?.county || '',
      };
      const editParam = listing ? `?edit=${listing.id}` : '';
      const res = await fetch(`/create-listing${editParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Eroare la crearea/editarea anunțului');
      }
      window.localStorage.removeItem(`autofans_listing_draft:${userId}`);
      trackAnalyticsEvent('listing_publish_completed', {
        mode: listing ? 'updated' : 'created',
        image_count: uploaded.length,
      });
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error saving listing:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (formDataVal: any) => {
    const { images: _temporaryPreviewImages, ...serializableFormData } = formDataVal;
    window.localStorage.setItem(`autofans_listing_draft:${userId}`, JSON.stringify({
      formData: serializableFormData,
      images: uploaded,
      savedAt: new Date().toISOString(),
    }));
    if (!draftEventTracked.current) {
      draftEventTracked.current = true;
      trackAnalyticsEvent('listing_draft_saved', { image_count: uploaded.length });
    }
  };

  async function uploadListingImages(files: File[]): Promise<ListingImageUpload[]> {
    if (!userId) return [];
    const supabase = getSupabaseBrowserClient();
    const newUploaded: ListingImageUpload[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${userId}/${Date.now()}-${i}-${safe}`;
      const { error } = await supabase.storage.from('listing-images').upload(path, f, {
        upsert: false,
        cacheControl: '31536000',
        contentType: f.type,
      });
      if (error) {
        throw new Error(`Nu am putut încărca „${f.name}”: ${error.message}`);
      }
      const { data: signed, error: signedError } = await supabase.storage.from('listing-images').createSignedUrl(path, 60 * 60);
      if (signedError || !signed?.signedUrl) throw new Error(`Imaginea a fost încărcată, dar previzualizarea nu este disponibilă.`);
      newUploaded.push({ path, id: path, url: signed.signedUrl, isMain: false });
    }
    return newUploaded;
  }

  const listingInitialData = listing ? {
    title: listing.title,
    brand: listing.make,
    model: listing.model,
    year: listing.year,
    mileage: listing.mileage,
    price: listing.price,
    currency: listing.currency,
    fuelType: listing.fuel_type,
    transmission: listing.transmission,
    vin: listing.vin || '',
    description: listing.description,
    images: (listing.images || []).map((img: any) => ({
      ...img,
      id: img.path,
      url: signedMap?.[img.path] || ''
    })),
    // Mapping existing details back to CreateListingWizard structure
    owners: listing.owners ?? 1,
    serviceHistory: !!listing.service_history,
    specifications: {
      bodyType: listing.body_type,
      engineSize: listing.engine_size ?? '',
      power: listing.power ?? '',
      doors: listing.doors ?? 4,
      seats: listing.seats ?? 5,
    },
    condition: {
      overall: listing.condition_overall ?? 3,
      exterior: listing.condition_exterior ?? 3,
      interior: listing.condition_interior ?? 3,
      engine: listing.condition_engine ?? 3,
      transmission: listing.condition_transmission ?? 3,
      hasAccidents: !!listing.has_accidents,
    },
    features: listing.features || [],
    location: {
      id: 'loc-1',
      city: listing.city || '',
      county: listing.county || '',
      country: 'RO'
    },
  } : undefined;
  const draftInitialData = localDraft?.formData ? {
    ...localDraft.formData,
    images: localDraft.images.map((image) => ({
      ...image,
      id: image.path,
      url: localDraft.signedMap[image.path] || '',
    })),
  } : undefined;
  const initialData = listingInitialData || draftInitialData;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 pb-28 sm:py-8 sm:pb-8">
        {/* Header */}
        <div className="mb-5 sm:mb-8">
          <Link to="/profile" className="inline-flex items-center text-accent-gold hover:text-accent-gold/80 transition-colors font-semibold mb-3 sm:mb-4 text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Înapoi la profil
          </Link>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
            {listing ? 'Editează anunțul tău' : 'Creează un anunț nou'}
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            {listing ? 'Actualizează informațiile despre mașina ta' : 'Completează informațiile despre mașina ta pentru a crea un anunț atractiv'}
          </p>
        </div>

        {/* Benefits */}
        <Card variant="elevated" padding="lg" className="hidden md:block mb-8 bg-glass border-white/10 shadow-xl">
          <h3 className="text-base font-bold text-white mb-5 uppercase tracking-wider">
            De ce să vinzi pe AutoFans?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </div>
              <div>
              <h4 className="font-semibold text-white text-sm sm:text-base">Anunț transparent</h4>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Detaliile și fotografiile clare cresc încrederea</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-accent-gold/10 text-accent-gold border border-accent-gold/20 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm sm:text-base">Publicare simplă</h4>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Salvezi draftul și revii când ai toate datele</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm sm:text-base">Suport complet</h4>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Ai ghiduri și ajutor la fiecare pas</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Wizard */}
        {isDraftHydrated ? (
          <CreateListingWizard
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            onUploadImages={uploadListingImages}
            onImageReferencesChange={(images) => setUploaded(images.map(({ path, isMain }) => ({ path, isMain })))}
            initialData={initialData as any}
          />
        ) : (
          <Card padding="lg" className="bg-glass border-white/10">
            <p className="text-sm text-gray-400">Se restaurează draftul tău…</p>
          </Card>
        )}
    </div>
  );
}
