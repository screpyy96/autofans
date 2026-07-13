-- Trust & safety workflow: normalize VINs, surface duplicate VINs to owners,
-- and allow a seller to request a manual account verification.

create or replace function public.normalize_listing_vin()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.vin := nullif(upper(regexp_replace(coalesce(new.vin, ''), '[^A-Za-z0-9]', '', 'g')), '');
  return new;
end;
$$;

drop trigger if exists trg_normalize_listing_vin on public.listings;
create trigger trg_normalize_listing_vin
before insert or update of vin on public.listings
for each row execute procedure public.normalize_listing_vin();

-- Old optional VIN values are made safe before enforcing the 17-character format.
update public.listings
set vin = case
  when upper(regexp_replace(coalesce(vin, ''), '[^A-Za-z0-9]', '', 'g')) ~ '^[A-HJ-NPR-Z0-9]{17}$'
    then upper(regexp_replace(vin, '[^A-Za-z0-9]', '', 'g'))
  else null
end
where vin is not null;

alter table public.listings
  drop constraint if exists listings_vin_format;

alter table public.listings
  add constraint listings_vin_format
  check (vin is null or vin ~ '^[A-HJ-NPR-Z0-9]{17}$');

create table if not exists public.listing_risk_flags (
  id bigserial primary key,
  listing_id bigint not null references public.listings(id) on delete cascade,
  flag_type text not null check (flag_type in ('duplicate_vin')),
  severity text not null check (severity in ('medium', 'high')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (listing_id, flag_type)
);

create index if not exists idx_listing_risk_flags_open
  on public.listing_risk_flags (listing_id, severity)
  where resolved_at is null;

alter table public.listing_risk_flags enable row level security;

drop policy if exists "listing owners read their risk flags" on public.listing_risk_flags;
create policy "listing owners read their risk flags"
on public.listing_risk_flags for select to authenticated
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_risk_flags.listing_id
      and l.owner_id = (select auth.uid())
  )
);

grant select on public.listing_risk_flags to authenticated;

-- This trigger runs only from listing writes. Its function cannot be invoked through the API.
create or replace function public.refresh_listing_duplicate_vin_flag()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  matches_count integer;
begin
  if new.vin is null then
    update public.listing_risk_flags
    set resolved_at = now(), updated_at = now()
    where listing_id = new.id
      and flag_type = 'duplicate_vin'
      and resolved_at is null;
    return new;
  end if;

  select count(*)
  into matches_count
  from public.listings l
  where l.id <> new.id
    and l.vin = new.vin;

  if matches_count > 0 then
    insert into public.listing_risk_flags (listing_id, flag_type, severity, details, resolved_at)
    values (
      new.id,
      'duplicate_vin',
      'high',
      jsonb_build_object('matching_listings', matches_count),
      null
    )
    on conflict (listing_id, flag_type) do update
    set severity = excluded.severity,
        details = excluded.details,
        resolved_at = null,
        updated_at = now();
  else
    update public.listing_risk_flags
    set resolved_at = now(), updated_at = now()
    where listing_id = new.id
      and flag_type = 'duplicate_vin'
      and resolved_at is null;
  end if;

  return new;
end;
$$;

revoke all on function public.refresh_listing_duplicate_vin_flag() from public;

drop trigger if exists trg_listing_duplicate_vin_flag on public.listings;
create trigger trg_listing_duplicate_vin_flag
after insert or update of vin on public.listings
for each row execute procedure public.refresh_listing_duplicate_vin_flag();

-- Backfill flags for already stored VINs without exposing who owns the matching listing.
insert into public.listing_risk_flags (listing_id, flag_type, severity, details, resolved_at)
select
  l.id,
  'duplicate_vin',
  'high',
  jsonb_build_object('matching_listings', count(matches.id)),
  null
from public.listings l
join public.listings matches on matches.vin = l.vin and matches.id <> l.id
where l.vin is not null
group by l.id
on conflict (listing_id, flag_type) do update
set severity = excluded.severity,
    details = excluded.details,
    resolved_at = null,
    updated_at = now();

create table if not exists public.verification_requests (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id bigint references public.listings(id) on delete set null,
  kind text not null check (kind in ('seller', 'vin', 'history')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_note text check (char_length(review_note) <= 1000)
);

create unique index if not exists idx_verification_requests_pending_unique
  on public.verification_requests (user_id, kind)
  where status = 'pending';

create index if not exists idx_verification_requests_review_queue
  on public.verification_requests (status, created_at asc);

alter table public.verification_requests enable row level security;

drop policy if exists "users read their verification requests" on public.verification_requests;
create policy "users read their verification requests"
on public.verification_requests for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "users create their verification requests" on public.verification_requests;
create policy "users create their verification requests"
on public.verification_requests for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'pending'
  and (
    listing_id is null
    or exists (
      select 1
      from public.listings l
      where l.id = verification_requests.listing_id
        and l.owner_id = (select auth.uid())
    )
  )
);

drop policy if exists "users cancel their pending verification requests" on public.verification_requests;
create policy "users cancel their pending verification requests"
on public.verification_requests for delete to authenticated
using (
  user_id = (select auth.uid())
  and status = 'pending'
);

grant select, insert, delete on public.verification_requests to authenticated;
grant usage, select on sequence public.verification_requests_id_seq to authenticated;
