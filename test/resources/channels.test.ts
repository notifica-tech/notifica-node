import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, createTestClient, envelope } from '../helpers.ts';

let mock: ReturnType<typeof mockFetch> | undefined;
afterEach(() => { mock?.restore(); });

const SAMPLE_CHANNEL = {
  id: 'ch-1', channel: 'email', provider: 'aws_ses',
  settings: { from_address: 'no-reply@test.com', from_name: 'Test' },
  created_at: '', updated_at: '',
};

describe('Channels', () => {
  describe('create()', () => {
    it('POSTs to /channels', async () => {
      mock = mockFetch({ status: 201, body: envelope(SAMPLE_CHANNEL) });
      const n = createTestClient();
      const result = await n.channels.create({
        channel: 'email', provider: 'aws_ses',
        credentials: { access_key_id: 'AKIA', secret_access_key: 's3cret', region: 'us-east-1' },
        settings: { from_address: 'no-reply@test.com' },
      });
      assert.equal(result.channel, 'email');
      assert.equal(result.provider, 'aws_ses');
      assert.equal(mock.lastRequest().method, 'POST');
      assert.equal(mock.lastUrl().pathname, '/v1/channels');
      // Verify credentials are sent in body
      const body = mock.lastRequest().body as Record<string, unknown>;
      assert.ok(body.credentials);
    });
  });

  describe('list()', () => {
    it('GETs /channels', async () => {
      mock = mockFetch({ status: 200, body: { data: [SAMPLE_CHANNEL] } });
      const n = createTestClient();
      const result = await n.channels.list();
      assert.equal(result.length, 1);
      assert.equal(result[0].provider, 'aws_ses');
    });
  });

  describe('get()', () => {
    it('GETs /channels/:channel', async () => {
      mock = mockFetch({ status: 200, body: envelope(SAMPLE_CHANNEL) });
      const n = createTestClient();
      const result = await n.channels.get('email');
      assert.equal(result.channel, 'email');
      assert.ok(mock.lastUrl().pathname.endsWith('/channels/email'));
    });
  });

  describe('update()', () => {
    it('PUTs to /channels/:channel', async () => {
      mock = mockFetch({ status: 200, body: envelope({ ...SAMPLE_CHANNEL, provider: 'sendgrid' }) });
      const n = createTestClient();
      const result = await n.channels.update('email', { provider: 'sendgrid' });
      assert.equal(result.provider, 'sendgrid');
      assert.equal(mock.lastRequest().method, 'PUT');
    });
  });

  describe('delete()', () => {
    it('DELETEs /channels/:channel', async () => {
      mock = mockFetch({ status: 204 });
      const n = createTestClient();
      await n.channels.delete('email');
      assert.equal(mock.lastRequest().method, 'DELETE');
      assert.ok(mock.lastUrl().pathname.endsWith('/channels/email'));
    });
  });

  describe('test()', () => {
    it('POSTs to /channels/:channel/test', async () => {
      mock = mockFetch({ status: 200, body: envelope({ success: true, message: 'Test notification enqueued for email channel' }) });
      const n = createTestClient();
      const result = await n.channels.test('email');
      assert.equal(result.success, true);
      assert.ok(result.message.includes('email'));
      assert.ok(mock.lastUrl().pathname.endsWith('/channels/email/test'));
    });
  });
});
