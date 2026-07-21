-- Add Realtime & Live Comments for Community Garage

create table if not exists public.garage_comments (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.garage_vehicles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  comment text not null,
  created_at timestamptz not null default now()
);

alter table public.garage_comments enable row level security;

drop policy if exists "Public can view garage comments" on public.garage_comments;
create policy "Public can view garage comments"
  on public.garage_comments for select
  using (true);

drop policy if exists "Users can add garage comments" on public.garage_comments;
create policy "Users can add garage comments"
  on public.garage_comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own garage comments" on public.garage_comments;
create policy "Users can delete own garage comments"
  on public.garage_comments for delete
  using (auth.uid() = user_id);

-- Enable Realtime publication on garage tables
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'garage_vehicles'
  ) then
    alter publication supabase_realtime add table public.garage_vehicles;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'garage_comments'
  ) then
    alter publication supabase_realtime add table public.garage_comments;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'garage_upvotes'
  ) then
    alter publication supabase_realtime add table public.garage_upvotes;
  end if;
end;
$$;
