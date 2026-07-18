import { Link, redirect, useFetcher, useLoaderData, useRevalidator } from 'react-router';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { getSupabaseServerClient } from '~/lib/supabase.server';
import { getSupabaseBrowserClient } from '~/lib/supabase.client';
import { Button } from '~/components/ui/Button';

type ChatMessage = {
  id: number | string;
  conversation_id: number;
  sender_id: string;
  body: string;
  created_at: string;
  optimistic?: boolean;
};

type MessageActionData = {
  ok?: boolean;
  error?: string;
  clientMessageId?: string;
  message?: ChatMessage;
};

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map<string, ChatMessage>();
  for (const message of [...current, ...incoming]) byId.set(String(message.id), message);
  return [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function meta() {
  return [
    { title: 'Mesaje - AutoFans.ro' },
    { name: 'robots', content: 'noindex,nofollow' },
  ];
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect(`/login?next=${encodeURIComponent(new URL(request.url).pathname + new URL(request.url).search)}`, { headers });

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, listing_id, buyer_id, seller_id, created_at, updated_at, listings(id, slug, title, make, model, year)')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('updated_at', { ascending: false });
  const list = conversations || [];
  const ids = list.map((conversation: any) => conversation.id);
  const counterpartIds = [...new Set(list.map((conversation: any) => conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id))];
  const [{ data: lastMessages }, { data: profiles }] = await Promise.all([
    ids.length ? supabase.from('messages').select('conversation_id, body, created_at, sender_id').in('conversation_id', ids).order('created_at', { ascending: false }).limit(200) : Promise.resolve({ data: [] }),
    counterpartIds.length ? supabase.from('profiles').select('id, display_name, email, avatar_url').in('id', counterpartIds) : Promise.resolve({ data: [] }),
  ]);
  const lastByConversation = new Map<number, any>();
  for (const message of lastMessages || []) if (!lastByConversation.has(message.conversation_id)) lastByConversation.set(message.conversation_id, message);
  const profileById = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
  const enriched = list.map((conversation: any) => {
    const counterpartId = conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id;
    return { ...conversation, counterpart: profileById.get(counterpartId) || null, lastMessage: lastByConversation.get(conversation.id) || null };
  });
  enriched.sort((a: any, b: any) => String(b.lastMessage?.created_at || b.created_at).localeCompare(String(a.lastMessage?.created_at || a.created_at)));

  // Keep old notification links working, while new threads use their own
  // durable route: /messages/:conversationId.
  const requestedId = params.conversationId || new URL(request.url).searchParams.get('conversation');
  const activeConversation = requestedId
    ? enriched.find((conversation: any) => String(conversation.id) === requestedId) || null
    : null;
  const { data: messages } = activeConversation
    ? await supabase.from('messages').select('id, conversation_id, sender_id, body, created_at').eq('conversation_id', activeConversation.id).order('created_at', { ascending: true }).limit(200)
    : { data: [] };
  return { userId: user.id, conversations: enriched, activeConversation, messages: messages || [] };
}

export async function action({ request }: ActionFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Autentifică-te pentru a trimite un mesaj.' }, { status: 401, headers });
  const form = await request.formData();
  const intent = String(form.get('intent') || '');
  const body = String(form.get('body') || '').trim().slice(0, 2000);
  const clientMessageId = String(form.get('clientMessageId') || '').slice(0, 96);
  const actionError = (error: string, status: number) => Response.json(
    { error, ...(clientMessageId ? { clientMessageId } : {}) },
    { status, headers },
  );
  if (!body) return actionError('Mesajul nu poate fi gol.', 400);

  if (intent === 'start') {
    const listingId = Number(form.get('listingId'));
    if (!Number.isInteger(listingId)) return Response.json({ error: 'Anunț invalid.' }, { status: 400, headers });
    const { data: listing } = await supabase.from('listings').select('id, owner_id').eq('id', listingId).eq('status', 'published').maybeSingle();
    if (!listing || !listing.owner_id) return Response.json({ error: 'Anunț indisponibil.' }, { status: 404, headers });
    if (listing.owner_id === user.id) return Response.json({ error: 'Nu îți poți trimite mesaj propriului anunț.' }, { status: 400, headers });
    let { data: conversation } = await supabase.from('conversations')
      .select('id').eq('listing_id', listing.id).eq('buyer_id', user.id).eq('seller_id', listing.owner_id).maybeSingle();
    if (!conversation) {
      const { data, error } = await supabase.from('conversations')
        .insert({ listing_id: listing.id, buyer_id: user.id, seller_id: listing.owner_id }).select('id').single();
      if (error?.code === '23505') {
        const { data: existing } = await supabase.from('conversations')
          .select('id').eq('listing_id', listing.id).eq('buyer_id', user.id).eq('seller_id', listing.owner_id).maybeSingle();
        conversation = existing;
      } else if (error) {
        return Response.json({ error: 'Conversația nu a putut fi creată. Încearcă din nou.' }, { status: 400, headers });
      } else {
        conversation = data;
      }
    }
    if (!conversation) return Response.json({ error: 'Conversația nu a putut fi creată. Încearcă din nou.' }, { status: 400, headers });
    const { data: message, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversation.id, sender_id: user.id, body })
      .select('id,conversation_id,sender_id,body,created_at')
      .single();
    if (error) return Response.json({ error: error.message }, { status: 400, headers });
    return Response.json({ ok: true, conversationId: conversation.id, clientMessageId, message }, { headers });
  }

  if (intent === 'send') {
    const conversationId = Number(form.get('conversationId'));
    if (!Number.isInteger(conversationId)) return actionError('Conversație invalidă.', 400);
    // RLS remains the final database boundary, but the route must also refuse
    // a forged conversation id before attempting an insert.
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .maybeSingle();
    if (conversationError || !conversation) {
      return actionError('Nu ai acces la această conversație.', 403);
    }
    const { data: message, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: user.id, body })
      .select('id,conversation_id,sender_id,body,created_at')
      .single();
    if (error) return actionError(error.message, 400);
    // Keep the inbox sorted even before/without the database trigger used in
    // production. This is intentionally best-effort: the sent message is the
    // primary action and must not be reported as failed because of a touch.
    const { error: touchError } = await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
    if (touchError) console.warn('Could not update conversation activity:', touchError);
    return Response.json({ ok: true, clientMessageId, message }, { headers });
  }
  return Response.json({ error: 'Acțiune invalidă.' }, { status: 400, headers });
}

export default function Messages() {
  const { userId, conversations, activeConversation, messages } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<MessageActionData>();
  const revalidator = useRevalidator();
  const activeId = activeConversation?.id;
  const loaderMessages = useMemo<ChatMessage[]>(() => messages.map((message: any) => ({
    ...message,
    conversation_id: Number(message.conversation_id ?? activeId ?? 0),
  })), [activeId, messages]);
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>(loaderMessages);
  const messageListRef = useRef<HTMLDivElement>(null);
  const messageFormRef = useRef<HTMLFormElement>(null);
  const clientMessageInputRef = useRef<HTMLInputElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const previousConversationIdRef = useRef<number | undefined>(undefined);
  const previousActionRef = useRef<MessageActionData | undefined>(undefined);

  useEffect(() => {
    const changedConversation = previousConversationIdRef.current !== activeId;
    if (changedConversation) setLiveMessages(loaderMessages);
    else setLiveMessages((current) => mergeMessages(current, loaderMessages));
  }, [activeId, loaderMessages]);

  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList || !activeId) return;

    const didChangeConversation = previousConversationIdRef.current !== activeId;
    previousConversationIdRef.current = activeId;
    if (didChangeConversation) shouldStickToBottomRef.current = true;
    if (!didChangeConversation && !shouldStickToBottomRef.current) return;

    messageList.scrollTo({
      top: messageList.scrollHeight,
      behavior: didChangeConversation ? 'auto' : 'smooth',
    });
  }, [activeId, liveMessages.length]);

  useEffect(() => {
    const result = fetcher.data;
    if (fetcher.state !== 'idle' || !result || result === previousActionRef.current) return;
    previousActionRef.current = result;
    const savedMessage = result.message;
    if (result.ok && savedMessage) {
      setLiveMessages((current) => mergeMessages(
        current.filter((message) => message.id !== result.clientMessageId),
        [savedMessage],
      ));
      messageFormRef.current?.reset();
      revalidator.revalidate();
      return;
    }
    if (result.clientMessageId) {
      setLiveMessages((current) => current.filter((message) => message.id !== result.clientMessageId));
    }
  }, [fetcher.data, fetcher.state, revalidator]);

  const trackMessageScroll = () => {
    const messageList = messageListRef.current;
    if (!messageList) return;
    shouldStickToBottomRef.current = messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight < 80;
  };

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    // The page itself is authenticated by the server cookie. Fetch the same
    // browser session before joining Realtime; otherwise Postgres Changes can
    // silently be denied by message RLS even though the page rendered.
    void supabase.auth.getSession().then(({ data: { session } }: { data: { session: { access_token: string } | null } }) => {
      if (!active || !session) return;
      supabase.realtime.setAuth(session.access_token);
      channel = supabase.channel(`messages-${userId}`)
        // RLS limits this to conversations in which the signed-in user is a
        // participant. One channel serves both the thread and inbox.
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: { new: unknown }) => {
          const message = payload.new as ChatMessage;
          if (message.conversation_id === activeId) setLiveMessages((current) => mergeMessages(current, [message]));
          revalidator.revalidate();
        })
        .subscribe((status: string) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') console.warn('Chat Realtime is reconnecting:', status);
        });
    }).catch((error: unknown) => console.warn('Could not start chat Realtime:', error));
    return () => {
      active = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [activeId, revalidator, userId]);

  const submitMessage = (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    const body = String(new FormData(form).get('body') || '').trim();
    if (!activeId || !body) return;
    const clientMessageId = `local-${crypto.randomUUID()}`;
    if (clientMessageInputRef.current) clientMessageInputRef.current.value = clientMessageId;
    shouldStickToBottomRef.current = true;
    setLiveMessages((current) => mergeMessages(current, [{
      id: clientMessageId,
      conversation_id: activeId,
      sender_id: userId,
      body,
      created_at: new Date().toISOString(),
      optimistic: true,
    }]));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-7 flex items-center gap-3"><span className="rounded-2xl bg-accent-gold/15 p-3 text-accent-gold"><MessageCircle className="h-6 w-6" /></span><div><h1 className="text-3xl font-bold text-white">Mesaje</h1><p className="text-sm text-gray-400">Discută în siguranță direct cu vânzătorii și cumpărătorii.</p></div></div>
      <div className="grid min-h-[620px] overflow-hidden rounded-3xl border border-white/10 bg-secondary-900/80 shadow-2xl lg:grid-cols-[340px_1fr]">
        <aside className="border-b border-white/10 lg:border-b-0 lg:border-r">
          {conversations.length ? conversations.map((conversation: any) => (
            <Link key={conversation.id} to={`/messages/${conversation.id}`} className={`block border-b border-white/5 p-4 transition hover:bg-white/5 ${activeId === conversation.id ? 'bg-accent-gold/10' : ''}`}>
              <p className="truncate font-semibold text-white">{conversation.counterpart?.display_name || conversation.counterpart?.email?.split('@')[0] || 'Utilizator AutoFans'}</p>
              <p className="mt-1 truncate text-xs text-accent-gold">{conversation.listings?.title || 'Anunț auto'}</p>
              <p className="mt-2 truncate text-sm text-gray-400">{conversation.lastMessage?.body || 'Conversație nouă'}</p>
            </Link>
          )) : (
            <div className="p-8 text-center text-sm text-gray-400">
              <MessageCircle className="mx-auto mb-3 h-8 w-8 text-gray-600" aria-hidden="true" />
              <p>Nu ai conversații încă. Găsește o mașină și scrie direct vânzătorului.</p>
              <Button asChild variant="outline" size="sm" className="mt-4 border-accent-gold/35 text-accent-gold">
                <Link to="/search">Caută mașini</Link>
              </Button>
            </div>
          )}
        </aside>
        <section className="flex min-h-[470px] flex-col">
          {activeConversation ? <>
            <header className="border-b border-white/10 p-5"><p className="font-semibold text-white">{activeConversation.counterpart?.display_name || activeConversation.counterpart?.email?.split('@')[0] || 'Utilizator AutoFans'}</p><Link to={`/car/${activeConversation.listings?.slug || activeConversation.listing_id}`} className="text-sm text-accent-gold hover:underline">{activeConversation.listings?.title || 'Vezi anunțul'}</Link></header>
            <div ref={messageListRef} onScroll={trackMessageScroll} className="flex-1 space-y-3 overflow-y-auto p-5">{liveMessages.map((message) => <div key={message.id} className={`flex ${message.sender_id === userId ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${message.sender_id === userId ? 'bg-accent-gold text-secondary-950' : 'bg-white/10 text-white'} ${message.optimistic ? 'opacity-70' : ''}`}><p className="whitespace-pre-wrap">{message.body}</p><p className={`mt-1 text-[10px] ${message.sender_id === userId ? 'text-secondary-900/60' : 'text-gray-400'}`}>{message.optimistic ? 'Se trimite…' : new Date(message.created_at).toLocaleString('ro-RO', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</p></div></div>)}</div>
            <fetcher.Form ref={messageFormRef} method="post" onSubmit={submitMessage} className="border-t border-white/10 p-4"><input type="hidden" name="intent" value="send" /><input type="hidden" name="conversationId" value={activeConversation.id} /><input ref={clientMessageInputRef} type="hidden" name="clientMessageId" /><label htmlFor="message-body" className="sr-only">Mesaj nou</label><div className="flex gap-3"><textarea id="message-body" name="body" maxLength={2000} required rows={2} placeholder="Scrie un mesaj…" className="min-h-12 flex-1 resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500 focus:border-accent-gold" /><Button type="submit" className="bg-gold-gradient text-secondary-900" aria-label="Trimite mesajul" loading={fetcher.state !== 'idle'}><Send className="h-4 w-4" /></Button></div>{fetcher.data?.error && <p className="mt-2 text-sm text-red-300" role="alert">{fetcher.data.error}</p>}</fetcher.Form>
          </> : <div className="flex flex-1 items-center justify-center p-8 text-center text-gray-400"><div><MessageCircle className="mx-auto mb-4 h-10 w-10 text-gray-600" /><p>Alege o conversație sau pornește una din pagina unui anunț.</p></div></div>}
        </section>
      </div>
    </div>
  );
}
