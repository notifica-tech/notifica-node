import type { NotificaClient } from '../client.js';
import type { PaginatedResponse, RequestOptions, SingleResponse } from '../types/common.js';
import type {
  BulkImportParams,
  BulkImportResult,
  CreateSubscriberParams,
  InAppNotification,
  ListInAppParams,
  ListSubscribersParams,
  Subscriber,
  SubscriberPreferences,
  UnreadCountResult,
  UpdatePreferencesParams,
  UpdateSubscriberParams,
} from '../types/subscribers.js';

export class Subscribers {
  constructor(private readonly client: NotificaClient) {}

  /**
   * Cria ou atualiza um subscriber (upsert por external_id).
   * LGPD: registra consentimento automaticamente.
   *
   * @example
   * ```ts
   * const subscriber = await notifica.subscribers.create({
   *   external_id: 'user-123',
   *   email: 'joao@empresa.com.br',
   *   phone: '+5511999998888',
   *   name: 'João Silva',
   * });
   * ```
   */
  async create(params: CreateSubscriberParams, options?: RequestOptions): Promise<Subscriber> {
    const response = await this.client.post<SingleResponse<Subscriber>>(
      '/subscribers',
      params,
      options,
    );
    return response.data;
  }

  /**
   * Lista subscribers com paginação.
   */
  async list(params?: ListSubscribersParams, options?: RequestOptions): Promise<PaginatedResponse<Subscriber>> {
    return this.client.list<Subscriber>('/subscribers', params as Record<string, unknown>, options);
  }

  /**
   * Itera automaticamente por todos os subscribers.
   */
  listAll(params?: Omit<ListSubscribersParams, 'cursor'>): AsyncIterableIterator<Subscriber> {
    return this.client.paginate<Subscriber>('/subscribers', params as Record<string, unknown>);
  }

  /**
   * Obtém detalhes de um subscriber.
   */
  async get(id: string, options?: RequestOptions): Promise<Subscriber> {
    return this.client.getOne<Subscriber>(`/subscribers/${id}`, options);
  }

  /**
   * Atualiza um subscriber.
   */
  async update(id: string, params: UpdateSubscriberParams, options?: RequestOptions): Promise<Subscriber> {
    const response = await this.client.put<SingleResponse<Subscriber>>(
      `/subscribers/${id}`,
      params,
      options,
    );
    return response.data;
  }

  /**
   * Deleta um subscriber (soft delete com nullificação de PII — LGPD).
   * ⚠️ Irreversível: email, telefone e nome são removidos.
   */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    await this.client.delete(`/subscribers/${id}`, options);
  }

  // ── Preferences ─────────────────────────────────────

  /**
   * Obtém preferências de notificação do subscriber.
   */
  async getPreferences(id: string, options?: RequestOptions): Promise<SubscriberPreferences> {
    return this.client.getOne<SubscriberPreferences>(`/subscribers/${id}/preferences`, options);
  }

  /**
   * Atualiza preferências de notificação do subscriber.
   *
   * @example
   * ```ts
   * await notifica.subscribers.updatePreferences('sub_123', {
   *   preferences: [
   *     { category: 'marketing', channel: 'email', enabled: false },
   *     { category: 'transactional', channel: 'whatsapp', enabled: true },
   *   ],
   * });
   * ```
   */
  async updatePreferences(id: string, params: UpdatePreferencesParams, options?: RequestOptions): Promise<SubscriberPreferences> {
    const response = await this.client.put<SingleResponse<SubscriberPreferences>>(
      `/subscribers/${id}/preferences`,
      params,
      options,
    );
    return response.data;
  }

  // ── Bulk import ─────────────────────────────────────

  /**
   * Importa subscribers em lote (upsert transacional).
   * Se um subscriber falhar validação, todo o lote é revertido.
   */
  async bulkImport(params: BulkImportParams, options?: RequestOptions): Promise<BulkImportResult> {
    const response = await this.client.post<SingleResponse<BulkImportResult>>(
      '/subscribers/import',
      params,
      options,
    );
    return response.data;
  }

  // ── In-App Notifications ────────────────────────────

  /**
   * Lista notificações in-app de um subscriber.
   */
  async listNotifications(subscriberId: string, params?: ListInAppParams, options?: RequestOptions): Promise<{ data: InAppNotification[] }> {
    return this.client.get<{ data: InAppNotification[] }>(
      `/subscribers/${subscriberId}/notifications`,
      params as Record<string, unknown>,
      options,
    );
  }

  /**
   * Marca uma notificação in-app como lida.
   */
  async markRead(subscriberId: string, notificationId: string, options?: RequestOptions): Promise<void> {
    await this.client.post(
      `/subscribers/${subscriberId}/notifications/${notificationId}/read`,
      undefined,
      options,
    );
  }

  /**
   * Marca todas as notificações in-app como lidas.
   */
  async markAllRead(subscriberId: string, options?: RequestOptions): Promise<void> {
    await this.client.post(
      `/subscribers/${subscriberId}/notifications/read-all`,
      undefined,
      options,
    );
  }

  /**
   * Obtém contagem de notificações não lidas.
   */
  async getUnreadCount(subscriberId: string, options?: RequestOptions): Promise<number> {
    const response = await this.client.get<SingleResponse<UnreadCountResult>>(
      `/subscribers/${subscriberId}/notifications/unread-count`,
      undefined,
      options,
    );
    return response.data.count;
  }
}
