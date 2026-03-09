// @ts-nocheck
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRequestQuery } from '../useQueryRequest';
import useApiRequest, { useApiFetcher } from '../useRequest';
import { fetchSubscriptions, getLemonCheckoutUrl } from '@bigcapital/sdk-ts';
import { useSetSubscriptions } from '../state/subscriptions';
import T from './types';

/**
 * Subscription payment via voucher.
 * Uses apiRequest because subscription/license/payment is not in OpenAPI schema.
 */
export const usePaymentByVoucher = (props) => {
  const apiRequest = useApiRequest();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values) => apiRequest.post('subscription/license/payment', values),
    onSuccess: () => {
      queryClient.invalidateQueries(T.SUBSCRIPTIONS);
      queryClient.invalidateQueries(T.ORGANIZATION_CURRENT);
      queryClient.invalidateQueries(T.ORGANIZATIONS);
    },
    ...props,
  });
};

/**
 * Fetches the organization subscriptions.
 */
export const useOrganizationSubscriptions = (props) => {
  const setSubscriptions = useSetSubscriptions();
  const fetcher = useApiFetcher();

  const state = useQuery({
    queryKey: [T.SUBSCRIPTIONS],
    queryFn: () => fetchSubscriptions(fetcher),
    ...props,
  });
  useEffect(() => {
    if (state.isSuccess && state.data) {
      const data = state.data as { subscriptions?: unknown[] };
      setSubscriptions(data?.subscriptions ?? []);
    }
  }, [state.isSuccess, state.data, setSubscriptions]);
  return state;
};

/**
 * Fetches the checkout url of the Lemon Squeezy.
 */
export const useGetLemonSqueezyCheckout = (props = {}) => {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values) => getLemonCheckoutUrl(fetcher, values),
    ...props,
  });
};
