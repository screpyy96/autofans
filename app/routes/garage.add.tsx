import { useState } from 'react';
import { Link, Form, useActionData, useNavigation, redirect } from 'react-router';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { ArrowLeft, Car, Plus, Wrench, Tag, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { getSupabaseServerClient, hasSupabaseAuthCookie } from '~/lib/supabase.server';

export function meta() {
  return [
    { title: "Adaugă Mașina ta în Garaj | AutoFans.ro" },
    { name: "description", content: "Expune-ți mașina în Garajul Comunității AutoFans. Adaugă proiecte de tuning, modificări și opțiunea de a o vinde direct din garaj." },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (!hasSupabaseAuthCookie(request)) {
    return redirect('/login?redirectTo=/garage/add');
  }
  const { supabase } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login?redirectTo=/garage/add');
  return { user };
}

export async function action({ request }: ActionFunctionArgs) {
  const { supabase } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "Trebuie să fii conectat." }, { status: 401 });

  const formData = await request.formData();
  const title = String(formData.get("title") || "").trim();
  const make = String(formData.get("make") || "").trim();
  const model = String(formData.get("model") || "").trim();
  const year = Number(formData.get("year"));
  const engine = String(formData.get("engine") || "").trim();
  const powerHp = Number(formData.get("powerHp") || 0);
  const story = String(formData.get("story") || "").trim();
  const modsRaw = String(formData.get("modifications") || "").trim();
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  const isForSale = formData.get("isForSale") === "true";
  const salePrice = Number(formData.get("salePrice") || 0);

  if (!title || !make || !model || !year) {
    return Response.json({ error: "Te rugăm să completezi titlul, marca, modelul și anul." }, { status: 400 });
  }

  const slug = `${make.toLowerCase()}-${model.toLowerCase()}-${year}-${Math.random().toString(36).substring(2, 7)}`;
  const modifications = modsRaw ? modsRaw.split('\n').map(m => m.trim()).filter(Boolean) : [];
  const images = imageUrl ? [{ url: imageUrl }] : [{ url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80' }];

  const { data, error } = await supabase
    .from('garage_vehicles')
    .insert({
      owner_id: user.id,
      title,
      slug,
      make,
      model,
      year,
      engine,
      power_hp: powerHp,
      modifications,
      story,
      images,
      is_for_sale: isForSale,
      sale_price: isForSale ? salePrice : null
    })
    .select('id, slug')
    .single();

  if (isForSale && data) {
    // Autocreează anunțul public în tabele de căutare listings pentru a fi vizibil instant pe /search!
    const { data: newListing } = await supabase
      .from('listings')
      .insert({
        owner_id: user.id,
        title,
        slug: `car-${slug}`,
        make,
        model,
        year,
        price: salePrice,
        currency: 'EUR',
        description: `${story}\n\n🏎️ Anunț publicat direct din Garajul AutoFans!`,
        images,
        status: 'published'
      })
      .select('id')
      .maybeSingle();

    if (newListing) {
      await supabase
        .from('garage_vehicles')
        .update({ listing_id: newListing.id })
        .eq('id', data.id);
    }
  }

  if (error) {
    return redirect(`/garage`);
  }

  return redirect(`/garage/${data.slug}`);
}

export default function AddGarageVehicle() {
  const actionData = useActionData() as any;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [isForSale, setIsForSale] = useState(false);

  return (
    <div className="min-h-screen bg-premium-gradient text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        
        <Link to="/garage" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-accent-gold transition-colors font-semibold">
          <ArrowLeft className="h-4 w-4" />
          Înapoi la Garaj
        </Link>

        <div className="text-left border-b border-white/10 pb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Adaugă Mașina ta în Garaj 🏎️</h1>
          <p className="text-sm text-gray-400">Expune-ți mașina în comunitate și opțional scoate-o la vânzare direct din garajul tău.</p>
        </div>

        <Card variant="elevated" className="bg-glass border-white/10 p-6 sm:p-10 shadow-2xl space-y-6">
          <Form method="post" className="space-y-6">
            
            {actionData?.error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                {actionData.error}
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-1">
                Titlu Garaj / Numele Mașinii *
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="ex: BMW M3 E46 - Track Tool OEM Plus"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-accent-gold text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-1">
                  Marcă *
                </label>
                <input
                  type="text"
                  name="make"
                  required
                  placeholder="ex: BMW"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-accent-gold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-1">
                  Model *
                </label>
                <input
                  type="text"
                  name="model"
                  required
                  placeholder="ex: M3"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-accent-gold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-1">
                  An Fabricație *
                </label>
                <input
                  type="number"
                  name="year"
                  required
                  defaultValue={2018}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-accent-gold text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-1">
                  Motorizare
                </label>
                <input
                  type="text"
                  name="engine"
                  placeholder="ex: 3.2L Inline-6 S54"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-1">
                  Putere (Cai Putere)
                </label>
                <input
                  type="number"
                  name="powerHp"
                  placeholder="ex: 343"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-1">
                Modificări & Piese (Câte una pe linie)
              </label>
              <textarea
                name="modifications"
                rows={3}
                placeholder="Admisie Karbonius CSL&#10;Suspensie KW V3&#10;Frâne AP Racing"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-1">
                Povestea Mașinii
              </label>
              <textarea
                name="story"
                rows={4}
                placeholder="Scrie câteva cuvinte despre cum ai cumpărat-o, proiectul de restaurare sau experiența de condus..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-1">
                URL Imagine Utama (Poți pune link direct la imagine)
              </label>
              <input
                type="url"
                name="imageUrl"
                placeholder="https://..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm"
              />
            </div>

            {/* Toggle Vinde din Garaj */}
            <div className="bg-accent-gold/10 border border-accent-gold/20 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                    <Tag className="h-5 w-5 text-accent-gold" />
                    Vrei să vizi această mașină din Garaj?
                  </h4>
                  <p className="text-xs text-gray-400">
                    Mașina va fi marcată ca DE VÂNZARE cu insignă de garaj verificat.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="isForSale"
                  checked={isForSale}
                  onChange={(e) => setIsForSale(e.target.checked)}
                  className="w-5 h-5 text-accent-gold rounded focus:ring-accent-gold"
                />
                <input type="hidden" name="isForSale" value={isForSale ? "true" : "false"} />
              </div>

              {isForSale && (
                <div className="pt-2 border-t border-white/10 animate-fade-in">
                  <label className="block text-xs sm:text-sm font-bold text-white mb-1">
                    Preț de Vânzare (€ EUR) *
                  </label>
                  <input
                    type="number"
                    name="salePrice"
                    required={isForSale}
                    placeholder="ex: 25000"
                    className="w-full px-4 py-3 bg-white/10 border border-accent-gold/40 text-white font-bold rounded-xl text-sm"
                  />
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gold-gradient text-secondary-950 font-black py-4 rounded-xl shadow-glow hover:scale-[1.01] transition-all text-base border-none"
            >
              {isSubmitting ? 'Se salvează în Garaj...' : 'Adaugă Mașina în Garaj 🚀'}
            </Button>

          </Form>
        </Card>

      </div>
    </div>
  );
}
