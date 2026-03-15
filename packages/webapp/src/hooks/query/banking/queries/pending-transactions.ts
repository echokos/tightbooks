import { useInfiniteQuery, UseQueryOptions, UseQueryResult, useQuery } from '@tanstack/react-query';
import { fetchPendingTransactions } from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../../../useRequest';
import { bankingKeys } from '../query-keys';

export type PendingBankAccountTransactionsResponse = Awaited<
  ReturnType<typeof fetchPendingTransactions>
>;

export function usePendingBankAccountTransactions(
  options?: UseQueryOptions<PendingBankAccountTransactionsResponse, Error>,
): UseQueryResult<PendingBankAccountTransactionsResponse, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: bankingKeys.pendingTransactions(),
    queryFn: () => fetchPendingTransactions(fetcher),
    ...options,
  });
}

export function usePendingBankTransactionsInfinity(
  query: Record<string, unknown>,
  infinityProps?: Record<string, unknown>
) {
  const fetcher = useApiFetcher();

  return useInfiniteQuery({
    ...infinityProps,
    queryKey: bankingKeys.pendingTransactionsInfinity(query),
    initialPageParam: 1,
    queryFn: async ({
      pageParam = 1,
    }: {
      pageParam?: number;
    }) => {
      return fetchPendingTransactions(fetcher, {
        page: pageParam,
        ...query,
      });
    },
    getPreviousPageParam: (firstPage: { pagination: { page: number } }) =>
      firstPage.pagination.page - 1,
    getNextPageParam: (lastPage: { pagination: { total: number; page: number; pageSize?: number; page_size?: number } }) => {
      const { pagination } = lastPage;
      const pageSize = 'pageSize' in pagination ? (pagination as { pageSize: number }).pageSize : (pagination as { page_size: number }).page_size;
      return pagination.total > pageSize * pagination.page
        ? lastPage.pagination.page + 1
        : undefined;
    },
  });
}
