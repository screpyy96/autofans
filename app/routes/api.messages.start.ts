import type { ActionFunctionArgs } from 'react-router';
import { getSupabaseServerClient } from '~/lib/supabase.server';

/**
 * JSON-only endpoint for starting a conversation from a listing page.
 *
 * Unlike `/messages`, this route has no protected page loader that can turn a
 * successful POST into a navigation redirect. A client therefore receives a
 * definitive JSON result: 200 after the message was stored, or 401 before
 * any write when its server session is no longer valid.
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Sesiunea a expirat. Autentifică-te din nou și retrimite mesajul.' }, { status: 401, headers });

  const form = await request.formData();
  const listingId = Number(form.get('listingId'));
  const body = String(form.get('body') || '').trim().slice(0, 2_000);
  if (!Number.isInteger(listingId)) return Response.json({ error: 'Anunț invalid.' }, { status: 400, headers });
  if (!body) return Response.json({ error: 'Mesajul nu poate fi gol.' }, { status: 400, headers });

  const { data: listing } = await supabase
    .from('listings')
    .select('id, owner_id')
    .eq('id', listingId)
    .eq('status', 'published')
    .maybeSingle();
  if (!listing || !listing.owner_id) return Response.json({ error: 'Anunț indisponibil.' }, { status: 404, headers });
  if (listing.owner_id === user.id) return Response.json({ error: 'Nu îți poți trimite mesaj propriului anunț.' }, { status: 400, headers });

  let { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listing.id)
    .eq('buyer_id', user.id)
    .eq('seller_id', listing.owner_id)
    .maybeSingle();
  if (!conversation) {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ listing_id: listing.id, buyer_id: user.id, seller_id: listing.owner_id })
      .select('id')
      .single();
    if (error?.code === '23505') {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listing.id)
        .eq('buyer_id', user.id)
        .eq('seller_id', listing.owner_id)
        .maybeSingle();
      conversation = existing;
    } else if (error) {
      return Response.json({ error: 'Conversația nu a putut fi creată. Încearcă din nou.' }, { status: 400, headers });
    } else {
      conversation = data;
    }
  }
  if (!conversation) return Response.json({ error: 'Conversația nu a putut fi creată. Încearcă din nou.' }, { status: 400, headers });

  const { error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversation.id, sender_id: user.id, body });
  if (error) return Response.json({ error: error.message }, { status: 400, headers });

  return Response.json({ ok: true, conversationId: conversation.id }, { headers });
}
