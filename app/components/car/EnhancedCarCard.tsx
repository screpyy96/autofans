import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, MessageCircle, GitCompare, MapPin, Calendar, Gauge, Fuel, Settings, Star, Zap } from 'lucide-react';
import { EnhancedCard } from '~/components/ui/EnhancedCard';
import { EnhancedButton } from '~/components/ui/EnhancedButton';
import { Badge } from '~/components/ui/Badge';
import { LazyImage } from '~/components/ui/LazyImage';
import { cn } from '~/lib/utils';
import { cardHover, fadeInUp, scaleIn, hoverScale } from '~/utils/animations';
import { 
  formatPrice, 
  formatMileage, 
  getFuelTypeLabel, 
  getTransmissionLabel,
  getMainImage,
  formatRelativeTime 
} from '~/utils/helpers';
import type { Car } from '~/types';

export interface EnhancedCarCardProps {
  car: Car;
  onFavorite: (carId: string) => void;
  onCompare: (carId: string) => void;
  onContact: (carId: string) => void;
  onView?: (carId: string) => void;
  variant?: 'grid' | 'list';
  isFavorited?: boolean;
  isInComparison?: boolean;
  className?: string;
  delay?: number;
}

export function EnhancedCarCard({
  car,
  onFavorite,
  onCompare,
  onContact,
  onView,
  variant = 'grid',
  isFavorited = false,
  isInComparison = false,
  className,
  delay = 0,
}: EnhancedCarCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const mainImage = getMainImage(car.images);
  const isNew = new Date(car.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000; // Less than 24h old
  const isPremium = car.featured || car.price > 50000; // Mock premium logic

  const handleCardClick = () => {
    onView?.(car.id);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite(car.id);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCompare(car.id);
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onContact(car.id);
  };

  if (variant === 'list') {
    return (
      <motion.div
        className={cn("bg-glass backdrop-blur-xl border-premium rounded-3xl overflow-hidden", className)}
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        whileHover="hover"
        transition={{ delay }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        <div className="flex">
          {/* Image Section */}
          <div className="relative w-80 h-48 overflow-hidden">
            <LazyImage
              src={mainImage}
              alt={`${car.brand} ${car.model}`}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
              onLoad={() => setImageLoaded(true)}
            />
            
            {/* Image overlay with badges */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            
            {/* Status badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <AnimatePresence>
                {isNew && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Badge variant="success" className="bg-green-500/90 text-white backdrop-blur-sm">
                      <Zap className="h-3 w-3 mr-1" />
                      Nou
                    </Badge>
                  </motion.div>
                )}
                {isPremium && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.1 }}
                  >
                    <Badge variant="primary" className="bg-gold-gradient text-secondary-900 backdrop-blur-sm">
                      <Star className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick actions overlay */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="flex gap-2"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <EnhancedButton
                      size="sm"
                      variant="ghost"
                      className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                      onClick={handleFavoriteClick}
                      glow
                    >
                      <Eye className="h-4 w-4" />
                    </EnhancedButton>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <motion.h3
                  className="text-xl font-semibold text-white mb-2 hover:text-accent-gold transition-colors duration-300"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {car.brand} {car.model}
                </motion.h3>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                  <MapPin className="h-4 w-4" />
                  <span>{car.location.city}, {car.location.county}</span>
                  <Calendar className="h-4 w-4 ml-2" />
                  <span>{formatRelativeTime(car.createdAt)}</span>
                </div>
              </div>
              
              <motion.div
                className="text-right"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="text-2xl font-bold text-accent-gold mb-1">
                  {formatPrice(car.price, car.currency)}
                </div>
                {car.negotiable && (
                  <Badge variant="outline" size="sm" className="text-gray-400 border-gray-600">
                    Negociabil
                  </Badge>
                )}
              </motion.div>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { icon: Calendar, label: 'An', value: car.year },
                { icon: Gauge, label: 'Km', value: formatMileage(car.mileage) },
                { icon: Fuel, label: 'Combustibil', value: getFuelTypeLabel(car.fuelType) },
                { icon: Settings, label: 'Transmisie', value: getTransmissionLabel(car.transmission) }
              ].map((spec, index) => (
                <motion.div
                  key={spec.label}
                  className="text-center group"
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <spec.icon className="h-4 w-4 text-gray-400 mx-auto mb-1 group-hover:text-accent-gold transition-colors duration-300" />
                  <div className="text-sm font-medium text-white group-hover:text-accent-gold transition-colors duration-300">
                    {spec.value}
                  </div>
                  <div className="text-xs text-gray-500">{spec.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <EnhancedButton
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={handleContactClick}
                leftIcon={<MessageCircle className="h-4 w-4" />}
                glow
              >
                Contactează
              </EnhancedButton>
              
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={handleFavoriteClick}
                className={cn(
                  "transition-all duration-300",
                  isFavorited 
                    ? "bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30" 
                    : "hover:border-accent-gold hover:text-accent-gold"
                )}
                glow={isFavorited}
              >
                <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
              </EnhancedButton>
              
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={handleCompareClick}
                className={cn(
                  "transition-all duration-300",
                  isInComparison 
                    ? "bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30" 
                    : "hover:border-accent-gold hover:text-accent-gold"
                )}
                glow={isInComparison}
              >
                <GitCompare className="h-4 w-4" />
              </EnhancedButton>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid variant
  return (
    <motion.div
      className={cn("group cursor-pointer", className)}
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      whileHover="hover"
      transition={{ delay }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <EnhancedCard
        variant="glass"
        padding="none"
        hover
        press
        glow
        className="overflow-hidden h-full"
      >
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <LazyImage
            src={mainImage}
            alt={`${car.brand} ${car.model}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Image overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Status badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <AnimatePresence>
              {isNew && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Badge variant="success" className="bg-green-500/90 text-white backdrop-blur-sm">
                    <Zap className="h-3 w-3 mr-1" />
                    Nou
                  </Badge>
                </motion.div>
              )}
              {isPremium && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.1 }}
                >
                  <Badge variant="primary" className="bg-gold-gradient text-secondary-900 backdrop-blur-sm">
                    <Star className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Price badge */}
          <motion.div
            className="absolute top-4 right-4"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Badge 
              variant="primary" 
              size="lg" 
              className="bg-glass backdrop-blur-xl border-premium text-accent-gold font-bold text-lg px-4 py-2"
            >
              {formatPrice(car.price, car.currency)}
            </Badge>
          </motion.div>

          {/* Quick view overlay */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <EnhancedButton
                    size="lg"
                    variant="secondary"
                    className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border-white/30"
                    leftIcon={<Eye className="h-5 w-5" />}
                    glow
                  >
                    Vezi detalii
                  </EnhancedButton>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <motion.h3
                className="text-lg font-semibold text-white mb-2 group-hover:text-accent-gold transition-colors duration-300"
                whileHover={{ x: 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {car.brand} {car.model}
              </motion.h3>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <MapPin className="h-3 w-3" />
                <span>{car.location.city}</span>
                <Calendar className="h-3 w-3 ml-2" />
                <span>{formatRelativeTime(car.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { icon: Calendar, label: 'An', value: car.year },
              { icon: Gauge, label: 'Km', value: formatMileage(car.mileage) },
              { icon: Fuel, label: 'Combustibil', value: getFuelTypeLabel(car.fuelType) }
            ].map((spec, index) => (
              <motion.div
                key={spec.label}
                className="text-center group/spec"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <spec.icon className="h-4 w-4 text-gray-400 mx-auto mb-1 group-hover/spec:text-accent-gold transition-colors duration-300" />
                <div className="text-sm font-medium text-white group-hover/spec:text-accent-gold transition-colors duration-300">
                  {spec.value}
                </div>
                <div className="text-xs text-gray-500">{spec.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <EnhancedButton
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={handleContactClick}
              leftIcon={<MessageCircle className="h-4 w-4" />}
              glow
            >
              Contact
            </EnhancedButton>
            
            <EnhancedButton
              variant="outline"
              size="sm"
              onClick={handleFavoriteClick}
              className={cn(
                "transition-all duration-300",
                isFavorited 
                  ? "bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30" 
                  : "hover:border-accent-gold hover:text-accent-gold"
              )}
              glow={isFavorited}
            >
              <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
            </EnhancedButton>
            
            <EnhancedButton
              variant="outline"
              size="sm"
              onClick={handleCompareClick}
              className={cn(
                "transition-all duration-300",
                isInComparison 
                  ? "bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30" 
                  : "hover:border-accent-gold hover:text-accent-gold"
              )}
              glow={isInComparison}
            >
              <GitCompare className="h-4 w-4" />
            </EnhancedButton>
          </div>
        </div>
      </EnhancedCard>
    </motion.div>
  );
}