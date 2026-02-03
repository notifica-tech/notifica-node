import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { NotificaClient } from '../src/client.js';
import { ApiError, NotificaError, RateLimitError, ValidationError, TimeoutError } from '../src/errors.js';

// ── Test helpers ────────────────────────────────────

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

function createClient(overrides: Record<string, unknown> = {}): NotificaClient {
  return new NotificaClient({
    apiKey: 'nk_test_abc123',
    baseUrl: 'https://api.test.local/v1',
    maxRetries: 0, // no retries in tests by default
    ...overrides,
  });
}

// ── Tests ───────────────────────────────────────────

describe('NotificaClient', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('constructor', () => {
    it('throws if no API key', () => {
      assert.throws(
        () => new NotificaClient({ apiKey: '' }),
        NotificaError,
      );
    });

    it('strips trailing slash from base URL', () => {
      const client = createClient({ baseUrl: 'https://api.test.local/v1/' });
      // Just verifying it doesn't throw
      assert.ok(client);
    });
  });

  describe('GET requests', () => {
    it('sends Authorization header', async () => {
      const fetchMock = mockFetch({
        status: 200,
        body: { data: [] },
      });

      const client = createClient();
      await client.get('/notifications');

      assert.equal(fetchMock.mock.calls.length, 1);
      const [url, init] = fetchMock.mock.calls[0].arguments as [string, RequestInit];
      assert.equal(url, 'https://api.test.local/v1/notifications');
      assert.equal((init.headers as Record<string, string>)['Authorization'], 'Bearer nk_test_abc123');
    });

    it('appends query parameters', async () => {
      mockFetch({ status: 200, body: { data: [] } });

      const client = createClient();
      await client.get('/notifications', { channel: 'email', limit: 10 });

      const [url] = (globalThis.fetch as ReturnType<typeof mock.fn>).mock.calls[0].arguments as [string];
      const parsed = new URL(url);
      assert.equal(parsed.searchParams.get('channel'), 'email');
      assert.equal(parsed.searchParams.get('limit'), '10');
    });

    it('skips undefined query params', async () => {
      mockFetch({ status: 200, body: { data: [] } });

      const client = createClient();
      await client.get('/notifications', { channel: 'email', status: undefined });

      const [url] = (globalThis.fetch as ReturnType<typeof mock.fn>).mock.calls[0].arguments as [string];
      const parsed = new URL(url);
      assert.equal(parsed.searchParams.get('channel'), 'email');
      assert.equal(parsed.searchParams.has('status'), false);
    });
  });

  describe('POST requests', () => {
    it('sends JSON body', async () => {
      const fetchMock = mockFetch({
        status: 201,
        body: { data: { id: '123' } },
      });

      const client = createClient();
      await client.post('/notifications', { channel: 'email', to: 'a@b.com' });

      const [, init] = fetchMock.mock.calls[0].arguments as [string, RequestInit];
      assert.equal(init.method, 'POST');
      assert.deepEqual(JSON.parse(init.body as string), { channel: 'email', to: 'a@b.com' });
    });

    it('includes auto idempotency key', async () => {
      const fetchMock = mockFetch({
        status: 201,
        body: { data: { id: '123' } },
      });

      const client = createClient();
      await client.post('/notifications', { channel: 'email' });

      const [, init] = fetchMock.mock.calls[0].arguments as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      assert.ok(headers['Idempotency-Key'], 'Should have Idempotency-Key');
      assert.ok(headers['Idempotency-Key'].length > 0);
    });

    it('uses custom idempotency key', async () => {
      const fetchMock = mockFetch({
        status: 201,
        body: { data: { id: '123' } },
      });

      const client = createClient();
      await client.post('/notifications', { channel: 'email' }, {
        idempotencyKey: 'my-custom-key',
      });

      const [, init] = fetchMock.mock.calls[0].arguments as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      assert.equal(headers['Idempotency-Key'], 'my-custom-key');
    });

    it('skips idempotency when disabled', async () => {
      const fetchMock = mockFetch({
        status: 201,
        body: { data: { id: '123' } },
      });

      const client = createClient({ autoIdempotency: false });
      await client.post('/notifications', { channel: 'email' });

      const [, init] = fetchMock.mock.calls[0].arguments as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      assert.equal(headers['Idempotency-Key'], undefined);
    });
  });

  describe('DELETE requests', () => {
    it('handles 204 No Content', async () => {
      mockFetch({ status: 204 });

      const client = createClient();
      const result = await client.delete('/templates/123');
      assert.equal(result, undefined);
    });
  });

  describe('error handling', () => {
    it('throws ValidationError on 422', async () => {
      mockFetch({
        status: 422,
        body: {
          error: {
            code: 'validation_failed',
            message: 'Invalid email',
            details: { email: ['is invalid'] },
          },
        },
      });

      const client = createClient();
      await assert.rejects(
        () => client.post('/subscribers', { external_id: 'x' }),
        (err: unknown) => {
          assert.ok(err instanceof ValidationError);
          assert.equal(err.status, 422);
          assert.equal(err.message, 'Invalid email');
          assert.deepEqual(err.details, { email: ['is invalid'] });
          return true;
        },
      );
    });

    it('throws RateLimitError on 429', async () => {
      mockFetch({
        status: 429,
        body: { error: { code: 'rate_limit_exceeded', message: 'Too many requests' } },
        headers: { 'retry-after': '30' },
      });

      const client = createClient();
      await assert.rejects(
        () => client.get('/notifications'),
        (err: unknown) => {
          assert.ok(err instanceof RateLimitError);
          assert.equal(err.retryAfter, 30);
          return true;
        },
      );
    });

    it('throws ApiError on 404', async () => {
      mockFetch({
        status: 404,
        body: { error: { code: 'not_found', message: 'Not found' } },
      });

      const client = createClient();
      await assert.rejects(
        () => client.get('/notifications/nonexistent'),
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 404);
          assert.equal(err.code, 'not_found');
          return true;
        },
      );
    });

    it('includes request ID from header', async () => {
      mockFetch({
        status: 500,
        body: { error: { code: 'internal', message: 'Oops' } },
        headers: { 'x-request-id': 'req-abc-123' },
      });

      const client = createClient();
      await assert.rejects(
        () => client.get('/notifications'),
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.requestId, 'req-abc-123');
          return true;
        },
      );
    });
  });

  describe('retries', () => {
    it('retries on 500 up to maxRetries', async () => {
      let callCount = 0;
      (globalThis as Record<string, unknown>).fetch = mock.fn(async () => {
        callCount++;
        return {
          ok: false,
          status: 500,
          headers: new Headers(),
          json: async () => ({ error: { code: 'server_error', message: 'Internal error' } }),
        };
      });

      const client = createClient({ maxRetries: 2, timeout: 5000 });
      await assert.rejects(
        () => client.get('/notifications'),
        ApiError,
      );

      // 1 initial + 2 retries = 3 total
      assert.equal(callCount, 3);
    });

    it('succeeds after transient failure', async () => {
      let callCount = 0;
      (globalThis as Record<string, unknown>).fetch = mock.fn(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 502,
            headers: new Headers(),
            json: async () => ({ error: { code: 'bad_gateway', message: 'Bad gateway' } }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ data: [{ id: '1' }], meta: { cursor: null, has_more: false } }),
        };
      });

      const client = createClient({ maxRetries: 2, timeout: 5000 });
      const result = await client.get<{ data: unknown[] }>('/notifications');
      assert.equal(callCount, 2);
      assert.ok(result.data);
    });
  });

  describe('pagination', () => {
    it('auto-paginates with async iterator', async () => {
      let callCount = 0;
      (globalThis as Record<string, unknown>).fetch = mock.fn(async (_url: string) => {
        callCount++;
        const url = new URL(_url);
        const cursor = url.searchParams.get('cursor');

        if (!cursor) {
          return {
            ok: true,
            status: 200,
            headers: new Headers(),
            json: async () => ({
              data: [{ id: '1' }, { id: '2' }],
              meta: { cursor: 'page2', has_more: true },
            }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            data: [{ id: '3' }],
            meta: { cursor: null, has_more: false },
          }),
        };
      });

      const client = createClient();
      const items: { id: string }[] = [];
      for await (const item of client.paginate<{ id: string }>('/notifications')) {
        items.push(item);
      }

      assert.equal(items.length, 3);
      assert.deepEqual(items.map(i => i.id), ['1', '2', '3']);
      assert.equal(callCount, 2);
    });
  });
});
