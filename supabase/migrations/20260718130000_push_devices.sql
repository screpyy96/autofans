-- Stores FCM device tokens per authenticated AutoFans account. Tokens are not
-- credentials; they only identify a destination for Firebase delivery.
create table if not exists public.push_devices (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  fcm_token text not null check (char_length(fcm_token) between 30 and 4096),
  platform text not null check (platform in ('android', 'ios')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, fcm_token)
);

create index if not exists push_devices_user_id_idx on public.push_devices (user_id);

alter table public.push_devices enable row level security;
grant select, insert, update, delete on public.push_devices to authenticated;

drop policy if exists "users manage own push devices" on public.push_devices;
create policy "users manage own push devices"
on public.push_devices for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
