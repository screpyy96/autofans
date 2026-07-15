import { type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "react-router";
import { useLoaderData, Link, Form } from "react-router";
import { getSupabaseServerClient } from "~/lib/supabase.server";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { DeleteListingControl } from '~/components/listing/DeleteListingControl';
import { formatListingUpdatedAt, listingStatusLabel } from '~/utils/listingStatus';
import { publishOwnedListing } from '~/utils/publishListing.server';

export function meta() {
  return [
    { title: 'Anunțurile mele - AutoFans.ro' },
    { name: 'robots', content: 'noindex,nofollow' },
  ];
}

type Listing = {
  id: number;
  title: string;
  price: number;
  status: string;
  updated_at: string;
  slug?: string;
  images?: { path: string; isMain?: boolean }[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect(`/login?next=${encodeURIComponent(new URL(request.url).pathname)}`, { headers });

  const { data: listings } = await supabase
    .from('listings')
    .select('id, slug, title, price, status, updated_at, images')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false });

  const thumbs: Record<number, string> = {};
  const paths = (listings || [])
    .map((l) => (l.images || []).find((i: any) => i.isMain)?.path || (l.images || [])[0]?.path)
    .filter(Boolean) as string[];
  if (paths.length) {
      const { data: signed } = await (supabase.storage.from('listing-images') as any).createSignedUrls(paths, 60 * 60, {
        transform: { width: 480, height: 360, quality: 68, resize: 'cover' },
      });
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
    const result = await publishOwnedListing(supabase, user.id, id);
    if (!result.ok) return result;
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
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Anunțurile mele</h1>
        <Button asChild className="bg-gold-gradient text-secondary-900"><Link to="/create-listing">Adaugă anunț</Link></Button>
      </div>

      {(listings || []).length === 0 ? (
        <Card variant="elevated" padding="lg">
          <p className="text-gray-300">Nu ai încă anunțuri.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {(listings || []).map((l) => (
            <Card key={l.id} variant="elevated" padding="md" className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {thumbs?.[l.id] ? (
                <img src={thumbs[l.id]} alt={l.title} className="h-16 w-20 rounded-lg border border-white/10 object-cover" />
              ) : (
                <div className="h-16 w-20 rounded-lg border border-white/10 bg-white/5" aria-hidden="true" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{l.title}</p>
                <p className="text-sm text-gray-400">{listingStatusLabel(l.status)} · {formatListingUpdatedAt(l.updated_at)}</p>
              </div>
              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
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
                <Button asChild variant="outline" size="sm" className="w-full border-accent-gold/20 text-accent-gold sm:w-auto">
                  <Link to={`/create-listing?edit=${l.id}`}>Editează</Link>
                </Button>
                <DeleteListingControl listingId={l.id} className="w-full sm:w-auto" />
                <Button asChild variant="outline" size="sm" className="w-full sm:w-auto"><Link to={`/car/${l.slug || l.id}`}>Vezi</Link></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
