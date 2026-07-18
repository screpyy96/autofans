import { beforeEach, describe, expect, it, vi } from 'vitest';

const serverMock = vi.hoisted(() => ({
  getSupabaseServerClient: vi.fn(),
}));

vi.mock('~/lib/supabase.server', () => ({
  getSupabaseServerClient: serverMock.getSupabaseServerClient,
}));

import { action } from '../api.messages.start';

const buyerId = '11111111-1111-1111-1111-111111111111';
const sellerId = '22222222-2222-2222-2222-222222222222';

function request() {
  return new Request('https://autofans.ro/api/messages/start', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ listingId: '42', body: 'Bună, mai este disponibilă mașina?' }),
  });
}

describe('start listing conversation API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns JSON 401 before writing when the server session is absent', async () => {
    const insert = vi.fn();
    serverMock.getSupabaseServerClient.mockReturnValue({
      supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) }, from: vi.fn(() => ({ insert })) },
      headers: new Headers(),
    });

    const response = await action({ request: request() } as any);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Sesiunea a expirat. Autentifică-te din nou și retrimite mesajul.' });
    expect(insert).not.toHaveBeenCalled();
  });

  it('returns conversation JSON after storing the first message', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { conversationId: 7 }, error: null });
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: buyerId } } }) },
      functions: { invoke },
      from: vi.fn(),
    };
    serverMock.getSupabaseServerClient.mockReturnValue({ supabase, headers: new Headers() });

    const response = await action({ request: request() } as any);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, conversationId: 7 });
    expect(invoke).toHaveBeenCalledWith('chat-v1', {
      body: { operation: 'start_conversation', payload: { listingId: 42, message: 'Bună, mai este disponibilă mașina?' } },
    });
  });
});
