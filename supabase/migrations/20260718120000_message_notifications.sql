-- A chat message is a durable notification for its recipient. Saved-search
-- notifications keep their existing shape; message notifications intentionally
-- have no saved_search_id and are never sent by the saved-search email worker.
alter table public.alert_notifications
  alter column saved_search_id drop not null;

alter table public.alert_notifications
  drop constraint if exists alert_notifications_kind_check;

alter table public.alert_notifications
  add constraint alert_notifications_kind_check
  check (kind in ('new_listing', 'price_drop', 'message'));

create or replace function public.create_message_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_id uuid;
  listing_title text;
begin
  select case when c.buyer_id = new.sender_id then c.seller_id else c.buyer_id end,
         l.title
    into recipient_id, listing_title
  from public.conversations c
  join public.listings l on l.id = c.listing_id
  where c.id = new.conversation_id;

  if recipient_id is not null and recipient_id <> new.sender_id then
    insert into public.alert_notifications (
      user_id, saved_search_id, listing_id, kind, title, body, action_url, email_enabled
    )
    select recipient_id, null, c.listing_id, 'message',
           'Mesaj nou despre ' || coalesce(listing_title, 'un anunț'),
           left(new.body, 240),
           '/messages?conversation=' || new.conversation_id,
           false
    from public.conversations c
    where c.id = new.conversation_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_message_notification on public.messages;
create trigger trg_message_notification
after insert on public.messages
for each row execute function public.create_message_notification();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'alert_notifications'
  ) then
    alter publication supabase_realtime add table public.alert_notifications;
  end if;
end;
$$;
