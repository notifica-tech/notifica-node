import type { NotificaClient } from '../client.js';
import type { PaginatedResponse, RequestOptions, SingleResponse } from '../types/common.js';
import type {
  ListNotificationsParams,
  MessageAttempt,
  Notification,
  SendNotificationParams,
} from '../types/notifications.js';

export class Notifications {
  constructor(private readonly client: NotificaClient) {}

  /**
   * Envia uma notificação.
   * A notificação é enfileirada para entrega assíncrona.
   *
   * @example
   * ```ts
   * const notification = await notifica.notifications.send({
   *   channel: 'whatsapp',
   *   to: '+5511999999999',
   *   template: 'welcome',
   *   data: { name: 'João' },
   * });
   * ```
   */
  async send(params: SendNotificationParams, options?: RequestOptions): Promise<Notification> {
    const response = await this.client.post<SingleResponse<Notification>>(
      '/notifications',
      params,
      options,
    );
    return response.data;
  }

  /**
   * Lista notificações com paginação.
   *
   * @example
   * ```ts
   * const { data, meta } = await notifica.notifications.list({ channel: 'email', limit: 50 });
   * ```
   */
  async list(params?: ListNotificationsParams, options?: RequestOptions): Promise<PaginatedResponse<Notification>> {
    return this.client.list<Notification>('/notifications', params as Record<string, unknown>, options);
  }

  /**
   * Itera automaticamente por todas as notificações.
   *
   * @example
   * ```ts
   * for await (const notification of notifica.notifications.listAll({ channel: 'email' })) {
   *   console.log(notification.id);
   * }
   * ```
   */
  listAll(params?: Omit<ListNotificationsParams, 'cursor'>): AsyncIterableIterator<Notification> {
    return this.client.paginate<Notification>('/notifications', params as Record<string, unknown>);
  }

  /**
   * Obtém detalhes de uma notificação.
   */
  async get(id: string, options?: RequestOptions): Promise<Notification> {
    return this.client.getOne<Notification>(`/notifications/${id}`, options);
  }

  /**
   * Lista tentativas de entrega de uma notificação.
   */
  async listAttempts(notificationId: string, options?: RequestOptions): Promise<MessageAttempt[]> {
    const response = await this.client.get<{ data: MessageAttempt[] }>(
      `/notifications/${notificationId}/attempts`,
      undefined,
      options,
    );
    return response.data;
  }
}
