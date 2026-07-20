import { createClient } from "npm:@supabase/supabase-js@2";
import { notifyMessageRecipient } from "./fcm.ts";

export type ChatPayload = Record<string, unknown>;

type ChatContext = {
  operation?: string;
  payload: ChatPayload;
  user: { id: string };
  supabase: ReturnType<typeof createClient>;
  respond: (body: unknown, status?: number) => Response;
  fail: (error: { message: string } | null | undefined) => Response | null;
};

/**
 * Shared mobile chat contract. `chat-v1` owns this domain, while the legacy
 * `mobile-v1` invokes the same handler during the app-transition period.
 */
export async function handleChatOperation(context: ChatContext): Promise<Response | null> {
  const { operation, payload, user, supabase, respond, fail } = context;
  switch (operation) {
    case "conversations": {
      const { data, error } = await supabase.from("conversations").select("id,listing_id,buyer_id,seller_id,created_at,updated_at").or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order("updated_at", { ascending: false });
      if (error) return fail(error)!;
      const conversations = data || [];
      const listingIds = [...new Set(conversations.map((conversation) => conversation.listing_id))];
      const counterpartIds = [...new Set(conversations.map((conversation) => conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id))];
      const conversationIds = conversations.map((conversation) => conversation.id);
      const [listingsResult, profilesResult, messagesResult] = await Promise.all([
        listingIds.length ? supabase.from("listings").select("id,slug,title,make,model,year,images").in("id", listingIds) : Promise.resolve({ data: [], error: null }),
        counterpartIds.length ? supabase.from("profiles").select("id,display_name,email,avatar_url").in("id", counterpartIds) : Promise.resolve({ data: [], error: null }),
        conversationIds.length ? supabase.from("messages").select("conversation_id,body,created_at,sender_id,read_at").in("conversation_id", conversationIds).order("created_at", { ascending: false }).limit(200) : Promise.resolve({ data: [], error: null }),
      ]);
      if (listingsResult.error || profilesResult.error || messagesResult.error) return fail(listingsResult.error || profilesResult.error || messagesResult.error)!;
      const listingById = new Map((listingsResult.data || []).map((listing) => [listing.id, listing]));
      const profileById = new Map((profilesResult.data || []).map((profile) => [profile.id, profile]));
      const lastMessageByConversation = new Map<number, unknown>();
      const unreadCountByConversation = new Map<number, number>();
      for (const message of messagesResult.data || []) {
        if (!lastMessageByConversation.has(message.conversation_id)) lastMessageByConversation.set(message.conversation_id, message);
        if (message.sender_id !== user.id && message.read_at === null) {
          unreadCountByConversation.set(message.conversation_id, (unreadCountByConversation.get(message.conversation_id) || 0) + 1);
        }
      }
      return respond({ conversations: conversations.map((conversation) => ({
        ...conversation,
        listing: listingById.get(conversation.listing_id) || null,
        counterpart: profileById.get(conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id) || null,
        last_message: lastMessageByConversation.get(conversation.id) || null,
        unread_count: unreadCountByConversation.get(conversation.id) || 0,
      })) });
    }
    case "messages": {
      const { data, error } = await supabase.from("messages").select("id,conversation_id,sender_id,body,created_at,read_at").eq("conversation_id", Number(payload.conversationId)).order("created_at", { ascending: true }).limit(200);
      return fail(error) || respond({ messages: data || [] });
    }
    case "start_conversation": {
      const listingId = Number(payload.listingId), message = typeof payload.message === "string" ? payload.message.trim().slice(0, 2_000) : "";
      const clientMessageId = typeof payload.clientMessageId === "string" ? payload.clientMessageId.slice(0, 96) : "";
      if (!Number.isInteger(listingId) || !message) return respond({ error: "Invalid conversation" }, 400);
      const { data: listing } = await supabase.from("listings").select("id,owner_id").eq("id", listingId).eq("status", "published").maybeSingle();
      if (!listing || listing.owner_id === user.id) return respond({ error: "Listing unavailable" }, 400);
      let { data: conversation } = await supabase.from("conversations").select("id").eq("listing_id", listingId).eq("buyer_id", user.id).eq("seller_id", listing.owner_id).maybeSingle();
      if (!conversation) {
        const created = await supabase.from("conversations").insert({ listing_id: listingId, buyer_id: user.id, seller_id: listing.owner_id }).select("id").single();
        if (created.error && created.error.code !== "23505") return fail(created.error)!;
        conversation = created.data || (await supabase.from("conversations").select("id").eq("listing_id", listingId).eq("buyer_id", user.id).eq("seller_id", listing.owner_id).single()).data;
      }
      const { data: savedMessage, error } = await supabase.from("messages").insert({ conversation_id: conversation!.id, sender_id: user.id, body: message }).select("id,conversation_id,sender_id,body,created_at").single();
      if (!error) await notifyMessageRecipient({ conversationId: conversation!.id, senderId: user.id, body: message }).catch((pushError) => console.warn("FCM delivery failed", pushError));
      return fail(error) || respond({ conversationId: conversation!.id, clientMessageId, message: savedMessage });
    }
    case "send_message": {
      const id = Number(payload.conversationId), message = typeof payload.message === "string" ? payload.message.trim().slice(0, 2_000) : "";
      const clientMessageId = typeof payload.clientMessageId === "string" ? payload.clientMessageId.slice(0, 96) : "";
      if (!Number.isInteger(id) || !message) return respond({ error: "Invalid message" }, 400);
      const { data: savedMessage, error } = await supabase.from("messages").insert({ conversation_id: id, sender_id: user.id, body: message }).select("id,conversation_id,sender_id,body,created_at").single();
      if (!error) await notifyMessageRecipient({ conversationId: id, senderId: user.id, body: message }).catch((pushError) => console.warn("FCM delivery failed", pushError));
      return fail(error) || respond({ ok: true, clientMessageId, message: savedMessage });
    }
    case "mark_conversation_read": {
      const id = Number(payload.conversationId);
      if (!Number.isInteger(id)) return respond({ error: "Invalid conversation" }, 400);
      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", id)
        .neq("sender_id", user.id)
        .is("read_at", null);
      return fail(error) || respond({ ok: true });
    }
    default:
      return null;
  }
}
