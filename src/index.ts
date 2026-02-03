import { NotificaClient, type NotificaClientConfig } from './client.js';
import { Notifications } from './resources/notifications.js';
import { Templates } from './resources/templates.js';
import { Workflows } from './resources/workflows.js';
import { Subscribers } from './resources/subscribers.js';
import { Channels } from './resources/channels.js';
import { Domains } from './resources/domains.js';
import { Webhooks } from './resources/webhooks.js';
import { ApiKeys } from './resources/api-keys.js';
import { Analytics } from './resources/analytics.js';

/**
 * Cliente oficial do Notifica para Node.js.
 *
 * @example
 * ```ts
 * import { Notifica } from '@notifica/node';
 *
 * const notifica = new Notifica('nk_live_...');
 *
 * // Enviar notificação
 * await notifica.notifications.send({
 *   channel: 'whatsapp',
 *   to: '+5511999999999',
 *   template: 'welcome',
 *   data: { name: 'João' },
 * });
 *
 * // Disparar workflow
 * await notifica.workflows.trigger('welcome-flow', {
 *   recipient: '+5511999999999',
 *   data: { name: 'João' },
 * });
 * ```
 */
export class Notifica {
  readonly notifications: Notifications;
  readonly templates: Templates;
  readonly workflows: Workflows;
  readonly subscribers: Subscribers;
  readonly channels: Channels;
  readonly domains: Domains;
  readonly webhooks: Webhooks;
  readonly apiKeys: ApiKeys;
  readonly analytics: Analytics;

  /**
   * Cria uma nova instância do cliente Notifica.
   *
   * @param apiKeyOrConfig — API key (string) ou objeto de configuração completo
   *
   * @example
   * ```ts
   * // Simples — apenas API key
   * const notifica = new Notifica('nk_live_...');
   *
   * // Configuração completa
   * const notifica = new Notifica({
   *   apiKey: 'nk_live_...',
   *   baseUrl: 'https://api.usenotifica.com.br/v1',
   *   timeout: 15000,
   *   maxRetries: 5,
   * });
   * ```
   */
  constructor(apiKeyOrConfig: string | NotificaClientConfig) {
    const config: NotificaClientConfig =
      typeof apiKeyOrConfig === 'string'
        ? { apiKey: apiKeyOrConfig }
        : apiKeyOrConfig;

    const client = new NotificaClient(config);

    this.notifications = new Notifications(client);
    this.templates = new Templates(client);
    this.workflows = new Workflows(client);
    this.subscribers = new Subscribers(client);
    this.channels = new Channels(client);
    this.domains = new Domains(client);
    this.webhooks = new Webhooks(client);
    this.apiKeys = new ApiKeys(client);
    this.analytics = new Analytics(client);
  }
}

// ── Re-exports ──────────────────────────────────────

export { NotificaClient, type NotificaClientConfig } from './client.js';

export {
  NotificaError,
  ApiError,
  ValidationError,
  RateLimitError,
  TimeoutError,
} from './errors.js';

export * from './types/index.js';

// Resource classes (for advanced usage / testing)
export { Notifications } from './resources/notifications.js';
export { Templates } from './resources/templates.js';
export { Workflows } from './resources/workflows.js';
export { Subscribers } from './resources/subscribers.js';
export { Channels } from './resources/channels.js';
export { Domains } from './resources/domains.js';
export { Webhooks } from './resources/webhooks.js';
export { ApiKeys } from './resources/api-keys.js';
export { Analytics } from './resources/analytics.js';
