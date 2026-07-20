import { Link } from 'react-router';
import type { Route } from './+types/dealeri';
import { BarChart3, CheckCircle2, FileSpreadsheet, ShieldCheck, Upload } from 'lucide-react';
import { Card } from '~/components/ui/Card';

export function headers() {
  return {
    "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Pentru dealeri auto | AutoFans.ro' },
    { name: 'description', content: 'Publică și administrează stocul dealerului tău pe AutoFans: import CSV, drafturi verificate și publicare în masă.' },
  ];
}

const benefits = [
  { icon: FileSpreadsheet, title: 'Importă stocul din CSV', description: 'Încarcă până la 100 de mașini odată, cu raport clar pentru fiecare rând.' },
  { icon: ShieldCheck, title: 'Publicare controlată', description: 'Importurile devin drafturi. Publici doar anunțurile complete, după verificare.' },
  { icon: BarChart3, title: 'Gestionează într-un singur loc', description: 'Vezi anunțurile, editările și interesul primit direct din dashboard.' },
];

export default function Dealers() {
  return (
    <div className="min-h-screen bg-[#121212] pb-20 pt-8">
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-accent-gold/25 bg-secondary-900/80 px-6 py-12 shadow-2xl sm:px-10 sm:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(251,191,36,0.16),transparent_35%)]" aria-hidden="true" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-gold/30 bg-accent-gold/10 px-4 py-2 text-sm font-bold text-accent-gold"><Upload className="h-4 w-4" /> Platformă pentru dealeri</span>
            <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl">Stocul tău, prezentat profesionist.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-300">AutoFans te ajută să imporți, verifici și publici în masă anunțurile dealerului, fără să pierzi controlul asupra calității fiecărei mașini.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/dashboard/dealer-import" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gold-gradient px-6 font-bold text-secondary-900 transition hover:brightness-110">Importă stocul CSV</Link>
              <Link to="/dashboard" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-6 font-semibold text-white transition hover:bg-white/5">Deschide dashboard-ul</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {benefits.map(({ icon: Icon, title, description }) => (
            <Card key={title} variant="elevated" padding="lg">
              <div className="mb-5 inline-flex rounded-xl bg-accent-gold/15 p-3"><Icon className="h-6 w-6 text-accent-gold" /></div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="mt-3 leading-relaxed text-gray-300">{description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-white">Cum începi</h2>
        <div className="mt-7 grid gap-4 text-left sm:grid-cols-3">
          {['Activezi contul de vânzător.', 'Descarci și completezi modelul CSV.', 'Adaugi poze și publici doar anunțurile gata.'].map((step, index) => (
            <div key={step} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-300"><span className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-accent-gold/15 text-sm font-bold text-accent-gold">{index + 1}</span>{step}</div>
          ))}
        </div>
        <Link to="/dashboard" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-accent-gold hover:text-yellow-300"><CheckCircle2 className="h-4 w-4" />Începe ca dealer</Link>
      </section>
    </div>
  );
}
