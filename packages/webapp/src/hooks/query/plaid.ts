import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { useApiFetcher } from '../useRequest';
import {
  fetchPlaidLinkToken,
  fetchPlaidExchangeToken,
  type PlaidLinkTokenResponse,
  type PlaidExchangeTokenBody,
} from '@bigcapital/sdk-ts';

/**
 * Retrieves the Plaid link token.
 */
export function useGetPlaidLinkToken(
  props?: UseMutationOptions<PlaidLinkTokenResponse, Error, void>
) {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: () => fetchPlaidLinkToken(fetcher),
    ...props,
  });
}

/**
 * Exchanges the Plaid public token for an access token.
 */
export function usePlaidExchangeToken(
  props?: UseMutationOptions<void, Error, PlaidExchangeTokenBody>
) {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (data: PlaidExchangeTokenBody) =>
      fetchPlaidExchangeToken(fetcher, data),
    ...props,
  });
}
