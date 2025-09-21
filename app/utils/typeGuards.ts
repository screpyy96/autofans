import type { 
  Car, 
  User, 
  FilterState, 
  Location,
  Image,
  Feature,
  Seller
} from '../types';
import { 
  FuelType, 
  TransmissionType, 
  ListingStatus,
  ConditionType
} from '../types';

// Type guards for runtime type checking
export function isCar(obj: any): obj is Car {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.brand === 'string' &&
    typeof obj.model === 'string' &&
    typeof obj.year === 'number' &&
    typeof obj.mileage === 'number' &&
    Object.values(FuelType).includes(obj.fuelType) &&
    Object.values(TransmissionType).includes(obj.transmission) &&
    typeof obj.price === 'number' &&
    Object.values(ListingStatus).includes(obj.status)
  );
}

export function isUser(obj: any): obj is User {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.firstName === 'string' &&
    typeof obj.lastName === 'string' &&
    Array.isArray(obj.favorites) &&
    Array.isArray(obj.listings) &&
    Array.isArray(obj.savedSearches)
  );
}

export function isLocation(obj: any): obj is Location {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.city === 'string' &&
    typeof obj.county === 'string' &&
    typeof obj.country === 'string'
  );
}

export function isImage(obj: any): obj is Image {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.url === 'string' &&
    typeof obj.thumbnailUrl === 'string' &&
    typeof obj.order === 'number' &&
    typeof obj.isMain === 'boolean'
  );
}

export function isSeller(obj: any): obj is Seller {
  return (
    obj &&
    typeof obj.id === 'string' &&
    (obj.type === 'individual' || obj.type === 'dealer') &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.phone === 'string' &&
    isLocation(obj.location) &&
    typeof obj.isVerified === 'boolean'
  );
}

// Enum validation functions
export function isValidFuelType(value: string): value is FuelType {
  return Object.values(FuelType).includes(value as FuelType);
}

export function isValidTransmissionType(value: string): value is TransmissionType {
  return Object.values(TransmissionType).includes(value as TransmissionType);
}

export function isValidListingStatus(value: string): value is ListingStatus {
  return Object.values(ListingStatus).includes(value as ListingStatus);
}

export function isValidConditionType(value: string): value is ConditionType {
  return Object.values(ConditionType).includes(value as ConditionType);
}

// Filter validation
export function isValidFilterState(obj: any): obj is FilterState {
  if (!obj || typeof obj !== 'object') return false;

  // Check optional string array fields
  const stringArrayFields = ['brand', 'model', 'features'];
  for (const field of stringArrayFields) {
    if (obj[field] && !Array.isArray(obj[field])) return false;
    if (obj[field] && !obj[field].every((item: any) => typeof item === 'string')) return false;
  }

  // Check enum array fields
  if (obj.fuelType && (!Array.isArray(obj.fuelType) || !obj.fuelType.every(isValidFuelType))) return false;
  if (obj.transmission && (!Array.isArray(obj.transmission) || !obj.transmission.every(isValidTransmissionType))) return false;
  if (obj.condition && (!Array.isArray(obj.condition) || !obj.condition.every(isValidConditionType))) return false;

  // Check range objects
  if (obj.priceRange && (!obj.priceRange.min || !obj.priceRange.max || obj.priceRange.min > obj.priceRange.max)) return false;
  if (obj.yearRange && (!obj.yearRange.min || !obj.yearRange.max || obj.yearRange.min > obj.yearRange.max)) return false;
  if (obj.mileageRange && (!obj.mileageRange.min || !obj.mileageRange.max || obj.mileageRange.min > obj.mileageRange.max)) return false;

  return true;
}