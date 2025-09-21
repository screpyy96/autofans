import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code) {
    // Exchange the code for a session and persist cookies via @supabase/ssr
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Optional: read next param to redirect the user
  const next = url.searchParams.get("next") || "/profile";
  return redirect(next, { headers });
}

export default function AuthCallback() {
  return null;
}

