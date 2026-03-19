import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { useApiFetcher } from '../../useRequest';
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
import { subscriptionKeys } from './query-keys';

export function useCancelMainSubscription(
  options?: UseMutationOptions<void, Error, void>
): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: () => cancelSubscription(fetcher),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all() });
    },
    ...options,
  });
}

export function useResumeMainSubscription(
  options?: UseMutationOptions<void, Error, void>
): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: () => resumeSubscription(fetcher),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all() });
    },
    ...options,
  });
}

export function useChangeSubscriptionPlan(
  options?: UseMutationOptions<void, Error, ChangeSubscriptionPlanBody>
): UseMutationResult<void, Error, ChangeSubscriptionPlanBody> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: ChangeSubscriptionPlanBody) =>
      changeSubscriptionPlan(fetcher, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all() });
    },
    ...options,
  });
}

export type GetSubscriptionsResponse = {
  subscriptions?: unknown[];
  [key: string]: unknown;
};

export function useGetSubscriptions(
  options?: UseQueryOptions<
    SubscriptionsListResponse,
    Error,
    GetSubscriptionsResponse
  >
): UseQueryResult<GetSubscriptionsResponse, Error> {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });

  return useQuery({
    queryKey: subscriptionKeys.list(),
    queryFn: () => fetchSubscriptions(fetcher),
    ...options,
  });
}