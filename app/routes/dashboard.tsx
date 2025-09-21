import { type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "react-router";
import { useLoaderData, Link, Form } from "react-router";
import { getSupabaseServerClient } from "~/lib/supabase.server";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect(`/login?next=${encodeURIComponent(new URL(request.url).pathname)}`, { headers });

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, display_name, email')
    .eq('id', user.id)
    .single();

  if (!profile) {
    const { data: newUserProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        role: 'buyer',
      })
      .select('id, role, display_name, email')
      .single();

    if (insertError) {
      // Handle the insert error, maybe log it or throw an error
      console.error('Error creating profile:', insertError);
      // For now, we'll throw an error to prevent proceeding with a null profile
      throw new Response("Could not create user profile.", { status: 500 });
    }
    // The component will now receive the newly created profile
    return { user, profile: newUserProfile, isSeller: false, counts: { listings: 0, favorites: 0, saved: 0 }, recent: [] };
  }

  const isSeller = profile?.role === 'seller';

  // Default counts
  let counts = { listings: 0, favorites: 0, saved: 0 };
  let recent: Array<{ id: number; title: string; price: number; status: string; updated_at: string; images?: { path: string; isMain?: boolean }[] }> = [];
  let thumbs: Record<number, string> = {};

  if (isSeller) {
    const { count: listingsCount } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id);
    counts.listings = listingsCount ?? 0;
    const { data: recentListings } = await supabase
      .from('listings')
      .select('id, title, price, status, updated_at, images')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(5);
    recent = recentListings ?? [];

    // Build signed URLs for main images
    const paths = recent
      .map((l) => (l.images || []).find((img: any) => img.isMain)?.path || (l.images || [])[0]?.path)
      .filter(Boolean) as string[];
    if (paths.length) {
      const { data: signed } = await supabase
        .storage
        .from('listing-images')
        .createSignedUrls(paths, 60 * 60);
      const map: Record<string, string> = {};
      for (const item of signed || []) {
        if ((item as any)?.path && (item as any)?.signedUrl) map[(item as any).path] = (item as any).signedUrl as string;
      }
      recent.forEach((l) => {
        const p = (l.images || []).find((img: any) => img.isMain)?.path || (l.images || [])[0]?.path;
        if (p && map[p]) thumbs[l.id] = map[p];
      });
    }
  }

  const { count: favs } = await supabase
    .from('favorites')
    .select('listing_id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  counts.favorites = favs ?? 0;

  const { count: saved } = await supabase
    .from('saved_searches')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  counts.saved = saved ?? 0;

  return { user, profile, isSeller, counts, recent, thumbs };
}

export async function action({ request }: ActionFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login', { headers });

  const form = await request.formData();
  const intent = String(form.get('intent') || '');
  const id = form.get('id') ? Number(form.get('id')) : undefined;

  if (intent === 'promote') {
    const { error } = await supabase.rpc('promote_to_seller');
    if (error) {
      return { ok: false, error: error.message };
    }
    return redirect('/dashboard', { headers });
  }

  if (intent === 'publish' && id) {
    const { error } = await supabase.from('listings').update({ status: 'published' }).eq('id', id).eq('owner_id', user.id);
    if (error) return { ok: false, error: error.message };
    return redirect('/dashboard', { headers });
  }
  if (intent === 'draft' && id) {
    const { error } = await supabase.from('listings').update({ status: 'draft' }).eq('id', id).eq('owner_id', user.id);
    if (error) return { ok: false, error: error.message };
    return redirect('/dashboard', { headers });
  }
  if (intent === 'delete' && id) {
    const { error } = await supabase.from('listings').delete().eq('id', id).eq('owner_id', user.id);
    if (error) return { ok: false, error: error.message };
    return redirect('/dashboard', { headers });
  }

  return { ok: true };
}

interface LoaderData {
  user: any;
  profile: {
    id: string;
    role: string;
    display_name: string | null;
    email: string | undefined;
  } | null;
  isSeller: boolean;
  counts: {
    listings: number;
    favorites: number;
    saved: number;
  };
  recent: Array<{ id: number; title: string; price: number; status: string; updated_at: string; images?: { path: string; isMain?: boolean }[] }>;
  thumbs: Record<number, string>;
}

export default function Dashboard() {
  const { profile, isSeller, counts, recent, thumbs } = useLoaderData<LoaderData>();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
      <p className="text-gray-300 mb-6">Bun venit, {profile?.display_name || profile?.email}.</p>

      {!isSeller ? (
        <Card variant="elevated" padding="lg" className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-2">Devino vânzător</h2>
          <p className="text-gray-300 mb-4">Activează-ți contul de vânzător pentru a putea publica anunțuri.</p>
          <Form method="post">
            <input type="hidden" name="intent" value="promote" />
            <Button type="submit" className="bg-gold-gradient text-secondary-900">Devino vânzător</Button>
          </Form>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card variant="elevated" padding="lg">
            <h3 className="text-white font-semibold">Anunțurile mele</h3>
            <p className="text-3xl text-accent-gold mt-2">{counts.listings}</p>
            <div className="flex items-center gap-3 mt-2">
              <Link to="/create-listing" className="text-sm text-accent-gold hover:underline inline-block">Creează</Link>
              <Link to="/dashboard/listings" className="text-sm text-accent-gold hover:underline inline-block">Toate anunțurile</Link>
            </div>
          </Card>
          <Card variant="elevated" padding="lg">
            <h3 className="text-white font-semibold">Favorite</h3>
            <p className="text-3xl text-accent-gold mt-2">{counts.favorites}</p>
          </Card>
          <Card variant="elevated" padding="lg">
            <h3 className="text-white font-semibold">Căutări salvate</h3>
            <p className="text-3xl text-accent-gold mt-2">{counts.saved}</p>
          </Card>
        </div>
      )}

      {isSeller && (
        <Card variant="elevated" padding="lg">
          <h2 className="text-xl font-semibold text-white mb-4">Anunțuri recente</h2>
          {recent.length === 0 ? (
            <p className="text-gray-400">Încă nu ai anunțuri.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {recent.map((l) => (
                <li key={l.id} className="py-2 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-1">
                    {thumbs?.[l.id] ? (
                      <img src={thumbs[l.id]} alt="thumb" className="w-14 h-14 rounded-lg object-cover border border-white/10" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-white/5 border border-white/10" />
                    )}
                  </div>
                  <div className="md:col-span-5">
                    <p className="text-white font-medium">{l.title}</p>
                    <p className="text-gray-400 text-sm">{l.status} • {new Date(l.updated_at).toLocaleString()}</p>
                  </div>
                  <div className="md:col-span-2 text-accent-gold font-semibold">€{Number(l.price).toLocaleString()}</div>
                  <div className="md:col-span-4 flex gap-2 justify-end">
                    {l.status !== 'published' ? (
                      <Form method="post">
                        <input type="hidden" name="intent" value="publish" />
                        <input type="hidden" name="id" value={String(l.id)} />
                        <Button type="submit" size="sm">Publică</Button>
                      </Form>
                    ) : (
                      <Form method="post">
                        <input type="hidden" name="intent" value="draft" />
                        <input type="hidden" name="id" value={String(l.id)} />
                        <Button type="submit" variant="outline" size="sm">Treci în draft</Button>
                      </Form>
                    )}
                    <Form method="post">
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="id" value={String(l.id)} />
                      <Button type="submit" variant="danger" size="sm">Șterge</Button>
                    </Form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
