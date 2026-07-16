import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from 'react-router';
import { Form, Link, useLoaderData } from 'react-router';
import { CheckCircle2, Download, FileSpreadsheet, ImagePlus, Layers3, TriangleAlert, Upload } from 'lucide-react';
import { getSupabaseServerClient } from '~/lib/supabase.server';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { DEALER_CSV_MAX_ROWS, parseDealerCsv } from '~/utils/dealerCsv';
import { generateUniqueSlug } from '~/utils/helpers';
import { publishOwnedListing } from '~/utils/publishListing.server';

const MAX_IMPORT_ROWS = DEALER_CSV_MAX_ROWS;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_BATCH_IMAGE_FILES = 80;
const MAX_BATCH_IMAGE_BYTES = 80 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type StoredListingImage = { path: string; isMain: boolean };

function getImageExtension(file: File) {
  const extension = file.name.toLowerCase().match(/\.(jpe?g|png|webp)$/)?.[1];
  return extension === 'jpeg' ? 'jpg' : extension || '';
}

function getStockIdFromImageName(fileName: string, stockIds: string[]) {
  const basename = fileName.replace(/\.[^.]+$/, '');
  return [...stockIds]
    .sort((left, right) => right.length - left.length)
    .find((stockId) => basename.startsWith(`${stockId}__`));
}

type ImportSummary = {
  id: string;
  file_name: string;
  total_rows: number;
  imported_count: number;
  invalid_count: number;
  created_at: string;
};

type ImportRow = {
  id: number;
  row_number: number;
  external_stock_id: string | null;
  listing_id: number | null;
  status: 'imported' | 'invalid';
  errors: string[];
};

function redirectToImport(headers: Headers, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  return redirect(`/dashboard/dealer-import?${search.toString()}`, { headers });
}

export function meta() {
  return [
    { title: 'Import stoc dealer - AutoFans.ro' },
    { name: 'robots', content: 'noindex,nofollow' },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect(`/login?next=${encodeURIComponent(new URL(request.url).pathname)}`, { headers });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'seller') return redirect('/dashboard', { headers });

  const url = new URL(request.url);
  const selectedImportId = url.searchParams.get('import') || '';
  const { data: imports, error: importsError } = await supabase
    .from('dealer_csv_imports')
    .select('id, file_name, total_rows, imported_count, invalid_count, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(12);

  if (importsError) throw new Response('Importul dealer nu este configurat încă. Rulează migrarea bazei de date.', { status: 503 });

  const selected = (imports || []).find((item: ImportSummary) => item.id === selectedImportId) || (imports || [])[0] || null;
  let rows: ImportRow[] = [];
  if (selected) {
    const { data, error } = await supabase
      .from('dealer_csv_import_rows')
      .select('id, row_number, external_stock_id, listing_id, status, errors')
      .eq('import_id', selected.id)
      .order('row_number', { ascending: true })
      .limit(MAX_IMPORT_ROWS);
    if (error) throw new Response('Nu am putut citi rândurile importului.', { status: 500 });
    rows = (data || []) as ImportRow[];
  }

  return {
    imports: (imports || []) as ImportSummary[],
    selected,
    rows,
    notice: url.searchParams.get('notice') || '',
    error: url.searchParams.get('error') || '',
    published: Number(url.searchParams.get('published') || 0),
    blocked: Number(url.searchParams.get('blocked') || 0),
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login', { headers });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'seller') return Response.json({ error: 'Doar conturile de vânzător pot importa stoc.' }, { status: 403 });

  const formData = await request.formData();
  const intent = String(formData.get('intent') || '');

  if (intent === 'bulk-publish') {
    const importId = String(formData.get('import_id') || '');
    const { data: importBatch } = await supabase
      .from('dealer_csv_imports')
      .select('id')
      .eq('id', importId)
      .eq('owner_id', user.id)
      .maybeSingle();
    if (!importBatch) return redirectToImport(headers, { error: 'Importul nu a fost găsit.' });

    const { data: drafts, error } = await supabase
      .from('listings')
      .select('id')
      .eq('owner_id', user.id)
      .eq('dealer_import_id', importId)
      .eq('status', 'draft')
      .limit(MAX_IMPORT_ROWS);
    if (error) return redirectToImport(headers, { import: importId, error: 'Nu am putut pregăti publicarea în masă.' });

    let published = 0;
    let blocked = 0;
    for (const draft of drafts || []) {
      const result = await publishOwnedListing(supabase, user.id, Number(draft.id));
      if (result.ok) published += 1;
      else blocked += 1;
    }
    return redirectToImport(headers, { import: importId, published, blocked, notice: published ? 'Publicarea în masă s-a terminat.' : undefined });
  }

  if (intent === 'attach-images') {
    const importId = String(formData.get('import_id') || '');
    const files = formData.getAll('photos').filter((item): item is File => item instanceof File && item.size > 0);
    if (!files.length) return redirectToImport(headers, { import: importId, error: 'Alege cel puțin o fotografie.' });
    if (files.length > MAX_BATCH_IMAGE_FILES) {
      return redirectToImport(headers, { import: importId, error: `Poți încărca cel mult ${MAX_BATCH_IMAGE_FILES} poze într-un lot.` });
    }
    const totalBytes = files.reduce((total, file) => total + file.size, 0);
    if (totalBytes > MAX_BATCH_IMAGE_BYTES) {
      return redirectToImport(headers, { import: importId, error: 'Lotul de poze poate avea cel mult 80 MB.' });
    }
    const invalidFile = files.find((file) => !ACCEPTED_IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES || !getImageExtension(file));
    if (invalidFile) {
      return redirectToImport(headers, { import: importId, error: `„${invalidFile.name}” trebuie să fie JPG, PNG sau WEBP și să aibă cel mult 10 MB.` });
    }

    const { data: importBatch } = await supabase
      .from('dealer_csv_imports')
      .select('id')
      .eq('id', importId)
      .eq('owner_id', user.id)
      .maybeSingle();
    if (!importBatch) return redirectToImport(headers, { error: 'Importul nu a fost găsit.' });

    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, dealer_external_stock_id, images')
      .eq('owner_id', user.id)
      .eq('dealer_import_id', importId);
    if (listingsError || !listings?.length) {
      return redirectToImport(headers, { import: importId, error: 'Nu am găsit drafturi pentru acest import.' });
    }

    const byStockId = new Map(listings.map((listing: any) => [String(listing.dealer_external_stock_id), listing]));
    const stockIds = [...byStockId.keys()];
    const unmatched = files.filter((file) => !getStockIdFromImageName(file.name, stockIds));
    if (unmatched.length) {
      return redirectToImport(headers, {
        import: importId,
        error: `Nu pot asocia ${unmatched.length} poză/poze. Folosește exact formatul ID_STOC__01.jpg, de exemplu AF-1001__01.jpg.`,
      });
    }

    const filesByStockId = new Map<string, File[]>();
    for (const file of files) {
      const stockId = getStockIdFromImageName(file.name, stockIds)!;
      filesByStockId.set(stockId, [...(filesByStockId.get(stockId) || []), file]);
    }
    for (const [stockId, stockFiles] of filesByStockId) {
      const existingImages = Array.isArray(byStockId.get(stockId)?.images) ? byStockId.get(stockId).images : [];
      if (existingImages.length + stockFiles.length > 15) {
        return redirectToImport(headers, { import: importId, error: `„${stockId}” ar depăși limita de 15 poze per anunț.` });
      }
    }

    let uploadedCount = 0;
    let failedCount = 0;
    for (const [stockId, stockFiles] of filesByStockId) {
      const listing = byStockId.get(stockId);
      if (!listing) continue;
      const existingImages = (Array.isArray(listing.images) ? listing.images : []) as StoredListingImage[];
      const newImages: StoredListingImage[] = [];

      for (const [index, file] of stockFiles.entries()) {
        const extension = getImageExtension(file);
        const safeStockId = stockId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const path = `${user.id}/dealer/${importId}/${safeStockId}-${Date.now()}-${index}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('listing-images').upload(path, file, {
          upsert: false,
          cacheControl: '31536000',
          contentType: file.type,
        });
        if (uploadError) {
          failedCount += 1;
          continue;
        }
        newImages.push({ path, isMain: false });
      }

      if (!newImages.length) continue;
      const images = [...existingImages, ...newImages].map((image, index) => ({ ...image, isMain: index === 0 }));
      const { error: updateError } = await supabase.from('listings').update({ images }).eq('id', listing.id).eq('owner_id', user.id);
      if (updateError) {
        failedCount += newImages.length;
        continue;
      }
      uploadedCount += newImages.length;
    }

    return redirectToImport(headers, {
      import: importId,
      notice: uploadedCount ? `${uploadedCount} poze au fost atașate automat la anunțuri.${failedCount ? ` ${failedCount} nu au putut fi salvate.` : ''}` : undefined,
      error: !uploadedCount ? 'Nu am putut încărca pozele. Încearcă din nou.' : undefined,
    });
  }

  if (intent !== 'import') return Response.json({ error: 'Acțiune necunoscută.' }, { status: 400 });

  const file = formData.get('csv');
  if (!(file instanceof File) || file.size === 0) return redirectToImport(headers, { error: 'Alege un fișier CSV înainte de import.' });
  if (file.size > MAX_FILE_BYTES) return redirectToImport(headers, { error: 'Fișierul CSV poate avea cel mult 2 MB.' });
  if (!file.name.toLowerCase().endsWith('.csv')) return redirectToImport(headers, { error: 'Fișierul trebuie să aibă extensia .csv.' });

  let parsed;
  try {
    parsed = parseDealerCsv(await file.text());
  } catch (error) {
    return redirectToImport(headers, { error: error instanceof Error ? error.message : 'Nu am putut citi CSV-ul.' });
  }
  if (parsed.missingHeaders.length) {
    return redirectToImport(headers, { error: `Lipsesc coloanele: ${parsed.missingHeaders.join(', ')}.` });
  }
  if (!parsed.rows.length) return redirectToImport(headers, { error: 'Nu am găsit mașini valide în CSV.' });

  const { data: importBatch, error: batchError } = await supabase
    .from('dealer_csv_imports')
    .insert({ owner_id: user.id, file_name: file.name.slice(0, 255), total_rows: parsed.rows.length })
    .select('id')
    .single();
  if (batchError || !importBatch) return redirectToImport(headers, { error: 'Nu am putut crea importul. Încearcă din nou.' });

  const candidateStockIds = parsed.rows.filter((row) => row.listing).map((row) => row.externalStockId);
  const { data: existing } = candidateStockIds.length
    ? await supabase
      .from('listings')
      .select('dealer_external_stock_id')
      .eq('owner_id', user.id)
      .in('dealer_external_stock_id', candidateStockIds)
    : { data: [] as Array<{ dealer_external_stock_id: string }> };
  const existingStockIds = new Set((existing || []).map((listing) => listing.dealer_external_stock_id));
  parsed.rows.forEach((row) => {
    if (row.listing && existingStockIds.has(row.externalStockId)) {
      row.errors.push('stock_id există deja în stocul tău.');
      delete row.listing;
    }
  });

  const validRows = parsed.rows.filter((row) => row.listing);
  const { data: createdListings, error: listingsError } = validRows.length
    ? await supabase
      .from('listings')
      .insert(validRows.map((row) => {
        const listing = row.listing!;
        return {
          owner_id: user.id,
          dealer_import_id: importBatch.id,
          dealer_external_stock_id: listing.externalStockId,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          currency: listing.currency,
          make: listing.make,
          model: listing.model,
          year: listing.year,
          mileage: listing.mileage,
          fuel_type: listing.fuelType,
          transmission: listing.transmission,
          body_type: listing.bodyType,
          vin: listing.vin,
          city: listing.city,
          county: listing.county,
          images: [],
          status: 'draft',
          slug: generateUniqueSlug(listing.make, listing.model, listing.year),
        };
      }))
      .select('id, dealer_external_stock_id')
    : { data: [] as Array<{ id: number; dealer_external_stock_id: string }>, error: null };

  if (listingsError) {
    await supabase.from('dealer_csv_imports').delete().eq('id', importBatch.id).eq('owner_id', user.id);
    return redirectToImport(headers, { error: 'Nu am putut crea drafturile. Verifică datele și încearcă din nou.' });
  }

  const listingIds = new Map((createdListings || []).map((listing) => [listing.dealer_external_stock_id, listing.id]));
  const importRows = parsed.rows.map((row) => ({
    import_id: importBatch.id,
    row_number: row.rowNumber,
    external_stock_id: row.externalStockId || null,
    listing_id: row.listing ? listingIds.get(row.externalStockId) || null : null,
    status: row.listing ? 'imported' : 'invalid',
    errors: row.errors,
    raw_data: row.raw,
  }));
  const { error: rowsError } = await supabase.from('dealer_csv_import_rows').insert(importRows);
  if (rowsError) return redirectToImport(headers, { import: importBatch.id, error: 'Drafturile au fost create, dar nu am putut salva raportul importului.' });

  const importedCount = createdListings?.length || 0;
  await supabase
    .from('dealer_csv_imports')
    .update({ imported_count: importedCount, invalid_count: parsed.rows.length - importedCount })
    .eq('id', importBatch.id)
    .eq('owner_id', user.id);

  return redirectToImport(headers, {
    import: importBatch.id,
    notice: `${importedCount} drafturi au fost create. Încarcă pozele în lot, apoi poți publica în masă.`,
  });
}

export default function DealerImport() {
  const { imports, selected, rows, notice, error, published, blocked } = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 sm:mb-8">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent-gold/30 bg-accent-gold/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-accent-gold">
            <Layers3 className="h-3.5 w-3.5" /> Dealer tools
          </div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Importă stocul dealerului</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base">Încarcă până la 100 de mașini din CSV. Datele sunt verificate, iar anunțurile sunt create ca drafturi — nimic nu apare public fără validare.</p>
        </div>
        <Button asChild variant="outline" className="border-white/15 text-white"><Link to="/dashboard/listings">Anunțurile mele</Link></Button>
      </div>

      {notice && <div className="mb-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"><CheckCircle2 className="mr-2 inline h-4 w-4" />{notice}</div>}
      {error && <div className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100"><TriangleAlert className="mr-2 inline h-4 w-4" />{error}</div>}
      {(published > 0 || blocked > 0) && <div className="mb-5 rounded-xl border border-accent-gold/30 bg-accent-gold/10 px-4 py-3 text-sm text-gray-100">Publicate: <strong>{published}</strong>. Blocate pentru completare: <strong>{blocked}</strong>.</div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card variant="elevated" padding="none" className="overflow-hidden">
          <div className="border-b border-white/10 bg-gradient-to-r from-accent-gold/15 to-transparent p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-accent-gold/15 p-2.5"><FileSpreadsheet className="h-5 w-5 text-accent-gold" /></div>
              <div>
                <h2 className="font-semibold text-white">CSV standardizat</h2>
                <p className="mt-1 text-sm text-gray-300">Antetele și valorile sunt în română; fișierul merge direct din Excel, inclusiv cu separator „;”.</p>
              </div>
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap gap-3">
              <Button asChild variant="outline" size="sm" className="border-accent-gold/40 text-accent-gold"><a href="/dealer-import-template.csv" download><Download className="mr-2 h-4 w-4" />Descarcă model CSV</a></Button>
              <span className="self-center text-xs text-gray-400">Max. 100 mașini / 2 MB per import</span>
            </div>
            <Form method="post" encType="multipart/form-data" className="rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-4 sm:p-5">
              <input type="hidden" name="intent" value="import" />
              <label className="block text-sm font-semibold text-white" htmlFor="dealer-csv">Fișierul tău CSV</label>
              <p className="mt-1 text-sm text-gray-400">Include toate coloanele obligatorii din model. Coloanele lipsă și rândurile invalide sunt raportate înainte de publicare.</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input id="dealer-csv" name="csv" type="file" accept=".csv,text/csv" required className="block w-full rounded-xl border border-white/15 bg-secondary-950 px-3 py-2 text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-white/15 sm:flex-1" />
                <Button type="submit" className="bg-gold-gradient text-secondary-900"><Upload className="mr-2 h-4 w-4" />Importă stocul</Button>
              </div>
            </Form>
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-gray-300">
              <p className="font-semibold text-white">Ce se întâmplă după import?</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Rândurile corecte devin drafturi în contul tău.</li>
                <li>Încarci pozele în lot, asociate automat după ID-ul de stoc.</li>
                <li>Publici în masă doar drafturile care trec verificarea.</li>
              </ol>
            </div>
          </div>
        </Card>

        <Card variant="default" padding="md" className="h-fit">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-300">Importuri recente</h2>
          {imports.length === 0 ? <p className="mt-4 text-sm text-gray-400">Primul import va apărea aici.</p> : (
            <div className="mt-4 space-y-2">
              {imports.map((item) => (
                <Link key={item.id} to={`/dashboard/dealer-import?import=${item.id}`} className={`block rounded-xl border p-3 transition-colors ${selected?.id === item.id ? 'border-accent-gold/50 bg-accent-gold/10' : 'border-white/10 bg-white/[0.02] hover:border-white/25'}`}>
                  <p className="truncate text-sm font-semibold text-white">{item.file_name}</p>
                  <p className="mt-1 text-xs text-gray-400">{item.imported_count} drafturi · {item.invalid_count} erori</p>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {selected && <Card variant="elevated" padding="none" className="mt-6 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-semibold text-white">Raport: {selected.file_name}</h2>
            <p className="mt-1 text-sm text-gray-400">{selected.total_rows} rânduri · {selected.imported_count} drafturi create · {selected.invalid_count} rânduri cu erori</p>
          </div>
          <Form method="post">
            <input type="hidden" name="intent" value="bulk-publish" />
            <input type="hidden" name="import_id" value={selected.id} />
            <Button type="submit" disabled={!selected.imported_count} className="bg-gold-gradient text-secondary-900">Publică drafturile gata</Button>
          </Form>
        </div>
        <div className="border-b border-white/10 bg-white/[0.02] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-accent-gold/15 p-2.5"><ImagePlus className="h-5 w-5 text-accent-gold" /></div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-white">Încarcă pozele în lot</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-300">Denumește fiecare fișier <strong>ID_STOC__număr.jpg</strong>, de exemplu <strong>AF-1001__01.jpg</strong>. Poți selecta poze pentru mai multe mașini dintr-o singură dată.</p>
              <Form method="post" encType="multipart/form-data" className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input type="hidden" name="intent" value="attach-images" />
                <input type="hidden" name="import_id" value={selected.id} />
                <input id="dealer-import-photos" name="photos" type="file" multiple accept="image/jpeg,image/png,image/webp" required className="block w-full min-w-0 rounded-xl border border-white/15 bg-secondary-950 px-3 py-2 text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-white/15 sm:flex-1" />
                <Button type="submit" className="shrink-0 bg-gold-gradient text-secondary-900"><ImagePlus className="mr-2 h-4 w-4" />Încarcă pozele</Button>
              </Form>
              <p className="mt-2 text-xs text-gray-400">JPG, PNG sau WEBP · max. 10 MB/poză · 80 poze și 80 MB per lot · max. 15 poze/anunț.</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-white/10">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0">
                <p className="font-medium text-white">Rândul {row.row_number} <span className="ml-2 text-sm font-normal text-gray-400">{row.external_stock_id || 'fără stock_id'}</span></p>
                {row.errors.length > 0 ? <p className="mt-1 text-sm text-red-200">{row.errors.join(' ')}</p> : <p className="mt-1 text-sm text-gray-400">Draft creat — pozele se pot încărca în lot sau din editor.</p>}
              </div>
              {row.listing_id && <Button asChild variant="outline" size="sm" className="border-accent-gold/30 text-accent-gold"><Link to={`/create-listing?edit=${row.listing_id}`}><ImagePlus className="mr-2 h-4 w-4" />Adaugă poze</Link></Button>}
            </div>
          ))}
        </div>
      </Card>}
    </div>
  );
}
