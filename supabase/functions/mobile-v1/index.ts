import { createClient } from "npm:@supabase/supabase-js@2";

type Payload = Record<string, unknown>;
type RequestBody = { operation?: string; payload?: Payload };

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };
const INDEXNOW_KEY = "92fab1be29134b3a9cfbfb55437c9dfb";
const SITE_ORIGIN = "https://www.autofans.ro";
const FUEL_TYPES = new Set(["petrol", "diesel", "hybrid", "electric", "lpg", "cng"]);
const TRANSMISSIONS = new Set(["manual", "automatic", "semi_automatic", "cvt"]);
const CURRENCIES = new Set(["EUR", "RON"]);
const CITY_CENTERS: Record<string, [number, number]> = {
  bucuresti: [26.1025, 44.4268], clujnapoca: [23.5947, 46.7712], iasi: [27.6014, 47.1585],
  timisoara: [21.2087, 45.7489], constanta: [28.6348, 44.1598], brasov: [25.6012, 45.6579],
};

const respond = (body: unknown, status = 200) => Response.json(body, { status, headers: JSON_HEADERS });
const cleanText = (value: unknown, maxLength: number) => typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
const finiteNumber = (value: unknown) => {
  const valueAsNumber = typeof value === "number" ? value : Number(value);
  return Number.isFinite(valueAsNumber) ? valueAsNumber : null;
};

function normalizeLocationName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fallbackCoordinates(city: string): { latitude: number; longitude: number } | null {
  const coordinates = CITY_CENTERS[normalizeLocationName(city)];
  return coordinates ? { longitude: coordinates[0], latitude: coordinates[1] } : null;
}

async function geocodeListingLocation(city: string, county: string) {
  const fallback = fallbackCoordinates(city);
  const token = Deno.env.get("MAPBOX_TOKEN");
  if (!token || !city.trim()) return fallback;
  try {
    const query = encodeURIComponent(`${city}, ${county || "Romania"}, Romania`);
    const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?q=${query}&country=ro&types=place,locality&limit=1&access_token=${encodeURIComponent(token)}`, { signal: AbortSignal.timeout(4_000) });
    if (response.ok) {
      const data = await response.json() as { features?: Array<{ geometry?: { coordinates?: [number, number] } }> };
      const [longitude, latitude] = data.features?.[0]?.geometry?.coordinates || [];
      if (typeof latitude === "number" && typeof longitude === "number" && Number.isFinite(latitude) && Number.isFinite(longitude)) return { latitude, longitude };
    }
  } catch (error) {
    console.warn("Mobile listing geocoding unavailable", error);
  }
  return fallback;
}

function normalizeVin(value: unknown): string | null {
  const normalized = String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return normalized || null;
}

function isValidVin(value: unknown) {
  const vin = normalizeVin(value);
  return vin !== null && /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
}

function generateUniqueSlug(make: string, model: string, year: number) {
  const base = `${make}-${model}-${year}`.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return `${base}-${crypto.randomUUID().replace(/-/g, "").slice(0, 6)}`;
}

type ListingImage = { path: string; isMain: boolean };
function validateImages(input: Payload, ownerId: string, required: boolean): { data: ListingImage[] } | { error: string } {
  const rawImages = Array.isArray(input.images) ? input.images : [];
  if (required && rawImages.length === 0) return { error: "Adaugă cel puțin o imagine a mașinii." };
  if (rawImages.length > 15) return { error: "Poți publica cel mult 15 imagini." };
  const seen = new Set<string>();
  const images: ListingImage[] = [];
  for (const rawImage of rawImages) {
    const path = cleanText((rawImage as { path?: unknown })?.path, 300);
    if (!path || !path.startsWith(`${ownerId}/`) || seen.has(path)) return { error: "Una sau mai multe imagini nu îți aparțin sau nu sunt valide." };
    seen.add(path); images.push({ path, isMain: false });
  }
  if (images.length) images[0].isMain = true;
  return { data: images };
}

function validateListing(input: Payload, ownerId: string, draft: boolean) {
  const images = validateImages(input, ownerId, !draft);
  if ("error" in images) return images;
  const year = finiteNumber(input.year), mileage = finiteNumber(input.mileage), price = finiteNumber(input.price);
  const fuelType = cleanText(input.fuel_type, 30), transmission = cleanText(input.transmission, 30);
  const currency = cleanText(input.currency || "EUR", 3).toUpperCase();
  const title = cleanText(input.title, 150), description = typeof input.description === "string" ? input.description.trim().slice(0, 5_000) : "";
  const make = cleanText(input.make, 60), model = cleanText(input.model, 80), city = cleanText(input.city, 100), county = cleanText(input.county, 100);
  const currentYear = new Date().getFullYear();
  if (!draft) {
    if (title.length < 8) return { error: "Titlul trebuie să aibă cel puțin 8 caractere." };
    if (description.length < 50) return { error: "Descrierea trebuie să aibă cel puțin 50 de caractere." };
    if (!make || !model) return { error: "Marca și modelul sunt obligatorii." };
    if (year === null || !Number.isInteger(year) || year < 1950 || year > currentYear + 1) return { error: "Anul fabricației nu este valid." };
    if (mileage === null || !Number.isInteger(mileage) || mileage < 0 || mileage > 2_500_000) return { error: "Kilometrajul nu este valid." };
    if (price === null || price <= 0 || price > 100_000_000) return { error: "Prețul nu este valid." };
    if (!FUEL_TYPES.has(fuelType) || !TRANSMISSIONS.has(transmission)) return { error: "Combustibilul sau transmisia nu sunt valide." };
    if (!CURRENCIES.has(currency)) return { error: "Moneda selectată nu este disponibilă." };
    if (city.length < 2 || county.length < 2) return { error: "Orașul și județul sunt obligatorii." };
  }
  return { data: {
    title: title || "Anunț în lucru", description, price: price !== null && price >= 0 ? price : 0,
    currency: CURRENCIES.has(currency) ? currency : "EUR", make: make || "Necunoscută", model: model || "Nespecificat",
    year: year !== null && Number.isInteger(year) && year >= 1950 && year <= currentYear + 1 ? year : null,
    mileage: mileage !== null && Number.isInteger(mileage) && mileage >= 0 ? mileage : null,
    fuelType: FUEL_TYPES.has(fuelType) ? fuelType : null, transmission: TRANSMISSIONS.has(transmission) ? transmission : null,
    city: city || null, county: county || null, images: images.data,
  } };
}

async function submitIndexNowBestEffort(slug: string) {
  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST", headers: JSON_HEADERS,
      body: JSON.stringify({ host: "www.autofans.ro", key: INDEXNOW_KEY, keyLocation: `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`, urlList: [`${SITE_ORIGIN}/car/${encodeURIComponent(slug)}`] }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch (error) { console.warn("IndexNow submission failed", error); }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "POST") return respond({ error: "Method not allowed" }, 405);
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return respond({ error: "Authentication required" }, 401);
  const url = Deno.env.get("SUPABASE_URL"), anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) return respond({ error: "Supabase function is not configured" }, 500);
  let body: RequestBody;
  try { body = await request.json(); } catch { return respond({ error: "Invalid JSON" }, 400); }
  const supabase = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return respond({ error: "Authentication required" }, 401);
  const payload = body.payload || {};
  const fail = (error: { message: string } | null | undefined) => error ? respond({ error: error.message }, 400) : null;

  try {
    switch (body.operation) {
      case "account": {
        const { data: profile, error } = await supabase.from("profiles").select("id,email,display_name,phone,avatar_url,role,is_verified").eq("id", user.id).single();
        if (error) return fail(error)!;
        const { data: pendingRequest, error: requestError } = profile?.role === "seller" && !profile.is_verified
          ? await supabase.from("verification_requests").select("id").eq("user_id", user.id).eq("kind", "seller").eq("status", "pending").maybeSingle()
          : { data: null, error: null };
        return fail(requestError) || respond({ profile, sellerVerificationPending: Boolean(pendingRequest) });
      }
      case "update_profile": {
        const update = { display_name: typeof payload.displayName === "string" ? payload.displayName.slice(0, 120) : null, phone: typeof payload.phone === "string" ? payload.phone.slice(0, 40) : null, avatar_url: typeof payload.avatarUrl === "string" ? payload.avatarUrl.slice(0, 2_000) : null };
        const { data, error } = await supabase.from("profiles").update(update).eq("id", user.id).select("id,email,display_name,phone,avatar_url,role,is_verified").single(); return fail(error) || respond({ profile: data });
      }
      case "favorites": { const { data, error } = await supabase.from("favorites").select("listing_id,created_at,listings(id,slug,title,price,currency,make,model,year,mileage,fuel_type,transmission,city,county,images)").eq("user_id", user.id).order("created_at", { ascending: false }); return fail(error) || respond({ favorites: data || [] }); }
      case "toggle_favorite": {
        const listingId = Number(payload.listingId); if (!Number.isInteger(listingId)) return respond({ error: "Invalid listing id" }, 400);
        const { data: existing } = await supabase.from("favorites").select("listing_id").eq("user_id", user.id).eq("listing_id", listingId).maybeSingle();
        const result = existing ? await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", listingId) : await supabase.from("favorites").insert({ user_id: user.id, listing_id: listingId });
        return fail(result.error) || respond({ favorite: !existing });
      }
      case "saved_searches": { const { data, error } = await supabase.from("saved_searches").select("id,name,query,created_at,last_checked_at").eq("user_id", user.id).order("created_at", { ascending: false }); return fail(error) || respond({ searches: data || [] }); }
      case "save_search": {
        const name = typeof payload.name === "string" ? payload.name.trim().slice(0, 100) : ""; if (!name || !payload.query || typeof payload.query !== "object") return respond({ error: "Invalid search" }, 400);
        const { data, error } = await supabase.from("saved_searches").insert({ user_id: user.id, name, query: payload.query }).select().single(); return fail(error) || respond({ search: data });
      }
      case "delete_saved_search": { const { error } = await supabase.from("saved_searches").delete().eq("id", Number(payload.id)).eq("user_id", user.id); return fail(error) || respond({ ok: true }); }
      case "update_saved_search": {
        const id = Number(payload.id), name = typeof payload.name === "string" ? payload.name.trim().slice(0, 100) : ""; if (!Number.isInteger(id) || id <= 0 || !name) return respond({ error: "Căutare invalidă." }, 400);
        const { data, error } = await supabase.from("saved_searches").update({ name }).eq("id", id).eq("user_id", user.id).select("id,name,query,created_at,last_checked_at").maybeSingle(); return fail(error) || (data ? respond({ search: data }) : respond({ error: "Căutarea nu există." }, 404));
      }
      case "notifications": { const { data, error } = await supabase.from("alert_notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100); return fail(error) || respond({ notifications: data || [] }); }
      case "read_notification": { const { error } = await supabase.from("alert_notifications").update({ read_at: new Date().toISOString() }).eq("id", Number(payload.id)).eq("user_id", user.id); return fail(error) || respond({ ok: true }); }
      case "promote_seller": { const { error } = await supabase.rpc("promote_to_seller"); return fail(error) || respond({ ok: true }); }
      case "conversations": {
        const { data, error } = await supabase.from("conversations").select("id,listing_id,buyer_id,seller_id,created_at,updated_at").or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order("updated_at", { ascending: false });
        if (error) return fail(error)!;
        const conversations = data || [];
        const listingIds = [...new Set(conversations.map((conversation) => conversation.listing_id))];
        const counterpartIds = [...new Set(conversations.map((conversation) => conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id))];
        const conversationIds = conversations.map((conversation) => conversation.id);
        const [listingsResult, profilesResult, messagesResult] = await Promise.all([
          listingIds.length ? supabase.from("listings").select("id,slug,title,make,model,year,images").in("id", listingIds) : Promise.resolve({ data: [], error: null }),
          counterpartIds.length ? supabase.from("profiles").select("id,display_name,email,avatar_url").in("id", counterpartIds) : Promise.resolve({ data: [], error: null }),
          conversationIds.length ? supabase.from("messages").select("conversation_id,body,created_at,sender_id").in("conversation_id", conversationIds).order("created_at", { ascending: false }).limit(200) : Promise.resolve({ data: [], error: null }),
        ]);
        if (listingsResult.error || profilesResult.error || messagesResult.error) return fail(listingsResult.error || profilesResult.error || messagesResult.error)!;
        const listingById = new Map((listingsResult.data || []).map((listing) => [listing.id, listing]));
        const profileById = new Map((profilesResult.data || []).map((profile) => [profile.id, profile]));
        const lastMessageByConversation = new Map<number, unknown>();
        for (const message of messagesResult.data || []) if (!lastMessageByConversation.has(message.conversation_id)) lastMessageByConversation.set(message.conversation_id, message);
        return respond({ conversations: conversations.map((conversation) => ({
          ...conversation,
          listing: listingById.get(conversation.listing_id) || null,
          counterpart: profileById.get(conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id) || null,
          last_message: lastMessageByConversation.get(conversation.id) || null,
        })) });
      }
      case "messages": { const { data, error } = await supabase.from("messages").select("id,conversation_id,sender_id,body,created_at,read_at").eq("conversation_id", Number(payload.conversationId)).order("created_at", { ascending: true }).limit(200); return fail(error) || respond({ messages: data || [] }); }
      case "start_conversation": {
        const listingId = Number(payload.listingId), message = typeof payload.message === "string" ? payload.message.trim().slice(0, 2_000) : ""; if (!Number.isInteger(listingId) || !message) return respond({ error: "Invalid conversation" }, 400);
        const { data: listing } = await supabase.from("listings").select("id,owner_id").eq("id", listingId).eq("status", "published").maybeSingle(); if (!listing || listing.owner_id === user.id) return respond({ error: "Listing unavailable" }, 400);
        let { data: conversation } = await supabase.from("conversations").select("id").eq("listing_id", listingId).eq("buyer_id", user.id).eq("seller_id", listing.owner_id).maybeSingle();
        if (!conversation) { const created = await supabase.from("conversations").insert({ listing_id: listingId, buyer_id: user.id, seller_id: listing.owner_id }).select("id").single(); if (created.error && created.error.code !== "23505") return fail(created.error)!; conversation = created.data || (await supabase.from("conversations").select("id").eq("listing_id", listingId).eq("buyer_id", user.id).eq("seller_id", listing.owner_id).single()).data; }
        const { error } = await supabase.from("messages").insert({ conversation_id: conversation!.id, sender_id: user.id, body: message }); return fail(error) || respond({ conversationId: conversation!.id });
      }
      case "send_message": { const id = Number(payload.conversationId), message = typeof payload.message === "string" ? payload.message.trim().slice(0, 2_000) : ""; if (!Number.isInteger(id) || !message) return respond({ error: "Invalid message" }, 400); const { error } = await supabase.from("messages").insert({ conversation_id: id, sender_id: user.id, body: message }); return fail(error) || respond({ ok: true }); }
      case "report_listing": {
        const listingId = Number(payload.listingId), reason = typeof payload.reason === "string" ? payload.reason : "other", details = typeof payload.details === "string" ? payload.details.slice(0, 1_000) : ""; if (!Number.isInteger(listingId) || !["fraud", "incorrect_details", "duplicate", "offensive_content", "other"].includes(reason)) return respond({ error: "Invalid report" }, 400);
        const { error } = await supabase.from("listing_reports").insert({ listing_id: listingId, reporter_id: user.id, reason, details }); return fail(error) || respond({ ok: true });
      }
      case "seller_reviews": { const sellerId = typeof payload.sellerId === "string" ? payload.sellerId : ""; const { data, error } = await supabase.from("seller_reviews").select("id,reviewer_id,rating,comment,created_at").eq("seller_id", sellerId).order("created_at", { ascending: false }); return fail(error) || respond({ reviews: data || [] }); }
      case "seller_profile": {
        const sellerId = typeof payload.sellerId === "string" ? payload.sellerId : "";
        const [profileResult, listingsResult, reviewsResult] = await Promise.all([supabase.from("profiles").select("id,display_name,phone,avatar_url,is_verified,role").eq("id", sellerId).single(), supabase.from("listings").select("id,slug,title,price,currency,make,model,year,mileage,images").eq("owner_id", sellerId).eq("status", "published").order("created_at", { ascending: false }), supabase.from("seller_reviews").select("id,reviewer_id,rating,comment,created_at").eq("seller_id", sellerId).order("created_at", { ascending: false })]);
        return fail(profileResult.error || listingsResult.error || reviewsResult.error) || respond({ profile: profileResult.data, listings: listingsResult.data || [], reviews: reviewsResult.data || [] });
      }
      case "save_review": {
        const sellerId = typeof payload.sellerId === "string" ? payload.sellerId : "", rating = Number(payload.rating), comment = typeof payload.comment === "string" ? payload.comment.trim().slice(0, 2_000) : ""; if (!sellerId || !Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 10) return respond({ error: "Invalid review" }, 400);
        const { error } = await supabase.from("seller_reviews").upsert({ reviewer_id: user.id, seller_id: sellerId, rating, comment }, { onConflict: "reviewer_id,seller_id" }); return fail(error) || respond({ ok: true });
      }
      case "seller_listings": { const { data, error } = await supabase.from("listings").select("id,slug,title,price,currency,status,updated_at,images,make,model,year,mileage").eq("owner_id", user.id).order("updated_at", { ascending: false }); return fail(error) || respond({ listings: data || [] }); }
      case "seller_listing": { const id = Number(payload.id); if (!Number.isInteger(id)) return respond({ error: "Invalid listing id" }, 400); const { data, error } = await supabase.from("listings").select("*").eq("id", id).eq("owner_id", user.id).single(); return fail(error) || respond({ listing: data }); }
      case "seller_dashboard": {
        const [profileResult, listingsResult, metricsResult] = await Promise.all([supabase.from("profiles").select("role,is_verified").eq("id", user.id).single(), supabase.from("listings").select("id,title,status,price,currency,updated_at").eq("owner_id", user.id).order("updated_at", { ascending: false }).limit(20), supabase.rpc("get_seller_listing_metrics")]);
        return fail(profileResult.error || listingsResult.error || metricsResult.error) || respond({ profile: profileResult.data, listings: listingsResult.data || [], metrics: metricsResult.data || [] });
      }
      case "request_seller_verification": {
        const { data: profile, error: profileError } = await supabase.from("profiles").select("role,is_verified").eq("id", user.id).single();
        if (profileError) return fail(profileError)!;
        if (profile?.role !== "seller" || profile.is_verified) return respond({ error: "Solicitarea nu este disponibilă." }, 400);
        const { data: existing, error: existingError } = await supabase.from("verification_requests").select("id").eq("user_id", user.id).eq("kind", "seller").eq("status", "pending").maybeSingle();
        if (existingError) return fail(existingError)!;
        if (existing) return respond({ ok: true, pending: true, message: "Ai deja o solicitare de verificare în analiză." });
        const { error } = await supabase.from("verification_requests").insert({ user_id: user.id, kind: "seller" });
        if (error?.code === "23505") return respond({ ok: true, pending: true, message: "Ai deja o solicitare de verificare în analiză." });
        return fail(error) || respond({ ok: true, pending: true, message: "Solicitarea de verificare a fost trimisă." });
      }
      case "set_listing_status": {
        const id = Number(payload.id), status = payload.status; if (!Number.isInteger(id) || id <= 0 || (status !== "draft" && status !== "published")) return respond({ error: "Status sau anunț invalid." }, 400);
        if (status === "published") {
          const { data: listing, error } = await supabase.from("listings").select("*").eq("id", id).eq("owner_id", user.id).maybeSingle(); if (error) return fail(error)!; if (!listing) return respond({ error: "Anunțul nu există." }, 404);
          const validation = validateListing(listing, user.id, false); if ("error" in validation) return respond(validation, 400);
          const coordinates = await geocodeListingLocation(validation.data.city!, validation.data.county!); const { data, error: updateError } = await supabase.from("listings").update({ status, latitude: coordinates?.latitude ?? null, longitude: coordinates?.longitude ?? null }).eq("id", id).eq("owner_id", user.id).select("id,slug,status").maybeSingle(); if (data?.slug) await submitIndexNowBestEffort(data.slug); return fail(updateError) || (data ? respond({ listing: data }) : respond({ error: "Anunțul nu există." }, 404));
        }
        const { data, error } = await supabase.from("listings").update({ status }).eq("id", id).eq("owner_id", user.id).select("id,status").maybeSingle(); return fail(error) || (data ? respond({ listing: data }) : respond({ error: "Anunțul nu există." }, 404));
      }
      case "delete_listing": { const { error } = await supabase.from("listings").delete().eq("id", Number(payload.id)).eq("owner_id", user.id); return fail(error) || respond({ ok: true }); }
      case "save_listing": {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(); if (profile?.role !== "seller") return respond({ error: "Doar vânzătorii pot salva anunțuri." }, 403);
        const status = payload.status === "draft" ? "draft" : "published", validation = validateListing(payload, user.id, status === "draft"); if ("error" in validation) return respond(validation, 400);
        const vin = normalizeVin(payload.vin); if (payload.vin && !isValidVin(payload.vin)) return respond({ error: "VIN-ul trebuie să aibă 17 caractere valide." }, 400);
        const data = validation.data, coordinates = status === "published" && data.city && data.county ? await geocodeListingLocation(data.city, data.county) : null;
        const listing = { owner_id: user.id, title: data.title, description: data.description, price: data.price, currency: data.currency, make: data.make, model: data.model, year: data.year, mileage: data.mileage, fuel_type: data.fuelType, transmission: data.transmission, city: data.city, county: data.county, images: data.images, vin, body_type: typeof payload.body_type === "string" ? payload.body_type.slice(0, 60) : null, owners: Number.isInteger(Number(payload.owners)) ? Number(payload.owners) : 1, service_history: payload.service_history === true, engine_size: Number.isInteger(Number(payload.engine_size)) ? Number(payload.engine_size) : null, power: Number.isInteger(Number(payload.power)) ? Number(payload.power) : null, doors: Number.isInteger(Number(payload.doors)) ? Number(payload.doors) : 4, seats: Number.isInteger(Number(payload.seats)) ? Number(payload.seats) : 5, features: Array.isArray(payload.features) ? payload.features.filter((item): item is string => typeof item === "string").slice(0, 100) : [], latitude: coordinates?.latitude ?? null, longitude: coordinates?.longitude ?? null, status };
        const id = Number(payload.id); const result = Number.isInteger(id) && id > 0 ? await supabase.from("listings").update(listing).eq("id", id).eq("owner_id", user.id).select("id,slug,status").single() : await supabase.from("listings").insert({ ...listing, slug: generateUniqueSlug(data.make, data.model, data.year ?? new Date().getFullYear()) }).select("id,slug,status").single(); if (result.data?.status === "published" && result.data.slug) await submitIndexNowBestEffort(result.data.slug); return fail(result.error) || respond({ listing: result.data });
      }
      default: return respond({ error: "Unknown operation" }, 400);
    }
  } catch (error) {
    console.error("mobile-v1 failed", error);
    return respond({ error: "Cererea nu a putut fi procesată." }, 500);
  }
});
