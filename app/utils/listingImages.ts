type StorageClient = {
  storage: {
    from: (bucket: string) => {
      createSignedUrls: (...args: any[]) => Promise<any>;
    };
  };
};

type ImageTransform = { width?: number; height?: number; quality?: number; resize?: 'cover' | 'contain' | 'fill' };

export const LISTING_CARD_IMAGE_TRANSFORM: ImageTransform = {
  width: 560,
  height: 350,
  quality: 62,
  resize: 'cover',
};

export async function signListingImages(
  supabase: StorageClient,
  listings: any[],
  expiresIn = 60 * 60,
  transform?: ImageTransform,
): Promise<Record<string, string>> {
  const paths = Array.from(new Set(
    listings.flatMap((listing) => {
      const images = Array.isArray(listing?.images) ? listing.images : [];
      return images.map((image: any) => image?.path).filter(Boolean);
    }),
  ));

  if (!paths.length) return {};

  const { data: signed } = await supabase.storage
    .from('listing-images')
    .createSignedUrls(paths, expiresIn, transform ? { transform } : undefined);
  const result = ((signed || []) as Array<{ path?: string; signedUrl?: string }>).reduce<Record<string, string>>((result, item) => {
    if (item.path && item.signedUrl) result[item.path] = item.signedUrl;
    return result;
  }, {});

  // Image transformations are a performance enhancement, never a reason to
  // hide a listing. If a project/plan does not support a requested transform,
  // sign just the missing files in their original form.
  if (transform) {
    const missingPaths = paths.filter((path) => !result[path]);
    if (missingPaths.length) {
      const { data: fallback } = await supabase.storage
        .from('listing-images')
        .createSignedUrls(missingPaths, expiresIn);
      for (const item of (fallback || []) as Array<{ path?: string; signedUrl?: string }>) {
        if (item.path && item.signedUrl) result[item.path] = item.signedUrl;
      }
    }
  }

  return result;
}
