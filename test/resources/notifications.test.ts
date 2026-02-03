import { describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Notifica } from '../src/index.js';

// ── Helpers ─────────────────────────────────────────

function mockFetch(response: {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
}): ReturnType<typeof mock.fn> {
  const fn = mock.fn(async () => ({
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    headers: new Headers(response.headers ?? {}),
    json: async () => response.body,
  }));
  (globalThis as Record<string, unknown>).fetch = fn;
  return fn;
}

function createNotifica(): Notifica {
  return new Notifica({
    apiKey: 'nk_test_abc123',
    baseUrl: 'https://api.test.local/v1',
    maxRetries: 0,
  });
}

// ── Tests ───────────────────────────────────────────

describe('Notifications resource', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('send()', () => {
    it('sends a notification and returns the data', async () => {
      const fetchMock = mockFetch({
        status: 202,
        body: {
          data: {
            id: 'notif-001',
            channel: 'whatsapp',
            recipient: '+5511999999999',
            status: 'pending',
            created_at: '2025-02-03T10:00:00Z',
          },
        },
      });

      const notifica = createNotifica();
      const result = await notifica.notifications.send({
        channel: 'whatsapp',
        to: '+5511999999999',
        template: 'welcome',
        data: { name: 'João' },
      });

      assert.equal(result.id, 'notif-001');
      assert.equal(result.channel, 'whatsapp');
      assert.equal(result.status, 'pending');

      // Verify the request body
      const [, init] = fetchMock.mock.calls[0].arguments as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      assert.equal(body.channel, 'whatsapp');
      assert.equal(body.to, '+5511999999999');
      assert.equal(body.template, 'welcome');
      assert.deepEqual(body.data, { name: 'João' });
    });

    it('accepts custom idempotency key', async () => {
      const fetchMock = mockFetch({
        status: 202,
        body: {
          data: {
            id: 'notif-002',
            channel: 'email',
            recipient: 'test@test.com',
            status: 'pending',
            created_at: '2025-02-03T10:00:00Z',
          },
        },
      });

      const notifica = createNotifica();
      await notifica.notifications.send(
        { channel: 'email', to: 'test@test.com' },
        { idempotencyKey: 'custom-key-123' },
      );

      const [, init] = fetchMock.mock.calls[0].arguments as [string, RequestInit];
      assert.equal(
        (init.headers as Record<string, string>)['Idempotency-Key'],
        'custom-key-123',
      );
    });
  });

  describe('list()', () => {
    it('lists notifications with filters', async () => {
      const fetchMock = mockFetch({
        status: 200,
        body: {
          data: [
            {
              id: 'notif-001',
              channel: 'email',
              recipient: 'test@test.com',
              status: 'delivered',
              created_at: '2025-02-03T10:00:00Z',
            },
          ],
          meta: { cursor: 'abc123', has_more: true },
        },
      });

      const notifica = createNotifica();
      const result = await notifica.notifications.list({
        channel: 'email',
        limit: 50,
      });

      assert.equal(result.data.length, 1);
      assert.equal(result.data[0].channel, 'email');
      assert.equal(result.meta.has_more, true);
      assert.equal(result.meta.cursor, 'abc123');

      const [url] = fetchMock.mock.calls[0].arguments as [string];
      const parsed = new URL(url);
      assert.equal(parsed.searchParams.get('channel'), 'email');
      assert.equal(parsed.searchParams.get('limit'), '50');
    });
  });

  describe('get()', () => {
    it('fetches a single notification', async () => {
      mockFetch({
        status: 200,
        body: {
          data: {
            id: 'notif-001',
            channel: 'email',
            recipient: 'test@test.com',
            status: 'delivered',
            created_at: '2025-02-03T10:00:00Z',
          },
        },
      });

      const notifica = createNotifica();
      const result = await notifica.notifications.get('notif-001');

      assert.equal(result.id, 'notif-001');
      assert.equal(result.status, 'delivered');
    });
  });

  describe('listAttempts()', () => {
    it('lists delivery attempts for a notification', async () => {
      mockFetch({
        status: 200,
        body: {
          data: [
            {
              id: 'att-001',
              attempt_number: 1,
              status: 'success',
              provider_response: { message_id: 'ext-123' },
              created_at: '2025-02-03T10:00:01Z',
            },
          ],
        },
      });

      const notifica = createNotifica();
      const attempts = await notifica.notifications.listAttempts('notif-001');

      assert.equal(attempts.length, 1);
      assert.equal(attempts[0].attempt_number, 1);
      assert.equal(attempts[0].status, 'success');
    });
  });

  describe('listAll()', () => {
    it('auto-paginates through all notifications', async () => {
      let callCount = 0;
      (globalThis as Record<string, unknown>).fetch = mock.fn(async (_url: string) => {
        callCount++;
        const url = new URL(_url);
        const cursor = url.searchParams.get('cursor');

        const body = !cursor
          ? {
              data: [
                { id: 'n1', channel: 'email', recipient: 'a@b.com', status: 'delivered', created_at: '2025-01-01T00:00:00Z' },
                { id: 'n2', channel: 'sms', recipient: '+55119', status: 'pending', created_at: '2025-01-01T00:01:00Z' },
              ],
              meta: { cursor: 'page2', has_more: true },
            }
          : {
              data: [
                { id: 'n3', channel: 'whatsapp', recipient: '+55118', status: 'delivered', created_at: '2025-01-01T00:02:00Z' },
              ],
              meta: { cursor: null, has_more: false },
            };

        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => body,
        };
      });

      const notifica = createNotifica();
      const items = [];
      for await (const notification of notifica.notifications.listAll({ channel: 'email' })) {
        items.push(notification);
      }

      assert.equal(items.length, 3);
      assert.equal(callCount, 2);
    });
  });
});

describe('Notifica constructor', () => {
  it('accepts string API key', () => {
    const n = new Notifica('nk_test_abc');
    assert.ok(n.notifications);
    assert.ok(n.templates);
    assert.ok(n.workflows);
    assert.ok(n.subscribers);
    assert.ok(n.channels);
    assert.ok(n.domains);
    assert.ok(n.webhooks);
    assert.ok(n.apiKeys);
    assert.ok(n.analytics);
  });

  it('accepts config object', () => {
    const n = new Notifica({
      apiKey: 'nk_test_abc',
      baseUrl: 'https://custom.api.local/v1',
      timeout: 5000,
    });
    assert.ok(n.notifications);
  });
});
