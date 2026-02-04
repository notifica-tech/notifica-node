import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, createTestClient, envelope, paginatedEnvelope } from '../helpers.ts';

let mock: ReturnType<typeof mockFetch> | undefined;
afterEach(() => { mock?.restore(); });

const SAMPLE_INBOX_NOTIFICATION = {
  id: 'notif-1',
  title: 'Bem-vindo!',
  body: 'Obrigado por se cadastrar.',
  action_url: 'https://app.exemplo.com/welcome',
  read: false,
  image_url: null,
  category: 'welcome',
  metadata: { campaign_id: 'camp-1' },
  sent_at: '2024-01-01T12:00:00Z',
  created_at: '2024-01-01T12:00:00Z',
};

describe('Inbox', () => {
  describe('listNotifications()', () => {
    it('GETs /inbox/notifications with subscriber_id', async () => {
      mock = mockFetch({ status: 200, body: paginatedEnvelope([SAMPLE_INBOX_NOTIFICATION]) });
      const n = createTestClient();
      const result = await n.inbox.listNotifications('sub-123');
      assert.equal(result.data.length, 1);
      assert.equal(result.data[0].title, 'Bem-vindo!');
      assert.equal(mock.lastRequest().method, 'GET');
      assert.equal(mock.lastUrl().pathname, '/v1/inbox/notifications');
      assert.equal(mock.lastUrl().searchParams.get('subscriber_id'), 'sub-123');
    });

    it('supports unread_only filter', async () => {
      mock = mockFetch({ status: 200, body: paginatedEnvelope([SAMPLE_INBOX_NOTIFICATION]) });
      const n = createTestClient();
      await n.inbox.listNotifications('sub-123', { unread_only: true });
      assert.equal(mock.lastUrl().searchParams.get('unread_only'), 'true');
    });
  });

  describe('getUnreadCount()', () => {
    it('GETs /inbox/notifications/unread-count', async () => {
      mock = mockFetch({ status: 200, body: envelope({ count: 5 }) });
      const n = createTestClient();
      const result = await n.inbox.getUnreadCount('sub-123');
      assert.equal(result, 5);
      assert.equal(mock.lastRequest().method, 'GET');
      assert.equal(mock.lastUrl().pathname, '/v1/inbox/notifications/unread-count');
      assert.equal(mock.lastUrl().searchParams.get('subscriber_id'), 'sub-123');
    });
  });

  describe('markRead()', () => {
    it('POSTs to /inbox/notifications/:id/read', async () => {
      mock = mockFetch({ status: 200, body: envelope({ success: true, notification_id: 'notif-1' }) });
      const n = createTestClient();
      const result = await n.inbox.markRead('notif-1');
      assert.equal(result.success, true);
      assert.equal(result.notification_id, 'notif-1');
      assert.equal(mock.lastRequest().method, 'POST');
      assert.ok(mock.lastUrl().pathname.endsWith('/inbox/notifications/notif-1/read'));
    });
  });

  describe('markAllRead()', () => {
    it('POSTs to /inbox/notifications/read-all with subscriber_id', async () => {
      mock = mockFetch({ status: 200, body: envelope({ success: true, marked_count: 10 }) });
      const n = createTestClient();
      const result = await n.inbox.markAllRead('sub-123');
      assert.equal(result.success, true);
      assert.equal(result.marked_count, 10);
      assert.equal(mock.lastRequest().method, 'POST');
      assert.equal(mock.lastUrl().pathname, '/v1/inbox/notifications/read-all');
      const body = mock.lastRequest().body as Record<string, unknown>;
      assert.equal(body.subscriber_id, 'sub-123');
    });
  });
});
