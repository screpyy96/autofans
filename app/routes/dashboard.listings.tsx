import { type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "react-router";
import { useLoaderData, Link, Form } from "react-router";
import { getSupabaseServerClient } from "~/lib/supabase.server";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";

type Listing = {
  id: number;
  title: string;
  price: number;
  status: string;
  updated_at: string;
  images?: { path: string; isMain?: boolean }[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect(`/login?next=${encodeURIComponent(new URL(request.url).pathname)}`, { headers });

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, price, status, updated_at, images')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false });

  const thumbs: Record<number, string> = {};
  const paths = (listings || [])
    .map((l) => (l.images || []).find((i: any) => i.isMain)?.path || (l.images || [])[0]?.path)
    .filter(Boolean) as string[];
  if (paths.length) {
    const { data: signed } = await supabase.storage.from('listing-images').createSignedUrls(paths, 60 * 60);
    const map: Record<string, string> = {};
    for (const s of signed || []) {
      const it: any = s; if (it?.path && it?.signedUrl) map[it.path] = it.signedUrl as string;
    }
    (listings || []).forEach((l) => {
      const p = (l.images || []).find((i: any) => i.isMain)?.path || (l.images || [])[0]?.path;
      if (p && map[p]) thumbs[l.id] = map[p];
    });
  }

  return { listings: listings || [], thumbs };
}

export async function action({ request }: ActionFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login', { headers });

  const form = await request.formData();
  const intent = String(form.get('intent') || '');
  const id = form.get('id') ? Number(form.get('id')) : undefined;
  const path = form.get('path') as string | null;

  if (intent === 'publish' && id) {
    const { error } = await supabase.from('listings').update({ status: 'published' }).eq('id', id).eq('owner_id', user.id);
    if (error) return { ok: false, error: error.message };
    return redirect('/dashboard/listings', { headers });
  }
  if (intent === 'draft' && id) {
    const { error } = await supabase.from('listings').update({ status: 'draft' }).eq('id', id).eq('owner_id', user.id);
    if (error) return { ok: false, error: error.message };
    return redirect('/dashboard/listings', { headers });
  }
  if (intent === 'delete' && id) {
    const { error } = await supabase.from('listings').delete().eq('id', id).eq('owner_id', user.id);
    if (error) return { ok: false, error: error.message };
    return redirect('/dashboard/listings', { headers });
  }
  if (intent === 'set-main' && id && path) {
    const { data: l } = await supabase.from('listings').select('images').eq('id', id).eq('owner_id', user.id).single();
    const imgs = (l?.images || []) as any[];
    const updated = imgs.map((i) => ({ ...i, isMain: i.path === path }));
    const { error } = await supabase.from('listings').update({ images: updated }).eq('id', id).eq('owner_id', user.id);
    if (error) return { ok: false, error: error.message };
    return redirect('/dashboard/listings', { headers });
  }

  return { ok: true };
}

export default function DashboardListings() {
  const { listings, thumbs } = useLoaderData<{ listings: Listing[]; thumbs: Record<number, string> }>();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Anunțurile mele</h1>
        <Link to="/create-listing"><Button className="bg-gold-gradient text-secondary-900">Creează anunț</Button></Link>
      </div>

      {(listings || []).length === 0 ? (
        <Card variant="elevated" padding="lg">
          <p className="text-gray-300">Nu ai încă anunțuri.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {(listings || []).map((l) => (
            <Card key={l.id} variant="elevated" padding="md" className="flex items-center gap-3">
              {thumbs?.[l.id] ? (
                <img src={thumbs[l.id]} alt="thumb" className="w-20 h-16 rounded-lg object-cover border border-white/10" />
              ) : (
                <div className="w-20 h-16 rounded-lg bg-white/5 border border-white/10" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{l.title}</p>
                <p className="text-gray-400 text-sm">{l.status} • {new Date(l.updated_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
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
                    <Button type="submit" variant="outline" size="sm">Draft</Button>
                  </Form>
                )}
                <Form method="post">
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="id" value={String(l.id)} />
                  <Button type="submit" variant="danger" size="sm">Șterge</Button>
                </Form>
                <Link to={`/car/${l.id}`}><Button variant="outline" size="sm">Vezi</Button></Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

