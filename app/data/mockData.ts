import type {
  Car,
  User,
  Location,
  Image,
  Feature,
  Seller,
  UserPreferences,
  SavedSearch,
  FilterState
} from '../types';
import {
  FuelType,
  TransmissionType,
  ListingStatus,
  ConditionType
} from '../types';

// Mock locations
export const mockLocations: Location[] = [
  {
    id: '1',
    city: 'București',
    county: 'București',
    country: 'România',
    latitude: 44.4268,
    longitude: 26.1025
  },
  {
    id: '2',
    city: 'Cluj-Napoca',
    county: 'Cluj',
    country: 'România',
    latitude: 46.7712,
    longitude: 23.6236
  },
  {
    id: '3',
    city: 'Timișoara',
    county: 'Timiș',
    country: 'România',
    latitude: 45.7489,
    longitude: 21.2087
  },
  {
    id: '4',
    city: 'Iași',
    county: 'Iași',
    country: 'România',
    latitude: 47.1585,
    longitude: 27.6014
  },
  {
    id: '5',
    city: 'Constanța',
    county: 'Constanța',
    country: 'România',
    latitude: 44.1598,
    longitude: 28.6348
  }
];

// Mock features
export const mockFeatures: Feature[] = [
  { id: '1', name: 'Aer condiționat', category: 'comfort', icon: 'snowflake' },
  { id: '2', name: 'Navigație GPS', category: 'technology', icon: 'map' },
  { id: '3', name: 'Scaune încălzite', category: 'comfort', icon: 'fire' },
  { id: '4', name: 'Senzori parcare', category: 'safety', icon: 'radar' },
  { id: '5', name: 'Camera marsarier', category: 'safety', icon: 'camera' },
  { id: '6', name: 'Cruise control', category: 'technology', icon: 'gauge' },
  { id: '7', name: 'Bluetooth', category: 'technology', icon: 'bluetooth' },
  { id: '8', name: 'USB', category: 'technology', icon: 'usb' },
  { id: '9', name: 'Airbag-uri', category: 'safety', icon: 'shield' },
  { id: '10', name: 'ABS', category: 'safety', icon: 'brake' }
];

// Mock sellers
export const mockSellers: Seller[] = [
  {
    id: '1',
    type: 'individual',
    name: 'Ion Popescu',
    email: 'ion.popescu@email.com',
    phone: '+40721123456',
    location: mockLocations[0],
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    rating: 4.8,
    reviewCount: 12,
    isVerified: true,
    responseTime: 'în 2 ore',
    languages: ['română', 'engleză']
  },
  {
    id: '2',
    type: 'dealer',
    name: 'AutoMax SRL',
    email: 'contact@automax.ro',
    phone: '+40264123456',
    location: mockLocations[1],
    avatar: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150&h=150&fit=crop',
    rating: 4.6,
    reviewCount: 89,
    isVerified: true,
    responseTime: 'în 1 oră',
    languages: ['română', 'engleză', 'germană']
  },
  {
    id: '3',
    type: 'individual',
    name: 'Maria Ionescu',
    email: 'maria.ionescu@email.com',
    phone: '+40722234567',
    location: mockLocations[2],
    rating: 4.9,
    reviewCount: 5,
    isVerified: true,
    responseTime: 'în 4 ore',
    languages: ['română']
  }
];

// Mock images
const generateMockImages = (carId: string, count: number = 5): Image[] => {
  const baseUrls = [
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'
  ];

  return Array.from({ length: count }, (_, index) => ({
    id: `${carId}-img-${index + 1}`,
    url: baseUrls[index % baseUrls.length],
    thumbnailUrl: baseUrls[index % baseUrls.length].replace('w=800&h=600', 'w=300&h=200'),
    alt: `Imagine ${index + 1}`,
    order: index,
    isMain: index === 0
  }));
};

// Mock cars
export const mockCars: Car[] = [
  {
    id: '1',
    title: 'BMW Seria 3 320d xDrive - Impecabilă',
    brand: 'BMW',
    model: 'Seria 3',
    generation: 'F30',
    year: 2018,
    mileage: 85000,
    fuelType: FuelType.DIESEL,
    transmission: TransmissionType.AUTOMATIC,
    price: 28500,
    currency: 'RON',
    negotiable: true,
    location: mockLocations[0],
    images: generateMockImages('1'),
    specifications: {
      engineSize: 2.0,
      power: 190,
      torque: 400,
      acceleration: 7.2,
      topSpeed: 230,
      fuelConsumption: {
        city: 6.8,
        highway: 4.9,
        combined: 5.6
      },
      co2Emissions: 147,
      euroStandard: 'Euro 6',
      doors: 4,
      seats: 5,
      trunkCapacity: 480,
      weight: 1570
    },
    features: [mockFeatures[0], mockFeatures[1], mockFeatures[2], mockFeatures[3], mockFeatures[4]],
    condition: {
      overall: ConditionType.VERY_GOOD,
      exterior: ConditionType.VERY_GOOD,
      interior: ConditionType.EXCELLENT,
      engine: ConditionType.EXCELLENT,
      transmission: ConditionType.EXCELLENT,
      notes: 'Mașină foarte bine întreținută, service la zi',
      lastServiceDate: new Date('2024-06-15'),
      nextServiceDue: new Date('2025-06-15'),
      hasAccidents: false,
      accidentHistory: 'Fără accidente'
    },
    seller: mockSellers[0],
    description: 'BMW Seria 3 320d xDrive în stare impecabilă. Mașina a fost întreținută exemplar, cu service complet la zi. Dotări complete: navigație, scaune încălzite, senzori parcare, camera marsarier. Perfectă pentru cei care caută o mașină premium, economică și fiabilă.',
    createdAt: new Date('2024-08-15'),
    updatedAt: new Date('2024-08-20'),
    status: ListingStatus.ACTIVE,
    viewCount: 245,
    favoriteCount: 18,
    contactCount: 12,
    vin: 'WBAPK9C50EA123456',
    registrationNumber: 'B123ABC',
    firstRegistration: new Date('2018-03-15'),
    owners: 1,
    warrantyRemaining: 6,
    serviceHistory: true,
    tags: ['premium', 'economic', 'xdrive']
  },
  {
    id: '2',
    title: 'Audi A4 2.0 TDI Quattro - S-Line',
    brand: 'Audi',
    model: 'A4',
    generation: 'B9',
    year: 2019,
    mileage: 72000,
    fuelType: FuelType.DIESEL,
    transmission: TransmissionType.AUTOMATIC,
    price: 32000,
    currency: 'RON',
    negotiable: false,
    location: mockLocations[1],
    images: generateMockImages('2'),
    specifications: {
      engineSize: 2.0,
      power: 150,
      torque: 320,
      acceleration: 8.5,
      topSpeed: 210,
      fuelConsumption: {
        city: 6.2,
        highway: 4.5,
        combined: 5.1
      },
      co2Emissions: 134,
      euroStandard: 'Euro 6',
      doors: 4,
      seats: 5,
      trunkCapacity: 460,
      weight: 1520
    },
    features: [mockFeatures[0], mockFeatures[1], mockFeatures[5], mockFeatures[6], mockFeatures[7]],
    condition: {
      overall: ConditionType.EXCELLENT,
      exterior: ConditionType.EXCELLENT,
      interior: ConditionType.EXCELLENT,
      engine: ConditionType.EXCELLENT,
      transmission: ConditionType.EXCELLENT,
      notes: 'Mașină ca nouă, garajată',
      lastServiceDate: new Date('2024-07-10'),
      nextServiceDue: new Date('2025-07-10'),
      hasAccidents: false,
      accidentHistory: 'Fără accidente'
    },
    seller: mockSellers[1],
    description: 'Audi A4 2.0 TDI Quattro cu pachet S-Line. Mașină în stare excepțională, garajată și foarte bine întreținută. Dotări premium complete, interior piele, jante S-Line. Ideală pentru cei care apreciază calitatea și performanța.',
    createdAt: new Date('2024-08-10'),
    updatedAt: new Date('2024-08-18'),
    status: ListingStatus.ACTIVE,
    viewCount: 189,
    favoriteCount: 25,
    contactCount: 8,
    vin: 'WAUZZZ8V2KA123456',
    registrationNumber: 'CJ456DEF',
    firstRegistration: new Date('2019-05-20'),
    owners: 1,
    warrantyRemaining: 12,
    serviceHistory: true,
    tags: ['s-line', 'quattro', 'premium']
  },
  {
    id: '3',
    title: 'Volkswagen Golf 1.6 TDI - Consum mic',
    brand: 'Volkswagen',
    model: 'Golf',
    generation: 'VII',
    year: 2016,
    mileage: 125000,
    fuelType: FuelType.DIESEL,
    transmission: TransmissionType.MANUAL,
    price: 18500,
    currency: 'RON',
    negotiable: true,
    location: mockLocations[2],
    images: generateMockImages('3'),
    specifications: {
      engineSize: 1.6,
      power: 110,
      torque: 250,
      acceleration: 10.5,
      topSpeed: 190,
      fuelConsumption: {
        city: 5.8,
        highway: 4.1,
        combined: 4.7
      },
      co2Emissions: 124,
      euroStandard: 'Euro 6',
      doors: 5,
      seats: 5,
      trunkCapacity: 380,
      weight: 1320
    },
    features: [mockFeatures[0], mockFeatures[6], mockFeatures[7], mockFeatures[8], mockFeatures[9]],
    condition: {
      overall: ConditionType.GOOD,
      exterior: ConditionType.GOOD,
      interior: ConditionType.VERY_GOOD,
      engine: ConditionType.VERY_GOOD,
      transmission: ConditionType.GOOD,
      notes: 'Mașină fiabilă, consum foarte mic',
      lastServiceDate: new Date('2024-05-20'),
      nextServiceDue: new Date('2025-05-20'),
      hasAccidents: false,
      accidentHistory: 'Fără accidente'
    },
    seller: mockSellers[2],
    description: 'Volkswagen Golf 1.6 TDI foarte economic și fiabil. Consum real sub 5L/100km. Mașină perfectă pentru oraș și drumuri lungi. Întreținută corect, fără probleme tehnice. Preț negociabil pentru cumpărător serios.',
    createdAt: new Date('2024-08-05'),
    updatedAt: new Date('2024-08-12'),
    status: ListingStatus.ACTIVE,
    viewCount: 156,
    favoriteCount: 12,
    contactCount: 15,
    registrationNumber: 'TM789GHI',
    firstRegistration: new Date('2016-09-10'),
    owners: 2,
    serviceHistory: true,
    tags: ['economic', 'fiabil', 'consum-mic']
  }
];

// Mock user preferences
const mockUserPreferences: UserPreferences = {
  language: 'ro',
  currency: 'RON',
  notifications: {
    email: true,
    push: true,
    sms: false,
    savedSearchAlerts: true,
    priceDropAlerts: true,
    newListingAlerts: false
  },
  searchRadius: 50,
  defaultLocation: mockLocations[0],
  favoriteFilters: {
    priceRange: { min: 15000, max: 35000 },
    yearRange: { min: 2015, max: 2024 },
    fuelType: [FuelType.DIESEL, FuelType.PETROL]
  }
};

// Mock saved searches
const mockSavedSearches: SavedSearch[] = [
  {
    id: '1',
    name: 'BMW Seria 3 Diesel',
    filters: {
      brand: ['BMW'],
      model: ['Seria 3'],
      fuelType: [FuelType.DIESEL],
      priceRange: { min: 20000, max: 35000 },
      yearRange: { min: 2016, max: 2024 }
    },
    alertsEnabled: true,
    createdAt: new Date('2024-07-15'),
    lastNotified: new Date('2024-08-10')
  },
  {
    id: '2',
    name: 'Mașini economice',
    filters: {
      priceRange: { min: 10000, max: 25000 },
      fuelType: [FuelType.DIESEL],
      transmission: [TransmissionType.MANUAL]
    },
    alertsEnabled: false,
    createdAt: new Date('2024-06-20')
  }
];

// Mock users
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'john.doe@email.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+40721111111',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    location: mockLocations[0],
    preferences: mockUserPreferences,
    savedSearches: mockSavedSearches,
    favorites: ['1', '2'],
    listings: [],
    createdAt: new Date('2024-01-15'),
    lastLoginAt: new Date('2024-08-20'),
    isVerified: true,
    role: 'user'
  },
  {
    id: '2',
    email: 'dealer@automax.ro',
    firstName: 'Auto',
    lastName: 'Max',
    phone: '+40264123456',
    location: mockLocations[1],
    preferences: {
      ...mockUserPreferences,
      language: 'ro',
      defaultLocation: mockLocations[1]
    },
    savedSearches: [],
    favorites: [],
    listings: ['2'],
    createdAt: new Date('2023-05-10'),
    lastLoginAt: new Date('2024-08-21'),
    isVerified: true,
    role: 'dealer'
  }
];

// Mock filter states for testing
export const mockFilterStates: Record<string, FilterState> = {
  empty: {},
  bmwDiesel: {
    brand: ['BMW'],
    fuelType: [FuelType.DIESEL],
    priceRange: { min: 20000, max: 40000 }
  },
  economicCars: {
    priceRange: { min: 10000, max: 25000 },
    fuelType: [FuelType.DIESEL],
    transmission: [TransmissionType.MANUAL],
    yearRange: { min: 2015, max: 2024 }
  },
  premiumCars: {
    brand: ['BMW', 'Audi', 'Mercedes-Benz'],
    priceRange: { min: 25000, max: 100000 },
    features: ['navigatie-gps', 'scaune-incalzite', 'senzori-parcare'],
    condition: [ConditionType.EXCELLENT, ConditionType.VERY_GOOD]
  }
};

// Export all mock data
export const mockData = {
  cars: mockCars,
  users: mockUsers,
  locations: mockLocations,
  features: mockFeatures,
  sellers: mockSellers,
  filterStates: mockFilterStates
};

export default mockData;