import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  Heart,
  Share2,
  GitCompare,
  MessageCircle,
  Phone,
  MapPin,
  Calendar,
  CalendarDays,
  Gauge,
  Fuel,
  Settings,
  Shield,
  Award,
  Clock,
  User,
  Star,
  Wrench,
  FileText,
  AlertTriangle,
  BadgeCheck,
  CircleAlert,
  ChevronRight,
  Eye,
  Car as CarIcon
} from 'lucide-react';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { cn } from '~/lib/utils';
import { ImageGallery } from '~/components/ui/ImageGallery';
import { LoanCalculator } from '~/components/calculator/LoanCalculator';
import {
  formatPrice,
  formatMileage,
  getFuelTypeLabel,
  getTransmissionLabel,
  getConditionLabel,
  formatDate,
  formatRelativeTime
} from '~/utils/helpers';
import type { Car } from '~/types';
import { useCurrency } from '~/stores/useAppStore';
import { TrustScoreBadge } from './TrustScoreBadge';
import { PriceScoreCard } from './PriceScoreCard';
import type { PriceScore } from '~/utils/priceScore';

export interface CarDetailsProps {
  car: Car;
  onContactSeller: () => void;
  onScheduleViewing: () => void;
  onAddToCompare: () => void;
  onAddToFavorites: () => void;
  onShare: () => void;
  similarCars?: Car[];
  isFavorited?: boolean;
  isInComparison?: boolean;
  priceScore?: PriceScore;
  /** False only when aggregate metrics cannot be queried; never show fake zero. */
  metricsAvailable?: boolean;
  className?: string;
}

interface AccordionSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function AccordionSection({ title, icon: Icon, children, defaultOpen = false }: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        className="flex w-full items-center justify-between py-4 text-left hover:bg-white/5 px-6 rounded-xl transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-accent-gold" />
          <span className="font-semibold text-white">{title}</span>
        </div>
        <span className={cn('transition-transform duration-200', isOpen && 'rotate-90')}>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </span>
      </button>
      
      {isOpen && (
        <div className="animate-[autofans-fade-in_180ms_ease-out] overflow-hidden">
          <div className="px-6 pb-6 pt-2">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

function SpecificationRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-white/5 last:border-b-0 text-sm sm:text-base">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

interface SimilarCarCardProps {
  car: Car;
  hasHydrated?: boolean;
}

function SimilarCarCard({ car, hasHydrated = false }: SimilarCarCardProps) {
  return (
    <Link
      to={`/car/${encodeURIComponent(car.slug || car.id)}`}
      aria-label={`Vezi ${car.title}`}
      className="group block w-64 flex-shrink-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-secondary-950"
    >
      <Card
        variant="outlined"
        padding="none"
        hoverable
        className="h-full overflow-hidden bg-white/5 border-white/10 transition-all duration-300 hover:border-accent-gold/40"
      >
        <div className="aspect-[16/10] overflow-hidden rounded-t-2xl relative">
          {car.images[0]?.url ? (
            <img
              src={car.images[0].url}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary-800 text-xs text-gray-400">Fără imagine</div>
          )}
          <div className="absolute top-2 right-2 bg-secondary-900/80 px-2 py-0.5 rounded text-xs text-white border border-white/5 font-semibold">
            {car.year}
          </div>
        </div>
        <div className="p-4">
          <h4 className="font-semibold text-white line-clamp-1 mb-1 text-sm sm:text-base">
            {car.title}
          </h4>
          <div className="text-base sm:text-lg font-bold text-accent-gold mb-2 min-h-[28px] flex items-center">
            {hasHydrated ? (
              formatPrice(car.price, car.currency)
            ) : (
              <div className="h-5 w-24 bg-white/10 rounded animate-pulse" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{formatMileage(car.mileage)}</span>
            <span>•</span>
            <span>{getFuelTypeLabel(car.fuelType)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function CarDetails({
  car,
  onContactSeller,
  onScheduleViewing,
  onAddToCompare,
  onAddToFavorites,
  onShare,
  similarCars = [],
  isFavorited = false,
  isInComparison = false,
  priceScore,
  metricsAvailable = true,
  className
}: CarDetailsProps) {
  useCurrency(); // Subscribe to currency changes to trigger details page re-renders
  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const keySpecs = [
    { icon: Calendar, label: 'An fabricație', value: car.year.toString() },
    { icon: Gauge, label: 'Kilometraj', value: formatMileage(car.mileage) },
    { icon: Fuel, label: 'Combustibil', value: getFuelTypeLabel(car.fuelType) },
    { icon: Settings, label: 'Transmisie', value: getTransmissionLabel(car.transmission) },
  ];
  const trustSignals = car.trustSignals || {
    sellerVerified: car.seller.isVerified,
    vinProvided: false,
    vinVerified: false,
    historyChecked: false,
    completeListing: Boolean(car.description && car.images.length > 0),
  };
  const trustRows = [
    { label: 'Vânzător verificat', detail: 'Identitatea contului a fost confirmată de AutoFans.', active: trustSignals.sellerVerified },
    { label: 'Serie VIN furnizată', detail: 'Vânzătorul a adăugat seria de identificare a vehiculului.', active: trustSignals.vinProvided },
    { label: 'VIN verificat', detail: 'Seria a trecut prin procesul de verificare AutoFans.', active: trustSignals.vinVerified },
    { label: 'Istoric verificat', detail: 'Au fost verificate informații despre istoricul vehiculului.', active: trustSignals.historyChecked },
    { label: 'Anunț complet', detail: 'Are informații esențiale și fotografii pentru o evaluare mai bună.', active: trustSignals.completeListing },
  ];

  return (
    <div className={cn('relative pb-24 lg:pb-0', className)}>
      
      {/* Widescreen Image Gallery (Stretches full width of layout) */}
      <div className="mb-6">
        <ImageGallery images={car.images} className="w-full" aspectRatio="video" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
        
        {/* Left main content column (2/3 width) */}
        <div className="w-full lg:w-[65%] space-y-6">
          
          {/* Header information card */}
          <Card variant="elevated" padding="lg" className="bg-glass border-white/10">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                  {car.title}
                </h1>
                <TrustScoreBadge score={car.trustScore} level={car.trustLevel} />
                
                {/* Price block visible on mobile only */}
                <div className="lg:hidden text-2xl font-bold text-accent-gold min-h-[36px] flex items-center">
                  {hasHydrated ? (
                    <>
                      {formatPrice(car.price, car.currency)}
                      {car.negotiable && <span className="block text-xs font-normal text-gray-400 text-right">Negociabil</span>}
                    </>
                  ) : (
                    <div className="h-7 w-28 bg-white/10 rounded animate-pulse" />
                  )}
                </div>
              </div>

              {/* Location, Views and Time */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-400">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-accent-gold flex-shrink-0" />
                  <span>{car.location.city}, {car.location.county}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-accent-gold flex-shrink-0" />
                  <span>Adăugat {formatRelativeTime(car.createdAt)}</span>
                </div>
                {metricsAvailable && (
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-accent-gold flex-shrink-0" />
                    <span>{car.viewCount} vizualizări</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* The seller must be visible before long-form details on mobile. */}
          <Link
            to={`/seller/${car.seller.id}`}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-glass p-4 transition-colors hover:border-accent-gold/40 hover:bg-white/5 lg:hidden"
          >
            {car.seller.avatar ? (
              <img src={car.seller.avatar} alt={car.seller.name} className="h-11 w-11 shrink-0 rounded-full border border-white/10 object-cover" />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent-gold/30 bg-accent-gold/15 text-base font-bold text-accent-gold">
                {car.seller.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-400">Vândut de</p>
              <p className="truncate font-semibold text-white">{car.seller.name}</p>
              <p className="text-xs text-gray-400">{car.seller.type === 'dealer' ? 'Dealer' : 'Persoană fizică'}</p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-accent-gold">Profil →</span>
          </Link>

          {/* Key specs grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {keySpecs.map((spec, index) => (
              <Card key={index} variant="outlined" padding="md" className="bg-glass border-white/10 flex items-center gap-3">
                <spec.icon className="h-5 w-5 text-accent-gold flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-gray-400 truncate">{spec.label}</div>
                  <div className="font-semibold text-white text-sm sm:text-base truncate">{spec.value}</div>
                </div>
              </Card>
            ))}
          </div>

          {priceScore && <PriceScoreCard score={priceScore} />}

          <Card variant="elevated" padding="lg" className="border-white/10 bg-glass">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-white"><Shield className="h-5 w-5 text-accent-gold" /> Siguranță și verificări</h3>
                <p className="mt-1 text-sm text-gray-400">Semnale transparente pentru decizia ta de cumpărare.</p>
              </div>
              <TrustScoreBadge score={car.trustScore} level={car.trustLevel} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {trustRows.map((signal) => (
                <div key={signal.label} className={cn('flex gap-3 rounded-xl border p-3', signal.active ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-white/10 bg-white/[0.02]')}>
                  {signal.active ? <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" /> : <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />}
                  <div>
                    <p className={cn('text-sm font-semibold', signal.active ? 'text-emerald-100' : 'text-gray-300')}>{signal.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-400">{signal.active ? signal.detail : 'Nu este disponibil pentru acest anunț.'}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 flex gap-2 rounded-lg bg-white/[0.03] p-3 text-xs leading-relaxed text-gray-400"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-gold" /> Scorul este orientativ și nu înlocuiește verificarea actelor, a VIN-ului și o inspecție independentă înainte de plată.</p>
          </Card>

          {/* Description Section */}
          <Card variant="elevated" padding="lg" className="bg-glass border-white/10">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 border-b border-white/5 pb-2">
              Descriere Anunț
            </h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line text-sm sm:text-base">
              {car.description}
            </p>
          </Card>

          {/* Features / Dotări Section */}
          {car.features.length > 0 && (
            <Card variant="elevated" padding="lg" className="bg-glass border-white/10">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4 border-b border-white/5 pb-2">
                Dotări și Opțiuni
              </h3>
              <div className="flex flex-wrap gap-2">
                {car.features.map((feature) => (
                  <Badge key={feature.id} variant="outline" className="text-xs sm:text-sm bg-white/5 border-white/10 hover:border-accent-gold/40 py-1 px-3">
                    {feature.name}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Technical Specifications Accordions */}
          <Card variant="elevated" padding="none" className="bg-glass border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 bg-white/5">
              <h3 className="text-lg font-bold text-white">Specificații Tehnice Detaliate</h3>
            </div>
            
            <AccordionSection title="Motor și Performanțe" icon={Settings} defaultOpen>
              <div className="space-y-1">
                <SpecificationRow label="Capacitate cilindrică" value={`${car.specifications.engineSize}L`} />
                <SpecificationRow label="Putere motor" value={`${car.specifications.power} CP`} />
                {car.specifications.torque && (
                  <SpecificationRow label="Cuplu maxim" value={`${car.specifications.torque} Nm`} />
                )}
                {car.specifications.acceleration && (
                  <SpecificationRow label="Accelerație 0-100 km/h" value={`${car.specifications.acceleration}s`} />
                )}
                {car.specifications.topSpeed && (
                  <SpecificationRow label="Viteză maximă" value={`${car.specifications.topSpeed} km/h`} />
                )}
                {car.specifications.euroStandard && (
                  <SpecificationRow label="Standard emisii Euro" value={car.specifications.euroStandard} />
                )}
              </div>
            </AccordionSection>

            <AccordionSection title="Consum și Emisii" icon={Fuel}>
              <div className="space-y-1">
                {car.specifications.fuelConsumption && (
                  <>
                    <SpecificationRow label="Consum urban" value={`${car.specifications.fuelConsumption.city} L/100km`} />
                    <SpecificationRow label="Consum extraurban" value={`${car.specifications.fuelConsumption.highway} L/100km`} />
                    <SpecificationRow label="Consum mixt" value={`${car.specifications.fuelConsumption.combined} L/100km`} />
                  </>
                )}
                {car.specifications.co2Emissions && (
                  <SpecificationRow label="Emisii CO2" value={`${car.specifications.co2Emissions} g/km`} />
                )}
              </div>
            </AccordionSection>

            <AccordionSection title="Dimensiuni și Capacități" icon={CarIcon}>
              <div className="space-y-1">
                <SpecificationRow label="Număr uși" value={car.specifications.doors} />
                <SpecificationRow label="Număr locuri" value={car.specifications.seats} />
                {car.specifications.trunkCapacity && (
                  <SpecificationRow label="Capacitate portbagaj" value={`${car.specifications.trunkCapacity} L`} />
                )}
                {car.specifications.weight && (
                  <SpecificationRow label="Masă proprie" value={`${car.specifications.weight} kg`} />
                )}
              </div>
            </AccordionSection>
          </Card>

          {/* Condition and History Section */}
          <Card variant="elevated" padding="lg" className="bg-glass border-white/10">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 border-b border-white/5 pb-2">
              Starea Vehiculului și Istoric
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Ratings */}
              <div className="space-y-3.5">
                <h4 className="font-semibold text-white text-sm uppercase tracking-wider text-accent-gold/90">Calificative stare</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">Stare generală</span>
                    <Badge variant={car.condition.overall === 'excellent' ? 'success' : 'default'}>
                      {getConditionLabel(car.condition.overall)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">Exterior</span>
                    <Badge variant={car.condition.exterior === 'excellent' ? 'success' : 'default'}>
                      {getConditionLabel(car.condition.exterior)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">Interior</span>
                    <Badge variant={car.condition.interior === 'excellent' ? 'success' : 'default'}>
                      {getConditionLabel(car.condition.interior)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">Motor</span>
                    <Badge variant={car.condition.engine === 'excellent' ? 'success' : 'default'}>
                      {getConditionLabel(car.condition.engine)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Badges / Checkmarks */}
              <div className="space-y-4">
                <h4 className="font-semibold text-white text-sm uppercase tracking-wider text-accent-gold/90">Verificări</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <Wrench className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-300">
                      {car.serviceHistory ? 'Istoric de service declarat' : 'Fără istoric de service declarat'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <FileText className="h-5 w-5 text-accent-gold flex-shrink-0" />
                    <span className="text-sm text-gray-300">
                      {car.owners} {car.owners === 1 ? 'singur proprietar' : 'proprietari anteriori'}
                    </span>
                  </div>

                  {!car.condition.hasAccidents ? (
                    <div className="flex items-center gap-2.5">
                      <Shield className="h-5 w-5 flex-shrink-0 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-300">Fără accidente declarate</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <span className="text-sm font-semibold text-red-300">Accidente declarate</span>
                    </div>
                  )}

                  {car.warrantyRemaining && car.warrantyRemaining > 0 && (
                    <div className="flex items-center gap-2.5">
                      <Award className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-300 font-semibold text-green-400">
                        Garanție valabilă {car.warrantyRemaining} luni
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column / Sidebar (1/3 width, Desktop only) */}
        <div className="hidden lg:block lg:w-[35%] space-y-6 sticky top-24">
          
          {/* Main Action Card */}
          <Card variant="elevated" padding="lg" className="bg-glass border-white/10 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-3xl font-extrabold text-accent-gold mb-1 min-h-[40px] flex items-center justify-center">
                {hasHydrated ? (
                  formatPrice(car.price, car.currency)
                ) : (
                  <div className="h-9 w-36 bg-white/10 rounded animate-pulse mx-auto" />
                )}
              </div>
              <div className="text-xs text-gray-400">
                Preț afișat • {car.negotiable ? 'Negociabil' : 'Preț fix'}
              </div>
            </div>

            {/* Seller Information */}
            <div className="border-t border-b border-white/5 py-4 my-6 flex items-center gap-3">
              <Link to={`/seller/${car.seller.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                {car.seller.avatar ? (
                  <img
                    src={car.seller.avatar}
                    alt={car.seller.name}
                    className="h-12 w-12 rounded-full object-cover border border-white/10 flex-shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-accent-gold/15 flex items-center justify-center border border-accent-gold/30 flex-shrink-0">
                    <span className="text-base font-bold text-accent-gold">
                      {car.seller.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm sm:text-base truncate">{car.seller.name}</span>
                    {car.seller.isVerified && (
                      <Shield className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-xs text-gray-400 capitalize">{car.seller.type === 'dealer' ? 'Dealer' : 'Persoană fizică'}</span>
                  <span className="text-xs text-accent-gold block hover:underline mt-0.5">Vezi profil vânzător →</span>
                </div>
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full bg-gold-gradient text-secondary-900 font-bold hover:shadow-glow transition-all flex items-center justify-center gap-2"
                onClick={onContactSeller}
              >
                <Phone className="h-5 w-5" />
                Contactează vânzătorul
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full border-white/10 hover:border-accent-gold hover:bg-white/5 font-semibold text-white flex items-center justify-center gap-2"
                onClick={onScheduleViewing}
              >
                <CalendarDays className="h-5 w-5 text-accent-gold" />
                Programează vizionare
              </Button>

              {/* Utility actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'text-xs text-gray-400 hover:text-white border border-white/5 bg-white/5 hover:border-white/20',
                    isFavorited && 'text-red-500 hover:text-red-400 border-red-500/20 bg-red-500/5'
                  )}
                  onClick={onAddToFavorites}
                >
                  <Heart className={cn('h-3.5 w-3.5 mr-1.5', isFavorited && 'fill-current')} />
                  Favorite
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'text-xs text-gray-400 hover:text-white border border-white/5 bg-white/5 hover:border-white/20',
                    isInComparison && 'text-accent-gold hover:text-accent-gold/80 border-accent-gold/20 bg-accent-gold/5'
                  )}
                  onClick={onAddToCompare}
                >
                  <GitCompare className="h-3.5 w-3.5 mr-1.5" />
                  Compară
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-gray-400 hover:text-white border border-white/5 bg-white/5 hover:border-white/20"
                onClick={onShare}
              >
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                Distribuie Anunțul
              </Button>
            </div>
          </Card>

          {/* Loan Calculator */}
          <Card variant="elevated" padding="lg" className="bg-glass border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">
              Calculator credit auto
            </h3>
            <LoanCalculator car={car} />
          </Card>
        </div>

      </div>

      {/* Similar Cars Section */}
      {similarCars.length > 0 && (
        <div className="mt-12 border-t border-white/10 pt-10">
          <h3 className="text-xl font-bold text-white mb-6">
            Mașini Similare
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {similarCars.map((similarCar) => (
              <SimilarCarCard
                key={similarCar.id}
                car={similarCar}
                hasHydrated={hasHydrated}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar on Mobile Viewports */}
      <div className="fixed bottom-20 left-0 right-0 z-50 lg:hidden bg-glass/95 border-t border-white/10 backdrop-blur-xl px-6 py-4 shadow-modal flex items-center justify-between gap-4">
        <div>
          <div className="text-lg font-extrabold text-accent-gold min-h-[28px] flex items-center">
            {hasHydrated ? (
              formatPrice(car.price, car.currency)
            ) : (
              <div className="h-5 w-24 bg-white/10 rounded animate-pulse" />
            )}
          </div>
          <div className="text-[10px] text-gray-400 leading-none">
            Preț afișat • {car.negotiable ? 'Negociabil' : 'Preț fix'}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 hover:border-accent-gold hover:bg-white/5 text-white flex items-center justify-center p-3 rounded-xl"
            onClick={onScheduleViewing}
            aria-label="Programează vizionare"
          >
            <CalendarDays className="h-5 w-5 text-accent-gold" />
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            className="bg-gold-gradient text-secondary-900 font-bold hover:shadow-glow px-4 py-2 flex items-center gap-1.5 rounded-xl text-sm"
            onClick={onContactSeller}
          >
            <Phone className="h-4 w-4" />
            Contact
          </Button>
        </div>
      </div>

    </div>
  );
}
