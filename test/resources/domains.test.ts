import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, createTestClient, envelope, paginatedEnvelope } from '../helpers.ts';

let mock: ReturnType<typeof mockFetch> | undefined;
afterEach(() => { mock?.restore(); });

const SAMPLE_DOMAIN = {
  id: 'dom-1', domain: 'empresa.com.br', status: 'pending',
  dns_records: { txt: { name: 'empresa.com.br', type: 'TXT', value: 'notifica-verification=abc' } },
  created_at: '', updated_at: '',
};

describe('Domains', () => {
  describe('create()', () => {
    it('POSTs to /domains and returns DNS records', async () => {
      mock = mockFetch({ status: 201, body: envelope(SAMPLE_DOMAIN) });
      const n = createTestClient();
      const result = await n.domains.create({ domain: 'empresa.com.br' });
      assert.equal(result.domain, 'empresa.com.br');
      assert.equal(result.status, 'pending');
      assert.ok(result.dns_records?.txt);
      assert.equal(mock.lastUrl().pathname, '/v1/domains');
    });
  });

  describe('list()', () => {
    it('GETs /domains', async () => {
      mock = mockFetch({ status: 200, body: paginatedEnvelope([SAMPLE_DOMAIN]) });
      const n = createTestClient();
      const result = await n.domains.list();
      assert.equal(result.data.length, 1);
    });
  });

  describe('get()', () => {
    it('GETs /domains/:id', async () => {
      mock = mockFetch({ status: 200, body: envelope(SAMPLE_DOMAIN) });
      const n = createTestClient();
      const result = await n.domains.get('dom-1');
      assert.equal(result.id, 'dom-1');
    });
  });

  describe('verify()', () => {
    it('POSTs to /domains/:id/verify', async () => {
      mock = mockFetch({ status: 200, body: envelope({ ...SAMPLE_DOMAIN, status: 'verified', verified_at: '2025-01-01T00:00:00Z' }) });
      const n = createTestClient();
      const result = await n.domains.verify('dom-1');
      assert.equal(result.status, 'verified');
      assert.ok(mock.lastUrl().pathname.endsWith('/domains/dom-1/verify'));
    });
  });

  describe('delete()', () => {
    it('DELETEs /domains/:id', async () => {
      mock = mockFetch({ status: 204 });
      const n = createTestClient();
      await n.domains.delete('dom-1');
      assert.equal(mock.lastRequest().method, 'DELETE');
    });
  });

  describe('getHealth()', () => {
    it('GETs /domains/:id/health', async () => {
      mock = mockFetch({
        status: 200,
        body: envelope({ domain_id: 'dom-1', dns_valid: true, dkim_valid: true, spf_valid: false, last_checked_at: '' }),
      });
      const n = createTestClient();
      const health = await n.domains.getHealth('dom-1');
      assert.equal(health.dns_valid, true);
      assert.equal(health.spf_valid, false);
      assert.ok(mock.lastUrl().pathname.endsWith('/domains/dom-1/health'));
    });
  });

  describe('checkHealth()', () => {
    it('POSTs to /domains/:id/health/check', async () => {
      mock = mockFetch({
        status: 200,
        body: envelope({ domain_id: 'dom-1', dns_valid: true, dkim_valid: true, spf_valid: true, last_checked_at: '' }),
      });
      const n = createTestClient();
      const health = await n.domains.checkHealth('dom-1');
      assert.equal(health.spf_valid, true);
      assert.ok(mock.lastUrl().pathname.endsWith('/domains/dom-1/health/check'));
    });
  });

  describe('listAlerts()', () => {
    it('GETs /domains/alerts', async () => {
      mock = mockFetch({
        status: 200,
        body: { data: [{ id: 'alert-1', domain_id: 'dom-1', alert_type: 'dns_degraded', message: 'SPF record missing', severity: 'warning', created_at: '' }] },
      });
      const n = createTestClient();
      const alerts = await n.domains.listAlerts();
      assert.equal(alerts.length, 1);
      assert.equal(alerts[0].alert_type, 'dns_degraded');
      assert.equal(mock.lastUrl().pathname, '/v1/domains/alerts');
    });
  });
});
