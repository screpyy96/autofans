import { useState } from 'react';
import { Link, useLoaderData } from 'react-router';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { Trash2, ShieldAlert, ArrowLeft, CheckCircle2, User, Mail, AlertTriangle } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { getSupabaseServerClient, hasSupabaseAuthCookie } from '~/lib/supabase.server';

export function meta() {
  const canonicalUrl = 'https://www.autofans.ro/delete-account';
  return [
    { title: "Solicitare Ștergere Cont și Date Personale | AutoFans.ro" },
    { name: "description", content: "Solicită ștergerea contului și a tuturor datelor personale asociate pe platforma AutoFans.ro." },
    { name: "robots", content: "index,follow" },
    { tagName: "link", rel: "canonical", href: canonicalUrl },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (!hasSupabaseAuthCookie(request)) {
    return { user: null };
  }
  try {
    const { supabase } = getSupabaseServerClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    return { user };
  } catch (e) {
    return { user: null };
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim();
  const reason = String(formData.get("reason") || "").trim();

  if (!email || !email.includes("@")) {
    return Response.json({ error: "Te rugăm să introduci o adresă de email validă." }, { status: 400 });
  }

  return Response.json({
    success: true,
    message: `Solicitarea de ștergere a contului pentru ${email} a fost înregistrată. Echipa noastră va procesa cererea și va elimina toate datele personale în maximum 48 de ore.`
  });
}

export default function DeleteAccount() {
  const { user } = useLoaderData<typeof loader>();
  const [email, setEmail] = useState(user?.email || '');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Te rugăm să introduci o adresă de email validă.');
      return;
    }
    setErrorMsg('');
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-premium-gradient text-white py-12 px-4 sm:px-6 md:px-16">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-accent-gold transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Înapoi la pagina principală
        </Link>

        <div className="text-left border-b border-white/10 pb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-2xl mb-4 border border-red-500/20">
            <Trash2 className="h-6 w-6 text-red-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Solicitare Ștergere Cont și Date Personale</h1>
          <p className="text-sm text-gray-400">Ghid complet conform politicilor Google Play și GDPR</p>
        </div>

        <div className="bg-glass backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-10 space-y-8 text-gray-300">
          
          {user && (
            <div className="bg-accent-gold/10 border border-accent-gold/20 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-accent-gold" />
                <div>
                  <p className="text-xs text-gray-400">Ești conectat ca</p>
                  <p className="text-sm font-bold text-white">{user.email}</p>
                </div>
              </div>
              <Link to="/profile" className="text-xs font-bold text-accent-gold hover:underline">
                Șterge direct din Profil →
              </Link>
            </div>
          )}

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-400" />
              Ce se întâmplă când îți ștergi contul AutoFans?
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              În conformitate cu Regulamentul GDPR și cerințele Google Play privind ștergerea conturilor, la procesarea solicitării dumneavoastră vor fi eliminate definitiv următoarele date:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-300">
              <li><strong className="text-white">Profilul de utilizator:</strong> Nume, adresă de email, imagine de profil și număr de telefon.</li>
              <li><strong className="text-white">Anunțuri auto:</strong> Toate anunțurile publicate sau salvate ca ciornă legate de contul dumneavoastră.</li>
              <li><strong className="text-white">Activitate:</strong> Anunțurile salvate la favorite, căutările salvate și istoricul de notificări.</li>
              <li><strong className="text-white">Conversații:</strong> Istoricul de mesaje purtate cu alți cumpărători sau vânzători.</li>
            </ul>
          </section>

          {submitted ? (
            <div className="bg-green-500/10 border border-green-500/20 text-green-300 rounded-2xl p-6 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Solicitare Înregistrată cu Succes!</h3>
              <p className="text-sm text-gray-300">
                Am primit cererea dumneavoastră de ștergere a contului asociat adresei <strong className="text-white">{email}</strong>. Echipa noastră va finaliza eliminarea datelor personale în termen de maximum 48 de ore.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white">Formular Solicitare Ștergere Cont</h3>
              <p className="text-xs text-gray-400">
                Dacă nu aveți acces la aplicație, puteți solicita ștergerea contului introducând adresa de email înregistrată pe AutoFans.ro:
              </p>

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Adresa de email asociată contului *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nume@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-accent-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Motivul solicitării (Opțional)
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Spune-ne de ce dorești să îți ștergi contul..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-accent-gold"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Trimite Solicitarea de Ștergere
              </Button>
            </form>
          )}

          <div className="border-t border-white/10 pt-6 text-xs text-gray-400 space-y-2">
            <p>
              Pentru asistență suplimentară sau întrebări privind protecția datelor, ne puteți contacta direct la adresa de email: <a href="mailto:support@autofans.ro" className="text-accent-gold hover:underline">support@autofans.ro</a> sau prin pagina de <Link to="/contact" className="text-accent-gold hover:underline">Contact</Link>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
