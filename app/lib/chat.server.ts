/** Invokes the chat domain through Supabase Edge Functions from a web route.
 * The SSR Supabase client forwards the signed-in user's JWT, so chat-v1 keeps
 * the same RLS boundary for browser, Android and future iOS clients. */
export async function invokeChat<T>(supabase: any, operation: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('chat-v1', {
    body: { operation, payload },
  });
  if (!error) return data as T;

  const response = (error as { context?: Response }).context;
  const detail = response
    ? await response.clone().json().catch(() => null) as { error?: string } | null
    : null;
  throw new Error(detail?.error || error.message || 'Serviciul de mesagerie nu este disponibil momentan.');
}
