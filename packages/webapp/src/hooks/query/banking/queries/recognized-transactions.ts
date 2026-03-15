import { useInfiniteQuery, useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { fetchExcludedBankTransactions, fetchRecognizedTransaction, fetchRecognizedTransactions } from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../../../useRequest';
import { transformToCamelCase } from '@/utils';
import { bankingKeys } from '../query-keys';

export function useGetRecognizedBankTransaction(
  uncategorizedTransactionId: number,
  options?: UseQueryOptions<unknown, Error>
): UseQueryResult<unknown, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    ...options,
    queryKey: bankingKeys.recognizedTransaction(uncategorizedTransactionId),
    queryFn: () =>
      fetchRecognizedTransaction(fetcher, uncategorizedTransactionId).then(
        (data: unknown) => transformToCamelCase(data as unknown as Record<string, unknown>)
      ),
  });
}

export function useRecognizedBankTransactionsInfinity(
  query: Record<string, unknown>,
  infinityProps?: Record<string, unknown>
) {
  const fetcher = useApiFetcher();

  return useInfiniteQuery({
    ...infinityProps,
    queryKey: bankingKeys.recognizedTransactionsInfinity(query),
    initialPageParam: 1,
    queryFn: async ({
      pageParam = 1,
    }: {
      pageParam?: number;
    }) => {
      return fetchRecognizedTransactions(fetcher, {
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

export function useExcludedBankTransactionsInfinity(
  query: Record<string, unknown>,
  infinityProps?: Record<string, unknown>
) {
  const fetcher = useApiFetcher();

  return useInfiniteQuery({
    ...infinityProps,
    queryKey: bankingKeys.excludedTransactionsInfinity(query),
    initialPageParam: 1,
    queryFn: async ({
      pageParam = 1,
    }: {
      pageParam?: number;
    }) => {
      return fetchExcludedBankTransactions(fetcher, {
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
