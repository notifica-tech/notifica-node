import type { PaginationParams } from './common.ts';

// ── Audit Log Types ─────────────────────────────────

/**
 * Actions tracked in audit logs.
 * Format: resource.action
 */
export type AuditLogAction =
  // API Keys
  | 'api_key.created'
  | 'api_key.rotated'
  | 'api_key.revoked'
  // Team Members
  | 'team_member.invited'
  | 'team_member.removed'
  | 'team_member.role_changed'
  // Subscription
  | 'subscription.created'
  | 'subscription.plan_changed'
  | 'subscription.cancelled'
  | 'subscription.payment_failed'
  // Domains
  | 'domain.added'
  | 'domain.verified'
  | 'domain.removed'
  // Webhooks
  | 'webhook.created'
  | 'webhook.updated'
  | 'webhook.deleted';

/**
 * Type of resource affected by the audit action.
 */
export type AuditResourceType =
  | 'api_key'
  | 'team_member'
  | 'subscription'
  | 'domain'
  | 'webhook';

/**
 * Type of actor who performed the action.
 */
export type AuditActorType =
  | 'user'
  | 'api_key'
  | 'system';

/**
 * Actor who performed the audited action.
 */
export interface AuditActor {
  /** Actor type (user, api_key, system) */
  type: AuditActorType;
  /** Actor ID (user ID, API key ID, or null for system) */
  id: string | null;
  /** Actor display name or email */
  name?: string;
  /** IP address of the actor (when available) */
  ip_address?: string;
  /** User agent (when available) */
  user_agent?: string;
}

/**
 * Audit log entry.
 */
export interface AuditLog {
  /** Unique audit log ID */
  id: string;
  /** Action performed */
  action: AuditLogAction;
  /** Type of resource affected */
  resource_type: AuditResourceType;
  /** ID of the affected resource */
  resource_id: string;
  /** Actor who performed the action */
  actor: AuditActor;
  /** Additional metadata about the action */
  metadata?: Record<string, unknown>;
  /** Previous state (for updates) */
  previous_state?: Record<string, unknown>;
  /** New state (for creates/updates) */
  new_state?: Record<string, unknown>;
  /** Organization/team ID */
  organization_id: string;
  /** Timestamp when the action occurred */
  created_at: string;
}

// ── List Params ─────────────────────────────────────

export interface ListAuditLogsParams extends PaginationParams {
  /** Filter by action (e.g., 'api_key.created') */
  action?: AuditLogAction;
  /** Filter by resource type (e.g., 'api_key', 'webhook') */
  resource_type?: AuditResourceType;
  /** Filter by resource ID */
  resource_id?: string;
  /** Filter by actor type */
  actor_type?: AuditActorType;
  /** Filter by actor ID */
  actor_id?: string;
  /** Start date (ISO 8601) */
  start_date?: string;
  /** End date (ISO 8601) */
  end_date?: string;
}
