import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { uncategorizeTransactionsBulk } from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import { BANK_QUERY_KEY } from '@/constants/query-keys/banking';
import t from './types';

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
        queryKey: [t.CASHFLOW_ACCOUNT_UNCATEGORIZED_TRANSACTIONS_INFINITY],
      });
      queryClient.invalidateQueries({
        queryKey: [t.CASHFLOW_ACCOUNT_TRANSACTIONS_INFINITY],
      });
      queryClient.invalidateQueries({
        queryKey: [BANK_QUERY_KEY.BANK_ACCOUNT_SUMMARY_META],
      });
      queryClient.invalidateQueries({
        queryKey: [BANK_QUERY_KEY.RECOGNIZED_BANK_TRANSACTIONS_INFINITY],
      });
      queryClient.invalidateQueries({ queryKey: [t.ACCOUNT] });
    },
    ...options,
  });
}
