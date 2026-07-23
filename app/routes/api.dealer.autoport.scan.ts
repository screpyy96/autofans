import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { getSupabaseServerClient } from '~/lib/supabase.server';
import { scanAutoportInventory } from '~/utils/autoportScraper.server';

async function handleScanRequest(request: Request) {
  const { supabase } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Trebuie să fii autentificat pentru a accesa această funcționalitate.' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'seller') {
    return Response.json({ error: 'Doar utilizatorii cu profil de vânzător pot folosi sincronizarea dealer.' }, { status: 403 });
  }

  const allowedEmails = (process.env.AUTOPORT_ALLOWED_EMAILS || 'iosifscrepy@gmail.com').split(',').map((e) => e.trim().toLowerCase());
  if (!user.email || !allowedEmails.includes(user.email.toLowerCase())) {
    return Response.json({ error: 'Sincronizarea Autoport este restricționată pentru contul tău.' }, { status: 403 });
  }

  try {
    const scanResult = await scanAutoportInventory();

    const { data: importBatch, error: batchError } = await supabase
      .from('dealer_csv_imports')
      .insert({
        owner_id: user.id,
        file_name: scanResult.importBatchName.slice(0, 255),
        total_rows: scanResult.total,
        imported_count: 0,
        invalid_count: 0,
      })
      .select('id')
      .single();

    if (batchError || !importBatch) {
      console.error('[Autoport Scan Error] Failed to create import batch record');
      return Response.json({ error: 'Nu am putut inițializa sesiunea de sincronizare. Încearcă din nou.' }, { status: 500 });
    }

    return Response.json({
      importId: importBatch.id,
      items: scanResult.items,
      total: scanResult.total,
    });
  } catch (error) {
    console.error('[Autoport Scan Error]', error instanceof Error ? error.message : error);
    const message = error instanceof Error ? error.message : 'Eroare neașteptată la scanarea stocului Autoport.ro.';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  return handleScanRequest(request);
}

export async function action({ request }: ActionFunctionArgs) {
  return handleScanRequest(request);
}
