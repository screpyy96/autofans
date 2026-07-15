-- Keep inbox ordering truthful without granting participants permission to
-- update conversation rows directly. A new message is the only activity that
-- should move a conversation to the top of the inbox.
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

revoke all on function public.touch_conversation_on_message() from public;

drop trigger if exists trg_touch_conversation_on_message on public.messages;
create trigger trg_touch_conversation_on_message
after insert on public.messages
for each row execute function public.touch_conversation_on_message();
