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

  it('rejects a forged conversation id before inserting a message', async () => {
    const membershipQuery = {
      eq: vi.fn(),
      or: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    membershipQuery.eq.mockReturnValue(membershipQuery);
    membershipQuery.or.mockReturnValue(membershipQuery);
    const insert = vi.fn();
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } } }) },
      from: vi.fn().mockImplementation((table: string) => table === 'conversations'
        ? { select: vi.fn().mockReturnValue(membershipQuery) }
        : { insert }),
    };
    mockAuthenticatedServer(supabase);

    const response = await action({ request: sendRequest() } as any) as Response;

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Nu ai acces la această conversație.' });
    expect(membershipQuery.or).toHaveBeenCalledWith(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
    expect(insert).not.toHaveBeenCalled();
  });

  it('sends a message only after membership validation and updates inbox activity', async () => {
    const membershipQuery = {
      eq: vi.fn(),
      or: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 42 }, error: null }),
    };
    membershipQuery.eq.mockReturnValue(membershipQuery);
    membershipQuery.or.mockReturnValue(membershipQuery);
    const insert = vi.fn().mockResolvedValue({ error: null });
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: updateEq });
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } } }) },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'conversations') return { select: vi.fn().mockReturnValue(membershipQuery), update };
        return { insert };
      }),
    };
    mockAuthenticatedServer(supabase);

    const response = await action({ request: sendRequest() } as any) as Response;

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(insert).toHaveBeenCalledWith({
      conversation_id: 42,
      sender_id: userId,
      body: 'Bună, mai este disponibilă mașina?',
    });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ updated_at: expect.any(String) }));
    expect(updateEq).toHaveBeenCalledWith('id', 42);
  });
});
