-- Aggregated public inventory data for local SEO routes. The underlying table
-- already applies RLS, so draft listings and seller-private inventory never
-- contribute to a public county or city page.
create index if not exists idx_listings_published_county_city_recent
  on public.listings (county, city, created_at desc, id desc)
  where status = 'published';

create or replace function public.get_public_inventory_location_stats()
returns table (county text, city text, listing_count bigint)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    trim(l.county) as county,
    trim(l.city) as city,
    count(*)::bigint as listing_count
  from public.listings l
  where l.status = 'published'
    and nullif(trim(l.county), '') is not null
    and nullif(trim(l.city), '') is not null
  group by trim(l.county), trim(l.city)
  order by listing_count desc, county asc, city asc;
$$;

revoke all on function public.get_public_inventory_location_stats() from public;
grant execute on function public.get_public_inventory_location_stats() to anon, authenticated;
