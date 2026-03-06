import type { QueryClient } from '@tanstack/react-query';
import {
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  AutofillCategorizeTransactionResponse,
  BankingAccountSummaryResponse,
  BankTransactionsListPage,
  CreateBankRuleBody,
  DisconnectBankAccountParams,
  EditBankRuleBody,
  ExcludeBankTransactionsBulkBody,
  MatchTransactionBody,
  MatchedTransactionsResponse,
  RefreshBankAccountParams,
  UnmatchMatchedTransactionParams,
} from '@bigcapital/sdk-ts';
import {
  fetchBankRules,
  fetchBankRule,
  createBankRule,
  editBankRule,
  deleteBankRule,
  disconnectBankAccount,
  refreshBankAccount,
  fetchMatchedTransactions,
  matchTransaction,
  unmatchMatchedTransaction,
  excludeBankTransaction,
  unexcludeBankTransaction,
  excludeBankTransactionsBulk,
  unexcludeBankTransactionsBulk,
  fetchRecognizedTransaction,
  fetchRecognizedTransactions,
  fetchExcludedBankTransactions,
  fetchPendingTransactions,
  fetchBankingAccountSummary,
  fetchAutofillCategorizeTransaction,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import { transformToCamelCase } from '@/utils';
import t from './types';
import { BANK_QUERY_KEY } from '@/constants/query-keys/banking';

/** @deprecated Use AutofillCategorizeTransactionResponse from @bigcapital/sdk-ts */
export type GetAutofillCategorizeTransaction = AutofillCategorizeTransactionResponse;

const commonInvalidateQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [BANK_QUERY_KEY.BANK_RULES] });
  queryClient.invalidateQueries({
    queryKey: [BANK_QUERY_KEY.RECOGNIZED_BANK_TRANSACTIONS_INFINITY],
  });
};

export function useCreateBankRule(
  options?: UseMutationOptions<unknown, Error, CreateBankRuleBody>
): UseMutationResult<unknown, Error, CreateBankRuleBody> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CreateBankRuleBody) => createBankRule(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...options,
  });
}

/** Mutation variables (UI uses bankAccountId; API path param is id). */
type DisconnectBankAccountValues = { bankAccountId: DisconnectBankAccountParams['id'] };

export function useDisconnectBankAccount(
  options?: UseMutationOptions<unknown, Error, DisconnectBankAccountValues>
): UseMutationResult<unknown, Error, DisconnectBankAccountValues> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ({ bankAccountId }: DisconnectBankAccountValues) =>
      disconnectBankAccount(fetcher, bankAccountId),
    onSuccess: (_data, values) => {
      queryClient.invalidateQueries({ queryKey: [t.ACCOUNT, values.bankAccountId] });
    },
    ...options,
  });
}

/** Mutation variables (UI uses bankAccountId; API path param is id). */
type UpdateBankAccountValues = { bankAccountId: RefreshBankAccountParams['id'] };

export function useUpdateBankAccount(
  options?: UseMutationOptions<unknown, Error, UpdateBankAccountValues>
): UseMutationResult<unknown, Error, UpdateBankAccountValues> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ({ bankAccountId }: UpdateBankAccountValues) =>
      refreshBankAccount(fetcher, bankAccountId),
    onSuccess: () => {},
    ...options,
  });
}

export function useEditBankRule(
  options?: UseMutationOptions<unknown, Error, { id: number; value: EditBankRuleBody }>
): UseMutationResult<unknown, Error, { id: number; value: EditBankRuleBody }> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ({ id, value }: { id: number; value: EditBankRuleBody }) =>
      editBankRule(fetcher, id, value),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...options,
  });
}

export function useDeleteBankRule(
  options?: UseMutationOptions<unknown, Error, number>
): UseMutationResult<unknown, Error, number> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => deleteBankRule(fetcher, id),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({
        queryKey: [BANK_QUERY_KEY.RECOGNIZED_BANK_TRANSACTIONS_INFINITY],
      });
      queryClient.invalidateQueries({
        queryKey: [t.CASHFLOW_ACCOUNT_UNCATEGORIZED_TRANSACTIONS_INFINITY],
      });
    },
    ...options,
  });
}

export function useBankRules(
  options?: UseQueryOptions<unknown, Error>
): UseQueryResult<unknown, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [BANK_QUERY_KEY.BANK_RULES],
    queryFn: () => fetchBankRules(fetcher),
    ...options,
  });
}

export function useBankRule(
  bankRuleId: number,
  options?: UseQueryOptions<unknown, Error>
): UseQueryResult<unknown, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [BANK_QUERY_KEY.BANK_RULES, bankRuleId],
    queryFn: () => fetchBankRule(fetcher, bankRuleId),
    ...options,
  });
}

export function useGetBankTransactionsMatches(
  uncategorizedTransactionIds: number[],
  options?: UseQueryOptions<MatchedTransactionsResponse, Error>
): UseQueryResult<MatchedTransactionsResponse, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [BANK_QUERY_KEY.BANK_TRANSACTION_MATCHES, uncategorizedTransactionIds],
    queryFn: () =>
      fetchMatchedTransactions(fetcher, uncategorizedTransactionIds).then((data) =>
        transformToCamelCase(data as unknown as Record<string, unknown>) as MatchedTransactionsResponse
      ),
    ...options,
  });
}

const onValidateExcludeUncategorizedTransaction = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({
    queryKey: [BANK_QUERY_KEY.EXCLUDED_BANK_TRANSACTIONS_INFINITY],
  });
  queryClient.invalidateQueries({
    queryKey: [t.CASHFLOW_ACCOUNT_UNCATEGORIZED_TRANSACTIONS_INFINITY],
  });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNTS] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNT] });
  queryClient.invalidateQueries({
    queryKey: [BANK_QUERY_KEY.BANK_ACCOUNT_SUMMARY_META],
  });
  queryClient.invalidateQueries({
    queryKey: [BANK_QUERY_KEY.RECOGNIZED_BANK_TRANSACTIONS_INFINITY],
  });
};

export function useExcludeUncategorizedTransaction(
  options?: UseMutationOptions<unknown, Error, number>
): UseMutationResult<unknown, Error, number> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (uncategorizedTransactionId: number) =>
      excludeBankTransaction(fetcher, uncategorizedTransactionId),
    onSuccess: () => onValidateExcludeUncategorizedTransaction(queryClient),
    ...options,
  });
}

export function useUnexcludeUncategorizedTransaction(
  options?: UseMutationOptions<unknown, Error, number>
): UseMutationResult<unknown, Error, number> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (uncategorizedTransactionId: number) =>
      unexcludeBankTransaction(fetcher, uncategorizedTransactionId),
    onSuccess: () => onValidateExcludeUncategorizedTransaction(queryClient),
    ...options,
  });
}

export function useExcludeUncategorizedTransactions(
  options?: UseMutationOptions<unknown, Error, ExcludeBankTransactionsBulkBody>
): UseMutationResult<unknown, Error, ExcludeBankTransactionsBulkBody> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (value: ExcludeBankTransactionsBulkBody) =>
      excludeBankTransactionsBulk(fetcher, value),
    onSuccess: () => onValidateExcludeUncategorizedTransaction(queryClient),
    ...options,
  });
}

export function useUnexcludeUncategorizedTransactions(
  options?: UseMutationOptions<unknown, Error, ExcludeBankTransactionsBulkBody>
): UseMutationResult<unknown, Error, ExcludeBankTransactionsBulkBody> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (value: ExcludeBankTransactionsBulkBody) =>
      unexcludeBankTransactionsBulk(fetcher, value),
    onSuccess: () => onValidateExcludeUncategorizedTransaction(queryClient),
    ...options,
  });
}

export function useMatchUncategorizedTransaction(
  props?: UseMutationOptions<unknown, Error, MatchTransactionBody>
): UseMutationResult<unknown, Error, MatchTransactionBody> {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (value: MatchTransactionBody) => matchTransaction(fetcher, value),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [t.CASHFLOW_ACCOUNT_UNCATEGORIZED_TRANSACTIONS_INFINITY],
      });
      queryClient.invalidateQueries({
        queryKey: [t.CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY],
      });
      queryClient.invalidateQueries({ queryKey: [t.ACCOUNTS] });
      queryClient.invalidateQueries({ queryKey: [t.ACCOUNT] });
      queryClient.invalidateQueries({
        queryKey: [BANK_QUERY_KEY.BANK_ACCOUNT_SUMMARY_META],
      });
    },
    ...props,
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
    mutationFn: ({ id }: UnmatchUncategorizedTransactionValues) =>
      unmatchMatchedTransaction(fetcher, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [t.CASHFLOW_ACCOUNT_UNCATEGORIZED_TRANSACTIONS_INFINITY],
      });
      queryClient.invalidateQueries({
        queryKey: [t.CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY],
      });
      queryClient.invalidateQueries({ queryKey: [t.ACCOUNTS] });
      queryClient.invalidateQueries({ queryKey: [t.ACCOUNT] });
      queryClient.invalidateQueries({
        queryKey: [BANK_QUERY_KEY.BANK_ACCOUNT_SUMMARY_META],
      });
    },
    ...props,
  });
}

export function useGetRecognizedBankTransaction(
  uncategorizedTransactionId: number,
  options?: UseQueryOptions<unknown, Error>
): UseQueryResult<unknown, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [
      BANK_QUERY_KEY.RECOGNIZED_BANK_TRANSACTION,
      uncategorizedTransactionId,
    ],
    queryFn: () =>
      fetchRecognizedTransaction(fetcher, uncategorizedTransactionId).then(
        (data: unknown) => transformToCamelCase(data as unknown as Record<string, unknown>)
      ),
    ...options,
  });
}

export function useGetBankAccountSummaryMeta(
  bankAccountId: number,
  options?: UseQueryOptions<BankingAccountSummaryResponse, Error>
): UseQueryResult<BankingAccountSummaryResponse, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [BANK_QUERY_KEY.BANK_ACCOUNT_SUMMARY_META, bankAccountId],
    queryFn: () =>
      fetchBankingAccountSummary(fetcher, bankAccountId).then(
        (data) =>
          transformToCamelCase(data as unknown as Record<string, unknown>) as BankingAccountSummaryResponse
      ),
    ...options,
  });
}

export function useGetAutofillCategorizeTransaction(
  uncategorizedTransactionIds: number[],
  options?: UseQueryOptions<AutofillCategorizeTransactionResponse, Error>
): UseQueryResult<AutofillCategorizeTransactionResponse, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [
      BANK_QUERY_KEY.AUTOFILL_CATEGORIZE_BANK_TRANSACTION,
      uncategorizedTransactionIds,
    ],
    queryFn: () =>
      fetchAutofillCategorizeTransaction(fetcher, uncategorizedTransactionIds).then(
        (data) =>
          transformToCamelCase(data as unknown as Record<string, unknown>) as AutofillCategorizeTransactionResponse
      ),
    ...options,
  });
}

export function useRecognizedBankTransactionsInfinity(
  query: Record<string, unknown>,
  infinityProps?: Record<string, unknown>
) {
  const fetcher = useApiFetcher();

  return useInfiniteQuery({
    queryKey: [BANK_QUERY_KEY.RECOGNIZED_BANK_TRANSACTIONS_INFINITY, query],
    initialPageParam: 1,
    queryFn: async ({
      pageParam = 1,
    }: {
      pageParam?: number;
    }): Promise<BankTransactionsListPage> => {
      return fetchRecognizedTransactions(fetcher, {
        page: pageParam,
        ...query,
      });
    },
    getPreviousPageParam: (firstPage: BankTransactionsListPage) =>
      firstPage.pagination.page - 1,
    getNextPageParam: (lastPage: BankTransactionsListPage) => {
      const { pagination } = lastPage;
      const pageSize = 'pageSize' in pagination ? (pagination as { pageSize: number }).pageSize : (pagination as { page_size: number }).page_size;
      return pagination.total > pageSize * pagination.page
        ? lastPage.pagination.page + 1
        : undefined;
    },
    ...infinityProps,
  });
}

export function useExcludedBankTransactionsInfinity(
  query: Record<string, unknown>,
  infinityProps?: Record<string, unknown>
) {
  const fetcher = useApiFetcher();

  return useInfiniteQuery({
    queryKey: [BANK_QUERY_KEY.EXCLUDED_BANK_TRANSACTIONS_INFINITY, query],
    initialPageParam: 1,
    queryFn: async ({
      pageParam = 1,
    }: {
      pageParam?: number;
    }): Promise<BankTransactionsListPage> => {
      return fetchExcludedBankTransactions(fetcher, {
        page: pageParam,
        ...query,
      });
    },
    getPreviousPageParam: (firstPage: BankTransactionsListPage) =>
      firstPage.pagination.page - 1,
    getNextPageParam: (lastPage: BankTransactionsListPage) => {
      const { pagination } = lastPage;
      const pageSize = 'pageSize' in pagination ? (pagination as { pageSize: number }).pageSize : (pagination as { page_size: number }).page_size;
      return pagination.total > pageSize * pagination.page
        ? lastPage.pagination.page + 1
        : undefined;
    },
    ...infinityProps,
  });
}

export function usePendingBankTransactionsInfinity(
  query: Record<string, unknown>,
  infinityProps?: Record<string, unknown>
) {
  const fetcher = useApiFetcher();

  return useInfiniteQuery({
    queryKey: [BANK_QUERY_KEY.PENDING_BANK_ACCOUNT_TRANSACTIONS_INFINITY, query],
    initialPageParam: 1,
    queryFn: async ({
      pageParam = 1,
    }: {
      pageParam?: number;
    }): Promise<BankTransactionsListPage> => {
      return fetchPendingTransactions(fetcher, {
        page: pageParam,
        ...query,
      });
    },
    getPreviousPageParam: (firstPage: BankTransactionsListPage) =>
      firstPage.pagination.page - 1,
    getNextPageParam: (lastPage: BankTransactionsListPage) => {
      const { pagination } = lastPage;
      const pageSize = 'pageSize' in pagination ? (pagination as { pageSize: number }).pageSize : (pagination as { page_size: number }).page_size;
      return pagination.total > pageSize * pagination.page
        ? lastPage.pagination.page + 1
        : undefined;
    },
    ...infinityProps,
  });
}
