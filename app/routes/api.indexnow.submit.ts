import type { ActionFunctionArgs } from 'react-router';
import { getServerEnv } from '~/lib/env.server';
import { submitIndexNow } from '~/utils/indexNow.server';

/**
 * A deploy hook or an authenticated operator can notify IndexNow about static
 * content (such as blog posts). Listing publication uses the same client
 * directly, so it is submitted automatically.
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const secret = getServerEnv('INDEXNOW_SUBMIT_SECRET');
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json().catch(() => null) as { urls?: unknown } | null;
  if (!Array.isArray(payload?.urls)) return Response.json({ error: 'urls must be an array' }, { status: 400 });

  try {
    return Response.json(await submitIndexNow(payload.urls));
  } catch (error) {
    console.error('IndexNow manual submission failed:', error);
    return Response.json({ error: 'IndexNow submission failed' }, { status: 502 });
  }
}
