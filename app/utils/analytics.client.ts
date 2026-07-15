type AnalyticsValue = string | number | boolean | undefined;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Sends product events only after the visitor accepted analytics cookies.
 * Do not pass messages, names, emails, phone numbers or raw search text here.
 */
export function trackAnalyticsEvent(name: string, parameters: Record<string, AnalyticsValue> = {}) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', name, parameters);
}
