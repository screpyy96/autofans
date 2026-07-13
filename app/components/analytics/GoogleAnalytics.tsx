import { useEffect } from 'react';
import { useLocation } from 'react-router';

const MEASUREMENT_ID = 'G-1LFYZC3LT9';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * React Router navigations do not reload the document. Send an explicit
 * page_view whenever the URL changes so GA4 reports every virtual page.
 */
export function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    window.gtag?.('event', 'page_view', {
      page_location: window.location.href,
      page_path: `${location.pathname}${location.search}`,
      page_title: document.title,
    });
  }, [location.pathname, location.search]);

  return null;
}
