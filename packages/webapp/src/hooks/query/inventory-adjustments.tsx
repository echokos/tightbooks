// @ts-nocheck
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRequestQuery } from '../useQueryRequest';
import { transformPagination } from '@/utils';
import { useApiFetcher } from '../useRequest';
import {
  createQuickInventoryAdjustment,
  deleteInventoryAdjustment,
  publishInventoryAdjustment,
  fetchInventoryAdjustment,
} from '@bigcapital/sdk-ts';
import t from './types';

const commonInvalidateQueries = (queryClient) => {
  // Invalidate inventory adjustments.
  queryClient.invalidateQueries({ queryKey: [t.INVENTORY_ADJUSTMENTS] });
  queryClient.invalidateQueries({ queryKey: [t.INVENTORY_ADJUSTMENT] });

  // Invalidate items.
  queryClient.invalidateQueries({ queryKey: [t.ITEMS] });
  queryClient.invalidateQueries({ queryKey: [t.ITEM] });

  // Invalidate accounts.
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNTS] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNT] });

  // Invalidate financial reports.
  queryClient.invalidateQueries({ queryKey: [t.FINANCIAL_REPORT] });

  // Invalidate mutate base currency abilities.
  queryClient.invalidateQueries({ queryKey: [t.ORGANIZATION_MUTATE_BASE_CURRENCY_ABILITIES] });
};

/**
 * Creates the inventory adjustment to the given item.
 */
export function useCreateInventoryAdjustment(props) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values) => createQuickInventoryAdjustment(fetcher, values),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Deletes the inventory adjustment transaction.
 */
export function useDeleteInventoryAdjustment(props) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id) => deleteInventoryAdjustment(fetcher, id),
    onSuccess: (_res, id) => {
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

const inventoryAdjustmentsTransformer = (response) => {
  return {
    inventoryAdjustments: response.data.data,
    pagination: transformPagination(response.data.pagination),
  };
};

/**
 * Retrieve inventory adjustment list with pagination meta.
 * Uses useRequestQuery because list endpoint query params may not be in OpenAPI.
 */
export function useInventoryAdjustments(query, props) {
  return useRequestQuery(
    ['inventory-adjustments', query],
    { url: 'inventory-adjustments', params: query },
    {
      select: inventoryAdjustmentsTransformer,
      defaultData: {
        transactions: [],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
          pagesCount: 0,
        },
      },
      ...props,
    },
  );
}

/**
 * Publishes the given inventory adjustment.
 */
export function usePublishInventoryAdjustment(props) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id) => publishInventoryAdjustment(fetcher, id),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: [t.INVENTORY_ADJUSTMENT, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Retrieve the inventory adjustment details.
 * @param {number} id - inventory adjustment id.
 */
export function useInventoryAdjustment(id, props) {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: [t.INVENTORY_ADJUSTMENT, id],
    queryFn: () => fetchInventoryAdjustment(fetcher, id),
    enabled: id != null,
    ...props,
  });
}
