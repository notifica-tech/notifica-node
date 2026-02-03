import type { NotificaClient } from '../client.js';
import type { RequestOptions, SingleResponse } from '../types/common.js';
import type { ApiKey, CreateApiKeyParams } from '../types/api-keys.js';

export class ApiKeys {
  constructor(private readonly client: NotificaClient) {}

  /**
   * Cria uma nova API key.
   * ⚠️ O raw_key é retornado apenas na criação. Salve-o!
   *
   * @example
   * ```ts
   * const key = await notifica.apiKeys.create({
   *   key_type: 'secret',
   *   label: 'Backend Production',
   *   environment: 'production',
   * });
   * // Salve: key.raw_key
   * ```
   */
  async create(params: CreateApiKeyParams, options?: RequestOptions): Promise<ApiKey> {
    const response = await this.client.post<SingleResponse<ApiKey>>(
      '/api-keys',
      params,
      options,
    );
    return response.data;
  }

  /**
   * Lista API keys (sem raw_key).
   */
  async list(options?: RequestOptions): Promise<ApiKey[]> {
    const response = await this.client.get<{ data: ApiKey[] }>(
      '/api-keys',
      undefined,
      options,
    );
    return response.data;
  }

  /**
   * Revoga (deleta) uma API key.
   */
  async revoke(id: string, options?: RequestOptions): Promise<void> {
    await this.client.delete(`/api-keys/${id}`, options);
  }
}
