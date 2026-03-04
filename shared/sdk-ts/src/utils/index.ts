import { paths } from "../schema";

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

// Helpers: derive request/response types from schema paths (single source of truth).
// When a path exists in the schema we get the real types; otherwise a safe fallback.
export type OpForPath<P extends string, M extends HttpMethod> = P extends keyof paths
  ? paths[P] extends Record<M, infer O>
    ? O
    : never
  : never;

/** Query params for a GET (or other) operation. Use with OpForPath<Route, 'get'>. */
export type OpQueryParams<O> = O extends { parameters: { query?: infer Q } }
  ? (Q extends undefined ? Record<string, unknown> : NonNullable<Q>)
  : Record<string, unknown>;

export type OpRequestBody<O> = [O] extends [
  { requestBody: { content: { 'application/json': infer B } } },
]
  ? B
  : Record<string, unknown>;

export type OpResponseBody<O> = O extends {
  responses: { 200: { content: { 'application/json': infer R } } };
}
  ? R
  : O extends { responses: { 201: { content: { 'application/json': infer R } } } }
    ? R
    : unknown;
