-- AutoFans Supabase schema and policies
-- Copy-paste into Supabase SQL Editor and run once.
-- Notes:
-- 1) In Supabase → Authentication, enable Email/Password and Google.
-- 2) Set SITE URL = http://localhost:5173 (and your prod URL later)
-- 3) Add redirect http://localhost:5173/auth/callback in Authentication → URL Configuration
-- 4) Create a Storage bucket named "listing-images" (private) from Dashboard → Storage

-- ===== Types =====
create type if not exists public.user_role as enum ('buyer','seller');

-- ===== Utility: updated_at trigger =====
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===== Profiles =====
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  phone text,
  avatar_url text,
  role public.user_role not null default 'buyer',
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

-- Auto-create profile on new auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'buyer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ===== Listings =====
create table if not exists public.listings (
  id bigserial primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  currency text not null default 'EUR',
  make text not null,
  model text not null,
  year int check (year between 1950 and date_part('year', now())::int + 1),
  mileage int check (mileage >= 0),
  fuel_type text,
  transmission text,
  body_type text,
  images jsonb default '[]'::jsonb,
  status text not null default 'published' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_listings_updated_at on public.listings;
create trigger trg_listings_updated_at
before update on public.listings
for each row execute procedure public.set_updated_at();

-- ===== Favorites =====
create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id bigint not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- ===== Saved Searches =====
create table if not exists public.saved_searches (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text,
  query jsonb not null,
  created_at timestamptz not null default now()
);

-- ===== Indexes =====
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_listings_owner on public.listings(owner_id);
create index if not exists idx_listings_status on public.listings(status);
create index if not exists idx_listings_created on public.listings(created_at desc);
create index if not exists idx_listings_price on public.listings(price);
create index if not exists idx_favorites_user on public.favorites(user_id);
create index if not exists idx_saved_searches_user on public.saved_searches(user_id);

-- ===== Row Level Security (RLS) =====
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.favorites enable row level security;
alter table public.saved_searches enable row level security;

-- Profiles RLS
drop policy if exists "read profiles for all" on public.profiles;
create policy "read profiles for all"
on public.profiles for select
using (true);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Listings RLS
drop policy if exists "read published or own listings" on public.listings;
create policy "read published or own listings"
on public.listings for select
using (status = 'published' or owner_id = auth.uid());

drop policy if exists "insert listings for seller" on public.listings;
create policy "insert listings for seller"
on public.listings for insert
with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'seller'
  )
);

drop policy if exists "update own listings" on public.listings;
create policy "update own listings"
on public.listings for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "delete own listings" on public.listings;
create policy "delete own listings"
on public.listings for delete
using (owner_id = auth.uid());

-- Favorites RLS
drop policy if exists "favorites by owner" on public.favorites;
create policy "favorites by owner"
on public.favorites for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Saved searches RLS
drop policy if exists "saved searches by owner" on public.saved_searches;
create policy "saved searches by owner"
on public.saved_searches for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ===== Storage Policies (run after creating bucket 'listing-images') =====
-- Note: Create the bucket in Dashboard → Storage → New bucket → name: listing-images (Private)
-- Then run the policies below. They restrict access to that bucket only.

drop policy if exists "upload authenticated" on storage.objects;
create policy "upload authenticated"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'listing-images' and owner = auth.uid()
);

drop policy if exists "update own objects" on storage.objects;
create policy "update own objects"
on storage.objects for update to authenticated
using (
  bucket_id = 'listing-images' and owner = auth.uid()
)
with check (
  bucket_id = 'listing-images' and owner = auth.uid()
);

drop policy if exists "delete own objects" on storage.objects;
create policy "delete own objects"
on storage.objects for delete to authenticated
using (
  bucket_id = 'listing-images' and owner = auth.uid()
);

-- We intentionally omit a SELECT policy to keep the bucket private.
-- Use signed URLs from the client or server to display images.

-- Allow owners to read their own objects (needed to create signed URLs)
drop policy if exists "select own objects" on storage.objects;
create policy "select own objects"
on storage.objects for select to authenticated
using (
  bucket_id = 'listing-images' and owner = auth.uid()
);

-- ===== Role management options =====
-- Prevent regular users from changing privileged fields directly
revoke update on public.profiles from authenticated;
grant update (email, display_name, phone, avatar_url) on public.profiles to authenticated;

-- Optional: self-service upgrade to seller via RPC.
-- If you want admin-only control, comment out the GRANT EXECUTE below and call this with the service role key from your server instead.
create or replace function public.promote_to_seller()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set role = 'seller'
  where id = auth.uid();
end;
$$;

revoke all on function public.promote_to_seller() from public;
grant execute on function public.promote_to_seller() to authenticated;
