import type { Car, Image } from '~/types';
import { FuelType, ListingStatus, TransmissionType } from '~/types';

export function mapListingToCar(listing: any, signedMap: Record<string, string> = {}): Car {
  const images: Image[] = (Array.isArray(listing.images) ? listing.images : [])
    .map((image: any, index: number) => ({
      id: String(index),
      url: signedMap[image?.path] || '',
      thumbnailUrl: signedMap[image?.path] || '',
      alt: listing.title || `${listing.make || ''} ${listing.model || ''}`.trim(),
      order: index,
      isMain: !!image?.isMain,
    }))
    .filter((image: Image) => Boolean(image.url));

  return {
    id: String(listing.id),
    slug: listing.slug || String(listing.id),
    title: listing.title || `${listing.make || ''} ${listing.model || ''}`.trim() || 'Anunț auto',
    brand: listing.make || '—',
    model: listing.model || '—',
    year: listing.year || new Date().getFullYear(),
    mileage: listing.mileage || 0,
    fuelType: (listing.fuel_type as FuelType) || FuelType.PETROL,
    transmission: (listing.transmission as TransmissionType) || TransmissionType.MANUAL,
    price: Number(listing.price || 0),
    currency: listing.currency || 'EUR',
    negotiable: false,
    location: { id: 'loc-1', city: listing.city || 'București', county: listing.county || 'București', country: 'RO' },
    images: images.length ? images : [{ id: '0', url: '/placeholder-car.jpg', thumbnailUrl: '/placeholder-car.jpg', alt: listing.title || 'Mașină', order: 0, isMain: true }],
    specifications: { engineSize: listing.engine_size || 0, power: listing.power || 0, doors: listing.doors || 4, seats: listing.seats || 5 },
    features: listing.features || [],
    condition: { overall: 3 as any, exterior: 3 as any, interior: 3 as any, engine: 3 as any, transmission: 3 as any, hasAccidents: !!listing.has_accidents },
    seller: { id: listing.owner_id || 'unknown', type: 'individual', name: 'Vânzător', email: '', phone: '', location: { id: 'loc-1', city: listing.city || 'București', county: listing.county || 'București', country: 'RO' }, isVerified: false },
    description: listing.description || '',
    createdAt: listing.created_at ? new Date(listing.created_at) : new Date(),
    updatedAt: listing.updated_at ? new Date(listing.updated_at) : new Date(listing.created_at || Date.now()),
    status: ListingStatus.ACTIVE,
    viewCount: 0,
    favoriteCount: 0,
    contactCount: 0,
    owners: listing.owners || 1,
    serviceHistory: !!listing.service_history,
  };
}
