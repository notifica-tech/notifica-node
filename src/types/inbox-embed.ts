// ═══════════════════════════════════════════════════
// Inbox Embed Settings
// ═══════════════════════════════════════════════════

export interface InboxEmbedSettings {
  /** Se o inbox embed está habilitado */
  enabled: boolean;
  /** Tema: 'light', 'dark', ou 'auto' */
  theme: 'light' | 'dark' | 'auto';
  /** Posição do widget: 'bottom-right', 'bottom-left', 'top-right', 'top-left' */
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Título do widget */
  title: string | null;
  /** Cor primária (hex) */
  primary_color: string | null;
  /** Cor de fundo (hex) */
  background_color: string | null;
  /** Texto do botão quando há notificações não lidas */
  unread_badge_text: string | null;
  /** Mostrar avatar do remetente */
  show_sender_avatar: boolean;
  /** Mostrar timestamp */
  show_timestamp: boolean;
  /** Formato de data */
  date_format: 'relative' | 'absolute' | 'both';
  /** Máximo de notificações exibidas */
  max_notifications: number;
  /** Texto quando não há notificações */
  empty_state_text: string | null;
  /** URL do logo customizado */
  custom_logo_url: string | null;
  /** CSS customizado */
  custom_css: string | null;
  /** Chave de embed para uso no frontend (pk_...) */
  embed_key: string;
  /** Domínios permitidos (CORS) */
  allowed_domains: string[];
  created_at: string;
  updated_at: string;
}

// ── Update Params ──────────────────────────────────

export interface UpdateInboxEmbedSettingsParams {
  enabled?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  title?: string;
  primary_color?: string;
  background_color?: string;
  unread_badge_text?: string;
  show_sender_avatar?: boolean;
  show_timestamp?: boolean;
  date_format?: 'relative' | 'absolute' | 'both';
  max_notifications?: number;
  empty_state_text?: string;
  custom_logo_url?: string;
  custom_css?: string;
  allowed_domains?: string[];
}

// ── Key Rotation ───────────────────────────────────

export interface RotateEmbedKeyResult {
  /** Nova chave de embed gerada */
  embed_key: string;
  /** Data de expiração da chave antiga (grace period) */
  old_key_expires_at: string;
}
