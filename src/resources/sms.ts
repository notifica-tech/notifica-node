import type { NotificaClient } from '../client.ts';
import type {
  PaginatedResponse,
  RequestOptions,
  SingleResponse,
} from '../types/common.ts';
import type {
  BulkImportSmsConsentParams,
  BulkImportSmsConsentResult,
  CreateSmsConsentParams,
  CreateSmsProviderParams,
  ListComplianceLogsParams,
  ListSmsConsentsParams,
  SmsComplianceAnalytics,
  SmsComplianceLog,
  SmsComplianceSettings,
  SmsConsent,
  SmsConsentSummary,
  SmsProvider,
  TestSmsProviderParams,
  TestSmsProviderResult,
  UpdateSmsComplianceParams,
  UpdateSmsProviderParams,
  ValidateSmsProviderParams,
  ValidateSmsProviderResult,
} from '../types/sms.ts';

// ═══════════════════════════════════════════════════
// Providers Sub-resource
// ═══════════════════════════════════════════════════

class SmsProviders {
  private readonly client: NotificaClient;

  constructor(client: NotificaClient) {
    this.client = client;
  }

  /**
   * Lista todos os provedores SMS configurados.
   */
  async list(options?: RequestOptions): Promise<SmsProvider[]> {
    const response = await this.client.get<{ data: SmsProvider[] }>(
      '/channels/sms/providers',
      undefined,
      options,
    );
    return response.data;
  }

  /**
   * Cria um novo provedor SMS (idempotent).
   */
  async create(params: CreateSmsProviderParams, options?: RequestOptions): Promise<SmsProvider> {
    const response = await this.client.post<SingleResponse<SmsProvider>>(
      '/channels/sms/providers',
      params,
      options,
    );
    return response.data;
  }

  /**
   * Obtém detalhes de um provedor SMS.
   */
  async get(id: string, options?: RequestOptions): Promise<SmsProvider> {
    return this.client.getOne<SmsProvider>(`/channels/sms/providers/${id}`, options);
  }

  /**
   * Atualiza um provedor SMS (PATCH parcial).
   */
  async update(id: string, params: UpdateSmsProviderParams, options?: RequestOptions): Promise<SmsProvider> {
    const response = await this.client.patch<SingleResponse<SmsProvider>>(
      `/channels/sms/providers/${id}`,
      params,
      options,
    );
    return response.data;
  }

  /**
   * Ativa um provedor SMS.
   */
  async activate(id: string, options?: RequestOptions): Promise<SmsProvider> {
    const response = await this.client.post<SingleResponse<SmsProvider>>(
      `/channels/sms/providers/${id}/activate`,
      undefined,
      options,
    );
    return response.data;
  }

  /**
   * Remove um provedor SMS.
   */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    await this.client.delete(`/channels/sms/providers/${id}`, options);
  }

  /**
   * Valida a configuração de um provedor SMS.
   */
  async validate(params: ValidateSmsProviderParams, options?: RequestOptions): Promise<ValidateSmsProviderResult> {
    const response = await this.client.post<SingleResponse<ValidateSmsProviderResult>>(
      '/channels/sms/providers/validate',
      params,
      options,
    );
    return response.data;
  }

  /**
   * Envia um SMS de teste.
   */
  async test(params: TestSmsProviderParams, options?: RequestOptions): Promise<TestSmsProviderResult> {
    const response = await this.client.post<SingleResponse<TestSmsProviderResult>>(
      '/channels/sms/providers/test',
      params,
      options,
    );
    return response.data;
  }
}

// ═══════════════════════════════════════════════════
// Compliance Sub-resource
// ═══════════════════════════════════════════════════

class SmsCompliance {
  private readonly client: NotificaClient;

  constructor(client: NotificaClient) {
    this.client = client;
  }

  /**
   * Obtém as configurações de compliance SMS.
   */
  async show(options?: RequestOptions): Promise<SmsComplianceSettings> {
    return this.client.getOne<SmsComplianceSettings>('/channels/sms/compliance', options);
  }

  /**
   * Atualiza as configurações de compliance SMS (PATCH parcial).
   */
  async update(params: UpdateSmsComplianceParams, options?: RequestOptions): Promise<SmsComplianceSettings> {
    const response = await this.client.patch<SingleResponse<SmsComplianceSettings>>(
      '/channels/sms/compliance',
      params,
      options,
    );
    return response.data;
  }

  /**
   * Obtém estatísticas de compliance.
   */
  async analytics(options?: RequestOptions): Promise<SmsComplianceAnalytics> {
    return this.client.getOne<SmsComplianceAnalytics>('/channels/sms/compliance/analytics', options);
  }

  /**
   * Lista logs de compliance com paginação.
   */
  async logs(params?: ListComplianceLogsParams, options?: RequestOptions): Promise<PaginatedResponse<SmsComplianceLog>> {
    return this.client.list<SmsComplianceLog>('/channels/sms/compliance/logs', params as Record<string, unknown>, options);
  }
}

// ═══════════════════════════════════════════════════
// Consents Sub-resource
// ═══════════════════════════════════════════════════

class SmsConsents {
  private readonly client: NotificaClient;

  constructor(client: NotificaClient) {
    this.client = client;
  }

  /**
   * Lista consentimentos SMS com paginação.
   */
  async list(params?: ListSmsConsentsParams, options?: RequestOptions): Promise<PaginatedResponse<SmsConsent>> {
    return this.client.list<SmsConsent>('/channels/sms/consents', params as Record<string, unknown>, options);
  }

  /**
   * Obtém resumo estatístico dos consentimentos.
   */
  async summary(options?: RequestOptions): Promise<SmsConsentSummary> {
    return this.client.getOne<SmsConsentSummary>('/channels/sms/consents/summary', options);
  }

  /**
   * Obtém o consentimento de um número específico.
   */
  async get(phone: string, options?: RequestOptions): Promise<SmsConsent> {
    return this.client.getOne<SmsConsent>(`/channels/sms/consents/${encodeURIComponent(phone)}`, options);
  }

  /**
   * Revoga o consentimento de um número (DELETE).
   */
  async revoke(phone: string, options?: RequestOptions): Promise<void> {
    await this.client.delete(`/channels/sms/consents/${encodeURIComponent(phone)}`, options);
  }

  /**
   * Cria ou atualiza um consentimento SMS (idempotent).
   */
  async create(params: CreateSmsConsentParams, options?: RequestOptions): Promise<SmsConsent> {
    const response = await this.client.post<SingleResponse<SmsConsent>>(
      '/channels/sms/consents',
      params,
      options,
    );
    return response.data;
  }

  /**
   * Importa consentimentos em lote.
   */
  async import(params: BulkImportSmsConsentParams, options?: RequestOptions): Promise<BulkImportSmsConsentResult> {
    const response = await this.client.post<SingleResponse<BulkImportSmsConsentResult>>(
      '/channels/sms/consents/import',
      params,
      options,
    );
    return response.data;
  }
}

// ═══════════════════════════════════════════════════
// Main SMS Resource
// ═══════════════════════════════════════════════════

export class Sms {
  readonly providers: SmsProviders;
  readonly compliance: SmsCompliance;
  readonly consents: SmsConsents;

  constructor(client: NotificaClient) {
    this.providers = new SmsProviders(client);
    this.compliance = new SmsCompliance(client);
    this.consents = new SmsConsents(client);
  }
}
