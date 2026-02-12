import { NotificaClient, type NotificaClientConfig } from './client.ts';
import { Notifications } from './resources/notifications.ts';
import { Templates } from './resources/templates.ts';
import { Workflows } from './resources/workflows.ts';
import { Subscribers } from './resources/subscribers.ts';
import { Channels } from './resources/channels.ts';
import { Domains } from './resources/domains.ts';
import { Webhooks } from './resources/webhooks.ts';
import { ApiKeys } from './resources/api-keys.ts';
import { Analytics } from './resources/analytics.ts';
import { Sms } from './resources/sms.ts';
import { Billing } from './resources/billing.ts';
import { InboxEmbed } from './resources/inbox-embed.ts';
import { Inbox } from './resources/inbox.ts';
import { Audit } from './resources/audit.ts';

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
  readonly sms: Sms;
  readonly billing: Billing;
  readonly inboxEmbed: InboxEmbed;
  readonly inbox: Inbox;
  /** ⚠️ Admin Only: Requires admin authentication (Bearer token from backoffice) */
  readonly audit: Audit;

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
   *   baseUrl: 'https://app.usenotifica.com.br/v1',
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
    this.sms = new Sms(client);
    this.billing = new Billing(client);
    this.inboxEmbed = new InboxEmbed(client);
    this.inbox = new Inbox(client);
    this.audit = new Audit(client);
  }
}

// ── Re-exports ──────────────────────────────────────

export { NotificaClient, type NotificaClientConfig } from './client.ts';

export {
  NotificaError,
  ApiError,
  ValidationError,
  RateLimitError,
  TimeoutError,
} from './errors.ts';

export * from './types/index.ts';

// Resource classes (for advanced usage / testing)
export { Notifications } from './resources/notifications.ts';
export { Templates } from './resources/templates.ts';
export { Workflows } from './resources/workflows.ts';
export { Subscribers } from './resources/subscribers.ts';
export { Channels } from './resources/channels.ts';
export { Domains } from './resources/domains.ts';
export { Webhooks } from './resources/webhooks.ts';
export { ApiKeys } from './resources/api-keys.ts';
export { Analytics } from './resources/analytics.ts';
export { Sms } from './resources/sms.ts';
export { Billing } from './resources/billing.ts';
export { InboxEmbed } from './resources/inbox-embed.ts';
export { Inbox } from './resources/inbox.ts';
export { Audit } from './resources/audit.ts';
