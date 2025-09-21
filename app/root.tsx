import type { ReactNode } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  isRouteErrorResponse,
  useLoaderData,
} from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import type { LinksFunction } from "react-router";
// AppProvider is no longer needed with Zustand
import { MainLayout } from "~/components/layout/MainLayout";
import { useAppInitialization } from "~/hooks/useAppInitialization";
import "./app.css";
import { getSupabaseServerClient } from "~/lib/supabase.server";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#121212" />
        <Meta />
        <Links />
      </head>
      <body className="font-sans antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// Error boundary for route-level errors
export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen bg-premium-gradient flex items-center justify-center p-4">
        <div className="bg-glass backdrop-blur-xl border-premium rounded-3xl p-8 w-full text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            {error.status}
          </h1>
          <h2 className="text-xl font-semibold text-gray-300 mb-4">
            {error.status === 404 ? 'Pagina nu a fost găsită' : 'Eroare de server'}
          </h2>
          <p className="text-gray-400 mb-6">
            {error.status === 404 
              ? 'Pagina pe care o căutați nu există sau a fost mutată.'
              : 'A apărut o eroare pe server. Vă rugăm să încercați din nou mai târziu.'
            }
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gold-gradient hover:bg-gold-gradient text-secondary-900 px-6 py-3 rounded-2xl font-medium transition-all duration-300 hover:shadow-glow"
          >
            Înapoi acasă
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-premium-gradient flex items-center justify-center p-4">
      <div className="bg-glass backdrop-blur-xl border-premium rounded-3xl p-8 max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold text-white mb-4">
          Oops! Ceva nu a mers bine
        </h1>
        <p className="text-gray-400 mb-6">
          Ne pare rău, dar a apărut o eroare neașteptată.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-gold-gradient hover:bg-gold-gradient text-secondary-900 px-6 py-3 rounded-2xl font-medium transition-all duration-300 hover:shadow-glow mr-3"
        >
          Reîncarcă pagina
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-glass border-premium hover:bg-gold-gradient hover:text-secondary-900 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-300"
        >
          Înapoi acasă
        </button>
      </div>
    </div>
  );
}

export default function App() {
  // Initialize app once at the root level
  useAppInitialization();
  const data = useLoaderData<typeof loader>();
  
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { supabase, headers } = getSupabaseServerClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    let profile: any = null;
    if (user?.id) {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_url, role')
        .eq('id', user.id)
        .single();
      profile = data ?? null;
    }
    return { user, profile };
  } catch (e) {
    console.error("Supabase init error:", e);
    return { user: null, profile: null };
  }
}
