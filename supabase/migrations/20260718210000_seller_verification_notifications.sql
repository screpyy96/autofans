-- Completing a seller review in Supabase must update the public profile and
-- create a durable in-app notification. This trigger is deliberately driven by
-- the review status so approving a request in Table Editor or SQL Editor uses
-- the exact same workflow.

alter table public.alert_notifications
  alter column listing_id drop not null;

alter table public.alert_notifications
  drop constraint if exists alert_notifications_kind_check;

alter table public.alert_notifications
  add constraint alert_notifications_kind_check
  check (kind in (
    'new_listing',
    'price_drop',
    'message',
    'seller_verification_approved',
    'seller_verification_rejected'
  ));

create or replace function public.handle_seller_verification_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_kind text;
  notification_title text;
  notification_body text;
begin
  if new.kind <> 'seller'
     or new.status not in ('approved', 'rejected')
     or old.status is not distinct from new.status then
    return new;
  end if;

  if new.status = 'approved' then
    update public.profiles
    set is_verified = true,
        updated_at = now()
    where id = new.user_id;

    notification_kind := 'seller_verification_approved';
    notification_title := 'Contul tău de seller este verificat';
    notification_body := 'Poți publica și vinde cu badge-ul de Vânzător verificat pe AutoFans.';
  else
    update public.profiles
    set is_verified = false,
        updated_at = now()
    where id = new.user_id;

    notification_kind := 'seller_verification_rejected';
    notification_title := 'Verificarea profilului necesită atenție';
    notification_body := coalesce(nullif(new.review_note, ''), 'Verificarea nu a fost aprobată momentan. Actualizează profilul și trimite o nouă solicitare.');
  end if;

  insert into public.alert_notifications (
    user_id,
    saved_search_id,
    listing_id,
    kind,
    title,
    body,
    action_url,
    email_enabled
  ) values (
    new.user_id,
    null,
    null,
    notification_kind,
    notification_title,
    notification_body,
    '/profile',
    false
  );

  return new;
end;
$$;

revoke all on function public.handle_seller_verification_review() from public, anon, authenticated;

drop trigger if exists trg_seller_verification_review on public.verification_requests;
create trigger trg_seller_verification_review
after update of status on public.verification_requests
for each row
execute function public.handle_seller_verification_review();
