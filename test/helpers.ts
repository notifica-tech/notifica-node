/**
 * Shared test utilities for mocking fetch — zero dependencies.
 */

// ── Types ───────────────────────────────────────────

export interface MockResponse {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown | null;
}

export interface FetchMock {
  /** All captured requests, in order */
  requests: CapturedRequest[];
  /** Last captured request (shortcut) */
  lastRequest: () => CapturedRequest;
  /** Last parsed URL */
  lastUrl: () => URL;
  /** Restore original fetch */
  restore: () => void;
}

// ── Mock factory ────────────────────────────────────

const _originalFetch = globalThis.fetch;

/**
 * Replaces globalThis.fetch with a mock that returns the given response(s).
 *
 * If an array is passed, responses are returned in sequence.
 * After exhausting the array, the last response repeats.
 *
 * @example
 * ```ts
 * const mock = mockFetch({ status: 200, body: { data: [] } });
 * // ... call code that uses fetch ...
 * assert.equal(mock.requests.length, 1);
 * mock.restore();
 * ```
 */
export function mockFetch(responses: MockResponse | MockResponse[]): FetchMock {
  const responseList = Array.isArray(responses) ? [...responses] : [responses];
  const requests: CapturedRequest[] = [];
  let callIndex = 0;

  const fn = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const response = responseList[Math.min(callIndex, responseList.length - 1)];
    callIndex++;

    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    requests.push({
      url,
      method: init?.method ?? 'GET',
      headers: (init?.headers as Record<string, string>) ?? {},
      body: init?.body ? JSON.parse(init.body as string) : null,
    });

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      headers: new Headers(response.headers ?? {}),
      json: async () => response.body,
      text: async () => JSON.stringify(response.body),
    } as Response;
  };

  globalThis.fetch = fn;

  return {
    requests,
    lastRequest: () => requests[requests.length - 1],
    lastUrl: () => new URL(requests[requests.length - 1].url),
    restore: () => { globalThis.fetch = _originalFetch; },
  };
}

/**
 * Creates a fetch mock from a callback function.
 * Useful for response logic that depends on the request URL.
 */
export function mockFetchFn(
  handler: (url: string, init?: RequestInit) => MockResponse,
): FetchMock {
  const requests: CapturedRequest[] = [];

  const fn = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    requests.push({
      url,
      method: init?.method ?? 'GET',
      headers: (init?.headers as Record<string, string>) ?? {},
      body: init?.body ? JSON.parse(init.body as string) : null,
    });

    const response = handler(url, init);

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      headers: new Headers(response.headers ?? {}),
      json: async () => response.body,
      text: async () => JSON.stringify(response.body),
    } as Response;
  };

  globalThis.fetch = fn;

  return {
    requests,
    lastRequest: () => requests[requests.length - 1],
    lastUrl: () => new URL(requests[requests.length - 1].url),
    restore: () => { globalThis.fetch = _originalFetch; },
  };
}

// ── Notifica helpers ────────────────────────────────

import { Notifica } from '../src/index.ts';

/**
 * Create a Notifica client pre-configured for testing (no retries, fast timeout).
 */
export function createTestClient(overrides?: Record<string, unknown>): Notifica {
  return new Notifica({
    apiKey: 'nk_test_abc123',
    baseUrl: 'https://api.test.local/v1',
    maxRetries: 0,
    timeout: 5000,
    ...overrides,
  });
}

/** Wrap response data in standard API envelope */
export function envelope<T>(data: T): { data: T } {
  return { data };
}

/** Wrap response data in paginated API envelope */
export function paginatedEnvelope<T>(data: T[], cursor: string | null = null, hasMore = false) {
  return { data, meta: { cursor, has_more: hasMore } };
}
