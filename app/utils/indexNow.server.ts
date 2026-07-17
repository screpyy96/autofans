import { getServerEnv } from '~/lib/env.server';

// IndexNow keys are intentionally public: ownership is verified by the text
// file served from the same host, not by keeping this value secret.
export const INDEXNOW_KEY = '37924a52d33e1d44e8f11b328df05672803e58f45b41d473';
export const INDEXNOW_KEY_LOCATION = `https://www.autofans.ro/${INDEXNOW_KEY}.txt`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS_PER_REQUEST = 10_000;

function siteOrigin() {
  return (getServerEnv('APP_URL') || 'https://www.autofans.ro').replace(/\/$/, '');
}

/** Only submit canonical AutoFans URLs. This prevents a protected manual
 * endpoint from being accidentally used to submit another host. */
export function normalizeIndexNowUrls(urls: unknown[]): string[] {
  const origin = siteOrigin();
  const seen = new Set<string>();

  for (const value of urls) {
    if (typeof value !== 'string') continue;
    try {
      const parsed = new URL(value, origin);
      if (parsed.origin !== origin) continue;
      parsed.hash = '';
      seen.add(parsed.toString());
    } catch {
      // Ignore malformed URLs so a batch can still notify valid URLs.
    }
    if (seen.size >= MAX_URLS_PER_REQUEST) break;
  }

  return [...seen];
}

export async function submitIndexNow(urls: unknown[]) {
  const urlList = normalizeIndexNowUrls(urls);
  if (!urlList.length) return { submitted: 0, status: null };

  const origin = new URL(siteOrigin());
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: origin.host,
      key: INDEXNOW_KEY,
      keyLocation: INDEXNOW_KEY_LOCATION,
      urlList,
    }),
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) throw new Error(`IndexNow returned ${response.status}`);
  return { submitted: urlList.length, status: response.status };
}

export async function submitIndexNowBestEffort(urls: unknown[]) {
  try {
    return await submitIndexNow(urls);
  } catch (error) {
    // IndexNow accelerates discovery but must never block publication.
    console.error('IndexNow submission failed:', error);
    return { submitted: 0, status: null };
  }
}

export function listingCanonicalUrl(slug: string) {
  return `${siteOrigin()}/car/${encodeURIComponent(slug)}`;
}
