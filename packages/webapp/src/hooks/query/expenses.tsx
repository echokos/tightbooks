import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ExpensesListResponse,
  Expense,
  CreateExpenseBody,
  EditExpenseBody,
  BulkDeleteExpensesBody,
} from '@bigcapital/sdk-ts';
import {
  fetchExpenses,
  fetchExpense,
  createExpense,
  editExpense,
  deleteExpense,
  publishExpense,
  bulkDeleteExpenses,
  validateBulkDeleteExpenses,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import { transformPagination } from '@/utils';
import t from './types';

const defaultPagination = {
  pageSize: 20,
  page: 0,
  pagesCount: 0,
};

// Common invalidate queries.
const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  // Invalidate expenses.
  queryClient.invalidateQueries({ queryKey: [t.EXPENSES] });

  // Invalidate accounts.
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNTS] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNT] });

  // Invalidate financial reports.
  queryClient.invalidateQueries({ queryKey: [t.FINANCIAL_REPORT] });

  // Invalidate the cashflow transactions.
  queryClient.invalidateQueries({ queryKey: [t.CASH_FLOW_TRANSACTIONS] });
  queryClient.invalidateQueries({ queryKey: [t.CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY] });

  // Invalidate landed cost.
  queryClient.invalidateQueries({ queryKey: [t.LANDED_COST] });
  queryClient.invalidateQueries({ queryKey: [t.LANDED_COST_TRANSACTION] });

  // Invalidate mutate base currency abilities.
  queryClient.invalidateQueries({ queryKey: [t.ORGANIZATION_MUTATE_BASE_CURRENCY_ABILITIES] });
};

function transformExpensesList(response: ExpensesListResponse) {
  const data = response as { expenses?: unknown[]; pagination?: unknown; filter_meta?: Record<string, unknown> };
  return {
    expenses: data?.expenses ?? [],
    pagination: transformPagination(data?.pagination ?? {}) as typeof defaultPagination,
    filterMeta: data?.filter_meta ?? {},
  };
}

/**
 * Retrieve the expenses list.
 */
export function useExpenses(
  query: Parameters<typeof fetchExpenses>[1],
  props?: Omit<Parameters<typeof useQuery>[0], 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.EXPENSES, query],
    queryFn: () => fetchExpenses(fetcher, query).then(transformExpensesList),
    ...props,
  });
}

/**
 * Retrieve the expense details.
 * @param id - Expense id.
 */
export function useExpense(
  id: number | undefined | null,
  props?: Omit<Parameters<typeof useQuery>[0], 'queryKey' | 'queryFn' | 'enabled'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.EXPENSE, id],
    queryFn: () => fetchExpense(fetcher, id as number),
    enabled: id != null,
    ...props,
  });
}

/**
 * Deletes the given expense.
 */
export function useDeleteExpense(
  props?: Parameters<typeof useMutation<void, Error, number>>[0]
) {
  const fetcher = useApiFetcher();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteExpense(fetcher, id),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: [t.EXPENSE, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Deletes multiple expenses in bulk.
 */
export function useBulkDeleteExpenses(
  props?: Parameters<typeof useMutation<void, Error, BulkDeleteExpensesBody>>[0]
) {
  const fetcher = useApiFetcher();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: BulkDeleteExpensesBody) => bulkDeleteExpenses(fetcher, body),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useValidateBulkDeleteExpenses(
  props?: Parameters<typeof useMutation<Awaited<ReturnType<typeof validateBulkDeleteExpenses>>, Error, number[]>>[0]
) {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (ids: number[]) =>
      validateBulkDeleteExpenses(fetcher, { ids }),
    ...props,
  });
}

/**
 * Edits the given expense.
 */
export function useEditExpense(
  props?: Parameters<typeof useMutation<void, Error, [number, EditExpenseBody]>>[0]
) {
  const fetcher = useApiFetcher();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ([id, values]: [number, EditExpenseBody]) =>
      editExpense(fetcher, id, values),
    onSuccess: (_res, [id]) => {
      queryClient.invalidateQueries({ queryKey: [t.EXPENSE, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Creates the new expense.
 */
export function useCreateExpense(
  props?: Parameters<typeof useMutation<void, Error, CreateExpenseBody>>[0]
) {
  const fetcher = useApiFetcher();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CreateExpenseBody) => createExpense(fetcher, values),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Publishes the given expense.
 */
export function usePublishExpense(
  props?: Parameters<typeof useMutation<void, Error, number>>[0]
) {
  const fetcher = useApiFetcher();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => publishExpense(fetcher, id),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: [t.EXPENSE, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useRefreshExpenses() {
  const queryClient = useQueryClient();

  return {
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: [t.EXPENSES] });
    },
  };
}
