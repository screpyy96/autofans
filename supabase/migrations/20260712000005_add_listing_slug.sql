-- Add slug column to listings
alter table public.listings
  add column if not exists slug text;

-- Backfill slug for existing listings
update public.listings
set slug = lower(
  regexp_replace(
    make || '-' || model || '-' || year::text || '-' || substring(encode(gen_random_bytes(3), 'hex'), 1, 6),
    '[^a-zA-Z0-9]+',
    '-',
    'g'
  )
)
where slug is null;

-- Make slug unique and not null
alter table public.listings
  alter column slug set not null,
  add constraint listings_slug_key unique (slug);
