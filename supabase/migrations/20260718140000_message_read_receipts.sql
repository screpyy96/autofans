-- Only the recipient may mark a message as read. The chat Edge Function uses
-- the caller's JWT, so this policy remains the source of authorization.
grant update (read_at) on public.messages to authenticated;

drop policy if exists "recipients can mark messages read" on public.messages;
create policy "recipients can mark messages read"
on public.messages for update to authenticated
using (
  sender_id <> (select auth.uid())
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and ((select auth.uid()) = c.buyer_id or (select auth.uid()) = c.seller_id)
  )
)
with check (
  sender_id <> (select auth.uid())
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and ((select auth.uid()) = c.buyer_id or (select auth.uid()) = c.seller_id)
  )
);
