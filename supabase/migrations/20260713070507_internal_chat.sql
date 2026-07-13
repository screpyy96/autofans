create table if not exists public.conversations (
  id bigserial primary key,
  listing_id bigint not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (buyer_id <> seller_id),
  unique (listing_id, buyer_id, seller_id)
);

create index if not exists conversations_buyer_updated_idx on public.conversations (buyer_id, updated_at desc);
create index if not exists conversations_seller_updated_idx on public.conversations (seller_id, updated_at desc);

create table if not exists public.messages (
  id bigserial primary key,
  conversation_id bigint not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at asc);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
grant select, insert on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
grant usage, select on sequence public.conversations_id_seq, public.messages_id_seq to authenticated;

drop policy if exists "conversation participants can read" on public.conversations;
create policy "conversation participants can read"
on public.conversations for select to authenticated
using ((select auth.uid()) = buyer_id or (select auth.uid()) = seller_id);

drop policy if exists "buyers can start a listing conversation" on public.conversations;
create policy "buyers can start a listing conversation"
on public.conversations for insert to authenticated
with check (
  (select auth.uid()) = buyer_id
  and buyer_id <> seller_id
  and exists (
    select 1 from public.listings l
    where l.id = listing_id and l.owner_id = seller_id
  )
);

drop policy if exists "conversation participants can read messages" on public.messages;
create policy "conversation participants can read messages"
on public.messages for select to authenticated
using (exists (
  select 1 from public.conversations c
  where c.id = conversation_id
    and ((select auth.uid()) = c.buyer_id or (select auth.uid()) = c.seller_id)
));

drop policy if exists "participants can send messages" on public.messages;
create policy "participants can send messages"
on public.messages for insert to authenticated
with check (
  (select auth.uid()) = sender_id
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and ((select auth.uid()) = c.buyer_id or (select auth.uid()) = c.seller_id)
  )
);

drop trigger if exists trg_conversations_updated_at on public.conversations;
create trigger trg_conversations_updated_at
before update on public.conversations
for each row execute procedure public.set_updated_at();

alter publication supabase_realtime add table public.messages;
