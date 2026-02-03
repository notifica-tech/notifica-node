import type { Channel, NotificationStatus, PaginationParams } from './common.ts';

// ── Send ────────────────────────────────────────────

export interface SendNotificationParams {
  /** Canal de entrega */
  channel: Channel;
  /** Destinatário (email, telefone E.164, subscriber_id, etc.) */
  to: string;
  /** Slug do template para renderizar */
  template?: string;
  /** Variáveis para o template ou conteúdo direto */
  data?: Record<string, unknown>;
  /** Metadados arbitrários (não processados) */
  metadata?: Record<string, unknown>;
}

// ── Notification object ─────────────────────────────

export interface Notification {
  id: string;
  channel: Channel;
  recipient: string;
  status: NotificationStatus;
  template_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

// ── Attempts ────────────────────────────────────────

export interface MessageAttempt {
  id: string;
  attempt_number: number;
  status: string;
  provider_response?: Record<string, unknown>;
  created_at: string;
}

// ── List params ─────────────────────────────────────

export interface ListNotificationsParams extends PaginationParams {
  /** Filtrar por status */
  status?: NotificationStatus;
  /** Filtrar por canal */
  channel?: Channel;
}
