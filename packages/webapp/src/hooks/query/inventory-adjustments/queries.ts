// @ts-nocheck
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiFetcher } from '../../useRequest';
import {
  createQuickInventoryAdjustment,
  deleteInventoryAdjustment,
  publishInventoryAdjustment,
  fetchInventoryAdjustments,
  fetchInventoryAdjustment,
} from '@bigcapital/sdk-ts';
import { inventoryAdjustmentsKeys } from './query-keys';

const commonInvalidateQueries = (queryClient) => {
  // Invalidate inventory adjustments.
  queryClient.invalidateQueries({ queryKey: inventoryAdjustmentsKeys.all() });
};

/**
 * Creates the inventory adjustment to the given item.
 */
export function useCreateInventoryAdjustment(props) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (values) => createQuickInventoryAdjustment(fetcher, values),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
    },
  });
}

/**
 * Deletes the inventory adjustment transaction.
 */
export function useDeleteInventoryAdjustment(props) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (id) => deleteInventoryAdjustment(fetcher, id),
    onSuccess: (_res, id) => {
      commonInvalidateQueries(queryClient);
    },
  });
}

/**
 * Retrieve inventory adjustment list with pagination meta.
 * Uses useRequestQuery because list endpoint query params may not be in OpenAPI.
 */
export function useInventoryAdjustments(query, props) {
  const fetcher = useApiFetcher();
  return useQuery({
    ...props,
    queryKey: inventoryAdjustmentsKeys.list(query),
    queryFn: () => fetchInventoryAdjustments(fetcher, query),
  });
}

/**
 * Publishes the given inventory adjustment.
 */
export function usePublishInventoryAdjustment(props) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (id) => publishInventoryAdjustment(fetcher, id),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: inventoryAdjustmentsKeys.detail(id) });
      commonInvalidateQueries(queryClient);
    },
  });
}

/**
 * Retrieve the inventory adjustment details.
 * @param {number} id - inventory adjustment id.
 */
export function useInventoryAdjustment(id, props) {
  const fetcher = useApiFetcher();

  return useQuery({
    ...props,
    queryKey: inventoryAdjustmentsKeys.detail(id),
    queryFn: () => fetchInventoryAdjustment(fetcher, id),
    enabled: id != null,
  });
}
