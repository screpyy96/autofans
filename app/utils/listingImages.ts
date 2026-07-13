type StorageClient = {
  storage: {
    from: (bucket: string) => {
      createSignedUrls: (
        paths: string[],
        expiresIn: number,
        options?: { transform?: { width?: number; height?: number; quality?: number; resize?: 'cover' | 'contain' | 'fill' } },
      ) => Promise<{ data: Array<{ path?: string; signedUrl?: string }> | null }>;
    };
  };
};

type ImageTransform = { width?: number; height?: number; quality?: number; resize?: 'cover' | 'contain' | 'fill' };

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
  return (signed || []).reduce<Record<string, string>>((result, item) => {
    if (item.path && item.signedUrl) result[item.path] = item.signedUrl;
    return result;
  }, {});
}
