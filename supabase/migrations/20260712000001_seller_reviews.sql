-- ===== Seller Reviews =====
create table if not exists public.seller_reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null check (length(comment) >= 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_not_self_review check (reviewer_id <> seller_id),
  unique (reviewer_id, seller_id)
);

-- Enable RLS
alter table public.seller_reviews enable row level security;

-- Policies
drop policy if exists "read reviews for all" on public.seller_reviews;
create policy "read reviews for all"
on public.seller_reviews for select
using (true);

drop policy if exists "insert reviews for authenticated" on public.seller_reviews;
create policy "insert reviews for authenticated"
on public.seller_reviews for insert to authenticated
with check (reviewer_id = auth.uid());

drop policy if exists "update own reviews" on public.seller_reviews;
create policy "update own reviews"
on public.seller_reviews for update to authenticated
using (reviewer_id = auth.uid())
with check (reviewer_id = auth.uid());

drop policy if exists "delete own reviews" on public.seller_reviews;
create policy "delete own reviews"
on public.seller_reviews for delete to authenticated
using (reviewer_id = auth.uid());
