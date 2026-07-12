import { Link } from 'react-router';
import { FileText, ArrowLeft, Shield, Scale, HelpCircle } from 'lucide-react';
import { Button } from '~/components/ui/Button';

export function meta() {
  return [
    { title: "Termeni și Condiții - AutoFans.ro" },
    { name: "description", content: "Termenii și condițiile de utilizare a platformei AutoFans.ro." },
  ];
}

export default function Terms() {
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
            <Scale className="h-6 w-6 text-accent-gold" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Termeni și Condiții</h1>
          <p className="text-sm text-gray-400">Ultima actualizare: 12 Iulie 2026</p>
        </div>

        {/* Content */}
        <div className="bg-glass backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-10 space-y-8 text-gray-300 leading-relaxed text-sm sm:text-base">
          
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-accent-gold">1.</span> Acceptarea Termenilor
            </h2>
            <p>
              Prin accesarea sau utilizarea site-ului AutoFans.ro (denumit în continuare „Platforma”), sunteți de acord să respectați și să vă supuneți acestor termeni și condiții. Dacă nu sunteți de acord cu oricare parte a acestor termeni, vă rugăm să nu utilizați serviciile noastre.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-accent-gold">2.</span> Serviciile Noastre
            </h2>
            <p>
              AutoFans.ro oferă o platformă online care permite utilizatorilor individuali și dealerilor auto să publice anunțuri de vânzare pentru autovehicule și permite vizitatorilor să caute și să vizualizeze aceste anunțuri. 
            </p>
            <p>
              Nu suntem parte în nicio tranzacție între cumpărători și vânzători, nu deținem, nu inspectăm și nu garantăm starea vehiculelor listate pe platformă. Orice acord de cumpărare se face direct între părți.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-accent-gold">3.</span> Înregistrarea și Securitatea Contului
            </h2>
            <p>
              Pentru a accesa anumite funcționalități ale Platformei (cum ar fi salvarea mașinilor favorite, compararea detaliată sau publicarea de anunțuri), este necesar să vă creați un cont utilizând o adresă de email validă sau prin autentificare Google.
            </p>
            <p>
              Sunteți responsabil pentru menținerea confidențialității datelor de conectare și pentru toate activitățile desfășurate în contul dumneavoastră. AutoFans.ro nu poate fi tras la răspundere pentru daune rezultate din utilizarea neautorizată a contului dumneavoastră.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-accent-gold">4.</span> Reguli de Publicare a Anunțurilor
            </h2>
            <p>
              Pentru a asigura o experiență de utilizare autentică și de înaltă calitate, toți utilizatorii care publică anunțuri trebuie să respecte următoarele reguli:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li>Informațiile furnizate (marcă, model, an, preț, rulaj, dotări, stare tehnică) trebuie să fie 100% reale și corecte.</li>
              <li>Imaginile încărcate trebuie să reprezinte vehiculul real oferit spre vânzare și să nu conțină watermark-uri ale altor platforme sau texte promoționale.</li>
              <li>Este strict interzisă publicarea de anunțuri duplicat sau listarea aceluiași vehicul sub identități diferite.</li>
              <li>Prețul listat trebuie să fie cel real de vânzare (fără tehnici de atragere înșelătoare cu prețuri nerealist de mici).</li>
            </ul>
            <p className="text-xs text-accent-gold/80 italic">
              * AutoFans.ro își rezervă dreptul de a edita, suspenda sau șterge orice anunț care încalcă aceste reguli, fără notificare prealabilă.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-accent-gold">5.</span> Limitarea Răspunderii
            </h2>
            <p>
              Platforma este furnizată „ca atare”, fără garanții de orice fel. Nu garantăm că serviciile vor fi neîntrerupte sau fără erori. AutoFans.ro nu este responsabil pentru nicio pierdere financiară, daună morală sau înșelăciune survenită ca urmare a interacțiunii dintre utilizatorii site-ului.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-accent-gold">6.</span> Modificarea Termenilor
            </h2>
            <p>
              Ne rezervăm dreptul de a modifica acești termeni în orice moment. Modificările devin active imediat ce sunt publicate pe această pagină. Continuarea utilizării site-ului după aceste modificări reprezintă acceptul dumneavoastră implicit.
            </p>
          </section>

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-gray-400">
              Dacă aveți întrebări referitoare la acești termeni, contactați-ne la <span className="text-accent-gold font-semibold">suport@autofans.ro</span>.
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
