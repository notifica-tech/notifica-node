import type { NotificaClient } from '../client.js';
import type { PaginatedResponse, RequestOptions, SingleResponse } from '../types/common.js';
import type {
  CreateWebhookParams,
  ListDeliveriesParams,
  ListWebhooksParams,
  UpdateWebhookParams,
  Webhook,
  WebhookDelivery,
} from '../types/webhooks.js';
import { NotificaError } from '../errors.js';

export class Webhooks {
  constructor(private readonly client: NotificaClient) {}

  /**
   * Cria um novo webhook.
   * ⚠️ O signing_secret é retornado apenas na criação. Salve-o!
   *
   * @example
   * ```ts
   * const webhook = await notifica.webhooks.create({
   *   url: 'https://meuapp.com.br/webhooks/notifica',
   *   events: ['notification.delivered', 'notification.failed'],
   * });
   * // Salve: webhook.signing_secret
   * ```
   */
  async create(params: CreateWebhookParams, options?: RequestOptions): Promise<Webhook> {
    const response = await this.client.post<SingleResponse<Webhook>>(
      '/webhooks',
      params,
      options,
    );
    return response.data;
  }

  /**
   * Lista webhooks com paginação.
   */
  async list(params?: ListWebhooksParams, options?: RequestOptions): Promise<PaginatedResponse<Webhook>> {
    return this.client.list<Webhook>('/webhooks', params as Record<string, unknown>, options);
  }

  /**
   * Obtém detalhes de um webhook.
   */
  async get(id: string, options?: RequestOptions): Promise<Webhook> {
    return this.client.getOne<Webhook>(`/webhooks/${id}`, options);
  }

  /**
   * Atualiza um webhook.
   */
  async update(id: string, params: UpdateWebhookParams, options?: RequestOptions): Promise<Webhook> {
    const response = await this.client.put<SingleResponse<Webhook>>(
      `/webhooks/${id}`,
      params,
      options,
    );
    return response.data;
  }

  /**
   * Deleta um webhook.
   */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    await this.client.delete(`/webhooks/${id}`, options);
  }

  /**
   * Envia um evento de teste para o webhook.
   */
  async test(id: string, options?: RequestOptions): Promise<void> {
    await this.client.post(`/webhooks/${id}/test`, undefined, options);
  }

  /**
   * Lista entregas recentes de um webhook.
   */
  async listDeliveries(id: string, params?: ListDeliveriesParams, options?: RequestOptions): Promise<WebhookDelivery[]> {
    const response = await this.client.get<{ data: WebhookDelivery[] }>(
      `/webhooks/${id}/deliveries`,
      params as Record<string, unknown>,
      options,
    );
    return response.data;
  }

  // ── Webhook signature verification ──────────────────

  /**
   * Verifica a assinatura HMAC de um payload de webhook.
   *
   * Use para validar que o payload foi realmente enviado pelo Notifica.
   *
   * @param payload — Body da request (string ou Buffer)
   * @param signature — Valor do header `X-Notifica-Signature`
   * @param secret — signing_secret do webhook
   * @returns true se a assinatura é válida
   *
   * @example
   * ```ts
   * app.post('/webhooks/notifica', (req, res) => {
   *   const payload = req.body; // raw body string
   *   const signature = req.headers['x-notifica-signature'];
   *   const secret = process.env.WEBHOOK_SECRET;
   *
   *   if (!notifica.webhooks.verify(payload, signature, secret)) {
   *     return res.status(401).send('Invalid signature');
   *   }
   *
   *   // Processar evento...
   *   res.status(200).send('OK');
   * });
   * ```
   */
  async verify(
    payload: string | ArrayBuffer | Uint8Array,
    signature: string,
    secret: string,
  ): Promise<boolean> {
    if (!payload || !signature || !secret) {
      return false;
    }

    try {
      const encoder = new TextEncoder();

      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      );

      const payloadBytes = typeof payload === 'string'
        ? encoder.encode(payload)
        : payload instanceof ArrayBuffer
          ? new Uint8Array(payload)
          : payload;

      const signatureBytes = await crypto.subtle.sign('HMAC', key, payloadBytes);
      const computed = this.toHex(new Uint8Array(signatureBytes));

      return this.timingSafeEqual(computed, signature);
    } catch {
      return false;
    }
  }

  /**
   * Verifica a assinatura e lança erro se inválida.
   * Versão "fail-fast" do verify().
   */
  async verifyOrThrow(
    payload: string | ArrayBuffer | Uint8Array,
    signature: string,
    secret: string,
  ): Promise<void> {
    const valid = await this.verify(payload, signature, secret);
    if (!valid) {
      throw new NotificaError('Invalid webhook signature');
    }
  }

  private toHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Constant-time string comparison to prevent timing attacks.
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}
