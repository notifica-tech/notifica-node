import type { NotificaClient } from '../client.ts';
import type {
  PaginatedResponse,
  RequestOptions,
  SingleResponse,
} from '../types/common.ts';
import type {
  InboxNotification,
  InboxUnreadCountResult,
  ListInboxNotificationsParams,
  MarkInboxReadAllResult,
  MarkInboxReadResult,
} from '../types/inbox.ts';

/**
 * Inbox público — usa publishable key (pk_*).
 * Este recurso permite consultar notificações usando a chave pública,
 * ideal para integração direta no frontend.
 */
export class Inbox {
  private readonly client: NotificaClient;

  constructor(client: NotificaClient) {
    this.client = client;
  }

  /**
   * Lista notificações do inbox.
   * Requer subscriber_id ou external_id como parâmetro de query.
   */
  async listNotifications(
    subscriberId: string,
    params?: Omit<ListInboxNotificationsParams, 'subscriber_id'>,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<InboxNotification>> {
    return this.client.list<InboxNotification>(
      '/inbox/notifications',
      { subscriber_id: subscriberId, ...params } as Record<string, unknown>,
      options,
    );
  }

  /**
   * Obtém a contagem de notificações não lidas.
   */
  async getUnreadCount(subscriberId: string, options?: RequestOptions): Promise<number> {
    const response = await this.client.get<SingleResponse<InboxUnreadCountResult>>(
      '/inbox/notifications/unread-count',
      { subscriber_id: subscriberId },
      options,
    );
    return response.data.count;
  }

  /**
   * Marca uma notificação como lida.
   */
  async markRead(notificationId: string, options?: RequestOptions): Promise<MarkInboxReadResult> {
    const response = await this.client.post<SingleResponse<MarkInboxReadResult>>(
      `/inbox/notifications/${notificationId}/read`,
      undefined,
      options,
    );
    return response.data;
  }

  /**
   * Marca todas as notificações como lidas.
   * Requer subscriber_id como parâmetro de query.
   */
  async markAllRead(subscriberId: string, options?: RequestOptions): Promise<MarkInboxReadAllResult> {
    const response = await this.client.post<SingleResponse<MarkInboxReadAllResult>>(
      '/inbox/notifications/read-all',
      { subscriber_id: subscriberId },
      options,
    );
    return response.data;
  }
}
