import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, createTestClient, envelope } from '../helpers.ts';

let mock: ReturnType<typeof mockFetch> | undefined;
afterEach(() => { mock?.restore(); });

const SAMPLE_INBOX_EMBED_SETTINGS = {
  enabled: true,
  theme: 'auto' as const,
  position: 'bottom-right' as const,
  title: 'Notificações',
  primary_color: '#3b82f6',
  background_color: '#ffffff',
  unread_badge_text: 'Nova',
  show_sender_avatar: true,
  show_timestamp: true,
  date_format: 'relative' as const,
  max_notifications: 50,
  empty_state_text: 'Você não tem notificações',
  custom_logo_url: null,
  custom_css: null,
  embed_key: 'pk_live_embed123',
  allowed_domains: ['https://meusite.com.br'],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('InboxEmbed', () => {
  describe('getSettings()', () => {
    it('GETs /inbox-embed/settings', async () => {
      mock = mockFetch({ status: 200, body: envelope(SAMPLE_INBOX_EMBED_SETTINGS) });
      const n = createTestClient();
      const result = await n.inboxEmbed.getSettings();
      assert.equal(result.enabled, true);
      assert.equal(result.theme, 'auto');
      assert.equal(result.position, 'bottom-right');
      assert.equal(result.embed_key, 'pk_live_embed123');
      assert.equal(mock.lastRequest().method, 'GET');
      assert.equal(mock.lastUrl().pathname, '/v1/inbox-embed/settings');
    });
  });

  describe('updateSettings()', () => {
    it('PUTs to /inbox-embed/settings', async () => {
      mock = mockFetch({ status: 200, body: envelope({ ...SAMPLE_INBOX_EMBED_SETTINGS, title: 'Novidades' }) });
      const n = createTestClient();
      const result = await n.inboxEmbed.updateSettings({
        title: 'Novidades',
        primary_color: '#ef4444',
      });
      assert.equal(result.title, 'Novidades');
      assert.equal(mock.lastRequest().method, 'PUT');
      const body = mock.lastRequest().body as Record<string, unknown>;
      assert.equal(body.title, 'Novidades');
      assert.equal(body.primary_color, '#ef4444');
    });
  });

  describe('rotateKey()', () => {
    it('POSTs to /inbox-embed/keys/rotate', async () => {
      mock = mockFetch({ status: 200, body: envelope({
        embed_key: 'pk_live_newkey456',
        old_key_expires_at: '2024-02-01T00:00:00Z',
      }) });
      const n = createTestClient();
      const result = await n.inboxEmbed.rotateKey();
      assert.equal(result.embed_key, 'pk_live_newkey456');
      assert.equal(result.old_key_expires_at, '2024-02-01T00:00:00Z');
      assert.equal(mock.lastRequest().method, 'POST');
      assert.equal(mock.lastUrl().pathname, '/v1/inbox-embed/keys/rotate');
    });
  });
});
