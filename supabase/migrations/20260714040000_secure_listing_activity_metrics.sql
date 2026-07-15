-- Seller metrics need to measure distinct interest, not unlimited client-side
-- events. Existing rows retain nullable new fields; all new browser events are
-- restricted to one event per anonymous/known session and calendar day.
alter table public.listing_views
  add column if not exists viewed_on date;

alter table public.listing_contacts
  add column if not exists session_id text;

alter table public.listing_contacts
  add column if not exists contacted_on date;

-- Earlier browser builds could already have recorded several identical
-- events before the per-session/day guard existed. Keep the oldest event in
-- each real session/day and remove only the redundant tracking rows, so the
-- unique constraints below can be added safely on a populated database.
with ranked_views as (
  select
    id,
    row_number() over (
      partition by listing_id, session_id, viewed_on
      order by created_at asc, id asc
    ) as event_rank
  from public.listing_views
  where session_id is not null and viewed_on is not null
)
delete from public.listing_views as view_event
using ranked_views
where view_event.id = ranked_views.id
  and ranked_views.event_rank > 1;

with ranked_contacts as (
  select
    id,
    row_number() over (
      partition by listing_id, session_id, contacted_on
      order by created_at asc, id asc
    ) as event_rank
  from public.listing_contacts
  where session_id is not null and contacted_on is not null
)
delete from public.listing_contacts as contact_event
using ranked_contacts
where contact_event.id = ranked_contacts.id
  and ranked_contacts.event_rank > 1;

alter table public.listing_views
  add constraint listing_views_listing_session_day_key
  unique (listing_id, session_id, viewed_on);

alter table public.listing_contacts
  add constraint listing_contacts_listing_session_day_key
  unique (listing_id, session_id, contacted_on);

create index if not exists idx_listing_views_listing_created
  on public.listing_views (listing_id, created_at desc);

create index if not exists idx_listing_contacts_listing_created
  on public.listing_contacts (listing_id, created_at desc);

drop policy if exists "anyone can record listing views" on public.listing_views;
create policy "visitors can record one valid listing view"
on public.listing_views for insert
to anon, authenticated
with check (
  exists (select 1 from public.listings where id = listing_id and status = 'published')
  and session_id is not null
  and char_length(session_id) between 12 and 160
  and viewed_on between current_date - 1 and current_date + 1
  and (
    (auth.uid() is null and visitor_id is null)
    or visitor_id = (select auth.uid())
  )
);

drop policy if exists "anyone can record listing contacts" on public.listing_contacts;
create policy "visitors can record one valid listing contact"
on public.listing_contacts for insert
to anon, authenticated
with check (
  exists (select 1 from public.listings where id = listing_id and status = 'published')
  and session_id is not null
  and char_length(session_id) between 12 and 160
  and contacted_on between current_date - 1 and current_date + 1
  and (
    (auth.uid() is null and visitor_id is null)
    or visitor_id = (select auth.uid())
  )
);
