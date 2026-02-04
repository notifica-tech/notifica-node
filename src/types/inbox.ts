import type { PaginationParams } from './common.ts';

// ═══════════════════════════════════════════════════
// Public Inbox Types (usa publishable key pk_*)
// ═══════════════════════════════════════════════════

/** Notificação do inbox público (similar ao InAppNotification de subscribers) */
export interface InboxNotification {
  id: string;
  /** Título da notificação */
  title: string | null;
  /** Corpo/conteúdo */
  body: string | null;
  /** URL para ação */
  action_url: string | null;
  /** Se já foi lida */
  read: boolean;
  /** Ícone/imagem (URL) */
  image_url: string | null;
  /** Categoria/tipo */
  category: string | null;
  /** Metadados customizados */
  metadata: Record<string, unknown> | null;
  /** Data de envio */
  sent_at: string;
  /** Data de criação */
  created_at: string;
}

// ── List Params ────────────────────────────────────

export interface ListInboxNotificationsParams extends PaginationParams {
  /** Filtrar apenas não lidas */
  unread_only?: boolean;
  /** Categoria específica */
  category?: string;
  /** Data de início (ISO 8601) */
  start_date?: string;
  /** Data de fim (ISO 8601) */
  end_date?: string;
}

// ── Unread Count ───────────────────────────────────

export interface InboxUnreadCountResult {
  count: number;
}

// ── Mark Read ──────────────────────────────────────

export interface MarkInboxReadResult {
  success: boolean;
  notification_id?: string;
}

export interface MarkInboxReadAllResult {
  success: boolean;
  marked_count: number;
}
