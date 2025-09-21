import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Share2,
  GitCompare,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Settings,
  Shield,
  Award,
  Clock,
  User,
  Star,
  ChevronDown,
  ChevronRight,
  Eye,
  Car as CarIcon,
  Wrench,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { cn } from '~/lib/utils';
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

export interface CarDetailsProps {
  car: Car;
  onContactSeller: () => void;
  onScheduleViewing: () => void;
  onAddToCompare: () => void;
  onAddToFavorites: () => void;
  onShare: () => void;
  similarCars?: Car[];
  onSimilarCarClick?: (carId: string) => void;
  isFavorited?: boolean;
  isInComparison?: boolean;
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
        className="flex w-full items-center justify-between py-4 text-left hover:bg-white/5 px-6 rounded-lg transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-accent-gold" />
          <span className="font-medium text-white">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SpecificationRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between py-2 border-b border-white/5 last:border-b-0">
      <span className="text-gray-300">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function SimilarCarCard({ car, onClick }: { car: Car; onClick: (carId: string) => void }) {
  return (
    <Card
      variant="outlined"
      padding="none"
      hoverable
      className="w-64 flex-shrink-0 cursor-pointer bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
      onClick={() => onClick(car.id)}
    >
      <div className="aspect-[4/3] overflow-hidden rounded-t-lg">
        <img
          src={car.images[0]?.url}
          alt={car.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h4 className="font-medium text-white line-clamp-2 mb-2">
          {car.title}
        </h4>
        <div className="text-lg font-bold text-accent-gold mb-2">
          {formatPrice(car.price, car.currency)}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>{car.year}</span>
          <span>•</span>
          <span>{formatMileage(car.mileage)}</span>
        </div>
      </div>
    </Card>
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
  onSimilarCarClick,
  isFavorited = false,
  isInComparison = false,
  className
}: CarDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'specifications' | 'condition' | 'seller'>('overview');

  const tabs = [
    { id: 'overview', label: 'Prezentare generală', icon: Eye },
    { id: 'specifications', label: 'Specificații tehnice', icon: Settings },
    { id: 'condition', label: 'Starea mașinii', icon: Shield },
    { id: 'seller', label: 'Vânzător', icon: User },
  ] as const;

  const keySpecs = [
    { icon: Calendar, label: 'An fabricație', value: car.year.toString() },
    { icon: Gauge, label: 'Kilometraj', value: formatMileage(car.mileage) },
    { icon: Fuel, label: 'Combustibil', value: getFuelTypeLabel(car.fuelType) },
    { icon: Settings, label: 'Transmisie', value: getTransmissionLabel(car.transmission) },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Section */}
      <Card variant="elevated" padding="lg">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 leading-tight">
              {car.title}
            </h1>

            {/* Location and Meta Information - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-400 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent-gold flex-shrink-0" />
                <span className="text-sm sm:text-base leading-relaxed">
                  {car.location.city}, {car.location.county}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent-gold flex-shrink-0" />
                <span className="text-sm sm:text-base">
                  Publicat {formatRelativeTime(car.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-accent-gold flex-shrink-0" />
                <span className="text-sm sm:text-base">
                  {car.viewCount} vizualizări
                </span>
              </div>
            </div>

            {/* Key Specifications */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {keySpecs.map((spec, index) => (
                <div key={index} className="flex items-center gap-2 sm:gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                  <spec.icon className="h-4 w-4 sm:h-5 sm:w-5 text-accent-gold flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm text-gray-300 truncate">{spec.label}</div>
                    <div className="font-medium text-white text-sm sm:text-base truncate">{spec.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Features */}
            {car.features.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-white mb-3 text-sm sm:text-base">Dotări și opțiuni</h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {car.features.map((feature) => (
                    <Badge key={feature.id} variant="outline" className="text-xs sm:text-sm">
                      {feature.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Price and Actions */}
          <div className="lg:w-80 flex-shrink-0">
            <Card variant="outlined" padding="lg" className="sticky top-6">
              <div className="text-center mb-6">
                <div className="text-2xl sm:text-3xl font-bold text-accent-gold mb-2">
                  {formatPrice(car.price, car.currency)}
                </div>
                {car.negotiable && (
                  <Badge variant="secondary" size="sm">Preț negociabil</Badge>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full text-sm sm:text-base"
                  onClick={onContactSeller}
                >
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Contactează vânzătorul
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full text-sm sm:text-base"
                  onClick={onScheduleViewing}
                >
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Programează vizionare
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="ghost"
                    size="md"
                    className={cn(
                      'flex-1 text-sm sm:text-base',
                      isFavorited && 'text-red-500 bg-red-500/10 border-red-500/20'
                    )}
                    onClick={onAddToFavorites}
                  >
                    <Heart className={cn('h-4 w-4 mr-2', isFavorited && 'fill-current')} />
                    Favorite
                  </Button>

                  <Button
                    variant="ghost"
                    size="md"
                    className={cn(
                      'flex-1 text-sm sm:text-base',
                      isInComparison && 'text-accent-gold bg-accent-gold/10 border-accent-gold/20'
                    )}
                    onClick={onAddToCompare}
                  >
                    <GitCompare className="h-4 w-4 mr-2" />
                    Compară
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="md"
                  className="w-full mt-2 text-sm sm:text-base"
                  onClick={onShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Distribuie
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Card>

      {/* Tabbed Content */}
      <Card variant="elevated" padding="none">
        {/* Tab Navigation */}
        <div className="border-b border-white/10">
          <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={cn(
                  'flex items-center gap-2 px-4 sm:px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0',
                  activeTab === tab.id
                    ? 'border-accent-gold text-accent-gold'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-white/20'
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Descriere</h3>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                      {car.description}
                    </p>
                  </div>

                  {car.tags && car.tags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Etichete</h3>
                      <div className="flex flex-wrap gap-2">
                        {car.tags.map((tag, index) => (
                          <Badge key={index} variant="primary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'specifications' && (
                <div className="space-y-6">
                  <AccordionSection title="Motor și performanțe" icon={Settings} defaultOpen>
                    <div className="space-y-1">
                      <SpecificationRow label="Capacitate cilindrică" value={`${car.specifications.engineSize}L`} />
                      <SpecificationRow label="Putere" value={`${car.specifications.power} CP`} />
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
                        <SpecificationRow label="Standard Euro" value={car.specifications.euroStandard} />
                      )}
                    </div>
                  </AccordionSection>

                  <AccordionSection title="Consum și emisii" icon={Fuel}>
                    <div className="space-y-1">
                      {car.specifications.fuelConsumption && (
                        <>
                          <SpecificationRow 
                            label="Consum urban" 
                            value={`${car.specifications.fuelConsumption.city}L/100km`} 
                          />
                          <SpecificationRow 
                            label="Consum extraurban" 
                            value={`${car.specifications.fuelConsumption.highway}L/100km`} 
                          />
                          <SpecificationRow 
                            label="Consum mixt" 
                            value={`${car.specifications.fuelConsumption.combined}L/100km`} 
                          />
                        </>
                      )}
                      {car.specifications.co2Emissions && (
                        <SpecificationRow label="Emisii CO2" value={`${car.specifications.co2Emissions} g/km`} />
                      )}
                    </div>
                  </AccordionSection>

                  <AccordionSection title="Dimensiuni și capacități" icon={CarIcon}>
                    <div className="space-y-1">
                      <SpecificationRow label="Numărul de uși" value={car.specifications.doors} />
                      <SpecificationRow label="Numărul de locuri" value={car.specifications.seats} />
                      {car.specifications.trunkCapacity && (
                        <SpecificationRow label="Capacitate portbagaj" value={`${car.specifications.trunkCapacity}L`} />
                      )}
                      {car.specifications.weight && (
                        <SpecificationRow label="Greutate" value={`${car.specifications.weight} kg`} />
                      )}
                    </div>
                  </AccordionSection>
                </div>
              )}

              {activeTab === 'condition' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Starea generală</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Stare generală</span>
                          <Badge variant={car.condition.overall === 'excellent' ? 'success' : 'default'}>
                            {getConditionLabel(car.condition.overall)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Exterior</span>
                          <Badge variant={car.condition.exterior === 'excellent' ? 'success' : 'default'}>
                            {getConditionLabel(car.condition.exterior)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Interior</span>
                          <Badge variant={car.condition.interior === 'excellent' ? 'success' : 'default'}>
                            {getConditionLabel(car.condition.interior)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Motor</span>
                          <Badge variant={car.condition.engine === 'excellent' ? 'success' : 'default'}>
                            {getConditionLabel(car.condition.engine)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Transmisie</span>
                          <Badge variant={car.condition.transmission === 'excellent' ? 'success' : 'default'}>
                            {getConditionLabel(car.condition.transmission)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Istoric și service</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-white">
                            {car.serviceHistory ? 'Istoric service complet' : 'Fără istoric service'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-white">
                            {car.owners} {car.owners === 1 ? 'proprietar' : 'proprietari'}
                          </span>
                        </div>

                        {car.condition.hasAccidents ? (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-white">A avut accidente</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-white">Fără accidente</span>
                          </div>
                        )}

                        {car.warrantyRemaining && car.warrantyRemaining > 0 && (
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-white">
                              Garanție {car.warrantyRemaining} luni
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {car.condition.notes && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Observații</h3>
                      <p className="text-gray-300 bg-white/5 p-4 rounded-xl">
                        {car.condition.notes}
                      </p>
                    </div>
                  )}

                  {car.condition.lastServiceDate && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Service</h3>
                      <div className="bg-white/5 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Ultimul service</span>
                          <span className="font-medium text-white">{formatDate(car.condition.lastServiceDate)}</span>
                        </div>
                        {car.condition.nextServiceDue && (
                          <div className="flex justify-between">
                            <span className="text-gray-300">Următorul service</span>
                            <span className="font-medium text-white">{formatDate(car.condition.nextServiceDue)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'seller' && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    {car.seller.avatar ? (
                      <img
                        src={car.seller.avatar}
                        alt={car.seller.name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                        <span className="text-xl font-medium text-white">
                          {car.seller.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">
                          {car.seller.name}
                        </h3>
                        {car.seller.isVerified && (
                          <Badge variant="success">
                            <Shield className="h-3 w-3 mr-1" />
                            Verificat
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        <span className="capitalize">
                          {car.seller.type === 'dealer' ? 'Dealer autorizat' : 'Persoană fizică'}
                        </span>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{car.seller.location.city}</span>
                        </div>
                      </div>

                      {car.seller.rating && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium text-white">{car.seller.rating}</span>
                          </div>
                          <span className="text-sm text-gray-400">
                            ({car.seller.reviewCount} {car.seller.reviewCount === 1 ? 'recenzie' : 'recenzii'})
                          </span>
                        </div>
                      )}

                      {car.seller.responseTime && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Clock className="h-4 w-4" />
                          <span>Răspunde de obicei {car.seller.responseTime}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="primary"
                      size="lg"
                      className="flex items-center justify-center gap-2"
                      onClick={onContactSeller}
                    >
                      <MessageCircle className="h-5 w-5" />
                      Trimite mesaj
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      className="flex items-center justify-center gap-2"
                    >
                      <Phone className="h-5 w-5" />
                      {car.seller.phone}
                    </Button>
                  </div>

                  {car.seller.languages && car.seller.languages.length > 0 && (
                    <div>
                      <h4 className="font-medium text-white mb-2">Limbi vorbite</h4>
                      <div className="flex flex-wrap gap-2">
                        {car.seller.languages.map((language, index) => (
                          <Badge key={index} variant="outline">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </Card>

      {/* Similar Cars Section */}
      {similarCars.length > 0 && (
        <Card variant="elevated" padding="lg">
          <h2 className="text-xl font-semibold text-white mb-6">
            Mașini similare
          </h2>
          
          <div className="flex gap-4 overflow-x-auto pb-4">
            {similarCars.map((similarCar) => (
              <SimilarCarCard
                key={similarCar.id}
                car={similarCar}
                onClick={onSimilarCarClick || (() => {})}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}