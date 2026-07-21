import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  // Vite exposes only VITE_* to the browser. Try REMIX_PUBLIC_* as a fallback if present.
  const envObj = (typeof window !== "undefined" && (window as any).ENV) || {};
  const url = (
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.REMIX_PUBLIC_SUPABASE_URL ||
    envObj.VITE_SUPABASE_URL ||
    envObj.SUPABASE_URL
  ) as string | undefined;
  const anon = (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.REMIX_PUBLIC_SUPABASE_ANON_KEY ||
    envObj.VITE_SUPABASE_ANON_KEY ||
    envObj.SUPABASE_ANON_KEY
  ) as string | undefined;

  if (!url || !anon) {
    if (typeof window !== "undefined") {
      console.error(
        "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Check your environment variables."
      );
    }
    throw new Error("Supabase env vars are not set");
  }

  browserClient = createBrowserClient(url, anon);
  return browserClient;
}
