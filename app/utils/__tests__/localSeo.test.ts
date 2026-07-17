import { describe, expect, it } from 'vitest';
import { cityUrl, countyBySlug, slugifyLocation } from '../localSeo';
import { getMoldovaCountySummaries, resolveLocalLocation } from '../localSeo.server';

const stats = [
  { county: 'Suceava', city: 'Suceava', listing_count: 6 },
  { county: 'Suceava', city: 'Rădăuți', listing_count: 2 },
  { county: 'Suceava', city: 'Fălticeni', listing_count: 3 },
  { county: 'Iași', city: 'Iași', listing_count: 5 },
];

describe('local SEO routing', () => {
  it('creates stable Romanian location slugs and URLs', () => {
    expect(slugifyLocation('Rădăuți')).toBe('radauti');
    expect(cityUrl(countyBySlug('suceava')!, 'Rădăuți')).toBe('/masini-second-hand/suceava/radauti');
  });

  it('indexes counties and cities only after their inventory threshold', () => {
    const summaries = getMoldovaCountySummaries(stats);
    const suceava = summaries.find((county) => county.slug === 'suceava')!;
    expect(suceava.isIndexable).toBe(true);
    expect(suceava.cities).toEqual([{ name: 'Suceava', slug: 'suceava', listingCount: 6 }]);
  });

  it('keeps low-stock city pages available but noindex', () => {
    const radauti = resolveLocalLocation(stats, 'suceava', 'radauti');
    expect(radauti).toMatchObject({ listingCount: 2, isIndexable: false, city: { name: 'Rădăuți' } });
  });
});
