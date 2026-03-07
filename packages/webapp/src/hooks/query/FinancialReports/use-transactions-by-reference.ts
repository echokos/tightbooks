// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { fetchTransactionsByReferenceTable } from '@bigcapital/sdk-ts';
import { useReportsApiFetcher } from '../../useRequest';
import t from '../types';

/**
 * Retrieve transactions by reference report.
 */
export function useTransactionsByReference(query, props) {
  const fetcher = useReportsApiFetcher();
  const { defaultData, ...rest } = props ?? {};
  return useQuery({
    queryKey: [t.TRANSACTIONS_BY_REFERENCE, query],
    queryFn: () => fetchTransactionsByReferenceTable(fetcher, query ?? {}),
    placeholderData: defaultData ?? { transactions: [] },
    ...rest,
  });
}
