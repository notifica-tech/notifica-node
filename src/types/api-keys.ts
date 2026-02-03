import type { ApiKeyType, Environment } from './common.ts';

// ── Create ──────────────────────────────────────────

export interface CreateApiKeyParams {
  key_type: ApiKeyType;
  label: string;
  environment: Environment;
}

// ── API Key object ──────────────────────────────────

export interface ApiKey {
  id: string;
  key_type: ApiKeyType;
  label: string;
  prefix: string;
  environment: Environment;
  /** Retornado apenas na criação */
  raw_key?: string;
  created_at: string;
}
