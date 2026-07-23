import { type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "react-router";
import { useLoaderData, Link, Form, useNavigation } from "react-router";
import { getSupabaseServerClient } from "~/lib/supabase.server";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { DeleteListingControl } from '~/components/listing/DeleteListingControl';
import { getDealerImportListingPublicationStatus, summarizeDealerImportListings } from '~/utils/dealerImportPublication';
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
  description?: string;
  currency?: string;
  make?: string;
  model?: string;
  year?: number | null;
  mileage?: number | null;
  fuel_type?: string | null;
  transmission?: string | null;
  city?: string | null;
  county?: string | null;
  images?: { path: string; isMain?: boolean }[];
  publication_state?: 'published' | 'ready' | 'blocked';
  publication_error?: string;
};

type ListingSummary = {
  totalListings: number;
  draftCount: number;
  readyDraftCount: number;
  blockedDraftCount: number;
  publishedCount: number;
};

function redirectToListings(headers: Headers, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const suffix = search.toString();
  return redirect(suffix ? `/dashboard/listings?${suffix}` : '/dashboard/listings', { headers });
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect(`/login?next=${encodeURIComponent(new URL(request.url).pathname)}`, { headers });

  const { data: listings } = await supabase
    .from('listings')
    .select('id, slug, title, description, price, currency, make, model, year, mileage, fuel_type, transmission, city, county, status, updated_at, images')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false });

  const publicationStatuses = new Map(
    (listings || []).map((listing: Listing) => [listing.id, getDealerImportListingPublicationStatus(listing, user.id)]),
  );
  const hydratedListings = (listings || []).map((listing: Listing) => {
    const publication = publicationStatuses.get(listing.id);
    return {
      ...listing,
      publication_state: publication?.state || 'blocked',
      publication_error: publication?.error,
    };
  });
  const summary = summarizeDealerImportListings((listings || []) as Listing[], user.id);

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

  const url = new URL(request.url);
  return {
    listings: hydratedListings,
    thumbs,
    summary: summary as ListingSummary,
    notice: url.searchParams.get('notice') || '',
    error: url.searchParams.get('error') || '',
    published: Number(url.searchParams.get('published') || 0),
    blocked: Number(url.searchParams.get('blocked') || 0),
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login', { headers });

  const form = await request.formData();
  const intent = String(form.get('intent') || '');
  const id = form.get('id') ? Number(form.get('id')) : undefined;
  const path = form.get('path') as string | null;

  if (intent === 'bulk-publish') {
    const { data: drafts, error } = await supabase
      .from('listings')
      .select('id')
      .eq('owner_id', user.id)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false });
    if (error) {
      return redirectToListings(headers, { error: 'Nu am putut pregăti publicarea în masă.' });
    }
    if (!(drafts || []).length) {
      return redirectToListings(headers, { notice: 'Nu mai există drafturi de publicat.' });
    }

    let published = 0;
    let blocked = 0;
    const blockedReasons = new Set<string>();
    for (const draft of drafts || []) {
      const result = await publishOwnedListing(supabase, user.id, Number(draft.id));
      if (result.ok) {
        published += 1;
      } else {
        blocked += 1;
        blockedReasons.add(result.error);
      }
    }

    return redirectToListings(headers, {
      published,
      blocked,
      notice: published ? `Au fost publicate ${published} anunțuri.` : undefined,
      error: !published && blocked
        ? [...blockedReasons][0] || 'Niciun draft nu a putut fi publicat.'
        : undefined,
    });
  }

  if (intent === 'publish' && id) {
    const result = await publishOwnedListing(supabase, user.id, id);
    if (!result.ok) return redirectToListings(headers, { error: result.error });
    return redirectToListings(headers, { notice: 'Anunțul a fost publicat.' });
  }
  if (intent === 'draft' && id) {
    const { error } = await supabase.from('listings').update({ status: 'draft' }).eq('id', id).eq('owner_id', user.id);
    if (error) return redirectToListings(headers, { error: error.message });
    return redirectToListings(headers, { notice: 'Anunțul a fost trecut în draft.' });
  }
  if (intent === 'delete' && id) {
    const { error } = await supabase.from('listings').delete().eq('id', id).eq('owner_id', user.id);
    if (error) return redirectToListings(headers, { error: error.message });
    return redirectToListings(headers, { notice: 'Anunțul a fost șters.' });
  }
  if (intent === 'set-main' && id && path) {
    const { data: l } = await supabase.from('listings').select('images').eq('id', id).eq('owner_id', user.id).single();
    const imgs = (l?.images || []) as any[];
    const updated = imgs.map((i) => ({ ...i, isMain: i.path === path }));
    const { error } = await supabase.from('listings').update({ images: updated }).eq('id', id).eq('owner_id', user.id);
    if (error) return redirectToListings(headers, { error: error.message });
    return redirectToListings(headers, { notice: 'Imaginea principală a fost actualizată.' });
  }

  return { ok: true };
}

export default function DashboardListings() {
  const { listings, thumbs, summary, notice, error, published, blocked } = useLoaderData<{
    listings: Listing[];
    thumbs: Record<number, string>;
    summary: ListingSummary;
    notice: string;
    error: string;
    published: number;
    blocked: number;
  }>();
  const navigation = useNavigation();
  const isBulkPublishing = navigation.state === 'submitting' && navigation.formData?.get('intent') === 'bulk-publish';

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Anunțurile mele</h1>
          <p className="mt-1 text-sm text-gray-400">
            {summary.readyDraftCount} gata de publicare · {summary.blockedDraftCount} blocate · {summary.publishedCount} publicate
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Form method="post">
            <input type="hidden" name="intent" value="bulk-publish" />
            <Button
              type="submit"
              disabled={!summary.readyDraftCount}
              loading={isBulkPublishing}
              loadingText="Se publică..."
              className="bg-gold-gradient text-secondary-900"
            >
              {summary.readyDraftCount > 0 ? `Publică toate cele ${summary.readyDraftCount} drafturi gata` : 'Niciun draft gata'}
            </Button>
          </Form>
          <Button asChild className="bg-gold-gradient text-secondary-900"><Link to="/create-listing">Adaugă anunț</Link></Button>
        </div>
      </div>

      {notice && <div className="mb-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{notice}</div>}
      {error && <div className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div>}
      {(published > 0 || blocked > 0) && (
        <div className="mb-5 rounded-xl border border-accent-gold/30 bg-accent-gold/10 px-4 py-3 text-sm text-gray-100">
          Publicate: <strong>{published}</strong>. Blocate pentru completare: <strong>{blocked}</strong>.
        </div>
      )}

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
                {l.publication_state === 'ready' && l.status === 'draft' && (
                  <p className="mt-1 text-xs text-accent-gold">Draft complet, poate fi publicat imediat.</p>
                )}
                {l.publication_state === 'blocked' && l.status === 'draft' && (
                  <p className="mt-1 text-xs text-red-200">{l.publication_error}</p>
                )}
              </div>
              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
                {l.status !== 'published' ? (
                  <Form method="post">
                    <input type="hidden" name="intent" value="publish" />
                    <input type="hidden" name="id" value={String(l.id)} />
                    <Button type="submit" size="sm" disabled={l.publication_state !== 'ready'}>Publică</Button>
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
