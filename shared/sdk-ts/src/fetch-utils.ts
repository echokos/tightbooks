import { Fetcher } from 'openapi-typescript-fetch';
import type { paths } from './schema';

export type ApiFetcher = ReturnType<typeof Fetcher.for<paths>>;

export interface CreateApiFetcherConfig {
  baseUrl?: string;
  init?: RequestInit;
}

/**
 * Creates and configures an ApiFetcher for use with sdk-ts fetch functions.
 * Call this with baseUrl (e.g. '/api') and init.headers (Authorization, organization-id, etc.) from the app.
 */
export function createApiFetcher(config?: CreateApiFetcherConfig): ApiFetcher {
  const fetcher = Fetcher.for<paths>();
  fetcher.configure({
    baseUrl: config?.baseUrl ?? '',
    init: config?.init,
  });
  return fetcher;
}

/**
 * Strips leading slash from a path segment to avoid double slashes when joining with a base (e.g. `/api/` + path).
 */
export function normalizeApiPath(path: string): string {
  return (path || '').replace(/^\//, '');
}
