import type { Channel, PaginationParams, TemplateStatus } from './common.ts';

// ── Create / Update ─────────────────────────────────

export interface CreateTemplateParams {
  /** Canal alvo */
  channel: Channel;
  /** Identificador URL-safe */
  slug: string;
  /** Nome legível */
  name: string;
  /** Conteúdo com {{variáveis}} */
  content: string;
  /** Lista de variáveis (auto-extraída se omitida) */
  variables?: string[];
  /** Variantes por canal (subject, html_body, etc.) */
  variants?: Record<string, string>;
  /** Idioma (default: pt_BR) */
  language?: string;
  /** Status (default: draft) */
  status?: TemplateStatus;
  /** Metadados extras */
  metadata?: Record<string, unknown>;
  /** Referência a template externo */
  provider_template_id?: string;
}

export interface UpdateTemplateParams {
  name?: string;
  content?: string;
  variables?: string[];
  variants?: Record<string, string>;
  language?: string;
  status?: TemplateStatus;
  metadata?: Record<string, unknown>;
  provider_template_id?: string;
}

// ── Template object ─────────────────────────────────

export interface Template {
  id: string;
  slug: string;
  name: string;
  channel: Channel;
  content: string;
  variables: string[];
  variants?: Record<string, string>;
  language: string;
  status: TemplateStatus;
  metadata?: Record<string, unknown>;
  provider_template_id?: string;
  created_at: string;
  updated_at: string;
}

// ── Preview / Validate ──────────────────────────────

export interface PreviewTemplateParams {
  variables: Record<string, unknown>;
}

export interface PreviewContentParams {
  content: string;
  channel: Channel;
  variables?: Record<string, unknown>;
  variants?: Record<string, string>;
}

export interface PreviewResult {
  rendered: Record<string, string>;
  variables: string[];
  validation: ValidationResult;
}

export interface ValidateContentParams {
  content: string;
  channel: Channel;
  variants?: Record<string, string>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  variables?: string[];
}

// ── List params ─────────────────────────────────────

export interface ListTemplatesParams extends PaginationParams {
  /** Filtrar por canal */
  channel?: Channel;
  /** Filtrar por status */
  status?: TemplateStatus;
}
