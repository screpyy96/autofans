import { validateListingForPublication } from './listingPublication';
import { listingCanonicalUrl, submitIndexNowBestEffort } from './indexNow.server';

type SupabaseLike = {
  from: (table: string) => any;
};

const PUBLICATION_FIELDS = 'slug, title, description, price, currency, make, model, year, mileage, fuel_type, transmission, city, county, images';

/**
 * A draft can be changed outside of the wizard, so the final publication gate
 * must run server-side. This keeps incomplete listings out of public search.
 */
export async function publishOwnedListing(
  supabase: SupabaseLike,
  ownerId: string,
  listingId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!Number.isSafeInteger(listingId) || listingId < 1) {
      return { ok: false, error: 'Anunț invalid.' };
    }

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select(PUBLICATION_FIELDS)
      .eq('id', listingId)
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (listingError || !listing) {
      return { ok: false, error: 'Anunțul nu a fost găsit.' };
    }

    const validation = validateListingForPublication(listing, ownerId);
    if ('error' in validation) return { ok: false, error: validation.error };

    const { error: updateError } = await supabase
      .from('listings')
      .update({ status: 'published' })
      .eq('id', listingId)
      .eq('owner_id', ownerId);

    if (updateError) return { ok: false, error: 'Anunțul nu a putut fi publicat. Încearcă din nou.' };
    if (listing.slug) await submitIndexNowBestEffort([listingCanonicalUrl(listing.slug)]);
    return { ok: true };
  } catch (err: any) {
    console.error('[Publish Listing Error]', err);
    return { ok: false, error: err?.message || 'A apărut o eroare la publicarea anunțului.' };
  }
}
