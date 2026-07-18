import { JWT } from "npm:google-auth-library@9.15.1";
import { createClient } from "npm:@supabase/supabase-js@2";

type FirebaseServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

/** Sends a data-only FCM push. It deliberately uses the server-only service
 * role to find the recipient's registered devices; no client can enumerate
 * somebody else's token. A Firebase outage never rejects a saved message. */
export async function notifyMessageRecipient(input: {
  conversationId: number;
  senderId: string;
  body: string;
}) {
  const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceAccountJson || !supabaseUrl || !serviceRoleKey) {
    console.warn("FCM skipped: server credentials are not configured");
    return;
  }

  let account: FirebaseServiceAccount;
  try {
    account = JSON.parse(serviceAccountJson) as FirebaseServiceAccount;
  } catch {
    console.error("FCM skipped: FIREBASE_SERVICE_ACCOUNT is invalid JSON");
    return;
  }
  if (!account.project_id || !account.client_email || !account.private_key) {
    console.error("FCM skipped: Firebase service account is incomplete");
    return;
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const [{ data: conversation, error: conversationError }, { data: sender }] = await Promise.all([
    admin.from("conversations").select("buyer_id,seller_id,listings(title)").eq("id", input.conversationId).maybeSingle(),
    admin.from("profiles").select("display_name,email").eq("id", input.senderId).maybeSingle(),
  ]);
  if (conversationError || !conversation) {
    console.warn("FCM skipped: conversation is unavailable", conversationError?.message);
    return;
  }
  const recipientId = conversation.buyer_id === input.senderId ? conversation.seller_id : conversation.buyer_id;
  if (!recipientId || recipientId === input.senderId) return;

  const { data: devices, error: devicesError } = await admin
    .from("push_devices")
    .select("id,fcm_token")
    .eq("user_id", recipientId)
    .eq("platform", "android");
  if (devicesError) {
    // The migration may be applied after the function deployment. This is
    // logged but never makes the sender believe their message failed.
    console.warn("FCM skipped: push device registry is unavailable", devicesError.message);
    return;
  }
  if (!devices?.length) return;

  const senderName = sender?.display_name?.trim() || sender?.email?.split("@")[0] || "AutoFans";
  const listing = conversation.listings as { title?: string } | null;
  const title = `${senderName} ți-a trimis un mesaj`;
  const preview = `${listing?.title ? `Despre ${listing.title}: ` : ""}${input.body}`.slice(0, 240);
  const credentials = new JWT({
    email: account.client_email,
    key: account.private_key,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });
  const token = await credentials.authorize();
  if (!token.access_token) throw new Error("Firebase did not issue an access token");

  await Promise.all(devices.map(async (device) => {
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(account.project_id)}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          token: device.fcm_token,
          // Data-only delivers through FirebaseMessagingService when Android
          // is backgrounded, so the app owns the notification styling.
          data: {
            type: "chat_message",
            conversationId: String(input.conversationId),
            title,
            body: preview,
            notificationId: String(input.conversationId),
          },
          android: { priority: "high" },
        },
      }),
    });
    if (response.ok) return;
    const detail = await response.text();
    console.warn("FCM delivery failed", response.status, detail);
    // Tokens can expire when an app is reinstalled. Remove only the exact
    // invalid destination; a user's other devices remain registered.
    if (detail.includes("UNREGISTERED") || detail.includes("registration-token-not-registered")) {
      await admin.from("push_devices").delete().eq("id", device.id);
    }
  }));
}
