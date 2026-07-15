-- Moderation access is an explicit allow-list, kept separate from buyer/seller
-- roles. Only a service-role/database owner can add a user to this table.
create table if not exists public.platform_admins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.platform_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;

drop policy if exists "admins manage listing reports" on public.listing_reports;
create policy "admins manage listing reports"
  on public.listing_reports for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop trigger if exists trg_listing_reports_updated_at on public.listing_reports;
create trigger trg_listing_reports_updated_at
before update on public.listing_reports
for each row execute procedure public.set_updated_at();
