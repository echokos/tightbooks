import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  Item,
  CreateItemBody,
  EditItemBody,
  BulkDeleteItemsBody,
  ValidateBulkDeleteItemsResponse,
  ItemsListResponse,
} from '@bigcapital/sdk-ts';
import {
  fetchItems,
  fetchItem,
  fetchItemInvoices,
  fetchItemBills,
  fetchItemEstimates,
  fetchItemReceipts,
  fetchItemWarehouses,
  fetchInventoryCostItems,
  createItem,
  editItem,
  deleteItem,
  inactivateItem,
  activateItem,
  validateBulkDeleteItems,
  bulkDeleteItems,
} from '@bigcapital/sdk-ts';
import type {
  GetInventoryItemsCostQuery,
  GetInventoryItemsCostResponse,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import { transformToCamelCase } from '@/utils';
import t from './types';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [t.ITEMS] });
  queryClient.invalidateQueries({ queryKey: [t.ITEMS_CATEGORIES] });
};

export function useCreateItem(
  props?: UseMutationOptions<void, Error, CreateItemBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CreateItemBody) => createItem(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useEditItem(
  props?: UseMutationOptions<void, Error, [number, EditItemBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, EditItemBody]) =>
      editItem(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      queryClient.invalidateQueries({ queryKey: [t.ITEM, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useDeleteItem(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => deleteItem(fetcher, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [t.ITEM, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useBulkDeleteItems(
  props?: UseMutationOptions<void, Error, { ids: number[]; skipUndeletable?: boolean }>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ({
      ids,
      skipUndeletable = false,
    }: {
      ids: number[];
      skipUndeletable?: boolean;
    }) => bulkDeleteItems(fetcher, { ids, skipUndeletable } as BulkDeleteItemsBody),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useValidateBulkDeleteItems(
  props?: UseMutationOptions<ValidateBulkDeleteItemsResponse, Error, number[]>
) {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (ids: number[]) =>
      validateBulkDeleteItems(fetcher, { ids, skipUndeletable: false } as BulkDeleteItemsBody).then(
        (res) => transformToCamelCase(res as Record<string, unknown>) as ValidateBulkDeleteItemsResponse
      ),
    ...props,
  });
}

export function useActivateItem(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => activateItem(fetcher, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [t.ITEM, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useInactivateItem(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => inactivateItem(fetcher, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [t.ITEM, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useItems(
  query?: Record<string, unknown>,
  props?: Omit<UseQueryOptions<ItemsListResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.ITEMS, query],
    queryFn: () =>
      (fetchItems as (f: ReturnType<typeof useApiFetcher>, q?: Record<string, unknown>) => Promise<ItemsListResponse>)(
        fetcher,
        query
      ),
    ...props,
  });
}

export function useRefreshItems() {
  const queryClient = useQueryClient();
  return {
    refresh: () => queryClient.invalidateQueries({ queryKey: [t.ITEMS] }),
  };
}

export function useItem(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<Item>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.ITEM, id],
    queryFn: () => fetchItem(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

export function useItemAssociatedInvoiceTransactions(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<unknown[]>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.ITEM_ASSOCIATED_WITH_INVOICES, id],
    queryFn: () => fetchItemInvoices(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

export function useItemAssociatedEstimateTransactions(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<unknown[]>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.ITEM_ASSOCIATED_WITH_ESTIMATES, id],
    queryFn: () => fetchItemEstimates(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

export function useItemAssociatedReceiptTransactions(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<unknown[]>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.ITEM_ASSOCIATED_WITH_RECEIPTS, id],
    queryFn: () => fetchItemReceipts(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

export function useItemAssociatedBillTransactions(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<unknown[]>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.ITEMS_ASSOCIATED_WITH_BILLS, id],
    queryFn: () => fetchItemBills(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

export function useItemWarehouseLocation(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<unknown[]>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.ITEM_WAREHOUSES_LOCATION, id],
    queryFn: () => fetchItemWarehouses(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

export function useItemInventoryCost(
  query?: GetInventoryItemsCostQuery,
  props?: Omit<UseQueryOptions<unknown[]>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.ITEM_INVENTORY_COST, query],
    queryFn: () =>
      fetchInventoryCostItems(fetcher, query ?? {}).then(
        (res: GetInventoryItemsCostResponse) => res.costs ?? []
      ),
    ...props,
  });
}
