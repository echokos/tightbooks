/**
 * tRPC Router Types
 * This file exports the types for the tRPC router that are shared between
 * the server and the webapp (frontend).
 *
 * Note: This file only contains TYPE definitions. It does not import any
 * runtime code from the server to avoid bundle bloat in the webapp.
 */

// We define the router type structure here to avoid importing the actual router
// from the server package, which would cause issues with bundling.

import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

// This is a placeholder type that will be replaced by the actual router type
// when the server builds and exports it.
// The webapp will import the actual type from the server package during development
// but will use the built type declaration during production.

export type AppRouter = any;

/**
 * Inference helpers for input types
 * @example type MyInput = RouterInputs['accounts']['getAccount']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example type MyOutput = RouterOutputs['accounts']['getAccount']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
