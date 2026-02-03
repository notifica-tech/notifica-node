import type { NotificaClient } from '../client.ts';
import type { Channel, RequestOptions, SingleResponse } from '../types/common.ts';
import type {
  ChannelConfiguration,
  CreateChannelParams,
  TestChannelResult,
  UpdateChannelParams,
} from '../types/channels.ts';

export class Channels {
  private readonly client: NotificaClient;

  constructor(client: NotificaClient) {
    this.client = client;
  }

  /**
   * Configura um canal de notificação.
   *
   * @example
   * ```ts
   * const channel = await notifica.channels.create({
   *   channel: 'email',
   *   provider: 'aws_ses',
   *   credentials: {
   *     access_key_id: 'AKIA...',
   *     secret_access_key: '...',
   *     region: 'us-east-1',
   *   },
   *   settings: {
   *     from_address: 'noreply@empresa.com.br',
   *     from_name: 'Empresa',
   *   },
   * });
   * ```
   */
  async create(params: CreateChannelParams, options?: RequestOptions): Promise<ChannelConfiguration> {
    const response = await this.client.post<SingleResponse<ChannelConfiguration>>(
      '/channels',
      params,
      options,
    );
    return response.data;
  }

  /**
   * Lista todas as configurações de canal.
   */
  async list(options?: RequestOptions): Promise<ChannelConfiguration[]> {
    const response = await this.client.get<{ data: ChannelConfiguration[] }>(
      '/channels',
      undefined,
      options,
    );
    return response.data;
  }

  /**
   * Obtém a configuração de um canal específico.
   */
  async get(channel: Channel, options?: RequestOptions): Promise<ChannelConfiguration> {
    return this.client.getOne<ChannelConfiguration>(`/channels/${channel}`, options);
  }

  /**
   * Atualiza a configuração de um canal.
   */
  async update(channel: Channel, params: UpdateChannelParams, options?: RequestOptions): Promise<ChannelConfiguration> {
    const response = await this.client.put<SingleResponse<ChannelConfiguration>>(
      `/channels/${channel}`,
      params,
      options,
    );
    return response.data;
  }

  /**
   * Remove a configuração de um canal.
   */
  async delete(channel: Channel, options?: RequestOptions): Promise<void> {
    await this.client.delete(`/channels/${channel}`, options);
  }

  /**
   * Envia uma notificação de teste usando a configuração atual do canal.
   */
  async test(channel: Channel, options?: RequestOptions): Promise<TestChannelResult> {
    const response = await this.client.post<SingleResponse<TestChannelResult>>(
      `/channels/${channel}/test`,
      undefined,
      options,
    );
    return response.data;
  }
}
