import { useState } from 'react';
import type { LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { getSupabaseServerClient } from '~/lib/supabase.server';
import type { Route } from "./+types/create-listing";
import { CreateListingWizard } from '~/components/listing/CreateListingWizard';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { ArrowLeft, Shield, Clock, Star } from 'lucide-react';
import { Link, useRouteLoaderData } from 'react-router';
import { getSupabaseBrowserClient } from '~/lib/supabase.client';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Creează anunț - AutoFans" },
    { name: "description", content: "Creează un anunț pentru mașina ta și găsește cumpărători rapid și sigur." },
  ];
}

export default function CreateListing() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploaded, setUploaded] = useState<{ path: string; isMain: boolean }[]>([]);
  const rootData = useRouteLoaderData('root') as { user?: { id: string } } | undefined;
  const userId = rootData?.user?.id;

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: data.title,
        description: data.description,
        price: Number(data.price || 0),
        currency: data.currency || 'EUR',
        make: data.brand,
        model: data.model,
        year: Number(data.year || 0),
        mileage: Number(data.mileage || 0),
        fuel_type: data.fuelType,
        transmission: data.transmission,
        body_type: data.specifications?.bodyType || null,
        images: uploaded,
        status: 'published',
      };
      const res = await fetch('/create-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Eroare la crearea anunțului');
      }
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('A apărut o eroare. Te rugăm să încerci din nou.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (data: any) => {
    localStorage.setItem('autofans_draft_listing', JSON.stringify(data));
    alert('Anunțul a fost salvat ca draft.');
  };

  async function onFilesSelected(files: File[]) {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    const uploadedNow: { path: string; isMain: boolean }[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${userId}/${Date.now()}-${i}-${safe}`;
      const { error } = await supabase.storage.from('listing-images').upload(path, f, {
        upsert: false,
        cacheControl: '3600',
        contentType: f.type,
      });
      if (error) {
        console.error('upload error', error.message);
        continue;
      }
      uploadedNow.push({ path, isMain: i === 0 && uploaded.length === 0 });
    }
    if (uploadedNow.length) setUploaded(prev => [...prev, ...uploadedNow]);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/profile" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Înapoi la profil
          </Link>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Creează un anunț nou
          </h1>
          <p className="text-white">
            Completează informațiile despre mașina ta pentru a crea un anunț atractiv
          </p>
        </div>

        {/* Benefits */}
        <Card variant="elevated" padding="lg" className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            De ce să vinzi pe AutoFans?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-white">Vânzare sigură</h4>
                <p className="text-sm text-gray-600">Cumpărători verificați</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-white">Vânzare rapidă</h4>
                <p className="text-sm text-gray-600">Timp mediu: 12 zile</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-white">Suport complet</h4>
                <p className="text-sm text-gray-600">Te ajutăm în tot procesul</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Wizard */}
        <CreateListingWizard
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          onFilesSelected={onFilesSelected}
        />
    </div>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect(`/login?next=${encodeURIComponent(new URL(request.url).pathname)}`, { headers });
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'seller') {
    return redirect('/dashboard', { headers });
  }
  return new Response(null, { headers });
}

export async function action({ request }: { request: Request }) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login', { headers });

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
  };

  const { error } = await supabase.from('listings').insert(insert);
  if (error) {
    return { error: error.message };
  }
  return { ok: true };
}
