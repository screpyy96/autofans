const FUEL_TYPES = new Set(['petrol', 'diesel', 'hybrid', 'electric', 'lpg', 'cng']);
const TRANSMISSIONS = new Set(['manual', 'automatic', 'semi_automatic', 'cvt']);
const CURRENCIES = new Set(['EUR', 'RON']);

type ListingImage = { path: string; isMain: boolean };
type ImageValidation = { data: ListingImage[] } | { error: string };

export type ListingPublicationInput = Record<string, unknown>;

export type ValidatedListingPublication = {
  title: string;
  description: string;
  price: number;
  currency: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  city: string;
  county: string;
  images: ListingImage[];
};

export type ValidatedListingDraft = {
  title: string;
  description: string;
  price: number;
  currency: string;
  make: string;
  model: string;
  year: number | null;
  mileage: number | null;
  fuelType: string | null;
  transmission: string | null;
  city: string | null;
  county: string | null;
  images: ListingImage[];
};

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : '';
}

function finiteNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function validateOwnedImages(input: ListingPublicationInput, ownerId: string, required: boolean): ImageValidation {
  const rawImages = Array.isArray(input.images) ? input.images : [];
  if (required && rawImages.length === 0) return { error: 'Adaugă cel puțin o imagine a mașinii.' };
  if (rawImages.length > 15) return { error: 'Poți publica cel mult 15 imagini.' };
  const seenPaths = new Set<string>();
  const images: ListingImage[] = [];
  for (const rawImage of rawImages) {
    const path = cleanText((rawImage as any)?.path || (rawImage as any)?.url, 300);
    if (!path || seenPaths.has(path)) {
      return { error: 'Una sau mai multe imagini nu sunt valide.' };
    }
    if (ownerId && !path.startsWith(`${ownerId}/`) && !path.includes(`/${ownerId}/`) && !path.startsWith('http')) {
      return { error: 'Una sau mai multe imagini nu îți aparțin sau nu sunt valide.' };
    }
    seenPaths.add(path);
    images.push({ path, isMain: false });
  }
  if (images.length) images[0].isMain = true;
  return { data: images };
}

/**
 * Drafts retain the database invariants while intentionally allowing fields
 * that are only mandatory at publication time. They must still own every
 * uploaded image, so a client cannot attach another seller's media.
 */
export function validateListingDraft(
  input: ListingPublicationInput,
  ownerId: string,
): { data: ValidatedListingDraft } | { error: string } {
  const images = validateOwnedImages(input, ownerId, false);
  if ('error' in images) return images;
  const year = finiteNumber(input.year);
  const mileage = finiteNumber(input.mileage);
  const price = finiteNumber(input.price);
  const currentYear = new Date().getFullYear();
  const fuelType = cleanText(input.fuel_type, 30);
  const transmission = cleanText(input.transmission, 30);
  const currency = cleanText(input.currency || 'EUR', 3).toUpperCase();
  return {
    data: {
      title: cleanText(input.title, 150) || 'Anunț în lucru',
      description: typeof input.description === 'string' ? input.description.trim().slice(0, 5_000) : '',
      price: price !== null && price >= 0 ? price : 0,
      currency: CURRENCIES.has(currency) ? currency : 'EUR',
      make: cleanText(input.make, 60) || 'Necunoscută',
      model: cleanText(input.model, 80) || 'Nespecificat',
      year: year !== null && Number.isInteger(year) && year >= 1950 && year <= currentYear + 1 ? year : null,
      mileage: mileage !== null && Number.isInteger(mileage) && mileage >= 0 ? mileage : null,
      fuelType: FUEL_TYPES.has(fuelType) ? fuelType : null,
      transmission: TRANSMISSIONS.has(transmission) ? transmission : null,
      city: cleanText(input.city, 100) || null,
      county: cleanText(input.county, 100) || null,
      images: images.data,
    },
  };
}

/**
 * Keeps the rules that make an advert useful for buyers on the server. The
 * wizard is still friendly, but API callers cannot publish incomplete or
 * unowned content by bypassing the client.
 */
export function validateListingForPublication(
  input: ListingPublicationInput,
  ownerId: string,
): { data: ValidatedListingPublication } | { error: string } {
  const title = cleanText(input.title, 150);
  const description = typeof input.description === 'string' ? input.description.trim().slice(0, 5_000) : '';
  const make = cleanText(input.make, 60);
  const model = cleanText(input.model, 80);
  const city = cleanText(input.city, 100);
  const county = cleanText(input.county, 100);
  const price = finiteNumber(input.price);
  const year = finiteNumber(input.year);
  const mileage = finiteNumber(input.mileage);
  const fuelType = cleanText(input.fuel_type, 30);
  const transmission = cleanText(input.transmission, 30);
  const currency = cleanText(input.currency || 'EUR', 3).toUpperCase();
  const currentYear = new Date().getFullYear();

  if (title.length < 8) return { error: 'Titlul trebuie să aibă cel puțin 8 caractere.' };
  if (description.length < 50) return { error: 'Descrierea trebuie să aibă cel puțin 50 de caractere.' };
  if (!make || !model) return { error: 'Marca și modelul sunt obligatorii.' };
  if (year === null || !Number.isInteger(year) || year < 1950 || year > currentYear + 1) {
    return { error: 'Anul fabricației nu este valid.' };
  }
  if (mileage === null || !Number.isInteger(mileage) || mileage < 0 || mileage > 2_500_000) {
    return { error: 'Kilometrajul nu este valid.' };
  }
  if (price === null || price <= 0 || price > 100_000_000) return { error: 'Prețul nu este valid.' };
  if (!FUEL_TYPES.has(fuelType) || !TRANSMISSIONS.has(transmission)) {
    return { error: 'Combustibilul sau transmisia nu sunt valide.' };
  }
  if (!CURRENCIES.has(currency)) return { error: 'Moneda selectată nu este disponibilă.' };
  if (city.length < 2 || county.length < 2) return { error: 'Orașul și județul sunt obligatorii.' };

  const imageValidation = validateOwnedImages(input, ownerId, true);
  if ('error' in imageValidation) return imageValidation;

  return {
    data: { title, description, price, currency, make, model, year, mileage, fuelType, transmission, city, county, images: imageValidation.data },
  };
}
