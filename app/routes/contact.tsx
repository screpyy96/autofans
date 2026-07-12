import type { Route } from "./+types/contact";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "~/components/ui/Button";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Contact - AutoFans.ro" },
    { name: "description", content: "Contactează echipa AutoFans.ro pentru suport, parteneriate sau informații." },
  ];
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-premium-gradient py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Contactează-ne</h1>
          <p className="text-xl text-gray-400">
            Ai o întrebare sau dorești un parteneriat? Echipa noastră este aici pentru a te ajuta.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Informații de contact */}
          <div className="bg-glass backdrop-blur-xl border border-white/10 p-8 rounded-2xl flex flex-col gap-8">
            <h2 className="text-2xl font-bold text-white mb-2">Informații utile</h2>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-accent-gold/20 flex items-center justify-center shrink-0">
                <Mail className="h-6 w-6 text-accent-gold" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Email</h3>
                <p className="text-gray-400">contact@autofans.ro</p>
                <p className="text-sm text-gray-500 mt-1">Îți vom răspunde în maxim 24h.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-accent-gold/20 flex items-center justify-center shrink-0">
                <Phone className="h-6 w-6 text-accent-gold" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Telefon</h3>
                <p className="text-gray-400">+40 700 000 000</p>
                <p className="text-sm text-gray-500 mt-1">Luni - Vineri: 09:00 - 18:00</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-accent-gold/20 flex items-center justify-center shrink-0">
                <MapPin className="h-6 w-6 text-accent-gold" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Adresă</h3>
                <p className="text-gray-400">București, România</p>
                <p className="text-sm text-gray-500 mt-1">Clădirea de birouri AutoFans, Sector 1</p>
              </div>
            </div>
          </div>

          {/* Formular de contact (Demo) */}
          <div className="bg-glass backdrop-blur-xl border border-white/10 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Trimite-ne un mesaj</h2>
            <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); alert("Formular demonstrativ. Mesajul nu a fost trimis."); }}>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nume complet</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors"
                  placeholder="Ion Popescu"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors"
                  placeholder="ion@exemplu.ro"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Mesaj</label>
                <textarea 
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors resize-none"
                  placeholder="Scrie-ne mesajul tău aici..."
                  required
                ></textarea>
              </div>
              <Button type="submit" className="w-full bg-accent-gold text-secondary-900 hover:bg-yellow-500 py-3 rounded-xl font-bold mt-2 shadow-glow transition-all">
                <Send className="w-5 h-5 mr-2" />
                Trimite mesajul
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
