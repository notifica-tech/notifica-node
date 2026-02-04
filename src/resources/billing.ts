import type { NotificaClient } from '../client.ts';
import type {
  PaginatedResponse,
  RequestOptions,
  SingleResponse,
} from '../types/common.ts';
import type {
  BillingPlan,
  BillingSettings,
  BillingUsage,
  CalculateProrationParams,
  CalculateProrationResult,
  CancelSubscriptionParams,
  ChangePlanParams,
  CreatePaymentMethodParams,
  Invoice,
  ListInvoicesParams,
  PaymentMethod,
  ReactivateSubscriptionParams,
  SubscribeParams,
  Subscription,
  UpdatePaymentMethodParams,
} from '../types/billing.ts';

// ═══════════════════════════════════════════════════
// Plans Sub-resource
// ═══════════════════════════════════════════════════

class BillingPlans {
  private readonly client: NotificaClient;

  constructor(client: NotificaClient) {
    this.client = client;
  }

  /**
   * Lista todos os planos disponíveis.
   */
  async list(options?: RequestOptions): Promise<BillingPlan[]> {
    const response = await this.client.get<{ data: BillingPlan[] }>(
      '/billing/plans',
      undefined,
      options,
    );
    return response.data;
  }

  /**
   * Obtém detalhes de um plano específico.
   */
  async get(name: string, options?: RequestOptions): Promise<BillingPlan> {
    return this.client.getOne<BillingPlan>(`/billing/plans/${name}`, options);
  }
}

// ═══════════════════════════════════════════════════
// Settings Sub-resource
// ═══════════════════════════════════════════════════

class BillingSettingsResource {
  private readonly client: NotificaClient;

  constructor(client: NotificaClient) {
    this.client = client;
  }

  /**
   * Obtém as configurações de faturamento do tenant.
   */
  async get(options?: RequestOptions): Promise<BillingSettings> {
    return this.client.getOne<BillingSettings>('/billing/settings', options);
  }
}

// ═══════════════════════════════════════════════════
// Subscription Sub-resource
// ═══════════════════════════════════════════════════

class BillingSubscription {
  private readonly client: NotificaClient;

  constructor(client: NotificaClient) {
    this.client = client;
  }

  /**
   * Obtém a assinatura atual.
   */
  async get(options?: RequestOptions): Promise<Subscription> {
    return this.client.getOne<Subscription>('/billing/subscription', options);
  }

  /**
   * Cria uma nova assinatura (idempotent).
   */
  async subscribe(params: SubscribeParams, options?: RequestOptions): Promise<Subscription> {
    const response = await this.client.post<SingleResponse<Subscription>>(
      '/billing/subscribe',
      params,
      options,
    );
    return response.data;
  }

  /**
   * Altera o plano da assinatura (idempotent).
   */
  async changePlan(params: ChangePlanParams, options?: RequestOptions): Promise<Subscription> {
    const response = await this.client.post<SingleResponse<Subscription>>(
      '/billing/change-plan',
      params,
      options,
    );
    return response.data;
  }

  /**
   * Cancela a assinatura (idempotent).
   */
  async cancel(params?: CancelSubscriptionParams, options?: RequestOptions): Promise<Subscription> {
    const response = await this.client.post<SingleResponse<Subscription>>(
      '/billing/cancel',
      params,
      options,
    );
    return response.data;
  }

  /**
   * Calcula o valor de proration para mudança de plano.
   */
  async calculateProration(params: CalculateProrationParams, options?: RequestOptions): Promise<CalculateProrationResult> {
    const response = await this.client.post<SingleResponse<CalculateProrationResult>>(
      '/billing/calculate-proration',
      params,
      options,
    );
    return response.data;
  }

  /**
   * Reativa uma assinatura cancelada (idempotent).
   */
  async reactivate(params?: ReactivateSubscriptionParams, options?: RequestOptions): Promise<Subscription> {
    const response = await this.client.post<SingleResponse<Subscription>>(
      '/billing/reactivate',
      params,
      options,
    );
    return response.data;
  }
}

// ═══════════════════════════════════════════════════
// Usage Sub-resource
// ═══════════════════════════════════════════════════

class BillingUsageResource {
  private readonly client: NotificaClient;

  constructor(client: NotificaClient) {
    this.client = client;
  }

  /**
   * Obtém o uso atual e quotas do tenant.
   */
  async get(options?: RequestOptions): Promise<BillingUsage> {
    return this.client.getOne<BillingUsage>('/billing/usage', options);
  }
}

// ═══════════════════════════════════════════════════
// Invoices Sub-resource
// ═══════════════════════════════════════════════════

class BillingInvoices {
  private readonly client: NotificaClient;

  constructor(client: NotificaClient) {
    this.client = client;
  }

  /**
   * Lista faturas com paginação.
   */
  async list(params?: ListInvoicesParams, options?: RequestOptions): Promise<PaginatedResponse<Invoice>> {
    return this.client.list<Invoice>('/billing/invoices', params as Record<string, unknown>, options);
  }

  /**
   * Obtém detalhes de uma fatura.
   */
  async get(id: string, options?: RequestOptions): Promise<Invoice> {
    return this.client.getOne<Invoice>(`/billing/invoices/${id}`, options);
  }
}

// ═══════════════════════════════════════════════════
// Payment Methods Sub-resource
// ═══════════════════════════════════════════════════

class BillingPaymentMethods {
  private readonly client: NotificaClient;

  constructor(client: NotificaClient) {
    this.client = client;
  }

  /**
   * Lista métodos de pagamento.
   */
  async list(options?: RequestOptions): Promise<PaymentMethod[]> {
    const response = await this.client.get<{ data: PaymentMethod[] }>(
      '/billing/payment-methods',
      undefined,
      options,
    );
    return response.data;
  }

  /**
   * Cria um novo método de pagamento (idempotent).
   */
  async create(params: CreatePaymentMethodParams, options?: RequestOptions): Promise<PaymentMethod> {
    const response = await this.client.post<SingleResponse<PaymentMethod>>(
      '/billing/payment-methods',
      params,
      options,
    );
    return response.data;
  }

  /**
   * Obtém detalhes de um método de pagamento.
   */
  async get(id: string, options?: RequestOptions): Promise<PaymentMethod> {
    return this.client.getOne<PaymentMethod>(`/billing/payment-methods/${id}`, options);
  }

  /**
   * Atualiza um método de pagamento.
   */
  async update(id: string, params: UpdatePaymentMethodParams, options?: RequestOptions): Promise<PaymentMethod> {
    const response = await this.client.put<SingleResponse<PaymentMethod>>(
      `/billing/payment-methods/${id}`,
      params,
      options,
    );
    return response.data;
  }

  /**
   * Remove um método de pagamento.
   */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    await this.client.delete(`/billing/payment-methods/${id}`, options);
  }

  /**
   * Define um método de pagamento como padrão.
   */
  async setDefault(id: string, options?: RequestOptions): Promise<PaymentMethod> {
    const response = await this.client.post<SingleResponse<PaymentMethod>>(
      `/billing/payment-methods/${id}/set-default`,
      undefined,
      options,
    );
    return response.data;
  }
}

// ═══════════════════════════════════════════════════
// Main Billing Resource
// ═══════════════════════════════════════════════════

export class Billing {
  readonly plans: BillingPlans;
  readonly settings: BillingSettingsResource;
  readonly subscription: BillingSubscription;
  readonly usage: BillingUsageResource;
  readonly invoices: BillingInvoices;
  readonly paymentMethods: BillingPaymentMethods;

  constructor(client: NotificaClient) {
    this.plans = new BillingPlans(client);
    this.settings = new BillingSettingsResource(client);
    this.subscription = new BillingSubscription(client);
    this.usage = new BillingUsageResource(client);
    this.invoices = new BillingInvoices(client);
    this.paymentMethods = new BillingPaymentMethods(client);
  }
}
