-- Aggregate only the authenticated seller's listings. This keeps other users'
-- favorite rows private while still exposing the counts sellers need.
create or replace function public.get_seller_listing_metrics()
returns table (
  listing_id bigint,
  view_count bigint,
  contact_count bigint,
  favorite_count bigint
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    l.id as listing_id,
    (select count(*) from public.listing_views v where v.listing_id = l.id) as view_count,
    (select count(*) from public.listing_contacts c where c.listing_id = l.id) as contact_count,
    (select count(*) from public.favorites f where f.listing_id = l.id) as favorite_count
  from public.listings l
  where l.owner_id = auth.uid();
$$;

revoke all on function public.get_seller_listing_metrics() from public;
revoke all on function public.get_seller_listing_metrics() from anon;
grant execute on function public.get_seller_listing_metrics() to authenticated;
