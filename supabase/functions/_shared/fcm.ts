import { JWT } from "npm:google-auth-library@9.15.1";
import { createClient } from "npm:@supabase/supabase-js@2";

type FirebaseServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

type PushDevice = {
  id: number;
  fcm_token: string;
  platform: "android" | "ios";
};

type FirebaseContext = {
  account: FirebaseServiceAccount;
  admin: ReturnType<typeof createClient>;
};

async function firebaseContext(): Promise<FirebaseContext | null> {
  const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceAccountJson || !supabaseUrl || !serviceRoleKey) {
    console.warn("FCM skipped: server credentials are not configured");
    return null;
  }

  let account: FirebaseServiceAccount;
  try {
    account = JSON.parse(serviceAccountJson) as FirebaseServiceAccount;
  } catch {
    console.error("FCM skipped: FIREBASE_SERVICE_ACCOUNT is invalid JSON");
    return null;
  }
  if (!account.project_id || !account.client_email || !account.private_key) {
    console.error("FCM skipped: Firebase service account is incomplete");
    return null;
  }

  return {
    account,
    admin: createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } }),
  };
}

/** Sends a visible notification to every currently registered device for one
 * AutoFans account. This stays server-side: device lookup and Firebase
 * credentials are never available to Android or iOS clients. */
export async function notifyUser(input: {
  userId: string;
  title: string;
  body: string;
  type: string;
  notificationId: string;
  data?: Record<string, string>;
}) {
  const context = await firebaseContext();
  if (!context) return;
  const { account, admin } = context;
  const { data: devices, error: devicesError } = await admin
    .from("push_devices")
    .select("id,fcm_token,platform")
    .eq("user_id", input.userId)
    .in("platform", ["android", "ios"]);
  if (devicesError) {
    console.warn("FCM skipped: push device registry is unavailable", devicesError.message);
    return;
  }
  if (!devices?.length) return;

  const credentials = new JWT({
    email: account.client_email,
    key: account.private_key,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });
  const token = await credentials.authorize();
  if (!token.access_token) throw new Error("Firebase did not issue an access token");

  await Promise.all((devices as PushDevice[]).map(async (device) => {
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(account.project_id)}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          token: device.fcm_token,
          data: {
            type: input.type,
            title: input.title,
            body: input.body.slice(0, 240),
            notificationId: input.notificationId,
            ...input.data,
          },
          android: { priority: "high" },
          apns: {
            headers: { "apns-push-type": "alert", "apns-priority": "10" },
            payload: { aps: { alert: { title: input.title, body: input.body.slice(0, 240) }, sound: "default" } },
          },
        },
      }),
    });
    if (response.ok) return;
    const detail = await response.text();
    console.warn("FCM delivery failed", response.status, detail);
    // A reinstall invalidates only one token. Keep the user's other devices.
    if (detail.includes("UNREGISTERED") || detail.includes("registration-token-not-registered")) {
      await admin.from("push_devices").delete().eq("id", device.id);
    }
  }));
}

/** Sends an FCM push to registered Android and iOS devices. It deliberately
 * uses the server-only service role to find the recipient's devices; no client
 * can enumerate somebody else's token. A Firebase outage never rejects a
 * saved message. */
export async function notifyMessageRecipient(input: {
  conversationId: number;
  senderId: string;
  body: string;
}) {
  const context = await firebaseContext();
  if (!context) return;
  const { admin } = context;
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

  const senderName = sender?.display_name?.trim() || sender?.email?.split("@")[0] || "AutoFans";
  const listing = conversation.listings as { title?: string } | null;
  const title = `${senderName} ți-a trimis un mesaj`;
  const preview = `${listing?.title ? `Despre ${listing.title}: ` : ""}${input.body}`.slice(0, 240);
  await notifyUser({
    userId: recipientId,
    title,
    body: preview,
    type: "chat_message",
    notificationId: String(input.conversationId),
    data: { conversationId: String(input.conversationId) },
  });
}
