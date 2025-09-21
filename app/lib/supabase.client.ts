import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  // Vite exposes only VITE_* to the browser. Try REMIX_PUBLIC_* as a fallback if present.
  const url = (
    import.meta.env.VITE_SUPABASE_URL ||
    // @ts-expect-error non-standard env prefix fallback
    import.meta.env.REMIX_PUBLIC_SUPABASE_URL
  ) as string | undefined;
  const anon = (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    // @ts-expect-error non-standard env prefix fallback
    import.meta.env.REMIX_PUBLIC_SUPABASE_ANON_KEY
  ) as string | undefined;

  if (!url || !anon) {
    if (typeof window !== "undefined") {
      // Surface a clearer error in the browser console
      // eslint-disable-next-line no-console
      console.error(
        "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Check your .env.local."
      );
    }
    throw new Error("Supabase env vars are not set");
  }

  browserClient = createBrowserClient(url, anon);
  return browserClient;
}
