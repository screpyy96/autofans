import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Minimal cookie parser/serializer to avoid extra deps
function parseCookie(header: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(/;\s*/)) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = decodeURIComponent(part.slice(0, idx));
    const v = decodeURIComponent(part.slice(idx + 1));
    out[k] = v;
  }
  return out;
}

function serializeCookie(
  name: string,
  val: string,
  opts: CookieOptions = {}
): string {
  const enc = encodeURIComponent(val);
  const segments = [`${name}=${enc}`];
  segments.push(`Path=${opts.path ?? "/"}`);
  if (opts.domain) segments.push(`Domain=${opts.domain}`);
  if (opts.maxAge != null) segments.push(`Max-Age=${opts.maxAge}`);
  if (opts.expires) segments.push(`Expires=${opts.expires.toUTCString()}`);
  const sameSite = opts.sameSite ?? "lax";
  if (sameSite) segments.push(`SameSite=${sameSite[0].toUpperCase()}${sameSite.slice(1)}`);
  const secure = opts.secure ?? (process.env.NODE_ENV === "production");
  if (secure) segments.push("Secure");
  if (opts.httpOnly ?? true) segments.push("HttpOnly");
  return segments.join("; ");
}

export function getSupabaseServerClient(request: Request) {
  const headers = new Headers();
  const cookies = parseCookie(request.headers.get("cookie"));

  // Read from process.env or Vite SSR's import.meta.env
  const viteEnv = (import.meta as any)?.env ?? {};
  const supabaseUrl =
    process.env.REMIX_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    viteEnv.REMIX_PUBLIC_SUPABASE_URL ||
    viteEnv.VITE_SUPABASE_URL;
  const anonKey =
    process.env.REMIX_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    viteEnv.REMIX_PUBLIC_SUPABASE_ANON_KEY ||
    viteEnv.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase env (VITE_/REMIX_PUBLIC_ SUPABASE_URL/ANON_KEY)");
  }

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      get(name: string) {
        return cookies[name];
      },
      set(name: string, value: string, options: CookieOptions) {
        headers.append("Set-Cookie", serializeCookie(name, value, options));
      },
      remove(name: string, options: CookieOptions) {
        headers.append("Set-Cookie", serializeCookie(name, "", { ...options, maxAge: 0 }));
      },
    },
  });

  return { supabase, headers } as const;
}
