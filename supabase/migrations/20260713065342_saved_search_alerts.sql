-- Saved searches can opt into email alerts without exposing another user's data.
alter table public.saved_searches
  add column if not exists alerts_enabled boolean not null default true,
  add column if not exists email_alerts_enabled boolean not null default true,
  add column if not exists last_checked_at timestamptz not null default now();

grant select, insert, update, delete on public.saved_searches to authenticated;
grant usage, select on sequence public.saved_searches_id_seq to authenticated;

create table if not exists public.alert_notifications (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  saved_search_id bigint not null references public.saved_searches(id) on delete cascade,
  listing_id bigint not null references public.listings(id) on delete cascade,
  kind text not null check (kind in ('new_listing', 'price_drop')),
  title text not null,
  body text not null,
  action_url text not null,
  email_enabled boolean not null default true,
  read_at timestamptz,
  email_sent_at timestamptz,
  resend_email_id text,
  created_at timestamptz not null default now(),
  unique (saved_search_id, listing_id, kind)
);

create index if not exists alert_notifications_user_created_idx
  on public.alert_notifications (user_id, created_at desc);
create index if not exists alert_notifications_pending_email_idx
  on public.alert_notifications (created_at asc)
  where email_sent_at is null;

-- Keep a durable price-change history for future price-drop alerts.
create table if not exists public.listing_price_history (
  id bigserial primary key,
  listing_id bigint not null references public.listings(id) on delete cascade,
  previous_price numeric not null,
  new_price numeric not null,
  changed_at timestamptz not null default now(),
  check (new_price <> previous_price)
);

create index if not exists listing_price_history_listing_changed_idx
  on public.listing_price_history (listing_id, changed_at desc);

alter table public.alert_notifications enable row level security;
alter table public.listing_price_history enable row level security;

grant select, update, delete on public.alert_notifications to authenticated;

drop policy if exists "alert notifications by owner" on public.alert_notifications;
create policy "alert notifications by owner"
on public.alert_notifications for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "mark own alert notifications read" on public.alert_notifications;
create policy "mark own alert notifications read"
on public.alert_notifications for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "delete own alert notifications" on public.alert_notifications;
create policy "delete own alert notifications"
on public.alert_notifications for delete to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.record_listing_price_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if old.price is not null and new.price is distinct from old.price then
    insert into public.listing_price_history (listing_id, previous_price, new_price)
    values (new.id, old.price, new.price);
  end if;
  return new;
end;
$$;

revoke all on function public.record_listing_price_change() from public, anon, authenticated;

drop trigger if exists trg_listing_price_history on public.listings;
create trigger trg_listing_price_history
after update of price on public.listings
for each row execute function public.record_listing_price_change();
