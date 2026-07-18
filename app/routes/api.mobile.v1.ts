import { createClient } from '@supabase/supabase-js';
import type { ActionFunctionArgs } from 'react-router';
import { validateListingDraft, validateListingForPublication } from '~/utils/listingPublication';
import { generateUniqueSlug } from '~/utils/helpers';
import { isValidVin, normalizeVin } from '~/utils/vin';
import { coordinatesForLocation } from '~/utils/location';
import { listingCanonicalUrl, submitIndexNowBestEffort } from '~/utils/indexNow.server';

type RequestBody = { operation?: string; payload?: Record<string, unknown> };

function mobileClient(token: string) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.REMIX_PUBLIC_SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.REMIX_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('Supabase env is not configured');
  return createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
}

async function geocodeListingLocation(city: string, county: string): Promise<{ latitude: number; longitude: number } | null> {
  const fallback = coordinatesForLocation({ city });
  const token = process.env.MAPBOX_TOKEN || process.env.VITE_MAPBOX_TOKEN;
  if (!token || !city.trim()) return fallback ? { longitude: fallback[0], latitude: fallback[1] } : null;
  try {
    const query = encodeURIComponent(`${city}, ${county || 'Romania'}, Romania`);
    const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?q=${query}&country=ro&types=place,locality&limit=1&access_token=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(4_000),
    });
    if (response.ok) {
      const payload = await response.json() as { features?: Array<{ geometry?: { coordinates?: [number, number] } }> };
      const [longitude, latitude] = payload.features?.[0]?.geometry?.coordinates || [];
      if (typeof latitude === 'number' && typeof longitude === 'number' && Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { latitude, longitude };
      }
    }
  } catch (error) {
    console.warn('Mobile listing geocoding unavailable:', error);
  }
  return fallback ? { longitude: fallback[0], latitude: fallback[1] } : null;
}

/** Mobile-only mutation façade. Every query still executes under the caller's
 * JWT and existing RLS policies; the server only centralises input limits and
 * stable response shapes for Android/iOS clients. */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return Response.json({ error: 'Authentication required' }, { status: 401 });
  let body: RequestBody;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const supabase = mobileClient(token);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
  const payload = body.payload || {};
  const fail = (error: { message: string } | null) => error ? Response.json({ error: error.message }, { status: 400 }) : null;

  if (body.operation === 'account') {
    const { data, error } = await supabase.from('profiles').select('id,email,display_name,phone,avatar_url,role,is_verified').eq('id', user.id).single();
    return fail(error) || Response.json({ profile: data });
  }
  if (body.operation === 'update_profile') {
    const update = {
      display_name: typeof payload.displayName === 'string' ? payload.displayName.slice(0, 120) : null,
      phone: typeof payload.phone === 'string' ? payload.phone.slice(0, 40) : null,
      avatar_url: typeof payload.avatarUrl === 'string' ? payload.avatarUrl.slice(0, 2_000) : null,
    };
    const { data, error } = await supabase.from('profiles').update(update).eq('id', user.id).select('id,email,display_name,phone,avatar_url,role,is_verified').single();
    return fail(error) || Response.json({ profile: data });
  }
  if (body.operation === 'favorites') {
    const { data, error } = await supabase
      .from('favorites')
      .select('listing_id,created_at,listings(id,slug,title,price,currency,make,model,year,mileage,fuel_type,transmission,city,county,images)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    return fail(error) || Response.json({ favorites: data || [] });
  }
  if (body.operation === 'toggle_favorite') {
    const listingId = Number(payload.listingId);
    if (!Number.isInteger(listingId)) return Response.json({ error: 'Invalid listing id' }, { status: 400 });
    const { data: existing } = await supabase.from('favorites').select('listing_id').eq('user_id', user.id).eq('listing_id', listingId).maybeSingle();
    const result = existing
      ? await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', listingId)
      : await supabase.from('favorites').insert({ user_id: user.id, listing_id: listingId });
    return fail(result.error) || Response.json({ favorite: !existing });
  }
  if (body.operation === 'saved_searches') {
    const { data, error } = await supabase.from('saved_searches').select('id,name,query,created_at,last_checked_at').eq('user_id', user.id).order('created_at', { ascending: false });
    return fail(error) || Response.json({ searches: data || [] });
  }
  if (body.operation === 'save_search') {
    const name = typeof payload.name === 'string' ? payload.name.trim().slice(0, 100) : '';
    if (!name || !payload.query || typeof payload.query !== 'object') return Response.json({ error: 'Invalid search' }, { status: 400 });
    const { data, error } = await supabase.from('saved_searches').insert({ user_id: user.id, name, query: payload.query }).select().single();
    return fail(error) || Response.json({ search: data });
  }
  if (body.operation === 'delete_saved_search') {
    const id = Number(payload.id); const { error } = await supabase.from('saved_searches').delete().eq('id', id).eq('user_id', user.id);
    return fail(error) || Response.json({ ok: true });
  }
  if (body.operation === 'update_saved_search') {
    const id = Number(payload.id);
    const name = typeof payload.name === 'string' ? payload.name.trim().slice(0, 100) : '';
    if (!Number.isInteger(id) || id <= 0 || !name) return Response.json({ error: 'Căutare invalidă.' }, { status: 400 });
    const { data, error } = await supabase.from('saved_searches').update({ name }).eq('id', id).eq('user_id', user.id).select('id,name,query,created_at,last_checked_at').maybeSingle();
    return fail(error) || (data ? Response.json({ search: data }) : Response.json({ error: 'Căutarea nu există.' }, { status: 404 }));
  }
  if (body.operation === 'notifications') {
    const { data, error } = await supabase.from('alert_notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
    return fail(error) || Response.json({ notifications: data || [] });
  }
  if (body.operation === 'read_notification') {
    const id = Number(payload.id); const { error } = await supabase.from('alert_notifications').update({ read_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id);
    return fail(error) || Response.json({ ok: true });
  }
  if (body.operation === 'promote_seller') {
    const { error } = await supabase.rpc('promote_to_seller');
    return fail(error) || Response.json({ ok: true });
  }
  if (body.operation === 'conversations') {
    const { data, error } = await supabase.from('conversations').select('id,listing_id,buyer_id,seller_id,created_at,updated_at').or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order('updated_at', { ascending: false });
    return fail(error) || Response.json({ conversations: data || [] });
  }
  if (body.operation === 'messages') {
    const conversationId = Number(payload.conversationId);
    const { data, error } = await supabase.from('messages').select('id,conversation_id,sender_id,body,created_at,read_at').eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(200);
    return fail(error) || Response.json({ messages: data || [] });
  }
  if (body.operation === 'start_conversation') {
    const listingId = Number(payload.listingId); const message = typeof payload.message === 'string' ? payload.message.trim().slice(0, 2000) : '';
    if (!Number.isInteger(listingId) || !message) return Response.json({ error: 'Invalid conversation' }, { status: 400 });
    const { data: listing } = await supabase.from('listings').select('id,owner_id').eq('id', listingId).eq('status', 'published').maybeSingle();
    if (!listing || listing.owner_id === user.id) return Response.json({ error: 'Listing unavailable' }, { status: 400 });
    let { data: conversation } = await supabase.from('conversations').select('id').eq('listing_id', listingId).eq('buyer_id', user.id).eq('seller_id', listing.owner_id).maybeSingle();
    if (!conversation) {
      const created = await supabase.from('conversations').insert({ listing_id: listingId, buyer_id: user.id, seller_id: listing.owner_id }).select('id').single();
      if (created.error && created.error.code !== '23505') return fail(created.error)!;
      conversation = created.data || (await supabase.from('conversations').select('id').eq('listing_id', listingId).eq('buyer_id', user.id).eq('seller_id', listing.owner_id).single()).data;
    }
    const { error } = await supabase.from('messages').insert({ conversation_id: conversation!.id, sender_id: user.id, body: message });
    return fail(error) || Response.json({ conversationId: conversation!.id });
  }
  if (body.operation === 'send_message') {
    const conversationId = Number(payload.conversationId); const message = typeof payload.message === 'string' ? payload.message.trim().slice(0, 2000) : '';
    if (!Number.isInteger(conversationId) || !message) return Response.json({ error: 'Invalid message' }, { status: 400 });
    const { error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: user.id, body: message });
    return fail(error) || Response.json({ ok: true });
  }
  if (body.operation === 'report_listing') {
    const listingId = Number(payload.listingId); const reason = typeof payload.reason === 'string' ? payload.reason : 'other'; const details = typeof payload.details === 'string' ? payload.details.slice(0, 1000) : '';
    if (!Number.isInteger(listingId) || !['fraud','incorrect_details','duplicate','offensive_content','other'].includes(reason)) return Response.json({ error: 'Invalid report' }, { status: 400 });
    const { error } = await supabase.from('listing_reports').insert({ listing_id: listingId, reporter_id: user.id, reason, details });
    return fail(error) || Response.json({ ok: true });
  }
  if (body.operation === 'seller_reviews') {
    const sellerId = typeof payload.sellerId === 'string' ? payload.sellerId : ''; const { data, error } = await supabase.from('seller_reviews').select('id,reviewer_id,rating,comment,created_at').eq('seller_id', sellerId).order('created_at', { ascending: false });
    return fail(error) || Response.json({ reviews: data || [] });
  }
  if (body.operation === 'seller_profile') {
    const sellerId = typeof payload.sellerId === 'string' ? payload.sellerId : '';
    const [profileResult, listingsResult, reviewsResult] = await Promise.all([
      supabase.from('profiles').select('id,display_name,phone,avatar_url,is_verified,role').eq('id', sellerId).single(),
      supabase.from('listings').select('id,slug,title,price,currency,make,model,year,mileage,images').eq('owner_id', sellerId).eq('status', 'published').order('created_at', { ascending: false }),
      supabase.from('seller_reviews').select('id,reviewer_id,rating,comment,created_at').eq('seller_id', sellerId).order('created_at', { ascending: false }),
    ]);
    return fail(profileResult.error || listingsResult.error || reviewsResult.error) || Response.json({ profile: profileResult.data, listings: listingsResult.data || [], reviews: reviewsResult.data || [] });
  }
  if (body.operation === 'save_review') {
    const sellerId = typeof payload.sellerId === 'string' ? payload.sellerId : ''; const rating = Number(payload.rating); const comment = typeof payload.comment === 'string' ? payload.comment.trim().slice(0, 2000) : '';
    if (!sellerId || !Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 10) return Response.json({ error: 'Invalid review' }, { status: 400 });
    const { error } = await supabase.from('seller_reviews').upsert({ reviewer_id: user.id, seller_id: sellerId, rating, comment }, { onConflict: 'reviewer_id,seller_id' });
    return fail(error) || Response.json({ ok: true });
  }
  if (body.operation === 'seller_listings') {
    const { data, error } = await supabase.from('listings').select('id,slug,title,price,currency,status,updated_at,images,make,model,year,mileage').eq('owner_id', user.id).order('updated_at', { ascending: false });
    return fail(error) || Response.json({ listings: data || [] });
  }
  if (body.operation === 'seller_listing') {
    const id = Number(payload.id);
    if (!Number.isInteger(id)) return Response.json({ error: 'Invalid listing id' }, { status: 400 });
    const { data, error } = await supabase.from('listings').select('*').eq('id', id).eq('owner_id', user.id).single();
    return fail(error) || Response.json({ listing: data });
  }
  if (body.operation === 'seller_dashboard') {
    const [profileResult, listingsResult, metricsResult] = await Promise.all([
      supabase.from('profiles').select('role,is_verified').eq('id', user.id).single(),
      supabase.from('listings').select('id,title,status,price,currency,updated_at').eq('owner_id', user.id).order('updated_at', { ascending: false }).limit(20),
      supabase.rpc('get_seller_listing_metrics'),
    ]);
    return fail(profileResult.error || listingsResult.error || metricsResult.error) || Response.json({ profile: profileResult.data, listings: listingsResult.data || [], metrics: metricsResult.data || [] });
  }
  if (body.operation === 'request_seller_verification') {
    const { data: profile } = await supabase.from('profiles').select('role,is_verified').eq('id', user.id).single();
    if (profile?.role !== 'seller' || profile.is_verified) return Response.json({ error: 'Solicitarea nu este disponibilă.' }, { status: 400 });
    const { error } = await supabase.from('verification_requests').insert({ user_id: user.id, kind: 'seller' });
    return fail(error) || Response.json({ ok: true });
  }
  if (body.operation === 'set_listing_status') {
    const id = Number(payload.id);
    const status = payload.status;
    if (!Number.isInteger(id) || id <= 0 || (status !== 'draft' && status !== 'published')) {
      return Response.json({ error: 'Status sau anunț invalid.' }, { status: 400 });
    }
    if (status === 'published') {
      const { data: listing, error } = await supabase.from('listings').select('*').eq('id', id).eq('owner_id', user.id).maybeSingle();
      if (error) return fail(error)!;
      if (!listing) return Response.json({ error: 'Anunțul nu există.' }, { status: 404 });
      const validation = validateListingForPublication(listing, user.id);
      if ('error' in validation) return Response.json(validation, { status: 400 });
      const coordinates = await geocodeListingLocation(validation.data.city, validation.data.county);
      const { data, error: updateError } = await supabase.from('listings').update({ status, latitude: coordinates?.latitude ?? null, longitude: coordinates?.longitude ?? null }).eq('id', id).eq('owner_id', user.id).select('id,slug,status').maybeSingle();
      if (data?.slug) await submitIndexNowBestEffort([listingCanonicalUrl(data.slug)]);
      return fail(updateError) || (data ? Response.json({ listing: data }) : Response.json({ error: 'Anunțul nu există.' }, { status: 404 }));
    }
    const { data, error } = await supabase.from('listings').update({ status }).eq('id', id).eq('owner_id', user.id).select('id,status').maybeSingle();
    return fail(error) || (data ? Response.json({ listing: data }) : Response.json({ error: 'Anunțul nu există.' }, { status: 404 }));
  }
  if (body.operation === 'delete_listing') {
    const id = Number(payload.id); const { error } = await supabase.from('listings').delete().eq('id', id).eq('owner_id', user.id);
    return fail(error) || Response.json({ ok: true });
  }
  if (body.operation === 'save_listing') {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'seller') return Response.json({ error: 'Doar vânzătorii pot salva anunțuri.' }, { status: 403 });
    const status = payload.status === 'draft' ? 'draft' : 'published';
    const validation = status === 'draft'
      ? validateListingDraft(payload, user.id)
      : validateListingForPublication(payload, user.id);
    if ('error' in validation) return Response.json(validation, { status: 400 });
    const vin = normalizeVin(payload.vin);
    if (payload.vin && !isValidVin(payload.vin)) return Response.json({ error: 'VIN-ul trebuie să aibă 17 caractere valide.' }, { status: 400 });
    const data = validation.data;
    const coordinates = status === 'published' && data.city && data.county
      ? await geocodeListingLocation(data.city, data.county)
      : null;
    const listing = {
      owner_id: user.id, title: data.title, description: data.description, price: data.price, currency: data.currency,
      make: data.make, model: data.model, year: data.year, mileage: data.mileage, fuel_type: data.fuelType,
      transmission: data.transmission, city: data.city, county: data.county, images: data.images, vin,
      body_type: typeof payload.body_type === 'string' ? payload.body_type.slice(0, 60) : null,
      owners: Number.isInteger(Number(payload.owners)) ? Number(payload.owners) : 1,
      service_history: payload.service_history === true, engine_size: Number.isInteger(Number(payload.engine_size)) ? Number(payload.engine_size) : null,
      power: Number.isInteger(Number(payload.power)) ? Number(payload.power) : null,
      doors: Number.isInteger(Number(payload.doors)) ? Number(payload.doors) : 4,
      seats: Number.isInteger(Number(payload.seats)) ? Number(payload.seats) : 5,
      features: Array.isArray(payload.features) ? payload.features.filter((item): item is string => typeof item === 'string').slice(0, 100) : [],
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
      status,
    };
    const id = Number(payload.id);
    const result = Number.isInteger(id) && id > 0
      ? await supabase.from('listings').update(listing).eq('id', id).eq('owner_id', user.id).select('id,slug,status').single()
      : await supabase.from('listings').insert({ ...listing, slug: generateUniqueSlug(data.make, data.model, data.year ?? new Date().getFullYear()) }).select('id,slug,status').single();
    if (result.data?.status === 'published' && result.data.slug) await submitIndexNowBestEffort([listingCanonicalUrl(result.data.slug)]);
    return fail(result.error) || Response.json({ listing: result.data });
  }
  return Response.json({ error: 'Unknown operation' }, { status: 400 });
}
