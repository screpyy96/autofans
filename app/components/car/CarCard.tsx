import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, GitCompare, MapPin } from 'lucide-react';
import { Card } from '~/components/ui/Card';
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
import { useCurrency } from '~/stores/useAppStore';
import { TrustScoreBadge } from './TrustScoreBadge';

export interface CarCardProps {
  car: Car;
  onFavorite: (carId: string) => void;
  onCompare: (carId: string) => void;
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
  useCurrency(); // Subscribe to currency changes to trigger card re-renders
  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const mainImage = getMainImage(car);
  const isListView = variant === 'list';
  const { isMobile, isTouchDevice } = useResponsive();

  const handleCardClick = () => {
    onClick?.(car.id);
    onView?.(car.slug || car.id);
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <Card
      variant="elevated"
      padding="none"
      hoverable
      className={cn(
        'group overflow-hidden transition-all duration-300 bg-glass border-white/10 hover:border-accent-gold/45 hover:shadow-glow cursor-pointer flex flex-col',
        isListView && 'sm:flex-row',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className={cn(
        'relative overflow-hidden bg-secondary-900 aspect-[16/10] w-full',
        isListView && 'sm:w-72 sm:aspect-[4/3] flex-shrink-0'
      )}>
        {mainImage && !imageError ? (
          <LazyImage
            src={mainImage}
            alt={car.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            placeholder="Încărcare..."
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-secondary-800">
            <p className="text-sm text-gray-500">Fără imagine</p>
          </div>
        )}

        {/* Favorite & Compare Overlay Buttons */}
        <div className="absolute top-2.5 right-2.5 flex gap-1.5 z-10">
          <motion.button
            className={cn(
              'rounded-full p-2 backdrop-blur-md transition-colors border',
              isFavorited 
                ? 'bg-red-500 text-white border-red-500 shadow-glow' 
                : 'bg-glass/80 text-gray-300 border-white/10 hover:bg-red-500/20 hover:text-red-400'
            )}
            onClick={(e) => handleActionClick(e, () => onFavorite(car.id))}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Adaugă la favorite"
          >
            <Heart className={cn('h-3.5 w-3.5', isFavorited && 'fill-current')} />
          </motion.button>
          
          <motion.button
            className={cn(
              'rounded-full p-2 backdrop-blur-md transition-colors border',
              isInComparison
                ? 'bg-accent-gold text-secondary-900 border-accent-gold shadow-glow'
                : 'bg-glass/80 text-gray-300 border-white/10 hover:bg-accent-gold/20 hover:text-accent-gold'
            )}
            onClick={(e) => handleActionClick(e, () => onCompare(car.id))}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Adaugă la comparare"
          >
            <GitCompare className="h-3.5 w-3.5" />
          </motion.button>
        </div>

        {/* Image Count Badge */}
        {car.images.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 z-10">
            <div className="bg-secondary-950/80 text-white text-[10px] px-2 py-0.5 rounded border border-white/10 font-medium">
              {car.images.length} poze
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col justify-between flex-1 min-w-0">
        
        {/* Header (Title and Price) */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-bold text-white line-clamp-1 group-hover:text-accent-gold transition-colors duration-300">
            {car.title}
          </h3>
          <TrustScoreBadge score={car.trustScore} level={car.trustLevel} compact />
          
          <div className="flex items-baseline gap-1.5 min-h-[28px] flex items-center">
            {hasHydrated ? (
              <>
                <span className="text-lg sm:text-xl font-extrabold text-accent-gold">
                  {formatPrice(car.price, car.currency)}
                </span>
                {car.negotiable && (
                  <span className="text-[10px] text-gray-400 font-normal bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                    Negociabil
                  </span>
                )}
              </>
            ) : (
              <div className="h-5 w-24 bg-white/10 rounded animate-pulse" />
            )}
          </div>
        </div>

        {/* Inline Specifications (Clean list) */}
        <div className="text-xs text-gray-400 py-3 border-t border-b border-white/5 my-3 flex flex-wrap gap-x-2 gap-y-1 items-center">
          <span>{car.year}</span>
          <span className="text-white/10">•</span>
          <span>{formatMileage(car.mileage)}</span>
          <span className="text-white/10">•</span>
          <span>{getFuelTypeLabel(car.fuelType)}</span>
          <span className="text-white/10">•</span>
          <span>{getTransmissionLabel(car.transmission)}</span>
        </div>

        {/* Footer (Location and Date) */}
        <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="h-3.5 w-3.5 text-accent-gold flex-shrink-0" />
            <span className="truncate">{car.location.city}, {car.location.county}</span>
          </div>
          <span className="flex-shrink-0">{formatRelativeTime(car.createdAt)}</span>
        </div>

      </div>
    </Card>
  );
}
