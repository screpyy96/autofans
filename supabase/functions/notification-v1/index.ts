import { notifyUser } from "../_shared/fcm.ts";

type AlertNotification = {
  id?: number | string;
  user_id?: string;
  kind?: string;
  title?: string;
  body?: string;
};

type DatabaseWebhook = {
  type?: string;
  table?: string;
  schema?: string;
  record?: AlertNotification;
};

const headers = { "Content-Type": "application/json; charset=utf-8" };
const respond = (body: unknown, status = 200) => Response.json(body, { status, headers });
const sellerNotificationKinds = new Set([
  "seller_verification_approved",
  "seller_verification_rejected",
]);

/** Receives an authenticated Supabase Database Webhook after an in-app alert
 * is written. Keeping this separate means the Postgres trigger never gets a
 * Firebase credential and a failed push cannot roll back an approval. */
Deno.serve(async (request) => {
  if (request.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  const expectedSecret = Deno.env.get("NOTIFICATION_WEBHOOK_SECRET");
  if (!expectedSecret || request.headers.get("x-autofans-webhook-secret") !== expectedSecret) {
    return respond({ error: "Unauthorized" }, 401);
  }

  let event: DatabaseWebhook;
  try {
    event = await request.json() as DatabaseWebhook;
  } catch {
    return respond({ error: "Invalid JSON" }, 400);
  }

  if (event.type !== "INSERT" || event.schema !== "public" || event.table !== "alert_notifications") {
    return respond({ ignored: true }, 202);
  }
  const alert = event.record;
  if (!alert?.user_id || !alert.title || !alert.body || !alert.kind || !sellerNotificationKinds.has(alert.kind)) {
    return respond({ ignored: true }, 202);
  }

  try {
    await notifyUser({
      userId: alert.user_id,
      title: alert.title,
      body: alert.body,
      type: alert.kind,
      notificationId: String(alert.id ?? `${alert.user_id}:${alert.kind}`),
    });
    return respond({ delivered: true });
  } catch (error) {
    console.error("notification-v1 failed", error);
    return respond({ error: "Push delivery failed" }, 500);
  }
});
