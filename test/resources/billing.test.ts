import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockFetch, createTestClient, envelope, paginatedEnvelope } from '../helpers.ts';

let mock: ReturnType<typeof mockFetch> | undefined;
afterEach(() => { mock?.restore(); });

const SAMPLE_PLAN = {
  name: 'starter',
  display_name: 'Starter',
  description: 'Plano inicial',
  monthly_price_cents: 9900,
  yearly_price_cents: 99000,
  trial_days: 14,
  quotas: {
    notifications_per_month: 10000,
    emails_per_month: 5000,
    sms_per_month: 1000,
    whatsapp_per_month: 1000,
    subscribers_limit: 1000,
    templates_limit: 10,
    workflows_limit: 5,
    team_members_limit: 3,
  },
  features: {
    multi_channel: true,
    advanced_workflows: false,
    custom_webhooks: false,
    dedicated_api: false,
    priority_support: false,
    sla_guarantee: false,
    advanced_lgpd: true,
    sso: false,
    audit_logs: false,
  },
  available: true,
  sort_order: 1,
};

const SAMPLE_SUBSCRIPTION = {
  id: 'sub-1',
  plan_name: 'starter',
  status: 'active' as const,
  period: 'monthly' as const,
  starts_at: '2024-01-01T00:00:00Z',
  current_period_ends_at: '2024-02-01T00:00:00Z',
  ends_at: null,
  trial_days_remaining: null,
  in_trial: false,
  auto_renew: true,
  current_price_cents: 9900,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const SAMPLE_INVOICE = {
  id: 'inv-1',
  subscription_id: 'sub-1',
  status: 'paid' as const,
  amount_cents: 9900,
  amount_paid_cents: 9900,
  currency: 'BRL',
  description: 'Assinatura Starter - Jan/2024',
  payment_method: 'credit_card' as const,
  due_date: '2024-01-10',
  paid_at: '2024-01-01T00:00:00Z',
  boleto_url: null,
  pix_code: null,
  pix_qr_code: null,
  boleto_line: null,
  boleto_pdf_url: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const SAMPLE_PAYMENT_METHOD = {
  id: 'pm-1',
  type: 'credit_card' as const,
  is_default: true,
  card: {
    brand: 'visa' as const,
    last_four: '4242',
    exp_month: 12,
    exp_year: 2025,
    holder_name: 'João Silva',
  },
  pix_key: null,
  pix_key_type: null,
  nickname: 'Meu cartão',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const SAMPLE_BILLING_SETTINGS = {
  gateway: 'asaas' as const,
  currency: 'BRL',
  timezone: 'America/Sao_Paulo',
  due_day: 10,
  tax_info: {
    person_type: 'company' as const,
    document: '12345678000190',
    legal_name: 'Empresa LTDA',
    billing_email: 'financeiro@empresa.com.br',
    address: {
      street: 'Rua Teste',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01001000',
      country: 'BR',
    },
  },
};

describe('Billing', () => {
  describe('plans', () => {
    describe('list()', () => {
      it('GETs /billing/plans', async () => {
        mock = mockFetch({ status: 200, body: { data: [SAMPLE_PLAN] } });
        const n = createTestClient();
        const result = await n.billing.plans.list();
        assert.equal(result.length, 1);
        assert.equal(result[0].name, 'starter');
        assert.equal(mock.lastRequest().method, 'GET');
      });
    });

    describe('get()', () => {
      it('GETs /billing/plans/:name', async () => {
        mock = mockFetch({ status: 200, body: envelope(SAMPLE_PLAN) });
        const n = createTestClient();
        const result = await n.billing.plans.get('starter');
        assert.equal(result.name, 'starter');
        assert.ok(mock.lastUrl().pathname.endsWith('/billing/plans/starter'));
      });
    });
  });

  describe('settings', () => {
    describe('get()', () => {
      it('GETs /billing/settings', async () => {
        mock = mockFetch({ status: 200, body: envelope(SAMPLE_BILLING_SETTINGS) });
        const n = createTestClient();
        const result = await n.billing.settings.get();
        assert.equal(result.gateway, 'asaas');
        assert.equal(result.tax_info?.legal_name, 'Empresa LTDA');
        assert.equal(mock.lastRequest().method, 'GET');
      });
    });
  });

  describe('subscription', () => {
    describe('get()', () => {
      it('GETs /billing/subscription', async () => {
        mock = mockFetch({ status: 200, body: envelope(SAMPLE_SUBSCRIPTION) });
        const n = createTestClient();
        const result = await n.billing.subscription.get();
        assert.equal(result.plan_name, 'starter');
        assert.equal(result.status, 'active');
        assert.equal(mock.lastRequest().method, 'GET');
      });
    });

    describe('subscribe()', () => {
      it('POSTs to /billing/subscribe', async () => {
        mock = mockFetch({ status: 201, body: envelope(SAMPLE_SUBSCRIPTION) });
        const n = createTestClient();
        const result = await n.billing.subscription.subscribe({
          plan_name: 'starter',
          period: 'monthly',
        });
        assert.equal(result.plan_name, 'starter');
        assert.equal(mock.lastRequest().method, 'POST');
        assert.equal(mock.lastUrl().pathname, '/v1/billing/subscribe');
      });
    });

    describe('changePlan()', () => {
      it('POSTs to /billing/change-plan', async () => {
        mock = mockFetch({ status: 200, body: envelope({ ...SAMPLE_SUBSCRIPTION, plan_name: 'pro' }) });
        const n = createTestClient();
        const result = await n.billing.subscription.changePlan({
          plan_name: 'pro',
          effective_immediately: true,
        });
        assert.equal(result.plan_name, 'pro');
        assert.equal(mock.lastRequest().method, 'POST');
        assert.equal(mock.lastUrl().pathname, '/v1/billing/change-plan');
      });
    });

    describe('cancel()', () => {
      it('POSTs to /billing/cancel', async () => {
        mock = mockFetch({ status: 200, body: envelope({ ...SAMPLE_SUBSCRIPTION, status: 'canceled' }) });
        const n = createTestClient();
        const result = await n.billing.subscription.cancel({ at_period_end: true });
        assert.equal(result.status, 'canceled');
        assert.equal(mock.lastRequest().method, 'POST');
        assert.equal(mock.lastUrl().pathname, '/v1/billing/cancel');
      });
    });

    describe('calculateProration()', () => {
      it('POSTs to /billing/calculate-proration', async () => {
        mock = mockFetch({ status: 200, body: envelope({
          current_plan_credit_cents: 5000,
          new_plan_debit_cents: 15000,
          proration_amount_cents: 10000,
          next_billing_date: '2024-02-01',
        }) });
        const n = createTestClient();
        const result = await n.billing.subscription.calculateProration({
          plan_name: 'pro',
          period: 'monthly',
        });
        assert.equal(result.proration_amount_cents, 10000);
        assert.equal(mock.lastRequest().method, 'POST');
        assert.equal(mock.lastUrl().pathname, '/v1/billing/calculate-proration');
      });
    });

    describe('reactivate()', () => {
      it('POSTs to /billing/reactivate', async () => {
        mock = mockFetch({ status: 200, body: envelope({ ...SAMPLE_SUBSCRIPTION, status: 'active' }) });
        const n = createTestClient();
        const result = await n.billing.subscription.reactivate();
        assert.equal(result.status, 'active');
        assert.equal(mock.lastRequest().method, 'POST');
        assert.equal(mock.lastUrl().pathname, '/v1/billing/reactivate');
      });
    });
  });

  describe('usage', () => {
    describe('get()', () => {
      it('GETs /billing/usage', async () => {
        mock = mockFetch({ status: 200, body: envelope({
          period_start: '2024-01-01',
          period_end: '2024-01-31',
          current: {
            notifications: 500,
            emails: 300,
            sms: 50,
            whatsapp: 50,
            subscribers: 200,
            templates: 5,
            workflows: 3,
            team_members: 2,
          },
          quotas: SAMPLE_PLAN.quotas,
          percentages: {
            notifications: 5,
            emails: 6,
            sms: 5,
            whatsapp: 5,
            subscribers: 20,
            templates: 50,
            workflows: 60,
            team_members: 67,
          },
        }) });
        const n = createTestClient();
        const result = await n.billing.usage.get();
        assert.equal(result.current.notifications, 500);
        assert.equal(result.percentages.notifications, 5);
        assert.equal(mock.lastRequest().method, 'GET');
      });
    });
  });

  describe('invoices', () => {
    describe('list()', () => {
      it('GETs /billing/invoices', async () => {
        mock = mockFetch({ status: 200, body: paginatedEnvelope([SAMPLE_INVOICE]) });
        const n = createTestClient();
        const result = await n.billing.invoices.list();
        assert.equal(result.data.length, 1);
        assert.equal(result.data[0].status, 'paid');
        assert.equal(mock.lastRequest().method, 'GET');
      });
    });

    describe('get()', () => {
      it('GETs /billing/invoices/:id', async () => {
        mock = mockFetch({ status: 200, body: envelope(SAMPLE_INVOICE) });
        const n = createTestClient();
        const result = await n.billing.invoices.get('inv-1');
        assert.equal(result.id, 'inv-1');
        assert.ok(mock.lastUrl().pathname.endsWith('/billing/invoices/inv-1'));
      });
    });
  });

  describe('paymentMethods', () => {
    describe('list()', () => {
      it('GETs /billing/payment-methods', async () => {
        mock = mockFetch({ status: 200, body: { data: [SAMPLE_PAYMENT_METHOD] } });
        const n = createTestClient();
        const result = await n.billing.paymentMethods.list();
        assert.equal(result.length, 1);
        assert.equal(result[0].type, 'credit_card');
        assert.equal(mock.lastRequest().method, 'GET');
      });
    });

    describe('create()', () => {
      it('POSTs to /billing/payment-methods', async () => {
        mock = mockFetch({ status: 201, body: envelope(SAMPLE_PAYMENT_METHOD) });
        const n = createTestClient();
        const result = await n.billing.paymentMethods.create({
          type: 'credit_card',
          card_token: 'tok_visa',
          nickname: 'Meu cartão',
        });
        assert.equal(result.nickname, 'Meu cartão');
        assert.equal(mock.lastRequest().method, 'POST');
        assert.equal(mock.lastUrl().pathname, '/v1/billing/payment-methods');
      });
    });

    describe('get()', () => {
      it('GETs /billing/payment-methods/:id', async () => {
        mock = mockFetch({ status: 200, body: envelope(SAMPLE_PAYMENT_METHOD) });
        const n = createTestClient();
        const result = await n.billing.paymentMethods.get('pm-1');
        assert.equal(result.id, 'pm-1');
        assert.ok(mock.lastUrl().pathname.endsWith('/billing/payment-methods/pm-1'));
      });
    });

    describe('update()', () => {
      it('PUTs to /billing/payment-methods/:id', async () => {
        mock = mockFetch({ status: 200, body: envelope({ ...SAMPLE_PAYMENT_METHOD, nickname: 'Atualizado' }) });
        const n = createTestClient();
        const result = await n.billing.paymentMethods.update('pm-1', { nickname: 'Atualizado' });
        assert.equal(result.nickname, 'Atualizado');
        assert.equal(mock.lastRequest().method, 'PUT');
      });
    });

    describe('delete()', () => {
      it('DELETEs /billing/payment-methods/:id', async () => {
        mock = mockFetch({ status: 204 });
        const n = createTestClient();
        await n.billing.paymentMethods.delete('pm-1');
        assert.equal(mock.lastRequest().method, 'DELETE');
      });
    });

    describe('setDefault()', () => {
      it('POSTs to /billing/payment-methods/:id/set-default', async () => {
        mock = mockFetch({ status: 200, body: envelope({ ...SAMPLE_PAYMENT_METHOD, is_default: true }) });
        const n = createTestClient();
        const result = await n.billing.paymentMethods.setDefault('pm-1');
        assert.equal(result.is_default, true);
        assert.ok(mock.lastUrl().pathname.endsWith('/set-default'));
      });
    });
  });
});
