import { Form, Link, redirect, useActionData, useLoaderData } from 'react-router';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { CheckCircle2, ExternalLink, Flag, ShieldCheck } from 'lucide-react';
import { getSupabaseServerClient } from '~/lib/supabase.server';

const STATUS: Record<string, string> = {
  open: 'Nou',
  reviewed: 'În analiză',
  resolved: 'Rezolvat',
  dismissed: 'Respins',
};

const REASON: Record<string, string> = {
  fraud: 'Posibilă fraudă',
  incorrect_details: 'Detalii incorecte',
  duplicate: 'Anunț duplicat',
  offensive_content: 'Conținut nepotrivit',
  other: 'Altă problemă',
};

const VALID_STATUSES = new Set(Object.keys(STATUS));

async function requireModerator(request: Request) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, headers, user: null, isAdmin: false };
  const { data: isAdmin, error } = await supabase.rpc('is_platform_admin');
  return { supabase, headers, user, isAdmin: !error && Boolean(isAdmin) };
}

export function meta() {
  return [
    { title: 'Moderare rapoarte - AutoFans' },
    { name: 'robots', content: 'noindex,nofollow' },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers, user, isAdmin } = await requireModerator(request);
  if (!user) return redirect(`/login?next=${encodeURIComponent(new URL(request.url).pathname)}`, { headers });
  if (!isAdmin) throw new Response('Pagina nu a fost găsită.', { status: 404 });

  const { data, error } = await supabase
    .from('listing_reports')
    .select('id, reason, details, status, created_at, updated_at, listings(id, slug, title), profiles!reporter_id(display_name, email)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Response('Rapoartele nu pot fi încărcate.', { status: 500 });
  return { reports: data ?? [] };
}

export async function action({ request }: ActionFunctionArgs) {
  const { supabase, headers, user, isAdmin } = await requireModerator(request);
  if (!user) return redirect('/login', { headers });
  if (!isAdmin) throw new Response('Pagina nu a fost găsită.', { status: 404 });

  const form = await request.formData();
  const id = Number(form.get('id'));
  const status = String(form.get('status') || '');
  if (!Number.isSafeInteger(id) || id < 1 || !VALID_STATUSES.has(status)) {
    return { ok: false, error: 'Date invalide.' };
  }

  const { error } = await supabase.from('listing_reports').update({ status }).eq('id', id);
  if (error) return { ok: false, error: 'Statusul nu a putut fi actualizat.' };
  return { ok: true, message: 'Status actualizat.' };
}

export default function AdminReports() {
  const { reports } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-7 flex items-start gap-3 sm:mb-9">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent-gold/25 bg-accent-gold/10 text-accent-gold"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></div>
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Moderare rapoarte</h1>
          <p className="mt-1 text-sm leading-6 text-gray-300">Verifică semnalările comunității și păstrează marketplace-ul sigur.</p>
        </div>
      </div>

      {actionData?.message && <p className="mb-4 rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100" role="status">{actionData.message}</p>}
      {actionData?.error && <p className="mb-4 rounded-xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm text-red-100" role="alert">{actionData.error}</p>}

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-12 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-300" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-white">Niciun raport de analizat</h2>
          <p className="mt-1 text-sm text-gray-300">Când un utilizator semnalează un anunț, acesta apare aici.</p>
        </div>
      ) : (
        <ul className="space-y-3" aria-label="Rapoarte pentru moderare">
          {reports.map((report: any) => {
            const listing = Array.isArray(report.listings) ? report.listings[0] : report.listings;
            const reporter = Array.isArray(report.profiles) ? report.profiles[0] : report.profiles;
            return (
              <li key={report.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Flag className="h-4 w-4 text-red-300" aria-hidden="true" />
                      <p className="font-semibold text-white">{REASON[report.reason] ?? report.reason}</p>
                      <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs font-medium text-gray-300">{STATUS[report.status] ?? report.status}</span>
                    </div>
                    {listing?.slug ? <Link to={`/car/${listing.slug}`} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent-gold hover:text-accent-gold/80">{listing.title || 'Anunț raportat'} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></Link> : <p className="mt-2 text-sm text-gray-400">Anunț șters sau indisponibil</p>}
                    {report.details && <p className="mt-3 max-w-3xl rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm leading-6 text-gray-300">{report.details}</p>}
                    <p className="mt-3 text-xs text-gray-500">Raportat de {reporter?.display_name || reporter?.email || 'utilizator'} · {new Intl.DateTimeFormat('ro-RO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(report.created_at))}</p>
                  </div>
                  <Form method="post" className="flex shrink-0 items-center gap-2">
                    <input type="hidden" name="id" value={String(report.id)} />
                    <label className="sr-only" htmlFor={`report-status-${report.id}`}>Status raport</label>
                    <select id={`report-status-${report.id}`} name="status" defaultValue={report.status} className="min-h-10 rounded-xl border border-white/15 bg-secondary-900 px-3 text-sm text-white outline-none focus:border-accent-gold">
                      {Object.entries(STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <button type="submit" className="min-h-10 rounded-xl bg-gold-gradient px-3 text-sm font-bold text-secondary-900 transition hover:brightness-110">Salvează</button>
                  </Form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
