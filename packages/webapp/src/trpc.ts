import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { store } from '@/store/createStore';
import { tanstackQueryClient } from '@/hooks/query/base';

// Define the AppRouter type - this will be imported from the server package
// For now, we use any until the server exports the proper types
export type AppRouter = any;

export const trpc = createTRPCReact<AppRouter>();

export function getAuthHeaders() {
  const state = store.getState();
  const { token, organizationId } = state.authentication;
  const headers: Record<string, string> = {};

  if (token) {
    headers['x-access-token'] = token;
  }
  if (organizationId) {
    headers['organization-id'] = organizationId.toString();
  }
  headers['Accept-Language'] = 'en';

  return headers;
}

export const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: '/api/trpc',
      headers() {
        return getAuthHeaders();
      },
    }),
  ],
});

// Export the QueryClient for use in the TRPCProvider
export const queryClient = tanstackQueryClient;
