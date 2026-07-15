import { describe, expect, it } from 'vitest';
import { hasSupabaseAuthCookie } from '../supabase.server';

describe('hasSupabaseAuthCookie', () => {
  it('skips remote auth validation for anonymous requests', () => {
    expect(hasSupabaseAuthCookie(new Request('https://autofans.ro/'))).toBe(false);
  });

  it('recognizes regular and chunked Supabase SSR session cookies', () => {
    expect(hasSupabaseAuthCookie(new Request('https://autofans.ro/', {
      headers: { cookie: 'theme=dark; sb-projectref-auth-token=session-value' },
    }))).toBe(true);

    expect(hasSupabaseAuthCookie(new Request('https://autofans.ro/', {
      headers: { cookie: 'sb-projectref-auth-token.0=chunk-one; sb-projectref-auth-token.1=chunk-two' },
    }))).toBe(true);
  });

  it('does not mistake an OAuth verifier for an authenticated session', () => {
    expect(hasSupabaseAuthCookie(new Request('https://autofans.ro/', {
      headers: { cookie: 'sb-projectref-auth-token-code-verifier=temporary' },
    }))).toBe(false);
  });
});
