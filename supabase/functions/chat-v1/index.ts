import { createClient } from "npm:@supabase/supabase-js@2";
import { handleChatOperation, type ChatPayload } from "../_shared/chat.ts";

type RequestBody = { operation?: string; payload?: ChatPayload };
const headers = { "Content-Type": "application/json; charset=utf-8" };
const respond = (body: unknown, status = 200) => Response.json(body, { status, headers });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method !== "POST") return respond({ error: "Method not allowed" }, 405);
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return respond({ error: "Authentication required" }, 401);
  const url = Deno.env.get("SUPABASE_URL"), anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) return respond({ error: "Supabase function is not configured" }, 500);
  let body: RequestBody;
  try { body = await request.json(); } catch { return respond({ error: "Invalid JSON" }, 400); }
  const supabase = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return respond({ error: "Authentication required" }, 401);
  const fail = (error: { message: string } | null | undefined) => error ? respond({ error: error.message }, 400) : null;
  try {
    return await handleChatOperation({ operation: body.operation, payload: body.payload || {}, user, supabase, respond, fail })
      || respond({ error: "Unknown operation" }, 400);
  } catch (error) {
    console.error("chat-v1 failed", error);
    return respond({ error: "Cererea nu a putut fi procesată." }, 500);
  }
});
