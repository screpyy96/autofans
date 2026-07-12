import type { Route } from "./+types/help";
import { Search, HelpCircle, FileText, ShieldAlert, CreditCard } from "lucide-react";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Centru de Ajutor - AutoFans.ro" },
    { name: "description", content: "Găsește răspunsuri la cele mai frecvente întrebări despre vânzarea și cumpărarea de mașini pe AutoFans.ro." },
  ];
}

const faqs = [
  {
    question: "Cum pot adăuga un anunț nou?",
    answer: "Pentru a adăuga un anunț, apasă pe butonul 'Pune Anunț Gratuit' din meniul principal sau de pe prima pagină. Trebuie să fii autentificat pentru a putea publica."
  },
  {
    question: "Cât timp este valabil un anunț?",
    answer: "Un anunț este valabil gratuit timp de 30 de zile. Vei primi o notificare pe email cu 3 zile înainte de expirare pentru a-l putea prelungi."
  },
  {
    question: "Cum verific istoricul unei mașini?",
    answer: "Recomandăm obținerea seriei de șasiu (VIN) de la vânzător și verificarea acesteia pe site-uri de specialitate (ex: CarVertical, RAR) înainte de a cumpăra mașina."
  },
  {
    question: "Cum pot șterge sau modifica un anunț?",
    answer: "Intră în 'Contul meu', la secțiunea 'Anunțurile mele'. Acolo vei găsi butoane pentru editarea sau ștergerea fiecărui anunț."
  }
];

export default function HelpPage() {
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
              className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors text-lg" 
              placeholder="Caută în centrul de ajutor..." 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-glass backdrop-blur-xl border border-white/10 p-6 rounded-2xl text-center hover:border-accent-gold/50 transition-all cursor-pointer">
            <FileText className="h-8 w-8 text-accent-gold mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Ghiduri de utilizare</h3>
            <p className="text-sm text-gray-400">Tot ce trebuie să știi despre platformă.</p>
          </div>
          <div className="bg-glass backdrop-blur-xl border border-white/10 p-6 rounded-2xl text-center hover:border-accent-gold/50 transition-all cursor-pointer">
            <ShieldAlert className="h-8 w-8 text-accent-gold mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Siguranță</h3>
            <p className="text-sm text-gray-400">Cum să te protejezi de fraude online.</p>
          </div>
          <div className="bg-glass backdrop-blur-xl border border-white/10 p-6 rounded-2xl text-center hover:border-accent-gold/50 transition-all cursor-pointer">
            <CreditCard className="h-8 w-8 text-accent-gold mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Plăți și pachete</h3>
            <p className="text-sm text-gray-400">Informații despre promovarea anunțurilor.</p>
          </div>
        </div>

        <div className="bg-glass backdrop-blur-xl border border-white/10 p-8 rounded-2xl">
          <h2 className="text-2xl font-bold text-white mb-8">Întrebări Frecvente (FAQ)</h2>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-white/10 pb-6 last:border-0 last:pb-0">
                <h3 className="text-lg font-semibold text-white mb-2">{faq.question}</h3>
                <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
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
