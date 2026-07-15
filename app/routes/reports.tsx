import { Link, redirect, useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { CheckCircle2, CircleAlert, Clock3, Flag, XCircle } from 'lucide-react';
import { getSupabaseServerClient } from '~/lib/supabase.server';

const REPORT_REASON: Record<string, string> = {
  fraud: 'Posibilă fraudă',
  incorrect_details: 'Detalii incorecte',
  duplicate: 'Anunț duplicat',
  offensive_content: 'Conținut nepotrivit',
  other: 'Altă problemă',
};

const STATUS: Record<string, { label: string; className: string; Icon: typeof Clock3 }> = {
  open: { label: 'În așteptare', className: 'border-amber-300/25 bg-amber-400/10 text-amber-200', Icon: Clock3 },
  reviewed: { label: 'În analiză', className: 'border-sky-300/25 bg-sky-400/10 text-sky-200', Icon: CircleAlert },
  resolved: { label: 'Rezolvat', className: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200', Icon: CheckCircle2 },
  dismissed: { label: 'Închis', className: 'border-white/15 bg-white/5 text-gray-300', Icon: XCircle },
};

type ReportRow = {
  id: number;
  reason: string;
  details: string;
  status: string;
  created_at: string;
  listings: { slug: string; title: string }[] | null;
};

export function meta() {
  return [
    { title: 'Rapoartele mele - AutoFans.ro' },
    { name: 'description', content: 'Urmărește statusul rapoartelor trimise către echipa AutoFans.' },
    { name: 'robots', content: 'noindex,nofollow' },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect(`/login?next=${encodeURIComponent(new URL(request.url).pathname)}`, { headers });

  const { data, error } = await supabase
    .from('listing_reports')
    .select('id, reason, details, status, created_at, listings(slug, title)')
    .eq('reporter_id', user.id)
    .order('created_at', { ascending: false });

  // The migration may be applied after the frontend deploy. Keep the account
  // usable and explain the temporary state rather than throwing a generic 500.
  return { reports: (data ?? []) as ReportRow[], reportsAvailable: !error };
}

export default function Reports() {
  const { reports, reportsAvailable } = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-7 flex items-start gap-3 sm:mb-9">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-300/20 bg-red-500/10 text-red-200">
          <Flag className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Rapoartele mele</h1>
          <p className="mt-1 text-sm leading-6 text-gray-300">Urmărește problemele semnalate. Nu afișăm identitatea ta vânzătorului.</p>
        </div>
      </div>

      {!reportsAvailable ? (
        <section className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-5 text-sm leading-6 text-amber-100">
          Funcția de raportare este în curs de activare. Revino în câteva minute; contul și anunțurile tale nu sunt afectate.
        </section>
      ) : reports.length === 0 ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-10 text-center sm:px-8">
          <Flag className="mx-auto h-7 w-7 text-gray-500" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-white">Nu ai trimis niciun raport</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-300">Dacă un anunț pare suspect, îl poți raporta direct din pagina mașinii.</p>
          <Link to="/search" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/5">Vezi anunțuri</Link>
        </section>
      ) : (
        <ul className="space-y-3" aria-label="Rapoarte trimise">
          {reports.map((report) => {
            const status = STATUS[report.status] ?? STATUS.open;
            const StatusIcon = status.Icon;
            const date = new Intl.DateTimeFormat('ro-RO', { dateStyle: 'medium' }).format(new Date(report.created_at));
            const listing = report.listings?.[0];
            return (
              <li key={report.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{REPORT_REASON[report.reason] ?? 'Problemă semnalată'}</p>
                    {listing?.slug ? (
                      <Link to={`/car/${listing.slug}`} className="mt-1 block truncate text-sm text-accent-gold hover:text-accent-gold/80">{listing.title || 'Vezi anunțul raportat'}</Link>
                    ) : (
                      <p className="mt-1 text-sm text-gray-300">Anunț indisponibil</p>
                    )}
                  </div>
                  <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                    <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />{status.label}
                  </span>
                </div>
                {report.details && <p className="mt-3 border-t border-white/10 pt-3 text-sm leading-6 text-gray-300">{report.details}</p>}
                <p className="mt-3 text-xs text-gray-500">Trimis la {date}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
