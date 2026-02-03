import type { Channel } from './common.ts';

// ── Create / Update ─────────────────────────────────

export interface CreateChannelParams {
  /** Nome do canal */
  channel: Channel;
  /** Provider (ex: aws_ses, twilio, meta) */
  provider: string;
  /** Credenciais criptografadas */
  credentials: Record<string, unknown>;
  /** Configurações (from_address, from_name, etc.) */
  settings?: Record<string, unknown>;
}

export interface UpdateChannelParams {
  provider?: string;
  credentials?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

// ── Channel configuration object ────────────────────

export interface ChannelConfiguration {
  id: string;
  channel: Channel;
  provider: string;
  /** Credenciais nunca são retornadas na resposta */
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Test ────────────────────────────────────────────

export interface TestChannelResult {
  success: boolean;
  message: string;
}
