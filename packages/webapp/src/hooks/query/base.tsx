// @ts-nocheck
import { QueryClient } from '@tanstack/react-query';

// Query client config.
export const queryConfig = {
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 30000,
    },
  },
};

// Create a new QueryClient instance for tRPC
export const tanstackQueryClient = new QueryClient(queryConfig);
