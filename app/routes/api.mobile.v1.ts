import type { ActionFunctionArgs } from 'react-router';

const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8' };

/**
 * Compatibility bridge for installed mobile builds. New Android and iOS
 * releases call the Supabase Edge Function directly, so all mobile business
 * logic has a single source of truth there.
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.REMIX_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.REMIX_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return Response.json({ error: 'Mobile API is not configured' }, { status: 503 });
  const authorization = request.headers.get('authorization');
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/mobile-v1`, {
    method: 'POST',
    headers: { ...jsonHeaders, apikey: anonKey, ...(authorization ? { authorization } : {}) },
    body: await request.text(),
  });
  return new Response(await response.arrayBuffer(), {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('content-type') || jsonHeaders['Content-Type'] },
  });
}
