import type { Route } from "./+types/help";
import { useMemo, useState } from "react";
import { Search, HelpCircle, FileText, ShieldAlert, CreditCard } from "lucide-react";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Centru de Ajutor - AutoFans.ro" },
    { name: "description", content: "Găsește răspunsuri la cele mai frecvente întrebări despre vânzarea și cumpărarea de mașini pe AutoFans.ro." },
  ];
}

type HelpCategory = 'usage' | 'safety' | 'account';

const categories: Array<{
  id: HelpCategory;
  label: string;
  description: string;
  icon: typeof FileText;
}> = [
  { id: 'usage', label: 'Ghiduri de utilizare', description: 'Publică și gestionează anunțurile fără pași în plus.', icon: FileText },
  { id: 'safety', label: 'Siguranță', description: 'Cum verifici o ofertă și eviți tentativele de fraudă.', icon: ShieldAlert },
  { id: 'account', label: 'Cont și anunțuri', description: 'Setări, editare și administrarea contului tău.', icon: CreditCard },
];

const faqs: Array<{ question: string; answer: string; category: HelpCategory }> = [
  {
    question: "Cum pot adăuga un anunț nou?",
    answer: "Apasă pe „Adaugă” din navigație sau pe „Pune anunț”. Te autentifici, completezi detaliile mașinii și publici după verificarea informațiilor esențiale.",
    category: 'usage',
  },
  {
    question: "Cum verific istoricul unei mașini?",
    answer: "Cere seria de șasiu (VIN), compar-o cu actele și verifică informațiile disponibile prin serviciile autorizate. Înainte de plată, recomandăm și o inspecție independentă într-un service.",
    category: 'safety',
  },
  {
    question: "Cum pot șterge sau modifica un anunț?",
    answer: "Intră în Dashboard, apoi la „Anunțurile mele”. De acolo poți deschide, edita sau administra fiecare anunț publicat.",
    category: 'account',
  },
  {
    question: "Cum contactez vânzătorul în siguranță?",
    answer: "Folosește opțiunile de contact din pagina anunțului, pune întrebări clare și stabilește vizionarea într-un loc sigur. Nu trimite avans și nu partaja date sensibile înainte să verifici mașina și identitatea vânzătorului.",
    category: 'safety',
  }
];

export default function HelpPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<HelpCategory | null>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase('ro-RO');
  const visibleFaqs = useMemo(() => faqs.filter((faq) => {
    const matchesCategory = !activeCategory || faq.category === activeCategory;
    const searchableText = `${faq.question} ${faq.answer}`.toLocaleLowerCase('ro-RO');
    return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
  }), [activeCategory, normalizedQuery]);

  return (
    <div className="min-h-screen bg-premium-gradient py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-gold/20 rounded-2xl mb-6">
            <HelpCircle className="h-8 w-8 text-accent-gold" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Cum te putem ajuta?</h1>
          
          <div className="relative max-w-2xl mx-auto mt-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input 
              type="text" 
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Caută în centrul de ajutor"
              className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors text-lg" 
              placeholder="Caută în centrul de ajutor..." 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveCategory(isActive ? null : category.id)}
                className={`rounded-2xl border p-6 text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold ${isActive ? 'border-accent-gold bg-accent-gold/10 shadow-glow' : 'border-white/10 bg-glass hover:border-accent-gold/50 hover:bg-white/[0.03]'}`}
              >
                <Icon className="mx-auto mb-4 h-8 w-8 text-accent-gold" />
                <h3 className="mb-2 text-lg font-bold text-white">{category.label}</h3>
                <p className="text-sm text-gray-400">{category.description}</p>
              </button>
            );
          })}
        </div>

        <div className="bg-glass backdrop-blur-xl border border-white/10 p-8 rounded-2xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-white">Întrebări frecvente</h2>
            {(activeCategory || query) && (
              <button type="button" onClick={() => { setActiveCategory(null); setQuery(''); }} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-accent-gold hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold">
                Resetează filtrele
              </button>
            )}
          </div>
          
          <div className="space-y-6">
            {visibleFaqs.map((faq) => (
              <div key={faq.question} className="border-b border-white/10 pb-6 last:border-0 last:pb-0">
                <h3 className="text-lg font-semibold text-white mb-2">{faq.question}</h3>
                <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
            {visibleFaqs.length === 0 && <p className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-gray-300">Nu am găsit un răspuns pentru această căutare. Scrie-ne și te ajutăm direct.</p>}
          </div>
        </div>

        <div className="mt-12 text-center bg-accent-gold/10 border border-accent-gold/20 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-2">Nu ai găsit răspunsul?</h3>
          <p className="text-gray-300 mb-6">Echipa noastră de suport este gata să te ajute cu orice problemă.</p>
          <Link to="/contact" className="inline-block bg-accent-gold text-secondary-900 font-bold py-3 px-8 rounded-xl shadow-glow hover:bg-yellow-500 transition-all">
            Contactează Suportul
          </Link>
        </div>
      </div>
    </div>
  );
}
