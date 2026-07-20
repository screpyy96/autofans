import type { ActionFunctionArgs } from 'react-router';
import { getSupabaseServerClient } from '~/lib/supabase.server';
import { invokeChat } from '~/lib/chat.server';

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

  try {
    const result = await invokeChat<{ conversationId?: number }>(supabase, 'start_conversation', { listingId, message: body });
    if (!result.conversationId) throw new Error('Conversația nu a putut fi creată. Încearcă din nou.');
    return Response.json({ ok: true, conversationId: result.conversationId }, { headers });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Mesajul nu a putut fi trimis.' }, { status: 400, headers });
  }
}
