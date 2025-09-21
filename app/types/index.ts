// Core enums
export enum FuelType {
  PETROL = 'petrol',
  DIESEL = 'diesel',
  HYBRID = 'hybrid',
  ELECTRIC = 'electric',
  LPG = 'lpg',
  CNG = 'cng'
}

export enum TransmissionType {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  SEMI_AUTOMATIC = 'semi_automatic',
  CVT = 'cvt'
}

export enum ListingStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  RESERVED = 'reserved',
  EXPIRED = 'expired',
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval'
}

export enum ConditionType {
  EXCELLENT = 'excellent',
  VERY_GOOD = 'very_good',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor'
}

// Base interfaces
export interface Location {
  id: string;
  city: string;
  county: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface Image {
  id: string;
  url: string;
  thumbnailUrl: string;
  alt: string;
  order: number;
  isMain: boolean;
}

export interface Feature {
  id: string;
  name: string;
  category: string;
  icon?: string;
}

// Car-related interfaces
export interface CarSpecs {
  engineSize: number; // in liters
  power: number; // in HP
  torque?: number; // in Nm
  acceleration?: number; // 0-100 km/h in seconds
  topSpeed?: number; // in km/h
  fuelConsumption?: {
    city: number;
    highway: number;
    combined: number;
  };
  co2Emissions?: number; // g/km
  euroStandard?: string;
  doors: number;
  seats: number;
  trunkCapacity?: number; // in liters
  weight?: number; // in kg
}

export interface ConditionReport {
  overall: ConditionType;
  exterior: ConditionType;
  interior: ConditionType;
  engine: ConditionType;
  transmission: ConditionType;
  notes?: string;
  lastServiceDate?: Date;
  nextServiceDue?: Date;
  hasAccidents: boolean;
  accidentHistory?: string;
}

export interface Seller {
  id: string;
  type: 'individual' | 'dealer';
  name: string;
  email: string;
  phone: string;
  location: Location;
  avatar?: string;
  rating?: number;
  reviewCount?: number;
  isVerified: boolean;
  responseTime?: string; // e.g., "within 2 hours"
  languages?: string[];
}

export interface Car {
  id: string;
  title: string;
  brand: string;
  model: string;
  generation?: string;
  year: number;
  mileage: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  price: number;
  currency: string;
  negotiable: boolean;
  location: Location;
  images: Image[];
  specifications: CarSpecs;
  features: Feature[];
  condition: ConditionReport;
  seller: Seller;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  status: ListingStatus;
  viewCount: number;
  favoriteCount: number;
  contactCount: number;
  vin?: string;
  registrationNumber?: string;
  firstRegistration?: Date;
  owners: number;
  warrantyRemaining?: number; // in months
  serviceHistory: boolean;
  tags?: string[];
}

// User-related interfaces
export interface UserPreferences {
  language: string;
  currency: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    savedSearchAlerts: boolean;
    priceDropAlerts: boolean;
    newListingAlerts: boolean;
  };
  searchRadius: number; // in km
  defaultLocation?: Location;
  favoriteFilters?: FilterState;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: FilterState;
  alertsEnabled: boolean;
  createdAt: Date;
  lastNotified?: Date;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  location?: Location;
  preferences: UserPreferences;
  savedSearches: SavedSearch[];
  favorites: string[]; // Car IDs
  listings: string[]; // Car IDs
  createdAt: Date;
  lastLoginAt?: Date;
  isVerified: boolean;
  role: 'user' | 'dealer' | 'admin';
}

// Filter and search interfaces
export interface PriceRange {
  min: number;
  max: number;
}

export interface YearRange {
  min: number;
  max: number;
}

export interface MileageRange {
  min: number;
  max: number;
}

export interface FilterState {
  query?: string;
  brand?: string[];
  model?: string[];
  priceRange?: PriceRange;
  yearRange?: YearRange;
  mileageRange?: MileageRange;
  fuelType?: FuelType[];
  transmission?: TransmissionType[];
  location?: Location;
  radius?: number; // in km
  features?: string[];
  condition?: ConditionType[];
  sellerType?: ('individual' | 'dealer')[];
  hasImages?: boolean;
  hasWarranty?: boolean;
  hasServiceHistory?: boolean;
  maxOwners?: number;
  sortBy?: SortOption;
  sortOrder?: 'asc' | 'desc';
}

export interface SortOption {
  value: string;
  label: string;
  field: keyof Car;
}

// Search and pagination interfaces
export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface SearchParams {
  filters: FilterState;
  page: number;
  pageSize: number;
}

// Utility types
export type CarId = string;
export type UserId = string;

// Partial car for listings creation
export type CarDraft = Partial<Omit<Car, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'favoriteCount' | 'contactCount'>>;

// Car update payload
export type CarUpdate = Partial<Pick<Car, 'title' | 'price' | 'description' | 'status' | 'features' | 'images'>>;

// User profile update
export type UserUpdate = Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'avatar' | 'location' | 'preferences'>>;

// Filter validation
export type FilterValidation = {
  [K in keyof FilterState]: {
    isValid: boolean;
    error?: string;
  };
};

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<SearchResult<T>> {
  meta?: {
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Form types
export interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  message: string;
  carId: string;
  preferredContactMethod: 'email' | 'phone' | 'whatsapp';
  preferredContactTime?: string;
}

export interface NewsletterForm {
  email: string;
  preferences?: {
    newListings: boolean;
    priceAlerts: boolean;
    marketInsights: boolean;
  };
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// Notification types
export enum NotificationType {
  MESSAGE = 'message',
  PRICE_DROP = 'price_drop',
  NEW_LISTING = 'new_listing',
  SAVED_SEARCH_ALERT = 'saved_search_alert',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  SYSTEM = 'system'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  actionUrl?: string;
  actionLabel?: string;
  userId: string;
  relatedCarId?: string;
  relatedUserId?: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  types: {
    [NotificationType.MESSAGE]: boolean;
    [NotificationType.PRICE_DROP]: boolean;
    [NotificationType.NEW_LISTING]: boolean;
    [NotificationType.SAVED_SEARCH_ALERT]: boolean;
    [NotificationType.APPOINTMENT_REMINDER]: boolean;
    [NotificationType.SYSTEM]: boolean;
  };
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  };
}

// Event types
export interface CarViewEvent {
  carId: string;
  userId?: string;
  timestamp: Date;
  source: 'search' | 'direct' | 'recommendation';
}

export interface CarContactEvent {
  carId: string;
  sellerId: string;
  buyerId?: string;
  contactMethod: 'email' | 'phone' | 'whatsapp' | 'form';
  timestamp: Date;
}

// Price Calculator types
export interface LoanCalculatorParams {
  carPrice: number;
  downPayment: number;
  loanTerm: number; // in months
  interestRate: number; // annual percentage
  tradeInValue?: number;
}

export interface LoanCalculatorResult {
  monthlyPayment: number;
  totalInterest: number;
  totalAmount: number;
  loanAmount: number;
  paymentSchedule?: PaymentScheduleItem[];
}

export interface PaymentScheduleItem {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface InsuranceCalculatorParams {
  carValue: number;
  carAge: number;
  driverAge: number;
  location: string;
  coverageType: 'basic' | 'comprehensive' | 'full';
  deductible: number;
  annualMileage: number;
}

export interface InsuranceCalculatorResult {
  monthlyPremium: number;
  annualPremium: number;
  coverageDetails: {
    liability: number;
    collision: number;
    comprehensive: number;
    personalInjury: number;
  };
}

export interface OwnershipCostParams {
  carPrice: number;
  carAge: number;
  annualMileage: number;
  fuelType: FuelType;
  fuelConsumption: number; // l/100km
  ownershipPeriod: number; // in years
  location: string;
}

export interface OwnershipCostResult {
  totalCost: number;
  monthlyCost: number;
  breakdown: {
    depreciation: number;
    fuel: number;
    insurance: number;
    maintenance: number;
    registration: number;
    financing: number;
  };
  yearlyBreakdown: YearlyOwnershipCost[];
}

export interface YearlyOwnershipCost {
  year: number;
  depreciation: number;
  fuel: number;
  insurance: number;
  maintenance: number;
  registration: number;
  financing: number;
  total: number;
}