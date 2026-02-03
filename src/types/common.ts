// ── Pagination ──────────────────────────────────────

export interface PaginationParams {
  /** Máximo por página (default: 20, max: 100) */
  limit?: number;
  /** Cursor de paginação retornado na resposta anterior */
  cursor?: string;
}

export interface PaginationMeta {
  cursor: string | null;
  has_more: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ── Response envelopes ──────────────────────────────

export interface SingleResponse<T> {
  data: T;
}

// ── Error envelope ──────────────────────────────────

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// ── Common types ────────────────────────────────────

export type Channel = 'email' | 'whatsapp' | 'sms' | 'in_app' | 'push';

export type NotificationStatus =
  | 'pending'
  | 'processing'
  | 'delivered'
  | 'failed'
  | 'bounced'
  | 'rejected';

export type TemplateStatus = 'draft' | 'active';

export type Environment = 'production' | 'sandbox';

export type ApiKeyType = 'secret' | 'public';

// ── Request options ─────────────────────────────────

export interface RequestOptions {
  /** Chave de idempotência customizada para requests POST */
  idempotencyKey?: string;
  /** Timeout em milissegundos para esta request específica */
  timeout?: number;
  /** Signal para abortar a request */
  signal?: AbortSignal;
}
