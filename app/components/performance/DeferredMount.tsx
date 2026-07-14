import { type ReactNode, useEffect, useRef, useState } from 'react';

interface DeferredMountProps {
  children: ReactNode;
  placeholder: ReactNode;
  rootMargin?: string;
}

/**
 * Keeps non-critical UI out of the initial hydration and network path. The
 * content mounts just before it enters the viewport, preserving a responsive
 * first paint without making the user wait once they scroll to it.
 */
export function DeferredMount({
  children,
  placeholder,
  rootMargin = '480px 0px',
}: DeferredMountProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor || shouldMount) return;

    if (!('IntersectionObserver' in window)) {
      setShouldMount(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShouldMount(true);
        observer.disconnect();
      },
      { rootMargin },
    );

    observer.observe(anchor);
    return () => observer.disconnect();
  }, [rootMargin, shouldMount]);

  return <div ref={anchorRef}>{shouldMount ? children : placeholder}</div>;
}
