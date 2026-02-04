import type { PaginationParams } from './common.ts';

// ═══════════════════════════════════════════════════
// Billing Plans
// ═══════════════════════════════════════════════════

export interface BillingPlan {
  /** Identificador único do plano */
  name: string;
  /** Nome de exibição */
  display_name: string;
  /** Descrição do plano */
  description: string | null;
  /** Preço mensal em centavos */
  monthly_price_cents: number;
  /** Preço anual em centavos (com desconto) */
  yearly_price_cents: number;
  /** Período de trial em dias */
  trial_days: number;
  /** Quotas incluídas no plano */
  quotas: BillingQuotas;
  /** Recursos habilitados */
  features: BillingFeatures;
  /** Se o plano está disponível para novas assinaturas */
  available: boolean;
  /** Ordem de exibição */
  sort_order: number;
}

export interface BillingQuotas {
  /** Limite de notificações por mês (null = ilimitado) */
  notifications_per_month: number | null;
  /** Limite de emails por mês */
  emails_per_month: number | null;
  /** Limite de SMS por mês */
  sms_per_month: number | null;
  /** Limite de WhatsApp por mês */
  whatsapp_per_month: number | null;
  /** Limite de subscribers */
  subscribers_limit: number | null;
  /** Limite de templates */
  templates_limit: number | null;
  /** Limite de workflows */
  workflows_limit: number | null;
  /** Limite de usuários do tenant */
  team_members_limit: number | null;
}

export interface BillingFeatures {
  /** Suporte a múltiplos canais */
  multi_channel: boolean;
  /** Workflows avançados */
  advanced_workflows: boolean;
  /** Webhooks personalizados */
  custom_webhooks: boolean;
  /** API dedicada */
  dedicated_api: boolean;
  /** Suporte prioritário */
  priority_support: boolean;
  /** SLA garantido */
  sla_guarantee: boolean;
  /** LGPD compliance avançado */
  advanced_lgpd: boolean;
  /** SSO/SAML */
  sso: boolean;
  /** Logs de auditoria */
  audit_logs: boolean;
}

// ═══════════════════════════════════════════════════
// Billing Settings
// ═══════════════════════════════════════════════════

export type BillingGatewayType = 'asaas' | 'efi';

export interface BillingSettings {
  /** Gateway de pagamento configurado */
  gateway: BillingGatewayType | null;
  /** Moeda (default: BRL) */
  currency: string;
  /** Fuso horário para faturamento */
  timezone: string;
  /** Dia de vencimento (1-31) */
  due_day: number | null;
  /** Informações fiscais */
  tax_info: BillingTaxInfo | null;
}

export interface BillingTaxInfo {
  /** Tipo de pessoa: física ou jurídica */
  person_type: 'individual' | 'company';
  /** CPF ou CNPJ */
  document: string;
  /** Razão social ou nome completo */
  legal_name: string;
  /** Email para faturas */
  billing_email: string;
  /** Endereço */
  address?: BillingAddress;
}

export interface BillingAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

// ═══════════════════════════════════════════════════
// Subscription
// ═══════════════════════════════════════════════════

export type SubscriptionStatus = 
  | 'trial'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'paused'
  | 'expired';

export type SubscriptionPeriod = 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  plan_name: string;
  status: SubscriptionStatus;
  period: SubscriptionPeriod;
  /** Data de início da assinatura */
  starts_at: string;
  /** Próxima data de cobrança */
  current_period_ends_at: string;
  /** Data de término (se cancelada) */
  ends_at: string | null;
  /** Dias restantes de trial */
  trial_days_remaining: number | null;
  /** Se está em trial */
  in_trial: boolean;
  /** Se será renovada automaticamente */
  auto_renew: boolean;
  /** Valor atual em centavos */
  current_price_cents: number;
  created_at: string;
  updated_at: string;
}

// ── Subscription Params ────────────────────────────

export interface SubscribeParams {
  plan_name: string;
  period?: SubscriptionPeriod;
  payment_method_id?: string;
  /** Código de cupom (opcional) */
  coupon_code?: string;
}

export interface ChangePlanParams {
  plan_name: string;
  period?: SubscriptionPeriod;
  /** Efetivar imediatamente ou no próximo ciclo */
  effective_immediately?: boolean;
}

export interface CancelSubscriptionParams {
  /** Efetivar no fim do período atual */
  at_period_end?: boolean;
  /** Motivo do cancelamento */
  reason?: string;
}

export interface ReactivateSubscriptionParams {
  payment_method_id?: string;
}

export interface CalculateProrationParams {
  plan_name: string;
  period?: SubscriptionPeriod;
}

export interface CalculateProrationResult {
  /** Crédito do plano atual */
  current_plan_credit_cents: number;
  /** Débito do novo plano */
  new_plan_debit_cents: number;
  /** Valor a pagar (pode ser negativo = crédito) */
  proration_amount_cents: number;
  /** Nova data de vencimento */
  next_billing_date: string;
}

// ═══════════════════════════════════════════════════
// Usage & Quotas
// ═══════════════════════════════════════════════════

export interface BillingUsage {
  /** Período atual */
  period_start: string;
  period_end: string;
  /** Uso atual */
  current: BillingUsageMetrics;
  /** Quotas do plano */
  quotas: BillingQuotas;
  /** Percentuais de uso (0-100, null = ilimitado) */
  percentages: BillingUsagePercentages;
}

export interface BillingUsageMetrics {
  notifications: number;
  emails: number;
  sms: number;
  whatsapp: number;
  subscribers: number;
  templates: number;
  workflows: number;
  team_members: number;
}

export interface BillingUsagePercentages {
  notifications: number | null;
  emails: number | null;
  sms: number | null;
  whatsapp: number | null;
  subscribers: number | null;
  templates: number | null;
  workflows: number | null;
  team_members: number | null;
}

// ═══════════════════════════════════════════════════
// Invoices
// ═══════════════════════════════════════════════════

export type InvoiceStatus = 
  | 'pending'
  | 'paid'
  | 'overdue'
  | 'canceled'
  | 'refunded'
  | 'processing';

export type PaymentMethodType = 'credit_card' | 'pix' | 'boleto';

export interface Invoice {
  id: string;
  subscription_id: string;
  status: InvoiceStatus;
  /** Valor em centavos */
  amount_cents: number;
  /** Valor pago em centavos */
  amount_paid_cents: number;
  currency: string;
  /** Descrição da fatura */
  description: string;
  /** Método de pagamento utilizado */
  payment_method: PaymentMethodType | null;
  /** Data de vencimento */
  due_date: string;
  /** Data de pagamento */
  paid_at: string | null;
  /** URL do boleto (se aplicável) */
  boleto_url: string | null;
  /** Código PIX (se aplicável) */
  pix_code: string | null;
  /** QR Code PIX (base64) */
  pix_qr_code: string | null;
  /** Linha digitável do boleto */
  boleto_line: string | null;
  /** PDF do boleto */
  boleto_pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListInvoicesParams extends PaginationParams {
  status?: InvoiceStatus;
  start_date?: string;
  end_date?: string;
}

// ═══════════════════════════════════════════════════
// Payment Methods
// ═══════════════════════════════════════════════════

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'elo' | 'hipercard' | 'diners' | 'discover' | 'jcb' | 'aura' | 'unknown';

export interface PaymentMethodCard {
  brand: CardBrand;
  last_four: string;
  exp_month: number;
  exp_year: number;
  holder_name: string;
}

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  /** Se é o método padrão */
  is_default: boolean;
  /** Dados do cartão (se type = credit_card) */
  card: PaymentMethodCard | null;
  /** Chave PIX (se type = pix) */
  pix_key: string | null;
  /** Tipo de chave PIX */
  pix_key_type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random' | null;
  /** Apelido do método */
  nickname: string | null;
  created_at: string;
  updated_at: string;
}

// ── Create / Update Params ─────────────────────────

export interface CreatePaymentMethodParams {
  type: PaymentMethodType;
  /** Token do cartão (do gateway de pagamento) */
  card_token?: string;
  /** Dados do cartão para tokenização */
  card?: CreateCardParams;
  /** Chave PIX */
  pix_key?: string;
  pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  /** Apelido identificador */
  nickname?: string;
  /** Definir como padrão */
  set_as_default?: boolean;
}

export interface CreateCardParams {
  number: string;
  holder_name: string;
  exp_month: number;
  exp_year: number;
  cvv: string;
}

export interface UpdatePaymentMethodParams {
  nickname?: string;
  /** Apenas para cartões - atualizar dados */
  exp_month?: number;
  exp_year?: number;
}
