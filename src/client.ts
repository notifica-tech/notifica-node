import type { PaginatedResponse, RequestOptions, SingleResponse } from './types/common.ts';
import { ApiError, NotificaError, RateLimitError, TimeoutError, ValidationError } from './errors.ts';

// ── Config ──────────────────────────────────────────

export interface NotificaClientConfig {
  /** API key (nk_live_..., nk_test_..., pk_live_..., pk_test_...) */
  apiKey: string;
  /** Base URL da API (default: https://app.usenotifica.com.br/v1) */
  baseUrl?: string;
  /** Timeout padrão em ms (default: 30000) */
  timeout?: number;
  /** Máximo de retries em 429/5xx (default: 3) */
  maxRetries?: number;
  /** Gerar idempotency key automaticamente para POSTs (default: true) */
  autoIdempotency?: boolean;
}

const DEFAULT_BASE_URL = 'https://app.usenotifica.com.br/v1';
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 3;

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

// ── Client ──────────────────────────────────────────

export class NotificaClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly autoIdempotency: boolean;

  constructor(config: NotificaClientConfig) {
    if (!config.apiKey) {
      throw new NotificaError(
        'API key é obrigatória. Passe via: new Notifica("nk_live_...")',
      );
    }

    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.autoIdempotency = config.autoIdempotency ?? true;
  }

  // ── Public methods ──────────────────────────────────

  async get<T>(path: string, query?: Record<string, unknown>, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, query, options);
  }

  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, undefined, options);
  }

  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, undefined, options);
  }

  async patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, body, undefined, options);
  }

  async delete<T = void>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, undefined, options);
  }

  // ── Pagination helpers ──────────────────────────────

  /**
   * Lista com paginação manual.
   * Retorna { data, meta } com cursor para próxima página.
   */
  async list<T>(path: string, query?: Record<string, unknown>, options?: RequestOptions): Promise<PaginatedResponse<T>> {
    return this.get<PaginatedResponse<T>>(path, query, options);
  }

  /**
   * Async iterator para auto-paginação.
   *
   * @example
   * ```ts
   * for await (const notification of client.paginate<Notification>('/notifications')) {
   *   console.log(notification.id);
   * }
   * ```
   */
  async *paginate<T>(path: string, query?: Record<string, unknown>): AsyncIterableIterator<T> {
    let cursor: string | undefined;

    do {
      const params = { ...query, ...(cursor ? { cursor } : {}) };
      const response = await this.list<T>(path, params);

      for (const item of response.data) {
        yield item;
      }

      cursor = response.meta.has_more && response.meta.cursor
        ? response.meta.cursor
        : undefined;
    } while (cursor);
  }

  /**
   * Wrapper para respostas { data: T }.
   */
  async getOne<T>(path: string, options?: RequestOptions): Promise<T> {
    const response = await this.get<SingleResponse<T>>(path, undefined, options);
    return response.data;
  }

  // ── Private methods ─────────────────────────────────

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<T> {
    const url = this.buildUrl(path, query);
    const headers = this.buildHeaders(method, options);
    const timeoutMs = options?.timeout ?? this.timeout;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        await this.backoff(attempt, lastError);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Chain external signal if provided
      if (options?.signal) {
        if (options.signal.aborted) {
          clearTimeout(timeoutId);
          throw new NotificaError('Request aborted');
        }
        options.signal.addEventListener('abort', () => controller.abort(), { once: true });
      }

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Success: 2xx
        if (response.ok) {
          // 204 No Content
          if (response.status === 204) {
            return undefined as T;
          }
          return await response.json() as T;
        }

        // Parse error body
        const errorBody = await this.safeParseJson(response);
        const requestId = response.headers.get('x-request-id');

        // Rate limit: maybe retry
        if (response.status === 429) {
          const retryAfter = this.parseRetryAfter(response);
          const error = new RateLimitError(
            errorBody?.error?.message ?? 'Rate limit exceeded',
            retryAfter,
            requestId,
          );

          if (attempt < this.maxRetries) {
            lastError = error;
            continue;
          }
          throw error;
        }

        // Server error: maybe retry
        if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < this.maxRetries) {
          lastError = new ApiError(
            errorBody?.error?.message ?? `Server error (${response.status})`,
            response.status,
            errorBody?.error?.code ?? 'server_error',
            errorBody?.error?.details ?? {},
            requestId,
          );
          continue;
        }

        // Validation error
        if (response.status === 422) {
          throw new ValidationError(
            errorBody?.error?.message ?? 'Validation failed',
            errorBody?.error?.details ?? {},
            requestId,
          );
        }

        // Other error (4xx, non-retryable)
        throw new ApiError(
          errorBody?.error?.message ?? `API error (${response.status})`,
          response.status,
          errorBody?.error?.code ?? 'api_error',
          errorBody?.error?.details ?? {},
          requestId,
        );

      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof NotificaError) {
          throw error;
        }

        // Abort = timeout
        if (error instanceof Error && error.name === 'AbortError') {
          if (attempt < this.maxRetries) {
            lastError = new TimeoutError(timeoutMs);
            continue;
          }
          throw new TimeoutError(timeoutMs);
        }

        // Network/fetch errors
        if (attempt < this.maxRetries) {
          lastError = error instanceof Error ? error : new Error(String(error));
          continue;
        }

        throw new NotificaError(
          `Request failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Should not reach here, but just in case
    throw lastError ?? new NotificaError('Request failed after max retries');
  }

  private buildUrl(path: string, query?: Record<string, unknown>): string {
    const url = new URL(`${this.baseUrl}${path}`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private buildHeaders(method: string, options?: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': '@notifica/node/0.1.0',
    };

    // Idempotency key for POST
    if (method === 'POST') {
      if (options?.idempotencyKey) {
        headers['Idempotency-Key'] = options.idempotencyKey;
      } else if (this.autoIdempotency) {
        headers['Idempotency-Key'] = this.generateIdempotencyKey();
      }
    }

    return headers;
  }

  private generateIdempotencyKey(): string {
    // Use crypto.randomUUID if available, otherwise fall back to timestamp + random
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  private async backoff(attempt: number, lastError?: Error): Promise<void> {
    let delayMs: number;

    // If we have a Retry-After from rate limiting, use that
    if (lastError instanceof RateLimitError && lastError.retryAfter !== null) {
      delayMs = lastError.retryAfter * 1000;
    } else {
      // Exponential backoff: 500ms, 1s, 2s (with jitter)
      const base = 500 * Math.pow(2, attempt - 1);
      const jitter = Math.random() * base * 0.5;
      delayMs = base + jitter;
    }

    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  private parseRetryAfter(response: Response): number | null {
    const header = response.headers.get('retry-after');
    if (!header) return null;

    const seconds = Number(header);
    if (!Number.isNaN(seconds)) return seconds;

    // Try parsing as HTTP date
    const date = Date.parse(header);
    if (!Number.isNaN(date)) {
      return Math.max(0, Math.ceil((date - Date.now()) / 1000));
    }

    return null;
  }

  private async safeParseJson(response: Response): Promise<{ error?: { code?: string; message?: string; details?: Record<string, string[]> } } | null> {
    try {
      return await response.json() as { error?: { code?: string; message?: string; details?: Record<string, string[]> } };
    } catch {
      return null;
    }
  }
}
