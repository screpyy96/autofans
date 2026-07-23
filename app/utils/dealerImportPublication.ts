import { validateListingForPublication } from './listingPublication';

type DealerImportListing = Record<string, unknown> & {
  id: number;
  status?: string | null;
};

export type DealerImportPublicationState = 'published' | 'ready' | 'blocked';

export type DealerImportListingPublicationStatus = {
  listingId: number;
  state: DealerImportPublicationState;
  error?: string;
};

export type DealerImportPublicationSummary = {
  totalListings: number;
  draftCount: number;
  readyDraftCount: number;
  blockedDraftCount: number;
  publishedCount: number;
};

export function getDealerImportListingPublicationStatus(
  listing: DealerImportListing,
  ownerId: string,
): DealerImportListingPublicationStatus {
  if (String(listing.status || '').toLowerCase() === 'published') {
    return { listingId: listing.id, state: 'published' };
  }

  const validation = validateListingForPublication(listing, ownerId);
  if ('error' in validation) {
    return {
      listingId: listing.id,
      state: 'blocked',
      error: validation.error,
    };
  }

  return { listingId: listing.id, state: 'ready' };
}

export function summarizeDealerImportListings(
  listings: DealerImportListing[],
  ownerId: string,
): DealerImportPublicationSummary {
  let draftCount = 0;
  let readyDraftCount = 0;
  let blockedDraftCount = 0;
  let publishedCount = 0;

  for (const listing of listings) {
    const status = String(listing.status || '').toLowerCase();
    if (status === 'published') {
      publishedCount += 1;
      continue;
    }

    if (status === 'draft') {
      draftCount += 1;
      const publication = getDealerImportListingPublicationStatus(listing, ownerId);
      if (publication.state === 'ready') readyDraftCount += 1;
      if (publication.state === 'blocked') blockedDraftCount += 1;
    }
  }

  return {
    totalListings: listings.length,
    draftCount,
    readyDraftCount,
    blockedDraftCount,
    publishedCount,
  };
}
