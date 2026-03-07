import {
  useQueryClient,
  useMutation,
  useQuery,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type { TransactionsLockingListResponse } from '@bigcapital/sdk-ts';
import {
  fetchTransactionsLocking,
  fetchTransactionsLockingByModule,
  lockTransactions,
  cancelLockTransactions,
  unlockPartialTransactions,
  cancelUnlockPartialTransactions,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import t from './types';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [t.TRANSACTION_LOCKING] });
  queryClient.invalidateQueries({ queryKey: [t.TRANSACTIONS_LOCKING] });
};

export function useCreateLockingTransactoin(
  props?: UseMutationOptions<void, Error, Record<string, unknown>>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: Record<string, unknown>) => lockTransactions(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useCancelLockingTransaction(
  props?: UseMutationOptions<void, Error, Record<string, unknown>>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      cancelLockTransactions(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useCreateUnlockingPartialTransactions(
  props?: UseMutationOptions<void, Error, Record<string, unknown>>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      unlockPartialTransactions(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useCancelUnlockingPartialTransactions(
  props?: UseMutationOptions<void, Error, Record<string, unknown>>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      cancelUnlockPartialTransactions(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useTransactionsLocking(
  query?: Record<string, unknown>,
  props?: Omit<UseQueryOptions<TransactionsLockingListResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.TRANSACTIONS_LOCKING, query],
    queryFn: () => fetchTransactionsLocking(fetcher),
    select: (data) => (Array.isArray(data) ? data : (data as { data?: unknown })?.data ?? data),
    ...props,
  });
}

export function useEditTransactionsLocking(
  query: string,
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.TRANSACTION_LOCKING, query],
    queryFn: () => fetchTransactionsLockingByModule(fetcher, query),
    enabled: !!query,
    ...props,
  });
}
