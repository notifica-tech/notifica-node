import type { NotificaClient } from '../client.ts';
import type {
  RequestOptions,
  SingleResponse,
} from '../types/common.ts';
import type {
  InboxEmbedSettings,
  RotateEmbedKeyResult,
  UpdateInboxEmbedSettingsParams,
} from '../types/inbox-embed.ts';

export class InboxEmbed {
  private readonly client: NotificaClient;

  constructor(client: NotificaClient) {
    this.client = client;
  }

  /**
   * Obtém as configurações do inbox embed.
   */
  async getSettings(options?: RequestOptions): Promise<InboxEmbedSettings> {
    return this.client.getOne<InboxEmbedSettings>('/inbox-embed/settings', options);
  }

  /**
   * Atualiza as configurações do inbox embed.
   */
  async updateSettings(params: UpdateInboxEmbedSettingsParams, options?: RequestOptions): Promise<InboxEmbedSettings> {
    const response = await this.client.put<SingleResponse<InboxEmbedSettings>>(
      '/inbox-embed/settings',
      params,
      options,
    );
    return response.data;
  }

  /**
   * Rotaciona a chave de embed.
   * A chave antiga continua funcionando por um período de grace period.
   */
  async rotateKey(options?: RequestOptions): Promise<RotateEmbedKeyResult> {
    const response = await this.client.post<SingleResponse<RotateEmbedKeyResult>>(
      '/inbox-embed/keys/rotate',
      undefined,
      options,
    );
    return response.data;
  }
}
