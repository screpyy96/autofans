import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { readAnalyticsConsent, saveAnalyticsConsent, type AnalyticsConsent } from '~/utils/analyticsConsent.client';

const MEASUREMENT_ID = 'G-1LFYZC3LT9';

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

function initialiseGoogleAnalytics() {
  if (window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement('script');
  script.id = 'google-analytics';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

/** Analytics is loaded only after opt-in. SPA route changes send explicit
 * pageviews, avoiding the missing/doubled measurements common in client apps. */
export function GoogleAnalytics() {
  const location = useLocation();
  const [consent, setConsent] = useState<AnalyticsConsent>(null);

  useEffect(() => {
    setConsent(readAnalyticsConsent());
  }, []);

  useEffect(() => {
    if (consent !== 'granted') return;
    initialiseGoogleAnalytics();
    window.gtag?.('event', 'page_view', {
      page_location: window.location.href,
      page_path: `${location.pathname}${location.search}`,
      page_title: document.title,
    });
  }, [consent, location.pathname, location.search]);

  if (consent !== null) return null;

  return (
    <aside
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-xl rounded-2xl border border-white/15 bg-secondary-950/95 p-3.5 text-white shadow-2xl backdrop-blur-xl sm:bottom-6 sm:p-5"
      aria-label="Preferințe cookie"
    >
      <p className="text-sm font-semibold">Confidențialitatea ta contează</p>
      <p className="mt-1 text-[11px] leading-relaxed text-gray-300 sm:mt-1.5 sm:text-xs">
        Folosim cookie-uri necesare pentru funcționare. Cu acordul tău, Google Analytics ne arată în mod agregat ce putem îmbunătăți.
        {' '}<Link to="/politica-de-confidentialitate" className="font-semibold text-accent-gold hover:text-white">Află mai mult</Link>.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:flex sm:justify-end">
        <button
          type="button"
          onClick={() => { saveAnalyticsConsent('denied'); setConsent('denied'); }}
          className="min-h-10 rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/5 sm:px-4 sm:text-sm"
        >
          Doar necesare
        </button>
        <button
          type="button"
          onClick={() => { saveAnalyticsConsent('granted'); setConsent('granted'); }}
          className="min-h-10 rounded-xl bg-gold-gradient px-3 py-2 text-xs font-bold text-secondary-900 transition hover:brightness-110 sm:px-4 sm:text-sm"
        >
          Accept analitice
        </button>
      </div>
    </aside>
  );
}
