import { Fetcher } from 'openapi-typescript-fetch';
import type { paths } from './schema';

export type ApiFetcher = ReturnType<typeof Fetcher.for<paths>>;

/**
 * Strips leading slash from a path segment to avoid double slashes when joining with a base (e.g. `/api/` + path).
 */
export function normalizeApiPath(path: string): string {
  return (path || '').replace(/^\//, '');
}
