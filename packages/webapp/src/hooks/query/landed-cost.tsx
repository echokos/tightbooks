// @ts-nocheck
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { fetchLandedCostTransactions } from '@bigcapital/sdk-ts';
import useApiRequest from '../useRequest';
import { useApiFetcher } from '../useRequest';
import { useRequestQuery } from '../useQueryRequest';

import t from './types';

const commonInvalidateQueries = (queryClient) => {
  // Invalidate bills.
  queryClient.invalidateQueries({ queryKey: [t.BILLS] });
  queryClient.invalidateQueries({ queryKey: [t.BILL] });
  // Invalidate landed cost.
  queryClient.invalidateQueries({ queryKey: [t.LANDED_COST] });
  queryClient.invalidateQueries({ queryKey: [t.LANDED_COST_TRANSACTION] });
};

/**
 * Creates a new landed cost.
 */
export function useCreateLandedCost(props) {
  const queryClient = useQueryClient();
  const apiRequest = useApiRequest();

  return useMutation({ mutationFn: ([id, values]) =>
      apiRequest.post(`landed-cost/bills/${id}/allocate`, values),
          onSuccess: (res, id) => {
        // Common invalidate queries.
        commonInvalidateQueries(queryClient);
      },
      ...props,
    },
  );
}

/**
 * Deletes the given landed cost.
 */
export function useDeleteLandedCost(props) {
  const queryClient = useQueryClient();
  const apiRequest = useApiRequest();

  return useMutation({ mutationFn: (landedCostId) =>
      apiRequest.delete(`landed-cost/${landedCostId}`),
          onSuccess: (res, id) => {
        // Common invalidate queries.
        commonInvalidateQueries(queryClient);
      },
      ...props,
    },
  );
}

/**
 * Retrieve the landed cost transactions.
 */
export function useLandedCostTransaction(query, props) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.LANDED_COST, query],
    queryFn: () =>
      fetchLandedCostTransactions(fetcher, { transaction_type: query } as Record<string, unknown>),
    ...props,
  });
}

/**
 * Retrieve the bill located landed cost transactions.
 */
export function useBillLocatedLandedCost(id, props) {
  return useRequestQuery(
    [t.LANDED_COST_TRANSACTION, id],
    { method: 'get', url: `landed-cost/bills/${id}/transactions` },
    {
      select: (res) => res.data?.data,
      defaultData: [],
      ...props,
    },
  );
}
