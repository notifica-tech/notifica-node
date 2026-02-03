import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, createTestClient, envelope, paginatedEnvelope } from '../helpers.ts';

let mock: ReturnType<typeof mockFetch> | undefined;
afterEach(() => { mock?.restore(); });

const SAMPLE_SUB = {
  id: 'sub-1', external_id: 'user-123', email: 'joao@test.com',
  phone: '+5511999998888', name: 'João Silva', locale: 'pt_BR',
  timezone: 'America/Sao_Paulo', created_at: '', updated_at: '',
};

describe('Subscribers', () => {
  describe('create()', () => {
    it('POSTs to /subscribers and unwraps data', async () => {
      mock = mockFetch({ status: 201, body: envelope(SAMPLE_SUB) });
      const n = createTestClient();
      const result = await n.subscribers.create({
        external_id: 'user-123',
        email: 'joao@test.com',
        phone: '+5511999998888',
        name: 'João Silva',
        custom_properties: { plan: 'pro' },
      });
      assert.equal(result.id, 'sub-1');
      assert.equal(result.external_id, 'user-123');
      assert.equal(mock.lastUrl().pathname, '/v1/subscribers');
      assert.equal((mock.lastRequest().body as Record<string, unknown>).external_id, 'user-123');
    });
  });

  describe('list()', () => {
    it('GETs /subscribers with search', async () => {
      mock = mockFetch({ status: 200, body: paginatedEnvelope([SAMPLE_SUB]) });
      const n = createTestClient();
      const result = await n.subscribers.list({ search: 'joao', limit: 10 });
      assert.equal(result.data.length, 1);
      assert.equal(mock.lastUrl().searchParams.get('search'), 'joao');
    });
  });

  describe('get()', () => {
    it('GETs /subscribers/:id', async () => {
      mock = mockFetch({ status: 200, body: envelope(SAMPLE_SUB) });
      const n = createTestClient();
      const result = await n.subscribers.get('sub-1');
      assert.equal(result.name, 'João Silva');
    });
  });

  describe('update()', () => {
    it('PUTs to /subscribers/:id', async () => {
      mock = mockFetch({ status: 200, body: envelope({ ...SAMPLE_SUB, name: 'João S.' }) });
      const n = createTestClient();
      const result = await n.subscribers.update('sub-1', { name: 'João S.' });
      assert.equal(result.name, 'João S.');
      assert.equal(mock.lastRequest().method, 'PUT');
    });
  });

  describe('delete()', () => {
    it('DELETEs /subscribers/:id (LGPD soft delete)', async () => {
      mock = mockFetch({ status: 204 });
      const n = createTestClient();
      await n.subscribers.delete('sub-1');
      assert.equal(mock.lastRequest().method, 'DELETE');
      assert.ok(mock.lastUrl().pathname.endsWith('/subscribers/sub-1'));
    });
  });

  describe('getPreferences()', () => {
    it('GETs /subscribers/:id/preferences', async () => {
      mock = mockFetch({
        status: 200,
        body: envelope({
          preferences: [
            { category: 'marketing', channel: 'email', enabled: false },
            { category: 'transactional', channel: 'whatsapp', enabled: true },
          ],
        }),
      });
      const n = createTestClient();
      const result = await n.subscribers.getPreferences('sub-1');
      assert.equal(result.preferences.length, 2);
      assert.equal(result.preferences[0].enabled, false);
      assert.ok(mock.lastUrl().pathname.endsWith('/subscribers/sub-1/preferences'));
    });
  });

  describe('updatePreferences()', () => {
    it('PUTs to /subscribers/:id/preferences', async () => {
      mock = mockFetch({
        status: 200,
        body: envelope({
          preferences: [{ category: 'marketing', channel: 'email', enabled: false }],
        }),
      });
      const n = createTestClient();
      await n.subscribers.updatePreferences('sub-1', {
        preferences: [{ category: 'marketing', channel: 'email', enabled: false }],
      });
      assert.equal(mock.lastRequest().method, 'PUT');
      const body = mock.lastRequest().body as Record<string, unknown>;
      assert.ok(Array.isArray(body.preferences));
    });
  });

  describe('bulkImport()', () => {
    it('POSTs to /subscribers/import', async () => {
      mock = mockFetch({
        status: 200,
        body: envelope({ imported: 2, subscribers: [SAMPLE_SUB, { ...SAMPLE_SUB, id: 'sub-2', external_id: 'user-456' }] }),
      });
      const n = createTestClient();
      const result = await n.subscribers.bulkImport({
        subscribers: [
          { external_id: 'user-123', email: 'a@b.com', name: 'A' },
          { external_id: 'user-456', email: 'b@c.com', name: 'B' },
        ],
      });
      assert.equal(result.imported, 2);
      assert.equal(result.subscribers.length, 2);
      assert.ok(mock.lastUrl().pathname.endsWith('/subscribers/import'));
    });
  });

  describe('listNotifications() — in-app', () => {
    it('GETs /subscribers/:id/notifications with params', async () => {
      mock = mockFetch({ status: 200, body: { data: [{ id: 'n1', body: 'Hello', read: false, created_at: '' }] } });
      const n = createTestClient();
      const result = await n.subscribers.listNotifications('sub-1', { unread_only: true, limit: 5 });
      assert.equal(result.data.length, 1);
      assert.equal(mock.lastUrl().searchParams.get('unread_only'), 'true');
    });
  });

  describe('markRead()', () => {
    it('POSTs to /subscribers/:id/notifications/:nid/read', async () => {
      mock = mockFetch({ status: 200, body: {} });
      const n = createTestClient();
      await n.subscribers.markRead('sub-1', 'n1');
      assert.equal(mock.lastRequest().method, 'POST');
      assert.ok(mock.lastUrl().pathname.endsWith('/subscribers/sub-1/notifications/n1/read'));
    });
  });

  describe('markAllRead()', () => {
    it('POSTs to /subscribers/:id/notifications/read-all', async () => {
      mock = mockFetch({ status: 200, body: {} });
      const n = createTestClient();
      await n.subscribers.markAllRead('sub-1');
      assert.ok(mock.lastUrl().pathname.endsWith('/subscribers/sub-1/notifications/read-all'));
    });
  });

  describe('getUnreadCount()', () => {
    it('GETs unread-count and returns the number', async () => {
      mock = mockFetch({ status: 200, body: envelope({ count: 7 }) });
      const n = createTestClient();
      const count = await n.subscribers.getUnreadCount('sub-1');
      assert.equal(count, 7);
      assert.ok(mock.lastUrl().pathname.endsWith('/subscribers/sub-1/notifications/unread-count'));
    });
  });

  describe('listAll()', () => {
    it('returns async iterator', async () => {
      mock = mockFetch({ status: 200, body: paginatedEnvelope([SAMPLE_SUB], null, false) });
      const n = createTestClient();
      const items = [];
      for await (const s of n.subscribers.listAll()) { items.push(s); }
      assert.equal(items.length, 1);
    });
  });
});
