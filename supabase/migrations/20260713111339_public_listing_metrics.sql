-- Expose only non-sensitive aggregate counters for a published listing page.
-- The underlying event rows remain protected by RLS; this function never
-- returns visitor, buyer, or favorite identity data.
create or replace function public.get_public_listing_metrics(p_listing_id bigint)
returns table (
  view_count bigint,
  contact_count bigint,
  favorite_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.listing_views v where v.listing_id = l.id) as view_count,
    (select count(*) from public.listing_contacts c where c.listing_id = l.id) as contact_count,
    (select count(*) from public.favorites f where f.listing_id = l.id) as favorite_count
  from public.listings l
  where l.id = p_listing_id
    and l.status = 'published';
$$;

revoke all on function public.get_public_listing_metrics(bigint) from public;
revoke all on function public.get_public_listing_metrics(bigint) from anon;
grant execute on function public.get_public_listing_metrics(bigint) to anon, authenticated;
