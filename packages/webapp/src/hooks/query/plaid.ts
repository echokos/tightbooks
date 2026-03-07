// @ts-nocheck
import { useMutation } from '@tanstack/react-query';
import useApiRequest from '../useRequest';

/**
 * Retrieves the plaid link token.
 */
export function useGetPlaidLinkToken(props = {}) {
  const apiRequest = useApiRequest();

  return useMutation({ mutationFn: () => apiRequest.post('banking/plaid/link-token', {}, {}),
          ...props,
    },
  );
}

/**
 * Retrieves the plaid link token.
 */
export function usePlaidExchangeToken(props = {}) {
  const apiRequest = useApiRequest();

  return useMutation({ mutationFn: (data) => apiRequest.post('banking/plaid/exchange-token', data, {}),
          ...props,
    },
  );
}
