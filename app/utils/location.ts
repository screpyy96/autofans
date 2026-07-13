import type { Location } from '~/types';

export const CITY_CENTERS: Record<string, [number, number]> = {
  bucuresti: [26.1025, 44.4268],
  clujnapoca: [23.5947, 46.7712],
  iasi: [27.6014, 47.1585],
  timisoara: [21.2087, 45.7489],
  constanta: [28.6348, 44.1598],
  brasov: [25.6012, 45.6579],
};

export const SEARCH_LOCATIONS = [
  { id: 'bucuresti', city: 'București', county: 'București', latitude: 44.4268, longitude: 26.1025 },
  { id: 'cluj', city: 'Cluj-Napoca', county: 'Cluj', latitude: 46.7712, longitude: 23.5947 },
  { id: 'iasi', city: 'Iași', county: 'Iași', latitude: 47.1585, longitude: 27.6014 },
  { id: 'timisoara', city: 'Timișoara', county: 'Timiș', latitude: 45.7489, longitude: 21.2087 },
  { id: 'constanta', city: 'Constanța', county: 'Constanța', latitude: 44.1598, longitude: 28.6348 },
  { id: 'brasov', city: 'Brașov', county: 'Brașov', latitude: 45.6579, longitude: 25.6012 },
] as const;

export const normalizeLocationName = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

export function coordinatesForLocation(location?: Pick<Location, 'city' | 'latitude' | 'longitude'>): [number, number] | null {
  if (typeof location?.longitude === 'number' && typeof location.latitude === 'number') {
    return [location.longitude, location.latitude];
  }

  return location?.city ? CITY_CENTERS[normalizeLocationName(location.city)] || null : null;
}

export function distanceInKm(from: Pick<Location, 'city' | 'latitude' | 'longitude'>, to: Pick<Location, 'city' | 'latitude' | 'longitude'>): number | null {
  const start = coordinatesForLocation(from);
  const end = coordinatesForLocation(to);
  if (!start || !end) return null;

  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const [startLng, startLat] = start;
  const [endLng, endLat] = end;
  const latitudeDelta = toRadians(endLat - startLat);
  const longitudeDelta = toRadians(endLng - startLng);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(startLat)) * Math.cos(toRadians(endLat)) * Math.sin(longitudeDelta / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}
