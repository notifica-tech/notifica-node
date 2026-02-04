import type { PaginationParams } from './common.ts';

// ═══════════════════════════════════════════════════
// SMS Provider Types
// ═══════════════════════════════════════════════════

export type SmsProviderType = 'twilio' | 'zenvia' | 'custom';

// ── Twilio Config ──────────────────────────────────

export interface TwilioConfig {
  /** Account SID da Twilio */
  account_sid: string;
  /** Auth Token da Twilio */
  auth_token: string;
  /** Número de telefone Twilio (E.164) */
  phone_number: string;
  /** SID do Messaging Service (opcional) */
  messaging_service_sid?: string;
}

// ── Zenvia Config ──────────────────────────────────

export interface ZenviaConfig {
  /** API Key da Zenvia */
  api_key: string;
  /** Nome do remetente (ex: sua empresa) */
  from: string;
}

// ── Custom Config ──────────────────────────────────

export interface CustomSmsConfig {
  /** URL do webhook para envio de SMS */
  webhook_url: string;
  /** Headers customizados para o webhook */
  headers?: Record<string, string>;
  /** Timeout em ms (default: 30000) */
  timeout?: number;
}

// ── SMS Provider Configuration ─────────────────────

export interface SmsProviderConfig {
  type: SmsProviderType;
  /** Nome identificador do provedor */
  name: string;
  /** Configuração específica do provedor */
  config: TwilioConfig | ZenviaConfig | CustomSmsConfig;
  /** Se o provedor está ativo */
  active?: boolean;
  /** Regiões permitidas (códigos ISO 3166-1 alpha-2) */
  allowed_regions?: string[];
  /** Limite de rate limit por minuto */
  rate_limit_per_minute?: number;
}

// ── SMS Provider Object ────────────────────────────

export interface SmsProvider {
  id: string;
  type: SmsProviderType;
  name: string;
  /** Configuração mascarada (credenciais parciais) */
  config_mask?: string;
  active: boolean;
  is_default: boolean;
  allowed_regions: string[] | null;
  rate_limit_per_minute: number | null;
  created_at: string;
  updated_at: string;
}

// ── Create / Update Params ─────────────────────────

export interface CreateSmsProviderParams {
  type: SmsProviderType;
  name: string;
  config: TwilioConfig | ZenviaConfig | CustomSmsConfig;
  active?: boolean;
  allowed_regions?: string[];
  rate_limit_per_minute?: number;
}

export interface UpdateSmsProviderParams {
  name?: string;
  config?: TwilioConfig | ZenviaConfig | CustomSmsConfig;
  active?: boolean;
  allowed_regions?: string[];
  rate_limit_per_minute?: number;
}

// ── Validation & Test ──────────────────────────────

export interface ValidateSmsProviderParams {
  type: SmsProviderType;
  config: TwilioConfig | ZenviaConfig | CustomSmsConfig;
}

export interface ValidateSmsProviderResult {
  valid: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface TestSmsProviderParams {
  /** ID do provedor (para provedores já criados) */
  provider_id?: string;
  /** Configuração para teste (para validar antes de criar) */
  config?: SmsProviderConfig;
  /** Número de telefone de destino para teste (E.164) */
  to: string;
  /** Mensagem de teste (opcional) */
  message?: string;
}

export interface TestSmsProviderResult {
  success: boolean;
  message: string;
  message_id?: string;
}

// ═══════════════════════════════════════════════════
// SMS Compliance Types
// ═══════════════════════════════════════════════════

export interface SmsComplianceSettings {
  /** Horário comercial permitido (formato HH:MM) */
  allowed_hours_start: string | null;
  /** Horário comercial permitido (formato HH:MM) */
  allowed_hours_end: string | null;
  /** Dias da semana permitidos (0=Domingo, 6=Sábado) */
  allowed_weekdays: number[] | null;
  /** Feriados nacionais brasileiros são respeitados automaticamente */
  respect_national_holidays: boolean;
  /** Feriados adicionais (formato MM-DD) */
  custom_holidays: string[] | null;
  /** Mensagem padrão de opt-out */
  opt_out_message: string | null;
  /** Palavras-chave para opt-out (ex: "SAIR, CANCELAR") */
  opt_out_keywords: string[] | null;
  /** Horas de quarentena após opt-out */
  opt_out_cooldown_hours: number | null;
  /** Mensagem de confirmação de opt-in */
  opt_in_confirmation_message: string | null;
}

export interface UpdateSmsComplianceParams {
  allowed_hours_start?: string;
  allowed_hours_end?: string;
  allowed_weekdays?: number[];
  respect_national_holidays?: boolean;
  custom_holidays?: string[];
  opt_out_message?: string;
  opt_out_keywords?: string[];
  opt_out_cooldown_hours?: number;
  opt_in_confirmation_message?: string;
}

// ── Compliance Analytics ───────────────────────────

export interface SmsComplianceAnalytics {
  period_start: string;
  period_end: string;
  total_messages: number;
  messages_blocked_by_compliance: number;
  opt_outs_received: number;
  opt_ins_received: number;
  violations_by_type: Record<string, number>;
}

// ── Compliance Logs ────────────────────────────────

export interface SmsComplianceLog {
  id: string;
  message_id: string;
  phone: string;
  action: 'blocked' | 'allowed' | 'opt_out' | 'opt_in';
  reason?: string;
  created_at: string;
}

export interface ListComplianceLogsParams extends PaginationParams {
  phone?: string;
  action?: 'blocked' | 'allowed' | 'opt_out' | 'opt_in';
  start_date?: string;
  end_date?: string;
}

// ═══════════════════════════════════════════════════
// SMS Consent Types
// ═══════════════════════════════════════════════════

export type SmsConsentStatus = 'opted_in' | 'opted_out' | 'pending';
export type SmsConsentSource = 'manual' | 'import' | 'api' | 'webhook' | 'opt_out_reply' | 'opt_in_reply';

export interface SmsConsent {
  phone: string;
  status: SmsConsentStatus;
  source: SmsConsentSource;
  metadata?: Record<string, unknown>;
  opted_in_at: string | null;
  opted_out_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Create / Import Params ─────────────────────────

export interface CreateSmsConsentParams {
  phone: string;
  status?: SmsConsentStatus;
  source?: SmsConsentSource;
  metadata?: Record<string, unknown>;
}

export interface BulkImportSmsConsentParams {
  consents: CreateSmsConsentParams[];
}

export interface BulkImportSmsConsentResult {
  imported: number;
  errors?: Array<{ phone: string; error: string }>;
}

// ── Consent Summary ────────────────────────────────

export interface SmsConsentSummary {
  total: number;
  opted_in: number;
  opted_out: number;
  pending: number;
  by_source: Record<SmsConsentSource, number>;
}

// ── List Params ────────────────────────────────────

export interface ListSmsConsentsParams extends PaginationParams {
  phone?: string;
  status?: SmsConsentStatus;
  source?: SmsConsentSource;
}
