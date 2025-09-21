import { useEffect, useState, useCallback } from 'react';

export interface AccessibilityPreferences {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
}

export const useAccessibility = () => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false,
  });

  useEffect(() => {
    // Check for prefers-reduced-motion
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReduceMotionChange = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({ ...prev, reduceMotion: e.matches }));
    };
    
    setPreferences(prev => ({ ...prev, reduceMotion: reduceMotionQuery.matches }));
    reduceMotionQuery.addEventListener('change', handleReduceMotionChange);

    // Check for prefers-contrast
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const handleContrastChange = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({ ...prev, highContrast: e.matches }));
    };
    
    setPreferences(prev => ({ ...prev, highContrast: contrastQuery.matches }));
    contrastQuery.addEventListener('change', handleContrastChange);

    // Check for screen reader
    const screenReader = window.navigator.userAgent.includes('NVDA') || 
                         window.navigator.userAgent.includes('JAWS') || 
                         window.speechSynthesis !== undefined;
    setPreferences(prev => ({ ...prev, screenReader }));

    return () => {
      reduceMotionQuery.removeEventListener('change', handleReduceMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  return preferences;
};

// Hook for managing focus
export const useFocusManagement = () => {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);
  const [focusHistory, setFocusHistory] = useState<HTMLElement[]>([]);

  const saveFocus = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      setFocusedElement(activeElement);
      setFocusHistory(prev => [...prev, activeElement]);
    }
  }, []);

  const restoreFocus = useCallback(() => {
    if (focusedElement && document.contains(focusedElement)) {
      focusedElement.focus();
    }
  }, [focusedElement]);

  const focusFirst = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
    }
  }, []);

  const focusLast = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    if (lastElement) {
      lastElement.focus();
    }
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    saveFocus,
    restoreFocus,
    focusFirst,
    focusLast,
    trapFocus,
    focusHistory,
  };
};

// Hook for keyboard navigation
export const useKeyboardNavigation = (
  onArrowUp?: () => void,
  onArrowDown?: () => void,
  onArrowLeft?: () => void,
  onArrowRight?: () => void,
  onEnter?: () => void,
  onEscape?: () => void,
  onHome?: () => void,
  onEnd?: () => void
) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        onArrowUp?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        onArrowDown?.();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onArrowLeft?.();
        break;
      case 'ArrowRight':
        e.preventDefault();
        onArrowRight?.();
        break;
      case 'Enter':
        e.preventDefault();
        onEnter?.();
        break;
      case 'Escape':
        e.preventDefault();
        onEscape?.();
        break;
      case 'Home':
        e.preventDefault();
        onHome?.();
        break;
      case 'End':
        e.preventDefault();
        onEnd?.();
        break;
    }
  }, [onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onEnter, onEscape, onHome, onEnd]);

  return { handleKeyDown };
};

// Hook for screen reader announcements
export const useScreenReader = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return { announce };
};