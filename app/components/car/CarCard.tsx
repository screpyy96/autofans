import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Eye, MessageCircle, GitCompare, MapPin, Calendar, Gauge, Fuel, Settings } from 'lucide-react';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { LazyImage } from '~/components/ui/LazyImage';
import { cn } from '~/lib/utils';
import { 
  formatPrice, 
  formatMileage, 
  getFuelTypeLabel, 
  getTransmissionLabel,
  getMainImage,
  formatRelativeTime 
} from '~/utils/helpers';
import type { Car } from '~/types';
import { useResponsive } from '~/hooks/useResponsive';

export interface CarCardProps {
  car: Car;
  onFavorite: (carId: string) => void;
  onCompare: (carId: string) => void;
  onContact: (carId: string) => void;
  onView?: (carId: string) => void;
  onClick?: (carId: string) => void;
  variant?: 'grid' | 'list';
  isFavorited?: boolean;
  isFavorite?: boolean;
  isInComparison?: boolean;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onSelect?: (carId: string) => void;
  className?: string;
}

export function CarCard({
  car,
  onFavorite,
  onCompare,
  onContact,
  onView,
  onClick,
  variant = 'grid',
  isFavorited = false,
  isFavorite = false,
  isInComparison = false,
  showCheckbox = false,
  isSelected = false,
  onSelect,
  className
}: CarCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const mainImage = getMainImage(car);
  const isListView = variant === 'list';
  const { isMobile, isTouchDevice } = useResponsive();

  const handleCardClick = () => {
    onView?.(car.id);
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const keySpecs = [
    { icon: Calendar, label: car.year.toString() },
    { icon: Gauge, label: formatMileage(car.mileage) },
    { icon: Fuel, label: getFuelTypeLabel(car.fuelType) },
    { icon: Settings, label: getTransmissionLabel(car.transmission) },
  ];

  return (
    <Card
      variant="elevated"
      padding="none"
      hoverable
      className={cn(
        'group overflow-hidden transition-all duration-300 bg-glass border-premium hover:border-accent-gold hover:shadow-glow',
        isListView ? 'flex flex-row' : 'flex flex-col',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className={cn(
        'relative overflow-hidden bg-secondary-800',
        isListView ? 'w-80 flex-shrink-0' : 'aspect-[4/3] w-full'
      )}>
        {mainImage && !imageError ? (
          <LazyImage
            src={mainImage}
            alt={car.title}
            className={cn(
              'h-full w-full object-cover transition-all duration-500',
              'group-hover:scale-105'
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            placeholder="Încărcare..."
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-secondary-700">
            <div className="text-center text-gray-400">
              <div className="mx-auto h-12 w-12 rounded-full bg-secondary-600 flex items-center justify-center mb-2">
                <Eye className="h-6 w-6" />
              </div>
              <p className="text-sm">Fără imagine</p>
            </div>
          </div>
        )}

        {/* Image Overlay Actions */}
        <div className="absolute top-3 right-3 flex gap-2">
          <motion.button
            className={cn(
              'rounded-full backdrop-blur-sm transition-colors',
              isMobile ? 'p-3' : 'p-2',
              isFavorited 
                ? 'bg-red-500/90 text-white shadow-glow' 
                : 'bg-glass/80 text-gray-300 hover:bg-red-500/20 hover:text-red-400 border border-premium'
            )}
            onClick={(e) => handleActionClick(e, () => onFavorite(car.id))}
            whileHover={{ scale: isTouchDevice ? 1 : 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4', isFavorited && 'fill-current')} />
          </motion.button>
          
          <motion.button
            className={cn(
              'rounded-full backdrop-blur-sm transition-colors',
              isMobile ? 'p-3' : 'p-2',
              isInComparison
                ? 'bg-accent-gold/90 text-secondary-900 shadow-glow'
                : 'bg-glass/80 text-gray-300 hover:bg-accent-gold/20 hover:text-accent-gold border border-premium'
            )}
            onClick={(e) => handleActionClick(e, () => onCompare(car.id))}
            whileHover={{ scale: isTouchDevice ? 1 : 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <GitCompare className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
          </motion.button>
        </div>

        {/* Price Badge */}
        <div className="absolute bottom-3 left-3">
          <motion.div
            className="rounded-xl bg-gold-gradient px-4 py-3 text-secondary-900 shadow-glow"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-lg font-bold">
              {formatPrice(car.price, car.currency)}
            </div>
            {car.negotiable && (
              <div className="text-xs opacity-90">Negociabil</div>
            )}
          </motion.div>
        </div>

        {/* Image Count Badge */}
        {car.images.length > 1 && (
          <div className="absolute bottom-3 right-3">
            <Badge variant="default" size="sm" className="bg-secondary-900/80 text-white border-premium">
              {car.images.length} poze
            </Badge>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className={cn(
        'flex flex-col',
        isListView ? 'flex-1 p-6' : 'p-4'
      )}>
        {/* Header */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-accent-gold transition-colors">
            {car.title}
          </h3>
          
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="h-4 w-4 text-accent-gold" />
            <span>{car.location.city}, {car.location.county}</span>
            <span>•</span>
            <span>{formatRelativeTime(car.createdAt)}</span>
          </div>
        </div>

        {/* Key Specifications */}
        <div className={cn(
          'mb-4 grid gap-2',
          isListView ? 'grid-cols-2' : 'grid-cols-2'
        )}>
          {keySpecs.map((spec, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
              <spec.icon className="h-4 w-4 text-accent-gold" />
              <span>{spec.label}</span>
            </div>
          ))}
        </div>

        {/* Features Preview */}
        {car.features.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {car.features.slice(0, isListView ? 6 : 3).map((feature) => (
                <Badge key={feature.id} variant="outline" size="sm" className="bg-accent-gold/10 text-accent-gold border-accent-gold/30">
                  {feature.name}
                </Badge>
              ))}
              {car.features.length > (isListView ? 6 : 3) && (
                <Badge variant="outline" size="sm" className="bg-accent-gold/10 text-accent-gold border-accent-gold/30">
                  +{car.features.length - (isListView ? 6 : 3)}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mb-4 flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4 text-accent-gold" />
            <span>{car.viewCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4 text-accent-gold" />
            <span>{car.favoriteCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4 text-accent-gold" />
            <span>{car.contactCount}</span>
          </div>
        </div>

        {/* Seller Info */}
        <div className="mb-4 flex items-center gap-3">
          {car.seller.avatar ? (
            <img
              src={car.seller.avatar}
              alt={car.seller.name}
              className="h-8 w-8 rounded-full object-cover border border-premium"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-accent-gold/20 flex items-center justify-center border border-premium">
              <span className="text-xs font-medium text-accent-gold">
                {car.seller.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white truncate">
                {car.seller.name}
              </span>
              {car.seller.isVerified && (
                <Badge variant="success" size="sm" className="bg-green-900/20 text-green-400 border-green-500/30">Verificat</Badge>
              )}
            </div>
            <div className="text-xs text-gray-400">
              {car.seller.type === 'dealer' ? 'Dealer' : 'Persoană fizică'}
              {car.seller.responseTime && ` • Răspunde ${car.seller.responseTime}`}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={cn(
          'flex gap-2 mt-auto',
          isListView || isMobile ? 'flex-row' : 'flex-col'
        )}>
          <Button
            variant="primary"
            size={isMobile ? "lg" : "md"}
            className="flex-1 bg-gold-gradient text-secondary-900 hover:shadow-glow hover:scale-105 transition-all duration-300"
            onClick={(e) => handleActionClick(e, () => onContact(car.id))}
          >
            <MessageCircle className={cn(isMobile ? "h-5 w-5 mr-2" : "h-4 w-4 mr-2")} />
            Contactează
          </Button>
          
          {(!isListView || isMobile) && (
            <Button
              variant="outline"
              size={isMobile ? "lg" : "md"}
              className={cn(
                isMobile ? "flex-1" : "",
                "border-premium text-gray-300 hover:bg-accent-gold/10 hover:text-accent-gold hover:border-accent-gold transition-all duration-300"
              )}
              onClick={(e) => handleActionClick(e, handleCardClick)}
            >
              Vezi detalii
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}