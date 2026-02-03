import type { NotificaClient } from '../client.js';
import type { PaginatedResponse, RequestOptions, SingleResponse } from '../types/common.js';
import type {
  CreateDomainParams,
  Domain,
  DomainAlert,
  DomainHealth,
  ListDomainsParams,
} from '../types/domains.js';

export class Domains {
  constructor(private readonly client: NotificaClient) {}

  /**
   * Registra um novo domínio de envio.
   *
   * @example
   * ```ts
   * const domain = await notifica.domains.create({ domain: 'suaempresa.com.br' });
   * // Configure os registros DNS retornados em domain.dns_records
   * ```
   */
  async create(params: CreateDomainParams, options?: RequestOptions): Promise<Domain> {
    const response = await this.client.post<SingleResponse<Domain>>(
      '/domains',
      params,
      options,
    );
    return response.data;
  }

  /**
   * Lista domínios registrados.
   */
  async list(params?: ListDomainsParams, options?: RequestOptions): Promise<PaginatedResponse<Domain>> {
    return this.client.list<Domain>('/domains', params as Record<string, unknown>, options);
  }

  /**
   * Obtém detalhes de um domínio.
   */
  async get(id: string, options?: RequestOptions): Promise<Domain> {
    return this.client.getOne<Domain>(`/domains/${id}`, options);
  }

  /**
   * Dispara verificação DNS do domínio.
   */
  async verify(id: string, options?: RequestOptions): Promise<Domain> {
    const response = await this.client.post<SingleResponse<Domain>>(
      `/domains/${id}/verify`,
      undefined,
      options,
    );
    return response.data;
  }

  /**
   * Remove um domínio.
   */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    await this.client.delete(`/domains/${id}`, options);
  }

  // ── Health ──────────────────────────────────────────

  /**
   * Obtém status de saúde do domínio.
   */
  async getHealth(domainId: string, options?: RequestOptions): Promise<DomainHealth> {
    return this.client.getOne<DomainHealth>(`/domains/${domainId}/health`, options);
  }

  /**
   * Força verificação de saúde (rate limit: 1/min).
   */
  async checkHealth(domainId: string, options?: RequestOptions): Promise<DomainHealth> {
    const response = await this.client.post<SingleResponse<DomainHealth>>(
      `/domains/${domainId}/health/check`,
      undefined,
      options,
    );
    return response.data;
  }

  /**
   * Lista alertas de domínio.
   */
  async listAlerts(options?: RequestOptions): Promise<DomainAlert[]> {
    const response = await this.client.get<{ data: DomainAlert[] }>(
      '/domains/alerts',
      undefined,
      options,
    );
    return response.data;
  }
}
