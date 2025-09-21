import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Car as CarIcon, Plus } from 'lucide-react';
import { CarCard } from './CarCard';
import { Button } from '~/components/ui/Button';
import { cn } from '~/lib/utils';
import type { Car } from '~/types';

export interface CarGridProps {
  cars: Car[];
  loading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  onFavorite: (carId: string) => void;
  onCompare: (carId: string) => void;
  onContact: (carId: string) => void;
  onView?: (carId: string) => void;
  viewMode?: 'grid' | 'list';
  favoritedCars?: string[];
  comparisonCars?: string[];
  className?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateAction?: {
    label: string;
    onClick: () => void;
  };
}

// Skeleton loading component
function CarCardSkeleton({ variant = 'grid' }: { variant?: 'grid' | 'list' }) {
  const isListView = variant === 'list';
  
  return (
    <div className={cn(
      'animate-pulse rounded-lg border border-white/10 bg-secondary-900/70 backdrop-blur-xl overflow-hidden',
      isListView ? 'flex flex-row' : 'flex flex-col'
    )}>
      {/* Image skeleton */}
      <div className={cn(
        'bg-secondary-700/50',
        isListView ? 'w-80 h-48 flex-shrink-0' : 'aspect-[4/3] w-full'
      )} />
      
      {/* Content skeleton */}
      <div className={cn(
        'flex flex-col',
        isListView ? 'flex-1 p-6' : 'p-4'
      )}>
        {/* Title skeleton */}
        <div className="h-6 bg-secondary-700/50 rounded mb-2" />
        <div className="h-4 bg-secondary-700/50 rounded w-3/4 mb-3" />
        
        {/* Specs skeleton */}
        <div className={cn(
          'mb-4 grid gap-2',
          isListView ? 'grid-cols-2' : 'grid-cols-2'
        )}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 bg-secondary-700/50 rounded" />
          ))}
        </div>
        
        {/* Features skeleton */}
        <div className="mb-4 flex gap-1 flex-wrap">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-6 w-16 bg-secondary-700/50 rounded-full" />
          ))}
        </div>
        
        {/* Stats skeleton */}
        <div className="mb-4 flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 w-8 bg-secondary-700/50 rounded" />
          ))}
        </div>
        
        {/* Seller skeleton */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-8 w-8 bg-secondary-700/50 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-secondary-700/50 rounded mb-1" />
            <div className="h-3 bg-secondary-700/50 rounded w-2/3" />
          </div>
        </div>
        
        {/* Buttons skeleton */}
        <div className={cn(
          'flex gap-2',
          isListView ? 'flex-row' : 'flex-col'
        )}>
          <div className="h-10 bg-secondary-700/50 rounded flex-1" />
          {!isListView && <div className="h-10 bg-secondary-700/50 rounded" />}
        </div>
      </div>
    </div>
  );
}

// Empty state component
function EmptyState({ 
  title = "Nu am găsit mașini", 
  description = "Încearcă să modifici filtrele de căutare pentru a găsi mai multe rezultate.",
  action
}: {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6 rounded-full bg-secondary-800/60 p-6">
        <Search className="h-12 w-12 text-accent-gold" />
      </div>
      
      <h3 className="mb-2 text-xl font-semibold text-white">
        {title}
      </h3>
      
      <p className="mb-6 text-gray-300">
        {description}
      </p>
      
      {action && (
        <Button
          variant="primary"
          onClick={action.onClick}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

export function CarGrid({
  cars,
  loading,
  onLoadMore,
  hasMore,
  onFavorite,
  onCompare,
  onContact,
  onView,
  viewMode = 'grid',
  favoritedCars = [],
  comparisonCars = [],
  className,
  emptyStateTitle,
  emptyStateDescription,
  emptyStateAction
}: CarGridProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isListView = viewMode === 'list';

  // Intersection Observer for infinite scroll
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: '100px',
    });

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [handleIntersection]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  // Show empty state if no cars and not loading
  if (cars.length === 0 && !loading) {
    return (
      <div className={className}>
        <EmptyState
          title={emptyStateTitle}
          description={emptyStateDescription}
          action={emptyStateAction}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <motion.div
        className={cn(
          'gap-6',
          isListView 
            ? 'flex flex-col' 
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        )}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {cars.map((car) => (
            <motion.div
              key={car.id}
              variants={itemVariants}
              layout
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <CarCard
                car={car}
                onFavorite={onFavorite}
                onCompare={onCompare}
                onContact={onContact}
                onView={onView}
                variant={viewMode}
                isFavorited={favoritedCars.includes(car.id)}
                isInComparison={comparisonCars.includes(car.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading skeletons */}
        {loading && (
          <>
            {Array.from({ length: isListView ? 3 : 8 }).map((_, index) => (
              <motion.div
                key={`skeleton-${index}`}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
              >
                <CarCardSkeleton variant={viewMode} />
              </motion.div>
            ))}
          </>
        )}
      </motion.div>

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="h-10" />

      {/* Load more button (fallback for infinite scroll) */}
      {hasMore && !loading && cars.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            className="flex items-center gap-2"
          >
            <CarIcon className="h-4 w-4" />
            Încarcă mai multe mașini
          </Button>
        </div>
      )}

      {/* End of results message */}
      {!hasMore && cars.length > 0 && (
        <motion.div
          className="mt-8 text-center text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary-800/60 px-4 py-2">
            <CarIcon className="h-4 w-4" />
            <span>Ai văzut toate mașinile disponibile</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}