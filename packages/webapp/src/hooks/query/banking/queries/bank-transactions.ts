import type { QueryClient } from '@tanstack/react-query';
import {
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  ExcludeBankTransactionsBulkBody,
  MatchTransactionBody,
  MatchedTransactionsResponse,
  UnmatchMatchedTransactionParams,
} from '@bigcapital/sdk-ts';
import {
  excludeBankTransaction,
  excludeBankTransactionsBulk,
  fetchMatchedTransactions,
  matchTransaction,
  uncategorizeTransactionsBulk,
  unexcludeBankTransaction,
  unexcludeBankTransactionsBulk,
  unmatchMatchedTransaction,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../../../useRequest';
import { transformToCamelCase } from '@/utils';
import { bankingKeys } from '../query-keys';

export function useGetBankTransactionsMatches(
  uncategorizedTransactionIds: number[],
  options?: UseQueryOptions<MatchedTransactionsResponse, Error>
): UseQueryResult<MatchedTransactionsResponse, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    ...options,
    queryKey: bankingKeys.transactionMatches(uncategorizedTransactionIds),
    queryFn: () =>
      fetchMatchedTransactions(fetcher, uncategorizedTransactionIds).then((data) =>
        transformToCamelCase(data as unknown as Record<string, unknown>) as MatchedTransactionsResponse
      ),
  });
}

const onValidateExcludeUncategorizedTransaction = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({
    queryKey: bankingKeys.excludedTransactionsInfinity(),
  });
  queryClient.invalidateQueries({
    queryKey: bankingKeys.summaryMeta(),
  });
  queryClient.invalidateQueries({
    queryKey: bankingKeys.recognizedTransactionsInfinity(),
  });
};

export function useExcludeUncategorizedTransaction(
  options?: UseMutationOptions<unknown, Error, number>
): UseMutationResult<unknown, Error, number> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...options,
    mutationFn: (uncategorizedTransactionId: number) =>
      excludeBankTransaction(fetcher, uncategorizedTransactionId),
    onSuccess: () => onValidateExcludeUncategorizedTransaction(queryClient),
  });
}

export function useUnexcludeUncategorizedTransaction(
  options?: UseMutationOptions<unknown, Error, number>
): UseMutationResult<unknown, Error, number> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...options,
    mutationFn: (uncategorizedTransactionId: number) =>
      unexcludeBankTransaction(fetcher, uncategorizedTransactionId),
    onSuccess: () => onValidateExcludeUncategorizedTransaction(queryClient),
  });
}

export function useExcludeUncategorizedTransactions(
  options?: UseMutationOptions<unknown, Error, ExcludeBankTransactionsBulkBody>
): UseMutationResult<unknown, Error, ExcludeBankTransactionsBulkBody> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...options,
    mutationFn: (value: ExcludeBankTransactionsBulkBody) =>
      excludeBankTransactionsBulk(fetcher, value),
    onSuccess: () => onValidateExcludeUncategorizedTransaction(queryClient),
  });
}

export function useUnexcludeUncategorizedTransactions(
  options?: UseMutationOptions<unknown, Error, ExcludeBankTransactionsBulkBody>
): UseMutationResult<unknown, Error, ExcludeBankTransactionsBulkBody> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...options,
    mutationFn: (value: ExcludeBankTransactionsBulkBody) =>
      unexcludeBankTransactionsBulk(fetcher, value),
    onSuccess: () => onValidateExcludeUncategorizedTransaction(queryClient),
  });
}

export function useMatchUncategorizedTransaction(
  props?: UseMutationOptions<unknown, Error, MatchTransactionBody>
): UseMutationResult<unknown, Error, MatchTransactionBody> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (value: MatchTransactionBody) => matchTransaction(fetcher, value),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: bankingKeys.summaryMeta(),
      });
    },
  });
}

/** Mutation variables (UI uses id; API path param is uncategorizedTransactionId). */
type UnmatchUncategorizedTransactionValues = {
  id: UnmatchMatchedTransactionParams['uncategorizedTransactionId'];
};

export function useUnmatchMatchedUncategorizedTransaction(
  props?: UseMutationOptions<unknown, Error, UnmatchUncategorizedTransactionValues>
): UseMutationResult<unknown, Error, UnmatchUncategorizedTransactionValues> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: ({ id }: UnmatchUncategorizedTransactionValues) =>
      unmatchMatchedTransaction(fetcher, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: bankingKeys.summaryMeta(),
      });
    },
  });
}

export type UncategorizeTransactionsBulkValues = { ids: number[] };

/**
 * Uncategorize the given categorized bank transactions in bulk (via DELETE /api/banking/categorize/bulk).
 */
export function useUncategorizeTransactionsBulkAction(
  options?: UseMutationOptions<void, Error, UncategorizeTransactionsBulkValues>,
): UseMutationResult<void, Error, UncategorizeTransactionsBulkValues> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: UncategorizeTransactionsBulkValues) =>
      uncategorizeTransactionsBulk(fetcher, values.ids),
    onSuccess: (_res, _values) => {
      queryClient.invalidateQueries({
        queryKey: bankingKeys.summaryMeta(),
      });
      queryClient.invalidateQueries({
        queryKey: bankingKeys.recognizedTransactionsInfinity(),
      });
    },
    ...options,
  });
}
