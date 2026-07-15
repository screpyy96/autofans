import type { Route } from './+types/contact';
import { ArrowUpRight, CircleHelp, Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Contact - AutoFans.ro' },
    { name: 'description', content: 'Contactează echipa AutoFans.ro pentru suport pentru cont, anunțuri și parteneriate.' },
  ];
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-premium-gradient px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <header className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent-gold/30 bg-accent-gold/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-accent-gold">
            <ShieldCheck className="h-3.5 w-3.5" /> Suport AutoFans
          </span>
          <h1 className="mt-5 text-4xl font-bold text-white sm:text-5xl">Cu ce te putem ajuta?</h1>
          <p className="mt-4 text-base leading-relaxed text-gray-400 sm:text-lg">Pentru probleme de cont, un anunț sau un parteneriat, scrie-ne direct. Nu afișăm date de contact inventate și nu folosim formulare care nu trimit nimic.</p>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-3xl border border-accent-gold/25 bg-accent-gold/[0.06] p-6 shadow-2xl sm:p-8">
            <span className="inline-flex rounded-2xl bg-accent-gold/15 p-3 text-accent-gold"><Mail className="h-6 w-6" /></span>
            <h2 className="mt-5 text-2xl font-bold text-white">Scrie echipei</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">Trimite-ne contextul și, dacă este cazul, linkul anunțului. Îți răspundem pe email.</p>
            <a href="mailto:contact@autofans.ro" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2.5 text-sm font-bold text-secondary-900 transition hover:brightness-110">
              contact@autofans.ro <ArrowUpRight className="h-4 w-4" />
            </a>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <span className="inline-flex rounded-2xl bg-white/10 p-3 text-accent-gold"><CircleHelp className="h-6 w-6" /></span>
            <h2 className="mt-5 text-2xl font-bold text-white">Răspunsuri rapide</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">Verifică centrul de ajutor pentru publicarea anunțurilor, siguranță, cont și conversații.</p>
            <Link to="/help" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold text-white transition hover:border-accent-gold hover:bg-white/5">
              Deschide centrul de ajutor <ArrowUpRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
