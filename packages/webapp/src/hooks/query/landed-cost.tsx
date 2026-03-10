// @ts-nocheck
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import {
  fetchLandedCostTransactions,
  allocateLandedCost,
  deleteAllocatedLandedCost,
  fetchBillLandedCostTransactions,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';

import t from './types';

const commonInvalidateQueries = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: [t.BILLS] });
  queryClient.invalidateQueries({ queryKey: [t.BILL] });
  queryClient.invalidateQueries({ queryKey: [t.LANDED_COST] });
  queryClient.invalidateQueries({ queryKey: [t.LANDED_COST_TRANSACTION] });
};

export function useCreateLandedCost(props) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]) => allocateLandedCost(fetcher, id, values),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useDeleteLandedCost(props) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (landedCostId) => deleteAllocatedLandedCost(fetcher, landedCostId),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useLandedCostTransaction(query, props) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.LANDED_COST, query],
    queryFn: () =>
      fetchLandedCostTransactions(fetcher, { transaction_type: query } as Record<string, unknown>),
    ...props,
  });
}

export function useBillLocatedLandedCost(id, props) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.LANDED_COST_TRANSACTION, id],
    queryFn: () => fetchBillLandedCostTransactions(fetcher, id),
    select: (data) => (data as { data?: unknown[] })?.data ?? [],
    enabled: id != null,
    ...props,
  });
}
