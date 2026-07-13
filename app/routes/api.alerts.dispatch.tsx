import type { ActionFunctionArgs } from 'react-router';
import { createClient } from '@supabase/supabase-js';
import { getServerEnv } from '~/lib/env.server';
import { matchesSavedSearch } from '~/utils/savedSearchMatcher';
import type { FilterState } from '~/types';

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] || character));

async function sendWithResend(input: { id: number; to: string; title: string; body: string; actionUrl: string }) {
  const apiKey = getServerEnv('RESEND_API_KEY');
  const from = getServerEnv('RESEND_FROM');
  if (!apiKey || !from) return { skipped: true };

  const siteUrl = (getServerEnv('APP_URL') || 'https://autofans.ro').replace(/\/$/, '');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `autofans-alert-${input.id}`,
      'User-Agent': 'AutoFans/1.0',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.title,
      html: `<main style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px"><h1 style="color:#0f172a">${escapeHtml(input.title)}</h1><p>${escapeHtml(input.body)}</p><p><a href="${siteUrl}${input.actionUrl}" style="display:inline-block;padding:12px 18px;background:#d4af37;color:#0f172a;border-radius:8px;text-decoration:none;font-weight:bold">Vezi anunțul</a></p></main>`,
      text: `${input.title}\n\n${input.body}\n\n${siteUrl}${input.actionUrl}`,
    }),
  });
  if (!response.ok) throw new Error(`Resend failed with ${response.status}`);
  return { id: (await response.json() as { id?: string }).id };
}

export async function action({ request }: ActionFunctionArgs) {
  const cronSecret = getServerEnv('ALERTS_CRON_SECRET');
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = getServerEnv('VITE_SUPABASE_URL') || getServerEnv('SUPABASE_URL');
  const serviceRole = getServerEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRole) return Response.json({ error: 'Missing server configuration' }, { status: 503 });
  const supabase = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: searches, error: searchesError } = await supabase
    .from('saved_searches')
    .select('id, user_id, name, query, last_checked_at, email_alerts_enabled')
    .eq('alerts_enabled', true);
  if (searchesError) return Response.json({ error: searchesError.message }, { status: 500 });

  let created = 0;
  for (const search of searches || []) {
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, slug, title, make, model, description, price, year, mileage, fuel_type, transmission, city, county, latitude, longitude, images, service_history, owners')
      .eq('status', 'published')
      .gt('created_at', search.last_checked_at)
      .order('created_at', { ascending: true })
      .limit(100);
    if (listingsError) continue;

    const matching = (listings || []).filter((listing) => matchesSavedSearch(listing, (search.query || {}) as FilterState));
    if (matching.length) {
      const { error } = await supabase.from('alert_notifications').upsert(matching.map((listing) => ({
        user_id: search.user_id,
        saved_search_id: search.id,
        listing_id: listing.id,
        kind: 'new_listing',
        title: `Anunț nou pentru „${search.name || 'căutarea ta'}”`,
        body: `${listing.title || `${listing.make || ''} ${listing.model || ''}`.trim()} este disponibil în ${listing.city || 'România'}.`,
        action_url: `/car/${listing.slug || listing.id}`,
        email_enabled: search.email_alerts_enabled,
      })), { onConflict: 'saved_search_id,listing_id,kind', ignoreDuplicates: true });
      if (!error) created += matching.length;
    }
    const { data: priceChanges } = await supabase
      .from('listing_price_history')
      .select('listing_id, previous_price, new_price, listings!inner(id, slug, title, make, model, description, price, year, mileage, fuel_type, transmission, city, county, latitude, longitude, images, service_history, owners, status)')
      .gt('changed_at', search.last_checked_at)
      .limit(100);
    const priceDrops = (priceChanges || []).filter((change: any) =>
      Number(change.new_price) < Number(change.previous_price) &&
      change.listings?.status === 'published' &&
      matchesSavedSearch(change.listings, (search.query || {}) as FilterState),
    );
    if (priceDrops.length) {
      const { error } = await supabase.from('alert_notifications').upsert(priceDrops.map((change: any) => ({
        user_id: search.user_id,
        saved_search_id: search.id,
        listing_id: change.listing_id,
        kind: 'price_drop',
        title: `Preț redus pentru „${search.name || 'căutarea ta'}”`,
        body: `${change.listings.title || `${change.listings.make || ''} ${change.listings.model || ''}`.trim()} a scăzut de la ${change.previous_price} la ${change.new_price}.`,
        action_url: `/car/${change.listings.slug || change.listing_id}`,
        email_enabled: search.email_alerts_enabled,
      })), { onConflict: 'saved_search_id,listing_id,kind', ignoreDuplicates: true });
      if (!error) created += priceDrops.length;
    }
    await supabase.from('saved_searches').update({ last_checked_at: new Date().toISOString() }).eq('id', search.id);
  }

  const { data: pending } = await supabase
    .from('alert_notifications')
    .select('id, title, body, action_url, profiles!inner(email)')
    .is('email_sent_at', null)
    .eq('email_enabled', true)
    .order('created_at', { ascending: true })
    .limit(50);

  let emailSent = 0;
  for (const notification of pending || []) {
    const email = (notification as any).profiles?.email;
    if (!email) continue;
    try {
      const result = await sendWithResend({ id: notification.id, to: email, title: notification.title, body: notification.body, actionUrl: notification.action_url });
      if (!result.skipped) {
        await supabase.from('alert_notifications').update({ email_sent_at: new Date().toISOString(), resend_email_id: result.id || null }).eq('id', notification.id);
        emailSent += 1;
      }
    } catch (error) {
      console.error(`Could not send alert ${notification.id}:`, error);
    }
  }

  return Response.json({ created, emailSent, resendConfigured: Boolean(getServerEnv('RESEND_API_KEY') && getServerEnv('RESEND_FROM')) });
}
