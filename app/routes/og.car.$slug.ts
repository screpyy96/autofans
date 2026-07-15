import type { LoaderFunctionArgs } from 'react-router';
import { getSupabaseServerClient } from '~/lib/supabase.server';
import { signListingImages } from '~/utils/listingImages';

/**
 * Stable social-image URL for a published listing. Storage URLs are deliberately
 * short-lived, so exposing one directly in og:image makes shared links break
 * in caches after it expires. This endpoint validates the public listing then
 * redirects to a fresh, transformed image.
 */
export async function loader({ params, request }: LoaderFunctionArgs) {
  const slug = params.slug;
  if (!slug) return new Response('Not found', { status: 404 });

  const { supabase } = getSupabaseServerClient(request);
  const { data: listing } = await supabase
    .from('listings')
    .select('images')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  const images = Array.isArray(listing?.images) ? listing.images : [];
  const cover = images.find((image: any) => image?.isMain && typeof image?.path === 'string')
    || images.find((image: any) => typeof image?.path === 'string');
  if (!cover?.path) return new Response('Not found', { status: 404 });

  const signed = await signListingImages(supabase as any, [{ images: [cover] }], 10 * 60, {
    width: 1200,
    height: 630,
    quality: 82,
    resize: 'cover',
  });
  const imageUrl = signed[cover.path];
  if (!imageUrl) return new Response('Not found', { status: 404 });

  return new Response(null, {
    status: 302,
    headers: {
      Location: imageUrl,
      // Keep edge/browser redirect caches well below the signed URL lifetime.
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
    },
  });
}
