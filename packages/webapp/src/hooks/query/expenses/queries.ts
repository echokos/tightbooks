import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  CreateExpenseBody,
  EditExpenseBody,
  Expense,
  ExpensesListQuery,
  ExpensesListResponse,
  BulkDeleteExpensesBody,
  ValidateBulkDeleteExpensesResponse,
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
import { useApiFetcher } from '../../useRequest';
import { transformToCamelCase } from '@/utils';
import { expensesKeys } from './query-keys';
import { accountsKeys } from '../accounts/query-keys';
import { customersKeys } from '../customers/query-keys';
import { vendorsKeys } from '../vendors/query-keys';
import { itemsKeys } from '../items/query-keys';
import { cashflowAccountsKeys } from '../cashflow-accounts/query-keys';

// Keys that don't have factory methods yet - keeping inline
const FINANCIAL_REPORT = 'FINANCIAL-REPORT';
const SETTING = 'SETTING';
const SETTING_RECEIPTS = 'SETTING_RECEIPTS';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  // Invalidate expenses.
  queryClient.invalidateQueries({ queryKey: expensesKeys.all() });

  // Invalidate customers.
  queryClient.invalidateQueries({ queryKey: customersKeys.all() });

  // Invalidate vendors.
  queryClient.invalidateQueries({ queryKey: vendorsKeys.all() });

  // Invalidate accounts.
  queryClient.invalidateQueries({ queryKey: accountsKeys.all() });

  // Invalidate items.
  queryClient.invalidateQueries({ queryKey: itemsKeys.all() });

  // Invalidate cashflow accounts.
  queryClient.invalidateQueries({ queryKey: cashflowAccountsKeys.transactions() });
  queryClient.invalidateQueries({ queryKey: cashflowAccountsKeys.transactionsInfinity() });

  // Invalidate settings.
  queryClient.invalidateQueries({ queryKey: [SETTING, SETTING_RECEIPTS] });

  // Invalidate financial reports.
  queryClient.invalidateQueries({ queryKey: [FINANCIAL_REPORT] });
};

/**
 * Creates a new expense.
 */
export function useCreateExpense(
  props?: UseMutationOptions<void, Error, CreateExpenseBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (values: CreateExpenseBody) =>
      createExpense(fetcher, values),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
    },
  });
}

/**
 * Edits the given expense.
 */
export function useEditExpense(
  props?: UseMutationOptions<void, Error, [number, EditExpenseBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: ([id, values]: [number, EditExpenseBody]) =>
      editExpense(fetcher, id, values),
    onSuccess: (_res, [id]) => {
      queryClient.invalidateQueries({ queryKey: expensesKeys.detail(id) });
      commonInvalidateQueries(queryClient);
    },
  });
}

/**
 * Deletes the given expense.
 */
export function useDeleteExpense(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (id: number) => deleteExpense(fetcher, id),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: expensesKeys.detail(id) });
      commonInvalidateQueries(queryClient);
    },
  });
}

/**
 * Publishes the given expense.
 */
export function usePublishExpense(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (id: number) => publishExpense(fetcher, id),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: expensesKeys.detail(id) });
      commonInvalidateQueries(queryClient);
    },
  });
}

/**
 * Bulk deletes expenses.
 */
export function useBulkDeleteExpenses(
  props?: UseMutationOptions<void, Error, BulkDeleteExpensesBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: ({
      ids,
      skipUndeletable = false,
    }: BulkDeleteExpensesBody) =>
      bulkDeleteExpenses(fetcher, { ids, skipUndeletable }),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
    },
  });
}

/**
 * Validates bulk delete expenses.
 */
export function useValidateBulkDeleteExpenses(
  props?: UseMutationOptions<
    ValidateBulkDeleteExpensesResponse,
    Error,
    number[]
  >
) {
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (ids: number[]) =>
      validateBulkDeleteExpenses(fetcher, { ids }).then((res) =>
        transformToCamelCase(res as unknown as Record<string, unknown>) as ValidateBulkDeleteExpensesResponse
      ),
  });
}

/**
 * Retrieves expenses list.
 */
export function useExpenses(
  query?: ExpensesListQuery | null,
  props?: Omit<UseQueryOptions<ExpensesListResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    ...props,
    queryKey: expensesKeys.list(query ?? undefined),
    queryFn: async () =>
      fetchExpenses(fetcher, query ?? {}),
  });
}

/**
 * Retrieves the expense details.
 */
export function useExpense(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<Expense>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    ...props,
    queryKey: expensesKeys.detail(id),
    queryFn: () => fetchExpense(fetcher, id!),
    enabled: id != null,
  });
}

/**
 * Refreshes the expenses list.
 */
export function useRefreshExpenses() {
  const queryClient = useQueryClient();

  return {
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: expensesKeys.all() });
    },
  };
}
