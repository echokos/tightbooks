import { useMutation, useQueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useApiFetcher } from '../useRequest';
import t from './types';
import { BANK_QUERY_KEY } from '@/constants/query-keys/banking';
import { fetchBankingAccounts } from '@bigcapital/sdk-ts';
import {
  fetchBankingTransactions,
  getBankingTransaction,
  createBankingTransaction,
  deleteBankingTransaction,
  fetchUncategorizedTransactions,
  getUncategorizedTransaction,
  categorizeTransaction,
  uncategorizeTransaction,
  type GetBankingTransactionsQuery,
  type GetUncategorizedTransactionsQuery,
  type CreateBankingTransactionBody,
  type CategorizeTransactionBody,
} from '@bigcapital/sdk-ts';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [t.SETTING, t.SETTING_CASHFLOW] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNTS] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNT] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNT_TRANSACTION] });
  queryClient.invalidateQueries({ queryKey: [t.CASH_FLOW_ACCOUNTS] });
  queryClient.invalidateQueries({ queryKey: [t.CASH_FLOW_TRANSACTIONS] });
  queryClient.invalidateQueries({ queryKey: [t.CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY] });
  queryClient.invalidateQueries({ queryKey: [t.FINANCIAL_REPORT] });
  queryClient.invalidateQueries({ queryKey: [t.CASH_FLOW_TRANSACTION] });
  queryClient.invalidateQueries({ queryKey: [t.ORGANIZATION_MUTATE_BASE_CURRENCY_ABILITIES] });
};

/** Normalize hook query (snake_case) to API query (camelCase). */
function normalizeTransactionsQuery(
  accountId: number,
  page: number,
  query: Record<string, unknown> = {}
): GetBankingTransactionsQuery {
  return {
    page,
    pageSize: (query.page_size as number) ?? 50,
    accountId: (query.account_id as number) ?? accountId,
  };
}

/** Normalize hook query (snake_case) to API query (camelCase). */
function normalizeUncategorizedQuery(
  page: number,
  query: Record<string, unknown> = {}
): GetUncategorizedTransactionsQuery {
  const q: GetUncategorizedTransactionsQuery = {
    page,
    pageSize: (query.page_size as number) ?? 50,
  };
  if (query.min_date != null) q.minDate = query.min_date as string;
  if (query.max_date != null) q.maxDate = query.max_date as string;
  return q;
}

/**
 * Retrieve accounts list.
 */
export function useCashflowAccounts(query?: Record<string, unknown>, props?: object) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.CASH_FLOW_ACCOUNTS, query],
    queryFn: () => fetchBankingAccounts(fetcher),
    ...props,
  });
}

/**
 * Create Money in owner contribution.
 */
export function useCreateCashflowTransaction(props?: object) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CreateBankingTransactionBody) =>
      createBankingTransaction(fetcher, values),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ['BANK_TRANSACTION_MATCHES'] });
    },
    ...props,
  });
}

/**
 * Retrieve account transactions list.
 */
export function useCashflowTransaction(id: string | number | null | undefined, props?: object) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.CASH_FLOW_TRANSACTIONS, id],
    queryFn: () => getBankingTransaction(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

/**
 * Deletes the given cashflow transaction.
 */
export function useDeleteCashflowTransaction(props?: object) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: string | number) => deleteBankingTransaction(fetcher, id),
    onSuccess: (_res, _id) => {
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Retrieve account transactions with infinite scrolling.
 */
export function useAccountTransactionsInfinity(
  accountId: number,
  query: Record<string, unknown> = {},
  infinityProps?: object
) {
  const fetcher = useApiFetcher();

  type Page = { transactions?: unknown[]; pagination: { page: number; pageSize: number; total: number } };
  return useInfiniteQuery({
    queryKey: [t.CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY, accountId, query],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const apiQuery = normalizeTransactionsQuery(accountId, pageParam as number, query);
      const response = await fetchBankingTransactions(fetcher, apiQuery);
      return response as Page;
    },
    getPreviousPageParam: (firstPage: Page) => firstPage.pagination?.page - 1,
    getNextPageParam: (lastPage: Page) => {
      const { pagination } = lastPage;
      if (!pagination) return undefined;
      return pagination.total > pagination.pageSize * pagination.page
        ? pagination.page + 1
        : undefined;
    },
    ...infinityProps,
  });
}

/**
 * Retrieve uncategorized account transactions with infinite scrolling.
 */
export function useAccountUncategorizedTransactionsInfinity(
  accountId: number,
  query: Record<string, unknown> = {},
  infinityProps?: object
) {
  const fetcher = useApiFetcher();

  type UncategorizedPage = { data?: unknown[]; pagination: { page: number; pageSize: number; total: number } };
  return useInfiniteQuery({
    queryKey: [t.CASHFLOW_ACCOUNT_UNCATEGORIZED_TRANSACTIONS_INFINITY, accountId, query],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const apiQuery = normalizeUncategorizedQuery(pageParam as number, query);
      return fetchUncategorizedTransactions(fetcher, accountId, apiQuery);
    },
    getPreviousPageParam: (firstPage: UncategorizedPage) => firstPage.pagination?.page - 1,
    getNextPageParam: (lastPage: UncategorizedPage) => {
      const { pagination } = lastPage;
      if (!pagination) return undefined;
      return pagination.total > pagination.pageSize * pagination.page
        ? pagination.page + 1
        : undefined;
    },
    ...infinityProps,
  });
}

/**
 * Refresh cashflow accounts.
 */
export function useRefreshCashflowAccounts() {
  const queryClient = useQueryClient();
  return {
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: [t.CASH_FLOW_ACCOUNTS] });
    },
  };
}

/**
 * Refresh the cashflow account transactions.
 */
export function useRefreshCashflowTransactions() {
  const query = useQueryClient();
  return {
    refresh: (accountId: number) => {
      query.invalidateQueries({ queryKey: [t.CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY] });
      query.invalidateQueries({ queryKey: [t.CASHFLOW_ACCOUNT_UNCATEGORIZED_TRANSACTIONS_INFINITY] });
      query.invalidateQueries({ queryKey: [BANK_QUERY_KEY.RECOGNIZED_BANK_TRANSACTIONS_INFINITY] });
      query.invalidateQueries({ queryKey: [BANK_QUERY_KEY.EXCLUDED_BANK_TRANSACTIONS_INFINITY] });
      query.invalidateQueries({ queryKey: [BANK_QUERY_KEY.PENDING_BANK_ACCOUNT_TRANSACTIONS_INFINITY] });
      query.invalidateQueries({ queryKey: [BANK_QUERY_KEY.BANK_ACCOUNT_SUMMARY_META, accountId] });
      query.invalidateQueries({ queryKey: [t.ACCOUNT, accountId] });
    },
  };
}

/**
 * Retrieves specific uncategorized transaction.
 */
export function useUncategorizedTransaction(
  uncategorizedTransactionId: number | null | undefined,
  props?: object
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.CASHFLOW_UNCAATEGORIZED_TRANSACTION, uncategorizedTransactionId],
    queryFn: () => getUncategorizedTransaction(fetcher, uncategorizedTransactionId!),
    enabled: uncategorizedTransactionId != null,
    ...props,
  });
}

/**
 * Categorize the cashflow transaction.
 */
export function useCategorizeTransaction(props?: object) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CategorizeTransactionBody) => categorizeTransaction(fetcher, values),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.CASHFLOW_UNCAATEGORIZED_TRANSACTION] });
      queryClient.invalidateQueries({ queryKey: [t.CASHFLOW_ACCOUNT_UNCATEGORIZED_TRANSACTIONS_INFINITY] });
      queryClient.invalidateQueries({ queryKey: ['BANK_ACCOUNT_SUMMARY_META'] });
    },
    ...props,
  });
}

/**
 * Uncategorize the cashflow transaction.
 */
export function useUncategorizeTransaction(props?: object) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => uncategorizeTransaction(fetcher, id),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.CASHFLOW_UNCAATEGORIZED_TRANSACTION] });
      queryClient.invalidateQueries({ queryKey: [t.CASHFLOW_ACCOUNT_UNCATEGORIZED_TRANSACTIONS_INFINITY] });
      queryClient.invalidateQueries({ queryKey: ['BANK_ACCOUNT_SUMMARY_META'] });
    },
    ...props,
  });
}
