import { Link } from 'react-router';
import { Shield, ArrowLeft, Eye, Lock, Database } from 'lucide-react';
import { Button } from '~/components/ui/Button';

export function meta() {
  return [
    { title: "Politica de Confidențialitate - AutoFans.ro" },
    { name: "description", content: "Politica de confidențialitate și prelucrare a datelor cu caracter personal pe platforma AutoFans.ro." },
  ];
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-premium-gradient text-white py-12 px-6 sm:px-8 md:px-16">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        
        {/* Back button */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-accent-gold transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Înapoi la pagina principală
        </Link>

        {/* Hero Section */}
        <div className="text-left border-b border-white/10 pb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-accent-gold/10 rounded-2xl mb-4 border border-accent-gold/20">
            <Shield className="h-6 w-6 text-accent-gold" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Politica de Confidențialitate</h1>
          <p className="text-sm text-gray-400">Ultima actualizare: 12 Iulie 2026</p>
        </div>

        {/* Content */}
        <div className="bg-glass backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-10 space-y-8 text-gray-300 leading-relaxed text-sm sm:text-base">
          
          <p>
            La AutoFans.ro, confidențialitatea datelor dumneavoastră este o prioritate absolută. Această Politică de Confidențialitate descrie modul în care colectăm, utilizăm, stocăm și protejăm datele dumneavoastră cu caracter personal în conformitate cu Regulamentul General privind Protecția Datelor (GDPR).
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-accent-gold"><Eye className="h-5 w-5" /></span> Datele Pe Care Le Colectăm
            </h2>
            <p>
              Colectăm doar datele strict necesare pentru furnizarea serviciilor noastre:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li><strong className="text-white">Date de cont:</strong> Adresa de email și numele primite prin autentificarea directă sau prin intermediul contului Google.</li>
              <li><strong className="text-white">Date de contact anunț:</strong> Numărul de telefon furnizat opțional de dumneavoastră atunci când alegeți să publicați un anunț de vânzare, pentru a fi contactat de cumpărători.</li>
              <li><strong className="text-white">Date de navigare:</strong> Adresa IP, browser-ul utilizat, preferințele de căutare (marcă, model) stocate local sau pe serverele noastre pentru a îmbunătăți experiența de utilizare.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-accent-gold"><Database className="h-5 w-5" /></span> Scopul Prelucrării Datelor
            </h2>
            <p>
              Datele colectate sunt folosite exclusiv în următoarele scopuri:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li>Funcționarea corectă a Platformei (salvarea mașinilor la favorite, funcția de comparație auto, administrarea propriilor anunțuri în Dashboard).</li>
              <li>Permiterea comunicării directe prin telefon între potențialii cumpărători și vânzători.</li>
              <li>Prevenirea tentativelor de fraudă și a spam-ului prin validarea manuală a anunțurilor publicate.</li>
              <li>Trimiterea de notificări tehnice de sistem sau alerte de preț/anunțuri noi (doar dacă sunt solicitate în prealabil).</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-accent-gold"><Lock className="h-5 w-5" /></span> Securitatea și Stocarea Datelor
            </h2>
            <p>
              Toate datele dumneavoastră sunt stocate pe servere securizate (folosind infrastructura parteneră securizată Supabase) și sunt criptate în tranzit folosind protocolul HTTPS (SSL/TLS).
            </p>
            <p>
              Nu vindem, nu închiriem și nu dezvăluim datele dumneavoastră cu caracter personal către terțe companii în scopuri publicitare. Singurele entități care au acces la anumite date sunt cumpărătorii care vizualizează numărul de telefon pe care dumneavoastră l-ați publicat de bunăvoie în cadrul unui anunț de vânzare.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-accent-gold">4.</span> Drepturile Dumneavoastră conform GDPR
            </h2>
            <p>
              În calitate de utilizator, aveți următoarele drepturi asupra datelor dumneavoastră personale:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li><strong className="text-white">Dreptul de acces:</strong> Puteți solicita o copie a datelor pe care le deținem despre dumneavoastră.</li>
              <li><strong className="text-white">Dreptul de rectificare:</strong> Puteți corecta oricând datele eronate direct din panoul de profil.</li>
              <li><strong className="text-white">Dreptul la ștergere („Dreptul de a fi uitat”):</strong> Puteți solicita ștergerea definitivă a contului dumneavoastră și a tuturor datelor asociate (inclusiv istoricul de anunțuri).</li>
              <li><strong className="text-white">Dreptul la portabilitate:</strong> Puteți descărca datele contului într-un format structurat standard.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-accent-gold">5.</span> Utilizarea de Cookie-uri
            </h2>
            <p>
              Folosim cookie-uri tehnice și funcționale de sesiune (inclusiv pentru stocarea token-ului de sesiune Supabase sau a preferințelor de favorite în Zustand) pentru a asigura funcționarea corectă a site-ului. Aceste cookie-uri nu sunt folosite pentru profilare publicitară invazivă.
            </p>
          </section>

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-gray-400">
              Pentru exercitarea drepturilor sau alte detalii, ne puteți scrie la <span className="text-accent-gold font-semibold">suport@autofans.ro</span>.
            </p>
            <Link to="/login">
              <Button variant="outline" className="border-accent-gold/45 text-accent-gold hover:bg-accent-gold/10 font-bold transition-all text-sm">
                Înapoi la autentificare
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
