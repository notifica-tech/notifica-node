import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, createTestClient, envelope, paginatedEnvelope } from '../helpers.ts';

let mock: ReturnType<typeof mockFetch> | undefined;
afterEach(() => { mock?.restore(); });

describe('Notifications', () => {
  describe('send()', () => {
    it('POSTs to /notifications and unwraps data', async () => {
      mock = mockFetch({
        status: 202,
        body: envelope({
          id: 'notif-001',
          channel: 'whatsapp',
          recipient: '+5511999999999',
          status: 'pending',
          created_at: '2025-02-03T10:00:00Z',
        }),
      });
      const n = createTestClient();
      const result = await n.notifications.send({
        channel: 'whatsapp',
        to: '+5511999999999',
        template: 'welcome',
        data: { name: 'João' },
      });

      assert.equal(result.id, 'notif-001');
      assert.equal(result.channel, 'whatsapp');
      assert.equal(result.status, 'pending');
      assert.equal(mock.lastRequest().method, 'POST');
      assert.equal(mock.lastUrl().pathname, '/v1/notifications');
      assert.deepEqual(mock.lastRequest().body, {
        channel: 'whatsapp',
        to: '+5511999999999',
        template: 'welcome',
        data: { name: 'João' },
      });
    });

    it('includes metadata in request body', async () => {
      mock = mockFetch({ status: 202, body: envelope({ id: '1', channel: 'email', recipient: 'a@b.com', status: 'pending', created_at: '' }) });
      const n = createTestClient();
      await n.notifications.send({
        channel: 'email',
        to: 'a@b.com',
        metadata: { source: 'signup' },
      });
      assert.deepEqual((mock.lastRequest().body as Record<string, unknown>).metadata, { source: 'signup' });
    });

    it('passes custom idempotency key', async () => {
      mock = mockFetch({ status: 202, body: envelope({ id: '1', channel: 'sms', recipient: '+55', status: 'pending', created_at: '' }) });
      const n = createTestClient();
      await n.notifications.send({ channel: 'sms', to: '+5511999' }, { idempotencyKey: 'idem-123' });
      assert.equal(mock.lastRequest().headers['Idempotency-Key'], 'idem-123');
    });
  });

  describe('list()', () => {
    it('GETs /notifications with filters', async () => {
      mock = mockFetch({ status: 200, body: paginatedEnvelope([{ id: '1' }], 'c1', true) });
      const n = createTestClient();
      const result = await n.notifications.list({ channel: 'email', status: 'delivered', limit: 50 });

      assert.equal(result.data.length, 1);
      assert.equal(result.meta.has_more, true);
      assert.equal(result.meta.cursor, 'c1');
      assert.equal(mock.lastUrl().searchParams.get('channel'), 'email');
      assert.equal(mock.lastUrl().searchParams.get('status'), 'delivered');
      assert.equal(mock.lastUrl().searchParams.get('limit'), '50');
    });
  });

  describe('get()', () => {
    it('GETs /notifications/:id and unwraps data', async () => {
      mock = mockFetch({ status: 200, body: envelope({ id: 'notif-42', channel: 'email', recipient: 'a@b.com', status: 'delivered', created_at: '' }) });
      const n = createTestClient();
      const result = await n.notifications.get('notif-42');
      assert.equal(result.id, 'notif-42');
      assert.equal(result.status, 'delivered');
      assert.ok(mock.lastUrl().pathname.endsWith('/notifications/notif-42'));
    });
  });

  describe('listAttempts()', () => {
    it('GETs /notifications/:id/attempts', async () => {
      mock = mockFetch({
        status: 200,
        body: {
          data: [
            { id: 'att-1', attempt_number: 1, status: 'failed', created_at: '' },
            { id: 'att-2', attempt_number: 2, status: 'success', created_at: '' },
          ],
        },
      });
      const n = createTestClient();
      const attempts = await n.notifications.listAttempts('notif-42');
      assert.equal(attempts.length, 2);
      assert.equal(attempts[0].attempt_number, 1);
      assert.equal(attempts[1].status, 'success');
      assert.ok(mock.lastUrl().pathname.endsWith('/notifications/notif-42/attempts'));
    });
  });

  describe('listAll()', () => {
    it('auto-paginates through all results', async () => {
      let page = 0;
      const origFetch = globalThis.fetch;
      globalThis.fetch = (async (_url: string) => {
        page++;
        const body = page === 1
          ? paginatedEnvelope([{ id: '1' }, { id: '2' }], 'p2', true)
          : paginatedEnvelope([{ id: '3' }], null, false);
        return { ok: true, status: 200, headers: new Headers(), json: async () => body } as Response;
      }) as typeof fetch;

      const n = createTestClient();
      const items = [];
      for await (const item of n.notifications.listAll({ channel: 'email' })) {
        items.push(item);
      }
      assert.equal(items.length, 3);
      globalThis.fetch = origFetch;
    });
  });
});
