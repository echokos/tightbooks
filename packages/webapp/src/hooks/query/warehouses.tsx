import {
  useQueryClient,
  useMutation,
  useQuery,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  Warehouse,
  WarehousesListResponse,
  CreateWarehouseBody,
  EditWarehouseBody,
} from '@bigcapital/sdk-ts';
import {
  fetchWarehouses,
  fetchWarehouse,
  createWarehouse,
  editWarehouse,
  deleteWarehouse,
  activateWarehouses,
  markWarehousePrimary,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import t from './types';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [t.WAREHOUSES] });
  queryClient.invalidateQueries({ queryKey: [t.WAREHOUSE] });
  queryClient.invalidateQueries({ queryKey: [t.WAREHOUSE_TRANSFERS] });
  queryClient.invalidateQueries({ queryKey: [t.DASHBOARD_META] });
};

/**
 * Create a new warehouse.
 */
export function useCreateWarehouse(
  props?: UseMutationOptions<void, Error, CreateWarehouseBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CreateWarehouseBody) =>
      createWarehouse(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

/**
 * Edits the given warehouse.
 */
export function useEditWarehouse(
  props?: UseMutationOptions<void, Error, [number, EditWarehouseBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, EditWarehouseBody]) =>
      editWarehouse(fetcher, String(id), values),
    onSuccess: (_data, [id]) => {
      queryClient.invalidateQueries({ queryKey: [t.WAREHOUSE, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Deletes the given warehouse.
 */
export function useDeleteWarehouse(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => deleteWarehouse(fetcher, String(id)),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [t.WAREHOUSE, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Retrieve warehouses list.
 */
export function useWarehouses(
  query?: Record<string, unknown>,
  props?: Omit<UseQueryOptions<WarehousesListResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.WAREHOUSES, query],
    queryFn: () => fetchWarehouses(fetcher),
    ...props,
  });
}

/**
 * Retrieve the warehouse details.
 */
export function useWarehouse(
  id: number | string | null | undefined,
  props?: Omit<UseQueryOptions<Warehouse>, 'queryKey' | 'queryFn'>,
  _requestProps?: Record<string, unknown>
) {
  const fetcher = useApiFetcher();
  const idStr = id != null ? String(id) : '';
  return useQuery({
    queryKey: [t.WAREHOUSE, id],
    queryFn: () => fetchWarehouse(fetcher, idStr),
    enabled: id != null && idStr !== '',
    ...props,
  });
}

/**
 * Activate the given warehouse.
 */
export function useActivateWarehouses(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (_id: number) => activateWarehouses(fetcher),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

/**
 * Mark the given warehouse as primary.
 */
export function useMarkWarehouseAsPrimary(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => markWarehousePrimary(fetcher, String(id)),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [t.WAREHOUSE, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}
