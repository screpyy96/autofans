import { describe, expect, it } from 'vitest';
import { getDealerImportListingPublicationStatus, summarizeDealerImportListings } from '../dealerImportPublication';

const ownerId = '11111111-1111-1111-1111-111111111111';

describe('dealer import publication helpers', () => {
  it('marks published listings separately from draft validation', () => {
    const result = getDealerImportListingPublicationStatus({
      id: 10,
      status: 'published',
      title: 'BMW 320d 2019',
      description: 'Descriere suficient de lungă pentru a trece validarea fără probleme reale aici.',
      price: 19000,
      currency: 'EUR',
      make: 'BMW',
      model: '320d',
      year: 2019,
      mileage: 120000,
      fuel_type: 'diesel',
      transmission: 'automatic',
      city: 'Cluj-Napoca',
      county: 'Cluj',
      images: [{ path: `${ownerId}/front.jpg`, isMain: true }],
    }, ownerId);

    expect(result).toEqual({ listingId: 10, state: 'published' });
  });

  it('reports blocked drafts with the publication reason', () => {
    const result = getDealerImportListingPublicationStatus({
      id: 11,
      status: 'draft',
      title: 'Audi A4 2018',
      description: 'Prea scurt',
      price: 0,
      currency: 'EUR',
      make: 'Audi',
      model: 'A4',
      year: 2018,
      mileage: 140000,
      fuel_type: 'diesel',
      transmission: 'automatic',
      city: 'Iași',
      county: 'Iași',
      images: [],
    }, ownerId);

    expect(result).toEqual({
      listingId: 11,
      state: 'blocked',
      error: 'Descrierea trebuie să aibă cel puțin 50 de caractere.',
    });
  });

  it('counts ready, blocked and published listings separately', () => {
    const summary = summarizeDealerImportListings([
      {
        id: 1,
        status: 'draft',
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
      },
      {
        id: 2,
        status: 'draft',
        title: 'Audi A4 2018',
        description: 'Scurt',
        price: 16000,
        currency: 'EUR',
        make: 'Audi',
        model: 'A4',
        year: 2018,
        mileage: 132000,
        fuel_type: 'diesel',
        transmission: 'automatic',
        city: 'Iași',
        county: 'Iași',
        images: [{ path: `${ownerId}/side.jpg`, isMain: true }],
      },
      {
        id: 3,
        status: 'published',
      },
    ], ownerId);

    expect(summary).toEqual({
      totalListings: 3,
      draftCount: 2,
      readyDraftCount: 1,
      blockedDraftCount: 1,
      publishedCount: 1,
    });
  });
});
