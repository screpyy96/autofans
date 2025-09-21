import type { 
  Car, 
  FilterState, 
  PriceRange,
  YearRange,
  MileageRange,
  SortOption
} from '../types';
import { 
  FuelType, 
  TransmissionType, 
  ConditionType
} from '../types';

// Price formatting helpers
export function formatPrice(price: number, currency: string = 'RON'): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatCurrency(amount: number, currency: string = 'RON'): string {
  return formatPrice(amount, currency);
}

export function formatMileage(mileage: number): string {
  return new Intl.NumberFormat('ro-RO').format(mileage) + ' km';
}

// Enum display helpers
export function getFuelTypeLabel(fuelType: FuelType): string {
  const labels: Record<FuelType, string> = {
    [FuelType.PETROL]: 'Benzină',
    [FuelType.DIESEL]: 'Motorină',
    [FuelType.HYBRID]: 'Hibrid',
    [FuelType.ELECTRIC]: 'Electric',
    [FuelType.LPG]: 'GPL',
    [FuelType.CNG]: 'CNG',
  };
  return labels[fuelType];
}

export function getTransmissionLabel(transmission: TransmissionType): string {
  const labels: Record<TransmissionType, string> = {
    [TransmissionType.MANUAL]: 'Manuală',
    [TransmissionType.AUTOMATIC]: 'Automată',
    [TransmissionType.SEMI_AUTOMATIC]: 'Semi-automată',
    [TransmissionType.CVT]: 'CVT',
  };
  return labels[transmission];
}

export function getConditionLabel(condition: ConditionType): string {
  const labels: Record<ConditionType, string> = {
    [ConditionType.EXCELLENT]: 'Excelentă',
    [ConditionType.VERY_GOOD]: 'Foarte bună',
    [ConditionType.GOOD]: 'Bună',
    [ConditionType.FAIR]: 'Acceptabilă',
    [ConditionType.POOR]: 'Slabă',
  };
  return labels[condition];
}

// Car utility functions
export function getCarDisplayTitle(car: Car): string {
  return `${car.brand} ${car.model} ${car.year}`;
}

export function getCarKeySpecs(car: Car): string[] {
  return [
    `${car.year}`,
    formatMileage(car.mileage),
    getFuelTypeLabel(car.fuelType),
    getTransmissionLabel(car.transmission),
    `${car.specifications.engineSize}L`,
    `${car.specifications.power} CP`,
  ];
}

export function getMainImage(car: Car): string | undefined {
  const mainImage = car.images.find(img => img.isMain);
  return mainImage?.url || car.images[0]?.url;
}

export function getThumbnailImage(car: Car): string | undefined {
  const mainImage = car.images.find(img => img.isMain);
  return mainImage?.thumbnailUrl || car.images[0]?.thumbnailUrl;
}

// Filter utility functions
export function createEmptyFilterState(): FilterState {
  return {};
}

export function hasActiveFilters(filters: FilterState): boolean {
  return Object.keys(filters).some(key => {
    const value = filters[key as keyof FilterState];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return true;
    return value !== undefined && value !== null && value !== '';
  });
}

export function getActiveFilterCount(filters: FilterState): number {
  let count = 0;
  
  if (filters.brand?.length) count++;
  if (filters.model?.length) count++;
  if (filters.priceRange) count++;
  if (filters.yearRange) count++;
  if (filters.mileageRange) count++;
  if (filters.fuelType?.length) count++;
  if (filters.transmission?.length) count++;
  if (filters.location) count++;
  if (filters.features?.length) count++;
  if (filters.condition?.length) count++;
  if (filters.sellerType?.length) count++;
  if (filters.hasImages) count++;
  if (filters.hasWarranty) count++;
  if (filters.hasServiceHistory) count++;
  if (filters.maxOwners) count++;
  
  return count;
}

// Range helpers
export function createPriceRange(min: number, max: number): PriceRange {
  return { min: Math.max(0, min), max: Math.max(min, max) };
}

export function createYearRange(min: number, max: number): YearRange {
  const currentYear = new Date().getFullYear();
  return { 
    min: Math.max(1900, min), 
    max: Math.min(currentYear + 1, Math.max(min, max)) 
  };
}

export function createMileageRange(min: number, max: number): MileageRange {
  return { min: Math.max(0, min), max: Math.max(min, max) };
}

// Sort options
export function getDefaultSortOptions(): SortOption[] {
  return [
    { value: 'relevance', label: 'Relevanță', field: 'createdAt' },
    { value: 'price_asc', label: 'Preț crescător', field: 'price' },
    { value: 'price_desc', label: 'Preț descrescător', field: 'price' },
    { value: 'year_desc', label: 'An descrescător', field: 'year' },
    { value: 'year_asc', label: 'An crescător', field: 'year' },
    { value: 'mileage_asc', label: 'Kilometraj crescător', field: 'mileage' },
    { value: 'mileage_desc', label: 'Kilometraj descrescător', field: 'mileage' },
    { value: 'date_desc', label: 'Cele mai noi', field: 'createdAt' },
    { value: 'date_asc', label: 'Cele mai vechi', field: 'createdAt' },
  ];
}

// Validation helpers
export function isValidPrice(price: number): boolean {
  return price > 0 && price <= 10000000; // Max 10M RON
}

export function isValidYear(year: number): boolean {
  const currentYear = new Date().getFullYear();
  return year >= 1900 && year <= currentYear + 1;
}

export function isValidMileage(mileage: number): boolean {
  return mileage >= 0 && mileage <= 2000000; // Max 2M km
}

// Date helpers
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ro-RO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Astăzi';
  if (diffInDays === 1) return 'Ieri';
  if (diffInDays < 7) return `Acum ${diffInDays} zile`;
  if (diffInDays < 30) return `Acum ${Math.floor(diffInDays / 7)} săptămâni`;
  if (diffInDays < 365) return `Acum ${Math.floor(diffInDays / 30)} luni`;
  return `Acum ${Math.floor(diffInDays / 365)} ani`;
}

// URL helpers
export function generateCarSlug(car: Car): string {
  const slug = `${car.brand}-${car.model}-${car.year}-${car.id}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug;
}

export function parseCarSlug(slug: string): { id: string } | null {
  const parts = slug.split('-');
  const id = parts[parts.length - 1];
  return id ? { id } : null;
}