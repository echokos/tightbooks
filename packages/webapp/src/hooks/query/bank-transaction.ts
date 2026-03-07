import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { fetchPendingTransactions } from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import { BANK_QUERY_KEY } from '@/constants/query-keys/banking';

export type PendingBankAccountTransactionsResponse = Awaited<
  ReturnType<typeof fetchPendingTransactions>
>;

/**
 * Retrieve pending bank account transactions.
 */
export function usePendingBankAccountTransactions(
  options?: UseQueryOptions<PendingBankAccountTransactionsResponse, Error>,
): UseQueryResult<PendingBankAccountTransactionsResponse, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [BANK_QUERY_KEY.PENDING_BANK_ACCOUNT_TRANSACTIONS],
    queryFn: () => fetchPendingTransactions(fetcher),
    ...options,
  });
}
