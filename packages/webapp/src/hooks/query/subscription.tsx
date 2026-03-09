import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { useApiFetcher } from '../useRequest';
import { transformToCamelCase } from '@/utils';
import type {
  SubscriptionsListResponse,
  ChangeSubscriptionPlanBody,
} from '@bigcapital/sdk-ts';
import {
  fetchSubscriptions,
  cancelSubscription,
  resumeSubscription,
  changeSubscriptionPlan,
} from '@bigcapital/sdk-ts';

const QueryKeys = {
  Subscriptions: 'GetSubscriptions',
};

/**
 * Cancels the main subscription of the current organization.
 */
export function useCancelMainSubscription(
  options?: UseMutationOptions<void, Error, void>
): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: () => cancelSubscription(fetcher),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.Subscriptions] });
    },
    ...options,
  });
}

/**
 * Resumes the main subscription of the current organization.
 */
export function useResumeMainSubscription(
  options?: UseMutationOptions<void, Error, void>
): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: () => resumeSubscription(fetcher),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.Subscriptions] });
    },
    ...options,
  });
}

/**
 * Changes the main subscription plan of the current organization.
 */
export function useChangeSubscriptionPlan(
  options?: UseMutationOptions<void, Error, ChangeSubscriptionPlanBody>
): UseMutationResult<void, Error, ChangeSubscriptionPlanBody> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: ChangeSubscriptionPlanBody) =>
      changeSubscriptionPlan(fetcher, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.Subscriptions] });
    },
    ...options,
  });
}

export type GetSubscriptionsResponse = {
  subscriptions?: unknown[];
  [key: string]: unknown;
};

/**
 * Fetches subscriptions for the current tenant.
 */
export function useGetSubscriptions(
  options?: UseQueryOptions<
    SubscriptionsListResponse,
    Error,
    GetSubscriptionsResponse
  >
): UseQueryResult<GetSubscriptionsResponse, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [QueryKeys.Subscriptions],
    queryFn: () => fetchSubscriptions(fetcher),
    select: (data) => transformToCamelCase(data) as GetSubscriptionsResponse,
    ...options,
  });
}
