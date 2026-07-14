import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';

const MEASUREMENT_ID = 'G-1LFYZC3LT9';
const CONSENT_COOKIE = 'autofans_analytics_consent';
const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

type Consent = 'granted' | 'denied' | null;

function readConsent(): Consent {
  if (typeof document === 'undefined') return null;
  const value = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${CONSENT_COOKIE}=`))
    ?.split('=')[1];
  return value === 'granted' || value === 'denied' ? value : null;
}

function saveConsent(value: Exclude<Consent, null>) {
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
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
  const [consent, setConsent] = useState<Consent>(null);

  useEffect(() => {
    setConsent(readConsent());
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
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-xl rounded-2xl border border-white/15 bg-secondary-950/95 p-4 text-white shadow-2xl backdrop-blur-xl sm:bottom-6 sm:p-5"
      aria-label="Preferințe cookie"
    >
      <p className="text-sm font-semibold">Confidențialitatea ta contează</p>
      <p className="mt-1.5 text-xs leading-relaxed text-gray-300">
        Folosim cookie-uri necesare pentru funcționare. Cu acordul tău, Google Analytics ne arată în mod agregat ce putem îmbunătăți.
        {' '}<Link to="/politica-de-confidentialitate" className="font-semibold text-accent-gold hover:text-white">Află mai mult</Link>.
      </p>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => { saveConsent('denied'); setConsent('denied'); }}
          className="min-h-10 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
        >
          Doar necesare
        </button>
        <button
          type="button"
          onClick={() => { saveConsent('granted'); setConsent('granted'); }}
          className="min-h-10 rounded-xl bg-gold-gradient px-4 py-2 text-sm font-bold text-secondary-900 transition hover:brightness-110"
        >
          Accept analitice
        </button>
      </div>
    </aside>
  );
}
