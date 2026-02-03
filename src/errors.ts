/**
 * Classe base para todos os erros do SDK Notifica.
 */
export class NotificaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotificaError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Erro retornado pela API.
 * Contém status HTTP, código do erro, e request ID para debugging.
 */
export class ApiError extends NotificaError {
  /** HTTP status code */
  readonly status: number;
  /** Código do erro retornado pela API (ex: "validation_failed") */
  readonly code: string;
  /** Detalhes de validação por campo */
  readonly details: Record<string, string[]>;
  /** ID da request para suporte/debugging */
  readonly requestId: string | null;

  constructor(
    message: string,
    status: number,
    code: string,
    details: Record<string, string[]> = {},
    requestId: string | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

/**
 * Erro de validação (HTTP 422).
 */
export class ValidationError extends ApiError {
  constructor(
    message: string,
    details: Record<string, string[]> = {},
    requestId: string | null = null,
  ) {
    super(message, 422, 'validation_failed', details, requestId);
    this.name = 'ValidationError';
  }
}

/**
 * Rate limit excedido (HTTP 429).
 * Inclui o tempo para tentar novamente.
 */
export class RateLimitError extends ApiError {
  /** Segundos até poder tentar novamente */
  readonly retryAfter: number | null;

  constructor(
    message: string,
    retryAfter: number | null = null,
    requestId: string | null = null,
  ) {
    super(message, 429, 'rate_limit_exceeded', {}, requestId);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Timeout de conexão ou request.
 */
export class TimeoutError extends NotificaError {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}
