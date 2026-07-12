import { useState } from 'react';
import type { LoaderFunctionArgs } from 'react-router';
import { redirect, useLoaderData } from 'react-router';
import { getSupabaseServerClient } from '~/lib/supabase.server';
import type { Route } from "./+types/create-listing";
import { CreateListingWizard } from '~/components/listing/CreateListingWizard';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { ArrowLeft, Shield, Clock, Star } from 'lucide-react';
import { Link } from 'react-router';
import { getSupabaseBrowserClient } from '~/lib/supabase.client';
import { generateUniqueSlug } from '~/utils/helpers';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Creează anunț - AutoFans" },
    { name: "description", content: "Creează un anunț pentru mașina ta și găsește cumpărători rapid și sigur." },
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

      let signedMap: Record<string, string> = {};
      if (listing.images?.length) {
        const paths = listing.images.map((i: any) => i.path).filter(Boolean);
        if (paths.length) {
          const { data: signed } = await supabase
            .storage
            .from('listing-images')
            .createSignedUrls(paths, 3600);
          for (const item of signed || []) {
            const it: any = item;
            if (it?.path && it?.signedUrl) {
              signedMap[it.path] = it.signedUrl as string;
            }
          }
        }
      }

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
  const insert = {
    owner_id: user.id,
    title: body.title,
    description: body.description,
    price: body.price,
    currency: body.currency || 'EUR',
    make: body.make,
    model: body.model,
    year: body.year,
    mileage: body.mileage,
    fuel_type: body.fuel_type,
    transmission: body.transmission,
    body_type: body.body_type,
    images: body.images || [],
    status: body.status || 'published',
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
    city: body.city,
    county: body.county,
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

export default function CreateListing() {
  const { listing, signedMap, userId } = useLoaderData<typeof loader>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploaded, setUploaded] = useState<{ path: string; isMain: boolean }[]>(() => {
    return listing?.images || [];
  });

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
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error saving listing:', error);
      alert('A apărut o eroare. Te rugăm să încerci din nou.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (formDataVal: any) => {
    localStorage.setItem('autofans_draft_listing', JSON.stringify(formDataVal));
    alert('Anunțul a fost salvat ca draft.');
  };

  async function onFilesSelected(files: File[]) {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    const existingList = listing?.images || [];
    const newUploaded: { path: string; isMain: boolean }[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.size === 0) {
        // Placeholder for pre-existing file - map back to original path using extracted index
        const match = f.name.match(/^image-(\d+)\.jpg$/);
        const origIdx = match ? parseInt(match[1], 10) : -1;
        if (origIdx >= 0 && origIdx < existingList.length) {
          newUploaded.push({
            path: existingList[origIdx].path,
            isMain: i === 0,
          });
        }
      } else {
        // Real new upload
        const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${userId}/${Date.now()}-${i}-${safe}`;
        const { error } = await supabase.storage.from('listing-images').upload(path, f, {
          upsert: false,
          cacheControl: '3600',
          contentType: f.type,
        });
        if (error) {
          console.error('upload error', error.message);
          alert(`Eroare la încărcarea imaginii ${f.name}: ${error.message}`);
          continue;
        }
        newUploaded.push({
          path,
          isMain: i === 0,
        });
      }
    }
    setUploaded(newUploaded);
  }

  const initialData = listing ? {
    title: listing.title,
    brand: listing.make,
    model: listing.model,
    year: listing.year,
    mileage: listing.mileage,
    price: listing.price,
    currency: listing.currency,
    fuelType: listing.fuel_type,
    transmission: listing.transmission,
    description: listing.description,
    images: (listing.images || []).map((img: any) => ({
      ...img,
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/profile" className="inline-flex items-center text-accent-gold hover:text-accent-gold/80 transition-colors font-semibold mb-4 text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Înapoi la profil
          </Link>
          
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
            {listing ? 'Editează anunțul tău' : 'Creează un anunț nou'}
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            {listing ? 'Actualizează informațiile despre mașina ta' : 'Completează informațiile despre mașina ta pentru a crea un anunț atractiv'}
          </p>
        </div>

        {/* Benefits */}
        <Card variant="elevated" padding="lg" className="mb-8 bg-glass border-white/10 shadow-xl">
          <h3 className="text-base font-bold text-white mb-5 uppercase tracking-wider">
            De ce să vinzi pe AutoFans?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm sm:text-base">Vânzare sigură</h4>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Cumpărători verificați</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-accent-gold/10 text-accent-gold border border-accent-gold/20 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm sm:text-base">Vânzare rapidă</h4>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Timp mediu: 12 zile</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm sm:text-base">Suport complet</h4>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Te ajutăm în tout procesul</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Wizard */}
        <CreateListingWizard
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          onFilesSelected={onFilesSelected}
          initialData={initialData as any}
        />
    </div>
  );
}
