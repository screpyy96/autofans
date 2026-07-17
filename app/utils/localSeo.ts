export const DOMAIN = 'https://www.autofans.ro';
export const LOCAL_PAGE_SIZE = 12;
export const COUNTY_INDEX_THRESHOLD = 8;
export const CITY_INDEX_THRESHOLD = 5;

export const MOLDOVA_COUNTIES = [
  { name: 'Suceava', slug: 'suceava' },
  { name: 'Iași', slug: 'iasi' },
  { name: 'Botoșani', slug: 'botosani' },
  { name: 'Neamț', slug: 'neamt' },
  { name: 'Bacău', slug: 'bacau' },
  { name: 'Vaslui', slug: 'vaslui' },
  { name: 'Vrancea', slug: 'vrancea' },
  { name: 'Galați', slug: 'galati' },
] as const;

export const MOLDOVA_GUIDES = [
  { slug: 'cum-verifici-o-masina-second-hand-in-suceava', title: 'Verifică o mașină second-hand în Suceava', counties: ['suceava'] },
  { slug: 'cum-cumperi-masina-rulata-in-iasi', title: 'Cumpără o mașină rulată în Iași', counties: ['iasi'] },
  { slug: 'checklist-masina-second-hand-drumuri-moldova', title: 'Checklist pentru drumurile din Moldova', counties: [] },
  { slug: 'cum-cumperi-masina-din-alt-judet-moldova', title: 'Cum cumperi din alt județ', counties: [] },
] as const;

export type MoldovaCounty = typeof MOLDOVA_COUNTIES[number];

export function slugifyLocation(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function countyBySlug(slug: string | undefined) {
  return MOLDOVA_COUNTIES.find((county) => county.slug === slug);
}

export function countyUrl(county: Pick<MoldovaCounty, 'slug'>) {
  return `/masini-second-hand/${county.slug}`;
}

export function cityUrl(county: Pick<MoldovaCounty, 'slug'>, city: string) {
  return `${countyUrl(county)}/${slugifyLocation(city)}`;
}
