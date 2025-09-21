import { useState, useEffect } from 'react';

export interface BreakpointConfig {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

const defaultBreakpoints: BreakpointConfig = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export type Breakpoint = keyof BreakpointConfig;

export interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  currentBreakpoint: Breakpoint;
  isPortrait: boolean;
  isLandscape: boolean;
  isTouchDevice: boolean;
}

export const useResponsive = (breakpoints: BreakpointConfig = defaultBreakpoints): ResponsiveState => {
  // Important: initialize with a stable SSR-safe default on both server and client
  // to ensure the server and client's first render match during hydration.
  const [state, setState] = useState<ResponsiveState>(() => ({
    width: 1024,
    height: 768,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLargeDesktop: false,
    currentBreakpoint: 'lg' as Breakpoint,
    isPortrait: false,
    isLandscape: true,
    isTouchDevice: false,
  }));

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setState({
        width,
        height,
        isMobile: width < breakpoints.md,
        isTablet: width >= breakpoints.md && width < breakpoints.lg,
        isDesktop: width >= breakpoints.lg && width < breakpoints['2xl'],
        isLargeDesktop: width >= breakpoints['2xl'],
        currentBreakpoint: getCurrentBreakpoint(width, breakpoints),
        isPortrait: height > width,
        isLandscape: width > height,
        isTouchDevice,
      });
    };

    // Set actual values immediately after mount to reflect real environment
    handleResize();

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [breakpoints]);

  return state;
};

function getCurrentBreakpoint(width: number, breakpoints: BreakpointConfig): Breakpoint {
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  return 'sm';
}

// Hook for checking specific breakpoints
export const useBreakpoint = (breakpoint: Breakpoint, breakpoints: BreakpointConfig = defaultBreakpoints): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= breakpoints[breakpoint];
  });

  useEffect(() => {
    const handleResize = () => {
      setMatches(window.innerWidth >= breakpoints[breakpoint]);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint, breakpoints]);

  return matches;
};

// Hook for media queries
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
};