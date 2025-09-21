import { FuelType, TransmissionType, ConditionType } from '../types';

// Application constants
export const APP_CONFIG = {
  name: 'Platforma Mașini Second-Hand',
  shortName: 'AutoFans',
  description: 'Cea mai modernă platformă de vânzare mașini second-hand din România',
  version: '1.0.0',
  author: 'AutoFans Team',
  contact: {
    email: 'contact@AutoFans.ro',
    phone: '+40 21 123 4567',
    address: 'București, România'
  }
} as const;

// Pagination constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 48,
  INFINITE_SCROLL_THRESHOLD: 3
} as const;

// Price constants (in RON)
export const PRICE_LIMITS = {
  MIN: 500,
  MAX: 10000000,
  DEFAULT_RANGE: {
    MIN: 5000,
    MAX: 50000
  }
} as const;

// Year constants
export const YEAR_LIMITS = {
  MIN: 1900,
  MAX: new Date().getFullYear() + 1,
  DEFAULT_RANGE: {
    MIN: 2010,
    MAX: new Date().getFullYear()
  }
} as const;

// Mileage constants (in km)
export const MILEAGE_LIMITS = {
  MIN: 0,
  MAX: 2000000,
  DEFAULT_RANGE: {
    MIN: 0,
    MAX: 200000
  }
} as const;

// Search constants
export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  DEBOUNCE_DELAY: 300,
  MAX_SUGGESTIONS: 10,
  MAX_RECENT_SEARCHES: 5,
  DEFAULT_RADIUS: 50, // km
  MAX_RADIUS: 500 // km
} as const;

// Image constants
export const IMAGE_CONFIG = {
  MAX_IMAGES_PER_LISTING: 20,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  THUMBNAIL_SIZE: { width: 300, height: 200 },
  GALLERY_SIZE: { width: 800, height: 600 }
} as const;

// Form validation constants
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^(\+40|0)[0-9]{9}$/,
  VIN_REGEX: /^[A-HJ-NPR-Z0-9]{17}$/,
  REGISTRATION_REGEX: /^[A-Z]{1,2}[0-9]{2,3}[A-Z]{3}$/,
  MIN_PASSWORD_LENGTH: 8,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 2000,
  MIN_DESCRIPTION_LENGTH: 50
} as const;

// Romanian car brands (most popular)
export const POPULAR_BRANDS = [
  'Audi',
  'BMW',
  'Mercedes-Benz',
  'Volkswagen',
  'Skoda',
  'Ford',
  'Opel',
  'Renault',
  'Peugeot',
  'Hyundai',
  'Toyota',
  'Nissan',
  'Mazda',
  'Honda',
  'Kia',
  'Citroen',
  'Seat',
  'Fiat',
  'Volvo',
  'Dacia'
] as const;

// Fuel type options with Romanian labels
export const FUEL_TYPE_OPTIONS = [
  { value: FuelType.PETROL, label: 'Benzină', icon: '⛽' },
  { value: FuelType.DIESEL, label: 'Motorină', icon: '🛢️' },
  { value: FuelType.HYBRID, label: 'Hibrid', icon: '🔋' },
  { value: FuelType.ELECTRIC, label: 'Electric', icon: '⚡' },
  { value: FuelType.LPG, label: 'GPL', icon: '🔥' },
  { value: FuelType.CNG, label: 'CNG', icon: '💨' }
] as const;

// Transmission type options with Romanian labels
export const TRANSMISSION_OPTIONS = [
  { value: TransmissionType.MANUAL, label: 'Manuală', icon: '🎛️' },
  { value: TransmissionType.AUTOMATIC, label: 'Automată', icon: '⚙️' },
  { value: TransmissionType.SEMI_AUTOMATIC, label: 'Semi-automată', icon: '🔄' },
  { value: TransmissionType.CVT, label: 'CVT', icon: '📊' }
] as const;

// Condition options with Romanian labels
export const CONDITION_OPTIONS = [
  { value: ConditionType.EXCELLENT, label: 'Excelentă', color: '#10B981', icon: '⭐' },
  { value: ConditionType.VERY_GOOD, label: 'Foarte bună', color: '#3B82F6', icon: '✨' },
  { value: ConditionType.GOOD, label: 'Bună', color: '#F59E0B', icon: '👍' },
  { value: ConditionType.FAIR, label: 'Acceptabilă', color: '#F97316', icon: '👌' },
  { value: ConditionType.POOR, label: 'Slabă', color: '#EF4444', icon: '👎' }
] as const;

// Romanian counties
export const ROMANIAN_COUNTIES = [
  'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani',
  'Brașov', 'Brăila', 'București', 'Buzău', 'Caraș-Severin', 'Călărași',
  'Cluj', 'Constanța', 'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu',
  'Gorj', 'Harghita', 'Hunedoara', 'Ialomița', 'Iași', 'Ilfov', 'Maramureș',
  'Mehedinți', 'Mureș', 'Neamț', 'Olt', 'Prahova', 'Satu Mare', 'Sălaj',
  'Sibiu', 'Suceava', 'Teleorman', 'Timiș', 'Tulcea', 'Vaslui', 'Vâlcea', 'Vrancea'
] as const;

// Feature categories
export const FEATURE_CATEGORIES = {
  SAFETY: {
    id: 'safety',
    label: 'Siguranță',
    icon: '🛡️',
    features: [
      'ABS', 'ESP', 'Airbag-uri', 'Senzori parcare', 'Camera marsarier',
      'Asistent frânare', 'Control tracțiune', 'Sistem anti-coliziune'
    ]
  },
  COMFORT: {
    id: 'comfort',
    label: 'Confort',
    icon: '🛋️',
    features: [
      'Aer condiționat', 'Climatronic', 'Scaune încălzite', 'Scaune ventilate',
      'Scaune electrice', 'Volan încălzit', 'Geamuri electrice', 'Oglinzi electrice'
    ]
  },
  TECHNOLOGY: {
    id: 'technology',
    label: 'Tehnologie',
    icon: '📱',
    features: [
      'Navigație GPS', 'Bluetooth', 'USB', 'Android Auto', 'Apple CarPlay',
      'Cruise control', 'Sistem audio premium', 'Ecran tactil'
    ]
  },
  EXTERIOR: {
    id: 'exterior',
    label: 'Exterior',
    icon: '🚗',
    features: [
      'Jante aliaj', 'Faruri LED', 'Faruri Xenon', 'Trapă', 'Bare de plafon',
      'Senzori lumină', 'Senzori ploaie', 'Oglinzi rabatabile electric'
    ]
  }
} as const;

// Contact preferences
export const CONTACT_METHODS = [
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'phone', label: 'Telefon', icon: '📞' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { value: 'form', label: 'Formular contact', icon: '📝' }
] as const;

// Time slots for contact
export const CONTACT_TIME_SLOTS = [
  { value: 'morning', label: 'Dimineața (8:00 - 12:00)' },
  { value: 'afternoon', label: 'După-amiaza (12:00 - 18:00)' },
  { value: 'evening', label: 'Seara (18:00 - 22:00)' },
  { value: 'anytime', label: 'Oricând' }
] as const;

// Sort options
export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevanță', field: 'createdAt' as const },
  { value: 'price_asc', label: 'Preț crescător', field: 'price' as const },
  { value: 'price_desc', label: 'Preț descrescător', field: 'price' as const },
  { value: 'year_desc', label: 'An descrescător', field: 'year' as const },
  { value: 'year_asc', label: 'An crescător', field: 'year' as const },
  { value: 'mileage_asc', label: 'Kilometraj crescător', field: 'mileage' as const },
  { value: 'mileage_desc', label: 'Kilometraj descrescător', field: 'mileage' as const },
  { value: 'date_desc', label: 'Cele mai noi', field: 'createdAt' as const },
  { value: 'date_asc', label: 'Cele mai vechi', field: 'createdAt' as const }
] as const;

// API endpoints (for future backend integration)
export const API_ENDPOINTS = {
  CARS: '/api/cars',
  USERS: '/api/users',
  SEARCH: '/api/search',
  FILTERS: '/api/filters',
  LOCATIONS: '/api/locations',
  UPLOAD: '/api/upload',
  CONTACT: '/api/contact'
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'AutoFans_user_preferences',
  RECENT_SEARCHES: 'AutoFans_recent_searches',
  SAVED_FILTERS: 'AutoFans_saved_filters',
  FAVORITES: 'AutoFans_favorites',
  VIEWED_CARS: 'AutoFans_viewed_cars',
  THEME: 'AutoFans_theme'
} as const;

// Animation durations (in ms)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  EXTRA_SLOW: 1000
} as const;

// Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
} as const;