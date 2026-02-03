import type { PaginationParams } from './common.js';

// ── Create / Update ─────────────────────────────────

export interface CreateSubscriberParams {
  /** Seu identificador do usuário (upsert key) */
  external_id: string;
  /** Email do subscriber */
  email?: string;
  /** Telefone E.164 (ex: +5511999998888) */
  phone?: string;
  /** Nome de exibição */
  name?: string;
  /** Locale preferido */
  locale?: string;
  /** Timezone preferida */
  timezone?: string;
  /** Dados customizados */
  custom_properties?: Record<string, unknown>;
}

export interface UpdateSubscriberParams {
  email?: string;
  phone?: string;
  name?: string;
  locale?: string;
  timezone?: string;
  custom_properties?: Record<string, unknown>;
}

// ── Subscriber object ───────────────────────────────

export interface Subscriber {
  id: string;
  external_id: string;
  email?: string;
  phone?: string;
  name?: string;
  locale?: string;
  timezone?: string;
  custom_properties?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Preferences ─────────────────────────────────────

export interface NotificationPreference {
  category: string;
  channel: string;
  enabled: boolean;
}

export interface UpdatePreferencesParams {
  preferences: NotificationPreference[];
}

export interface SubscriberPreferences {
  preferences: NotificationPreference[];
}

// ── Bulk import ─────────────────────────────────────

export interface BulkImportParams {
  subscribers: CreateSubscriberParams[];
}

export interface BulkImportResult {
  imported: number;
  subscribers: Subscriber[];
}

// ── In-App notifications ────────────────────────────

export interface InAppNotification {
  id: string;
  title?: string;
  body?: string;
  action_url?: string;
  read: boolean;
  created_at: string;
}

export interface ListInAppParams {
  limit?: number;
  offset?: number;
  unread_only?: boolean;
}

export interface UnreadCountResult {
  count: number;
}

// ── List params ─────────────────────────────────────

export interface ListSubscribersParams extends PaginationParams {
  /** Busca por email, nome ou external_id */
  search?: string;
  /** Offset de paginação */
  offset?: number;
}
