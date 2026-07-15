import { afterEach, describe, expect, it } from 'vitest';
import {
  ANALYTICS_CONSENT_COOKIE,
  readAnalyticsConsent,
  resetAnalyticsConsent,
  saveAnalyticsConsent,
} from '../analyticsConsent.client';

afterEach(() => {
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=; Max-Age=0; Path=/`;
});

describe('analytics consent', () => {
  it('persists and reads the visitor choice', () => {
    expect(readAnalyticsConsent()).toBeNull();

    saveAnalyticsConsent('granted');
    expect(readAnalyticsConsent()).toBe('granted');

    saveAnalyticsConsent('denied');
    expect(readAnalyticsConsent()).toBe('denied');
  });

  it('clears the choice so the preference banner can be shown again', () => {
    saveAnalyticsConsent('granted');
    resetAnalyticsConsent();

    expect(readAnalyticsConsent()).toBeNull();
  });
});
