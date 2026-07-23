import { lazy, Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { cn } from '~/lib/utils';
import type { Image } from '~/types';
import { useTouch } from '~/hooks/useTouch';
import { useResponsive } from '~/hooks/useResponsive';

const Modal = lazy(() => import('./Modal').then(({ Modal: ModalComponent }) => ({ default: ModalComponent })));

export interface ImageGalleryProps {
  images: Image[];
  onImageClick?: (index: number) => void;
  showThumbnails?: boolean;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  enableZoom?: boolean;
  enableFullscreen?: boolean;
}

export const ImageGallery = ({
  images,
  onImageClick,
  showThumbnails = true,
  className,
  aspectRatio = 'video',
  enableZoom = true,
  enableFullscreen = true,
}: ImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());

  const mainImageRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTouchDevice } = useResponsive();

  const currentImage = images[currentIndex];

  // Handle image loading
  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages(prev => new Set([...prev, index]));
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  }, []);

  const handleImageLoadStart = useCallback((index: number) => {
    setLoadingImages(prev => new Set([...prev, index]));
  }, []);

  // Navigation functions
  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % images.length);
    setIsZoomed(false);
    setZoomLevel(1);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    setIsZoomed(false);
    setZoomLevel(1);
  }, [images.length]);

  const goToImage = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsZoomed(false);
    setZoomLevel(1);
    onImageClick?.(index);
  }, [onImageClick]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          e.preventDefault();
          setIsFullscreen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, goToNext, goToPrevious]);

  // Touch gesture handlers
  const { touchHandlers } = useTouch({
    threshold: 30,
    velocityThreshold: 0.2,
    onSwipeLeft: () => goToNext(),
    onSwipeRight: () => goToPrevious(),
    onDoubleTap: () => {
      if (enableZoom && !isZoomed) {
        setIsZoomed(true);
        setZoomLevel(2);
        setZoomPosition({ x: 0, y: 0 });
      } else if (isZoomed) {
        setIsZoomed(false);
        setZoomLevel(1);
        setZoomPosition({ x: 0, y: 0 });
      }
    },
    onPinch: (scale) => {
      if (enableZoom) {
        const newZoomLevel = Math.max(1, Math.min(4, scale));
        setZoomLevel(newZoomLevel);
        setIsZoomed(newZoomLevel > 1);
      }
    },
  });

  // Zoom functionality
  const handleImageClick = useCallback((e: React.MouseEvent) => {
    if (!enableZoom) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    if (isZoomed) {
      setIsZoomed(false);
      setZoomLevel(1);
      setZoomPosition({ x: 0, y: 0 });
    } else {
      setIsZoomed(true);
      setZoomLevel(2);
      setZoomPosition({ x: -x * 50, y: -y * 50 });
    }
  }, [enableZoom, isZoomed]);

  // Scroll thumbnails to current image
  useEffect(() => {
    if (!showThumbnails || !thumbnailsRef.current) return;

    const thumbnail = thumbnailsRef.current.children[currentIndex] as HTMLElement;
    if (thumbnail) {
      thumbnail.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentIndex, showThumbnails]);

  if (!images.length) {
    return (
      <div className={cn(
        'bg-secondary-800 rounded-2xl flex items-center justify-center border border-premium',
        aspectRatio === 'square' && 'aspect-square',
        aspectRatio === 'video' && 'aspect-video',
        className
      )}>
        <div className="text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-2 text-accent-gold/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Nu sunt fotografii disponibile</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Main Image Display */}
      <div
        ref={mainImageRef}
        className={cn(
          'relative overflow-hidden rounded-2xl bg-secondary-800 group cursor-pointer border border-premium',
          aspectRatio === 'square' && 'aspect-square',
          aspectRatio === 'video' && 'aspect-video',
          enableZoom && 'cursor-zoom-in',
          isZoomed && 'cursor-zoom-out'
        )}
        onClick={handleImageClick}
      >
        <div key={currentIndex} className="relative h-full w-full animate-[autofans-fade-in_180ms_ease-out]">
            {/* Loading placeholder */}
            {loadingImages.has(currentIndex) && (
              <div className="absolute inset-0 flex items-center justify-center bg-secondary-800">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-gold border-t-transparent" />
              </div>
            )}

            {/* Main Image */}
            <img
              src={currentImage.url}
              srcSet={currentImage.srcSet}
              sizes={currentImage.sizes}
              alt={currentImage.alt}
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              style={{
                transform: isZoomed
                  ? `scale(${zoomLevel}) translate(${zoomPosition.x}px, ${zoomPosition.y}px)`
                  : 'scale(1)',
                transformOrigin: 'center',
                transition: 'transform 0.3s ease-out'
              }}
              onLoad={() => handleImageLoad(currentIndex)}
              onLoadStart={() => handleImageLoadStart(currentIndex)}
              draggable={false}
              {...(isTouchDevice ? touchHandlers : {})}
            />
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white rounded-full p-2.5 transition-all shadow-lg backdrop-blur-md border border-white/20 z-10",
                "focus:outline-none focus:ring-2 focus:ring-accent-gold",
                isMobile ? "opacity-90" : "opacity-80 group-hover:opacity-100 hover:scale-110"
              )}
              aria-label={`Imaginea anterioară (${currentIndex} din ${images.length})`}
              type="button"
            >
              <ChevronLeft className="w-5 h-5 text-white stroke-[2.5]" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white rounded-full p-2.5 transition-all shadow-lg backdrop-blur-md border border-white/20 z-10",
                "focus:outline-none focus:ring-2 focus:ring-accent-gold",
                isMobile ? "opacity-90" : "opacity-80 group-hover:opacity-100 hover:scale-110"
              )}
              aria-label={`Imaginea următoare (${currentIndex + 2} din ${images.length})`}
              type="button"
            >
              <ChevronRight className="w-5 h-5 text-white stroke-[2.5]" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-semibold border border-white/20 shadow-md">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Fullscreen Button */}
        {enableFullscreen && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(true);
            }}
            className={cn(
              "absolute top-3 right-3 bg-black/60 hover:bg-black/90 text-white p-2.5 rounded-full transition-all shadow-lg backdrop-blur-md border border-white/20 z-10",
              "focus:outline-none focus:ring-2 focus:ring-accent-gold",
              isMobile ? "opacity-90" : "opacity-80 group-hover:opacity-100 hover:scale-110"
            )}
            aria-label="Vizualizare pe tot ecranul"
            type="button"
          >
            <Maximize2 className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Thumbnail Strip */}
      {showThumbnails && images.length > 1 && (
        <div className="mt-4">
          <div
            ref={thumbnailsRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => goToImage(index)}
                className={cn(
                  'relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 focus:ring-offset-secondary-800',
                  currentIndex === index
                    ? 'border-accent-gold ring-2 ring-accent-gold/20'
                    : 'border-premium hover:border-accent-gold/50'
                )}
                aria-label={`Selectează imaginea ${index + 1}: ${image.alt}`}
                aria-pressed={currentIndex === index}
                type="button"
              >
                {/* Thumbnail loading placeholder */}
                {loadingImages.has(index) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-secondary-800">
                    <div className="w-4 h-4 border border-accent-gold border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                <img
                  src={image.thumbnailUrl || image.url}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover"
                  loading={index === currentIndex ? 'eager' : 'lazy'}
                  decoding="async"
                  onLoad={() => handleImageLoad(index)}
                  onLoadStart={() => handleImageLoadStart(index)}
                />

                {/* Active indicator */}
                {currentIndex === index && (
                  <div className="absolute inset-0 bg-accent-gold/20" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      {enableFullscreen && isFullscreen && (
        <Suspense fallback={null}>
          <Modal
            isOpen={isFullscreen}
            onClose={() => setIsFullscreen(false)}
            size="xl"
            className="!m-0 !h-screen !w-screen !rounded-none"
          >
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            <div className="relative">
              <img
                src={currentImage.url}
                srcSet={currentImage.srcSet}
                sizes="100vw"
                alt={currentImage.alt}
                className="object-contain"
                style={{
                  transform: isZoomed
                    ? `scale(${zoomLevel}) translate(${zoomPosition.x}px, ${zoomPosition.y}px)`
                    : 'scale(1)',
                  transformOrigin: 'center',
                  transition: 'transform 0.3s ease-out'
                }}
                onClick={handleImageClick}
              />
            </div>

            {/* Fullscreen Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-secondary-900/80 text-white p-3 rounded-full hover:bg-accent-gold/20 hover:text-accent-gold border border-premium transition-colors"
                  aria-label="Imaginea anterioară"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-secondary-900/80 text-white p-3 rounded-full hover:bg-accent-gold/20 hover:text-accent-gold border border-premium transition-colors"
                  aria-label="Imaginea următoare"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Fullscreen Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-secondary-900/80 text-white px-4 py-2 rounded-full border border-premium">
              {currentIndex + 1} / {images.length}
            </div>

            {/* Fullscreen Thumbnails */}
            {showThumbnails && images.length > 1 && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex justify-center gap-2 overflow-x-auto scrollbar-hide">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => goToImage(index)}
                      className={cn(
                        'flex-shrink-0 w-12 h-12 rounded-xl border-2 overflow-hidden transition-all',
                        currentIndex === index
                          ? 'border-accent-gold ring-2 ring-accent-gold/50'
                          : 'border-premium hover:border-accent-gold/60'
                      )}
                      type="button"
                      aria-label={`Selectează imaginea ${index + 1}: ${image.alt}`}
                      aria-pressed={currentIndex === index}
                    >
                      <img
                        src={image.thumbnailUrl || image.url}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          </Modal>
        </Suspense>
      )}
    </div>
  );
};
