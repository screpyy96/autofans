export const ANALYTICS_CONSENT_COOKIE = 'autofans_analytics_consent';
export const ANALYTICS_CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

export type AnalyticsConsent = 'granted' | 'denied' | null;

export function readAnalyticsConsent(): AnalyticsConsent {
  if (typeof document === 'undefined') return null;
  const value = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${ANALYTICS_CONSENT_COOKIE}=`))
    ?.split('=')[1];
  return value === 'granted' || value === 'denied' ? value : null;
}

export function saveAnalyticsConsent(value: Exclude<AnalyticsConsent, null>) {
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=${value}; Max-Age=${ANALYTICS_CONSENT_MAX_AGE}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
}

/** Clears the opt-in/out choice so the visitor can make a fresh decision. */
export function resetAnalyticsConsent() {
  if (typeof document === 'undefined') return;
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
}
