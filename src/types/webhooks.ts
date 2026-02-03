import type { PaginationParams } from './common.ts';

// ── Create / Update ─────────────────────────────────

export interface CreateWebhookParams {
  /** URL de destino */
  url: string;
  /** Lista de eventos para escutar */
  events: string[];
}

export interface UpdateWebhookParams {
  url?: string;
  events?: string[];
  active?: boolean;
}

// ── Webhook object ──────────────────────────────────

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  /** Retornado apenas na criação */
  signing_secret?: string;
  created_at: string;
  updated_at: string;
}

// ── Deliveries ──────────────────────────────────────

export interface WebhookDelivery {
  id: string;
  event: string;
  status: string;
  status_code?: number;
  response_body?: string;
  created_at: string;
}

// ── List params ─────────────────────────────────────

export interface ListWebhooksParams extends PaginationParams {}

export interface ListDeliveriesParams {
  limit?: number;
}
