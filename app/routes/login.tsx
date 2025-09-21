import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "~/lib/supabase.client";
import { getSupabaseServerClient } from "~/lib/supabase.server";
import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLocation } from "react-router";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const url = new URL(request.url);
    const next = url.searchParams.get("next") || "/profile";
    return redirect(next, { headers });
  }
  return new Response(null, { headers });
}

export default function Login() {
  const location = useLocation();
  const search = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const next = search.get("next");

  const [mode, setMode] = useState<"login" | "register" | "forgot">(
    (search.get("mode") as any) || "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // reset messages when mode changes
    setMessage(null);
    setError(null);
  }, [mode]);

  async function signInWithGoogle() {
    const supabase = getSupabaseBrowserClient();
    const params = new URLSearchParams(window.location.search);
    const redirectTo = `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo }
    });
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const dest = next || "/profile";
      window.location.href = dest;
    } catch (err: any) {
      setError(err?.message || "Autentificare eșuată");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    if (password !== confirm) {
      setError("Parolele nu coincid");
      setLoading(false);
      return;
    }
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}` },
      });
      if (error) throw error;
      setMessage("Cont creat. Verifică emailul pentru confirmare.");
      setMode("login");
    } catch (err: any) {
      setError(err?.message || "Înregistrare eșuată");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`,
      });
      if (error) throw error;
      setMessage("Ți-am trimis un email pentru resetarea parolei.");
      setMode("login");
    } catch (err: any) {
      setError(err?.message || "Nu am putut trimite emailul de resetare");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center p-6">
      <div className="bg-glass backdrop-blur-xl border-premium rounded-3xl p-8 w-full max-w-xl min-w-[340px] text-left">
        <h1 className="text-2xl font-bold text-white mb-2">
          {mode === "login" && "Autentificare"}
          {mode === "register" && "Creează cont"}
          {mode === "forgot" && "Resetare parolă"}
        </h1>
        <p className="text-gray-300 mb-6 leading-relaxed">
          {mode === "login" && "Conectează-te cu Google sau email/parolă."}
          {mode === "register" && "Creează-ți un cont nou pentru a salva favorite și anunțuri."}
          {mode === "forgot" && "Introdu emailul și îți trimitem un link de resetare."}
        </p>

        {/* OAuth */}
        {mode !== "forgot" && (
          <div className="mb-6">
            <Button onClick={signInWithGoogle} className="w-full bg-gold-gradient text-secondary-900">
              Continuă cu Google
            </Button>
          </div>
        )}

        {mode !== "forgot" && (
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center"><span className="bg-transparent px-2 text-xs text-gray-400">sau</span></div>
          </div>
        )}

        {mode === "login" && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} required />
            <Input label="Parolă" type="password" value={password} onChange={(e) => setPassword(e.currentTarget.value)} required />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {message && <p className="text-green-400 text-sm">{message}</p>}
            <div className="flex items-center justify-between">
              <Button type="submit" loading={loading} className="bg-gold-gradient text-secondary-900">Autentificare</Button>
              <button type="button" className="text-sm text-accent-gold hover:underline" onClick={() => setMode("forgot")}>Ai uitat parola?</button>
            </div>
          </form>
        )}

        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} required />
            <Input label="Parolă" type="password" value={password} onChange={(e) => setPassword(e.currentTarget.value)} required />
            <Input label="Confirmă parola" type="password" value={confirm} onChange={(e) => setConfirm(e.currentTarget.value)} required />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {message && <p className="text-green-400 text-sm">{message}</p>}
            <Button type="submit" loading={loading} className="w-full bg-gold-gradient text-secondary-900">Creează cont</Button>
            <p className="text-xs text-gray-400">Prin crearea contului, ești de acord cu <a className="text-accent-gold hover:underline" href="#">Termenii</a> și <a className="text-accent-gold hover:underline" href="#">Politica de confidențialitate</a>.</p>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={handleForgot} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} required />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {message && <p className="text-green-400 text-sm">{message}</p>}
            <div className="flex items-center justify-between">
              <Button type="submit" loading={loading} className="bg-gold-gradient text-secondary-900">Trimite link</Button>
              <button type="button" className="text-sm text-accent-gold hover:underline" onClick={() => setMode("login")}>Înapoi la login</button>
            </div>
          </form>
        )}

        {/* Footer switch */}
        <div className="mt-6 text-sm text-gray-300">
          {mode === "login" && (
            <p>
              Nu ai cont? {" "}
              <button className="text-accent-gold hover:underline" onClick={() => setMode("register")}>Creează cont</button>
            </p>
          )}
          {mode === "register" && (
            <p>
              Ai deja cont? {" "}
              <button className="text-accent-gold hover:underline" onClick={() => setMode("login")}>Autentifică-te</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
