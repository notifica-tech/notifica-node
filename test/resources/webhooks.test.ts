import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, createTestClient, envelope, paginatedEnvelope } from '../helpers.ts';
import { NotificaError } from '../../src/errors.ts';
import { Webhooks } from '../../src/resources/webhooks.ts';
import { NotificaClient } from '../../src/client.ts';

let mock: ReturnType<typeof mockFetch> | undefined;
afterEach(() => { mock?.restore(); });

const SAMPLE_WEBHOOK = {
  id: 'wh-1', url: 'https://app.test/hooks', events: ['notification.delivered'],
  active: true, created_at: '', updated_at: '',
};

describe('Webhooks', () => {
  describe('create()', () => {
    it('POSTs to /webhooks and returns signing_secret', async () => {
      mock = mockFetch({
        status: 201,
        body: envelope({ ...SAMPLE_WEBHOOK, signing_secret: 'whsec_abc123' }),
      });
      const n = createTestClient();
      const result = await n.webhooks.create({
        url: 'https://app.test/hooks',
        events: ['notification.delivered', 'notification.failed'],
      });
      assert.equal(result.id, 'wh-1');
      assert.equal(result.signing_secret, 'whsec_abc123');
      assert.equal(mock.lastUrl().pathname, '/v1/webhooks');
      assert.deepEqual(mock.lastRequest().body, {
        url: 'https://app.test/hooks',
        events: ['notification.delivered', 'notification.failed'],
      });
    });
  });

  describe('list()', () => {
    it('GETs /webhooks', async () => {
      mock = mockFetch({ status: 200, body: paginatedEnvelope([SAMPLE_WEBHOOK]) });
      const n = createTestClient();
      const result = await n.webhooks.list();
      assert.equal(result.data.length, 1);
    });
  });

  describe('get()', () => {
    it('GETs /webhooks/:id', async () => {
      mock = mockFetch({ status: 200, body: envelope(SAMPLE_WEBHOOK) });
      const n = createTestClient();
      const result = await n.webhooks.get('wh-1');
      assert.equal(result.url, 'https://app.test/hooks');
    });
  });

  describe('update()', () => {
    it('PUTs to /webhooks/:id', async () => {
      mock = mockFetch({ status: 200, body: envelope({ ...SAMPLE_WEBHOOK, active: false }) });
      const n = createTestClient();
      const result = await n.webhooks.update('wh-1', { active: false });
      assert.equal(result.active, false);
      assert.equal(mock.lastRequest().method, 'PUT');
    });
  });

  describe('delete()', () => {
    it('DELETEs /webhooks/:id', async () => {
      mock = mockFetch({ status: 204 });
      const n = createTestClient();
      await n.webhooks.delete('wh-1');
      assert.equal(mock.lastRequest().method, 'DELETE');
    });
  });

  describe('test()', () => {
    it('POSTs to /webhooks/:id/test', async () => {
      mock = mockFetch({ status: 200, body: {} });
      const n = createTestClient();
      await n.webhooks.test('wh-1');
      assert.equal(mock.lastRequest().method, 'POST');
      assert.ok(mock.lastUrl().pathname.endsWith('/webhooks/wh-1/test'));
    });
  });

  describe('listDeliveries()', () => {
    it('GETs /webhooks/:id/deliveries', async () => {
      mock = mockFetch({
        status: 200,
        body: {
          data: [
            { id: 'del-1', event: 'notification.delivered', status: 'success', status_code: 200, created_at: '' },
            { id: 'del-2', event: 'notification.failed', status: 'failed', status_code: 500, created_at: '' },
          ],
        },
      });
      const n = createTestClient();
      const deliveries = await n.webhooks.listDeliveries('wh-1', { limit: 10 });
      assert.equal(deliveries.length, 2);
      assert.equal(deliveries[0].status_code, 200);
      assert.equal(mock.lastUrl().searchParams.get('limit'), '10');
    });
  });
});

// ── Webhook signature verification ──────────────────

describe('Webhook signature verification', () => {
  // Helper: compute HMAC-SHA256 hex digest
  async function computeHmac(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function createWebhooks(): Webhooks {
    // Webhooks class only needs a client for CRUD, but verify doesn't use it.
    // We create a real instance just to access the verify method.
    const client = new NotificaClient({ apiKey: 'nk_test_x', baseUrl: 'https://x.local/v1' });
    return new Webhooks(client);
  }

  it('returns true for valid signature (string payload)', async () => {
    const webhooks = createWebhooks();
    const payload = '{"event":"notification.delivered","data":{"id":"123"}}';
    const secret = 'whsec_test_secret_123';
    const signature = await computeHmac(payload, secret);

    const valid = await webhooks.verify(payload, signature, secret);
    assert.equal(valid, true);
  });

  it('returns false for wrong signature', async () => {
    const webhooks = createWebhooks();
    const payload = '{"event":"test"}';
    const secret = 'whsec_secret';

    const valid = await webhooks.verify(payload, 'deadbeefcafebabe', secret);
    assert.equal(valid, false);
  });

  it('returns false for wrong secret', async () => {
    const webhooks = createWebhooks();
    const payload = '{"event":"test"}';
    const correctSig = await computeHmac(payload, 'correct_secret');

    const valid = await webhooks.verify(payload, correctSig, 'wrong_secret');
    assert.equal(valid, false);
  });

  it('returns false for tampered payload', async () => {
    const webhooks = createWebhooks();
    const secret = 'whsec_secret';
    const signature = await computeHmac('{"event":"original"}', secret);

    const valid = await webhooks.verify('{"event":"tampered"}', signature, secret);
    assert.equal(valid, false);
  });

  it('returns false for empty payload', async () => {
    const webhooks = createWebhooks();
    const valid = await webhooks.verify('', 'sig', 'secret');
    assert.equal(valid, false);
  });

  it('returns false for empty signature', async () => {
    const webhooks = createWebhooks();
    const valid = await webhooks.verify('payload', '', 'secret');
    assert.equal(valid, false);
  });

  it('returns false for empty secret', async () => {
    const webhooks = createWebhooks();
    const valid = await webhooks.verify('payload', 'sig', '');
    assert.equal(valid, false);
  });

  it('works with Uint8Array payload', async () => {
    const webhooks = createWebhooks();
    const payloadStr = '{"event":"test"}';
    const secret = 'whsec_secret';
    const signature = await computeHmac(payloadStr, secret);
    const payloadBytes = new TextEncoder().encode(payloadStr);

    const valid = await webhooks.verify(payloadBytes, signature, secret);
    assert.equal(valid, true);
  });

  it('works with ArrayBuffer payload', async () => {
    const webhooks = createWebhooks();
    const payloadStr = '{"event":"test"}';
    const secret = 'whsec_secret';
    const signature = await computeHmac(payloadStr, secret);
    const payloadBuffer = new TextEncoder().encode(payloadStr).buffer;

    const valid = await webhooks.verify(payloadBuffer, signature, secret);
    assert.equal(valid, true);
  });

  describe('verifyOrThrow()', () => {
    it('does not throw for valid signature', async () => {
      const webhooks = createWebhooks();
      const payload = '{"event":"test"}';
      const secret = 'whsec_secret';
      const signature = await computeHmac(payload, secret);

      await webhooks.verifyOrThrow(payload, signature, secret);
      // No throw = pass
    });

    it('throws NotificaError for invalid signature', async () => {
      const webhooks = createWebhooks();
      await assert.rejects(
        () => webhooks.verifyOrThrow('payload', 'wrong-sig', 'secret'),
        (err: unknown) => {
          assert.ok(err instanceof NotificaError);
          assert.ok(err.message.includes('Invalid webhook signature'));
          return true;
        },
      );
    });
  });
});
