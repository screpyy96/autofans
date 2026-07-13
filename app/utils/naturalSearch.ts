import { FuelType, TransmissionType, type FilterState } from '~/types';
import { SEARCH_LOCATIONS } from '~/utils/location';

const brands = ['BMW', 'Audi', 'Volkswagen', 'Mercedes-Benz', 'Mercedes', 'Skoda', 'Ford', 'Renault', 'Peugeot', 'Toyota', 'Dacia', 'Opel'];
const cities = Object.fromEntries(SEARCH_LOCATIONS.map((location) => [location.id, location]));
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function parseNaturalSearch(query: string): { filters: Partial<FilterState>; remainingQuery: string; summary: string[] } {
  const normalized = normalize(query);
  const filters: Partial<FilterState> = {};
  const summary: string[] = [];
  let remaining = normalized;
  const brand = brands.find((item) => normalized.includes(normalize(item)));
  if (brand) { filters.brand = [brand === 'Mercedes' ? 'Mercedes-Benz' : brand]; summary.push(brand); remaining = remaining.replace(normalize(brand), ' '); }
  if (/\b(automata|automatic|automatica)\b/.test(normalized)) { filters.transmission = [TransmissionType.AUTOMATIC]; summary.push('automată'); remaining = remaining.replace(/\b(automata|automatic|automatica)\b/g, ' '); }
  if (/\bmanuala?|manual\b/.test(normalized)) { filters.transmission = [TransmissionType.MANUAL]; summary.push('manuală'); remaining = remaining.replace(/\bmanuala?|manual\b/g, ' '); }
  if (/\b(diesel|motorina)\b/.test(normalized)) { filters.fuelType = [FuelType.DIESEL]; summary.push('diesel'); remaining = remaining.replace(/\b(diesel|motorina)\b/g, ' '); }
  if (/\b(benzina|petrol)\b/.test(normalized)) { filters.fuelType = [FuelType.PETROL]; summary.push('benzină'); remaining = remaining.replace(/\b(benzina|petrol)\b/g, ' '); }
  if (/\b(hibrid|hybrid)\b/.test(normalized)) { filters.fuelType = [FuelType.HYBRID]; summary.push('hibrid'); remaining = remaining.replace(/\b(hibrid|hybrid)\b/g, ' '); }
  const price = normalized.match(/\b(sub|pana la|max(?:im)?\.?)[\s]*(\d[\d.\s]*)\s*(?:euro|eur|€|ron|lei)?/);
  if (price) { const max = Number(price[2].replace(/[^\d]/g, '')); if (max) { filters.priceRange = { min: 0, max }; summary.push(`sub ${max.toLocaleString('ro-RO')}`); remaining = remaining.replace(price[0], ' '); } }
  const yearRange = normalized.match(/\b(19\d{2}|20\d{2})\s*[-–]\s*(19\d{2}|20\d{2})\b/);
  const year = normalized.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearRange) { filters.yearRange = { min: Number(yearRange[1]), max: Number(yearRange[2]) }; summary.push(`${yearRange[1]}–${yearRange[2]}`); remaining = remaining.replace(yearRange[0], ' '); }
  else if (year) { filters.yearRange = { min: Number(year[1]), max: Number(year[1]) }; summary.push(year[1]); remaining = remaining.replace(year[0], ' '); }
  for (const [key, location] of Object.entries(cities)) if (normalized.includes(key)) {
    filters.location = { ...location, country: 'RO' };
    summary.push(location.city);
    const cityPattern = key === 'cluj' ? /cluj(?:-napoca)?/g : new RegExp(key, 'g');
    remaining = remaining.replace(cityPattern, ' ');
    break;
  }
  const radius = normalized.match(/\b(?:in|în|raza de|pe o raza de)?\s*(25|50|100|200|500)\s*km(?:\s+de)?\b/);
  if (radius && filters.location) {
    filters.radius = Number(radius[1]);
    summary.push(`${radius[1]} km`);
    remaining = remaining.replace(radius[0], ' ');
  }
  return { filters, remainingQuery: remaining.replace(/\s+/g, ' ').trim(), summary };
}
