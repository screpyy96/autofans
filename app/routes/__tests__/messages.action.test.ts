import { beforeEach, describe, expect, it, vi } from 'vitest';

const serverMock = vi.hoisted(() => ({
  getSupabaseServerClient: vi.fn(),
}));

vi.mock('~/lib/supabase.server', () => ({
  getSupabaseServerClient: serverMock.getSupabaseServerClient,
}));

import { action } from '../messages';

const userId = '11111111-1111-1111-1111-111111111111';

function sendRequest(conversationId = 42) {
  const body = new URLSearchParams({
    intent: 'send',
    conversationId: String(conversationId),
    body: 'Bună, mai este disponibilă mașina?',
  });
  return new Request('https://autofans.ro/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
}

function mockAuthenticatedServer(supabase: unknown) {
  serverMock.getSupabaseServerClient.mockReturnValue({ supabase, headers: new Headers() });
}

describe('messages action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('surfaces chat-v1 authorization errors without a direct database write', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: null, error: { message: 'Nu ai acces la această conversație.' } });
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } } }) },
      functions: { invoke },
      from: vi.fn(),
    };
    mockAuthenticatedServer(supabase);

    const response = await action({ request: sendRequest() } as any) as Response;

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Nu ai acces la această conversație.' });
    expect(invoke).toHaveBeenCalledWith('chat-v1', expect.objectContaining({ body: expect.objectContaining({ operation: 'send_message' }) }));
  });

  it('sends browser messages through chat-v1', async () => {
    const message = {
      id: 77,
      conversation_id: 42,
      sender_id: userId,
      body: 'Bună, mai este disponibilă mașina?',
      created_at: '2026-07-18T19:00:00.000Z',
    };
    const invoke = vi.fn().mockResolvedValue({ data: { ok: true, clientMessageId: '', message }, error: null });
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } } }) },
      functions: { invoke },
      from: vi.fn(),
    };
    mockAuthenticatedServer(supabase);

    const response = await action({ request: sendRequest() } as any) as Response;

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, clientMessageId: '', message });
    expect(invoke).toHaveBeenCalledWith('chat-v1', {
      body: {
        operation: 'send_message',
        payload: { conversationId: 42, message: 'Bună, mai este disponibilă mașina?', clientMessageId: '' },
      },
    });
  });
});
