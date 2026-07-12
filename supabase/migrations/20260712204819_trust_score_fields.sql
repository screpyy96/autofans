-- Trust signals are explicit so the UI never implies an unverified check.
alter table public.listings
  add column if not exists vin text,
  add column if not exists vin_verified boolean not null default false,
  add column if not exists history_checked boolean not null default false;

create index if not exists idx_listings_vin on public.listings(vin) where vin is not null;
