# Design Document - Platforma Mașini Second-Hand România

## Overview

Platforma va fi construită ca o Single Page Application (SPA) modernă folosind React/TypeScript cu un design system consistent și componente reutilizabile. Designul va fi centrat pe experiența utilizatorului, cu accent pe performanță, accesibilitate și interactivitate.

## Architecture

### Frontend Architecture
```
┌─────────────────────────────────────────┐
│              Presentation Layer          │
├─────────────────────────────────────────┤
│  React Components + Design System       │
│  ├── Pages (Home, Listings, Details)    │
│  ├── Components (Cards, Filters, etc.)  │
│  ├── Hooks (Custom React Hooks)         │
│  └── Utils (Helpers, Formatters)        │
├─────────────────────────────────────────┤
│           State Management              │
│  ├── Context API / Zustand             │
│  ├── Form State (React Hook Form)      │
│  └── Cache (React Query)               │
├─────────────────────────────────────────┤
│              Styling Layer              │
│  ├── Tailwind CSS                      │
│  ├── CSS Modules                       │
│  └── Framer Motion (Animations)        │
└─────────────────────────────────────────┘
```

### Design System Foundation
- **Color Palette**: Modern, automotive-inspired colors
  - Primary: Deep Blue (#1E40AF) - trust, professionalism
  - Secondary: Orange (#F97316) - energy, action
  - Neutral: Gray scale (#F8FAFC to #0F172A)
  - Success: Green (#10B981)
  - Warning: Amber (#F59E0B)
  - Error: Red (#EF4444)

- **Typography**: 
  - Headings: Inter (clean, modern)
  - Body: Inter (consistency)
  - Monospace: JetBrains Mono (technical specs)

- **Spacing**: 8px base unit system (8, 16, 24, 32, 48, 64px)
- **Border Radius**: 8px standard, 12px for cards, 24px for buttons
- **Shadows**: Layered shadow system for depth

## Components and Interfaces

### Core Layout Components

#### 1. Header Component
```typescript
interface HeaderProps {
  user?: User;
  onSearch: (query: string) => void;
  onMenuToggle: () => void;
}
```
- Logo și branding
- Search bar cu autocomplete
- Navigation menu (responsive)
- User account dropdown
- Notification bell cu badge

#### 2. Navigation Component
```typescript
interface NavigationProps {
  currentPath: string;
  isMobile: boolean;
  isOpen: boolean;
}
```
- Primary navigation (Acasă, Căutare, Vinde, Despre)
- Secondary navigation (Categorii mașini)
- Breadcrumb navigation
- Mobile hamburger menu

#### 3. Footer Component
- Links utile
- Contact info
- Social media
- Newsletter signup
- Legal links

### Search & Filter Components

#### 4. SearchBar Component
```typescript
interface SearchBarProps {
  placeholder: string;
  onSearch: (query: string) => void;
  suggestions: string[];
  isLoading: boolean;
}
```
- Autocomplete cu debounce
- Voice search integration
- Recent searches
- Popular searches suggestions

#### 5. FilterPanel Component
```typescript
interface FilterPanelProps {
  filters: FilterConfig[];
  activeFilters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
}
```
- Collapsible filter groups
- Range sliders pentru preț/an/km
- Multi-select dropdowns
- Quick filter chips
- Save search functionality

#### 6. SortControls Component
```typescript
interface SortControlsProps {
  options: SortOption[];
  activeSort: string;
  onSortChange: (sort: string) => void;
}
```
- Dropdown cu opțiuni sortare
- Grid/List view toggle
- Results per page selector

### Listing Components

#### 7. CarCard Component
```typescript
interface CarCardProps {
  car: Car;
  onFavorite: (carId: string) => void;
  onCompare: (carId: string) => void;
  onContact: (carId: string) => void;
  variant: 'grid' | 'list';
}
```
- Hero image cu carousel indicator
- Price badge (prominent)
- Key specs (year, km, fuel)
- Location și seller info
- Action buttons (favorite, compare, contact)
- Hover animations și micro-interactions

#### 8. CarGrid Component
```typescript
interface CarGridProps {
  cars: Car[];
  loading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
}
```
- Responsive grid layout
- Infinite scroll cu loading states
- Empty state illustration
- Skeleton loading cards

#### 9. CarDetails Component
```typescript
interface CarDetailsProps {
  car: Car;
  onContactSeller: () => void;
  onScheduleViewing: () => void;
  onAddToCompare: () => void;
}
```
- Image gallery cu zoom și fullscreen
- Specifications în tabs/accordion
- Price calculator integration
- Seller contact card
- Similar cars suggestions

### Interactive Components

#### 10. ImageGallery Component
```typescript
interface ImageGalleryProps {
  images: Image[];
  onImageClick: (index: number) => void;
  showThumbnails: boolean;
}
```
- Main image cu navigation arrows
- Thumbnail strip
- Fullscreen modal cu swipe gestures
- Zoom functionality
- Loading placeholders

#### 11. ComparisonTable Component
```typescript
interface ComparisonTableProps {
  cars: Car[];
  onRemoveCar: (carId: string) => void;
  onAddMore: () => void;
}
```
- Side-by-side comparison
- Highlight differences
- Sticky headers
- Mobile-optimized view
- Export comparison feature

#### 12. ContactModal Component
```typescript
interface ContactModalProps {
  seller: Seller;
  car: Car;
  onSendMessage: (message: string) => void;
  onScheduleCall: (time: Date) => void;
  onClose: () => void;
}
```
- Multiple contact options
- Message composer
- Phone call scheduler
- WhatsApp integration
- Form validation

### Form Components

#### 13. CreateListingWizard Component
```typescript
interface CreateListingWizardProps {
  onSubmit: (listing: CarListing) => void;
  onSaveDraft: (draft: Partial<CarListing>) => void;
  initialData?: Partial<CarListing>;
}
```
- Multi-step wizard cu progress indicator
- Image upload cu drag-and-drop
- Form validation în timp real
- Auto-save functionality
- Preview mode

#### 14. ImageUpload Component
```typescript
interface ImageUploadProps {
  maxImages: number;
  onImagesChange: (images: File[]) => void;
  acceptedTypes: string[];
}
```
- Drag and drop zone
- Multiple file selection
- Image preview cu crop/rotate
- Upload progress indicators
- Error handling

## Data Models

### Car Model
```typescript
interface Car {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  engineSize: number;
  power: number;
  price: number;
  currency: string;
  location: Location;
  images: Image[];
  specifications: CarSpecs;
  features: Feature[];
  condition: ConditionReport;
  seller: Seller;
  createdAt: Date;
  updatedAt: Date;
  status: ListingStatus;
  viewCount: number;
  favoriteCount: number;
}
```

### User Model
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  location?: Location;
  preferences: UserPreferences;
  savedSearches: SavedSearch[];
  favorites: string[];
  listings: string[];
  createdAt: Date;
}
```

### Filter State Model
```typescript
interface FilterState {
  brand?: string[];
  model?: string[];
  priceRange?: [number, number];
  yearRange?: [number, number];
  mileageRange?: [number, number];
  fuelType?: FuelType[];
  transmission?: TransmissionType[];
  location?: Location;
  radius?: number;
  features?: string[];
}
```

## Error Handling

### Error Boundary Strategy
- Global error boundary pentru crash recovery
- Component-level error boundaries
- Network error handling cu retry logic
- Form validation errors cu clear messaging
- 404/500 error pages cu navigation options

### Loading States
- Skeleton screens pentru content loading
- Progressive image loading
- Infinite scroll loading indicators
- Form submission loading states
- Search result loading animations

## Testing Strategy

### Component Testing
- Unit tests pentru toate componentele
- Integration tests pentru user flows
- Visual regression testing
- Accessibility testing (a11y)
- Performance testing (Core Web Vitals)

### User Experience Testing
- Mobile responsiveness testing
- Cross-browser compatibility
- Touch gesture testing
- Keyboard navigation testing
- Screen reader compatibility

## Performance Optimizations

### Code Splitting
- Route-based code splitting
- Component lazy loading
- Dynamic imports pentru heavy components
- Bundle size optimization

### Image Optimization
- WebP format cu fallback
- Responsive images cu srcset
- Lazy loading cu intersection observer
- Image compression și CDN delivery

### Caching Strategy
- Browser caching pentru static assets
- API response caching
- Search result caching
- User preference caching

## Responsive Design

### Breakpoints
- Mobile: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px - 1440px
- Large Desktop: 1440px+

### Mobile-First Approach
- Touch-friendly interface elements
- Swipe gestures pentru galleries
- Optimized forms pentru mobile input
- Reduced cognitive load pe ecrane mici

## Accessibility

### WCAG 2.1 AA Compliance
- Semantic HTML structure
- ARIA labels și roles
- Keyboard navigation support
- Color contrast compliance
- Screen reader optimization
- Focus management

### Inclusive Design
- Multiple input methods support
- Reduced motion preferences
- High contrast mode support
- Text scaling support