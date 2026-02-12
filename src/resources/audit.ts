import type { NotificaClient } from '../client.ts';
import type { PaginatedResponse, RequestOptions } from '../types/common.ts';
import type { AuditLog, ListAuditLogsParams } from '../types/audit.ts';

/**
 * Audit Logs resource.
 * 
 * ⚠️ **Admin Only**: This resource requires admin authentication (Bearer token from backoffice login).
 * Not available with regular API keys.
 * 
 * Use audit logs to track security-sensitive actions in your organization:
 * - API key lifecycle (created, rotated, revoked)
 * - Team member changes (invited, removed, role changes)
 * - Subscription events (created, plan changes, cancellation, payment failures)
 * - Domain management (added, verified, removed)
 * - Webhook configuration (created, updated, deleted)
 * 
 * @example
 * ```ts
 * // List recent audit logs
 * const logs = await notifica.audit.list({ limit: 50 });
 * 
 * // Filter by action type
 * const apiKeyLogs = await notifica.audit.list({
 *   action: 'api_key.created',
 *   limit: 20,
 * });
 * 
 * // Filter by resource type
 * const webhookLogs = await notifica.audit.list({
 *   resource_type: 'webhook',
 * });
 * ```
 */
export class Audit {
  private readonly client: NotificaClient;
  private readonly basePath = '/internal/audit-logs';

  constructor(client: NotificaClient) {
    this.client = client;
  }

  /**
   * List audit logs with optional filters.
   * 
   * ⚠️ **Admin Only**: Requires admin authentication.
   * 
   * @param params — Filter parameters
   * @param options — Request options
   * @returns Paginated list of audit logs
   * 
   * @example
   * ```ts
   * // List all recent logs
   * const { data, meta } = await notifica.audit.list({ limit: 100 });
   * 
   * // Filter by action
   * const logs = await notifica.audit.list({
   *   action: 'team_member.role_changed',
   * });
   * 
   * // Filter by date range
   * const logs = await notifica.audit.list({
   *   start_date: '2024-01-01T00:00:00Z',
   *   end_date: '2024-01-31T23:59:59Z',
   * });
   * 
   * // Filter by actor
   * const logs = await notifica.audit.list({
   *   actor_type: 'user',
   *   actor_id: 'user_123',
   * });
   * ```
   */
  async list(
    params?: ListAuditLogsParams,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<AuditLog>> {
    return this.client.list<AuditLog>(
      this.basePath,
      params as Record<string, unknown>,
      options,
    );
  }

  /**
   * Get a single audit log entry by ID.
   * 
   * ⚠️ **Admin Only**: Requires admin authentication.
   * 
   * @param id — Audit log ID
   * @param options — Request options
   * @returns The audit log entry
   * 
   * @example
   * ```ts
   * const log = await notifica.audit.get('audit_abc123');
   * console.log(log.action, log.actor.name, log.created_at);
   * ```
   */
  async get(id: string, options?: RequestOptions): Promise<AuditLog> {
    return this.client.getOne<AuditLog>(`${this.basePath}/${id}`, options);
  }

  /**
   * Async iterator for auto-pagination through all audit logs.
   * 
   * ⚠️ **Admin Only**: Requires admin authentication.
   * 
   * @param params — Filter parameters
   * @returns AsyncIterableIterator of audit logs
   * 
   * @example
   * ```ts
   * // Iterate through all audit logs
   * for await (const log of notifica.audit.paginate()) {
   *   console.log(log.action, log.actor.name);
   * }
   * 
   * // With filters
   * for await (const log of notifica.audit.paginate({ resource_type: 'api_key' })) {
   *   console.log(log.action, log.resource_id);
   * }
   * ```
   */
  async *paginate(params?: ListAuditLogsParams): AsyncIterableIterator<AuditLog> {
    yield* this.client.paginate<AuditLog>(
      this.basePath,
      params as Record<string, unknown>,
    );
  }
}
