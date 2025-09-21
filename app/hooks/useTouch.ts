import { useCallback, useRef, useState } from 'react';

export interface TouchGesture {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  distance: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  velocity: number;
  duration: number;
}

export interface UseTouchOptions {
  threshold?: number;
  velocityThreshold?: number;
  preventScroll?: boolean;
  onSwipeLeft?: (gesture: TouchGesture) => void;
  onSwipeRight?: (gesture: TouchGesture) => void;
  onSwipeUp?: (gesture: TouchGesture) => void;
  onSwipeDown?: (gesture: TouchGesture) => void;
  onTap?: (event: React.TouchEvent) => void;
  onDoubleTap?: (event: React.TouchEvent) => void;
  onPinch?: (scale: number, event: React.TouchEvent) => void;
}

export const useTouch = (options: UseTouchOptions = {}) => {
  const {
    threshold = 50,
    velocityThreshold = 0.3,
    preventScroll = false,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    onPinch,
  } = options;

  const touchStartRef = useRef<React.Touch | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const lastTapRef = useRef<number>(0);
  const initialDistanceRef = useRef<number>(0);
  const [isTracking, setIsTracking] = useState(false);

  const getDistance = useCallback((touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getDirection = useCallback((deltaX: number, deltaY: number): 'left' | 'right' | 'up' | 'down' | null => {
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX < threshold && absDeltaY < threshold) {
      return null;
    }

    if (absDeltaX > absDeltaY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }, [threshold]);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (preventScroll) {
      event.preventDefault();
    }

    const touch = event.touches[0];
    touchStartRef.current = touch;
    touchStartTimeRef.current = Date.now();
    setIsTracking(true);

    // Handle pinch gesture
    if (event.touches.length === 2 && onPinch) {
      initialDistanceRef.current = getDistance(event.touches[0], event.touches[1]);
    }
  }, [preventScroll, onPinch, getDistance]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!touchStartRef.current || !isTracking) return;

    if (preventScroll) {
      event.preventDefault();
    }

    // Handle pinch gesture
    if (event.touches.length === 2 && onPinch && initialDistanceRef.current > 0) {
      const currentDistance = getDistance(event.touches[0], event.touches[1]);
      const scale = currentDistance / initialDistanceRef.current;
      onPinch(scale, event);
      return;
    }
  }, [preventScroll, onPinch, getDistance, isTracking]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (!touchStartRef.current || !isTracking) return;

    const touchEnd = event.changedTouches[0];
    const touchStart = touchStartRef.current;
    const duration = Date.now() - touchStartTimeRef.current;

    const deltaX = touchEnd.clientX - touchStart.clientX;
    const deltaY = touchEnd.clientY - touchStart.clientY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / duration;

    const gesture: TouchGesture = {
      startX: touchStart.clientX,
      startY: touchStart.clientY,
      currentX: touchEnd.clientX,
      currentY: touchEnd.clientY,
      deltaX,
      deltaY,
      distance,
      direction: getDirection(deltaX, deltaY),
      velocity,
      duration,
    };

    // Handle swipe gestures
    if (distance >= threshold && velocity >= velocityThreshold) {
      switch (gesture.direction) {
        case 'left':
          onSwipeLeft?.(gesture);
          break;
        case 'right':
          onSwipeRight?.(gesture);
          break;
        case 'up':
          onSwipeUp?.(gesture);
          break;
        case 'down':
          onSwipeDown?.(gesture);
          break;
      }
    } else if (distance < threshold && duration < 300) {
      // Handle tap gestures
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;

      if (timeSinceLastTap < 300 && onDoubleTap) {
        onDoubleTap(event);
      } else if (onTap) {
        onTap(event);
      }

      lastTapRef.current = now;
    }

    // Reset state
    touchStartRef.current = null;
    touchStartTimeRef.current = 0;
    initialDistanceRef.current = 0;
    setIsTracking(false);
  }, [threshold, velocityThreshold, getDirection, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap, isTracking]);

  const touchHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    touchHandlers,
    isTracking,
  };
};