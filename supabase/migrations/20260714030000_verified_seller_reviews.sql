-- Seller ratings must represent a real buyer/seller interaction. The UI also
-- enforces this, but RLS is the authoritative protection against direct API
-- calls from an authenticated account.
drop policy if exists "insert reviews for authenticated" on public.seller_reviews;

create policy "buyers can review sellers they contacted"
on public.seller_reviews for insert to authenticated
with check (
  reviewer_id = (select auth.uid())
  and reviewer_id <> seller_id
  and exists (
    select 1
    from public.conversations c
    where c.buyer_id = (select auth.uid())
      and c.seller_id = seller_reviews.seller_id
  )
);
