import { Fetcher } from 'openapi-typescript-fetch';
import type { paths } from './schema';
import { createCamelCaseMiddleware } from './middleware/camel-case-middleware';
import { createSnakeCaseRequestMiddleware } from './middleware/snake-case-request-middleware';

export type ApiFetcher = ReturnType<typeof Fetcher.for<paths>>;

export interface CreateApiFetcherConfig {
  baseUrl?: string;
  init?: RequestInit;
  /** Set to true to disable automatic snake_case to camelCase transformation on responses */
  disableCamelCaseTransform?: boolean;
  /** Set to true to disable automatic camelCase to snake_case transformation on requests */
  disableSnakeCaseTransform?: boolean;
}

/**
 * Creates and configures an ApiFetcher for use with sdk-ts fetch functions.
 * Call this with baseUrl (e.g. '/api') and init.headers (Authorization, organization-id, etc.) from the app.
 *
 * By default, all JSON response keys are automatically transformed from snake_case to camelCase.
 * Set disableCamelCaseTransform: true to disable this behavior.
 */
export function createApiFetcher(config?: CreateApiFetcherConfig): ApiFetcher {
  const parsedConfig = {
    baseUrl: '',
    disableCamelCaseTransform: true,
    disableSnakeCaseTransform: false,
    ...config,
  };
  const fetcher = Fetcher.for<paths>();
  fetcher.configure({
    baseUrl: parsedConfig.baseUrl,
    init: parsedConfig?.init,
    use: [
      ...(parsedConfig.disableSnakeCaseTransform ? [] : [createSnakeCaseRequestMiddleware()]),
      ...(parsedConfig.disableCamelCaseTransform ? [] : [createCamelCaseMiddleware()]),
    ],
  });
  return fetcher;
}

/**
 * Strips leading slash from a path segment to avoid double slashes when joining with a base (e.g. `/api/` + path).
 */
export function normalizeApiPath(path: string): string {
  return (path || '').replace(/^\//, '');
}

/**
 * Makes a raw API request using the fetcher's configuration (baseUrl, headers, middleware).
 * Use this for endpoints not defined in the OpenAPI schema.
 */
export async function rawRequest<T = unknown>(
  fetcher: ApiFetcher,
  method: string,
  path: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>
): Promise<T> {
  // Access the fetcher's internal configuration
  const fetcherConfig = (fetcher as unknown as { config?: { baseUrl: string; init?: RequestInit } }).config;
  const baseUrl = fetcherConfig?.baseUrl ?? '';
  const init = fetcherConfig?.init ?? {};

  const url = `${baseUrl}${path}`;
  const mergedHeaders: Record<string, string> = {
    'Accept': 'application/json',
    ...(init.headers as Record<string, string> || {}),
    ...(headers || {}),
  };

  const requestInit: RequestInit = {
    ...init,
    method,
    headers: mergedHeaders,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    mergedHeaders['Content-Type'] = 'application/json';
    requestInit.body = JSON.stringify(body);
  }

  const response = await fetch(url, requestInit);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}
