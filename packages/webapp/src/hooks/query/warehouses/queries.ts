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
import { useApiFetcher } from '../../useRequest';
import { warehousesKeys } from './query-keys';
import { warehousesTransfersKeys } from '../warehouses-transfers/query-keys';

const DASHBOARD_META = 'DASHBOARD_META';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: warehousesKeys.all() });
  queryClient.invalidateQueries({ queryKey: warehousesTransfersKeys.all() });
  queryClient.invalidateQueries({ queryKey: [DASHBOARD_META] });
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
    ...props,
    mutationFn: (values: CreateWarehouseBody) =>
      createWarehouse(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
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
    ...props,
    mutationFn: ([id, values]: [number, EditWarehouseBody]) =>
      editWarehouse(fetcher, String(id), values),
    onSuccess: (_data, [id]) => {
      queryClient.invalidateQueries({ queryKey: warehousesKeys.detail(id) });
      commonInvalidateQueries(queryClient);
    },
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
    ...props,
    mutationFn: (id: number) => deleteWarehouse(fetcher, String(id)),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: warehousesKeys.detail(id) });
      commonInvalidateQueries(queryClient);
    },
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
    ...props,
    queryKey: warehousesKeys.list(query),
    queryFn: () => fetchWarehouses(fetcher),
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
    ...props,
    queryKey: warehousesKeys.detail(id),
    queryFn: () => fetchWarehouse(fetcher, idStr),
    enabled: id != null && idStr !== '',
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
    ...props,
    mutationFn: (_id: number) => activateWarehouses(fetcher),
    onSuccess: () => commonInvalidateQueries(queryClient),
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
    ...props,
    mutationFn: (id: number) => markWarehousePrimary(fetcher, String(id)),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: warehousesKeys.detail(id) });
      commonInvalidateQueries(queryClient);
    },
  });
}
