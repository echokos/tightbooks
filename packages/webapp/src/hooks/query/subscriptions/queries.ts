// @ts-nocheck
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRequestQuery } from '../../useQueryRequest';
import useApiRequest, { useApiFetcher } from '../../useRequest';
import { fetchSubscriptions, getLemonCheckoutUrl } from '@bigcapital/sdk-ts';
import { subscriptionsKeys } from './query-keys';
import { organizationKeys } from '../organization/query-keys';
import { useSetSubscriptions } from '../../state/subscriptions';

/**
 * Subscription payment via voucher.
 * Uses apiRequest because subscription/license/payment is not in OpenAPI schema.
 */
export const usePaymentByVoucher = (props) => {
  const apiRequest = useApiRequest();
  const queryClient = useQueryClient();

  return useMutation({
    ...props,
    mutationFn: (values) => apiRequest.post('subscription/license/payment', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionsKeys.all() });
      queryClient.invalidateQueries({ queryKey: organizationKeys.current() });
      queryClient.invalidateQueries({ queryKey: organizationKeys.all() });
    },
  });
};

/**
 * Fetches the organization subscriptions.
 */
export const useOrganizationSubscriptions = (props) => {
  const setSubscriptions = useSetSubscriptions();
  const fetcher = useApiFetcher();

  const state = useQuery({
    ...props,
    queryKey: subscriptionsKeys.all(),
    queryFn: () => fetchSubscriptions(fetcher),
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
    ...props,
    mutationFn: (values) => getLemonCheckoutUrl(fetcher, values),
  });
};
