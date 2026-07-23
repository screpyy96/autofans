import type { ActionFunctionArgs } from 'react-router';
import { getSupabaseServerClient } from '~/lib/supabase.server';
import { isAutoportUrlAllowed, scrapeAutoportVehicle, DEFAULT_USER_AGENT, FETCH_TIMEOUT_MS } from '~/utils/autoportScraper.server';
import { generateUniqueSlug } from '~/utils/helpers';

type StoredImage = {
  path: string;
  isMain: boolean;
  sourceUrl?: string;
};

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function getImageExtensionFromContentType(contentType: string, url: string): string {
  const lowerContentType = (contentType || '').toLowerCase();
  if (lowerContentType.includes('jpeg') || lowerContentType.includes('jpg')) return 'jpg';
  if (lowerContentType.includes('png')) return 'png';
  if (lowerContentType.includes('webp')) return 'webp';

  const extMatch = url.toLowerCase().match(/\.(jpe?g|png|webp)(?:\?|$)/);
  if (extMatch) return extMatch[1] === 'jpeg' ? 'jpg' : extMatch[1];
  return 'jpg';
}

async function downloadAndStoreImage(
  supabase: any,
  ownerId: string,
  sourceSlug: string,
  imageUrl: string,
  index: number
): Promise<StoredImage | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': DEFAULT_USER_AGENT },
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || '';
    const isImage = contentType.includes('image/') || imageUrl.match(/\.(jpe?g|png|webp)/i);
    if (!isImage) return null;

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Reject individual images larger than 10 MB
    if (buffer.length > 10 * 1024 * 1024) return null;

    const ext = getImageExtensionFromContentType(contentType, imageUrl);
    const urlHash = simpleHash(imageUrl);
    const path = `${ownerId}/dealer/autoport/${sourceSlug}/${index}_${urlHash}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(path, buffer, {
        upsert: true,
        cacheControl: '31536000',
        contentType: contentType.includes('image/') ? contentType : `image/${ext}`,
      });

    if (uploadError) {
      console.error('[Autoport Image Upload Error]', uploadError);
      return null;
    }

    return {
      path,
      isMain: index === 0,
      sourceUrl: imageUrl,
    };
  } catch (error) {
    console.error('[Autoport Image Download Exception]', imageUrl, error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const { supabase } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Trebuie să fii autentificat.' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'seller') {
    return Response.json({ error: 'Doar conturile de vânzător pot importa vehicule.' }, { status: 403 });
  }

  const allowedEmails = (process.env.AUTOPORT_ALLOWED_EMAILS || 'iosifscrepy@gmail.com').split(',').map((e) => e.trim().toLowerCase());
  if (!user.email || !allowedEmails.includes(user.email.toLowerCase())) {
    return Response.json({ error: 'Sincronizarea Autoport este restricționată pentru contul tău.' }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Format cerere invalid.' }, { status: 400 });
  }

  const importId = String(body.importId || body.import_id || '').trim();
  const sourceUrl = String(body.sourceUrl || body.source_url || body.url || '').trim();
  const itemIndex = typeof body.itemIndex === 'number' ? body.itemIndex : (typeof body.rowNumber === 'number' ? body.rowNumber - 2 : 0);

  if (!importId) {
    return Response.json({ error: 'Lipsește identificatorul importului (importId).' }, { status: 400 });
  }

  if (!sourceUrl || !isAutoportUrlAllowed(sourceUrl)) {
    return Response.json({ error: 'URL-ul vehiculului trebuie să fie exact pe domeniul autoport.ro/auto/.' }, { status: 400 });
  }

  // Check import batch ownership
  const { data: importBatch, error: batchError } = await supabase
    .from('dealer_csv_imports')
    .select('id, imported_count, invalid_count')
    .eq('id', importId)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (batchError || !importBatch) {
    return Response.json({ error: 'Sesiunea de import specificată nu a fost găsită.' }, { status: 404 });
  }

  // Calculate row number >= 2 to satisfy check constraint row_number > 1
  const rowNumber = Math.max(2, itemIndex + 2);

  let vehicleData;
  try {
    vehicleData = await scrapeAutoportVehicle(sourceUrl);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Nu am putut prelua datele vehiculului.';
    console.error('[Autoport Scrape Error]', sourceUrl, errorMsg);

    // Record invalid row report
    await supabase.from('dealer_csv_import_rows').insert({
      import_id: importId,
      row_number: rowNumber,
      external_stock_id: `autoport:${sourceUrl.split('/auto/')[1]?.replace(/\/+$/, '') || 'unknown'}`,
      listing_id: null,
      status: 'invalid',
      errors: [errorMsg],
      raw_data: { sourceUrl, error: errorMsg },
    });

    await supabase.from('dealer_csv_imports').update({
      invalid_count: (importBatch.invalid_count || 0) + 1,
    }).eq('id', importId).eq('owner_id', user.id);

    return Response.json({ success: false, error: errorMsg, action: 'invalid' }, { status: 422 });
  }

  const stockId = `autoport:${vehicleData.sourceSlug}`;

  // Find existing listing
  const { data: existingListing } = await supabase
    .from('listings')
    .select('id, status, images')
    .eq('owner_id', user.id)
    .eq('dealer_external_stock_id', stockId)
    .maybeSingle();

  // Process Images: Reuse existing stored images where sourceUrl matches
  const existingImages = (Array.isArray(existingListing?.images) ? existingListing.images : []) as StoredImage[];
  const existingMapByUrl = new Map<string, StoredImage>();
  for (const img of existingImages) {
    if (img.sourceUrl) {
      existingMapByUrl.set(img.sourceUrl, img);
    }
  }

  const finalImages: StoredImage[] = [];
  const imageUrlsToProcess = vehicleData.imageUrls.slice(0, 15);

  for (let idx = 0; idx < imageUrlsToProcess.length; idx++) {
    const srcUrl = imageUrlsToProcess[idx];
    const existing = existingMapByUrl.get(srcUrl);

    if (existing && existing.path) {
      finalImages.push({
        path: existing.path,
        isMain: idx === 0,
        sourceUrl: srcUrl,
      });
    } else {
      const stored = await downloadAndStoreImage(supabase, user.id, vehicleData.sourceSlug, srcUrl, idx);
      if (stored) {
        finalImages.push({
          ...stored,
          isMain: idx === 0,
        });
      }
    }
  }

  // First image must be isMain = true
  if (finalImages.length > 0) {
    finalImages[0].isMain = true;
    for (let i = 1; i < finalImages.length; i++) {
      finalImages[i].isMain = false;
    }
  }

  let listingId: number;
  let isCreated = false;

  if (!existingListing) {
    // Insert NEW listing as draft
    const newSlug = generateUniqueSlug(vehicleData.make, vehicleData.model, vehicleData.year);
    const { data: newListing, error: insertError } = await supabase
      .from('listings')
      .insert({
        owner_id: user.id,
        dealer_import_id: importId,
        dealer_external_stock_id: stockId,
        title: vehicleData.title,
        description: vehicleData.description,
        price: vehicleData.price,
        currency: 'EUR',
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        mileage: vehicleData.mileage,
        fuel_type: vehicleData.fuel,
        transmission: vehicleData.transmission,
        body_type: vehicleData.bodyType || null,
        vin: vehicleData.vin || null,
        engine_size: vehicleData.engineCapacity || null,
        power: vehicleData.power || null,
        features: vehicleData.equipment || [],
        city: 'Suceava',
        county: 'Suceava',
        images: finalImages,
        status: 'draft',
        slug: newSlug,
        service_history: true,
        owners: 1,
        has_accidents: false,
      })
      .select('id')
      .single();

    if (insertError || !newListing) {
      console.error('[Autoport Listing Insert Error]', insertError);
      return Response.json({ error: 'Nu am putut crea anunțul în baza de date.' }, { status: 500 });
    }

    listingId = newListing.id;
    isCreated = true;
  } else {
    // Update EXISTING listing
    listingId = existingListing.id;

    // Status handling logic:
    // DB CHECK constraint allows only 'draft' and 'published'.
    // If published, preserve published status.
    // If Autoport says Rezervat, set/keep as draft (reserved is not a valid DB status).
    let newStatus = existingListing.status;
    if (vehicleData.sourceStatus === 'Rezervat') {
      newStatus = 'draft';
    } else if (existingListing.status === 'published') {
      newStatus = 'published';
    }

    const updatePayload = {
      dealer_import_id: importId,
      title: vehicleData.title,
      description: vehicleData.description,
      price: vehicleData.price,
      mileage: vehicleData.mileage,
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year,
      fuel_type: vehicleData.fuel,
      transmission: vehicleData.transmission,
      body_type: vehicleData.bodyType || null,
      vin: vehicleData.vin || null,
      engine_size: vehicleData.engineCapacity || null,
      power: vehicleData.power || null,
      features: vehicleData.equipment || [],
      images: finalImages.length ? finalImages : existingListing.images,
      status: newStatus,
      service_history: true,
      owners: 1,
      has_accidents: false,
    };

    const { error: updateError } = await supabase
      .from('listings')
      .update(updatePayload)
      .eq('id', listingId)
      .eq('owner_id', user.id);

    if (updateError) {
      console.error('[Autoport Listing Update Error]', JSON.stringify(updateError), 'Payload:', JSON.stringify({ listingId, status: newStatus, vin: updatePayload.vin, mileage: updatePayload.mileage, year: updatePayload.year }));
      return Response.json({ error: `Nu am putut actualiza anunțul existent: ${updateError.message || updateError.code || 'eroare necunoscută'}` }, { status: 500 });
    }
  }

  // Create or update import row report
  const { error: rowError } = await supabase.from('dealer_csv_import_rows').insert({
    import_id: importId,
    row_number: rowNumber,
    external_stock_id: stockId,
    listing_id: listingId,
    status: 'imported',
    errors: [],
    raw_data: {
      sourceUrl,
      sourceStatus: vehicleData.sourceStatus,
      title: vehicleData.title,
      price: vehicleData.price,
    },
  });

  if (rowError) {
    console.error('[Autoport Row Insert Error]', rowError);
  }

  // Increment imported_count in batch
  await supabase
    .from('dealer_csv_imports')
    .update({
      imported_count: (importBatch.imported_count || 0) + 1,
    })
    .eq('id', importId)
    .eq('owner_id', user.id);

  return Response.json({
    success: true,
    listingId,
    stockId,
    isCreated,
    title: vehicleData.title,
    imagesCount: finalImages.length,
  });
}
