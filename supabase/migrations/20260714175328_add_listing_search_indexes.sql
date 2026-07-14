-- Search must remain fast when the catalogue grows: all public listing queries
-- begin with status='published', then use one of these filter/sort paths.
create index if not exists idx_listings_published_recent
  on public.listings (created_at desc, id desc)
  where status = 'published';

create index if not exists idx_listings_published_make_model_recent
  on public.listings (make, model, created_at desc, id desc)
  where status = 'published';

create index if not exists idx_listings_published_price
  on public.listings (price asc, id desc)
  where status = 'published';

create index if not exists idx_listings_published_city_recent
  on public.listings (city, created_at desc, id desc)
  where status = 'published';

-- A stored search document lets Postgres use a GIN index for free-text search
-- across the public listing fields, instead of returning the full catalogue to
-- the browser for filtering.
alter table public.listings
  add column if not exists search_document tsvector
  generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(make, '') || ' ' ||
      coalesce(model, '') || ' ' ||
      coalesce(description, '')
    )
  ) stored;

create index if not exists idx_listings_search_document
  on public.listings using gin (search_document)
  where status = 'published';

-- Keep filtering, radius checks, ordering and pagination in Postgres. This
-- function uses the caller's RLS context (security invoker is the default), so
-- it cannot reveal draft listings or private seller data through the API.
create or replace function public.search_published_listings(
  p_query text default null,
  p_brands text[] default null,
  p_models text[] default null,
  p_price_min numeric default null,
  p_price_max numeric default null,
  p_year_min integer default null,
  p_year_max integer default null,
  p_mileage_min integer default null,
  p_mileage_max integer default null,
  p_fuel_types text[] default null,
  p_transmissions text[] default null,
  p_city text default null,
  p_county text default null,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_radius_km integer default null,
  p_service_history boolean default null,
  p_max_owners integer default null,
  p_sort text default 'relevance'
)
returns setof public.listings
language sql
stable
set search_path = public, pg_temp
as $$
  select l.*
  from public.listings l
  where l.status = 'published'
    and (p_query is null or l.search_document @@ websearch_to_tsquery('simple', p_query))
    and (p_brands is null or l.make = any(p_brands))
    and (p_models is null or l.model = any(p_models))
    and (p_price_min is null or l.price >= p_price_min)
    and (p_price_max is null or l.price <= p_price_max)
    and (p_year_min is null or l.year >= p_year_min)
    and (p_year_max is null or l.year <= p_year_max)
    and (p_mileage_min is null or l.mileage >= p_mileage_min)
    and (p_mileage_max is null or l.mileage <= p_mileage_max)
    and (p_fuel_types is null or l.fuel_type = any(p_fuel_types))
    and (p_transmissions is null or l.transmission = any(p_transmissions))
    and (p_service_history is null or l.service_history = p_service_history)
    and (p_max_owners is null or l.owners <= p_max_owners)
    and (
      p_city is null
      or (
        p_radius_km is null
        and (lower(l.city) = lower(p_city) or lower(l.county) = lower(coalesce(p_county, '')))
      )
      or (
        p_radius_km is not null
        and p_latitude is not null
        and p_longitude is not null
        and l.latitude is not null
        and l.longitude is not null
        and 6371 * 2 * asin(sqrt(
          power(sin(radians(l.latitude - p_latitude) / 2), 2)
          + cos(radians(p_latitude)) * cos(radians(l.latitude))
          * power(sin(radians(l.longitude - p_longitude) / 2), 2)
        )) <= p_radius_km
      )
    )
  order by
    case when p_sort in ('relevance', 'date_desc') then l.created_at end desc nulls last,
    case when p_sort = 'date_asc' then l.created_at end asc nulls last,
    case when p_sort = 'price_asc' then l.price end asc nulls last,
    case when p_sort = 'price_desc' then l.price end desc nulls last,
    case when p_sort = 'year_asc' then l.year end asc nulls last,
    case when p_sort = 'year_desc' then l.year end desc nulls last,
    case when p_sort = 'mileage_asc' then l.mileage end asc nulls last,
    case when p_sort = 'mileage_desc' then l.mileage end desc nulls last,
    l.id desc;
$$;

revoke all on function public.search_published_listings(
  text, text[], text[], numeric, numeric, integer, integer, integer, integer,
  text[], text[], text, text, double precision, double precision, integer,
  boolean, integer, text
) from public;
grant execute on function public.search_published_listings(
  text, text[], text[], numeric, numeric, integer, integer, integer, integer,
  text[], text[], text, text, double precision, double precision, integer,
  boolean, integer, text
) to anon, authenticated;
