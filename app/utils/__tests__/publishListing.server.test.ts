import { describe, expect, it, vi } from 'vitest';
import { publishOwnedListing } from '../publishListing.server';

const ownerId = '11111111-1111-1111-1111-111111111111';
const validListing = {
  title: 'BMW 320d 2019 cu istoric complet',
  description: 'Mașina este întreținută la timp, are istoric complet și toate reviziile documentate.',
  price: 18500,
  currency: 'EUR',
  make: 'BMW',
  model: '320d',
  year: 2019,
  mileage: 124000,
  fuel_type: 'diesel',
  transmission: 'automatic',
  city: 'Cluj-Napoca',
  county: 'Cluj',
  images: [{ path: `${ownerId}/front.jpg`, isMain: true }],
};

function mockSupabase(listing: unknown) {
  const selectQuery = {
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data: listing, error: null }),
  };
  selectQuery.eq.mockReturnValue(selectQuery);

  const updateQuery = { eq: vi.fn() };
  updateQuery.eq
    .mockReturnValueOnce(updateQuery)
    .mockReturnValueOnce(Promise.resolve({ error: null }));
  const update = vi.fn().mockReturnValue(updateQuery);

  const from = vi.fn()
    .mockReturnValueOnce({ select: vi.fn().mockReturnValue(selectQuery) })
    .mockReturnValueOnce({ update });

  return { supabase: { from }, update };
}

describe('publishOwnedListing', () => {
  it('checks the complete draft before making it public', async () => {
    const { supabase, update } = mockSupabase(validListing);

    await expect(publishOwnedListing(supabase, ownerId, 42)).resolves.toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ status: 'published' });
  });

  it('keeps incomplete drafts out of public search', async () => {
    const { supabase, update } = mockSupabase({ ...validListing, description: 'Prea scurt' });

    await expect(publishOwnedListing(supabase, ownerId, 42)).resolves.toEqual({
      ok: false,
      error: 'Descrierea trebuie să aibă cel puțin 50 de caractere.',
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('rejects invalid listing identifiers before querying Supabase', async () => {
    const { supabase } = mockSupabase(validListing);

    await expect(publishOwnedListing(supabase, ownerId, 0)).resolves.toEqual({ ok: false, error: 'Anunț invalid.' });
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
