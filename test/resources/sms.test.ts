import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, createTestClient, envelope, paginatedEnvelope } from '../helpers.ts';

let mock: ReturnType<typeof mockFetch> | undefined;
afterEach(() => { mock?.restore(); });

const SAMPLE_SMS_PROVIDER = {
  id: 'smsp-1',
  type: 'twilio' as const,
  name: 'Twilio Principal',
  active: true,
  is_default: true,
  allowed_regions: ['BR'],
  rate_limit_per_minute: 100,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const SAMPLE_SMS_CONSENT = {
  phone: '+5511999998888',
  status: 'opted_in' as const,
  source: 'api' as const,
  metadata: { campaign: 'welcome' },
  opted_in_at: '2024-01-01T00:00:00Z',
  opted_out_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const SAMPLE_COMPLIANCE_SETTINGS = {
  allowed_hours_start: '08:00',
  allowed_hours_end: '20:00',
  allowed_weekdays: [1, 2, 3, 4, 5],
  respect_national_holidays: true,
  custom_holidays: ['12-25'],
  opt_out_message: 'Responda SAIR para cancelar.',
  opt_out_keywords: ['SAIR', 'CANCELAR', 'STOP'],
  opt_out_cooldown_hours: 24,
  opt_in_confirmation_message: 'Obrigado por se inscrever!',
};

const SAMPLE_COMPLIANCE_LOG = {
  id: 'log-1',
  message_id: 'msg-1',
  phone: '+5511999998888',
  action: 'allowed' as const,
  reason: 'within business hours',
  created_at: '2024-01-01T12:00:00Z',
};

describe('Sms', () => {
  describe('providers', () => {
    describe('list()', () => {
      it('GETs /channels/sms/providers', async () => {
        mock = mockFetch({ status: 200, body: { data: [SAMPLE_SMS_PROVIDER] } });
        const n = createTestClient();
        const result = await n.sms.providers.list();
        assert.equal(result.length, 1);
        assert.equal(result[0].type, 'twilio');
        assert.equal(mock.lastRequest().method, 'GET');
        assert.equal(mock.lastUrl().pathname, '/v1/channels/sms/providers');
      });
    });

    describe('create()', () => {
      it('POSTs to /channels/sms/providers', async () => {
        mock = mockFetch({ status: 201, body: envelope(SAMPLE_SMS_PROVIDER) });
        const n = createTestClient();
        const result = await n.sms.providers.create({
          type: 'twilio',
          name: 'Twilio Principal',
          config: {
            account_sid: 'ACxxx',
            auth_token: 'yyy',
            phone_number: '+5511999999999',
          },
        });
        assert.equal(result.name, 'Twilio Principal');
        assert.equal(mock.lastRequest().method, 'POST');
        const body = mock.lastRequest().body as Record<string, unknown>;
        assert.equal(body.type, 'twilio');
      });
    });

    describe('get()', () => {
      it('GETs /channels/sms/providers/:id', async () => {
        mock = mockFetch({ status: 200, body: envelope(SAMPLE_SMS_PROVIDER) });
        const n = createTestClient();
        const result = await n.sms.providers.get('smsp-1');
        assert.equal(result.id, 'smsp-1');
        assert.ok(mock.lastUrl().pathname.endsWith('/channels/sms/providers/smsp-1'));
      });
    });

    describe('update()', () => {
      it('PATCHes /channels/sms/providers/:id', async () => {
        mock = mockFetch({ status: 200, body: envelope({ ...SAMPLE_SMS_PROVIDER, name: 'Atualizado' }) });
        const n = createTestClient();
        const result = await n.sms.providers.update('smsp-1', { name: 'Atualizado' });
        assert.equal(result.name, 'Atualizado');
        assert.equal(mock.lastRequest().method, 'PATCH');
      });
    });

    describe('activate()', () => {
      it('POSTs to /channels/sms/providers/:id/activate', async () => {
        mock = mockFetch({ status: 200, body: envelope({ ...SAMPLE_SMS_PROVIDER, active: true }) });
        const n = createTestClient();
        const result = await n.sms.providers.activate('smsp-1');
        assert.equal(result.active, true);
        assert.ok(mock.lastUrl().pathname.endsWith('/activate'));
      });
    });

    describe('delete()', () => {
      it('DELETEs /channels/sms/providers/:id', async () => {
        mock = mockFetch({ status: 204 });
        const n = createTestClient();
        await n.sms.providers.delete('smsp-1');
        assert.equal(mock.lastRequest().method, 'DELETE');
      });
    });

    describe('validate()', () => {
      it('POSTs to /channels/sms/providers/validate', async () => {
        mock = mockFetch({ status: 200, body: envelope({ valid: true }) });
        const n = createTestClient();
        const result = await n.sms.providers.validate({
          type: 'twilio',
          config: {
            account_sid: 'ACxxx',
            auth_token: 'yyy',
            phone_number: '+5511999999999',
          },
        });
        assert.equal(result.valid, true);
        assert.equal(mock.lastRequest().method, 'POST');
        assert.equal(mock.lastUrl().pathname, '/v1/channels/sms/providers/validate');
      });
    });

    describe('test()', () => {
      it('POSTs to /channels/sms/providers/test', async () => {
        mock = mockFetch({ status: 200, body: envelope({ success: true, message: 'Test enviado' }) });
        const n = createTestClient();
        const result = await n.sms.providers.test({
          to: '+5511999998888',
          provider_id: 'smsp-1',
        });
        assert.equal(result.success, true);
        assert.equal(mock.lastRequest().method, 'POST');
        assert.equal(mock.lastUrl().pathname, '/v1/channels/sms/providers/test');
      });
    });
  });

  describe('compliance', () => {
    describe('show()', () => {
      it('GETs /channels/sms/compliance', async () => {
        mock = mockFetch({ status: 200, body: envelope(SAMPLE_COMPLIANCE_SETTINGS) });
        const n = createTestClient();
        const result = await n.sms.compliance.show();
        assert.equal(result.respect_national_holidays, true);
        assert.equal(mock.lastRequest().method, 'GET');
      });
    });

    describe('update()', () => {
      it('PATCHes /channels/sms/compliance', async () => {
        mock = mockFetch({ status: 200, body: envelope({ ...SAMPLE_COMPLIANCE_SETTINGS, allowed_hours_start: '09:00' }) });
        const n = createTestClient();
        const result = await n.sms.compliance.update({ allowed_hours_start: '09:00' });
        assert.equal(result.allowed_hours_start, '09:00');
        assert.equal(mock.lastRequest().method, 'PATCH');
      });
    });

    describe('analytics()', () => {
      it('GETs /channels/sms/compliance/analytics', async () => {
        mock = mockFetch({ status: 200, body: envelope({
          period_start: '2024-01-01',
          period_end: '2024-01-31',
          total_messages: 1000,
          messages_blocked_by_compliance: 50,
          opt_outs_received: 10,
          opt_ins_received: 5,
          violations_by_type: {},
        }) });
        const n = createTestClient();
        const result = await n.sms.compliance.analytics();
        assert.equal(result.total_messages, 1000);
        assert.equal(mock.lastRequest().method, 'GET');
      });
    });

    describe('logs()', () => {
      it('GETs /channels/sms/compliance/logs', async () => {
        mock = mockFetch({ status: 200, body: paginatedEnvelope([SAMPLE_COMPLIANCE_LOG]) });
        const n = createTestClient();
        const result = await n.sms.compliance.logs();
        assert.equal(result.data.length, 1);
        assert.equal(result.data[0].action, 'allowed');
        assert.equal(mock.lastRequest().method, 'GET');
      });
    });
  });

  describe('consents', () => {
    describe('list()', () => {
      it('GETs /channels/sms/consents', async () => {
        mock = mockFetch({ status: 200, body: paginatedEnvelope([SAMPLE_SMS_CONSENT]) });
        const n = createTestClient();
        const result = await n.sms.consents.list();
        assert.equal(result.data.length, 1);
        assert.equal(result.data[0].phone, '+5511999998888');
        assert.equal(mock.lastRequest().method, 'GET');
      });
    });

    describe('summary()', () => {
      it('GETs /channels/sms/consents/summary', async () => {
        mock = mockFetch({ status: 200, body: envelope({
          total: 100,
          opted_in: 80,
          opted_out: 15,
          pending: 5,
          by_source: { api: 50, manual: 30, import: 20 },
        }) });
        const n = createTestClient();
        const result = await n.sms.consents.summary();
        assert.equal(result.total, 100);
        assert.equal(result.opted_in, 80);
        assert.equal(mock.lastRequest().method, 'GET');
      });
    });

    describe('get()', () => {
      it('GETs /channels/sms/consents/:phone', async () => {
        mock = mockFetch({ status: 200, body: envelope(SAMPLE_SMS_CONSENT) });
        const n = createTestClient();
        const result = await n.sms.consents.get('+5511999998888');
        assert.equal(result.phone, '+5511999998888');
        assert.ok(mock.lastUrl().pathname.includes(encodeURIComponent('+5511999998888')));
      });
    });

    describe('revoke()', () => {
      it('DELETEs /channels/sms/consents/:phone', async () => {
        mock = mockFetch({ status: 204 });
        const n = createTestClient();
        await n.sms.consents.revoke('+5511999998888');
        assert.equal(mock.lastRequest().method, 'DELETE');
      });
    });

    describe('create()', () => {
      it('POSTs to /channels/sms/consents', async () => {
        mock = mockFetch({ status: 201, body: envelope(SAMPLE_SMS_CONSENT) });
        const n = createTestClient();
        const result = await n.sms.consents.create({
          phone: '+5511999998888',
          status: 'opted_in',
        });
        assert.equal(result.phone, '+5511999998888');
        assert.equal(mock.lastRequest().method, 'POST');
      });
    });

    describe('import()', () => {
      it('POSTs to /channels/sms/consents/import', async () => {
        mock = mockFetch({ status: 200, body: envelope({ imported: 10 }) });
        const n = createTestClient();
        const result = await n.sms.consents.import({
          consents: [
            { phone: '+5511999998888', status: 'opted_in' },
            { phone: '+5511999997777', status: 'opted_in' },
          ],
        });
        assert.equal(result.imported, 10);
        assert.equal(mock.lastRequest().method, 'POST');
        assert.equal(mock.lastUrl().pathname, '/v1/channels/sms/consents/import');
      });
    });
  });
});
