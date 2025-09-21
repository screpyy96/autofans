import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  await supabase.auth.signOut();
  return redirect("/", { headers });
}

export default function Logout() {
  return null;
}

