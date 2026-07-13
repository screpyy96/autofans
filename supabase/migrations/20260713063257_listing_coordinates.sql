-- City-level coordinates power map results and radius search without storing
-- a seller's exact address.
alter table public.listings
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.listings
  drop constraint if exists listings_latitude_range,
  drop constraint if exists listings_longitude_range;

alter table public.listings
  add constraint listings_latitude_range check (latitude is null or latitude between -90 and 90),
  add constraint listings_longitude_range check (longitude is null or longitude between -180 and 180);

create index if not exists listings_published_coordinates_idx
  on public.listings (latitude, longitude)
  where status = 'published' and latitude is not null and longitude is not null;
