-- ===== Garajul Comunității (Community Garage) & Realtime Comments =====

-- 1. Tabela Vehicule Garaj
create table if not exists public.garage_vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text not null unique,
  make text not null,
  model text not null,
  year int check (year between 1950 and date_part('year', now())::int + 1),
  engine text,
  power_hp int,
  modifications jsonb default '[]'::jsonb,
  story text,
  images jsonb default '[]'::jsonb,
  upvotes_count int not null default 0,
  is_for_sale boolean not null default false,
  sale_price numeric(12,2) check (sale_price >= 0),
  listing_id bigint references public.listings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger updated_at
drop trigger if exists trg_garage_vehicles_updated_at on public.garage_vehicles;
create trigger trg_garage_vehicles_updated_at
before update on public.garage_vehicles
for each row execute procedure public.set_updated_at();

-- 2. Tabela Voturi (Upvotes)
create table if not exists public.garage_upvotes (
  vehicle_id uuid not null references public.garage_vehicles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (vehicle_id, user_id)
);

-- 3. Tabela Comentarii Live
create table if not exists public.garage_comments (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.garage_vehicles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  comment text not null,
  created_at timestamptz not null default now()
);

-- 4. Securitate RLS (Row Level Security)
alter table public.garage_vehicles enable row level security;
alter table public.garage_upvotes enable row level security;
alter table public.garage_comments enable row level security;

-- Politici garage_vehicles
drop policy if exists "Public can view garage vehicles" on public.garage_vehicles;
create policy "Public can view garage vehicles" on public.garage_vehicles for select using (true);

drop policy if exists "Users can add own garage vehicles" on public.garage_vehicles;
create policy "Users can add own garage vehicles" on public.garage_vehicles for insert with check (auth.uid() = owner_id);

drop policy if exists "Owners can update own garage vehicles" on public.garage_vehicles;
create policy "Owners can update own garage vehicles" on public.garage_vehicles for update using (auth.uid() = owner_id);

drop policy if exists "Owners can delete own garage vehicles" on public.garage_vehicles;
create policy "Owners can delete own garage vehicles" on public.garage_vehicles for delete using (auth.uid() = owner_id);

-- Politici garage_upvotes
drop policy if exists "Public can view upvotes" on public.garage_upvotes;
create policy "Public can view upvotes" on public.garage_upvotes for select using (true);

drop policy if exists "Users can upvote" on public.garage_upvotes;
create policy "Users can upvote" on public.garage_upvotes for insert with check (auth.uid() = user_id);

drop policy if exists "Users can remove upvote" on public.garage_upvotes;
create policy "Users can remove upvote" on public.garage_upvotes for delete using (auth.uid() = user_id);

-- Politici garage_comments
drop policy if exists "Public can view garage comments" on public.garage_comments;
create policy "Public can view garage comments" on public.garage_comments for select using (true);

drop policy if exists "Users can add garage comments" on public.garage_comments;
create policy "Users can add garage comments" on public.garage_comments for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own garage comments" on public.garage_comments;
create policy "Users can delete own garage comments" on public.garage_comments for delete using (auth.uid() = user_id);

-- 5. Activare Supabase Realtime
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'garage_vehicles') then
    alter publication supabase_realtime add table public.garage_vehicles;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'garage_comments') then
    alter publication supabase_realtime add table public.garage_comments;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'garage_upvotes') then
    alter publication supabase_realtime add table public.garage_upvotes;
  end if;
end;
$$;
