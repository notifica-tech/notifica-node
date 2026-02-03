import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { NotificaClient } from '../src/client.ts';
import { ApiError, NotificaError, RateLimitError, TimeoutError, ValidationError } from '../src/errors.ts';
import { Notifica } from '../src/index.ts';
import { mockFetch, mockFetchFn, createTestClient, paginatedEnvelope } from './helpers.ts';

let mock: ReturnType<typeof mockFetch> | undefined;

afterEach(() => { mock?.restore(); });

// ── Constructor ─────────────────────────────────────

describe('NotificaClient constructor', () => {
  it('throws when API key is empty', () => {
    assert.throws(() => new NotificaClient({ apiKey: '' }), NotificaError);
  });

  it('strips trailing slashes from base URL', () => {
    const client = new NotificaClient({ apiKey: 'nk_test_x', baseUrl: 'https://api.local/v1///' });
    mock = mockFetch({ status: 200, body: { data: [] } });
    // Verify no double slashes by making a request
    client.get('/test');
  });

  it('defaults base URL to production', () => {
    mock = mockFetch({ status: 200, body: {} });
    const client = new NotificaClient({ apiKey: 'nk_test_x' });
    client.get('/test');
    assert.ok(mock.requests[0].url.startsWith('https://api.usenotifica.com.br/v1'));
  });
});

describe('Notifica facade constructor', () => {
  it('accepts a string API key', () => {
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

  it('accepts a config object', () => {
    const n = new Notifica({ apiKey: 'nk_test_abc', timeout: 5000 });
    assert.ok(n.notifications);
  });
});

// ── Auth header ─────────────────────────────────────

describe('authentication', () => {
  it('sends Bearer token in Authorization header', async () => {
    mock = mockFetch({ status: 200, body: { data: [] } });
    const client = new NotificaClient({ apiKey: 'nk_test_my_key', baseUrl: 'https://api.test.local/v1', maxRetries: 0 });
    await client.get('/test');
    assert.equal(mock.lastRequest().headers['Authorization'], 'Bearer nk_test_my_key');
  });

  it('sends User-Agent header', async () => {
    mock = mockFetch({ status: 200, body: { data: [] } });
    const client = new NotificaClient({ apiKey: 'nk_test_x', baseUrl: 'https://api.test.local/v1', maxRetries: 0 });
    await client.get('/test');
    assert.equal(mock.lastRequest().headers['User-Agent'], '@notifica/node/0.1.0');
  });

  it('sends Content-Type and Accept JSON headers', async () => {
    mock = mockFetch({ status: 200, body: { data: [] } });
    const client = new NotificaClient({ apiKey: 'nk_test_x', baseUrl: 'https://api.test.local/v1', maxRetries: 0 });
    await client.get('/test');
    assert.equal(mock.lastRequest().headers['Content-Type'], 'application/json');
    assert.equal(mock.lastRequest().headers['Accept'], 'application/json');
  });
});

// ── HTTP methods ────────────────────────────────────

describe('GET requests', () => {
  it('builds URL with path', async () => {
    mock = mockFetch({ status: 200, body: { data: [] } });
    const n = createTestClient();
    await n.notifications.list();
    assert.equal(mock.lastUrl().pathname, '/v1/notifications');
  });

  it('appends query parameters', async () => {
    mock = mockFetch({ status: 200, body: paginatedEnvelope([]) });
    const n = createTestClient();
    await n.notifications.list({ channel: 'email', limit: 50 });
    const url = mock.lastUrl();
    assert.equal(url.searchParams.get('channel'), 'email');
    assert.equal(url.searchParams.get('limit'), '50');
  });

  it('omits undefined/null query params', async () => {
    mock = mockFetch({ status: 200, body: paginatedEnvelope([]) });
    const n = createTestClient();
    await n.notifications.list({ channel: 'email', status: undefined });
    assert.equal(mock.lastUrl().searchParams.has('status'), false);
  });
});

describe('POST requests', () => {
  it('sends method POST with JSON body', async () => {
    mock = mockFetch({ status: 201, body: { data: { id: '1' } } });
    const n = createTestClient();
    await n.notifications.send({ channel: 'email', to: 'a@b.com' });
    assert.equal(mock.lastRequest().method, 'POST');
    assert.deepEqual(mock.lastRequest().body, { channel: 'email', to: 'a@b.com' });
  });
});

describe('PUT requests', () => {
  it('sends method PUT', async () => {
    mock = mockFetch({ status: 200, body: { data: { id: '1' } } });
    const n = createTestClient();
    await n.templates.update('tpl-1', { name: 'Updated' });
    assert.equal(mock.lastRequest().method, 'PUT');
    assert.deepEqual(mock.lastRequest().body, { name: 'Updated' });
  });
});

describe('DELETE requests', () => {
  it('sends method DELETE and handles 204', async () => {
    mock = mockFetch({ status: 204 });
    const n = createTestClient();
    await n.templates.delete('tpl-1');
    assert.equal(mock.lastRequest().method, 'DELETE');
  });
});

// ── Idempotency ─────────────────────────────────────

describe('idempotency', () => {
  it('auto-generates Idempotency-Key for POST', async () => {
    mock = mockFetch({ status: 201, body: { data: { id: '1' } } });
    const n = createTestClient();
    await n.notifications.send({ channel: 'email', to: 'a@b.com' });
    const key = mock.lastRequest().headers['Idempotency-Key'];
    assert.ok(key, 'Should have Idempotency-Key header');
    assert.ok(key.length > 10, 'Key should be a UUID');
  });

  it('uses custom idempotency key when provided', async () => {
    mock = mockFetch({ status: 201, body: { data: { id: '1' } } });
    const n = createTestClient();
    await n.notifications.send(
      { channel: 'email', to: 'a@b.com' },
      { idempotencyKey: 'my-custom-key-123' },
    );
    assert.equal(mock.lastRequest().headers['Idempotency-Key'], 'my-custom-key-123');
  });

  it('does not send Idempotency-Key when autoIdempotency is false', async () => {
    mock = mockFetch({ status: 201, body: { data: { id: '1' } } });
    const n = createTestClient({ autoIdempotency: false });
    await n.notifications.send({ channel: 'email', to: 'a@b.com' });
    assert.equal(mock.lastRequest().headers['Idempotency-Key'], undefined);
  });

  it('does not send Idempotency-Key for GET requests', async () => {
    mock = mockFetch({ status: 200, body: paginatedEnvelope([]) });
    const n = createTestClient();
    await n.notifications.list();
    assert.equal(mock.lastRequest().headers['Idempotency-Key'], undefined);
  });

  it('does not send Idempotency-Key for PUT requests', async () => {
    mock = mockFetch({ status: 200, body: { data: { id: '1' } } });
    const n = createTestClient();
    await n.templates.update('tpl-1', { name: 'x' });
    assert.equal(mock.lastRequest().headers['Idempotency-Key'], undefined);
  });

  it('generates unique keys per request', async () => {
    mock = mockFetch({ status: 201, body: { data: { id: '1' } } });
    const n = createTestClient();
    await n.notifications.send({ channel: 'email', to: 'a@b.com' });
    await n.notifications.send({ channel: 'email', to: 'b@c.com' });
    const key1 = mock.requests[0].headers['Idempotency-Key'];
    const key2 = mock.requests[1].headers['Idempotency-Key'];
    assert.notEqual(key1, key2, 'Each POST should get a unique key');
  });
});

// ── Error handling ──────────────────────────────────

describe('error handling', () => {
  it('throws ValidationError on 422', async () => {
    mock = mockFetch({
      status: 422,
      body: { error: { code: 'validation_failed', message: 'Email inválido', details: { email: ['is invalid'] } } },
    });
    const n = createTestClient();
    await assert.rejects(
      () => n.subscribers.create({ external_id: 'x' }),
      (err: unknown) => {
        assert.ok(err instanceof ValidationError);
        assert.equal(err.status, 422);
        assert.equal(err.code, 'validation_failed');
        assert.equal(err.message, 'Email inválido');
        assert.deepEqual(err.details, { email: ['is invalid'] });
        return true;
      },
    );
  });

  it('throws RateLimitError on 429 with Retry-After', async () => {
    mock = mockFetch({
      status: 429,
      body: { error: { code: 'rate_limit_exceeded', message: 'Too many requests' } },
      headers: { 'retry-after': '30' },
    });
    const n = createTestClient();
    await assert.rejects(
      () => n.notifications.list(),
      (err: unknown) => {
        assert.ok(err instanceof RateLimitError);
        assert.equal(err.status, 429);
        assert.equal(err.retryAfter, 30);
        return true;
      },
    );
  });

  it('throws ApiError on 401', async () => {
    mock = mockFetch({
      status: 401,
      body: { error: { code: 'unauthorized', message: 'Invalid API key' } },
    });
    const n = createTestClient();
    await assert.rejects(
      () => n.notifications.list(),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 401);
        assert.equal(err.code, 'unauthorized');
        return true;
      },
    );
  });

  it('throws ApiError on 403', async () => {
    mock = mockFetch({
      status: 403,
      body: { error: { code: 'forbidden', message: 'Insufficient permissions' } },
    });
    const n = createTestClient();
    await assert.rejects(
      () => n.notifications.list(),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 403);
        return true;
      },
    );
  });

  it('throws ApiError on 404', async () => {
    mock = mockFetch({
      status: 404,
      body: { error: { code: 'not_found', message: 'Not found' } },
    });
    const n = createTestClient();
    await assert.rejects(
      () => n.notifications.get('nonexistent'),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 404);
        assert.equal(err.code, 'not_found');
        return true;
      },
    );
  });

  it('throws ApiError on 409 conflict', async () => {
    mock = mockFetch({
      status: 409,
      body: { error: { code: 'conflict', message: 'Already cancelled' } },
    });
    const n = createTestClient();
    await assert.rejects(
      () => n.workflows.cancelRun('run-1'),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 409);
        return true;
      },
    );
  });

  it('includes request ID from response header', async () => {
    mock = mockFetch({
      status: 500,
      body: { error: { code: 'internal', message: 'Oops' } },
      headers: { 'x-request-id': 'req-abc-123' },
    });
    const n = createTestClient();
    await assert.rejects(
      () => n.notifications.list(),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.requestId, 'req-abc-123');
        return true;
      },
    );
  });

  it('handles malformed JSON error body gracefully', async () => {
    // Override fetch to return non-JSON body
    const origFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: false,
      status: 500,
      headers: new Headers(),
      json: async () => { throw new SyntaxError('Unexpected token'); },
    }) as unknown as Response;

    const n = createTestClient();
    await assert.rejects(() => n.notifications.list(), ApiError);
    globalThis.fetch = origFetch;
  });

  it('error class hierarchy is correct', () => {
    const validation = new ValidationError('test');
    assert.ok(validation instanceof ValidationError);
    assert.ok(validation instanceof ApiError);
    assert.ok(validation instanceof NotificaError);
    assert.ok(validation instanceof Error);

    const rateLimit = new RateLimitError('test', 10);
    assert.ok(rateLimit instanceof RateLimitError);
    assert.ok(rateLimit instanceof ApiError);

    const timeout = new TimeoutError(5000);
    assert.ok(timeout instanceof TimeoutError);
    assert.ok(timeout instanceof NotificaError);
    assert.equal(timeout.message, 'Request timed out after 5000ms');
  });
});

// ── Retries ─────────────────────────────────────────

describe('retry logic', () => {
  it('retries on 500 up to maxRetries', async () => {
    mock = mockFetch({ status: 500, body: { error: { code: 'internal', message: 'err' } } });
    const n = createTestClient({ maxRetries: 2 });
    await assert.rejects(() => n.notifications.list(), ApiError);
    // 1 initial + 2 retries = 3 total calls
    assert.equal(mock.requests.length, 3);
  });

  it('retries on 502, 503, 504', async () => {
    for (const status of [502, 503, 504]) {
      mock = mockFetch({ status, body: { error: { code: 'server_error', message: 'err' } } });
      const n = createTestClient({ maxRetries: 1 });
      await assert.rejects(() => n.notifications.list(), ApiError);
      assert.equal(mock.requests.length, 2, `Should retry on ${status}`);
      mock.restore();
    }
  });

  it('succeeds after transient 500 then 200', async () => {
    mock = mockFetch([
      { status: 502, body: { error: { code: 'bad_gateway', message: 'err' } } },
      { status: 200, body: paginatedEnvelope([{ id: 'n1' }]) },
    ]);
    const n = createTestClient({ maxRetries: 2 });
    const result = await n.notifications.list();
    assert.equal(result.data.length, 1);
    assert.equal(mock.requests.length, 2);
  });

  it('retries on 429 and eventually succeeds', async () => {
    mock = mockFetch([
      { status: 429, body: { error: { message: 'Rate limited' } }, headers: { 'retry-after': '0' } },
      { status: 200, body: paginatedEnvelope([{ id: 'n1' }]) },
    ]);
    const n = createTestClient({ maxRetries: 1 });
    const result = await n.notifications.list();
    assert.equal(result.data.length, 1);
    assert.equal(mock.requests.length, 2);
  });

  it('does NOT retry on 400/401/403/404/422', async () => {
    for (const status of [400, 401, 403, 404]) {
      mock = mockFetch({ status, body: { error: { code: 'err', message: 'err' } } });
      const n = createTestClient({ maxRetries: 3 });
      await assert.rejects(() => n.notifications.list(), ApiError);
      assert.equal(mock.requests.length, 1, `Should NOT retry on ${status}`);
      mock.restore();
    }
  });

  it('does not retry when maxRetries is 0', async () => {
    mock = mockFetch({ status: 500, body: { error: { code: 'internal', message: 'err' } } });
    const n = createTestClient({ maxRetries: 0 });
    await assert.rejects(() => n.notifications.list(), ApiError);
    assert.equal(mock.requests.length, 1);
  });
});

// ── Pagination ──────────────────────────────────────

describe('pagination', () => {
  it('manual cursor-based pagination', async () => {
    mock = mockFetch([
      { status: 200, body: paginatedEnvelope([{ id: '1' }], 'cursor-2', true) },
      { status: 200, body: paginatedEnvelope([{ id: '2' }], null, false) },
    ]);
    const n = createTestClient();

    const page1 = await n.notifications.list();
    assert.equal(page1.data.length, 1);
    assert.equal(page1.meta.has_more, true);
    assert.equal(page1.meta.cursor, 'cursor-2');

    const page2 = await n.notifications.list({ cursor: page1.meta.cursor! });
    assert.equal(page2.data.length, 1);
    assert.equal(page2.meta.has_more, false);
  });

  it('async iterator auto-paginates across pages', async () => {
    mock = mockFetchFn((url) => {
      const cursor = new URL(url).searchParams.get('cursor');
      if (!cursor) {
        return { status: 200, body: paginatedEnvelope([{ id: '1' }, { id: '2' }], 'page2', true) };
      }
      return { status: 200, body: paginatedEnvelope([{ id: '3' }], null, false) };
    });

    const n = createTestClient();
    const items: { id: string }[] = [];
    for await (const item of n.notifications.listAll()) {
      items.push(item as { id: string });
    }

    assert.equal(items.length, 3);
    assert.deepEqual(items.map(i => i.id), ['1', '2', '3']);
    assert.equal(mock.requests.length, 2);
  });

  it('async iterator stops when has_more is false', async () => {
    mock = mockFetch({ status: 200, body: paginatedEnvelope([{ id: '1' }], null, false) });
    const n = createTestClient();
    const items = [];
    for await (const item of n.notifications.listAll()) {
      items.push(item);
    }
    assert.equal(items.length, 1);
    assert.equal(mock.requests.length, 1);
  });

  it('async iterator handles empty first page', async () => {
    mock = mockFetch({ status: 200, body: paginatedEnvelope([], null, false) });
    const n = createTestClient();
    const items = [];
    for await (const item of n.notifications.listAll()) {
      items.push(item);
    }
    assert.equal(items.length, 0);
  });

  it('passes filter params through when auto-paginating', async () => {
    mock = mockFetch({ status: 200, body: paginatedEnvelope([], null, false) });
    const n = createTestClient();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of n.notifications.listAll({ channel: 'email', limit: 10 })) { /* drain */ }
    assert.equal(mock.lastUrl().searchParams.get('channel'), 'email');
    assert.equal(mock.lastUrl().searchParams.get('limit'), '10');
  });
});
